import { describe, expect, it } from 'vitest';
import type { CommandDraft, GameCommand } from '../src/contracts/commands.js';
import type { ContentCatalog } from '../src/contracts/definitions.js';
import { createNextEntityId, createSeededRandom } from '../src/contracts/helpers.js';
import type { GameplayState } from '../src/app/gameplay.js';
import { restoreGame, stepGameplay } from '../src/app/gameplay.js';
import { beforeBSave, ruinsBCatalog } from './ruins-b-fixtures.js';

const GALLERY_ID = 'ruins-echo-gallery';
const WEST_STELE_ID = 'ruins-stele-west';
const EAST_STELE_ID = 'ruins-stele-east';
const idleInput = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };

type Scenario = {
  catalog: ContentCatalog;
  gameplay: GameplayState;
  nextEntityId: () => string;
  nowMs: number;
  seq: number;
};

function scenario(active = false): Scenario {
  const catalog = ruinsBCatalog;
  const saveData = beforeBSave();
  saveData.location = { mapId: GALLERY_ID, spawnId: 'left' };
  saveData.visitedMaps.push(GALLERY_ID);
  if (active) {
    saveData.quests.q17 = {
      status: 'active',
      counters: { [WEST_STELE_ID]: 0, [EAST_STELE_ID]: 0, 'ruins-string-puppet': 0 },
    };
  }
  const nextEntityId = createNextEntityId('inspect-command');
  const restored = restoreGame(saveData, catalog, nextEntityId);
  const gameplay = restored.gameplay;
  gameplay.monsters = [];
  gameplay.movement = {
    ...gameplay.movement,
    position: { x: 900, y: 420 },
    velocity: { x: 0, y: 0 },
    mode: 'grounded',
    footholdId: `${GALLERY_ID}:platform-1`,
    ladderId: null,
  };
  return { catalog, gameplay, nextEntityId, nowMs: 1000, seq: 1 };
}

function send(s: Scenario, draft: CommandDraft) {
  const result = stepGameplay(s.gameplay, {
    catalog: s.catalog,
    commands: [{ ...draft, seq: s.seq++ } as GameCommand],
    input: idleInput,
    dtSeconds: 0,
    nowMs: s.nowMs,
    random: createSeededRandom(1701),
    nextEntityId: s.nextEntityId,
  });
  s.nowMs += 20;
  if (!result.gameplay) throw new Error('Expected inspect gameplay to remain initialized.');
  s.gameplay = result.gameplay;
  return result;
}

function interactWithStele(s: Scenario, targetId = WEST_STELE_ID): void {
  const placement = s.catalog.world.maps[GALLERY_ID]!.npcs.find(({ npcId }) => npcId === targetId)!;
  s.gameplay.movement.position = { x: placement.x, y: placement.y };
  send(s, { type: 'interact', payload: {} });
}

