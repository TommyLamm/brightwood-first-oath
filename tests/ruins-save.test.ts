import { describe, expect, it, vi } from 'vitest';
import type { CloudPort, CloudReady, CloudRecord, SaveData, StorageLike } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createPlayer } from '../src/domain/progression/index.js';
import { createPersistence, localSaveKeyForGame, SAVE_FORMAT_VERSION } from '../src/persistence/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

function makeSave(): SaveData {
  return {
    player: createPlayer('晨芽', rulesCatalog),
    quests: {},
    visitedMaps: ['camp'],
    location: { mapId: 'camp', spawnId: 'start' },
    flags: { bossDefeated: true, chapterComplete: false },
    settings: { masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.9, muted: false, bindings: {} },
  };
}

function beforeRuinsSave(): SaveData {
  const data = makeSave();
  data.player.level = 30;
  data.player.ap = 145;
  const clearedQuestIds = Object.keys(catalog.world.quests)
    .filter((id) => /^q\d{2}$/u.test(id) && Number(id.slice(1)) <= 14)
    .sort();
  data.quests = Object.fromEntries(clearedQuestIds.map((questId) => {
    const quest = catalog.world.quests[questId]!;
    const counters: Record<string, number> = {};
    for (const objective of quest.objectives) {
      if (objective.type === 'kill' || objective.type === 'reach') counters[objective.targetId] = objective.count;
    }
    return [questId, { status: 'claimed', counters }];
  })) as SaveData['quests'];
  return data;
}

function ruinsProgress(): SaveData {
  const data = beforeRuinsSave();
  const q15 = catalog.world.quests.q15;
  const q16 = catalog.world.quests.q16;
  if (!q15 || !q16) throw new Error('The ruins quest definitions must be loaded before this focused save test.');
  const q15Counters: Record<string, number> = {};
  for (const objective of q15.objectives) {
    if (objective.type === 'reach') q15Counters[objective.targetId] = objective.count;
  }
  const q16Kill = q16.objectives.find((objective) => objective.type === 'kill');
  if (!q16Kill || q16Kill.type !== 'kill') throw new Error('q16 needs its planned ruins kill objective.');
  data.quests.q15 = { status: 'claimed', counters: q15Counters };
  data.quests.q16 = { status: 'active', counters: { [q16Kill.targetId]: 1 } };
  return data;
}

class MemoryStorage implements StorageLike {
  readonly entries = new Map<string, string>();
  readonly setItem = vi.fn((key: string, value: string) => this.entries.set(key, value));
  readonly getItem = vi.fn((key: string) => this.entries.get(key) ?? null);
  readonly removeItem = vi.fn((key: string) => this.entries.delete(key));
}

