import { describe, expect, it } from 'vitest';
import type { CommandDraft, GameCommand } from '../../src/contracts/commands.js';
import { createNextEntityId, createSeededRandom } from '../../src/contracts/helpers.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { acceptQuest, getQuestView, recordQuestEvent } from '../../src/domain/quests/index.js';
import { restoreGame, stepGameplay } from '../../src/app/gameplay.js';
import { portalRequirements } from '../../src/ui/world-map-model.js';
import { beforeBSave } from '../ruins-b-fixtures.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const idleInput = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };

describe('Bell Sanctum closure quests', () => {
  it('gates entry on claimed q17, counts only active q18 kills, and claims both rewards manually', () => {
    const nextEntityId = createNextEntityId('ruins-c-quests');
    const gallery = worldCatalog.maps['ruins-echo-gallery']!;
    const sanctum = worldCatalog.maps['ruins-bell-sanctum']!;
    const entry = gallery.portals.find(({ targetMapId }) => targetMapId === 'ruins-bell-sanctum')!;
    const westReturn = sanctum.portals.find(({ targetMapId }) => targetMapId === 'ruins-echo-gallery')!;
    const save = beforeBSave();
    save.location = { mapId: 'ruins-echo-gallery', spawnId: 'left' };
    save.visitedMaps.push('ruins-echo-gallery');
    save.quests.q17 = {
      status: 'active',
      counters: { 'ruins-stele-west': 1, 'ruins-stele-east': 1, 'ruins-string-puppet': 2 },
    };

    expect(getQuestView(save, 'q17', catalog).status).toBe('ready');
    expect(portalRequirements(entry, save, catalog).open).toBe(false);
    expect(portalRequirements(westReturn, save, catalog).open).toBe(true);
    expect(acceptQuest(save, 'q18', catalog)).toMatchObject({ ok: false, code: 'LOCKED' });
    expect(worldCatalog.quests.q20?.prerequisiteIds).toEqual(['q16']);
    expect(getQuestView(save, 'q20', catalog).status).toBe('available');

    const earlyKill = recordQuestEvent(save.quests, { type: 'killed', monsterId: 'ruins-bell-keeper' }, worldCatalog);
    expect(earlyKill).not.toHaveProperty('q18');

    save.quests.q17!.status = 'claimed';
    expect(portalRequirements(entry, save, catalog).open).toBe(true);
    const accepted = acceptQuest(save, 'q18', catalog);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    const afterKill = recordQuestEvent(accepted.value.quests, { type: 'killed', monsterId: 'ruins-bell-keeper' }, worldCatalog);
    expect(afterKill.q18?.counters['ruins-bell-keeper']).toBe(1);
    expect(getQuestView({ ...accepted.value, quests: afterKill }, 'q18', catalog).status).toBe('ready');

    const flagsBefore = { ...save.flags };
    const readySave = {
      ...accepted.value,
      quests: afterKill,
      visitedMaps: [...accepted.value.visitedMaps, 'ruins-tide-camp', 'town'],
      location: { mapId: 'ruins-tide-camp', spawnId: 'left' },
      player: {
        ...accepted.value.player,
        coins: 5000,
        bag: Array.from({ length: 32 }, () => ({ itemId: 'stone-chip', quantity: 1 })),
      },
    };
    let gameplay = restoreGame(readySave, catalog, nextEntityId).gameplay;
    gameplay.movement.position = { x: 420, y: 600 };
    let seq = 1;
    let nowMs = 1000;
    const random = createSeededRandom(201810);
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
      if (!result.gameplay) throw new Error('Expected Bell Sanctum quest gameplay to remain active.');
      gameplay = result.gameplay;
      return result;
    };

    const coinsBeforeFailedClaim = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q18' } });
    expect(gameplay.toast).toContain('背包已滿');
    expect(gameplay.saveData.quests.q18?.status).toBe('active');
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeFailedClaim);
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'oathfarer-circlet')).toBe(false);
    expect(gameplay.saveData.flags).toEqual(flagsBefore);

    gameplay.saveData = {
      ...gameplay.saveData,
      player: { ...gameplay.saveData.player, bag: gameplay.saveData.player.bag.slice(1) },
    };
    command({ type: 'claimQuest', payload: { questId: 'q18' } });
    expect(gameplay.saveData.quests.q18?.status).toBe('claimed');
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeFailedClaim + 1600);
    expect(gameplay.saveData.player.bag.some(({ itemId }) => itemId === 'oathfarer-circlet')).toBe(true);
    expect(gameplay.saveData.flags).toEqual(flagsBefore);

    command({ type: 'acceptQuest', payload: { questId: 'q19' } });
    expect(getQuestView(gameplay.saveData, 'q19', catalog).status).toBe('ready');
    expect(gameplay.saveData.quests.q20).toBeUndefined();

    const returnSave = {
      ...gameplay.saveData,
      location: { mapId: 'town', spawnId: 'center' },
      visitedMaps: [...gameplay.saveData.visitedMaps, 'town'],
    };
    const townGame = restoreGame(returnSave, catalog, nextEntityId);
    gameplay = townGame.gameplay;
    gameplay.movement.position = { x: 700, y: 600 };
    const coinsBeforeQ19 = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q19' } });
    expect(gameplay.saveData.quests.q19?.status).toBe('claimed');
    expect(gameplay.saveData.player.coins).toBe(coinsBeforeQ19 + 300);
    expect(gameplay.saveData.flags).toEqual(flagsBefore);

    const sameCoins = gameplay.saveData.player.coins;
    command({ type: 'claimQuest', payload: { questId: 'q19' } });
    expect(gameplay.saveData.player.coins).toBe(sameCoins);
  });
});