describe('authoritative stele inspection command', () => {
  it('keeps pre-acceptance text neutral, then records either stele once and reveals its history', () => {
    const beforeAcceptance = scenario();
    interactWithStele(beforeAcceptance);
    expect(beforeAcceptance.gameplay.interaction?.dialogue.join(' ')).toContain('更深的記錄仍被鹽霧遮住');
    expect(beforeAcceptance.gameplay.interaction?.dialogue.join(' ')).not.toContain('守護的是歸途');
    send(beforeAcceptance, { type: 'inspect', payload: { targetId: WEST_STELE_ID } });
    expect(beforeAcceptance.gameplay.saveData.quests.q17).toBeUndefined();
    expect(beforeAcceptance.gameplay.interaction?.dialogue.join(' ')).not.toContain('守護的是歸途');

    const active = scenario(true);
    const coinsBefore = active.gameplay.saveData.player.coins;
    interactWithStele(active);
    expect(active.gameplay.interaction?.dialogue.join(' ')).not.toContain('守護的是歸途');
    send(active, { type: 'inspect', payload: { targetId: WEST_STELE_ID } });
    expect(active.gameplay.saveData.quests.q17?.counters[WEST_STELE_ID]).toBe(1);
    expect(active.gameplay.interaction?.dialogue).toContain('守護的是歸途，');
    expect(active.gameplay.saveData.player.coins).toBe(coinsBefore);

    send(active, { type: 'inspect', payload: { targetId: WEST_STELE_ID } });
    expect(active.gameplay.saveData.quests.q17?.counters[WEST_STELE_ID]).toBe(1);
    expect(active.gameplay.saveData.player.coins).toBe(coinsBefore);

    interactWithStele(active, EAST_STELE_ID);
    send(active, { type: 'inspect', payload: { targetId: EAST_STELE_ID } });
    expect(active.gameplay.saveData.quests.q17?.counters[EAST_STELE_ID]).toBe(1);
    expect(active.gameplay.interaction?.dialogue).toContain('不是封鎖所有來路。');
  });

  it('rejects commands unless the full current interaction context is valid', () => {
    const cases: { name: string; setup: (s: Scenario) => void; expectedCounter?: number }[] = [
      { name: 'dead player', setup: (s) => { s.gameplay.saveData.player.hp = 0; }, expectedCounter: 0 },
      { name: 'wrong map', setup: (s) => { s.gameplay.saveData.location.mapId = 'camp'; }, expectedCounter: 0 },
      { name: 'missing placement', setup: (s) => {
        const map = s.catalog.world.maps[GALLERY_ID]!;
        s.catalog = { ...s.catalog, world: { ...s.catalog.world, maps: {
          ...s.catalog.world.maps,
          [GALLERY_ID]: { ...map, npcs: map.npcs.filter(({ npcId }) => npcId !== WEST_STELE_ID) },
        } } };
      }, expectedCounter: 0 },
      { name: 'over 64px away', setup: (s) => { s.gameplay.movement.position = { x: 965, y: 420 }; }, expectedCounter: 0 },
      { name: 'different current interaction', setup: (s) => {
        s.gameplay.interaction = { npcId: EAST_STELE_ID, dialogue: [] };
      }, expectedCounter: 0 },
      { name: 'unknown target', setup: (s) => {
        s.gameplay.interaction = { npcId: 'not-a-stele', dialogue: [] };
      }, expectedCounter: 0 },
      { name: 'quest not accepted', setup: (s) => { delete s.gameplay.saveData.quests.q17; }, expectedCounter: 0 },
      { name: 'already claimed quest', setup: (s) => {
        s.gameplay.saveData.quests.q17 = {
          status: 'claimed',
          counters: { [WEST_STELE_ID]: 1, [EAST_STELE_ID]: 1, 'ruins-string-puppet': 2 },
        };
      }, expectedCounter: 1 },
      { name: 'pending transition', setup: (s) => {
        s.gameplay.pendingTransition = { mapId: 'camp', spawnId: 'start', after: 'travel' };
      }, expectedCounter: 0 },
    ];

    for (const testCase of cases) {
      const s = scenario(true);
      s.gameplay.interaction = { npcId: WEST_STELE_ID, dialogue: [] };
      testCase.setup(s);
      const before = s.gameplay.saveData.quests.q17?.counters[WEST_STELE_ID] ?? 0;
      send(s, { type: 'inspect', payload: { targetId: WEST_STELE_ID } });
      expect(s.gameplay.saveData.quests.q17?.counters[WEST_STELE_ID] ?? 0, testCase.name)
        .toBe(testCase.expectedCounter ?? before);
    }
  });

  it('adds the two-echo closing line to the pathfinder after q17 is claimed', () => {
    const s = scenario();
    s.gameplay.saveData.quests.q17 = {
      status: 'claimed',
      counters: { [WEST_STELE_ID]: 1, [EAST_STELE_ID]: 1, 'ruins-string-puppet': 2 },
    };
    s.gameplay.movement.position = { x: 300, y: 600 };
    send(s, { type: 'interact', payload: {} });
    expect(s.gameplay.interaction?.npcId).toBe('ruins-pathfinder');
    expect(s.gameplay.interaction?.dialogue.join(' ')).toContain('兩段回聲都記下來了');
  });

  it('keeps both active quest summaries in the pathfinder interaction', () => {
    const s = scenario(true);
    s.gameplay.saveData.quests.q20 = { status: 'active', counters: { 'ruins-bell-prowler': 0 } };
    s.gameplay.movement.position = { x: 300, y: 600 };
    send(s, { type: 'interact', payload: {} });

    expect(s.gameplay.interaction?.dialogue).toContain(s.catalog.world.quests.q17!.progressText);
    expect(s.gameplay.interaction?.dialogue).toContain(s.catalog.world.quests.q20!.progressText);
  });
});
