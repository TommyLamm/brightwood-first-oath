import { maps } from '../../src/content/world/maps.ts';
import { terrainStyle, terrainDecorationKey } from '../../src/render/terrain-style.ts';
import fs from 'node:fs';

const rows = Object.values(maps).map((map) => ({
  id: map.id, name: map.name, theme: map.themeKey, style: terrainStyle(map),
  decoration: terrainDecorationKey(map) ?? null,
  platforms: map.footholds.filter((f) => f.dropThrough).length,
  slopes: map.footholds.filter((f) => !f.dropThrough && f.y1 !== f.y2).length,
  ground: map.footholds.filter((f) => !f.dropThrough && f.y1 === f.y2).length,
  ladders: map.ladders.length,
  monsters: [...new Set(map.monsters.map((spawn) => spawn.monsterId))],
}));
fs.writeFileSync(new URL('./map-usage.json', import.meta.url), JSON.stringify(rows, null, 2) + '\n');
console.log(`Exported ${rows.length} production maps`);
