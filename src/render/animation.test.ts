import { describe, expect, it } from 'vitest';
import type { MovementState } from '../contracts/types.js';
import {
  claimVisualEventPlayback,
  pickAnimationFrame,
  pickSkillEffectFrame,
  selectHeroAnimation,
  selectMonsterAnimation,
  skillAnimationDuration,
  visualEventEffectKey,
} from './animation.js';

function movement(overrides: Partial<MovementState> = {}): MovementState {
  return {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    facing: 1,
    mode: 'grounded',
    footholdId: null,
    ladderId: null,
    dropThroughUntilMs: 0,
    knockbackUntilMs: 0,
    ...overrides,
  };
}

describe('renderer animation selection', () => {
  it('prioritizes dead, hurt, and attack over locomotion', () => {
    expect(selectHeroAnimation(movement({ mode: 'dead', knockbackUntilMs: 1000 }), 10, 0, true)).toBe('dead');
    expect(selectHeroAnimation(movement({ knockbackUntilMs: 1000 }), 10, 0, true)).toBe('hurt');
    expect(selectHeroAnimation(movement({ velocity: { x: 1, y: 0 } }), 10, 0, true)).toBe('attack');
  });

  it('selects locomotion from the current movement mode and velocity', () => {
    expect(selectHeroAnimation(movement({ mode: 'climbing' }), 10, 0, false)).toBe('climb');
    expect(selectHeroAnimation(movement({ mode: 'airborne', velocity: { x: 0, y: -1 } }), 10, 0, false)).toBe('jump');
    expect(selectHeroAnimation(movement({ velocity: { x: 0.11, y: 0 } }), 10, 0, false)).toBe('walk');
    expect(selectHeroAnimation(movement({ velocity: { x: 0.1, y: 0 } }), 10, 0, false)).toBe('idle');
    expect(selectHeroAnimation(movement(), 10, 0, false, 'buff')).toBe('buff');
  });

  it('selects monster actions from snapshot AI mode, knockback, and movement state', () => {
    const base = { monsterId: 'snail', movement: movement() };
    expect(selectMonsterAnimation({ ...base, mode: 'dead' }, 0, true)).toBe('snail:dead');
    expect(selectMonsterAnimation({ ...base, mode: 'windup', movement: movement({ knockbackUntilMs: 1000 }) }, 0, true)).toBe('snail:hurt');
    expect(selectMonsterAnimation({ ...base, mode: 'windup' }, 0, true)).toBe('snail:attack');
    expect(selectMonsterAnimation({ ...base, mode: 'chase' }, 0, false)).toBe('snail:walk');
    expect(selectMonsterAnimation({ ...base, mode: 'idle' }, 0, false)).toBe('snail:idle');
  });

  it('selects the Bell Keeper attack strip from its pending skill and idles during its phase transition', () => {
    const base = { monsterId: 'ruins-bell-keeper', movement: movement() };
    expect(selectMonsterAnimation({ ...base, mode: 'windup', pendingSkillId: 'ruins-bell-sweep' }, 0, true))
      .toBe('ruins-bell-keeper:attack-sweep');
    expect(selectMonsterAnimation({ ...base, mode: 'recovery', pendingSkillId: 'ruins-bell-slam' }, 0, true))
      .toBe('ruins-bell-keeper:attack');
    expect(selectMonsterAnimation({ ...base, mode: 'phase-transition', pendingSkillId: null }, 0, true))
      .toBe('ruins-bell-keeper:idle');
  });

  it('maps attack frames across the complete skill duration', () => {
    const totalDurationMs = skillAnimationDuration({ windupMs: 120, activeMs: 180, recoveryMs: 300 });
    const animation = {
      frames: [0, 1, 2, 3, 4, 5],
      frameMs: [100, 100, 100, 100, 100, 100],
      loop: false,
    };

    expect(totalDurationMs).toBe(600);
    expect(pickAnimationFrame(animation, 0, 0, totalDurationMs)).toBe(0);
    expect(pickAnimationFrame(animation, 300, 0, totalDurationMs)).toBe(3);
    expect(pickAnimationFrame(animation, totalDurationMs, 0, totalDurationMs)).toBe(5);
  });

  it('starts skill VFX at the hit window and keeps the authored frame tempo', () => {
    const animation = { frames: [0, 1, 2, 3, 4, 5], frameMs: [60, 60, 60, 60, 60, 60], loop: false };

    expect(pickSkillEffectFrame(animation, 219, 0, 220)).toBeNull();
    expect(pickSkillEffectFrame(animation, 220, 0, 220)).toBe(0);
    expect(pickSkillEffectFrame(animation, 280, 0, 220)).toBe(1);
    expect(pickSkillEffectFrame(animation, 579, 0, 220)).toBe(5);
    expect(pickSkillEffectFrame(animation, 580, 0, 220)).toBeNull();
  });
});

describe('visual event playback', () => {
  it('claims each event id once for the renderer lifetime', () => {
    const playedIds = new Set<string>();

    expect(claimVisualEventPlayback('event-1', playedIds)).toBe(true);
    expect(claimVisualEventPlayback('event-1', playedIds)).toBe(false);
    expect(claimVisualEventPlayback('event-2', playedIds)).toBe(true);
    expect(playedIds.size).toBe(2);
  });

  it('uses the event key or the matching delivered VFX for common visual events', () => {
    expect(visualEventEffectKey({ kind: 'hit' }, 'vfx:guard')).toBe('vfx:hit');
    expect(visualEventEffectKey({ kind: 'damage' }, 'vfx:guard')).toBe('vfx:hit');
    expect(visualEventEffectKey({ kind: 'levelup' }, 'vfx:guard')).toBe('vfx:levelup');
    expect(visualEventEffectKey({ kind: 'buff' }, 'vfx:guard')).toBe('vfx:guard');
    expect(visualEventEffectKey({ kind: 'pickup' }, 'vfx:guard')).toBeUndefined();
    expect(visualEventEffectKey({ kind: 'hit', key: 'vfx:sweep' }, 'vfx:guard')).toBe('vfx:sweep');
  });
});
