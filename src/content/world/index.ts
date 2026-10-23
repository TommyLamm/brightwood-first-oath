import type { Id, WorldCatalog } from '../../contracts/index.js';
import { dialogues } from './dialogues.js';
import { maps } from './maps.js';
import { npcs } from './npcs.js';
import { quests } from './quests.js';

export { dialogues } from './dialogues.js';
export { maps } from './maps.js';
export { npcs } from './npcs.js';
export { quests } from './quests.js';
export { validateWorld } from './validate.js';

export const worldCatalog: WorldCatalog = { maps, npcs, quests, dialogues };

export const mapOrder: Id[] = [
  'camp', 'town', 'forest-edge', 'mushroom-wood', 'red-ridge', 'mine-gate', 'guardian-arena', 'frost-shore',
];
