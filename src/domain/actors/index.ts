import type {
  ActorStep,
  CombatActor,
  EntityId,
  Facing,
  Hit,
  MapDef,
  MonsterDef,
  MonsterSpawn,
  MonsterState,
  MovementConfig,
  MovementState,
  RulesCatalog,
  SkillDef,
  Telegraph,
} from '../../contracts/index.js';
import { createMovement, stepMovement } from '../movement/index.js';

const IDLE_DURATION_MS = 600;
const GUARDIAN_PHASE_ONE_DELAY_MS = 2500;
const GUARDIAN_PHASE_TWO_DELAY_MS = 1800;
const EPSILON = 0.0001;
// A boss engages anyone this far outside its roam bounds. Without it a player could stand just
// past roamLeft and hit the guardian with 橫掃 (reach 110) while it never retaliated.
// The arena entry/exit (x <= 160) stays a safe spot.
const BOSS_ENGAGE_MARGIN_PX = 300;

/** Creates one actor for a placement already registered on the supplied map. */
export function createMonster(
  entityId: EntityId,
  spawn: MonsterSpawn,
  map: MapDef,
  rules: RulesCatalog,
): MonsterState {
  const placement = map.monsters.find((candidate) => candidate.spawnId === spawn.spawnId);
  if (!placement || placement.monsterId !== spawn.monsterId) {
    throw new RangeError(`Monster spawn ${spawn.spawnId} is not present on map ${map.id}.`);
  }
  const definition = rules.monsters[placement.monsterId];
  if (!definition) throw new RangeError(`Monster definition ${placement.monsterId} does not exist.`);
  if (placement.roamRight < placement.roamLeft) {
    throw new RangeError(`Monster spawn ${placement.spawnId} has an invalid patrol range.`);
  }

  return {
    id: entityId,
    monsterId: placement.monsterId,
    spawnId: placement.spawnId,
    movement: createMovement({ x: placement.x, y: placement.y }),
    hp: definition.maxHp,
    mode: 'idle',
    idleUntilMs: 0,
    lastAttackAtMs: -1,
    phase: 1,
    deadAtMs: null,
    width: definition.width,
    height: definition.height,
    pendingSkillId: null,
    attackOrigin: null,
    attackFacing: null,
    deathReported: false,
  };
}

