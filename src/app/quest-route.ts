import type { ContentCatalog, QuestView, SaveData } from '../contracts/index.js';
import { questTargets, selectTrackerQuest } from '../domain/quests/selection.js';
import { portalBlockMessage } from './interaction-target.js';

type Route = { mapId: string; exitId: string | null };
type CachedRoute = Route & {
  questViews: readonly QuestView[];
  trackedQuestId: string | null;
  quests: SaveData['quests'];
  level: number;
};
const routes = new WeakMap<ContentCatalog, CachedRoute>();

export function findQuestExit(
  save: SaveData,
  catalog: ContentCatalog,
  questViews: readonly QuestView[],
  trackedQuestId: string | null,
): string | null {
  const mapId = save.location.mapId;
  const previous = routes.get(catalog);
  if (previous?.mapId === mapId && previous.questViews === questViews && previous.trackedQuestId === trackedQuestId
    && previous.quests === save.quests && previous.level === save.player.level) {
    return previous.exitId;
  }
  const exitId = nextExit(save, catalog, selectTrackerQuest(questViews, trackedQuestId));
  routes.set(catalog, { mapId, exitId, questViews, trackedQuestId, quests: save.quests, level: save.player.level });
  return exitId;
}

function nextExit(save: SaveData, catalog: ContentCatalog, quest: QuestView | undefined): string | null {
  const targets = questTargets(quest);
  const destinations = new Set(targets.maps);
  if (targets.npcs.size > 0 || targets.monsters.size > 0) {
    for (const map of Object.values(catalog.world.maps)) {
      if (map.npcs.some(({ npcId }) => targets.npcs.has(npcId))
        || map.monsters.some(({ monsterId }) => targets.monsters.has(monsterId))) destinations.add(map.id);
    }
  }
  const origin = save.location.mapId;
  if (destinations.size === 0 || destinations.has(origin)) return null;

  const visited = new Set([origin]);
  const queue: Route[] = [{ mapId: origin, exitId: null }];
  for (const route of queue) {
    if (destinations.has(route.mapId)) return route.exitId;
    for (const portal of catalog.world.maps[route.mapId]?.portals ?? []) {
      if (visited.has(portal.targetMapId) || portalBlockMessage(save, portal, catalog) !== null) continue;
      visited.add(portal.targetMapId);
      queue.push({ mapId: portal.targetMapId, exitId: route.exitId ?? portal.id });
    }
  }
  return null;
}
