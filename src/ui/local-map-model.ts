import type { MapDef, SaveData, Vec2 } from '../contracts/index.js';

export function canViewLocalMap(mapId: string, save: SaveData): boolean {
  return save.location.mapId === mapId || save.visitedMaps.includes(mapId);
}

/** Percent coordinates share the same inset as the SVG terrain and HTML markers. */
export function localMapPoint(map: Pick<MapDef, 'width' | 'height'>, position: Readonly<Vec2>): Vec2 | null {
  if (![map.width, map.height, position.x, position.y].every(Number.isFinite) || map.width <= 0 || map.height <= 0) return null;
  const unit = (value: number) => Math.max(0, Math.min(1, value));
  return { x: 3 + 94 * unit(position.x / map.width), y: 8 + 84 * unit(position.y / map.height) };
}
