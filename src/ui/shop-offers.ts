import type { ItemDef, RulesCatalog } from '../contracts/definitions.js';

export const SHOP_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'consumable', label: '藥水' },
  { id: 'equipment', label: '裝備' },
] as const;

export type ShopFilter = (typeof SHOP_FILTERS)[number]['id'];

function shopKindOrder(kind: ItemDef['kind']): number {
  return ['consumable', 'weapon', 'body', 'hat'].indexOf(kind) >>> 0;
}

function matchesFilter(item: ItemDef, filter: ShopFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'consumable') return item.kind === 'consumable';
  return item.kind === 'weapon' || item.kind === 'body' || item.kind === 'hat';
}

export function selectShopOffers(
  items: Readonly<RulesCatalog['items']>,
  filter: ShopFilter,
): ItemDef[] {
  return Object.values(items)
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.buyPrice > 0 && item.kind !== 'quest' && matchesFilter(item, filter))
    .sort((a, b) =>
      shopKindOrder(a.item.kind) - shopKindOrder(b.item.kind)
      || a.item.minLevel - b.item.minLevel
      || a.item.buyPrice - b.item.buyPrice
      || a.index - b.index,
    )
    .map(({ item }) => item);
}
