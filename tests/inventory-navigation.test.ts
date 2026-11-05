import { describe, expect, it } from 'vitest';
import { nextInventoryBagIndex } from '../src/ui/inventory-navigation.js';

const visible = [1, 3, 7, 8, 13, 20, 31];
describe('inventory keyboard selection', () => {
  it('retains real bag indices after a filter compacts visible slots', () => {
    expect(nextInventoryBagIndex(visible, 3, 'ArrowRight', 3)).toBe(7);
    expect(nextInventoryBagIndex(visible, 3, 'ArrowDown', 3)).toBe(13);
    expect(nextInventoryBagIndex(visible, 13, 'ArrowUp', 3)).toBe(3);
    expect(nextInventoryBagIndex(visible, 3, 'ArrowDown', 4)).toBe(20);
  });
  it('supports first/last jumps and stays within an incomplete final row', () => {
    expect(nextInventoryBagIndex(visible, 8, 'Home', 3)).toBe(1);
    expect(nextInventoryBagIndex(visible, 8, 'End', 3)).toBe(31);
    expect(nextInventoryBagIndex(visible, 20, 'ArrowDown', 3)).toBe(31);
    expect(nextInventoryBagIndex(visible, 1, 'ArrowLeft', 3)).toBe(1);
    expect(nextInventoryBagIndex(visible, 31, 'ArrowRight', 3)).toBe(31);
  });
  it('does not redirect stale selections, empty lists or native activation and Tab keys', () => {
    expect(nextInventoryBagIndex(visible, 99, 'ArrowRight', 3)).toBeNull();
    expect(nextInventoryBagIndex([], 1, 'Home', 3)).toBeNull();
    expect(nextInventoryBagIndex(visible, 3, 'Enter', 3)).toBeNull();
    expect(nextInventoryBagIndex(visible, 3, 'Tab', 3)).toBeNull();
  });
});
