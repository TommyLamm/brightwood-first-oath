import type { Id, Result, RulesCatalog } from '../../contracts/index.js';
import { questDropByQuest } from './monsters.js';
import { jobs } from './jobs.js';
import { specializations } from './specializations.js';

const approvedItemIds: readonly Id[] = [
  'starter-dagger', 'iron-dagger', 'steel-dagger', 'guardian-dagger', 'frost-tide-dagger', 'sunwell-oathdagger',
  'starter-staff', 'iron-staff', 'steel-staff', 'guardian-staff', 'frost-tide-staff', 'sunwell-oathstaff',
  'starter-bow', 'iron-bow', 'steel-bow', 'guardian-bow', 'frost-tide-bow', 'sunwell-oathbow',
  'starter-sword', 'iron-sword', 'steel-sword', 'guardian-sword', 'cloth-shirt', 'leather-vest',
  'iron-mail', 'cloth-cap', 'leather-cap', 'iron-helm', 'small-red', 'large-red', 'small-blue',
  'large-blue', 'snail-shell', 'slime-gel', 'mushroom-cap', 'boar-tusk', 'stone-chip', 'metal-shard',
  'forest-seed', 'spore-sample', 'ridge-emblem', 'guardian-core', 'frost-fang', 'ice-shell',
  'frost-tide-sword', 'amber-scale', 'sunwell-shell', 'sunwell-oathblade', 'moss-ceramic',
  'broken-copper-thread', 'muted-bell-fragment', 'oathfarer-circlet',
];

const approvedSkillIds: readonly Id[] = [
  ...Object.values(specializations).map((branch) => branch.skill),
  'dagger-basic', 'rogue-double-stab', 'rogue-shadow-lunge', 'rogue-smoke', 'rogue-dagger-mastery', 'rogue-combo-rhythm',
  'wand-basic', 'mage-mana-bolt', 'mage-frost-ring', 'mage-blink', 'mage-mana-affinity', 'mage-rune-study',
  'bow-basic', 'archer-double-shot', 'archer-piercing-shot', 'archer-retreat-shot', 'archer-bow-mastery', 'archer-steady-aim',
  'basic', 'heavy-strike', 'sweep', 'iron-guard', 'vitality', 'rest-recovery', 'enemy-melee',
  'ruins-carapace-bite', 'guardian-slam', 'frost-crab-charge', 'sunwell-beetle-charge',
  'sand-stinger', 'guardian-wave', 'frost-tusk-slam', 'sunwell-sentinel-slam', 'low-tide-wave',
  'ruins-puppet-slap', 'ruins-prowler-sweep', 'ruins-bell-slam', 'ruins-bell-sweep',
];

