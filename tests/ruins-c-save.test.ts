import { describe, expect, it, vi } from 'vitest';
import type { CloudPort, CloudReady, CloudRecord, SaveData, StorageLike } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import {
  createPersistence,
  localSaveKeyForGame,
  READABLE_SAVE_FORMATS,
  SAVE_FORMAT_VERSION,
  validateSave,
} from '../src/persistence/index.js';
import { claimedBSave } from './ruins-b-fixtures.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const gameId = 'maplewood-swordsman';
const key = localSaveKeyForGame(gameId, import.meta.env.DEV);
const savedAt = '2026-10-25T00:00:00.000Z';

class MemoryStorage implements StorageLike {
  readonly entries = new Map<string, string>();
  readonly setItem = vi.fn((targetKey: string, value: string) => this.entries.set(targetKey, value));
  readonly getItem = vi.fn((targetKey: string) => this.entries.get(targetKey) ?? null);
  readonly removeItem = vi.fn((targetKey: string) => this.entries.delete(targetKey));
}

function activeCSave(): SaveData {
  const data = claimedBSave();
  data.quests.q18 = { status: 'active', counters: { 'ruins-bell-keeper': 0 } };
  return data;
}

function claimedCSave(): SaveData {
  const data = activeCSave();
  data.quests.q18 = { status: 'claimed', counters: { 'ruins-bell-keeper': 1 } };
  return data;
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
      updatedAt: savedAt,
    })),
    ...overrides,
  };
}

