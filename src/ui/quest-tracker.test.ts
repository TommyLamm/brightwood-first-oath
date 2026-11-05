import { describe, expect, it, vi } from 'vitest';
import type { QuestView } from '../contracts/definitions.js';
import type { StorageLike } from '../contracts/ports.js';
import { createQuestTrackerState, questTrackerSummary, selectTrackerQuest } from './quest-tracker.js';

function memoryStorage() {
  const values = new Map<string, string>();
  const storage: StorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: vi.fn((key, value) => { values.set(key, value); }),
    removeItem: (key) => { values.delete(key); },
  };
  return { values, storage };
}

const active: QuestView = {
  questId: 'q01', title: '第一次出發', status: 'active',
  objectives: [{ type: 'kill', targetId: 'snail', current: 1, required: 3 }],
  reward: { exp: 0, coins: 0, items: [] },
};

describe('quest tracker presentation preference', () => {
  it('remembers both collapsed and expanded choices across UI recreation without modifying a save', () => {
    const { values, storage } = memoryStorage();
    const saveKey = 'brightwood-first-oath:save:v1';
    values.set(saveKey, 'existing character save');
    const first = createQuestTrackerState('brightwood-first-oath', storage);
    expect(first.collapsed).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
    first.toggle();
    const reloaded = createQuestTrackerState('brightwood-first-oath', storage);
    expect(reloaded.collapsed).toBe(true);
    reloaded.toggle();
    expect(createQuestTrackerState('brightwood-first-oath', storage).collapsed).toBe(false);
    expect(values.get(saveKey)).toBe('existing character save');
    expect([...values.keys()]).toEqual([saveKey, 'brightwood-first-oath:ui:quest-tracker-collapsed:v1']);
  });

  it('isolates games and treats an invalid stored preference as expanded', () => {
    const { storage, values } = memoryStorage();
    createQuestTrackerState('another-game', storage).toggle();
    expect(createQuestTrackerState('brightwood-first-oath', storage).collapsed).toBe(false);
    values.set('brightwood-first-oath:ui:quest-tracker-collapsed:v1', 'invalid');
    expect(createQuestTrackerState('brightwood-first-oath', storage).collapsed).toBe(false);
    expect(createQuestTrackerState('another-game', storage).collapsed).toBe(true);
  });

  it('keeps the control usable when storage reads and writes throw', () => {
    const unavailable = () => { throw new Error('Storage blocked'); };
    const state = createQuestTrackerState('brightwood-first-oath', {
      getItem: unavailable, setItem: unavailable, removeItem: unavailable,
    });
    expect(state.collapsed).toBe(false);
    state.toggle();
    expect(state.collapsed).toBe(true);
    state.toggle();
    expect(state.collapsed).toBe(false);
  });

  it('works without persistent storage', () => {
    const state = createQuestTrackerState('brightwood-first-oath', null);
    state.toggle();
    expect(state.collapsed).toBe(true);
  });
});

describe('collapsed quest progress', () => {
  it('keeps a single target counter and caps excess inventory at the required count', () => {
    expect(questTrackerSummary(active, () => '苔殼蝸牛')).toEqual({ label: '苔殼蝸牛', value: '1/3' });
    expect(questTrackerSummary({ ...active,
      objectives: [{ type: 'collect', targetId: 'ore', current: 99, required: 6 }],
    }, () => '礦石')).toEqual({ label: '礦石', value: '6/6' });
  });

  it('counts completed objectives instead of adding unlike kill, inventory and travel counts', () => {
    expect(questTrackerSummary({ ...active, objectives: [
      { type: 'kill', targetId: 'snail', current: 3, required: 3 },
      { type: 'collect', targetId: 'ore', current: 2, required: 6 },
      { type: 'reach', targetId: 'camp', current: 1, required: 1 },
    ] }, () => '')).toEqual({ label: '', value: '2/3 項' });
  });

  it('prioritizes the delivery reminder over numeric progress when ready', () => {
    expect(questTrackerSummary({ ...active, status: 'ready' }, () => '苔殼蝸牛'))
      .toEqual({ label: '', value: '✓ 可交付' });
    expect(questTrackerSummary({ ...active, status: 'available' }, () => ''))
      .toEqual({ label: '', value: '可接取' });
  });

  it('handles exploration and active quests without objectives', () => {
    expect(questTrackerSummary(undefined, () => '')).toEqual({ label: '', value: '' });
    expect(questTrackerSummary({ ...active, objectives: [] }, () => '')).toEqual({ label: '', value: '' });
  });
});

