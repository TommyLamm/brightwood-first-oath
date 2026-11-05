import type { Foothold, Ladder, MapDef } from '../contracts/definitions.js';

type TerrainStyle = Readonly<{
  groundKey: string;
  platformKey: string;
  climbKey: string;
  segmented: boolean;
}>;

const DEFAULT: TerrainStyle = {
  groundKey: 'env:tile-ground',
  platformKey: 'env:tile-platform', climbKey: 'env:ladder', segmented: false,
};

const STYLES = {
  forest: { groundKey: DEFAULT.groundKey, platformKey: 'env:forest:platform', climbKey: 'env:forest:vine', segmented: true },
  ridge: { groundKey: 'env:ridge:ground', platformKey: 'env:ridge:platform', climbKey: 'env:ridge:rope', segmented: true },
  mine: { groundKey: 'env:mine:ground', platformKey: 'env:mine:platform', climbKey: 'env:mine:ladder', segmented: true },
  frost: { groundKey: 'env:frost:ground', platformKey: 'env:frost:platform', climbKey: 'env:frost:rope', segmented: true },
  frostCave: { groundKey: 'env:frost-cave:ground', platformKey: 'env:frost-cave:platform', climbKey: 'env:frost-cave:chain', segmented: true },
  village: { groundKey: 'env:village:ground', platformKey: 'env:village:platform', climbKey: 'env:village:ladder', segmented: true },
  sand: { groundKey: 'env:sand:ground', platformKey: 'env:sand:platform', climbKey: 'env:sand:rope', segmented: true },
  sunwell: { groundKey: 'env:sunwell:ground', platformKey: 'env:sunwell:platform', climbKey: 'env:sunwell:chain', segmented: true },
  ruins: { groundKey: 'env:ruins:ground', platformKey: 'env:ruins:platform', climbKey: 'env:ruins:chain', segmented: true },
} as const satisfies Record<string, TerrainStyle>;

export const THEMED_TERRAIN_IMAGE_KEYS = Object.values(STYLES)
  .flatMap(({ platformKey, climbKey }) => [platformKey, climbKey]);

export const THEMED_GROUND_IMAGE_KEYS = [...new Set(Object.values(STYLES)
  .map(({ groundKey }) => groundKey).filter((key) => key !== DEFAULT.groundKey))];

const DECORATIONS = {
  'forest-edge': 'env:forest:supports',
  'mine-gate': 'env:mine:supports',
} as const;

export const TERRAIN_DECORATION_IMAGE_KEYS = Object.values(DECORATIONS);

export function terrainDecorationKey(map: Pick<MapDef, 'id'>): string | undefined {
  return Object.hasOwn(DECORATIONS, map.id) ? DECORATIONS[map.id as keyof typeof DECORATIONS] : undefined;
}

/** A map can override its shared background theme without changing world/save data. */
export function terrainStyle(map: Pick<MapDef, 'id' | 'themeKey'>): TerrainStyle {
  if (map.id === 'frost-tide-cavern') return STYLES.frostCave;
  if (map.id === 'frost-shore' || map.id === 'frost-pine-pass') return STYLES.frost;
  if (map.id === 'mine-gate') return STYLES.mine;
  if (map.themeKey === 'forest') return STYLES.forest;
  if (map.themeKey === 'rock') return STYLES.ridge;
  if (map.themeKey === 'camp' || map.themeKey === 'town') return STYLES.village;
  if (map.themeKey === 'sand' || map.themeKey === 'sand-dune') return STYLES.sand;
  if (map.themeKey === 'sunwell') return STYLES.sunwell;
  if (['ruins-camp', 'ruins-root', 'ruins-gallery', 'ruins-sanctum'].includes(map.themeKey)) return STYLES.ruins;
  return DEFAULT;
}

/** The loader and drawing code select their ground/platform/climb materials from the same map style. */
export function requiredTerrainImageKeys(map: Pick<MapDef, 'id' | 'themeKey' | 'footholds' | 'ladders'>): string[] {
  const terrain = terrainStyle(map);
  const keys: string[] = [];
  if (map.footholds.some((f) => !f.dropThrough && f.y1 !== f.y2)) keys.push('env:tile-slope');
  if (map.footholds.some((f) => !f.dropThrough && f.y1 === f.y2)) keys.push(terrain.groundKey);
  if (map.footholds.some((f) => f.dropThrough)) keys.push(terrain.platformKey);
  if (map.ladders.length > 0) keys.push(terrain.climbKey);
  const decoration = terrainDecorationKey(map);
  if (decoration) keys.push(decoration);
  return keys;
}

export const THEMED_PLATFORM_WIDTH = 64;
export const THEMED_PLATFORM_HEIGHT = 48;
export const THEMED_PLATFORM_SURFACE_INSET = 8;
export const THEMED_CLIMB_SIZE = 32;

