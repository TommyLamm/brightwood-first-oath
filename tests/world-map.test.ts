import { describe, expect, it } from 'vitest';
import { worldCatalog } from '../src/content/world/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { startNewGame } from '../src/app/gameplay.js';
import { WORLD_LANDMARKS, PLANNED_REGIONS, mapLevelLabel, portalRequirements } from '../src/ui/world-map-model.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
function save() {
  const result = startNewGame('旅人', catalog, () => 'atlas-test');
  if ('error' in result) throw new Error(result.error);
  return result.gameplay.saveData;
}

describe('world atlas information', () => {
  it('locates every playable map inside the artwork and distinguishes town, monsters and boss', () => {
    expect(Object.keys(WORLD_LANDMARKS).sort()).toEqual(Object.keys(worldCatalog.maps).sort());
    for (const { x, y } of Object.values(WORLD_LANDMARKS)) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(100);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(100);
    }
    expect(mapLevelLabel(worldCatalog.maps.town!, catalog)).toBe('安全城鎮');
    expect(mapLevelLabel(worldCatalog.maps['forest-edge']!, catalog)).toBe('怪物 Lv.1–8');
    expect(mapLevelLabel(worldCatalog.maps['guardian-arena']!, catalog)).toBe('首領 Lv.30');
    expect(mapLevelLabel(worldCatalog.maps['frost-shore']!, catalog)).toBe('怪物 Lv.30');
    expect(PLANNED_REGIONS.map(({ name }) => name)).toEqual(['黃金沙海', '遠古遺跡']);
  });

  it('opens the Frost Isles only after q08 is claimed and keeps an unrestricted return route', () => {
    const data = save();
    const outbound = worldCatalog.maps['guardian-arena']!.portals.find(({ targetMapId }) => targetMapId === 'frost-shore')!;
    const returnRoute = worldCatalog.maps['frost-shore']!.portals[0]!;
    expect(portalRequirements(outbound, data, catalog)).toEqual({ open: false, text: '需完成「守衛的安息」並領獎' });
    data.quests.q08 = { status: 'claimed', counters: {} };
    expect(portalRequirements(outbound, data, catalog).open).toBe(true);
    expect(returnRoute.targetMapId).toBe('guardian-arena');
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
