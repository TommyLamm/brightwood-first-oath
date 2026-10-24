import { describe, expect, it } from 'vitest';
import type { EntityId, SaveData, StorageLike } from '../../src/contracts/index.js';
import type { GameCommand, CommandDraft } from '../../src/contracts/commands.js';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { getQuestView } from '../../src/domain/quests/index.js';
import {
  completeMapTransition,
  restoreGame,
  startNewGame,
  stepGameplay,
} from '../../src/app/gameplay.js';
import { createPersistence, localSaveKeyForGame } from '../../src/persistence/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const idleInput = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };

class MemoryStorage implements StorageLike {
  readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }
}

function makeLegacySave(nextEntityId: () => EntityId): SaveData {
  const started = startNewGame('日井旅人', catalog, nextEntityId);
  if ('error' in started) throw new Error(started.error);
  const save = structuredClone(started.gameplay.saveData);
  save.player.level = 30;
  save.player.exp = 0;
  save.player.ap = 145;
  save.player.hp = 660;
  save.player.mp = 98;
  save.player.coins = 5000;
  save.quests = Object.fromEntries(Object.values(worldCatalog.quests)
    .filter((quest) => quest.id !== 'q14')
    .map((quest) => {
      const counters: Record<string, number> = {};
      for (const objective of quest.objectives) {
        if (objective.type === 'kill' || objective.type === 'reach') counters[objective.targetId] = objective.count;
      }
      return [quest.id, { status: 'claimed', counters }];
    })) as SaveData['quests'];
  save.visitedMaps = Object.keys(worldCatalog.maps).filter((mapId) => mapId !== 'sand-sunwell-altar');
  save.location = { mapId: 'sand-glass-shore', spawnId: 'left' };
  save.flags = { bossDefeated: true, chapterComplete: true };
  return save;
}

