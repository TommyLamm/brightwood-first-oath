import type {
  ActorStep,
  BellCycle,
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
const BELL_KEEPER_ID = 'ruins-bell-keeper';
const BELL_TRANSITION_MS = 1200;
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
    attackReach: null,
    deathReported: false,
    ...(placement.monsterId === BELL_KEEPER_ID ? {
      bellCycle: {
        sequenceIndex: 0,
        nextAttackAtMs: 0,
        transitionStartedAtMs: null,
        transitionEndsAtMs: null,
        transitionUsed: false,
      } satisfies BellCycle,
    } : {}),
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

    if (monster.monsterId === BELL_KEEPER_ID) {
      const bellStep = stepBellKeeper(monster, player, spawn, map, rules, definition, elapsedSeconds, nowMs);
      result.monsters.push(bellStep.monster);
      if (bellStep.attackRequest) result.attackRequests.push(bellStep.attackRequest);
      if (bellStep.telegraph) result.telegraphs.push(bellStep.telegraph);
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
        const boundedCharge = isBoundedCharge(monster, skill);
        if (boundedCharge && nowMs >= resolveAtMs) {
          monster.mode = 'dash';
        } else {
          monster = advanceStationary(monster, map, rules, definition, elapsedSeconds, nowMs);
          if (nowMs < resolveAtMs) result.telegraphs.push(makeTelegraph(monster, skill, resolveAtMs, monster.attackReach));
          else monster.mode = 'recovery';
          result.monsters.push(monster);
          continue;
        }
      }
    }

    if (monster.mode === 'dash') {
      const skill = monster.pendingSkillId ? rules.skills[monster.pendingSkillId] : undefined;
      if (!skill || !monster.attackOrigin || !monster.attackFacing) {
        monster.mode = 'chase';
        clearAttackSnapshot(monster);
      } else {
        monster = advanceBoundedCharge(monster, skill, elapsedSeconds, nowMs);
        const dashEndsAtMs = monster.lastAttackAtMs + skill.windupMs + skill.activeMs;
        if (nowMs >= dashEndsAtMs) monster.mode = 'recovery';
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
        monster = advanceStationary(monster, map, rules, definition, elapsedSeconds, nowMs);
        const boundedCharge = isBoundedCharge(monster, skill);
        const reach = boundedCharge ? boundedChargeReach(monster, facing, spawn, map, definition, skill) : null;
        if (reach !== null && reach <= EPSILON) {
          monster.mode = 'chase';
        } else {
          monster.mode = 'windup';
          monster.lastAttackAtMs = nowMs;
          monster.pendingSkillId = skill.id;
          monster.attackFacing = facing;
          monster.attackReach = reach;
          result.attackRequests.push({
            sourceId: monster.id,
            skillId: skill.id,
            ...(reach === null ? {} : { reachOverride: reach }),
          });
          // The combat actor and telegraph now share the same post-movement snapshot.
          monster.attackOrigin = { ...monster.movement.position };
          const resolveAtMs = nowMs + skill.windupMs;
          if (nowMs < resolveAtMs) result.telegraphs.push(makeTelegraph(monster, skill, resolveAtMs, reach));
          result.monsters.push(monster);
          continue;
        }
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
      cancelBellCycle(monster);
      return monster;
    }

    if (!isBossMonster(monster.monsterId)
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

type BellKeeperStep = {
  monster: MonsterState;
  attackRequest?: ActorStep['attackRequests'][number];
  telegraph?: Telegraph;
};

/** Bell Keeper uses bounded pursuit while idle and locks its position during each action. */
function stepBellKeeper(
  monster: MonsterState,
  player: CombatActor,
  spawn: MonsterSpawn,
  map: MapDef,
  rules: RulesCatalog,
  definition: MonsterDef,
  dtSeconds: number,
  nowMs: number,
): BellKeeperStep {
  monster.bellCycle ??= {
    sequenceIndex: 0,
    nextAttackAtMs: 0,
    transitionStartedAtMs: null,
    transitionEndsAtMs: null,
    transitionUsed: false,
  };

  if (player.hp <= 0) {
    monster.mode = 'idle';
    clearAttackSnapshot(monster);
    cancelBellCycle(monster);
    return { monster };
  }

  if (monster.phase === 1 && monster.hp <= definition.maxHp / 2
    && !monster.bellCycle.transitionUsed
    && monster.mode !== 'windup' && monster.mode !== 'dash' && monster.mode !== 'recovery') {
    startBellTransition(monster, nowMs);
  }

  if (monster.mode === 'phase-transition') {
    const endsAtMs = monster.bellCycle.transitionEndsAtMs;
    if (endsAtMs === null || nowMs < endsAtMs) return { monster };

    monster.phase = 2;
    monster.mode = 'idle';
    monster.bellCycle = {
      ...monster.bellCycle,
      sequenceIndex: 0,
      nextAttackAtMs: endsAtMs,
    };
    clearAttackSnapshot(monster);
  }

  if (monster.mode === 'windup') {
    const skill = monster.pendingSkillId ? rules.skills[monster.pendingSkillId] : undefined;
    if (!skill || monster.lastAttackAtMs < 0 || !monster.attackOrigin || !monster.attackFacing) {
      monster.mode = 'idle';
      clearAttackSnapshot(monster);
    } else {
      const resolveAtMs = monster.lastAttackAtMs + skill.windupMs;
      if (nowMs < resolveAtMs) {
        return { monster, telegraph: makeTelegraph(monster, skill, resolveAtMs, monster.attackReach) };
      }
      monster.mode = 'recovery';
    }
  }

  if (monster.mode === 'recovery') {
    const skill = monster.pendingSkillId ? rules.skills[monster.pendingSkillId] : undefined;
    const recoveryEndsAtMs = monster.lastAttackAtMs + (skill ? attackDuration(skill) : 0);
    if (skill && nowMs < recoveryEndsAtMs) return { monster };
    monster.mode = 'idle';
    clearAttackSnapshot(monster);
  }

  // Crossing half health during an attack waits for its full recovery, but the
  // 600/300ms between-attack pause is replaced by the transition itself.
  if (monster.phase === 1 && monster.hp <= definition.maxHp / 2
    && !monster.bellCycle.transitionUsed) {
    startBellTransition(monster, nowMs);
    return { monster };
  }

  const playerInsideActivity = player.position.x >= spawn.roamLeft - BOSS_ENGAGE_MARGIN_PX - EPSILON
    && player.position.x <= spawn.roamRight + BOSS_ENGAGE_MARGIN_PX + EPSILON;
  const distanceX = player.position.x - monster.movement.position.x;
  const distanceY = player.position.y - monster.movement.position.y;
  const isAggro = playerInsideActivity
    && distanceX * distanceX + distanceY * distanceY <= definition.aggroRange ** 2
    && hasClearHorizontalRoute(monster, player, map, definition);

  monster.mode = 'idle';
  if (!isAggro) return { monster };

  const facing: Facing = player.position.x < monster.movement.position.x ? -1 : 1;
  monster.movement = { ...monster.movement, facing };
  const cycle = monster.bellCycle;

  const sequence = monster.phase === 1
    ? ['ruins-bell-slam', 'ruins-bell-sweep']
    : ['ruins-bell-sweep', 'ruins-bell-slam', 'ruins-bell-sweep'];
  const sequenceIndex = cycle.sequenceIndex % sequence.length;
  const skillId = sequence[sequenceIndex]!;
  const skill = rules.skills[skillId];
  if (!skill || skill.kind !== 'attack') {
    return { monster };
  }
  const targetInRange = isInsideSkillRange(monster, player, skill, definition);
  if (!targetInRange || nowMs < cycle.nextAttackAtMs) {
    if (!targetInRange) monster = advanceBellKeeperTowardPlayer(
      monster, player, spawn, map, rules, definition, dtSeconds, nowMs,
    );
    return { monster };
  }

  const nextIndex = ((sequenceIndex + 1) % sequence.length) as BellCycle['sequenceIndex'];
  const gapMs = monster.phase === 1 ? 600 : 300;
  monster.mode = 'windup';
  monster.lastAttackAtMs = nowMs;
  monster.pendingSkillId = skill.id;
  monster.attackFacing = facing;
  monster.attackReach = null;
  monster.attackOrigin = { ...monster.movement.position };
  monster.bellCycle = {
    ...cycle,
    sequenceIndex: nextIndex,
    nextAttackAtMs: nowMs + attackDuration(skill) + gapMs,
  };

  const resolveAtMs = nowMs + skill.windupMs;
  return {
    monster,
    attackRequest: { sourceId: monster.id, skillId: skill.id },
    ...(nowMs < resolveAtMs ? { telegraph: makeTelegraph(monster, skill, resolveAtMs) } : {}),
  };
}

function advanceBellKeeperTowardPlayer(
  monster: MonsterState,
  player: CombatActor,
  spawn: MonsterSpawn,
  map: MapDef,
  rules: RulesCatalog,
  definition: MonsterDef,
  dtSeconds: number,
  nowMs: number,
): MonsterState {
  const direction = directionToward(monster.movement.position.x, player.position.x);
  if (direction === 0 || dtSeconds <= 0) return monster;
  const boundedMove = boundedDirection(monster, direction, spawn, definition, dtSeconds);
  if (boundedMove.turnAround) {
    return turnIntoIdle(monster, boundedMove.turnFacing, nowMs);
  }

  const movementBefore = monster.movement;
  const movement = stepMonsterMovement(
    monster,
    boundedMove.moveX,
    boundedMove.speed,
    map,
    rules,
    definition,
    dtSeconds,
    nowMs,
  );
  const clampedX = Math.max(spawn.roamLeft, Math.min(spawn.roamRight, movement.position.x));
  const boundedMovement = clampedX === movement.position.x
    ? movement
    : { ...movement, position: { ...movement.position, x: clampedX } };
  const hitWallOrMapEdge = Math.abs(boundedMovement.position.x - movementBefore.position.x) <= EPSILON
    && Math.abs(boundedMovement.velocity.x) <= EPSILON
    && nowMs >= movementBefore.knockbackUntilMs;
  const walkedOffFoothold = movementBefore.mode === 'grounded' && boundedMovement.mode === 'airborne';
  if (hitWallOrMapEdge || walkedOffFoothold) {
    return turnIntoIdle(
      { ...monster, movement: movementBefore },
      boundedMove.moveX === 1 ? -1 : 1,
      nowMs,
    );
  }
  return { ...monster, movement: boundedMovement };
}

function startBellTransition(monster: MonsterState, nowMs: number): void {
  const cycle = monster.bellCycle;
  if (!cycle || cycle.transitionUsed) return;
  monster.bellCycle = {
    ...cycle,
    transitionStartedAtMs: nowMs,
    transitionEndsAtMs: nowMs + BELL_TRANSITION_MS,
    transitionUsed: true,
  };
  monster.mode = 'phase-transition';
  clearAttackSnapshot(monster);
}

function cancelBellCycle(monster: MonsterState): void {
  if (!monster.bellCycle) return;
  monster.bellCycle = {
    ...monster.bellCycle,
    transitionStartedAtMs: null,
    transitionEndsAtMs: null,
    transitionUsed: true,
  };
}

function isBossMonster(monsterId: string): boolean {
  return monsterId === 'guardian' || monsterId === 'frost-tide-warden'
    || monsterId === 'sunwell-sentinel' || monsterId === BELL_KEEPER_ID;
}

function isBoundedCharge(monster: MonsterState, skill: SkillDef): boolean {
  return (monster.monsterId === 'frost-crab' && skill.id === 'frost-crab-charge')
    || (monster.monsterId === 'sunwell-beetle' && skill.id === 'sunwell-beetle-charge');
}

function chooseSkillId(monster: MonsterState): string | null {
  if (monster.monsterId === 'frost-crab') return 'frost-crab-charge';
  if (monster.monsterId === 'sunwell-beetle') return 'sunwell-beetle-charge';
  if (monster.monsterId === 'ruins-moss-carapace') return 'ruins-carapace-bite';
  if (monster.monsterId === 'ruins-string-puppet') return 'ruins-puppet-slap';
  if (monster.monsterId === 'ruins-bell-prowler') return 'ruins-prowler-sweep';
  if (monster.monsterId === 'sand-scorpion') return 'sand-stinger';
  if (monster.monsterId === 'sunwell-sentinel') return 'sunwell-sentinel-slam';
  if (monster.monsterId === 'frost-tide-warden') {
    return monster.pendingSkillId === 'frost-tusk-slam' ? 'low-tide-wave' : 'frost-tusk-slam';
  }
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
  const reach = monster.monsterId === 'guardian' || monster.monsterId === BELL_KEEPER_ID
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

function makeTelegraph(monster: MonsterState, skill: SkillDef, resolveAtMs: number, reachOverride: number | null = null): Telegraph {
  const origin = monster.attackOrigin ?? monster.movement.position;
  const facing = monster.attackFacing ?? monster.movement.facing;
  const reach = reachOverride ?? skill.reach;
  return {
    id: `${monster.id}:telegraph:${monster.lastAttackAtMs}`,
    sourceId: monster.id,
    kind: 'rect',
    rect: {
      x: facing === 1 ? origin.x : origin.x - reach,
      y: origin.y - skill.height,
      width: reach,
      height: skill.height,
    },
    resolveAtMs,
  };
}

function boundedChargeReach(
  monster: MonsterState,
  facing: Facing,
  spawn: MonsterSpawn,
  map: MapDef,
  definition: MonsterDef,
  skill: SkillDef,
): number {
  const halfWidth = definition.width / 2;
  const footY = monster.movement.position.y;
  const bodyTop = footY - definition.height;
  let endLimit = facing === 1
    ? Math.min(spawn.roamRight, map.width - 32 - halfWidth)
    : Math.max(spawn.roamLeft, 32 + halfWidth);

  for (const wall of map.walls) {
    const overlapsVertically = footY > wall.y + EPSILON
      && bodyTop < wall.y + wall.height - EPSILON;
    if (!overlapsVertically) continue;

    if (facing === 1 && wall.x >= monster.movement.position.x + halfWidth - EPSILON) {
      endLimit = Math.min(endLimit, wall.x - halfWidth);
    } else if (facing === -1 && wall.x + wall.width <= monster.movement.position.x - halfWidth + EPSILON) {
      endLimit = Math.max(endLimit, wall.x + wall.width + halfWidth);
    }
  }

  const available = facing === 1
    ? endLimit - monster.movement.position.x
    : monster.movement.position.x - endLimit;
  return Math.max(0, Math.min(skill.reach, available));
}

function advanceBoundedCharge(
  monster: MonsterState,
  skill: SkillDef,
  dtSeconds: number,
  nowMs: number,
): MonsterState {
  const origin = monster.attackOrigin ?? monster.movement.position;
  const facing = monster.attackFacing ?? monster.movement.facing;
  const reach = monster.attackReach ?? skill.reach;
  const dashStartMs = monster.lastAttackAtMs + skill.windupMs;
  const dashDurationMs = Math.max(1, skill.activeMs);
  const progress = Math.max(0, Math.min(1, (nowMs - dashStartMs) / dashDurationMs));
  const previousX = monster.movement.position.x;
  const nextX = origin.x + facing * reach * progress;
  const velocityX = progress >= 1 || dtSeconds <= 0 ? 0 : (nextX - previousX) / dtSeconds;
  return {
    ...monster,
    movement: {
      ...monster.movement,
      position: { x: nextX, y: origin.y },
      velocity: { x: velocityX, y: 0 },
      facing,
    },
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
  if (monster.deadAtMs !== null) {
    clearAttackSnapshot(monster);
    cancelBellCycle(monster);
    return monster;
  }
  const dead: MonsterState = {
    ...monster,
    hp: 0,
    mode: 'dead',
    deadAtMs: nowMs,
    movement: { ...monster.movement, velocity: { x: 0, y: 0 }, mode: 'dead' },
  };
  clearAttackSnapshot(dead);
  cancelBellCycle(dead);
  return dead;
}

function clearAttackSnapshot(monster: MonsterState): void {
  monster.pendingSkillId = null;
  monster.attackOrigin = null;
  monster.attackFacing = null;
  monster.attackReach = null;
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
    ...(monster.bellCycle ? { bellCycle: { ...monster.bellCycle } } : {}),
  };
}
