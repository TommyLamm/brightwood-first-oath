import { describe, expect, it } from 'vitest';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { createNextEntityId } from '../../src/contracts/helpers.js';
import { completeMapTransition, startNewGame, stepGameplay } from '../../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const idle = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false } as const;

describe('player jump gameplay wiring', () => {
  it('launches the queued jump through gameplay and keeps input memory out of saved data', () => {
    const nextEntityId = createNextEntityId('jump-integration');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.monsters = [];
    gameplay.movement = { ...gameplay.movement, position: { x: 100, y: 598 }, velocity: { x: 0, y: 300 } };
    const result = stepGameplay(gameplay, { catalog, commands: [], input: { ...idle, jumpPressed: true }, dtSeconds: 1 / 60,
      nowMs: 100, random: { next: () => .5 }, nextEntityId });
    expect(result.jumped).toBe(true);
    expect(result.gameplay!.movement.position.y).toBe(600);
    expect(result.gameplay!.movement.velocity.y).toBe(catalog.rules.movement.jumpVelocity);
    expect(result.gameplay!.jumpAssist).toEqual({ graceUntilMs: 0, bufferedUntilMs: 0 });
    expect(JSON.stringify(result.gameplay!.saveData)).not.toContain('jumpAssist');
  });

  it('clears timing windows when travelling to another map', () => {
    const nextEntityId = createNextEntityId('jump-transition');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    started.gameplay.jumpAssist = { graceUntilMs: 180, bufferedUntilMs: 200 };
    started.gameplay.pendingTransition = { mapId: 'town', spawnId: 'left', after: 'travel' };
    const result = completeMapTransition(started.gameplay, catalog, nextEntityId, 150);
    expect(result.screen).toBe('playing');
    expect(result.gameplay!.saveData.location.mapId).toBe('town');
    expect(result.gameplay!.jumpAssist).toBeUndefined();
  });
});