describe('ruins C save compatibility', () => {
  it('reads formats 1–4, writes format 5 after confirmation, and preserves q17/q20 through migration', async () => {
    expect(READABLE_SAVE_FORMATS).toEqual([1, 2, 3, 4, 5]);
    expect(SAVE_FORMAT_VERSION).toBe(5);

    for (const formatVersion of [1, 2, 3, 4]) {
      const storage = new MemoryStorage();
      const legacy = claimedBSave();
      const original = ` ${JSON.stringify({ formatVersion, data: legacy, savedAt })} `;
      storage.entries.set(key, original);
      const persistence = createPersistence({ gameId, storage, cloud: null, catalog });

      const outcome = await persistence.initialize();
      expect(outcome).toMatchObject({
        mode: 'local', status: 'upgradeRequired', saveUpgrade: { formatVersion, source: 'local' }, data: {
        quests: {
          q17: { status: 'claimed' },
          q20: { status: 'claimed' },
        },
      } });
      expect(outcome.data?.quests).not.toHaveProperty('q18');
      expect(outcome.data?.quests).not.toHaveProperty('q19');
      expect(storage.entries.get(key)).toBe(original);
      expect(storage.setItem).not.toHaveBeenCalled();

      persistence.checkpoint(activeCSave());
      expect(storage.entries.get(key)).toBe(original);
      persistence.confirmSaveUpgrade();
      persistence.checkpoint(activeCSave());
      await vi.waitFor(() => expect(JSON.parse(storage.entries.get(key)!).formatVersion).toBe(5));
      expect(storage.entries.get(`${key}:format${formatVersion}-backup`)).toBe(original);
      expect(JSON.parse(storage.entries.get(key)!).data.quests).toMatchObject({
        q17: { status: 'claimed' },
        q18: { status: 'active', counters: { 'ruins-bell-keeper': 0 } },
        q20: { status: 'claimed' },
      });
      persistence.dispose();

      const restored = createPersistence({ gameId, storage, cloud: null, catalog });
      const restoredOutcome = await restored.initialize();
      expect(restoredOutcome.status).toBe('ready');
      expect(restoredOutcome.data?.quests.q17?.status).toBe('claimed');
      expect(restoredOutcome.data?.quests.q18?.status).toBe('active');
      expect(restoredOutcome.data?.quests.q20?.status).toBe('claimed');
      restored.dispose();
    }
  });

  it.each([1, 2, 3, 4])('requires confirmation before upgrading cloud format %i and checkpointing as format 5', async (formatVersion) => {
    const record: CloudRecord = {
      data: claimedBSave(),
      revision: 4,
      formatVersion,
      gameVersion: 'legacy',
      updatedAt: savedAt,
    };
    const cloud = cloudPort({ loadProgress: vi.fn(async () => record) });
    const persistence = createPersistence({ gameId, storage: null, cloud, catalog });

    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({
      mode: 'cloud', status: 'upgradeRequired', saveUpgrade: { formatVersion, source: 'cloud' },
    });
    expect(cloud.saveProgress).not.toHaveBeenCalled();
    persistence.checkpoint(activeCSave());
    expect(cloud.saveProgress).not.toHaveBeenCalled();

    persistence.confirmSaveUpgrade();
    persistence.checkpoint(activeCSave());
    await vi.waitFor(() => expect(cloud.saveProgress).toHaveBeenCalledTimes(2));
    for (const [input] of cloud.saveProgress.mock.calls) {
      expect(input).toMatchObject({ formatVersion: 5, revision: 4 });
    }
    expect(cloud.saveProgress.mock.calls[1]?.[0].data.quests.q18).toMatchObject({ status: 'active' });
    persistence.dispose();
  });

  it('requires current-catalog objective records for claimed q18 and q19 without changing flags', () => {
    const fakeQ18Claim = activeCSave();
    fakeQ18Claim.quests.q18 = { status: 'claimed', counters: { 'ruins-bell-keeper': 0 } };
    expect(validateSave(fakeQ18Claim, catalog).ok).toBe(false);

    const invalidQ19Claim = claimedCSave();
    invalidQ19Claim.quests.q19 = { status: 'claimed', counters: { town: 0 } };
    expect(validateSave(invalidQ19Claim, catalog).ok).toBe(false);

    const validQ19Claim = claimedCSave();
    validQ19Claim.quests.q19 = { status: 'claimed', counters: { town: 1 } };
    const result = validateSave(validQ19Claim, catalog);
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.value.flags).sort()).toEqual(['bossDefeated', 'chapterComplete']);
  });

  it('rejects unknown map IDs instead of repairing them to a different town', () => {
    const invalid = claimedBSave();
    invalid.location = { mapId: 'removed-map', spawnId: 'left' };
    expect(validateSave(invalid, catalog).ok).toBe(false);
  });

  it('preserves the format-3 source and stops if its existing backup differs', async () => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ formatVersion: 3, data: claimedBSave(), savedAt });
    const differentBackup = JSON.stringify({ formatVersion: 3, data: activeCSave(), savedAt });
    storage.entries.set(key, original);
    storage.entries.set(`${key}:format3-backup`, differentBackup);
    const statuses: string[] = [];
    const persistence = createPersistence({
      gameId, storage, cloud: null, catalog,
      onStatus: (status) => statuses.push(status),
    });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'upgradeRequired' });

    persistence.checkpoint(activeCSave());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    await vi.waitFor(() => expect(statuses).toContain('incompatible'));
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.entries.get(`${key}:format3-backup`)).toBe(differentBackup);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('keeps the format-3 source untouched when its backup write fails', async () => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ formatVersion: 3, data: claimedBSave(), savedAt });
    storage.entries.set(key, original);
    storage.setItem.mockImplementation((targetKey, value) => {
      if (targetKey === `${key}:format3-backup`) throw new Error('quota exceeded');
      storage.entries.set(targetKey, value);
    });
    const statuses: string[] = [];
    const persistence = createPersistence({
      gameId, storage, cloud: null, catalog,
      onStatus: (status) => statuses.push(status),
    });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'upgradeRequired' });

    persistence.checkpoint(activeCSave());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    await vi.waitFor(() => expect(statuses).toContain('saveError'));
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.entries.has(`${key}:format3-backup`)).toBe(false);
    expect(storage.removeItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('preserves an unknown local format and stops writes', async () => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ formatVersion: 7, data: claimedBSave(), savedAt });
    storage.entries.set(key, original);
    const persistence = createPersistence({ gameId, storage, cloud: null, catalog });

    expect((await persistence.initialize()).status).toBe('incompatible');
    persistence.checkpoint(activeCSave());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    persistence.dispose();
  });
});
