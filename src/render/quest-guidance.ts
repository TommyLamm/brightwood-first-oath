import type Phaser from 'phaser';

/** Shape and color distinguish each type of quest target at game scale. */
export function drawQuestCue(graphics: Phaser.GameObjects.Graphics, kind: 'npc' | 'monster' | 'item' | 'portal', x: number, y: number): void {
  graphics.fillStyle(0x20242a, 0.94).fillCircle(x, y, 10);
  if (kind === 'npc') {
    graphics.lineStyle(2, 0xffdd8b, 1).beginPath().moveTo(x, y - 6).lineTo(x + 6, y)
      .lineTo(x, y + 6).lineTo(x - 6, y).closePath().strokePath();
    graphics.fillStyle(0xffdd8b, 1).fillCircle(x, y, 1.5);
    return;
  }
  if (kind === 'monster') {
    graphics.lineStyle(2, 0xffa46b, 1).strokeCircle(x, y, 4)
      .lineBetween(x, y - 7, x, y - 4).lineBetween(x, y + 4, x, y + 7)
      .lineBetween(x - 7, y, x - 4, y).lineBetween(x + 4, y, x + 7, y);
    return;
  }
  if (kind === 'portal') {
    graphics.lineStyle(2, 0xe1ccff, 1).beginPath().moveTo(x - 5, y - 1)
      .lineTo(x, y + 4).lineTo(x + 5, y - 1).strokePath();
    graphics.lineBetween(x, y - 6, x, y + 4);
    return;
  }
  graphics.lineStyle(2, 0xa5f5ed, 1).strokeRoundedRect(x - 5, y - 4, 10, 9, 2)
    .lineBetween(x - 5, y - 1, x + 5, y - 1);
}
