import { describe, expect, it } from 'vitest';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { restoreGame, startNewGame, stepGameplay } from '../../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const idle = { moveX: 0 as const, climbY: 0 as const, jumpPressed: false, downHeld: false };

describe('chapter settlement', () => {
  it('claiming q08 completes the chapter and switches to the chapter settlement screen', () => {
    const nextEntityId = createNextEntityId('chapter');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    const base = started.gameplay.saveData;
    const quests = Object.fromEntries(Object.keys(worldCatalog.quests).map((id) => [id, { status: 'claimed' as const, counters: {} }]));
    quests.q08 = { status: 'active' as const, counters: { guardian: 1 } } as never;
    const saveData = {
      ...base,
      player: { ...base.player, job: 'swordsman' as const, bag: [...base.player.bag, { itemId: 'guardian-core', quantity: 1 }] },
      location: { mapId: 'red-ridge', spawnId: 'left' },
      visitedMaps: Object.keys(worldCatalog.maps),
      quests,
      flags: { ...base.flags, bossDefeated: true },
    };
    const restored = restoreGame(saveData, catalog, nextEntityId);
    if (!('gameplay' in restored) || !restored.gameplay) throw new Error('restore failed');
    const keeper = worldCatalog.maps['red-ridge']!.npcs.find(({ npcId }) => npcId === 'keeper')!;
    const gameplay = { ...restored.gameplay, movement: { ...restored.gameplay.movement, position: { x: keeper.x, y: keeper.y } } };

    const result = stepGameplay(gameplay, {
      catalog, commands: [{ type: 'claimQuest', payload: { questId: 'q08' }, seq: 1 } as never], input: idle,
      dtSeconds: 1 / 60, nowMs: 1000, random: createSeededRandom(1), nextEntityId,
    });

    expect(result.gameplay?.saveData.quests.q08?.status).toBe('claimed');
    expect(result.gameplay?.saveData.flags.chapterComplete).toBe(true);
    expect(result.screen).toBe('chapter');
  });
});
