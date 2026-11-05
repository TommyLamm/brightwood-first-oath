import { writeFileSync } from 'node:fs';
import { maps } from '../../src/content/world/maps.ts';
import { terrainStyle, themedPlatformPieces, themedClimbPieces, requiredTerrainImageKeys } from '../../src/render/terrain-style.ts';
import { backgroundImageKey } from '../../src/render/background-style.ts';
import { groundTilePositions, platformTilePositions, ladderSpriteGeometry, GROUND_TILE_OVERLAP } from '../../src/render/geometry.ts';

const rows = Object.values(maps).map((map) => ({
  id: map.id, style: terrainStyle(map), required: requiredTerrainImageKeys(map),
  midground: backgroundImageKey(map, 'mid'),
  originX: Math.max(0, (map.footholds.find((f) => f.dropThrough)?.x1 ?? 60) - 60), originY: 300,
  ground: map.footholds.filter((f) => !f.dropThrough && f.y1 === f.y2).flatMap((f) => groundTilePositions(f, 128, GROUND_TILE_OVERLAP)),
  platforms: map.footholds.filter((f) => f.dropThrough).flatMap((f) => themedPlatformPieces(f)),
  climbs: map.ladders.flatMap((l) => themedClimbPieces(l)),
  previousPlatforms: map.footholds.filter((f) => f.dropThrough).flatMap((f) => platformTilePositions(f)),
  previousClimbs: map.ladders.map((l) => ladderSpriteGeometry(l, 32)),
  platformCount: map.footholds.filter((f) => f.dropThrough).length, climbCount: map.ladders.length,
}));
writeFileSync(new URL('../../output/quality-pass5-20261105/map-usage.json', import.meta.url), JSON.stringify(rows, null, 2));
console.log('Exported actual terrain/background mapping for all', rows.length, 'maps.');
