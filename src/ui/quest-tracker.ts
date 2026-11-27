import type { QuestView } from '../contracts/definitions.js';
import type { StorageLike } from '../contracts/ports.js';
import { combatTrialActions } from '../content/world/class-quests.js';
import { isTrackableQuest } from '../domain/quests/selection.js';

export { isTrackableQuest, selectTrackerQuest } from '../domain/quests/selection.js';

export function inspectObjectiveAction(targetId: string): string {
  return combatTrialActions.get(targetId) ?? (targetId.startsWith('ruins-stele-') ? '調律' : '調查');
}

/** Device-local presentation preference; it never writes to a character or cloud save. */
export function createQuestTrackerState(gameId: string, storage: StorageLike | null) {
  const key = gameId + ':ui:quest-tracker-collapsed:v1';
  const legacyKey = gameId + ':ui:tracked-quest:v1';
  const choices = new Map<string, string | null>();
  let trackedKey = legacyKey;
  let selectedCharacter = false;
  let collapsed = false;
  try {
    collapsed = storage?.getItem(key) === '1';
  } catch {
    // Storage may be blocked in an iframe; the control still works for this session.
  }
  const read = (choiceKey: string): string | null => {
    if (!choices.has(choiceKey)) {
      let stored: string | null = null;
      try {
        stored = storage?.getItem(choiceKey) ?? null;
      } catch {
        // Keep independent choices in memory even when persistence is unavailable.
      }
      choices.set(choiceKey, stored && stored.length <= 128 ? stored : null);
    }
    return choices.get(choiceKey) ?? null;
  };
  const write = (choiceKey: string, questId: string | null): boolean => {
    choices.set(choiceKey, questId);
    try {
      if (questId) storage?.setItem(choiceKey, questId);
      else storage?.removeItem(choiceKey);
      return true;
    } catch {
      return false;
    }
  };
  return {
    get collapsed(): boolean { return collapsed; },
    get trackedQuestId(): string | null { return read(trackedKey); },
    selectCharacter(characterId: string | null): void {
      trackedKey = characterId ? legacyKey + ':character:' + characterId : legacyKey;
      if (!characterId || selectedCharacter) return;
      selectedCharacter = true;
      const previous = read(legacyKey);
      if (previous && (read(trackedKey) !== null || write(trackedKey, previous))) write(legacyKey, null);
    },
    trackQuest(questId: string | null): void {
      write(trackedKey, questId);
    },
    reconcile(quests: readonly QuestView[]): void {
      const trackedQuestId = read(trackedKey);
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

/** Keep the counter visible even if a long target name must be truncated. */
export function questTrackerSummary(
  quest: QuestView | undefined,
  targetName: (objective: QuestView['objectives'][number]) => string,
): { label: string; value: string; fraction?: number } {
  if (quest?.status === 'ready') return { label: '', value: '✓ 可交付', fraction: 1 };
  if (quest?.status === 'available') return { label: '', value: '可接取' };
  if (quest?.status !== 'active' || quest.objectives.length === 0) return { label: '', value: '' };
  if (quest.objectives.length === 1) {
    const objective = quest.objectives[0]!;
    const current = Math.min(objective.current, objective.required);
    return {
      label: targetName(objective),
      value: current + '/' + objective.required,
      fraction: current / objective.required,
    };
  }
  const remaining = quest.objectives.filter(({ current, required }) => current < required);
  const next = remaining[0];
  const completed = quest.objectives.length - remaining.length;
  return {
    label: next ? targetName(next) : '',
    value: completed + '/' + quest.objectives.length + ' 項',
    fraction: completed / quest.objectives.length,
  };
}
