import type { AttackInstance, CombatActor, RandomSource, SkillDef, Vec2 } from '../../contracts/index.js';

export const CRITICAL_MULTIPLIER = 1.5;

export function calculateDamage(
  source: CombatActor,
  target: CombatActor,
  skill: SkillDef,
  rank: number,
  rng: RandomSource,
): { damage: number; critical: boolean } {
  const multiplier = skill.multiplierBase + skill.multiplierPerRank * (rank - 1);
  const variance = 0.95 + 0.1 * rng.next();
  // Only actors that can crit draw a second number, so monster hits keep their old random sequence.
  const chance = Number.isFinite(source.stats.critChance) ? Math.min(1, Math.max(0, source.stats.critChance)) : 0;
  const critical = chance > 0 && rng.next() < chance;
  const base = source.stats.attack * multiplier * (critical ? CRITICAL_MULTIPLIER : 1) - target.stats.defense * 0.5;
  return { damage: Math.max(1, Math.floor(base * variance)), critical };
}

export function calculateKnockback(attack: Pick<AttackInstance, 'origin' | 'facing'>, target: CombatActor): Vec2 {
  if (target.knockbackImmune) return { x: 0, y: 0 };
  const horizontalDirection = target.position.x === attack.origin.x
    ? attack.facing
    : target.position.x > attack.origin.x ? 1 : -1;
  return target.faction === 'player'
    ? { x: horizontalDirection * 140, y: -120 }
    : { x: horizontalDirection * 120, y: -80 };
}

