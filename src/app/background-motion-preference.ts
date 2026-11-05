import type { StorageLike } from '../contracts/ports.js';

export function createBackgroundMotionPreference(gameId: string, storage: StorageLike | null, defaultEnabled = true) {
  const key = gameId + ':ui:background-motion:v1';
  let enabled = defaultEnabled;
  try {
    const saved = storage?.getItem(key);
    if (saved === 'follow' || saved === 'still') enabled = saved === 'follow';
  } catch { /* Use the system/session default when storage is blocked. */ }
  return {
    get enabled(): boolean { return enabled; },
    set(next: boolean): void {
      enabled = next;
      try { storage?.setItem(key, next ? 'follow' : 'still'); } catch { /* Keep the session preference. */ }
    },
  };
}
