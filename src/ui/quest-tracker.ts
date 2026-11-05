import type { QuestView } from '../contracts/definitions.js';
import type { StorageLike } from '../contracts/ports.js';

/** Device-local presentation preference; it never writes to a character or cloud save. */
export function createQuestTrackerState(gameId: string, storage: StorageLike | null) {
  const key = gameId + ':ui:quest-tracker-collapsed:v1';
  const trackedKey = gameId + ':ui:tracked-quest:v1';
  let collapsed = false;
  let trackedQuestId: string | null = null;
  try {
    collapsed = storage?.getItem(key) === '1';
    const stored = storage?.getItem(trackedKey);
    trackedQuestId = stored && stored.length <= 128 ? stored : null;
  } catch {
    // Storage may be blocked in an iframe; the control still works for this session.
  }
  return {
    get collapsed(): boolean { return collapsed; },
    get trackedQuestId(): string | null { return trackedQuestId; },
    trackQuest(questId: string | null): void {
      trackedQuestId = questId;
      try {
        if (questId) storage?.setItem(trackedKey, questId);
        else storage?.removeItem(trackedKey);
      } catch {
        // Keep the current choice usable when device storage is unavailable.
      }
    },
    reconcile(quests: readonly QuestView[]): void {
      if (trackedQuestId && !isTrackableQuest(quests.find((quest) => quest.questId === trackedQuestId))) {
        this.trackQuest(null);
      }
    },
    toggle(): void {
      collapsed = !collapsed;
      try {
        storage?.setItem(key, collapsed ? '1' : '0');
      } catch {
        // Keep the in-memory preference even when the device cannot persist it.
      }
    },
  };
}

export function isTrackableQuest(quest: QuestView | undefined): quest is QuestView {
  return quest !== undefined && ['available', 'active', 'ready'].includes(quest.status);
}

/** Honor an explicit choice, otherwise retain the existing ready/active/available order. */
export function selectTrackerQuest(quests: readonly QuestView[], trackedQuestId: string | null): QuestView | undefined {
  const tracked = quests.find((quest) => quest.questId === trackedQuestId);
  if (isTrackableQuest(tracked)) return tracked;
  return quests.find((quest) => quest.status === 'ready')
    ?? quests.find((quest) => quest.status === 'active')
    ?? quests.find((quest) => quest.status === 'available');
}

/** Keep the counter visible even if a long target name must be truncated. */
export function questTrackerSummary(
  quest: QuestView | undefined,
  targetName: (objective: QuestView['objectives'][number]) => string,
): { label: string; value: string } {
  if (quest?.status === 'ready') return { label: '', value: '✓ 可交付' };
  if (quest?.status === 'available') return { label: '', value: '可接取' };
  if (quest?.status !== 'active' || quest.objectives.length === 0) return { label: '', value: '' };
  if (quest.objectives.length === 1) {
    const objective = quest.objectives[0]!;
    return {
      label: targetName(objective),
      value: Math.min(objective.current, objective.required) + '/' + objective.required,
    };
  }
  const completed = quest.objectives.filter(({ current, required }) => current >= required).length;
  return { label: '', value: completed + '/' + quest.objectives.length + ' 項' };
}
