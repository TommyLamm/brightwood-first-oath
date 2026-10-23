import { describe, expect, it } from 'vitest';
import type { EntityId, SaveData } from '../../src/contracts/types.js';
import type { GameCommand } from '../../src/contracts/commands.js';
import type { CommandDraft } from '../../src/contracts/commands.js';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { getQuestView, recordQuestEvent } from '../../src/domain/quests/index.js';
import { restoreGame, completeMapTransition, makeWorldSnapshot, startNewGame, stepGameplay } from '../../src/app/gameplay.js';
import { validateSave } from '../../src/persistence/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const idleInput = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };

function makeLegacyFrostSave(nextEntityId: () => EntityId): SaveData {
  const started = startNewGame('舊旅人', catalog, nextEntityId);
  if ('error' in started) throw new Error(started.error);
  const save = structuredClone(started.gameplay.saveData);
  const quests: SaveData['quests'] = {};
  for (const quest of Object.values(worldCatalog.quests)) {
    if (quest.id === 'q09' || quest.id === 'q10') continue;
    quests[quest.id] = {
      status: 'claimed',
      counters: Object.fromEntries(quest.objectives
        .filter((objective) => objective.type === 'kill')
        .map((objective) => [objective.targetId, objective.count])),
    };
  }
  save.quests = quests;
  save.visitedMaps = ['camp', 'town', 'guardian-arena', 'frost-shore', 'frost-pine-pass'];
  save.location = { mapId: 'frost-pine-pass', spawnId: 'left' };
  save.flags = { bossDefeated: true, chapterComplete: true };
  return save;
}

describe('Frost Isles manual guide quests', () => {
  it('keeps old saves idle, preserves the pass return route, and supports both manual turn-ins', () => {
    const nextEntityId = createNextEntityId('frost-quests');
    const oldSave = makeLegacyFrostSave(nextEntityId);
    const validated = validateSave(oldSave, catalog);
    expect(validated.ok).toBe(true);
    expect(oldSave.quests.q09).toBeUndefined();
    expect(oldSave.quests.q10).toBeUndefined();
    if (!validated.ok) throw new Error(validated.message);
    expect(getQuestView(validated.value, 'q09', catalog).status).toBe('available');
    expect(getQuestView(validated.value, 'q10', catalog).status).toBe('locked');

    const restored = restoreGame(validated.value, catalog, nextEntityId);
    expect(restored.repairedArenaLocation).toBe(false);
    let gameplay = restored.gameplay;
    let seq = 1;
    let nowMs = 1000;
    const random = createSeededRandom(508);
    const command = (draft: CommandDraft) => {
      const result = stepGameplay(gameplay, {
        catalog,
        commands: [{ ...draft, seq: seq++ } as GameCommand],
        input: idleInput,
        dtSeconds: 0,
        nowMs,
        random,
        nextEntityId,
      });
      nowMs += 20;
      if (!result.gameplay) throw new Error('Expected Frost Isles gameplay to stay active.');
      gameplay = result.gameplay;
      return result;
    };
    const finishTravel = () => {
      const result = completeMapTransition(gameplay, catalog, nextEntityId, nowMs);
      if (!result.gameplay) throw new Error('Expected a completed map transition.');
      gameplay = result.gameplay;
    };

    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition?.mapId).toBe('frost-shore');
    finishTravel();
    gameplay.movement.position = { x: 250, y: 600 };

    const initialSnapshot = makeWorldSnapshot(gameplay, catalog, nowMs);
    expect(initialSnapshot.questViews.map(({ questId }) => questId)).toEqual(Object.keys(worldCatalog.quests));
    expect(initialSnapshot.questViews.find(({ questId }) => questId === 'q09')?.status).toBe('available');
    expect(initialSnapshot.questViews.find(({ questId }) => questId === 'q10')?.status).toBe('locked');
    command({ type: 'interact', payload: {} });
    expect(gameplay.interaction?.npcId).toBe('frost-guide');
    expect(gameplay.interaction?.dialogue).toContain(worldCatalog.quests.q09!.acceptText);

    command({ type: 'acceptQuest', payload: { questId: 'q09' } });
    expect(gameplay.saveData.quests.q09?.status).toBe('active');
    gameplay.saveData.player.bag = [...gameplay.saveData.player.bag, { itemId: 'frost-fang', quantity: 6 }];
    expect(getQuestView(gameplay.saveData, 'q09', catalog).status).toBe('ready');

    gameplay.movement.position = { x: 1820, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition).toBeNull();
    expect(gameplay.toast).toContain('霜松隘道');

    gameplay.movement.position = { x: 250, y: 600 };
    const coinsBeforeQ09 = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q09' } });
    expect(gameplay.saveData.quests.q09?.status).toBe('claimed');
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'frost-fang')).toBe(false);
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeQ09 + worldCatalog.quests.q09!.reward.coins);
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'large-red')).toBe(true);
    expect(gameplay.saveData.flags).toEqual(oldSave.flags);

    gameplay.movement.position = { x: 1820, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition?.mapId).toBe('frost-pine-pass');
    finishTravel();

    gameplay.movement.position = { x: 2060, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition).toBeNull();
    expect(gameplay.toast).toContain(worldCatalog.quests.q10!.name);

    gameplay.movement.position = { x: 100, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition?.mapId).toBe('frost-shore');
    finishTravel();
    gameplay.movement.position = { x: 250, y: 600 };
    command({ type: 'acceptQuest', payload: { questId: 'q10' } });
    expect(gameplay.saveData.quests.q10?.status).toBe('active');

    for (let index = 0; index < 6; index += 1) {
      gameplay.saveData = {
        ...gameplay.saveData,
        quests: recordQuestEvent(gameplay.saveData.quests, { type: 'killed', monsterId: 'frost-crab' }, worldCatalog),
      };
    }
    gameplay.saveData.player.bag = [...gameplay.saveData.player.bag, { itemId: 'ice-shell', quantity: 4 }];
    const q10View = getQuestView(gameplay.saveData, 'q10', catalog);
    expect(q10View.objectives.map(({ current }) => current)).toEqual([6, 4]);
    expect(q10View.status).toBe('ready');

    const coinsBeforeQ10 = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q10' } });
    expect(gameplay.saveData.quests.q10?.status).toBe('claimed');
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'ice-shell')).toBe(false);
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeQ10 + worldCatalog.quests.q10!.reward.coins);
    expect(gameplay.saveData.flags).toEqual(oldSave.flags);

    gameplay.movement.position = { x: 1820, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition?.mapId).toBe('frost-pine-pass');
    finishTravel();
    gameplay.movement.position = { x: 2060, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition?.mapId).toBe('frost-tide-cavern');
    finishTravel();
    expect(gameplay.saveData.location.mapId).toBe('frost-tide-cavern');
    expect(gameplay.saveData.visitedMaps).toContain('frost-tide-cavern');

    gameplay.movement.position = { x: 100, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition?.mapId).toBe('frost-pine-pass');
    finishTravel();
    expect(gameplay.saveData.location.mapId).toBe('frost-pine-pass');
  });
});