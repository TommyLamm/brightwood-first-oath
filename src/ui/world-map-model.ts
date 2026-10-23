import type { ContentCatalog, MapDef, Portal } from '../contracts/definitions.js';
import type { SaveData } from '../contracts/types.js';

export type MapLandmark = { x: number; y: number; description: string };

/** Landmarks for the original Leaf Isle areas on the global archipelago chart. */
export const WORLD_LANDMARKS: Record<string, MapLandmark> = {
  camp: { x: 14, y: 60, description: '溪水與晨光環繞的小小營地。你的第一段冒險，從這裡啟程。' },
  town: { x: 23, y: 46, description: '森林中的溫暖城鎮。拜訪教官、補充藥水，在木葉間稍作歇息。' },
  'forest-edge': { x: 33, y: 57, description: '沿著溪流與木橋深入林間，嫩芽與史萊姆藏在道路兩旁。' },
  'mushroom-wood': { x: 38, y: 36, description: '巨大的菌傘遮蔽天光，孢子與森林的祕密在深處悄悄生長。' },
  'red-ridge': { x: 48, y: 29, description: '赭紅岩壁間蜿蜒的山路，通往被封印的古老礦區。' },
  'mine-gate': { x: 53, y: 46, description: '礦車與木樑停留在舊時光裡，岩石深處傳來守衛的回聲。' },
  'guardian-arena': { x: 52, y: 61, description: '古礦盡頭的石造祭壇。面對守衛，完成你的第一個誓約。' },
};

/** Coordinates belong to the Frost Isles artwork; the cave appears only after its map is in the catalog. */
export const FROST_LANDMARKS: Record<string, MapLandmark> = {
  'frost-shore': { x: 20, y: 70, description: '越過守衛祭壇後，霜雪群島的海岸在冰霧間展開。' },
  'frost-pine-pass': { x: 50, y: 48, description: '松林與冰蝕岩壁夾成的隘道，雪狼在風雪之間巡行。' },
  'frost-tide-cavern': { x: 80, y: 25, description: '潮汐洞窟藏在冰峰之下，洞口隨著寒潮吐出幽藍霧氣。' },
};

/** One global-chart marker stands for the whole Frost Isles region. */
export const FROST_ISLES_WORLD_LANDMARK = { x: 82, y: 18 };

export type AtlasScope = 'world' | 'frost';
export type AtlasViewModel = {
  scope: AtlasScope;
  /** Real catalog maps in this scope which have an authored chart coordinate. */
  maps: MapDef[];
  selectedMap: MapDef | null;
  visitedMapIds: Set<string>;
  exploredCount: number;
  totalCount: number;
  allExploredCount: number;
  allMapCount: number;
};

export function isFrostMapId(mapId: string): boolean {
  return mapId.startsWith('frost-');
}

export function atlasViewModel(catalog: ContentCatalog, data: SaveData, selectedId: string | null): AtlasViewModel {
  const allMaps = Object.values(catalog.world.maps);
  const explicitlySelected = selectedId ? catalog.world.maps[selectedId] : undefined;
  const scope: AtlasScope = explicitlySelected
    ? isFrostMapId(explicitlySelected.id) ? 'frost' : 'world'
    : isFrostMapId(data.location.mapId) ? 'frost' : 'world';
  const scopeMaps = allMaps.filter(({ id }) => isFrostMapId(id) === (scope === 'frost'));
  const landmarks = scope === 'frost' ? FROST_LANDMARKS : WORLD_LANDMARKS;
  const maps = scopeMaps.filter(({ id }) => Object.hasOwn(landmarks, id));
  const visitedMapIds = new Set([...data.visitedMaps, data.location.mapId]);
  const currentMap = maps.find(({ id }) => id === data.location.mapId) ?? null;
  const selectedMap = explicitlySelected && maps.some(({ id }) => id === explicitlySelected.id)
    ? explicitlySelected
    : currentMap ?? maps[0] ?? null;
  return {
    scope,
    maps,
    selectedMap,
    visitedMapIds,
    exploredCount: scopeMaps.filter(({ id }) => visitedMapIds.has(id)).length,
    totalCount: scopeMaps.length,
    allExploredCount: allMaps.filter(({ id }) => visitedMapIds.has(id)).length,
    allMapCount: allMaps.length,
  };
}

export type FrostIslesOverview = {
  current: boolean;
  exploredCount: number;
  totalCount: number;
  entryRequirement: { open: boolean; text: string } | null;
};

export function frostIslesOverview(catalog: ContentCatalog, data: SaveData): FrostIslesOverview {
  const maps = Object.values(catalog.world.maps);
  const frostMaps = maps.filter(({ id }) => isFrostMapId(id));
  const visited = new Set([...data.visitedMaps, data.location.mapId]);
  const entrance = maps
    .filter(({ id }) => !isFrostMapId(id))
    .flatMap(({ portals }) => portals)
    .find(({ targetMapId }) => targetMapId === 'frost-shore');
  return {
    current: isFrostMapId(data.location.mapId),
    exploredCount: frostMaps.filter(({ id }) => visited.has(id)).length,
    totalCount: frostMaps.length,
    entryRequirement: entrance ? portalRequirements(entrance, data, catalog) : null,
  };
}

export function mapLevelLabel(map: MapDef, catalog: ContentCatalog): string {
  const levels = map.monsters.map(({ monsterId }) => catalog.rules.monsters[monsterId]?.level)
    .filter((level): level is number => typeof level === 'number');
  if (!levels.length) return map.safe ? '安全城鎮' : '探索區域';
  const low = Math.min(...levels);
  const high = Math.max(...levels);
  return (map.boss ? '首領 ' : '怪物 ') + 'Lv.' + low + (high > low ? '–' + high : '');
}

export function portalRequirements(portal: Portal, data: SaveData, catalog: ContentCatalog): { open: boolean; text: string } {
  const unmet: string[] = [];
  if (portal.requiredQuestId && data.quests[portal.requiredQuestId]?.status !== 'claimed') {
    unmet.push('需完成「' + (catalog.world.quests[portal.requiredQuestId]?.name ?? portal.requiredQuestId) + '」並領獎');
  }
  if (data.player.level < portal.minLevel) unmet.push('需要 Lv.' + portal.minLevel);
  return { open: unmet.length === 0, text: unmet.join('・') || '通道已開放' };
}

/** Planned areas are atlas information only; they are never added to the playable catalog or save data. */
export const PLANNED_REGIONS = [
  { id: 'planned-golden-sands', name: '黃金沙海', x: 85, y: 53, description: '海的另一側是金色沙漠，區域內容尚待開發。' },
  { id: 'planned-ancient-ruins', name: '遠古遺跡', x: 69, y: 86, description: '沉睡在南方海域的古老遺跡，區域內容尚待開發。' },
];
