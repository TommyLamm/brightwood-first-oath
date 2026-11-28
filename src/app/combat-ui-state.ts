import type { ContentCatalog, UiSnapshot } from '../contracts/index.js';
import { effectiveJob, jobs } from '../content/rules/jobs.js';
import { attackLockUntil } from '../domain/combat/index.js';
import { attackStanceBlock, type GameplayState } from './gameplay.js';

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
  const windingUp = actionLockUntilMs > nowMs && gameplay.saveData.player.hp > 0
    ? gameplay.combat.attacks.find((attack) => attack.sourceId === gameplay.playerEntityId
      && attack.skillId !== jobs[job].basicSkill && attack.startedAtMs <= nowMs
      && nowMs < attack.startedAtMs + (catalog.rules.skills[attack.skillId]?.windupMs ?? 0))
    : undefined;
  const stanceBlock = attackStanceBlock(job, gameplay.movement, nowMs);
  return { actionLockUntilMs, bufferedSkillId, stanceBlock, ...(windingUp ? { windingUpSkillId: windingUp.skillId } : {}) };
}
