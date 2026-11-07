import { describe, expect, it } from 'vitest';
import type { GameCommand } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { startNewGame, stepGameplay, type GameplayState } from '../src/app/gameplay.js';
import { deriveStats } from '../src/domain/progression/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
let sequence = 0;
const nextId = (): string => `cap-${++sequence}`;

function archerInTown(): GameplayState {
  const result = startNewGame('弓術測試', catalog, nextId, 'archer');
  if ('error' in result) throw new Error(result.error);
  const game = result.gameplay;
  game.saveData.player = { ...game.saveData.player, job: 'archer', level: 30 };
  game.saveData.visitedMaps.push('town');
  game.saveData.location = { mapId: 'town', spawnId: 'left' };
  game.monsters = [];
  game.movement = { ...game.movement, position: { x: 320, y: 600 }, velocity: { x: 0, y: 0 }, facing: 1, mode: 'grounded',
    footholdId: worldCatalog.maps.town!.footholds.find((line) => line.x1 <= 320 && line.x2 >= 320 && line.y1 === 600 && line.y2 === 600)!.id };
  return game;
}

function step(game: GameplayState, nowMs: number, dtSeconds: number, command?: Omit<GameCommand, 'seq'>): GameplayState {
  return stepGameplay(game, { catalog, input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
    commands: command ? [{ ...command, seq: ++sequence } as GameCommand] : [], dtSeconds, nowMs, nextEntityId: nextId,
    random: { next: () => 0.5 } }).gameplay!;
}

describe('training target effects', () => {
  it('keeps only the newest 80 effects with projectile flags and positions intact', () => {
    let game = archerInTown();
    const seen: string[] = [];
    for (let shot = 0; shot < 100; shot += 1) {
      const now = 1000 + shot * 1000;
      const stats = deriveStats(game.saveData.player, rulesCatalog);
      game.saveData.player.mp = stats.maxMp; game.saveData.player.hp = stats.maxHp;
      game.monsters = [];
      game = step(game, now, 0, { type: 'attack', payload: { skillId: 'basic' } });
      game = step(game, now + 180, 0.18);
      game = step(game, now + 480, 0.3);
      for (const effect of game.effects) if (!seen.includes(effect.id)) seen.push(effect.id);
    }
    expect(seen.length).toBeGreaterThan(80);
    expect(game.effects).toHaveLength(80);
    expect(game.effects.map(({ id }) => id)).toEqual(seen.slice(-80));
    for (const effect of game.effects) {
      expect(effect.kind).toBe('hit');
      expect(effect.projectile).toBe(true);
      expect(effect.position).toEqual({ x: 480, y: 576 });
    }
  });
});
