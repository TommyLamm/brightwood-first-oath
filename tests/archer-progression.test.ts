import { describe, expect, it } from 'vitest';
import type { GameCommand, SaveData } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { ARCHERY_TARGET_IDS, BOW_BY_SWORD, classItemId, questForPlayer } from '../src/content/world/class-quests.js';
import { startNewGame, stepGameplay, type GameplayState } from '../src/app/gameplay.js';
import { acceptQuest, getQuestView } from '../src/domain/quests/index.js';
import { resolveQuestClaim } from '../src/domain/quests/claim.js';
import { deriveStats } from '../src/domain/progression/index.js';
import { createMonster } from '../src/domain/actors/index.js';
import { validateSave } from '../src/persistence/index.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
let sequence = 0;
const nextId = (): string => `trial-${++sequence}`;
function learner(): GameplayState {
  const result = startNewGame('青翎學員', catalog, nextId, 'archer');
  if ('error' in result) throw new Error(result.error);
  const game = result.gameplay;
  game.saveData.player.level = 3; game.saveData.player.ap = 10;
  const stats = deriveStats(game.saveData.player, rulesCatalog);
  game.saveData.player.hp = stats.maxHp; game.saveData.player.mp = stats.maxMp;
  game.saveData.quests.q01 = { status: 'claimed', counters: { snail: 3 } };
  game.saveData.visitedMaps.push('town'); game.saveData.location = { mapId: 'town', spawnId: 'left' };
  game.monsters = [];
  place(game, 320, 600, 1);
  return game;
}
function place(game: GameplayState, x: number, y: number, facing: -1 | 1): void {
  game.movement = { ...game.movement, position: { x, y }, velocity: { x: 0, y: 0 }, facing, mode: 'grounded',
    footholdId: worldCatalog.maps.town!.footholds.find((line) => line.x1 <= x && line.x2 >= x && line.y1 === y && line.y2 === y)!.id };
}
function step(game: GameplayState, nowMs: number, dtSeconds: number, command?: Omit<GameCommand, 'seq'>): GameplayState {
  return stepGameplay(game, { catalog, input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
    commands: command ? [{ ...command, seq: ++sequence } as GameCommand] : [], dtSeconds, nowMs, nextEntityId: nextId,
    random: { next: () => 0.5 } }).gameplay!;
}
function readyTrial(): SaveData {
  const initial = learner().saveData;
  const accepted = acceptQuest(initial, 'q02', catalog);
  if (!accepted.ok) throw new Error(accepted.message);
  accepted.value.quests.q02!.counters = { town: 1, ...Object.fromEntries(ARCHERY_TARGET_IDS.map((id) => [id, 1])) };
  return accepted.value;
}

