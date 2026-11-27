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

export function inventoryFilterForItem(item: ItemDef | undefined): InventoryFilter {
  if (!item) return 'all';
  if (item.kind === 'weapon' || item.kind === 'body' || item.kind === 'hat') return 'equipment';
  return item.kind;
}

export function countInventoryEntries(bag: readonly BagStack[], items: RulesCatalog['items']): Record<InventoryFilter, number> {
  const counts = { all: bag.length, equipment: 0, consumable: 0, material: 0, quest: 0 };
  for (const { itemId } of bag) {
    const filter = inventoryFilterForItem(items[itemId]);
    if (filter !== 'all') counts[filter]++;
  }
  return counts;
}

export function selectInventoryEntries(
  bag: readonly BagStack[],
  items: RulesCatalog['items'],
  filter: InventoryFilter,
): InventoryEntry[] {
  return bag
    .map((stack, bagIndex) => ({ stack, bagIndex, item: items[stack.itemId] }))
    .filter(({ item }) => filter === 'all' || inventoryFilterForItem(item) === filter);
}
