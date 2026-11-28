import type { ContentCatalog, QuestView, SaveData, WorldCatalog } from '../contracts/index.js';
import { questDestinationMapIds, questTargets, selectTrackerQuest } from '../domain/quests/selection.js';
import { isPortalLocked } from './interaction-target.js';

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
  const quest = selectTrackerQuest(questViews, trackedQuestId);
  const destinations = questDestinationMapIds(catalog.world, questTargets(quest));
  const exitId = findOpenQuestRoute(save, catalog.world, destinations)?.exitId ?? null;
  routes.set(catalog, { mapId, exitId, questViews, trackedQuestId, quests: save.quests, level: save.player.level });
  return exitId;
}

/** Find the nearest reachable destination and the first portal leading there. */
export function findOpenQuestRoute(save: SaveData, world: WorldCatalog, destinations: ReadonlySet<string>): Route | null {
  const origin = save.location.mapId;
  if (destinations.size === 0) return null;

  const visited = new Set([origin]);
  const queue: Route[] = [{ mapId: origin, exitId: null }];
  for (const route of queue) {
    if (destinations.has(route.mapId)) return route;
    for (const portal of world.maps[route.mapId]?.portals ?? []) {
      if (visited.has(portal.targetMapId) || isPortalLocked(save, portal)) continue;
      visited.add(portal.targetMapId);
      queue.push({ mapId: portal.targetMapId, exitId: route.exitId ?? portal.id });
    }
  }
  return null;
}
