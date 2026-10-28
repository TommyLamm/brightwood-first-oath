import { describe, expect, it } from 'vitest';
import type { GameCommand } from '../src/contracts/commands.js';
import type { ContentCatalog, MapDef, SaveData } from '../src/contracts/index.js';
import { createNextEntityId, createSeededRandom } from '../src/contracts/helpers.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { acceptQuest, getQuestView, recordQuestEvent } from '../src/domain/quests/index.js';
import { startNewGame, stepGameplay } from '../src/app/gameplay.js';
import { KeyboardInputState } from '../src/app/keyboard.js';
import {
  INTERACTION_RANGE_PX,
  nearestNpcPlacement,
  portalBlockMessage,
  resolveInteractionTarget,
} from '../src/app/interaction-target.js';

const catalog: ContentCatalog = { rules: rulesCatalog, world: worldCatalog };

function startGameplay() {
  const started = startNewGame('旅人', catalog, createNextEntityId('interaction-target'));
  if ('error' in started) throw new Error(started.error);
  return started.gameplay;
}

function mapWith(
  npcs: MapDef['npcs'] = [],
  portals: MapDef['portals'] = [],
): MapDef {
  return { ...worldCatalog.maps.camp!, npcs, portals };
}

function portalAt(
  id: string,
  x: number,
  y: number,
  overrides: Partial<MapDef['portals'][number]> = {},
): MapDef['portals'][number] {
  return { ...worldCatalog.maps.camp!.portals[0]!, ...overrides, id, x, y };
}

function saveForQuestStatus(status: 'available' | 'active' | 'ready' | 'claimed'): SaveData {
  const gameplay = startGameplay();
  if (status === 'available') return gameplay.saveData;

  const accepted = acceptQuest(gameplay.saveData, 'q01', catalog);
  if (!accepted.ok) throw new Error(accepted.message);
  let save = accepted.value;
  if (status === 'ready' || status === 'claimed') {
    for (let count = 0; count < 3; count += 1) {
      save = {
        ...save,
        quests: recordQuestEvent(save.quests, { type: 'killed', monsterId: 'snail' }, catalog.world),
      };
    }
    if (getQuestView(save, 'q01', catalog).status !== 'ready') throw new Error('q01 did not reach ready status');
  }
  if (status === 'claimed') {
    const guide = catalog.world.maps.camp!.npcs.find(({ npcId }) => npcId === 'guide')!;
    gameplay.saveData = save;
    gameplay.movement = { ...gameplay.movement, position: { x: guide.x, y: guide.y } };
    const result = stepGameplay(gameplay, {
      catalog,
      commands: [{ seq: 1, type: 'claimQuest', payload: { questId: 'q01' } }],
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 0,
      nowMs: 100,
      random: createSeededRandom(1),
      nextEntityId: createNextEntityId('interaction-target-claim'),
    });
    if (!result.gameplay || getQuestView(result.gameplay.saveData, 'q01', catalog).status !== 'claimed') {
      throw new Error('q01 did not reach claimed status');
    }
    save = result.gameplay.saveData;
  }
  return save;
}

