import type {
  Facing,
  InputFrame,
  MapDef,
  MovementConfig,
  MovementState,
  Vec2,
} from '../../contracts/index.js';

const EPSILON = 0.0001;
const GROUND_SNAP = 3;
const DROP_PUSH_SPEED = 80;
const LADDER_X_TOLERANCE = 16;

type Foothold = MapDef['footholds'][number];
type Ladder = MapDef['ladders'][number];
type Landing = { foothold: Foothold; time: number; x: number; y: number };

export function createMovement(position: Vec2): MovementState {
  return {
    position: { x: position.x, y: position.y },
    velocity: { x: 0, y: 0 },
    facing: 1,
    mode: 'airborne',
    footholdId: null,
    ladderId: null,
    dropThroughUntilMs: 0,
    knockbackUntilMs: 0,
  };
}

export function stepMovement(
  state: MovementState,
  input: InputFrame,
  map: MapDef,
  config: MovementConfig,
  dtSeconds: number,
  nowMs: number,
): MovementState {
  if (state.mode === 'dead') return cloneState(state);

  const facing = facingForInput(state.facing, input, nowMs >= state.knockbackUntilMs);
  if (state.mode === 'climbing') {
    return stepClimbing({ ...state, facing }, input, map, config, dtSeconds, nowMs);
  }

  const nearbyLadder = input.climbY === 0 || input.jumpPressed
    ? null
    : findNearbyLadder(state.position, map, config);

  if (nearbyLadder) {
    const attached: MovementState = {
      ...state,
      facing,
      position: { x: nearbyLadder.x, y: state.position.y },
      velocity: { x: 0, y: 0 },
      mode: 'climbing',
      footholdId: null,
      ladderId: nearbyLadder.id,
    };
    return stepClimbing(attached, input, map, config, dtSeconds, nowMs);
  }

  if (state.mode === 'grounded') {
    return stepGrounded({ ...state, facing }, input, map, config, dtSeconds, nowMs);
  }

  const velocityX = horizontalVelocity(state, input, config, nowMs);
  const airborne: MovementState = {
    ...state,
    facing,
    velocity: { x: velocityX, y: state.velocity.y },
  };
  return stepAirborne(airborne, map, config, dtSeconds, nowMs, null);
}

function stepGrounded(
  state: MovementState,
  input: InputFrame,
  map: MapDef,
  config: MovementConfig,
  dtSeconds: number,
  nowMs: number,
): MovementState {
  const foothold = map.footholds.find((candidate) => candidate.id === state.footholdId);
  if (!foothold) {
    return stepAirborne(
      { ...state, mode: 'airborne', footholdId: null, ladderId: null },
      map,
      config,
      dtSeconds,
      nowMs,
      null,
    );
  }

  const velocityX = horizontalVelocity(state, input, config, nowMs);

  if (input.jumpPressed && input.downHeld && foothold.dropThrough) {
    const dropped: MovementState = {
      ...state,
      position: { ...state.position },
      velocity: { x: velocityX, y: DROP_PUSH_SPEED },
      mode: 'airborne',
      footholdId: null,
      ladderId: null,
      dropThroughUntilMs: nowMs + 300,
    };
    return stepAirborne(dropped, map, config, dtSeconds, nowMs, foothold.id);
  }

  if (input.jumpPressed) {
    const jumping: MovementState = {
      ...state,
      velocity: { x: velocityX, y: config.jumpVelocity },
      mode: 'airborne',
      footholdId: null,
      ladderId: null,
    };
    return stepAirborne(jumping, map, config, dtSeconds, nowMs, null);
  }

  const requestedX = state.position.x + velocityX * dtSeconds;
  const nextX = resolveHorizontalPosition(
    state.position.x,
    requestedX,
    state.position.y,
    map,
    config,
  );
  const movedX = nextX - state.position.x;
  const support = findGroundSupport(
    map,
    nextX,
    state.position.x,
    state.position.y,
    config,
    state.footholdId,
  );

  if (support) {
    return {
      ...state,
      position: { x: nextX, y: support.y },
      velocity: { x: movedX === 0 && requestedX !== nextX ? 0 : velocityX, y: 0 },
      mode: 'grounded',
      footholdId: support.foothold.id,
      ladderId: null,
    };
  }

  return stepAirborne(
    {
      ...state,
      position: { x: nextX, y: state.position.y },
      velocity: { x: movedX === 0 && requestedX !== nextX ? 0 : velocityX, y: 0 },
      mode: 'airborne',
      footholdId: null,
      ladderId: null,
    },
    map,
    config,
    dtSeconds,
    nowMs,
    null,
    true,
  );
}

