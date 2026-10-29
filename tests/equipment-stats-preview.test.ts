import { describe, expect, it } from 'vitest';
import type { ItemDef, PlayerProgress, RulesCatalog, SkillDef } from '../src/contracts/index.js';
import { applyProgressAction, deriveStats } from '../src/domain/progression/index.js';
import { previewEquipmentStats } from '../src/ui/equipment-stats-preview.js';
import type { EquipmentPreviewAction } from '../src/ui/equipment-preview.js';

const potion: ItemDef = {
  id: 'potion', name: '紅藥水', kind: 'consumable', slot: null, stackLimit: 20, minLevel: 1,
  attack: 0, defense: 0, hpBonus: 0, restoreHp: 20, restoreMp: 0, buyPrice: 10, sellPrice: 2,
  iconKey: 'item:potion', visualKey: null,
};

const oldSword: ItemDef = {
  id: 'old-sword', name: '舊短劍', kind: 'weapon', slot: 'weapon', stackLimit: 1, minLevel: 1,
  attack: 3, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 20, sellPrice: 4,
  iconKey: 'item:old-sword', visualKey: 'equip:old-sword',
};

const newSword: ItemDef = {
  id: 'new-sword', name: '新短劍', kind: 'weapon', slot: 'weapon', stackLimit: 1, minLevel: 1,
  attack: 9, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 30, sellPrice: 6,
  iconKey: 'item:new-sword', visualKey: 'equip:new-sword',
};

const advancedSword: ItemDef = {
  id: 'advanced-sword', name: '進階短劍', kind: 'weapon', slot: 'weapon', stackLimit: 1, minLevel: 2,
  attack: 12, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0, buyPrice: 40, sellPrice: 8,
  iconKey: 'item:advanced-sword', visualKey: 'equip:advanced-sword',
};

const oldVest: ItemDef = {
  id: 'old-vest', name: '舊皮甲', kind: 'body', slot: 'body', stackLimit: 1, minLevel: 1,
  attack: 0, defense: 4, hpBonus: 40, restoreHp: 0, restoreMp: 0, buyPrice: 40, sellPrice: 8,
  iconKey: 'item:old-vest', visualKey: 'equip:old-vest',
};

const newVest: ItemDef = {
  id: 'new-vest', name: '新皮甲', kind: 'body', slot: 'body', stackLimit: 1, minLevel: 1,
  attack: 0, defense: 6, hpBonus: 7, restoreHp: 0, restoreMp: 0, buyPrice: 50, sellPrice: 10,
  iconKey: 'item:new-vest', visualKey: 'equip:new-vest',
};

const vitality: SkillDef = {
  id: 'vitality', name: '生命鍛鍊', kind: 'passive', maxRank: 10, requiredLevel: 10,
  requiredJob: 'swordsman', mpCost: 0, cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
  reach: 0, height: 0, targets: 0, multiplierBase: 0, multiplierPerRank: 0,
  durationMs: 0, defensePerRank: 0, hpPerRank: 12, regenPerRank: 0, effectKey: null,
};

