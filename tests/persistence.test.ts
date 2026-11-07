import { describe, expect, it, vi } from 'vitest';
import { legacySaveData } from './fixtures/legacy-save.js';
import type { GameProfile, CloudPort, CloudReady, CloudSaveInput, CloudSaved, SaveData, StorageLike } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createPlayer } from '../src/domain/progression/index.js';
import { getQuestView } from '../src/domain/quests/index.js';
import { BRIGHTWOOD_GAME_ID, createPersistence, LEGACY_GAME_ID, localSaveKeyForGame, SAVE_FORMAT_VERSION, profileFromLegacySave, validateSave } from '../src/persistence/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

function makeSave(): SaveData {
  return {
    player: createPlayer('晨芽', rulesCatalog),
    quests: {},
    visitedMaps: ['camp'],
    location: { mapId: 'camp', spawnId: 'start' },
    flags: { bossDefeated: false, chapterComplete: false },
    settings: { masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.9, muted: false, bindings: {} },
  };
}

class MemoryStorage implements StorageLike {
  readonly entries = new Map<string, string>();
  readonly setItem = vi.fn((key: string, value: string) => this.entries.set(key, value));
  readonly getItem = vi.fn((key: string) => this.entries.get(key) ?? null);
  readonly removeItem = vi.fn((key: string) => this.entries.delete(key));
}

function cloudPort(overrides: Partial<CloudPort> = {}): CloudPort {
  const ready: CloudReady = { mode: 'authenticated', progressAvailable: true, capabilities: ['progress'] };
  return {
    ready: vi.fn(async () => ready),
    loadProgress: vi.fn(async () => null),
    saveProgress: vi.fn(async (input) => ({
      ...input,
      saved: true as const,
      gameVersion: 'test',
      updatedAt: new Date(0).toISOString(),
    })),
    ...overrides,
  };
}

async function waitForStatus(statuses: SaveStatus[], expected: SaveStatus): Promise<void> {
  await vi.waitFor(() => expect(statuses).toContain(expected));
}

import type { SaveStatus } from '../src/contracts/index.js';

