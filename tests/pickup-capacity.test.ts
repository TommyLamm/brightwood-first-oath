import { describe, expect, it, vi } from 'vitest';
import type { AssetPack } from '../src/contracts/asset-manifest.js';
import type { DropState } from '../src/contracts/ports.js';
import { GameApp } from '../src/app/app.js';
import { startNewGame, stepGameplay } from '../src/app/gameplay.js';
import { createInitialAppState, createUiSnapshot } from '../src/app/state.js';
import { findPickupTarget } from '../src/app/pickup-target.js';
import { contextHint } from '../src/ui/context-hint.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createHeroAnchorFixture, createManifestFixture } from './integration/asset-fixtures.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const fullBag = () => Array.from({ length: 32 }, () => ({ itemId: 'starter-sword', quantity: 1 }));
const loot = (id: string, itemId: string | null, x: number, quantity = 1): DropState => ({
  id, itemId, quantity: itemId ? quantity : 0, coins: itemId ? 0 : 7, position: { x, y: 600 }, expiresAtMs: 10_000,
});
function state() {
  const initial = createInitialAppState(79, 'pickup-capacity');
  const started = startNewGame('旅人', catalog, initial.nextEntityId);
  if ('error' in started) throw Error(started.error);
  started.gameplay.monsters = [];
  started.gameplay.movement.position = { x: 100, y: 600 };
  started.gameplay.saveData.player.bag = fullBag();
  return { ...initial, screen: 'playing' as const, catalog, gameplay: started.gameplay, gameTimeMs: 100 };
}
function collect(current: ReturnType<typeof state>) {
  return stepGameplay(current.gameplay, { catalog, commands: [{ seq: 1, type: 'pickup', payload: {} }],
    input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false }, dtSeconds: 0,
    nowMs: 100, random: current.random, nextEntityId: current.nextEntityId }).gameplay!;
}

describe('pickup capacity feedback', () => {
  it('selects and actually collects nearby coins past a closer item that cannot fit', () => {
    const current = state();
    current.gameplay.drops = [loot('blocked', 'small-red', 102), loot('coins', null, 110)];
    expect(createUiSnapshot(current)?.pickupHint?.targetKey).toBe('pickup:coins');
    const before = current.gameplay.saveData.player.coins;
    const next = collect(current);
    expect(next.saveData.player.coins).toBe(before + 7);
    expect(next.drops.map(drop => drop.id)).toEqual(['blocked']);
    expect(next.saveData.player.bag).toEqual(fullBag());
  });

  it('uses existing stack space and never partially consumes a drop that cannot fully fit', () => {
    const current = state(); const limit = rulesCatalog.items['small-red']!.stackLimit;
    current.gameplay.saveData.player.bag[31] = { itemId: 'small-red', quantity: limit - 1 };
    current.gameplay.drops = [loot('red', 'small-red', 102), loot('coins', null, 110)];
    const target = findPickupTarget(current.gameplay.drops, current.gameplay.movement.position, 100, current.gameplay.saveData.player, rulesCatalog)!;
    expect(target.drop.id).toBe('red'); expect(target.result.ok).toBe(true);
    current.gameplay.drops[0]!.quantity = 2;
    expect(createUiSnapshot(current)?.pickupHint?.targetKey).toBe('pickup:coins');
    const next = collect(current);
    expect(next.saveData.player.bag[31]!.quantity).toBe(limit - 1);
    expect(next.drops[0]).toMatchObject({ id: 'red', quantity: 2 });
    expect(current.gameplay.saveData.player.bag[31]!.quantity).toBe(limit - 1);
  });

  it('shows the blocked reason when nothing fits and keeps the item and player unchanged', () => {
    const current = state(); current.gameplay.drops = [loot('red', 'small-red', 102)];
    const view = createUiSnapshot(current)!;
    expect(view.pickupHint?.blockedMessage).toBe('背包已滿，請先整理空位');
    expect(contextHint(view, () => 'Z')?.text).toContain('背包已滿');
    expect(contextHint(view, () => 'Z')?.text).not.toContain('按住連續拾取');
    const saved = JSON.stringify(current.gameplay.saveData);
    const next = collect(current);
    expect(JSON.stringify(next.saveData)).toBe(saved);
    expect(next.drops).toEqual(current.gameplay.drops);
    expect(next.nextPickupAtMs).toBe(250);
  });

  it('held pickup skips blocked retries, respects panels, and resumes once space is available', async () => {
    let pickups = 0;
    const app = new GameApp({ baseUrl: './', seed: 79, sessionPrefix: 'held-capacity', fetcher: async url => ({
      ok: true, status: 200, json: async () => url.endsWith('/anchors.json') ? createHeroAnchorFixture()
        : createManifestFixture(url.split('/').at(-2) as AssetPack),
    }), onFixedStep: step => { pickups += step.commands.filter(command => command.type === 'pickup').length; } });
    await app.initialize(); app.dispatch({ type: 'playTemporary', payload: {} }); app.update(0);
    app.state.gameplay!.monsters = [];
    app.state.gameplay!.saveData.player.bag = fullBag();
    const x = app.state.gameplay!.movement.position.x;
    app.state.gameplay!.drops = [loot('blocked', 'small-red', x + 2), loot('coins', null, x + 10)];
    const held = vi.spyOn(app, 'isActionHeld').mockImplementation(action => action === 'pickup');
    const run = (count: number) => { for (let n = 0; n < count; n++) app.update(1000 / 60); };
    run(20); expect(pickups).toBe(1);
    app.state.gameplay!.drops.push(loot('coins2', null, x + 10));
    app.dispatch({ type: 'setPanel', payload: { panel: 'inventory' } }); run(20);
    expect(pickups).toBe(1);
    app.dispatch({ type: 'closePanel', payload: {} }); run(2);
    expect(pickups).toBe(2);
    app.state.gameplay!.saveData.player.bag.pop(); run(15);
    expect(pickups).toBe(3); expect(app.state.gameplay!.drops).toEqual([]);
    held.mockRestore(); app.dispose();
  });
});
