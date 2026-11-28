import type { ContentCatalog, QuestView, SaveData, WorldCatalog } from '../contracts/index.js';
import { questDestinationMapIds, questTargets, selectTrackerQuest } from '../domain/quests/selection.js';
import { isPortalLocked } from './interaction-target.js';

type RouteStep = { fromMapId: string; toMapId: string; exitId: string };
type Route = { mapId: string; steps: readonly RouteStep[] };
type CachedRoute = {
  mapId: string;
  route: Route | null;
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
  return findTrackedQuestRoute(save, catalog, questViews, trackedQuestId)?.steps[0]?.exitId ?? null;
}

export function findTrackedQuestRoute(
  save: SaveData,
  catalog: ContentCatalog,
  questViews: readonly QuestView[],
  trackedQuestId: string | null,
): Route | null {
  const mapId = save.location.mapId;
  const previous = routes.get(catalog);
  if (previous?.mapId === mapId && previous.questViews === questViews && previous.trackedQuestId === trackedQuestId
    && previous.quests === save.quests && previous.level === save.player.level) {
    return previous.route;
  }
  const quest = selectTrackerQuest(questViews, trackedQuestId);
  const destinations = questDestinationMapIds(catalog.world, questTargets(quest));
  const route = findOpenQuestRoute(save, catalog.world, destinations);
  routes.set(catalog, { mapId, route, questViews, trackedQuestId, quests: save.quests, level: save.player.level });
  return route;
}

/** Find the nearest reachable destination and the portals leading there. */
export function findOpenQuestRoute(save: SaveData, world: WorldCatalog, destinations: ReadonlySet<string>): Route | null {
  const origin = save.location.mapId;
  if (destinations.size === 0) return null;

  const stepsByDestination = new Map<string, RouteStep | null>([[origin, null]]);
  const queue = [origin];
  for (const mapId of queue) {
    if (destinations.has(mapId)) {
      const steps: RouteStep[] = [];
      for (let step = stepsByDestination.get(mapId); step; step = stepsByDestination.get(step.fromMapId)) steps.push(step);
      return { mapId, steps: steps.reverse() };
    }
    for (const portal of world.maps[mapId]?.portals ?? []) {
      if (stepsByDestination.has(portal.targetMapId) || isPortalLocked(save, portal)) continue;
      stepsByDestination.set(portal.targetMapId, { fromMapId: mapId, toMapId: portal.targetMapId, exitId: portal.id });
      queue.push(portal.targetMapId);
    }
  }
  return null;
}
