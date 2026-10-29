import type { ErrorCode, Id, PlayerProgress, RulesCatalog } from '../contracts/index.js';
import { applyProgressAction } from '../domain/progression/index.js';

export type TradePreviewCode = ErrorCode | 'NOT_AT_MERCHANT' | null;

export type TradePreviewInput = {
  player: PlayerProgress;
  rules: RulesCatalog;
  itemId: Id;
  /** The product-card quantity, already validated as an integer from 1 to 99. */
  quantity: number;
  atMerchant: boolean;
};

export type TradePreview = {
  /** Stackable purchases keep the supplied 1–99 quantity; non-stackable items use 1. */
  quantity: number;
  total: number;
  disabled: boolean;
  /** Merchant refusal takes priority; otherwise this is the domain error message, or null. */
  reason: string | null;
  /** `NOT_AT_MERCHANT` is a UI precondition; all purchase failures come from the domain. */
  code: TradePreviewCode;
};

/**
 * Read-only buy preview for a shop card. Callers must pass a valid quantity draft for stackable
 * items. The domain result's player is deliberately discarded so previewing never commits a buy.
 */
export function previewBuy(input: TradePreviewInput): TradePreview {
  const item = input.rules.items[input.itemId];
  const quantity = item !== undefined && item.stackLimit > 1 ? input.quantity : 1;
  const total = item === undefined ? 0 : item.buyPrice * quantity;

  if (!input.atMerchant) {
    return {
      quantity,
      total,
      disabled: true,
      reason: '需在商人互動中購買',
      code: 'NOT_AT_MERCHANT',
    };
  }

  const result = applyProgressAction(input.player, { type: 'buy', itemId: input.itemId, quantity }, input.rules);
  if (!result.ok) {
    return {
      quantity,
      total,
      disabled: true,
      reason: result.message,
      code: result.code,
    };
  }

  return { quantity, total, disabled: false, reason: null, code: null };
}