describe('persistence', () => {
  it('uses the documented local key and accepts only a successful cloud null as new progress', async () => {
    expect(localSaveKeyForGame('maplewood-swordsman', false)).toBe('maplewood-swordsman:save:v1');
    expect(localSaveKeyForGame('maplewood-swordsman', true)).toBe('maplewood-swordsman:save:v1:dev');
    const cloud = cloudPort();
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage: new MemoryStorage(), cloud, catalog });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'cloud', status: 'ready', data: null });
    expect(cloud.saveProgress).not.toHaveBeenCalled();
    persistence.checkpoint(makeSave());
    await vi.waitFor(() => expect(cloud.saveProgress).toHaveBeenCalledTimes(1));
    persistence.dispose();
  });

  it('moves an unreadable local save to a backup key only on request', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman');
    storage.entries.set(key, '{not json');
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    expect((await persistence.initialize()).status).toBe('loadError');
    expect(storage.entries.get(key)).toBe('{not json');
    expect(persistence.discardUnreadableLocalSave?.()).toBe(true);
    expect(storage.entries.has(key)).toBe(false);
    expect(storage.entries.get(`${key}:unreadable-backup`)).toBe('{not json');
    persistence.invalidate();
    expect((await persistence.initialize()).status).toBe('ready');
    expect(persistence.discardUnreadableLocalSave?.()).toBe(false);
    persistence.dispose();
  });

  it('refuses to discard a save that loaded or failed for non-local reasons', async () => {
    const cloud = cloudPort({ loadProgress: vi.fn(async () => { throw new Error('network down'); }) });
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage: new MemoryStorage(), cloud, catalog });
    expect((await persistence.initialize()).status).toBe('loadError');
    expect(persistence.discardUnreadableLocalSave?.()).toBe(false);
    persistence.dispose();
  });

  it('does not create or upload an initial save after cloud load failure', async () => {
    const cloud = cloudPort({ loadProgress: vi.fn(async () => { throw new Error('network down'); }) });
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage: new MemoryStorage(), cloud, catalog });
    const outcome = await persistence.initialize();
    persistence.checkpoint(makeSave());
    expect(outcome).toMatchObject({ mode: 'memory', status: 'loadError', data: null });
    expect(cloud.saveProgress).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('preserves corrupt local bytes and never clears the original record', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const raw = '{not valid json';
    storage.entries.set(key, raw);
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    const outcome = await persistence.initialize();
    expect(outcome.status).toBe('loadError');
    expect(storage.entries.get(key)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('requires the exact local envelope schema and preserves unsupported versions', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const malformed = JSON.stringify({ formatVersion: 1, data: makeSave() });
    storage.entries.set(key, malformed);
    const malformedPersistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    const malformedOutcome = await malformedPersistence.initialize();
    expect(malformedOutcome.status).toBe('loadError');
    expect(storage.entries.get(key)).toBe(malformed);
    malformedPersistence.dispose();

    const unsupported = JSON.stringify({ formatVersion: SAVE_FORMAT_VERSION + 1, data: makeSave(), savedAt: new Date(0).toISOString() });
    storage.entries.set(key, unsupported);
    const unsupportedPersistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    const unsupportedOutcome = await unsupportedPersistence.initialize();
    expect(unsupportedOutcome.status).toBe('incompatible');
    expect(storage.entries.get(key)).toBe(unsupported);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    unsupportedPersistence.dispose();
  });

  it('writes and reloads a valid local envelope through the injected storage adapter', async () => {
    const storage = new MemoryStorage();
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    await persistence.initialize();
    const savedData = makeSave();
    persistence.checkpoint(savedData);
    await vi.waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(1));

    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const raw = storage.entries.get(key);
    expect(raw).toBeDefined();
    const envelope = JSON.parse(raw!) as { formatVersion: number; data: GameProfile; savedAt: string };
    expect(Object.keys(envelope).sort()).toEqual(['data', 'formatVersion', 'savedAt']);
    expect(envelope).toMatchObject({ formatVersion: SAVE_FORMAT_VERSION, data: profileFromLegacySave(savedData) });
    expect(typeof envelope.savedAt).toBe('string');
    persistence.dispose();

    const restored = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    const outcome = await restored.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'ready', data: savedData });
    restored.dispose();
  });

  it.each([1, 2, 3, 4, 5])('requires explicit, verified backup before upgrading local format %i', async (formatVersion) => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const oldData = makeSave();
    oldData.player.name = `format-${formatVersion}`;
    oldData.quests = { q01: { status: 'active', counters: { snail: 2 } } };
    const raw = JSON.stringify({ formatVersion, data: legacySaveData(oldData), savedAt: '2025-01-01T00:00:00.000Z' });
    storage.entries.set(key, raw);
    const statuses: SaveStatus[] = [];
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage, cloud: null, catalog,
      onStatus: (status) => statuses.push(status),
    });

    const loaded = await persistence.initialize();
    expect(loaded).toMatchObject({
      mode: 'local',
      status: 'upgradeRequired',
      data: oldData,
      saveUpgrade: { formatVersion, source: 'local' },
    });
    persistence.checkpoint({ ...oldData, player: { ...oldData.player, coins: oldData.player.coins + 1 } });
    expect(storage.entries.get(key)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();

    persistence.confirmSaveUpgrade();
    const backupKey = `${key}:format${formatVersion}-backup`;
    expect(storage.entries.get(backupKey)).toBe(raw);
    const upgraded = JSON.parse(storage.entries.get(key)!) as { formatVersion: number; data: GameProfile };
    expect(upgraded.formatVersion).toBe(SAVE_FORMAT_VERSION);
    expect(upgraded.data).toEqual(profileFromLegacySave(oldData));
    expect(statuses).toContain('localSaved');
    persistence.dispose();
  });

  it('stops local upgrade when the format backup key contains different bytes', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const oldData = makeSave();
    const raw = JSON.stringify({ formatVersion: 4, data: legacySaveData(oldData), savedAt: '2025-01-01T00:00:00.000Z' });
    const backupKey = `${key}:format4-backup`;
    storage.entries.set(key, raw);
    storage.entries.set(backupKey, 'different backup bytes');
    const statuses: SaveStatus[] = [];
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage, cloud: null, catalog,
      onStatus: (status) => statuses.push(status),
    });

    expect((await persistence.initialize()).status).toBe('upgradeRequired');
    persistence.confirmSaveUpgrade();
    expect(statuses).toContain('incompatible');
    expect(storage.entries.get(key)).toBe(raw);
    expect(storage.entries.get(backupKey)).toBe('different backup bytes');
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('stops local upgrade when the exact backup cannot be read back', async () => {
    const entries = new Map<string, string>();
    const setItem = vi.fn((storageKey: string, value: string) => entries.set(storageKey, value));
    const storage: StorageLike = {
      getItem: (storageKey) => storageKey.endsWith(':format4-backup') ? null : entries.get(storageKey) ?? null,
      setItem,
      removeItem: (storageKey) => entries.delete(storageKey),
    };
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const oldData = makeSave();
    const raw = JSON.stringify({ formatVersion: 4, data: legacySaveData(oldData), savedAt: '2025-01-01T00:00:00.000Z' });
    entries.set(key, raw);
    const statuses: SaveStatus[] = [];
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage, cloud: null, catalog,
      onStatus: (status) => statuses.push(status),
    });

    expect((await persistence.initialize()).status).toBe('upgradeRequired');
    persistence.confirmSaveUpgrade();
    expect(statuses).toContain('saveError');
    expect(entries.get(key)).toBe(raw);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith(`${key}:format4-backup`, raw);
    persistence.dispose();
  });

  it('waits for explicit cloud upgrade confirmation and never retries an incompatible write as format 4', async () => {
    const oldData = makeSave();
    const incompatible = Object.assign(new Error('format is not supported by the published game'), {
      machineCode: 'SAVE_FORMAT_INCOMPATIBLE',
    });
    const statuses: SaveStatus[] = [];
    const saveProgress = vi.fn(async () => { throw incompatible; });
    const cloud = cloudPort({
      loadProgress: vi.fn(async () => ({
        data: legacySaveData(oldData),
        revision: 7,
        formatVersion: 4,
        gameVersion: 'test',
        updatedAt: '2025-01-01T00:00:00.000Z',
      })),
      saveProgress,
    });
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage: null, cloud, catalog,
      onStatus: (status) => statuses.push(status),
    });

    const loaded = await persistence.initialize();
    expect(loaded).toMatchObject({ status: 'upgradeRequired', saveUpgrade: { formatVersion: 4, source: 'cloud' }, data: oldData });
    expect(saveProgress).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    await waitForStatus(statuses, 'incompatible');
    expect(saveProgress).toHaveBeenCalledTimes(1);
    expect(saveProgress.mock.calls[0]?.[0]).toMatchObject({ formatVersion: SAVE_FORMAT_VERSION, revision: 7 });
    await persistence.retry();
    expect(saveProgress).toHaveBeenCalledTimes(1);
    persistence.dispose();
  });

  it('continues to reject unknown quests and counters under format 5 validation', () => {
    const unknownQuest = makeSave();
    unknownQuest.quests = { q999: { status: 'active', counters: {} } };
    const questResult = validateSave(unknownQuest, catalog);
    expect(questResult.ok).toBe(false);
    if (!questResult.ok) expect(questResult.message).toContain('未知任務');

    const unknownCounter = makeSave();
    unknownCounter.quests = { q01: { status: 'active', counters: { 'unlisted-target': 1 } } };
    const counterResult = validateSave(unknownCounter, catalog);
    expect(counterResult.ok).toBe(false);
    if (!counterResult.ok) expect(counterResult.message).toContain('計數器');
  });

  it('rejects saves over 64 KiB without truncating data', () => {
    const oversized = makeSave();
    oversized.player.name = 'a'.repeat(65 * 1024);
    const result = validateSave(oversized, catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('64 KiB');
    expect(oversized.player.name).toHaveLength(65 * 1024);
  });

  it('accepts the Frost Isles as a visited location in the existing save format', () => {
    const existingFormatSave = makeSave();
    existingFormatSave.location = { mapId: 'frost-shore', spawnId: 'left' };
    existingFormatSave.visitedMaps.push('frost-shore');

    const result = validateSave(existingFormatSave, catalog);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.location).toEqual({ mapId: 'frost-shore', spawnId: 'left' });
  });
  it('loads a format-1 save from before q12 existed and derives q12 without rewriting quest state', async () => {
    const oldSave = makeSave();
    oldSave.player.level = 30;
    oldSave.player.ap = 145;
    oldSave.visitedMaps.push('town');
    const claimedQuests: SaveData['quests'] = {};
    for (const questId of ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08', 'q09', 'q10', 'q11'] as const) {
      const quest = catalog.world.quests[questId]!;
      const counters: Record<string, number> = {};
      for (const objective of quest.objectives) {
        if (objective.type === 'kill' || objective.type === 'reach') counters[objective.targetId] = objective.count;
      }
      claimedQuests[questId] = { status: 'claimed', counters };
    }
    oldSave.quests = claimedQuests;
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    storage.entries.set(key, JSON.stringify({
      formatVersion: 1,
      data: legacySaveData(oldSave),
      savedAt: new Date(0).toISOString(),
    }));
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });

    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'upgradeRequired', saveUpgrade: { formatVersion: 1, source: 'local' } });
    if (outcome.status === 'upgradeRequired' && outcome.data) {
      expect(outcome.data.quests).not.toHaveProperty('q12');
      expect(getQuestView(outcome.data, 'q12', catalog).status).toBe('available');
    }
    persistence.dispose();
  });
  it('accepts a format-1 save with q12 claimed and no q13 record', () => {
    const legacy = makeSave();
    legacy.player.level = 30;
    legacy.player.ap = 145;
    const questIds = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08', 'q09', 'q10', 'q11', 'q12'] as const;
    legacy.quests = Object.fromEntries(questIds.map((questId) => {
      const counters: Record<string, number> = {};
      for (const objective of catalog.world.quests[questId]!.objectives) {
        if (objective.type === 'kill' || objective.type === 'reach') counters[objective.targetId] = objective.count;
      }
      return [questId, { status: 'claimed', counters }];
    })) as SaveData['quests'];

    const result = validateSave(legacy, catalog);
    expect(SAVE_FORMAT_VERSION).toBe(9);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.quests).not.toHaveProperty('q13');
      expect(getQuestView(result.value, 'q13', catalog).status).toBe('available');
    }
  });
  it('retries a lost cloud result with identical data, revision, and request ID', async () => {
    const statuses: SaveStatus[] = [];
    const firstError = new Error('response lost');
    let attempt = 0;
    const saveProgress = vi.fn(async (input) => {
      attempt += 1;
      if (attempt === 1) throw firstError;
      return { ...input, saved: true as const, gameVersion: 'test', updatedAt: new Date(0).toISOString() };
    });
    const cloud = cloudPort({ saveProgress });
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage: null, cloud, catalog,
      onStatus: (status) => statuses.push(status),
    });
    await persistence.initialize();
    const data = makeSave();
    persistence.checkpoint(data);
    data.player.name = 'changed after checkpoint';
    await waitForStatus(statuses, 'saveError');
    await persistence.retry();
    await waitForStatus(statuses, 'saved');
    expect(saveProgress).toHaveBeenCalledTimes(2);
    expect(saveProgress.mock.calls[1]?.[0]).toEqual(saveProgress.mock.calls[0]?.[0]);
    persistence.dispose();
  });

  it('stops at revision conflict and does not overwrite with later snapshots', async () => {
    const statuses: SaveStatus[] = [];
    const conflict = Object.assign(new Error('revision conflict'), {
      code: 409,
      machineCode: 'SAVE_REVISION_CONFLICT',
    });
    const cloud = cloudPort({ saveProgress: vi.fn(async () => { throw conflict; }) });
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage: null, cloud, catalog,
      onStatus: (status) => statuses.push(status),
    });
    await persistence.initialize();
    persistence.checkpoint(makeSave());
    await waitForStatus(statuses, 'conflict');
    persistence.checkpoint({ ...makeSave(), location: { mapId: 'town', spawnId: 'center' } });
    expect(cloud.saveProgress).toHaveBeenCalledTimes(1);
    persistence.dispose();
  });

  it('ignores a stale save response after invalidation', async () => {
    const statuses: SaveStatus[] = [];
    const pendingSave: { resolve?: (saved: CloudSaved) => void } = {};
    const saveProgress = vi.fn((input: CloudSaveInput) => new Promise<CloudSaved>((resolve) => {
      pendingSave.resolve = resolve;
      void input;
    }));
    const cloud = cloudPort({
      saveProgress,
    });
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage: null, cloud, catalog,
      onStatus: (status) => statuses.push(status),
    });
    await persistence.initialize();
    persistence.checkpoint(makeSave());
    await vi.waitFor(() => expect(pendingSave.resolve).toBeTypeOf('function'));
    persistence.invalidate();
    const input = saveProgress.mock.calls[0]?.[0];
    const resolveSave = pendingSave.resolve;
    if (!input || !resolveSave) throw new Error('Expected a pending cloud save.');
    resolveSave({ ...input, saved: true, gameVersion: 'test', updatedAt: new Date(0).toISOString() });
    await Promise.resolve();
    expect(statuses).not.toContain('saved');
    persistence.dispose();
  });

  it('keeps preview saves diagnostic even when the port returns a saved-shaped result', async () => {
    const statuses: SaveStatus[] = [];
    const cloud = cloudPort({
      ready: vi.fn(async (): Promise<CloudReady> => ({ mode: 'preview', progressAvailable: false, capabilities: [] })),
    });
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage: new MemoryStorage(), cloud, catalog,
      onStatus: (status) => statuses.push(status),
    });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'preview', status: 'previewOnly', data: null });
    persistence.checkpoint(makeSave());
    await waitForStatus(statuses, 'previewOnly');
    expect(statuses).not.toContain('saved');
    expect(cloud.saveProgress).toHaveBeenCalledTimes(1);
    persistence.dispose();
  });
});

