import type { ContentCatalog, Id, Result, SaveData } from '../contracts/index.js';
import { failure, success } from '../contracts/helpers.js';
import { playerLearnableIds } from '../content/rules/index.js';

type JsonRecord = Record<string, unknown>;
export type PreparedSave = { data: SaveData; repaired: boolean; repairMessage?: string };

const SAVE_FORMAT = 3;
export const READABLE_SAVE_FORMATS = [1, 2, 3] as const;
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

function deriveLimits(player: SaveData['player'], catalog: ContentCatalog): { maxHp: number; maxMp: number } {
  const vitalityRank = player.skillRanks.vitality ?? 0;
  const equipmentHp = Object.values(player.equipment).reduce((total, itemId) =>
    total + (itemId === null ? 0 : catalog.rules.items[itemId]?.hpBonus ?? 0), 0);
  return {
    maxHp: 80 + 20 * (player.level - 1) + 12 * vitalityRank + equipmentHp,
    maxMp: 40 + 2 * (player.level - 1),
  };
}

function normalizeSave(raw: unknown, catalog: ContentCatalog): Result<PreparedSave> {
  const metrics = jsonMetrics(raw);
  if (metrics.error) return fail(metrics.error);
  if (!isRecord(raw) || !hasExactKeys(raw, ['player', 'quests', 'visitedMaps', 'location', 'flags', 'settings'])) {
    return fail('存檔欄位與 format 1 SaveData 不符。');
  }
  if (!isRecord(raw.player) || !hasExactKeys(raw.player, [
    'name', 'job', 'level', 'exp', 'str', 'dex', 'ap', 'sp', 'hp', 'mp', 'coins', 'skillRanks', 'bag', 'equipment',
  ])) return fail('角色存檔結構無效。');

  const player = raw.player;
  if (typeof player.name !== 'string' || player.name.trim().length === 0 || /[\u0000-\u001f\u007f]/u.test(player.name)) {
    return fail('角色名稱無效。');
  }
  if (player.job !== 'beginner' && player.job !== 'swordsman') return fail('角色職業無效。');
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
  const spentAp = player.str + player.dex - 16;
  if (spentAp < 0 || player.ap + spentAp !== levelsGained * 5) return fail('角色 AP 與能力值總量不一致。');
  if (player.job === 'beginner' && player.sp !== 0) return fail('初心者不可持有劍士 SP。');
  const earnedSp = player.job === 'swordsman' ? Math.max(0, player.level - 9) : 0;
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
    if (!isSafeInteger(rank, 1, skill.maxRank) || skill.requiredJob !== 'swordsman'
      || player.job !== 'swordsman' || player.level < skill.requiredLevel) {
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
    if (item.slot !== slot || item.stackLimit !== 1 || player.level < item.minLevel) {
      return fail(`裝備 ${itemId} 的欄位或等級不合法。`);
    }
    equipment[slot] = itemId;
  }

  const playerData: SaveData['player'] = {
    name: player.name,
    job: player.job,
    level: player.level,
    exp: player.exp,
    str: player.str,
    dex: player.dex,
    ap: player.ap,
    sp: player.sp,
    hp: player.hp,
    mp: player.mp,
    coins: player.coins,
    skillRanks,
    bag,
    equipment,
  };
  const limits = deriveLimits(playerData, catalog);
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
    const definition = catalog.world.quests[questId];
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
    const definition = catalog.world.quests[questId]!;
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
  if (locationMap) {
    if (!locationMap.spawns.some((spawn) => spawn.id === location.spawnId)) {
      if (!locationMap.spawns.some((spawn) => spawn.id === 'left')) return fail(`地圖 ${location.mapId} 缺少安全 left 出生點。`);
      location = { mapId: location.mapId, spawnId: 'left' };
      repairMessage = `位置出生點已修復至 ${location.mapId}/left。`;
    }
  } else if (visited.has('town') && catalog.world.maps.town?.spawns.some((spawn) => spawn.id === 'center')) {
    location = { mapId: 'town', spawnId: 'center' };
    repairMessage = '未知地圖位置已修復至 town/center。';
  } else if (catalog.world.maps.camp?.spawns.some((spawn) => spawn.id === 'start')) {
    location = { mapId: 'camp', spawnId: 'start' };
    repairMessage = '未知地圖位置已修復至 camp/start。';
  } else return fail('存檔位置無效，且缺少可用安全出生點。');

  if (!isRecord(raw.flags) || !hasExactKeys(raw.flags, ['bossDefeated', 'chapterComplete'])
    || typeof raw.flags.bossDefeated !== 'boolean' || typeof raw.flags.chapterComplete !== 'boolean') {
    return fail('主線旗標資料無效。');
  }
  if (!isRecord(raw.settings) || !hasExactKeys(raw.settings, ['masterVolume', 'musicVolume', 'sfxVolume', 'muted', 'bindings'])
    || !isFiniteNumber(raw.settings.masterVolume, 0, 1)
    || !isFiniteNumber(raw.settings.musicVolume, 0, 1)
    || !isFiniteNumber(raw.settings.sfxVolume, 0, 1)
    || typeof raw.settings.muted !== 'boolean'
    || !isRecord(raw.settings.bindings)) return fail('設定資料無效。');
  const bindings: Record<string, string> = {};
  if (Object.keys(raw.settings.bindings).length > 64) return fail('自訂按鍵數量超出 64 個。');
  for (const [action, code] of Object.entries(raw.settings.bindings)) {
    if (action.trim().length === 0 || action.length > 64 || typeof code !== 'string' || code.length === 0 || code.length > 64
      || /[\u0000-\u001f\u007f]/u.test(action) || /[\u0000-\u001f\u007f]/u.test(code)) {
      return fail(`按鍵設定 ${action} 無效。`);
    }
    bindings[action] = code;
  }

  const data: SaveData = {
    player: playerData,
    quests,
    visitedMaps,
    location,
    flags: { bossDefeated: raw.flags.bossDefeated, chapterComplete: raw.flags.chapterComplete },
    settings: {
      masterVolume: raw.settings.masterVolume,
      musicVolume: raw.settings.musicVolume,
      sfxVolume: raw.settings.sfxVolume,
      muted: raw.settings.muted,
      bindings,
    },
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
