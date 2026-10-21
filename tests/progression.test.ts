import { describe, expect, it } from 'vitest';
import type { PlayerProgress, Result } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import {
  applyProgressAction,
  countItem,
  createPlayer,
  deriveStats,
  validatePlayerName,
} from '../src/domain/progression/index.js';

function makePlayer(): PlayerProgress {
  const name = validatePlayerName('晨芽');
  if (!name.ok) throw new Error(name.message);
  return createPlayer(name.value, rulesCatalog);
}

function apply(player: PlayerProgress, action: Parameters<typeof applyProgressAction>[1]): PlayerProgress {
  const result = applyProgressAction(player, action, rulesCatalog);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

function expectFailure(
  result: Result<PlayerProgress>,
  code: string,
): void {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.code).toBe(code);
}

describe('progression and inventory', () => {
  it('validates plain player names and creates the specified starting character', () => {
    const invalidName = validatePlayerName('   ');
    expect(invalidName.ok).toBe(false);
    if (!invalidName.ok) {
      expect(invalidName.code).toBe('INVALID');
      expect(invalidName.message).not.toMatch(/<[^>]*>/u);
    }
    expect(validatePlayerName('名字\u0000異常').ok).toBe(false);

    const player = makePlayer();
    expect(player).toMatchObject({
      job: 'beginner', level: 1, exp: 0, str: 12, dex: 4, ap: 0, sp: 0,
      hp: 80, mp: 40, coins: 120,
      equipment: { weapon: 'starter-sword', body: 'cloth-shirt', hat: null },
    });
    expect(player.bag).toEqual([
      { itemId: 'small-red', quantity: 10 },
      { itemId: 'small-blue', quantity: 5 },
    ]);
    expect(deriveStats(player, rulesCatalog)).toEqual({ maxHp: 80, maxMp: 40, attack: 31, defense: 2 });
  });

  it('applies multi-level experience, caps at level 30, and does not grant beginner SP retroactively', () => {
    const fromFloor = apply(makePlayer(), { type: 'setLevelFloor', level: 10 });
    expect(fromFloor).toMatchObject({ level: 10, exp: 0, ap: 45, sp: 0 });

    const swordsman = apply(fromFloor, { type: 'changeJob' });
    expect(swordsman).toMatchObject({ job: 'swordsman', sp: 1 });
    const swordsmanSnapshot = JSON.stringify(swordsman);
    const repeatedJobChange = applyProgressAction(swordsman, { type: 'changeJob' }, rulesCatalog);
    expectFailure(repeatedJobChange, 'REQUIREMENT');
    expect(JSON.stringify(swordsman)).toBe(swordsmanSnapshot);

    const expToCap = rulesCatalog.progression.expToNext
      .slice(10, 30)
      .reduce((total, threshold) => total + threshold, 0);
    const capped = apply(swordsman, {
      type: 'gainReward', reward: { exp: expToCap, coins: 0, items: [] },
    });
    expect(capped).toMatchObject({ level: 30, exp: 0, ap: 145, sp: 21 });
    expect(capped.hp).toBe(660);
    expect(capped.mp).toBe(98);
  });

  it('rejects illegal learned-skill states and safe-integer overflow without changing input', () => {
    const beginnerWithSkill: PlayerProgress = {
      ...makePlayer(),
      skillRanks: { vitality: 1 },
    };
    expect(deriveStats(beginnerWithSkill, rulesCatalog).maxHp).toBe(80);
    const beginnerSnapshot = JSON.stringify(beginnerWithSkill);
    const illegalJob = applyProgressAction(beginnerWithSkill, {
      type: 'addItem', stack: { itemId: 'snail-shell', quantity: 1 },
    }, rulesCatalog);
    expectFailure(illegalJob, 'INVALID');
    expect(JSON.stringify(beginnerWithSkill)).toBe(beginnerSnapshot);

    const swordAtLevel10 = apply(apply(makePlayer(), { type: 'setLevelFloor', level: 10 }), { type: 'changeJob' });
    const lowLevelSkill: PlayerProgress = {
      ...swordAtLevel10,
      level: 11,
      exp: 0,
      skillRanks: { sweep: 1 },
    };
    const lowLevelSnapshot = JSON.stringify(lowLevelSkill);
    const illegalLevel = applyProgressAction(lowLevelSkill, {
      type: 'addItem', stack: { itemId: 'snail-shell', quantity: 1 },
    }, rulesCatalog);
    expectFailure(illegalLevel, 'INVALID');
    expect(JSON.stringify(lowLevelSkill)).toBe(lowLevelSnapshot);

    const overflowPlayer: PlayerProgress = {
      ...makePlayer(), dex: Number.MAX_SAFE_INTEGER, ap: 1,
    };
    const overflowSnapshot = JSON.stringify(overflowPlayer);
    const overflow = applyProgressAction(overflowPlayer, {
      type: 'allocateAp', stat: 'dex', amount: 1,
    }, rulesCatalog);
    expectFailure(overflow, 'INVALID');
    expect(JSON.stringify(overflowPlayer)).toBe(overflowSnapshot);

    const levelOverflowPlayer: PlayerProgress = { ...makePlayer(), ap: Number.MAX_SAFE_INTEGER };
    const levelOverflowSnapshot = JSON.stringify(levelOverflowPlayer);
    const levelOverflow = applyProgressAction(levelOverflowPlayer, {
      type: 'gainReward', reward: { exp: rulesCatalog.progression.expToNext[1], coins: 0, items: [] },
    }, rulesCatalog);
    expectFailure(levelOverflow, 'INVALID');
    expect(JSON.stringify(levelOverflowPlayer)).toBe(levelOverflowSnapshot);
  });

  it('learns a skill and recomputes equipment and passive stats without stacking', () => {
    const level10 = apply(makePlayer(), { type: 'setLevelFloor', level: 10 });
    const swordsman = apply(level10, { type: 'changeJob' });
    const withVitality = apply(swordsman, { type: 'learnSkill', skillId: 'vitality' });
    expect(withVitality.skillRanks.vitality).toBe(1);
    expect(deriveStats(withVitality, rulesCatalog).maxHp).toBe(272);

    const withSwordInBag = {
      ...withVitality,
      hp: 200,
      bag: [...withVitality.bag, { itemId: 'iron-sword', quantity: 1 }],
    };
    const equipped = apply(withSwordInBag, { type: 'equip', bagIndex: withSwordInBag.bag.length - 1 });
    expect(equipped.equipment.weapon).toBe('iron-sword');
    expect(countItem(equipped, 'starter-sword')).toBe(1);
    expect(deriveStats(equipped, rulesCatalog).attack).toBe(39);

    const unequipped = apply(equipped, { type: 'unequip', slot: 'weapon' });
    expect(unequipped.equipment.weapon).toBeNull();
    expect(countItem(unequipped, 'iron-sword')).toBe(1);
    expect(deriveStats(unequipped, rulesCatalog).attack).toBe(27);
    expect(unequipped.hp).toBeLessThanOrEqual(deriveStats(unequipped, rulesCatalog).maxHp);
  });

  it('keeps reward and full-bag equipment exchanges atomic', () => {
    const fullBagPlayer: PlayerProgress = {
      ...makePlayer(),
      level: 10,
      ap: 45,
      coins: 500,
      bag: [
        { itemId: 'iron-sword', quantity: 1 },
        ...Array.from({ length: 31 }, () => ({ itemId: 'snail-shell', quantity: 999 })),
      ],
    };
    const snapshot = JSON.stringify(fullBagPlayer);
    const exchanged = applyProgressAction(fullBagPlayer, { type: 'equip', bagIndex: 0 }, rulesCatalog);
    expect(exchanged.ok).toBe(true);
    if (!exchanged.ok) throw new Error(exchanged.message);
    expect(exchanged.value.equipment.weapon).toBe('iron-sword');
    expect(exchanged.value.bag).toHaveLength(32);
    expect(countItem(exchanged.value, 'starter-sword')).toBe(1);
    expect(JSON.stringify(fullBagPlayer)).toBe(snapshot);

    const purchaseFailure = applyProgressAction(fullBagPlayer, {
      type: 'buy', itemId: 'small-red', quantity: 1,
    }, rulesCatalog);
    expectFailure(purchaseFailure, 'BAG_FULL');
    expect(JSON.stringify(fullBagPlayer)).toBe(snapshot);

    const noRoomToUnequip = applyProgressAction(exchanged.value, { type: 'unequip', slot: 'weapon' }, rulesCatalog);
    expectFailure(noRoomToUnequip, 'BAG_FULL');
    if (!noRoomToUnequip.ok) expect(noRoomToUnequip.message).toContain('背包已滿');
    expect(exchanged.value.equipment.weapon).toBe('iron-sword');

    const rewardFailure = applyProgressAction(fullBagPlayer, {
      type: 'gainReward', reward: { exp: 500, coins: 50, items: [{ itemId: 'small-red', quantity: 1 }] },
    }, rulesCatalog);
    expectFailure(rewardFailure, 'BAG_FULL');
    expect(JSON.stringify(fullBagPlayer)).toBe(snapshot);
  });

  it('validates shop transactions, forbids quest-item sales, and consumes only effective potions', () => {
    const player = makePlayer();
    const purchased = apply(player, { type: 'buy', itemId: 'small-red', quantity: 2 });
    expect(purchased.coins).toBe(80);
    expect(countItem(purchased, 'small-red')).toBe(12);
    const sold = apply(purchased, { type: 'sell', bagIndex: 0, quantity: 1 });
    expect(sold.coins).toBe(85);
    expect(countItem(sold, 'small-red')).toBe(11);

    const questItem = apply(purchased, {
      type: 'addItem', stack: { itemId: 'forest-seed', quantity: 1 },
    });
    const questIndex = questItem.bag.findIndex((stack) => stack.itemId === 'forest-seed');
    const forbiddenSale = applyProgressAction(questItem, {
      type: 'sell', bagIndex: questIndex, quantity: 1,
    }, rulesCatalog);
    expectFailure(forbiddenSale, 'REQUIREMENT');
    expect(countItem(questItem, 'forest-seed')).toBe(1);

    const ineffectivePotion = applyProgressAction(questItem, { type: 'useItem', itemId: 'small-red' }, rulesCatalog);
    expectFailure(ineffectivePotion, 'REQUIREMENT');
    expect(countItem(questItem, 'small-red')).toBe(12);

    const hurt = apply(questItem, { type: 'damage', amount: 50 });
    const healed = apply(hurt, { type: 'useItem', itemId: 'small-red' });
    expect(healed.hp).toBe(80);
    expect(countItem(healed, 'small-red')).toBe(11);
  });

  it('adds and removes stacks atomically and applies strict MP, AP, damage, and restore rules', () => {
    const player = makePlayer();
    const added = apply(player, { type: 'addItem', stack: { itemId: 'snail-shell', quantity: 1001 } });
    expect(added.bag.slice(-2)).toEqual([
      { itemId: 'snail-shell', quantity: 999 },
      { itemId: 'snail-shell', quantity: 2 },
    ]);

    const insufficient = applyProgressAction(added, {
      type: 'removeItems', items: [
        { itemId: 'snail-shell', quantity: 1000 },
        { itemId: 'small-red', quantity: 11 },
      ],
    }, rulesCatalog);
    expectFailure(insufficient, 'NOT_FOUND');
    expect(countItem(added, 'snail-shell')).toBe(1001);

    const mpError = applyProgressAction(player, { type: 'spendMp', amount: 41 }, rulesCatalog);
    expectFailure(mpError, 'NO_MP');
    const negativeDamage = applyProgressAction(player, { type: 'damage', amount: -1 }, rulesCatalog);
    expectFailure(negativeDamage, 'INVALID');

    const damaged = apply(player, { type: 'damage', amount: 500 });
    expect(damaged.hp).toBe(0);
    const restored = apply(damaged, { type: 'restore', hp: 200, mp: 500 });
    expect(restored).toMatchObject({ hp: 80, mp: 40 });
    const allocated = apply({ ...restored, ap: 5 }, { type: 'allocateAp', stat: 'str', amount: 5 });
    expect(allocated).toMatchObject({ str: 17, ap: 0 });
  });
});
