import type { PlayerProgress, Result, RulesCatalog, Vec2 } from '../contracts/index.js';
import type { DropState } from '../contracts/ports.js';
import { checkCoinCapacity, checkItemCapacity } from '../domain/progression/index.js';

export const PICKUP_RANGE_PX = 90;

/** One target rule for the command, held-key repeat and its contextual reminder. */
export function findPickupTarget(
  drops: readonly DropState[],
  position: Readonly<Vec2>,
  nowMs: number,
  player: PlayerProgress,
  rules: RulesCatalog,
): { drop: DropState; result: Result<void> } | null {
  let best: { drop: DropState; result: Result<void> } | null = null;
  let bestDistance = Infinity;
  for (const drop of drops) {
    if (!(drop.expiresAtMs > nowMs)) continue;
    const distance = (drop.position.x - position.x) ** 2 + (drop.position.y - position.y) ** 2;
    if (!(distance <= PICKUP_RANGE_PX ** 2)) continue;
    const nearer = !best || distance < bestDistance || (distance === bestDistance && drop.id.localeCompare(best.drop.id) < 0);
    if (best?.result.ok && !nearer) continue;
    const result = drop.itemId === null
      ? checkCoinCapacity(player, drop.coins)
      : checkItemCapacity(player, { itemId: drop.itemId, quantity: drop.quantity }, rules);
    // A collectible drop always outranks a blocked one. Within each group, keep the nearest.
    if (!best || (result.ok === best.result.ok ? nearer : result.ok)) {
      best = { drop, result };
      bestDistance = distance;
    }
  }
  return best;
}
