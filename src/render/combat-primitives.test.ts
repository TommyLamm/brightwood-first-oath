import { describe, expect, it } from 'vitest';
import type { Telegraph } from '../contracts/types.js';
import {
  DAMAGE_NUMBER_LIFETIME_MS,
  damageNumberGeometry,
  formatDamageNumber,
  isDamageNumberEvent,
  monsterHealthBarGeometry,
  telegraphCueGeometry,
} from './combat-primitives.js';

describe('renderer combat primitives', () => {
  it('anchors ordinary and boss HP bars above their displayed bodies and clamps HP ratio', () => {
    expect(monsterHealthBarGeometry({ x: 100, y: 300 }, 25, 100, 96, 96, false)).toEqual({
      x: 52,
      y: 194,
      width: 96,
      height: 6,
      fillX: 53,
      fillY: 195,
      fillWidth: 23.5,
      fillHeight: 4,
      ratio: 0.25,
    });

    const bossBar = monsterHealthBarGeometry({ x: 500, y: 300 }, 7000, 6000, 56, 80, true);
    expect(bossBar).toMatchObject({ x: 430, y: 206, width: 140, height: 8, ratio: 1, fillWidth: 138 });
    expect(monsterHealthBarGeometry({ x: 0, y: 0 }, -1, 0, 20, 20, false).ratio).toBe(0);
  });

  it('uses telegraph resolve time and AI windup to advance a timed boss warning', () => {
    const telegraph: Telegraph = {
      id: 'guardian:telegraph:1000',
      sourceId: 'guardian-entity',
      kind: 'rect',
      rect: { x: 200, y: 140, width: 80, height: 100 },
      resolveAtMs: 1500,
    };

    expect(telegraphCueGeometry(telegraph, 1250, 1000, true)).toMatchObject({
      remainingMs: 250,
      progress: 0.5,
      progressWidth: 40,
      borderWidth: 3,
    });
    expect(telegraphCueGeometry(telegraph, 1250, undefined, true)?.progressWidth).toBeNull();
    expect(telegraphCueGeometry(telegraph, 1500, 1000, true)).toBeNull();
  });

  it('floats and fades damage labels on snapshot time, including monster-hit events', () => {
    const middle = damageNumberGeometry({ x: 20, y: 100 }, 1000, 1450);
    expect(middle).toEqual({ x: 20, y: 62, alpha: 1, scale: 1 });
    expect(damageNumberGeometry({ x: 20, y: 100 }, 1000, 1000)?.scale).toBeGreaterThan(1);
    expect(damageNumberGeometry({ x: 20, y: 100 }, 1000, 1000 - 1)).toBeNull();
    expect(damageNumberGeometry({ x: 20, y: 100 }, 1000, 1000 + DAMAGE_NUMBER_LIFETIME_MS)).toBeNull();
    expect(isDamageNumberEvent('damage')).toBe(true);
    expect(isDamageNumberEvent('hit')).toBe(true);
    expect(isDamageNumberEvent('levelup')).toBe(false);
    expect(formatDamageNumber(23.6)).toBe('24');
    expect(formatDamageNumber(undefined)).toBe('命中');
  });
});
