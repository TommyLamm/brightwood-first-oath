import { describe, expect, it } from 'vitest';
import { worldCatalog } from '../src/content/world/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { startNewGame } from '../src/app/gameplay.js';
import {
  WORLD_LANDMARKS,
  FROST_LANDMARKS,
  PLANNED_REGIONS,
  atlasViewModel,
  frostIslesOverview,
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
    const leafIds = Object.keys(worldCatalog.maps).filter((id) => !isFrostMapId(id)).sort();
    expect(Object.keys(WORLD_LANDMARKS).sort()).toEqual(leafIds);
    expect(Object.keys(FROST_LANDMARKS)).toEqual(['frost-shore', 'frost-pine-pass', 'frost-tide-cavern']);
    expect(PLANNED_REGIONS.map(({ name }) => name)).toEqual(['黃金沙海', '遠古遺跡']);

    const data = save();
    const currentFrost = atlasViewModel(catalog, data, 'frost-shore');
    expect(currentFrost.scope).toBe('frost');
    expect(currentFrost.maps.map(({ id }) => id).sort()).toEqual(['frost-pine-pass', 'frost-shore']);
    expect(currentFrost.totalCount).toBe(2);
    expect(currentFrost.maps.some(({ id }) => id === 'frost-tide-cavern')).toBe(false);

    const cavern = { ...worldCatalog.maps['frost-pine-pass']!, id: 'frost-tide-cavern', name: '冰潮洞窟' };
    const catalogWithCavern = {
      ...catalog,
      world: { ...worldCatalog, maps: { ...worldCatalog.maps, [cavern.id]: cavern } },
    };
    const futureFrost = atlasViewModel(catalogWithCavern, data, 'frost-shore');
    expect(futureFrost.maps.map(({ id }) => id).sort()).toEqual(['frost-pine-pass', 'frost-shore', 'frost-tide-cavern'].sort());
    expect(futureFrost.totalCount).toBe(3);
  });

  it('defaults to the local chart in Frost Isles and returns to the global overview without changing location', () => {
    const data = save();
    data.location.mapId = 'frost-pine-pass';
    const local = atlasViewModel(catalog, data, null);
    expect(local.scope).toBe('frost');
    expect(local.selectedMap?.id).toBe('frost-pine-pass');
    expect(local.exploredCount).toBe(1);
    expect(local.totalCount).toBe(2);

    const returned = atlasViewModel(catalog, data, 'guardian-arena');
    expect(returned.scope).toBe('world');
    expect(returned.selectedMap?.id).toBe('guardian-arena');
    expect(data.location.mapId).toBe('frost-pine-pass');
    expect(returned.allExploredCount).toBe(2);
    expect(returned.allMapCount).toBe(Object.keys(worldCatalog.maps).length);
  });

  it('shows true Frost Isles entry, exploration and quest-gate state', () => {
    const data = save();
    const overview = frostIslesOverview(catalog, data);
    expect(overview).toMatchObject({ current: false, exploredCount: 0, totalCount: 2 });
    expect(overview.entryRequirement?.open).toBe(false);

    data.quests.q08 = { status: 'claimed', counters: {} };
    const outbound = worldCatalog.maps['guardian-arena']!.portals.find(({ targetMapId }) => targetMapId === 'frost-shore')!;
    expect(portalRequirements(outbound, data, catalog).open).toBe(true);
    data.location.mapId = 'frost-shore';
    expect(frostIslesOverview(catalog, data)).toMatchObject({ current: true, exploredCount: 1, totalCount: 2 });
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
