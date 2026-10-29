import { describe, expect, it } from 'vitest';
import type { PlayerProgress } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { applyProgressAction, createPlayer } from '../src/domain/progression/index.js';
import { previewApAllocation } from '../src/ui/ap-allocation-preview.js';

function makePlayer(overrides: Partial<PlayerProgress> = {}): PlayerProgress {
  return { ...createPlayer('測試旅人', rulesCatalog), ...overrides };
}

function previewWithoutMutation(player: PlayerProgress, stat: 'str' | 'dex', amount: number) {
  const playerBefore = structuredClone(player);
  const rulesBefore = structuredClone(rulesCatalog);
  const preview = previewApAllocation({ player, rules: rulesCatalog, stat, amount });

  expect(player).toEqual(playerBefore);
  expect(rulesCatalog).toEqual(rulesBefore);
  if (preview.ok) {
    expect(preview.value).not.toHaveProperty('player');
  } else {
    expect(preview).not.toHaveProperty('value');
  }
  return preview;
}

function expectFailureMatchesDomain(player: PlayerProgress, stat: 'str' | 'dex', amount: number) {
  const domain = applyProgressAction(player, { type: 'allocateAp', stat, amount }, rulesCatalog);
  if (domain.ok) throw new Error('Expected the domain to reject this AP allocation.');

  const preview = previewWithoutMutation(player, stat, amount);
  if (preview.ok) throw new Error('Expected the preview to preserve the domain rejection.');
  expect(preview).toEqual({ ok: false, code: domain.code, message: domain.message });
  return preview;
}

describe('previewApAllocation', () => {
  it('previews one, five, and all available AP on strength', () => {
    for (const amount of [1, 5, 7]) {
      const preview = previewWithoutMutation(makePlayer({ ap: 7 }), 'str', amount);
      if (!preview.ok) throw new Error(preview.message);

      expect(preview.value.before.attack).toBe(31);
      expect(preview.value.after.attack).toBe(31 + amount * 2);
      expect(preview.value.remainingAp).toBe(7 - amount);
    }
  });

  it('uses the domain defense threshold when dexterity does or does not cross a multiple of four', () => {
    const belowThreshold = previewWithoutMutation(makePlayer({ ap: 1, dex: 4 }), 'dex', 1);
    const crossesThreshold = previewWithoutMutation(makePlayer({ ap: 1, dex: 7 }), 'dex', 1);
    if (!belowThreshold.ok || !crossesThreshold.ok) throw new Error('Expected valid DEX previews.');

    expect(belowThreshold.value.before.defense).toBe(3);
    expect(belowThreshold.value.after.defense).toBe(3);
    expect(crossesThreshold.value.before.defense).toBe(3);
    expect(crossesThreshold.value.after.defense).toBe(4);
  });

  it('previews reaching and already being at the critical chance cap', () => {
    const reachesCap = previewWithoutMutation(makePlayer({ ap: 2, dex: 98 }), 'dex', 2);
    const alreadyCapped = previewWithoutMutation(makePlayer({ ap: 1, dex: 100 }), 'dex', 1);
    if (!reachesCap.ok || !alreadyCapped.ok) throw new Error('Expected valid critical chance previews.');

    expect(reachesCap.value.before.critChance).toBeCloseTo(0.392);
    expect(reachesCap.value.after.critChance).toBe(0.4);
    expect(alreadyCapped.value.before.critChance).toBe(0.4);
    expect(alreadyCapped.value.after.critChance).toBe(0.4);
  });

  it('returns the domain errors for invalid amounts and insufficient AP', () => {
    for (const amount of [0, -1, 1.5, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(expectFailureMatchesDomain(makePlayer({ ap: 5 }), 'str', amount).code).toBe('INVALID');
    }

    expect(expectFailureMatchesDomain(makePlayer({ ap: 1 }), 'dex', 2).code).toBe('REQUIREMENT');
  });

  it('preserves the domain safe-integer overflow rejection', () => {
    const player = makePlayer({
      str: 0,
      dex: Number.MAX_SAFE_INTEGER,
      ap: 2,
      equipment: { weapon: null, body: null, hat: null },
    });

    expect(expectFailureMatchesDomain(player, 'dex', 2)).toEqual({
      ok: false,
      code: 'INVALID',
      message: '能力值超過安全整數範圍。',
    });
  });

  it('keeps equipped gear and passive skill effects in both derived stat snapshots', () => {
    const player = makePlayer({
      job: 'swordsman',
      level: 10,
      str: 20,
      dex: 8,
      ap: 3,
      skillRanks: { vitality: 2 },
      equipment: { weapon: 'iron-sword', body: 'leather-vest', hat: 'leather-cap' },
    });
    const preview = previewWithoutMutation(player, 'str', 1);
    if (!preview.ok) throw new Error(preview.message);

    expect(preview.value.before).toEqual({
      maxHp: 304,
      maxMp: 58,
      attack: 59,
      defense: 13,
      critChance: 0.032,
    });
    expect(preview.value.after).toEqual({
      maxHp: 304,
      maxMp: 58,
      attack: 61,
      defense: 13,
      critChance: 0.032,
    });
    expect(preview.value.remainingAp).toBe(2);
  });
});
