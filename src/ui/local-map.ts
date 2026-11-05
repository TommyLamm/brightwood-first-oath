import type { MapDef, Vec2 } from '../contracts/index.js';
import type { UiSnapshot } from '../contracts/ports.js';
import { localMapPoint } from './local-map-model.js';
import { portalRequirements } from './world-map-model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function text<K extends keyof HTMLElementTagNameMap>(document: Document, tag: K, className: string, value: string) {
  const element = document.createElement(tag); element.className = className; element.textContent = value; return element;
}

function positionMarker(element: HTMLElement, point: Vec2): void {
  element.style.left = point.x + '%'; element.style.top = point.y + '%';
}

/** Read-only terrain guide: no map travel, encounter state or save writes. */
export function buildLocalMap(document: Document, view: UiSnapshot, map: MapDef): HTMLDetailsElement {
  const details = document.createElement('details');
  details.className = 'ms-local-map'; details.dataset.detailId = 'local-terrain:' + map.id;
  details.dataset.localMapId = map.id;
  const summary = text(document, 'summary', '', map.name + ' · 地形導覽');
  summary.dataset.focus = 'local-terrain:' + map.id;
  details.append(summary, text(document, 'p', 'ms-panel-note', '橫向位置與遊戲一致；縱向經縮放。實線是地面，長虛線是可下跳平台，短虛線是攀爬路線。'));
  const chart = text(document, 'div', 'ms-local-map__chart', '');
  chart.setAttribute('aria-hidden', 'true');
  const terrain = document.createElementNS(SVG_NS, 'svg');
  terrain.setAttribute('viewBox', '0 0 1000 240'); terrain.setAttribute('preserveAspectRatio', 'none');
  const point = (p: Vec2) => { const percent = localMapPoint(map, p)!; return { x: percent.x * 10, y: percent.y * 2.4 }; };
  const line = (from: Vec2, to: Vec2, className: string) => {
    const node = document.createElementNS(SVG_NS, 'line');
    const a = point(from); const b = point(to);
    for (const [name, value] of Object.entries({ x1: a.x, y1: a.y, x2: b.x, y2: b.y })) node.setAttribute(name, String(value));
    node.setAttribute('class', className); terrain.append(node);
  };
  for (const floor of map.footholds) line({ x: floor.x1, y: floor.y1 }, { x: floor.x2, y: floor.y2 }, floor.dropThrough ? 'is-platform' : 'is-ground');
  for (const ladder of map.ladders) line({ x: ladder.x, y: ladder.topY }, { x: ladder.x, y: ladder.bottomY }, 'is-climb');
  for (const wall of map.walls) {
    const node = document.createElementNS(SVG_NS, 'rect');
    const a = point(wall); const b = point({ x: wall.x + wall.width, y: wall.y + wall.height });
    for (const [name, value] of Object.entries({ x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y })) node.setAttribute(name, String(value));
    node.setAttribute('class', 'is-wall'); terrain.append(node);
  }
  chart.append(terrain);
  const legend = text(document, 'ul', 'ms-local-map__legend', '');
  const marker = (kind: 'npc' | 'portal', index: number, position: Vec2, label: string) => {
    const code = (kind === 'npc' ? 'N' : 'P') + (index + 1);
    const mark = text(document, 'span', 'ms-local-map__marker is-' + kind, code);
    positionMarker(mark, localMapPoint(map, position)!); mark.title = label; chart.append(mark);
    legend.append(text(document, 'li', '', code + ' · ' + label));
  };
  map.npcs.forEach((npc, index) => marker('npc', index, npc, view.catalog.world.npcs[npc.npcId]?.name ?? npc.npcId));
  map.portals.forEach((portal, index) => {
    const target = view.catalog.world.maps[portal.targetMapId]?.name ?? portal.targetMapId;
    const requirement = portalRequirements(portal, view.saveData!, view.catalog);
    marker('portal', index, portal, '前往' + target + '：' + requirement.text);
  });
  const player = text(document, 'span', 'ms-local-map__player', '◆');
  player.title = '你在這裡'; player.dataset.localPlayer = ''; chart.append(player);
  details.append(chart, text(document, 'p', 'ms-local-map__key',
    (view.saveData?.location.mapId === map.id ? '◆ 你在這裡　' : '') + 'N 居民／調查點　P 出口'), legend);
  updateLocalMapPlayer(details, view);
  return details;
}

/** Update only the live marker; moving must not rebuild the atlas or reset its focus/scroll. */
export function updateLocalMapPlayer(root: HTMLElement, view: UiSnapshot): void {
  const marker = root.querySelector<HTMLElement>('[data-local-player]');
  const guide = marker?.closest<HTMLElement>('[data-local-map-id]');
  if (!marker || !guide) return;
  const mapId = view.saveData?.location.mapId;
  const map = mapId ? view.catalog.world.maps[mapId] : undefined;
  const point = map && mapId === guide.dataset.localMapId && view.playerPosition ? localMapPoint(map, view.playerPosition) : null;
  marker.hidden = !point;
  if (point) positionMarker(marker, point);
}