describe('local saves shared between tabs', () => {
  const GAME = 'maplewood-swordsman';
  const key = localSaveKeyForGame(GAME, import.meta.env.DEV);

  const openTab = (storage: StorageLike, statuses: SaveStatus[] = []) => createPersistence({
    gameId: GAME, storage, cloud: null, catalog, onStatus: (status) => statuses.push(status),
  });

  const seedStorage = (storage: MemoryStorage): GameProfile => {
    const profile = profileFromLegacySave(makeSave());
    storage.entries.set(key, JSON.stringify({ formatVersion: SAVE_FORMAT_VERSION, data: profile, savedAt: '2026-11-01T00:00:00.000Z' }));
    return profile;
  };

  const changed = (profile: GameProfile, name: string, warehouse: GameProfile['warehouse'] = []): GameProfile => {
    const next = structuredClone(profile);
    next.characters[next.activeCharacterId!]!.player.name = name;
    next.warehouse = warehouse;
    return next;
  };

  const storedProfile = (storage: MemoryStorage): GameProfile =>
    (JSON.parse(storage.entries.get(key)!) as { data: GameProfile }).data;

  it('rejects the stale tab, keeps the newer character and warehouse, and resumes after reloading', async () => {
    const storage = new MemoryStorage();
    const profile = seedStorage(storage);
    const statuses: SaveStatus[] = [];
    const stale = openTab(storage, statuses);
    const newer = openTab(storage);
    await stale.initialize();
    await newer.initialize();

    newer.checkpointProfile!(changed(profile, 'Newer', [{ itemId: 'small-red', quantity: 1 }]));
    await expect(newer.flush()).resolves.toBe(true);
    const newerRaw = storage.entries.get(key);

    stale.checkpointProfile!(changed(profile, 'Stale'));
    await expect(stale.flush()).resolves.toBe(false);
    expect(statuses).toContain('localConflict');
    expect(storage.entries.get(key)).toBe(newerRaw);
    expect(storedProfile(storage).warehouse).toEqual([{ itemId: 'small-red', quantity: 1 }]);

    // Nothing but a reload clears it: later saves, retries and upgrades stay out of storage.
    const writes = storage.setItem.mock.calls.length;
    const statusCount = statuses.length;
    stale.checkpoint(makeSave());
    stale.checkpointProfile!(changed(profile, 'Stale again'));
    await stale.retry();
    stale.confirmSaveUpgrade();
    await expect(stale.flush()).resolves.toBe(false);
    expect(storage.setItem.mock.calls.length).toBe(writes);
    expect(statuses.slice(statusCount)).toEqual([]);

    stale.invalidate();
    const reloaded = await stale.initialize();
    expect(reloaded.profile?.characters[profile.activeCharacterId!]?.player.name).toBe('Newer');
    expect(reloaded.profile?.warehouse).toEqual([{ itemId: 'small-red', quantity: 1 }]);
    stale.checkpointProfile!(changed(reloaded.profile!, 'Resumed', reloaded.profile!.warehouse));
    await expect(stale.flush()).resolves.toBe(true);
    expect(storedProfile(storage).characters[profile.activeCharacterId!]?.player.name).toBe('Resumed');
    stale.dispose();
    newer.dispose();
  });

  it('rejects the later writer when both tabs started without a save', async () => {
    const storage = new MemoryStorage();
    const first = openTab(storage);
    const second = openTab(storage);
    await first.initialize();
    await second.initialize();
    const profile = profileFromLegacySave(makeSave());

    first.checkpointProfile!(changed(profile, 'First'));
    await expect(first.flush()).resolves.toBe(true);
    second.checkpointProfile!(changed(profile, 'Second'));
    await expect(second.flush()).resolves.toBe(false);

    expect(storedProfile(storage).characters[profile.activeCharacterId!]?.player.name).toBe('First');
    first.dispose();
    second.dispose();
  });

  it('does not recreate a save that was removed elsewhere', async () => {
    const storage = new MemoryStorage();
    const profile = seedStorage(storage);
    const statuses: SaveStatus[] = [];
    const tab = openTab(storage, statuses);
    await tab.initialize();
    storage.entries.delete(key);

    tab.checkpointProfile!(changed(profile, 'Gone'));
    await expect(tab.flush()).resolves.toBe(false);

    expect(statuses).toContain('localConflict');
    expect(storage.entries.has(key)).toBe(false);
    tab.dispose();
  });

  it('keeps saving across consecutive writes, a first save and a retried failed write', async () => {
    const storage = new MemoryStorage();
    const tab = openTab(storage);
    await tab.initialize();
    const profile = profileFromLegacySave(makeSave());

    tab.checkpointProfile!(changed(profile, 'One'));
    await expect(tab.flush()).resolves.toBe(true);
    tab.checkpointProfile!(changed(profile, 'Two'));
    await expect(tab.flush()).resolves.toBe(true);

    storage.setItem.mockImplementationOnce(() => { throw new Error('quota'); });
    tab.checkpointProfile!(changed(profile, 'Three'));
    await expect(tab.flush()).resolves.toBe(false);
    expect(storedProfile(storage).characters[profile.activeCharacterId!]?.player.name).toBe('Two');
    await tab.retry();
    await expect(tab.flush()).resolves.toBe(true);
    expect(storedProfile(storage).characters[profile.activeCharacterId!]?.player.name).toBe('Three');
    tab.dispose();
  });

  it('keeps saving after a format upgrade', async () => {
    const storage = new MemoryStorage();
    const oldData = makeSave();
    storage.entries.set(key, JSON.stringify({ formatVersion: 4, data: legacySaveData(oldData), savedAt: '2025-01-01T00:00:00.000Z' }));
    const statuses: SaveStatus[] = [];
    const tab = openTab(storage, statuses);
    const outcome = await tab.initialize();
    expect(outcome.status).toBe('upgradeRequired');
    tab.confirmSaveUpgrade();
    expect(statuses).toContain('localSaved');

    tab.checkpointProfile!(changed(outcome.profile!, 'Upgraded'));
    await expect(tab.flush()).resolves.toBe(true);
    expect(storedProfile(storage).characters[outcome.profile!.activeCharacterId!]?.player.name).toBe('Upgraded');
    tab.dispose();
  });

  it('keeps saving after a legacy import', async () => {
    const storage = new MemoryStorage();
    const target = localSaveKeyForGame(BRIGHTWOOD_GAME_ID, import.meta.env.DEV);
    const profile = profileFromLegacySave(makeSave());
    storage.entries.set(localSaveKeyForGame(LEGACY_GAME_ID, import.meta.env.DEV),
      JSON.stringify({ formatVersion: SAVE_FORMAT_VERSION, data: profile, savedAt: '2026-01-01T00:00:00.000Z' }));
    const tab = createPersistence({ gameId: BRIGHTWOOD_GAME_ID, storage, cloud: null, catalog });
    expect((await tab.initialize()).legacyImportAvailable).toBe(true);
    expect((await tab.importLegacySave!()).status).toBe('ready');

    tab.checkpointProfile!(changed(profile, 'Imported'));
    await expect(tab.flush()).resolves.toBe(true);
    const saved = JSON.parse(storage.entries.get(target)!) as { data: GameProfile };
    expect(saved.data.characters[profile.activeCharacterId!]?.player.name).toBe('Imported');
    tab.dispose();
  });
});

