import type { AttackInstance, CombatActor, MapDef, MovementConfig, MovementState } from '../../contracts/index.js';
import { stepMovement } from '../movement/index.js';

export const MAGE_MUZZLE = { x: 22, y: -32 };

/** Walk the whole body through the same solver in small segments. Stop before walls, gaps and locked portals. */
export function blinkDestination(movement: MovementState, map: MapDef, config: MovementConfig, nowMs: number,
  claimedQuests: ReadonlySet<string> = new Set(), maxDistance = 120): MovementState | null {
  if (movement.mode !== 'grounded' || nowMs < movement.knockbackUntilMs) return null;
  let current = { ...movement, position: { ...movement.position }, velocity: { x: 0, y: 0 } };
  let distance = 0;
  for (let step = 0; step < Math.floor(maxDistance / 4); step += 1) {
    const wantedX = current.position.x + movement.facing * 4;
    if (map.portals.some((portal) => portal.requiredQuestId && !claimedQuests.has(portal.requiredQuestId)
      && (portal.x - current.position.x) * movement.facing >= 0
      && (portal.x - wantedX) * movement.facing <= config.width / 2)) break;
    const next = stepMovement(current, { moveX: movement.facing, climbY: 0, jumpPressed: false, downHeld: false },
      map, { ...config, speed: 240 }, 1 / 60, nowMs);
    if (next.mode !== 'grounded' || Math.abs(next.position.y - movement.position.y) > 3
      || Math.abs(next.position.x - current.position.x) < 0.01) break;
    distance += Math.abs(next.position.x - current.position.x);
    current = next;
  }
  return distance >= 2 ? { ...current, facing: movement.facing, velocity: { x: 0, y: 0 } } : null;
}

/** Circle against the target body, with walls between cast origin and closest point blocking the ring. */
export function frostRingHits(target: CombatActor, attack: AttackInstance, radius: number, map?: MapDef): boolean {
  if (target.projectileImmune) return false;
  const center = { x: attack.origin.x, y: attack.origin.y - 24 };
  const point = { x: Math.max(target.position.x - target.body.width / 2, Math.min(target.position.x + target.body.width / 2, center.x)),
    y: Math.max(target.position.y - target.body.height, Math.min(target.position.y, center.y)) };
  if ((point.x - center.x) ** 2 + (point.y - center.y) ** 2 > radius ** 2) return false;
  return !(map?.walls ?? []).some((wall) => {
    let near = 0; let far = 1;
    for (const [start, delta, low, high] of [
      [center.x, point.x - center.x, wall.x, wall.x + wall.width],
      [center.y, point.y - center.y, wall.y, wall.y + wall.height],
    ] as const) {
      if (Math.abs(delta) < 0.00001) { if (start < low || start > high) return false; }
      else {
        const a = (low - start) / delta; const b = (high - start) / delta;
        near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
        if (near > far) return false;
      }
    }
    return near <= far;
  });
}
