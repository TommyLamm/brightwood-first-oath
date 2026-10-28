import { describe, expect, it } from 'vitest';
import { createInitialAppState, createUiSnapshot } from '../../src/app/state.js';
import {
  completeMapTransition,
  startNewGame,
  stepGameplay,
} from '../../src/app/gameplay.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const noInput = { moveX: 0 as const, climbY: 0 as const, jumpPressed: false, downHeld: false };

function enterSanctum(prefix: string) {
  const nextEntityId = createNextEntityId(prefix);
  const started = startNewGame('旅人', catalog, nextEntityId);
  if ('error' in started) throw new Error(started.error);
  started.gameplay.pendingTransition = { mapId: 'ruins-bell-sanctum', spawnId: 'entry', after: 'travel' };
  const entered = completeMapTransition(started.gameplay, catalog, nextEntityId, 1000);
  if (!entered.gameplay) throw new Error('Expected the sanctum transition to complete.');
  return { gameplay: entered.gameplay, nextEntityId };
}

function step(gameplay: ReturnType<typeof enterSanctum>['gameplay'], nextEntityId: () => string, command: 'returnTown' | 'retryBoss', nowMs = 2000) {
  return stepGameplay(gameplay, {
    catalog,
    commands: [{ seq: 1, type: command, payload: {} }],
    input: noInput,
    dtSeconds: 0,
    nowMs,
    random: createSeededRandom(42),
    nextEntityId,
  });
}

describe('Ruins Bell Keeper app integration', () => {
  it('allows returning from its result to camp before town has been visited', () => {
    const { gameplay } = enterSanctum('bell-return');
    gameplay.saveData.visitedMaps = ['camp', 'ruins-bell-sanctum'];

    const inBattle = createUiSnapshot({
      ...createInitialAppState(1, 'bell-return'),
      catalog,
      gameplay,
      screen: 'playing',
    });
    expect(inBattle?.canReturnTown).toBe(false);

    gameplay.bossResult = true;
    const result = createUiSnapshot({
      ...createInitialAppState(1, 'bell-return'),
      catalog,
      gameplay,
      screen: 'result',
    });
    expect(result?.canReturnTown).toBe(true);

    const returned = step(gameplay, createNextEntityId('bell-return-command'), 'returnTown', 3000).gameplay;
    expect(returned?.pendingTransition).toMatchObject({ mapId: 'ruins-tide-camp', spawnId: 'left', after: 'travel' });
  });

  it('retries at entry with a fresh phase-one actor and keeps q18 progress', () => {
    const { gameplay, nextEntityId } = enterSanctum('bell-retry');
    const oldBoss = gameplay.monsters.find(({ monsterId }) => monsterId === 'ruins-bell-keeper');
    if (!oldBoss) throw new Error('Expected the Bell Keeper spawn.');
    gameplay.bossResult = true;
    gameplay.saveData.quests.q18 = { status: 'active', counters: { 'ruins-bell-keeper': 1 } };

    const retryRequest = step(gameplay, nextEntityId, 'retryBoss', 3000);
    expect(retryRequest.gameplay?.pendingTransition).toMatchObject({
      mapId: 'ruins-bell-sanctum', spawnId: 'entry', after: 'retryBoss',
    });
    const restarted = completeMapTransition(retryRequest.gameplay!, catalog, nextEntityId, 3010).gameplay;
    const newBoss = restarted?.monsters.find(({ monsterId }) => monsterId === 'ruins-bell-keeper');

    expect(newBoss?.id).not.toBe(oldBoss.id);
    expect(newBoss).toMatchObject({ hp: rulesCatalog.monsters['ruins-bell-keeper']!.maxHp, phase: 1, mode: 'idle' });
    expect(newBoss?.bellCycle).toMatchObject({ sequenceIndex: 0, transitionUsed: false });
    expect(restarted?.saveData.quests.q18?.counters['ruins-bell-keeper']).toBe(1);
    expect(restarted?.saveData.flags).toEqual(gameplay.saveData.flags);
  });

  it('deep-clones Bell Keeper cycle data and cancels its attack and phase cue on same-tick player death', () => {
    const { gameplay, nextEntityId } = enterSanctum('bell-death');
    const boss = gameplay.monsters.find(({ monsterId }) => monsterId === 'ruins-bell-keeper');
    if (!boss?.bellCycle) throw new Error('Expected a Bell Keeper cycle.');
    gameplay.saveData.player = { ...gameplay.saveData.player, hp: 1 };
    gameplay.movement = {
      ...gameplay.movement,
      position: { x: 1170, y: 600 },
      velocity: { x: 0, y: 0 },
      mode: 'grounded',
    };
    gameplay.monsters = [{ ...boss, hp: 4000, mode: 'idle' }];
    gameplay.telegraphs = [{
      id: 'bell-pending-telegraph', sourceId: boss.id, kind: 'rect',
      rect: { x: 1020, y: 480, width: 180, height: 120 }, resolveAtMs: 1000,
    }];
    gameplay.combat.attacks = [{
      id: 'bell-active-attack', sourceId: boss.id, skillId: 'ruins-bell-slam', startedAtMs: 100,
      facing: -1, origin: { x: 1200, y: 600 }, rank: 1, hitIds: [],
    }];

    const result = stepGameplay(gameplay, {
      catalog,
      commands: [],
      input: noInput,
      dtSeconds: 1 / 60,
      nowMs: 1000,
      random: createSeededRandom(43),
      nextEntityId,
    });
    const stoppedBoss = result.gameplay?.monsters.find(({ monsterId }) => monsterId === 'ruins-bell-keeper');

    expect(result.screen).toBe('dead');
    expect(result.gameplay?.saveData.player.hp).toBe(0);
    expect(result.gameplay?.combat.attacks.some(({ sourceId }) => sourceId === boss.id)).toBe(false);
    expect(result.gameplay?.telegraphs.some(({ sourceId }) => sourceId === boss.id)).toBe(false);
    expect(stoppedBoss).toMatchObject({ mode: 'idle', pendingSkillId: null });
    expect(stoppedBoss?.bellCycle).toMatchObject({ transitionStartedAtMs: null, transitionEndsAtMs: null, transitionUsed: true });
    expect(gameplay.monsters[0]?.bellCycle).not.toBe(stoppedBoss?.bellCycle);
    expect(gameplay.monsters[0]?.bellCycle?.transitionUsed).toBe(false);
  });
});
