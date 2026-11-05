import { describe, expect, it } from 'vitest';
import { canViewLocalMap, localMapPoint } from '../src/ui/local-map-model.js';
import { createInitialAppState, createUiSnapshot } from '../src/app/state.js';
import { startNewGame } from '../src/app/gameplay.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';

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
      const positions = [...map.npcs, ...map.portals, ...map.spawns,
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
