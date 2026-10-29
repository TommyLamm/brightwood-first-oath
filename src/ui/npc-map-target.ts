import type { Id, WorldCatalog } from '../contracts/index.js';

export type NpcMapTarget = {
  mapId: Id;
  mapName: string;
  npcName: string;
};

export function resolveNpcMapTarget(
  world: Pick<WorldCatalog, 'maps' | 'npcs'>,
  npcId: Id,
): NpcMapTarget | null {
  const npc = world.npcs[npcId];
  if (!npc) return null;

  const map = Object.values(world.maps).find((candidate) =>
    candidate.npcs.some((placement) => placement.npcId === npcId));
  if (!map) return null;

  return {
    mapId: map.id,
    mapName: map.name,
    npcName: npc.name,
  };
}
