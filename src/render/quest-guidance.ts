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

export function drawContextFocus(graphics: Phaser.GameObjects.Graphics, { x, y }: Readonly<Vec2>, width: number): void {
  graphics.fillStyle(0x18392f, .3).fillEllipse(x, y + 1, width, 12);
  graphics.lineStyle(2, 0xa8f1c6, 1).strokeEllipse(x, y + 1, width, 12);
}

export function questExitCue(
  point: Readonly<Vec2>,
  viewport: Readonly<Vec2 & { width: number; height: number }>,
): Vec2 & { direction: CueDirection } {
  const inset = 20;
  const left = viewport.x + inset;
  const right = viewport.x + viewport.width - inset;
  const top = viewport.y + inset;
  const bottom = viewport.y + viewport.height - inset;
  if (point.x < left || point.x > right) {
    const atLeft = point.x < left;
    return { x: atLeft ? left : right, y: viewport.y + viewport.height * 0.55, direction: atLeft ? 'left' : 'right' };
  }
  if (point.y < top || point.y > bottom) {
    return { x: point.x, y: point.y < top ? top : bottom, direction: point.y < top ? 'up' : 'down' };
  }
  return { ...point, direction: 'down' };
}

/** Shape and color distinguish each type of quest target at game scale. */
export function drawQuestCue(
  graphics: Phaser.GameObjects.Graphics,
  kind: QuestCueKind,
  x: number,
  y: number,
  direction: CueDirection = 'down',
): void {
  graphics.fillStyle(0x20242a, 0.94).fillCircle(x, y, 10);
  const { color } = questCueAppearance[kind];
  if (kind === 'npc') {
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
  if (kind === 'portal') {
    const { x: dx, y: dy } = directions[direction];
    const tipX = x + dx * 4;
    const tipY = y + dy * 4;
    graphics.lineStyle(2, color, 1).beginPath().moveTo(x - dx - dy * 5, y - dy + dx * 5)
      .lineTo(tipX, tipY).lineTo(x - dx + dy * 5, y - dy - dx * 5).strokePath();
    graphics.lineBetween(x - dx * 6, y - dy * 6, tipX, tipY);
    return;
  }
  graphics.lineStyle(2, color, 1).strokeRoundedRect(x - 5, y - 4, 10, 9, 2)
    .lineBetween(x - 5, y - 1, x + 5, y - 1);
}
