import { describe, expect, it } from 'vitest';
import type { QuestView } from '../contracts/definitions.js';
import { questTargets, selectTrackerQuest } from '../domain/quests/selection.js';
import { questEdgeCue, questExitCue, selectQuestEdgeTarget, type QuestEdgeTarget } from './quest-guidance.js';

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

  it('points outward when the exit is beyond the visible world and points down at the visible portal', () => {
    const viewport = { x: 200, y: 100, width: 600, height: 400 };
    expect(questExitCue({ x: 80, y: 250 }, viewport)).toEqual({ x: 228, y: 284, direction: 'left' });
    expect(questExitCue({ x: 960, y: 250 }, viewport)).toEqual({ x: 772, y: 284, direction: 'right' });
    expect(questExitCue({ x: 300, y: 70 }, viewport)).toEqual({ x: 300, y: 128, direction: 'up' });
    expect(questExitCue({ x: 300, y: 250 }, viewport)).toEqual({ x: 300, y: 250, direction: 'down' });
  });

  it('keeps a directional target marker clear of the edge and lets the normal marker take over', () => {
    const viewport = { x: 200, y: 100, width: 600, height: 400 };
    expect(questEdgeCue({ x: 219, y: 250 }, viewport)).toEqual({ x: 228, y: 284, direction: 'left' });
    expect(questEdgeCue({ x: 220, y: 250 }, viewport)).toBeUndefined();
    expect(questEdgeCue({ x: 350, y: 550 }, viewport)).toEqual({ x: 350, y: 472, direction: 'down' });
  });

  it('keeps a different objective discoverable when monsters are already visible', () => {
    const cue = { x: 780, y: 300, direction: 'right' } as const;
    const npc: QuestEdgeTarget = { kind: 'npc', targetKey: 'npc:stele', label: '石碑', cue, distance: 20 };
    const monster: QuestEdgeTarget = { kind: 'monster', targetKey: 'monster:golem', label: '石像', cue, distance: 10 };
    const sentinel: QuestEdgeTarget = { ...monster, targetKey: 'monster:sentinel', label: '哨兵', distance: 30 };
    const item: QuestEdgeTarget = { kind: 'item', targetKey: 'item:seed', label: '種子', cue, distance: 40 };
    expect(selectQuestEdgeTarget([monster, npc], new Set([monster.targetKey]))).toBe(npc);
    expect(selectQuestEdgeTarget([monster, npc], new Set([monster.targetKey, npc.targetKey]))).toBeUndefined();
    expect(selectQuestEdgeTarget([monster, sentinel], new Set([monster.targetKey]))).toBe(sentinel);
    expect(selectQuestEdgeTarget([monster, npc], new Set([item.targetKey]), true)).toBe(npc);
    expect(selectQuestEdgeTarget([monster, npc, item], new Set())).toBe(item);
  });
});
