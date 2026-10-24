import { describe, expect, it } from 'vitest';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import type { CloudPort, StorageLike } from '../../src/contracts/ports.js';
import { GameApp } from '../../src/app/app.js';
import { composeContentCatalog } from '../../src/app/catalog.js';
import { startNewGame } from '../../src/app/gameplay.js';
import { createNextEntityId } from '../../src/contracts/helpers.js';
import type { SaveData } from '../../src/contracts/types.js';
import { localSaveKeyForGame } from '../../src/persistence/index.js';
import { SAVE_FORMAT_VERSION } from '../../src/persistence/validate.js';
import { createHeroAnchorFixture } from './asset-fixtures.js';

const imageKeys: Record<Exclude<AssetPack, 'audio'>, string[]> = {
  actors: [
    'actor:hero-cloth', 'actor:hero-leather', 'actor:hero-iron',
    'equip:starter-sword', 'equip:iron-sword', 'equip:steel-sword', 'equip:guardian-sword',
    'equip:cloth-cap', 'equip:leather-cap', 'equip:iron-helm',
    'actor:snail', 'actor:slime', 'actor:mushroom', 'actor:boar', 'actor:golem', 'actor:sentinel', 'actor:guardian', 'actor:frost-wolf', 'actor:frost-crab', 'actor:sand-scorpion', 'actor:sunwell-beetle',
    'actor:guide', 'actor:mentor', 'actor:merchant', 'actor:healer', 'actor:keeper', 'actor:frost-guide', 'actor:sands-guide',
  ],
  environment: [
    ...(['camp', 'town', 'forest', 'rock', 'frost', 'frost-pine', 'frost-cave', 'sand', 'sand-dune', 'sunwell'] as const).flatMap((theme) =>
      (['sky', 'far', 'mid'] as const).map((layer) => `env:${theme}:${layer}`)),
    'env:tile-ground', 'env:tile-platform', 'env:tile-slope', 'env:ladder',
    'env:portal', 'env:town-sign', 'env:mine-door', 'env:altar',
  ],
  interface: [
    ...[
      'starter-sword', 'iron-sword', 'steel-sword', 'guardian-sword', 'cloth-shirt', 'leather-vest',
      'iron-mail', 'cloth-cap', 'leather-cap', 'iron-helm', 'small-red', 'large-red', 'small-blue',
      'large-blue', 'snail-shell', 'slime-gel', 'mushroom-cap', 'boar-tusk', 'stone-chip', 'metal-shard', 'frost-fang', 'ice-shell',
      'forest-seed', 'spore-sample', 'ridge-emblem', 'guardian-core', 'sunwell-shell',
    ].map((id) => `item:${id}`),
    ...['heavy-strike', 'sweep', 'iron-guard', 'vitality', 'rest-recovery'].map((id) => `skill:${id}`),
    'marker:quest', 'marker:portal', 'marker:shop', 'marker:player', 'panel:frame',
    'button:normal', 'button:hover', 'button:pressed', 'bar:hp', 'bar:mp', 'bar:exp',
    'slot:normal', 'slot:selected', 'vfx:heavy-strike', 'vfx:sweep', 'vfx:hit', 'vfx:levelup', 'vfx:guard',
  ],
};
const audioKeys = [
  'theme-town', 'theme-field', 'theme-boss', 'ui-click', 'jump', 'attack', 'hit', 'hurt',
  'pickup', 'potion', 'equip', 'quest', 'levelup', 'portal', 'death', 'boss-win',
];

function validManifest(pack: AssetPack): unknown {
  if (pack === 'audio') {
    return {
      version: 1,
      pack,
      images: [],
      animations: [],
      audio: audioKeys.map((key) => ({ key, url: `assets/audio/${key}.ogg`, kind: key.startsWith('theme-') ? 'music' : 'sfx', loop: key.startsWith('theme-') })),
    };
  }
  return {
    version: 1,
    pack,
    images: imageKeys[pack].map((key, index) => ({
      key,
      url: `assets/${pack}/${index}.png`,
      columns: 1,
      rows: 1,
      displayWidth: 64,
      displayHeight: 64,
      pivotX: 0.5,
      pivotY: 0.5,
    })),
    animations: [],
    audio: [],
  };
}

const fetchManifests = async (url: string) => {
  if (url.endsWith('/assets/actors/anchors.json')) {
    return { ok: true, status: 200, json: async () => createHeroAnchorFixture() };
  }
  const pack = url.split('/').at(-2) as AssetPack;
  return { ok: true, status: 200, json: async () => validManifest(pack) };
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
    expect(storage.values.has(localSaveKeyForGame('maplewood-swordsman'))).toBe(true);
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
});
