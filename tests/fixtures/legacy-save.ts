import type { GameProfile, SaveData } from '../../src/contracts/index.js';

/** Formats 1–5 predate INT and LUK. Only strip them from historical test inputs. */
export function legacySaveData(data: SaveData): SaveData {
  const copy = structuredClone(data);
  delete copy.player.int;
  delete copy.player.luk;
  return copy;
}

/** Preserve the roster and its progress while constructing the actual format 6–8 shape. */
export function legacyProfileData(profile: GameProfile, format: 6 | 7 | 8): GameProfile {
  const copy = structuredClone(profile);
  delete copy.warehouse;
  delete copy.deletedCharacter;
  for (const { player } of Object.values(copy.characters)) {
    delete player.luk;
    if (format === 6) delete player.int;
  }
  return copy;
}
