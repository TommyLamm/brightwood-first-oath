import { describe, expect, it } from 'vitest';
import type { CombatActor, CombatState, MapDef } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { stepCombat, tryAttack } from '../src/domain/combat/index.js';

const rng = { next: () => 0.5 };
const source = (): CombatActor => ({ id: 'hero', position: { x: 0, y: 100 }, facing: 1, hp: 100,
  stats: { maxHp: 100, maxMp: 100, attack: 50, defense: 0, critChance: 0 }, faction: 'player',
  body: { width: 20, height: 40 }, knockbackImmune: false, skillRanks: { 'archer-piercing-shot': 1 } });
const target = (id: string, x: number, y = 100): CombatActor => ({ ...source(), id, position: { x, y }, faction: 'enemy' });
const map = (changes: Partial<MapDef> = {}): MapDef => ({ ...worldCatalog.maps.camp!, walls: [], footholds: [], ...changes });
function cast(actor = source(), skillId = 'bow-basic'): CombatState {
  const result = tryAttack({ attacks: [], cooldowns: {} }, { sourceId: actor.id, skillId }, [actor], rulesCatalog, 0, () => 'shot');
  if (!result.ok) throw new Error(result.message);
  return result.value.state;
}

describe('horizontal arrows', () => {
  it('hits the visible snail shell while preserving the smaller locomotion body', () => {
    const hero = { ...source(), projectileOffset: { x: 24, y: -32 } };
    const snail = { ...target('snail',80), body:{width:28,height:24}, projectileHeight:rulesCatalog.monsters.snail!.projectileHeight };
    expect(stepCombat(cast(hero),[hero,snail],rulesCatalog,.4,400,rng,map()).hits[0]?.targetId).toBe('snail');
    expect(snail.body.height).toBe(24);
    expect(stepCombat(cast(hero),[hero,{...snail,projectileHeight:undefined}],rulesCatalog,.4,400,rng,map()).hits).toEqual([]);
  });
  it('uses the locked facing at the measured muzzle and sweeps the body-to-bow gap', () => {
    const hero = { ...source(), projectileOffset: { x: 24, y: -32 } };
    const state = cast(hero);
    hero.facing = -1;
    const born = stepCombat(state, [hero], rulesCatalog, .18, 180, rng, map());
    expect(born.state.projectiles?.[0]?.position).toEqual({ x: 24, y: 68 });
    const wall = map({ walls: [{ x: 14, y: 40, width: 1, height: 60 }] });
    expect(stepCombat(born.state, [hero, target('blocked', 70)], rulesCatalog, .1, 280, rng, wall).hits).toEqual([]);
    expect(stepCombat(born.state, [hero, target('close', 15)], rulesCatalog, .1, 280, rng, map()).hits[0]?.targetId).toBe('close');
  });
  it('emits after windup and hits only after flight, using launch power without mutating input', () => {
    const hero = source();
    const enemy = target('enemy', 100);
    const original = cast(hero);
    let step = stepCombat(original, [hero, enemy], rulesCatalog, 0.18, 180, rng, map());
    expect(step.hits).toEqual([]);
    expect(step.state.projectiles).toHaveLength(1);
    hero.stats.attack = 999;
    step = stepCombat(step.state, [hero, enemy], rulesCatalog, 0.1, 280, rng, map());
    expect(step.hits).toEqual([]);
    step = stepCombat(step.state, [hero, enemy], rulesCatalog, 0.1, 380, rng, map());
    expect(step.hits).toMatchObject([{ targetId: 'enemy', damage: 50 }]);
    expect(step.state.projectiles ?? []).toHaveLength(0);
    expect(original.attacks[0]!.firedShots).toBe(0);
    expect(original.projectiles).toBeUndefined();
  });

  it('sweeps fast arrows through thin targets and sorts walls before enemies behind them', () => {
    const hero = source();
    const enemies = [target('behind', 160), target('before', 40)];
    const terrain = map({ walls: [{ x: 80, y: 50, width: 1, height: 50 }] });
    const step = stepCombat(cast(hero, 'archer-piercing-shot'), [hero, ...enemies], rulesCatalog, 0.8, 800, rng, terrain);
    expect(step.hits.map(({ targetId }) => targetId)).toEqual(['before']);
    expect(step.state.projectiles ?? []).toHaveLength(0);
    const blocked = stepCombat(cast(hero), [hero, target('behind', 90)], rulesCatalog, 0.5, 500, rng, terrain);
    expect(blocked.hits).toEqual([]);
  });

  it('keeps one lifetime budget of three different targets across ticks', () => {
    const hero = source();
    const enemies = [target('a', 50), target('b', 100), target('c', 160), target('d', 220)];
    let step = stepCombat(cast(hero, 'archer-piercing-shot'), [hero, ...enemies], rulesCatalog, 0.36, 360, rng, map());
    expect(step.hits.map(({ targetId }) => targetId)).toEqual(['a']);
    step = stepCombat(step.state, [hero, ...enemies], rulesCatalog, 0.06, 420, rng, map());
    expect(step.hits.map(({ targetId }) => targetId)).toEqual(['b']);
    step = stepCombat(step.state, [hero, ...enemies], rulesCatalog, 0.3, 720, rng, map());
    expect(step.hits.map(({ targetId }) => targetId)).toEqual(['c']);
    expect(step.state.projectiles ?? []).toHaveLength(0);
  });

  it('respects height and sloped surfaces, treats platforms as lines, and shoots left symmetrically', () => {
    const hero = source();
    const high = target('high', 80, 40);
    const low = target('low', 80, 160);
    const floatingPlatform = map({ footholds: [{ id: 'platform', x1: 20, x2: 180, y1: 50, y2: 50, dropThrough: true }] });
    const step = stepCombat(cast(hero), [hero, high, low, target('same-height', 100)], rulesCatalog, 0.5, 500, rng, floatingPlatform);
    expect(step.hits.map(({ targetId }) => targetId)).toEqual(['same-height']);
    const slope = map({ footholds: [{ id: 'slope', x1: 40, x2: 80, y1: 60, y2: 100, dropThrough: false }] });
    expect(stepCombat(cast(hero), [hero, target('blocked', 100)], rulesCatalog, 0.5, 500, rng, slope).hits).toEqual([]);
    const left = { ...hero, facing: -1 as const, position: { x: 200, y: 100 } };
    expect(stepCombat(cast(left), [left, target('left', 80)], rulesCatalog, 0.5, 500, rng, map()).hits[0]?.targetId).toBe('left');
  });

  it('freezes at zero delta, expires out of range, and ignores dead or protected targets', () => {
    const hero = source();
    const born = stepCombat(cast(hero), [hero], rulesCatalog, 0.18, 180, rng, map());
    const frozen = stepCombat(born.state, [hero], rulesCatalog, 0, 180, rng, map());
    expect(frozen.state.projectiles).toEqual(born.state.projectiles);
    expect(stepCombat(frozen.state, [hero, target('too-far', 350)], rulesCatalog, 2, 2180, rng, map()).hits).toEqual([]);
    const dead = { ...target('dead', 50), hp: 0 };
    const immune = { ...target('protected', 70), projectileImmune: true };
    const hit = stepCombat(cast(hero), [hero, dead, immune, target('valid', 100)], rulesCatalog, 0.5, 500, rng, map());
    expect(hit.hits.map(({ targetId }) => targetId)).toEqual(['valid']);
    hero.hp = 0;
    expect(stepCombat(born.state, [hero], rulesCatalog, 0.1, 280, rng, map()).state.projectiles ?? []).toHaveLength(0);
  });

  it('consumes a piercing arrow aim bonus on only its first valid target', () => {
    const hero = source();
    const state = cast(hero, 'archer-piercing-shot');
    state.attacks[0]!.firstHitBonus = 0.2;
    const step = stepCombat(state, [hero, target('a', 50), target('b', 100), target('c', 160)],
      rulesCatalog, 0.8, 800, rng, map());
    expect(step.hits.map(({ damage }) => damage)).toEqual([54, 45, 45]);
  });
});
