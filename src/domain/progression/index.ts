import type {
  BagStack,
  DerivedStats,
  EquipmentSlot,
  ErrorCode,
  Id,
  PlayerProgress,
  Result,
  Reward,
  RulesCatalog,
} from '../../contracts/index.js';
import { playerLearnableIds } from '../../content/rules/index.js';

const BAG_CAPACITY = 32;
const COIN_CAP = 9_999_999;

export type ProgressAction =
  | { type: 'gainReward'; reward: Reward }
  | { type: 'addItem'; stack: BagStack }
  | { type: 'removeItems'; items: BagStack[] }
  | { type: 'buy'; itemId: Id; quantity: number }
  | { type: 'sell'; bagIndex: number; quantity: number }
  | { type: 'equip'; bagIndex: number }
  | { type: 'unequip'; slot: EquipmentSlot }
  | { type: 'useItem'; itemId: Id }
  | { type: 'allocateAp'; stat: 'str' | 'dex'; amount: number }
  | { type: 'learnSkill'; skillId: Id }
  | { type: 'spendMp'; amount: number }
  | { type: 'damage'; amount: number }
  | { type: 'restore'; hp: number; mp: number }
  | { type: 'changeJob' }
  | { type: 'setLevelFloor'; level: number };

function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

function failure<T>(code: ErrorCode, message: string): Result<T> {
  return { ok: false, code, message };
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function clonePlayer(player: PlayerProgress): PlayerProgress {
  return {
    ...player,
    skillRanks: { ...player.skillRanks },
    bag: player.bag.map((stack) => ({ ...stack })),
    equipment: { ...player.equipment },
  };
}

/** Validate and normalize a name before passing it to createPlayer. */
export function validatePlayerName(name: string): Result<string> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || /[\u0000-\u001f\u007f]/u.test(trimmed)) {
    return failure('INVALID', '角色名稱不可空白或包含控制字元。');
  }
  return success(trimmed);
}

/** Caller should pass the normalized value returned by validatePlayerName. */
export function createPlayer(name: string, rules: RulesCatalog): PlayerProgress {
  const player: PlayerProgress = {
    name,
    job: 'beginner',
    level: 1,
    exp: 0,
    str: 12,
    dex: 4,
    ap: 0,
    sp: 0,
    hp: 80,
    mp: 40,
    coins: 120,
    skillRanks: {},
    bag: [
      { itemId: 'small-red', quantity: 10 },
      { itemId: 'small-blue', quantity: 5 },
    ],
    equipment: { weapon: 'starter-sword', body: 'cloth-shirt', hat: null },
  };
  const stats = deriveStats(player, rules);
  player.hp = stats.maxHp;
  player.mp = stats.maxMp;
  return player;
}

export function deriveStats(player: PlayerProgress, rules: RulesCatalog): DerivedStats {
  const vitality = rules.skills.vitality;
  const vitalityRank =
    player.job === 'swordsman' && vitality !== undefined && player.level >= vitality.requiredLevel
      ? Math.max(0, player.skillRanks.vitality ?? 0)
      : 0;
  let weaponAttack = 0;
  let equipmentDefense = 0;
  let equipmentHp = 0;

  for (const [slot, itemId] of Object.entries(player.equipment)) {
    if (itemId === null) continue;
    const item = rules.items[itemId];
    if (item === undefined || item.slot !== slot) continue;
    weaponAttack += item.attack;
    equipmentDefense += item.defense;
    equipmentHp += item.hpBonus;
  }

  return {
    maxHp: 80 + 20 * (player.level - 1) + 12 * vitalityRank + equipmentHp,
    maxMp: 40 + 2 * (player.level - 1),
    attack: 3 + 2 * player.str + weaponAttack,
    defense: Math.floor(player.dex / 5) + equipmentDefense,
  };
}

export function countItem(player: PlayerProgress, itemId: Id): number {
  return player.bag.reduce(
    (total, stack) => total + (stack.itemId === itemId ? stack.quantity : 0),
    0,
  );
}

function validateBag(player: PlayerProgress, rules: RulesCatalog): Result<void> {
  if (player.bag.length > BAG_CAPACITY) {
    return failure('INVALID', '背包資料超過 32 格。');
  }
  for (const stack of player.bag) {
    const item = rules.items[stack.itemId];
    if (item === undefined) return failure('NOT_FOUND', `找不到物品：${stack.itemId}。`);
    if (!isPositiveInteger(stack.quantity) || stack.quantity > item.stackLimit) {
      return failure('INVALID', `物品「${item.name}」的堆疊數量無效。`);
    }
  }
  for (const [slot, itemId] of Object.entries(player.equipment)) {
    if (itemId === null) continue;
    const item = rules.items[itemId];
    if (item === undefined) return failure('NOT_FOUND', `找不到裝備：${itemId}。`);
    if (item.slot !== slot) return failure('INVALID', `裝備「${item.name}」的欄位不正確。`);
  }
  return success(undefined);
}

