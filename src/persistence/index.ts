import type {
  CloudError,
  CloudPort,
  CloudReady,
  CloudSaveInput,
  ContentCatalog,
  LoadOutcome,
  Persistence,
  SaveData,
  SaveStatus,
  StorageLike,
} from '../contracts/index.js';
import {
  cloneSaveData,
  measureSaveData,
  prepareSave,
  READABLE_SAVE_FORMATS,
  SAVE_FORMAT_VERSION,
  SAVE_WARNING_BYTES,
} from './validate.js';

const ORDINARY_INTERVAL_MS = 15_000;
const CLOUD_WINDOW_MS = 60_000;
const CLOUD_MAX_WRITES_PER_WINDOW = 60;

export type PersistenceOptions = {
  gameId: string;
  storage: StorageLike | null;
  cloud: CloudPort | null;
  catalog: ContentCatalog;
  onStatus?: (status: SaveStatus, message?: string) => void;
};

type Mode = 'local' | 'cloud' | 'preview' | 'memory';
type Snapshot = { data: SaveData; important: boolean };
type CloudAttempt = {
  data: SaveData;
  revision: number;
  requestId: string;
};

type Runtime = {
  generation: number;
  mode: Mode | null;
  cloudReady: CloudReady | null;
  revision: number;
  initialized: boolean;
  initializing: Promise<LoadOutcome> | null;
  disposed: boolean;
  busy: boolean;
  pending: Snapshot | null;
  retryAttempt: CloudAttempt | null;
  retryLocal: SaveData | null;
  lastCheckpoint: SaveData | null;
  lastWriteStartedAt: number;
  writeStarts: number[];
  timer: ReturnType<typeof setTimeout> | null;
  status: SaveStatus;
  retryRequested: boolean;
  /** The last local read found a save that exists but cannot be parsed or validated. */
  unreadableLocal: boolean;
};

