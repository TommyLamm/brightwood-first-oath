import type Phaser from 'phaser';
import type { Vec2 } from '../contracts/index.js';

const directions = {
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
} as const;
type CueDirection = keyof typeof directions;

export const questCueAppearance = {
  npc: { color: 0xffdd8b, symbol: '◇' },
  monster: { color: 0xffa46b, symbol: '⊕' },
  item: { color: 0xa5f5ed, symbol: '▣' },
  portal: { color: 0xe1ccff, symbol: '↓' },
} as const;
export type QuestCueKind = keyof typeof questCueAppearance;
export type QuestTargetKind = Exclude<QuestCueKind, 'portal'>;
export type QuestNpcCueState = 'available' | 'ready';
const npcCueAppearance = {
  available: { color: questCueAppearance.npc.color, symbol: '!' },
  ready: { color: 0xb9f6b5, symbol: '✓' },
} as const;

export function questCueStyle(kind: QuestCueKind, npcState?: QuestNpcCueState) {
  return kind === 'npc' && npcState ? npcCueAppearance[npcState] : questCueAppearance[kind];
}

export type QuestEdgeTarget = {
  kind: QuestTargetKind;
  targetKey: string;
  label: string;
  cue: Vec2 & { direction: CueDirection };
  distance: number;
};

export function selectQuestEdgeTarget(
  nearestByTarget: Iterable<QuestEdgeTarget>,
  visible: ReadonlySet<string>,
  visibleDrop = false,
): QuestEdgeTarget | undefined {
  let nearest: QuestEdgeTarget | undefined;
  for (const target of nearestByTarget) {
    if (visible.has(target.targetKey) || (target.kind === 'monster' && visibleDrop)) continue;
    if (target.kind === 'item') return target;
    if (!nearest || target.distance < nearest.distance) nearest = target;
  }
  return nearest;
}

export function drawContextFocus(
  graphics: Phaser.GameObjects.Graphics, { x, y }: Readonly<Vec2>, width: number, color = 0xa8f1c6,
): void {
  graphics.fillStyle(0x18392f, .3).fillEllipse(x, y + 1, width, 12);
  graphics.lineStyle(2, color, 1).strokeEllipse(x, y + 1, width, 12);
}

export function drawPortalLock(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
  const color = 0xffce79;
  graphics.fillStyle(0x20242a, 0.94).fillCircle(x, y, 10);
  graphics.lineStyle(2, color, 1).strokeRoundedRect(x - 3, y - 6, 6, 8, 3);
  graphics.fillStyle(color, 1).fillRoundedRect(x - 6, y - 1, 12, 7, 2);
  graphics.fillStyle(0x20242a, 1).fillCircle(x, y + 2, 1.25);
}

export function drawSpecializationCue(graphics: Phaser.GameObjects.Graphics, x: number, y: number, direction?: CueDirection): void {
  const color = 0x98dcff;
  graphics.fillStyle(0x20242a, 0.94).fillCircle(x, y, 10);
  if (direction) drawEdgeChevron(graphics, x, y, direction, color);
  graphics.lineStyle(2, color, 1).beginPath().moveTo(x - 5, y - 4).lineTo(x, y + 1)
    .lineTo(x + 5, y - 4).strokePath().lineBetween(x, y + 1, x, y + 6);
  graphics.fillStyle(color, 1).fillCircle(x - 5, y - 4, 1.6).fillCircle(x + 5, y - 4, 1.6);
}

export function drawServiceCue(graphics: Phaser.GameObjects.Graphics, role: 'merchant' | 'healer', x: number, y: number): void {
  graphics.fillStyle(0x20242a, 0.94).fillCircle(x, y, 10);
  if (role === 'healer') {
    graphics.lineStyle(3, 0x9cffe4, 1).lineBetween(x - 5, y, x + 5, y).lineBetween(x, y - 5, x, y + 5);
    return;
  }
  graphics.lineStyle(2, 0xffc78a, 1).strokeEllipse(x, y - 3, 12, 6)
    .lineBetween(x - 6, y - 3, x - 6, y + 3).lineBetween(x + 6, y - 3, x + 6, y + 3).strokeEllipse(x, y + 3, 12, 6);
}

