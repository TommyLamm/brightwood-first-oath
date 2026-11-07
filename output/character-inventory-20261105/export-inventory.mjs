import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { npcs } from '../../src/content/world/npcs.ts';
import { maps } from '../../src/content/world/maps.ts';
import { monsters } from '../../src/content/rules/monsters.ts';
import { items } from '../../src/content/rules/items.ts';

const output = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(output, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/assets/actors/manifest.json'), 'utf8'));
const bosses = new Set(['guardian', 'frost-tide-warden', 'sunwell-sentinel', 'ruins-bell-keeper']);
const props = new Set(['ruins-stele-west', 'ruins-stele-east', 'frost-route-marker']);
const placements = (id, type) => Object.values(maps)
  .filter(map => map[type].some(entry => entry[type === 'npcs' ? 'npcId' : 'monsterId'] === id))
  .map(map => map.name);
const entry = (definition, category, locations) => {
  const image = manifest.images.find(image => image.key === definition.actorKey);
  const animations = manifest.animations.filter(animation => animation.imageKey === image.key);
  return { id: definition.id, name: definition.name, category, locations, image, animations };
};
const actors = [
  ...['cloth-shirt', 'leather-vest', 'iron-mail'].map(id => entry(
    { ...items[id], actorKey: items[id].visualKey }, 'hero', ['所有地圖'])),
  ...Object.values(npcs).map(npc => entry(npc, props.has(npc.id) ? 'prop' : 'npc', placements(npc.id, 'npcs'))),
  ...Object.values(monsters).map(monster => entry(monster, bosses.has(monster.id) ? 'boss' : 'monster', placements(monster.id, 'monsters'))),
];
const inventory = {
  game: JSON.parse(fs.readFileSync(path.join(root, 'public/game.json'), 'utf8')),
  generated: '2026-11-05',
  method: 'Current source catalogs and runtime actor manifest; idle frames, no live browser capture.',
  actors,
  equipment: Object.values(items).filter(item => item.visualKey?.startsWith('equip:')).map(item => ({
    id: item.id, name: item.name, image: manifest.images.find(image => image.key === item.visualKey),
  })),
};
fs.writeFileSync(path.join(output, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
console.log(JSON.stringify({ version: inventory.game.version, counts: Object.fromEntries(
  ['hero', 'npc', 'monster', 'boss', 'prop'].map(category => [category, actors.filter(actor => actor.category === category).length])),
  unused: actors.filter(actor => !actor.locations.length).map(actor => actor.id),
}));
