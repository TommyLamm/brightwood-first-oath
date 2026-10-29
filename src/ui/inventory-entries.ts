import type { ItemDef, RulesCatalog } from '../contracts/definitions.js';
import type { BagStack } from '../contracts/types.js';

export const INVENTORY_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'equipment', label: '裝備' },
  { id: 'consumable', label: '消耗品' },
  { id: 'material', label: '材料' },
  { id: 'quest', label: '任務物品' },
] as const;

export type InventoryFilter = (typeof INVENTORY_FILTERS)[number]['id'];

export type InventoryEntry = {
  stack: BagStack;
  bagIndex: number;
  item: ItemDef | undefined;
};

export function selectInventoryEntries(
  bag: readonly BagStack[],
  items: RulesCatalog['items'],
  filter: InventoryFilter,
): InventoryEntry[] {
  return bag
    .map((stack, bagIndex) => ({ stack, bagIndex, item: items[stack.itemId] }))
    .filter(({ item }) => {
      if (filter === 'all') return true;
      if (filter === 'equipment') return item?.kind === 'weapon' || item?.kind === 'body' || item?.kind === 'hat';
      return item?.kind === filter;
    });
}
