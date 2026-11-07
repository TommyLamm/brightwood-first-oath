import type { SaveData } from '../../src/contracts/index.js';

/** Historical formats predate INT; strip it from test inputs, never from expected migrated data. */
export function legacySaveData(data: SaveData): SaveData {
  const copy=structuredClone(data);delete copy.player.int;return copy;
}
