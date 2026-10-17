import { describe, expect, it } from 'vitest';
import type { InputFrame, MapDef, MovementConfig, MovementState } from '../src/contracts/index.js';
import { createMovement, stepMovement } from '../src/domain/movement/index.js';

const config: MovementConfig = {
  speed: 120,
  climbSpeed: 90,
  gravity: 900,
  jumpVelocity: -360,
  terminalVelocity: 700,
  width: 24,
  height: 44,
};

const neutral: InputFrame = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };

function makeMap(overrides: Partial<MapDef> = {}): MapDef {
  return {
    id: 'movement-test',
    name: 'Movement test',
    width: 400,
    height: 720,
    themeKey: 'test',
    musicKey: 'test',
    safe: true,
    spawns: [{ id: 'left', x: 100, y: 600 }],
    footholds: [{ id: 'ground', x1: 0, y1: 600, x2: 400, y2: 600, dropThrough: false }],
    ladders: [],
    walls: [],
    portals: [],
    npcs: [],
    monsters: [],
    boss: false,
    ...overrides,
  };
}

function grounded(position: { x: number; y: number }, footholdId = 'ground'): MovementState {
  return {
    ...createMovement(position),
    mode: 'grounded',
    footholdId,
  };
}

describe('movement', () => {
  it('creates an airborne state using the foot pivot', () => {
    expect(createMovement({ x: 24, y: 600 })).toEqual({
      position: { x: 24, y: 600 },
      velocity: { x: 0, y: 0 },
      facing: 1,
      mode: 'airborne',
      footholdId: null,
      ladderId: null,
      dropThroughUntilMs: 0,
      knockbackUntilMs: 0,
    });
  });

  it('uses config speed in air and stops horizontal movement when released', () => {
    const map = makeMap({ footholds: [] });
    const moved = stepMovement(createMovement({ x: 100, y: 200 }), { ...neutral, moveX: 1 }, map, config, 0.5, 500);
    expect(moved.position.x).toBe(160);
    expect(moved.facing).toBe(1);
    const released = stepMovement(moved, neutral, map, config, 0.1, 600);
    expect(released.position.x).toBe(160);
    expect(released.velocity.x).toBe(0);
  });

  it('preserves knockback horizontal speed while gravity continues', () => {
    const state = {
      ...createMovement({ x: 100, y: 200 }),
      velocity: { x: 140, y: 0 },
      knockbackUntilMs: 1_000,
    };
    const moved = stepMovement(state, { ...neutral, moveX: -1 }, makeMap({ footholds: [] }), config, 0.1, 500);
    expect(moved.position.x).toBe(114);
    expect(moved.velocity.x).toBe(140);
    expect(moved.velocity.y).toBeGreaterThan(0);
    expect(moved.facing).toBe(1);
  });

  it('allows one grounded jump and does not grant an air jump', () => {
    const map = makeMap();
    const jumped = stepMovement(grounded({ x: 100, y: 600 }), { ...neutral, jumpPressed: true }, map, config, 1 / 60, 100);
    expect(jumped.mode).toBe('airborne');
    expect(jumped.footholdId).toBeNull();
    expect(jumped.position.y).toBeLessThan(600);
    const next = stepMovement(jumped, { ...neutral, jumpPressed: true }, map, config, 1 / 60, 117);
    expect(next.position.y).toBeLessThan(jumped.position.y);
    expect(next.velocity.y).toBeGreaterThan(jumped.velocity.y);
  });

  it('sweeps a fast fall and lands on the first foothold crossed', () => {
    const map = makeMap({
      footholds: [
        { id: 'upper', x1: 50, y1: 500, x2: 350, y2: 500, dropThrough: true },
        { id: 'ground', x1: 0, y1: 600, x2: 400, y2: 600, dropThrough: false },
      ],
    });
    const falling: MovementState = {
      ...createMovement({ x: 100, y: 300 }),
      velocity: { x: 0, y: 650 },
    };
    const landed = stepMovement(falling, neutral, map, config, 0.5, 500);
    expect(landed.mode).toBe('grounded');
    expect(landed.footholdId).toBe('upper');
    expect(landed.position.y).toBe(500);
  });

  it('does not collide with a one-way platform from below', () => {
    const map = makeMap({
      footholds: [{ id: 'platform', x1: 50, y1: 500, x2: 350, y2: 500, dropThrough: true }],
    });
    const jumping = stepMovement(
      { ...createMovement({ x: 100, y: 550 }), velocity: { x: 0, y: -300 } },
      neutral,
      map,
      config,
      0.1,
      100,
    );
    expect(jumping.mode).toBe('airborne');
    expect(jumping.footholdId).toBeNull();
    expect(jumping.position.y).toBeLessThan(550);
  });

  it('follows a slope continuously and will not snap up to a nearby high platform', () => {
    const slopeMap = makeMap({
      footholds: [
        { id: 'slope-a', x1: 0, y1: 600, x2: 100, y2: 550, dropThrough: false },
        { id: 'slope-b', x1: 100, y1: 550, x2: 200, y2: 500, dropThrough: false },
      ],
    });
    const onSlope = stepMovement(grounded({ x: 100, y: 550 }, 'slope-a'), { ...neutral, moveX: 1 }, slopeMap, {
      ...config,
      speed: 240,
    }, 0.1, 100);
    expect(onSlope.mode).toBe('grounded');
    expect(onSlope.footholdId).toBe('slope-b');
    expect(onSlope.position.x).toBe(124);
    expect(onSlope.position.y).toBe(538);

    const platformMap = makeMap({
      footholds: [
        { id: 'ground', x1: 0, y1: 600, x2: 400, y2: 600, dropThrough: false },
        { id: 'high-platform', x1: 90, y1: 500, x2: 250, y2: 500, dropThrough: true },
      ],
    });
    const walking = stepMovement(grounded({ x: 100, y: 600 }), { ...neutral, moveX: 1 }, platformMap, config, 1 / 60, 100);
    expect(walking.mode).toBe('grounded');
    expect(walking.footholdId).toBe('ground');
    expect(walking.position.y).toBe(600);
  });

  it('drops through only a drop-through foothold and reaches the lower ground', () => {
    const map = makeMap({
      footholds: [
        { id: 'ground', x1: 0, y1: 600, x2: 400, y2: 600, dropThrough: false },
        { id: 'platform', x1: 50, y1: 500, x2: 350, y2: 500, dropThrough: true },
      ],
    });
    const dropped = stepMovement(
      grounded({ x: 100, y: 500 }, 'platform'),
      { ...neutral, jumpPressed: true, downHeld: true },
      map,
      config,
      1 / 60,
      1_000,
    );
    expect(dropped.mode).toBe('airborne');
    expect(dropped.dropThroughUntilMs).toBe(1_300);
    expect(dropped.position.y).toBeGreaterThan(500);

    let falling = dropped;
    let nowMs = 1_017;
    for (let index = 0; index < 60 && falling.mode !== 'grounded'; index += 1) {
      falling = stepMovement(falling, neutral, map, config, 1 / 60, nowMs);
      nowMs += 17;
    }
    expect(falling.mode).toBe('grounded');
    expect(falling.footholdId).toBe('ground');
    expect(falling.position.y).toBe(600);
  });

  it('does not drop through the main ground', () => {
    const jumped = stepMovement(
      grounded({ x: 100, y: 600 }),
      { ...neutral, jumpPressed: true, downHeld: true },
      makeMap(),
      config,
      1 / 60,
      100,
    );
    expect(jumped.dropThroughUntilMs).toBe(0);
    expect(jumped.mode).toBe('airborne');
    expect(jumped.position.y).toBeLessThan(600);
  });

  it('ignores the dropped layer during its timer but can land on a lower platform', () => {
    const map = makeMap({
      footholds: [
        { id: 'ground', x1: 0, y1: 600, x2: 400, y2: 600, dropThrough: false },
        { id: 'dropped', x1: 50, y1: 500, x2: 350, y2: 500, dropThrough: true },
        { id: 'lower-platform', x1: 50, y1: 530, x2: 350, y2: 530, dropThrough: true },
      ],
    });
    let falling = stepMovement(
      grounded({ x: 100, y: 500 }, 'dropped'),
      { ...neutral, jumpPressed: true, downHeld: true },
      map,
      config,
      1 / 60,
      1_000,
    );
    let nowMs = 1_017;
    for (let index = 0; index < 30 && falling.mode !== 'grounded'; index += 1) {
      falling = stepMovement(falling, neutral, map, config, 1 / 60, nowMs);
      nowMs += 17;
    }
    expect(falling.mode).toBe('grounded');
    expect(falling.footholdId).toBe('lower-platform');
    expect(nowMs).toBeLessThan(1_300);
  });

  it('climbs to a top foothold and lands normally at the ladder bottom', () => {
    const map = makeMap({
      footholds: [
        { id: 'ground', x1: 0, y1: 600, x2: 400, y2: 600, dropThrough: false },
        { id: 'top', x1: 80, y1: 500, x2: 120, y2: 500, dropThrough: true },
      ],
      ladders: [{ id: 'ladder', x: 100, topY: 500, bottomY: 600 }],
    });
    let climbing = stepMovement(createMovement({ x: 100, y: 550 }), { ...neutral, climbY: -1 }, map, config, 1 / 60, 100);
    for (let index = 0; index < 60 && climbing.mode !== 'grounded'; index += 1) {
      climbing = stepMovement(climbing, { ...neutral, climbY: -1 }, map, config, 1 / 60, 117 + index * 17);
    }
    expect(climbing.mode).toBe('grounded');
    expect(climbing.footholdId).toBe('top');
    expect(climbing.position.y).toBe(500);

    const atBottom: MovementState = {
      ...climbing,
      position: { x: 100, y: 590 },
      velocity: { x: 0, y: 0 },
      mode: 'climbing',
      footholdId: null,
      ladderId: 'ladder',
    };
    const landed = stepMovement(atBottom, { ...neutral, climbY: 1 }, map, config, 0.2, 2_000);
    expect(landed.mode).toBe('grounded');
    expect(landed.footholdId).toBe('ground');
    expect(landed.position.y).toBe(600);
  });

  it('can jump away from a ladder', () => {
    const map = makeMap({ ladders: [{ id: 'ladder', x: 100, topY: 400, bottomY: 600 }] });
    const state: MovementState = {
      ...createMovement({ x: 100, y: 550 }),
      mode: 'climbing',
      ladderId: 'ladder',
    };
    const jumped = stepMovement(state, { ...neutral, jumpPressed: true }, map, config, 1 / 60, 100);
    expect(jumped.mode).toBe('airborne');
    expect(jumped.ladderId).toBeNull();
    expect(jumped.position.y).toBeLessThan(550);
  });

  it('blocks walls and ceilings without using one-way footholds as ceilings', () => {
    const wallMap = makeMap({ walls: [{ x: 130, y: 400, width: 20, height: 200 }] });
    const blocked = stepMovement(grounded({ x: 100, y: 500 }), { ...neutral, moveX: 1 }, wallMap, config, 0.5, 100);
    expect(blocked.position.x).toBe(118);

    const ceilingMap = makeMap({
      footholds: [
        { id: 'ground', x1: 0, y1: 500, x2: 400, y2: 500, dropThrough: false },
        { id: 'platform', x1: 50, y1: 450, x2: 350, y2: 450, dropThrough: true },
      ],
      walls: [{ x: 80, y: 430, width: 120, height: 10 }],
    });
    const jump = stepMovement(grounded({ x: 100, y: 500 }), { ...neutral, jumpPressed: true }, ceilingMap, {
      ...config,
      jumpVelocity: -600,
    }, 0.1, 100);
    expect(jump.mode).toBe('airborne');
    expect(jump.position.y).toBe(484);
  });

  it('clamps world edges and respawns after falling below the map', () => {
    const map = makeMap({ width: 200, footholds: [] });
    const clamped = stepMovement(createMovement({ x: 30, y: 300 }), { ...neutral, moveX: -1 }, map, config, 0.25, 100);
    expect(clamped.position.x).toBe(12);

    const fallen = stepMovement(createMovement({ x: 180, y: 850 }), neutral, map, config, 1 / 60, 100);
    expect(fallen.position).toEqual({ x: 100, y: 600 });
    expect(fallen.mode).toBe('airborne');
    expect(fallen.velocity).toEqual({ x: 0, y: 0 });
  });

  it('does not move a dead state', () => {
    const dead: MovementState = { ...grounded({ x: 100, y: 600 }), mode: 'dead' };
    const result = stepMovement(dead, { ...neutral, moveX: 1, jumpPressed: true }, makeMap(), config, 1, 10_000);
    expect(result).toEqual(dead);
    expect(result).not.toBe(dead);
  });
});
