import { describe, expect, it } from 'vitest';
import type { CombatActor, MapDef, MonsterSpawn, MonsterState, RandomSource } from '../src/contracts/index.js';
import { rulesCatalog, validateRules } from '../src/content/rules/index.js';
import { applyMonsterHit, createMonster, stepActors } from '../src/domain/actors/index.js';
import { createCombatState, stepCombat, tryAttack } from '../src/domain/combat/index.js';
import { worldCatalog } from '../src/content/world/index.js';

const DT = 1 / 60;
const fixedRandom: RandomSource = { next: () => 0 };

type Encounter = {
  monsterId: 'ruins-string-puppet' | 'ruins-bell-prowler';
  skillId: 'ruins-puppet-slap' | 'ruins-prowler-sweep';
  x: number;
  roamLeft: number;
  roamRight: number;
  reach: number;
  height: number;
  windupMs: number;
  cooldownMs: number;
  multiplier: number;
  expectedCoins: number;
  itemId: 'broken-copper-thread' | 'muted-bell-fragment';
  itemSellPrice: number;
};

const encounters: Encounter[] = [
  {
    monsterId: 'ruins-string-puppet', skillId: 'ruins-puppet-slap', x: 780,
    roamLeft: 720, roamRight: 850, reach: 160, height: 100,
    windupMs: 1000, cooldownMs: 2200, multiplier: 1.1, expectedCoins: 95,
    itemId: 'broken-copper-thread', itemSellPrice: 50,
  },
  {
    monsterId: 'ruins-bell-prowler', skillId: 'ruins-prowler-sweep', x: 2070,
    roamLeft: 1940, roamRight: 2070, reach: 260, height: 30,
    windupMs: 1100, cooldownMs: 2400, multiplier: 1, expectedCoins: 100,
    itemId: 'muted-bell-fragment', itemSellPrice: 55,
  },
];

function makeSpawn(encounter: Encounter): MonsterSpawn {
  return {
    spawnId: `ruins-gallery-test:${encounter.monsterId}`,
    monsterId: encounter.monsterId,
    x: encounter.x,
    y: 600,
    roamLeft: encounter.roamLeft,
    roamRight: encounter.roamRight,
  };
}

function makeMap(spawn: MonsterSpawn): MapDef {
  return { ...worldCatalog.maps['sand-dune-pass']!, monsters: [spawn] };
}

function player(id: string, x: number, y = 600): CombatActor {
  return {
    id,
    position: { x, y },
    facing: 1,
    hp: 100,
    stats: { maxHp: 100, maxMp: 40, attack: 10, defense: 0, critChance: 0 },
    faction: 'player',
    body: { width: 24, height: 44 },
    knockbackImmune: false,
    skillRanks: {},
  };
}

function monsterActor(monster: MonsterState): CombatActor {
  const definition = rulesCatalog.monsters[monster.monsterId]!;
  return {
    id: monster.id,
    position: { ...(monster.attackOrigin ?? monster.movement.position) },
    facing: monster.attackFacing ?? monster.movement.facing,
    hp: monster.hp,
    stats: {
      maxHp: definition.maxHp,
      maxMp: 0,
      attack: definition.attack,
      defense: definition.defense,
      critChance: 0,
    },
    faction: 'enemy',
    body: { width: definition.width, height: definition.height },
    knockbackImmune: false,
    skillRanks: {},
  };
}

function startAttack(encounter: Encounter, nowMs = 1000) {
  const spawn = makeSpawn(encounter);
  const map = makeMap(spawn);
  const monster = createMonster(`actor:${encounter.monsterId}`, spawn, map, rulesCatalog);
  const target = player('gallery-player', encounter.x);
  const step = stepActors([monster], target, map, rulesCatalog, 0, nowMs);
  const prepared = tryAttack(
    createCombatState(),
    step.attackRequests[0]!,
    [monsterActor(step.monsters[0]!), target],
    rulesCatalog,
    nowMs,
    () => `${encounter.monsterId}:attack-1`,
  );
  if (!prepared.ok) throw new Error(`Expected ${encounter.skillId} attack to be accepted.`);
  return { spawn, map, monster, target, step, prepared };
}

