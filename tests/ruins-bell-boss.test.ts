import { describe, expect, it } from 'vitest';
import type { CombatActor, Hit } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { applyMonsterHit, createMonster, stepActors } from '../src/domain/actors/index.js';
import { createCombatState, stepCombat, tryAttack } from '../src/domain/combat/index.js';

const BELL_ID = 'ruins-bell-keeper';
const DT = 1 / 60;
const BELL_MAP = worldCatalog.maps['ruins-bell-sanctum']!;
const BELL_SPAWN = BELL_MAP.monsters.find(({ monsterId }) => monsterId === BELL_ID)!;
const BELL_RULES = rulesCatalog;

function player(id: string, x: number, y = 600, hp = 100): CombatActor {
  return {
    id,
    position: { x, y },
    facing: 1,
    hp,
    stats: { maxHp: 100, maxMp: 40, attack: 50, defense: 0, critChance: 0 },
    faction: 'player',
    body: { width: 24, height: 44 },
    knockbackImmune: false,
    skillRanks: {},
  };
}

function hit(targetId: string, damage: number): Hit {
  return {
    attackId: 'bell-test-hit',
    sourceId: 'player-test',
    targetId,
    damage,
    critical: false,
    knockback: { x: 120, y: -80 },
  };
}

function createBell(id = 'bell-runtime-1') {
  return createMonster(id, BELL_SPAWN, BELL_MAP, BELL_RULES);
}

function step(monster: ReturnType<typeof createBell>, target: CombatActor, nowMs: number) {
  return stepActors([monster], target, BELL_MAP, BELL_RULES, DT, nowMs);
}

