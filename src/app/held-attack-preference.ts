import type { StorageLike } from '../contracts/ports.js';

/** Optional keyboard convenience, local to this device and separate from character progress. */
export function createHeldAttackPreference(gameId: string, storage: StorageLike | null) {
  const key = gameId + ':ui:hold-basic-attack:v1';
  let enabled = false;
  try { enabled = storage?.getItem(key) === 'hold'; } catch { /* The session choice still works. */ }
  return {
    get enabled(): boolean { return enabled; },
    set(next: boolean): void {
      enabled = next;
      try { storage?.setItem(key, next ? 'hold' : 'single'); } catch { /* Keep the session choice. */ }
    },
  };
}
