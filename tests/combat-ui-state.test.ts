import { describe, expect, it } from 'vitest';
import type { AttackInstance, PlayerJob } from '../src/contracts/index.js';
import { createNextEntityId } from '../src/contracts/helpers.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { deriveCombatUiState } from '../src/app/combat-ui-state.js';
import { startNewGame } from '../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

function newGameplay(job: PlayerJob = 'swordsman') {
  const started = startNewGame('測試旅人', catalog, createNextEntityId('combat-ui-state'), job);
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
    ['mage-blink', 1_350],
    ['mage-mana-bolt', 2_000],
  ])('derives the active %s action deadline', (skillId, expectedDeadlineMs) => {
    const gameplay = newGameplay();
    gameplay.combat.attacks = [attack('player-attack', gameplay.playerEntityId, skillId, 1_000)];

    expect(deriveCombatUiState(gameplay, catalog, Math.min(1_400, expectedDeadlineMs-1)).actionLockUntilMs).toBe(expectedDeadlineMs);
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

  it('shows the current skill only until the end of its wind-up', () => {
    const gameplay = newGameplay('archer');
    gameplay.combat.attacks = [attack('player-attack', gameplay.playerEntityId, 'marksman-snipe', 1_000)];
    expect(deriveCombatUiState(gameplay, catalog, 1_549).windingUpSkillId).toBe('marksman-snipe');
    const released = deriveCombatUiState(gameplay, catalog, 1_550);
    expect(released.windingUpSkillId).toBeUndefined();
    expect(released.actionLockUntilMs).toBeGreaterThan(1_550);
    gameplay.combat.attacks = [attack('player-basic', gameplay.playerEntityId, 'bow-basic', 1_000)];
    expect(deriveCombatUiState(gameplay, catalog, 1_001).windingUpSkillId).toBeUndefined();
  });

  it('shows a live buffer through its expiry boundary, hides it after expiry or death, and does not mutate runtime state', () => {
    const gameplay = newGameplay();
    gameplay.combat.attacks = [attack('player-attack', gameplay.playerEntityId, 'sweep', 1_000)];
    gameplay.bufferedAttack = { skillId: 'heavy-strike', expiresAtMs: 1_100 };
    const original = structuredClone(gameplay);

    expect(deriveCombatUiState(null, catalog, 1_100)).toEqual({ actionLockUntilMs: 0, bufferedSkillId: null, stanceBlock: null });
    expect(deriveCombatUiState(gameplay, catalog, 1_100).bufferedSkillId).toBe('heavy-strike');
    expect(deriveCombatUiState(gameplay, catalog, 1_101).bufferedSkillId).toBeNull();

    gameplay.saveData.player.hp = 0;
    expect(deriveCombatUiState(gameplay, catalog, 1_100).bufferedSkillId).toBeNull();
    gameplay.saveData.player.hp = original.saveData.player.hp;

    expect(gameplay).toEqual(original);
  });

  it.each([
    ['mage', 'airborne', 0, 'airborne'],
    ['rogue', 'airborne', 0, 'airborne'],
    ['archer', 'airborne', 0, null],
    ['archer', 'climbing', 0, 'climbing'],
    ['mage', 'grounded', 1_001, 'knockback'],
    ['mage', 'grounded', 1_000, null],
    ['swordsman', 'airborne', 0, null],
  ] as const)('reflects %s attack restrictions while %s', (job, mode, knockbackUntilMs, expected) => {
    const gameplay = newGameplay(job);
    gameplay.movement = { ...gameplay.movement, mode, knockbackUntilMs };
    expect(deriveCombatUiState(gameplay, catalog, 1_000).stanceBlock).toBe(expected);
  });
});
