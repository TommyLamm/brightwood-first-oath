import type { DerivedStats, PlayerProgress, Result, RulesCatalog } from '../contracts/index.js';
import { applyProgressAction, deriveStats } from '../domain/progression/index.js';

export type ApAllocationPreviewInput = {
  player: PlayerProgress;
  rules: RulesCatalog;
  stat: 'str' | 'dex';
  amount: number;
};

export type ApAllocationPreview = {
  before: DerivedStats;
  after: DerivedStats;
  remainingAp: number;
};

/** Previews the domain's AP allocation without exposing its draft player. */
export function previewApAllocation(input: ApAllocationPreviewInput): Result<ApAllocationPreview> {
  const result = applyProgressAction(
    input.player,
    { type: 'allocateAp', stat: input.stat, amount: input.amount },
    input.rules,
  );
  if (!result.ok) return { ok: false, code: result.code, message: result.message };

  return {
    ok: true,
    value: {
      before: deriveStats(input.player, input.rules),
      after: deriveStats(result.value, input.rules),
      remainingAp: result.value.ap,
    },
  };
}
