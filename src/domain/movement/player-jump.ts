import type { InputFrame, MapDef, MovementConfig, MovementState } from '../../contracts/index.js';
import { stepMovement } from './index.js';

export const PLAYER_JUMP_GRACE_MS = 80;
export const PLAYER_JUMP_BUFFER_MS = 100;

/** Runtime input memory only; it is never part of a save or a monster's movement. */
export type PlayerJumpMemory = { graceUntilMs: number; bufferedUntilMs: number };

export function stepPlayerMovement(
  state: MovementState,
  input: InputFrame,
  map: MapDef,
  config: MovementConfig,
  dtSeconds: number,
  nowMs: number,
  memory?: Readonly<PlayerJumpMemory>,
): { movement: MovementState; memory: PlayerJumpMemory; jumped: boolean } {
  const supported = state.mode === 'grounded' && map.footholds.some((f) => f.id === state.footholdId);
  const assistAllowed = state.mode !== 'dead' && nowMs >= state.knockbackUntilMs && nowMs >= state.dropThroughUntilMs;
  let graceUntilMs = assistAllowed ? supported ? nowMs + PLAYER_JUMP_GRACE_MS : memory?.graceUntilMs ?? 0 : 0;
  let bufferedUntilMs = assistAllowed && !input.downHeld ? memory?.bufferedUntilMs ?? 0 : 0;
  if (graceUntilMs < nowMs) graceUntilMs = 0;
  if (bufferedUntilMs < nowMs) bufferedUntilMs = 0;
  if (assistAllowed && input.jumpPressed && !input.downHeld && state.mode === 'airborne') {
    bufferedUntilMs = nowMs + PLAYER_JUMP_BUFFER_MS;
  }

  const buffered = bufferedUntilMs > 0;
  const requestJump = input.jumpPressed || buffered;
  const graceJump = assistAllowed && state.mode === 'airborne' && graceUntilMs > 0 && requestJump && !input.downHeld;
  const from = graceJump ? {
    ...state,
    velocity: { ...state.velocity, y: config.jumpVelocity },
  } : state;
  // A queued normal jump must not become a down-jump after the player changes direction.
  const movementInput = graceJump ? { ...input, jumpPressed: false }
    : buffered && state.mode === 'grounded' ? { ...input, jumpPressed: true, downHeld: false } : input;
  let movement = stepMovement(from, movementInput, map, config, dtSeconds, nowMs);
  const climbing = state.mode === 'climbing' && map.ladders.some((l) => l.id === state.ladderId);
  let jumped = movement.mode === 'airborne' && movement.velocity.y < 0
    && (graceJump || (requestJump && (supported || climbing)));

  if (assistAllowed && buffered && movement.mode === 'grounded' && state.mode === 'airborne') {
    // Land through the normal collision sweep, then launch once on this same tick.
    // No extra integration step: horizontal distance and jump height remain unchanged.
    movement = { ...movement, mode: 'airborne', footholdId: null, ladderId: null,
      velocity: { ...movement.velocity, y: config.jumpVelocity } };
    jumped = true;
  }

  const dropping = movementInput.jumpPressed && input.downHeld && supported
    && map.footholds.some((f) => f.id === state.footholdId && f.dropThrough);
  const resetAfterFall = movement.mode === 'airborne' && movement.velocity.x === 0 && movement.velocity.y === 0
    && state.position.y > map.height;
  if (jumped || dropping || movement.mode === 'climbing' || movement.mode === 'dead' || resetAfterFall) {
    graceUntilMs = 0;
    bufferedUntilMs = 0;
  } else if (movement.mode === 'grounded' && assistAllowed) {
    graceUntilMs = nowMs + PLAYER_JUMP_GRACE_MS;
  }
  return { movement, memory: { graceUntilMs, bufferedUntilMs }, jumped };
}