describe('shared interaction target', () => {
  it.each([
    { kind: 'npc' as const, distance: 64, id: 'guide' },
    { kind: 'npc' as const, distance: 64.01, id: null },
    { kind: 'portal' as const, distance: 64, id: 'edge-route' },
    { kind: 'portal' as const, distance: 64.01, id: null },
  ])('uses the inclusive 64px range for $kind at $distance', ({ kind, distance, id }) => {
    const map = kind === 'npc'
      ? mapWith([{ npcId: 'guide', x: distance, y: 0 }])
      : mapWith([], [portalAt('edge-route', distance, 0)]);
    const target = resolveInteractionTarget(map, { x: 0, y: 0 });

    if (kind === 'npc') {
      expect(nearestNpcPlacement(map, { x: 0, y: 0 }, INTERACTION_RANGE_PX)?.npcId ?? null).toBe(id);
      expect(target?.kind === 'npc' ? target.placement.npcId : null).toBe(id);
    } else {
      expect(target?.kind === 'portal' ? target.portal.id : null).toBe(id);
    }
  });

  it.each(['npc', 'portal'] as const)('breaks equal-distance %s targets by ID', (kind) => {
    const map = kind === 'npc'
      ? mapWith([
          { npcId: 'z-guide', x: 20, y: 0 },
          { npcId: 'a-guide', x: -20, y: 0 },
        ])
      : mapWith([], [
          portalAt('z-route', 20, 0),
          portalAt('a-route', -20, 0),
        ]);
    const target = resolveInteractionTarget(map, { x: 0, y: 0 });

    if (kind === 'npc') {
      expect(nearestNpcPlacement(map, { x: 0, y: 0 }, INTERACTION_RANGE_PX)?.npcId).toBe('a-guide');
      expect(target).toMatchObject({ kind: 'npc', placement: { npcId: 'a-guide' } });
    } else {
      expect(target).toMatchObject({ kind: 'portal', portal: { id: 'a-route' } });
    }
  });

  it('chooses an in-range NPC over a closer locked portal', () => {
    const map = mapWith(
      [{ npcId: 'guide', x: 20, y: 0 }],
      [portalAt('locked-route', 1, 0, { minLevel: 99, requiredQuestId: 'q01' })],
    );

    expect(resolveInteractionTarget(map, { x: 0, y: 0 })).toMatchObject({
      kind: 'npc',
      placement: { npcId: 'guide' },
    });
  });

  it('reports the level gate before an unmet quest gate', () => {
    const portal = portalAt('level-route', 0, 0, { minLevel: 20, requiredQuestId: 'q01' });
    expect(portalBlockMessage(startGameplay().saveData, portal, catalog)).toBe('需要等級 20 才能通過。');
  });

  it.each([
    {
      status: 'available' as const,
      expected: '向森芽接取並完成「第一次出發」後才能前往木葉鎮。',
    },
    {
      status: 'active' as const,
      expected: '完成任務「第一次出發」後才能前往木葉鎮。',
    },
    {
      status: 'ready' as const,
      expected: '向森芽回報「第一次出發」後才能前往木葉鎮。',
    },
    {
      status: 'claimed' as const,
      expected: null,
    },
  ])('keeps the $status quest instruction until it is claimed', ({ status, expected }) => {
    const portal = portalAt('quest-route', 0, 0, { minLevel: 1, requiredQuestId: 'q01' });
    expect(portalBlockMessage(saveForQuestStatus(status), portal, catalog)).toBe(expected);
  });

  it('uses the current target for Space and keeps the existing no-target and nearest-NPC behavior', () => {
    const keyboard = new KeyboardInputState();
    const keyContext = { focused: true, textInput: false, panels: [] as const };
    const keyDownSpace = (seq: number): GameCommand => {
      const command = keyboard.keyDown('Space', keyContext).command;
      keyboard.keyUp('Space');
      if (!command) throw new Error('Space did not produce an interaction command');
      return { ...command, seq };
    };
    const step = (
      gameplay: ReturnType<typeof startGameplay>,
      activeCatalog: ContentCatalog,
      commands: GameCommand[],
      seq: number,
    ) => stepGameplay(gameplay, {
      catalog: activeCatalog,
      commands,
      input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
      dtSeconds: 1 / 60,
      nowMs: seq * 100,
      random: createSeededRandom(seq),
      nextEntityId: createNextEntityId('interaction-target-step'),
    });

    const noTargetGame = startGameplay();
    const camp = catalog.world.maps[noTargetGame.saveData.location.mapId]!;
    expect(resolveInteractionTarget(camp, noTargetGame.movement.position)).toBeNull();
    const noTargetResult = step(noTargetGame, catalog, [keyDownSpace(1)], 1);
    expect(noTargetResult.gameplay?.toast).toBe('附近沒有可以互動的對象或出入口。');

    const customMap = {
      ...catalog.world.maps.camp!,
      npcs: [
        { npcId: 'mentor', x: 8, y: 0 },
        { npcId: 'guide', x: 16, y: 0 },
      ],
    };
    const activeCatalog: ContentCatalog = {
      ...catalog,
      world: { ...catalog.world, maps: { ...catalog.world.maps, camp: customMap } },
    };
    const gameplay = startGameplay();
    gameplay.movement = { ...gameplay.movement, position: { x: 0, y: 0 } };
    const staleHudTarget = resolveInteractionTarget(customMap, { x: 150, y: 600 });
    const currentTarget = resolveInteractionTarget(customMap, gameplay.movement.position);
    expect(staleHudTarget).toBeNull();
    expect(currentTarget).toMatchObject({ kind: 'npc', placement: { npcId: 'mentor' } });

    const space = keyDownSpace(1);
    const result = step(gameplay, activeCatalog, [space, { seq: 2, type: 'acceptQuest', payload: { questId: 'q01' } }], 2);
    expect(result.gameplay?.interaction?.npcId).toBe(currentTarget?.kind === 'npc' ? currentTarget.placement.npcId : null);
    expect(result.gameplay?.toast).toBe('請到任務委託人身邊再接取。');
  });
});
