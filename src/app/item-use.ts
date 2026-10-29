import type { Id, PlayerProgress, Result, RulesCatalog } from '../contracts/index.js';
import { applyProgressAction } from '../domain/progression/index.js';

type ResolveItemUseInput = {
  player: PlayerProgress;
  rules: RulesCatalog;
  requestedItemId: Id;
  nowMs: number;
  potionReadyAtMs: number;
};

export function resolveItemUse({
  player,
  rules,
  requestedItemId,
  nowMs,
  potionReadyAtMs,
}: ResolveItemUseInput): Result<{ player: PlayerProgress; itemId: Id }> {
  if (nowMs < potionReadyAtMs) {
    return { ok: false, code: 'COOLDOWN', message: '藥水還在冷卻中。' };
  }

  let itemId = requestedItemId;
  if (itemId === 'small-red'
    && !player.bag.some((stack) => stack.itemId === 'small-red' && stack.quantity > 0)
    && player.bag.some((stack) => stack.itemId === 'large-red' && stack.quantity > 0)) {
    itemId = 'large-red';
  } else if (itemId === 'small-blue'
    && !player.bag.some((stack) => stack.itemId === 'small-blue' && stack.quantity > 0)
    && player.bag.some((stack) => stack.itemId === 'large-blue' && stack.quantity > 0)) {
    itemId = 'large-blue';
  }

  const item = rules.items[itemId];
  if (item?.kind === 'consumable'
    && !player.bag.some((stack) => stack.itemId === itemId && stack.quantity > 0)) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: `${item.name}已經用完了，可向木葉鎮的木葉商人補貨。`,
    };
  }

  const result = applyProgressAction(player, { type: 'useItem', itemId }, rules);
  if (!result.ok) return { ok: false, code: result.code, message: result.message };
  return { ok: true, value: { player: result.value, itemId } };
}