describe('archer trial and route rewards', () => {
  it('requires real arrow hits on three targets, then graduates once with the bow and one starting SP', () => {
    let game = step(learner(), 0, 0, { type: 'acceptQuest', payload: { questId: 'q02' } });
    expect(getQuestView(game.saveData, 'q02', catalog).status).toBe('active');
    game = step(game, 0, 0, { type: 'inspect', payload: { targetId: ARCHERY_TARGET_IDS[0] } });
    expect(game.saveData.quests.q02!.counters[ARCHERY_TARGET_IDS[0]]).toBe(0);
    const shoot = (now: number, x: number, y: number, facing: -1 | 1): void => {
      place(game, x, y, facing);
      game = step(game, now, 0, { type: 'attack', payload: { skillId: 'basic' } });
      game = step(game, now + 180, 0.18); game = step(game, now + 480, 0.3);
    };
    shoot(1000, 320, 600, 1);
    shoot(2000, 320, 600, 1);
    expect(game.saveData.quests.q02!.counters[ARCHERY_TARGET_IDS[0]]).toBe(1);
    shoot(3000, 720, 500, -1);
    shoot(4000, 1280, 500, 1);
    expect(getQuestView(game.saveData, 'q02', catalog).status).toBe('ready');
    place(game, 320, 600, 1);
    game = step(game, 5000, 0, { type: 'claimQuest', payload: { questId: 'q02' } });
    expect(game.saveData.player).toMatchObject({ job: 'archer', level: 10, sp: 1 });
    expect(game.saveData.player.bag).toContainEqual({ itemId: 'iron-bow', quantity: 1 });
    expect(game.saveData.quests.q02!.status).toBe('claimed');
    expect(validateSave(game.saveData, catalog).ok).toBe(true);
    const before = structuredClone(game.saveData);
    game = step(game, 5100, 0, { type: 'claimQuest', payload: { questId: 'q02' } });
    expect(game.saveData).toEqual(before);
  });

  it('keeps a full-bag graduation atomic and leaves the swordsman route unchanged', () => {
    const data = readyTrial();
    data.player.bag = Array.from({ length: 32 }, () => ({ itemId: 'small-red', quantity: 99 }));
    const original = structuredClone(data);
    const rejected = resolveQuestClaim(data, 'q02', catalog);
    expect(rejected).toMatchObject({ ok: false, code: 'BAG_FULL' });
    expect(data).toEqual(original);
    const sword = learner().saveData;
    sword.player.plannedJob = 'swordsman'; sword.player.equipment.weapon = 'starter-sword';
    sword.player.hp = 80; sword.player.mp = 40;
    expect(getQuestView(sword, 'q02', catalog).reward.items).toEqual([{ itemId: 'iron-sword', quantity: 1 }]);
    expect(questForPlayer(worldCatalog.quests.q02!, sword.player).giverNpcId).toBe('mentor');
  });

  it('uses the same bow mapping for previews, equipment objectives and claims without converting owned swords', () => {
    const data = readyTrial();
    data.player.bag.push({ itemId: 'iron-sword', quantity: 1 });
    const claim = resolveQuestClaim(data, 'q02', catalog);
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;
    expect(claim.value.player.bag).toContainEqual({ itemId: 'iron-sword', quantity: 1 });
    expect(claim.value.reward).toEqual(getQuestView(data, 'q02', catalog).reward);
    for (const id of ['q05', 'q11', 'q14']) {
      const original = worldCatalog.quests[id]!;
      expect(getQuestView(data, id, catalog).reward.items).toEqual(original.reward.items.map((item) =>
        ({ ...item, itemId: classItemId(item.itemId, data.player) })));
    }
    expect(questForPlayer(worldCatalog.quests.q06!, data.player).objectives).toContainEqual({ type: 'equip', targetId: 'steel-bow', count: 1 });
    for (const [sword, bow] of Object.entries(BOW_BY_SWORD)) {
      expect(rulesCatalog.items[bow]).toMatchObject({ attack: rulesCatalog.items[sword]!.attack,
        minLevel: rulesCatalog.items[sword]!.minLevel, allowedJobs: ['archer'] });
    }
  });

  it('maps the guardian prize when the drop is created and preserves existing sword items', () => {
    let game = learner();
    const arena = worldCatalog.maps['guardian-arena']!;
    game.saveData.location = { mapId: arena.id, spawnId: arena.spawns[0]!.id };
    game.saveData.player.bag.push({ itemId: 'iron-sword', quantity: 1 });
    const guardian = createMonster(nextId(), arena.monsters[0]!, arena, rulesCatalog);
    guardian.hp = 0; guardian.mode = 'dead'; guardian.deadAtMs = 0; guardian.deathReported = false;
    game.monsters = [guardian];
    game = step(game, 1000, 1 / 60);
    const items = [...game.saveData.player.bag.map(({ itemId }) => itemId), ...game.drops.map(({ itemId }) => itemId)];
    expect(items).toContain('guardian-bow');
    expect(items).not.toContain('guardian-sword');
    expect(items).toContain('iron-sword');
  });
});