function stepAirborne(
  state: MovementState,
  map: MapDef,
  config: MovementConfig,
  dtSeconds: number,
  nowMs: number,
  ignoredFootholdId: string | null,
  horizontalAlreadyApplied = false,
): MovementState {
  const oldPosition = state.position;
  const requestedX = horizontalAlreadyApplied
    ? oldPosition.x
    : oldPosition.x + state.velocity.x * dtSeconds;
  const nextX = resolveHorizontalPosition(
    oldPosition.x,
    requestedX,
    oldPosition.y,
    map,
    config,
  );
  const horizontalBlocked = Math.abs(nextX - requestedX) > EPSILON;
  const velocityX = horizontalBlocked ? 0 : state.velocity.x;
  const velocityY = Math.min(
    config.terminalVelocity,
    state.velocity.y + config.gravity * dtSeconds,
  );
  const requestedY = oldPosition.y + velocityY * dtSeconds;
  const ceilingY = velocityY < 0
    ? resolveCeiling(oldPosition.y, requestedY, nextX, map, config)
    : null;
  const nextY = ceilingY ?? requestedY;
  const verticalVelocity = ceilingY === null ? velocityY : 0;

  if (verticalVelocity > 0) {
    const landing = findLanding(
      oldPosition,
      { x: nextX, y: nextY },
      map,
      config,
      ignoredFootholdId,
      nowMs,
      state.dropThroughUntilMs,
    );
    if (landing) {
      return resetIfOutOfBounds({
        ...state,
        position: { x: landing.x, y: landing.y },
        velocity: { x: velocityX, y: 0 },
        mode: 'grounded',
        footholdId: landing.foothold.id,
        ladderId: null,
      }, map, nowMs);
    }
  }

  return resetIfOutOfBounds({
    ...state,
    position: { x: nextX, y: nextY },
    velocity: { x: velocityX, y: verticalVelocity },
    mode: 'airborne',
    footholdId: null,
    ladderId: null,
  }, map, nowMs);
}

function stepClimbing(
  state: MovementState,
  input: InputFrame,
  map: MapDef,
  config: MovementConfig,
  dtSeconds: number,
  nowMs: number,
): MovementState {
  const ladder = map.ladders.find((candidate) => candidate.id === state.ladderId);
  if (!ladder) {
    return stepAirborne(
      { ...state, mode: 'airborne', ladderId: null, footholdId: null },
      map,
      config,
      dtSeconds,
      nowMs,
      null,
    );
  }

  if (input.jumpPressed) {
    const jumping: MovementState = {
      ...state,
      position: { ...state.position, x: ladder.x },
      velocity: {
        x: horizontalVelocity(state, input, config, nowMs),
        y: config.jumpVelocity,
      },
      mode: 'airborne',
      ladderId: null,
      footholdId: null,
    };
    return stepAirborne(jumping, map, config, dtSeconds, nowMs, null);
  }

  const requestedY = state.position.y + input.climbY * config.climbSpeed * dtSeconds;
  if (input.climbY < 0 && requestedY <= ladder.topY) {
    const topSupport = findLadderEndSupport(ladder, map, config, ladder.topY);
    if (topSupport) {
      return {
        ...state,
        position: { x: ladder.x, y: topSupport.y },
        velocity: { x: 0, y: 0 },
        mode: 'grounded',
        footholdId: topSupport.foothold.id,
        ladderId: null,
      };
    }
  }

  if (input.climbY > 0 && requestedY >= ladder.bottomY) {
    const bottomSupport = findLadderEndSupport(ladder, map, config, ladder.bottomY);
    if (bottomSupport) {
      return {
        ...state,
        position: { x: ladder.x, y: bottomSupport.y },
        velocity: { x: 0, y: 0 },
        mode: 'grounded',
        footholdId: bottomSupport.foothold.id,
        ladderId: null,
      };
    }
    return stepAirborne({
      ...state,
      position: { x: ladder.x, y: ladder.bottomY },
      velocity: { x: 0, y: 0 },
      mode: 'airborne',
      footholdId: null,
      ladderId: null,
    }, map, config, dtSeconds, nowMs, null);
  }

  return {
    ...state,
    position: {
      x: ladder.x,
      y: Math.max(ladder.topY, Math.min(ladder.bottomY, requestedY)),
    },
    velocity: { x: 0, y: 0 },
    mode: 'climbing',
    footholdId: null,
    ladderId: ladder.id,
  };
}

