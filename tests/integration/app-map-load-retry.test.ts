import { describe, expect, it } from 'vitest';
import { shouldAttemptMapVisualLoad } from '../../src/app/map-load-retry.js';

describe('T14 visual map load retry gate', () => {
  it('suppresses repeated failed-map loads but permits map changes and explicit retries', () => {
    const failedMapIds = new Set(['camp']);
    expect(shouldAttemptMapVisualLoad('camp', null, failedMapIds, false)).toBe(false);
    expect(shouldAttemptMapVisualLoad('town', null, failedMapIds, false)).toBe(true);
    expect(shouldAttemptMapVisualLoad('camp', null, failedMapIds, true)).toBe(true);
  });
});
