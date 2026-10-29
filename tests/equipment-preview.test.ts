import { describe, expect, it } from 'vitest';
import type { ItemDef, PlayerProgress, RulesCatalog } from '../src/contracts/index.js';
import { applyProgressAction } from '../src/domain/progression/index.js';
import { previewEquipmentAction, type EquipmentPreviewAction } from '../src/ui/equipment-preview.js';

const potion: ItemDef = {
  id: 'potion', name: '紅藥水', kind: 'consumable', slot: null, stackLimit: 20, minLevel: 1,
  attack: 0, defense: 0, hpBonus: 0, restoreHp: 20, restoreMp: 0, buyPrice: 10, sellPrice: 2,
  iconKey: 'item:potion', visualKey: null,
};

const oldSword: ItemDef = {
  id: 'old-sword', name: '舊短劍', kind: 'weapon', slot: 'weapon', stackLimit: 1, minLevel: 1,
  attack: 1, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 20, sellPrice: 4,
  iconKey: 'item:old-sword', visualKey: 'equip:old-sword',
};

const newSword: ItemDef = {
  id: 'new-sword', name: '新短劍', kind: 'weapon', slot: 'weapon', stackLimit: 1, minLevel: 1,
  attack: 2, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 30, sellPrice: 6,
  iconKey: 'item:new-sword', visualKey: 'equip:new-sword',
};

const advancedSword: ItemDef = {
  id: 'advanced-sword', name: '進階短劍', kind: 'weapon', slot: 'weapon', stackLimit: 1, minLevel: 2,
  attack: 3, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 40, sellPrice: 8,
  iconKey: 'item:advanced-sword', visualKey: 'equip:advanced-sword',
};

// Small valid domain fixtures keep these cases independent of game boot and save data.
const rules: RulesCatalog = {
  items: { potion, 'old-sword': oldSword, 'new-sword': newSword, 'advanced-sword': advancedSword },
  skills: {},
  monsters: {},
  progression: { maxLevel: 10, expToNext: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 0] },
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

function potions(count: number): PlayerProgress['bag'] {
  return Array.from({ length: count }, () => ({ itemId: potion.id, quantity: 1 }));
}

function expectPreviewToMatchDomain(player: PlayerProgress, action: EquipmentPreviewAction) {
  const before = structuredClone(player);
  const domainResult = applyProgressAction(player, action, rules);
  const preview = previewEquipmentAction({ player, rules, action });

  if (domainResult.ok) {
    expect(preview).toEqual({ disabled: false, reason: null, code: null });
  } else {
    expect(preview).toEqual({ disabled: true, reason: domainResult.message, code: domainResult.code });
  }
  expect(preview).not.toHaveProperty('value');
  expect(player).toEqual(before);
  return domainResult;
}

describe('previewEquipmentAction', () => {
  it('allows unequipping when a bag slot is available', () => {
    const player = makePlayer({
      bag: potions(31),
      equipment: { weapon: oldSword.id, body: null, hat: null },
    });

    const result = expectPreviewToMatchDomain(player, { type: 'unequip', slot: 'weapon' });
    expect(result.ok).toBe(true);
  });

  it('reports the domain BAG_FULL refusal when unequipping into a full bag', () => {
    const player = makePlayer({
      bag: potions(32),
      equipment: { weapon: oldSword.id, body: null, hat: null },
    });

    const result = expectPreviewToMatchDomain(player, { type: 'unequip', slot: 'weapon' });
    expect(result).toMatchObject({ ok: false, code: 'BAG_FULL' });
  });

  it('allows a full bag to exchange one gear item for the equipped gear', () => {
    const player = makePlayer({
      bag: [{ itemId: newSword.id, quantity: 1 }, ...potions(31)],
      equipment: { weapon: oldSword.id, body: null, hat: null },
    });

    const result = expectPreviewToMatchDomain(player, { type: 'equip', bagIndex: 0 });
    expect(result.ok).toBe(true);
  });

  it('returns the domain level requirement for equipment above the player level', () => {
    const player = makePlayer({ bag: [{ itemId: advancedSword.id, quantity: 1 }] });

    const result = expectPreviewToMatchDomain(player, { type: 'equip', bagIndex: 0 });
    expect(result).toMatchObject({ ok: false, code: 'REQUIREMENT' });
  });

  it('rejects an empty equipment slot through the domain result', () => {
    const player = makePlayer();

    const result = expectPreviewToMatchDomain(player, { type: 'unequip', slot: 'weapon' });
    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });

  it('rejects an outdated bag index through the domain result', () => {
    const player = makePlayer();

    const result = expectPreviewToMatchDomain(player, { type: 'equip', bagIndex: 0 });
    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' });
  });
});
