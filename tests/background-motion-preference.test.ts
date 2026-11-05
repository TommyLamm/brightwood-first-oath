import { describe, expect, it } from 'vitest';
import { createBackgroundMotionPreference } from '../src/app/background-motion-preference.js';

describe('background motion device choice', () => {
  it('uses the system default until explicitly chosen, then preserves that override per game', () => {
    const values = new Map([['game:save:v1', 'original save']]);
    const storage = { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    expect(createBackgroundMotionPreference('game', storage, false).enabled).toBe(false);
    expect(createBackgroundMotionPreference('game', storage, true).enabled).toBe(true);
    createBackgroundMotionPreference('game', storage, false).set(true);
    expect(createBackgroundMotionPreference('game', storage, false).enabled).toBe(true);
    expect(createBackgroundMotionPreference('other-game', storage, false).enabled).toBe(false);
    expect(values.get('game:save:v1')).toBe('original save');
    values.set('game:ui:background-motion:v1', 'unknown');
    expect(createBackgroundMotionPreference('game', storage, false).enabled).toBe(false);
  });
  it('keeps session choices usable with absent or blocked storage', () => {
    const blocked = () => { throw Error('blocked'); };
    for (const storage of [null, { getItem: blocked, setItem: blocked, removeItem: blocked }]) {
      const preference = createBackgroundMotionPreference('game', storage, false);
      preference.set(true); expect(preference.enabled).toBe(true);
      preference.set(false); expect(preference.enabled).toBe(false);
    }
  });
});
