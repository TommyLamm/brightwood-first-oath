import { describe, expect, it } from 'vitest';
import type { GameCommand } from '../../src/contracts/commands.js';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { acceptQuest, getQuestView } from '../../src/domain/quests/index.js';
import { completeMapTransition, failMapTransition, makeWorldSnapshot, restoreGame, startNewGame, stepGameplay } from '../../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

describe('app gameplay vertical slice', () => {
  it('uses the audio defaults for new characters and preserves loaded settings', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('audio-settings'));
    if ('error' in started) throw new Error(started.error);

    expect(started.gameplay.saveData.settings).toEqual({
      masterVolume: 0.8,
      musicVolume: 0.35,
      sfxVolume: 0.65,
      muted: false,
      bindings: {},
    });

    const existingSettings = {
      masterVolume: 0.2,
      musicVolume: 0.4,
      sfxVolume: 0.6,
      muted: true,
      bindings: { attack: 'KeyX' },
    };
    const saved = structuredClone(started.gameplay.saveData);
    saved.settings = existingSettings;
    const restored = restoreGame(saved, catalog, createNextEntityId('audio-settings-restore'));
    expect(restored.gameplay.saveData.settings).toEqual(existingSettings);
  });

  it('rebuilds runtime actors from a save and moves arena saves to the safe mine entrance', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('restore-source'));
    if ('error' in started) throw new Error(started.error);
    started.gameplay.saveData.location = { mapId: 'guardian-arena', spawnId: 'entry' };
    started.gameplay.saveData.flags.bossDefeated = true;
    started.gameplay.guardUntilMs = 40_000;
    started.gameplay.drops.push({
      id: 'transient-drop', itemId: 'snail-shell', quantity: 1, coins: 0,
      position: { x: 100, y: 100 }, expiresAtMs: 50_000,
    });

    const restored = restoreGame(started.gameplay.saveData, catalog, createNextEntityId('restore-target'));

    expect(restored.repairedArenaLocation).toBe(true);
    expect(restored.gameplay.saveData.location).toEqual({ mapId: 'mine-gate', spawnId: 'right' });
    expect(restored.gameplay.saveData.visitedMaps).toContain('mine-gate');
    expect(restored.gameplay.monsters.map(({ monsterId }) => monsterId))
      .toEqual(catalog.world.maps['mine-gate']!.monsters.map(({ monsterId }) => monsterId));
    expect(new Set(restored.gameplay.monsters.map(({ id }) => id)).size).toBe(restored.gameplay.monsters.length);
    expect(restored.gameplay.drops).toEqual([]);
    expect(restored.gameplay.combat.attacks).toEqual([]);
    expect(restored.gameplay.guardUntilMs).toBe(0);
  });

  it('moves, attacks, and records one death reward and quest event exactly once', () => {
    const nextEntityId = createNextEntityId('integration');
    const started = startNewGame('旅人', catalog, nextEntityId);
    expect('error' in started).toBe(false);
    if ('error' in started) throw new Error(started.error);

    let gameplay = started.gameplay;
    const accepted = acceptQuest(gameplay.saveData, 'q01', catalog);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) throw new Error(accepted.message);
    gameplay.saveData = accepted.value;

    const target = gameplay.monsters[0];
    expect(target?.monsterId).toBe('snail');
    if (!target) throw new Error('Expected the camp snail spawn.');
    gameplay.monsters[0] = {
      ...target,
      hp: 1,
      mode: 'patrol',
      movement: {
        ...target.movement,
        position: { x: gameplay.movement.position.x + 45, y: 600 },
        velocity: { x: 0, y: 0 },
        mode: 'grounded',
        footholdId: 'camp:ground',
      },
    };

    const firstCommand: GameCommand = { seq: 1, type: 'attack', payload: { skillId: 'basic' } };
    const random = createSeededRandom(1234);
    let nowMs = 1000;
    gameplay.combat = {
      attacks: [...gameplay.combat.attacks, {
        id: nextEntityId(),
        sourceId: target.id,
        skillId: 'enemy-melee',
        startedAtMs: nowMs + 10_000,
        facing: target.movement.facing,
        origin: { x: -1000, y: 0 },
        rank: 1,
        hitIds: [],
      }],
      cooldowns: {
        ...gameplay.combat.cooldowns,
        [target.id]: { 'enemy-melee': nowMs + 12_000 },
      },
    };
    const firstStep = stepGameplay(gameplay, {
      catalog,
      commands: [firstCommand],
      input: { moveX: 1, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 1 / 60,
      nowMs,
      random,
      nextEntityId,
    });
    expect(firstStep.gameplay).not.toBeNull();
    gameplay = firstStep.gameplay!;

    for (let tick = 0; tick < 35; tick += 1) {
      nowMs += 1000 / 60;
      const result = stepGameplay(gameplay, {
        catalog,
        commands: [],
        input: { moveX: tick < 4 ? 1 : 0, climbY: 0, jumpPressed: false, downHeld: false },
        dtSeconds: 1 / 60,
        nowMs,
        random,
        nextEntityId,
      });
      gameplay = result.gameplay!;
    }

    expect(gameplay.movement.position.x).toBeGreaterThan(150);
    expect(gameplay.monsters.find(({ id }) => id === target.id)?.mode).toBe('dead');
    expect(gameplay.combat.attacks.some(({ sourceId }) => sourceId === target.id)).toBe(false);
    expect(gameplay.combat.cooldowns[target.id]).toBeUndefined();
    expect(gameplay.saveData.player.exp).toBe(20);
    expect(gameplay.saveData.quests.q01?.counters.snail).toBe(1);
    expect(gameplay.drops.some(({ coins }) => coins === 5)).toBe(true);
    expect(gameplay.drops.some(({ itemId }) => itemId === 'snail-shell')).toBe(true);
    // The kill shows its EXP as a reward popup, not as a 'damage' number in the hero's hurt colour.
    const killEffects = gameplay.effects.filter(({ position }) => position.x === gameplay.monsters.find(({ id }) => id === target.id)?.movement.position.x);
    expect(killEffects.some(({ kind, value }) => kind === 'exp' && value === 20)).toBe(true);
    expect(gameplay.effects.some(({ kind }) => kind === 'damage')).toBe(false);
    expect(gameplay.effects.some(({ kind }) => kind === 'levelup')).toBe(false);
    // Coins and the shell fan out instead of hiding under one another, and stay within pickup reach.
    const dropXs = gameplay.drops.map(({ position }) => position.x);
    expect(new Set(dropXs).size).toBe(dropXs.length);
    expect(Math.max(...dropXs) - Math.min(...dropXs)).toBeLessThanOrEqual(34 * (dropXs.length - 1));

    for (let tick = 0; tick < 5; tick += 1) {
      nowMs += 1000 / 60;
      gameplay = stepGameplay(gameplay, {
        catalog,
        commands: [],
        input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
        dtSeconds: 1 / 60,
        nowMs,
        random,
        nextEntityId,
      }).gameplay!;
    }
    expect(gameplay.saveData.player.exp).toBe(20);
    expect(gameplay.saveData.quests.q01?.counters.snail).toBe(1);

    const snapshot = makeWorldSnapshot(gameplay, catalog, nowMs);
    expect(snapshot.mapId).toBe('camp');
    expect(snapshot.monsters).toHaveLength(3);
    expect(snapshot.questViews.find(({ questId }) => questId === 'q01')?.status).toBe('active');
  });

  it('clears player attack state immediately on lethal damage and resets remaining combat on respawn', () => {
    const nextEntityId = createNextEntityId('player-death-combat-cleanup');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);

    const gameplay = started.gameplay;
    const enemy = gameplay.monsters[0];
    if (!enemy) throw new Error('Expected the camp snail spawn.');
    gameplay.saveData.player = { ...gameplay.saveData.player, hp: 1 };
    gameplay.movement = { ...gameplay.movement, facing: 1 };
    const playerPosition = { ...gameplay.movement.position };
    const nowMs = 1370;
    gameplay.monsters[0] = {
      ...enemy,
      mode: 'recovery',
      pendingSkillId: 'enemy-melee',
      lastAttackAtMs: 1000,
      attackOrigin: { x: playerPosition.x - 30, y: playerPosition.y },
      attackFacing: 1,
      movement: {
        ...enemy.movement,
        position: { x: playerPosition.x - 30, y: playerPosition.y },
        velocity: { x: 0, y: 0 },
      },
    };

    gameplay.combat = {
      attacks: [
        {
          id: nextEntityId(),
          sourceId: gameplay.playerEntityId,
          skillId: 'basic',
          startedAtMs: nowMs + 1000,
          facing: 1,
          origin: playerPosition,
          rank: 1,
          hitIds: [],
        },
        {
          id: nextEntityId(),
          sourceId: enemy.id,
          skillId: 'enemy-melee',
          startedAtMs: 1000,
          facing: 1,
          origin: { x: playerPosition.x - 30, y: playerPosition.y },
          rank: 1,
          hitIds: [],
        },
      ],
      cooldowns: {
        [gameplay.playerEntityId]: { basic: nowMs + 1000 },
        [enemy.id]: { 'enemy-melee': nowMs + 1000 },
      },
    };

    const death = stepGameplay(gameplay, {
      catalog,
      commands: [],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0.04,
      nowMs,
      random: createSeededRandom(99),
      nextEntityId,
    });

    expect(death.screen).toBe('dead');
    expect(death.gameplay?.saveData.player.hp).toBe(0);
    expect(death.gameplay?.combat.attacks.some(({ sourceId }) => sourceId === gameplay.playerEntityId)).toBe(false);
    expect(death.gameplay?.combat.cooldowns[gameplay.playerEntityId]).toBeUndefined();
    expect(death.gameplay?.combat.attacks.some(({ sourceId }) => sourceId === enemy.id)).toBe(true);
    expect(death.gameplay?.combat.cooldowns[enemy.id]).toBeDefined();

    const deadFollowUp = stepGameplay(death.gameplay!, {
      catalog,
      commands: [{ seq: 2, type: 'attack', payload: { skillId: 'basic' } }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: nowMs + 1,
      random: createSeededRandom(100),
      nextEntityId,
    });
    expect(deadFollowUp.screen).toBe('dead');
    expect(deadFollowUp.gameplay?.combat.attacks.some(({ sourceId }) => sourceId === gameplay.playerEntityId)).toBe(false);
    expect(deadFollowUp.gameplay?.combat.cooldowns[gameplay.playerEntityId]).toBeUndefined();
    expect(deadFollowUp.gameplay?.combat.attacks.some(({ sourceId }) => sourceId === enemy.id)).toBe(true);
    expect(deadFollowUp.gameplay?.combat.cooldowns[enemy.id]).toBeDefined();

    const deadGameplay = deadFollowUp.gameplay!;
    deadGameplay.pendingTransition = { mapId: 'camp', spawnId: 'start', after: 'respawn' };
    const respawned = completeMapTransition(deadGameplay, catalog, nextEntityId, nowMs + 1000);
    expect(respawned.gameplay?.saveData.player.hp).toBeGreaterThan(0);
    expect(respawned.gameplay?.combat).toEqual({ attacks: [], cooldowns: {} });
  });

  it('does not spend cooldown when an attack fails for insufficient MP', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('no-mp'));
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.saveData.player = {
      ...gameplay.saveData.player,
      job: 'swordsman',
      level: 10,
      exp: 0,
      sp: 1,
      mp: 0,
      skillRanks: { 'heavy-strike': 1 },
    };

    const result = stepGameplay(gameplay, {
      catalog,
      commands: [{ seq: 1, type: 'attack', payload: { skillId: 'heavy-strike' } }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: 1000,
      random: createSeededRandom(1),
      nextEntityId: createNextEntityId('no-mp-next'),
    });
    expect(result.gameplay?.saveData.player.mp).toBe(0);
    expect(result.gameplay?.combat.cooldowns[result.gameplay.playerEntityId]?.['heavy-strike']).toBeUndefined();
    expect(result.gameplay?.combat.attacks).toHaveLength(0);
  });

  it('announces a finished quest and keeps the notice through the next swing', () => {
    const nextEntityId = createNextEntityId('quest-ready');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    const accepted = acceptQuest(gameplay.saveData, 'q01', catalog);
    if (!accepted.ok) throw new Error(accepted.message);
    gameplay.saveData = { ...accepted.value, quests: { ...accepted.value.quests, q01: { status: 'active', counters: { snail: 2 } } } };
    const target = gameplay.monsters[0]!;
    gameplay.monsters[0] = {
      ...target, hp: 1, mode: 'patrol',
      movement: { ...target.movement, position: { x: gameplay.movement.position.x + 45, y: 600 }, velocity: { x: 0, y: 0 }, mode: 'grounded', footholdId: 'camp:ground' },
    };
    const random = createSeededRandom(77);
    const idle = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };
    let nowMs = 1000;
    const step = (commands: GameCommand[]) => {
      gameplay = stepGameplay(gameplay, { catalog, commands, input: idle, dtSeconds: 1 / 60, nowMs, random, nextEntityId }).gameplay!;
      nowMs += 1000 / 60;
    };
    step([{ seq: 1, type: 'attack', payload: { skillId: 'basic' } }]);
    for (let tick = 0; tick < 40 && gameplay.saveData.quests.q01?.counters.snail !== 3; tick += 1) step([]);
    expect(gameplay.saveData.quests.q01?.counters.snail).toBe(3);
    const notice = '「第一次出發」的目標已完成！回到晨光營地向森芽回報。';
    expect(gameplay.toast).toBe(notice);
    nowMs += 1000;
    step([{ seq: 2, type: 'attack', payload: { skillId: 'basic' } }]);
    expect(gameplay.toast).toBe(notice);
  });

  it('names the skill and the next step when a locked skill is pressed', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('locked-skill'));
    if ('error' in started) throw new Error(started.error);
    const input = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };
    const press = (skillId: string, seq: number) => stepGameplay(started.gameplay, {
      catalog, commands: [{ seq, type: 'attack', payload: { skillId } }], input,
      dtSeconds: 0, nowMs: 1000, random: createSeededRandom(seq), nextEntityId: createNextEntityId('locked-skill-' + seq),
    }).gameplay!.toast;
    expect(press('heavy-strike', 1)).toBe('轉職為劍士後才能使用「重斬」。');
    started.gameplay.saveData.player = { ...started.gameplay.saveData.player, job: 'swordsman', level: 10, sp: 3, skillRanks: {} };
    expect(press('heavy-strike', 2)).toBe('尚未學會「重斬」，請在技能面板用 SP 學習。');
    expect(press('iron-guard', 3)).toBe('「堅韌守護」需要 Lv.14 才能學習。');
    started.gameplay.saveData.player = { ...started.gameplay.saveData.player, level: 14, mp: 3, skillRanks: { 'heavy-strike': 1, 'iron-guard': 1 } };
    expect(press('heavy-strike', 4)).toMatch(/^MP 不足：「重斬」需要 \d+ MP，目前只有 3。$/);
    expect(press('iron-guard', 5)).toMatch(/^MP 不足：「堅韌守護」需要 \d+ MP，目前只有 3。$/);
  });

  it('plays the hero buff pose briefly after casting 堅韌守護', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('buff-pose'));
    if ('error' in started) throw new Error(started.error);
    started.gameplay.saveData.player = {
      ...started.gameplay.saveData.player, job: 'swordsman', level: 14, mp: 50, skillRanks: { 'iron-guard': 1 },
    };
    const cast = stepGameplay(started.gameplay, {
      catalog, commands: [{ seq: 1, type: 'attack', payload: { skillId: 'iron-guard' } }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0, nowMs: 5000, random: createSeededRandom(1), nextEntityId: createNextEntityId('buff-pose-a'),
    }).gameplay!;
    cast.movement = { ...cast.movement, mode: 'grounded', velocity: { x: 0, y: 0 } };
    expect(makeWorldSnapshot(cast, catalog, 5100).player.animationKey).toBe('buff');
    expect(makeWorldSnapshot(cast, catalog, 5500).player.animationKey).toBe('idle');
  });

  it('buffers a skill pressed mid-swing without a toast', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('mid-swing'));
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.saveData.player = {
      ...gameplay.saveData.player, job: 'swordsman', level: 10, exp: 0, sp: 0, mp: 50,
      skillRanks: { 'heavy-strike': 1 },
    };
    const input = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };
    const swung = stepGameplay(gameplay, {
      catalog, commands: [{ seq: 1, type: 'attack', payload: { skillId: 'basic' } }], input,
      dtSeconds: 0, nowMs: 1000, random: createSeededRandom(1), nextEntityId: createNextEntityId('mid-swing-a'),
    }).gameplay!;
    expect(swung.combat.attacks).toHaveLength(1);
    const pressed = stepGameplay(swung, {
      catalog, commands: [{ seq: 2, type: 'attack', payload: { skillId: 'heavy-strike' } }], input,
      dtSeconds: 1 / 60, nowMs: 1016, random: createSeededRandom(2), nextEntityId: createNextEntityId('mid-swing-b'),
    }).gameplay!;
    expect(pressed.toast).toBeNull();
    expect(pressed.saveData.player.mp).toBe(50);
    // The buffered skill fires on its own once the basic swing has finished...
    const chained = stepGameplay(pressed, {
      catalog, commands: [], input,
      dtSeconds: 1 / 60, nowMs: 1000 + 550 + 1, random: createSeededRandom(3), nextEntityId: createNextEntityId('mid-swing-c'),
    }).gameplay!;
    expect(chained.combat.attacks.some((attack) => attack.skillId === 'heavy-strike')).toBe(true);
    expect(chained.saveData.player.mp).toBe(44);
    expect(chained.bufferedAttack).toBeUndefined();
    // ...but a press that is too early to chain is dropped rather than firing late.
    const late = stepGameplay({ ...swung, bufferedAttack: { skillId: 'heavy-strike', expiresAtMs: 1100 } }, {
      catalog, commands: [], input,
      dtSeconds: 1 / 60, nowMs: 1600, random: createSeededRandom(4), nextEntityId: createNextEntityId('mid-swing-d'),
    }).gameplay!;
    expect(late.combat.attacks.some((attack) => attack.skillId === 'heavy-strike')).toBe(false);
    expect(late.bufferedAttack).toBeUndefined();
  });

  it('keeps quest items and quest state when a full bag cannot accept the reward', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('claim-full'));
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.saveData.location = { mapId: 'town', spawnId: 'center' };
    gameplay.movement.position = { x: 700, y: 600 };
    gameplay.saveData.quests = {
      q01: { status: 'claimed', counters: {} },
      q02: { status: 'claimed', counters: {} },
      q03: { status: 'claimed', counters: {} },
      q04: { status: 'active', counters: { mushroom: 6 } },
    };
    gameplay.saveData.player.bag = [
      ...Array.from({ length: 31 }, () => ({ itemId: 'snail-shell', quantity: 1 })),
      { itemId: 'spore-sample', quantity: 9 },
    ];

    const result = stepGameplay(gameplay, {
      catalog,
      commands: [{ seq: 1, type: 'claimQuest', payload: { questId: 'q04' } }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: 1000,
      random: createSeededRandom(2),
      nextEntityId: createNextEntityId('claim-full-next'),
    });
    expect(result.gameplay?.saveData.player.bag.at(-1)).toEqual({ itemId: 'spore-sample', quantity: 9 });
    expect(result.gameplay?.saveData.quests.q04?.status).toBe('active');
    expect(result.gameplay?.saveData.player.bag).toHaveLength(32);
  });

  it('summarises the reward in a toast when a quest is claimed', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('claim-toast'));
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.saveData.location = { mapId: 'town', spawnId: 'center' };
    gameplay.movement.position = { x: 700, y: 600 };
    gameplay.saveData.quests = {
      q01: { status: 'claimed', counters: {} },
      q02: { status: 'claimed', counters: {} },
      q03: { status: 'claimed', counters: {} },
      q04: { status: 'active', counters: { mushroom: 6 } },
    };
    gameplay.saveData.player.bag = [{ itemId: 'spore-sample', quantity: 4 }];
    gameplay.interaction = { npcId: 'mentor', dialogue: ['greeting', worldCatalog.quests.q04!.completeText] };

    const result = stepGameplay(gameplay, {
      catalog,
      commands: [{ seq: 1, type: 'claimQuest', payload: { questId: 'q04' } }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: 1000,
      random: createSeededRandom(2),
      nextEntityId: createNextEntityId('claim-toast-next'),
    });
    expect(result.gameplay?.saveData.quests.q04?.status).toBe('claimed');
    expect(result.gameplay?.toast).toBe('完成「菌林調查」：獲得 EXP 1,000、350 金幣、皮帽 ×1，升至 Lv.17。');
    expect(result.gameplay?.effects.filter(({ kind }) => kind === 'levelup').map(({ value }) => value)).toEqual([17]);
    // The open dialogue no longer tells the player to hand in the quest they just finished.
    expect(result.gameplay?.interaction?.dialogue).not.toContain(worldCatalog.quests.q04!.completeText);
  });

  it('does not commit location or progress when a map load fails', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('load-error'));
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.pendingTransition = { mapId: 'town', spawnId: 'center', after: 'travel' };
    const previousSave = structuredClone(gameplay.saveData);
    const failed = failMapTransition(gameplay, 'simulated loadError');
    expect(failed.screen).toBe('playing');
    expect(failed.gameplay?.saveData).toEqual(previousSave);
    expect(failed.gameplay?.pendingTransition).toBeNull();
    // T14 has no persistence/checkpoint writer wired at this stage. A failed
    // renderer load therefore has no route that can checkpoint this transition.
  });

  it('applies settings through the gameplay command path', () => {
    const started = startNewGame('旅人', catalog, createNextEntityId('settings'));
    if ('error' in started) throw new Error(started.error);
    const result = stepGameplay(started.gameplay, {
      catalog,
      commands: [{
        seq: 1,
        type: 'setSettings',
        payload: {
          settings: {
            masterVolume: 0.4,
            musicVolume: 0.2,
            sfxVolume: 0.3,
            muted: true,
            bindings: { attack: 'KeyX' },
          },
        },
      }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: 0,
      random: createSeededRandom(3),
      nextEntityId: createNextEntityId('settings-next'),
    });
    expect(result.gameplay?.saveData.settings).toEqual({
      masterVolume: 0.4,
      musicVolume: 0.2,
      sfxVolume: 0.3,
      muted: true,
      bindings: { attack: 'KeyX' },
    });
  });

  it('uses the 64px interaction range and requires a current merchant interaction to buy', () => {
    const nextEntityId = createNextEntityId('merchant-range');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.saveData.location = { mapId: 'town', spawnId: 'center' };
    gameplay.movement.position = { x: 935, y: 600 };

    const run = (state: typeof gameplay, commands: GameCommand[], nowMs: number) => stepGameplay(state, {
      catalog,
      commands,
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs,
      random: createSeededRandom(4),
      nextEntityId,
    }).gameplay!;

    let result = run(gameplay, [{ seq: 1, type: 'interact', payload: {} }], 0);
    expect(result.interaction).toBeNull();

    result.movement.position.x = 936;
    result = run(result, [{ seq: 2, type: 'interact', payload: {} }], 1);
    expect(result.interaction?.npcId).toBe('merchant');

    result.interaction = null;
    const coinsBefore = result.saveData.player.coins;
    result = run(result, [{ seq: 3, type: 'buy', payload: { itemId: 'small-red', quantity: 1 } }], 2);
    expect(result.saveData.player.coins).toBe(coinsBefore);

    result.interaction = { npcId: 'merchant', dialogue: [] };
    result = run(result, [{ seq: 4, type: 'buy', payload: { itemId: 'small-red', quantity: 1 } }], 3);
    expect(result.saveData.player.coins).toBe(coinsBefore - catalog.rules.items['small-red']!.buyPrice);
    expect(result.saveData.player.bag.find(({ itemId }) => itemId === 'small-red')?.quantity).toBe(11);
  });

  it('requires rest-recovery rank and restores HP only after 3 seconds, then every 2 seconds', () => {
    const nextEntityId = createNextEntityId('rest-recovery');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    const initial = started.gameplay;
    initial.saveData.player.hp -= 10;
    initial.saveData.player.mp -= 10;

    const run = (state: typeof initial, nowMs: number) => stepGameplay(state, {
      catalog,
      commands: [],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs,
      random: createSeededRandom(5),
      nextEntityId,
    }).gameplay!;

    const withoutRank = run(initial, 5000);
    expect(withoutRank.saveData.player.hp).toBe(initial.saveData.player.hp);
    expect(withoutRank.saveData.player.mp).toBe(initial.saveData.player.mp);

    const trained = structuredClone(initial);
    trained.saveData.player = {
      ...trained.saveData.player,
      job: 'swordsman',
      level: 10,
      skillRanks: { ...trained.saveData.player.skillRanks, 'rest-recovery': 1 },
    };
    trained.movement.velocity.x = 100;
    trained.attackOrDamageAtMs = 1000;
    const beforeRest = run(trained, 3999);
    expect(beforeRest.saveData.player.hp).toBe(trained.saveData.player.hp);
    const firstRecovery = run(beforeRest, 4000);
    expect(firstRecovery.saveData.player.hp).toBe(trained.saveData.player.hp + 2);
    expect(firstRecovery.saveData.player.mp).toBe(trained.saveData.player.mp);
    expect(run(firstRecovery, 5999).saveData.player.hp).toBe(firstRecovery.saveData.player.hp);
    expect(run(firstRecovery, 6000).saveData.player.hp).toBe(firstRecovery.saveData.player.hp + 2);
  });

  it('locks returnTown during a live arena fight and clears guard on respawn', () => {
    const nextEntityId = createNextEntityId('arena-return');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    const gameplay = started.gameplay;
    gameplay.saveData.location = { mapId: 'guardian-arena', spawnId: 'entry' };
    const result = stepGameplay(gameplay, {
      catalog,
      commands: [{ seq: 1, type: 'returnTown', payload: {} }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: 1000,
      random: createSeededRandom(6),
      nextEntityId,
    });
    expect(result.gameplay?.pendingTransition).toBeNull();
    expect(result.gameplay?.toast).toContain('首領戰尚未結束');

    const dead = structuredClone(gameplay);
    dead.saveData.player.hp = 0;
    dead.guardUntilMs = 20_000;
    dead.pendingTransition = { mapId: 'camp', spawnId: 'start', after: 'respawn' };
    const respawned = completeMapTransition(dead, catalog, nextEntityId, 5000);
    expect(respawned.gameplay?.saveData.player.hp).toBeGreaterThan(0);
    expect(respawned.gameplay?.guardUntilMs).toBe(0);
  });

  it('gives the Frost Tide boss a separate result and retry route without changing Guardian flags', () => {
    const nextEntityId = createNextEntityId('warden-result');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.flags = { bossDefeated: true, chapterComplete: true };
    gameplay.saveData.visitedMaps = ['camp', 'town', 'frost-shore', 'frost-pine-pass'];
    gameplay.pendingTransition = { mapId: 'frost-tide-cavern', spawnId: 'left', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1000).gameplay!;
    const spawn = catalog.world.maps['frost-tide-cavern']!.monsters.find(({ monsterId }) => monsterId === 'frost-tide-warden')!;
    const warden = gameplay.monsters.find(({ monsterId }) => monsterId === 'frost-tide-warden')!;
    gameplay.monsters = [{ ...warden, hp: 1, movement: { ...warden.movement, position: { x: spawn.x, y: 600 } } }];
    gameplay.movement = { ...gameplay.movement, position: { x: spawn.x - 40, y: 600 }, facing: 1 };
    const originalCoins = gameplay.saveData.player.coins;

    let screen: ReturnType<typeof stepGameplay>['screen'] = 'playing';
    let nowMs = 2000;
    for (let tick = 0; tick < 60; tick += 1) {
      nowMs += 1000 / 60;
      const step = stepGameplay(gameplay, {
        catalog,
        commands: tick === 0 ? [{ seq: 1, type: 'attack', payload: { skillId: 'basic' } }] : [],
        input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
        dtSeconds: 1 / 60,
        nowMs,
        random: createSeededRandom(45),
        nextEntityId,
      });
      gameplay = step.gameplay!;
      screen = step.screen;
      if (screen === 'result') break;
    }

    expect(screen).toBe('result');
    expect(gameplay.bossResult).toBe(true);
    expect(gameplay.saveData.player.coins).toBeGreaterThan(originalCoins);
    expect(gameplay.saveData.flags).toEqual({ bossDefeated: true, chapterComplete: true });

    const retry = stepGameplay(gameplay, {
      catalog,
      commands: [{ seq: 2, type: 'retryBoss', payload: {} }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: nowMs + 10,
      random: createSeededRandom(46),
      nextEntityId,
    }).gameplay!;
    expect(retry.pendingTransition).toMatchObject({ mapId: 'frost-tide-cavern', spawnId: 'left', after: 'retryBoss' });
    const restarted = completeMapTransition(retry, catalog, nextEntityId, nowMs + 20).gameplay!;
    expect(restarted.bossResult).toBe(false);
    expect(restarted.saveData.flags).toEqual({ bossDefeated: true, chapterComplete: true });

    const returnFlow = stepGameplay(gameplay, {
      catalog,
      commands: [{ seq: 3, type: 'returnTown', payload: {} }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: nowMs + 30,
      random: createSeededRandom(47),
      nextEntityId,
    }).gameplay!;
    expect(returnFlow.pendingTransition).toMatchObject({ mapId: 'frost-shore', spawnId: 'left', after: 'travel' });
  });

  it('auto-collects guardian boss drops on death so q08 and chapterComplete can be claimed', () => {
    const nextEntityId = createNextEntityId('guardian-clear');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.quests = {
      q01: { status: 'claimed', counters: {} },
      q02: { status: 'claimed', counters: {} },
      q03: { status: 'claimed', counters: {} },
      q04: { status: 'claimed', counters: {} },
      q05: { status: 'claimed', counters: {} },
      q06: { status: 'claimed', counters: {} },
      q07: { status: 'claimed', counters: {} },
      q08: { status: 'active', counters: { guardian: 0 } },
    };
    gameplay.pendingTransition = { mapId: 'guardian-arena', spawnId: 'entry', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1000).gameplay!;

    const guardian = gameplay.monsters.find(({ monsterId }) => monsterId === 'guardian')!;
    gameplay.monsters[0] = {
      ...guardian,
      hp: 1,
      mode: 'idle',
      movement: {
        ...guardian.movement,
        position: { x: gameplay.movement.position.x + 40, y: 600 },
      },
    };

    let nowMs = 2000;
    let screen: ReturnType<typeof stepGameplay>['screen'] = 'playing';
    for (let tick = 0; tick < 30; tick += 1) {
      nowMs += 1000 / 60;
      const step = stepGameplay(gameplay, {
        catalog,
        commands: tick === 0 ? [{ seq: 1, type: 'attack', payload: { skillId: 'basic' } }] : [],
        input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
        dtSeconds: 1 / 60,
        nowMs,
        random: createSeededRandom(77),
        nextEntityId,
      });
      gameplay = step.gameplay!;
      screen = step.screen;
      if (screen === 'result') break;
    }

    expect(screen).toBe('result');
    expect(gameplay.bossResult).toBe(true);
    expect(gameplay.saveData.flags.bossDefeated).toBe(true);
    expect(gameplay.saveData.quests.q08?.counters.guardian).toBe(1);
    expect(gameplay.saveData.player.bag.find(({ itemId }) => itemId === 'guardian-core')?.quantity).toBe(1);
    expect(gameplay.saveData.player.bag.find(({ itemId }) => itemId === 'guardian-sword')?.quantity).toBe(1);

    // Move to keeper in red-ridge and claim q08
    gameplay.pendingTransition = { mapId: 'red-ridge', spawnId: 'left', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    const keeper = catalog.world.maps['red-ridge']!.npcs.find(({ npcId }) => npcId === 'keeper')!;
    gameplay.movement.position = { x: keeper.x, y: keeper.y };

    const claimed = stepGameplay(gameplay, {
      catalog,
      commands: [{ seq: 2, type: 'claimQuest', payload: { questId: 'q08' } }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: nowMs + 200,
      random: createSeededRandom(78),
      nextEntityId,
    }).gameplay!;

    expect(claimed.saveData.quests.q08?.status).toBe('claimed');
    expect(claimed.saveData.flags.chapterComplete).toBe(true);
    expect(claimed.saveData.player.level).toBe(30);
    expect(claimed.saveData.player.bag.find(({ itemId }) => itemId === 'guardian-core')).toBeUndefined();
  });

  it('keeps the guardian sword on the floor and delays the result screen when the bag is full', () => {
    const nextEntityId = createNextEntityId('guardian-full-bag');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.quests.q08 = { status: 'active', counters: { guardian: 0 } };
    gameplay.pendingTransition = { mapId: 'guardian-arena', spawnId: 'entry', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1000).gameplay!;
    // 31 occupied slots: the core still fits, the sword does not.
    const fillers = ['iron-sword', 'steel-sword', 'leather-vest', 'iron-mail', 'leather-cap', 'iron-helm'];
    gameplay.saveData.player.bag = [...gameplay.saveData.player.bag];
    while (gameplay.saveData.player.bag.length < 31) {
      gameplay.saveData.player.bag.push({ itemId: fillers[gameplay.saveData.player.bag.length % fillers.length]!, quantity: 1 });
    }
    const guardian = gameplay.monsters.find(({ monsterId }) => monsterId === 'guardian')!;
    gameplay.monsters[0] = {
      ...guardian, hp: 1, mode: 'idle',
      movement: { ...guardian.movement, position: { x: gameplay.movement.position.x + 40, y: 600 } },
    };

    let nowMs = 2000;
    const screens: string[] = [];
    for (let tick = 0; tick < 30; tick += 1) {
      nowMs += 1000 / 60;
      const step = stepGameplay(gameplay, {
        catalog,
        commands: tick === 0 ? [{ seq: 1, type: 'attack', payload: { skillId: 'basic' } }] : [],
        input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
        dtSeconds: 1 / 60, nowMs, random: createSeededRandom(77), nextEntityId,
      });
      gameplay = step.gameplay!;
      screens.push(step.screen);
    }

    expect(gameplay.bossResult).toBe(true);
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'guardian-core')).toBe(true);
    expect(gameplay.drops.some(({ itemId }) => itemId === 'guardian-sword')).toBe(true);
    expect(screens).not.toContain('result');
    expect(gameplay.toast).toContain('守衛的掉落物');
  });

  it('refuses to sell the guardian sword and lets a cleared guardian be fought again for it', () => {
    const nextEntityId = createNextEntityId('guardian-sword-shop');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.player = { ...gameplay.saveData.player, level: 30, coins: 9_999 };
    gameplay.saveData.flags = { bossDefeated: true, chapterComplete: true };
    gameplay.pendingTransition = { mapId: 'town', spawnId: 'left', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1000).gameplay!;
    const merchant = catalog.world.maps.town!.npcs.find(({ npcId }) => npcId === 'merchant')!;
    gameplay.movement.position = { x: merchant.x, y: merchant.y };
    const step = (commands: GameCommand[], nowMs: number) => stepGameplay(gameplay, {
      catalog, commands, input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0, nowMs, random: createSeededRandom(5), nextEntityId,
    }).gameplay!;
    gameplay = step([{ seq: 1, type: 'interact', payload: {} }], 1100);
    gameplay = step([{ seq: 2, type: 'buy', payload: { itemId: 'guardian-sword', quantity: 1 } }], 1200);
    expect(gameplay.saveData.player.coins).toBe(9_999);
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'guardian-sword')).toBe(false);
    // Same counter, an item the shop does stock: the purchase path itself works.
    gameplay = step([{ seq: 3, type: 'buy', payload: { itemId: 'steel-sword', quantity: 1 } }], 1250);
    expect(gameplay.saveData.player.coins).toBe(9_999 - catalog.rules.items['steel-sword']!.buyPrice);

    // After the chapter the arena still holds the guardian, so a sold or lost sword can be won back.
    gameplay.pendingTransition = { mapId: 'guardian-arena', spawnId: 'entry', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1300).gameplay!;
    expect(gameplay.monsters.some(({ monsterId, mode }) => monsterId === 'guardian' && mode !== 'dead')).toBe(true);
  });

  it('dismisses a toast six seconds after it appears', () => {
    const nextEntityId = createNextEntityId('toast-expiry');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.toast = '測試訊息';
    const step = (nowMs: number) => stepGameplay(gameplay, {
      catalog, commands: [], input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 1 / 60, nowMs, random: createSeededRandom(5), nextEntityId,
    }).gameplay!;
    gameplay = step(1000);
    gameplay = step(6900);
    expect(gameplay.toast).toBe('測試訊息');
    gameplay = step(7000);
    expect(gameplay.toast).toBeNull();
    gameplay.toast = '測試訊息';
    gameplay = step(7100);
    expect(gameplay.toast).toBe('測試訊息');
  });

  it('drops a frost fang, lets the player pick it up, and sell it to the merchant', () => {
    const nextEntityId = createNextEntityId('frost-wolf-loot');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.quests.q08 = { status: 'claimed', counters: {} };
    gameplay.pendingTransition = { mapId: 'frost-shore', spawnId: 'left', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1000).gameplay!;
    const wolf = gameplay.monsters.find(({ monsterId }) => monsterId === 'frost-wolf');
    if (!wolf) throw new Error('Expected a Frost Shore wolf.');
    gameplay.monsters = gameplay.monsters.map((monster) => monster.id === wolf.id
      ? {
        ...monster,
        hp: 1,
        mode: 'idle',
        movement: {
          ...monster.movement,
          position: { x: gameplay.movement.position.x + 40, y: 600 },
          velocity: { x: 0, y: 0 },
          mode: 'grounded',
        },
      }
      : monster);
    let nowMs = 2000;
    gameplay.combat.cooldowns[wolf.id] = { 'enemy-melee': nowMs + 30_000 };
    const run = (state: typeof gameplay, commands: GameCommand[], at: number) => stepGameplay(state, {
      catalog,
      commands,
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 1 / 60,
      nowMs: at,
      random: createSeededRandom(44),
      nextEntityId,
    }).gameplay!;
    for (let tick = 0; tick < 35; tick += 1) {
      gameplay = run(gameplay, tick === 0 ? [{ seq: 1, type: 'attack', payload: { skillId: 'basic' } }] : [], nowMs += 1000 / 60);
    }
    expect(gameplay.monsters.find(({ id }) => id === wolf.id)?.mode).toBe('dead');
    const fangDrop = gameplay.drops.find(({ itemId }) => itemId === 'frost-fang');
    expect(fangDrop).toBeDefined();
    if (!fangDrop) throw new Error('Expected the guaranteed Frost Fang drop.');
    gameplay.movement.position = { ...fangDrop.position };
    gameplay = run(gameplay, [{ seq: 2, type: 'pickup', payload: {} }], nowMs += 1000 / 60);
    expect(gameplay.drops.some(({ id }) => id === fangDrop.id)).toBe(false);
    expect(gameplay.saveData.player.bag.find(({ itemId }) => itemId === 'frost-fang')?.quantity).toBe(1);

    gameplay.pendingTransition = { mapId: 'town', spawnId: 'center', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    const merchant = catalog.world.maps.town!.npcs.find(({ npcId }) => npcId === 'merchant')!;
    gameplay.movement.position = { x: merchant.x, y: merchant.y };
    const fangIndex = gameplay.saveData.player.bag.findIndex(({ itemId }) => itemId === 'frost-fang');
    const coinsBeforeSale = gameplay.saveData.player.coins;
    gameplay = run(gameplay, [{ seq: 3, type: 'interact', payload: {} }], nowMs += 200);
    gameplay = run(gameplay, [{ seq: 4, type: 'sell', payload: { bagIndex: fangIndex, quantity: 1 } }], nowMs += 200);
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'frost-fang')).toBe(false);
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeSale + rulesCatalog.items['frost-fang'].sellPrice);
  });

  it('drops and sells an amber scale from a production shore scorpion', () => {
    const sandMap = catalog.world.maps['sand-glass-shore'];
    if (!sandMap) throw new Error('Expected the Gold Sand Shore map.');
    const firstScorpionSpawn = sandMap.monsters.find(({ monsterId }) => monsterId === 'sand-scorpion');
    if (!firstScorpionSpawn) throw new Error('Expected a production scorpion spawn.');
    expect(firstScorpionSpawn.spawnId).toBe('sand-glass-shore:sand-scorpion:1');
    const nextEntityId = createNextEntityId('sand-scorpion-loot');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.quests.q11 = { status: 'claimed', counters: { 'frost-tide-warden': 1 } };
    gameplay.saveData.player = { ...gameplay.saveData.player, level: 30 };
    gameplay.pendingTransition = { mapId: 'sand-glass-shore', spawnId: 'left', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1000).gameplay!;
    const scorpion = gameplay.monsters.find(({ spawnId }) => spawnId === firstScorpionSpawn.spawnId);
    if (!scorpion) throw new Error('Expected the production sand scorpion.');
    gameplay.movement.position = { x: firstScorpionSpawn.x - 40, y: firstScorpionSpawn.y };
    gameplay.monsters = gameplay.monsters.map((monster) => monster.id === scorpion.id
      ? { ...monster, hp: 1, mode: 'idle' }
      : monster);
    let nowMs = 2000;
    gameplay.combat.cooldowns[scorpion.id] = { 'sand-stinger': nowMs + 30_000 };
    const run = (state: typeof gameplay, commands: GameCommand[], at: number) => stepGameplay(state, {
      catalog,
      commands,
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 1 / 60,
      nowMs: at,
      random: createSeededRandom(45),
      nextEntityId,
    }).gameplay!;
    for (let tick = 0; tick < 35; tick += 1) {
      gameplay = run(gameplay, tick === 0 ? [{ seq: 1, type: 'attack', payload: { skillId: 'basic' } }] : [], nowMs += 1000 / 60);
    }
    expect(gameplay.monsters.find(({ id }) => id === scorpion.id)?.mode).toBe('dead');
    const scaleDrop = gameplay.drops.find(({ itemId }) => itemId === 'amber-scale');
    expect(scaleDrop).toBeDefined();
    if (!scaleDrop) throw new Error('Expected the guaranteed Amber Scale drop.');
    gameplay.movement.position = { ...scaleDrop.position };
    gameplay = run(gameplay, [{ seq: 2, type: 'pickup', payload: {} }], nowMs += 1000 / 60);
    expect(gameplay.drops.some(({ id }) => id === scaleDrop.id)).toBe(false);
    expect(gameplay.saveData.player.bag.find(({ itemId }) => itemId === 'amber-scale')?.quantity).toBe(1);

    gameplay.pendingTransition = { mapId: 'town', spawnId: 'center', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    const merchant = catalog.world.maps.town!.npcs.find(({ npcId }) => npcId === 'merchant')!;
    gameplay.movement.position = { x: merchant.x, y: merchant.y };
    const scaleIndex = gameplay.saveData.player.bag.findIndex(({ itemId }) => itemId === 'amber-scale');
    const coinsBeforeSale = gameplay.saveData.player.coins;
    gameplay = run(gameplay, [{ seq: 3, type: 'interact', payload: {} }], nowMs += 200);
    gameplay = run(gameplay, [{ seq: 4, type: 'sell', payload: { bagIndex: scaleIndex, quantity: 1 } }], nowMs += 200);
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'amber-scale')).toBe(false);
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeSale + catalog.rules.items['amber-scale'].sellPrice);
  });

  it('opens the Sand Dune Pass only after manually claiming the three-scorpion route quest', () => {
    const nextEntityId = createNextEntityId('q12-sand-route');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.quests.q11 = { status: 'claimed', counters: { 'frost-tide-warden': 1 } };
    gameplay.saveData.player = { ...gameplay.saveData.player, level: 30 };
    gameplay.pendingTransition = { mapId: 'sand-glass-shore', spawnId: 'left', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1000).gameplay!;

    const shore = catalog.world.maps['sand-glass-shore'];
    if (!shore) throw new Error('Expected the Gold Sand Shore map.');
    const guide = shore.npcs.find(({ npcId }) => npcId === 'sands-guide');
    const eastPortal = shore.portals.find(({ targetMapId }) => targetMapId === 'sand-dune-pass');
    const scorpionSpawns = shore.monsters.filter(({ monsterId }) => monsterId === 'sand-scorpion');
    if (!guide || !eastPortal) throw new Error('Expected the Sands Guide and the route portal.');
    expect(scorpionSpawns).toHaveLength(3);

    let nowMs = 2000;
    let seq = 1;
    const run = (state: typeof gameplay, commands: GameCommand[], at: number) => stepGameplay(state, {
      catalog,
      commands,
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 1 / 60,
      nowMs: at,
      random: createSeededRandom(46),
      nextEntityId,
    }).gameplay!;

    gameplay.movement.position = { x: guide.x, y: guide.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'acceptQuest', payload: { questId: 'q12' } }], nowMs += 100);
    expect(gameplay.saveData.quests.q12?.status).toBe('active');

    for (const monster of gameplay.monsters) {
      gameplay.combat.cooldowns[monster.id] = { 'sand-stinger': nowMs + 60_000 };
    }
    gameplay.movement.position = { x: eastPortal.x, y: eastPortal.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    expect(gameplay.pendingTransition).toBeNull();
    expect(gameplay.saveData.location.mapId).toBe('sand-glass-shore');

    for (const spawn of scorpionSpawns) {
      const scorpion = gameplay.monsters.find(({ spawnId }) => spawnId === spawn.spawnId);
      if (!scorpion) throw new Error('Expected production scorpion spawn ' + spawn.spawnId + '.');
      const playerX = spawn.x - 40;
      gameplay.movement.position = { ...gameplay.movement.position, x: playerX, y: 600 };
      gameplay.monsters = gameplay.monsters.map((monster) => monster.id === scorpion.id
        ? {
          ...monster,
          hp: 1,
          mode: 'idle',
          movement: {
            ...monster.movement,
            position: { x: playerX + 40, y: 600 },
            velocity: { x: 0, y: 0 },
            mode: 'grounded',
          },
        }
        : monster);
      gameplay.combat.cooldowns[scorpion.id] = { 'sand-stinger': nowMs + 60_000 };
      for (let tick = 0; tick < 35; tick += 1) {
        gameplay = run(gameplay, tick === 0 ? [{ seq: seq++, type: 'attack', payload: { skillId: 'basic' } }] : [], nowMs += 1000 / 60);
      }
      expect(gameplay.monsters.find(({ id }) => id === scorpion.id)?.mode).toBe('dead');

      const scaleDrop = gameplay.drops.find(({ itemId }) => itemId === 'amber-scale');
      if (!scaleDrop) throw new Error('Expected the guaranteed Amber Scale drop.');
      gameplay.movement.position = { ...scaleDrop.position };
      gameplay = run(gameplay, [{ seq: seq++, type: 'pickup', payload: {} }], nowMs += 200);
      const scaleCount = gameplay.saveData.player.bag
        .filter(({ itemId }) => itemId === 'amber-scale')
        .reduce((sum, stack) => sum + stack.quantity, 0);
      expect(scaleCount).toBe(gameplay.saveData.quests.q12?.counters['sand-scorpion']);
    }

    expect(gameplay.saveData.quests.q12?.counters['sand-scorpion']).toBe(3);
    expect(gameplay.saveData.player.bag.find(({ itemId }) => itemId === 'amber-scale')?.quantity).toBe(3);
    expect(getQuestView(gameplay.saveData, 'q12', catalog).status).toBe('ready');

    gameplay.movement.position = { x: eastPortal.x, y: eastPortal.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    expect(gameplay.pendingTransition).toBeNull();
    expect(getQuestView(gameplay.saveData, 'q12', catalog).status).toBe('ready');

    gameplay.movement.position = { x: guide.x, y: guide.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'claimQuest', payload: { questId: 'q12' } }], nowMs += 100);
    expect(gameplay.saveData.quests.q12?.status).toBe('claimed');
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'amber-scale')).toBe(false);

    gameplay.movement.position = { x: eastPortal.x, y: eastPortal.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    expect(gameplay.pendingTransition).toMatchObject({ mapId: 'sand-dune-pass', spawnId: 'left', after: 'travel' });
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    expect(gameplay.saveData.location.mapId).toBe('sand-dune-pass');

    const returnPortal = catalog.world.maps['sand-dune-pass']!.portals.find(({ targetMapId }) => targetMapId === 'sand-glass-shore');
    if (!returnPortal) throw new Error('Expected the free return portal from the pass.');
    gameplay.movement.position = { x: returnPortal.x, y: returnPortal.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    expect(gameplay.pendingTransition).toMatchObject({ mapId: 'sand-glass-shore', spawnId: 'right', after: 'travel' });
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    expect(gameplay.saveData.location.mapId).toBe('sand-glass-shore');
  });

  it('opens the Sunwell Basin after manually claiming q13 from production beetle spawns', () => {
    const nextEntityId = createNextEntityId('q13-sunwell-route');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.quests.q11 = { status: 'claimed', counters: { 'frost-tide-warden': 1 } };
    gameplay.saveData.quests.q12 = { status: 'claimed', counters: { 'sand-scorpion': 3 } };
    gameplay.saveData.player = { ...gameplay.saveData.player, level: 30 };
    expect(gameplay.saveData.quests).not.toHaveProperty('q13');
    expect(getQuestView(gameplay.saveData, 'q13', catalog).status).toBe('available');

    const shore = catalog.world.maps['sand-glass-shore'];
    if (!shore) throw new Error('Expected the Gold Sand Shore map.');
    const guide = shore.npcs.find(({ npcId }) => npcId === 'sands-guide');
    const shoreEast = shore.portals.find(({ targetMapId }) => targetMapId === 'sand-dune-pass');
    if (!guide || !shoreEast) throw new Error('Expected the Sands Guide and the dune entrance.');
    gameplay.pendingTransition = { mapId: 'sand-glass-shore', spawnId: 'left', after: 'travel' };
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, 1000).gameplay!;

    let nowMs = 2000;
    let seq = 1;
    const random = createSeededRandom(47);
    const run = (state: typeof gameplay, commands: GameCommand[], at: number) => stepGameplay(state, {
      catalog,
      commands,
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 1 / 60,
      nowMs: at,
      random,
      nextEntityId,
    }).gameplay!;

    gameplay.movement.position = { x: guide.x, y: guide.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'acceptQuest', payload: { questId: 'q13' } }], nowMs += 100);
    expect(gameplay.saveData.quests.q13?.status).toBe('active');
    gameplay.movement.position = { x: shoreEast.x, y: shoreEast.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    expect(gameplay.saveData.location.mapId).toBe('sand-dune-pass');

    const pass = catalog.world.maps['sand-dune-pass'];
    const basinGate = pass?.portals.find(({ targetMapId }) => targetMapId === 'sand-sunwell-basin');
    const beetleSpawns = pass?.monsters.filter(({ monsterId }) => monsterId === 'sunwell-beetle') ?? [];
    if (!pass || !basinGate) throw new Error('Expected the dune pass and locked Sunwell gate.');
    expect(beetleSpawns).toHaveLength(2);
    expect(Math.min(...pass.monsters.map(({ roamRight }) => basinGate.x - roamRight))).toBeGreaterThan(360);
    expect(beetleSpawns.map(({ spawnId }) => spawnId)).toEqual([
      'sand-dune-pass:sunwell-beetle:1', 'sand-dune-pass:sunwell-beetle:2',
    ]);
    gameplay.movement.position = { x: basinGate.x, y: basinGate.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    expect(gameplay.pendingTransition).toBeNull();
    expect(gameplay.saveData.location.mapId).toBe('sand-dune-pass');

    for (const spawn of beetleSpawns) {
      const beetle = gameplay.monsters.find(({ spawnId }) => spawnId === spawn.spawnId);
      if (!beetle) throw new Error('Expected production beetle spawn ' + spawn.spawnId + '.');
      const playerX = spawn.x - 40;
      gameplay.movement.position = { ...gameplay.movement.position, x: playerX, y: 600 };
      gameplay.monsters = gameplay.monsters.map((monster) => monster.id === beetle.id
        ? {
          ...monster,
          hp: 1,
          mode: 'idle',
          movement: {
            ...monster.movement,
            position: { x: playerX + 40, y: 600 },
            velocity: { x: 0, y: 0 },
            mode: 'grounded',
          },
        }
        : monster);
      gameplay.combat.cooldowns[beetle.id] = { 'sunwell-beetle-charge': nowMs + 60_000 };
      for (let tick = 0; tick < 35; tick += 1) {
        gameplay = run(gameplay, tick === 0 ? [{ seq: seq++, type: 'attack', payload: { skillId: 'basic' } }] : [], nowMs += 1000 / 60);
      }
      expect(gameplay.monsters.find(({ id }) => id === beetle.id)?.mode).toBe('dead');
      const shellDrop = gameplay.drops.find(({ itemId }) => itemId === 'sunwell-shell');
      if (!shellDrop) throw new Error('Expected the guaranteed Sunwell Shell drop.');
      gameplay.movement.position = { ...shellDrop.position };
      gameplay = run(gameplay, [{ seq: seq++, type: 'pickup', payload: {} }], nowMs += 200);
    }

    expect(gameplay.saveData.quests.q13?.counters['sunwell-beetle']).toBe(2);
    expect(getQuestView(gameplay.saveData, 'q13', catalog).status).toBe('ready');
    expect(gameplay.saveData.player.bag.find(({ itemId }) => itemId === 'sunwell-shell')?.quantity).toBe(2);

    const duneWest = pass.portals.find(({ targetMapId }) => targetMapId === 'sand-glass-shore')!;
    gameplay.movement.position = { x: duneWest.x, y: duneWest.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    expect(gameplay.pendingTransition).toMatchObject({ mapId: 'sand-glass-shore', spawnId: 'right', after: 'travel' });
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;

    gameplay.movement.position = { x: guide.x, y: guide.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'claimQuest', payload: { questId: 'q13' } }], nowMs += 100);
    expect(gameplay.saveData.quests.q13?.status).toBe('claimed');
    expect(gameplay.saveData.player.bag.find(({ itemId }) => itemId === 'sunwell-shell')?.quantity).toBe(2);

    gameplay.movement.position = { x: shoreEast.x, y: shoreEast.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    gameplay.movement.position = { x: basinGate.x, y: basinGate.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    expect(gameplay.pendingTransition).toMatchObject({ mapId: 'sand-sunwell-basin', spawnId: 'left', after: 'travel' });
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    expect(gameplay.saveData.location.mapId).toBe('sand-sunwell-basin');
    expect(gameplay.movement.position.x).toBe(100);
    const basin = catalog.world.maps['sand-sunwell-basin']!;
    expect(basin.monsters).toHaveLength(4);
    expect(Math.min(...basin.monsters.map(({ x }) => Math.abs(x - 100)))).toBeGreaterThan(400);

    const basinWest = basin.portals.find(({ targetMapId }) => targetMapId === 'sand-dune-pass')!;
    gameplay.movement.position = { x: basinWest.x, y: basinWest.y };
    gameplay = run(gameplay, [{ seq: seq++, type: 'interact', payload: {} }], nowMs += 100);
    expect(gameplay.pendingTransition).toMatchObject({ mapId: 'sand-dune-pass', spawnId: 'right', after: 'travel' });
    gameplay = completeMapTransition(gameplay, catalog, nextEntityId, nowMs + 100).gameplay!;
    expect(gameplay.saveData.location.mapId).toBe('sand-dune-pass');
  });
  it('requires merchant interaction to sell and falls back to large potions when small potions run out', () => {
    const nextEntityId = createNextEntityId('sell-and-potions');
    const started = startNewGame('旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.location = { mapId: 'town', spawnId: 'center' };
    gameplay.movement.position = { x: 960, y: 600 };
    gameplay.saveData.player = {
      ...gameplay.saveData.player,
      hp: 10,
      bag: [
        { itemId: 'snail-shell', quantity: 2 },
        { itemId: 'large-red', quantity: 2 },
      ],
    };

    const run = (state: typeof gameplay, commands: GameCommand[], nowMs: number) => stepGameplay(state, {
      catalog,
      commands,
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs,
      random: createSeededRandom(12),
      nextEntityId,
    }).gameplay!;

    const withoutMerchant = run(gameplay, [{ seq: 1, type: 'sell', payload: { bagIndex: 0, quantity: 1 } }], 1000);
    expect(withoutMerchant.saveData.player.bag.find(({ itemId }) => itemId === 'snail-shell')?.quantity).toBe(2);
    expect(withoutMerchant.toast).toContain('木葉商人');

    gameplay.interaction = { npcId: 'merchant', dialogue: [] };
    const withMerchant = run(gameplay, [{ seq: 2, type: 'sell', payload: { bagIndex: 0, quantity: 1 } }], 2000);
    expect(withMerchant.saveData.player.bag.find(({ itemId }) => itemId === 'snail-shell')?.quantity).toBe(1);

    const usedFallback = run(withMerchant, [{ seq: 3, type: 'useItem', payload: { itemId: 'small-red' } }], 3000);
    expect(usedFallback.saveData.player.hp).toBeGreaterThan(10);
    expect(usedFallback.saveData.player.bag.find(({ itemId }) => itemId === 'large-red')?.quantity).toBe(1);
    // Out of both blue potions: explain where to restock instead of a bookkeeping error.
    const noMana = run(withMerchant, [{ seq: 4, type: 'useItem', payload: { itemId: 'small-blue' } }], 4000);
    expect(noMana.saveData.player.bag).toEqual(withMerchant.saveData.player.bag);
    expect(noMana.toast).toContain('已經用完了');
    expect(noMana.toast).toContain('木葉商人');
  });
});
