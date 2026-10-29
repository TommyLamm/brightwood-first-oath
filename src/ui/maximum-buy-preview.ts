import { previewBuy, type TradePreview, type TradePreviewInput } from './trade-preview.js';

/**
 * Select the largest affordable, valid stack quantity without applying the purchase.
 * The domain remains the source of truth for gold and bag capacity.
 */
export function previewMaximumBuy(input: Omit<TradePreviewInput, 'quantity'>): TradePreview {
  const oneItemPreview = previewBuy({ ...input, quantity: 1 });
  if (oneItemPreview.disabled) return oneItemPreview;

  const item = input.rules.items[input.itemId];
  if (item === undefined || item.stackLimit <= 1) return oneItemPreview;

  // Including the initial quantity-one preview, this loop makes at most 99 domain previews.
  for (let quantity = 99; quantity >= 2; quantity -= 1) {
    const candidate = previewBuy({ ...input, quantity });
    if (!candidate.disabled) return candidate;
  }

  return oneItemPreview;
}
