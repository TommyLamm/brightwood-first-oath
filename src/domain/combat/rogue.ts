import type { MovementConfig, MovementState, MapDef } from '../../contracts/index.js';
import { blinkDestination } from './mage.js';

export const RHYTHM_LIFETIME_MS = 4000;
export type RogueRhythm = { stacks: number; expiresAtMs: number };
export type SmokeZone = { position: { x: number; y: number }; expiresAtMs: number };

/** Same full-body sweep as blink, capped at 96px. No target snapping or invulnerability. */
export function lungeDestination(movement: MovementState, map: MapDef, config: MovementConfig,
  nowMs: number, claimed: ReadonlySet<string>): MovementState | null {
  const blocked = 'rogue:portal-boundary';
  const sweptMap = { ...map, portals: map.portals.filter((portal) => Math.abs(portal.y - movement.position.y) <= config.height)
    .map((portal) => ({ ...portal, requiredQuestId: blocked })) };
  return blinkDestination(movement, sweptMap, config, nowMs, new Set([...claimed].filter((id) => id !== blocked)), 96);
}

export function gainRhythm(previous: RogueRhythm | undefined, nowMs: number): RogueRhythm {
  return { stacks: Math.min(3, (previous && nowMs < previous.expiresAtMs ? previous.stacks : 0) + 1),
    expiresAtMs: nowMs + RHYTHM_LIFETIME_MS };
}
