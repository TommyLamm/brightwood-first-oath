import type { Id, Result, RulesCatalog } from '../../contracts/index.js';
import { questDropByQuest } from './monsters.js';

const approvedItemIds: readonly Id[] = [
  'starter-sword', 'iron-sword', 'steel-sword', 'guardian-sword', 'cloth-shirt', 'leather-vest',
  'iron-mail', 'cloth-cap', 'leather-cap', 'iron-helm', 'small-red', 'large-red', 'small-blue',
  'large-blue', 'snail-shell', 'slime-gel', 'mushroom-cap', 'boar-tusk', 'stone-chip', 'metal-shard',
  'forest-seed', 'spore-sample', 'ridge-emblem', 'guardian-core', 'frost-fang', 'ice-shell',
  'frost-tide-sword', 'amber-scale', 'sunwell-shell', 'sunwell-oathblade', 'moss-ceramic',
  'broken-copper-thread', 'muted-bell-fragment',
];

const approvedSkillIds: readonly Id[] = [
  'basic', 'heavy-strike', 'sweep', 'iron-guard', 'vitality', 'rest-recovery', 'enemy-melee',
  'ruins-carapace-bite', 'guardian-slam', 'frost-crab-charge', 'sunwell-beetle-charge',
  'sand-stinger', 'guardian-wave', 'frost-tusk-slam', 'sunwell-sentinel-slam', 'low-tide-wave',
  'ruins-puppet-slap', 'ruins-prowler-sweep',
];

const approvedMonsterIds: readonly Id[] = [
  'snail', 'slime', 'mushroom', 'boar', 'golem', 'sentinel', 'frost-wolf', 'frost-crab',
  'sand-scorpion', 'sunwell-beetle', 'ruins-moss-carapace', 'guardian', 'sunwell-sentinel',
  'frost-tide-warden', 'ruins-string-puppet', 'ruins-bell-prowler',
];

const invalid = (message: string): Result<RulesCatalog> => ({
  ok: false,
  code: 'INVALID',
  message,
});

const isFiniteNonNegative = (values: readonly number[]): boolean =>
  values.every((value) => Number.isFinite(value) && value >= 0);

const hasMatchingIds = <T extends { id: Id }>(
  definitions: Record<Id, T>,
): boolean =>
  Object.entries(definitions).every(([key, definition]) => key === definition.id);

const hasApprovedIds = <T>(definitions: Record<Id, T>, approvedIds: readonly Id[]): boolean => {
  const ids = Object.keys(definitions);
  return ids.length === approvedIds.length && ids.every((id) => approvedIds.includes(id));
};

