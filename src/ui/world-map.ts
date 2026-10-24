import type { UiSnapshot } from '../contracts/ports.js';
import {
  WORLD_LANDMARKS,
  FROST_LANDMARKS,
  FROST_ISLES_WORLD_LANDMARK,
  GOLD_SAND_LANDMARKS,
  GOLD_SAND_SEA_WORLD_LANDMARK,
  PLANNED_REGIONS,
  atlasScopeForMapId,
  atlasViewModel,
  frostIslesOverview,
  goldSandSeaOverview,
  mapLevelLabel,
  portalRequirements,
} from './world-map-model.js';
import type { AtlasScope, MapLandmark, RegionOverview } from './world-map-model.js';

function element<K extends keyof HTMLElementTagNameMap>(document: Document, tag: K, className: string, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function mapButton(document: Document, id: string, label: string, className: string): HTMLButtonElement {
  const button = element(document, 'button', className, label);
  button.type = 'button';
  button.dataset.uiAction = 'select-map';
  button.dataset.mapId = id;
  button.dataset.focus = className + ':' + id;
  return button;
}

/** Informational atlas: selecting a landmark changes the chart selection, never the player's location. */
export function buildWorldMap(document: Document, view: UiSnapshot, selectedId: string | null): HTMLElement {
  const root = element(document, 'div', 'ms-world-map');
  const data = view.saveData;
  if (!data) {
    root.append(element(document, 'p', 'ms-empty-state', '建立角色後，展開你的冒險地圖。'));
    return root;
  }

  const atlas = atlasViewModel(view.catalog, data, selectedId);
  const frostOverview = frostIslesOverview(view.catalog, data);
  const sandOverview = goldSandSeaOverview(view.catalog, data);
  const landmarks = atlas.scope === 'frost' ? FROST_LANDMARKS : atlas.scope === 'sand' ? GOLD_SAND_LANDMARKS : WORLD_LANDMARKS;
  const candidatePlanned = atlas.scope === 'world' ? PLANNED_REGIONS.find(({ id }) => id === selectedId) : undefined;
  const planned = candidatePlanned?.id === 'planned-golden-sands' && sandOverview.totalCount > 0 ? undefined : candidatePlanned;
  const selected = planned ? null : atlas.selectedMap;
  if (!selected && !planned) return root;
  const selectedKey = planned?.id ?? selected?.id ?? '';
  const visited = atlas.visitedMapIds;

  const toolbar = element(document, 'div', 'ms-atlas-toolbar');
  const progress = element(document, 'div', 'ms-atlas-progress');
  const localOverview = atlas.scope === 'frost' ? frostOverview : atlas.scope === 'sand' ? sandOverview : null;
  progress.append(
    element(document, 'span', 'ms-atlas-eyebrow', atlas.scope === 'frost' ? 'FROST ISLES · 霜雪群島' : atlas.scope === 'sand' ? 'GOLDEN SANDS · 黃金沙海' : 'BRIGHTWOOD · FIRST OATH'),
    element(document, 'strong', '', localOverview
      ? '已探索 ' + localOverview.exploredCount + ' / ' + localOverview.totalCount + ' 個地區'
      : '已探索 ' + atlas.allExploredCount + ' / ' + atlas.allMapCount + ' 個可玩地區'),
  );
  const locate = mapButton(document, data.location.mapId, '⌖ 目前位置', 'ms-button ms-atlas-locate');
  toolbar.append(progress, locate);
  if (atlas.scope !== 'world') {
    const returnWorld = mapButton(document, 'guardian-arena', '← 世界總覽', 'ms-button ms-atlas-world-return');
    returnWorld.dataset.focus = 'atlas-region-map-toggle';
    returnWorld.title = '返回木葉世界總覽；只切換地圖圖表，不移動角色。';
    toolbar.append(returnWorld);
  }
  root.append(toolbar);

  const layout = element(document, 'div', 'ms-atlas-layout');
  const regionClass = atlas.scope === 'world' ? '' : ' ms-atlas-chart--' + atlas.scope;
  const chart = element(document, 'section', 'ms-atlas-chart' + regionClass);
  chart.setAttribute('aria-label', atlas.scope === 'frost' ? '霜雪群島區域圖，選取地標查看區域情報' : atlas.scope === 'sand' ? '黃金沙海區域圖，選取地標查看區域情報' : '木葉世界群島總覽，點選地標查看區域');
  const artwork = element(document, 'img', 'ms-atlas-art', '');
  const chartUrl = atlas.scope === 'frost' ? 'assets/interface/region-frost-isles-map-v1.png'
    : atlas.scope === 'sand' ? 'assets/interface/region-golden-sands-map-v1.png'
      : 'assets/interface/world-map-background-v2.png';
  artwork.src = new URL(chartUrl, document.baseURI).href;
  artwork.alt = atlas.scope === 'frost'
    ? '霜雪群島手繪區域圖，雪痕海岸、霜松隘道與冰潮洞窟地形。'
    : atlas.scope === 'sand'
      ? '黃金沙海手繪區域圖，琥珀砂岸、沙丘隘道與綠洲盆地地形。'
      : '木葉世界群島總覽；霜雪群島與黃金沙海可另行查看區域圖，遠古遺跡尚待開發。';
  artwork.draggable = false;
  artwork.addEventListener('error', () => {
    artwork.hidden = true;
    chart.classList.add('is-art-unavailable');
  }, { once: true });
  const banner = element(document, 'div', 'ms-atlas-banner' + (atlas.scope === 'world' ? '' : ' ms-atlas-banner--' + atlas.scope));
  banner.append(
    element(document, 'span', '', atlas.scope === 'world' ? 'THE FIRST OATH' : 'REGIONAL CHART'),
    element(document, 'h3', '', atlas.scope === 'frost' ? '霜雪群島' : atlas.scope === 'sand' ? '黃金沙海' : '木葉世界'),
  );
  chart.append(artwork, banner);
  if (atlas.scope === 'world') {
    const compass = element(document, 'img', 'ms-atlas-compass');
    compass.src = new URL('assets/interface/map-compass-rose-v1.png', document.baseURI).href;
    compass.alt = '';
    compass.draggable = false;
    compass.addEventListener('error', () => { compass.hidden = true; }, { once: true });
    chart.append(compass);
  }

  chart.append(buildRoutes(document, view, atlas.maps, landmarks, atlas.scope));
  for (const map of atlas.maps) {
    const landmark = landmarks[map.id];
    const current = map.id === data.location.mapId;
    const seen = visited.has(map.id);
    const status = current ? '目前位置' : seen ? '已探索' : '未探索';
    const button = mapButton(document, map.id, '', 'ms-atlas-landmark' + (atlas.scope === 'world' ? '' : ' ms-atlas-landmark--' + atlas.scope));
    button.classList.toggle('is-current', current);
    button.classList.toggle('is-visited', seen);
    button.classList.toggle('is-selected', map.id === selectedKey);
    button.style.left = landmark.x + '%';
    button.style.top = landmark.y + '%';
    button.setAttribute('aria-pressed', String(map.id === selectedKey));
    button.setAttribute('aria-label', map.name + '，' + status + '，' + mapLevelLabel(map, view.catalog));
    if (current) button.setAttribute('aria-current', 'location');
    button.title = map.name + ' · ' + status;
    const pin = element(document, 'span', 'ms-atlas-pin', current ? '◆' : seen ? '●' : '◇');
    pin.setAttribute('aria-hidden', 'true');
    button.append(pin, element(document, 'span', 'ms-atlas-label', map.name));
    if (current) button.append(element(document, 'span', 'ms-atlas-you', '你在這裡'));
    chart.append(button);
  }

  if (atlas.scope === 'world') {
    if (frostOverview.totalCount > 0) chart.append(buildRegionEntry(document, 'frost-shore', '霜雪群島', FROST_ISLES_WORLD_LANDMARK, 'frost', frostOverview));
    if (sandOverview.totalCount > 0) chart.append(buildRegionEntry(document, 'sand-glass-shore', '黃金沙海', GOLD_SAND_SEA_WORLD_LANDMARK, 'sand', sandOverview));
    for (const region of PLANNED_REGIONS) {
      if (region.id === 'planned-golden-sands' && sandOverview.totalCount > 0) continue;
      const button = mapButton(document, region.id, '', 'ms-atlas-landmark ms-atlas-landmark--planned');
      button.style.left = region.x + '%';
      button.style.top = region.y + '%';
      button.classList.toggle('is-selected', region.id === selectedKey);
      button.setAttribute('aria-pressed', String(region.id === selectedKey));
      button.setAttribute('aria-label', region.name + '，待開發，查看規劃狀態');
      button.append(element(document, 'span', 'ms-atlas-label', region.name), element(document, 'span', 'ms-atlas-planned-badge', '待開發'));
      chart.append(button);
    }
  }

  const details = buildDetails(document, view, atlas.scope, selected, planned, landmarks, frostOverview, sandOverview);
  layout.append(chart, details);
  root.append(layout);

  const legend = element(document, 'footer', 'ms-atlas-legend');
  legend.append(
    element(document, 'span', 'ms-atlas-legend-current', '◆ 目前位置'),
    element(document, 'span', '', '● 已探索'),
    element(document, 'span', '', '◇ 未探索'),
    element(document, 'span', '', atlas.scope === 'world' ? '虛線為島嶼間通道' : '虛線為區域通道'),
  );
  if (atlas.scope === 'world') legend.append(element(document, 'span', '', '▧ 待開發'));
  root.append(legend);
  return root;
}

function buildRoutes(
  document: Document,
  view: UiSnapshot,
  maps: UiSnapshot['catalog']['world']['maps'][string][],
  landmarks: Record<string, MapLandmark>,
  scope: AtlasScope,
): SVGSVGElement {
  const routes = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  routes.setAttribute('viewBox', '0 0 100 100');
  routes.setAttribute('preserveAspectRatio', 'none');
  routes.setAttribute('class', 'ms-atlas-routes');
  routes.setAttribute('aria-hidden', 'true');
  const pairs = new Set<string>();
  const routeMaps = scope === 'world' ? Object.values(view.catalog.world.maps) : maps;
  const coordinate = (mapId: string): { x: number; y: number } | undefined => {
    const mapScope = atlasScopeForMapId(mapId);
    if (scope !== 'world') return mapScope === scope ? landmarks[mapId] : undefined;
    if (mapScope === 'frost') return FROST_ISLES_WORLD_LANDMARK;
    if (mapScope === 'sand') return GOLD_SAND_SEA_WORLD_LANDMARK;
    return landmarks[mapId];
  };
  for (const map of routeMaps) {
    const from = coordinate(map.id);
    if (!from) continue;
    for (const portal of map.portals) {
      const targetMap = view.catalog.world.maps[portal.targetMapId];
      if (!targetMap) continue;
      const fromScope = atlasScopeForMapId(map.id);
      const targetScope = atlasScopeForMapId(targetMap.id);
      if (scope === 'world' && fromScope === targetScope && fromScope !== 'world') continue;
      if (scope === 'world' && targetScope !== 'world'
        && targetMap.id !== 'frost-shore' && targetMap.id !== 'sand-glass-shore') continue;
      const to = coordinate(targetMap.id);
      if (!to) continue;
      const pair = [map.id, targetMap.id].sort().join(':');
      if (pairs.has(pair)) continue;
      pairs.add(pair);
      const open = portalRequirements(portal, view.saveData!, view.catalog).open;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midpointX = (from.x + to.x) / 2;
      path.setAttribute('d', 'M ' + from.x + ' ' + from.y + ' Q ' + midpointX + ' ' + (Math.min(from.y, to.y) - 2) + ' ' + to.x + ' ' + to.y);
      path.setAttribute('class', open ? 'is-open' : 'is-locked');
      routes.append(path);
    }
  }
  return routes;
}

function buildRegionEntry(
  document: Document,
  mapId: string,
  name: string,
  worldLandmark: { x: number; y: number },
  scope: 'frost' | 'sand',
  overview: RegionOverview,
): HTMLButtonElement {
  return buildRegionEntryButton(document, mapId, name, worldLandmark, scope, overview);
}

function buildRegionEntryButton(
  document: Document,
  mapId: string,
  name: string,
  worldLandmark: { x: number; y: number },
  scope: 'frost' | 'sand',
  overview: RegionOverview,
): HTMLButtonElement {
  const requirement = overview.entryRequirement;
  const current = overview.current;
  const seen = overview.exploredCount > 0;
  const button = mapButton(document, mapId, '', 'ms-atlas-landmark ms-atlas-landmark--island ms-atlas-landmark--island--' + scope);
  button.dataset.focus = 'atlas-region-map-toggle';
  button.style.left = worldLandmark.x + '%';
  button.style.top = worldLandmark.y + '%';
  button.classList.toggle('is-current', current);
  button.classList.toggle('is-visited', seen);
  const islandStatus = current ? '你在' + name : requirement?.open ? '通道已開放 · 查看區域' : '入口未開放 · 查看區域';
  const access = requirement?.text ?? '尚無已配置的入口通道';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', name + '，' + overview.exploredCount + ' / ' + overview.totalCount + ' 個地區已探索；' + access + '。查看區域地圖，不會移動角色。');
  button.title = '查看' + name + '區域地圖；不會移動角色。入口狀態：' + access;
  const pin = element(document, 'span', 'ms-atlas-pin', current ? '◆' : seen ? '●' : '◇');
  pin.setAttribute('aria-hidden', 'true');
  button.append(pin, element(document, 'span', 'ms-atlas-label', name), element(document, 'span', current ? 'ms-atlas-you' : 'ms-atlas-island-status', islandStatus));
  return button;
}

function buildDetails(
  document: Document,
  view: UiSnapshot,
  scope: AtlasScope,
  selected: UiSnapshot['catalog']['world']['maps'][string] | null,
  planned: typeof PLANNED_REGIONS[number] | undefined,
  landmarks: Record<string, MapLandmark>,
  frostOverview: ReturnType<typeof frostIslesOverview>,
  sandOverview: ReturnType<typeof goldSandSeaOverview>,
): HTMLElement {
  const details = element(document, 'aside', 'ms-atlas-details' + (scope === 'world' ? '' : ' ms-atlas-details--' + scope));
  details.setAttribute('aria-label', '區域詳情');
  details.setAttribute('aria-live', 'polite');
  if (planned) {
    details.append(
      element(document, 'span', 'ms-atlas-eyebrow', 'UNCHARTED · 待開發'),
      element(document, 'h3', 'ms-atlas-region-name', planned.name),
      element(document, 'p', 'ms-atlas-level', '待開發'),
      element(document, 'p', 'ms-atlas-description', planned.description),
      element(document, 'p', 'ms-atlas-hint', '此區域尚未開放，暫時沒有任務、怪物或可通行的傳點。'),
    );
  } else if (selected && view.saveData) {
    const data = view.saveData;
    const visited = new Set([...data.visitedMaps, data.location.mapId]);
    const status = selected.id === data.location.mapId ? '目前位置' : visited.has(selected.id) ? '已探索' : '未探索';
    details.append(
      element(document, 'span', 'ms-atlas-eyebrow', (scope === 'frost' ? 'FROST ISLES · ' : scope === 'sand' ? 'GOLDEN SANDS · ' : 'REGION · ') + status),
      element(document, 'h3', 'ms-atlas-region-name', selected.name),
      element(document, 'p', 'ms-atlas-level', mapLevelLabel(selected, view.catalog)),
      element(document, 'p', 'ms-atlas-description', landmarks[selected.id]?.description ?? ''),
    );
    const npcNames = selected.npcs.map(({ npcId }) => view.catalog.world.npcs[npcId]?.name ?? npcId);
    const monsterNames = [...new Set(selected.monsters.map(({ monsterId }) => view.catalog.rules.monsters[monsterId]?.name ?? monsterId))];
    if (npcNames.length) details.append(element(document, 'p', 'ms-atlas-inhabitants', '居民：' + npcNames.join('、')));
    if (monsterNames.length) details.append(element(document, 'p', 'ms-atlas-inhabitants', '出沒：' + monsterNames.join('、')));
    const regionOverview = scope === 'frost' ? frostOverview : scope === 'sand' ? sandOverview : null;
    const regionEntryMapId = scope === 'frost' ? 'frost-shore' : 'sand-glass-shore';
    if (regionOverview && selected.id === regionEntryMapId && regionOverview.entryRequirement) {
      details.append(
        element(document, 'h4', 'ms-atlas-path-heading', '群島入口'),
        element(document, 'p', regionOverview.entryRequirement.open ? 'ms-atlas-condition is-open' : 'ms-atlas-condition', regionOverview.entryRequirement.text),
      );
    }
    details.append(element(document, 'h4', 'ms-atlas-path-heading', '相連區域'));
    for (const portal of selected.portals) {
      const target = view.catalog.world.maps[portal.targetMapId];
      if (!target) continue;
      const requirement = portalRequirements(portal, data, view.catalog);
      const row = element(document, 'div', 'ms-atlas-connection');
      const link = mapButton(document, target.id, '↗ ' + target.name, 'ms-atlas-region-link');
      row.append(link, element(document, 'span', requirement.open ? 'ms-atlas-condition is-open' : 'ms-atlas-condition', requirement.text));
      details.append(row);
    }
  }


  const returnTown = element(document, 'button', 'ms-button ms-button--primary ms-atlas-return', '返回木葉鎮');
  returnTown.type = 'button';
  returnTown.dataset.uiAction = 'return-town';
  returnTown.dataset.focus = 'atlas-return-town';
  returnTown.disabled = !view.canReturnTown;
  returnTown.title = view.canReturnTown ? '返回木葉鎮' : view.saveData?.location.mapId === 'town' ? '目前已在木葉鎮' : view.saveData?.location.mapId === 'guardian-arena' ? '首領戰尚未結束，不能返回城鎮。' : '目前狀態不允許回城。';
  details.append(returnTown);
  if (returnTown.disabled) details.append(element(document, 'p', 'ms-atlas-return-note', returnTown.title));
  details.append(element(document, 'p', 'ms-atlas-hint', '點選地標查看情報；實際移動仍須使用場景中已開放的傳點。'));
  return details;
}
