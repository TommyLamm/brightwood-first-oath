/** Offline material contact sheet input, using the production geometry (not a game screenshot). */
import { mkdirSync, writeFileSync } from 'node:fs';
import { maps } from '../src/content/world/maps.js';
import { terrainStyle, themedClimbPieces, themedPlatformPieces } from '../src/render/terrain-style.js';

const output = 'output/terrain-biomes-20261105';
mkdirSync(output, { recursive: true });
const examples = ['forest-edge', 'red-ridge', 'mine-gate'].map((id) => {
  const map = maps[id];
  const original = map.footholds.find(({ dropThrough }) => dropThrough)!;
  const foothold = { ...original, x1: 0, x2: original.x2-original.x1, y1: 20, y2: 20 };
  const originalLadder = map.ladders[0];
  const ladder = { ...originalLadder, x: 470, topY: 20, bottomY: 20+originalLadder.bottomY-originalLadder.topY };
  return { id, style: terrainStyle(map), platforms: themedPlatformPieces(foothold), climbs: themedClimbPieces(ladder) };
});
writeFileSync(output+'/preview-layout.json', JSON.stringify(examples, null, 2)+'\n');
const materials = Object.values(maps).map((map) => ({
  id: map.id, name: map.name, themeKey: map.themeKey, ...terrainStyle(map),
  platforms: map.footholds.filter(({ dropThrough }) => dropThrough).length,
  climbs: map.ladders.length,
}));
writeFileSync(output+'/map-materials.json', JSON.stringify(materials, null, 2)+'\n');
console.log('Wrote three material layouts using production terrain geometry.');