function validatePlayer(player: PlayerProgress, rules: RulesCatalog): Result<void> {
  if (
    !Number.isSafeInteger(player.level) || player.level < 1 ||
    player.level > rules.progression.maxLevel ||
    !Number.isSafeInteger(player.exp) || player.exp < 0 ||
    !Number.isSafeInteger(player.str) || player.str < 0 ||
    !Number.isSafeInteger(player.dex) || player.dex < 0 ||
    !Number.isSafeInteger(player.ap) || player.ap < 0 ||
    !Number.isSafeInteger(player.sp) || player.sp < 0 ||
    !Number.isSafeInteger(player.coins) || player.coins < 0 || player.coins > COIN_CAP ||
    !isFiniteNonNegative(player.hp) || !isFiniteNonNegative(player.mp)
  ) {
    return failure('INVALID', '角色數值無效，無法套用成長操作。');
  }
  if (player.job !== 'beginner' && player.job !== 'swordsman') {
    return failure('INVALID', '角色職業資料無效。');
  }
  const stats = deriveStats(player, rules);
  if (
    !Number.isSafeInteger(stats.maxHp) || !Number.isSafeInteger(stats.maxMp) ||
    !Number.isSafeInteger(stats.attack) || !Number.isSafeInteger(stats.defense) ||
    player.hp > stats.maxHp || player.mp > stats.maxMp
  ) {
    return failure('INVALID', '角色衍生能力或目前 HP／MP 無效。');
  }
  if (player.level === rules.progression.maxLevel) {
    if (player.exp !== 0) return failure('INVALID', '已達最高等級，經驗值必須為 0。');
  } else {
    const threshold = rules.progression.expToNext[player.level];
    if (!Number.isSafeInteger(threshold) || threshold <= 0 || player.exp >= threshold) {
      return failure('INVALID', '角色經驗值超出目前等級範圍。');
    }
  }
  for (const [skillId, rank] of Object.entries(player.skillRanks)) {
    const skill = rules.skills[skillId];
    if (
      skill === undefined ||
      !playerLearnableIds.some((learnableId) => learnableId === skillId) ||
      !Number.isSafeInteger(rank) || rank < 1 || rank > skill.maxRank ||
      player.job !== 'swordsman' || player.level < skill.requiredLevel
    ) {
      return failure('INVALID', `技能「${skillId}」的等級資料無效。`);
    }
  }
  return validateBag(player, rules);
}

function addStacksToDraft(
  player: PlayerProgress,
  stacks: BagStack[],
  rules: RulesCatalog,
): Result<void> {
  const validated = stacks.map((stack) => {
    const item = rules.items[stack.itemId];
    if (item === undefined) return failure<never>('NOT_FOUND', `找不到物品：${stack.itemId}。`);
    if (!isPositiveInteger(stack.quantity)) {
      return failure<never>('INVALID', '新增物品數量必須是正整數。');
    }
    return success({ item, quantity: stack.quantity });
  });
  const invalid = validated.find((entry) => !entry.ok);
  if (invalid !== undefined && !invalid.ok) return invalid;

  for (const entry of validated) {
    if (!entry.ok) continue;
    let remaining = entry.value.quantity;
    for (const stack of player.bag) {
      if (stack.itemId !== entry.value.item.id || stack.quantity >= entry.value.item.stackLimit) continue;
      const amount = Math.min(remaining, entry.value.item.stackLimit - stack.quantity);
      stack.quantity += amount;
      remaining -= amount;
      if (remaining === 0) break;
    }
    while (remaining > 0) {
      if (player.bag.length >= BAG_CAPACITY) return failure('BAG_FULL', '背包空間不足。');
      const amount = Math.min(remaining, entry.value.item.stackLimit);
      player.bag.push({ itemId: entry.value.item.id, quantity: amount });
      remaining -= amount;
    }
  }
  return success(undefined);
}

