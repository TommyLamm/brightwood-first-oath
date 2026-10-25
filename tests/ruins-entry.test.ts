import { describe, expect, it } from 'vitest';
import type { EntityId, SaveData, StorageLike } from '../src/contracts/index.js';
import type { CommandDraft, GameCommand } from '../src/contracts/commands.js';
import { createNextEntityId, createSeededRandom } from '../src/contracts/helpers.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { validateWorld } from '../src/content/world/validate.js';
import { getQuestView } from '../src/domain/quests/index.js';
import { completeMapTransition, restoreGame, startNewGame, stepGameplay } from '../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const idleInput = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };

function makeLegacySave(nextEntityId: () => EntityId): SaveData {
  const started = startNewGame('潮痕旅人', catalog, nextEntityId);
  if ('error' in started) throw new Error(started.error);
  const save = structuredClone(started.gameplay.saveData);
  save.player.level = 30;
  save.player.coins = 5000;
  save.quests = Object.fromEntries(Array.from({ length: 13 }, (_, index) => {
    const questId = `q${String(index + 1).padStart(2, '0')}`;
    return [questId, { status: 'claimed', counters: {} }];
  })) as SaveData['quests'];
  save.visitedMaps = ['camp', 'town', 'sand-glass-shore'];
  save.location = { mapId: 'sand-glass-shore', spawnId: 'left' };
  return save;
}

