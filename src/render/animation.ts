import type { AssetAnimation } from '../contracts/asset-manifest.js';
import type { MovementState, MonsterMode } from '../contracts/types.js';
import type { SkillDef } from '../contracts/definitions.js';
import type { HeroAnchorPose } from '../contracts/hero-anchors.js';
import type { VisualEvent } from '../contracts/ports.js';

export type HeroAnimationState = HeroAnchorPose;

type MovementAnimationState = Pick<MovementState, 'mode' | 'velocity' | 'knockbackUntilMs'>;

export function selectHeroAnimation(
  movement: MovementAnimationState,
  hp: number,
  nowMs: number,
  hasAttack: boolean,
  requestedAnimationKey = 'idle',
): HeroAnimationState {
  if (movement.mode === 'dead' || hp <= 0) return 'dead';
  if (movement.knockbackUntilMs > nowMs) return 'hurt';
  if (hasAttack) return 'attack';
  if (movement.mode === 'climbing') return 'climb';
  if (movement.mode === 'airborne') return 'jump';
  if (requestedAnimationKey === 'buff') return 'buff';
  return Math.abs(movement.velocity.x) > 0.1 ? 'walk' : 'idle';
}

export function selectMonsterAnimation(
  monster: {
    monsterId: string;
    mode: MonsterMode;
    movement: MovementAnimationState;
  },
  nowMs: number,
  hasAttack: boolean,
): string {
  if (monster.mode === 'dead' || monster.movement.mode === 'dead') return `${monster.monsterId}:dead`;
  if (monster.movement.knockbackUntilMs > nowMs) return `${monster.monsterId}:hurt`;
  if (hasAttack || monster.mode === 'windup') return `${monster.monsterId}:attack`;
  if (
    monster.mode === 'patrol'
    || monster.mode === 'chase'
    || Math.abs(monster.movement.velocity.x) > 0.1
  ) {
    return `${monster.monsterId}:walk`;
  }
  return `${monster.monsterId}:idle`;
}

export function skillAnimationDuration(
  skill: Pick<SkillDef, 'windupMs' | 'activeMs' | 'recoveryMs'> | undefined,
): number {
  return skill ? skill.windupMs + skill.activeMs + skill.recoveryMs : 1;
}

export function pickAnimationFrame(
  animation: Pick<AssetAnimation, 'frames' | 'frameMs' | 'loop'> | undefined,
  nowMs: number,
  startedAtMs?: number,
  totalDurationMs?: number,
): number {
  if (!animation || animation.frames.length === 0) return 0;
  if (totalDurationMs !== undefined && totalDurationMs > 0 && startedAtMs !== undefined) {
    const progress = Math.max(0, Math.min(0.999999, (nowMs - startedAtMs) / totalDurationMs));
    return animation.frames[Math.min(animation.frames.length - 1, Math.floor(progress * animation.frames.length))] ?? 0;
  }
  const duration = animation.frameMs.reduce((sum, value) => sum + value, 0);
  if (duration <= 0) return animation.frames.at(-1) ?? 0;
  if (animation.loop) {
    let elapsed = ((nowMs % duration) + duration) % duration;
    for (let index = 0; index < animation.frames.length; index += 1) {
      if (elapsed < animation.frameMs[index]!) return animation.frames[index]!;
      elapsed -= animation.frameMs[index]!;
    }
  } else {
    let elapsed = Math.max(0, startedAtMs === undefined ? nowMs : nowMs - startedAtMs);
    for (let index = 0; index < animation.frames.length; index += 1) {
      if (elapsed < animation.frameMs[index]!) return animation.frames[index]!;
      elapsed -= animation.frameMs[index]!;
    }
  }
  return animation.frames.at(-1) ?? 0;
}

/** Starts a skill VFX at the hit window and preserves the VFX's authored frame tempo. */
export function pickSkillEffectFrame(
  animation: Pick<AssetAnimation, 'frames' | 'frameMs' | 'loop'> | undefined,
  nowMs: number,
  attackStartedAtMs: number,
  windupMs: number,
): number | null {
  if (!animation || animation.frames.length === 0) return null;
  const effectStartedAtMs = attackStartedAtMs + windupMs;
  const effectDurationMs = animation.frameMs.reduce((sum, value) => sum + value, 0);
  if (nowMs < effectStartedAtMs || nowMs >= effectStartedAtMs + effectDurationMs) return null;
  return pickAnimationFrame(animation, nowMs, effectStartedAtMs);
}

export function claimVisualEventPlayback(eventId: string, playedEventIds: Set<string>): boolean {
  if (playedEventIds.has(eventId)) return false;
  playedEventIds.add(eventId);
  return true;
}

/** Resolves only canonical event effects; callers may supply a content-defined override. */
export function visualEventEffectKey(
  event: Pick<VisualEvent, 'kind' | 'key'>,
  guardEffectKey: string | null | undefined,
): string | undefined {
  if (event.key) return event.key;
  if (event.kind === 'damage' || event.kind === 'hit') return 'vfx:hit';
  if (event.kind === 'levelup') return 'vfx:levelup';
  if (event.kind === 'buff') return guardEffectKey ?? undefined;
  return undefined;
}
