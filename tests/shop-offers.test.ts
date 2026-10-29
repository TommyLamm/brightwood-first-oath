import { describe, expect, it } from 'vitest';
import type { ItemDef, RulesCatalog } from '../src/contracts/definitions.js';
import { selectShopOffers } from '../src/ui/shop-offers.js';

function item(
  id: string,
  kind: ItemDef['kind'],
  overrides: Partial<Pick<ItemDef, 'minLevel' | 'buyPrice'>> = {},
): ItemDef {
  return {
    id,
    name: id,
    kind,
    slot: kind === 'weapon' || kind === 'body' || kind === 'hat' ? kind : null,
    stackLimit: 20,
    minLevel: 1,
    attack: 0,
    defense: 0,
    hpBonus: 0,
    restoreHp: 0,
    restoreMp: 0,
    buyPrice: 1,
    sellPrice: 0,
    iconKey: `item:${id}`,
    visualKey: null,
    ...overrides,
  };
}

function catalogItems(...values: ItemDef[]): RulesCatalog['items'] {
  return Object.fromEntries(values.map((value) => [value.id, value]));
}

describe('selectShopOffers', () => {
  it('preserves all-filter eligibility, including priced materials and excluding quests or free items', () => {
    const consumable = item('potion', 'consumable');
    const material = item('ore', 'material', { buyPrice: 10 });
    const free = item('free-sword', 'weapon', { buyPrice: 0 });
    const quest = item('quest-token', 'quest', { buyPrice: 50 });

    expect(selectShopOffers(catalogItems(material, free, quest, consumable), 'all'))
      .toEqual([consumable, material]);
  });

  it('sorts by kind, then level, then price, and keeps equal entries in catalog order', () => {
    const hat = item('hat', 'hat', { minLevel: 1, buyPrice: 1 });
    const bodySecond = item('body-second', 'body', { minLevel: 2, buyPrice: 12 });
    const weaponHigherLevel = item('weapon-higher-level', 'weapon', { minLevel: 3, buyPrice: 1 });
    const material = item('material', 'material', { minLevel: 1, buyPrice: 1 });
    const consumable = item('consumable', 'consumable', { minLevel: 9, buyPrice: 100 });
    const bodyCheaper = item('body-cheaper', 'body', { minLevel: 2, buyPrice: 5 });
    const weaponLowerLevel = item('weapon-lower-level', 'weapon', { minLevel: 1, buyPrice: 90 });
    const bodyFirst = item('body-first', 'body', { minLevel: 2, buyPrice: 12 });

    expect(selectShopOffers(
      catalogItems(hat, bodySecond, weaponHigherLevel, material, consumable, bodyCheaper, weaponLowerLevel, bodyFirst),
      'all',
    )).toEqual([
      consumable,
      weaponLowerLevel,
      weaponHigherLevel,
      bodyCheaper,
      bodySecond,
      bodyFirst,
      hat,
      material,
    ]);
  });

  it('keeps only priced consumables and applies the level and price ordering', () => {
    const late = item('late-potion', 'consumable', { minLevel: 2, buyPrice: 1 });
    const expensive = item('expensive-potion', 'consumable', { minLevel: 1, buyPrice: 90 });
    const cheap = item('cheap-potion', 'consumable', { minLevel: 1, buyPrice: 10 });

    expect(selectShopOffers(catalogItems(
      item('sword', 'weapon'),
      late,
      item('free-potion', 'consumable', { buyPrice: 0 }),
      expensive,
      item('quest-potion', 'quest', { buyPrice: 1 }),
      item('ore', 'material'),
      cheap,
    ), 'consumable')).toEqual([cheap, expensive, late]);
  });

  it('includes all three equipment kinds while excluding consumables, materials, and quests', () => {
    const hat = item('hat', 'hat');
    const body = item('body', 'body');
    const weapon = item('weapon', 'weapon');

    expect(selectShopOffers(catalogItems(
      hat,
      item('potion', 'consumable'),
      body,
      item('ore', 'material'),
      item('quest-token', 'quest', { buyPrice: 10 }),
      weapon,
    ), 'equipment')).toEqual([weapon, body, hat]);
  });

  it('returns a fresh array for empty and nonempty results without changing the input catalog', () => {
    const potion = item('potion', 'consumable');
    const items = catalogItems(potion);
    const before = Object.entries(items);

    const emptyOffers = selectShopOffers(items, 'equipment');
    const offers = selectShopOffers(items, 'all');
    expect(emptyOffers).toEqual([]);
    expect(emptyOffers).not.toBe(selectShopOffers(items, 'equipment'));
    expect(offers).not.toBe(selectShopOffers(items, 'all'));
    expect(offers[0]).toBe(potion);

    offers.pop();
    expect(Object.entries(items)).toEqual(before);
    expect(items.potion).toBe(potion);
  });
});