function removeStacksFromDraft(player: PlayerProgress, stacks: BagStack[], rules: RulesCatalog): Result<void> {
  const required = new Map<Id, number>();
  for (const stack of stacks) {
    if (rules.items[stack.itemId] === undefined) {
      return failure('NOT_FOUND', `找不到物品：${stack.itemId}。`);
    }
    if (!isPositiveInteger(stack.quantity)) {
      return failure('INVALID', '移除物品數量必須是正整數。');
    }
    const next = (required.get(stack.itemId) ?? 0) + stack.quantity;
    if (!Number.isSafeInteger(next)) return failure('INVALID', '移除物品總數過大。');
    required.set(stack.itemId, next);
  }
  for (const [itemId, quantity] of required) {
    if (countItem(player, itemId) < quantity) {
      return failure('NOT_FOUND', `背包中的「${rules.items[itemId].name}」數量不足。`);
    }
  }
  for (const [itemId, quantity] of required) {
    let remaining = quantity;
    for (let index = player.bag.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const stack = player.bag[index];
      if (stack.itemId !== itemId) continue;
      const amount = Math.min(remaining, stack.quantity);
      stack.quantity -= amount;
      remaining -= amount;
      if (stack.quantity === 0) player.bag.splice(index, 1);
    }
  }
  return success(undefined);
}

function clampVitals(player: PlayerProgress, rules: RulesCatalog): void {
  const stats = deriveStats(player, rules);
  player.hp = Math.min(player.hp, stats.maxHp);
  player.mp = Math.min(player.mp, stats.maxMp);
}

function fullRestore(player: PlayerProgress, rules: RulesCatalog): void {
  const stats = deriveStats(player, rules);
  player.hp = stats.maxHp;
  player.mp = stats.maxMp;
}

function advanceLevel(player: PlayerProgress): Result<void> {
  const nextAp = player.ap + 5;
  const nextSp = player.job === 'swordsman' ? player.sp + 1 : player.sp;
  if (!Number.isSafeInteger(nextAp) || !Number.isSafeInteger(nextSp)) {
    return failure('INVALID', '升級點數超過安全整數範圍。');
  }
  player.level += 1;
  player.ap = nextAp;
  player.sp = nextSp;
  return success(undefined);
}

function gainExperience(player: PlayerProgress, exp: number, rules: RulesCatalog): Result<boolean> {
  if (!Number.isSafeInteger(exp) || exp < 0) {
    return failure('INVALID', '經驗獎勵必須是非負整數。');
  }
  if (player.level >= rules.progression.maxLevel) {
    player.exp = 0;
    return success(false);
  }
  const totalExp = player.exp + exp;
  if (!Number.isSafeInteger(totalExp)) return failure('INVALID', '經驗值總數過大。');
  player.exp = totalExp;
  let leveledUp = false;
  while (player.level < rules.progression.maxLevel) {
    const threshold = rules.progression.expToNext[player.level];
    if (!Number.isSafeInteger(threshold) || threshold <= 0) {
      return failure('INVALID', '升級經驗曲線缺少有效門檻。');
    }
    if (player.exp < threshold) break;
    player.exp -= threshold;
    const advanced = advanceLevel(player);
    if (!advanced.ok) return advanced;
    leveledUp = true;
  }
  if (player.level >= rules.progression.maxLevel) player.exp = 0;
  if (leveledUp) fullRestore(player, rules);
  return success(leveledUp);
}

function applyReward(player: PlayerProgress, reward: Reward, rules: RulesCatalog): Result<void> {
  if (
    !Number.isSafeInteger(reward.coins) || reward.coins < 0 ||
    !Number.isSafeInteger(reward.exp) || reward.exp < 0
  ) {
    return failure('INVALID', '獎勵金幣與經驗必須是非負整數。');
  }
  const nextCoins = player.coins + reward.coins;
  if (!Number.isSafeInteger(nextCoins) || nextCoins > COIN_CAP) {
    return failure('INVALID', '獎勵會使金幣超過上限。');
  }
  const addResult = addStacksToDraft(player, reward.items, rules);
  if (!addResult.ok) return addResult;
  player.coins = nextCoins;
  const expResult = gainExperience(player, reward.exp, rules);
  if (!expResult.ok) return expResult;
  return success(undefined);
}

function resultWithPlayer(player: PlayerProgress, result: Result<void>): Result<PlayerProgress> {
  return result.ok ? success(player) : result;
}