export const validateRules = (catalog: RulesCatalog): Result<RulesCatalog> => {
  const itemIds = Object.keys(catalog.items);
  const skillIds = Object.keys(catalog.skills);
  const monsterIds = Object.keys(catalog.monsters);

  if (itemIds.length !== 33) return invalid('items 數量錯誤：預期 33，實際 ' + itemIds.length);
  if (skillIds.length !== 18) return invalid('skills 數量錯誤：預期 18，實際 ' + skillIds.length);
  if (monsterIds.length !== 16) return invalid('monsters 數量錯誤：預期 16，實際 ' + monsterIds.length);
  if (!hasApprovedIds(catalog.items, approvedItemIds)) return invalid('items ID 清單不符核准的 33 件物品');
  if (!hasApprovedIds(catalog.skills, approvedSkillIds)) return invalid('skills ID 清單不符核准的 18 個技能');
  if (!hasApprovedIds(catalog.monsters, approvedMonsterIds)) return invalid('monsters ID 清單不符核准的 16 隻怪物');
  if (!hasMatchingIds(catalog.items)) return invalid('items 定義 id 必須與 Record key 完全相同');
  if (!hasMatchingIds(catalog.skills)) return invalid('skills 定義 id 必須與 Record key 完全相同');
  if (!hasMatchingIds(catalog.monsters)) return invalid('monsters 定義 id 必須與 Record key 完全相同');

  for (const item of Object.values(catalog.items)) {
    const values = [
      item.stackLimit, item.minLevel, item.attack, item.defense, item.hpBonus,
      item.restoreHp, item.restoreMp, item.buyPrice, item.sellPrice,
    ];
    if (!isFiniteNonNegative(values)) return invalid(`物品 ${item.id} 含非有限或負數欄位`);
    if (!Number.isInteger(item.stackLimit) || item.stackLimit < 1) {
      return invalid(`物品 ${item.id} stackLimit 必須是正整數`);
    }
    if (!Number.isInteger(item.minLevel) || item.minLevel < 1 || item.minLevel > catalog.progression.maxLevel) {
      return invalid(`物品 ${item.id} minLevel 超出有效等級`);
    }
    if (![item.buyPrice, item.sellPrice].every(Number.isInteger)) {
      return invalid(`物品 ${item.id} 售價必須是整數`);
    }
    if (item.iconKey !== `item:${item.id}`) return invalid(`物品 ${item.id} iconKey 必須為 item:${item.id}`);

    const expectedSlot = item.kind === 'weapon' || item.kind === 'body' || item.kind === 'hat' ? item.kind : null;
    if (item.slot !== expectedSlot) return invalid(`物品 ${item.id} slot 與 kind 不一致`);
    if (expectedSlot !== null && item.stackLimit !== 1) return invalid(`裝備 ${item.id} stackLimit 必須為 1`);
    if (expectedSlot === null && item.visualKey !== null) return invalid(`非裝備 ${item.id} visualKey 必須為 null`);
    if (item.kind === 'material' && item.buyPrice !== 0) return invalid(`材料 ${item.id} 不可購買`);
    if (item.kind === 'quest' && (item.buyPrice !== 0 || item.sellPrice !== 0)) {
      return invalid(`任務物品 ${item.id} 不可購買或出售`);
    }
  }

  // Bosses are the monsters that never respawn (respawnMs 0). Their guaranteed gear drop is the fight's prize,
  // so the shop must not sell it too.
  for (const monster of Object.values(catalog.monsters)) {
    if (monster.respawnMs !== 0) continue;
    for (const drop of monster.drops) {
      const item = catalog.items[drop.itemId];
      if (item && item.slot !== null && drop.chance >= 1 && item.buyPrice !== 0) {
        return invalid(`首領掉落裝備 ${item.id} 只能從 ${monster.id} 取得，buyPrice 必須為 0`);
      }
    }
  }

  for (const skill of Object.values(catalog.skills)) {
    const values = [
      skill.maxRank, skill.requiredLevel, skill.mpCost, skill.cooldownMs, skill.windupMs,
      skill.activeMs, skill.recoveryMs, skill.reach, skill.height, skill.targets,
      skill.multiplierBase, skill.multiplierPerRank, skill.durationMs, skill.defensePerRank,
      skill.hpPerRank, skill.regenPerRank,
    ];
    if (!isFiniteNonNegative(values)) return invalid(`技能 ${skill.id} 含非有限或負數欄位`);
    if (!Number.isInteger(skill.maxRank) || skill.maxRank < 1) return invalid(`技能 ${skill.id} maxRank 必須是正整數`);
    if (!Number.isInteger(skill.requiredLevel) || skill.requiredLevel < 1 || skill.requiredLevel > catalog.progression.maxLevel) {
      return invalid(`技能 ${skill.id} requiredLevel 超出有效等級`);
    }
    if (![skill.cooldownMs, skill.windupMs, skill.activeMs, skill.recoveryMs, skill.durationMs, skill.targets].every(Number.isInteger)) {
      return invalid(`技能 ${skill.id} 時間與目標欄位必須是整數`);
    }
    if (skill.kind === 'attack') {
      if (skill.activeMs < 1 || skill.reach < 1 || skill.height < 1 || skill.targets < 1 || skill.multiplierBase <= 0) {
        return invalid(`攻擊技能 ${skill.id} 必須有有效窗、範圍、目標及正倍率`);
      }
    } else if (skill.kind === 'buff') {
      if (skill.activeMs !== 0 || skill.targets < 1 || skill.durationMs < 1) {
        return invalid(`增益技能 ${skill.id} 必須以持續時間表示效果，不可設攻擊有效窗`);
      }
    } else if (skill.kind === 'passive') {
      if ([skill.cooldownMs, skill.windupMs, skill.activeMs, skill.recoveryMs, skill.reach, skill.height, skill.targets, skill.durationMs].some((value) => value !== 0)) {
        return invalid(`被動技能 ${skill.id} 的時間、範圍與目標欄位必須為 0`);
      }
      if (skill.hpPerRank === 0 && skill.regenPerRank === 0 && skill.defensePerRank === 0) {
        return invalid(`被動技能 ${skill.id} 缺少具體效果數值`);
      }
    }
  }

  const learnableCount = Object.values(catalog.skills).filter((skill) => skill.requiredJob === 'swordsman').length;
  const enemySkills = Object.values(catalog.skills).filter((skill) => skill.requiredJob === 'enemy');
  if (learnableCount !== 5) return invalid(`可學劍士技能數量錯誤：預期 5，實際 ${learnableCount}`);
  if (enemySkills.length !== 12) return invalid('敵人技能數量錯誤：預期 12，實際 ' + enemySkills.length);
  if (catalog.skills.basic?.requiredJob !== 'any') return invalid('basic 必須存在且可由任意職業使用');
  if (enemySkills.some((skill) => skill.maxRank !== 1 || skill.mpCost !== 0)) {
    return invalid('敵人技能必須 maxRank=1 且 mpCost=0');
  }

  for (const monster of Object.values(catalog.monsters)) {
    const values = [
      monster.level, monster.maxHp, monster.attack, monster.defense, monster.exp, monster.coins,
      monster.speed, monster.width, monster.height, monster.aggroRange, monster.attackRange,
      monster.attackWindupMs, monster.attackCooldownMs, monster.respawnMs,
    ];
    if (!isFiniteNonNegative(values)) return invalid(`怪物 ${monster.id} 含非有限或負數欄位`);
    if (![monster.level, monster.maxHp, monster.exp, monster.coins, monster.width, monster.height,
      monster.attackWindupMs, monster.attackCooldownMs, monster.respawnMs].every(Number.isInteger)) {
      return invalid(`怪物 ${monster.id} 等級、數量、尺寸與時間欄位必須是整數`);
    }
    if (monster.level < 1 || monster.level > catalog.progression.maxLevel || monster.maxHp < 1 || monster.width < 1 || monster.height < 1) {
      return invalid(`怪物 ${monster.id} 的等級、生命或碰撞尺寸無效`);
    }
    for (const drop of monster.drops) {
      if (!catalog.items[drop.itemId]) return invalid(`怪物 ${monster.id} 掉落引用不存在物品：${drop.itemId}`);
      if (!Number.isFinite(drop.chance) || drop.chance < 0 || drop.chance > 1) {
        return invalid(`怪物 ${monster.id} 掉落 ${drop.itemId} 的 chance 必須介於 0 與 1`);
      }
      if (![drop.min, drop.max].every(Number.isInteger) || drop.min < 1 || drop.min > drop.max) {
        return invalid(`怪物 ${monster.id} 掉落 ${drop.itemId} 的數量範圍無效`);
      }
      if (catalog.items[drop.itemId].kind === 'quest') {
        return invalid(`任務物品 ${drop.itemId} 不可放在無條件掉落表`);
      }
    }
  }

  for (const [questId, drop] of Object.entries(questDropByQuest)) {
    if (!catalog.monsters[drop.monsterId]) return invalid(`任務 ${questId} 指向不存在怪物：${drop.monsterId}`);
    if (catalog.items[drop.itemId]?.kind !== 'quest') return invalid(`任務 ${questId} 指向不存在或非任務物品：${drop.itemId}`);
  }

  if (catalog.progression.maxLevel !== 30 || catalog.progression.expToNext.length !== 31) {
    return invalid('progression 必須包含 0..30 共 31 個等級索引');
  }
  if (catalog.progression.expToNext[0] !== 0 || catalog.progression.expToNext[30] !== 0) {
    return invalid('expToNext 的索引 0 與 30 必須固定為 0');
  }
  for (let level = 1; level < catalog.progression.maxLevel; level += 1) {
    const expected = 40 + 12 * level + 3 * level * level;
    if (catalog.progression.expToNext[level] !== expected) {
      return invalid(`expToNext[${level}] 錯誤：預期 ${expected}`);
    }
  }

  const movementValues = [catalog.movement.speed, catalog.movement.climbSpeed, catalog.movement.gravity,
    catalog.movement.terminalVelocity, catalog.movement.width, catalog.movement.height];
  if (!isFiniteNonNegative(movementValues) || !Number.isFinite(catalog.movement.jumpVelocity)) {
    return invalid('movement 含非有限欄位或負速度／尺寸');
  }
  if (catalog.movement.speed < 1 || catalog.movement.climbSpeed < 1 || catalog.movement.gravity < 1 ||
    catalog.movement.jumpVelocity >= 0 || catalog.movement.terminalVelocity < 1 ||
    catalog.movement.width < 1 || catalog.movement.height < 1) {
    return invalid('movement 參數不合理：移動與尺寸須為正數，jumpVelocity 須向上');
  }

  return { ok: true, value: catalog };
};
