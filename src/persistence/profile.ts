import type { CharacterSave, GameProfile, SaveData, Settings } from '../contracts/index.js';

export const CHARACTER_SLOT_IDS = ['slot-1', 'slot-2', 'slot-3', 'slot-4'] as const;
export const MAX_CHARACTER_SLOTS = 6;
export const WAREHOUSE_CAPACITY = 24;
export const LEGACY_CHARACTER_ID = 'legacy-1';

export function createEmptyProfile(settings: Settings): GameProfile {
  return {
    activeCharacterId: null,
    slots: CHARACTER_SLOT_IDS.map((slotId) => ({ slotId, characterId: null })),
    characters: {},
    settings: structuredClone(settings),
    warehouse: [],
    deletedCharacter: null,
  };
}

export function cloneProfile(profile: GameProfile): GameProfile {
  return structuredClone(profile);
}

export function characterFromSave(data: SaveData, characterId: string): CharacterSave {
  const { settings: _settings, ...character } = structuredClone(data);
  return { characterId, ...character };
}

/** Deterministic migration: repeated reads never create another character. */
export function profileFromLegacySave(data: SaveData): GameProfile {
  const profile = createEmptyProfile(data.settings);
  profile.activeCharacterId = LEGACY_CHARACTER_ID;
  profile.slots[0]!.characterId = LEGACY_CHARACTER_ID;
  profile.characters[LEGACY_CHARACTER_ID] = characterFromSave(data, LEGACY_CHARACTER_ID);
  return profile;
}

export function activeSaveData(profile: GameProfile): SaveData | null {
  const character = profile.activeCharacterId ? profile.characters[profile.activeCharacterId] : null;
  if (!character) return null;
  const { characterId: _characterId, ...data } = structuredClone(character);
  return { ...data, settings: structuredClone(profile.settings) };
}

/** Changes only the active character. Inactive bags, quests and locations stay intact. */
export function updateActiveCharacter(profile: GameProfile, data: SaveData): GameProfile {
  const next = cloneProfile(profile);
  const id = next.activeCharacterId;
  if (!id || !Object.hasOwn(next.characters, id)) throw new Error('請先選擇角色，再保存進度。');
  next.characters[id] = characterFromSave(data, id);
  next.settings = structuredClone(data.settings);
  return next;
}
