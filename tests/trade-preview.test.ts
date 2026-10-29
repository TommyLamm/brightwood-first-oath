import { describe, expect, it } from 'vitest';
import type { ItemDef, PlayerProgress, RulesCatalog } from '../src/contracts/index.js';
import { previewBuy } from '../src/ui/trade-preview.js';

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

const coat: ItemDef = {
  id: 'coat', name: '布衣', kind: 'body', slot: 'body', stackLimit: 1, minLevel: 1,
  attack: 0, defense: 1, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 30, sellPrice: 6,
  iconKey: 'item:coat', visualKey: 'equip:coat',
};

// A small, valid domain fixture: these tests exercise the real progression action directly,
// without booting the game, loading a save, or generating gameplay state.
const rules: RulesCatalog = {
  items: { potion, sword, coat },
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

function preview(player: PlayerProgress, quantity: number, atMerchant = true, itemId = potion.id) {
  return previewBuy({ player, rules, itemId, quantity, atMerchant });
}

describe('previewBuy', () => {
  it('prioritizes the merchant requirement over gold and capacity errors', () => {
    const player = makePlayer({ coins: 0, bag: filledBag(32) });
    const before = structuredClone(player);

    expect(preview(player, 1, false)).toMatchObject({
      quantity: 1,
      total: 10,
      disabled: true,
      reason: '需在商人互動中購買',
      code: 'NOT_AT_MERCHANT',
    });
    expect(player).toEqual(before);
  });

  it('returns the domain insufficient-coins result and leaves the player unchanged', () => {
    const player = makePlayer({ coins: 5 });
    const before = structuredClone(player);
    const result = preview(player, 1);

    expect(result).toMatchObject({ disabled: true, code: 'INSUFFICIENT_COINS' });
    expect(result.reason).toContain('金幣不足');
    expect(result.total).toBe(10);
    expect(player).toEqual(before);
  });

  it('uses the domain capacity result when all 32 slots are occupied with no matching stack', () => {
    const player = makePlayer({ bag: filledBag(32) });
    const before = structuredClone(player);
    const result = preview(player, 1);

    expect(result).toMatchObject({ disabled: true, code: 'BAG_FULL' });
    expect(player).toEqual(before);
  });

  it('allows a full bag to accept a purchase into a partially filled matching stack', () => {
    const player = makePlayer({
      bag: [{ itemId: potion.id, quantity: 19 }, ...filledBag(31)],
    });
    const before = structuredClone(player);

    expect(preview(player, 1)).toMatchObject({ quantity: 1, total: 10, disabled: false, code: null, reason: null });
    expect(player).toEqual(before);
  });

  it('allows an exact one-slot stack fit and rejects the same quantity plus one', () => {
    const player = makePlayer({ bag: filledBag(31) });
    const before = structuredClone(player);

    expect(preview(player, 20)).toMatchObject({ quantity: 20, total: 200, disabled: false, code: null });
    expect(player).toEqual(before);

    expect(preview(player, 21)).toMatchObject({ quantity: 21, total: 210, disabled: true, code: 'BAG_FULL' });
    expect(player).toEqual(before);
  });

  it('requires one free slot for a non-stackable item and always previews quantity one', () => {
    const full = makePlayer({ bag: filledBag(32) });
    const oneSlotFree = makePlayer({ bag: filledBag(31) });
    const fullBefore = structuredClone(full);
    const freeBefore = structuredClone(oneSlotFree);

    expect(preview(full, 9, true, coat.id)).toMatchObject({
      quantity: 1, total: 30, disabled: true, code: 'BAG_FULL',
    });
    expect(preview(oneSlotFree, 9, true, coat.id)).toMatchObject({
      quantity: 1, total: 30, disabled: false, code: null,
    });
    expect(full).toEqual(fullBefore);
    expect(oneSlotFree).toEqual(freeBefore);
  });

  it('preserves the selected stackable quantity through 99 and leaves the input player unchanged', () => {
    const player = makePlayer({ coins: 990 });
    const before = structuredClone(player);

    expect(preview(player, 99)).toMatchObject({ quantity: 99, total: 990, disabled: false, code: null });
    expect(player).toEqual(before);
  });
});
