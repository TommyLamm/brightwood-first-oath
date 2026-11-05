import type { ContentCatalog } from '../contracts/index.js';
import type { GameplayState } from './gameplay.js';

/** The same live bonus supplies combat and the explanatory UI. */
export function deriveActiveGuard(gameplay: GameplayState | null, catalog: ContentCatalog, nowMs: number): {
  defenseBonus: number; remainingSeconds: number;
} | null {
  if (!gameplay || gameplay.guardUntilMs <= nowMs) return null;
  const rank = gameplay.saveData.player.skillRanks['iron-guard'] ?? 0;
  const defenseBonus = rank * (catalog.rules.skills['iron-guard']?.defensePerRank ?? 0);
  return defenseBonus === 0 ? null : { defenseBonus, remainingSeconds: Math.ceil((gameplay.guardUntilMs - nowMs) / 1000) };
}