describe('Ruins Bell Keeper', () => {
  it('creates an independent cycle, stays in place, and leaves the west entry safe', () => {
    expect(BELL_RULES.monsters[BELL_ID]).toMatchObject({
      level: 30,
      maxHp: 8000,
      attack: 60,
      defense: 28,
      speed: 38,
      width: 88,
      height: 76,
      aggroRange: 460,
      attackRange: 360,
      attackWindupMs: 900,
      attackCooldownMs: 0,
      respawnMs: 0,
      drops: [],
    });
    expect(BELL_RULES.skills['ruins-bell-slam']).toMatchObject({
      cooldownMs: 0, windupMs: 900, activeMs: 100, recoveryMs: 1000,
      reach: 180, height: 120, multiplierBase: 1.25,
    });
    expect(BELL_RULES.skills['ruins-bell-sweep']).toMatchObject({
      cooldownMs: 0, windupMs: 1200, activeMs: 100, recoveryMs: 1000,
      reach: 360, height: 30, multiplierBase: 1.05,
    });

    const original = createBell();
    expect(original).toMatchObject({
      hp: 8000,
      phase: 1,
      mode: 'idle',
      bellCycle: {
        sequenceIndex: 0,
        nextAttackAtMs: 0,
        transitionStartedAtMs: null,
        transitionEndsAtMs: null,
        transitionUsed: false,
      },
    });

    const safeEntry = step(original, player('safe-entry', 160), 1000);
    expect(safeEntry.attackRequests).toEqual([]);
    expect(safeEntry.monsters[0]?.movement.position).toEqual({ x: 1200, y: 600 });
    expect(safeEntry.monsters[0]?.movement.velocity).toEqual({ x: 0, y: 0 });

    const engaged = step(original, player('close-target', 1370), 1000);
    expect(engaged.attackRequests).toEqual([{ sourceId: original.id, skillId: 'ruins-bell-slam' }]);
    expect(engaged.monsters[0]?.bellCycle).not.toBe(original.bellCycle);
    expect(original.bellCycle?.sequenceIndex).toBe(0);
    expect(engaged.monsters[0]?.movement.position).toEqual({ x: 1200, y: 600 });

    const immune = applyMonsterHit([original], hit(original.id, 1), 1500)[0]!;
    expect(immune.movement.velocity).toEqual({ x: 0, y: 0 });
  });

  it('moves into attack range without crossing either roam edge', () => {
    const nearEdge = createBell('bell-roam-edge');
    nearEdge.movement = {
      ...nearEdge.movement,
      position: { x: BELL_SPAWN.roamLeft + 10, y: BELL_SPAWN.y },
    };
    let current = nearEdge;
    const outsideTarget = player('outside-left', BELL_SPAWN.roamLeft - 300);
    let requests: string[] = [];
    for (let index = 1; index <= 90; index += 1) {
      const result = step(current, outsideTarget, index * DT * 1000);
      current = result.monsters[0]!;
      requests.push(...result.attackRequests.map(({ skillId }) => skillId));
    }
    expect(current.movement.position.x).toBeGreaterThanOrEqual(BELL_SPAWN.roamLeft);
    expect(current.movement.position.x).toBeLessThanOrEqual(BELL_SPAWN.roamRight);
    expect(requests).toEqual([]);

    current = createBell('bell-approach');
    const closerTarget = player('approach-target', 780);
    for (let index = 1; index <= 320 && current.mode !== 'windup'; index += 1) {
      current = step(current, closerTarget, index * DT * 1000).monsters[0]!;
    }
    expect(current.movement.position.x).toBeLessThan(1200);
    expect(current.movement.position.x).toBeGreaterThanOrEqual(BELL_SPAWN.roamLeft);
    expect(current.mode).toBe('windup');
    expect(current.pendingSkillId).toBe('ruins-bell-slam');
  });

  it('locks full telegraphs and cycles slam then sweep after full recovery plus 600 ms', () => {
    const initial = createBell();
    const first = step(initial, player('right', 1370), 1000);
    expect(first.attackRequests[0]?.skillId).toBe('ruins-bell-slam');
    expect(first.telegraphs[0]).toMatchObject({
      rect: { x: 1200, y: 480, width: 180, height: 120 },
      resolveAtMs: 1900,
    });
    expect(first.monsters[0]).toMatchObject({
      mode: 'windup',
      attackOrigin: { x: 1200, y: 600 },
      attackFacing: 1,
      bellCycle: { sequenceIndex: 1, nextAttackAtMs: 3600 },
    });

    const locked = step(first.monsters[0]!, player('moved-left', 850), 1500);
    expect(locked.telegraphs[0]?.rect).toEqual({ x: 1200, y: 480, width: 180, height: 120 });
    const active = step(locked.monsters[0]!, player('moved-left', 850), 1900);
    expect(active.telegraphs).toEqual([]);
    expect(active.monsters[0]?.mode).toBe('recovery');

    const beforeGapEnds = step(active.monsters[0]!, player('moved-left', 850), 3599);
    expect(beforeGapEnds.attackRequests).toEqual([]);
    const sweep = step(beforeGapEnds.monsters[0]!, player('moved-left', 850), 3600);
    expect(sweep.attackRequests[0]?.skillId).toBe('ruins-bell-sweep');
    expect(sweep.telegraphs[0]).toMatchObject({
      rect: { x: 840, y: 570, width: 360, height: 30 },
      resolveAtMs: 4800,
    });
  });

  it('waits for the current attack to recover, transitions for 1200 ms, then runs the three-move phase-two cycle', () => {
    const first = step(createBell(), player('target', 1370), 1000);
    const thresholdHit = applyMonsterHit([first.monsters[0]!], hit(first.monsters[0]!.id, 4000), 1500)[0]!;
    expect(thresholdHit).toMatchObject({ mode: 'windup', phase: 1, bellCycle: { transitionUsed: false } });

    const windupEnd = step(thresholdHit, player('target', 1370), 1900);
    expect(windupEnd.monsters[0]?.mode).toBe('recovery');
    expect(windupEnd.telegraphs).toEqual([]);
    const recovery = step(windupEnd.monsters[0]!, player('target', 1370), 2999);
    expect(recovery.monsters[0]?.mode).toBe('recovery');
    const transition = step(recovery.monsters[0]!, player('target', 1370), 3000);
    expect(transition.monsters[0]).toMatchObject({
      mode: 'phase-transition',
      phase: 1,
      bellCycle: { transitionStartedAtMs: 3000, transitionEndsAtMs: 4200, transitionUsed: true },
    });
    expect(transition.attackRequests).toEqual([]);
    expect(transition.telegraphs).toEqual([]);

    const hurtDuringTransition = applyMonsterHit(
      transition.monsters,
      hit(transition.monsters[0]!.id, 1),
      3500,
    );
    expect(hurtDuringTransition[0]?.hp).toBe(3999);
    const waiting = step(hurtDuringTransition[0]!, player('target', 1370), 4199);
    expect(waiting.monsters[0]?.phase).toBe(1);
    expect(waiting.attackRequests).toEqual([]);

    const firstPhaseTwo = step(waiting.monsters[0]!, player('target', 1370), 4200);
    const secondPhaseTwo = step(firstPhaseTwo.monsters[0]!, player('target', 1370), 6800);
    const thirdPhaseTwo = step(secondPhaseTwo.monsters[0]!, player('target', 1370), 9100);
    const cycleBoundary = step(thirdPhaseTwo.monsters[0]!, player('target', 1370), 11700);
    expect([
      firstPhaseTwo.attackRequests[0]?.skillId,
      secondPhaseTwo.attackRequests[0]?.skillId,
      thirdPhaseTwo.attackRequests[0]?.skillId,
      cycleBoundary.attackRequests[0]?.skillId,
    ]).toEqual([
      'ruins-bell-sweep',
      'ruins-bell-slam',
      'ruins-bell-sweep',
      'ruins-bell-sweep',
    ]);
    expect(firstPhaseTwo.monsters[0]?.phase).toBe(2);
    expect(firstPhaseTwo.monsters[0]?.mode).toBe('windup');
    expect(cycleBoundary.monsters[0]?.bellCycle?.sequenceIndex).toBe(1);
  });

  it('cancels transition and telegraphs on death or player death, and a retry starts fresh', () => {
    const belowThreshold = applyMonsterHit([createBell()], hit('bell-runtime-1', 4000), 1000);
    const transitioning = step(belowThreshold[0]!, player('target', 1370), 1000);
    expect(transitioning.monsters[0]?.mode).toBe('phase-transition');

    const killed = applyMonsterHit(transitioning.monsters, hit('bell-runtime-1', 4000), 1100);
    const death = step(killed[0]!, player('target', 1370), 1200);
    expect(death.deaths).toEqual(['bell-runtime-1']);
    expect(death.attackRequests).toEqual([]);
    expect(death.telegraphs).toEqual([]);
    expect(death.monsters[0]?.bellCycle).toMatchObject({
      transitionStartedAtMs: null,
      transitionEndsAtMs: null,
      transitionUsed: true,
    });

    const attack = step(createBell('bell-runtime-player-death'), player('target', 1370), 1000);
    const playerDead = step(attack.monsters[0]!, player('dead-player', 1370, 600, 0), 1100);
    expect(playerDead.attackRequests).toEqual([]);
    expect(playerDead.telegraphs).toEqual([]);
    expect(playerDead.monsters[0]).toMatchObject({
      mode: 'idle',
      pendingSkillId: null,
      bellCycle: { transitionStartedAtMs: null, transitionEndsAtMs: null, transitionUsed: true },
    });

    expect(createBell('bell-runtime-retry')).toMatchObject({
      id: 'bell-runtime-retry',
      hp: 8000,
      mode: 'idle',
      phase: 1,
      bellCycle: {
        sequenceIndex: 0,
        nextAttackAtMs: 0,
        transitionStartedAtMs: null,
        transitionEndsAtMs: null,
        transitionUsed: false,
      },
    });
  });

  it('resolves a bell attack in its active window and records only one hit per attack id', () => {
    const source: CombatActor = {
      id: BELL_ID,
      position: { x: 1200, y: 600 },
      facing: 1,
      hp: 8000,
      stats: { maxHp: 8000, maxMp: 0, attack: 60, defense: 28, critChance: 0 },
      faction: 'enemy',
      body: { width: 88, height: 76 },
      knockbackImmune: true,
      skillRanks: {},
    };
    const target = player('combat-target', 1400);
    const prepared = tryAttack(
      createCombatState(),
      { sourceId: source.id, skillId: 'ruins-bell-sweep' },
      [source],
      BELL_RULES,
      1000,
      () => 'bell-attack-1',
    );
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;

    const firstActiveTick = stepCombat(prepared.value.state, [source, target], BELL_RULES, 0.05, 2250, { next: () => 0 });
    expect(firstActiveTick.hits.map(({ targetId }) => targetId)).toEqual([target.id]);
    expect(firstActiveTick.state.attacks[0]?.hitIds).toEqual([target.id]);
    const repeatedActiveTick = stepCombat(firstActiveTick.state, [source, target], BELL_RULES, 0.04, 2290, { next: () => 0 });
    expect(repeatedActiveTick.hits).toEqual([]);
  });
});
