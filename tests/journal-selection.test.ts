import { describe, expect, it } from 'vitest';
import type { QuestView } from '../src/contracts/definitions.js';
import { chooseJournalQuest } from '../src/ui/illustrated-panels.js';

function quest(questId: string, status: QuestView['status']): QuestView {
  return { questId, title: questId, status, objectives: [], reward: { exp: 0, coins: 0, items: [] } };
}

describe('visual quest journal selection', () => {
  it('prioritizes a ready quest and preserves an explicit selection without changing quest state', () => {
    const quests = [quest('q01', 'active'), quest('q02', 'ready'), quest('q03', 'available'), quest('q04', 'locked')];
    const before = JSON.stringify(quests);
    expect(chooseJournalQuest(quests, null)?.questId).toBe('q02');
    expect(chooseJournalQuest(quests, 'q04')?.questId).toBe('q04');
    expect(chooseJournalQuest(quests, 'removed-quest')?.questId).toBe('q02');
    expect(JSON.stringify(quests)).toBe(before);
  });

  it('handles a new adventure, completed chapter and empty catalog', () => {
    expect(chooseJournalQuest([quest('q01', 'available'), quest('q02', 'locked')], null)?.questId).toBe('q01');
    expect(chooseJournalQuest([quest('q01', 'claimed'), quest('q02', 'claimed')], null)?.questId).toBe('q02');
    expect(chooseJournalQuest([], null)).toBeUndefined();
  });
});
