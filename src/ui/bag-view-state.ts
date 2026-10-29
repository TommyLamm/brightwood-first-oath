import type { BagStack } from '../contracts/types.js';

export type BagViewReconciliation = {
  selectedBagIndex: number | null;
  sellQuantities: Map<number, number>;
  structureChanged: boolean;
  hadAffectedState: boolean;
};

/** Reconcile panel-only bag state without changing either bag or the input map. */
export function reconcileBagViewState(
  prevBag: readonly BagStack[],
  nextBag: readonly BagStack[],
  selectedBagIndex: number | null,
  sellQuantities: ReadonlyMap<number, number>,
): BagViewReconciliation {
  const structureChanged = prevBag.length !== nextBag.length
    || prevBag.some((stack, index) => stack.itemId !== nextBag[index]?.itemId);
  const hadAffectedState = selectedBagIndex !== null || sellQuantities.size > 0;

  if (structureChanged) {
    return {
      selectedBagIndex: null,
      sellQuantities: new Map(),
      structureChanged,
      hadAffectedState,
    };
  }

  const selectionIsValid = selectedBagIndex !== null
    && Number.isInteger(selectedBagIndex)
    && selectedBagIndex >= 0
    && selectedBagIndex < nextBag.length;
  const reconciledSellQuantities = new Map<number, number>();

  for (const [bagIndex, quantity] of sellQuantities) {
    if (!Number.isInteger(bagIndex) || bagIndex < 0 || bagIndex >= nextBag.length) continue;

    const stack = nextBag[bagIndex]!;
    const boundedQuantity = Number.isFinite(quantity) ? quantity : 1;
    reconciledSellQuantities.set(
      bagIndex,
      Math.floor(Math.max(1, Math.min(stack.quantity, boundedQuantity))),
    );
  }

  return {
    selectedBagIndex: selectionIsValid ? selectedBagIndex : null,
    sellQuantities: reconciledSellQuantities,
    structureChanged: false,
    hadAffectedState,
  };
}