/** Advances monster movement and intent using map geometry and game time only. */
export function stepActors(
  monsters: readonly MonsterState[],
  player: CombatActor,
  map: MapDef,
  rules: RulesCatalog,
  dtSeconds: number,
  nowMs: number,
): ActorStep {
  const result: ActorStep = {
    monsters: [],
    attackRequests: [],
    telegraphs: [],
    deaths: [],
    respawnRequests: [],
  };
  const elapsedSeconds = Number.isFinite(dtSeconds) && dtSeconds > 0 ? dtSeconds : 0;

  for (const original of monsters) {
    const spawn = map.monsters.find((candidate) => candidate.spawnId === original.spawnId);
    const definition = rules.monsters[original.monsterId];
    if (!spawn || spawn.monsterId !== original.monsterId || !definition) continue;

    let monster = cloneMonster(original);
    if (monster.mode === 'dead' || monster.hp <= 0) {
      monster = markDead(monster, nowMs);
      if (!monster.deathReported) {
        result.deaths.push(monster.id);
        monster.deathReported = true;
      }

      const respawnReadyAt = monster.deadAtMs === null
        ? Number.POSITIVE_INFINITY
        : monster.deadAtMs + definition.respawnMs;
      if (definition.respawnMs > 0 && nowMs >= respawnReadyAt) {
        result.respawnRequests.push(monster.id);
        // The app consumes this one-shot request and creates a fresh EntityId.
        continue;
      }
      result.monsters.push(monster);
      continue;
    }

    if (monster.monsterId === 'guardian' && monster.phase === 1
      && monster.hp <= definition.maxHp / 2) {
      monster.phase = 2;
    }

    const playerIsAlive = player.hp > 0;
    const engageMargin = map.boss ? BOSS_ENGAGE_MARGIN_PX : 0;
    const playerInsideActivity = player.position.x >= spawn.roamLeft - engageMargin - EPSILON
      && player.position.x <= spawn.roamRight + engageMargin + EPSILON;
    const distanceX = player.position.x - monster.movement.position.x;
    const distanceY = player.position.y - monster.movement.position.y;
    const isAggro = playerIsAlive
      && playerInsideActivity
      && distanceX * distanceX + distanceY * distanceY <= definition.aggroRange ** 2
      && hasClearHorizontalRoute(monster, player, map, definition);

    if (monster.mode === 'windup') {
      const skill = monster.pendingSkillId ? rules.skills[monster.pendingSkillId] : undefined;
      if (!skill || monster.lastAttackAtMs < 0) {
        monster.mode = 'chase';
        clearAttackSnapshot(monster);
      } else {
        const resolveAtMs = monster.lastAttackAtMs + skill.windupMs;
        monster = advanceStationary(monster, map, rules, definition, elapsedSeconds, nowMs);
        if (nowMs < resolveAtMs) result.telegraphs.push(makeTelegraph(monster, skill, resolveAtMs));
        else monster.mode = 'recovery';
        result.monsters.push(monster);
        continue;
      }
    }

    if (monster.mode === 'recovery') {
      const previousSkill = monster.pendingSkillId
        ? rules.skills[monster.pendingSkillId]
        : undefined;
      const recoveryEndsAt = monster.lastAttackAtMs + (previousSkill
        ? attackDuration(previousSkill)
        : 0);
      if (nowMs < recoveryEndsAt) {
        monster = advanceStationary(monster, map, rules, definition, elapsedSeconds, nowMs);
        result.monsters.push(monster);
        continue;
      }
      monster.mode = isAggro ? 'chase' : 'patrol';
    }

    if (isAggro) {
      const skillId = chooseSkillId(monster);
      const skill = skillId ? rules.skills[skillId] : undefined;
      if (skill && canStartAttack(monster, definition, rules, nowMs)
        && isInsideSkillRange(monster, player, skill, definition)) {
        const facing: Facing = player.position.x < monster.movement.position.x ? -1 : 1;
        monster.movement = { ...monster.movement, facing };
        monster.mode = 'windup';
        monster.lastAttackAtMs = nowMs;
        monster.pendingSkillId = skill.id;
        monster.attackFacing = facing;
        result.attackRequests.push({ sourceId: monster.id, skillId: skill.id });
        monster = advanceStationary(monster, map, rules, definition, elapsedSeconds, nowMs);
        // The combat actor and telegraph now share the same post-movement snapshot.
        monster.attackOrigin = { ...monster.movement.position };
        const resolveAtMs = nowMs + skill.windupMs;
        if (nowMs < resolveAtMs) result.telegraphs.push(makeTelegraph(monster, skill, resolveAtMs));
        result.monsters.push(monster);
        continue;
      }
      monster.mode = 'chase';
    } else if (monster.mode === 'chase') {
      monster.mode = 'patrol';
    }

    if (monster.mode === 'idle') {
      if (nowMs < monster.idleUntilMs) {
        monster = advanceStationary(monster, map, rules, definition, elapsedSeconds, nowMs);
        result.monsters.push(monster);
        continue;
      }
      monster.mode = 'patrol';
    }

    const direction = monster.mode === 'chase'
      ? directionToward(monster.movement.position.x, player.position.x)
      : monster.movement.facing;
    const boundedMove = monster.mode === 'chase'
      ? boundedDirection(monster, direction, spawn, definition, elapsedSeconds)
      : patrolMove(monster, monster.movement.facing, spawn, definition, elapsedSeconds);

    if (boundedMove.turnAround) {
      monster = turnIntoIdle(monster, boundedMove.turnFacing, nowMs);
      monster = advanceStationary(monster, map, rules, definition, elapsedSeconds, nowMs);
      result.monsters.push(monster);
      continue;
    }

    const movementBefore = monster.movement;
    monster.movement = stepMonsterMovement(
      monster,
      boundedMove.moveX,
      boundedMove.speed,
      map,
      rules,
      definition,
      elapsedSeconds,
      nowMs,
    );

    const hitWallOrMapEdge = boundedMove.moveX !== 0
      && Math.abs(monster.movement.position.x - movementBefore.position.x) <= EPSILON
      && Math.abs(monster.movement.velocity.x) <= EPSILON
      && nowMs >= movementBefore.knockbackUntilMs;
    const walkedOffFoothold = boundedMove.moveX !== 0
      && movementBefore.mode === 'grounded'
      && monster.movement.mode === 'airborne';
    if (hitWallOrMapEdge || walkedOffFoothold) {
      monster.movement = {
        ...movementBefore,
        facing: (boundedMove.moveX === 1 ? -1 : 1),
      };
      monster = turnIntoIdle(monster, monster.movement.facing, nowMs);
    }

    result.monsters.push(monster);
  }

  return result;
}