function cloudPort(overrides: Partial<CloudPort> = {}): CloudPort {
  const ready: CloudReady = { mode: 'authenticated', progressAvailable: true, capabilities: ['progress', 'saveFormats'] };
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

describe('ruins save compatibility', () => {
  it('loads a format-1 save with no q15 or q16 record', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const original = JSON.stringify({ formatVersion: 1, data: beforeRuinsSave(), savedAt: '2026-10-25T00:00:00.000Z' });
    storage.entries.set(key, original);
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });

    const outcome = await persistence.initialize();

    expect(outcome).toMatchObject({
      mode: 'local', status: 'upgradeRequired', saveUpgrade: { formatVersion: 1, source: 'local' },
    });
    expect(outcome.data?.quests).not.toHaveProperty('q15');
    expect(outcome.data?.quests).not.toHaveProperty('q16');
    expect(storage.entries.get(key)).toBe(original);
    persistence.dispose();
  });

  it('writes and reloads format 5 with the new quest and monster IDs', async () => {
    const storage = new MemoryStorage();
    const data = ruinsProgress();
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    await persistence.initialize();
    persistence.checkpoint(data);
    await vi.waitFor(() => expect(JSON.parse(storage.entries.get(localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV))!).formatVersion).toBe(5));
    persistence.dispose();

    const restored = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    const outcome = await restored.initialize();
    expect(SAVE_FORMAT_VERSION).toBe(5);
    expect(outcome).toMatchObject({ mode: 'local', status: 'ready', data: {
      quests: {
        q15: { status: 'claimed' },
        q16: { status: 'active', counters: { 'ruins-moss-carapace': 1 } },
      },
      flags: { bossDefeated: true, chapterComplete: false },
    } });
    restored.dispose();
  });

  it('requires confirmation before upgrading a cloud format-1 record and checkpointing as format 5', async () => {
    const data = beforeRuinsSave();
    const record: CloudRecord = {
      data,
      revision: 4,
      formatVersion: 1,
      gameVersion: 'legacy',
      updatedAt: '2026-10-25T00:00:00.000Z',
    };
    const cloud = cloudPort({ loadProgress: vi.fn(async () => record) });
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage: null, cloud, catalog });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({
      mode: 'cloud', status: 'upgradeRequired', saveUpgrade: { formatVersion: 1, source: 'cloud' },
    });
    expect(cloud.saveProgress).not.toHaveBeenCalled();

    persistence.confirmSaveUpgrade();
    persistence.checkpoint(ruinsProgress());
    await vi.waitFor(() => expect(cloud.saveProgress).toHaveBeenCalledTimes(2));
    expect(cloud.saveProgress.mock.calls[0]?.[0]).toMatchObject({ formatVersion: 5, revision: 4 });
    expect(cloud.saveProgress.mock.calls[1]?.[0]).toMatchObject({
      formatVersion: 5, revision: 4, data: { quests: { q16: { status: 'active', counters: { 'ruins-moss-carapace': 1 } } } },
    });
    persistence.dispose();
  });

  it('preserves an unknown local format and stops writes from a new character', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const original = JSON.stringify({ formatVersion: 7, data: makeSave(), savedAt: '2026-10-25T00:00:00.000Z' });
    storage.entries.set(key, original);
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });

    expect((await persistence.initialize()).status).toBe('incompatible');
    persistence.checkpoint(makeSave());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('backs up the exact format-1 envelope before the confirmed format-5 write', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const original = JSON.stringify({ formatVersion: 1, data: beforeRuinsSave(), savedAt: '2026-10-25T00:00:00.000Z' });
    storage.entries.set(key, original);
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'upgradeRequired' });

    persistence.checkpoint(ruinsProgress());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    expect(storage.entries.get(`${key}:format1-backup`)).toBe(original);
    persistence.checkpoint(ruinsProgress());
    await vi.waitFor(() => expect(JSON.parse(storage.entries.get(key)!).formatVersion).toBe(5));

    expect(storage.entries.get(`${key}:format1-backup`)).toBe(original);
    expect(JSON.parse(storage.entries.get(key)!).data.quests.q16.counters['ruins-moss-carapace']).toBe(1);
    persistence.dispose();
  });

  it('does not overwrite the original if the format-1 backup fails', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const original = JSON.stringify({ formatVersion: 1, data: beforeRuinsSave(), savedAt: '2026-10-25T00:00:00.000Z' });
    storage.entries.set(key, original);
    storage.setItem.mockImplementation((targetKey, value) => {
      if (targetKey === `${key}:format1-backup`) throw new Error('quota exceeded');
      storage.entries.set(targetKey, value);
    });
    const statuses: string[] = [];
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage, cloud: null, catalog,
      onStatus: (status) => statuses.push(status),
    });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'upgradeRequired' });

    persistence.checkpoint(ruinsProgress());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    await vi.waitFor(() => expect(statuses).toContain('saveError'));
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.entries.has(`${key}:format1-backup`)).toBe(false);
    expect(storage.removeItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('stops after cloud format incompatibility without writing a blank replacement', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const localOriginal = JSON.stringify({ formatVersion: 1, data: beforeRuinsSave(), savedAt: '2026-10-25T00:00:00.000Z' });
    storage.entries.set(key, localOriginal);
    const incompatibility = Object.assign(new Error('save format incompatible'), {
      code: 409,
      machineCode: 'SAVE_FORMAT_INCOMPATIBLE',
    });
    const cloud = cloudPort({ loadProgress: vi.fn(async () => { throw incompatibility; }) });
    const persistence = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud, catalog });

    const outcome = await persistence.initialize();
    persistence.checkpoint(makeSave());

    expect(outcome).toMatchObject({ mode: 'memory', status: 'incompatible', data: null });
    expect(cloud.saveProgress).not.toHaveBeenCalled();
    expect(storage.entries.get(key)).toBe(localOriginal);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('stops cloud writes when format 5 is rejected and keeps the local record untouched', async () => {
    const storage = new MemoryStorage();
    const key = localSaveKeyForGame('maplewood-swordsman', import.meta.env.DEV);
    const localOriginal = JSON.stringify({ formatVersion: 1, data: beforeRuinsSave(), savedAt: '2026-10-25T00:00:00.000Z' });
    storage.entries.set(key, localOriginal);
    const incompatibility = Object.assign(new Error('save format incompatible'), {
      code: 409,
      machineCode: 'SAVE_FORMAT_INCOMPATIBLE',
    });
    const statuses: string[] = [];
    const cloud = cloudPort({ saveProgress: vi.fn(async () => { throw incompatibility; }) });
    const persistence = createPersistence({
      gameId: 'maplewood-swordsman', storage, cloud, catalog,
      onStatus: (status) => statuses.push(status),
    });
    expect((await persistence.initialize()).status).toBe('ready');

    persistence.checkpoint(ruinsProgress());
    await vi.waitFor(() => expect(statuses).toContain('incompatible'));
    persistence.checkpoint(makeSave());

    expect(cloud.saveProgress).toHaveBeenCalledTimes(1);
    expect(cloud.saveProgress.mock.calls[0]?.[0]).toMatchObject({ formatVersion: 5, revision: 0 });
    expect(storage.entries.get(key)).toBe(localOriginal);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.dispose();
  });
});
