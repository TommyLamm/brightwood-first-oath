import type { Foothold, Ladder, NpcPlacement, Portal } from '../contracts/definitions.js';

export type TerrainPoint = { x: number; y: number };

export type SegmentTileGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  originX: 0.5;
  originY: 0;
};

export type FootAnchor = {
  x: number;
  y: number;
  originX: 0.5;
  originY: 1;
};

export type LadderSpriteGeometry = FootAnchor & {
  width: number;
  height: number;
};

export const PLATFORM_TILE_DISPLAY_WIDTH = 128;
export const PLATFORM_TILE_DISPLAY_HEIGHT = 32;
export const PLATFORM_TILE_SIDE_GUTTER = 8;
export const PLATFORM_TILE_ACTIVE_PITCH =
  PLATFORM_TILE_DISPLAY_WIDTH - PLATFORM_TILE_SIDE_GUTTER * 2;

export type RendererViewportGeometry = {
  zoom: number;
  worldWidth: number;
  worldHeight: number;
};

/** Fits the 960x540 baseline without distorting world units or losing visible area. */
export function rendererViewportGeometry(
  width: number,
  height: number,
  baseWidth = 960,
  baseHeight = 540,
): RendererViewportGeometry | null {
  if (![width, height, baseWidth, baseHeight].every(Number.isFinite)
    || width <= 0 || height <= 0 || baseWidth <= 0 || baseHeight <= 0) {
    return null;
  }

  const zoom = Math.min(width / baseWidth, height / baseHeight);
  return { zoom, worldWidth: width / zoom, worldHeight: height / zoom };
}

/** Places overlapping ground tiles from the foothold's left endpoint. */
export function groundTilePositions(
  foothold: Foothold,
  displayWidth: number,
  overlap: number,
): TerrainPoint[] {
  const pitch = displayWidth - overlap;
  if (pitch <= 0) return [];
  const length = foothold.x2 - foothold.x1;
  const count = Math.max(1, Math.ceil(Math.max(0, length - displayWidth) / pitch) + 1);
  return Array.from({ length: count }, (_, index) => ({
    x: foothold.x1 + index * pitch,
    y: foothold.y1,
  }));
}

/** Places full platform cells so their 112px active bands begin at the foothold. */
export function platformTilePositions(foothold: Foothold): TerrainPoint[] {
  const length = Math.max(0, foothold.x2 - foothold.x1);
  const count = Math.max(1, Math.ceil(length / PLATFORM_TILE_ACTIVE_PITCH));
  return Array.from({ length: count }, (_, index) => ({
    x: foothold.x1 - PLATFORM_TILE_SIDE_GUTTER + index * PLATFORM_TILE_ACTIVE_PITCH,
    y: foothold.y1,
  }));
}

/** Anchors the tile's top edge to the foothold, including the true slope angle. */
export function segmentTileGeometry(foothold: Foothold, displayHeight: number): SegmentTileGeometry {
  const dx = foothold.x2 - foothold.x1;
  const dy = foothold.y2 - foothold.y1;
  return {
    x: (foothold.x1 + foothold.x2) / 2,
    y: (foothold.y1 + foothold.y2) / 2,
    width: Math.hypot(dx, dy),
    height: displayHeight,
    rotation: Math.atan2(dy, dx),
    originX: 0.5,
    originY: 0,
  };
}

/** Treats ladder.bottomY as its footpoint and sizes it up to topY. */
export function ladderSpriteGeometry(ladder: Ladder, displayWidth: number): LadderSpriteGeometry {
  return {
    x: ladder.x,
    y: ladder.bottomY,
    width: displayWidth,
    height: ladder.bottomY - ladder.topY,
    originX: 0.5,
    originY: 1,
  };
}

/** Positions a portal's visual anchor at its map-defined foot coordinate. */
export function portalFootAnchor(portal: Pick<Portal, 'x' | 'y'>): FootAnchor {
  return { x: portal.x, y: portal.y, originX: 0.5, originY: 1 };
}

/** Keeps the NPC label attached above the actor whose position is its footpoint. */
export function npcNameGeometry(
  placement: NpcPlacement,
  actorHeight: number,
  gap = 4,
): FootAnchor {
  return {
    x: placement.x,
    y: placement.y - actorHeight - gap,
    originX: 0.5,
    originY: 1,
  };
}