function facingForInput(facing: Facing, input: InputFrame, canTurn: boolean): Facing {
  if (!canTurn || input.moveX === 0) return facing;
  return input.moveX < 0 ? -1 : 1;
}

function horizontalVelocity(
  state: MovementState,
  input: InputFrame,
  config: MovementConfig,
  nowMs: number,
): number {
  if (nowMs < state.knockbackUntilMs) return state.velocity.x;
  return input.moveX * config.speed;
}

function findNearbyLadder(position: Vec2, map: MapDef, config: MovementConfig): Ladder | null {
  const headY = position.y - config.height;
  return map.ladders
    .filter((ladder) => Math.abs(position.x - ladder.x) <= LADDER_X_TOLERANCE
      && ladder.bottomY >= headY - EPSILON
      && ladder.topY <= position.y + EPSILON)
    .sort((a, b) => Math.abs(position.x - a.x) - Math.abs(position.x - b.x)
      || a.id.localeCompare(b.id))[0] ?? null;
}

function findLadderEndSupport(
  ladder: Ladder,
  map: MapDef,
  config: MovementConfig,
  endY: number,
): { foothold: Foothold; y: number } | null {
  const candidates = map.footholds
    .filter((foothold) => ladder.x + config.width / 2 >= foothold.x1 - EPSILON
      && ladder.x - config.width / 2 <= foothold.x2 + EPSILON)
    .map((foothold) => ({ foothold, y: surfaceYAtClamped(foothold, ladder.x) }))
    .filter((candidate) => Math.abs(candidate.y - endY) <= GROUND_SNAP + EPSILON)
    .sort((a, b) => Math.abs(a.y - endY) - Math.abs(b.y - endY)
      || a.foothold.id.localeCompare(b.foothold.id));
  return candidates[0] ?? null;
}

function findGroundSupport(
  map: MapDef,
  newX: number,
  oldX: number,
  oldY: number,
  config: MovementConfig,
  preferredId: string | null,
): { foothold: Foothold; y: number } | null {
  const halfWidth = config.width / 2;
  const candidates = map.footholds
    .filter((foothold) => newX + halfWidth >= foothold.x1 - EPSILON
      && newX - halfWidth <= foothold.x2 + EPSILON)
    .map((foothold) => {
      const projectedOldX = clamp(oldX, foothold.x1, foothold.x2);
      const oldSurfaceY = surfaceYAtClamped(foothold, projectedOldX);
      const newSurfaceY = surfaceYAtClamped(foothold, clamp(newX, foothold.x1, foothold.x2));
      const slope = Math.abs((foothold.y2 - foothold.y1) / (foothold.x2 - foothold.x1));
      const availableSnap = Math.abs(oldX - projectedOldX) * slope + GROUND_SNAP;
      return {
        foothold,
        y: newSurfaceY,
        connected: Math.abs(oldY - oldSurfaceY) <= availableSnap + EPSILON,
        preference: foothold.id === preferredId ? -1 : 0,
      };
    })
    .filter((candidate) => candidate.connected)
    .sort((a, b) => a.preference - b.preference
      || Math.abs(a.y - oldY) - Math.abs(b.y - oldY)
      || a.foothold.id.localeCompare(b.foothold.id));
  const support = candidates[0];
  return support ? { foothold: support.foothold, y: support.y } : null;
}

function findLanding(
  from: Vec2,
  to: Vec2,
  map: MapDef,
  config: MovementConfig,
  ignoredFootholdId: string | null,
  nowMs: number,
  dropThroughUntilMs: number,
): Landing | null {
  const halfWidth = config.width / 2;
  let earliest: Landing | null = null;

  for (const foothold of map.footholds) {
    if (foothold.id === ignoredFootholdId) continue;
    if (foothold.dropThrough
      && nowMs < dropThroughUntilMs
      && surfaceYAtClamped(foothold, from.x) <= from.y + EPSILON) continue;
    for (const footOffset of [-halfWidth, halfWidth]) {
      const candidate = crossingAtFoot(
        foothold,
        from,
        to,
        footOffset,
      );
      if (candidate && (!earliest
        || candidate.time < earliest.time - EPSILON
        || (Math.abs(candidate.time - earliest.time) <= EPSILON
          && candidate.y < earliest.y))) {
        earliest = {
          foothold,
          time: candidate.time,
          x: from.x + (to.x - from.x) * candidate.time,
          y: candidate.y,
        };
      }
    }
  }
  return earliest;
}

