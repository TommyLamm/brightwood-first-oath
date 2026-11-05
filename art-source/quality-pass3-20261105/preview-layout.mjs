import { writeFileSync } from 'node:fs';
import { maps } from '../../src/content/world/maps.ts';
import { terrainStyle, themedPlatformPieces, themedClimbPieces, requiredTerrainImageKeys } from '../../src/render/terrain-style.ts';
import { groundTilePositions, platformTilePositions, ladderSpriteGeometry, GROUND_TILE_OVERLAP } from '../../src/render/geometry.ts';

const rows = ['frost-shore', 'frost-pine-pass'].map((id) => {
  const map = maps[id];
  return {
    id, name: map.name, theme: map.themeKey, style: terrainStyle(map), required: requiredTerrainImageKeys(map),
    originX: map.footholds.find((f) => f.dropThrough).x1 - 60, originY: 300,
    ground: map.footholds.filter((f) => !f.dropThrough && f.y1 === f.y2)
      .flatMap((f) => groundTilePositions(f, 128, GROUND_TILE_OVERLAP)),
    platforms: map.footholds.filter((f) => f.dropThrough).flatMap((f) => themedPlatformPieces(f)),
    climbs: map.ladders.flatMap((ladder) => themedClimbPieces(ladder)),
    previousPlatforms: map.footholds.filter((f) => f.dropThrough).flatMap((f) => platformTilePositions(f)),
    previousClimbs: map.ladders.map((ladder) => ladderSpriteGeometry(ladder, 32)),
  };
});
writeFileSync(new URL('../../output/quality-pass3-20261105/preview-layout.json', import.meta.url), JSON.stringify(rows, null, 2));
console.log('Exported two world material crops using production terrain geometry.');
