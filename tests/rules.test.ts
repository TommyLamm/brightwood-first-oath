import { describe, expect, it } from 'vitest';
import { rulesCatalog, playerLearnableIds, playerSkillIds, questDropByQuest, validateRules } from '../src/content/rules/index.js';

describe('rules catalog', () => {
  it('contains the fixed item, skill, and monster sets', () => {
    expect(Object.keys(rulesCatalog.items)).toHaveLength(30);
    expect(Object.keys(rulesCatalog.items)).toEqual(expect.arrayContaining([
      'starter-sword', 'iron-sword', 'steel-sword', 'guardian-sword',
      'cloth-shirt', 'leather-vest', 'iron-mail', 'cloth-cap', 'leather-cap', 'iron-helm',
      'small-red', 'large-red', 'small-blue', 'large-blue', 'snail-shell', 'slime-gel',
      'mushroom-cap', 'boar-tusk', 'stone-chip', 'metal-shard', 'forest-seed', 'spore-sample',
      'ridge-emblem', 'guardian-core', 'frost-fang', 'ice-shell', 'frost-tide-sword', 'amber-scale', 'sunwell-shell', 'sunwell-oathblade',
    ]));
    expect(Object.keys(rulesCatalog.skills)).toHaveLength(15);
    expect(Object.keys(rulesCatalog.skills).sort()).toEqual([
      'basic', 'enemy-melee', 'frost-crab-charge', 'frost-tusk-slam', 'guardian-slam', 'guardian-wave',
      'heavy-strike', 'iron-guard', 'low-tide-wave', 'rest-recovery', 'sand-stinger', 'sunwell-beetle-charge', 'sunwell-sentinel-slam', 'sweep', 'vitality',
    ]);
    expect(playerSkillIds).toHaveLength(6);
    expect(playerLearnableIds).toHaveLength(5);
    expect([...playerLearnableIds].sort()).toEqual(['heavy-strike', 'iron-guard', 'rest-recovery', 'sweep', 'vitality']);
    expect(rulesCatalog.skills.basic.requiredJob).toBe('any');
    expect(rulesCatalog.skills['heavy-strike'].requiredLevel).toBe(10);
    expect(rulesCatalog.skills.sweep.requiredLevel).toBe(12);
    expect(rulesCatalog.skills['iron-guard'].requiredLevel).toBe(14);
    expect(rulesCatalog.skills['heavy-strike'].effectKey).toBe('vfx:heavy-strike');
    expect(rulesCatalog.skills.sweep.effectKey).toBe('vfx:sweep');
    expect(rulesCatalog.skills['iron-guard'].effectKey).toBe('vfx:guard');
    expect(rulesCatalog.skills.vitality.requiredLevel).toBe(10);
    expect(rulesCatalog.skills['rest-recovery'].requiredLevel).toBe(10);
    expect(Object.keys(rulesCatalog.skills).filter((id) => rulesCatalog.skills[id].requiredJob === 'enemy').sort()).toEqual([
      'enemy-melee', 'frost-crab-charge', 'frost-tusk-slam', 'guardian-slam', 'guardian-wave', 'low-tide-wave', 'sand-stinger', 'sunwell-beetle-charge', 'sunwell-sentinel-slam',
    ]);
    expect(Object.keys(rulesCatalog.monsters).sort()).toEqual([
      'boar', 'frost-crab', 'frost-tide-warden', 'frost-wolf', 'golem', 'guardian', 'mushroom', 'sand-scorpion', 'sentinel', 'slime', 'snail', 'sunwell-beetle', 'sunwell-sentinel',
    ]);
  });

  it('uses the specified levels, progression curve, equipment visuals, and conditional quest drops', () => {
    expect(rulesCatalog.progression.maxLevel).toBe(30);
    expect(rulesCatalog.progression.expToNext).toHaveLength(31);
    expect(rulesCatalog.progression.expToNext[0]).toBe(0);
    expect(rulesCatalog.progression.expToNext[30]).toBe(0);
    for (let level = 1; level < 30; level += 1) {
      expect(rulesCatalog.progression.expToNext[level]).toBe(40 + 12 * level + 3 * level * level);
    }
    expect(rulesCatalog.items['cloth-shirt'].visualKey).toBe('actor:hero-cloth');
    expect(rulesCatalog.items['leather-vest'].visualKey).toBe('actor:hero-leather');
    expect(rulesCatalog.items['iron-mail'].visualKey).toBe('actor:hero-iron');
    expect(rulesCatalog.movement).toEqual({
      speed: 140, climbSpeed: 90, gravity: 1600, jumpVelocity: -520,
      terminalVelocity: 900, width: 24, height: 44,
    });
    expect(questDropByQuest).toEqual({
      q03: { monsterId: 'slime', itemId: 'forest-seed' },
      q04: { monsterId: 'mushroom', itemId: 'spore-sample' },
      q06: { monsterId: 'boar', itemId: 'ridge-emblem' },
      q08: { monsterId: 'guardian', itemId: 'guardian-core' },
    });
    for (const monster of Object.values(rulesCatalog.monsters)) {
      expect(monster.drops.every((drop) => rulesCatalog.items[drop.itemId]?.kind !== 'quest')).toBe(true);
    }
  });

  it('gives the level-30 Frost wolf a guaranteed sellable fang', () => {
    const wolf = rulesCatalog.monsters['frost-wolf'];
    const fang = rulesCatalog.items['frost-fang'];
    expect(wolf.level).toBe(30);
    expect(wolf.drops).toContainEqual({ itemId: 'frost-fang', chance: 1, min: 1, max: 1 });
    expect(fang.kind).toBe('material');
    expect(fang.buyPrice).toBe(0);
    expect(fang.sellPrice).toBeGreaterThan(0);
    expect(wolf.actorKey).toBe('actor:frost-wolf');
  });

  it('gives the level-30 sand scorpion a telegraphed ranged sting and saleable amber scale', () => {
    const scorpion = rulesCatalog.monsters['sand-scorpion'];
    const scale = rulesCatalog.items['amber-scale'];
    expect(scorpion.level).toBe(30);
    expect(scorpion.attackRange).toBe(190);
    expect(scorpion.drops).toContainEqual({ itemId: 'amber-scale', chance: 1, min: 1, max: 1 });
    expect(scale.kind).toBe('material');
    expect(scale.buyPrice).toBe(0);
    expect(scale.sellPrice).toBeGreaterThan(0);
    expect(rulesCatalog.skills['sand-stinger'].windupMs).toBeGreaterThan(0);
    expect(rulesCatalog.skills['sand-stinger'].height).toBeLessThan(50);
  });

  it('defines the Sunwell beetle as a bounded-charge enemy with a guaranteed saleable shell', () => {
    const beetle = rulesCatalog.monsters['sunwell-beetle'];
    const shell = rulesCatalog.items['sunwell-shell'];
    const charge = rulesCatalog.skills['sunwell-beetle-charge'];
    expect(beetle).toMatchObject({ level: 30, width: 52, height: 42, attackRange: 220, actorKey: 'actor:sunwell-beetle' });
    expect(beetle.drops).toContainEqual({ itemId: 'sunwell-shell', chance: 1, min: 1, max: 1 });
    expect(shell).toMatchObject({ kind: 'material', buyPrice: 0, sellPrice: 55, iconKey: 'item:sunwell-shell' });
    expect(charge).toMatchObject({ windupMs: 750, activeMs: 250, recoveryMs: 750, reach: 220, targets: 1 });
  });
  it('defines the Sunwell Sentinel slam and one-time quest weapon reward', () => {
    const sentinel = rulesCatalog.monsters['sunwell-sentinel'];
    const oathblade = rulesCatalog.items['sunwell-oathblade'];
    const slam = rulesCatalog.skills['sunwell-sentinel-slam'];
    expect(sentinel).toMatchObject({
      level: 30, width: 72, height: 84, aggroRange: 460, attackRange: 190,
      attackCooldownMs: 900, respawnMs: 0, exp: 0, coins: 0, actorKey: 'actor:sunwell-sentinel',
    });
    expect(sentinel.drops).toEqual([]);
    expect(slam).toMatchObject({ windupMs: 900, activeMs: 100, recoveryMs: 850, reach: 190, height: 120, multiplierBase: 1.3 });
    expect(oathblade).toMatchObject({
      minLevel: 30, attack: 58, buyPrice: 0, sellPrice: 1000,
      iconKey: 'item:sunwell-oathblade', visualKey: 'equip:sunwell-oathblade',
    });
  });
  it('validates the production catalog and gives a specific missing-drop diagnostic', () => {
    const result = validateRules(rulesCatalog);
    expect(result.ok).toBe(true);

    const invalidCatalog = structuredClone(rulesCatalog);
    invalidCatalog.monsters.snail.drops[0].itemId = 'missing-item';
    const invalidResult = validateRules(invalidCatalog);
    expect(invalidResult.ok).toBe(false);
    if (!invalidResult.ok) {
      expect(invalidResult.code).toBe('INVALID');
      expect(invalidResult.message).toContain('怪物 snail 掉落引用不存在物品：missing-item');
    }
  });

  it('rejects invalid probability, quantity, and non-finite numeric data', () => {
    const invalidChance = structuredClone(rulesCatalog);
    invalidChance.monsters.slime.drops[0].chance = 1.1;
    const chanceResult = validateRules(invalidChance);
    expect(chanceResult.ok).toBe(false);
    if (!chanceResult.ok) expect(chanceResult.message).toContain('chance 必須介於 0 與 1');

    const invalidRange = structuredClone(rulesCatalog);
    invalidRange.monsters.snail.drops[0].max = 0;
    const rangeResult = validateRules(invalidRange);
    expect(rangeResult.ok).toBe(false);
    if (!rangeResult.ok) expect(rangeResult.message).toContain('數量範圍無效');

    const nonFinite = structuredClone(rulesCatalog);
    nonFinite.items['small-red'].restoreHp = Number.NaN;
    const numericResult = validateRules(nonFinite);
    expect(numericResult.ok).toBe(false);
    if (!numericResult.ok) expect(numericResult.message).toContain('非有限或負數欄位');
  });

  it('keeps the guardian sword out of the shop: only the guardian drops it, always', () => {
    const sword = rulesCatalog.items['guardian-sword'];
    expect(sword.buyPrice).toBe(0);
    expect(sword.sellPrice).toBeGreaterThan(0);
    expect(rulesCatalog.monsters.guardian.drops).toContainEqual({ itemId: 'guardian-sword', chance: 1, min: 1, max: 1 });
    const shopStock = Object.values(rulesCatalog.items).filter((item) => item.buyPrice > 0 && item.kind !== 'quest').map(({ id }) => id);
    expect(shopStock).not.toContain('guardian-sword');
    expect(shopStock).toEqual(expect.arrayContaining(['starter-sword', 'iron-sword', 'steel-sword']));

    const listed = structuredClone(rulesCatalog);
    listed.items['guardian-sword'].buyPrice = 1800;
    expect(validateRules(listed)).toMatchObject({ ok: false });
  });
});
