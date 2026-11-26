import { describe, expect, it } from 'vitest';
import type { QuestView } from '../contracts/definitions.js';
import { questTargets, selectTrackerQuest } from '../domain/quests/selection.js';

function quest(questId: string, status: QuestView['status'], objectives: QuestView['objectives'] = []): QuestView {
  return {
    questId, status, objectives, title: questId, giverNpcId: 'giver', turnInNpcId: 'recipient',
    reward: { exp: 0, coins: 0, items: [] },
  };
}

describe('in-world quest guidance', () => {
  it('uses the same selected quest and updates the NPC when it becomes ready', () => {
    const ready = quest('ready', 'ready');
    const available = quest('available', 'available');
    expect(questTargets(selectTrackerQuest([ready, available], null)).npcs).toEqual(new Set(['recipient']));
    expect(questTargets(selectTrackerQuest([ready, available], 'available')).npcs).toEqual(new Set(['giver']));
  });

  it('marks only unfinished targets and adds the monster that drops the needed quest item', () => {
    const active = quest('q03', 'active', [
      { type: 'collect', targetId: 'forest-seed', current: 4, required: 5 },
      { type: 'kill', targetId: 'snail', current: 3, required: 3 },
      { type: 'inspect', targetId: 'practice-target', current: 0, required: 1 },
    ]);
    expect(questTargets(active)).toEqual({
      maps: new Set(), npcs: new Set(['practice-target']), monsters: new Set(['slime']), items: new Set(['forest-seed']),
    });
    active.objectives[0]!.current = 5;
    expect(questTargets(active)).toEqual({
      maps: new Set(), npcs: new Set(['practice-target']), monsters: new Set(), items: new Set(),
    });
  });
});
