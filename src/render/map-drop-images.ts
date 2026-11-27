import type { ContentCatalog, MapDef } from '../contracts/index.js';
import { questDropByQuest } from '../content/rules/monsters.js';
import { classItemId } from '../content/world/class-quests.js';

const jobs = ['swordsman', 'archer', 'mage', 'rogue'] as const;

/** An area only needs ground icons for loot its monsters can produce. */
export function mapDropImageKeys(map: MapDef, catalog: ContentCatalog): Set<string> {
  const itemIds = new Set<string>();
  const monsterIds = new Set(map.monsters.map(({ monsterId }) => monsterId));
  for (const monsterId of monsterIds) {
    const drops = catalog.rules.monsters[monsterId]?.drops ?? [];
    for (const { itemId } of drops) {
      for (const job of jobs) itemIds.add(classItemId(itemId, { job }));
    }
  }
  for (const { monsterId, itemId } of Object.values(questDropByQuest)) {
    if (monsterIds.has(monsterId)) itemIds.add(itemId);
  }
  const keys = new Set<string>();
  for (const id of itemIds) {
    const item = catalog.rules.items[id];
    if (item) keys.add(item.iconKey);
  }
  return keys;
}
