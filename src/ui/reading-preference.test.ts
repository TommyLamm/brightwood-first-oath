import { describe, expect, it } from 'vitest';
import { createReadingPreference } from './reading-preference.js';

describe('device reading size', () => {
  it('persists a chosen size per game while leaving save and other preferences intact', () => {
    const values = new Map([['game:save:v1', 'original save'], ['game:ui:tracked-quest:v1', 'q01']]);
    const storage = { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const state = createReadingPreference('game', storage);
    expect(state.size).toBe('standard');
    state.set('large');
    expect(createReadingPreference('game', storage).size).toBe('large');
    expect(createReadingPreference('other-game', storage).size).toBe('standard');
    state.set('standard');
    expect(createReadingPreference('game', storage).size).toBe('standard');
    expect(values.get('game:save:v1')).toBe('original save');
    expect(values.get('game:ui:tracked-quest:v1')).toBe('q01');
  });

  it('falls back to standard for unrecognized stored values', () => {
    const storage = { getItem: () => 'unexpected', setItem: () => {}, removeItem: () => {} };
    expect(createReadingPreference('game', storage).size).toBe('standard');
  });

  it('supports switching with absent or blocked storage', () => {
    const blocked = () => { throw Error('blocked'); };
    for (const storage of [null, { getItem: blocked, setItem: blocked, removeItem: blocked }]) {
      const state = createReadingPreference('game', storage);
      state.set('large');
      expect(state.size).toBe('large');
      state.set('standard');
      expect(state.size).toBe('standard');
    }
  });
});
