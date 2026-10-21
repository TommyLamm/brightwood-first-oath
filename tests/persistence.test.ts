import { describe, expect, it, vi } from 'vitest';
import type { CloudPort, CloudReady, CloudSaveInput, CloudSaved, SaveData, StorageLike } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createPlayer } from '../src/domain/progression/index.js';
import { createPersistence, localSaveKeyForGame, validateSave } from '../src/persistence/index.js';

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

    const unsupported = JSON.stringify({ formatVersion: 2, data: makeSave(), savedAt: new Date(0).toISOString() });
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
    const envelope = JSON.parse(raw!) as { formatVersion: number; data: SaveData; savedAt: string };
    expect(Object.keys(envelope).sort()).toEqual(['data', 'formatVersion', 'savedAt']);
    expect(envelope).toMatchObject({ formatVersion: 1, data: savedData });
    expect(typeof envelope.savedAt).toBe('string');
    persistence.dispose();

    const restored = createPersistence({ gameId: 'maplewood-swordsman', storage, cloud: null, catalog });
    const outcome = await restored.initialize();
    expect(outcome).toMatchObject({ mode: 'local', status: 'ready', data: savedData });
    restored.dispose();
  });

  it('rejects saves over 64 KiB without truncating data', () => {
    const oversized = makeSave();
    oversized.player.name = 'a'.repeat(65 * 1024);
    const result = validateSave(oversized, catalog);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('64 KiB');
    expect(oversized.player.name).toHaveLength(65 * 1024);
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
