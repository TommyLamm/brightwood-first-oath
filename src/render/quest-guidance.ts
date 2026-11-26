import type Phaser from 'phaser';
import type { QuestView } from '../contracts/definitions.js';
import { questDropByQuest } from '../content/rules/monsters.js';

export type QuestCueTargets = {
  npcs: ReadonlySet<string>;
  monsters: ReadonlySet<string>;
  items: ReadonlySet<string>;
};

export function questCueTargets(quest: QuestView | undefined): QuestCueTargets {
  const npcs = new Set<string>();
  const monsters = new Set<string>();
  const items = new Set<string>();
  if (quest?.status === 'available' && quest.giverNpcId) npcs.add(quest.giverNpcId);
  if (quest?.status === 'ready' && quest.turnInNpcId) npcs.add(quest.turnInNpcId);
  if (quest?.status === 'active') {
    for (const objective of quest.objectives) {
      if (objective.current >= objective.required) continue;
      if (objective.type === 'inspect') npcs.add(objective.targetId);
      if (objective.type === 'kill') monsters.add(objective.targetId);
      if (objective.type === 'collect' || objective.type === 'equip') items.add(objective.targetId);
    }
    const source = questDropByQuest[quest.questId];
    if (source && items.has(source.itemId)) monsters.add(source.monsterId);
  }
  return { npcs, monsters, items };
}

/** Shape and color distinguish a conversation, combat target, and item at game scale. */
export function drawQuestCue(graphics: Phaser.GameObjects.Graphics, kind: 'npc' | 'monster' | 'item', x: number, y: number): void {
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
  graphics.lineStyle(2, 0xa5f5ed, 1).strokeRoundedRect(x - 5, y - 4, 10, 9, 2)
    .lineBetween(x - 5, y - 1, x + 5, y - 1);
}
