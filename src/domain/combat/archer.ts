import type { Facing, MapDef, MovementConfig, MovementState } from '../../contracts/index.js';
import { resolveHorizontalPosition, stepMovement } from '../movement/index.js';

export type RetreatState = { startedAtMs: number; facing: Facing; distance: number; jumped: boolean };
export const AIM_TIME_MS = 600;

export { bowPassiveBonus } from '../../content/rules/jobs.js';

export function canStartRetreat(movement: MovementState, map: MapDef, config: MovementConfig, nowMs: number): boolean {
  if (movement.mode !== 'grounded' || nowMs < movement.knockbackUntilMs) return false;
  const destination = resolveHorizontalPosition(movement.position.x, movement.position.x - movement.facing * 2,
    movement.position.y, map, config);
  return Math.abs(destination - movement.position.x) > 0.01;
}

/** A small hop driven by the normal gravity/terrain solver; travel is capped independently of rank. */
export function stepRetreat(movement: MovementState, retreat: RetreatState, map: MapDef, config: MovementConfig,
  dtSeconds: number, nowMs: number): { movement: MovementState; retreat?: RetreatState } {
  if (nowMs < movement.knockbackUntilMs || movement.mode === 'dead' || movement.mode === 'climbing') return { movement };
  const activeMs = Math.max(0, Math.min(nowMs, retreat.startedAtMs + 200) - Math.max(nowMs - dtSeconds * 1000, retreat.startedAtMs));
  const remaining = Math.max(0, 100 - retreat.distance);
  const speed = dtSeconds > 0 ? Math.min(remaining, 500 * activeMs / 1000) / dtSeconds : 0;
  const moved = stepMovement(movement, { moveX: retreat.facing === 1 ? -1 : 1,
    climbY: 0, jumpPressed: !retreat.jumped, downHeld: false }, map,
    { ...config, speed, jumpVelocity: -150 }, dtSeconds, nowMs);
  moved.facing = retreat.facing;
  const distance = retreat.distance + Math.abs(moved.position.x - movement.position.x);
  const blocked = speed > 0 && Math.abs(moved.position.x - movement.position.x) < 0.001;
  if (blocked || distance >= 100 - 0.001 || nowMs >= retreat.startedAtMs + 200) {
    moved.velocity.x = 0;
    return { movement: moved };
  }
  return { movement: moved, retreat: { ...retreat, distance, jumped: true } };
}