export function localSaveKeyForGame(gameId: string, development = import.meta.env.DEV): string {
  const base = `${gameId}:save:v1`;
  return development ? `${base}:dev` : base;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function errorStatus(error: unknown): SaveStatus | null {
  if (!isRecord(error)) return null;
  const code = typeof error.code === 'number' ? error.code : null;
  const machineCode = typeof error.machineCode === 'string' ? error.machineCode : '';
  if (machineCode === 'SAVE_REVISION_CONFLICT' || (code === 409 && machineCode.length === 0)) return 'conflict';
  if (machineCode === 'REQUEST_ID_REUSED' || machineCode === 'SAVE_FORMAT_INCOMPATIBLE') return 'incompatible';
  if (code === 401 || code === 403 || machineCode === 'AUTH_REQUIRED' || machineCode === 'AUTH_LOST') return 'authLost';
  return null;
}

function isFullRecovery(player: SaveData['player'], catalog: ContentCatalog): boolean {
  const hpBonus = Object.values(player.equipment).reduce((sum, itemId) =>
    sum + (itemId === null ? 0 : catalog.rules.items[itemId]?.hpBonus ?? 0), 0);
  const maxHp = 80 + 20 * (player.level - 1) + 12 * (player.skillRanks.vitality ?? 0) + hpBonus;
  const maxMp = 40 + 2 * (player.level - 1);
  return player.hp === maxHp && player.mp === maxMp;
}

function isImportantChange(previous: SaveData | null, next: SaveData, catalog: ContentCatalog): boolean {
  if (!previous) return true;
  const a = previous.player;
  const b = next.player;
  const diedOrRevived = (a.hp > 0 && b.hp === 0) || (a.hp === 0 && b.hp > 0);
  const restoredToFull = (b.hp > a.hp || b.mp > a.mp) && isFullRecovery(b, catalog);
  return previous.location.mapId !== next.location.mapId
    || previous.location.spawnId !== next.location.spawnId
    || JSON.stringify(previous.visitedMaps) !== JSON.stringify(next.visitedMaps)
    || JSON.stringify(previous.quests) !== JSON.stringify(next.quests)
    || JSON.stringify(previous.flags) !== JSON.stringify(next.flags)
    || a.job !== b.job || a.level !== b.level
    || a.str !== b.str || a.dex !== b.dex || a.ap !== b.ap || a.sp !== b.sp
    || JSON.stringify(a.skillRanks) !== JSON.stringify(b.skillRanks)
    || JSON.stringify(a.bag) !== JSON.stringify(b.bag)
    || JSON.stringify(a.equipment) !== JSON.stringify(b.equipment)
    || diedOrRevived || restoredToFull;
}

function newRequestId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
  const random = cryptoApi?.getRandomValues
    ? Array.from(cryptoApi.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  return `save-${random}`;
}

function isValidRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isSupportedSaveFormat(value: unknown): value is typeof READABLE_SAVE_FORMATS[number] {
  return READABLE_SAVE_FORMATS.some((format) => format === value);
}

export function createPersistence(options: PersistenceOptions): Persistence {
  const key = localSaveKeyForGame(options.gameId);
  const runtime: Runtime = {
    generation: 0,
    mode: null,
    cloudReady: null,
    revision: 0,
    initialized: false,
    initializing: null,
    disposed: false,
    busy: false,
    pending: null,
    retryAttempt: null,
    retryLocal: null,
    lastCheckpoint: null,
    lastWriteStartedAt: 0,
    writeStarts: [],
    timer: null,
    status: 'unavailable',
    retryRequested: false,
    unreadableLocal: false,
  };

  const setStatus = (status: SaveStatus, message?: string): void => {
    if (runtime.disposed) return;
    runtime.status = status;
    try {
      options.onStatus?.(status, message);
    } catch {
      // A presentation callback must not interrupt persistence.
    }
  };

  const clearTimer = (): void => {
    if (runtime.timer !== null) clearTimeout(runtime.timer);
    runtime.timer = null;
  };

  const stopWrites = (): void => {
    clearTimer();
    runtime.pending = null;
    runtime.retryAttempt = null;
    runtime.retryLocal = null;
    runtime.retryRequested = false;
  };

  const localOutcome = (generation: number): LoadOutcome => {
    runtime.mode = 'local';
    runtime.unreadableLocal = false;
    if (!options.storage) {
      runtime.mode = 'memory';
      runtime.initialized = false;
      setStatus('unavailable', '尚未提供本機儲存介面。');
      return { mode: 'memory', status: 'unavailable', data: null };
    }
    let rawText: string | null;
    try {
      rawText = options.storage.getItem(key);
    } catch (error) {
      runtime.mode = 'memory';
      runtime.initialized = false;
      setStatus('loadError', errorMessage(error, '讀取本機存檔失敗。'));
      return { mode: 'memory', status: 'loadError', data: null };
    }
    if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
    if (rawText === null) {
      runtime.lastCheckpoint = null;
      runtime.initialized = true;
      setStatus('ready', '沒有既有本機存檔，可建立新角色。');
      return { mode: 'local', status: 'ready', data: null };
    }
    let envelope: unknown;
    try {
      envelope = JSON.parse(rawText) as unknown;
    } catch {
      runtime.mode = 'memory';
      runtime.initialized = false;
      runtime.unreadableLocal = true;
      setStatus('loadError', '本機存檔格式損壞；原始資料已保留。');
      return { mode: 'memory', status: 'loadError', data: null };
    }
    if (!isRecord(envelope) || typeof envelope.formatVersion !== 'number'
      || !Number.isSafeInteger(envelope.formatVersion)) {
      runtime.mode = 'memory';
      runtime.initialized = false;
      runtime.unreadableLocal = true;
      setStatus('loadError', '本機存檔封套結構無效；原始資料已保留。');
      return { mode: 'memory', status: 'loadError', data: null };
    }
    if (!isSupportedSaveFormat(envelope.formatVersion)) {
      runtime.mode = 'memory';
      runtime.initialized = false;
      setStatus('incompatible', '本機存檔版本不相容；原始資料已保留。');
      return { mode: 'memory', status: 'incompatible', data: null };
    }
    if (!hasExactKeys(envelope, ['formatVersion', 'data', 'savedAt']) || typeof envelope.savedAt !== 'string') {
      runtime.mode = 'memory';
      runtime.initialized = false;
      runtime.unreadableLocal = true;
      setStatus('loadError', '本機存檔封套結構無效；原始資料已保留。');
      return { mode: 'memory', status: 'loadError', data: null };
    }
    const prepared = prepareSave(envelope.data, options.catalog);
    if (!prepared.ok) {
      runtime.mode = 'memory';
      runtime.initialized = false;
      runtime.unreadableLocal = true;
      setStatus('loadError', `${prepared.message} 原始資料已保留。`);
      return { mode: 'memory', status: 'loadError', data: null };
    }
    if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
    runtime.lastCheckpoint = cloneSaveData(prepared.value.data);
    runtime.initialized = true;
    const message = prepared.value.repairMessage ?? '本機存檔已載入。';
    setStatus('ready', message);
    return { mode: 'local', status: 'ready', data: prepared.value.data };
  };

  const validateCloudRecord = (record: unknown): { data: SaveData; revision: number; repaired: boolean; repairMessage?: string } | null => {
    if (!isRecord(record) || !isValidRevision(record.revision)) throw new Error('雲端存檔 revision 無效。');
    if (!isSupportedSaveFormat(record.formatVersion)) {
      const error = new Error('雲端存檔格式版本不相容。') as CloudError;
      error.machineCode = 'SAVE_FORMAT_INCOMPATIBLE';
      throw error;
    }
    const prepared = prepareSave(record.data, options.catalog);
    if (!prepared.ok) throw new Error(prepared.message);
    return {
      data: prepared.value.data,
      revision: record.revision,
      repaired: prepared.value.repaired,
      repairMessage: prepared.value.repairMessage,
    };
  };

  const initialize = (): Promise<LoadOutcome> => {
    if (runtime.disposed) {
      return Promise.resolve({ mode: 'memory', status: 'unavailable', data: null });
    }
    if (runtime.initializing) return runtime.initializing;
    const generation = ++runtime.generation;
    stopWrites();
    runtime.busy = false;
    runtime.initialized = false;
    runtime.mode = null;
    runtime.cloudReady = null;
    runtime.retryAttempt = null;
    runtime.retryLocal = null;
    setStatus('loading');

    const run = async (): Promise<LoadOutcome> => {
      let cloudReady: CloudReady | null = null;
      try {
        if (options.cloud) cloudReady = await options.cloud.ready();
      } catch (error) {
        if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
        runtime.mode = 'memory';
        setStatus(errorStatus(error) ?? 'loadError', errorMessage(error, '雲端連線初始化失敗。'));
        return { mode: 'memory', status: runtime.status, data: null };
      }
      if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
      runtime.cloudReady = cloudReady;
      const preview = cloudReady?.mode === 'preview';
      const useCloud = Boolean(options.cloud && cloudReady
        && (preview || (cloudReady.mode === 'authenticated' && cloudReady.progressAvailable)));
      if (!useCloud) return localOutcome(generation);

      runtime.mode = preview ? 'preview' : 'cloud';
      try {
        const record = await options.cloud!.loadProgress();
        if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
        if (record === null) {
          runtime.revision = 0;
          runtime.lastCheckpoint = null;
          runtime.initialized = true;
          const status: SaveStatus = preview ? 'previewOnly' : 'ready';
          setStatus(status, preview ? '預覽連線成功；雲端進度為暫存診斷資料。' : '雲端沒有既有存檔，可建立新角色。');
          return { mode: preview ? 'preview' : 'cloud', status, data: null };
        }
        const loaded = validateCloudRecord(record);
        if (!loaded) throw new Error('雲端存檔結構無效。');
        runtime.revision = loaded.revision;
        runtime.lastCheckpoint = cloneSaveData(loaded.data);
        runtime.initialized = true;
        const status: SaveStatus = preview ? 'previewOnly' : 'ready';
        setStatus(status, loaded.repairMessage ?? (preview ? '預覽存檔已載入。' : '雲端存檔已載入。'));
        return { mode: preview ? 'preview' : 'cloud', status, data: loaded.data };
      } catch (error) {
        if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
        runtime.mode = 'memory';
        runtime.initialized = false;
        setStatus(errorStatus(error) ?? 'loadError', errorMessage(error, '讀取雲端存檔失敗；未建立初始雲端存檔。'));
        return { mode: 'memory', status: runtime.status, data: null };
      }
    };
    runtime.initializing = run().finally(() => {
      if (generation === runtime.generation) runtime.initializing = null;
    });
    return runtime.initializing;
  };

  const writeLocal = (snapshot: SaveData, generation: number): void => {
    if (!options.storage) {
      setStatus('unavailable', '尚未提供本機儲存介面。');
      return;
    }
    let previousRaw: string | null;
    try {
      previousRaw = options.storage.getItem(key);
    } catch (error) {
      runtime.retryLocal = cloneSaveData(snapshot);
      setStatus('saveError', errorMessage(error, '檢查本機原存檔失敗；原始資料已保留。'));
      return;
    }
    if (previousRaw !== null) {
      let previousEnvelope: unknown;
      try {
        previousEnvelope = JSON.parse(previousRaw) as unknown;
      } catch {
        runtime.mode = 'memory';
        runtime.initialized = false;
        stopWrites();
        setStatus('incompatible', '本機存檔已改變且無法解析；原始資料已保留，已停止寫入。');
        return;
      }
      if (!isRecord(previousEnvelope) || typeof previousEnvelope.formatVersion !== 'number'
        || !Number.isSafeInteger(previousEnvelope.formatVersion)
        || !isSupportedSaveFormat(previousEnvelope.formatVersion)
        || !hasExactKeys(previousEnvelope, ['formatVersion', 'data', 'savedAt'])
        || typeof previousEnvelope.savedAt !== 'string') {
        runtime.mode = 'memory';
        runtime.initialized = false;
        stopWrites();
        setStatus('incompatible', '本機存檔格式不相容；原始資料已保留，已停止寫入。');
        return;
      }
      const previousSave = prepareSave(previousEnvelope.data, options.catalog);
      if (!previousSave.ok) {
        runtime.mode = 'memory';
        runtime.initialized = false;
        stopWrites();
        setStatus('incompatible', `${previousSave.message} 原始資料已保留，已停止寫入。`);
        return;
      }
      if (previousEnvelope.formatVersion === 1 || previousEnvelope.formatVersion === 2) {
        const backupKey = `${key}:format${previousEnvelope.formatVersion}-backup`;
        try {
          const backupRaw = options.storage.getItem(backupKey);
          if (backupRaw !== null && backupRaw !== previousRaw) {
            runtime.mode = 'memory';
            runtime.initialized = false;
            stopWrites();
            setStatus('incompatible', `已有不同的 format ${previousEnvelope.formatVersion} 備份；原始資料已保留，已停止寫入。`);
            return;
          }
          if (backupRaw === null) options.storage.setItem(backupKey, previousRaw);
          if (options.storage.getItem(backupKey) !== previousRaw) {
            throw new Error(`format ${previousEnvelope.formatVersion} 備份未能完整確認。`);
          }
        } catch (error) {
          runtime.retryLocal = cloneSaveData(snapshot);
          setStatus('saveError', `format ${previousEnvelope.formatVersion} 備份失敗；原始存檔未覆寫。${errorMessage(error, '')}`);
          return;
        }
      }
    }
    const envelope = {
      formatVersion: SAVE_FORMAT_VERSION,
      data: cloneSaveData(snapshot),
      savedAt: new Date().toISOString(),
    };
    try {
      const serialized = JSON.stringify(envelope);
      if (serialized === undefined) throw new Error('本機存檔無法序列化。');
      options.storage.setItem(key, serialized);
      if (generation !== runtime.generation) return;
      runtime.lastCheckpoint = cloneSaveData(snapshot);
      runtime.retryLocal = null;
      setStatus('localSaved');
    } catch (error) {
      if (generation !== runtime.generation) return;
      runtime.retryLocal = cloneSaveData(snapshot);
      setStatus('saveError', errorMessage(error, '寫入本機存檔失敗；可重試。'));
    }
  };

  const trimWriteWindow = (now: number): void => {
    runtime.writeStarts = runtime.writeStarts.filter((startedAt) => now - startedAt < CLOUD_WINDOW_MS);
  };

  const schedulePump = (delayMs: number, generation: number): void => {
    clearTimer();
    runtime.timer = setTimeout(() => {
      runtime.timer = null;
      if (generation === runtime.generation) pump();
    }, delayMs);
  };

  const handleCloudFailure = (error: unknown, generation: number): void => {
    if (generation !== runtime.generation) return;
    const status = errorStatus(error);
    if (status) {
      stopWrites();
      setStatus(status, errorMessage(error, '雲端存檔無法繼續。'));
      return;
    }
    setStatus('saveError', errorMessage(error, '雲端存檔失敗；可使用同一請求重試。'));
  };

  const pump = (): void => {
    if (runtime.disposed || !runtime.initialized || runtime.busy || !runtime.mode) return;
    if (runtime.mode === 'memory') return;
    if (runtime.status === 'conflict' || runtime.status === 'incompatible' || runtime.status === 'authLost'
      || runtime.status === 'unavailable' || runtime.status === 'loadError') return;
    if (runtime.status === 'saveError' && !runtime.retryRequested) return;
    const generation = runtime.generation;

    if (runtime.retryAttempt && runtime.mode !== 'local') {
      if (!runtime.retryRequested) return;
      startCloud(runtime.retryAttempt, generation, true);
      return;
    }
    if (runtime.retryLocal && runtime.mode === 'local') {
      if (!runtime.retryRequested) return;
      runtime.retryRequested = false;
      const retrySnapshot = runtime.retryLocal;
      runtime.retryLocal = null;
      runtime.busy = true;
      setStatus('saving');
      queueMicrotask(() => {
        if (generation !== runtime.generation) return;
        writeLocal(retrySnapshot, generation);
        runtime.busy = false;
        pump();
      });
      return;
    }
    const pending = runtime.pending;
    if (!pending) return;
    if (runtime.mode === 'local') {
      runtime.pending = null;
      const now = Date.now();
      const wait = pending.important ? 0 : Math.max(0, ORDINARY_INTERVAL_MS - (now - runtime.lastWriteStartedAt));
      if (wait > 0) {
        runtime.pending = pending;
        schedulePump(wait, generation);
        return;
      }
      runtime.lastWriteStartedAt = now;
      runtime.busy = true;
      setStatus('saving');
      queueMicrotask(() => {
        if (generation !== runtime.generation) return;
        writeLocal(pending.data, generation);
        runtime.busy = false;
        pump();
      });
      return;
    }

    const now = Date.now();
    trimWriteWindow(now);
    const spacingWait = pending.important ? 0 : Math.max(0, ORDINARY_INTERVAL_MS - (now - runtime.lastWriteStartedAt));
    const rateWait = runtime.writeStarts.length >= CLOUD_MAX_WRITES_PER_WINDOW
      ? Math.max(0, CLOUD_WINDOW_MS - (now - runtime.writeStarts[0]!))
      : 0;
    const wait = Math.max(spacingWait, rateWait);
    if (wait > 0) {
      schedulePump(wait, generation);
      return;
    }
    runtime.pending = null;
    const attempt: CloudAttempt = {
      data: cloneSaveData(pending.data),
      revision: runtime.revision,
      requestId: newRequestId(),
    };
    runtime.retryAttempt = attempt;
    startCloud(attempt, generation, false);
  };

  const startCloud = (attempt: CloudAttempt, generation: number, retry: boolean): void => {
    if (!options.cloud || runtime.busy || generation !== runtime.generation) return;
    const now = Date.now();
    trimWriteWindow(now);
    if (runtime.writeStarts.length >= CLOUD_MAX_WRITES_PER_WINDOW) {
      schedulePump(Math.max(1, CLOUD_WINDOW_MS - (now - runtime.writeStarts[0]!)), generation);
      return;
    }
    runtime.busy = true;
    runtime.writeStarts.push(now);
    runtime.lastWriteStartedAt = now;
    if (retry) runtime.retryRequested = false;
    setStatus('saving');
    const input: CloudSaveInput = {
      data: cloneSaveData(attempt.data),
      revision: attempt.revision,
      formatVersion: SAVE_FORMAT_VERSION,
      requestId: attempt.requestId,
    };
    void Promise.resolve().then(() => options.cloud!.saveProgress(input)).then((saved) => {
      if (generation !== runtime.generation) return;
      runtime.busy = false;
      if (saved === null) {
        runtime.retryAttempt = null;
        runtime.pending = null;
        if (runtime.mode !== 'preview') runtime.initialized = false;
        setStatus(runtime.mode === 'preview' ? 'previewOnly' : 'unavailable',
          runtime.mode === 'preview' ? '預覽存檔為診斷用途，沒有正式帳號保存證據。' : '雲端保存不可用，未改存本機。');
        return;
      }
      if (saved.saved !== true || !isValidRevision(saved.revision)) {
        runtime.busy = false;
        handleCloudFailure(new Error('雲端回應未確認 saved:true 或 revision 無效。'), generation);
        return;
      }
      runtime.revision = saved.revision;
      runtime.retryAttempt = null;
      runtime.retryRequested = false;
      runtime.lastCheckpoint = cloneSaveData(attempt.data);
      setStatus(runtime.mode === 'preview' ? 'previewOnly' : 'saved',
        runtime.mode === 'preview' ? '預覽存檔完成，並非正式帳號保存。' : undefined);
      pump();
    }).catch((error: unknown) => {
      if (generation !== runtime.generation) return;
      runtime.busy = false;
      handleCloudFailure(error, generation);
    });
  };

  const checkpoint = (data: SaveData): void => {
    if (runtime.disposed || !runtime.initialized || !runtime.mode || runtime.mode === 'memory') return;
    const prepared = prepareSave(data, options.catalog);
    if (!prepared.ok) {
      setStatus('saveError', prepared.message);
      return;
    }
    const snapshot = cloneSaveData(prepared.value.data);
    const metrics = measureSaveData(snapshot);
    if (!metrics.error && metrics.bytes >= SAVE_WARNING_BYTES) {
      setStatus(runtime.status, `存檔已達 ${metrics.bytes} bytes，接近 64 KiB 上限。`);
    }
    const important = isImportantChange(runtime.lastCheckpoint, snapshot, options.catalog)
      || isImportantChange(runtime.pending?.data ?? null, snapshot, options.catalog);
    const existingImportant = runtime.pending?.important ?? false;
    runtime.pending = { data: snapshot, important: important || existingImportant };
    pump();
  };

  const retry = async (): Promise<void> => {
    if (runtime.disposed) return;
    if (runtime.status === 'loadError') {
      await initialize();
      return;
    }
    if (runtime.status !== 'saveError') return;
    if (runtime.mode === 'local' && runtime.retryLocal) {
      runtime.retryRequested = true;
      pump();
      return;
    }
    if (runtime.retryAttempt && runtime.mode && runtime.mode !== 'local') {
      runtime.retryRequested = true;
      pump();
      return;
    }
    if (runtime.pending) {
      runtime.retryRequested = true;
      pump();
    }
  };

  const invalidate = (): void => {
    runtime.generation += 1;
    stopWrites();
    runtime.busy = false;
    runtime.initialized = false;
    runtime.initializing = null;
    runtime.mode = null;
    runtime.cloudReady = null;
    runtime.retryAttempt = null;
    runtime.retryLocal = null;
    runtime.retryRequested = false;
    runtime.lastCheckpoint = null;
    runtime.status = 'unavailable';
  };

  const discardUnreadableLocalSave = (): boolean => {
    if (runtime.disposed || !runtime.unreadableLocal || !options.storage) return false;
    try {
      const rawText = options.storage.getItem(key);
      if (rawText !== null) {
        options.storage.setItem(`${key}:unreadable-backup`, rawText);
        options.storage.removeItem(key);
      }
    } catch {
      return false;
    }
    runtime.unreadableLocal = false;
    return true;
  };

  const dispose = (): void => {
    invalidate();
    runtime.disposed = true;
  };

  return { initialize, checkpoint, retry, invalidate, discardUnreadableLocalSave, dispose };
}

export { validateSave } from './validate.js';
export {
  cloneSaveData,
  measureSaveData,
  prepareSave,
  MAX_SAVE_BYTES,
  READABLE_SAVE_FORMATS,
  SAVE_FORMAT_VERSION,
  SAVE_WARNING_BYTES,
} from './validate.js';
