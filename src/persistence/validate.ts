import type { ContentCatalog, GameProfile, Id, Result, SaveData, Settings } from '../contracts/index.js';
import { failure, success } from '../contracts/helpers.js';
import { playerLearnableIds } from '../content/rules/index.js';
import { canEquipForJob, isPlayerJob } from '../content/rules/jobs.js';
import { deriveStats } from '../domain/progression/index.js';
import { CHARACTER_SLOT_IDS, characterFromSave, profileFromLegacySave } from './profile.js';
import { questForPlayer } from '../content/world/class-quests.js';
import { isSpecialization, specializations } from '../content/rules/specializations.js';
import { MAX_CHARACTER_SLOTS, WAREHOUSE_CAPACITY } from './profile.js';

type JsonRecord = Record<string, unknown>;
export type PreparedSave = { data: SaveData; repaired: boolean; repairMessage?: string };

const SAVE_FORMAT = 9;
export const READABLE_SAVE_FORMATS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const MAX_BYTES = 64 * 1024;
const WARNING_BYTES = 48 * 1024;
const BAG_CAPACITY = 32;
const COIN_CAP = 9_999_999;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function hasExactKeys(value: JsonRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isSafeInteger(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

function isFiniteNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function fail(message: string): Result<PreparedSave> {
  return failure('INVALID', message);
}

function normalizeSettings(raw: unknown): Result<Settings> {
  if (!isRecord(raw) || !hasExactKeys(raw, ['masterVolume', 'musicVolume', 'sfxVolume', 'muted', 'bindings'])
    || !isFiniteNumber(raw.masterVolume, 0, 1) || !isFiniteNumber(raw.musicVolume, 0, 1)
    || !isFiniteNumber(raw.sfxVolume, 0, 1) || typeof raw.muted !== 'boolean' || !isRecord(raw.bindings)) {
    return failure('INVALID', '設定資料無效。');
  }
  if (Object.keys(raw.bindings).length > 64) return failure('INVALID', '自訂按鍵數量超出 64 個。');
  const bindings: Record<string, string> = {};
  for (const [action, code] of Object.entries(raw.bindings)) {
    if (action.trim().length === 0 || action.length > 64 || typeof code !== 'string' || code.length === 0 || code.length > 64
      || /[\u0000-\u001f\u007f]/u.test(action) || /[\u0000-\u001f\u007f]/u.test(code)) {
      return failure('INVALID', `按鍵設定 ${action} 無效。`);
    }
    Object.defineProperty(bindings, action, { value: code, enumerable: true, writable: true, configurable: true });
  }
  return success({ masterVolume: raw.masterVolume, musicVolume: raw.musicVolume,
    sfxVolume: raw.sfxVolume, muted: raw.muted, bindings });
}

function jsonMetrics(value: unknown): { bytes: number; error: string | null } {
  const ancestors = new Set<object>();
  let validationError: string | null = null;

  const inspect = (entry: unknown, depth: number): void => {
    if (validationError) return;
    if (depth > 32) {
      validationError = '存檔 JSON 深度不可超過 32 層。';
      return;
    }
    if (entry === null || typeof entry === 'string' || typeof entry === 'boolean') return;
    if (typeof entry === 'number') {
      if (!Number.isFinite(entry)) validationError = '存檔不可包含 NaN 或無限值。';
      return;
    }
    if (typeof entry !== 'object') {
      validationError = '存檔只能包含 JSON 支援的值。';
      return;
    }
    if (ancestors.has(entry)) {
      validationError = '存檔不可包含循環參照。';
      return;
    }
    const prototype = Object.getPrototypeOf(entry);
    if (!isUnknownArray(entry) && prototype !== Object.prototype && prototype !== null) {
      validationError = '存檔只能包含一般 JSON 物件。';
      return;
    }
    ancestors.add(entry);
    if (isUnknownArray(entry)) {
      for (const item of entry) inspect(item, depth + 1);
    } else {
      for (const item of Object.values(entry)) inspect(item, depth + 1);
    }
    ancestors.delete(entry);
  };

  try {
    inspect(value, 1);
  } catch {
    return { bytes: 0, error: '存檔資料無法安全讀取。' };
  }
  if (validationError) return { bytes: 0, error: validationError };
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return { bytes: 0, error: '存檔無法序列化成 JSON。' };
    const bytes = new TextEncoder().encode(serialized).byteLength;
    return bytes > MAX_BYTES
      ? { bytes, error: `存檔超過 64 KiB 上限（${bytes} bytes）。` }
      : { bytes, error: null };
  } catch {
    return { bytes: 0, error: '存檔無法序列化成 JSON。' };
  }
}

function cloneSave(data: SaveData): SaveData {
  return {
    player: {
      ...data.player,
      skillRanks: { ...data.player.skillRanks },
      bag: data.player.bag.map((stack) => ({ ...stack })),
      equipment: { ...data.player.equipment },
    },
    quests: Object.fromEntries(Object.entries(data.quests).map(([questId, state]) => [questId, {
      status: state.status,
      counters: { ...state.counters },
    }])),
    visitedMaps: [...data.visitedMaps],
    location: { ...data.location },
    flags: { ...data.flags },
    settings: { ...data.settings, bindings: { ...data.settings.bindings } },
  };
}

function normalizeSave(raw: unknown, catalog: ContentCatalog, legacy = false): Result<PreparedSave> {
  const metrics = jsonMetrics(raw);
  if (metrics.error) return fail(metrics.error);
  if (!isRecord(raw) || !hasExactKeys(raw, ['player', 'quests', 'visitedMaps', 'location', 'flags', 'settings'])) {
    return fail('角色進度欄位不符。');
  }
  if (!isRecord(raw.player) || !hasExactKeys(raw.player, [
    'name', 'job', 'level', 'exp', 'str', 'dex', 'ap', 'sp', 'hp', 'mp', 'coins', 'skillRanks', 'bag', 'equipment',
    ...(!legacy && Object.hasOwn(raw.player, 'plannedJob') ? ['plannedJob'] : []),
    ...(!legacy && Object.hasOwn(raw.player, 'int') ? ['int'] : []),
    ...(!legacy && Object.hasOwn(raw.player, 'luk') ? ['luk'] : []),
    ...(!legacy && Object.hasOwn(raw.player, 'specialization') ? ['specialization'] : []),
    ...(!legacy && Object.hasOwn(raw.player, 'advancedSkillEquipped') ? ['advancedSkillEquipped'] : []),
  ])) return fail('角色存檔結構無效。');

  const player = raw.player;
  const intelligence = Object.hasOwn(player, 'int') ? player.int : 4;
  const luck = Object.hasOwn(player, 'luk') ? player.luk : 0;
  if (!isSafeInteger(luck, 0)) return fail('LUK必須是非負整數。');
  if (Object.hasOwn(player, 'specialization') && (!isSpecialization(player.specialization)
    || specializations[player.specialization].job !== player.job || !isSafeInteger(player.level, 20))) return fail('二轉分支或等級無效。');
  if (Object.hasOwn(player, 'advancedSkillEquipped') && (typeof player.advancedSkillEquipped !== 'boolean'
    || !isSpecialization(player.specialization))) return fail('二轉技能槽資料無效。');
  if (!isSafeInteger(intelligence, 0)) return fail('INT 必須是範圍內的整數。');
  if (typeof player.name !== 'string' || player.name.trim().length === 0 || /[\u0000-\u001f\u007f]/u.test(player.name)) {
    return fail('角色名稱無效。');
  }
  if (player.job !== 'beginner' && (!isPlayerJob(player.job) || (legacy && player.job !== 'swordsman'))) return fail('角色職業無效。');
  if (Object.hasOwn(player, 'plannedJob') && (!isPlayerJob(player.plannedJob)
    || (player.job !== 'beginner' && player.plannedJob !== player.job))) return fail('角色訓練路線無效。');
  const route: Pick<SaveData['player'], 'job' | 'plannedJob'> = {
    job: player.job, ...(isPlayerJob(player.plannedJob) ? { plannedJob: player.plannedJob } : {}),
  };
  if (!isSafeInteger(player.level, 1, catalog.rules.progression.maxLevel)
    || !isSafeInteger(player.exp, 0)
    || !isSafeInteger(player.str, 0)
    || !isSafeInteger(player.dex, 0)
    || !isSafeInteger(player.ap, 0)
    || !isSafeInteger(player.sp, 0)
    || !isSafeInteger(player.hp, 0)
    || !isSafeInteger(player.mp, 0)
    || !isSafeInteger(player.coins, 0, COIN_CAP)) return fail('角色數值必須是範圍內的有限整數。');

  const levelsGained = player.level - 1;
  const spentAp = player.str + player.dex + intelligence + luck - 20;
  if (spentAp < 0 || player.ap + spentAp !== levelsGained * 5) return fail('角色 AP 與能力值總量不一致。');
  if (player.job === 'beginner' && player.sp !== 0) return fail('初心者不可持有職業 SP。');
  const earnedSp = player.job !== 'beginner' ? Math.max(0, player.level - 9) : 0;
  if (player.sp > earnedSp) return fail('角色 SP 超出已取得總量。');

  const nextThreshold = catalog.rules.progression.expToNext[player.level];
  if (player.level === catalog.rules.progression.maxLevel) {
    if (player.exp !== 0) return fail('最高等級經驗值必須為 0。');
  } else if (!isSafeInteger(nextThreshold, 1) || player.exp >= nextThreshold) {
    return fail('角色經驗值超出目前等級範圍。');
  }

  if (!isRecord(player.skillRanks)) return fail('技能等級資料結構無效。');
  let spentSp = 0;
  const skillRanks: Record<Id, number> = {};
  for (const [skillId, rank] of Object.entries(player.skillRanks)) {
    const skill = catalog.rules.skills[skillId];
    if (!skill || !playerLearnableIds.some((learnableId) => learnableId === skillId)) {
      return failure('NOT_FOUND', `存檔引用未知或不可學技能：${skillId}。`);
    }
    if (!isSafeInteger(rank, 1, skill.maxRank) || skill.requiredJob !== player.job
      || player.level < skill.requiredLevel) {
      return fail(`技能 ${skillId} 的職業、等級或 rank 不合法。`);
    }
    spentSp += rank;
    skillRanks[skillId] = rank;
  }
  if (spentSp + player.sp > earnedSp) return fail('技能 rank 與剩餘 SP 超出已取得總量。');

  if (!isUnknownArray(player.bag) || player.bag.length > BAG_CAPACITY) return fail('背包格數超出 32 格。');
  const bag: SaveData['player']['bag'] = [];
  for (const stack of player.bag) {
    if (!isRecord(stack) || !hasExactKeys(stack, ['itemId', 'quantity']) || typeof stack.itemId !== 'string') {
      return fail('背包堆疊結構無效。');
    }
    const item = catalog.rules.items[stack.itemId];
    if (!item) return failure('NOT_FOUND', `存檔引用未知物品：${stack.itemId}。`);
    if (!isSafeInteger(stack.quantity, 1, item.stackLimit)) return fail(`物品 ${stack.itemId} 的堆疊數量無效。`);
    bag.push({ itemId: stack.itemId, quantity: stack.quantity });
  }

  if (!isRecord(player.equipment) || !hasExactKeys(player.equipment, ['weapon', 'body', 'hat'])) {
    return fail('裝備欄位結構無效。');
  }
  const equipment: SaveData['player']['equipment'] = { weapon: null, body: null, hat: null };
  for (const slot of ['weapon', 'body', 'hat'] as const) {
    const itemId = player.equipment[slot];
    if (itemId === null) continue;
    if (typeof itemId !== 'string') return fail(`裝備欄 ${slot} 的物品 ID 無效。`);
    const item = catalog.rules.items[itemId];
    if (!item) return failure('NOT_FOUND', `存檔引用未知裝備：${itemId}。`);
    if (item.slot !== slot || item.stackLimit !== 1 || player.level < item.minLevel || !canEquipForJob(route, item)) {
      return fail(`裝備 ${itemId} 的欄位或等級不合法。`);
    }
    equipment[slot] = itemId;
  }

  const playerData: SaveData['player'] = {
    name: player.name,
    job: player.job,
    ...(isPlayerJob(player.plannedJob) ? { plannedJob: player.plannedJob } : {}),
    level: player.level,
    exp: player.exp,
    str: player.str,
    dex: player.dex,
    int: intelligence,
    luk: luck,
    ...(isSpecialization(player.specialization) ? { specialization: player.specialization,
      advancedSkillEquipped: player.advancedSkillEquipped === true } : {}),
    ap: player.ap,
    sp: player.sp,
    hp: player.hp,
    mp: player.mp,
    coins: player.coins,
    skillRanks,
    bag,
    equipment,
  };
  const limits = deriveStats(playerData, catalog.rules);
  if (player.hp > limits.maxHp || player.mp > limits.maxMp) return fail('角色 HP 或 MP 超過上限。');

  if (!isUnknownArray(raw.visitedMaps)) return fail('已訪地圖資料結構無效。');
  const visitedMaps: Id[] = [];
  const visited = new Set<Id>();
  for (const mapId of raw.visitedMaps) {
    if (typeof mapId !== 'string' || !catalog.world.maps[mapId]) return failure('NOT_FOUND', `存檔引用未知地圖：${String(mapId)}。`);
    if (visited.has(mapId)) return fail(`已訪地圖重複：${mapId}。`);
    visited.add(mapId);
    visitedMaps.push(mapId);
  }

  if (!isRecord(raw.quests)) return fail('任務存檔結構無效。');
  const quests: SaveData['quests'] = {};
  for (const [questId, state] of Object.entries(raw.quests)) {
    const base = catalog.world.quests[questId];
    const definition = base ? questForPlayer(base, playerData, catalog.rules.items) : undefined;
    if (!definition) return failure('NOT_FOUND', `存檔引用未知任務：${questId}。`);
    if (!isRecord(state) || !hasExactKeys(state, ['status', 'counters'])
      || (state.status !== 'active' && state.status !== 'claimed') || !isRecord(state.counters)) {
      return fail(`任務 ${questId} 狀態結構無效。`);
    }
    const counters: Record<Id, number> = {};
    for (const [targetId, value] of Object.entries(state.counters)) {
      const objectives = definition.objectives.filter((objective) =>
        (objective.type === 'kill' || objective.type === 'reach' || objective.type === 'inspect')
        && objective.targetId === targetId);
      const maximum = objectives.reduce((result, objective) => Math.max(result, objective.count), 0);
      if (maximum === 0 || !isSafeInteger(value, 0, maximum)) return fail(`任務 ${questId} 的計數器 ${targetId} 無效。`);
      counters[targetId] = value;
    }
    quests[questId] = { status: state.status, counters };
  }
  for (const [questId, state] of Object.entries(quests)) {
    const definition = questForPlayer(catalog.world.quests[questId]!, playerData, catalog.rules.items);
    if (definition.prerequisiteIds.some((id) => quests[id]?.status !== 'claimed')) {
      return fail(`任務 ${questId} 尚有未完成前置，無法套用此存檔。`);
    }
    if (state.status === 'claimed') {
      const incompleteTrackedObjective = definition.objectives.some((objective) => {
        if (objective.type === 'kill') return (state.counters[objective.targetId] ?? 0) < objective.count;
        if (objective.type === 'reach') return !visited.has(objective.targetId)
          && (state.counters[objective.targetId] ?? 0) < objective.count;
        if (objective.type === 'inspect') return (state.counters[objective.targetId] ?? 0) < objective.count;
        return false;
      });
      if (incompleteTrackedObjective) return fail(`已領取任務 ${questId} 的目標紀錄不完整。`);
    }
  }

  if (!isRecord(raw.location) || !hasExactKeys(raw.location, ['mapId', 'spawnId'])
    || typeof raw.location.mapId !== 'string' || typeof raw.location.spawnId !== 'string') {
    return fail('位置資料結構無效。');
  }
  let location: SaveData['location'] = { mapId: raw.location.mapId, spawnId: raw.location.spawnId };
  let repairMessage: string | undefined;
  const locationMap = catalog.world.maps[location.mapId];
  if (!locationMap) return failure('NOT_FOUND', `存檔位置引用未知地圖：${location.mapId}。`);
  if (!locationMap.spawns.some((spawn) => spawn.id === location.spawnId)) {
    if (!locationMap.spawns.some((spawn) => spawn.id === 'left')) return fail(`地圖 ${location.mapId} 缺少安全 left 出生點。`);
    location = { mapId: location.mapId, spawnId: 'left' };
    repairMessage = `位置出生點已修復至 ${location.mapId}/left。`;
  }

  if (!isRecord(raw.flags) || !hasExactKeys(raw.flags, ['bossDefeated', 'chapterComplete'])
    || typeof raw.flags.bossDefeated !== 'boolean' || typeof raw.flags.chapterComplete !== 'boolean') {
    return fail('主線旗標資料無效。');
  }
  const settings = normalizeSettings(raw.settings);
  if (!settings.ok) return settings;

  const data: SaveData = {
    player: playerData,
    quests,
    visitedMaps,
    location,
    flags: { bossDefeated: raw.flags.bossDefeated, chapterComplete: raw.flags.chapterComplete },
    settings: settings.value,
  };
  const canonicalMetrics = jsonMetrics(data);
  if (canonicalMetrics.error) return fail(canonicalMetrics.error);
  return success({ data, repaired: repairMessage !== undefined, repairMessage });
}

export function validateSave(raw: unknown, catalog: ContentCatalog): Result<SaveData> {
  const normalized = normalizeSave(raw, catalog);
  return normalized.ok ? success(normalized.value.data) : normalized;
}

export { MAX_BYTES as MAX_SAVE_BYTES, WARNING_BYTES as SAVE_WARNING_BYTES, SAVE_FORMAT as SAVE_FORMAT_VERSION };

export function prepareSave(raw: unknown, catalog: ContentCatalog): Result<PreparedSave> {
  return normalizeSave(raw, catalog);
}

export function cloneSaveData(data: SaveData): SaveData {
  return cloneSave(data);
}

export function measureSaveData(data: SaveData): { bytes: number; error: string | null } {
  return jsonMetrics(data);
}

export type PreparedProfile = { data: GameProfile; repaired: boolean; repairMessage?: string };

/** Formats 1–5 are single-character; 6 and 7 are profiles with distinct player contracts. */
export function prepareProfile(raw: unknown, catalog: ContentCatalog, formatVersion = SAVE_FORMAT): Result<PreparedProfile> {
  if (!READABLE_SAVE_FORMATS.some((format) => format === formatVersion)) return failure('INVALID', '存檔格式不相容。');
  if (formatVersion <= 5) {
    const legacy = normalizeSave(raw, catalog, true);
    if (!legacy.ok) return legacy;
    const data = profileFromLegacySave(legacy.value.data);
    const metrics = jsonMetrics(data);
    if (metrics.error) return failure('INVALID', metrics.error);
    return success({ ...legacy.value, data });
  }
  const metrics = jsonMetrics(raw);
  if (metrics.error) return failure('INVALID', metrics.error);
  if (!isRecord(raw) || !hasExactKeys(raw, ['activeCharacterId', 'slots', 'characters', 'settings',
    ...(formatVersion >= 9 ? ['warehouse', 'deletedCharacter'] : [])])
    || !isRecord(raw.characters) || !isUnknownArray(raw.slots) || raw.slots.length < CHARACTER_SLOT_IDS.length
    || raw.slots.length > (formatVersion >= 9 ? MAX_CHARACTER_SLOTS : CHARACTER_SLOT_IDS.length)) {
    return failure('INVALID', '角色列表結構無效。');
  }
  const ids = new Set<string>();
  const slots: GameProfile['slots'] = [];
  for (const [index, slot] of raw.slots.entries()) {
    if (!isRecord(slot) || !hasExactKeys(slot, ['slotId', 'characterId']) || slot.slotId !== `slot-${index + 1}`) {
      return failure('INVALID', '角色欄位順序或數量無效。');
    }
    if (slot.characterId !== null) {
      if (typeof slot.characterId !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/u.test(slot.characterId)
        || ids.has(slot.characterId) || !Object.hasOwn(raw.characters, slot.characterId)) {
        return failure('INVALID', '角色 ID 無效、重複或找不到資料。');
      }
      ids.add(slot.characterId);
    }
    slots.push({ slotId: `slot-${index + 1}`, characterId: slot.characterId });
  }
  if (Object.keys(raw.characters).length !== ids.size) return failure('INVALID', '角色資料沒有對應欄位。');
  if (raw.activeCharacterId !== null && (typeof raw.activeCharacterId !== 'string' || !ids.has(raw.activeCharacterId))) {
    return failure('INVALID', '目前角色 ID 找不到對應資料；原件保留，請重新載入有效存檔。');
  }
  const characters: GameProfile['characters'] = {};
  const repairs: string[] = [];
  const settings = normalizeSettings(raw.settings);
  if (!settings.ok) return settings;
  if (formatVersion >= 9 && raw.deletedCharacter !== null && (!isRecord(raw.deletedCharacter)
    || typeof raw.deletedCharacter.characterId !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/u.test(raw.deletedCharacter.characterId)
    || ids.has(raw.deletedCharacter.characterId))) return failure('INVALID', '已刪角色備份無效。');
  const deletedId = formatVersion >= 9 && isRecord(raw.deletedCharacter) ? raw.deletedCharacter.characterId as string : null;
  let deletedCharacter: GameProfile['deletedCharacter'] = null;
  for (const id of [...ids, ...(deletedId ? [deletedId] : [])]) {
    const character = id === deletedId ? raw.deletedCharacter : raw.characters[id];
    if (!isRecord(character) || !hasExactKeys(character, ['characterId', 'player', 'quests', 'visitedMaps', 'location', 'flags'])
      || character.characterId !== id) return failure('INVALID', '角色資料 ID 與欄位不一致。');
    const { characterId: _id, ...progress } = character;
    if (!isRecord(progress.player)) return failure('INVALID', '角色資料結構無效。');
    if (formatVersion === 6 && (Object.hasOwn(progress.player, 'int')
      || progress.player.job === 'mage' || progress.player.plannedJob === 'mage')) {
      return failure('INVALID', '格式6不可包含法師或INT資料。');
    }
    if (formatVersion < 8 && (progress.player.job === 'rogue' || progress.player.plannedJob === 'rogue')) {
      return failure('INVALID', '舊格式不可包含盜賊資料。');
    }
    if (formatVersion >= 7 && !Object.hasOwn(progress.player, 'int')) return failure('INVALID', '格式7以上缺少INT資料。');
    if (formatVersion < 9 && ['luk', 'specialization', 'advancedSkillEquipped'].some((key) => Object.hasOwn(progress.player as JsonRecord, key))) return failure('INVALID', '舊格式不可包含二轉或LUK資料。');
    if (formatVersion >= 9 && !Object.hasOwn(progress.player, 'luk')) return failure('INVALID', '格式9缺少LUK資料。');
    const prepared = normalizeSave({ ...progress, settings: raw.settings }, catalog);
    if (!prepared.ok) return prepared;
    const normalized = characterFromSave(prepared.value.data, id);
    if (id === deletedId) deletedCharacter = normalized;
    else characters[id] = normalized;
    if (prepared.value.repairMessage) repairs.push(`${id}: ${prepared.value.repairMessage}`);
  }
  const warehouse: NonNullable<GameProfile['warehouse']> = [];
  if (formatVersion >= 9) {
    if (!isUnknownArray(raw.warehouse) || raw.warehouse.length > WAREHOUSE_CAPACITY) return failure('INVALID', '共享倉庫最多24格。');
    for (const stack of raw.warehouse) {
      if (!isRecord(stack) || !hasExactKeys(stack, ['itemId', 'quantity']) || typeof stack.itemId !== 'string') return failure('INVALID', '倉庫堆疊資料無效。');
      const item = catalog.rules.items[stack.itemId];
      if (!item || item.kind === 'quest' || !isSafeInteger(stack.quantity, 1, item.stackLimit)) return failure('INVALID', '倉庫物品或數量無效。');
      warehouse.push({ itemId: stack.itemId, quantity: stack.quantity });
    }
  }
  const data: GameProfile = { activeCharacterId: raw.activeCharacterId as string | null, slots, characters, settings: settings.value, warehouse, deletedCharacter };
  const canonical = jsonMetrics(data);
  if (canonical.error) return failure('INVALID', canonical.error);
  return success({ data, repaired: repairs.length > 0, ...(repairs.length ? { repairMessage: repairs.join(' ') } : {}) });
}

export function measureProfile(profile: GameProfile): { bytes: number; error: string | null } {
  return jsonMetrics(profile);
}