function crossingAtFoot(
  foothold: Foothold,
  from: Vec2,
  to: Vec2,
  footOffset: number,
): { time: number; y: number } | null {
  const startX = from.x + footOffset;
  const endX = to.x + footOffset;
  const dx = endX - startX;
  let intervalStart = 0;
  let intervalEnd = 1;

  if (Math.abs(dx) < EPSILON) {
    if (startX < foothold.x1 - EPSILON || startX > foothold.x2 + EPSILON) return null;
  } else {
    const startBound = (foothold.x1 - startX) / dx;
    const endBound = (foothold.x2 - startX) / dx;
    intervalStart = Math.max(0, Math.min(startBound, endBound));
    intervalEnd = Math.min(1, Math.max(startBound, endBound));
    if (intervalStart > intervalEnd + EPSILON) return null;
  }

  const gapAt = (time: number): number => {
    const x = startX + dx * time;
    const y = from.y + (to.y - from.y) * time;
    return y - surfaceYAtClamped(foothold, x);
  };
  const startGap = gapAt(intervalStart);
  const endGap = gapAt(intervalEnd);
  if (startGap > EPSILON || endGap < -EPSILON || endGap <= startGap + EPSILON) return null;

  const time = intervalStart + (intervalEnd - intervalStart)
    * clamp(-startGap / (endGap - startGap), 0, 1);
  const x = startX + dx * time;
  return { time, y: surfaceYAtClamped(foothold, x) };
}

function resolveHorizontalPosition(
  fromX: number,
  requestedX: number,
  footY: number,
  map: MapDef,
  config: MovementConfig,
): number {
  const halfWidth = config.width / 2;
  let x = requestedX;
  if (map.width <= config.width) return map.width / 2;
  x = clamp(x, halfWidth, map.width - halfWidth);

  if (x > fromX) {
    for (const wall of map.walls) {
      if (!bodyOverlapsWallVertically(footY, wall, config.height)) continue;
      if (fromX + halfWidth <= wall.x + EPSILON && x + halfWidth > wall.x) {
        x = Math.min(x, wall.x - halfWidth);
      }
    }
  } else if (x < fromX) {
    for (const wall of map.walls) {
      if (!bodyOverlapsWallVertically(footY, wall, config.height)) continue;
      const wallRight = wall.x + wall.width;
      if (fromX - halfWidth >= wallRight - EPSILON && x - halfWidth < wallRight) {
        x = Math.max(x, wallRight + halfWidth);
      }
    }
  }
  return clamp(x, halfWidth, map.width - halfWidth);
}

function resolveCeiling(
  fromY: number,
  requestedY: number,
  x: number,
  map: MapDef,
  config: MovementConfig,
): number | null {
  const halfWidth = config.width / 2;
  const fromHead = fromY - config.height;
  const requestedHead = requestedY - config.height;
  let resolvedY = requestedY;
  for (const wall of map.walls) {
    const overlapsX = x + halfWidth > wall.x + EPSILON
      && x - halfWidth < wall.x + wall.width - EPSILON;
    const wallBottom = wall.y + wall.height;
    if (overlapsX && fromHead >= wallBottom - EPSILON && requestedHead < wallBottom) {
      resolvedY = Math.max(resolvedY, wallBottom + config.height);
    }
  }
  return resolvedY === requestedY ? null : resolvedY;
}

function bodyOverlapsWallVertically(footY: number, wall: MapDef['walls'][number], height: number): boolean {
  return footY > wall.y + EPSILON && footY - height < wall.y + wall.height - EPSILON;
}

function surfaceYAtClamped(foothold: Foothold, x: number): number {
  const clampedX = clamp(x, foothold.x1, foothold.x2);
  const ratio = (clampedX - foothold.x1) / (foothold.x2 - foothold.x1);
  return foothold.y1 + (foothold.y2 - foothold.y1) * ratio;
}

function resetIfOutOfBounds(state: MovementState, map: MapDef, _nowMs: number): MovementState {
  if (state.position.y <= map.height + 100) return state;
  const spawn = map.spawns.find((candidate) => candidate.id === 'left') ?? map.spawns[0];
  return {
    ...state,
    position: spawn ? { x: spawn.x, y: spawn.y } : { x: 100, y: 0 },
    velocity: { x: 0, y: 0 },
    mode: 'airborne',
    footholdId: null,
    ladderId: null,
    dropThroughUntilMs: 0,
  };
}

function cloneState(state: MovementState): MovementState {
  return {
    ...state,
    position: { ...state.position },
    velocity: { ...state.velocity },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
