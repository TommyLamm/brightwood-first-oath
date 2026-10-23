import { describe, expect, it } from 'vitest';
import type { CombatActor, Hit, MonsterState } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { applyMonsterHit, createMonster, stepActors } from '../src/domain/actors/index.js';

const DT = 1 / 60;
const DT_MS = DT * 1000;

function player(id: string, x: number, y = 600, hp = 100): CombatActor {
  return {
    id,
    position: { x, y },
    facing: 1,
    hp,
    stats: { maxHp: 100, maxMp: 40, attack: 10, defense: 0, critChance: 0 },
    faction: 'player',
    body: { width: 24, height: 44 },
    knockbackImmune: false,
    skillRanks: {},
  };
}

function hit(targetId: string, damage: number, knockback = { x: 120, y: -80 }): Hit {
  return { attackId: 'attack-1', sourceId: 'player-1', targetId, damage, knockback };
}

function advance(
  monster: MonsterState,
  playerActor: CombatActor,
  map: (typeof worldCatalog.maps)[string],
  count: number,
  startMs = 0,
): { monster: MonsterState; requests: string[]; steps: ReturnType<typeof stepActors>[] } {
  let current = monster;
  const requests: string[] = [];
  const steps: ReturnType<typeof stepActors>[] = [];
  for (let index = 1; index <= count; index += 1) {
    const step = stepActors([current], playerActor, map, rulesCatalog, DT, startMs + index * DT_MS);
    current = step.monsters[0] ?? current;
    requests.push(...step.attackRequests.map((request) => request.skillId));
    steps.push(step);
  }
  return { monster: current, requests, steps };
}

