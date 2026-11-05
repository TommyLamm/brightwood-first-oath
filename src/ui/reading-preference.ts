import type { StorageLike } from '../contracts/ports.js';

export type ReadingSize = 'standard' | 'large';

/** Device-local readability choice; independent of character/cloud settings. */
export function createReadingPreference(gameId: string, storage: StorageLike | null) {
  const key = gameId + ':ui:reading-size:v1';
  let size: ReadingSize = 'standard';
  try { if (storage?.getItem(key) === 'large') size = 'large'; } catch { /* Session preference still works. */ }
  return {
    get size(): ReadingSize { return size; },
    set(next: ReadingSize): void {
      size = next;
      try { storage?.setItem(key, next); } catch { /* Keep the in-memory choice. */ }
    },
  };
}
