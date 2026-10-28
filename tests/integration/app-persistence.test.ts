import { describe, expect, it } from 'vitest';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import type { CloudPort, StorageLike } from '../../src/contracts/ports.js';
import { GameApp } from '../../src/app/app.js';
import { composeContentCatalog } from '../../src/app/catalog.js';
import { startNewGame } from '../../src/app/gameplay.js';
import { createNextEntityId } from '../../src/contracts/helpers.js';
import type { SaveData } from '../../src/contracts/types.js';
import { BRIGHTWOOD_GAME_ID, LEGACY_GAME_ID, localSaveKeyForGame } from '../../src/persistence/index.js';
import { SAVE_FORMAT_VERSION } from '../../src/persistence/validate.js';
import { createHeroAnchorFixture, createManifestFixture } from './asset-fixtures.js';

const fetchManifests = async (url: string) => {
  if (url.endsWith('/assets/actors/anchors.json')) {
    return { ok: true, status: 200, json: async () => createHeroAnchorFixture() };
  }
  const pack = url.split('/').at(-2) as AssetPack;
  return { ok: true, status: 200, json: async () => createManifestFixture(pack) };
};

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  writes = 0;

  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.writes += 1; this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

function createSave(name: string): SaveData {
  const catalog = composeContentCatalog();
  if (!catalog.ok) throw new Error(catalog.message);
  const started = startNewGame(name, catalog.value, createNextEntityId(`save-${name}`));
  if ('error' in started) throw new Error(started.error);
  return structuredClone(started.gameplay.saveData);
}

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('T14-c persistence wiring', () => {
  it('requires an explicit choice for a loaded format-4 character and keeps deferred play memory-only', async () => {
    const storage = new MemoryStorage();
    const oldData = createSave('待升級旅人');
    const key = localSaveKeyForGame(BRIGHTWOOD_GAME_ID);
    storage.values.set(key, 'local record untouched while cloud is active');
    let cloudWrites = 0;
    const cloud: CloudPort = {
      ready: async () => ({ mode: 'authenticated', progressAvailable: true, capabilities: ['load', 'save'] }),
      loadProgress: async () => ({
        data: oldData,
        revision: 4,
        formatVersion: 4,
        gameVersion: 'test',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }),
      saveProgress: async () => { cloudWrites += 1; throw new Error('deferred play must not write cloud progress'); },
    };
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, cloud, storage, seed: 17 });

    await app.initialize();
    expect(app.state.saveStatus).toBe('upgradeRequired');
    expect(app.uiSnapshot?.saveUpgrade).toEqual({ formatVersion: 4, source: 'cloud' });
    app.dispatch({ type: 'continue', payload: {} });
    app.update(0);
    expect(app.state.screen).toBe('title');

    app.dispatch({ type: 'playTemporary', payload: {} });
    app.update(0);
    expect(app.state.screen).toBe('playing');
    expect(app.state.gameplay?.saveData).toEqual(oldData);
    const settings = app.state.gameplay!.saveData.settings;
    app.dispatch({ type: 'setSettings', payload: { settings: { ...settings, muted: true } } });
    app.update(0);
    expect(storage.values.get(key)).toBe('local record untouched while cloud is active');
    expect(storage.values.has(`${key}:format4-backup`)).toBe(false);
    expect(storage.writes).toBe(0);
    expect(cloudWrites).toBe(0);
    app.dispose();
  });

  it('writes format 5 only after the app receives the explicit local upgrade command', async () => {
    const storage = new MemoryStorage();
    const oldData = createSave('明確升級旅人');
    const key = localSaveKeyForGame(BRIGHTWOOD_GAME_ID);
    const raw = JSON.stringify({ formatVersion: 4, data: oldData, savedAt: '2025-01-01T00:00:00.000Z' });
    storage.values.set(key, raw);
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, storage, seed: 18 });

    await app.initialize();
    app.dispatch({ type: 'confirmSaveUpgrade', payload: {} });
    app.update(0);

    expect(app.state.saveStatus).toBe('localSaved');
    expect(app.state.saveUpgrade).toBeNull();
    expect(storage.values.get(`${key}:format4-backup`)).toBe(raw);
    const upgraded = JSON.parse(storage.values.get(key)!) as { formatVersion: number; data: SaveData };
    expect(upgraded.formatVersion).toBe(5);
    expect(upgraded.data).toEqual(oldData);
    app.dispose();
  });

  it('blocks confirmed replacement after cloud load failure and keeps temporary play memory-only', async () => {
    const storage = new MemoryStorage();
    const localKey = 'maplewood-swordsman:save:v1:dev';
    storage.values.set(localKey, 'keep local save');
    const cloud: CloudPort = {
      ready: async () => ({ mode: 'authenticated', progressAvailable: true, capabilities: ['load', 'save'] }),
      loadProgress: async () => { throw new Error('simulated cloud load failure'); },
      saveProgress: async () => { throw new Error('must never write after a failed load'); },
    };
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, cloud, storage, seed: 1 });

    const result = await app.initialize();
    expect(result.ready).toBe(true);
    expect(app.state.saveStatus).toBe('loadError');
    expect(app.state.gameplay).toBeNull();

    app.dispatch({ type: 'newGame', payload: { name: '不應覆蓋' } });
    app.update(0);
    expect(app.state.screen).toBe('create');
    app.dispatch({ type: 'newGame', payload: { name: '不應覆蓋' } });
    app.update(0);
    expect(app.state.gameplay).toBeNull();

    app.dispatch({ type: 'playTemporary', payload: {} });
    app.update(0);
    expect(app.state.screen).toBe('playing');
    const settings = app.state.gameplay!.saveData.settings;
    app.dispatch({ type: 'setSettings', payload: { settings: { ...settings, muted: true } } });
    app.update(0);
    expect(app.state.gameplay!.saveData.settings.muted).toBe(true);
    expect(storage.values.get(localKey)).toBe('keep local save');
    expect(storage.writes).toBe(0);
    app.dispose();
  });

  it('requires confirmation to replace a loaded character and reloads the cloud save after a revision conflict', async () => {
    const initialSave = createSave('舊角色');
    const remoteSave = { ...structuredClone(initialSave), player: { ...initialSave.player, name: '雲端角色' } };
    let loadCount = 0;
    let cloudSaveCount = 0;
    const conflict = Object.assign(new Error('revision conflict'), { code: 409, machineCode: 'SAVE_REVISION_CONFLICT' });
    const cloud: CloudPort = {
      ready: async () => ({ mode: 'authenticated', progressAvailable: true, capabilities: ['load', 'save'] }),
      loadProgress: async () => {
        loadCount += 1;
        return {
          data: loadCount > 1 ? remoteSave : initialSave,
          revision: loadCount > 1 ? 3 : 2,
          formatVersion: SAVE_FORMAT_VERSION,
          gameVersion: 'test',
          updatedAt: '2026-10-18T00:00:00.000Z',
        };
      },
      saveProgress: async () => { cloudSaveCount += 1; throw conflict; },
    };
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, cloud, seed: 2 });
    await app.initialize();
    expect(app.state.gameplay?.saveData.player.name).toBe('舊角色');

    app.dispatch({ type: 'newGame', payload: { name: '新角色' } });
    app.update(0);
    expect(app.state.screen).toBe('create');
    expect(app.state.gameplay?.saveData.player.name).toBe('舊角色');
    app.dispatch({ type: 'newGame', payload: { name: '新角色' } });
    app.update(0);
    await flushMicrotasks();
    expect(app.state.screen).toBe('playing');
    expect(cloudSaveCount).toBe(1);
    expect(app.state.saveStatus).toBe('conflict');

    app.dispatch({ type: 'useCloudVersion', payload: {} });
    app.update(0);
    await flushMicrotasks();
    expect(loadCount).toBe(2);
    expect(app.state.screen).toBe('title');
    expect(app.state.gameplay?.saveData.player.name).toBe('雲端角色');
    expect(app.state.saveStatus).toBe('ready');
    app.dispose();
  });

  it('keeps the active save state when returning to title', async () => {
    const storage = new MemoryStorage();
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, storage, seed: 3 });
    await app.initialize();
    app.dispatch({ type: 'newGame', payload: { name: '本機角色' } });
    app.update(0);
    app.dispatch({ type: 'newGame', payload: { name: '本機角色' } });
    app.update(0);
    await flushMicrotasks();
    expect(storage.values.has(localSaveKeyForGame(BRIGHTWOOD_GAME_ID))).toBe(true);
    expect(app.state.saveStatus).toBe('localSaved');

    const settings = app.state.gameplay!.saveData.settings;
    app.dispatch({ type: 'setSettings', payload: { settings: { ...settings, muted: true } } });
    app.update(0);
    await flushMicrotasks();
    expect(app.state.saveStatus).toBe('localSaved');
    const revision = app.state.worldRevision;
    app.dispatch({ type: 'returnTitle', payload: {} });
    app.update(0);

    expect(app.state.screen).toBe('title');
    expect(app.state.gameplay?.saveData.settings.muted).toBe(true);
    expect(app.state.worldRevision).toBe(revision);
    app.dispose();
  });

  it('returns to town from an outdoor field while keeping an active arena fight locked', async () => {
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, storage: new MemoryStorage(), seed: 4 });
    await app.initialize();

    app.dispatch({ type: 'newGame', payload: { name: '回城測試' } });
    app.update(0);
    app.dispatch({ type: 'newGame', payload: { name: '回城測試' } });
    app.update(0);
    expect(app.state.screen).toBe('playing');
    // Before the hero has reached 木葉鎮, returning there would skip camp's q01 gate.
    expect(app.uiSnapshot?.canReturnTown).toBe(false);
    app.dispatch({ type: 'returnTown', payload: {} });
    app.update(0);
    expect(app.state.screen).toBe('playing');
    expect(app.state.gameplay?.pendingTransition).toBeNull();
    app.state.gameplay!.saveData.visitedMaps.push('town');
    expect(app.uiSnapshot?.canReturnTown).toBe(true);

    app.dispatch({ type: 'returnTown', payload: {} });
    app.update(0);
    expect(app.state.screen).toBe('loading');
    expect(app.state.gameplay?.pendingTransition).toMatchObject({ mapId: 'town', spawnId: 'center', after: 'travel' });
    app.completeMapTransition();
    expect(app.state.gameplay?.saveData.location).toEqual({ mapId: 'town', spawnId: 'center' });
    expect(app.uiSnapshot?.canReturnTown).toBe(false);

    const gameplay = app.state.gameplay!;
    gameplay.saveData.location = { mapId: 'guardian-arena', spawnId: 'entry' };
    gameplay.bossResult = false;
    expect(app.uiSnapshot?.canReturnTown).toBe(false);
    app.dispatch({ type: 'returnTown', payload: {} });
    app.update(0);
    expect(app.state.screen).toBe('playing');
    expect(app.state.gameplay?.pendingTransition).toBeNull();
    expect(app.state.gameplay?.toast).toContain('首領戰尚未結束');

    app.dispose();
  });

  it('lets the player defer importing and leaves the original save untouched', async () => {
    const storage = new MemoryStorage();
    const save = createSave('舊版旅人');
    const raw = JSON.stringify({ formatVersion: SAVE_FORMAT_VERSION, data: save, savedAt: '2025-01-01T00:00:00.000Z' });
    const legacyKey = localSaveKeyForGame(LEGACY_GAME_ID);
    const canonicalKey = localSaveKeyForGame(BRIGHTWOOD_GAME_ID);
    storage.values.set(legacyKey, raw);
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, storage, seed: 5 });

    await app.initialize();
    expect(app.uiSnapshot?.legacyImportAvailable).toBe(true);
    app.dispatch({ type: 'dismissLegacyImport', payload: {} });
    app.update(0);
    expect(app.uiSnapshot?.legacyImportAvailable).toBe(false);
    expect(app.uiSnapshot?.legacyImportMessage).toContain('暫不匯入');
    expect(storage.values.has(canonicalKey)).toBe(false);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.writes).toBe(0);
    app.dispose();
  });

  it('imports only after the explicit app command and keeps the original copy', async () => {
    const storage = new MemoryStorage();
    const save = createSave('舊版角色');
    const raw = JSON.stringify({ formatVersion: 4, data: save, savedAt: '2025-01-01T00:00:00.000Z' });
    const legacyKey = localSaveKeyForGame(LEGACY_GAME_ID);
    const canonicalKey = localSaveKeyForGame(BRIGHTWOOD_GAME_ID);
    storage.values.set(legacyKey, raw);
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, storage, seed: 6 });

    await app.initialize();
    expect(app.state.gameplay).toBeNull();
    expect(app.uiSnapshot?.legacyImportAvailable).toBe(true);
    app.dispatch({ type: 'importLegacySave', payload: {} });
    app.update(0);
    await flushMicrotasks();

    expect(app.state.gameplay?.saveData.player.name).toBe('舊版角色');
    expect(app.state.legacyImportAvailable).toBe(false);
    expect(app.state.saveStatus).toBe('upgradeRequired');
    expect(app.state.saveUpgrade).toEqual({ formatVersion: 4, source: 'local' });
    expect(storage.values.get(canonicalKey)).toBe(raw);
    expect(storage.values.get(legacyKey)).toBe(raw);
    expect(storage.values.has(`${canonicalKey}:format4-backup`)).toBe(false);
    app.dispose();
  });
});
