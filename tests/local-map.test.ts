import { describe, expect, it } from 'vitest';
import { canViewLocalMap, localMapPoint, resolveQuestMapTarget } from '../src/ui/local-map-model.js';
import { createInitialAppState, createUiSnapshot } from '../src/app/state.js';
import { startNewGame } from '../src/app/gameplay.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { getQuestView } from '../src/domain/quests/index.js';

describe('local terrain guide', () => {
  it('preserves left/right and height ordering, with room for edge markers', () => {
    const map = { width: 2000, height: 800 };
    const left = localMapPoint(map, { x: 0, y: 0 })!;
    const center = localMapPoint(map, { x: 1000, y: 400 })!;
    const right = localMapPoint(map, { x: 2000, y: 800 })!;
    expect(center).toEqual({ x: 50, y: 50 });
    expect(left.x).toBeGreaterThan(0); expect(left.y).toBeGreaterThan(0);
    expect(right.x).toBeLessThan(100); expect(right.y).toBeLessThan(100);
    expect(left.x).toBeLessThan(center.x); expect(center.x).toBeLessThan(right.x);
    expect(left.y).toBeLessThan(center.y); expect(center.y).toBeLessThan(right.y);
  });

  it('keeps a falling or out-of-bounds marker inside the guide and rejects invalid coordinates', () => {
    const map = { width: 2000, height: 800 };
    expect(localMapPoint(map, { x: -100, y: 1500 })).toEqual(localMapPoint(map, { x: 0, y: 800 }));
    expect(localMapPoint(map, { x: Number.NaN, y: 600 })).toBeNull();
    expect(localMapPoint({ ...map, width: 0 }, { x: 0, y: 0 })).toBeNull();
  });

  it('projects every current map terrain, climb route, resident and exit within the guide', () => {
    for (const map of Object.values(worldCatalog.maps)) {
      const positions = [...map.npcs, ...map.portals, ...map.spawns, ...map.monsters,
        ...map.monsters.flatMap(spawn => [{ x: spawn.roamLeft, y: spawn.y }, { x: spawn.roamRight, y: spawn.y }]),
        ...map.footholds.flatMap(f => [{ x: f.x1, y: f.y1 }, { x: f.x2, y: f.y2 }]),
        ...map.ladders.flatMap(l => [{ x: l.x, y: l.topY }, { x: l.x, y: l.bottomY }])];
      for (const position of positions) {
        const projected = localMapPoint(map, position)!;
        expect(projected, map.id).not.toBeNull();
        expect(projected.x, map.id).toBeGreaterThan(0); expect(projected.x, map.id).toBeLessThan(100);
        expect(projected.y, map.id).toBeGreaterThan(0); expect(projected.y, map.id).toBeLessThan(100);
      }
    }
  });

  it('locates an item collection quest through its drop source without exposing unexplored terrain', () => {
    const catalog = { rules: rulesCatalog, world: worldCatalog };
    const initial = createInitialAppState(76, 'quest-map');
    const started = startNewGame('旅人', catalog, initial.nextEntityId);
    if ('error' in started) throw Error(started.error);
    const save = started.gameplay.saveData;
    save.quests.q03 = { status: 'active', counters: {} };
    const quest = getQuestView(save, 'q03', catalog);
    const target = resolveQuestMapTarget(worldCatalog, save, quest);
    expect(target?.id).toBe('forest-edge');
    expect(canViewLocalMap(target!.id, save)).toBe(false);
  });

  it('points to the same nearby quest destination as the exit from Sunwell Altar', () => {
    const catalog = { rules: rulesCatalog, world: worldCatalog };
    const started = startNewGame('旅人', catalog, createInitialAppState(77, 'quest-route').nextEntityId);
    if ('error' in started) throw Error(started.error);
    const save = started.gameplay.saveData;
    save.location = { mapId: 'sand-sunwell-altar', spawnId: 'entry' };
    save.visitedMaps = ['sand-dune-pass', 'sand-sunwell-basin', 'sand-sunwell-altar'];
    save.quests.q13 = { status: 'claimed', counters: { 'sunwell-beetle': 2 } };
    save.quests.q22 = { status: 'active', counters: { 'sand-sunwell-basin': 1 } };
    const quest = getQuestView(save, 'q22', catalog);
    expect(quest.status).toBe('active');
    expect(resolveQuestMapTarget(worldCatalog, save, quest)?.id).toBe('sand-sunwell-basin');
  });

  it('only exposes the current or already explored terrain and copies the live position outside saves', () => {
    const initial = createInitialAppState(75, 'local-map');
    const catalog = { rules: rulesCatalog, world: worldCatalog };
    const started = startNewGame('旅人', catalog, initial.nextEntityId);
    if ('error' in started) throw Error(started.error);
    const gameplay = started.gameplay;
    expect(canViewLocalMap('camp', gameplay.saveData)).toBe(true);
    expect(canViewLocalMap('town', gameplay.saveData)).toBe(false);
    gameplay.saveData.visitedMaps.push('town');
    expect(canViewLocalMap('town', gameplay.saveData)).toBe(true);
    const saved = JSON.stringify(gameplay.saveData);
    gameplay.movement.position = { x: 450, y: 500 };
    const snapshot = createUiSnapshot({ ...initial, screen: 'playing', catalog, gameplay })!;
    expect(snapshot.playerPosition).toEqual({ x: 450, y: 500 });
    snapshot.playerPosition!.x = 999;
    expect(gameplay.movement.position.x).toBe(450);
    expect(JSON.stringify(gameplay.saveData)).toBe(saved);
  });
});
