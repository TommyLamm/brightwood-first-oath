import { describe, expect, it } from 'vitest';
import type { Foothold, QuestDef, QuestView } from '../contracts/definitions.js';
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
  actorFootOffset,
  heroAnchorPosition,
  heroAnchorRotation,
  questMarkerGeometry,
  questMarkerNpcIds,
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

describe('actor foot geometry', () => {
  it('scales the measured transparent bottom edge into world pixels', () => {
    expect(actorFootOffset(96, 1, 128, 111)).toBe(12);
    expect(actorFootOffset(96, 1, 128, 127)).toBe(0);
    expect(actorFootOffset(96, 0.5, 128, 111)).toBe(-36);
    expect(actorFootOffset(96, 1, 128, -1)).toBe(0);
  });

  it('maps per-frame hero anchors through the foot trim and mirrors them with facing', () => {
    const image = { displayWidth: 96, displayHeight: 96, pivotX: 0.5, pivotY: 1 };
    const coordinateSpace = {
      width: 96,
      height: 96,
      origin: 'frame-top-left',
      facing: 'right',
      sourceFramePixels: 128,
    } as const;
    const anchor = { x: 52.5, y: 33 };

    expect(heroAnchorPosition({ x: 100, y: 200 }, image, anchor, coordinateSpace, 1, 12))
      .toEqual({ x: 104.5, y: 149 });
    expect(heroAnchorPosition({ x: 100, y: 200 }, image, anchor, coordinateSpace, -1, 12))
      .toEqual({ x: 95.5, y: 149 });
    expect(heroAnchorPosition(
      { x: 100, y: 200 },
      { ...image, pivotX: 0.25 },
      anchor,
      coordinateSpace,
      -1,
      12,
    )).toEqual({ x: 71.5, y: 149 });
    expect(heroAnchorRotation(-15, 1)).toBe(-15);
    expect(heroAnchorRotation(-15, -1)).toBe(15);
  });
});

describe('renderer quest markers', () => {
  it('shows markers for available givers and ready turn-ins only', () => {
    const statuses: QuestView['status'][] = ['available', 'ready', 'active', 'locked', 'claimed'];
    const views: QuestView[] = statuses.map((status, index) => ({
      questId: `q${index}`,
      title: `Quest ${index}`,
      status,
      objectives: [],
      reward: { exp: 0, coins: 0, items: [] },
    }));
    const quests: Record<string, Pick<QuestDef, 'giverNpcId' | 'turnInNpcId'>> = {
      q0: { giverNpcId: 'guide', turnInNpcId: 'guide' },
      q1: { giverNpcId: 'mentor', turnInNpcId: 'keeper' },
      q2: { giverNpcId: 'mentor', turnInNpcId: 'mentor' },
      q3: { giverNpcId: 'guide', turnInNpcId: 'guide' },
      q4: { giverNpcId: 'keeper', turnInNpcId: 'keeper' },
    };

    expect([...questMarkerNpcIds(views, quests)].sort()).toEqual(['guide', 'keeper']);
    expect(questMarkerGeometry({ npcId: 'guide', x: 250, y: 300 }, 96, 32)).toEqual({
      x: 250,
      y: 164,
      originX: 0.5,
      originY: 0.5,
    });
  });
});
