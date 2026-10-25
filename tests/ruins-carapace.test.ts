import { describe, expect, it } from 'vitest';
import type { CombatActor, RandomSource } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createCombatState, stepCombat, tryAttack } from '../src/domain/combat/index.js';
import { createMonster, stepActors } from '../src/domain/actors/index.js';
import { pickAnimationFrame } from '../src/render/animation.js';
import { animationConformsToUse } from '../src/render/animation-contract.js';

const DT = 1 / 60;

function player(id: string, x: number): CombatActor {
  return {
    id,
    position: { x, y: 600 },
    facing: 1,
    hp: 100,
    stats: { maxHp: 100, maxMp: 40, attack: 10, defense: 0, critChance: 0 },
    faction: 'player',
    body: { width: 24, height: 44 },
    knockbackImmune: false,
    skillRanks: {},
  };
}

function makeRuinsTestMap() {
  const sourceMap = worldCatalog.maps['sand-glass-shore'];
  const spawn = {
    spawnId: 'ruins-test:moss-carapace',
    monsterId: 'ruins-moss-carapace',
    x: 850,
    y: 600,
    roamLeft: 800,
    roamRight: 1100,
  };
  return { map: { ...sourceMap, monsters: [spawn] }, spawn };
}

function fixedRandom(value = 0): RandomSource {
  return { next: () => value };
}

describe('Ruins moss carapace', () => {
  it('uses its 550 ms locked bite telegraph and cannot restart before 1400 ms', () => {
    const { map, spawn } = makeRuinsTestMap();
    const monster = createMonster('ruins-carapace-test', spawn, map, rulesCatalog);
    const first = stepActors([monster], player('player-right', 900), map, rulesCatalog, DT, 1_000);

    expect(first.attackRequests).toEqual([{
      sourceId: monster.id,
      skillId: 'ruins-carapace-bite',
    }]);
    expect(first.monsters[0]).toMatchObject({
      mode: 'windup',
      pendingSkillId: 'ruins-carapace-bite',
      attackFacing: 1,
      attackOrigin: { x: spawn.x, y: spawn.y },
    });
    expect(first.telegraphs[0]).toMatchObject({
      sourceId: monster.id,
      rect: { x: spawn.x, y: spawn.y - 70, width: 60, height: 70 },
      resolveAtMs: 1_550,
    });

    const playerMovedBehind = stepActors(first.monsters, player('player-left', 800), map, rulesCatalog, DT, 1_034);
    expect(playerMovedBehind.attackRequests).toEqual([]);
    expect(playerMovedBehind.monsters[0]?.attackFacing).toBe(1);
    expect(playerMovedBehind.telegraphs[0]?.rect).toEqual(first.telegraphs[0]?.rect);

    const beforeReady = stepActors(first.monsters, player('player-right', 900), map, rulesCatalog, 0, 2_399);
    expect(beforeReady.attackRequests).toEqual([]);
    expect(beforeReady.monsters[0]?.mode).toBe('recovery');
    const exactlyReady = stepActors(beforeReady.monsters, player('player-right', 900), map, rulesCatalog, 0, 2_400);
    expect(exactlyReady.attackRequests).toEqual([{
      sourceId: monster.id,
      skillId: 'ruins-carapace-bite',
    }]);
  });

  it('hits once during the 80 ms active window', () => {
    const skill = rulesCatalog.skills['ruins-carapace-bite'];
    const attacker: CombatActor = {
      id: 'carapace-attacker',
      position: { x: 850, y: 600 },
      facing: 1,
      hp: 1_100,
      stats: { maxHp: 1_100, maxMp: 0, attack: 48, defense: 20, critChance: 0 },
      faction: 'enemy',
      body: { width: 56, height: 38 },
      knockbackImmune: false,
      skillRanks: {},
    };
    const target = player('bite-target', 900);
    const prepared = tryAttack(
      createCombatState(),
      { sourceId: attacker.id, skillId: skill.id },
      [attacker],
      rulesCatalog,
      1_000,
      () => 'carapace-bite-1',
    );
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;

    const beforeActive = stepCombat(prepared.value.state, [attacker, target], rulesCatalog, 0.017, 1_549, fixedRandom());
    expect(beforeActive.hits).toEqual([]);
    const firstActiveTick = stepCombat(beforeActive.state, [attacker, target], rulesCatalog, 0.002, 1_551, fixedRandom());
    expect(firstActiveTick.hits).toHaveLength(1);
    expect(firstActiveTick.hits[0]?.targetId).toBe(target.id);
    expect(firstActiveTick.state.attacks[0]?.hitIds).toEqual([target.id]);

    const sameActiveWindow = stepCombat(firstActiveTick.state, [attacker, target], rulesCatalog, 0.03, 1_581, fixedRandom());
    expect(sameActiveWindow.hits).toEqual([]);
  });

  it('maps attack animation frames to windup, hit, and recovery durations', () => {
    const skill = rulesCatalog.skills['ruins-carapace-bite'];
    const attackAnimation = {
      frames: [12, 13, 14, 15],
      frameMs: [275, 275, 80, 770],
      loop: false,
    };
    const startedAtMs = 1_000;

    expect(attackAnimation.frameMs.reduce((sum, frameMs) => sum + frameMs, 0))
      .toBe(skill.windupMs + skill.activeMs + skill.recoveryMs);
    expect(animationConformsToUse('actor:ruins-moss-carapace', 'ruins-moss-carapace:attack', attackAnimation)).toBe(true);
    expect(animationConformsToUse('actor:ruins-moss-carapace', 'ruins-moss-carapace:attack', {
      ...attackAnimation,
      frameMs: [350, 350, 350, 350],
    })).toBe(false);
    expect(pickAnimationFrame(attackAnimation, startedAtMs + skill.windupMs - 1, startedAtMs)).toBe(13);
    expect(pickAnimationFrame(attackAnimation, startedAtMs + skill.windupMs, startedAtMs)).toBe(14);
    expect(pickAnimationFrame(attackAnimation, startedAtMs + skill.windupMs + skill.activeMs, startedAtMs)).toBe(15);
  });
});
