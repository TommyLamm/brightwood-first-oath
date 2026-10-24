import type { ContentCatalog, MapDef, Portal } from '../contracts/definitions.js';
import type { SaveData } from '../contracts/types.js';

export type MapLandmark = { x: number; y: number; description: string };

/** Landmarks for Leaf Isle on the global archipelago chart. */
export const WORLD_LANDMARKS: Record<string, MapLandmark> = {
  camp: { x: 14, y: 60, description: '溪水與晨光環繞的小小營地。你的第一段冒險，從這裡啟程。' },
  town: { x: 23, y: 46, description: '森林中的溫暖城鎮。拜訪教官、補充藥水，在木葉間稍作歇息。' },
  'forest-edge': { x: 33, y: 57, description: '沿著溪流與木橋深入林間，嫩芽與史萊姆藏在道路兩旁。' },
  'mushroom-wood': { x: 38, y: 36, description: '巨大的菌傘遮蔽天光，孢子與森林的祕密在深處悄悄生長。' },
  'red-ridge': { x: 48, y: 29, description: '赭紅岩壁間蜿蜒的山路，通往被封印的古老礦區。' },
  'mine-gate': { x: 53, y: 46, description: '礦車與木樑停留在舊時光裡，岩石深處傳來守衛的回聲。' },
  'guardian-arena': { x: 52, y: 61, description: '古礦盡頭的石造祭壇。面對守衛，完成你的第一個誓約。' },
};

/** Coordinates belong to the Frost Isles chart; only real catalog maps are rendered. */
export const FROST_LANDMARKS: Record<string, MapLandmark> = {
  'frost-shore': { x: 20, y: 70, description: '越過守衛祭壇後，霜雪群島的海岸在冰霧間展開。' },
  'frost-pine-pass': { x: 50, y: 48, description: '松林與冰蝕岩壁夾成的隘道，雪狼在風雪之間巡行。' },
  'frost-tide-cavern': { x: 80, y: 25, description: '潮汐洞窟藏在冰峰之下，洞口隨著寒潮吐出幽藍霧氣。' },
};

/** Coordinates belong to the Gold Sand Sea chart; future nodes remain absent until playable. */
export const GOLD_SAND_LANDMARKS: Record<string, MapLandmark> = {
  'sand-glass-shore': { x: 20, y: 70, description: '琥珀色海岸與淺灣在日光下交錯，回望可見霜雪群島的航路。' },
  'sand-dune-pass': { x: 50, y: 48, description: '風切沙脊環抱著狹窄山道，流沙深處傳來甲殼摩擦聲。' },
  'sand-sunwell-basin': { x: 80, y: 25, description: '金色沙丘之間的綠洲湧出清泉，四周地勢像一座天然競技場。' },
};

/** One global-chart marker stands for each playable region. */
export const FROST_ISLES_WORLD_LANDMARK = { x: 82, y: 18 };
export const GOLD_SAND_SEA_WORLD_LANDMARK = { x: 85, y: 53 };

export type AtlasScope = 'world' | 'frost' | 'sand';
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

export function isGoldSandMapId(mapId: string): boolean {
  return mapId.startsWith('sand-');
}

export function atlasScopeForMapId(mapId: string): AtlasScope {
  if (isFrostMapId(mapId)) return 'frost';
  if (isGoldSandMapId(mapId)) return 'sand';
  return 'world';
}

function landmarksForScope(scope: AtlasScope): Record<string, MapLandmark> {
  return scope === 'frost' ? FROST_LANDMARKS : scope === 'sand' ? GOLD_SAND_LANDMARKS : WORLD_LANDMARKS;
}

export function atlasViewModel(catalog: ContentCatalog, data: SaveData, selectedId: string | null): AtlasViewModel {
  const allMaps = Object.values(catalog.world.maps);
  const explicitlySelected = selectedId ? catalog.world.maps[selectedId] : undefined;
  const scope = explicitlySelected ? atlasScopeForMapId(explicitlySelected.id) : atlasScopeForMapId(data.location.mapId);
  const scopeMaps = allMaps.filter(({ id }) => atlasScopeForMapId(id) === scope);
  const landmarks = landmarksForScope(scope);
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

export type RegionOverview = {
  current: boolean;
  exploredCount: number;
  totalCount: number;
  entryRequirement: { open: boolean; text: string } | null;
};

function regionOverview(catalog: ContentCatalog, data: SaveData, scope: Exclude<AtlasScope, 'world'>, entryMapId: string, sourceScope: AtlasScope): RegionOverview {
  const maps = Object.values(catalog.world.maps);
  const regionMaps = maps.filter(({ id }) => atlasScopeForMapId(id) === scope);
  const visited = new Set([...data.visitedMaps, data.location.mapId]);
  const entrance = maps
    .filter(({ id }) => atlasScopeForMapId(id) === sourceScope)
    .flatMap(({ portals }) => portals)
    .find(({ targetMapId }) => targetMapId === entryMapId);
  return {
    current: atlasScopeForMapId(data.location.mapId) === scope,
    exploredCount: regionMaps.filter(({ id }) => visited.has(id)).length,
    totalCount: regionMaps.length,
    entryRequirement: entrance ? portalRequirements(entrance, data, catalog) : null,
  };
}

export function frostIslesOverview(catalog: ContentCatalog, data: SaveData): RegionOverview {
  return regionOverview(catalog, data, 'frost', 'frost-shore', 'world');
}

export function goldSandSeaOverview(catalog: ContentCatalog, data: SaveData): RegionOverview {
  return regionOverview(catalog, data, 'sand', 'sand-glass-shore', 'frost');
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