// Small valid domain fixtures keep these cases independent of game boot and save data.
const rules: RulesCatalog = {
  items: {
    potion, 'old-sword': oldSword, 'new-sword': newSword, 'advanced-sword': advancedSword,
    'old-vest': oldVest, 'new-vest': newVest,
  },
  skills: { vitality },
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

function expectSuccessfulPreview(player: PlayerProgress, action: EquipmentPreviewAction) {
  const playerBefore = structuredClone(player);
  const rulesBefore = structuredClone(rules);
  const domainResult = applyProgressAction(player, action, rules);
  if (!domainResult.ok) throw new Error(domainResult.message);

  const preview = previewEquipmentStats({ player, rules, action });
  if (!preview.ok) throw new Error(preview.message);
  expect(preview.value).toEqual({
    before: deriveStats(player, rules),
    after: deriveStats(domainResult.value, rules),
  });
  expect(Object.keys(preview.value).sort()).toEqual(['after', 'before']);
  expect(preview.value).not.toHaveProperty('player');
  expect(preview.value.before).not.toHaveProperty('hp');
  expect(preview.value.after).not.toHaveProperty('hp');
  expect(player).toEqual(playerBefore);
  expect(rules).toEqual(rulesBefore);
  return preview.value;
}

function expectFailureMatchesDomain(player: PlayerProgress, action: EquipmentPreviewAction) {
  const playerBefore = structuredClone(player);
  const rulesBefore = structuredClone(rules);
  const domainResult = applyProgressAction(player, action, rules);
  if (domainResult.ok) throw new Error('Expected the domain to reject this equipment action.');

  const preview = previewEquipmentStats({ player, rules, action });
  expect(preview).toEqual({ ok: false, code: domainResult.code, message: domainResult.message });
  expect(preview).not.toHaveProperty('value');
  expect(player).toEqual(playerBefore);
  expect(rules).toEqual(rulesBefore);
  return preview;
}

describe('previewEquipmentStats', () => {
  it('previews the actual stats for replacing an equipped weapon', () => {
    const player = makePlayer({
      bag: [{ itemId: newSword.id, quantity: 1 }],
      equipment: { weapon: oldSword.id, body: null, hat: null },
    });

    const preview = expectSuccessfulPreview(player, { type: 'equip', bagIndex: 0 });
    expect(preview.before.attack).toBe(30);
    expect(preview.after.attack).toBe(36);
  });

  it('previews body unequip defense and max HP without changing the original HP', () => {
    const player = makePlayer({
      hp: 110,
      equipment: { weapon: null, body: oldVest.id, hat: null },
    });

    const preview = expectSuccessfulPreview(player, { type: 'unequip', slot: 'body' });
    expect(preview.before.defense).toBe(5);
    expect(preview.after.defense).toBe(1);
    expect(preview.before.maxHp).toBe(120);
    expect(preview.after.maxHp).toBe(80);
    expect(player.hp).toBe(110);
  });

  it('previews an equipment exchange with a full bag', () => {
    const player = makePlayer({
      bag: [{ itemId: newSword.id, quantity: 1 }, ...potions(31)],
      equipment: { weapon: oldSword.id, body: null, hat: null },
    });

    const preview = expectSuccessfulPreview(player, { type: 'equip', bagIndex: 0 });
    expect(player.bag).toHaveLength(32);
    expect(preview.before.attack).toBe(30);
    expect(preview.after.attack).toBe(36);
  });

  it('preserves domain errors for full-bag unequip, unmet level, stale index, and empty slot', () => {
    const fullBag = makePlayer({
      bag: potions(32),
      equipment: { weapon: oldSword.id, body: null, hat: null },
    });
    expect(expectFailureMatchesDomain(fullBag, { type: 'unequip', slot: 'weapon' })).toMatchObject({ code: 'BAG_FULL' });

    const tooAdvanced = makePlayer({ bag: [{ itemId: advancedSword.id, quantity: 1 }] });
    expect(expectFailureMatchesDomain(tooAdvanced, { type: 'equip', bagIndex: 0 })).toMatchObject({ code: 'REQUIREMENT' });

    const staleIndex = makePlayer();
    expect(expectFailureMatchesDomain(staleIndex, { type: 'equip', bagIndex: 0 })).toMatchObject({ code: 'NOT_FOUND' });

    const emptySlot = makePlayer();
    expect(expectFailureMatchesDomain(emptySlot, { type: 'unequip', slot: 'weapon' })).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('uses domain-derived level and vitality stats when replacing body equipment', () => {
    const player = makePlayer({
      job: 'swordsman', level: 10, str: 20, dex: 8, hp: 300,
      skillRanks: { vitality: 2 },
      bag: [{ itemId: newVest.id, quantity: 1 }],
      equipment: { weapon: null, body: oldVest.id, hat: null },
    });

    const preview = expectSuccessfulPreview(player, { type: 'equip', bagIndex: 0 });
    expect(preview.before.maxHp).toBe(324);
    expect(preview.after.maxHp).toBe(291);
    expect(preview.before.maxMp).toBe(58);
    expect(preview.after.maxMp).toBe(58);
  });
});
