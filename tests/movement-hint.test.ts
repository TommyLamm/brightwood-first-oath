import { describe, expect, it } from 'vitest';
import { deriveMovementHint } from '../src/app/movement-hint.js';
import { contextHint } from '../src/ui/context-hint.js';
import { createMovement, stepMovement } from '../src/domain/movement/index.js';
import { createInitialAppState, createUiSnapshot } from '../src/app/state.js';
import { startNewGame } from '../src/app/gameplay.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';

const config = rulesCatalog.movement;
const platform = { id: 'hint-platform', x1: 50, x2: 350, y1: 500, y2: 500, dropThrough: true };
const map = { ...worldCatalog.maps.camp!, npcs: [], portals: [], footholds: [platform],
  ladders: [{ id: 'hint-ladder', x: 100, topY: 400, bottomY: 600 }] };
const keys = { climbUp: 'W', climbDown: 'S', jump: 'Space', interact: 'E', pickup: 'Z' };

describe('contextual movement controls', () => {
  it('uses the same horizontal and vertical ladder range as actual attachment', () => {
    for (const [x, y, allowed] of [[116, 500, true], [117, 500, false], [100, 650, false]] as const) {
      const state = createMovement({ x, y });
      const hint = deriveMovementHint(state, map, config);
      const next = stepMovement(state, { moveX: 0, climbY: -1, jumpPressed: false, downHeld: false }, map, config, 1 / 60, 100);
      expect(hint?.kind === 'climb').toBe(allowed);
      expect(next.mode === 'climbing').toBe(allowed);
    }
  });

  it('only advertises down-jump while standing on a drop-through platform', () => {
    const standing = { ...createMovement({ x: 250, y: 500 }), mode: 'grounded' as const, footholdId: platform.id };
    expect(deriveMovementHint(standing, map, config)).toEqual({ targetKey: 'drop:hint-platform', kind: 'drop' });
    expect(deriveMovementHint({ ...standing, mode: 'airborne' }, map, config)).toBeNull();
    expect(deriveMovementHint(standing, { ...map, footholds: [{ ...platform, dropThrough: false }] }, config)).toBeNull();
    expect(deriveMovementHint({ ...standing, mode: 'dead' }, map, config)).toBeNull();
    expect(deriveMovementHint(standing, undefined, config)).toBeNull();
  });

  it('keeps custom bindings in both climbing and down-jump reminders', () => {
    expect(contextHint({ movementHint: { kind: 'drop', targetKey: 'drop:p' } }, (action) => keys[action])?.text)
      .toBe('S + Space 向下跳落');
    expect(contextHint({ movementHint: { kind: 'climb', targetKey: 'climb:l', attached: true } }, (action) => keys[action])?.text)
      .toBe('W / S 攀爬｜Space 跳離');
  });

  it('gives interactions priority and retains the exact locked-portal explanation', () => {
    const view = { movementHint: { kind: 'climb' as const, targetKey: 'climb:l', attached: false },
      interactionHint: { targetKey: 'portal:p', kind: 'portal' as const, label: '木葉鎮', blockedMessage: '請先回報任務。' } };
    expect(contextHint(view, (action) => keys[action])).toEqual({ targetKey: 'portal:p', text: 'E 前往：木葉鎮｜請先回報任務。' });
    expect(contextHint({ ...view, interactionHint: { ...view.interactionHint, kind: 'npc', label: '森芽', blockedMessage: null } }, (action) => keys[action])?.text)
      .toBe('E 互動：森芽');
    expect(contextHint({}, (action) => keys[action])).toBeNull();
  });

  it('derives from live movement and hides reminders while paused, behind a panel or awaiting resume', () => {
    const catalog = { rules: rulesCatalog, world: { ...worldCatalog, maps: { ...worldCatalog.maps, camp: map } } };
    const initial = createInitialAppState(68, 'movement-hint');
    const started = startNewGame('旅人', catalog, initial.nextEntityId);
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.movement = { ...gameplay.movement, position: { x: 250, y: 500 }, mode: 'grounded', footholdId: platform.id };
    const state = { ...initial, screen: 'playing' as const, catalog, gameplay };
    const saved = JSON.stringify(gameplay.saveData);
    expect(createUiSnapshot(state)?.movementHint?.kind).toBe('drop');
    expect(createUiSnapshot({ ...state, screen: 'paused' })?.movementHint).toBeNull();
    expect(createUiSnapshot({ ...state, panels: ['inventory'] })?.movementHint).toBeNull();
    expect(createUiSnapshot({ ...state, focusResumeRequired: true })?.movementHint).toBeNull();
    gameplay.movement = { ...gameplay.movement, position: { x: 100, y: 500 }, mode: 'climbing', ladderId: 'hint-ladder', footholdId: null };
    expect(createUiSnapshot(state)?.movementHint).toEqual({ targetKey: 'climb:hint-ladder', kind: 'climb', attached: true });
    expect(JSON.stringify(gameplay.saveData)).toBe(saved);
  });
});
