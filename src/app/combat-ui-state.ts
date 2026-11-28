import type { ContentCatalog, UiSnapshot } from '../contracts/index.js';
import { effectiveJob } from '../content/rules/jobs.js';
import { attackLockUntil } from '../domain/combat/index.js';
import { attackStanceBlock, windingUpPlayerSkill, type GameplayState } from './gameplay.js';

export type CombatUiState = NonNullable<UiSnapshot['combatUi']>;

/** Derives read-only combat hints from the current runtime gameplay state. */
export function deriveCombatUiState(
  gameplay: GameplayState | null,
  catalog: ContentCatalog,
  nowMs: number,
): CombatUiState {
  if (!gameplay) return { actionLockUntilMs: 0, bufferedSkillId: null, stanceBlock: null };

  const actionLockUntilMs = attackLockUntil(gameplay.combat, gameplay.playerEntityId, catalog.rules, nowMs);

  const bufferedAttack = gameplay.bufferedAttack;
  const bufferedSkillId = gameplay.saveData.player.hp > 0
    && bufferedAttack
    && bufferedAttack.expiresAtMs >= nowMs
    ? bufferedAttack.skillId
    : null;

  const job = effectiveJob(gameplay.saveData.player);
  const windingUp = actionLockUntilMs > nowMs ? windingUpPlayerSkill(gameplay, catalog.rules, nowMs) : undefined;
  const interrupted = gameplay.interruptedSkill;
  const stanceBlock = attackStanceBlock(job, gameplay.movement, nowMs);
  return {
    actionLockUntilMs, bufferedSkillId, stanceBlock,
    ...(windingUp ? { windingUpSkillId: windingUp.skillId } : {}),
    ...(interrupted && interrupted.expiresAtMs > nowMs && gameplay.saveData.player.hp > 0
      ? { interruptedSkillId: interrupted.skillId } : {}),
  };
}