export function questEdgeCue(
  point: Readonly<Vec2>,
  viewport: Readonly<Vec2 & { width: number; height: number }>,
): (Vec2 & { direction: CueDirection }) | undefined {
  const inset = 20;
  const left = viewport.x + inset;
  const right = viewport.x + viewport.width - inset;
  const top = viewport.y + inset;
  const bottom = viewport.y + viewport.height - inset;
  // Leave extra room for the chevron that extends beyond the edge marker.
  const chevronClearance = 8;
  if (point.x < left || point.x > right) {
    const atLeft = point.x < left;
    return {
      x: atLeft ? left + chevronClearance : right - chevronClearance,
      y: viewport.y + viewport.height * 0.55, direction: atLeft ? 'left' : 'right',
    };
  }
  if (point.y < top || point.y > bottom) {
    return {
      x: point.x, y: point.y < top ? top + chevronClearance : bottom - chevronClearance,
      direction: point.y < top ? 'up' : 'down',
    };
  }
}

export function questExitCue(point: Readonly<Vec2>, viewport: Parameters<typeof questEdgeCue>[1]) {
  return questEdgeCue(point, viewport) ?? { ...point, direction: 'down' as const };
}

/** Shape and color distinguish each type of quest target at game scale. */
export function drawQuestCue(
  graphics: Phaser.GameObjects.Graphics,
  kind: QuestCueKind,
  x: number,
  y: number,
  direction?: CueDirection,
  npcState?: QuestNpcCueState,
): void {
  graphics.fillStyle(0x20242a, 0.94).fillCircle(x, y, 10);
  const { color } = questCueStyle(kind, npcState);
  if (kind === 'portal') {
    const { x: dx, y: dy } = directions[direction ?? 'down'];
    graphics.lineStyle(2, color, 1).lineBetween(x - dx * 6, y - dy * 6, x + dx * 4, y + dy * 4);
    strokeCueChevron(graphics, x, y, dx, dy);
    return;
  }
  if (direction) drawEdgeChevron(graphics, x, y, direction, color);
  if (kind === 'npc') {
    if (npcState === 'ready') {
      graphics.lineStyle(2, color, 1).beginPath().moveTo(x - 5, y).lineTo(x - 1, y + 4)
        .lineTo(x + 5, y - 4).strokePath();
      return;
    }
    if (npcState === 'available') {
      graphics.lineStyle(2, color, 1).lineBetween(x, y - 5, x, y + 1);
      graphics.fillStyle(color, 1).fillCircle(x, y + 5, 1.35);
      return;
    }
    graphics.lineStyle(2, color, 1).beginPath().moveTo(x, y - 6).lineTo(x + 6, y)
      .lineTo(x, y + 6).lineTo(x - 6, y).closePath().strokePath();
    graphics.fillStyle(color, 1).fillCircle(x, y, 1.5);
    return;
  }
  if (kind === 'monster') {
    graphics.lineStyle(2, color, 1).strokeCircle(x, y, 4)
      .lineBetween(x, y - 7, x, y - 4).lineBetween(x, y + 4, x, y + 7)
      .lineBetween(x - 7, y, x - 4, y).lineBetween(x + 4, y, x + 7, y);
    return;
  }
  graphics.lineStyle(2, color, 1).strokeRoundedRect(x - 5, y - 4, 10, 9, 2)
    .lineBetween(x - 5, y - 1, x + 5, y - 1);
}

function drawEdgeChevron(graphics: Phaser.GameObjects.Graphics, x: number, y: number, direction: CueDirection, color: number): void {
  const { x: dx, y: dy } = directions[direction];
  const arrowX = x + dx * 14;
  const arrowY = y + dy * 14;
  graphics.lineStyle(4, 0x20242a, 1);
  strokeCueChevron(graphics, arrowX, arrowY, dx, dy);
  graphics.lineStyle(2, color, 1);
  strokeCueChevron(graphics, arrowX, arrowY, dx, dy);
}

function strokeCueChevron(graphics: Phaser.GameObjects.Graphics, x: number, y: number, dx: number, dy: number): void {
  graphics.beginPath().moveTo(x - dx - dy * 5, y - dy + dx * 5)
    .lineTo(x + dx * 4, y + dy * 4).lineTo(x - dx + dy * 5, y - dy - dx * 5).strokePath();
}
