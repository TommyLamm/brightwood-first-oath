import type { ContentCatalog, Id } from '../contracts/index.js';
import type { GameplayState } from './gameplay.js';
import { attackLockUntil } from '../domain/combat/index.js';

export type CombatUiState = {
  actionLockUntilMs: number;
  bufferedSkillId: Id | null;
};

/** Derives read-only combat hints from the current runtime gameplay state. */
export function deriveCombatUiState(
  gameplay: GameplayState | null,
  catalog: ContentCatalog,
  nowMs: number,
): CombatUiState {
  if (!gameplay) return { actionLockUntilMs: 0, bufferedSkillId: null };

  const actionLockUntilMs = attackLockUntil(gameplay.combat, gameplay.playerEntityId, catalog.rules, nowMs);

  const bufferedAttack = gameplay.bufferedAttack;
  const bufferedSkillId = gameplay.saveData.player.hp > 0
    && bufferedAttack
    && bufferedAttack.expiresAtMs >= nowMs
    ? bufferedAttack.skillId
    : null;

  return { actionLockUntilMs, bufferedSkillId };
}
