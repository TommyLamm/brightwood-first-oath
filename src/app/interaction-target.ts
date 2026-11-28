import type { ContentCatalog, MapDef, PlayerJob, SaveData, Vec2 } from '../contracts/index.js';
import { specializationMentors } from '../content/rules/specializations.js';
import { getQuestView } from '../domain/quests/index.js';

type NpcPlacement = MapDef['npcs'][number];
type Portal = MapDef['portals'][number];

export const INTERACTION_RANGE_PX = 64;

export type InteractionTarget =
  | { kind: 'npc'; placement: Readonly<NpcPlacement> }
  | { kind: 'portal'; portal: Readonly<Portal> };

function nearestWithin<T extends Readonly<Vec2>>(
  placements: readonly T[],
  position: Readonly<Vec2>,
  radius: number,
  id: (placement: T) => string,
): T | null {
  let nearest: T | null = null;
  let bestDistance = radius;
  for (const placement of placements) {
    const distance = Math.hypot(placement.x - position.x, placement.y - position.y);
    if (distance < bestDistance
      || (distance === bestDistance && (!nearest || id(placement).localeCompare(id(nearest)) < 0))) {
      nearest = placement;
      bestDistance = distance;
    }
  }
  return nearest;
}

export function nearestNpcPlacement(
  map: MapDef | undefined,
  position: Readonly<Vec2>,
  radius: number,
): Readonly<NpcPlacement> | null {
  return map ? nearestWithin(map.npcs, position, radius, ({ npcId }) => npcId) : null;
}

export function canTradeWithMerchant(
  map: MapDef | undefined,
  position: Readonly<Vec2>,
  activeNpcId: string | undefined,
): boolean {
  return activeNpcId === 'merchant'
    && nearestNpcPlacement(map, position, INTERACTION_RANGE_PX)?.npcId === activeNpcId;
}

export function isNearSpecializationMentor(map: MapDef | undefined, position: Readonly<Vec2>, job: PlayerJob): boolean {
  return map?.id === 'town'
    && nearestNpcPlacement(map, position, INTERACTION_RANGE_PX)?.npcId === specializationMentors[job];
}

export function resolveInteractionTarget(
  map: MapDef | undefined,
  position: Readonly<Vec2>,
): InteractionTarget | null {
  const placement = nearestNpcPlacement(map, position, INTERACTION_RANGE_PX);
  if (placement) return { kind: 'npc', placement };
  if (!map) return null;

  const portal = nearestWithin(map.portals, position, INTERACTION_RANGE_PX, ({ id }) => id);
  return portal ? { kind: 'portal', portal } : null;
}

export function unclaimedPortalQuest(save: SaveData, portal: Readonly<Portal>): string | null {
  const questId = portal.requiredQuestId;
  return questId && save.quests[questId]?.status !== 'claimed' ? questId : null;
}

export function isPortalLocked(save: SaveData, portal: Readonly<Portal>): boolean {
  return save.player.level < portal.minLevel || unclaimedPortalQuest(save, portal) !== null;
}

export function portalBlockMessage(
  save: SaveData,
  portal: Readonly<Portal>,
  catalog: ContentCatalog,
): string | null {
  if (save.player.level < portal.minLevel) return `需要等級 ${portal.minLevel} 才能通過。`;
  const questId = unclaimedPortalQuest(save, portal);
  if (!questId) return null;

  const quest = catalog.world.quests[questId];
  const place = catalog.world.maps[portal.targetMapId]?.name ?? '前方';
  if (!quest) return `尚未完成通往${place}的任務。`;

  const npcName = (id: string) => catalog.world.npcs[id]?.name ?? '委託人';
  const status = getQuestView(save, questId, catalog).status;
  if (status === 'ready') return '向' + npcName(quest.turnInNpcId) + '回報「' + quest.name + '」後才能前往' + place + '。';
  if (status === 'active') return '完成任務「' + quest.name + '」後才能前往' + place + '。';
  return '向' + npcName(quest.giverNpcId) + '接取並完成「' + quest.name + '」後才能前往' + place + '。';
}