describe('discarding an unreadable local save', () => {
  const GAME = 'maplewood-swordsman';
  const key = localSaveKeyForGame(GAME, import.meta.env.DEV);
  const backupKey = `${key}:unreadable-backup`;
  const corrupt = '{not json';

  const openOnCorruptSave = async (storage: MemoryStorage) => {
    storage.entries.set(key, corrupt);
    const tab = createPersistence({ gameId: GAME, storage, cloud: null, catalog });
    expect((await tab.initialize()).status).toBe('loadError');
    return tab;
  };

  const namedProfile = (name: string): GameProfile => {
    const profile = profileFromLegacySave(makeSave());
    profile.characters[profile.activeCharacterId!]!.player.name = name;
    return profile;
  };

  it('keeps what another tab created after both showed the corrupt save', async () => {
    const storage = new MemoryStorage();
    const stale = await openOnCorruptSave(storage);
    const other = await openOnCorruptSave(storage);

    expect(other.discardUnreadableLocalSave?.()).toBe(true);
    other.invalidate();
    await other.initialize();
    other.checkpointProfile!(namedProfile('NewHero'));
    await expect(other.flush()).resolves.toBe(true);
    const created = storage.entries.get(key);

    expect(stale.discardUnreadableLocalSave?.()).toBe(false);
    expect(storage.entries.get(key)).toBe(created);
    expect(storage.entries.get(backupKey)).toBe(corrupt);
    stale.dispose();
    other.dispose();
  });

  it('does nothing when the save was repaired or already removed', async () => {
    const storage = new MemoryStorage();
    const tab = await openOnCorruptSave(storage);

    storage.entries.set(key, 'repaired elsewhere');
    expect(tab.discardUnreadableLocalSave?.()).toBe(false);
    expect(storage.entries.get(key)).toBe('repaired elsewhere');

    storage.entries.delete(key);
    expect(tab.discardUnreadableLocalSave?.()).toBe(false);

    expect(storage.entries.has(backupKey)).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    tab.dispose();
  });

  it('adds a new backup instead of refusing or replacing a different one', async () => {
    const storage = new MemoryStorage();
    storage.entries.set(backupKey, 'older corrupt bytes');
    storage.entries.set(`${backupKey}:2`, 'another corrupt save');
    const tab = await openOnCorruptSave(storage);

    expect(tab.discardUnreadableLocalSave?.()).toBe(true);

    expect(storage.entries.has(key)).toBe(false);
    expect(storage.entries.get(backupKey)).toBe('older corrupt bytes');
    expect(storage.entries.get(`${backupKey}:2`)).toBe('another corrupt save');
    expect(storage.entries.get(`${backupKey}:3`)).toBe(corrupt);
    tab.dispose();
  });

  it('reuses a backup that already holds the same bytes', async () => {
    const storage = new MemoryStorage();
    storage.entries.set(`${backupKey}`, 'older corrupt bytes');
    storage.entries.set(`${backupKey}:2`, corrupt);
    const tab = await openOnCorruptSave(storage);

    expect(tab.discardUnreadableLocalSave?.()).toBe(true);

    expect(storage.entries.has(key)).toBe(false);
    expect(storage.entries.has(`${backupKey}:3`)).toBe(false);
    expect(storage.entries.get(`${backupKey}:2`)).toBe(corrupt);
    tab.dispose();
  });

  it('keeps the save when the backup cannot be written or read back', async () => {
    const storage = new MemoryStorage();
    const tab = await openOnCorruptSave(storage);

    storage.setItem.mockImplementationOnce(() => { throw new Error('quota'); });
    expect(tab.discardUnreadableLocalSave?.()).toBe(false);
    expect(storage.entries.get(key)).toBe(corrupt);

    storage.setItem.mockImplementationOnce((name: string) => storage.entries.set(name, 'truncated'));
    expect(tab.discardUnreadableLocalSave?.()).toBe(false);
    expect(storage.entries.get(key)).toBe(corrupt);
    expect(storage.removeItem).not.toHaveBeenCalled();
    tab.dispose();
  });

  it('can save again after discarding, and can discard a later corrupt save', async () => {
    const storage = new MemoryStorage();
    const tab = await openOnCorruptSave(storage);
    expect(tab.discardUnreadableLocalSave?.()).toBe(true);
    expect(tab.discardUnreadableLocalSave?.()).toBe(false);

    tab.invalidate();
    expect((await tab.initialize()).status).toBe('ready');
    tab.checkpointProfile!(namedProfile('Second life'));
    await expect(tab.flush()).resolves.toBe(true);

    storage.entries.set(key, '{corrupt again');
    tab.invalidate();
    expect((await tab.initialize()).status).toBe('loadError');
    expect(tab.discardUnreadableLocalSave?.()).toBe(true);
    expect(storage.entries.has(key)).toBe(false);
    expect(storage.entries.get(backupKey)).toBe(corrupt);
    expect(storage.entries.get(`${backupKey}:2`)).toBe('{corrupt again');
    tab.dispose();
  });
});
