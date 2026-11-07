import type { AttackInstance, CombatActor, Hit, MapDef, ProjectileState, RandomSource, RulesCatalog, SkillDef } from '../../contracts/index.js';
import { calculateDamage, calculateKnockback } from './damage.js';

export const MAX_PROJECTILES = 32;

export function cloneProjectile(arrow: ProjectileState): ProjectileState {
  return { ...arrow, origin: { ...arrow.origin }, position: { ...arrow.position }, hitIds: [...arrow.hitIds], stats: { ...arrow.stats } };
}

/** Called on a cloned attack. Each scheduled arrow is emitted at most once. */
export function emitProjectiles(attack: AttackInstance, source: CombatActor, skill: SkillDef, nowMs: number): ProjectileState[] {
  const definition = skill.projectile;
  if (!definition || !attack.projectileStats) return [];
  const arrows: ProjectileState[] = [];
  for (let shot = attack.firedShots ?? 0; shot < definition.shotOffsetsMs.length; shot += 1) {
    const firedAtMs = attack.startedAtMs + skill.windupMs + definition.shotOffsetsMs[shot]!;
    if (nowMs < firedAtMs) break;
    // Position is sampled when this arrow is emitted; launch direction and power remain locked.
    const position = source.projectileOffset ? { x: source.position.x + source.projectileOffset.x * attack.facing,
      y: source.position.y + source.projectileOffset.y }
      : { x: source.position.x, y: source.position.y - source.body.height * 0.55 };
    arrows.push({ id: `${attack.id}:arrow:${shot}`, attackId: attack.id, sourceId: source.id, skillId: skill.id,
      ...(source.projectileOffset ? { launchOrigin: { x: source.position.x, y: position.y } } : {}),
      position, origin: { ...position }, facing: attack.facing, rank: attack.rank, firedAtMs,
      expiresAtMs: firedAtMs + definition.lifetimeMs, distance: 0, hitIds: [], stats: { ...attack.projectileStats } });
    if (shot === 0 && attack.firstHitBonus) arrows[arrows.length - 1]!.firstHitBonus = attack.firstHitBonus;
    attack.firedShots = shot + 1;
  }
  return arrows;
}

/** Horizontal swept collision with an expanded rectangle, in travel order (0..1). */
function rectangleTime(x: number, endX: number, y: number, radius: number,
  rect: { x: number; y: number; width: number; height: number }): number | null {
  if (y < rect.y - radius || y > rect.y + rect.height + radius) return null;
  const left = rect.x - radius;
  const right = rect.x + rect.width + radius;
  if (x >= left && x <= right) return 0;
  const delta = endX - x;
  if (delta === 0) return null;
  const time = ((delta > 0 ? left : right) - x) / delta;
  return time >= 0 && time <= 1 ? time : null;
}

function terrainTime(arrow: ProjectileState, endX: number, radius: number, map?: MapDef): number {
  if (!map) return Infinity;
  let first = Infinity;
  for (const wall of map.walls) {
    const time = rectangleTime(arrow.position.x, endX, arrow.position.y, radius, wall);
    if (time !== null) first = Math.min(first, time);
  }
  // Platforms remain line segments, including drop-through surfaces. No invented solid volume below them.
  for (const line of map.footholds) {
    const dy = line.y2 - line.y1;
    let low = 0;
    let high = 1;
    if (dy === 0) {
      if (Math.abs(arrow.position.y - line.y1) > radius) continue;
    } else {
      const a = (arrow.position.y - radius - line.y1) / dy;
      const b = (arrow.position.y + radius - line.y1) / dy;
      low = Math.max(0, Math.min(a, b)); high = Math.min(1, Math.max(a, b));
      if (low > high) continue;
    }
    const a = line.x1 + (line.x2 - line.x1) * low;
    const b = line.x1 + (line.x2 - line.x1) * high;
    const time = rectangleTime(arrow.position.x, endX, arrow.position.y, radius,
      { x: Math.min(a, b), y: arrow.position.y, width: Math.abs(a - b), height: 0 });
    if (time !== null) first = Math.min(first, time);
  }
  return first;
}

export function stepProjectiles(
  current: readonly ProjectileState[], actors: readonly CombatActor[], rules: RulesCatalog,
  dtSeconds: number, nowMs: number, rng: RandomSource, map?: MapDef,
): { projectiles: ProjectileState[]; hits: Hit[] } {
  const projectiles: ProjectileState[] = [];
  const hits: Hit[] = [];
  const elapsedMs = Number.isFinite(dtSeconds) && dtSeconds > 0 ? dtSeconds * 1000 : 0;
  const tickStart = nowMs - elapsedMs;
  for (const original of current) {
    const arrow = cloneProjectile(original);
    const source = actors.find(({ id }) => id === arrow.sourceId);
    const skill = rules.skills[arrow.skillId];
    const definition = skill?.projectile;
    if (!source || source.hp <= 0 || !definition || !skill) continue;
    if (elapsedMs === 0) { projectiles.push(arrow); continue; }
    const flightMs = Math.max(0, Math.min(nowMs, arrow.expiresAtMs) - Math.max(tickStart, arrow.firedAtMs));
    if (flightMs === 0) { if (nowMs < arrow.expiresAtMs) projectiles.push(arrow); continue; }
    const distance = Math.min(Math.max(0, skill.reach - arrow.distance), definition.speed * flightMs / 1000);
    const endX = arrow.position.x + arrow.facing * distance;
    // Sweep through the short body-to-bow segment once: a muzzle beside a wall cannot shoot through it.
    if (arrow.launchOrigin) { arrow.position.x = arrow.launchOrigin.x; delete arrow.launchOrigin; }
    const wall = terrainTime(arrow, endX, definition.radius, map);
    const candidates = actors.flatMap((target) => {
      if (target.hp <= 0 || target.projectileImmune || target.id === source.id || target.faction === source.faction || arrow.hitIds.includes(target.id)) return [];
      const time = rectangleTime(arrow.position.x, endX, arrow.position.y, definition.radius,
        { x: target.position.x - target.body.width / 2, y: target.position.y - (target.projectileHeight ?? target.body.height),
          width: target.body.width, height: target.projectileHeight ?? target.body.height });
      return time === null || time >= wall ? [] : [{ time, target }];
    }).sort((a, b) => a.time - b.time || (a.target.id < b.target.id ? -1 : a.target.id > b.target.id ? 1 : 0));
    if (flightMs > 0) for (const { target } of candidates) {
      if (arrow.hitIds.length >= skill.targets) break;
      const power = { ...source, stats: { ...arrow.stats,
        attack: arrow.stats.attack * (1 + (arrow.hitIds.length === 0 ? arrow.firstHitBonus ?? 0 : 0)) } };
      const damage = calculateDamage(power, target, skill, arrow.rank, rng);
      hits.push({ ...(skill.requiredSpecialization ? { skillId: arrow.skillId } : {}), attackId: arrow.attackId, sourceId: source.id, targetId: target.id, ...damage,
        knockback: calculateKnockback(arrow, target), projectile: true });
      arrow.hitIds.push(target.id);
    }
    arrow.distance += distance;
    arrow.position.x = endX;
    if (wall === Infinity && arrow.hitIds.length < skill.targets && arrow.distance < skill.reach && nowMs < arrow.expiresAtMs) {
      projectiles.push(arrow);
    }
  }
  return { projectiles, hits };
}
