import { writeFileSync } from 'node:fs';
import { maps } from '../../src/content/world/maps.ts';
import { terrainStyle, themedPlatformPieces, themedClimbPieces, requiredTerrainImageKeys } from '../../src/render/terrain-style.ts';
import { groundTilePositions, platformTilePositions, ladderSpriteGeometry, GROUND_TILE_OVERLAP } from '../../src/render/geometry.ts';

const map = maps['frost-tide-cavern'];
const row = {
  id: map.id, style: terrainStyle(map), required: requiredTerrainImageKeys(map),
  originX: map.footholds.find((f) => f.dropThrough).x1 - 60, originY: 300,
  ground: map.footholds.filter((f) => !f.dropThrough && f.y1 === f.y2).flatMap((f) => groundTilePositions(f, 128, GROUND_TILE_OVERLAP)),
  platforms: map.footholds.filter((f) => f.dropThrough).flatMap((f) => themedPlatformPieces(f)),
  climbs: map.ladders.flatMap((l) => themedClimbPieces(l)),
  previousPlatforms: map.footholds.filter((f) => f.dropThrough).flatMap((f) => platformTilePositions(f)),
  previousClimbs: map.ladders.map((l) => ladderSpriteGeometry(l, 32)),
};
writeFileSync(new URL('../../output/quality-pass4-20261105/terrain-layout.json', import.meta.url), JSON.stringify(row, null, 2));
console.log('Exported cave material crop from production geometry.');
