import { describe, expect, it } from 'vitest';
import type { GameCommand } from '../../src/contracts/commands.js';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { acceptQuest } from '../../src/domain/quests/index.js';
import { completeMapTransition, failMapTransition, makeWorldSnapshot, startNewGame, stepGameplay } from '../../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

describe('app gameplay vertical slice', () => {
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
    expect(gameplay.saveData.player.exp).toBe(20);
    expect(gameplay.saveData.quests.q01?.counters.snail).toBe(1);
    expect(gameplay.drops.some(({ coins }) => coins === 5)).toBe(true);
    expect(gameplay.drops.some(({ itemId }) => itemId === 'snail-shell')).toBe(true);

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
    expect(snapshot.monsters).toHaveLength(1);
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
    trained.saveData.player.skillRanks['rest-recovery'] = 1;
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
});
