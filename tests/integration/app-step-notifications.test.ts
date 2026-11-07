import { describe, expect, it } from 'vitest';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import { GameApp } from '../../src/app/app.js';
import type { GameAppState } from '../../src/app/state.js';
import { createHeroAnchorFixture, createManifestFixture } from './asset-fixtures.js';

const fetchManifests = async (url: string) => {
  if (url.endsWith('/assets/actors/anchors.json')) {
    return { ok: true, status: 200, json: async () => createHeroAnchorFixture() };
  }
  const pack = url.split('/').at(-2) as AssetPack;
  return { ok: true, status: 200, json: async () => createManifestFixture(pack) };
};

describe('state notifications during fixed steps', () => {
  it('notifies once per step with that step\'s time and gameplay together', async () => {
    const notified: GameAppState[] = [];
    const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, seed: 71, sessionPrefix: 'step-71',
      onStateChange: (state) => notified.push(state) });
    await app.initialize();
    app.dispatch({ type: 'playTemporary', payload: {} });
    app.update(0);
    // The first step after starting records the character's first checkpoint.
    app.update(20);
    notified.length = 0;

    const startedAtMs = app.state.gameTimeMs;
    app.update(50);

    const steps = Math.round((app.state.gameTimeMs - startedAtMs) / (1000 / 60));
    expect(steps).toBeGreaterThan(1);
    expect(notified).toHaveLength(steps);
    expect(new Set(notified.map(({ gameTimeMs }) => gameTimeMs)).size).toBe(steps);
    expect(notified.at(-1)!.gameTimeMs).toBe(app.state.gameTimeMs);
    expect(notified.at(-1)!.gameplay).toBe(app.state.gameplay);
    expect(app.uiSnapshot?.nowMs).toBe(app.state.gameTimeMs);
    app.dispose();
  });
});