describe('Sunwell Sentinel finale quest', () => {
  it('loads a format-1 save without q14 and awards the Oathblade only after manual claim', async () => {
    const nextEntityId = createNextEntityId('sunwell-q14');
    const legacy = makeLegacySave(nextEntityId);
    expect(legacy.quests.q14).toBeUndefined();

    const storage = new MemoryStorage();
    const gameId = 'sunwell-sentinel-test';
    const key = localSaveKeyForGame(gameId, import.meta.env.DEV);
    storage.entries.set(key, JSON.stringify({
      formatVersion: 1,
      data: legacy,
      savedAt: new Date(0).toISOString(),
    }));
    const persistence = createPersistence({ gameId, storage, cloud: null, catalog });
    const loaded = await persistence.initialize();
    expect(loaded).toMatchObject({ mode: 'local', status: 'ready' });
    expect(loaded.data?.quests).not.toHaveProperty('q14');
    expect(getQuestView(loaded.data!, 'q14', catalog).status).toBe('available');
    persistence.dispose();

    let gameplay = restoreGame(loaded.data!, catalog, nextEntityId).gameplay;
    const guardianFlags = { ...gameplay.saveData.flags };
    let seq = 1;
    let nowMs = 1000;
    const random = createSeededRandom(1420);
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
      if (!result.gameplay) throw new Error('Expected Sunwell gameplay to remain active.');
      gameplay = result.gameplay;
      return result;
    };
    const finishTravel = () => {
      const result = completeMapTransition(gameplay, catalog, nextEntityId, nowMs);
      if (!result.gameplay) throw new Error('Expected the map transition to complete.');
      gameplay = result.gameplay;
    };
    const usePortal = (x: number, targetMapId: string) => {
      gameplay.movement.position = { x, y: 600 };
      const result = command({ type: 'interact', payload: {} });
      expect(result.gameplay?.pendingTransition?.mapId).toBe(targetMapId);
      finishTravel();
    };
    const defeatSentinel = () => {
      const map = worldCatalog.maps['sand-sunwell-altar']!;
      const spawn = map.monsters.find(({ monsterId }) => monsterId === 'sunwell-sentinel')!;
      const sentinel = gameplay.monsters.find(({ monsterId }) => monsterId === 'sunwell-sentinel')!;
      gameplay.monsters = [{
        ...sentinel,
        hp: 1,
        movement: { ...sentinel.movement, position: { x: spawn.x, y: 600 } },
      }];
      gameplay.movement = { ...gameplay.movement, position: { x: spawn.x - 40, y: 600 }, facing: 1 };
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
        if (!result.gameplay) throw new Error('Expected the Sentinel fight to remain active.');
        gameplay = result.gameplay;
        screen = result.screen;
        if (screen === 'result') break;
      }
      expect(screen).toBe('result');
    };

    gameplay.movement.position = { x: 250, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.interaction?.npcId).toBe('sands-guide');
    command({ type: 'acceptQuest', payload: { questId: 'q14' } });
    expect(gameplay.saveData.quests.q14?.status).toBe('active');

    usePortal(1820, 'sand-dune-pass');
    usePortal(2500, 'sand-sunwell-basin');
    gameplay.saveData = {
      ...gameplay.saveData,
      quests: { ...gameplay.saveData.quests, q13: { status: 'active', counters: { 'sunwell-beetle': 0 } } },
    };
    gameplay.movement.position = { x: 2700, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition).toBeNull();
    expect(gameplay.toast).toContain('日井古道');
    gameplay.saveData = {
      ...gameplay.saveData,
      quests: { ...gameplay.saveData.quests, q13: { status: 'active', counters: { 'sunwell-beetle': 2 } } },
    };
    gameplay.movement.position = { x: 2700, y: 600 };
    command({ type: 'interact', payload: {} });
    expect(gameplay.pendingTransition).toBeNull();
    expect(gameplay.toast).toContain('日井古道');
    gameplay.saveData = {
      ...gameplay.saveData,
      quests: { ...gameplay.saveData.quests, q13: { status: 'claimed', counters: { 'sunwell-beetle': 2 } } },
    };
    usePortal(2700, 'sand-sunwell-altar');

    const altarBoss = worldCatalog.maps['sand-sunwell-altar']!.monsters[0]!;
    const entry = worldCatalog.maps['sand-sunwell-altar']!.spawns.find(({ id }) => id === 'entry')!;
    expect(gameplay.movement.position).toEqual({ x: entry.x, y: entry.y });
    expect(Math.abs(altarBoss.x - entry.x)).toBeGreaterThan(
      rulesCatalog.monsters['sunwell-sentinel'].aggroRange + 300,
    );

    const coinsBeforeFight = gameplay.saveData.player.coins;
    defeatSentinel();
    expect(getQuestView(gameplay.saveData, 'q14', catalog).status).toBe('ready');
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'sunwell-oathblade')).toBe(false);
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeFight);
    expect(gameplay.saveData.flags).toEqual(guardianFlags);

    command({ type: 'returnTown', payload: {} });
    expect(gameplay.pendingTransition).toMatchObject({
      mapId: 'sand-sunwell-basin', spawnId: 'right', after: 'travel',
    });
    finishTravel();
    usePortal(100, 'sand-dune-pass');
    usePortal(100, 'sand-glass-shore');

    gameplay.movement.position = { x: 250, y: 600 };
    const coinsBeforeClaim = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q14' } });
    expect(gameplay.saveData.quests.q14?.status).toBe('claimed');
    expect(gameplay.saveData.player.bag.filter(({ itemId }) => itemId === 'sunwell-oathblade')
      .reduce((sum, stack) => sum + stack.quantity, 0)).toBe(1);
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeClaim + 1800);
    expect(gameplay.saveData.flags).toEqual(guardianFlags);

    const coinsAfterClaim = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q14' } });
    expect(gameplay.saveData.player.coins).toBe(coinsAfterClaim);
    expect(gameplay.saveData.player.bag.filter(({ itemId }) => itemId === 'sunwell-oathblade')
      .reduce((sum, stack) => sum + stack.quantity, 0)).toBe(1);

    usePortal(1820, 'sand-dune-pass');
    usePortal(2500, 'sand-sunwell-basin');
    usePortal(2700, 'sand-sunwell-altar');
    const coinsBeforeRematch = gameplay.saveData.player.coins;
    const swordCountBeforeRematch = gameplay.saveData.player.bag
      .filter(({ itemId }) => itemId === 'sunwell-oathblade')
      .reduce((sum, stack) => sum + stack.quantity, 0);
    defeatSentinel();
    expect(gameplay.saveData.quests.q14?.status).toBe('claimed');
    expect(gameplay.saveData.quests.q14?.counters['sunwell-sentinel']).toBe(1);
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeRematch);
    expect(gameplay.saveData.player.bag.filter(({ itemId }) => itemId === 'sunwell-oathblade')
      .reduce((sum, stack) => sum + stack.quantity, 0)).toBe(swordCountBeforeRematch);
    expect(gameplay.saveData.flags).toEqual(guardianFlags);
  });
});