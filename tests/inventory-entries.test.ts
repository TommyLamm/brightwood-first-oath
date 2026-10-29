import { describe, expect, it } from 'vitest';
import type { BagStack } from '../src/contracts/types.js';
import type { ItemDef, RulesCatalog } from '../src/contracts/definitions.js';
import {
  INVENTORY_FILTERS,
  selectInventoryEntries,
  type InventoryFilter,
} from '../src/ui/inventory-entries.js';

function item(id: string, kind: ItemDef['kind']): ItemDef {
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
  };
}

function itemCatalog(...values: ItemDef[]): RulesCatalog['items'] {
  return Object.fromEntries(values.map((value) => [value.id, value]));
}

function stack(itemId: string, quantity = 1): BagStack {
  return { itemId, quantity };
}

describe('selectInventoryEntries', () => {
  it('exposes the five labeled filters and preserves all bag entries and indexes', () => {
    expect(INVENTORY_FILTERS).toEqual([
      { id: 'all', label: '全部' },
      { id: 'equipment', label: '裝備' },
      { id: 'consumable', label: '消耗品' },
      { id: 'material', label: '材料' },
      { id: 'quest', label: '任務物品' },
    ]);

    const potion = item('potion', 'consumable');
    const sword = item('sword', 'weapon');
    const bag = [stack('potion', 2), stack('sword'), stack('potion', 4), stack('missing', 0)];
    const entries = selectInventoryEntries(bag, itemCatalog(potion, sword), 'all');

    expect(entries.map(({ stack: value, bagIndex, item: definition }) => [
      value.itemId,
      bagIndex,
      definition?.id,
    ])).toEqual([
      ['potion', 0, 'potion'],
      ['sword', 1, 'sword'],
      ['potion', 2, 'potion'],
      ['missing', 3, undefined],
    ]);
    expect(entries[0].stack).toBe(bag[0]);
    expect(entries[1].stack).toBe(bag[1]);
    expect(entries[2].stack).toBe(bag[2]);
    expect(entries[0].item).toBe(potion);
    expect(entries[2].item).toBe(potion);
    expect(entries[3].item).toBeUndefined();
  });

  it('includes exactly weapon, body, and hat in the equipment filter', () => {
    const sword = item('sword', 'weapon');
    const armor = item('armor', 'body');
    const hat = item('hat', 'hat');
    const bag = [
      stack('sword'),
      stack('potion'),
      stack('armor'),
      stack('ore'),
      stack('hat'),
      stack('quest'),
    ];

    expect(selectInventoryEntries(bag, itemCatalog(
      sword,
      item('potion', 'consumable'),
      armor,
      item('ore', 'material'),
      hat,
      item('quest', 'quest'),
    ), 'equipment').map(({ stack: value, bagIndex, item: definition }) => [
      value.itemId,
      bagIndex,
      definition,
    ])).toEqual([
      ['sword', 0, sword],
      ['armor', 2, armor],
      ['hat', 4, hat],
    ]);
  });

  it('matches each non-equipment filter to its exact item kind', () => {
    const bag = [
      stack('potion'),
      stack('ore'),
      stack('quest'),
      stack('sword'),
      stack('other-potion'),
    ];
    const items = itemCatalog(
      item('potion', 'consumable'),
      item('ore', 'material'),
      item('quest', 'quest'),
      item('sword', 'weapon'),
      item('other-potion', 'consumable'),
    );
    const expected: Record<Extract<InventoryFilter, 'consumable' | 'material' | 'quest'>, string[]> = {
      consumable: ['potion', 'other-potion'],
      material: ['ore'],
      quest: ['quest'],
    };

    for (const filter of ['consumable', 'material', 'quest'] as const) {
      expect(selectInventoryEntries(bag, items, filter).map(({ stack: value }) => value.itemId))
        .toEqual(expected[filter]);
    }
  });

  it('returns empty results for empty bags and keeps missing catalog entries only in all', () => {
    const potion = item('potion', 'consumable');
    const items = itemCatalog(potion);
    const bag = [stack('absent'), stack('potion')];

    expect(selectInventoryEntries([], items, 'all')).toEqual([]);
    expect(selectInventoryEntries(bag, items, 'all').map(({ item: definition }) => definition))
      .toEqual([undefined, potion]);
    expect(selectInventoryEntries(bag, items, 'equipment')).toEqual([]);
    expect(selectInventoryEntries(bag, items, 'consumable').map(({ bagIndex }) => bagIndex)).toEqual([1]);
    expect(selectInventoryEntries(bag, items, 'material')).toEqual([]);
    expect(selectInventoryEntries(bag, items, 'quest')).toEqual([]);
  });

  it('returns fresh arrays for every filter without mutating bag, catalog, or entry references', () => {
    const definitions = [
      item('sword', 'weapon'),
      item('armor', 'body'),
      item('hat', 'hat'),
      item('potion', 'consumable'),
      item('ore', 'material'),
      item('quest', 'quest'),
    ];
    const items = itemCatalog(...definitions);
    const bag = definitions.map(({ id }) => stack(id));
    const bagBefore = JSON.stringify(bag);
    const itemsBefore = JSON.stringify(items);

    for (const { id } of INVENTORY_FILTERS) {
      const first = selectInventoryEntries(bag, items, id);
      const second = selectInventoryEntries(bag, items, id);
      expect(first).not.toBe(bag);
      expect(first).not.toBe(second);
      for (const entry of first) {
        expect(entry.stack).toBe(bag[entry.bagIndex]);
        expect(entry.item).toBe(items[entry.stack.itemId]);
      }
    }

    expect(JSON.stringify(bag)).toBe(bagBefore);
    expect(JSON.stringify(items)).toBe(itemsBefore);
    expect(definitions.every((definition) => items[definition.id] === definition)).toBe(true);
  });
});
