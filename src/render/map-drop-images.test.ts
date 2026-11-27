import { describe, expect, it } from 'vitest';
import { rulesCatalog } from '../content/rules/index.js';
import { worldCatalog } from '../content/world/index.js';
import { classItemId } from '../content/world/class-quests.js';
import { mapDropImageKeys } from './map-drop-images.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

describe('world drop image loading', () => {
  it('loads regular drops, class variants and conditional quest drops on their source maps', () => {
    expect(mapDropImageKeys(worldCatalog.maps['forest-edge']!, catalog)).toEqual(new Set([
      'item:snail-shell', 'item:small-red', 'item:small-blue', 'item:slime-gel', 'item:forest-seed',
    ]));
    const bossLoot = mapDropImageKeys(worldCatalog.maps['guardian-arena']!, catalog);
    expect(bossLoot.has('item:guardian-core')).toBe(true);
    for (const job of ['swordsman', 'archer', 'mage', 'rogue'] as const) {
      const itemId = classItemId('guardian-sword', { job });
      expect(bossLoot.has(rulesCatalog.items[itemId]!.iconKey)).toBe(true);
    }
    expect(mapDropImageKeys(worldCatalog.maps.town!, catalog).size).toBe(0);
  });
});
