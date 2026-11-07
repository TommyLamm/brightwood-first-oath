import type { ContentCatalog } from '../contracts/index.js';
import type { GameplayState } from './gameplay.js';

/** The same live bonus supplies combat and the explanatory UI. */
export function deriveActiveGuard(gameplay: GameplayState | null, catalog: ContentCatalog, nowMs: number): {
  defenseBonus: number; remainingSeconds: number;
} | null {
  if (!gameplay) return null;
  const rank = gameplay.saveData.player.skillRanks['iron-guard'] ?? 0;
  const ironBonus = gameplay.guardUntilMs > nowMs ? rank * (catalog.rules.skills['iron-guard']?.defensePerRank ?? 0) : 0;
  const rallyBonus = gameplay.saveData.player.specialization === 'guardian' && (gameplay.rallyUntilMs ?? 0) > nowMs ? 20 : 0;
  const defenseBonus = Math.max(ironBonus, rallyBonus);
  const untilMs = rallyBonus > ironBonus ? gameplay.rallyUntilMs! : gameplay.guardUntilMs;
  return defenseBonus === 0 ? null : { defenseBonus, remainingSeconds: Math.ceil((untilMs - nowMs) / 1000) };
}