/** Applies a combat hit to its monster target; rewards and player damage stay app-owned. */
export function applyMonsterHit(
  monsters: readonly MonsterState[],
  hit: Hit,
  nowMs: number,
): MonsterState[] {
  return monsters.map((original) => {
    const monster = cloneMonster(original);
    if (monster.id !== hit.targetId || monster.mode === 'dead' || monster.hp <= 0) return monster;

    const damage = Number.isFinite(hit.damage) ? Math.max(0, hit.damage) : 0;
    monster.hp = Math.max(0, monster.hp - damage);
    if (monster.hp === 0) {
      monster.mode = 'dead';
      monster.deadAtMs = nowMs;
      monster.deathReported = false;
      monster.movement = {
        ...monster.movement,
        velocity: { x: 0, y: 0 },
        mode: 'dead',
        footholdId: null,
        ladderId: null,
        knockbackUntilMs: 0,
      };
      clearAttackSnapshot(monster);
      return monster;
    }

    if (monster.monsterId !== 'guardian'
      && Number.isFinite(hit.knockback.x) && Number.isFinite(hit.knockback.y)
      && (hit.knockback.x !== 0 || hit.knockback.y !== 0)) {
      monster.movement = {
        ...monster.movement,
        velocity: { x: hit.knockback.x, y: hit.knockback.y },
        knockbackUntilMs: nowMs + 180,
      };
    }
    return monster;
  });
}

function chooseSkillId(monster: MonsterState): string | null {
  if (monster.monsterId !== 'guardian') return 'enemy-melee';
  if (monster.pendingSkillId === null) return 'guardian-slam';
  return monster.pendingSkillId === 'guardian-slam' ? 'guardian-wave' : 'guardian-slam';
}

function canStartAttack(
  monster: MonsterState,
  definition: MonsterDef,
  rules: RulesCatalog,
  nowMs: number,
): boolean {
  if (nowMs < monster.movement.knockbackUntilMs) return false;
  if (monster.monsterId !== 'guardian') {
    return monster.lastAttackAtMs < 0
      || nowMs >= monster.lastAttackAtMs + definition.attackCooldownMs;
  }
  if (monster.lastAttackAtMs < 0 || monster.pendingSkillId === null) return true;
  const previousSkill = rules.skills[monster.pendingSkillId];
  if (!previousSkill) return false;
  const delayMs = monster.phase === 1
    ? GUARDIAN_PHASE_ONE_DELAY_MS
    : GUARDIAN_PHASE_TWO_DELAY_MS;
  return nowMs >= monster.lastAttackAtMs + attackDuration(previousSkill) + delayMs;
}

function isInsideSkillRange(
  monster: MonsterState,
  player: CombatActor,
  skill: SkillDef,
  definition: MonsterDef,
): boolean {
  const origin = monster.movement.position;
  const facing: Facing = player.position.x < origin.x ? -1 : 1;
  const reach = monster.monsterId === 'guardian'
    ? skill.reach
    : Math.min(skill.reach, definition.attackRange);
  const attackLeft = facing === 1 ? origin.x : origin.x - reach;
  const attackRight = facing === 1 ? origin.x + reach : origin.x;
  const playerLeft = player.position.x - player.body.width / 2;
  const playerRight = player.position.x + player.body.width / 2;
  const attackTop = origin.y - skill.height;
  const playerTop = player.position.y - player.body.height;
  return attackLeft < playerRight
    && attackRight > playerLeft
    && attackTop < player.position.y
    && origin.y > playerTop;
}

function hasClearHorizontalRoute(
  monster: MonsterState,
  player: CombatActor,
  map: MapDef,
  definition: MonsterDef,
): boolean {
  const monsterX = monster.movement.position.x;
  const playerX = player.position.x;
  const footY = monster.movement.position.y;
  const bodyTop = footY - definition.height;
  for (const wall of map.walls) {
    const overlapsMonsterVertically = footY > wall.y + EPSILON
      && bodyTop < wall.y + wall.height - EPSILON;
    if (!overlapsMonsterVertically) continue;
    if (playerX > monsterX
      && monsterX + definition.width / 2 <= wall.x + EPSILON
      && playerX + player.body.width / 2 > wall.x + EPSILON) return false;
    const wallRight = wall.x + wall.width;
    if (playerX < monsterX
      && monsterX - definition.width / 2 >= wallRight - EPSILON
      && playerX - player.body.width / 2 < wallRight - EPSILON) return false;
  }
  return true;
}

function makeTelegraph(monster: MonsterState, skill: SkillDef, resolveAtMs: number): Telegraph {
  const origin = monster.attackOrigin ?? monster.movement.position;
  const facing = monster.attackFacing ?? monster.movement.facing;
  return {
    id: `${monster.id}:telegraph:${monster.lastAttackAtMs}`,
    sourceId: monster.id,
    kind: 'rect',
    rect: {
      x: facing === 1 ? origin.x : origin.x - skill.reach,
      y: origin.y - skill.height,
      width: skill.reach,
      height: skill.height,
    },
    resolveAtMs,
  };
}

