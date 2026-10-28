import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { CloudPort, CloudReady, SaveData, StorageLike } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createPlayer } from '../src/domain/progression/index.js';
import {
  BRIGHTWOOD_GAME_ID,
  createPersistence,
  LEGACY_GAME_ID,
  localSaveKeyForGame,
} from '../src/persistence/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

function makeSave(name = '舊旅人'): SaveData {
  return {
    player: { ...createPlayer(name, rulesCatalog) },
    quests: {},
    visitedMaps: ['camp'],
    location: { mapId: 'camp', spawnId: 'start' },
    flags: { bossDefeated: false, chapterComplete: false },
    settings: { masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.9, muted: false, bindings: {} },
  };
}

function rawSave(formatVersion: number, save = makeSave()): string {
  return JSON.stringify({ formatVersion, data: save, savedAt: '2025-01-01T00:00:00.000Z' });
}

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  readonly writes: Array<[string, string]> = [];

  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void {
    this.writes.push([key, value]);
    this.values.set(key, value);
  }
  removeItem(key: string): void { this.values.delete(key); }
}

class ReadbackMismatchStorage extends MemoryStorage {
  mismatchKey: string | null = null;

  override setItem(key: string, value: string): void {
    super.setItem(key, value);
    if (key === this.mismatchKey) this.values.set(key, `${value} `);
  }
}

class SetItemFailureStorage extends MemoryStorage {
  failureKey: string | null = null;

  override setItem(key: string, value: string): void {
    if (key === this.failureKey) throw new Error('Storage write failed');
    super.setItem(key, value);
  }
}

class RecheckRaceStorage extends MemoryStorage {
  canonicalKey: string;
  legacyKey: string;
  canonicalReads = 0;
  legacyReads = 0;
  raceCanonicalOnRead: number | null = null;
  canonicalRaceRaw: string | null = null;
  failCanonicalOnRead: number | null = null;
  raceLegacyOnRead: number | null = null;
  legacyRaceRaw: string | null = null;

  constructor(canonicalKey: string, legacyKey: string) {
    super();
    this.canonicalKey = canonicalKey;
    this.legacyKey = legacyKey;
  }

  override getItem(key: string): string | null {
    if (key === this.canonicalKey) {
      this.canonicalReads += 1;
      if (this.canonicalReads === this.raceCanonicalOnRead) {
        if (this.canonicalRaceRaw === null) this.values.delete(key);
        else this.values.set(key, this.canonicalRaceRaw);
      }
      if (this.canonicalReads === this.failCanonicalOnRead) throw new Error('Storage read failed');
    }
    if (key === this.legacyKey) {
      this.legacyReads += 1;
      if (this.legacyReads === this.raceLegacyOnRead) {
        if (this.legacyRaceRaw === null) this.values.delete(key);
        else this.values.set(key, this.legacyRaceRaw);
      }
    }
    return super.getItem(key);
  }
}

function cloudReady(mode: CloudReady['mode'], progressAvailable = false, capabilities: string[] = []): CloudReady {
  return { mode, progressAvailable, capabilities };
}

function createCloudPort(ready: () => Promise<CloudReady>): CloudPort {
  return {
    ready,
    loadProgress: vi.fn(async () => null),
    saveProgress: vi.fn(async () => null),
  };
}

function createLegacyStorage(raw: string, development = true): {
  storage: MemoryStorage;
  key: string;
  legacyKey: string;
} {
  const storage = new MemoryStorage();
  const key = localSaveKeyForGame(BRIGHTWOOD_GAME_ID, development);
  const legacyKey = localSaveKeyForGame(LEGACY_GAME_ID, development);
  storage.values.set(legacyKey, raw);
  return { storage, key, legacyKey };
}

const changingCloudContexts: Array<[string, CloudReady, CloudReady]> = [
  ['login mode', cloudReady('guest'), cloudReady('authenticated', true, ['progress'])],
  ['progress availability', cloudReady('guest'), cloudReady('guest', true)],
  ['capabilities', cloudReady('guest'), cloudReady('guest', false, ['progress'])],
];

