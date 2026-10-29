import { describe, expect, it } from 'vitest';
import type { ItemDef, PlayerProgress, RulesCatalog } from '../src/contracts/index.js';
import { applyProgressAction } from '../src/domain/progression/index.js';
import { collectMaterialSaleActions, previewMaterialSale } from '../src/ui/material-sale-preview.js';

const shell: ItemDef = {
  id: 'shell', name: '小貝殼', kind: 'material', slot: null, stackLimit: 20, minLevel: 1,
  attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 0, sellPrice: 2,
  iconKey: 'item:shell', visualKey: null,
};

const ore: ItemDef = { ...shell, id: 'ore', name: '礦石', sellPrice: 3, iconKey: 'item:ore' };
const crumb: ItemDef = { ...shell, id: 'crumb', name: '碎屑', sellPrice: 1, iconKey: 'item:crumb' };
const dullMaterial: ItemDef = { ...shell, id: 'dull', name: '黯淡素材', sellPrice: 0, iconKey: 'item:dull' };
const potion: ItemDef = { ...shell, id: 'potion', name: '藥水', kind: 'consumable', sellPrice: 5, iconKey: 'item:potion' };
const questToken: ItemDef = { ...shell, id: 'quest-token', name: '任務信物', kind: 'quest', sellPrice: 0, iconKey: 'item:quest-token' };

const rules: RulesCatalog = {
  items: { shell, ore, crumb, dull: dullMaterial, potion, 'quest-token': questToken },
  skills: {},
  monsters: {},
  progression: { maxLevel: 1, expToNext: [0, 0] },
  movement: {
    speed: 140, climbSpeed: 90, gravity: 1600, jumpVelocity: -520, terminalVelocity: 900,
    width: 24, height: 44,
  },
};

function makePlayer(overrides: Partial<PlayerProgress> = {}): PlayerProgress {
  return {
    name: '測試旅人', job: 'beginner', level: 1, exp: 0, str: 12, dex: 4, ap: 0, sp: 0,
    hp: 80, mp: 40, coins: 500, skillRanks: {}, bag: [],
    equipment: { weapon: null, body: null, hat: null },
    ...overrides,
  };
}

function expectInputsUnchanged(
  player: PlayerProgress,
  playerBefore: PlayerProgress,
  rulesBefore: RulesCatalog,
): void {
  expect(player).toEqual(playerBefore);
  expect(rules).toEqual(rulesBefore);
}

