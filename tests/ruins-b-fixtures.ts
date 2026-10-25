import type { ContentCatalog, Id, QuestDef, SaveData } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createPlayer } from '../src/domain/progression/index.js';

const trackedTypes = new Set(['kill', 'reach', 'inspect']);

function trackedCounters(quest: QuestDef): Record<Id, number> {
  return Object.fromEntries(quest.objectives
    .filter((objective) => trackedTypes.has(objective.type))
    .map((objective) => [objective.targetId, objective.count]));
}

function quest(
  id: Id,
  name: string,
  objectives: QuestDef['objectives'],
): QuestDef {
  return {
    id,
    name,
    giverNpcId: 'ruins-pathfinder',
    turnInNpcId: 'ruins-pathfinder',
    prerequisiteIds: ['q16'],
    minLevel: 1,
    objectives,
    consumeItems: [],
    reward: { exp: 0, coins: 0, items: [] },
    summary: name,
    acceptText: name,
    progressText: name,
    completeText: name,
  };
}

export const ruinsBCatalog: ContentCatalog = {
  rules: rulesCatalog,
  world: {
    ...worldCatalog,
    quests: {
      ...worldCatalog.quests,
      q17: quest('q17', '兩段回聲', [
        { type: 'inspect', targetId: 'ruins-stele-west', count: 1 },
        { type: 'inspect', targetId: 'ruins-stele-east', count: 1 },
        { type: 'kill', targetId: 'ruins-string-puppet', count: 2 },
      ]),
      q20: {
        ...quest('q20', '留給旅人的鈴聲', [
          { type: 'kill', targetId: 'ruins-bell-prowler', count: 3 },
          { type: 'collect', targetId: 'muted-bell-fragment', count: 3 },
        ]),
        consumeItems: [{ itemId: 'muted-bell-fragment', quantity: 3 }],
      },
    },
  },
};

/** A format-1/2 shaped save from before B, with no q17 or q20 record. */
export function beforeBSave(): SaveData {
  const data: SaveData = {
    player: createPlayer('晨芽', rulesCatalog),
    quests: {},
    visitedMaps: ['camp'],
    location: { mapId: 'camp', spawnId: 'start' },
    flags: { bossDefeated: true, chapterComplete: false },
    settings: { masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.9, muted: false, bindings: {} },
  };
  data.player.level = 30;
  data.player.ap = 145;
  data.quests = Object.fromEntries(Object.entries(worldCatalog.quests)
    .filter(([questId]) => /^q\d{2}$/u.test(questId) && Number(questId.slice(1)) <= 16)
    .map(([questId, definition]) => [questId, { status: 'claimed', counters: trackedCounters(definition) }])) as SaveData['quests'];
  return data;
}

export function activeBSave(): SaveData {
  const data = beforeBSave();
  data.quests.q17 = {
    status: 'active',
    counters: {
      'ruins-stele-west': 1,
      'ruins-stele-east': 0,
      'ruins-string-puppet': 1,
    },
  };
  return data;
}

export function claimedBSave(): SaveData {
  const data = beforeBSave();
  data.quests.q17 = {
    status: 'claimed',
    counters: {
      'ruins-stele-west': 1,
      'ruins-stele-east': 1,
      'ruins-string-puppet': 2,
    },
  };
  data.quests.q20 = {
    status: 'claimed',
    // Quest items were consumed at turn-in and do not need to remain in the bag.
    counters: { 'ruins-bell-prowler': 3 },
  };
  return data;
}
