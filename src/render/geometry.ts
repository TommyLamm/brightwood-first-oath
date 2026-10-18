import type { Foothold } from '../contracts/definitions.js';

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
