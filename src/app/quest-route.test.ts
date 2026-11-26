import { describe, expect, it } from 'vitest';
import type { SaveData } from '../contracts/index.js';
import { rulesCatalog } from '../content/rules/index.js';
import { worldCatalog } from '../content/world/index.js';
import { getQuestViews } from '../domain/quests/index.js';
import { startNewGame } from './gameplay.js';
import { findQuestExit } from './quest-route.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

function investigating(): SaveData {
  let nextId = 0;
  const game = startNewGame('旅人', catalog, () => `route-${++nextId}`);
  if ('error' in game) throw Error(game.error);
  return {
    ...game.gameplay.saveData,
    location: { mapId: 'town', spawnId: 'center' },
    visitedMaps: ['camp', 'town', 'forest-edge'],
    quests: {
      q01: { status: 'claimed', counters: { snail: 3 } },
      q02: { status: 'claimed', counters: { town: 1 } },
      q03: { status: 'claimed', counters: {} },
      q04: { status: 'active', counters: { mushroom: 0 } },
    },
  };
}

describe('tracked quest exits', () => {
  it('points to the next exit on a multi-map route and stops at the destination', () => {
    const save = investigating();
    const views = getQuestViews(save, catalog);
    expect(findQuestExit(save, catalog, views, 'q04')).toBe('town:east');
    const forest = { ...save, location: { mapId: 'forest-edge', spawnId: 'left' } };
    expect(findQuestExit(forest, catalog, views, 'q04')).toBe('forest-edge:east');
    const destination = { ...save, location: { mapId: 'mushroom-wood', spawnId: 'left' } };
    expect(findQuestExit(destination, catalog, views, 'q04')).toBeNull();
  });

  it('excludes a route if its required quest is no longer claimed', () => {
    const save = investigating();
    const views = getQuestViews(save, catalog);
    expect(findQuestExit(save, catalog, views, 'q04')).toBe('town:east');
    const blocked: SaveData = { ...save, quests: { ...save.quests, q03: { status: 'active', counters: {} } } };
    expect(findQuestExit(blocked, catalog, views, 'q04')).toBeNull();
  });
});
