import { describe, expect, it } from 'vitest';
import type { InputFrame, MapDef, MovementState } from '../src/contracts/index.js';
import { createMovement, stepMovement } from '../src/domain/movement/index.js';
import { stepPlayerMovement } from '../src/domain/movement/player-jump.js';
import { movement as config } from '../src/content/rules/progression.js';

const idle: InputFrame = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };
const dt = 1 / 60;
const map: MapDef = {
  id: 'jump-test', name: 'Jump test', width: 400, height: 720, themeKey: 'camp', musicKey: 'test', safe: true, boss: false,
  spawns: [{ id: 'left', x: 100, y: 600 }],
  footholds: [
    { id: 'ground', x1: 0, x2: 400, y1: 600, y2: 600, dropThrough: false },
    { id: 'ledge', x1: 0, x2: 100, y1: 500, y2: 500, dropThrough: true },
  ],
  ladders: [{ id: 'ladder', x: 100, topY: 500, bottomY: 600 }], walls: [], portals: [], npcs: [], monsters: [],
};
const grounded = (x = 100, y = 600, footholdId = 'ground'): MovementState => ({
  ...createMovement({ x, y }), mode: 'grounded', footholdId,
});
const leavingLedge = () => stepPlayerMovement(grounded(111, 500, 'ledge'), { ...idle, moveX: 1 }, map, config, dt, 100);

