import { describe, expect, it, vi } from 'vitest';
import { GameApp } from '../../src/app/app.js';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import type { CloudPort, GameProfile, StorageLike } from '../../src/contracts/index.js';
import { localSaveKeyForGame, SAVE_FORMAT_VERSION } from '../../src/persistence/index.js';
import { createHeroAnchorFixture, createManifestFixture } from './asset-fixtures.js';

const fetcher = async (url: string) => ({ ok: true, status: 200, json: async () => url.endsWith('/anchors.json')
  ? createHeroAnchorFixture() : createManifestFixture(url.split('/').at(-2) as AssetPack) });
class Storage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
async function title(app: GameApp): Promise<void> {
  app.dispatch({ type: 'returnTitle', payload: {} }); app.update(0); await flush();
  expect(app.state.screen).toBe('title');
}

describe('profile character selection', () => {
  it('adds an archer in an empty slot, isolates progress, reloads the roster and resets runtime on switching', async () => {
    const storage = new Storage();
    const app = new GameApp({ baseUrl: './', fetcher, storage });
    await app.initialize();
    app.dispatch({ type: 'newGame', payload: { name: '晨芽', slotId: 'slot-1' } }); app.update(0); await flush();
    const firstId = app.state.profile!.activeCharacterId!;
    const first = app.state.gameplay!.saveData;
    first.quests.q01 = { status: 'active', counters: { snail: 2 } };
    first.visitedMaps.push('town');
    first.player.bag.push({ itemId: 'forest-seed', quantity: 3 });
    app.dispatch({ type: 'setSettings', payload: { settings: { ...first.settings, muted: true } } });
    app.update(0); await flush(); await title(app);
    const original = structuredClone(app.state.profile!.characters[firstId]);
    app.dispatch({ type: 'newGame', payload: { name: '青翎', plannedJob: 'archer', slotId: 'slot-2' } });
    app.update(0); await flush();
    const secondId = app.state.profile!.activeCharacterId!;
    expect(secondId).not.toBe(firstId);
    expect(app.state.gameplay!.saveData.player).toMatchObject({ plannedJob: 'archer', hp: 64, mp: 48, equipment: { weapon: 'starter-bow' } });
    expect(app.state.gameplay!.saveData.quests).toEqual({});
    expect(app.state.gameplay!.saveData.visitedMaps).toEqual(['camp']);
    expect(app.state.gameplay!.saveData.settings.muted).toBe(true);
    expect(app.state.profile!.characters[firstId]).toEqual(original);
    const oldEntityId = app.state.gameplay!.playerEntityId;
    app.state.gameplay!.guardUntilMs = 100000;
    app.state.gameplay!.combat.cooldowns[oldEntityId] = { basic: 100000 };
    const staleRevision = app.state.worldRevision;
    const staleLoad = app.beginMapVisualLoad(app.state.catalog!.world.maps.town!);
    await title(app);
    app.dispatch({ type: 'selectCharacter', payload: { characterId: firstId } }); app.update(0); await flush();
    expect(app.state.gameplay!.saveData.player.name).toBe('晨芽');
    expect(app.state.gameplay!.saveData.quests).toEqual(original!.quests);
    expect(app.state.gameplay!.guardUntilMs).toBe(0);
    expect(app.state.gameplay!.combat.cooldowns).toEqual({});
    expect(app.state.gameplay!.playerEntityId).not.toBe(oldEntityId);
    expect(app.state.mapVisualLoad).toBeNull();
    const before = app.state.gameplay;
    app.completeMapTransition(staleRevision);
    app.failMapTransition('stale callback', staleRevision);
    app.failMapVisualLoad(staleLoad, 'stale load');
    expect(app.state.gameplay).toBe(before);
    await flush(); app.dispose();
    const restored = new GameApp({ baseUrl: './', fetcher, storage });
    await restored.initialize();
    expect(Object.keys(restored.state.profile!.characters)).toHaveLength(2);
    expect(restored.state.profile!.activeCharacterId).toBe(firstId);
    expect(restored.state.profile!.characters[secondId]!.player.plannedJob).toBe('archer');
    restored.dispose();
  });

  it('never replaces a filled slot and keeps four temporary characters within this page', async () => {
    const storage = new Storage();
    const app = new GameApp({ baseUrl: './', fetcher, storage });
    await app.initialize();
    app.dispatch({ type: 'playTemporary', payload: {} }); app.update(0);
    await title(app);
    for (const slotId of ['slot-2', 'slot-3', 'slot-4']) {
      app.dispatch({ type: 'newGame', payload: { name: slotId, slotId, plannedJob: 'archer' } });
      app.update(0); await title(app);
    }
    const original = structuredClone(app.state.profile);
    app.dispatch({ type: 'newGame', payload: { name: '不可取代', slotId: 'slot-1' } }); app.update(0);
    expect(app.state.profile).toEqual(original);
    expect(Object.keys(app.state.profile!.characters)).toHaveLength(4);
    const firstId = app.state.profile!.slots[0]!.characterId!;
    app.dispatch({ type: 'selectCharacter', payload: { characterId: firstId } }); app.update(0); await flush();
    expect(app.state.gameplay!.saveData.player.name).toBe('旅人');
    expect(storage.values.has(localSaveKeyForGame('brightwood-first-oath'))).toBe(false);
    app.dispose();
  });

  it('waits for the final checkpoint and refuses to leave or select another character when saving fails', async () => {
    const seedStorage = new Storage();
    const seed = new GameApp({ baseUrl: './', fetcher, storage: seedStorage });
    await seed.initialize(); seed.dispatch({ type: 'newGame', payload: { name: '原角色' } }); seed.update(0); await flush();
    const profile = structuredClone(seed.state.profile!); seed.dispose();
    let writes = 0;
    const cloud: CloudPort = {
      ready: async () => ({ mode: 'authenticated', progressAvailable: true, capabilities: ['progress'] }),
      loadProgress: async () => ({ data: profile, revision: 1, formatVersion: SAVE_FORMAT_VERSION, gameVersion: 'test', updatedAt: 'test' }),
      saveProgress: vi.fn(async (input) => {
        writes += 1;
        if (writes === 2) throw new Error('connection lost');
        return { ...input, saved: true, revision: input.revision + 1, gameVersion: 'test', updatedAt: 'test' };
      }),
    };
    const app = new GameApp({ baseUrl: './', fetcher, cloud });
    await app.initialize(); app.setScreen('playing');
    const changeMute = (muted: boolean): void => {
      app.dispatch({ type: 'setSettings', payload: { settings: { ...app.state.gameplay!.saveData.settings, muted } } }); app.update(0);
    };
    changeMute(true); await flush();
    changeMute(false); // Ordinary checkpoint stays queued until returning to the list.
    app.dispatch({ type: 'returnTitle', payload: {} }); app.update(0);
    expect(app.state.characterBusy).toBe(true);
    await flush();
    expect(app.state.saveStatus).toBe('saveError');
    expect(app.state.screen).toBe('playing');
    expect(app.state.characterBusy).toBe(false);
    app.dispatch({ type: 'selectCharacter', payload: { characterId: 'missing' } }); app.update(0);
    expect(app.state.profile!.activeCharacterId).toBe(profile.activeCharacterId);
    expect(writes).toBe(2);
    app.dispose();
  });
});
