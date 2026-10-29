import { describe, expect, it } from 'vitest';
import type { ItemDef, PlayerProgress, RulesCatalog } from '../src/contracts/index.js';
import { previewMaximumBuy } from '../src/ui/maximum-buy-preview.js';
import type { TradePreviewInput } from '../src/ui/trade-preview.js';

const potion: ItemDef = {
  id: 'potion', name: '紅藥水', kind: 'consumable', slot: null, stackLimit: 20, minLevel: 1,
  attack: 0, defense: 0, hpBonus: 0, restoreHp: 20, restoreMp: 0, buyPrice: 10, sellPrice: 2,
  iconKey: 'item:potion', visualKey: null,
};

const sword: ItemDef = {
  id: 'sword', name: '短劍', kind: 'weapon', slot: 'weapon', stackLimit: 1, minLevel: 1,
  attack: 1, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 25, sellPrice: 5,
  iconKey: 'item:sword', visualKey: 'equip:sword',
};

const material: ItemDef = {
  id: 'ore', name: '鐵礦', kind: 'material', slot: null, stackLimit: 99, minLevel: 1,
  attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 10, sellPrice: 2,
  iconKey: 'item:ore', visualKey: null,
};

const rules: RulesCatalog = {
  items: { potion, sword, ore: material },
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

function filledBag(count: number): PlayerProgress['bag'] {
  return Array.from({ length: count }, () => ({ itemId: sword.id, quantity: 1 }));
}

function previewWithoutMutation(input: Omit<TradePreviewInput, 'quantity'>) {
  const playerBefore = structuredClone(input.player);
  const rulesBefore = structuredClone(input.rules);
  const result = previewMaximumBuy(input);

  expect(input.player).toEqual(playerBefore);
  expect(input.rules).toEqual(rulesBefore);
  expect(result).not.toHaveProperty('player');
  return result;
}

describe('previewMaximumBuy', () => {
  it('chooses the domain-valid stack quantity up to 99', () => {
    const result = previewWithoutMutation({ player: makePlayer({ coins: 5000 }), rules, itemId: potion.id, atMerchant: true });

    expect(result).toEqual({ quantity: 99, total: 990, disabled: false, reason: null, code: null });
  });

  it('stops at the exact amount the player can afford', () => {
    const result = previewWithoutMutation({ player: makePlayer({ coins: 30 }), rules, itemId: potion.id, atMerchant: true });

    expect(result).toEqual({ quantity: 3, total: 30, disabled: false, reason: null, code: null });
  });

  it('uses domain capacity for partial stacks, a free slot, and a full bag', () => {
    const partialStack = makePlayer({
      coins: 1000,
      bag: [{ itemId: potion.id, quantity: 19 }, ...filledBag(31)],
    });
    const partialResult = previewWithoutMutation({ player: partialStack, rules, itemId: potion.id, atMerchant: true });
    expect(partialResult).toMatchObject({ quantity: 1, total: 10, disabled: false, code: null });

    const oneFreeSlot = makePlayer({ coins: 1000, bag: filledBag(31) });
    const freeSlotResult = previewWithoutMutation({ player: oneFreeSlot, rules, itemId: potion.id, atMerchant: true });
    expect(freeSlotResult).toMatchObject({ quantity: 20, total: 200, disabled: false, code: null });

    const fullBag = makePlayer({ coins: 1000, bag: filledBag(32) });
    const fullBagResult = previewWithoutMutation({ player: fullBag, rules, itemId: potion.id, atMerchant: true });
    expect(fullBagResult).toMatchObject({ quantity: 1, disabled: true, code: 'BAG_FULL' });
  });

  it('preserves merchant priority and the domain result for unknown, non-buyable, or unaffordable items', () => {
    const blockedAtMerchant = previewWithoutMutation({
      player: makePlayer({ coins: 0, bag: filledBag(32) }), rules, itemId: potion.id, atMerchant: false,
    });
    expect(blockedAtMerchant).toMatchObject({ quantity: 1, disabled: true, code: 'NOT_AT_MERCHANT' });

    const unknownItem = previewWithoutMutation({ player: makePlayer(), rules, itemId: 'missing-item', atMerchant: true });
    expect(unknownItem).toMatchObject({ quantity: 1, total: 0, disabled: true, code: 'NOT_FOUND' });

    const nonBuyable = previewWithoutMutation({ player: makePlayer(), rules, itemId: material.id, atMerchant: true });
    expect(nonBuyable).toMatchObject({ quantity: 1, disabled: true, code: 'REQUIREMENT' });

    const noGold = previewWithoutMutation({ player: makePlayer({ coins: 0 }), rules, itemId: potion.id, atMerchant: true });
    expect(noGold).toMatchObject({ quantity: 1, disabled: true, code: 'INSUFFICIENT_COINS' });
  });

  it('keeps a non-stackable purchase at quantity one', () => {
    const result = previewWithoutMutation({ player: makePlayer(), rules, itemId: sword.id, atMerchant: true });

    expect(result).toEqual({ quantity: 1, total: 25, disabled: false, reason: null, code: null });
  });
});