describe('player jump timing', () => {
  it('preserves the exact normal jump trajectory and does not mutate its input state', () => {
    const state = grounded();
    const original = structuredClone(state);
    const input = { ...idle, jumpPressed: true };
    const result = stepPlayerMovement(state, input, map, config, dt, 100);
    expect(result.movement).toEqual(stepMovement(state, input, map, config, dt, 100));
    expect(result.jumped).toBe(true);
    expect(result.memory).toEqual({ graceUntilMs: 0, bufferedUntilMs: 0 });
    expect(state).toEqual(original);
  });

  it('accepts a late press through the 80ms ledge window only once', () => {
    const left = leavingLedge();
    expect(left.movement.mode).toBe('airborne');
    const jumped = stepPlayerMovement(left.movement, { ...idle, jumpPressed: true }, map, config, dt, 180, left.memory);
    expect(jumped.jumped).toBe(true);
    expect(jumped.movement.velocity.y).toBeLessThan(0);
    const again = stepPlayerMovement(jumped.movement, { ...idle, jumpPressed: true }, map, config, dt, 197, jumped.memory);
    expect(again.jumped).toBe(false);
    expect(again.movement.velocity.y).toBeGreaterThan(jumped.movement.velocity.y);
  });

  it('does not grant a late air jump after the grace window or without prior support', () => {
    const left = leavingLedge();
    const expired = stepPlayerMovement(left.movement, { ...idle, jumpPressed: true }, map, config, dt, 181, left.memory);
    expect(expired.jumped).toBe(false);
    expect(expired.movement.velocity.y).toBeGreaterThan(0);
    const spawned = stepPlayerMovement(createMovement({ x: 200, y: 300 }), { ...idle, jumpPressed: true }, map, config, dt, 10);
    expect(spawned.jumped).toBe(false);
    expect(spawned.movement.velocity.y).toBeGreaterThan(0);
  });

  it('consumes an early press on the landing tick without a second physics step', () => {
    const falling = { ...createMovement({ x: 220, y: 590 }), velocity: { x: 0, y: 300 } };
    const queued = stepPlayerMovement(falling, { ...idle, moveX: 1, jumpPressed: true }, map, config, dt, 100);
    expect(queued.jumped).toBe(false);
    const landed = stepPlayerMovement(queued.movement, { ...idle, moveX: 1 }, map, config, dt, 117, queued.memory);
    expect(landed.jumped).toBe(true);
    expect(landed.movement.mode).toBe('airborne');
    expect(landed.movement.position.y).toBe(600);
    expect(landed.movement.velocity.y).toBe(config.jumpVelocity);
    const collisionOnly = stepMovement(queued.movement, { ...idle, moveX: 1 }, map, config, dt, 117);
    expect(landed.movement.position).toEqual(collisionOnly.position);
    expect(landed.memory).toEqual({ graceUntilMs: 0, bufferedUntilMs: 0 });
    const next = stepPlayerMovement(landed.movement, idle, map, config, dt, 134, landed.memory);
    expect(next.jumped).toBe(false);
  });

  it('accepts a 100ms landing buffer but discards an expired press', () => {
    const falling = { ...createMovement({ x: 220, y: 598 }), velocity: { x: 0, y: 200 } };
    const memory = { graceUntilMs: 0, bufferedUntilMs: 200 };
    expect(stepPlayerMovement(falling, idle, map, config, dt, 200, memory).jumped).toBe(true);
    const late = stepPlayerMovement(falling, idle, map, config, dt, 201, memory);
    expect(late.jumped).toBe(false);
    expect(late.movement.mode).toBe('grounded');
  });

  it('preserves intentional down-jumps and never buffers them into an automatic bounce', () => {
    const dropped = stepPlayerMovement(grounded(80, 500, 'ledge'), { ...idle, downHeld: true, jumpPressed: true }, map, config, dt, 1000);
    expect(dropped.jumped).toBe(false);
    expect(dropped.movement.velocity.y).toBeGreaterThan(0);
    expect(dropped.movement.dropThroughUntilMs).toBe(1300);
    expect(dropped.memory).toEqual({ graceUntilMs: 0, bufferedUntilMs: 0 });
    const pressWhileDropping = stepPlayerMovement(dropped.movement, { ...idle, jumpPressed: true }, map, config, dt, 1017, dropped.memory);
    expect(pressWhileDropping.jumped).toBe(false);
    expect(pressWhileDropping.memory.bufferedUntilMs).toBe(0);
  });

  it('cancels a queued jump when down is held and does not turn it into a drop', () => {
    const state = grounded(80, 500, 'ledge');
    const result = stepPlayerMovement(state, { ...idle, downHeld: true }, map, config, dt, 150,
      { graceUntilMs: 0, bufferedUntilMs: 200 });
    expect(result.movement.mode).toBe('grounded');
    expect(result.movement.dropThroughUntilMs).toBe(0);
    expect(result.memory.bufferedUntilMs).toBe(0);
  });

  it('clears queued input on ladder attachment and preserves a direct ladder jump', () => {
    const climbing = stepPlayerMovement(createMovement({ x: 100, y: 550 }), { ...idle, climbY: -1 }, map, config, dt, 100,
      { graceUntilMs: 0, bufferedUntilMs: 150 });
    expect(climbing.movement.mode).toBe('climbing');
    expect(climbing.memory).toEqual({ graceUntilMs: 0, bufferedUntilMs: 0 });
    const jumped = stepPlayerMovement(climbing.movement, { ...idle, jumpPressed: true }, map, config, dt, 117, climbing.memory);
    expect(jumped.jumped).toBe(true);
    expect(jumped.movement).toEqual(stepMovement(climbing.movement, { ...idle, jumpPressed: true }, map, config, dt, 117));
  });

  it('does not use grace or queued jumps to cancel damage knockback', () => {
    const state = { ...createMovement({ x: 200, y: 550 }), velocity: { x: 100, y: 150 }, knockbackUntilMs: 1000 };
    const result = stepPlayerMovement(state, { ...idle, jumpPressed: true }, map, config, dt, 150,
      { graceUntilMs: 200, bufferedUntilMs: 200 });
    expect(result.jumped).toBe(false);
    expect(result.movement.velocity.x).toBe(100);
    expect(result.movement.velocity.y).toBeGreaterThan(150);
    expect(result.memory).toEqual({ graceUntilMs: 0, bufferedUntilMs: 0 });
  });

  it('clears jump memory on death and fall reset rather than jumping at the respawn point', () => {
    const memory = { graceUntilMs: 200, bufferedUntilMs: 200 };
    const dead = { ...grounded(), mode: 'dead' as const };
    const result = stepPlayerMovement(dead, idle, map, config, dt, 100, memory);
    expect(result.movement).toEqual(dead);
    expect(result.memory).toEqual({ graceUntilMs: 0, bufferedUntilMs: 0 });
    const fallen = stepPlayerMovement(createMovement({ x: 200, y: 850 }), idle, map, config, dt, 100, memory);
    expect(fallen.jumped).toBe(false);
    expect(fallen.movement.position).toEqual({ x: 100, y: 600 });
    expect(fallen.memory).toEqual({ graceUntilMs: 0, bufferedUntilMs: 0 });
  });
});