describe('ancient ruins entry chapter', () => {
  it('keeps the new routes usable, gates entry and the causeway on claimed quests, and lets the player return freely', () => {
    const nextEntityId = createNextEntityId('ruins-entry');
    const restored = restoreGame(makeLegacySave(nextEntityId), catalog, nextEntityId);
    let gameplay = restored.gameplay;
    let seq = 1;
    let nowMs = 1000;
    const random = createSeededRandom(1516);
    const command = (draft: CommandDraft) => {
      const result = stepGameplay(gameplay, {
        catalog,
        commands: [{ ...draft, seq: seq++ } as GameCommand],
        input: idleInput,
        dtSeconds: 0,
        nowMs,
        random,
        nextEntityId,
      });
      nowMs += 20;
      if (!result.gameplay) throw new Error('Expected ruins gameplay to remain active.');
      gameplay = result.gameplay;
      return result;
    };
    const interactAt = (x: number, y: number) => {
      gameplay.movement.position = { x, y };
      return command({ type: 'interact', payload: {} });
    };
    const finishTravel = () => {
      const result = completeMapTransition(gameplay, catalog, nextEntityId, nowMs);
      if (!result.gameplay) throw new Error('Expected the map transition to complete.');
      gameplay = result.gameplay;
    };
    const travelAt = (x: number, y: number, targetMapId: string) => {
      const result = interactAt(x, y);
      expect(result.gameplay?.pendingTransition?.mapId).toBe(targetMapId);
      finishTravel();
    };

    expect(gameplay.saveData.quests).not.toHaveProperty('q14');
    expect(gameplay.saveData.quests).not.toHaveProperty('q15');
    expect(gameplay.saveData.quests).not.toHaveProperty('q16');
    expect(getQuestView(gameplay.saveData, 'q15', catalog).status).toBe('locked');

    const lockedSouthGate = interactAt(160, 480);
    expect(lockedSouthGate.gameplay?.pendingTransition).toBeNull();
    expect(lockedSouthGate.gameplay?.toast).toContain('日井守衛的誓約');

    gameplay.saveData.quests.q14 = { status: 'claimed', counters: { 'sunwell-sentinel': 1 } };
    expect(getQuestView(gameplay.saveData, 'q15', catalog).status).toBe('available');
    interactAt(250, 600);
    expect(gameplay.interaction?.npcId).toBe('sands-guide');
    command({ type: 'acceptQuest', payload: { questId: 'q15' } });
    expect(gameplay.saveData.quests.q15?.status).toBe('active');

    travelAt(160, 480, 'ruins-tide-camp');
    expect(gameplay.saveData.location.mapId).toBe('ruins-tide-camp');
    expect(gameplay.movement.position).toEqual({ x: 240, y: 600 });
    expect(getQuestView(gameplay.saveData, 'q15', catalog).status).toBe('ready');

    const lockedCauseway = interactAt(860, 600);
    expect(lockedCauseway.gameplay?.pendingTransition).toBeNull();
    expect(lockedCauseway.gameplay?.toast).toContain('南方的錯拍');

    travelAt(100, 600, 'sand-glass-shore');
    expect(gameplay.movement.position).toEqual({ x: 280, y: 480 });
    expect(getQuestView(gameplay.saveData, 'q15', catalog).status).toBe('ready');
    travelAt(160, 480, 'ruins-tide-camp');

    gameplay.movement.position = { x: 420, y: 600 };
    command({ type: 'claimQuest', payload: { questId: 'q15' } });
    expect(gameplay.saveData.quests.q15?.status).toBe('claimed');
    expect(gameplay.saveData.player.bag).toContainEqual({ itemId: 'large-red', quantity: 6 });
    expect(gameplay.saveData.player.bag).toContainEqual({ itemId: 'large-blue', quantity: 3 });

    command({ type: 'acceptQuest', payload: { questId: 'q16' } });
    expect(gameplay.saveData.quests.q16?.status).toBe('active');

    travelAt(280, 600, 'town');
    expect(gameplay.saveData.location).toEqual({ mapId: 'town', spawnId: 'ruins-camp' });
    travelAt(1650, 600, 'ruins-tide-camp');
    expect(gameplay.saveData.location).toEqual({ mapId: 'ruins-tide-camp', spawnId: 'town-entry' });
    travelAt(860, 600, 'ruins-root-causeway');

    const rootMap = worldCatalog.maps['ruins-root-causeway']!;
    expect(gameplay.monsters.filter(({ monsterId }) => monsterId === 'ruins-moss-carapace')).toHaveLength(3);
    for (const spawn of rootMap.monsters) {
      const target = gameplay.monsters.find(({ spawnId }) => spawnId === spawn.spawnId);
      if (!target) throw new Error(`Expected active monster ${spawn.spawnId}.`);
      gameplay.monsters = gameplay.monsters.map((monster) => monster.id === target.id
        ? {
            ...monster,
            hp: 1,
            mode: 'idle',
            lastAttackAtMs: nowMs + 10_000,
            idleUntilMs: nowMs + 10_000,
            movement: {
              ...monster.movement,
              position: { x: spawn.x, y: spawn.y },
              velocity: { x: 0, y: 0 },
              mode: 'grounded',
              footholdId: 'ruins-root-causeway:ground',
            },
          }
        : monster);
      gameplay.movement = { ...gameplay.movement, position: { x: spawn.x - 40, y: 600 }, facing: 1 };
      gameplay.combat = { ...gameplay.combat, cooldowns: { ...gameplay.combat.cooldowns, [gameplay.playerEntityId]: {} } };

      for (let tick = 0; tick < 60; tick += 1) {
        const result = stepGameplay(gameplay, {
          catalog,
          commands: tick === 0 ? [{ seq: seq++, type: 'attack', payload: { skillId: 'basic' } }] : [],
          input: idleInput,
          dtSeconds: 1 / 60,
          nowMs,
          random,
          nextEntityId,
        });
        nowMs += 1000 / 60;
        if (!result.gameplay) throw new Error('Expected the causeway encounter to remain active.');
        gameplay = result.gameplay;
      }
      expect(gameplay.monsters.find(({ id }) => id === target.id)?.mode).toBe('dead');
    }
    expect(gameplay.saveData.quests.q16?.counters['ruins-moss-carapace']).toBe(3);
    expect(getQuestView(gameplay.saveData, 'q16', catalog).status).toBe('ready');

    travelAt(100, 600, 'ruins-tide-camp');
    gameplay.movement.position = { x: 420, y: 600 };
    const coinsBeforeClaim = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q16' } });
    expect(gameplay.saveData.quests.q16?.status).toBe('claimed');
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeClaim + 700);

    travelAt(100, 600, 'sand-glass-shore');
    expect(gameplay.saveData.location.mapId).toBe('sand-glass-shore');
  });

  it('keeps NPC and portal interaction ranges separate on the new routes', () => {
    expect(validateWorld(worldCatalog, rulesCatalog).ok).toBe(true);
    expect(worldCatalog.maps.town!.portals.find(({ targetMapId }) => targetMapId === 'ruins-tide-camp')?.requiredQuestId).toBe('q15');
    expect(worldCatalog.maps['ruins-tide-camp']!.portals.find(({ targetMapId }) => targetMapId === 'town')?.requiredQuestId).toBeNull();
    expect(worldCatalog.maps['ruins-root-causeway']!.portals.map(({ targetMapId }) => targetMapId)).toEqual(['ruins-tide-camp', 'ruins-echo-gallery']);

    for (const mapId of ['sand-glass-shore', 'town', 'ruins-tide-camp', 'ruins-root-causeway']) {
      const map = worldCatalog.maps[mapId]!;
      for (const portal of map.portals) {
        for (const npc of map.npcs) {
          expect(Math.hypot(portal.x - npc.x, portal.y - npc.y), `${mapId}: ${npc.npcId}/${portal.id}`)
            .toBeGreaterThan(128);
        }
      }
    }
  });
});
