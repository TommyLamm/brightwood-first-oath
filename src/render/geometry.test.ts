import { describe, expect, it } from 'vitest';
import type { Foothold } from '../contracts/definitions.js';
import {
  groundTilePositions,
  ladderSpriteGeometry,
  npcNameGeometry,
  portalFootAnchor,
  segmentTileGeometry,
} from './geometry.js';

function foothold(x1: number, y1: number, x2: number, y2: number, dropThrough = false): Foothold {
  return { id: 'test', x1, y1, x2, y2, dropThrough };
}

describe('renderer terrain geometry', () => {
  it('repeats ground tiles from the surface footpoint with the specified overlap', () => {
    expect(groundTilePositions(foothold(40, 320, 340, 320), 128, 16)).toEqual([
      { x: 40, y: 320 },
      { x: 152, y: 320 },
      { x: 264, y: 320 },
    ]);
    expect(groundTilePositions(foothold(40, 320, 90, 320), 128, 16)).toEqual([{ x: 40, y: 320 }]);
  });

  it('keeps platform top edges on their horizontal foothold', () => {
    expect(segmentTileGeometry(foothold(50, 300, 250, 300, true), 32)).toEqual({
      x: 150,
      y: 300,
      width: 200,
      height: 32,
      rotation: 0,
      originX: 0.5,
      originY: 0,
    });
  });

  it('rotates slope tiles so their top edge follows both foothold endpoints', () => {
    const start = { x: 100, y: 210 };
    const end = { x: 220, y: 270 };
    const geometry = segmentTileGeometry(foothold(start.x, start.y, end.x, end.y), 128);
    const halfWidth = geometry.width / 2;
    const left = {
      x: geometry.x - halfWidth * Math.cos(geometry.rotation),
      y: geometry.y - halfWidth * Math.sin(geometry.rotation),
    };
    const right = {
      x: geometry.x + halfWidth * Math.cos(geometry.rotation),
      y: geometry.y + halfWidth * Math.sin(geometry.rotation),
    };

    expect(left.x).toBeCloseTo(start.x);
    expect(left.y).toBeCloseTo(start.y);
    expect(right.x).toBeCloseTo(end.x);
    expect(right.y).toBeCloseTo(end.y);
  });

  it('anchors ladders by bottom foot coordinate and stretches to the declared top', () => {
    expect(ladderSpriteGeometry({ id: 'ladder-1', x: 80, topY: 140, bottomY: 300 }, 32)).toEqual({
      x: 80,
      y: 300,
      width: 32,
      height: 160,
      originX: 0.5,
      originY: 1,
    });
  });

  it('anchors portals and NPC labels to map foot positions', () => {
    expect(portalFootAnchor({ x: 420, y: 360, id: 'portal-1', targetMapId: 'town', targetSpawnId: 'in', requiredQuestId: null, minLevel: 1 })).toEqual({
      x: 420,
      y: 360,
      originX: 0.5,
      originY: 1,
    });
    expect(npcNameGeometry({ npcId: 'guide', x: 160, y: 300 }, 96)).toEqual({
      x: 160,
      y: 200,
      originX: 0.5,
      originY: 1,
    });
  });
});