describe('actor domain', () => {
  it('creates a monster from the map placement and patrols back and forth within its roam bounds', () => {
    const map = worldCatalog.maps['forest-edge'];
    const spawn = map.monsters[0]!;
    const monster = createMonster('snail-runtime-1', spawn, map, rulesCatalog);

    expect(monster).toMatchObject({
      id: 'snail-runtime-1',
      monsterId: 'snail',
      spawnId: spawn.spawnId,
      hp: rulesCatalog.monsters.snail!.maxHp,
      mode: 'idle',
      phase: 1,
      deadAtMs: null,
    });
    expect(monster.movement.position).toEqual({ x: spawn.x, y: spawn.y });

    const patrol = advance(monster, player('player-far', 100), map, 1300);
    const xs = patrol.steps.map((step) => step.monsters[0]!.movement.position.x);
    expect(patrol.monster.mode).toBe('patrol');
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(spawn.roamLeft - 0.1);
    expect(Math.max(...xs)).toBeLessThanOrEqual(spawn.roamRight + 0.1);
    expect(Math.min(...xs)).toBeLessThan(spawn.x - 100);
    expect(Math.max(...xs)).toBeGreaterThan(spawn.x + 100);
  });

  it('starts one melee request at windup start and holds a matching telegraph through windup', () => {
    const map = worldCatalog.maps['forest-edge'];
    const spawn = map.monsters[0]!;
    const original = createMonster('snail-attacker', spawn, map, rulesCatalog);
    const target = player('player-near', spawn.x + 35);
    const first = stepActors([original], target, map, rulesCatalog, DT, DT_MS);

    expect(first.attackRequests).toEqual([{ sourceId: original.id, skillId: 'enemy-melee' }]);
    expect(first.monsters[0]).toMatchObject({ mode: 'windup', pendingSkillId: 'enemy-melee' });
    expect(first.telegraphs[0]).toMatchObject({
      sourceId: original.id,
      kind: 'rect',
      rect: { x: spawn.x, y: spawn.y - 70, width: 55, height: 70 },
      resolveAtMs: DT_MS + 350,
    });

    const windup = advance(first.monsters[0]!, target, map, 70, DT_MS);
    expect(windup.requests).toEqual([]);
    expect(windup.monster.mode).toBe('recovery');
    expect(original.mode).toBe('idle');
    expect(original.movement.position).toEqual({ x: spawn.x, y: spawn.y });
  });

  it('uses T02 foothold movement and turns at a blocking wall instead of crossing it', () => {
    const sourceMap = worldCatalog.maps['forest-edge'];
    const spawn = sourceMap.monsters[0]!;
    const wall = { x: spawn.x + 50, y: 550, width: 20, height: 100 };
    const map = { ...sourceMap, walls: [wall] };
    const monster = createMonster('snail-wall', spawn, map, rulesCatalog);
    const patrol = advance(monster, player('player-far', 100), map, 180);
    const positions = patrol.steps.map((step) => step.monsters[0]!.movement.position.x);
    const wallLimit = wall.x - rulesCatalog.monsters.snail!.width / 2;

    expect(Math.max(...positions)).toBeGreaterThan(spawn.x + 20);
    expect(Math.max(...positions)).toBeLessThanOrEqual(wallLimit + 0.1);
    expect(patrol.steps.some((step) => step.monsters[0]!.movement.position.x >= wallLimit - 0.1
      && step.monsters[0]!.movement.facing === -1)).toBe(true);
  });

  it('reports death once and emits a one-shot respawn request for the old entity id', () => {
    const map = worldCatalog.maps['forest-edge'];
    const spawn = map.monsters[0]!;
    const original = createMonster('snail-dead', spawn, map, rulesCatalog);
    const killed = applyMonsterHit([original], hit(original.id, original.hp), 100);
    expect(killed[0]).toMatchObject({ hp: 0, mode: 'dead', deadAtMs: 100, deathReported: false });
    expect(original.hp).toBe(rulesCatalog.monsters.snail!.maxHp);

    const first = stepActors(killed, player('player-far', 100), map, rulesCatalog, DT, 100 + DT_MS);
    expect(first.deaths).toEqual([original.id]);
    expect(first.respawnRequests).toEqual([]);
    expect(first.monsters[0]!.deathReported).toBe(true);

    const second = stepActors(first.monsters, player('player-far', 100), map, rulesCatalog, DT, 200);
    expect(second.deaths).toEqual([]);
    expect(second.respawnRequests).toEqual([]);

    const due = stepActors(second.monsters, player('player-far', 100), map, rulesCatalog, DT, 8100);
    expect(due.respawnRequests).toEqual([original.id]);
    expect(due.monsters).toEqual([]);
    const consumed = stepActors(due.monsters, player('player-far', 100), map, rulesCatalog, DT, 8117);
    expect(consumed.respawnRequests).toEqual([]);
  });

  it('alternates guardian attacks, telegraphs the low wave, transitions phase once, and creates a clean retry actor', () => {
    const map = worldCatalog.maps['guardian-arena'];
    const spawn = map.monsters[0]!;
    const initial = createMonster('guardian-run-1', spawn, map, rulesCatalog);
    const target = player('player-boss', 1120);
    const first = stepActors([initial], target, map, rulesCatalog, DT, DT_MS);
    expect(first.attackRequests).toEqual([{ sourceId: initial.id, skillId: 'guardian-slam' }]);
    expect(first.telegraphs[0]).toMatchObject({
      rect: { x: spawn.x, y: spawn.y - 100, width: 180, height: 100 },
      resolveAtMs: DT_MS + 900,
    });

    const sequence = advance(first.monsters[0]!, target, map, 270, DT_MS);
    const waveIndex = sequence.steps.findIndex((step) => step.attackRequests[0]?.skillId === 'guardian-wave');
    expect(sequence.requests).toEqual(['guardian-wave']);
    expect(waveIndex).toBeGreaterThanOrEqual(0);
    expect(sequence.steps[waveIndex]!.telegraphs[0]).toMatchObject({
      rect: { width: 420, height: 50 },
    });

    const bossAfterHit = applyMonsterHit(
      [sequence.monster],
      hit(sequence.monster.id, 3000),
      5000,
    )[0]!;
    expect(bossAfterHit.hp).toBe(3000);
    expect(bossAfterHit.movement.velocity).toEqual(sequence.monster.movement.velocity);
    const phaseTwo = stepActors([bossAfterHit], player('player-outside', 160), map, rulesCatalog, DT, 5017);
    expect(phaseTwo.monsters[0]!.phase).toBe(2);
    const stillPhaseTwo = stepActors(phaseTwo.monsters, player('player-outside', 160), map, rulesCatalog, DT, 5034);
    expect(stillPhaseTwo.monsters[0]!.phase).toBe(2);

    const retry = createMonster('guardian-run-2', spawn, map, rulesCatalog);
    expect(retry).toMatchObject({ id: 'guardian-run-2', hp: 6000, phase: 1, mode: 'idle' });
    expect(retry.pendingSkillId).toBeNull();
    expect(retry.attackOrigin).toBeNull();
    expect(retry.deathReported).toBe(false);
  });

  it('makes the guardian retaliate against a player hitting it from outside its roam bounds', () => {
    const map = worldCatalog.maps['guardian-arena'];
    const spawn = map.monsters[0]!;
    const guardian = createMonster('guardian-edge', spawn, map, rulesCatalog);
    guardian.movement = { ...guardian.movement, position: { x: spawn.roamLeft, y: 600 } };
    // Just past roamLeft: close enough for the player's sweep (reach 110) to land.
    const result = advance(guardian, player('player-1', spawn.roamLeft - 90), map, 240, 3000);
    expect(result.requests.length).toBeGreaterThan(0);

    const safe = createMonster('guardian-entry', spawn, map, rulesCatalog);
    const atEntry = advance(safe, player('player-1', 160), map, 240, 3000);
    expect(atEntry.requests).toEqual([]);
  });

  it('applies normal monster knockback but keeps the guardian immune and does not respawn it', () => {
    const field = worldCatalog.maps['forest-edge'];
    const snail = createMonster('snail-hit', field.monsters[0]!, field, rulesCatalog);
    const knocked = applyMonsterHit([snail], hit(snail.id, 1), 400)[0]!;
    expect(knocked.movement.velocity).toEqual({ x: 120, y: -80 });
    expect(knocked.movement.knockbackUntilMs).toBe(580);

    const arena = worldCatalog.maps['guardian-arena'];
    const guardian = createMonster('guardian-hit', arena.monsters[0]!, arena, rulesCatalog);
    const immune = applyMonsterHit([guardian], hit(guardian.id, 1), 400)[0]!;
    expect(immune.hp).toBe(guardian.hp - 1);
    expect(immune.movement.velocity).toEqual({ x: 0, y: 0 });

    const killed = applyMonsterHit([guardian], hit(guardian.id, guardian.hp), 500);
    const deathStep = stepActors(killed, player('player-outside', 160), arena, rulesCatalog, DT, 517);
    expect(deathStep.deaths).toEqual([guardian.id]);
    expect(deathStep.respawnRequests).toEqual([]);
  });

  it('locks the frost crab telegraph and bounds its charge by roam edges and walls', () => {
    const sourceMap = worldCatalog.maps['frost-pine-pass'];
    const spawn = sourceMap.monsters.find((entry) => entry.monsterId === 'frost-crab')!;
    const crab = createMonster('frost-crab-charge-test', spawn, sourceMap, rulesCatalog);
    const first = stepActors([crab], player('crab-target', 770), sourceMap, rulesCatalog, DT, 1_000);

    expect(first.attackRequests).toEqual([{
      sourceId: crab.id,
      skillId: 'frost-crab-charge',
      reachOverride: 110,
    }]);
    expect(first.telegraphs[0]?.rect).toEqual({ x: 680, y: 536, width: 110, height: 64 });
    expect(first.monsters[0]).toMatchObject({
      mode: 'windup', attackFacing: 1, attackReach: 110, attackOrigin: { x: 680, y: 600 },
    });

    const windup = stepActors(first.monsters, player('crab-target-returned', 600), sourceMap, rulesCatalog, DT, 1_500);
    expect(windup.monsters[0]).toMatchObject({ mode: 'windup', attackFacing: 1 });
    expect(windup.telegraphs[0]?.rect).toEqual(first.telegraphs[0]?.rect);

    const dashStart = stepActors(windup.monsters, player('crab-target-returned', 600), sourceMap, rulesCatalog, DT, 1_750);
    expect(dashStart.monsters[0]).toMatchObject({ mode: 'dash', movement: { position: { x: 680, y: 600 }, facing: 1 } });
    const dashMiddle = stepActors(dashStart.monsters, player('crab-target-returned', 600), sourceMap, rulesCatalog, DT, 1_875);
    expect(dashMiddle.monsters[0]).toMatchObject({ mode: 'dash', movement: { position: { x: 735, y: 600 }, facing: 1 } });
    const dashEnd = stepActors(dashMiddle.monsters, player('crab-target-returned', 600), sourceMap, rulesCatalog, DT, 2_000);
    expect(dashEnd.monsters[0]).toMatchObject({ mode: 'recovery', movement: { position: { x: 790, y: 600 }, facing: 1 } });

    const wallMap = { ...sourceMap, walls: [{ x: 720, y: 550, width: 20, height: 100 }] };
    const wallSpawn = wallMap.monsters.find((entry) => entry.monsterId === 'frost-crab')!;
    const wallCrab = createMonster('frost-crab-wall-test', wallSpawn, wallMap, rulesCatalog);
    const wallStart = stepActors([wallCrab], player('crab-target-wall', 700), wallMap, rulesCatalog, DT, 1_000);
    expect(wallStart.attackRequests[0]?.reachOverride).toBe(12);
    const wallDashStart = stepActors(wallStart.monsters, player('crab-target-wall', 700), wallMap, rulesCatalog, DT, 1_750);
    const wallDashEnd = stepActors(wallDashStart.monsters, player('crab-target-wall', 700), wallMap, rulesCatalog, DT, 2_000);
    expect(wallDashEnd.monsters[0]?.movement.position.x).toBe(692);
  });

});
