import type { QuestView } from '../../contracts/definitions.js';
import { questDropByQuest } from '../../content/rules/monsters.js';

export type QuestTargets = {
  maps: ReadonlySet<string>;
  npcs: ReadonlySet<string>;
  monsters: ReadonlySet<string>;
  items: ReadonlySet<string>;
};

export function isTrackableQuest(quest: QuestView | undefined): quest is QuestView {
  return quest?.status === 'available' || quest?.status === 'active' || quest?.status === 'ready';
}

/** An explicit choice takes priority over the automatic ready, active, available order. */
export function selectTrackerQuest(quests: readonly QuestView[], trackedQuestId: string | null): QuestView | undefined {
  const tracked = quests.find((quest) => quest.questId === trackedQuestId);
  if (isTrackableQuest(tracked)) return tracked;
  return quests.find((quest) => quest.status === 'ready')
    ?? quests.find((quest) => quest.status === 'active')
    ?? quests.find((quest) => quest.status === 'available');
}

export function questTargets(quest: QuestView | undefined): QuestTargets {
  const maps = new Set<string>();
  const npcs = new Set<string>();
  const monsters = new Set<string>();
  const items = new Set<string>();
  if (quest?.status === 'available' && quest.giverNpcId) npcs.add(quest.giverNpcId);
  if (quest?.status === 'ready' && quest.turnInNpcId) npcs.add(quest.turnInNpcId);
  if (quest?.status === 'active') {
    for (const objective of quest.objectives) {
      if (objective.current >= objective.required) continue;
      switch (objective.type) {
        case 'reach': maps.add(objective.targetId); break;
        case 'inspect': npcs.add(objective.targetId); break;
        case 'kill': monsters.add(objective.targetId); break;
        case 'collect':
        case 'equip': items.add(objective.targetId); break;
      }
    }
    const source = questDropByQuest[quest.questId];
    if (source && items.has(source.itemId)) monsters.add(source.monsterId);
  }
  return { maps, npcs, monsters, items };
}
