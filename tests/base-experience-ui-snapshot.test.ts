import { describe, expect, it } from 'vitest';
import type { AttackInstance, ContentCatalog } from '../src/contracts/index.js';
import { createInitialAppState, createUiSnapshot } from '../src/app/state.js';
import { startNewGame } from '../src/app/gameplay.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';

const catalog: ContentCatalog = { rules: rulesCatalog, world: worldCatalog };

function newGameplay() {
  const initial = createInitialAppState(2, 'base-experience-ui-snapshot');
  const started = startNewGame('測試旅人', catalog, initial.nextEntityId);
  if ('error' in started) throw new Error(started.error);
  return started.gameplay;
}

function playerAttack(gameplay: ReturnType<typeof newGameplay>): AttackInstance {
  return {
    id: 'ui-snapshot-attack',
    sourceId: gameplay.playerEntityId,
    skillId: 'heavy-strike',
    startedAtMs: 1_000,
    facing: 1,
    origin: { x: 200, y: 600 },
    rank: 1,
    hitIds: [],
  };
}

function snapshotFor(
  gameplay: ReturnType<typeof newGameplay> | null,
  overrides: Partial<ReturnType<typeof createInitialAppState>> = {},
) {
  return createUiSnapshot({
    ...createInitialAppState(2, 'base-experience-ui-snapshot'),
    catalog,
    gameplay,
    screen: 'playing',
    ...overrides,
  });
}

describe('base experience UI snapshot', () => {
  it('uses the live player position and derives combat hints without changing saved data', () => {
    const gameplay = newGameplay();
    gameplay.movement.position = { x: 250, y: 600 };
    gameplay.combat.attacks = [playerAttack(gameplay)];
    gameplay.bufferedAttack = { skillId: 'heavy-strike', expiresAtMs: 1_600 };
    const savedData = gameplay.saveData;

    const snapshot = snapshotFor(gameplay, { gameTimeMs: 1_300 });

    expect(snapshot?.focusResumeRequired).toBe(false);
    expect(snapshot?.interactionHint).toEqual({
      targetKey: 'npc:guide',
      kind: 'npc',
      label: '森芽',
      blockedMessage: null,
    });
    expect(snapshot?.combatUi).toEqual({ actionLockUntilMs: 1_650, bufferedSkillId: 'heavy-strike' });
    expect(snapshot?.saveData).toBe(savedData);
    expect(snapshot?.saveData).not.toHaveProperty('focusResumeRequired');
    expect(snapshot?.saveData).not.toHaveProperty('interactionHint');
  });

  it('uses the same portal gate message as interaction when the live position is in range', () => {
    const gameplay = newGameplay();
    gameplay.movement.position = { x: 1_340, y: 600 };

    const snapshot = snapshotFor(gameplay);

    expect(snapshot?.interactionHint).toEqual({
      targetKey: 'portal:camp:east',
      kind: 'portal',
      label: '木葉鎮',
      blockedMessage: '向森芽接取並完成「第一次出發」後才能前往木葉鎮。',
    });
  });

  it('defaults absent runtime data safely and suppresses world hints behind the resume gate', () => {
    const empty = createUiSnapshot({
      ...createInitialAppState(2, 'base-experience-ui-snapshot-empty'),
      catalog,
      screen: 'title',
    });
    expect(empty?.focusResumeRequired).toBe(false);
    expect(empty?.interactionHint).toBeNull();
    expect(empty?.combatUi).toEqual({ actionLockUntilMs: 0, bufferedSkillId: null });

    const gameplay = newGameplay();
    gameplay.movement.position = { x: 250, y: 600 };
    const gated = snapshotFor(gameplay, { focusResumeRequired: true });
    expect(gated?.focusResumeRequired).toBe(true);
    expect(gated?.interactionHint).toBeNull();
  });
});
