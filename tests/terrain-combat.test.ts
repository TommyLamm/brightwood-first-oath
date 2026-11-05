import { describe, expect, it } from 'vitest';
import type { CombatActor, InputFrame, MapDef, MovementState } from '../src/contracts/index.js';
import { rulesCatalog as rules } from '../src/content/rules/index.js';
import { maps, validateWorld, worldCatalog } from '../src/content/world/index.js';
import { createMonster, stepActors } from '../src/domain/actors/index.js';
import { createCombatState, stepCombat, tryAttack } from '../src/domain/combat/index.js';
import { createMovement, stepMovement } from '../src/domain/movement/index.js';

const DT = 1 / 60;
const NEUTRAL: InputFrame = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };
const ROUTES = ['forest-edge', 'mushroom-wood', 'red-ridge', 'mine-gate'] as const;
const TACTICAL_MAPS = [...ROUTES, 'guardian-arena'];

function hero(x: number, y = 600): CombatActor {
  return {
    id: 'hero', position: { x, y }, facing: -1, hp: 100, faction: 'player',
    body: { width: rules.movement.width, height: rules.movement.height },
    stats: { maxHp: 100, maxMp: 40, attack: 30, defense: 0, critChance: 0 },
    skillRanks: {}, knockbackImmune: false,
  };
}

function enemy(monsterId: string, x: number, y = 600): CombatActor {
  const def = rules.monsters[monsterId]!;
  return {
    id: 'enemy', position: { x, y }, facing: 1, hp: def.maxHp, faction: 'enemy',
    body: { width: def.width, height: def.height },
    stats: { maxHp: def.maxHp, maxMp: 0, attack: def.attack, defense: def.defense, critChance: 0 },
    skillRanks: {}, knockbackImmune: monsterId === 'guardian',
  };
}

function hits(skillId: string, source: CombatActor, target: CombatActor) {
  const attack = tryAttack(createCombatState(), { sourceId: source.id, skillId }, [source, target], rules, 0, () => 'attack');
  if (!attack.ok) throw new Error(attack.message);
  return stepCombat(attack.value.state, [source, target], rules, DT,
    rules.skills[skillId]!.windupMs + 1, { next: () => 0.5 }).hits;
}

function grounded(map: MapDef, footholdId: string, x: number): MovementState {
  const foothold = map.footholds.find(({ id }) => id === footholdId)!;
  return { ...createMovement({ x, y: foothold.y1 }), mode: 'grounded', footholdId };
}