describe('material sale preview', () => {
  it('returns a deeply immutable empty result when there are no eligible material stacks', () => {
    const player = makePlayer({ bag: [
      { itemId: 'potion', quantity: 2 },
      { itemId: 'dull', quantity: 3 },
      { itemId: 'quest-token', quantity: 1 },
    ] });
    const playerBefore = structuredClone(player);
    const rulesBefore = structuredClone(rules);

    const actions = collectMaterialSaleActions(player, rules);
    const preview = previewMaterialSale({ player, rules, atMerchant: true });

    expect(actions).toEqual([]);
    expect(preview).toEqual({
      actions: [], candidateStacks: 0, nominalProceeds: 0,
      expectedSoldStacks: 0, expectedRejectedStacks: 0, expectedProceeds: 0,
      disabled: true, reason: '沒有可出售的素材。', code: 'NO_MATERIALS',
    });
    expect(Object.isFrozen(actions)).toBe(true);
    expect(Object.isFrozen(preview)).toBe(true);
    expect(Object.isFrozen(preview.actions)).toBe(true);
    expectInputsUnchanged(player, playerBefore, rulesBefore);
  });

  it('prioritizes the merchant requirement over domain sale rejection', () => {
    const player = makePlayer({
      coins: 9_999_998,
      bag: [{ itemId: 'shell', quantity: 1 }],
    });
    const playerBefore = structuredClone(player);
    const rulesBefore = structuredClone(rules);
    const domain = applyProgressAction(player, { type: 'sell', bagIndex: 0, quantity: 1 }, rules);

    const preview = previewMaterialSale({ player, rules, atMerchant: false });

    expect(domain.ok).toBe(false);
    expect(preview).toMatchObject({
      actions: [{ bagIndex: 0, quantity: 1 }], candidateStacks: 1, nominalProceeds: 2,
      expectedSoldStacks: 0, expectedRejectedStacks: 1, expectedProceeds: 0,
      disabled: true, reason: '需在商人互動中出售', code: 'NOT_AT_MERCHANT',
    });
    expectInputsUnchanged(player, playerBefore, rulesBefore);
  });

  it('collects full eligible stacks in descending original index and simulates same-item stacks', () => {
    const player = makePlayer({ coins: 50, bag: [
      { itemId: 'shell', quantity: 2 },
      { itemId: 'potion', quantity: 1 },
      { itemId: 'shell', quantity: 3 },
      { itemId: 'dull', quantity: 4 },
      { itemId: 'ore', quantity: 2 },
      { itemId: 'quest-token', quantity: 1 },
    ] });
    const playerBefore = structuredClone(player);
    const rulesBefore = structuredClone(rules);
    const actions = collectMaterialSaleActions(player, rules);

    let simulated = player;
    let domainProceeds = 0;
    for (const action of actions) {
      const result = applyProgressAction(simulated, { type: 'sell', ...action }, rules);
      expect(result.ok).toBe(true);
      if (result.ok) {
        domainProceeds += result.value.coins - simulated.coins;
        simulated = result.value;
      }
    }
    const preview = previewMaterialSale({ player, rules, atMerchant: true });

    expect(actions).toEqual([
      { bagIndex: 4, quantity: 2 },
      { bagIndex: 2, quantity: 3 },
      { bagIndex: 0, quantity: 2 },
    ]);
    expect(preview).toMatchObject({
      actions, candidateStacks: 3, nominalProceeds: 16,
      expectedSoldStacks: 3, expectedRejectedStacks: 0, expectedProceeds: domainProceeds,
      disabled: false, reason: null, code: null,
    });
    expect(preview.expectedProceeds).toBe(simulated.coins - player.coins);
    expect(Object.isFrozen(preview)).toBe(true);
    expect(Object.isFrozen(preview.actions)).toBe(true);
    for (const action of preview.actions) expect(Object.isFrozen(action)).toBe(true);
    expect(preview).not.toHaveProperty('player');
    expectInputsUnchanged(player, playerBefore, rulesBefore);
  });

  it('sells through the cap exactly and keeps a partial-sale preview when only the cumulative total overflows', () => {
    const exactPlayer = makePlayer({
      coins: 9_999_993,
      bag: [
        { itemId: 'shell', quantity: 1 },
        { itemId: 'shell', quantity: 1 },
        { itemId: 'shell', quantity: 1 },
      ],
    });
    const exactPlayerBefore = structuredClone(exactPlayer);
    const rulesBefore = structuredClone(rules);
    const exact = previewMaterialSale({ player: exactPlayer, rules, atMerchant: true });

    expect(exact).toMatchObject({
      candidateStacks: 3, nominalProceeds: 6,
      expectedSoldStacks: 3, expectedRejectedStacks: 0, expectedProceeds: 6,
      disabled: false, reason: null, code: null,
    });
    expect(exactPlayer.coins + exact.expectedProceeds).toBe(9_999_999);
    expectInputsUnchanged(exactPlayer, exactPlayerBefore, rulesBefore);

    const partialPlayer = makePlayer({
      coins: 9_999_997,
      bag: [
        { itemId: 'shell', quantity: 1 },
        { itemId: 'shell', quantity: 1 },
      ],
    });
    const partialPlayerBefore = structuredClone(partialPlayer);
    const firstAlone = applyProgressAction(partialPlayer, { type: 'sell', bagIndex: 1, quantity: 1 }, rules);
    const secondAlone = applyProgressAction(partialPlayer, { type: 'sell', bagIndex: 0, quantity: 1 }, rules);
    const partial = previewMaterialSale({ player: partialPlayer, rules, atMerchant: true });

    expect(firstAlone.ok).toBe(true);
    expect(secondAlone.ok).toBe(true);
    expect(partial).toMatchObject({
      actions: [{ bagIndex: 1, quantity: 1 }, { bagIndex: 0, quantity: 1 }],
      candidateStacks: 2, nominalProceeds: 4,
      expectedSoldStacks: 1, expectedRejectedStacks: 1, expectedProceeds: 2,
      disabled: false, reason: '出售後金幣會超過上限。', code: 'INVALID',
    });
    expectInputsUnchanged(partialPlayer, partialPlayerBefore, rulesBefore);
  });

  it('continues to a lower-index smaller stack after a higher-index full stack fails', () => {
    const player = makePlayer({ coins: 9_999_998, bag: [
      { itemId: 'crumb', quantity: 1 },
      { itemId: 'shell', quantity: 2 },
    ] });
    const playerBefore = structuredClone(player);
    const rulesBefore = structuredClone(rules);
    const actions = collectMaterialSaleActions(player, rules);
    const failedHigh = applyProgressAction(player, { type: 'sell', ...actions[0]! }, rules);
    const succeededLow = applyProgressAction(player, { type: 'sell', ...actions[1]! }, rules);
    const preview = previewMaterialSale({ player, rules, atMerchant: true });

    expect(failedHigh).toMatchObject({ ok: false, code: 'INVALID', message: '出售後金幣會超過上限。' });
    expect(succeededLow.ok).toBe(true);
    expect(preview).toMatchObject({
      actions: [{ bagIndex: 1, quantity: 2 }, { bagIndex: 0, quantity: 1 }],
      candidateStacks: 2, nominalProceeds: 5,
      expectedSoldStacks: 1, expectedRejectedStacks: 1, expectedProceeds: 1,
      disabled: false, reason: '出售後金幣會超過上限。', code: 'INVALID',
    });
    expectInputsUnchanged(player, playerBefore, rulesBefore);
  });

  it('disables when every candidate is rejected and retains the first complete domain reason', () => {
    const player = makePlayer({ coins: 9_999_998, bag: [
      { itemId: 'shell', quantity: 1 },
      { itemId: 'ore', quantity: 1 },
    ] });
    const playerBefore = structuredClone(player);
    const rulesBefore = structuredClone(rules);
    const preview = previewMaterialSale({ player, rules, atMerchant: true });

    expect(preview).toMatchObject({
      actions: [{ bagIndex: 1, quantity: 1 }, { bagIndex: 0, quantity: 1 }],
      candidateStacks: 2, nominalProceeds: 5,
      expectedSoldStacks: 0, expectedRejectedStacks: 2, expectedProceeds: 0,
      disabled: true, reason: '出售後金幣會超過上限。', code: 'INVALID',
    });
    expectInputsUnchanged(player, playerBefore, rulesBefore);
  });
});
