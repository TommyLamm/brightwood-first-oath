import { describe, expect, it } from 'vitest';
import type { AttackInstance, ContentCatalog, PlayerJob } from '../src/contracts/index.js';
import { createInitialAppState, createUiSnapshot } from '../src/app/state.js';
import { startNewGame } from '../src/app/gameplay.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { contextHint } from '../src/ui/context-hint.js';

const catalog: ContentCatalog = { rules: rulesCatalog, world: worldCatalog };

function newGameplay(plannedJob: PlayerJob = 'swordsman') {
  const initial = createInitialAppState(2, 'base-experience-ui-snapshot');
  const started = startNewGame('測試旅人', catalog, initial.nextEntityId, plannedJob);
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
  it('only enables the advancement choices near the current profession’s mentor', () => {
    const gameplay = newGameplay('mage');
    gameplay.saveData.location = { mapId: 'town', spawnId: 'center' };
    gameplay.saveData.player = { ...gameplay.saveData.player, job: 'mage', level: 20 };
    gameplay.movement.position = { x: 960, y: 600 };
    expect(snapshotFor(gameplay, { panels: ['skills'] })?.nearSpecializationMentor).toBe(false);

    const mentor = catalog.world.maps.town!.npcs.find(({ npcId }) => npcId === 'mage-mentor')!;
    gameplay.movement.position = { x: mentor.x, y: mentor.y };
    expect(snapshotFor(gameplay, { panels: ['skills'] })?.nearSpecializationMentor).toBe(true);
    expect(snapshotFor(gameplay, { panels: ['dialogue'] })?.nearSpecializationMentor).toBe(true);
    expect(snapshotFor(gameplay)?.interactionHint).toMatchObject({
      targetKey: 'npc:mage-mentor', actionLabel: '查看二轉分支', specializationGuide: true,
    });

    gameplay.saveData.player.level = 19;
    expect(snapshotFor(gameplay, { panels: ['skills'] })?.nearSpecializationMentor).toBe(false);
    expect(snapshotFor(gameplay)?.interactionHint?.specializationGuide).toBeUndefined();
  });

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
      questStatus: 'available',
      blockedMessage: null,
    });
    expect(snapshot?.combatUi).toEqual({ actionLockUntilMs: 1_650, bufferedSkillId: 'heavy-strike', stanceBlock: null });
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
      blockedQuestId: 'q01',
      blockedMessage: '向森芽接取並完成「第一次出發」後才能前往木葉鎮。',
    });

    gameplay.saveData = { ...gameplay.saveData, quests: { q01: { status: 'claimed', counters: { snail: 3 } } } };
    expect(snapshotFor(gameplay)?.interactionHint).toEqual({
      targetKey: 'portal:camp:east',
      kind: 'portal',
      label: '木葉鎮',
      blockedMessage: null,
    });
  });

  it('prompts the correct attack only by unfinished combat trial targets', () => {
    const gameplay = newGameplay('rogue');
    gameplay.saveData.location = { mapId: 'town', spawnId: 'center' };
    const standBy = (id: string) => {
      const target = worldCatalog.maps.town!.npcs.find(({ npcId }) => npcId === id)!;
      gameplay.movement.position = { x: target.x, y: target.y };
    };
    standBy('rogue-target-double');
    expect(snapshotFor(gameplay)?.interactionHint?.trialAttack).toBeUndefined();

    gameplay.saveData = { ...gameplay.saveData, quests: { q02: { status: 'active', counters: { town: 1 } } } };
    const view = snapshotFor(gameplay)!;
    expect(view.interactionHint?.trialAttack).toEqual({ action: 'skill1', label: '連刺兩段' });
    const keyText = (action: string) => action === 'skill1' ? 'R' : 'Space';
    expect(contextHint(view, keyText)?.parts).toEqual([
      { key: 'R' }, ' 連刺兩段：連刺靶・技能1', '｜', { key: 'Space' }, ' 查看說明',
    ]);
    standBy('rogue-target-close');
    expect(snapshotFor(gameplay)?.interactionHint?.trialAttack?.action).toBe('attack');
    standBy('rogue-target-evade');
    expect(snapshotFor(gameplay)?.interactionHint?.trialAttack).toBeUndefined();

    standBy('rogue-target-double');
    gameplay.saveData = { ...gameplay.saveData, quests: {
      q02: { status: 'active', counters: { town: 1, 'rogue-target-double': 1 } },
    } };
    expect(snapshotFor(gameplay)?.interactionHint?.trialAttack).toBeUndefined();
  });

  it('tells the player which resources the healer can restore', () => {
    const gameplay = newGameplay();
    gameplay.saveData.location = { mapId: 'town', spawnId: 'center' };
    const healer = catalog.world.maps.town!.npcs.find(({ npcId }) => npcId === 'healer')!;
    gameplay.movement.position = { x: healer.x, y: healer.y };
    const player = gameplay.saveData.player;

    expect(snapshotFor(gameplay)?.interactionHint?.actionLabel).toBe('交談');
    player.hp -= 1;
    expect(snapshotFor(gameplay)?.interactionHint?.actionLabel).toBe('回復 HP');
    player.mp -= 1;
    expect(snapshotFor(gameplay)?.interactionHint?.actionLabel).toBe('回復 HP／MP');
    player.hp += 1;
    expect(snapshotFor(gameplay)?.interactionHint?.actionLabel).toBe('回復 MP');
  });

  it('uses the living arena boss for the status bar', () => {
    const gameplay = newGameplay();
    expect(snapshotFor(gameplay)?.bossVitals).toBeNull();
    gameplay.saveData.location = { mapId: 'guardian-arena', spawnId: 'entry' };
    const definition = catalog.rules.monsters.guardian!;
    gameplay.monsters = [{ ...gameplay.monsters[0]!, monsterId: definition.id, hp: definition.maxHp - 10 }];
    expect(snapshotFor(gameplay)?.bossVitals).toEqual({
      name: definition.name, hp: definition.maxHp - 10, maxHp: definition.maxHp, phase: 1, changingPhase: false,
    });
    gameplay.monsters[0]!.phase = 2;
    expect(snapshotFor(gameplay)?.bossVitals?.phase).toBe(2);
    gameplay.monsters[0]!.mode = 'phase-transition';
    expect(snapshotFor(gameplay)?.bossVitals?.changingPhase).toBe(true);
    expect(snapshotFor(gameplay, { screen: 'result' })?.bossVitals).toBeNull();
  });

  it('warns in open panels only while the player is inside an active attack area', () => {
    const gameplay = newGameplay();
    gameplay.telegraphs = [{
      id: 'warning', sourceId: 'enemy', kind: 'rect',
      rect: { x: 130, y: 550, width: 40, height: 60 }, resolveAtMs: 1_000,
    }];
    expect(snapshotFor(gameplay, { panels: ['map'], gameTimeMs: 999 })?.panelDanger).toBe(true);
    expect(snapshotFor(gameplay, { panels: ['map'], gameTimeMs: 1_000 })?.panelDanger).toBe(false);
    expect(snapshotFor(gameplay, { panels: ['settings'], gameTimeMs: 999 })?.panelDanger).toBe(false);
    expect(snapshotFor(gameplay, { gameTimeMs: 999 })?.panelDanger).toBe(false);
    gameplay.movement.position = { x: 500, y: 600 };
    expect(snapshotFor(gameplay, { panels: ['map'], gameTimeMs: 999 })?.panelDanger).toBe(false);
  });

  it('defaults absent runtime data safely and suppresses world hints behind the resume gate', () => {
    const empty = createUiSnapshot({
      ...createInitialAppState(2, 'base-experience-ui-snapshot-empty'),
      catalog,
      screen: 'title',
    });
    expect(empty?.focusResumeRequired).toBe(false);
    expect(empty?.interactionHint).toBeNull();
    expect(empty?.combatUi).toEqual({ actionLockUntilMs: 0, bufferedSkillId: null, stanceBlock: null });

    const gameplay = newGameplay();
    gameplay.movement.position = { x: 250, y: 600 };
    const gated = snapshotFor(gameplay, { focusResumeRequired: true });
    expect(gated?.focusResumeRequired).toBe(true);
    expect(gated?.interactionHint).toBeNull();
  });
});
