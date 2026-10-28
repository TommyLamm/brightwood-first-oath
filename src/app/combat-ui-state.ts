import type { ContentCatalog, Id } from '../contracts/index.js';
import type { GameplayState } from './gameplay.js';

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

  let actionLockUntilMs = 0;
  let hasActivePlayerAttack = false;
  for (const attack of gameplay.combat.attacks) {
    if (attack.sourceId !== gameplay.playerEntityId) continue;

    const skill = catalog.rules.skills[attack.skillId];
    if (!skill || skill.kind !== 'attack') continue;

    const attackEndsAtMs = attack.startedAtMs + skill.windupMs + skill.activeMs + skill.recoveryMs;
    if (nowMs >= attackEndsAtMs) continue;

    actionLockUntilMs = hasActivePlayerAttack
      ? Math.max(actionLockUntilMs, attackEndsAtMs)
      : attackEndsAtMs;
    hasActivePlayerAttack = true;
  }

  const bufferedAttack = gameplay.bufferedAttack;
  const bufferedSkillId = gameplay.saveData.player.hp > 0
    && bufferedAttack
    && bufferedAttack.expiresAtMs >= nowMs
    ? bufferedAttack.skillId
    : null;

  return { actionLockUntilMs, bufferedSkillId };
}