const approvedMonsterIds: readonly Id[] = [
  'snail', 'slime', 'mushroom', 'boar', 'golem', 'sentinel', 'frost-wolf', 'frost-crab',
  'sand-scorpion', 'sunwell-beetle', 'ruins-moss-carapace', 'guardian', 'sunwell-sentinel',
  'frost-tide-warden', 'ruins-string-puppet', 'ruins-bell-prowler', 'ruins-bell-keeper',
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

  if (itemIds.length !== approvedItemIds.length) return invalid('items 數量錯誤：預期 ' + approvedItemIds.length + '，實際 ' + itemIds.length);
  if (skillIds.length !== approvedSkillIds.length) return invalid('skills 數量錯誤：預期 ' + approvedSkillIds.length + '，實際 ' + skillIds.length);
  if (monsterIds.length !== 17) return invalid('monsters 數量錯誤：預期 17，實際 ' + monsterIds.length);
  if (!hasApprovedIds(catalog.items, approvedItemIds)) return invalid('items ID 清單不符核准的 34 件物品');
  if (!hasApprovedIds(catalog.skills, approvedSkillIds)) return invalid('skills ID 清單不符核准的 20 個技能');
  if (!hasApprovedIds(catalog.monsters, approvedMonsterIds)) return invalid('monsters ID 清單不符核准的 17 隻怪物');
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

  const circlet = catalog.items['oathfarer-circlet'];
  if (circlet.kind !== 'hat' || circlet.slot !== 'hat' || circlet.stackLimit !== 1 || circlet.minLevel !== 30
    || circlet.attack !== 0 || circlet.defense !== 10 || circlet.hpBonus !== 20
    || circlet.restoreHp !== 0 || circlet.restoreMp !== 0 || circlet.buyPrice !== 0 || circlet.sellPrice !== 600
    || circlet.iconKey !== 'item:oathfarer-circlet' || circlet.visualKey !== 'equip:oathfarer-circlet') {
    return invalid('守誓旅冠必須符合核准的等級、能力、價格及圖像 keys');
  }

  // Bosses are the monsters that never respawn (respawnMs 0). Their guaranteed gear drop is the fight's prize,
  // so the shop must not sell it too.
  for (const monster of Object.values(catalog.monsters)) {
    if (monster.projectileHeight !== undefined && (!Number.isInteger(monster.projectileHeight)
      || monster.projectileHeight < monster.height || monster.projectileHeight > 96)) return invalid(`怪物 ${monster.id} 的箭矢受擊高度無效`);
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
      skill.hpPerRank, skill.regenPerRank, skill.damagePerRank ?? 0, skill.cooldownPerRank ?? 0,
    ];
    if (!isFiniteNonNegative(values)) return invalid(`技能 ${skill.id} 含非有限或負數欄位`);
    if (!Number.isInteger(skill.maxRank) || skill.maxRank < 1) return invalid(`技能 ${skill.id} maxRank 必須是正整數`);
    if (!Number.isInteger(skill.requiredLevel) || skill.requiredLevel < 1 || skill.requiredLevel > catalog.progression.maxLevel) {
      return invalid(`技能 ${skill.id} requiredLevel 超出有效等級`);
    }
    if (![skill.cooldownMs, skill.windupMs, skill.activeMs, skill.recoveryMs, skill.durationMs, skill.targets].every(Number.isInteger)) {
      return invalid(`技能 ${skill.id} 時間與目標欄位必須是整數`);
    }
    if (skill.projectile && (skill.kind !== 'attack'
      || !Number.isFinite(skill.projectile.speed) || skill.projectile.speed <= 0
      || !Number.isFinite(skill.projectile.radius) || skill.projectile.radius <= 0 || skill.projectile.radius > 8
      || !Number.isFinite(skill.projectile.lifetimeMs) || skill.projectile.lifetimeMs <= 0 || skill.projectile.lifetimeMs > 2000
      || skill.projectile.shotOffsetsMs.length < 1 || skill.projectile.shotOffsetsMs.length > 3
      || skill.projectile.shotOffsetsMs.some((time, index, times) => !Number.isFinite(time) || time < 0
        || time >= skill.activeMs + skill.recoveryMs || (index > 0 && time <= times[index - 1]!)))) {
      return invalid(`投射物技能 ${skill.id} 的速度、範圍或出射排程無效`);
    }
    if (skill.kind === 'attack') {
      if (skill.activeMs < 1 || skill.reach < 1 || skill.height < 1 || skill.targets < 1 || skill.multiplierBase <= 0) {
        return invalid(`攻擊技能 ${skill.id} 必須有有效窗、範圍、目標及正倍率`);
      }
    } else if (skill.kind === 'movement') {
      if (skill.id !== 'mage-blink' || skill.projectile || skill.activeMs !== 0 || skill.targets !== 0
        || skill.reach !== 120 || skill.cooldownMs < 1 || skill.multiplierBase !== 0) return invalid('閃現定義無效');
    } else if (skill.kind === 'zone') {
      if (skill.id !== 'rogue-smoke' || skill.projectile || skill.activeMs !== 0 || skill.targets !== 0
        || skill.durationMs < 1 || skill.reach <= 0 || skill.multiplierBase !== 0) return invalid('煙幕定義無效');
    } else if (skill.kind === 'buff') {
      if (skill.activeMs !== 0 || skill.targets < 1 || skill.durationMs < 1) {
        return invalid(`增益技能 ${skill.id} 必須以持續時間表示效果，不可設攻擊有效窗`);
      }
    } else if (skill.kind === 'passive') {
      if ([skill.cooldownMs, skill.windupMs, skill.activeMs, skill.recoveryMs, skill.reach, skill.height, skill.targets, skill.durationMs].some((value) => value !== 0)) {
        return invalid(`被動技能 ${skill.id} 的時間、範圍與目標欄位必須為 0`);
      }
      if (skill.hpPerRank === 0 && skill.regenPerRank === 0 && skill.defensePerRank === 0 && !skill.damagePerRank) {
        return invalid(`被動技能 ${skill.id} 缺少具體效果數值`);
      }
    }
  }

  const learnableCount = Object.values(catalog.skills).filter((skill) => skill.requiredJob === 'swordsman' && !skill.requiredSpecialization).length;
  const enemySkills = Object.values(catalog.skills).filter((skill) => skill.requiredJob === 'enemy');
  if (learnableCount !== 5) return invalid(`可學劍士技能數量錯誤：預期 5，實際 ${learnableCount}`);
  for (const job of Object.values(jobs)) {
    if (!catalog.items[job.starterWeapon] || !catalog.skills[job.basicSkill]
      || new Set(job.learnableSkills).size !== 5
      || Object.values(catalog.skills).filter((skill) => skill.requiredJob === job.id && !skill.requiredSpecialization).length !== 5
      || job.learnableSkills.some((id) => catalog.skills[id]?.requiredJob !== job.id)
      || job.skillSlots.some((id) => !job.learnableSkills.includes(id) || catalog.skills[id]?.kind === 'passive')) {
      return invalid('職業 ' + job.name + ' 的技能或武器定義無效');
    }
  }
  for (const [id, branch] of Object.entries(specializations)) {
    const skill = catalog.skills[branch.skill];
    if (!skill || skill.requiredSpecialization !== id || skill.requiredJob !== branch.job || skill.requiredLevel !== 20
      || skill.maxRank !== 1) return invalid('二轉技能定義或職業引用無效：' + id);
  }
  if (enemySkills.length !== 14) return invalid('敵人技能數量錯誤：預期 14，實際 ' + enemySkills.length);
  if (catalog.skills.basic?.requiredJob !== 'any') return invalid('basic 必須存在且可由任意職業使用');
  if (enemySkills.some((skill) => skill.maxRank !== 1 || skill.mpCost !== 0)) {
    return invalid('敵人技能必須 maxRank=1 且 mpCost=0');
  }
  const bellSkillProfiles = [
    { id: 'ruins-bell-slam', windupMs: 900, activeMs: 100, recoveryMs: 1000, reach: 180, height: 120, multiplierBase: 1.25 },
    { id: 'ruins-bell-sweep', windupMs: 1200, activeMs: 100, recoveryMs: 1000, reach: 360, height: 30, multiplierBase: 1.05 },
  ] as const;
  if (bellSkillProfiles.some((expected) => {
    const skill = catalog.skills[expected.id];
    return !skill || skill.kind !== 'attack' || skill.requiredJob !== 'enemy' || skill.maxRank !== 1
      || skill.mpCost !== 0 || skill.cooldownMs !== 0 || skill.windupMs !== expected.windupMs
      || skill.activeMs !== expected.activeMs || skill.recoveryMs !== expected.recoveryMs
      || skill.reach !== expected.reach || skill.height !== expected.height || skill.targets !== 1
      || skill.multiplierBase !== expected.multiplierBase || skill.multiplierPerRank !== 0
      || skill.durationMs !== 0 || skill.defensePerRank !== 0 || skill.hpPerRank !== 0
      || skill.regenPerRank !== 0 || skill.effectKey !== null;
  })) return invalid('司鐘者的垂鐘重擊與低鳴橫掃必須符合核准的時間、範圍與倍率');

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

  const bellKeeper = catalog.monsters['ruins-bell-keeper'];
  if (bellKeeper.level !== 30 || bellKeeper.maxHp !== 8000 || bellKeeper.attack !== 60 || bellKeeper.defense !== 28
    || bellKeeper.exp !== 0 || bellKeeper.coins !== 0 || bellKeeper.speed !== 38 || bellKeeper.width !== 88
    || bellKeeper.height !== 76 || bellKeeper.aggroRange !== 460 || bellKeeper.attackRange !== 360
    || bellKeeper.attackWindupMs !== 900 || bellKeeper.attackCooldownMs !== 0 || bellKeeper.respawnMs !== 0
    || bellKeeper.actorKey !== 'actor:ruins-bell-keeper' || bellKeeper.drops.length !== 0) {
    return invalid('失序司鐘者必須符合核准的首領規格');
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