describe('explicit quest tracking', () => {
  const ready = { ...active, questId: 'ready-quest', status: 'ready' as const };
  const available = { ...active, questId: 'new-quest', status: 'available' as const };

  it('keeps the chosen quest through progress and delivery readiness, then falls back after claiming', () => {
    const quests = [ready, active, available];
    expect(selectTrackerQuest(quests, 'q01')).toBe(active);
    const completed = { ...active, status: 'ready' as const };
    expect(selectTrackerQuest([ready, completed, available], 'q01')).toBe(completed);
    expect(selectTrackerQuest([ready, { ...active, status: 'claimed' }, available], 'q01')).toBe(ready);
  });

  it('retains automatic priority for a missing, locked or unspecified choice', () => {
    const locked = { ...active, questId: 'locked', status: 'locked' as const };
    for (const id of [null, 'missing', 'locked']) expect(selectTrackerQuest([available, active, locked, ready], id)).toBe(ready);
    expect(selectTrackerQuest([available, active], null)).toBe(active);
    expect(selectTrackerQuest([available], null)).toBe(available);
    expect(selectTrackerQuest([locked], 'locked')).toBeUndefined();
    expect(selectTrackerQuest([ready, available], available.questId)).toBe(available);
  });

  it('remembers the choice per game without touching character or collapsed preferences', () => {
    const { storage, values } = memoryStorage();
    values.set('game:save:v1', 'unchanged save');
    const first = createQuestTrackerState('game', storage);
    first.toggle();
    first.trackQuest('q01');
    const restored = createQuestTrackerState('game', storage);
    expect(restored.trackedQuestId).toBe('q01');
    expect(restored.collapsed).toBe(true);
    expect(createQuestTrackerState('another-game', storage).trackedQuestId).toBeNull();
    restored.trackQuest(null);
    expect(createQuestTrackerState('game', storage).trackedQuestId).toBeNull();
    expect(createQuestTrackerState('game', storage).collapsed).toBe(true);
    expect(values.get('game:save:v1')).toBe('unchanged save');
  });

  it('clears unavailable choices only when reconciling an actual character quest list', () => {
    const { storage, values } = memoryStorage();
    values.set('game:ui:tracked-quest:v1', 'q01');
    const state = createQuestTrackerState('game', storage);
    expect(state.trackedQuestId).toBe('q01');
    state.reconcile([active]);
    expect(state.trackedQuestId).toBe('q01');
    state.reconcile([{ ...active, status: 'claimed' }]);
    expect(state.trackedQuestId).toBeNull();
    expect(values.has('game:ui:tracked-quest:v1')).toBe(false);
    state.trackQuest('unknown');
    state.reconcile([active]);
    expect(state.trackedQuestId).toBeNull();
  });

  it('keeps explicit tracking and stopping usable when persistence is blocked', () => {
    const blocked = () => { throw Error('blocked storage'); };
    const state = createQuestTrackerState('game', { getItem: blocked, setItem: blocked, removeItem: blocked });
    state.trackQuest('q01');
    expect(state.trackedQuestId).toBe('q01');
    state.reconcile([active]);
    expect(state.trackedQuestId).toBe('q01');
    state.trackQuest(null);
    expect(state.trackedQuestId).toBeNull();
  });
});