describe('terrain combat routes', () => {
  it('validates upper spawns and rejects floating actors or unsupported patrol edges', () => {
    expect(validateWorld(worldCatalog, rules).ok).toBe(true);
    const floating = structuredClone(worldCatalog);
    floating.maps['forest-edge']!.monsters[1]!.y -= 1;
    expect(validateWorld(floating, rules).ok).toBe(false);
    const unsafePatrol = structuredClone(worldCatalog);
    const guard = unsafePatrol.maps['forest-edge']!.monsters[1]!;
    guard.roamRight = 1070;
    expect(validateWorld(unsafePatrol, rules)).toMatchObject({ ok: false, message: expect.stringContaining('Upper patrol') });
  });

  it('keeps upper guards on their ledges while patrolling and lets them attack on the same level', () => {
    let count = 0;
    for (const mapId of ROUTES) {
      const map = maps[mapId]!;
      for (const spawn of map.monsters.filter(({ y }) => y < 600)) {
        count += 1;
        let guard = createMonster('guard', spawn, map, rules);
        for (let tick = 1; tick <= 360; tick += 1) {
          guard = stepActors([guard], hero(100), map, rules, DT, tick * DT * 1000).monsters[0]!;
          expect(guard.movement.position.y).toBe(spawn.y);
          expect(guard.movement.position.x).toBeGreaterThanOrEqual(spawn.roamLeft - 0.01);
          expect(guard.movement.position.x).toBeLessThanOrEqual(spawn.roamRight + 0.01);
        }
        const fresh = createMonster('guard', spawn, map, rules);
        const engage = stepActors([fresh], hero(spawn.x + 25, spawn.y), map, rules, DT, 10_000);
        expect(engage.attackRequests).toEqual([{ sourceId: 'guard', skillId: 'enemy-melee' }]);
        expect(hits('enemy-melee', enemy(spawn.monsterId, spawn.x, spawn.y), hero(spawn.x + 25, spawn.y))).toHaveLength(1);
      }
    }
    expect(count).toBeGreaterThan(0);
  });

  it('gives every tactical platform a full climb route and a working drop back to ground', () => {
    for (const mapId of TACTICAL_MAPS) {
      const map = maps[mapId]!;
      for (const platform of map.footholds.filter(({ dropThrough }) => dropThrough)) {
        const ladder = map.ladders.find(({ x, topY, bottomY }) =>
          x > platform.x1 && x < platform.x2 && topY === platform.y1 && bottomY === 600);
        expect(ladder, platform.id).toBeDefined();
        let state = grounded(map, `${mapId}:ground`, ladder!.x);
        for (let tick = 1; tick <= 130; tick += 1) {
          state = stepMovement(state, { ...NEUTRAL, climbY: -1 }, map, rules.movement, DT, tick * DT * 1000);
        }
        expect(state.mode, platform.id).toBe('grounded');
        expect(state.footholdId).toBe(platform.id);
        state = stepMovement(state, { ...NEUTRAL, downHeld: true, jumpPressed: true }, map, rules.movement, DT, 3000);
        for (let tick = 1; tick <= 60; tick += 1) {
          state = stepMovement(state, NEUTRAL, map, rules.movement, DT, 3000 + tick * DT * 1000);
        }
        expect(state.footholdId).toBe(`${mapId}:ground`);
        expect(state.position.y).toBe(600);
      }
    }
  });

  it.each(ROUTES)('links the %s platforms with jumps in both directions at normal movement speed', (mapId) => {
    const map = maps[mapId]!;
    const platforms = map.footholds.filter(({ dropThrough }) => dropThrough);
    for (let index = 1; index < platforms.length; index += 1) {
      const left = platforms[index - 1]!;
      const right = platforms[index]!;
      for (const direction of [-1, 1] as const) {
        const source = direction === 1 ? left : right;
        const target = direction === 1 ? right : left;
        let state = grounded(map, source.id, direction === 1 ? source.x2 - 6 : source.x1 + 6);
        for (let tick = 1; tick <= 65; tick += 1) {
          state = stepMovement(state, { ...NEUTRAL, moveX: direction, jumpPressed: tick === 1 },
            map, rules.movement, DT, tick * DT * 1000);
          if (state.mode === 'grounded') break;
        }
        expect(state.footholdId, `${source.id} -> ${target.id}`).toBe(target.id);
      }
    }
  });

  it('lets side ledges evade ground melee, then drop into normal sword range to counter', () => {
    for (const mapId of ROUTES) {
      const map = maps[mapId]!;
      const ledge = map.footholds.find(({ dropThrough }) => dropThrough)!;
      const spawn = map.monsters.find(({ x, y }) => y === 600 && x > ledge.x1 && x < ledge.x2)!;
      expect(spawn, mapId).toBeDefined();
      const attacker = enemy(spawn.monsterId, spawn.x);
      expect(hits('enemy-melee', attacker, hero(spawn.x + 30))).toHaveLength(1);
      expect(hits('enemy-melee', attacker, hero(spawn.x + 30, ledge.y1))).toHaveLength(0);
      let state = grounded(map, ledge.id, spawn.x + 30);
      for (let tick = 1; tick <= 60; tick += 1) {
        state = stepMovement(state, { ...NEUTRAL, downHeld: tick === 1, jumpPressed: tick === 1 },
          map, rules.movement, DT, tick * DT * 1000);
      }
      expect(hits('basic', hero(state.position.x, state.position.y), attacker)).toHaveLength(1);
    }
  });

  it('makes arena ledges evade a wave while remaining vulnerable to slam and able to hit the boss', () => {
    const map = maps['guardian-arena']!;
    for (const ledge of map.footholds.filter(({ dropThrough }) => dropThrough)) {
      const x = (ledge.x1 + ledge.x2) / 2;
      const boss = enemy('guardian', x - 40);
      const target = hero(x, ledge.y1);
      expect(hits('guardian-wave', boss, hero(x))).toHaveLength(1);
      expect(hits('guardian-wave', boss, target)).toHaveLength(0);
      expect(hits('guardian-slam', boss, target)).toHaveLength(1);
      expect(hits('basic', target, boss)).toHaveLength(1);
    }
  });

  it('keeps a committed wave fixed and chooses a reachable slam on the next decision', () => {
    const map = maps['guardian-arena']!;
    const spawn = map.monsters[0]!;
    const boss = createMonster('guardian', spawn, map, rules);
    boss.pendingSkillId = 'guardian-slam';
    const start = stepActors([boss], hero(spawn.x + 50), map, rules, DT, 1000);
    expect(start.attackRequests[0]?.skillId).toBe('guardian-wave');
    const climbed = hero(spawn.x + 50, 530);
    const committed = stepActors(start.monsters, climbed, map, rules, DT, 1100);
    expect(committed.attackRequests).toHaveLength(0);
    expect(committed.monsters[0]!.pendingSkillId).toBe('guardian-wave');
    expect(committed.telegraphs[0]!.rect!.height).toBe(50);
    // At this point the original attack plus the phase-one delay have elapsed.
    const recover = stepActors(committed.monsters, climbed, map, rules, DT, 7000);
    const next = stepActors(recover.monsters, climbed, map, rules, DT, 7000 + DT * 1000);
    expect(next.attackRequests).toEqual([{ sourceId: 'guardian', skillId: 'guardian-slam' }]);
  });
});
