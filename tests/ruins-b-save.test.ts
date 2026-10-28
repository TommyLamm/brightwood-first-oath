import { describe, expect, it, vi } from 'vitest';
import type { CloudPort, CloudReady, CloudRecord, SaveData, StorageLike } from '../src/contracts/index.js';
import {
  createPersistence,
  localSaveKeyForGame,
  READABLE_SAVE_FORMATS,
  SAVE_FORMAT_VERSION,
  validateSave,
} from '../src/persistence/index.js';
import { activeBSave, beforeBSave, claimedBSave, ruinsBCatalog } from './ruins-b-fixtures.js';

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

const gameId = 'maplewood-swordsman';
const key = localSaveKeyForGame(gameId, import.meta.env.DEV);
const savedAt = '2026-10-25T00:00:00.000Z';

describe('ruins B save compatibility', () => {
  it.each([1, 2])('loads an old format-%i envelope that has no q17/q20 record', async (formatVersion) => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ formatVersion, data: beforeBSave(), savedAt });
    storage.entries.set(key, original);
    const persistence = createPersistence({ gameId, storage, cloud: null, catalog: ruinsBCatalog });

    const outcome = await persistence.initialize();

    expect(outcome).toMatchObject({
      mode: 'local', status: 'upgradeRequired', saveUpgrade: { formatVersion, source: 'local' },
    });
    expect(outcome.data?.quests).not.toHaveProperty('q17');
    expect(outcome.data?.quests).not.toHaveProperty('q20');
    expect(storage.entries.get(key)).toBe(original);
    persistence.dispose();
  });

  it('writes and reloads format 5 with inspect progress', async () => {
    const storage = new MemoryStorage();
    const persistence = createPersistence({ gameId, storage, cloud: null, catalog: ruinsBCatalog });
    expect(READABLE_SAVE_FORMATS).toEqual([1, 2, 3, 4, 5]);
    expect(SAVE_FORMAT_VERSION).toBe(5);
    await persistence.initialize();
    persistence.checkpoint(activeBSave());
    await vi.waitFor(() => expect(JSON.parse(storage.entries.get(key)!).formatVersion).toBe(5));
    persistence.dispose();

    const restored = createPersistence({ gameId, storage, cloud: null, catalog: ruinsBCatalog });
    const outcome = await restored.initialize();
    expect(outcome).toMatchObject({
      mode: 'local',
      status: 'ready',
      data: { quests: { q17: { status: 'active', counters: {
        'ruins-stele-west': 1,
        'ruins-stele-east': 0,
        'ruins-string-puppet': 1,
      } } } },
    });
    restored.dispose();
  });

  it.each([1, 2])('backs up the exact format-%i local envelope before confirmed format-5 writing', async (formatVersion) => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ formatVersion, data: beforeBSave(), savedAt });
    storage.entries.set(key, original);
    const persistence = createPersistence({ gameId, storage, cloud: null, catalog: ruinsBCatalog });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({
      mode: 'local', status: 'upgradeRequired', saveUpgrade: { formatVersion, source: 'local' },
    });

    persistence.checkpoint(activeBSave());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    expect(storage.entries.get(`${key}:format${formatVersion}-backup`)).toBe(original);
    persistence.checkpoint(activeBSave());
    await vi.waitFor(() => expect(JSON.parse(storage.entries.get(key)!).formatVersion).toBe(5));

    expect(storage.entries.get(`${key}:format${formatVersion}-backup`)).toBe(original);
    persistence.dispose();
  });

  it('stops when the existing format-2 backup has different bytes', async () => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ formatVersion: 2, data: beforeBSave(), savedAt });
    const differentBackup = JSON.stringify({ formatVersion: 2, data: activeBSave(), savedAt });
    storage.entries.set(key, original);
    storage.entries.set(`${key}:format2-backup`, differentBackup);
    const statuses: string[] = [];
    const persistence = createPersistence({
      gameId, storage, cloud: null, catalog: ruinsBCatalog,
      onStatus: (status) => statuses.push(status),
    });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({
      mode: 'local', status: 'upgradeRequired', saveUpgrade: { formatVersion: 2, source: 'local' },
    });

    persistence.checkpoint(activeBSave());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    await vi.waitFor(() => expect(statuses).toContain('incompatible'));

    expect(storage.entries.get(key)).toBe(original);
    expect(storage.entries.get(`${key}:format2-backup`)).toBe(differentBackup);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it.each([1, 2])('keeps format-%i original when backup storage fails', async (formatVersion) => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ formatVersion, data: beforeBSave(), savedAt });
    storage.entries.set(key, original);
    storage.setItem.mockImplementation((targetKey, value) => {
      if (targetKey === `${key}:format${formatVersion}-backup`) throw new Error('quota exceeded');
      storage.entries.set(targetKey, value);
    });
    const statuses: string[] = [];
    const persistence = createPersistence({
      gameId, storage, cloud: null, catalog: ruinsBCatalog,
      onStatus: (status) => statuses.push(status),
    });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({
      mode: 'local', status: 'upgradeRequired', saveUpgrade: { formatVersion, source: 'local' },
    });

    persistence.checkpoint(activeBSave());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    await vi.waitFor(() => expect(statuses).toContain('saveError'));

    expect(storage.entries.get(key)).toBe(original);
    expect(storage.entries.has(`${key}:format${formatVersion}-backup`)).toBe(false);
    expect(storage.removeItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it.each([1, 2])('requires confirmation before upgrading cloud format %i and checkpointing as format 5', async (formatVersion) => {
    const record: CloudRecord = {
      data: beforeBSave(),
      revision: 4,
      formatVersion,
      gameVersion: 'legacy',
      updatedAt: savedAt,
    };
    const cloud = cloudPort({ loadProgress: vi.fn(async () => record) });
    const persistence = createPersistence({ gameId, storage: null, cloud, catalog: ruinsBCatalog });
    const outcome = await persistence.initialize();
    expect(outcome).toMatchObject({
      mode: 'cloud', status: 'upgradeRequired', saveUpgrade: { formatVersion, source: 'cloud' },
    });
    expect(cloud.saveProgress).not.toHaveBeenCalled();

    persistence.checkpoint(activeBSave());
    expect(cloud.saveProgress).not.toHaveBeenCalled();
    persistence.confirmSaveUpgrade();
    persistence.checkpoint(activeBSave());
    await vi.waitFor(() => expect(cloud.saveProgress).toHaveBeenCalledTimes(2));
    for (const [input] of cloud.saveProgress.mock.calls) {
      expect(input).toMatchObject({ formatVersion: 5, revision: 4 });
    }
    expect(cloud.saveProgress.mock.calls[1]?.[0].data.quests.q17).toMatchObject({ status: 'active' });
    persistence.dispose();
  });

  it('preserves unsupported local formats and stops writes', async () => {
    const storage = new MemoryStorage();
    const original = JSON.stringify({ formatVersion: 7, data: beforeBSave(), savedAt });
    storage.entries.set(key, original);
    const persistence = createPersistence({ gameId, storage, cloud: null, catalog: ruinsBCatalog });

    expect((await persistence.initialize()).status).toBe('incompatible');
    persistence.checkpoint(activeBSave());
    expect(storage.entries.get(key)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.dispose();
  });

  it('rejects invalid inspect counters and incomplete claimed objectives, but accepts consumed q20 items', () => {
    expect(validateSave(claimedBSave(), ruinsBCatalog).ok).toBe(true);

    const missingStele = claimedBSave();
    delete missingStele.quests.q17!.counters['ruins-stele-west'];
    expect(validateSave(missingStele, ruinsBCatalog).ok).toBe(false);

    const incompletePuppet = claimedBSave();
    incompletePuppet.quests.q17!.counters['ruins-string-puppet'] = 1;
    expect(validateSave(incompletePuppet, ruinsBCatalog).ok).toBe(false);

    const incompleteKill = claimedBSave();
    incompleteKill.quests.q20!.counters['ruins-bell-prowler'] = 2;
    expect(validateSave(incompleteKill, ruinsBCatalog).ok).toBe(false);

    for (const invalid of [2, -1, 0.5]) {
      const data = activeBSave();
      data.quests.q17!.counters['ruins-stele-east'] = invalid;
      expect(validateSave(data, ruinsBCatalog).ok).toBe(false);
    }
    const unknownTarget = activeBSave();
    unknownTarget.quests.q17!.counters['not-a-stele'] = 1;
    expect(validateSave(unknownTarget, ruinsBCatalog).ok).toBe(false);
  });

  it('stops cloud writes after format incompatibility', async () => {
    const incompatibility = Object.assign(new Error('save format incompatible'), {
      code: 409,
      machineCode: 'SAVE_FORMAT_INCOMPATIBLE',
    });
    const statuses: string[] = [];
    const cloud = cloudPort({ saveProgress: vi.fn(async () => { throw incompatibility; }) });
    const storage = new MemoryStorage();
    const persistence = createPersistence({
      gameId, storage, cloud, catalog: ruinsBCatalog,
      onStatus: (status) => statuses.push(status),
    });
    await persistence.initialize();

    persistence.checkpoint(activeBSave());
    await vi.waitFor(() => expect(statuses).toContain('incompatible'));
    persistence.checkpoint(beforeBSave());

    expect(cloud.saveProgress).toHaveBeenCalledTimes(1);
    expect(cloud.saveProgress).toHaveBeenCalledWith(expect.objectContaining({ formatVersion: 5, revision: 0 }));
    expect(storage.setItem).not.toHaveBeenCalled();
    persistence.dispose();
  });
});
