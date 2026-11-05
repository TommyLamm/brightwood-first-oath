import { describe, expect, it } from 'vitest';
import type { DropState } from '../src/contracts/ports.js';
import { findPickupTarget } from '../src/app/pickup-target.js';
import { createInitialAppState, createUiSnapshot } from '../src/app/state.js';
import { startNewGame, stepGameplay } from '../src/app/gameplay.js';
import { contextHint } from '../src/ui/context-hint.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createPlayer } from '../src/domain/progression/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const position = { x: 100, y: 600 };
const select = (drops: DropState[], nowMs = 100) => findPickupTarget(drops, position, nowMs, createPlayer('旅人', rulesCatalog), rulesCatalog);
const coin = (id: string, x: number, expiresAtMs = 1000): DropState => ({
  id, itemId: null, quantity: 0, coins: 7, position: { x, y: 600 }, expiresAtMs,
});
function playingState() {
  const initial = createInitialAppState(72, 'pickup-hint');
  const started = startNewGame('旅人', catalog, initial.nextEntityId);
  if ('error' in started) throw new Error(started.error);
  started.gameplay.monsters = [];
  started.gameplay.movement = { ...started.gameplay.movement, position };
  return { ...initial, screen: 'playing' as const, gameTimeMs: 100, catalog, gameplay: started.gameplay };
}

describe('pickup targets and reminders', () => {
  it('selects the nearest live drop in the inclusive circular range with a stable tie', () => {
    expect(select([coin('edge', 190)])?.drop.id).toBe('edge');
    expect(select([coin('far', 191), { ...coin('diagonal', 170), position: { x: 170, y: 670 } }])).toBeNull();
    expect(select([coin('z', 110), coin('far', 120), coin('a', 90)])?.drop.id).toBe('a');
  });

  it('excludes a drop at its exact expiry even when it is the closest', () => {
    expect(select([coin('old', 100, 100), coin('live', 105, 101)])?.drop.id).toBe('live');
    expect(select([coin('old', 100, 100)])).toBeNull();
  });

  it('names the selected item and quantity without changing the save', () => {
    const state = playingState();
    const item = Object.values(rulesCatalog.items)[0]!;
    state.gameplay.drops = [{ ...coin('item', 105), itemId: item.id, quantity: 3, coins: 0 }];
    const save = JSON.stringify(state.gameplay.saveData);
    expect(createUiSnapshot(state)?.pickupHint).toEqual({ targetKey: 'pickup:item', label: item.name + ' × 3', blockedMessage: null });
    state.gameplay.drops = [coin('coins', 105)];
    expect(createUiSnapshot(state)?.pickupHint?.label).toBe('7 金幣');
    expect(JSON.stringify(state.gameplay.saveData)).toBe(save);
  });

  it('hides the reminder outside gameplay, behind panels and while awaiting resume', () => {
    const state = playingState();
    state.gameplay.drops = [coin('coins', 105)];
    expect(createUiSnapshot({ ...state, screen: 'paused' })?.pickupHint).toBeNull();
    expect(createUiSnapshot({ ...state, panels: ['inventory'] })?.pickupHint).toBeNull();
    expect(createUiSnapshot({ ...state, focusResumeRequired: true })?.pickupHint).toBeNull();
  });

  it('uses the custom pickup binding, after interactions and before movement reminders', () => {
    const pickupHint = { targetKey: 'pickup:coins', label: '7 金幣' };
    const movementHint = { kind: 'drop' as const, targetKey: 'drop:platform' };
    expect(contextHint({ pickupHint, movementHint }, () => 'P')).toEqual({
      targetKey: 'pickup:coins', text: 'P 拾取：7 金幣｜按住連續拾取',
    });
    expect(contextHint({ pickupHint, interactionHint: { targetKey: 'npc:guide', kind: 'npc', label: '森芽', blockedMessage: null } }, () => 'E')?.targetKey).toBe('npc:guide');
  });

  it('the command collects the advertised live target and never rewards an expired one', () => {
    const state = playingState();
    state.gameplay.drops = [coin('expired', 100, 100), coin('live', 105, 1000)];
    expect(createUiSnapshot(state)?.pickupHint?.targetKey).toBe('pickup:live');
    const coins = state.gameplay.saveData.player.coins;
    const next = stepGameplay(state.gameplay, { catalog, commands: [{ seq: 1, type: 'pickup', payload: {} }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false }, dtSeconds: 0,
      nowMs: 100, random: state.random, nextEntityId: state.nextEntityId }).gameplay!;
    expect(next.saveData.player.coins).toBe(coins + 7);
    expect(next.drops).toEqual([]);
    expect(next.nextPickupAtMs).toBe(250);
  });
});