function advanceStationary(
  monster: MonsterState,
  map: MapDef,
  rules: RulesCatalog,
  definition: MonsterDef,
  dtSeconds: number,
  nowMs: number,
): MonsterState {
  return {
    ...monster,
    movement: stepMonsterMovement(monster, 0, 0, map, rules, definition, dtSeconds, nowMs),
  };
}

function stepMonsterMovement(
  monster: MonsterState,
  moveX: -1 | 0 | 1,
  speed: number,
  map: MapDef,
  rules: RulesCatalog,
  definition: MonsterDef,
  dtSeconds: number,
  nowMs: number,
): MovementState {
  const config: MovementConfig = {
    ...rules.movement,
    speed: moveX === 0 ? definition.speed : Math.max(0, speed),
    width: definition.width,
    height: definition.height,
  };
  return stepMovement(
    monster.movement,
    { moveX, climbY: 0, jumpPressed: false, downHeld: false },
    map,
    config,
    dtSeconds,
    nowMs,
  );
}

function patrolMove(
  monster: MonsterState,
  direction: -1 | 1,
  spawn: MonsterSpawn,
  definition: MonsterDef,
  dtSeconds: number,
): { moveX: -1 | 0 | 1; speed: number; turnAround: boolean; turnFacing: Facing } {
  const x = monster.movement.position.x;
  const bound = direction < 0 ? spawn.roamLeft : spawn.roamRight;
  const distance = direction < 0 ? x - bound : bound - x;
  if (distance <= EPSILON) {
    return { moveX: 0, speed: 0, turnAround: true, turnFacing: direction === 1 ? -1 : 1 };
  }
  const travel = definition.speed * dtSeconds;
  if (travel > 0 && travel >= distance) {
    return {
      moveX: direction,
      speed: distance / dtSeconds,
      turnAround: false,
      turnFacing: direction === 1 ? -1 : 1,
    };
  }
  return { moveX: direction, speed: definition.speed, turnAround: false, turnFacing: direction };
}

function boundedDirection(
  monster: MonsterState,
  direction: -1 | 0 | 1,
  spawn: MonsterSpawn,
  definition: MonsterDef,
  dtSeconds: number,
): { moveX: -1 | 0 | 1; speed: number; turnAround: boolean; turnFacing: Facing } {
  if (direction === 0) return { moveX: 0, speed: 0, turnAround: false, turnFacing: monster.movement.facing };
  const x = monster.movement.position.x;
  const bound = direction < 0 ? spawn.roamLeft : spawn.roamRight;
  const distance = direction < 0 ? x - bound : bound - x;
  if (distance <= EPSILON) {
    return { moveX: 0, speed: 0, turnAround: true, turnFacing: direction === 1 ? -1 : 1 };
  }
  const travel = definition.speed * 1.3 * dtSeconds;
  if (travel > 0 && travel >= distance) {
    return {
      moveX: direction,
      speed: distance / dtSeconds,
      turnAround: true,
      turnFacing: direction === 1 ? -1 : 1,
    };
  }
  return { moveX: direction, speed: definition.speed * 1.3, turnAround: false, turnFacing: direction };
}

function directionToward(fromX: number, toX: number): -1 | 0 | 1 {
  return toX < fromX - EPSILON ? -1 : toX > fromX + EPSILON ? 1 : 0;
}

function turnIntoIdle(monster: MonsterState, facing: Facing, nowMs: number): MonsterState {
  return {
    ...monster,
    mode: 'idle',
    idleUntilMs: nowMs + IDLE_DURATION_MS,
    movement: { ...monster.movement, facing },
  };
}

function markDead(monster: MonsterState, nowMs: number): MonsterState {
  if (monster.deadAtMs !== null) return monster;
  const dead: MonsterState = {
    ...monster,
    hp: 0,
    mode: 'dead',
    deadAtMs: nowMs,
    movement: { ...monster.movement, velocity: { x: 0, y: 0 }, mode: 'dead' },
  };
  clearAttackSnapshot(dead);
  return dead;
}

function clearAttackSnapshot(monster: MonsterState): void {
  monster.pendingSkillId = null;
  monster.attackOrigin = null;
  monster.attackFacing = null;
}

function attackDuration(skill: SkillDef): number {
  return skill.windupMs + skill.activeMs + skill.recoveryMs;
}

function cloneMonster(monster: MonsterState): MonsterState {
  return {
    ...monster,
    movement: {
      ...monster.movement,
      position: { ...monster.movement.position },
      velocity: { ...monster.movement.velocity },
    },
    attackOrigin: monster.attackOrigin ? { ...monster.attackOrigin } : null,
  };
}
