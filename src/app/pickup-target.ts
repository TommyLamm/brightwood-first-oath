import type { PlayerProgress, Result, RulesCatalog, Vec2 } from '../contracts/index.js';
import type { DropState } from '../contracts/ports.js';
import { applyProgressAction } from '../domain/progression/index.js';

export const PICKUP_RANGE_PX = 90;

/** One target rule for the command, held-key repeat and its contextual reminder. */
export function findPickupTarget(
  drops: readonly DropState[],
  position: Readonly<Vec2>,
  nowMs: number,
  player: PlayerProgress,
  rules: RulesCatalog,
): { drop: DropState; result: Result<PlayerProgress> } | null {
  const nearby = drops.filter((drop) => drop.expiresAtMs > nowMs)
    .map((drop) => ({ drop, distance: Math.hypot(drop.position.x - position.x, drop.position.y - position.y) }))
    .filter(({ distance }) => distance <= PICKUP_RANGE_PX)
    .sort((a, b) => a.distance - b.distance || a.drop.id.localeCompare(b.drop.id));
  let blocked: { drop: DropState; result: Result<PlayerProgress> } | null = null;
  for (const { drop } of nearby) {
    const result = drop.itemId === null
      ? applyProgressAction(player, { type: 'gainReward', reward: { exp: 0, coins: drop.coins, items: [] } }, rules)
      : applyProgressAction(player, { type: 'addItem', stack: { itemId: drop.itemId, quantity: drop.quantity } }, rules);
    if (result.ok) return { drop, result };
    blocked ??= { drop, result };
  }
  return blocked;
}
