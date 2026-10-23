import type { UiSnapshot } from '../contracts/ports.js';
import { WORLD_LANDMARKS, PLANNED_REGIONS, mapLevelLabel, portalRequirements } from './world-map-model.js';

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

/** Informational atlas: selecting a landmark never changes the player's location. */
export function buildWorldMap(document: Document, view: UiSnapshot, selectedId: string | null): HTMLElement {
  const root = element(document, 'div', 'ms-world-map');
  const data = view.saveData;
  if (!data) {
    root.append(element(document, 'p', 'ms-empty-state', '建立角色後，展開你的冒險地圖。'));
    return root;
  }
  const maps = Object.values(view.catalog.world.maps);
  const visited = new Set([...data.visitedMaps, data.location.mapId]);
  const planned = PLANNED_REGIONS.find(({ id }) => id === selectedId);
  const selected = planned ? null : view.catalog.world.maps[selectedId ?? ''] ?? view.catalog.world.maps[data.location.mapId];
  if (!selected && !planned) return root;
  const selectedKey = planned?.id ?? selected!.id;

  const toolbar = element(document, 'div', 'ms-atlas-toolbar');
  const progress = element(document, 'div', 'ms-atlas-progress');
  progress.append(
    element(document, 'span', 'ms-atlas-eyebrow', 'BRIGHTWOOD · FIRST OATH'),
    element(document, 'strong', '', '已探索 ' + maps.filter(({ id }) => visited.has(id)).length + ' / ' + maps.length + ' 個地區'),
  );
  const locate = mapButton(document, data.location.mapId, '⌖ 目前位置', 'ms-button ms-atlas-locate');
  toolbar.append(progress, locate);
  root.append(toolbar);

  const layout = element(document, 'div', 'ms-atlas-layout');
  const chart = element(document, 'section', 'ms-atlas-chart');
  chart.setAttribute('aria-label', '木葉世界手繪地圖，點選地標查看區域');
  const artwork = element(document, 'img', 'ms-atlas-art');
  artwork.src = new URL('assets/interface/world-map-background-v2.png', document.baseURI).href;
  artwork.alt = '木葉世界群島：木葉島與霜雪群島已有八個可探索地區，黃金沙海及遠古遺跡仍待開發。';
  artwork.draggable = false;
  artwork.addEventListener('error', () => {
    artwork.hidden = true;
    chart.classList.add('is-art-unavailable');
  }, { once: true });
  const banner = element(document, 'div', 'ms-atlas-banner');
  banner.append(element(document, 'span', '', 'THE FIRST OATH'), element(document, 'h3', '', '木葉世界'));
  const compass = element(document, 'img', 'ms-atlas-compass');
  compass.src = new URL('assets/interface/map-compass-rose-v1.png', document.baseURI).href;
  compass.alt = '';
  compass.draggable = false;
  compass.addEventListener('error', () => { compass.hidden = true; }, { once: true });
  chart.append(artwork, banner, compass);

  // Render each real connection once. Availability follows the outward, gated portal.
  const routes = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  routes.setAttribute('viewBox', '0 0 100 100');
  routes.setAttribute('preserveAspectRatio', 'none');
  routes.setAttribute('class', 'ms-atlas-routes');
  routes.setAttribute('aria-hidden', 'true');
  const pairs = new Set<string>();
  for (const map of maps) {
    const from = WORLD_LANDMARKS[map.id];
    if (!from) continue;
    for (const portal of map.portals) {
      const to = WORLD_LANDMARKS[portal.targetMapId];
      const pair = [map.id, portal.targetMapId].sort().join(':');
      if (!to || pairs.has(pair)) continue;
      pairs.add(pair);
      const open = portalRequirements(portal, data, view.catalog).open;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midpointX = (from.x + to.x) / 2;
      path.setAttribute('d', 'M ' + from.x + ' ' + from.y + ' Q ' + midpointX + ' ' + (Math.min(from.y, to.y) - 2) + ' ' + to.x + ' ' + to.y);
      path.setAttribute('class', open ? 'is-open' : 'is-locked');
      routes.append(path);
    }
  }
  chart.append(routes);

  for (const map of maps) {
    const landmark = WORLD_LANDMARKS[map.id];
    if (!landmark) continue;
    const current = map.id === data.location.mapId;
    const seen = visited.has(map.id);
    const status = current ? '目前位置' : seen ? '已探索' : '未探索';
    const button = mapButton(document, map.id, '', 'ms-atlas-landmark');
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

  for (const region of PLANNED_REGIONS) {
    const button = mapButton(document, region.id, '', 'ms-atlas-landmark ms-atlas-landmark--planned');
    button.style.left = region.x + '%';
    button.style.top = region.y + '%';
    button.classList.toggle('is-selected', region.id === selectedKey);
    button.setAttribute('aria-pressed', String(region.id === selectedKey));
    button.setAttribute('aria-label', region.name + '，待開發，查看規劃狀態');
    button.append(element(document, 'span', 'ms-atlas-label', region.name), element(document, 'span', 'ms-atlas-planned-badge', '待開發'));
    chart.append(button);
  }

  const details = element(document, 'aside', 'ms-atlas-details');
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
  } else if (selected) {
    const status = selected.id === data.location.mapId ? '目前位置' : visited.has(selected.id) ? '已探索' : '未探索';
    details.append(
      element(document, 'span', 'ms-atlas-eyebrow', 'REGION · ' + status),
      element(document, 'h3', 'ms-atlas-region-name', selected.name),
      element(document, 'p', 'ms-atlas-level', mapLevelLabel(selected, view.catalog)),
      element(document, 'p', 'ms-atlas-description', WORLD_LANDMARKS[selected.id]?.description ?? ''),
    );
    const npcNames = selected.npcs.map(({ npcId }) => view.catalog.world.npcs[npcId]?.name ?? npcId);
    const monsterNames = [...new Set(selected.monsters.map(({ monsterId }) => view.catalog.rules.monsters[monsterId]?.name ?? monsterId))];
    if (npcNames.length) details.append(element(document, 'p', 'ms-atlas-inhabitants', '居民：' + npcNames.join('、')));
    if (monsterNames.length) details.append(element(document, 'p', 'ms-atlas-inhabitants', '出沒：' + monsterNames.join('、')));
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
  returnTown.title = view.canReturnTown ? '返回木葉鎮' : data.location.mapId === 'town' ? '目前已在木葉鎮' : data.location.mapId === 'guardian-arena' ? '首領戰尚未結束，不能返回城鎮。' : '目前狀態不允許回城。';
  details.append(returnTown);
  if (returnTown.disabled) details.append(element(document, 'p', 'ms-atlas-return-note', returnTown.title));
  details.append(element(document, 'p', 'ms-atlas-hint', '點選地標查看情報；沿場景中的傳點前往下一區。'));
  layout.append(chart, details);
  root.append(layout);

  const legend = element(document, 'footer', 'ms-atlas-legend');
  legend.append(element(document, 'span', 'ms-atlas-legend-current', '◆ 目前位置'), element(document, 'span', '', '● 已探索'), element(document, 'span', '', '◇ 未探索'), element(document, 'span', '', '虛線為區域通道'), element(document, 'span', '', '▧ 待開發'));
  root.append(legend);
  return root;
}
