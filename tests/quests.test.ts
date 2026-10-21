import { describe, expect, it } from 'vitest';
import type { QuestState, SaveData } from '../src/contracts/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import {
  acceptQuest,
  getQuestView,
  planQuestClaim,
  recordQuestEvent,
} from '../src/domain/quests/index.js';
import { validateWorld } from '../src/content/world/validate.js';

function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return {
    player: {
      name: '阿青', job: 'beginner', level: 3, exp: 0, str: 4, dex: 4, ap: 0, sp: 0,
      hp: 50, mp: 20, coins: 0, skillRanks: {}, bag: [],
      equipment: { weapon: null, body: null, hat: null },
    },
    quests: {},
    visitedMaps: [],
    location: { mapId: 'camp', spawnId: 'start' },
    flags: { bossDefeated: false, chapterComplete: false },
    settings: { masterVolume: 1, musicVolume: 1, sfxVolume: 1, muted: false, bindings: {} },
    ...overrides,
  };
}

function state(status: QuestState['status'], counters: Record<string, number> = {}): QuestState {
  return { status, counters };
}

describe('world and quest content', () => {
  it('validates the complete fixed world catalog', () => {
    expect(validateWorld(worldCatalog, rulesCatalog)).toEqual({ ok: true, value: worldCatalog });
  });

  it('states q01 completion objective and return location', () => {
    const completeText = worldCatalog.quests.q01?.completeText ?? '';
    expect(completeText).toContain('三隻苔殼蝸牛');
    expect(completeText).toContain('晨光營地');
    expect(completeText).toContain('森芽');
  });

  it('reports a claimed quest as fully met even after its items were handed in', () => {
    const data = makeSave({ quests: { q01: state('claimed'), q02: state('claimed'), q03: state('claimed') } });
    const view = getQuestView(data, 'q03', { rules: rulesCatalog, world: worldCatalog });
    expect(view.status).toBe('claimed');
    expect(view.objectives).toEqual([{ type: 'collect', targetId: 'forest-seed', current: 5, required: 5 }]);
  });

  it('keeps quests locked until prerequisites are claimed', () => {
    const data = makeSave();
    expect(getQuestView(data, 'q02', { rules: rulesCatalog, world: worldCatalog }).status).toBe('locked');
    const result = acceptQuest(data, 'q02', { rules: rulesCatalog, world: worldCatalog });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('LOCKED');
  });

  it('completes the town objective when the player visited before accepting q02', () => {
    const data = makeSave({
      quests: { q01: state('claimed') },
      visitedMaps: ['town'],
      location: { mapId: 'town', spawnId: 'center' },
    });
    const accepted = acceptQuest(data, 'q02', { rules: rulesCatalog, world: worldCatalog });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(getQuestView(accepted.value, 'q02', { rules: rulesCatalog, world: worldCatalog }).status).toBe('ready');
      expect(data.quests.q02).toBeUndefined();
    }
  });

  it('recomputes collect readiness from the current bag', () => {
    const data = makeSave({
      quests: { q02: state('claimed'), q03: state('active') },
      player: {
        ...makeSave().player,
        level: 13,
        bag: [{ itemId: 'forest-seed', quantity: 5 }],
      },
    });
    expect(getQuestView(data, 'q03', { rules: rulesCatalog, world: worldCatalog }).status).toBe('ready');
    const soldSomeSeeds = makeSave({
      ...data,
      player: { ...data.player, bag: [{ itemId: 'forest-seed', quantity: 4 }] },
    });
    const view = getQuestView(soldSomeSeeds, 'q03', { rules: rulesCatalog, world: worldCatalog });
    expect(view.status).toBe('active');
    expect(view.objectives[0]?.current).toBe(4);
  });

  it('requires the designated equipment slot for an equip objective', () => {
    const data = makeSave({
      quests: { q05: state('claimed'), q06: state('active') },
      player: {
        ...makeSave().player,
        level: 24,
        bag: [{ itemId: 'ridge-emblem', quantity: 6 }],
      },
    });
    expect(getQuestView(data, 'q06', { rules: rulesCatalog, world: worldCatalog }).status).toBe('active');
    const equipped = makeSave({
      ...data,
      player: { ...data.player, equipment: { ...data.player.equipment, weapon: 'steel-sword' } },
    });
    expect(getQuestView(equipped, 'q06', { rules: rulesCatalog, world: worldCatalog }).status).toBe('ready');
  });

  it('plans a claim without mutating input and rejects a second claim', () => {
    const original = makeSave({ quests: { q01: state('active', { snail: 3 }) } });
    const result = planQuestClaim(original, 'q01', { rules: rulesCatalog, world: worldCatalog });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nextQuests.q01?.status).toBe('claimed');
      expect(result.value.removeItems).toEqual([]);
      expect(original.quests.q01?.status).toBe('active');
      const claimed = makeSave({ ...original, quests: result.value.nextQuests });
      const again = planQuestClaim(claimed, 'q01', { rules: rulesCatalog, world: worldCatalog });
      expect(again.ok).toBe(false);
      if (!again.ok) expect(again.code).toBe('NOT_READY');
    }
  });

  it('caps repeated progress events and returns an independent quest record', () => {
    const original = { q01: state('active', { snail: 2 }) };
    const next = recordQuestEvent(original, { type: 'killed', monsterId: 'snail' }, worldCatalog);
    expect(next.q01?.counters.snail).toBe(3);
    expect(original.q01?.counters.snail).toBe(2);
    expect(recordQuestEvent(next, { type: 'killed', monsterId: 'snail' }, worldCatalog).q01?.counters.snail).toBe(3);
  });

  it('reports malformed portal targets as content errors', () => {
    const broken = {
      ...worldCatalog,
      maps: {
        ...worldCatalog.maps,
        camp: {
          ...worldCatalog.maps.camp,
          portals: [{ ...worldCatalog.maps.camp.portals[0]!, targetSpawnId: 'missing' }],
        },
      },
    };
    const result = validateWorld(broken, rulesCatalog);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Portal target or spawn');
  });

  it('rejects quests whose objectives require maps that are still locked at that quest stage', () => {
    const deadlocked = {
      ...worldCatalog,
      maps: {
        ...worldCatalog.maps,
        town: {
          ...worldCatalog.maps.town,
          portals: worldCatalog.maps.town.portals.map((portal) =>
            portal.targetMapId === 'forest-edge' ? { ...portal, requiredQuestId: 'q03' } : portal),
        },
      },
    };
    const result = validateWorld(deadlocked, rulesCatalog);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Quest q03 collect target is not obtainable in unlocked maps: forest-seed');
  });
});
