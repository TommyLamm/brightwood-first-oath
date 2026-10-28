import { describe, expect, it } from 'vitest';
import type { AttackInstance } from '../src/contracts/index.js';
import { createNextEntityId } from '../src/contracts/helpers.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { deriveCombatUiState } from '../src/app/combat-ui-state.js';
import { startNewGame } from '../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

function newGameplay() {
  const started = startNewGame('測試旅人', catalog, createNextEntityId('combat-ui-state'));
  if ('error' in started) throw new Error(started.error);
  return started.gameplay;
}

function attack(id: string, sourceId: string, skillId: string, startedAtMs: number): AttackInstance {
  return {
    id,
    sourceId,
    skillId,
    startedAtMs,
    facing: 1,
    origin: { x: 100, y: 100 },
    rank: 1,
    hitIds: [],
  };
}

describe('deriveCombatUiState', () => {
  it.each([
    ['basic', 1_550],
    ['heavy-strike', 1_650],
    ['sweep', 1_850],
  ])('derives the active %s action deadline', (skillId, expectedDeadlineMs) => {
    const gameplay = newGameplay();
    gameplay.combat.attacks = [attack('player-attack', gameplay.playerEntityId, skillId, 1_000)];

    expect(deriveCombatUiState(gameplay, catalog, 1_400).actionLockUntilMs).toBe(expectedDeadlineMs);
    expect(deriveCombatUiState(gameplay, catalog, expectedDeadlineMs).actionLockUntilMs).toBe(0);
  });

  it('ignores enemy attacks, expired player attacks, and non-attack skills', () => {
    const gameplay = newGameplay();
    gameplay.combat.attacks = [
      attack('enemy-attack', 'enemy-1', 'basic', 9_000),
      attack('expired-player-attack', gameplay.playerEntityId, 'basic', 1_000),
      attack('player-buff', gameplay.playerEntityId, 'iron-guard', 9_000),
    ];

    expect(deriveCombatUiState(gameplay, catalog, 2_000).actionLockUntilMs).toBe(0);
  });

  it('shows a live buffer through its expiry boundary, hides it after expiry or death, and does not mutate runtime state', () => {
    const gameplay = newGameplay();
    gameplay.combat.attacks = [attack('player-attack', gameplay.playerEntityId, 'sweep', 1_000)];
    gameplay.bufferedAttack = { skillId: 'heavy-strike', expiresAtMs: 1_100 };
    const original = structuredClone(gameplay);

    expect(deriveCombatUiState(null, catalog, 1_100)).toEqual({ actionLockUntilMs: 0, bufferedSkillId: null });
    expect(deriveCombatUiState(gameplay, catalog, 1_100).bufferedSkillId).toBe('heavy-strike');
    expect(deriveCombatUiState(gameplay, catalog, 1_101).bufferedSkillId).toBeNull();

    gameplay.saveData.player.hp = 0;
    expect(deriveCombatUiState(gameplay, catalog, 1_100).bufferedSkillId).toBeNull();
    gameplay.saveData.player.hp = original.saveData.player.hp;

    expect(gameplay).toEqual(original);
  });
});
