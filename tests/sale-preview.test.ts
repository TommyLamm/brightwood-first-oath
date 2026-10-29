import { describe, expect, it } from 'vitest';
import type { ItemDef, PlayerProgress, RulesCatalog } from '../src/contracts/index.js';
import { applyProgressAction } from '../src/domain/progression/index.js';
import { previewSale } from '../src/ui/sale-preview.js';

const shell: ItemDef = {
  id: 'shell', name: '小貝殼', kind: 'material', slot: null, stackLimit: 20, minLevel: 1,
  attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 0, sellPrice: 1,
  iconKey: 'item:shell', visualKey: null,
};

const questToken: ItemDef = {
  id: 'quest-token', name: '任務信物', kind: 'quest', slot: null, stackLimit: 20, minLevel: 1,
  attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 0, sellPrice: 0,
  iconKey: 'item:quest-token', visualKey: null,
};

// A small, valid domain fixture: these tests exercise the real progression action directly,
// without booting the game, loading a save, or generating gameplay state.
const rules: RulesCatalog = {
  items: { shell, 'quest-token': questToken },
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

describe('previewSale', () => {
  it('prioritizes the merchant requirement over an insufficient-stack error', () => {
    const player = makePlayer({ bag: [{ itemId: shell.id, quantity: 1 }] });
    const before = structuredClone(player);

    expect(previewSale({ player, rules, bagIndex: 0, quantity: 2, atMerchant: false })).toEqual({
      quantity: 2,
      total: 2,
      disabled: true,
      reason: '需在商人互動中出售',
      code: 'NOT_AT_MERCHANT',
    });
    expect(player).toEqual(before);
  });

  it('previews the same successful sale and total as the domain without changing the player', () => {
    const player = makePlayer({ coins: 10, bag: [{ itemId: shell.id, quantity: 5 }] });
    const before = structuredClone(player);
    const domain = applyProgressAction(player, { type: 'sell', bagIndex: 0, quantity: 2 }, rules);

    expect(domain.ok).toBe(true);
    expect(previewSale({ player, rules, bagIndex: 0, quantity: 2, atMerchant: true })).toEqual({
      quantity: 2,
      total: shell.sellPrice * 2,
      disabled: false,
      reason: null,
      code: null,
    });
    expect(player).toEqual(before);
  });

  it('allows a sale exactly to the coin cap and rejects one additional item', () => {
    const player = makePlayer({ coins: 9_999_998, bag: [{ itemId: shell.id, quantity: 2 }] });
    const before = structuredClone(player);

    expect(previewSale({ player, rules, bagIndex: 0, quantity: 1, atMerchant: true })).toMatchObject({
      quantity: 1, total: 1, disabled: false, reason: null, code: null,
    });

    const twoItems = previewSale({ player, rules, bagIndex: 0, quantity: 2, atMerchant: true });
    const domain = applyProgressAction(player, { type: 'sell', bagIndex: 0, quantity: 2 }, rules);
    expect(domain.ok).toBe(false);
    expect(domain.ok ? null : twoItems).toMatchObject({
      quantity: 2, total: 2, disabled: true, code: 'INVALID', reason: domain.ok ? null : domain.message,
    });
    expect(player).toEqual(before);
  });

  it('safely returns the domain result for a stale bag index', () => {
    const player = makePlayer({ bag: [{ itemId: shell.id, quantity: 1 }] });
    const before = structuredClone(player);
    const domain = applyProgressAction(player, { type: 'sell', bagIndex: 1, quantity: 1 }, rules);
    const result = previewSale({ player, rules, bagIndex: 1, quantity: 1, atMerchant: true });

    expect(domain.ok).toBe(false);
    expect(domain.ok ? null : result).toMatchObject({
      quantity: 1, total: 0, disabled: true, code: 'NOT_FOUND', reason: domain.ok ? null : domain.message,
    });
    expect(player).toEqual(before);
  });

  it('keeps the requested total while delegating insufficient quantity and sale restrictions to the domain', () => {
    const player = makePlayer({ bag: [
      { itemId: shell.id, quantity: 1 },
      { itemId: questToken.id, quantity: 1 },
    ] });
    const before = structuredClone(player);

    const insufficient = previewSale({ player, rules, bagIndex: 0, quantity: 2, atMerchant: true });
    const insufficientDomain = applyProgressAction(player, { type: 'sell', bagIndex: 0, quantity: 2 }, rules);
    expect(insufficientDomain.ok).toBe(false);
    expect(insufficientDomain.ok ? null : insufficient).toMatchObject({
      quantity: 2, total: 2, disabled: true, code: 'NOT_FOUND',
      reason: insufficientDomain.ok ? null : insufficientDomain.message,
    });

    const unsellable = previewSale({ player, rules, bagIndex: 1, quantity: 1, atMerchant: true });
    const unsellableDomain = applyProgressAction(player, { type: 'sell', bagIndex: 1, quantity: 1 }, rules);
    expect(unsellableDomain.ok).toBe(false);
    expect(unsellableDomain.ok ? null : unsellable).toMatchObject({
      quantity: 1, total: 0, disabled: true, code: 'REQUIREMENT',
      reason: unsellableDomain.ok ? null : unsellableDomain.message,
    });
    expect(player).toEqual(before);
  });
});
