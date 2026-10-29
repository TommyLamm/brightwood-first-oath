import type { ErrorCode, PlayerProgress, RulesCatalog } from '../contracts/index.js';
import { applyProgressAction } from '../domain/progression/index.js';

export type SalePreviewCode = ErrorCode | 'NOT_AT_MERCHANT' | null;

export type SalePreviewInput = {
  player: PlayerProgress;
  rules: RulesCatalog;
  bagIndex: number;
  /** Callers provide an integer quantity from 1 through the current stack quantity. */
  quantity: number;
  atMerchant: boolean;
};

export type SalePreview = {
  quantity: number;
  total: number;
  disabled: boolean;
  /** Merchant refusal takes priority; otherwise this is the domain error message, or null. */
  reason: string | null;
  /** `NOT_AT_MERCHANT` is a UI precondition; sale failures come from the domain. */
  code: SalePreviewCode;
};

/**
 * Read-only preview for selling one bag stack. The domain result's player is deliberately
 * discarded so previewing never commits a sale.
 */
export function previewSale(input: SalePreviewInput): SalePreview {
  const hasValidIndex = Number.isSafeInteger(input.bagIndex)
    && input.bagIndex >= 0
    && input.bagIndex < input.player.bag.length;
  const stack = hasValidIndex ? input.player.bag[input.bagIndex] : undefined;
  const item = stack === undefined ? undefined : input.rules.items[stack.itemId];
  const total = item === undefined ? 0 : item.sellPrice * input.quantity;

  if (!input.atMerchant) {
    return {
      quantity: input.quantity,
      total,
      disabled: true,
      reason: '需在商人互動中出售',
      code: 'NOT_AT_MERCHANT',
    };
  }

  const result = applyProgressAction(
    input.player,
    { type: 'sell', bagIndex: input.bagIndex, quantity: input.quantity },
    input.rules,
  );
  if (!result.ok) {
    return {
      quantity: input.quantity,
      total,
      disabled: true,
      reason: result.message,
      code: result.code,
    };
  }

  return { quantity: input.quantity, total, disabled: false, reason: null, code: null };
}
