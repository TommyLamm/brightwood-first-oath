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
      if (Number(quest.id.slice(1)) >= 9) continue;
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
    expect(validated.ok, validated.ok ? '' : validated.message).toBe(true);
    expect(oldSave.quests.q09).toBeUndefined();
    expect(oldSave.quests.q10).toBeUndefined();
    expect(oldSave.quests.q11).toBeUndefined();
    if (!validated.ok) throw new Error(validated.message);
    expect(getQuestView(validated.value, 'q09', catalog).status).toBe('available');
    expect(getQuestView(validated.value, 'q10', catalog).status).toBe('locked');
    expect(getQuestView(validated.value, 'q11', catalog).status).toBe('locked');

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
    gameplay.saveData.player.level = rulesCatalog.progression.maxLevel;
    gameplay.saveData.player.exp = 0;
    const coinsBeforeQ09 = gameplay.saveData.player.coins;
    const q09Claim = command({ type: 'claimQuest', payload: { questId: 'q09' } });
    expect(gameplay.saveData.quests.q09?.status).toBe('claimed');
    expect(q09Claim.gameplay?.toast).toContain('已達等級上限，EXP不再累積');
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

  it('manually claims q11 after the Warden fight and grants the level-cap sword exactly once', () => {
    const nextEntityId = createNextEntityId('frost-q11');
    const legacy = makeLegacyFrostSave(nextEntityId);
    legacy.quests.q09 = { status: 'claimed', counters: {} };
    legacy.quests.q10 = { status: 'claimed', counters: { 'frost-crab': 6 } };
    legacy.location = { mapId: 'frost-shore', spawnId: 'left' };
    legacy.visitedMaps = ['camp', 'town', 'guardian-arena', 'frost-shore', 'frost-pine-pass', 'frost-tide-cavern'];
    expect(legacy.quests.q11).toBeUndefined();
    const validated = validateSave(legacy, catalog);
    expect(validated.ok, validated.ok ? '' : validated.message).toBe(true);
    if (!validated.ok) throw new Error(validated.message);
    expect(getQuestView(validated.value, 'q11', catalog).status).toBe('available');

    let gameplay = restoreGame(validated.value, catalog, nextEntityId).gameplay;
    gameplay.movement.position = { x: 250, y: 600 };
    let nowMs = 1000;
    let seq = 1;
    const random = createSeededRandom(115);
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

    command({ type: 'acceptQuest', payload: { questId: 'q11' } });
    expect(gameplay.saveData.quests.q11?.status).toBe('active');
    gameplay.pendingTransition = { mapId: 'frost-tide-cavern', spawnId: 'left', after: 'travel' };
    finishTravel();

    const bossSpawn = catalog.world.maps['frost-tide-cavern']!.monsters.find(({ monsterId }) => monsterId === 'frost-tide-warden')!;
    const boss = gameplay.monsters.find(({ monsterId }) => monsterId === 'frost-tide-warden')!;
    gameplay.monsters = [{ ...boss, hp: 1, movement: { ...boss.movement, position: { x: bossSpawn.x, y: 600 } } }];
    gameplay.movement = { ...gameplay.movement, position: { x: bossSpawn.x - 40, y: 600 }, facing: 1 };
    let screen: ReturnType<typeof stepGameplay>['screen'] = 'playing';
    for (let tick = 0; tick < 60; tick += 1) {
      nowMs += 1000 / 60;
      const result = stepGameplay(gameplay, {
        catalog,
        commands: tick === 0 ? [{ seq: seq++, type: 'attack', payload: { skillId: 'basic' } }] : [],
        input: idleInput,
        dtSeconds: 1 / 60,
        nowMs,
        random,
        nextEntityId,
      });
      gameplay = result.gameplay!;
      screen = result.screen;
      if (screen === 'result') break;
    }

    expect(screen).toBe('result');
    expect(getQuestView(gameplay.saveData, 'q11', catalog).status).toBe('ready');
    expect(gameplay.saveData.flags).toEqual(legacy.flags);
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'frost-tide-sword')).toBe(false);

    command({ type: 'returnTown', payload: {} });
    expect(gameplay.pendingTransition?.mapId).toBe('frost-shore');
    finishTravel();
    gameplay.movement.position = { x: 250, y: 600 };
    const coinsBeforeClaim = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q11' } });
    expect(gameplay.saveData.quests.q11?.status).toBe('claimed');
    expect(gameplay.saveData.player.bag.filter(({ itemId }) => itemId === 'frost-tide-sword')
      .reduce((sum, stack) => sum + stack.quantity, 0)).toBe(1);
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeClaim + worldCatalog.quests.q11!.reward.coins);
    expect(gameplay.saveData.flags).toEqual(legacy.flags);
    expect(rulesCatalog.items['frost-tide-sword']).toMatchObject({ minLevel: 30, attack: 50, buyPrice: 0 });

    command({ type: 'claimQuest', payload: { questId: 'q11' } });
    expect(gameplay.saveData.player.bag.filter(({ itemId }) => itemId === 'frost-tide-sword')
      .reduce((sum, stack) => sum + stack.quantity, 0)).toBe(1);
  });

  it('keeps q21 optional to the Frost mainline, counts only a fresh marker inspection, and preserves a full-bag claim', () => {
    const nextEntityId = createNextEntityId('frost-q21');
    const markerPlacement = worldCatalog.maps['frost-pine-pass'].npcs
      .find(({ npcId }) => npcId === 'frost-route-marker');
    if (!markerPlacement) throw new Error('Expected the q21 marker to be placed in Frost Pine Pass.');
    const legacy = makeLegacyFrostSave(nextEntityId);
    legacy.quests.q09 = { status: 'claimed', counters: {} };
    legacy.location = { mapId: 'frost-shore', spawnId: 'left' };
    legacy.visitedMaps = ['camp', 'town', 'guardian-arena', 'frost-shore'];
    const validated = validateSave(legacy, catalog);
    expect(validated.ok, validated.ok ? '' : validated.message).toBe(true);
    if (!validated.ok) throw new Error(validated.message);
    expect(getQuestView(validated.value, 'q10', catalog).status).toBe('available');
    expect(getQuestView(validated.value, 'q11', catalog).status).toBe('locked');
    expect(getQuestView(validated.value, 'q21', catalog).status).toBe('available');

    let gameplay = restoreGame(validated.value, catalog, nextEntityId).gameplay;
    let nowMs = 1000;
    let seq = 1;
    const random = createSeededRandom(2101);
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
      if (!result.gameplay) throw new Error('Expected q21 gameplay to remain active.');
      gameplay = result.gameplay;
      return result;
    };
    const finishTravel = () => {
      const result = completeMapTransition(gameplay, catalog, nextEntityId, nowMs);
      if (!result.gameplay) throw new Error('Expected q21 map transition to complete.');
      gameplay = result.gameplay;
    };

    gameplay.movement.position = { x: 250, y: 600 };
    command({ type: 'interact', payload: {} });
    command({ type: 'acceptQuest', payload: { questId: 'q21' } });
    expect(gameplay.saveData.quests.q21).toEqual({ status: 'active', counters: { 'frost-route-marker': 0 } });
    expect(getQuestView(gameplay.saveData, 'q10', catalog).status).toBe('available');

    gameplay.movement.position = { x: 1820, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition?.mapId).toBe('frost-pine-pass');
    finishTravel();
    gameplay.movement.position = { x: markerPlacement.x, y: markerPlacement.y };
    command({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(0);
    command({ type: 'interact', payload: {} });
    expect(gameplay.interaction?.npcId).toBe('frost-route-marker');
    command({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(1);
    expect(getQuestView(gameplay.saveData, 'q21', catalog).status).toBe('ready');
    command({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(1);

    gameplay.movement.position = { x: 100, y: 600 };
    command({ type: 'interact', payload: {} });
    finishTravel();
    gameplay.movement.position = { x: 250, y: 600 };
    gameplay.saveData.player.bag = Array.from({ length: 32 }, () => ({ itemId: 'forest-seed', quantity: 1 }));
    const coinsBefore = gameplay.saveData.player.coins;
    const fullBagClaim = command({ type: 'claimQuest', payload: { questId: 'q21' } });
    expect(fullBagClaim.gameplay?.toast).toContain('背包已滿');
    expect(gameplay.saveData.quests.q21?.status).toBe('active');
    expect(getQuestView(gameplay.saveData, 'q21', catalog).status).toBe('ready');
    expect(gameplay.saveData.player.coins).toBe(coinsBefore);

    gameplay.saveData.player.bag = [];
    command({ type: 'claimQuest', payload: { questId: 'q21' } });
    expect(gameplay.saveData.quests.q21?.status).toBe('claimed');
    expect(gameplay.saveData.player.coins).toBe(coinsBefore + 500);
    expect(gameplay.saveData.player.bag).toContainEqual({ itemId: 'large-red', quantity: 3 });
    expect(gameplay.saveData.player.bag).toContainEqual({ itemId: 'large-blue', quantity: 2 });
    command({ type: 'claimQuest', payload: { questId: 'q21' } });
    expect(gameplay.saveData.player.coins).toBe(coinsBefore + 500);
    expect(gameplay.saveData.player.bag.filter(({ itemId }) => itemId === 'large-red')
      .reduce((sum, stack) => sum + stack.quantity, 0)).toBe(3);
    expect(getQuestView(gameplay.saveData, 'q10', catalog).status).toBe('available');
    expect(getQuestView(gameplay.saveData, 'q11', catalog).status).toBe('locked');
  });
});
