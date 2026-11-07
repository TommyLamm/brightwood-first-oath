import type { Facing, Vec2 } from './types.js';

/** Measured release point relative to the feet, shared by simulation and rendering. */
export const ARCHER_MUZZLE = { x: 24, y: -32 } as const;
export function archerMuzzle(position: Vec2, facing: Facing): Vec2 {
  return { x: position.x + ARCHER_MUZZLE.x * facing, y: position.y + ARCHER_MUZZLE.y };
}

/** Draw/hold/release/recover, including a second draw on the actual shot schedule. */
export function archeryFrame(elapsedMs: number, windupMs: number, offsets: readonly number[]): number {
  if (elapsedMs < windupMs * 0.4) return 0;
  if (elapsedMs < windupMs) return 1;
  for (let index = 0; index < offsets.length; index += 1) {
    const fired = windupMs + offsets[index]!;
    const next = offsets[index + 1];
    if (elapsedMs < fired + 60) return 2;
    if (next !== undefined && elapsedMs < windupMs + next) return 1;
  }
  return 3;
}
