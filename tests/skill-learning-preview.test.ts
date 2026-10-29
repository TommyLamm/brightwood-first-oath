import { describe, expect, it } from 'vitest';
import type { PlayerProgress } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { applyProgressAction, createPlayer, deriveStats } from '../src/domain/progression/index.js';
import { previewSkillLearning } from '../src/ui/skill-learning-preview.js';

function makePlayer(overrides: Partial<PlayerProgress> = {}): PlayerProgress {
  return { ...createPlayer('測試旅人', rulesCatalog), ...overrides };
}

function previewWithoutMutation(player: PlayerProgress, skillId: string) {
  const playerBefore = structuredClone(player);
  const rulesBefore = structuredClone(rulesCatalog);
  const preview = previewSkillLearning({ player, rules: rulesCatalog, skillId });

  expect(player).toEqual(playerBefore);
  expect(rulesCatalog).toEqual(rulesBefore);
  if (preview.ok) {
    expect(Object.keys(preview.value).sort()).toEqual(['after', 'before', 'remainingSp']);
    expect(preview.value).not.toHaveProperty('player');
    expect(preview.value).not.toHaveProperty('hp');
    expect(preview.value).not.toHaveProperty('mp');
    for (const stats of [preview.value.before, preview.value.after]) {
      expect(stats).not.toHaveProperty('player');
      expect(stats).not.toHaveProperty('hp');
      expect(stats).not.toHaveProperty('mp');
    }
  } else {
    expect(preview).not.toHaveProperty('value');
  }
  return preview;
}

function expectFailureMatchesDomain(player: PlayerProgress, skillId: string) {
  const domain = applyProgressAction(player, { type: 'learnSkill', skillId }, rulesCatalog);
  if (domain.ok) throw new Error('Expected the domain to reject this skill-learning action.');

  const preview = previewWithoutMutation(player, skillId);
  if (preview.ok) throw new Error('Expected the preview to preserve the domain rejection.');
  expect(preview).toEqual({ ok: false, code: domain.code, message: domain.message });
  return preview;
}

describe('previewSkillLearning', () => {
  it('previews learning and upgrading an attack skill with the matching SP cost', () => {
    const firstRank = makePlayer({ job: 'swordsman', level: 10, sp: 2 });
    const firstRankDomain = applyProgressAction(
      firstRank,
      { type: 'learnSkill', skillId: 'heavy-strike' },
      rulesCatalog,
    );
    if (!firstRankDomain.ok) throw new Error(firstRankDomain.message);

    const firstRankPreview = previewWithoutMutation(firstRank, 'heavy-strike');
    if (!firstRankPreview.ok) throw new Error(firstRankPreview.message);
    expect(firstRankDomain.value.skillRanks['heavy-strike']).toBe(1);
    expect(firstRankPreview.value.before).toEqual(deriveStats(firstRank, rulesCatalog));
    expect(firstRankPreview.value.after).toEqual(deriveStats(firstRankDomain.value, rulesCatalog));
    expect(firstRankPreview.value.remainingSp).toBe(1);

    const nextRank = makePlayer({
      job: 'swordsman',
      level: 10,
      sp: 1,
      skillRanks: { 'heavy-strike': 1 },
    });
    const nextRankDomain = applyProgressAction(
      nextRank,
      { type: 'learnSkill', skillId: 'heavy-strike' },
      rulesCatalog,
    );
    if (!nextRankDomain.ok) throw new Error(nextRankDomain.message);

    const nextRankPreview = previewWithoutMutation(nextRank, 'heavy-strike');
    if (!nextRankPreview.ok) throw new Error(nextRankPreview.message);
    expect(nextRankDomain.value.skillRanks['heavy-strike']).toBe(2);
    expect(nextRankPreview.value.before).toEqual(deriveStats(nextRank, rulesCatalog));
    expect(nextRankPreview.value.after).toEqual(deriveStats(nextRankDomain.value, rulesCatalog));
    expect(nextRankPreview.value.remainingSp).toBe(0);
  });

  it('allows spending the last SP and reports zero remaining', () => {
    const player = makePlayer({ job: 'swordsman', level: 10, sp: 1 });
    const preview = previewWithoutMutation(player, 'heavy-strike');

    if (!preview.ok) throw new Error(preview.message);
    expect(preview.value.remainingSp).toBe(0);
  });

  it('shows vitality max-HP gains when learned and upgraded without refilling current HP', () => {
    const firstRank = makePlayer({ job: 'swordsman', level: 10, sp: 1, hp: 200 });
    const firstRankPreview = previewWithoutMutation(firstRank, 'vitality');
    if (!firstRankPreview.ok) throw new Error(firstRankPreview.message);
    expect(firstRankPreview.value.before.maxHp).toBe(260);
    expect(firstRankPreview.value.after.maxHp).toBe(272);
    expect(firstRank.hp).toBe(200);

    const nextRank = makePlayer({
      job: 'swordsman',
      level: 10,
      sp: 1,
      hp: 200,
      skillRanks: { vitality: 1 },
    });
    const nextRankPreview = previewWithoutMutation(nextRank, 'vitality');
    if (!nextRankPreview.ok) throw new Error(nextRankPreview.message);
    expect(nextRankPreview.value.before.maxHp).toBe(272);
    expect(nextRankPreview.value.after.maxHp).toBe(284);
    expect(nextRank.hp).toBe(200);
  });

  it('preserves unknown and non-learnable skill failures', () => {
    expect(expectFailureMatchesDomain(makePlayer(), 'missing-skill')).toEqual({
      ok: false,
      code: 'NOT_FOUND',
      message: '找不到技能：missing-skill。',
    });
    expect(expectFailureMatchesDomain(makePlayer(), 'enemy-melee')).toEqual({
      ok: false,
      code: 'REQUIREMENT',
      message: '「近身攻擊」不能由玩家學習。',
    });
  });

  it('preserves job, level, SP, and max-rank failures in domain validation order', () => {
    expect(expectFailureMatchesDomain(makePlayer({ job: 'beginner', level: 1, sp: 0 }), 'heavy-strike').message)
      .toBe('只有劍士可以學習這項技能。');
    expect(expectFailureMatchesDomain(makePlayer({ job: 'swordsman', level: 9, sp: 0 }), 'heavy-strike').message)
      .toBe('需要等級 10 才能學習。');
    expect(expectFailureMatchesDomain(makePlayer({
      job: 'swordsman',
      level: 10,
      sp: 0,
      skillRanks: { 'heavy-strike': 10 },
    }), 'heavy-strike').message)
      .toBe('可用 SP 不足。');
    expect(expectFailureMatchesDomain(makePlayer({
      job: 'swordsman',
      level: 10,
      sp: 1,
      skillRanks: { 'heavy-strike': 10 },
    }), 'heavy-strike').message).toBe('技能已達最高等級。');
  });
});
