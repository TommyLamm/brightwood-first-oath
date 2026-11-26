import type { QuestView } from '../../contracts/definitions.js';

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
