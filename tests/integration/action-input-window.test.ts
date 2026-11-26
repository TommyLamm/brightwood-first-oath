import { describe, expect, it } from 'vitest';
import { startNewGame, stepGameplay, type GameplayState } from '../../src/app/gameplay.js';
import { rulesCatalog as rules } from '../../src/content/rules/index.js';
import { worldCatalog as world } from '../../src/content/world/index.js';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';
import type { InputFrame, PlayerJob } from '../../src/contracts/index.js';

const catalog = { rules, world };
const nextEntityId = createNextEntityId('input');
const idle: InputFrame = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };
function tick(gameplay: GameplayState, nowMs: number, input = idle, skills: string[] = []) {
  return stepGameplay(gameplay, {
    catalog, nowMs, input, nextEntityId, random: createSeededRandom(1), dtSeconds: 1 / 60,
    commands: skills.map((skillId, seq) => ({ seq, type: 'attack', payload: { skillId } })),
  });
}
function swinging(job: PlayerJob) {
  const started = startNewGame('旅人', catalog, nextEntityId, job);
  if ('error' in started) throw Error(started.error);
  started.gameplay.monsters = [];
  const standing = tick(started.gameplay, 983).gameplay!;
  const swung = tick(standing, 1000, idle, ['basic']).gameplay!;
  expect(swung.combat.attacks).toHaveLength(1);
  return swung;
}

describe('100ms action input windows', () => {
  it.each([['mage', 1240, 1257], ['rogue', 1420, 1420]] as const)(
    'jumps on the first legal %s movement tick only after a late normal press', (job, end, free) => {
      const initial = swinging(job);
      const jump = { ...idle, jumpPressed: true };
      const early = tick(initial, end - 150, jump).gameplay!;
      expect(tick(early, free).jumped).toBeFalsy();
      const queued = tick(initial, end - 100, jump).gameplay!;
      const again = tick(queued, end - 50, jump).gameplay!;
      expect(again.movement.mode).toBe('grounded');
      const first = tick(again, free);
      expect(first.jumped).toBe(true);
      expect(tick(first.gameplay!, free + 17).jumped).toBeFalsy();
      const down = tick(initial, end - 50, { ...jump, downHeld: true }).gameplay!;
      expect(tick(down, free).jumped).toBeFalsy();
      const hurt = { ...again, movement: { ...again.movement, knockbackUntilMs: free + 180 } };
      expect(tick(hurt, free).jumped).toBeFalsy();
    });

  it('executes a queued jump at the blink destination after its windup', () => {
    const initial = swinging('mage');
    initial.saveData.player = { ...initial.saveData.player, level: 14, job: 'mage', skillRanks: { 'mage-blink': 1 } };
    const cast = tick(initial, 2000, idle, ['mage-blink']).gameplay!;
    const queued = tick(cast, 2050, { ...idle, jumpPressed: true }).gameplay!;
    const arrived = tick(queued, 2100).gameplay!;
    expect(arrived.movement.position.x).toBeGreaterThan(cast.movement.position.x);
    expect(tick(arrived, 2117).jumped).toBe(true);
  });

  it('coalesces late taps into one swing, ignores early taps and yields to a queued skill', () => {
    const initial = swinging('swordsman');
    const early = tick(initial, 1449, idle, ['basic']).gameplay!;
    expect(early.bufferedAttack).toBeUndefined();
    const queued = tick(initial, 1500, idle, ['basic', 'basic', 'basic']).gameplay!;
    expect(queued.bufferedAttack?.readyAtMs).toBe(1550);
    const before = tick(queued, 1549).gameplay!;
    expect(before.combat.attacks.filter(a => a.startedAtMs > 1000)).toHaveLength(0);
    const ready = tick(before, 1550).gameplay!;
    expect(ready.combat.attacks.filter(a => a.startedAtMs === 1550)).toHaveLength(1);
    expect(ready.bufferedAttack).toBeUndefined();
    expect(tick(ready, 2100).gameplay!.combat.attacks).toHaveLength(0);
    queued.saveData.player = { ...queued.saveData.player, level: 10, job: 'swordsman', mp: 50, skillRanks: { 'heavy-strike': 1 } };
    const priority = tick(queued, 1550, idle, ['basic', 'heavy-strike']).gameplay!;
    expect(priority.combat.attacks.map(a => a.skillId)).toEqual(['heavy-strike']);
    expect(priority.saveData.player.mp).toBe(44);
  });
});
