import { describe, expect, it } from 'vitest';
import { worldCatalog } from '../src/content/world/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { startNewGame } from '../src/app/gameplay.js';
import {
  WORLD_LANDMARKS,
  FROST_LANDMARKS,
  GOLD_SAND_LANDMARKS,
  PLANNED_REGIONS,
  atlasScopeForMapId,
  atlasViewModel,
  frostIslesOverview,
  goldSandSeaOverview,
  isFrostMapId,
  mapLevelLabel,
  portalRequirements,
} from '../src/ui/world-map-model.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
function save() {
  const result = startNewGame('旅人', catalog, () => 'atlas-test');
  if ('error' in result) throw new Error(result.error);
  return result.gameplay.saveData;
}

describe('world atlas information', () => {
  it('keeps Leaf Isle coordinates separate and derives Frost Isles nodes from real catalog maps', () => {
    const leafIds = Object.keys(worldCatalog.maps).filter((id) => atlasScopeForMapId(id) === 'world').sort();
    expect(Object.keys(WORLD_LANDMARKS).sort()).toEqual(leafIds);
    expect(Object.keys(FROST_LANDMARKS)).toEqual(['frost-shore', 'frost-pine-pass', 'frost-tide-cavern']);
    expect(PLANNED_REGIONS.map(({ name }) => name)).toEqual(['黃金沙海', '遠古遺跡']);

    const data = save();
    const mapsWithoutCavern = Object.fromEntries(Object.entries(worldCatalog.maps).filter(([id]) => id !== 'frost-tide-cavern'));
    const catalogWithoutCavern = { ...catalog, world: { ...worldCatalog, maps: mapsWithoutCavern } };
    const currentFrost = atlasViewModel(catalogWithoutCavern, data, 'frost-shore');
    expect(currentFrost.scope).toBe('frost');
    expect(currentFrost.maps.map(({ id }) => id).sort()).toEqual(['frost-pine-pass', 'frost-shore']);
    expect(currentFrost.totalCount).toBe(2);
    expect(currentFrost.maps.some(({ id }) => id === 'frost-tide-cavern')).toBe(false);

    const actualFrost = atlasViewModel(catalog, data, 'frost-shore');
    expect(actualFrost.maps.map(({ id }) => id).sort()).toEqual(['frost-pine-pass', 'frost-shore', 'frost-tide-cavern']);
    expect(actualFrost.totalCount).toBe(3);
    expect(FROST_LANDMARKS['frost-tide-cavern']).toMatchObject({ x: 80, y: 25 });
  });

  it('defaults to the local chart in Frost Isles and returns to the global overview without changing location', () => {
    const data = save();
    data.location.mapId = 'frost-pine-pass';
    const local = atlasViewModel(catalog, data, null);
    expect(local.scope).toBe('frost');
    expect(local.selectedMap?.id).toBe('frost-pine-pass');
    expect(local.exploredCount).toBe(1);
    expect(local.totalCount).toBe(3);

    const returned = atlasViewModel(catalog, data, 'guardian-arena');
    expect(returned.scope).toBe('world');
    expect(returned.selectedMap?.id).toBe('guardian-arena');
    expect(data.location.mapId).toBe('frost-pine-pass');
    expect(returned.allExploredCount).toBe(2);
    expect(returned.allMapCount).toBe(Object.keys(worldCatalog.maps).length);
  });

  it('keeps Gold Sand maps in a separate chart and shows the real q11-gated entry', () => {
    expect(isFrostMapId('frost-shore')).toBe(true);
    expect(atlasScopeForMapId('sand-glass-shore')).toBe('sand');
    expect(Object.keys(GOLD_SAND_LANDMARKS)).toEqual(['sand-glass-shore', 'sand-dune-pass', 'sand-sunwell-basin']);

    const data = save();
    const sand = atlasViewModel(catalog, data, 'sand-glass-shore');
    expect(sand.scope).toBe('sand');
    expect(sand.maps.map(({ id }) => id)).toEqual(['sand-glass-shore', 'sand-dune-pass']);
    expect(sand.totalCount).toBe(2);
    expect(sand.exploredCount).toBe(0);

    const overview = goldSandSeaOverview(catalog, data);
    expect(overview).toMatchObject({ current: false, exploredCount: 0, totalCount: 2 });
    expect(overview.entryRequirement?.open).toBe(false);
    data.player.level = 30;
    data.quests.q11 = { status: 'claimed', counters: {} };
    expect(goldSandSeaOverview(catalog, data).entryRequirement).toEqual({ open: true, text: '通道已開放' });
    const duneRoute = worldCatalog.maps['sand-glass-shore']!.portals.find(({ targetMapId }) => targetMapId === 'sand-dune-pass')!;
    expect(duneRoute.requiredQuestId).toBe('q12');
    expect(portalRequirements(duneRoute, data, catalog)).toEqual({ open: false, text: '需完成「琥珀鱗片的路標」並領獎' });
    data.quests.q12 = { status: 'claimed', counters: {} };
    expect(portalRequirements(duneRoute, data, catalog)).toEqual({ open: true, text: '通道已開放' });

    data.location.mapId = 'sand-glass-shore';
    expect(goldSandSeaOverview(catalog, data)).toMatchObject({ current: true, exploredCount: 1, totalCount: 2 });
    const returnRoute = worldCatalog.maps['sand-glass-shore']!.portals.find(({ targetMapId }) => targetMapId === 'frost-shore')!;
    expect(returnRoute.requiredQuestId).toBeNull();
    expect(portalRequirements(returnRoute, data, catalog)).toEqual({ open: true, text: '通道已開放' });
  });

  it('shows true Frost Isles entry, exploration and quest-gate state', () => {
    const data = save();
    const overview = frostIslesOverview(catalog, data);
    expect(overview).toMatchObject({ current: false, exploredCount: 0, totalCount: 3 });
    expect(overview.entryRequirement?.open).toBe(false);

    data.quests.q08 = { status: 'claimed', counters: {} };
    const outbound = worldCatalog.maps['guardian-arena']!.portals.find(({ targetMapId }) => targetMapId === 'frost-shore')!;
    expect(portalRequirements(outbound, data, catalog).open).toBe(true);
    data.location.mapId = 'frost-shore';
    expect(frostIslesOverview(catalog, data)).toMatchObject({ current: true, exploredCount: 1, totalCount: 3 });
  });

  it('distinguishes town, monsters and boss and verifies the q09 Frost route gate', () => {
    expect(mapLevelLabel(worldCatalog.maps.town!, catalog)).toBe('安全城鎮');
    expect(mapLevelLabel(worldCatalog.maps['forest-edge']!, catalog)).toBe('怪物 Lv.1–8');
    expect(mapLevelLabel(worldCatalog.maps['guardian-arena']!, catalog)).toBe('首領 Lv.30');
    expect(mapLevelLabel(worldCatalog.maps['frost-shore']!, catalog)).toBe('怪物 Lv.30');
    expect(mapLevelLabel(worldCatalog.maps['frost-pine-pass']!, catalog)).toBe('怪物 Lv.30');

    const data = save();
    data.player.level = 99;
    data.quests.q08 = { status: 'claimed', counters: {} };
    const northRoute = worldCatalog.maps['frost-shore']!.portals.find(({ targetMapId }) => targetMapId === 'frost-pine-pass')!;
    expect(northRoute.requiredQuestId).toBe('q09');
    expect(portalRequirements(northRoute, data, catalog)).toEqual({ open: false, text: '需完成「北路的狼牙」並領獎' });
    data.quests.q09 = { status: 'claimed', counters: {} };
    expect(portalRequirements(northRoute, data, catalog)).toEqual({ open: true, text: '通道已開放' });

    const returnRoute = worldCatalog.maps['frost-pine-pass']!.portals.find(({ targetMapId }) => targetMapId === 'frost-shore')!;
    expect(returnRoute.requiredQuestId).toBeNull();
    expect(portalRequirements(returnRoute, data, catalog)).toEqual({ open: true, text: '通道已開放' });

    const caveRoute = worldCatalog.maps['frost-pine-pass']!.portals.find(({ targetMapId }) => targetMapId === 'frost-tide-cavern')!;
    expect(caveRoute.requiredQuestId).toBe('q10');
    expect(portalRequirements(caveRoute, data, catalog)).toEqual({ open: false, text: '需完成「冰甲蟹清障」並領獎' });
    data.quests.q10 = { status: 'claimed', counters: {} };
    expect(portalRequirements(caveRoute, data, catalog)).toEqual({ open: true, text: '通道已開放' });
  });

  it('keeps the camp exit locked until the quest reward has been claimed, without modifying the save', () => {
    const data = save();
    const portal = worldCatalog.maps.camp!.portals[0]!;
    data.quests.q01 = { status: 'active', counters: { snail: 3 } };
    const before = JSON.stringify(data);
    expect(portalRequirements(portal, data, catalog)).toEqual({ open: false, text: '需完成「第一次出發」並領獎' });
    expect(JSON.stringify(data)).toBe(before);
    data.quests.q01.status = 'claimed';
    expect(portalRequirements(portal, data, catalog)).toEqual({ open: true, text: '通道已開放' });
  });

  it('shows both quest and level blockers, while an unrestricted return path stays open', () => {
    const data = save();
    const portal = { ...worldCatalog.maps.camp!.portals[0]!, minLevel: 5 };
    expect(portalRequirements(portal, data, catalog).text).toContain('需要 Lv.5');
    data.quests.q01 = { status: 'claimed', counters: {} };
    expect(portalRequirements(portal, data, catalog).open).toBe(false);
    data.player.level = 5;
    expect(portalRequirements(portal, data, catalog).open).toBe(true);
    expect(portalRequirements(worldCatalog.maps.town!.portals[0]!, save(), catalog).open).toBe(true);
  });
});
