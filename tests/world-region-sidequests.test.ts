import { describe, expect, it } from 'vitest';
import type { CommandDraft, GameCommand } from '../src/contracts/commands.js';
import { createNextEntityId, createSeededRandom } from '../src/contracts/helpers.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog, validateWorld } from '../src/content/world/index.js';
import { startNewGame, stepGameplay } from '../src/app/gameplay.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };
const idleInput = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };

describe('optional Frost and Sunwell region quests', () => {
  it('keeps the added quest, inspect target, prerequisites, and marker placement on exact allowlists', () => {
    expect(validateWorld(worldCatalog, rulesCatalog).ok).toBe(true);

    const unknownTarget = structuredClone(worldCatalog);
    unknownTarget.quests.q21!.objectives[0] = { type: 'inspect', targetId: 'unapproved-marker', count: 1 };
    expect(validateWorld(unknownTarget, rulesCatalog).ok).toBe(false);

    const wrongPrerequisite = structuredClone(worldCatalog);
    wrongPrerequisite.quests.q22!.prerequisiteIds = ['q12'];
    expect(validateWorld(wrongPrerequisite, rulesCatalog).ok).toBe(false);

    const movedMarker = structuredClone(worldCatalog);
    movedMarker.maps['frost-pine-pass']!.npcs[0]!.x = 1860;
    expect(validateWorld(movedMarker, rulesCatalog).ok).toBe(false);
  });

  it('records only a nearby, opened, active q21 marker inspection in Frost Pine Pass, capped at one', () => {
    const nextEntityId = createNextEntityId('frost-marker-inspect');
    const markerPlacement = worldCatalog.maps['frost-pine-pass'].npcs
      .find(({ npcId }) => npcId === 'frost-route-marker');
    if (!markerPlacement) throw new Error('Expected the q21 marker to be placed in Frost Pine Pass.');
    const started = startNewGame('航標旅人', catalog, nextEntityId);
    if ('error' in started) throw new Error(started.error);
    let gameplay = started.gameplay;
    gameplay.saveData.location = { mapId: 'frost-pine-pass', spawnId: 'left' };
    gameplay.saveData.visitedMaps.push('frost-pine-pass');
    gameplay.movement.position = { x: markerPlacement.x, y: markerPlacement.y };
    gameplay.interaction = { npcId: 'frost-route-marker', dialogue: [] };
    let nowMs = 1000;
    let seq = 1;
    const random = createSeededRandom(2102);
    const send = (draft: CommandDraft) => {
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
      if (!result.gameplay) throw new Error('Expected marker inspection gameplay to remain active.');
      gameplay = result.gameplay;
      return result;
    };

    send({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21).toBeUndefined();

    gameplay.saveData.quests.q09 = { status: 'claimed', counters: {} };
    gameplay.saveData.quests.q21 = { status: 'active', counters: { 'frost-route-marker': 0 } };
    send({ type: 'inspect', payload: { targetId: 'unapproved-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(0);

    gameplay.saveData.location.mapId = 'camp';
    send({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(0);
    gameplay.saveData.location.mapId = 'frost-pine-pass';

    gameplay.interaction = null;
    send({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(0);
    gameplay.interaction = { npcId: 'frost-route-marker', dialogue: [] };
    gameplay.movement.position = { x: 1980, y: 430 };
    send({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(0);
    gameplay.movement.position = { x: markerPlacement.x, y: markerPlacement.y };
    gameplay.pendingTransition = { mapId: 'camp', spawnId: 'start', after: 'travel' };
    send({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(0);
    gameplay.pendingTransition = null;

    send({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(1);
    send({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(gameplay.saveData.quests.q21?.counters['frost-route-marker']).toBe(1);
  });
});