describe('Ruins gallery ordinary monsters', () => {
  it('adds the exact approved catalog entries, fixed combat values, and guaranteed saleable materials', () => {
    expect(Object.keys(rulesCatalog.items)).toHaveLength(33);
    expect(Object.keys(rulesCatalog.skills)).toHaveLength(18);
    expect(Object.keys(rulesCatalog.monsters)).toHaveLength(16);
    expect(validateRules(rulesCatalog).ok).toBe(true);

    for (const encounter of encounters) {
      const monster = rulesCatalog.monsters[encounter.monsterId];
      const skill = rulesCatalog.skills[encounter.skillId];
      const item = rulesCatalog.items[encounter.itemId];
      expect(monster).toMatchObject({
        level: 30,
        exp: 0,
        attackWindupMs: encounter.windupMs,
        attackCooldownMs: encounter.cooldownMs,
        respawnMs: 9000,
        coins: encounter.expectedCoins,
        attackRange: encounter.reach,
        drops: [{ itemId: encounter.itemId, chance: 1, min: 1, max: 1 }],
      });
      expect(skill).toMatchObject({
        kind: 'attack',
        requiredJob: 'enemy',
        cooldownMs: encounter.cooldownMs,
        windupMs: encounter.windupMs,
        activeMs: 100,
        recoveryMs: 900,
        reach: encounter.reach,
        height: encounter.height,
        targets: 1,
        multiplierBase: encounter.multiplier,
      });
      expect(item).toMatchObject({ kind: 'material', buyPrice: 0, sellPrice: encounter.itemSellPrice });
    }
  });

  it.each(encounters)('$monsterId locks its direction and one attack hits each target at most once', (encounter) => {
    const { spawn, map, step, prepared, target } = startAttack(encounter);
    const skill = rulesCatalog.skills[encounter.skillId]!;

    expect(step.attackRequests).toEqual([{ sourceId: step.monsters[0]!.id, skillId: encounter.skillId }]);
    expect(step.monsters[0]).toMatchObject({
      mode: 'windup',
      pendingSkillId: encounter.skillId,
      attackFacing: 1,
      attackOrigin: { x: spawn.x, y: spawn.y },
    });
    expect(step.telegraphs).toHaveLength(1);
    expect(step.telegraphs[0]).toMatchObject({
      kind: 'rect',
      rect: { x: spawn.x, y: spawn.y - encounter.height, width: encounter.reach, height: encounter.height },
      resolveAtMs: 1000 + encounter.windupMs,
    });

    const movedBehind = stepActors(step.monsters, player('gallery-player-behind', spawn.x - 40), map, rulesCatalog, 0, 1100);
    expect(movedBehind.monsters[0]?.attackFacing).toBe(1);
    expect(movedBehind.telegraphs[0]?.rect).toEqual(step.telegraphs[0]?.rect);

    const activeStart = 1000 + skill.windupMs;
    const firstActive = stepCombat(prepared.value.state, [monsterActor(step.monsters[0]!), target], rulesCatalog, 0.002, activeStart + 1, fixedRandom);
    expect(firstActive.hits).toHaveLength(1);
    expect(firstActive.hits[0]?.attackId).toBe(`${encounter.monsterId}:attack-1`);
    expect(firstActive.hits[0]?.targetId).toBe(target.id);

    const stillActive = stepCombat(firstActive.state, [monsterActor(step.monsters[0]!), target], rulesCatalog, 0.025, activeStart + 30, fixedRandom);
    expect(stillActive.hits).toEqual([]);

    const beforeCooldown = stepActors(step.monsters, target, map, rulesCatalog, 0, 1000 + encounter.cooldownMs - 1);
    expect(beforeCooldown.attackRequests).toEqual([]);
    const cooldownReady = stepActors(beforeCooldown.monsters, target, map, rulesCatalog, 0, 1000 + encounter.cooldownMs);
    expect(cooldownReady.attackRequests).toEqual([{ sourceId: step.monsters[0]!.id, skillId: encounter.skillId }]);
  });

  it('lets the low sweep hit a grounded player while a jump clears its 30 px rectangle', () => {
    const encounter = encounters[1]!;
    const { step, prepared } = startAttack(encounter);
    const source = monsterActor(step.monsters[0]!);
    const activeAt = 1000 + rulesCatalog.skills[encounter.skillId]!.windupMs;

    const grounded = stepCombat(prepared.value.state, [source, player('grounded-player', encounter.x)], rulesCatalog, 0.002, activeAt + 1, fixedRandom);
    expect(grounded.hits).toHaveLength(1);

    const jumping = stepCombat(prepared.value.state, [source, player('jumping-player', encounter.x, 550)], rulesCatalog, 0.002, activeAt + 1, fixedRandom);
    expect(jumping.hits).toEqual([]);
  });

  it('cancels pending attacks when the monster dies or its map is replaced', () => {
    const encounter = encounters[0]!;
    const { spawn, map, step, prepared, target, monster } = startAttack(encounter);
    const death = applyMonsterHit(step.monsters, {
      attackId: 'player-hit-1',
      sourceId: target.id,
      targetId: monster.id,
      damage: monster.hp,
      knockback: { x: 0, y: 0 },
    }, 1100);
    const afterDeath = stepActors(death, target, map, rulesCatalog, DT, 1200);
    expect(afterDeath.telegraphs).toEqual([]);
    expect(afterDeath.attackRequests).toEqual([]);
    expect(afterDeath.monsters[0]).toMatchObject({ mode: 'dead', pendingSkillId: null, attackOrigin: null });

    const noSourceCombat = stepCombat(prepared.value.state, [target], rulesCatalog, 0.002, 2001, fixedRandom);
    expect(noSourceCombat.hits).toEqual([]);
    expect(noSourceCombat.state.attacks).toEqual([]);

    const otherMap = { ...map, id: 'different-map', monsters: [] };
    const afterTransition = stepActors(step.monsters, target, otherMap, rulesCatalog, DT, 1200);
    expect(afterTransition.monsters).toEqual([]);
    expect(afterTransition.telegraphs).toEqual([]);
    expect(afterTransition.attackRequests).toEqual([]);
    expect(spawn.spawnId).toBe(monster.spawnId);
  });

  it('keeps patrols inside their roam bounds and caps the prowler warning at x=2330', () => {
    for (const encounter of encounters) {
      const spawn = makeSpawn(encounter);
      const map = makeMap(spawn);
      let current = createMonster(`patrol:${encounter.monsterId}`, spawn, map, rulesCatalog);
      const observedX: number[] = [];
      for (let frame = 1; frame <= 600; frame += 1) {
        const result = stepActors([current], player('far-player', 2500), map, rulesCatalog, DT, frame * (DT * 1000));
        current = result.monsters[0]!;
        observedX.push(current.movement.position.x);
      }
      expect(Math.min(...observedX)).toBeGreaterThanOrEqual(spawn.roamLeft - 0.1);
      expect(Math.max(...observedX)).toBeLessThanOrEqual(spawn.roamRight + 0.1);
    }

    const puppet = encounters[0]!;
    const westSpawn = { ...makeSpawn(puppet), x: puppet.roamLeft + 1 };
    const westMap = makeMap(westSpawn);
    const westActor = createMonster('puppet-west-edge', westSpawn, westMap, rulesCatalog);
    const westEdge = stepActors([westActor], player('west-edge-player', puppet.roamLeft), westMap, rulesCatalog, 0, 1000);
    expect(westEdge.monsters[0]?.attackFacing).toBe(-1);
    expect(westEdge.telegraphs[0]?.rect).toEqual({ x: 561, y: 500, width: 160, height: 100 });

    const prowler = encounters[1]!;
    const { step } = startAttack(prowler);
    const rightEdge = step.telegraphs[0]!.rect.x + step.telegraphs[0]!.rect.width;
    expect(rightEdge).toBe(2330);
  });
});
