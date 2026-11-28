import type Phaser from 'phaser';
import type { MovementGuide } from '../contracts/ports.js';

function chevron(graphics: Phaser.GameObjects.Graphics, x: number, y: number, direction: -1 | 1): void {
  graphics.beginPath().moveTo(x - 5, y - direction * 3).lineTo(x, y + direction * 3)
    .lineTo(x + 5, y - direction * 3).strokePath();
}

export function drawMovementGuide(
  graphics: Phaser.GameObjects.Graphics, guide: MovementGuide, playerY: number, climbColor = 0xffdf9e,
): void {
  if (guide.kind === 'drop') {
    const { x, y } = guide.position;
    graphics.fillStyle(0x20242a, .92).fillRoundedRect(x - 10, y + 9, 20, 22, 5);
    graphics.lineStyle(2, 0x95e2e7, 1);
    chevron(graphics, x, y + 16, 1);
    chevron(graphics, x, y + 23, 1);
    return;
  }

  const { x, topY, bottomY } = guide.ladder;
  const cueX = x + 22;
  const cueY = Math.max(topY + 14, Math.min(bottomY - 14, playerY - 18));
  const up = guide.direction !== 'down';
  const down = guide.direction !== 'up';
  graphics.fillStyle(0x20242a, .92).fillRoundedRect(cueX - 10, cueY - 12, 20, 24, 5);
  graphics.lineStyle(2, climbColor, 1);
  if (up) chevron(graphics, cueX, cueY - (down ? 5 : 0), -1);
  if (down) chevron(graphics, cueX, cueY + (up ? 5 : 0), 1);
}