export function applyProgressAction(
  player: PlayerProgress,
  action: ProgressAction,
  rules: RulesCatalog,
): Result<PlayerProgress> {
  const valid = validatePlayer(player, rules);
  if (!valid.ok) return valid;
  const draft = clonePlayer(player);
  switch (action.type) {
    case 'addItem':
      return resultWithPlayer(draft, addStacksToDraft(draft, [action.stack], rules));
    case 'removeItems':
      return resultWithPlayer(draft, removeStacksFromDraft(draft, action.items, rules));
    case 'buy': {
      const item = rules.items[action.itemId];
      if (item === undefined) return failure('NOT_FOUND', `找不到物品：${action.itemId}。`);
      if (!isPositiveInteger(action.quantity) || action.quantity > 99) {
        return failure('INVALID', '商店數量必須是 1 至 99 的整數。');
      }
      if (
        !['weapon', 'body', 'hat', 'consumable'].includes(item.kind) ||
        item.buyPrice <= 0
      ) {
        return failure('REQUIREMENT', `「${item.name}」不可購買。`);
      }
      const total = item.buyPrice * action.quantity;
      if (!Number.isSafeInteger(total)) return failure('INVALID', '購買金額無效。');
      if (draft.coins < total) return failure('INSUFFICIENT_COINS', `金幣不足：需要 ${total.toLocaleString('en-US')}，目前持有 ${draft.coins.toLocaleString('en-US')}。`);
      const added = addStacksToDraft(draft, [{ itemId: item.id, quantity: action.quantity }], rules);
      if (!added.ok) return added;
      draft.coins -= total;
      return success(draft);
    }
    case 'sell': {
      if (!Number.isSafeInteger(action.bagIndex) || action.bagIndex < 0 || action.bagIndex >= draft.bag.length) {
        return failure('NOT_FOUND', '找不到指定的背包格。');
      }
      if (!isPositiveInteger(action.quantity)) return failure('INVALID', '出售數量必須是正整數。');
      const stack = draft.bag[action.bagIndex];
      const item = rules.items[stack.itemId];
      if (action.quantity > stack.quantity) return failure('NOT_FOUND', '背包中的物品數量不足。');
      if (item.kind === 'quest' || item.sellPrice <= 0) {
        return failure('REQUIREMENT', `「${item.name}」不可出售。`);
      }
      const proceeds = item.sellPrice * action.quantity;
      const nextCoins = draft.coins + proceeds;
      if (!Number.isSafeInteger(nextCoins) || nextCoins > COIN_CAP) {
        return failure('INVALID', '出售後金幣會超過上限。');
      }
      stack.quantity -= action.quantity;
      if (stack.quantity === 0) draft.bag.splice(action.bagIndex, 1);
      draft.coins = nextCoins;
      return success(draft);
    }
    case 'equip': {
      if (!Number.isSafeInteger(action.bagIndex) || action.bagIndex < 0 || action.bagIndex >= draft.bag.length) {
        return failure('NOT_FOUND', '找不到指定的背包格。');
      }
      const stack = draft.bag[action.bagIndex];
      const item = rules.items[stack.itemId];
      if (item.slot === null) return failure('REQUIREMENT', `「${item.name}」不是裝備。`);
      if (player.level < item.minLevel) return failure('REQUIREMENT', `需要等級 ${item.minLevel} 才能裝備。`);
      const slot = item.slot;
      const previousItemId = draft.equipment[slot];
      const removed = removeStacksFromDraft(draft, [{ itemId: item.id, quantity: 1 }], rules);
      if (!removed.ok) return removed;
      draft.equipment[slot] = item.id;
      if (previousItemId !== null) {
        const returned = addStacksToDraft(draft, [{ itemId: previousItemId, quantity: 1 }], rules);
        if (!returned.ok) return returned;
      }
      clampVitals(draft, rules);
      return success(draft);
    }
    case 'unequip': {
      if (!['weapon', 'body', 'hat'].includes(action.slot)) {
        return failure('INVALID', '裝備欄位無效。');
      }
      const itemId = draft.equipment[action.slot];
      if (itemId === null) return failure('NOT_FOUND', '該裝備欄目前是空的。');
      draft.equipment[action.slot] = null;
      const returned = addStacksToDraft(draft, [{ itemId, quantity: 1 }], rules);
      if (!returned.ok) return returned;
      clampVitals(draft, rules);
      return success(draft);
    }
    case 'useItem': {
      const item = rules.items[action.itemId];
      if (item === undefined) return failure('NOT_FOUND', `找不到物品：${action.itemId}。`);
      if (item.kind !== 'consumable') return failure('REQUIREMENT', `「${item.name}」不能使用。`);
      if (draft.hp <= 0) return failure('DEAD', '倒下時不能使用藥水。');
      const stats = deriveStats(draft, rules);
      const nextHp = Math.min(stats.maxHp, draft.hp + item.restoreHp);
      const nextMp = Math.min(stats.maxMp, draft.mp + item.restoreMp);
      if (nextHp === draft.hp && nextMp === draft.mp) {
        return failure('REQUIREMENT', '目前 HP 與 MP 已滿，藥水沒有恢復效果。');
      }
      const removed = removeStacksFromDraft(draft, [{ itemId: item.id, quantity: 1 }], rules);
      if (!removed.ok) return removed;
      draft.hp = nextHp;
      draft.mp = nextMp;
      return success(draft);
    }
    case 'allocateAp': {
      if (action.stat !== 'str' && action.stat !== 'dex') {
        return failure('INVALID', 'AP 只能分配到 STR 或 DEX。');
      }
      if (!isPositiveInteger(action.amount)) return failure('INVALID', 'AP 分配量必須是正整數。');
      if (action.amount > draft.ap) return failure('REQUIREMENT', '可用 AP 不足。');
      const nextValue = draft[action.stat] + action.amount;
      if (!Number.isSafeInteger(nextValue)) return failure('INVALID', '能力值超過安全整數範圍。');
      draft[action.stat] = nextValue;
      draft.ap -= action.amount;
      return success(draft);
    }
    case 'learnSkill': {
      const skill = rules.skills[action.skillId];
      if (skill === undefined) return failure('NOT_FOUND', `找不到技能：${action.skillId}。`);
      if (!playerLearnableIds.some((id) => id === action.skillId)) {
        return failure('REQUIREMENT', `「${skill.name}」不能由玩家學習。`);
      }
      if (draft.job !== 'swordsman' || skill.requiredJob !== 'swordsman') {
        return failure('REQUIREMENT', '只有劍士可以學習這項技能。');
      }
      if (draft.level < skill.requiredLevel) return failure('REQUIREMENT', `需要等級 ${skill.requiredLevel} 才能學習。`);
      if (draft.sp < 1) return failure('REQUIREMENT', '可用 SP 不足。');
      const rank = draft.skillRanks[action.skillId] ?? 0;
      if (rank >= skill.maxRank) return failure('REQUIREMENT', '技能已達最高等級。');
      draft.skillRanks[action.skillId] = rank + 1;
      draft.sp -= 1;
      clampVitals(draft, rules);
      return success(draft);
    }
    case 'spendMp':
      if (!isFiniteNonNegative(action.amount)) return failure('INVALID', 'MP 消耗量必須是有限非負數。');
      if (draft.mp < action.amount) return failure('NO_MP', 'MP 不足。');
      draft.mp -= action.amount;
      return success(draft);
    case 'damage':
      if (!isFiniteNonNegative(action.amount)) return failure('INVALID', '傷害必須是有限非負數。');
      draft.hp = Math.max(0, draft.hp - action.amount);
      return success(draft);
    case 'restore': {
      if (!isFiniteNonNegative(action.hp) || !isFiniteNonNegative(action.mp)) {
        return failure('INVALID', '恢復量必須是有限非負數。');
      }
      const stats = deriveStats(draft, rules);
      draft.hp = Math.min(stats.maxHp, draft.hp + action.hp);
      draft.mp = Math.min(stats.maxMp, draft.mp + action.mp);
      return success(draft);
    }
    case 'changeJob':
      if (draft.job !== 'beginner') return failure('REQUIREMENT', '此角色已完成轉職。');
      if (draft.level < 10) return failure('REQUIREMENT', '需要等級 10 才能轉職。');
      if (!Number.isSafeInteger(draft.sp + 1)) return failure('INVALID', '技能點數超過安全整數範圍。');
      draft.job = 'swordsman';
      draft.sp += 1;
      fullRestore(draft, rules);
      return success(draft);
    case 'setLevelFloor': {
      if (!Number.isSafeInteger(action.level) || action.level < 1 || action.level > rules.progression.maxLevel) {
        return failure('INVALID', '任務等級下限無效。');
      }
      if (action.level <= draft.level) return success(draft);
      while (draft.level < action.level) {
        const advanced = advanceLevel(draft);
        if (!advanced.ok) return advanced;
      }
      draft.exp = 0;
      fullRestore(draft, rules);
      return success(draft);
    }
    case 'gainReward':
      return resultWithPlayer(draft, applyReward(draft, action.reward, rules));
    default: {
      const exhaustive: never = action;
      return failure('INVALID', `不支援的成長操作：${String(exhaustive)}。`);
    }
  }
}
