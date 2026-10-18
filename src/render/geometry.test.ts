import { describe, expect, it } from 'vitest';
import type { Foothold } from '../contracts/definitions.js';
import {
  GROUND_TILE_OVERLAP,
  groundTilePositions,
  ladderSpriteGeometry,
  npcNameGeometry,
  PLATFORM_TILE_ACTIVE_PITCH,
  PLATFORM_TILE_DISPLAY_HEIGHT,
  PLATFORM_TILE_DISPLAY_WIDTH,
  PLATFORM_TILE_SIDE_GUTTER,
  platformTilePositions,
  portalFootAnchor,
  rendererViewportGeometry,
  segmentTileGeometry,
  WORLD_DEPTH,
} from './geometry.js';

function foothold(x1: number, y1: number, x2: number, y2: number, dropThrough = false): Foothold {
  return { id: 'test', x1, y1, x2, y2, dropThrough };
}

describe('renderer terrain geometry', () => {
  it('keeps world layers at their fixed depth order', () => {
    expect(WORLD_DEPTH).toEqual({
      sky: 0,
      far: 1,
      mid: 2,
      terrain: 10,
      actors: 30,
      health: 31,
      foreground: 35,
      attack: 39,
      telegraph: 40,
      effect: 41,
      text: 42,
    });
  });

  it('repeats ground tiles from the surface footpoint with the specified overlap', () => {
    expect(GROUND_TILE_OVERLAP).toBe(16);
    expect(groundTilePositions(foothold(40, 320, 340, 320), 128, GROUND_TILE_OVERLAP)).toEqual([
      { x: 40, y: 320 },
      { x: 152, y: 320 },
      { x: 264, y: 320 },
    ]);
    expect(groundTilePositions(foothold(40, 320, 90, 320), 128, GROUND_TILE_OVERLAP))
      .toEqual([{ x: 40, y: 320 }]);
  });

  it('repeats full platform display cells at the 112px active pitch and covers the foothold end', () => {
    const horizontalFoothold = foothold(50, 300, 275, 300, true);
    const positions = platformTilePositions(horizontalFoothold);

    expect(PLATFORM_TILE_DISPLAY_WIDTH).toBe(128);
    expect(PLATFORM_TILE_DISPLAY_HEIGHT).toBe(32);
    expect(PLATFORM_TILE_SIDE_GUTTER).toBe(8);
    expect(PLATFORM_TILE_ACTIVE_PITCH).toBe(112);
    expect(positions).toEqual([
      { x: 42, y: 300 },
      { x: 154, y: 300 },
      { x: 266, y: 300 },
    ]);
    expect(positions[0]!.x + PLATFORM_TILE_SIDE_GUTTER).toBe(horizontalFoothold.x1);
    expect(positions.at(-1)!.x + PLATFORM_TILE_SIDE_GUTTER).toBeLessThanOrEqual(horizontalFoothold.x2);
    expect(positions.at(-1)!.x + PLATFORM_TILE_DISPLAY_WIDTH - PLATFORM_TILE_SIDE_GUTTER)
      .toBeGreaterThanOrEqual(horizontalFoothold.x2);
  });

  it('uses one full display cell for a foothold shorter than one active pitch', () => {
    expect(platformTilePositions(foothold(50, 300, 90, 300, true))).toEqual([{ x: 42, y: 300 }]);
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
    expect(portalFootAnchor({ x: 420, y: 360 })).toEqual({
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

  it('resizes the camera uniformly from the baseline and adapts the visible world extent', () => {
    expect(rendererViewportGeometry(960, 540)).toEqual({ zoom: 1, worldWidth: 960, worldHeight: 540 });
    expect(rendererViewportGeometry(1920, 1080)).toEqual({ zoom: 2, worldWidth: 960, worldHeight: 540 });

    const wide = rendererViewportGeometry(1440, 800);
    expect(wide?.zoom).toBeCloseTo(800 / 540);
    expect(wide?.worldHeight).toBeCloseTo(540);
    expect(wide?.worldWidth).toBeGreaterThan(960);

    const tall = rendererViewportGeometry(640, 800);
    expect(tall?.zoom).toBeCloseTo(640 / 960);
    expect(tall?.worldWidth).toBeCloseTo(960);
    expect(tall?.worldHeight).toBeGreaterThan(540);
    expect(rendererViewportGeometry(0, 540)).toBeNull();
    expect(rendererViewportGeometry(Number.NaN, 540)).toBeNull();
  });
});