/** Crop coordinates and sizes are in logical frame units, before texture density. */
export type TerrainPiece = {
  frame: number;
  x: number;
  y: number;
  cropX: number;
  cropY: number;
  width: number;
  height: number;
};

/** Background-only supports; the production footholds and climb routes stay unchanged. */
export function terrainDecorationPieces(map: Pick<MapDef, 'id' | 'footholds' | 'ladders'>): TerrainPiece[] {
  if (!terrainDecorationKey(map)) return [];
  const pieces: TerrainPiece[] = [];
  const platforms = map.footholds.filter((f) => f.dropThrough && f.y1 === f.y2 && f.x2 - f.x1 >= 128);
  for (const platform of platforms) {
    for (const center of [platform.x1 + 48, platform.x2 - 48]) {
      const groundY = map.footholds
        .filter((f) => !f.dropThrough && f.y1 === f.y2 && f.x1 <= center && f.x2 >= center && f.y1 > platform.y1)
        .reduce((y, f) => Math.min(y, f.y1), Infinity);
      const top = platform.y1 + 14;
      if (!Number.isFinite(groundY) || groundY - top < 56) continue;
      const x = center - 32;
      pieces.push({ frame: 0, x, y: top, cropX: 0, cropY: 0, width: 64, height: 32 });
      for (let y = top + 32; y < groundY - 24; y += 32) {
        pieces.push({ frame: 1, x, y, cropX: 0, cropY: 0, width: 64, height: Math.min(32, groundY - 24 - y) });
      }
      pieces.push({ frame: 2, x, y: groundY - 24, cropX: 0, cropY: 0, width: 64, height: 24 });
    }
  }
  for (const ladder of map.ladders) {
    if (platforms.some((f) => f.y1 === ladder.topY && f.x1 <= ladder.x && f.x2 >= ladder.x)) {
      pieces.push({ frame: 3, x: ladder.x - 32, y: ladder.topY + 8, cropX: 0, cropY: 0, width: 64, height: 28 });
    }
  }
  return pieces;
}

function variationSeed(id: string): number {
  let seed = 0;
  for (const char of id) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
  return seed;
}

/** Caps preserve the exact foothold endpoints; three stable body variants repeat at native scale. */
export function themedPlatformPieces(foothold: Foothold): TerrainPiece[] {
  const length = foothold.x2 - foothold.x1;
  if (!Number.isFinite(length) || length <= 0 || foothold.y1 !== foothold.y2) return [];
  const cap = Math.min(THEMED_PLATFORM_WIDTH, length / 2);
  const y = foothold.y1 - THEMED_PLATFORM_SURFACE_INSET;
  const pieces: TerrainPiece[] = [{
    frame: 0, x: foothold.x1, y, cropX: 0, cropY: 0, width: cap, height: THEMED_PLATFORM_HEIGHT,
  }];
  const bodyEnd = foothold.x2 - cap;
  const seed = variationSeed(foothold.id);
  for (let x = foothold.x1 + cap, index = 0; x < bodyEnd; x += THEMED_PLATFORM_WIDTH, index += 1) {
    pieces.push({
      frame: 1 + (seed + index) % 3, x, y, cropX: 0, cropY: 0,
      width: Math.min(THEMED_PLATFORM_WIDTH, bodyEnd - x), height: THEMED_PLATFORM_HEIGHT,
    });
  }
  pieces.push({
    frame: 4, x: bodyEnd, y, cropX: THEMED_PLATFORM_WIDTH - cap, cropY: 0,
    width: cap, height: THEMED_PLATFORM_HEIGHT,
  });
  return pieces;
}

/** Repeats the middle at native scale, keeping both caps and the original climb range. */
export function themedClimbPieces(ladder: Ladder): TerrainPiece[] {
  const length = ladder.bottomY - ladder.topY;
  if (!Number.isFinite(length) || length <= 0) return [];
  const cap = Math.min(THEMED_CLIMB_SIZE, length / 2);
  const x = ladder.x - THEMED_CLIMB_SIZE / 2;
  const pieces: TerrainPiece[] = [{
    frame: 0, x, y: ladder.topY, cropX: 0, cropY: 0, width: THEMED_CLIMB_SIZE, height: cap,
  }];
  const bodyEnd = ladder.bottomY - cap;
  for (let y = ladder.topY + cap; y < bodyEnd; y += THEMED_CLIMB_SIZE) {
    pieces.push({
      frame: 1, x, y, cropX: 0, cropY: 0,
      width: THEMED_CLIMB_SIZE, height: Math.min(THEMED_CLIMB_SIZE, bodyEnd - y),
    });
  }
  pieces.push({
    frame: 2, x, y: bodyEnd, cropX: 0, cropY: THEMED_CLIMB_SIZE - cap,
    width: THEMED_CLIMB_SIZE, height: cap,
  });
  return pieces;
}
