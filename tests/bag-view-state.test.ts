import { describe, expect, it } from 'vitest';
import type { BagStack } from '../src/contracts/types.js';
import { reconcileBagViewState } from '../src/ui/bag-view-state.js';

const bag = (...stacks: BagStack[]): BagStack[] => stacks;

describe('reconcileBagViewState', () => {
  it('preserves state for a cloned bag with the same ordered itemIds', () => {
    const previous = bag({ itemId: 'herb', quantity: 8 }, { itemId: 'sword', quantity: 1 });
    const next = previous.map((stack) => ({ ...stack }));
    const quantities = new Map([[0, 3], [1, 1]]);

    const result = reconcileBagViewState(previous, next, 1, quantities);

    expect(result).toEqual({
      selectedBagIndex: 1,
      sellQuantities: new Map([[0, 3], [1, 1]]),
      structureChanged: false,
      hadAffectedState: true,
    });
    expect(result.sellQuantities).not.toBe(quantities);
  });

  it('clamps quantities to the current stack and removes invalid indices', () => {
    const previous = bag({ itemId: 'herb', quantity: 8 }, { itemId: 'ore', quantity: 4 });
    const next = bag({ itemId: 'herb', quantity: 3 }, { itemId: 'ore', quantity: 4 });
    const quantities = new Map([[0, 7], [1, 2], [2, 1], [-1, 4]]);

    const result = reconcileBagViewState(previous, next, 0, quantities);

    expect(result.structureChanged).toBe(false);
    expect(result.selectedBagIndex).toBe(0);
    expect(result.sellQuantities).toEqual(new Map([[0, 3], [1, 2]]));
    expect(quantities).toEqual(new Map([[0, 7], [1, 2], [2, 1], [-1, 4]]));
  });

  it.each([
    {
      name: 'removing a stack before the selection',
      previous: bag({ itemId: 'a', quantity: 1 }, { itemId: 'b', quantity: 1 }, { itemId: 'c', quantity: 1 }),
      next: bag({ itemId: 'a', quantity: 1 }, { itemId: 'c', quantity: 1 }),
      selectedIndex: 2,
    },
    {
      name: 'removing the selected stack',
      previous: bag({ itemId: 'a', quantity: 1 }, { itemId: 'b', quantity: 1 }, { itemId: 'c', quantity: 1 }),
      next: bag({ itemId: 'a', quantity: 1 }, { itemId: 'c', quantity: 1 }),
      selectedIndex: 1,
    },
    {
      name: 'removing the final stack',
      previous: bag({ itemId: 'a', quantity: 1 }, { itemId: 'b', quantity: 1 }, { itemId: 'c', quantity: 1 }),
      next: bag({ itemId: 'a', quantity: 1 }, { itemId: 'b', quantity: 1 }),
      selectedIndex: 2,
    },
    {
      name: 'adding a stack',
      previous: bag({ itemId: 'a', quantity: 1 }),
      next: bag({ itemId: 'a', quantity: 1 }, { itemId: 'b', quantity: 1 }),
      selectedIndex: 0,
    },
    {
      name: 'changing an itemId in place',
      previous: bag({ itemId: 'a', quantity: 1 }, { itemId: 'b', quantity: 1 }),
      next: bag({ itemId: 'a', quantity: 1 }, { itemId: 'c', quantity: 1 }),
      selectedIndex: 1,
    },
    {
      name: 'clearing the bag',
      previous: bag({ itemId: 'a', quantity: 1 }),
      next: bag(),
      selectedIndex: 0,
    },
  ])('resets selection and quantities when $name', ({ previous, next, selectedIndex }) => {
    const result = reconcileBagViewState(previous, next, selectedIndex, new Map([[0, 1]]));

    expect(result.structureChanged).toBe(true);
    expect(result.hadAffectedState).toBe(true);
    expect(result.selectedBagIndex).toBeNull();
    expect(result.sellQuantities).toEqual(new Map());
  });

  it('does not infer unique identities from duplicate itemIds', () => {
    const previous = bag({ itemId: 'herb', quantity: 6 }, { itemId: 'herb', quantity: 9 });
    const next = bag({ itemId: 'herb', quantity: 2 }, { itemId: 'herb', quantity: 9 });

    const result = reconcileBagViewState(previous, next, 1, new Map([[0, 5], [1, 7]]));

    expect(result.structureChanged).toBe(false);
    expect(result.selectedBagIndex).toBe(1);
    expect(result.sellQuantities).toEqual(new Map([[0, 2], [1, 7]]));
  });

  it('clears invalid selection and quantities when the unchanged bag is empty', () => {
    const result = reconcileBagViewState([], [], 0, new Map([[0, 1]]));

    expect(result).toEqual({
      selectedBagIndex: null,
      sellQuantities: new Map(),
      structureChanged: false,
      hadAffectedState: true,
    });
  });

  it('does not mutate frozen bag inputs', () => {
    const previous = Object.freeze([Object.freeze({ itemId: 'herb', quantity: 4 })]);
    const next = Object.freeze([Object.freeze({ itemId: 'herb', quantity: 2 })]);
    const quantities = new Map([[0, 3]]);

    const result = reconcileBagViewState(previous, next, 0, quantities);

    expect(result.sellQuantities).toEqual(new Map([[0, 2]]));
    expect(previous[0]?.quantity).toBe(4);
    expect(next[0]?.quantity).toBe(2);
    expect(quantities).toEqual(new Map([[0, 3]]));
  });
});
