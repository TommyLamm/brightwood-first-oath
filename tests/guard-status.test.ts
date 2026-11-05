import { describe, expect, it } from 'vitest';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { createNextEntityId } from '../src/contracts/helpers.js';
import { startNewGame, stepGameplay } from '../src/app/gameplay.js';
import { deriveActiveGuard } from '../src/app/guard-status.js';
import { createInitialAppState, createUiSnapshot } from '../src/app/state.js';
import { deriveStats } from '../src/domain/progression/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
function castGuard() {
  const nextEntityId = createNextEntityId('guard-ui');
  const started = startNewGame('旅人', catalog, nextEntityId);
  if ('error' in started) throw Error(started.error);
  started.gameplay.monsters = [];
  Object.assign(started.gameplay.saveData.player, { level: 14, job: 'swordsman', mp: 50, skillRanks: { 'iron-guard': 2 } });
  return stepGameplay(started.gameplay, { catalog, commands: [{ seq: 1, type: 'attack', payload: { skillId: 'iron-guard' } }],
    input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false }, dtSeconds: 0,
    nowMs: 1000, random: { next: () => .5 }, nextEntityId }).gameplay!;
}
describe('active guard explanation', () => {
  it('derives the actual cast bonus without folding it into permanent/AP-preview stats', () => {
    const gameplay = castGuard();
    const view = createUiSnapshot({ ...createInitialAppState(), catalog, gameplay, screen: 'playing', gameTimeMs: 1000 })!;
    expect(view.activeGuard).toEqual({ defenseBonus: 6, remainingSeconds: 30 });
    expect(view.stats?.defense).toBe(deriveStats(gameplay.saveData.player, rulesCatalog).defense);
    expect(gameplay.guardUntilMs).toBe(31_000);
  });
  it('removes the bonus at the exact expiry and hides absent or unlearned guard', () => {
    const gameplay = castGuard();
    expect(deriveActiveGuard(gameplay, catalog, 30_999)).toEqual({ defenseBonus: 6, remainingSeconds: 1 });
    expect(deriveActiveGuard(gameplay, catalog, 31_000)).toBeNull();
    gameplay.saveData.player.skillRanks = {};
    expect(deriveActiveGuard(gameplay, catalog, 1000)).toBeNull();
    expect(deriveActiveGuard(null, catalog, 1000)).toBeNull();
  });
  it('keeps derived countdown data outside gameplay and character saves', () => {
    const gameplay = castGuard(); const original = JSON.stringify(gameplay);
    const status = deriveActiveGuard(gameplay, catalog, 2000)!; status.defenseBonus = 999;
    expect(deriveActiveGuard(gameplay, catalog, 2000)).toEqual({ defenseBonus: 6, remainingSeconds: 29 });
    expect(JSON.stringify(gameplay)).toBe(original);
  });
});
