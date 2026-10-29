import type { DerivedStats, Id, PlayerProgress, Result, RulesCatalog } from '../contracts/index.js';
import { applyProgressAction, deriveStats } from '../domain/progression/index.js';

export type SkillLearningPreviewInput = {
  player: PlayerProgress;
  rules: RulesCatalog;
  skillId: Id;
};

export type SkillLearningPreview = {
  before: DerivedStats;
  after: DerivedStats;
  remainingSp: number;
};

/** Previews the domain skill-learning action without exposing its draft player. */
export function previewSkillLearning(input: SkillLearningPreviewInput): Result<SkillLearningPreview> {
  const result = applyProgressAction(
    input.player,
    { type: 'learnSkill', skillId: input.skillId },
    input.rules,
  );
  if (!result.ok) return { ok: false, code: result.code, message: result.message };

  return {
    ok: true,
    value: {
      before: deriveStats(input.player, input.rules),
      after: deriveStats(result.value, input.rules),
      remainingSp: result.value.sp,
    },
  };
}
