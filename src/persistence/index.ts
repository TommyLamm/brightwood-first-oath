import type {
  CloudError,
  CloudPort,
  CloudReady,
  CloudSaveInput,
  ContentCatalog,
  LoadOutcome,
  Persistence,
  SaveData,
  SaveUpgradeRequired,
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

export const BRIGHTWOOD_GAME_ID = 'brightwood-first-oath';
export const LEGACY_GAME_ID = 'maplewood-swordsman';

export type PersistenceOptions = {
  gameId: string;
  /** Overrides Vite's build mode for isolated tests. */
  development?: boolean;
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

type LegacyCandidate = {
  raw: string;
  data: SaveData;
  formatVersion: number;
};

type LocalSaveValidation =
  | { ok: true; data: SaveData; formatVersion: number; repairMessage?: string }
  | { ok: false; status: 'loadError' | 'incompatible'; message: string; unreadable: boolean };

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
  legacyCandidate: LegacyCandidate | null;
  saveUpgrade: SaveUpgradeRequired | null;
  upgradeRaw: string | null;
  upgradeConfirmed: boolean;
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

function validateLocalSave(rawText: string, catalog: ContentCatalog): LocalSaveValidation {
  let envelope: unknown;
  try {
    envelope = JSON.parse(rawText) as unknown;
  } catch {
    return { ok: false, status: 'loadError', message: '本機存檔格式損壞；原始資料已保留。', unreadable: true };
  }
  if (!isRecord(envelope) || typeof envelope.formatVersion !== 'number'
    || !Number.isSafeInteger(envelope.formatVersion)) {
    return { ok: false, status: 'loadError', message: '本機存檔封套結構無效；原始資料已保留。', unreadable: true };
  }
  if (!isSupportedSaveFormat(envelope.formatVersion)) {
    return { ok: false, status: 'incompatible', message: '本機存檔版本不相容；原始資料已保留。', unreadable: false };
  }
  if (!hasExactKeys(envelope, ['formatVersion', 'data', 'savedAt']) || typeof envelope.savedAt !== 'string') {
    return { ok: false, status: 'loadError', message: '本機存檔封套結構無效；原始資料已保留。', unreadable: true };
  }
  const prepared = prepareSave(envelope.data, catalog);
  if (!prepared.ok) {
    return { ok: false, status: 'loadError', message: `${prepared.message} 原始資料已保留。`, unreadable: true };
  }
  return {
    ok: true,
    data: prepared.value.data,
    formatVersion: envelope.formatVersion,
    ...(prepared.value.repairMessage ? { repairMessage: prepared.value.repairMessage } : {}),
  };
}

function sameCloudContext(previous: CloudReady | null, current: CloudReady): boolean {
  if (!previous || previous.mode !== current.mode || previous.progressAvailable !== current.progressAvailable) return false;
  const before = [...previous.capabilities].sort();
  const after = [...current.capabilities].sort();
  return before.length === after.length && before.every((capability, index) => capability === after[index]);
}

export function createPersistence(options: PersistenceOptions): Persistence {
  const development = options.development ?? import.meta.env.DEV;
  const key = localSaveKeyForGame(options.gameId, development);
  const legacyKey = options.gameId === BRIGHTWOOD_GAME_ID
    ? localSaveKeyForGame(LEGACY_GAME_ID, development)
    : null;
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
    legacyCandidate: null,
    saveUpgrade: null,
    upgradeRaw: null,
    upgradeConfirmed: false,
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
    runtime.legacyCandidate = null;
    runtime.saveUpgrade = null;
    runtime.upgradeRaw = null;
    runtime.upgradeConfirmed = false;
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
      const message = errorMessage(error, '讀取本機存檔失敗。');
      setStatus('loadError', message);
      return { mode: 'memory', status: 'loadError', data: null, message };
    }
    if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
    if (rawText === null) {
      runtime.lastCheckpoint = null;
      if (legacyKey && runtime.cloudReady?.mode !== 'authenticated') {
        let legacyRaw: string | null;
        try {
          legacyRaw = options.storage.getItem(legacyKey);
        } catch (error) {
          runtime.mode = 'memory';
          runtime.initialized = false;
          const message = `檢查這台裝置保留的舊版進度失敗；沒有變更原有資料。${errorMessage(error, '')}`;
          setStatus('loadError', message);
          return { mode: 'memory', status: 'loadError', data: null, message };
        }
        if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
        if (legacyRaw !== null) {
          const candidate = validateLocalSave(legacyRaw, options.catalog);
          if (!candidate.ok) {
            runtime.mode = 'memory';
            runtime.initialized = false;
            runtime.unreadableLocal = false;
            const message = `找到這台裝置的舊版進度，但目前版本無法安全讀取：${candidate.message}`;
            setStatus('incompatible', message);
            return { mode: 'memory', status: 'incompatible', data: null, message };
          }
          runtime.legacyCandidate = {
            raw: legacyRaw,
            data: cloneSaveData(candidate.data),
            formatVersion: candidate.formatVersion,
          };
          runtime.initialized = true;
          const message = '找到這台裝置的舊版進度。選擇匯入後才會使用，原件會保留。';
          setStatus('ready', message);
          return {
            mode: 'local',
            status: 'ready',
            data: null,
            legacyImportAvailable: true,
            legacyImportMessage: message,
          };
        }
      }
      runtime.initialized = true;
      const message = '沒有既有本機存檔，可建立新角色。';
      setStatus('ready', message);
      return { mode: 'local', status: 'ready', data: null };
    }
    const validated = validateLocalSave(rawText, options.catalog);
    if (!validated.ok) {
      runtime.mode = 'memory';
      runtime.initialized = false;
      runtime.unreadableLocal = validated.unreadable;
      setStatus(validated.status, validated.message);
      return { mode: 'memory', status: validated.status, data: null, message: validated.message };
    }
    if (generation !== runtime.generation) return { mode: 'memory', status: runtime.status, data: null };
    runtime.lastCheckpoint = cloneSaveData(validated.data);
    runtime.initialized = true;
    const saveUpgrade = validated.formatVersion < SAVE_FORMAT_VERSION
      ? { formatVersion: validated.formatVersion, source: 'local' as const }
      : null;
    runtime.saveUpgrade = saveUpgrade;
    runtime.upgradeRaw = saveUpgrade ? rawText : null;
    const status = saveUpgrade ? 'upgradeRequired' : 'ready';
    const message = saveUpgrade
      ? `本機存檔為 format ${saveUpgrade.formatVersion}；首次寫入 format ${SAVE_FORMAT_VERSION} 前請選擇備份並升級，或暫不升級。`
      : validated.repairMessage ?? '本機存檔已載入。';
    setStatus(status, message);
    return { mode: 'local', status, data: validated.data, saveUpgrade };
  };

  const validateCloudRecord = (record: unknown): { data: SaveData; revision: number; formatVersion: number; repaired: boolean; repairMessage?: string } | null => {
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
      formatVersion: record.formatVersion,
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
    runtime.legacyCandidate = null;
    runtime.saveUpgrade = null;
    runtime.upgradeRaw = null;
    runtime.upgradeConfirmed = false;
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
      runtime.cloudReady = cloudReady
        ? { ...cloudReady, capabilities: [...cloudReady.capabilities] }
        : null;
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
          runtime.saveUpgrade = null;
          const status: SaveStatus = preview ? 'previewOnly' : 'ready';
          setStatus(status, preview ? '預覽連線成功；雲端進度為暫存診斷資料。' : '雲端沒有既有存檔，可建立新角色。');
          return { mode: preview ? 'preview' : 'cloud', status, data: null };
        }
        const loaded = validateCloudRecord(record);
        if (!loaded) throw new Error('雲端存檔結構無效。');
        runtime.revision = loaded.revision;
        runtime.lastCheckpoint = cloneSaveData(loaded.data);
        runtime.initialized = true;
        const saveUpgrade = loaded.formatVersion < SAVE_FORMAT_VERSION
          ? { formatVersion: loaded.formatVersion, source: preview ? 'preview' as const : 'cloud' as const }
          : null;
        runtime.saveUpgrade = saveUpgrade;
        const status: SaveStatus = saveUpgrade ? 'upgradeRequired' : preview ? 'previewOnly' : 'ready';
        const message = saveUpgrade
          ? `雲端存檔為 format ${saveUpgrade.formatVersion}；確認升級後會送出 format ${SAVE_FORMAT_VERSION}。平台若回覆格式不相容，會停止寫入。`
          : loaded.repairMessage ?? (preview ? '預覽存檔已載入。' : '雲端存檔已載入。');
        setStatus(status, message);
        return { mode: preview ? 'preview' : 'cloud', status, data: loaded.data, saveUpgrade };
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

  const importLegacySave = async (): Promise<LoadOutcome> => {
    const candidate = runtime.legacyCandidate;
    const storage = options.storage;
    if (runtime.disposed || !candidate || !legacyKey || !storage
      || !runtime.initialized || runtime.mode !== 'local' || runtime.status !== 'ready') {
      return { mode: runtime.mode ?? 'memory', status: runtime.status, data: null };
    }
    const generation = runtime.generation;
    const cancel = (status: SaveStatus, message: string): LoadOutcome => {
      runtime.legacyCandidate = null;
      runtime.initialized = false;
      runtime.mode = 'memory';
      runtime.unreadableLocal = false;
      stopWrites();
      setStatus(status, message);
      return { mode: 'memory', status, data: null, message };
    };

    const reloadAfterRace = (reason: 'target' | 'source-changed' | 'source-removed'): LoadOutcome => {
      const outcome = localOutcome(generation);
      if (generation !== runtime.generation || runtime.disposed) return outcome;

      if (outcome.legacyImportAvailable) {
        const message = '這台裝置的進度在確認期間有變動，這次匯入已取消。已重新讀取目前可匯入的舊版進度；如仍要匯入，請再次確認。';
        return {
          ...outcome,
          legacyImportMessage: `${message} ${outcome.legacyImportMessage ?? ''}`.trim(),
        };
      }

      const hasError = outcome.status === 'loadError' || outcome.status === 'incompatible' || outcome.status === 'unavailable';
      if (hasError) {
        const message = reason === 'target'
          ? '確認期間偵測到這台裝置已有存檔，這次舊版匯入已取消。'
          : '舊版進度在確認期間已改變，這次匯入已取消。';
        return { ...outcome, message: outcome.message ? `${message} ${outcome.message}` : message };
      }

      if (outcome.data) {
        return {
          ...outcome,
          legacyImportMessage: '這台裝置已有目前進度，這次舊版匯入已取消；已載入目前進度。',
        };
      }

      const message = reason === 'source-removed'
        ? '原先選取的舊版進度已消失，這次匯入已取消；本次沒有更改資料。'
        : reason === 'source-changed'
          ? '原先選取的舊版進度已改變或消失，這次匯入已取消；目前沒有可重新確認的舊版進度，本次沒有更改資料。'
          : '確認期間偵測到本機進度變動，這次匯入已取消；本次沒有更改資料。';
      return { ...outcome, legacyImportMessage: message };
    };

    if (options.cloud) {
      let currentCloudReady: CloudReady;
      try {
        currentCloudReady = await options.cloud.ready();
      } catch {
        if (generation !== runtime.generation || runtime.disposed) {
          return { mode: 'memory', status: runtime.status, data: null };
        }
        return cancel('loadError', '無法確認目前的登入狀態，已取消匯入；這次操作尚未寫入本機資料。');
      }
      if (generation !== runtime.generation || runtime.disposed) {
        return { mode: 'memory', status: runtime.status, data: null };
      }
      if (currentCloudReady.mode === 'authenticated' || currentCloudReady.mode === 'preview'
        || !sameCloudContext(runtime.cloudReady, currentCloudReady)) {
        runtime.cloudReady = { ...currentCloudReady, capabilities: [...currentCloudReady.capabilities] };
        return cancel('loadError', '登入狀態已改變，已取消匯入；這次操作尚未寫入本機資料。');
      }
    }

    if (generation !== runtime.generation || runtime.disposed) {
      return { mode: 'memory', status: runtime.status, data: null };
    }

    let currentTarget: string | null;
    let currentSource: string | null;
    try {
      currentTarget = storage.getItem(key);
      currentSource = storage.getItem(legacyKey);
    } catch (error) {
      return cancel('loadError', `確認這台裝置的進度時發生錯誤，已取消匯入；這次操作尚未寫入資料。${errorMessage(error, '')}`);
    }
    if (generation !== runtime.generation || runtime.disposed) {
      return { mode: 'memory', status: runtime.status, data: null };
    }
    if (currentTarget !== null || currentSource !== candidate.raw) {
      return reloadAfterRace(currentTarget !== null ? 'target' : currentSource === null ? 'source-removed' : 'source-changed');
    }

    const validated = validateLocalSave(currentSource, options.catalog);
    if (!validated.ok) return localOutcome(generation);

    try {
      // Recheck immediately before copying. localStorage does not provide cross-tab compare-and-swap.
      const preCopyTarget = storage.getItem(key);
      const preCopySource = preCopyTarget === null ? storage.getItem(legacyKey) : null;
      if (preCopyTarget !== null || preCopySource !== candidate.raw) {
        return reloadAfterRace(preCopyTarget !== null ? 'target' : preCopySource === null ? 'source-removed' : 'source-changed');
      }
      storage.setItem(key, candidate.raw);
      if (storage.getItem(key) !== candidate.raw || storage.getItem(legacyKey) !== candidate.raw) {
        return cancel('loadError', '匯入內容未能完整確認；已停止後續操作，請重新讀取這台裝置的進度。');
      }
    } catch (error) {
      return cancel('loadError', `匯入未能完成，請重新讀取這台裝置的進度。${errorMessage(error, '')}`);
    }
    if (generation !== runtime.generation || runtime.disposed) {
      return { mode: 'memory', status: runtime.status, data: null };
    }

    runtime.legacyCandidate = null;
    runtime.lastCheckpoint = cloneSaveData(validated.data);
    runtime.initialized = true;
    const saveUpgrade = validated.formatVersion < SAVE_FORMAT_VERSION
      ? { formatVersion: validated.formatVersion, source: 'local' as const }
      : null;
    runtime.saveUpgrade = saveUpgrade;
    runtime.upgradeRaw = saveUpgrade ? candidate.raw : null;
    const status = saveUpgrade ? 'upgradeRequired' : 'ready';
    const message = saveUpgrade
      ? `舊版進度已匯入；原件仍保留。首次寫入 format ${SAVE_FORMAT_VERSION} 前，請選擇備份並升級或暫不升級。`
      : validated.repairMessage
        ? `舊版進度已匯入並安全修復；原件仍保留。${validated.repairMessage}`
        : '舊版進度已匯入；原件仍保留。';
    setStatus(status, message);
    return { mode: 'local', status, data: validated.data, message, saveUpgrade };
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
      if (previousEnvelope.formatVersion < SAVE_FORMAT_VERSION) {
        runtime.mode = 'memory';
        runtime.initialized = false;
        stopWrites();
        setStatus('incompatible', `本機存檔已改為 format ${previousEnvelope.formatVersion}；請重新載入並明確確認升級，原始資料已保留。`);
        return;
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
      runtime.legacyCandidate = null;
      runtime.retryLocal = null;
      setStatus('localSaved');
    } catch (error) {
      if (generation !== runtime.generation) return;
      runtime.retryLocal = cloneSaveData(snapshot);
      setStatus('saveError', errorMessage(error, '寫入本機存檔失敗；可重試。'));
    }
  };

  const upgradeLocal = (): void => {
    const upgrade = runtime.saveUpgrade;
    const originalRaw = runtime.upgradeRaw;
    const storage = options.storage;
    const snapshot = runtime.lastCheckpoint;
    if (!upgrade || upgrade.source !== 'local' || originalRaw === null || !storage || !snapshot) {
      setStatus('saveError', '無法確認待升級的本機存檔；原始資料已保留，未寫入。');
      return;
    }

    const stopForChangedSource = (message: string): void => {
      runtime.mode = 'memory';
      runtime.initialized = false;
      runtime.upgradeConfirmed = false;
      stopWrites();
      setStatus('incompatible', message);
    };

    setStatus('saving', `正在備份 format ${upgrade.formatVersion} 並升級…`);
    let currentRaw: string | null;
    try {
      currentRaw = storage.getItem(key);
    } catch (error) {
      setStatus('saveError', `讀取本機存檔確認失敗；原始資料已保留，未升級。${errorMessage(error, '')}`);
      return;
    }
    if (currentRaw !== originalRaw) {
      stopForChangedSource('確認期間本機原始存檔已改變；未覆寫，請重新讀取後再選擇。');
      return;
    }

    const backupKey = `${key}:format${upgrade.formatVersion}-backup`;
    try {
      const existingBackup = storage.getItem(backupKey);
      if (existingBackup !== null && existingBackup !== originalRaw) {
        stopForChangedSource(`format ${upgrade.formatVersion} 備份鍵已有不同內容；原始存檔已保留，未升級。`);
        return;
      }
      if (existingBackup === null) storage.setItem(backupKey, originalRaw);
      if (storage.getItem(backupKey) !== originalRaw) {
        setStatus('saveError', `format ${upgrade.formatVersion} 備份未能讀回核對；原始存檔未覆寫，已停止寫入。`);
        return;
      }
    } catch (error) {
      setStatus('saveError', `format ${upgrade.formatVersion} 備份失敗；原始存檔未覆寫，已停止寫入。${errorMessage(error, '')}`);
      return;
    }

    const envelope = {
      formatVersion: SAVE_FORMAT_VERSION,
      data: cloneSaveData(snapshot),
      savedAt: new Date().toISOString(),
    };
    try {
      const serialized = JSON.stringify(envelope);
      if (serialized === undefined) throw new Error('本機存檔無法序列化。');
      storage.setItem(key, serialized);
      if (storage.getItem(key) !== serialized) throw new Error('新存檔未能讀回核對。');
      runtime.lastCheckpoint = cloneSaveData(snapshot);
      runtime.saveUpgrade = null;
      runtime.upgradeRaw = null;
      runtime.upgradeConfirmed = false;
      runtime.pending = null;
      runtime.retryLocal = null;
      setStatus('localSaved', `format ${SAVE_FORMAT_VERSION} 已保存；format ${upgrade.formatVersion} 原始內容仍保存在備份。`);
    } catch (error) {
      setStatus('saveError', `升級寫入未能確認；format ${upgrade.formatVersion} 原始備份已保留，停止後續寫入。${errorMessage(error, '')}`);
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
    if (runtime.saveUpgrade && !runtime.upgradeConfirmed) return;
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
      if (runtime.saveUpgrade && runtime.upgradeConfirmed && runtime.mode === 'cloud') {
        runtime.saveUpgrade = null;
        runtime.upgradeConfirmed = false;
      }
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
    if (runtime.saveUpgrade && !runtime.upgradeConfirmed) return;
    const prepared = prepareSave(data, options.catalog);
    if (!prepared.ok) {
      setStatus('saveError', prepared.message);
      return;
    }
    runtime.legacyCandidate = null;
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

  const confirmSaveUpgrade = (): void => {
    if (runtime.disposed || !runtime.initialized || !runtime.saveUpgrade) {
      setStatus('incompatible', '目前沒有可確認升級的舊格式存檔。');
      return;
    }
    if (runtime.status === 'incompatible' || runtime.status === 'conflict' || runtime.status === 'authLost') {
      setStatus(runtime.status, runtime.status === 'incompatible'
        ? '格式相容性檢查已拒絕升級；未降回舊格式寫入。'
        : '存檔狀態尚未解除；未執行升級。');
      return;
    }
    runtime.upgradeConfirmed = true;
    if (runtime.mode === 'local' && runtime.saveUpgrade.source === 'local') {
      upgradeLocal();
      return;
    }
    if ((runtime.mode === 'cloud' && runtime.saveUpgrade.source === 'cloud')
      || (runtime.mode === 'preview' && runtime.saveUpgrade.source === 'preview')) {
      if (!runtime.lastCheckpoint || !options.cloud) {
        setStatus('saveError', '無法確認目前的雲端存檔；未送出升級寫入。');
        return;
      }
      runtime.pending = { data: cloneSaveData(runtime.lastCheckpoint), important: true };
      runtime.retryRequested = false;
      pump();
      return;
    }
    setStatus('incompatible', '目前存檔來源與升級確認不符；未執行寫入。');
  };

  const retry = async (): Promise<void> => {
    if (runtime.disposed) return;
    if (runtime.status === 'loadError') {
      await initialize();
      return;
    }
    if (runtime.status !== 'saveError') return;
    if (runtime.saveUpgrade?.source === 'local' && runtime.upgradeConfirmed) {
      upgradeLocal();
      return;
    }
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
    runtime.legacyCandidate = null;
    runtime.saveUpgrade = null;
    runtime.upgradeRaw = null;
    runtime.upgradeConfirmed = false;
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

  return { initialize, importLegacySave, checkpoint, confirmSaveUpgrade, retry, invalidate, discardUnreadableLocalSave, dispose };
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
