import { describe, expect, it } from 'vitest';
import { worldCatalog } from '../src/content/world/index.js';
import { resolveNpcMapTarget } from '../src/ui/npc-map-target.js';

describe('resolveNpcMapTarget', () => {
  it('finds the merchant map and returns only catalog names and IDs', () => {
    const target = resolveNpcMapTarget(worldCatalog, 'merchant');

    expect(target).toEqual({ mapId: 'town', mapName: '木葉鎮', npcName: '木葉商人' });
    expect(Object.keys(target ?? {})).toEqual(['mapId', 'mapName', 'npcName']);
    expect(Object.values(target ?? {}).every((value) => typeof value === 'string')).toBe(true);
  });

  it('follows cloned placement and name changes without mutating either input', () => {
    const originalBefore = structuredClone({ maps: worldCatalog.maps, npcs: worldCatalog.npcs });
    const world = structuredClone({ maps: worldCatalog.maps, npcs: worldCatalog.npcs });
    const before = structuredClone(world);

    world.maps.town.npcs = world.maps.town.npcs.filter((placement) => placement.npcId !== 'merchant');
    world.maps.camp.npcs = [...world.maps.camp.npcs, { npcId: 'merchant', x: 300, y: 600 }];
    world.maps.camp.name = '更名營地';
    world.npcs.merchant.name = '更名商人';
    const changedBeforeLookup = structuredClone(world);

    const target = resolveNpcMapTarget(world, 'merchant');

    expect(target).toEqual({ mapId: 'camp', mapName: '更名營地', npcName: '更名商人' });
    expect(world).toEqual(changedBeforeLookup);
    expect({ maps: worldCatalog.maps, npcs: worldCatalog.npcs }).toEqual(originalBefore);
    expect(before.maps.town.npcs.some((placement) => placement.npcId === 'merchant')).toBe(true);
    expect(before.maps.camp.npcs.some((placement) => placement.npcId === 'merchant')).toBe(false);
  });

  it('returns null for unknown NPCs, missing placements, or missing definitions', () => {
    const withoutPlacement = structuredClone({ maps: worldCatalog.maps, npcs: worldCatalog.npcs });
    for (const map of Object.values(withoutPlacement.maps)) {
      map.npcs = map.npcs.filter((placement) => placement.npcId !== 'merchant');
    }

    const withoutDefinition = structuredClone({ maps: worldCatalog.maps, npcs: worldCatalog.npcs });
    delete withoutDefinition.npcs.merchant;

    expect(resolveNpcMapTarget(worldCatalog, 'unknown')).toBeNull();
    expect(resolveNpcMapTarget(withoutPlacement, 'merchant')).toBeNull();
    expect(resolveNpcMapTarget(withoutDefinition, 'merchant')).toBeNull();
  });
});