async function flushWrites(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('production save namespace and explicit legacy import', () => {
  it('uses the manifest ID and keeps development/build keys isolated', async () => {
    const manifest = JSON.parse(readFileSync(new URL('../public/game.json', import.meta.url), 'utf8')) as { id: string };
    expect(BRIGHTWOOD_GAME_ID).toBe(manifest.id);
    expect(localSaveKeyForGame(BRIGHTWOOD_GAME_ID, false)).toBe('brightwood-first-oath:save:v1');
    expect(localSaveKeyForGame(BRIGHTWOOD_GAME_ID, true)).toBe('brightwood-first-oath:save:v1:dev');
    expect(localSaveKeyForGame(LEGACY_GAME_ID, false)).toBe('maplewood-swordsman:save:v1');
    expect(localSaveKeyForGame(LEGACY_GAME_ID, true)).toBe('maplewood-swordsman:save:v1:dev');

    const { storage, key } = createLegacyStorage(rawSave(4), true);
    const persistence = createPersistence({
      gameId: BRIGHTWOOD_GAME_ID,
      development: false,
      storage,
      cloud: null,
      catalog,
    });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'ready', data: null });
    expect(outcome.legacyImportAvailable).not.toBe(true);
    expect(storage.values.has(key)).toBe(false);
    expect(storage.writes).toHaveLength(0);
    persistence.dispose();

    const { storage: buildStorage, key: developmentKey } = createLegacyStorage(rawSave(4), false);
    const developmentPersistence = createPersistence({
      gameId: BRIGHTWOOD_GAME_ID,
      development: true,
      storage: buildStorage,
      cloud: null,
      catalog,
    });
    const developmentOutcome = await developmentPersistence.initialize();
    expect(developmentOutcome.legacyImportAvailable).not.toBe(true);
    expect(buildStorage.values.has(developmentKey)).toBe(false);
    expect(buildStorage.writes).toHaveLength(0);
    developmentPersistence.dispose();
  });

  it.each([1, 2, 3, 4])('copies a validated format-%i save only after a choice and preserves the source', async (formatVersion) => {
    const raw = rawSave(formatVersion);
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    const oldBackupKey = `${legacyKey}:format${formatVersion}-backup`;
    const oldBackup = `historical-backup-${formatVersion}`;
    storage.values.set(oldBackupKey, oldBackup);
    let status = '';
    const persistence = createPersistence({
      gameId: BRIGHTWOOD_GAME_ID,
      development: true,
      storage,
      cloud: null,
      catalog,
      onStatus: (next) => { status = next; },
    });

    const initial = await persistence.initialize();
    expect(initial).toMatchObject({ mode: 'local', status: 'ready', data: null, legacyImportAvailable: true });
    expect(initial.legacyImportMessage).toContain('這台裝置');
    expect(storage.values.has(key)).toBe(false);
    expect(storage.writes).toHaveLength(0);

    const imported = await persistence.importLegacySave?.();
    expect(imported?.data?.player.name).toBe('舊旅人');
    expect(imported).toMatchObject({
      mode: 'local',
      status: 'upgradeRequired',
      saveUpgrade: { formatVersion, source: 'local' },
    });
    expect(storage.values.get(key)).toBe(raw);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.values.get(oldBackupKey)).toBe(oldBackup);

    const updated = structuredClone(imported!.data!);
    updated.visitedMaps.push('town');
    persistence.checkpoint(updated);
    await flushWrites();
    expect(status).toBe('upgradeRequired');
    expect(storage.values.get(key)).toBe(raw);
    expect(storage.writes).toEqual([[key, raw]]);

    persistence.confirmSaveUpgrade();
    expect(status).toBe('localSaved');
    expect(storage.values.get(`${key}:format${formatVersion}-backup`)).toBe(raw);
    expect(JSON.parse(storage.values.get(key)!).formatVersion).toBe(5);
    expect(JSON.parse(storage.values.get(key)!).data).toEqual(imported!.data);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.values.get(oldBackupKey)).toBe(oldBackup);
    persistence.dispose();
  });

  it('uses an existing canonical save first and never falls back when it is invalid', async () => {
    const canonicalRaw = rawSave(4, makeSave('目前進度'));
    const oldRaw = rawSave(4, makeSave('舊進度'));
    const validStorage = new MemoryStorage();
    const key = localSaveKeyForGame(BRIGHTWOOD_GAME_ID, true);
    const legacyKey = localSaveKeyForGame(LEGACY_GAME_ID, true);
    validStorage.values.set(key, canonicalRaw);
    validStorage.values.set(legacyKey, oldRaw);
    const validPersistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage: validStorage, cloud: null, catalog });
    const validOutcome = await validPersistence.initialize();
    expect(validOutcome).toMatchObject({
      mode: 'local',
      status: 'upgradeRequired',
      saveUpgrade: { formatVersion: 4, source: 'local' },
    });
    expect(validOutcome.data?.player.name).toBe('目前進度');
    expect(validOutcome.legacyImportAvailable).not.toBe(true);
    expect(validStorage.values.get(key)).toBe(canonicalRaw);
    expect(validStorage.values.get(legacyKey)).toBe(oldRaw);
    expect(validStorage.writes).toHaveLength(0);
    validPersistence.dispose();

    const invalidStorage = new MemoryStorage();
    invalidStorage.values.set(key, '{broken canonical');
    invalidStorage.values.set(legacyKey, oldRaw);
    const invalidPersistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage: invalidStorage, cloud: null, catalog });
    const invalidOutcome = await invalidPersistence.initialize();
    expect(invalidOutcome.status).toBe('loadError');
    expect(invalidOutcome.legacyImportAvailable).not.toBe(true);
    expect(invalidStorage.values.get(key)).toBe('{broken canonical');
    expect(invalidStorage.values.get(legacyKey)).toBe(oldRaw);
    expect(invalidStorage.writes).toHaveLength(0);
    invalidPersistence.dispose();
  });

  it('does not offer malformed or incompatible legacy data as empty progress', async () => {
    const malformedStorage = createLegacyStorage('{broken old save');
    const malformed = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage: malformedStorage.storage, cloud: null, catalog });
    const malformedOutcome = await malformed.initialize();
    expect(malformedOutcome.status).toBe('incompatible');
    expect(malformedOutcome.message).toContain('無法安全讀取');
    expect(malformedOutcome.legacyImportAvailable).not.toBe(true);
    expect(malformedStorage.storage.values.get(malformedStorage.legacyKey)).toBe('{broken old save');
    expect(malformedStorage.storage.values.has(malformedStorage.key)).toBe(false);
    expect(malformedStorage.storage.writes).toHaveLength(0);
    malformed.dispose();

    const unknownMapSave = makeSave('未知地圖');
    unknownMapSave.location.mapId = 'not-in-the-current-catalog';
    const invalidCatalogStorage = createLegacyStorage(rawSave(4, unknownMapSave));
    const invalidCatalog = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage: invalidCatalogStorage.storage, cloud: null, catalog });
    const invalidCatalogOutcome = await invalidCatalog.initialize();
    expect(invalidCatalogOutcome.status).toBe('incompatible');
    expect(invalidCatalogOutcome.legacyImportAvailable).not.toBe(true);
    expect(invalidCatalogStorage.storage.values.has(invalidCatalogStorage.key)).toBe(false);
    expect(invalidCatalogStorage.storage.values.get(invalidCatalogStorage.legacyKey)).toContain('not-in-the-current-catalog');
    invalidCatalog.dispose();

    const unsupportedStorage = createLegacyStorage(rawSave(6));
    const unsupported = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage: unsupportedStorage.storage, cloud: null, catalog });
    const unsupportedOutcome = await unsupported.initialize();
    expect(unsupportedOutcome.status).toBe('incompatible');
    expect(unsupportedOutcome.legacyImportAvailable).not.toBe(true);
    expect(unsupportedStorage.storage.values.has(unsupportedStorage.key)).toBe(false);
    unsupported.dispose();
  });

  it.each(['standalone', 'guest'] as const)('offers and imports local progress in %s mode', async (mode) => {
    const raw = rawSave(4, makeSave(`${mode} progress`));
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    const cloud = createCloudPort(async () => cloudReady(mode));
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud, catalog });
    const initial = await persistence.initialize();
    expect(initial.legacyImportAvailable).toBe(true);
    expect(cloud.loadProgress).not.toHaveBeenCalled();

    const imported = await persistence.importLegacySave?.();
    expect(imported?.data?.player.name).toBe(`${mode} progress`);
    expect(imported?.status).toBe('upgradeRequired');
    expect(storage.values.get(key)).toBe(raw);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(cloud.loadProgress).not.toHaveBeenCalled();
    expect(cloud.saveProgress).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it.each(changingCloudContexts)('rechecks the cloud session and cancels if %s changes before import', async (_change, initialReady, nextReady) => {
    const raw = rawSave(4);
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    let readyCalls = 0;
    const cloud = createCloudPort(async () => {
      readyCalls += 1;
      return readyCalls === 1 ? initialReady : nextReady;
    });
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud, catalog });
    expect((await persistence.initialize()).legacyImportAvailable).toBe(true);

    const result = await persistence.importLegacySave?.();
    expect(result).toMatchObject({ mode: 'memory', status: 'loadError', data: null });
    expect(result?.message).toContain('登入狀態已改變');
    expect(storage.values.has(key)).toBe(false);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(cloud.saveProgress).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('does not import when authenticated mode is present even if cloud progress is unavailable', async () => {
    const raw = rawSave(4);
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    const cloud = createCloudPort(async () => cloudReady('authenticated', false, ['scoring']));
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud, catalog });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'ready', data: null });
    expect(outcome.legacyImportAvailable).not.toBe(true);
    expect(storage.values.has(key)).toBe(false);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(cloud.loadProgress).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('cancels if the persistence generation changes while rechecking cloud mode', async () => {
    const raw = rawSave(4);
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    let calls = 0;
    let resolveRefresh: (ready: CloudReady) => void = () => undefined;
    const cloud = createCloudPort(() => {
      calls += 1;
      if (calls === 1) return Promise.resolve(cloudReady('guest'));
      return new Promise<CloudReady>((resolve) => { resolveRefresh = resolve; });
    });
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud, catalog });
    expect((await persistence.initialize()).legacyImportAvailable).toBe(true);
    const importPromise = persistence.importLegacySave?.();
    persistence.invalidate();
    resolveRefresh(cloudReady('authenticated', true, ['progress']));
    const result = await importPromise;
    expect(result).toMatchObject({ mode: 'memory', status: 'unavailable', data: null });
    expect(storage.values.has(key)).toBe(false);
    expect(storage.values.get(legacyKey)).toBe(raw);
    persistence.dispose();
  });

  it('explains cancellation when the target appears or the selected source changes before copying', async () => {
    const raw = rawSave(4, makeSave('舊進度'));
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud: null, catalog });
    await persistence.initialize();
    const otherRaw = rawSave(4, makeSave('同時建立的新進度'));
    storage.values.set(key, otherRaw);
    const targetResult = await persistence.importLegacySave?.();
    expect(targetResult?.data?.player.name).toBe('同時建立的新進度');
    expect(targetResult?.status).toBe('upgradeRequired');
    expect(targetResult?.legacyImportMessage).toContain('這次舊版匯入已取消');
    expect(targetResult?.legacyImportMessage).toContain('已載入目前進度');
    expect(storage.values.get(key)).toBe(otherRaw);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.writes).toHaveLength(0);
    persistence.dispose();

    const changedSource = createLegacyStorage(raw);
    const secondPersistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage: changedSource.storage, cloud: null, catalog });
    await secondPersistence.initialize();
    const changedRaw = rawSave(4, makeSave('更新後的舊進度'));
    changedSource.storage.values.set(changedSource.legacyKey, changedRaw);
    const sourceResult = await secondPersistence.importLegacySave?.();
    expect(sourceResult?.legacyImportAvailable).toBe(true);
    expect(sourceResult?.data).toBeNull();
    expect(sourceResult?.legacyImportMessage).toContain('這次匯入已取消');
    expect(sourceResult?.legacyImportMessage).toContain('再次確認');
    expect(changedSource.storage.values.has(changedSource.key)).toBe(false);
    expect(changedSource.storage.values.get(changedSource.legacyKey)).toBe(changedRaw);
    expect(changedSource.storage.writes).toHaveLength(0);
    secondPersistence.dispose();
  });

  it('explains when the selected source disappears without claiming it remains', async () => {
    const raw = rawSave(4);
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud: null, catalog });
    await persistence.initialize();
    storage.removeItem(legacyKey);

    const result = await persistence.importLegacySave?.();

    expect(result).toMatchObject({ mode: 'local', status: 'ready', data: null });
    expect(result?.legacyImportAvailable).not.toBe(true);
    expect(result?.legacyImportMessage).toContain('舊版進度已消失');
    expect(result?.legacyImportMessage).toContain('本次沒有更改資料');
    expect(result?.legacyImportMessage).not.toContain('原件仍保留');
    expect(storage.values.has(key)).toBe(false);
    expect(storage.values.has(legacyKey)).toBe(false);
    expect(storage.writes).toHaveLength(0);
    persistence.dispose();
  });

  it('rechecks a competing target immediately before copying and loads it with a visible cancellation notice', async () => {
    const raw = rawSave(4, makeSave('舊進度'));
    const key = localSaveKeyForGame(BRIGHTWOOD_GAME_ID, true);
    const legacyKey = localSaveKeyForGame(LEGACY_GAME_ID, true);
    const storage = new RecheckRaceStorage(key, legacyKey);
    storage.values.set(legacyKey, raw);
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud: null, catalog });
    await persistence.initialize();
    const currentRaw = rawSave(4, makeSave('同時建立的新進度'));
    storage.raceCanonicalOnRead = 3;
    storage.canonicalRaceRaw = currentRaw;

    const result = await persistence.importLegacySave?.();

    expect(result).toMatchObject({ mode: 'local', status: 'upgradeRequired' });
    expect(result?.data?.player.name).toBe('同時建立的新進度');
    expect(result?.legacyImportMessage).toContain('這次舊版匯入已取消');
    expect(result?.legacyImportMessage).toContain('已載入目前進度');
    expect(storage.values.get(key)).toBe(currentRaw);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.writes).toHaveLength(0);
    persistence.dispose();
  });

  it.each([
    ['malformed', '{broken canonical', 'loadError', '格式損壞'],
    ['incompatible', rawSave(99), 'incompatible', '版本不相容'],
  ] as const)('keeps a %s canonical error visible when import is cancelled', async (_name, canonicalRaw, status, diagnostic) => {
    const raw = rawSave(4);
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud: null, catalog });
    await persistence.initialize();
    storage.values.set(key, canonicalRaw);

    const result = await persistence.importLegacySave?.();

    expect(result?.status).toBe(status);
    expect(result?.message).toContain('這次舊版匯入已取消');
    expect(result?.message).toContain(diagnostic);
    expect(storage.values.get(key)).toBe(canonicalRaw);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.writes).toHaveLength(0);
    persistence.dispose();
  });

  it('keeps a canonical storage read error visible after a target wins the final pre-copy recheck', async () => {
    const raw = rawSave(4);
    const key = localSaveKeyForGame(BRIGHTWOOD_GAME_ID, true);
    const legacyKey = localSaveKeyForGame(LEGACY_GAME_ID, true);
    const storage = new RecheckRaceStorage(key, legacyKey);
    storage.values.set(legacyKey, raw);
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud: null, catalog });
    await persistence.initialize();
    storage.raceCanonicalOnRead = 3;
    storage.canonicalRaceRaw = rawSave(4, makeSave('同時建立的新進度'));
    storage.failCanonicalOnRead = 4;

    const result = await persistence.importLegacySave?.();

    expect(result).toMatchObject({ mode: 'memory', status: 'loadError', data: null });
    expect(result?.message).toContain('這次舊版匯入已取消');
    expect(result?.message).toContain('Storage read failed');
    expect(storage.values.get(key)).toBe(storage.canonicalRaceRaw);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.writes).toHaveLength(0);
    persistence.dispose();
  });

  it('does not import an authenticated cloud save from local storage', async () => {
    const raw = rawSave(4, makeSave('本機舊進度'));
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    const cloud = createCloudPort(async () => cloudReady('authenticated', true, ['progress']));
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud, catalog });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'cloud', status: 'ready', data: null });
    expect(outcome.legacyImportAvailable).not.toBe(true);
    expect(storage.values.has(key)).toBe(false);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(cloud.loadProgress).toHaveBeenCalledTimes(1);
    expect(cloud.saveProgress).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('requires exact readback after copying and keeps the source if verification fails', async () => {
    const raw = rawSave(4);
    const storage = new ReadbackMismatchStorage();
    const key = localSaveKeyForGame(BRIGHTWOOD_GAME_ID, true);
    const legacyKey = localSaveKeyForGame(LEGACY_GAME_ID, true);
    storage.values.set(legacyKey, raw);
    storage.mismatchKey = key;
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud: null, catalog });
    expect((await persistence.initialize()).legacyImportAvailable).toBe(true);
    const result = await persistence.importLegacySave?.();
    expect(result).toMatchObject({ mode: 'memory', status: 'loadError', data: null });
    expect(result?.message).toContain('未能完整確認');
    expect(storage.values.get(key)).toBe(`${raw} `);
    expect(storage.values.get(legacyKey)).toBe(raw);
    persistence.dispose();
  });

  it('keeps the legacy source and creates no canonical target when import storage write fails', async () => {
    const raw = rawSave(4);
    const storage = new SetItemFailureStorage();
    const key = localSaveKeyForGame(BRIGHTWOOD_GAME_ID, true);
    const legacyKey = localSaveKeyForGame(LEGACY_GAME_ID, true);
    storage.values.set(legacyKey, raw);
    storage.failureKey = key;
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud: null, catalog });

    expect((await persistence.initialize()).legacyImportAvailable).toBe(true);
    const result = await persistence.importLegacySave?.();

    expect(result).toMatchObject({ mode: 'memory', status: 'loadError', data: null });
    expect(storage.values.has(key)).toBe(false);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.writes).toHaveLength(0);
    persistence.dispose();
  });

  it.each([1, 2, 3])('preserves format-%i raw data and a conflicting backup after import', async (formatVersion) => {
    const raw = rawSave(formatVersion);
    const conflictingBackup = `existing-format-${formatVersion}-backup`;
    const { storage, key, legacyKey } = createLegacyStorage(raw);
    const backupKey = `${key}:format${formatVersion}-backup`;
    storage.values.set(backupKey, conflictingBackup);
    const persistence = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, development: true, storage, cloud: null, catalog });

    expect((await persistence.initialize()).legacyImportAvailable).toBe(true);
    const imported = await persistence.importLegacySave?.();
    expect(imported?.data?.player.name).toBe('舊旅人');
    expect(storage.values.get(key)).toBe(raw);
    expect(storage.values.get(legacyKey)).toBe(raw);

    const updated = structuredClone(imported!.data!);
    updated.visitedMaps.push('town');
    persistence.checkpoint(updated);
    await flushWrites();

    expect(storage.values.get(key)).toBe(raw);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.values.get(backupKey)).toBe(conflictingBackup);
    expect(storage.writes).toEqual([[key, raw]]);
    persistence.dispose();
  });
});
