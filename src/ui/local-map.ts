import type { MapDef, Vec2 } from '../contracts/index.js';
import type { UiSnapshot } from '../contracts/ports.js';
import { effectiveJob } from '../content/rules/jobs.js';
import { canChooseSpecialization, specializationMentors } from '../content/rules/specializations.js';
import type { QuestTargets } from '../domain/quests/selection.js';
import { npcServiceCueAppearance, questCueStyle, type QuestNpcCueState } from '../render/quest-guidance.js';
import { localMapPoint, type LocalMapFocus } from './local-map-model.js';
import { portalRequirements } from './world-map-model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function text<K extends keyof HTMLElementTagNameMap>(document: Document, tag: K, className: string, value: string) {
  const element = document.createElement(tag); element.className = className; element.textContent = value; return element;
}

function positionMarker(element: HTMLElement, point: Vec2): void {
  element.style.left = point.x + '%'; element.style.top = point.y + '%';
}

/** Read-only terrain guide: no map travel, encounter state or save writes. */
export function buildLocalMap(
  document: Document, view: UiSnapshot, map: MapDef, focus: LocalMapFocus | null | undefined,
  questExitId: string | null, targets: QuestTargets, npcState?: QuestNpcCueState,
): HTMLDetailsElement {
  const details = document.createElement('details');
  details.className = 'ms-local-map'; details.dataset.detailId = 'local-terrain:' + map.id;
  details.dataset.localMapId = map.id;
  details.open = focus?.kind === 'quest';
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
  const codes = { npc: 'N', portal: 'P', monster: 'M' } as const;
  const marker = (kind: keyof typeof codes, index: number, position: Vec2, label: string, highlighted = false, state?: QuestNpcCueState) => {
    const code = codes[kind] + (index + 1);
    const mark = text(document, 'span', 'ms-local-map__marker is-' + kind, code);
    positionMarker(mark, localMapPoint(map, position)!); mark.title = label; chart.append(mark);
    const tag = state === 'ready' ? '可交付任務 · ' : state === 'available' ? '可接取任務 · ' : highlighted ? '目標：' : '';
    const entry = text(document, 'li', '', code + ' · ' + tag + label);
    if (highlighted) {
      mark.classList.add('is-target');
      entry.classList.add('is-target');
      if (kind === 'npc' && focus?.kind === 'npc') {
        entry.setAttribute('aria-current', 'true');
        details.open = true;
      }
      const appearance = questCueStyle(kind, state);
      const cue = text(document, 'span', 'ms-local-map__cue', appearance.symbol);
      cue.style.color = '#' + appearance.color.toString(16);
      mark.prepend(cue);
    }
    legend.append(entry);
    return mark;
  };
  const playerData = view.saveData?.player;
  const mentorId = playerData && canChooseSpecialization(playerData) ? specializationMentors[effectiveJob(playerData)] : null;
  map.npcs.forEach((placement, index) => {
    const { npcId } = placement;
    const npc = view.catalog.world.npcs[npcId];
    const role = npcId === mentorId ? 'specialization' : npc?.role;
    const service = role === 'merchant' || role === 'healer' || role === 'specialization' ? role : undefined;
    const appearance = service ? npcServiceCueAppearance[service] : undefined;
    const label = (npc?.name ?? npcId) + (appearance ? ' · ' + appearance.label : '');
    const highlighted = focus?.kind === 'npc' ? npcId === focus.id : targets.npcs.has(npcId);
    const mark = marker('npc', index, placement, label, highlighted, highlighted && targets.npcs.has(npcId) ? npcState : undefined);
    if (service && appearance) {
      const badge = text(document, 'span', 'ms-local-map__service is-' + service, appearance.symbol);
      badge.style.color = '#' + appearance.color.toString(16);
      mark.append(badge);
    }
  });
  let monsterCount = 0;
  if (targets.monsters.size) {
    for (const spawn of map.monsters) {
      if (!targets.monsters.has(spawn.monsterId)) continue;
      line({ x: spawn.roamLeft, y: spawn.y }, { x: spawn.roamRight, y: spawn.y }, 'is-monster-range');
      const name = view.catalog.rules.monsters[spawn.monsterId]?.name ?? spawn.monsterId;
      marker('monster', monsterCount, spawn, name + '活動區', true);
      monsterCount++;
    }
  }
  map.portals.forEach((portal, index) => {
    const target = view.catalog.world.maps[portal.targetMapId]?.name ?? portal.targetMapId;
    const requirement = portalRequirements(portal, view.saveData!, view.catalog);
    const mark = marker('portal', index, portal, '前往' + target + '：' + requirement.text, portal.id === questExitId);
    if (!requirement.open) {
      mark.classList.add('is-locked');
      mark.prepend(text(document, 'span', 'ms-local-map__lock', ''));
    }
  });
  const player = text(document, 'span', 'ms-local-map__player', '◆');
  player.title = '你在這裡'; player.dataset.localPlayer = ''; chart.append(player);
  details.append(chart, text(document, 'p', 'ms-local-map__key',
    (view.saveData?.location.mapId === map.id ? '◆ 你在這裡　' : '') + 'N 居民／調查點　P 出口'
      + (monsterCount > 0 ? '　M 目標怪物活動區' : '')), legend);
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
