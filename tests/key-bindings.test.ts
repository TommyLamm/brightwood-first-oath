import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KEY_BINDINGS,
  KeyboardInputState,
  findKeyBindingConflict,
  getEffectiveKeyCodes,
  resolveEffectiveBindings,
  type KeyBindings,
} from '../src/app/keyboard.js';

const focused = { focused: true, textInput: false, panels: [] as const };

describe('keyboard binding helpers', () => {
  it('resolves defaults, ignores invalid overrides, and preserves exact duplicate priority', () => {
    expect(resolveEffectiveBindings()).toEqual(DEFAULT_KEY_BINDINGS);

    const overridingDefault = resolveEffectiveBindings({ attack: 'KeyI' });
    expect(overridingDefault.attack).toBe('KeyI');
    expect(overridingDefault.inventory).toBeUndefined();

    const duplicateOverrides = resolveEffectiveBindings({ attack: 'KeyZ', pickup: 'KeyZ' });
    expect(duplicateOverrides.attack).toBeUndefined();
    expect(duplicateOverrides.pickup).toBe('KeyZ');

    const invalid = resolveEffectiveBindings({ attack: 'Control Left', pickup: 'Key-Z' });
    expect(invalid).toEqual(DEFAULT_KEY_BINDINGS);
  });

  it('reports only codes that the resolved action actually receives', () => {
    const defaults = resolveEffectiveBindings();
    expect(getEffectiveKeyCodes('attack', defaults)).toEqual(['ControlLeft', 'ControlRight']);
    expect(getEffectiveKeyCodes('jump', defaults)).toEqual(['AltLeft', 'AltRight']);

    const rightOnly = resolveEffectiveBindings({ attack: 'ControlRight', jump: 'AltRight' });
    expect(getEffectiveKeyCodes('attack', rightOnly)).toEqual(['ControlRight']);
    expect(getEffectiveKeyCodes('jump', rightOnly)).toEqual(['AltRight']);

    const shadowedLegacyBinding = resolveEffectiveBindings({ inventory: 'ControlRight' });
    expect(getEffectiveKeyCodes('inventory', shadowedLegacyBinding)).toEqual([]);
    expect(findKeyBindingConflict(shadowedLegacyBinding, 'attack', 'ControlRight'))
      .toEqual({ action: 'inventory', code: 'ControlRight' });

    const shadowed = resolveEffectiveBindings({ moveLeft: 'ControlRight' });
    expect(getEffectiveKeyCodes('attack', shadowed)).toEqual(['ControlLeft', 'ControlRight']);
    expect(getEffectiveKeyCodes('moveLeft', shadowed)).toEqual(['ControlRight']);

    const legacyMovement = new KeyboardInputState({ moveLeft: 'ControlRight' });
    expect(legacyMovement.keyDown('ControlRight', focused).command)
      .toEqual({ type: 'attack', payload: { skillId: 'basic' } });
    expect(legacyMovement.consumeMovementFrame().moveX).toBe(-1);
  });

  it('rejects Control and Alt alias conflicts in both directions, but allows releasing them', () => {
    const defaults = resolveEffectiveBindings();
    expect(findKeyBindingConflict(defaults, 'inventory', 'ControlRight'))
      .toEqual({ action: 'attack', code: 'ControlRight' });
    expect(findKeyBindingConflict(defaults, 'quests', 'AltRight'))
      .toEqual({ action: 'jump', code: 'AltRight' });

    const rightKeysOccupied = resolveEffectiveBindings({ attack: 'KeyX', inventory: 'ControlRight' });
    expect(findKeyBindingConflict(rightKeysOccupied, 'attack', 'ControlLeft'))
      .toEqual({ action: 'inventory', code: 'ControlRight' });

    const movedAttack = resolveEffectiveBindings({ attack: 'KeyX' });
    expect(findKeyBindingConflict(movedAttack, 'inventory', 'ControlRight')).toBeNull();

    const movedJump = resolveEffectiveBindings({ jump: 'KeyP' });
    expect(findKeyBindingConflict(movedJump, 'quests', 'AltRight')).toBeNull();
  });

  it('allows a same-action right alias without adding a left-side alias', () => {
    const defaults = resolveEffectiveBindings();
    expect(findKeyBindingConflict(defaults, 'attack', 'ControlRight')).toBeNull();
    expect(findKeyBindingConflict(defaults, 'jump', 'AltRight')).toBeNull();

    const attackRight = resolveEffectiveBindings({ attack: 'ControlRight' });
    expect(getEffectiveKeyCodes('attack', attackRight)).toEqual(['ControlRight']);
    expect(findKeyBindingConflict(attackRight, 'inventory', 'ControlLeft')).toBeNull();

    const jumpRight = resolveEffectiveBindings({ jump: 'AltRight' });
    expect(getEffectiveKeyCodes('jump', jumpRight)).toEqual(['AltRight']);
    expect(findKeyBindingConflict(jumpRight, 'quests', 'AltLeft')).toBeNull();
  });

  it('uses newly resolved keys in KeyboardInputState and preserves movement and text-entry behavior', () => {
    const overrides: KeyBindings = { moveLeft: 'KeyA', jump: 'KeyP', attack: 'KeyX' };
    const input = new KeyboardInputState(overrides);

    expect(input.keyDown('KeyX', focused).command)
      .toEqual({ type: 'attack', payload: { skillId: 'basic' } });
    input.keyDown('KeyA', focused);
    input.keyDown('KeyP', focused);
    expect(input.consumeMovementFrame()).toEqual({ moveX: -1, climbY: 0, jumpPressed: true, downHeld: false });

    input.keyDown('KeyA', { ...focused, textInput: true });
    input.keyUp('KeyA');
    expect(input.consumeMovementFrame()).toEqual({ moveX: 0, climbY: 0, jumpPressed: false, downHeld: false });

    const defaults = new KeyboardInputState();
    defaults.keyDown('ArrowLeft', focused);
    expect(defaults.consumeMovementFrame().moveX).toBe(-1);
    expect(defaults.keyDown('ControlRight', focused).command)
      .toEqual({ type: 'attack', payload: { skillId: 'basic' } });
  });
});
