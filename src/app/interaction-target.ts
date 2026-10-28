import type { ContentCatalog, MapDef, SaveData, Vec2 } from '../contracts/index.js';
import { getQuestView } from '../domain/quests/index.js';

type NpcPlacement = MapDef['npcs'][number];
type Portal = MapDef['portals'][number];

export const INTERACTION_RANGE_PX = 64;

export type InteractionTarget =
  | { kind: 'npc'; placement: Readonly<NpcPlacement> }
  | { kind: 'portal'; portal: Readonly<Portal> };

export function nearestNpcPlacement(
  map: MapDef | undefined,
  position: Readonly<Vec2>,
  radius: number,
): Readonly<NpcPlacement> | null {
  if (!map) return null;

  const candidates = map.npcs.map((placement) => ({
    placement,
    distance: Math.hypot(placement.x - position.x, placement.y - position.y),
  })).filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance || a.placement.npcId.localeCompare(b.placement.npcId));
  return candidates[0]?.placement ?? null;
}

export function resolveInteractionTarget(
  map: MapDef | undefined,
  position: Readonly<Vec2>,
): InteractionTarget | null {
  const placement = nearestNpcPlacement(map, position, INTERACTION_RANGE_PX);
  if (placement) return { kind: 'npc', placement };
  if (!map) return null;

  const portals = map.portals.map((portal) => ({
    portal,
    distance: Math.hypot(portal.x - position.x, portal.y - position.y),
  })).filter(({ distance }) => distance <= INTERACTION_RANGE_PX)
    .sort((a, b) => a.distance - b.distance || a.portal.id.localeCompare(b.portal.id));
  const portal = portals[0]?.portal;
  return portal ? { kind: 'portal', portal } : null;
}

export function portalBlockMessage(
  save: SaveData,
  portal: Readonly<Portal>,
  catalog: ContentCatalog,
): string | null {
  if (save.player.level < portal.minLevel) return `需要等級 ${portal.minLevel} 才能通過。`;
  const questId = portal.requiredQuestId;
  if (!questId || save.quests[questId]?.status === 'claimed') return null;

  const quest = catalog.world.quests[questId];
  const place = catalog.world.maps[portal.targetMapId]?.name ?? '前方';
  if (!quest) return `尚未完成通往${place}的任務。`;

  const npcName = (id: string) => catalog.world.npcs[id]?.name ?? '委託人';
  const status = getQuestView(save, questId, catalog).status;
  if (status === 'ready') return '向' + npcName(quest.turnInNpcId) + '回報「' + quest.name + '」後才能前往' + place + '。';
  if (status === 'active') return '完成任務「' + quest.name + '」後才能前往' + place + '。';
  return '向' + npcName(quest.giverNpcId) + '接取並完成「' + quest.name + '」後才能前往' + place + '。';
}
