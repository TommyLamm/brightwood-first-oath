import { describe, expect, it } from 'vitest';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import { GameApp } from '../../src/app/app.js';
import { appCommand, worldIsFrozen } from '../../src/app/state.js';
import { createHeroAnchorFixture, createManifestFixture } from './asset-fixtures.js';

async function playingApp() {
  const app = new GameApp({ baseUrl: './', seed: 76, sessionPrefix: 'visual-load', fetcher: async (url) => ({
    ok: true, status: 200, json: async () => url.endsWith('/anchors.json') ? createHeroAnchorFixture()
      : createManifestFixture(url.split('/').at(-2) as AssetPack),
  }) });
  expect((await app.initialize()).ready).toBe(true);
  app.dispatch({ type: 'playTemporary', payload: {} }); app.update(0);
  return app;
}

describe('map visual loading safety', () => {
  it('freezes game time and gameplay until visuals are ready, without catching up afterward', async () => {
    const app = await playingApp();
    const request = app.beginMapVisualLoad(app.state.catalog!.world.maps.camp!);
    const gameplay = JSON.stringify(app.state.gameplay);
    const time = app.state.gameTimeMs;
    for (let n = 0; n < 3; n++) app.update(1000);
    expect(worldIsFrozen(app.state)).toBe(true);
    expect(app.state.gameTimeMs).toBe(time);
    expect(JSON.stringify(app.state.gameplay)).toBe(gameplay);
    app.endMapVisualLoad(request); app.update(1000 / 60);
    expect(app.state.gameTimeMs - time).toBeGreaterThan(0);
    expect(app.state.gameTimeMs - time).toBeLessThanOrEqual(17);
    expect(worldIsFrozen(app.state)).toBe(false);
    app.dispose();
  });

  it('drops transient commands on both sides of the wait and clears jump assistance', async () => {
    const app = await playingApp();
    app.state.gameplay!.jumpAssist = { graceUntilMs: 80, bufferedUntilMs: 100 };
    app.dispatch({ type: 'attack', payload: { skillId: 'basic' } });
    const request = app.beginMapVisualLoad(app.state.catalog!.world.maps.camp!);
    expect(app.queuedCommandCount).toBe(0);
    expect(app.state.gameplay!.jumpAssist).toBeUndefined();
    app.dispatch({ type: 'attack', payload: { skillId: 'basic' } });
    app.endMapVisualLoad(request);
    expect(app.queuedCommandCount).toBe(0);
    app.update(1000 / 60);
    expect(app.state.gameplay!.combat.attacks).toEqual([]);
    app.dispose();
  });

  it('bounds progress and ignores callbacks from an older request', async () => {
    const app = await playingApp(); const map = app.state.catalog!.world.maps.camp!;
    const old = app.beginMapVisualLoad(map);
    app.updateMapVisualProgress(old, { completed: 99, total: 4 });
    expect(app.uiSnapshot!.mapVisualLoad).toMatchObject({ completed: 4, total: 4 });
    const current = app.beginMapVisualLoad(map);
    app.updateMapVisualProgress(old, { completed: 3, total: 3 });
    app.failMapVisualLoad(old, 'old failure'); app.endMapVisualLoad(old);
    expect(app.state.mapVisualLoad).toMatchObject({ requestId: current, status: 'loading', completed: 0, total: 0 });
    app.updateMapVisualProgress(current, { completed: Number.NaN, total: 1 });
    expect(app.state.mapVisualLoad!.completed).toBe(0);
    app.dispose();
  });

  it('holds a failed initial load safely and permits an explicit retry with a fresh generation', async () => {
    const app = await playingApp();
    const request = app.beginMapVisualLoad(app.state.catalog!.world.maps.camp!);
    app.failMapVisualLoad(request, 'missing texture');
    app.update(2000);
    expect(app.state.mapVisualLoad).toMatchObject({ status: 'failed', message: 'missing texture' });
    expect(worldIsFrozen(app.state)).toBe(true);
    expect(appCommand(app.state, { type: 'togglePause', payload: {} }).state.screen).toBe('playing');
    const revision = app.state.worldRevision;
    app.dispatch({ type: 'retryMapLoad', payload: {} }); app.update(0);
    expect(app.state.worldRevision).toBe(revision + 1);
    expect(app.state.mapVisualLoad).toMatchObject({ status: 'loading', message: null });
    expect(app.state.mapVisualLoad!.requestId).not.toBe(request);
    app.endMapVisualLoad(request);
    expect(worldIsFrozen(app.state)).toBe(true);
    app.dispose();
  });

  it('keeps loading state outside saves and ignores a result after leaving for the title', async () => {
    const app = await playingApp();
    const save = JSON.stringify(app.state.gameplay!.saveData);
    const request = app.beginMapVisualLoad(app.state.catalog!.world.maps.camp!);
    app.updateMapVisualProgress(request, { completed: 1, total: 5 });
    expect(JSON.stringify(app.state.gameplay!.saveData)).toBe(save);
    app.setScreen('title');
    expect(app.state.mapVisualLoad).toBeNull();
    app.failMapVisualLoad(request, 'late failure'); app.endMapVisualLoad(request);
    expect(app.state.screen).toBe('title'); expect(app.state.mapVisualLoad).toBeNull();
    app.dispose();
  });
});
