import type { ContentCatalog, GameProfile, Result } from '../contracts/index.js';
import { failure, success } from '../contracts/helpers.js';
import { validatePlayerName } from '../domain/progression/index.js';
import { MAX_CHARACTER_SLOTS, WAREHOUSE_CAPACITY } from './profile.js';
import { prepareProfile } from './validate.js';

export type ProfileAction =
  | { type: 'rename'; characterId: string; name: string }
  | { type: 'delete'; characterId: string; confirmation: string }
  | { type: 'restore' }
  | { type: 'purge'; confirmation: string }
  | { type: 'expand' }
  | { type: 'transfer'; characterId: string; from: 'bag' | 'warehouse'; index: number; itemId: string; quantity: number };

/** One cloned profile is committed only after the whole transaction validates. */
export function applyProfileAction(profile: GameProfile, action: ProfileAction, catalog: ContentCatalog): Result<GameProfile> {
  const next = structuredClone(profile);
  next.warehouse ??= [];
  next.deletedCharacter ??= null;
  if ('characterId' in action && !Object.hasOwn(next.characters, action.characterId)) return failure('NOT_FOUND', '找不到這個角色。');
  if (action.type === 'rename') {
    const character = next.characters[action.characterId];
    if (!character) return failure('NOT_FOUND', '找不到這個角色。');
    const name = validatePlayerName(action.name);
    if (!name.ok) return name;
    character.player.name = name.value;
  } else if (action.type === 'delete') {
    const character = next.characters[action.characterId];
    if (!character || action.confirmation !== character.player.name) return failure('REQUIREMENT', '請輸入角色完整名稱確認刪除。');
    if (next.deletedCharacter) return failure('REQUIREMENT', '請先恢復或清除上一名已刪角色，避免覆蓋備份。');
    next.deletedCharacter = character;
    delete next.characters[action.characterId];
    for (const slot of next.slots) if (slot.characterId === action.characterId) slot.characterId = null;
    if (next.activeCharacterId === action.characterId) next.activeCharacterId = null;
  } else if (action.type === 'restore') {
    const character = next.deletedCharacter;
    const slot = next.slots.find((entry) => entry.characterId === null);
    if (!character || !slot) return failure('REQUIREMENT', '恢復角色需要一個空欄位。');
    if (Object.hasOwn(next.characters, character.characterId)) return failure('INVALID', '角色已存在，不能重複恢復。');
    next.characters[character.characterId] = character;
    slot.characterId = character.characterId;
    next.deletedCharacter = null;
  } else if (action.type === 'purge') {
    if (!next.deletedCharacter || action.confirmation !== next.deletedCharacter.player.name) return failure('REQUIREMENT', '請輸入已刪角色完整名稱確認永久清除。');
    next.deletedCharacter = null;
  } else if (action.type === 'expand') {
    if (next.slots.length >= MAX_CHARACTER_SLOTS) return failure('REQUIREMENT', '角色欄位已達六個。');
    next.slots.push({ slotId: `slot-${next.slots.length + 1}`, characterId: null });
  } else {
    const character = next.characters[action.characterId];
    if (!character || !Number.isSafeInteger(action.index) || action.index < 0
      || !Number.isSafeInteger(action.quantity) || action.quantity < 1
      || (action.from !== 'bag' && action.from !== 'warehouse')) return failure('INVALID', '物品轉移資料無效。');
    const source = action.from === 'bag' ? character.player.bag : next.warehouse;
    const target = action.from === 'bag' ? next.warehouse : character.player.bag;
    const stack = source[action.index];
    const item = catalog.rules.items[action.itemId];
    if (!stack || stack.itemId !== action.itemId || stack.quantity < action.quantity || !item) return failure('REQUIREMENT', '物品已變動，請重新選擇。');
    if (item.kind === 'quest') return failure('REQUIREMENT', '任務專用物品不能放入共享倉庫。');
    let remaining = action.quantity;
    for (const entry of target) {
      if (entry.itemId !== stack.itemId) continue;
      const amount = Math.min(remaining, item.stackLimit - entry.quantity);
      entry.quantity += amount;
      remaining -= amount;
    }
    const capacity = action.from === 'bag' ? WAREHOUSE_CAPACITY : 32;
    while (remaining > 0) {
      if (target.length >= capacity) return failure('BAG_FULL', action.from === 'bag' ? '共享倉庫已滿（24格）。' : '角色背包已滿（32格）。');
      const amount = Math.min(remaining, item.stackLimit);
      target.push({ itemId: stack.itemId, quantity: amount });
      remaining -= amount;
    }
    stack.quantity -= action.quantity;
    if (stack.quantity === 0) source.splice(action.index, 1);
  }
  const prepared = prepareProfile(next, catalog);
  return prepared.ok ? success(prepared.value.data) : prepared;
}
