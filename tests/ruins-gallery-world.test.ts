import { describe, expect, it } from 'vitest';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { validateWorld } from '../src/content/world/validate.js';
import { acceptQuest, getQuestView, planQuestClaim, recordQuestEvent } from '../src/domain/quests/index.js';
import {
  ANCIENT_RUINS_LANDMARKS,
  atlasViewModel,
  portalRequirements,
} from '../src/ui/world-map-model.js';
import { beforeBSave } from './ruins-b-fixtures.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

describe('Echo Gallery world content', () => {
  it('requires claimed q16 for entry, keeps the west return free, and connects both stele platforms', () => {
    expect(validateWorld(worldCatalog, rulesCatalog).ok).toBe(true);
    expect(Object.keys(worldCatalog.maps)).toHaveLength(18);
    expect(Object.keys(worldCatalog.npcs)).toHaveLength(13);
    expect(worldCatalog.npcs['frost-route-marker']).toBeDefined();
    expect(Object.keys(worldCatalog.quests)).toHaveLength(22);
    expect(worldCatalog.quests.q21).toBeDefined();
    expect(worldCatalog.quests.q22).toBeDefined();

    const causeway = worldCatalog.maps['ruins-root-causeway']!;
    const gallery = worldCatalog.maps['ruins-echo-gallery']!;
    const entry = causeway.portals.find(({ targetMapId }) => targetMapId === 'ruins-echo-gallery')!;
    const returnPortal = gallery.portals.find(({ targetMapId }) => targetMapId === 'ruins-root-causeway')!;
    const readySave = beforeBSave();
    readySave.quests.q16 = { status: 'active', counters: { 'ruins-moss-carapace': 3 } };
    expect(getQuestView(readySave, 'q16', catalog).status).toBe('ready');
    expect(portalRequirements(entry, readySave, catalog).open).toBe(false);
    readySave.quests.q16.status = 'claimed';
    expect(portalRequirements(entry, readySave, catalog).open).toBe(true);
    expect(returnPortal.requiredQuestId).toBeNull();
    expect(portalRequirements(returnPortal, readySave, catalog).open).toBe(true);

    expect(gallery.width).toBe(2600);
    expect(gallery.footholds.filter(({ id }) => id.includes(':platform-')).map(({ x1, y1, x2 }) => [x1, y1, x2]))
      .toEqual([[820, 420, 1020], [1900, 360, 2120]]);
    expect(gallery.ladders.map(({ x, topY, bottomY }) => [x, topY, bottomY])).toEqual([[900, 420, 600], [2000, 360, 600]]);
    expect(gallery.monsters.map(({ monsterId, x, roamLeft, roamRight }) => [monsterId, x, roamLeft, roamRight]))
      .toEqual([
        ['ruins-string-puppet', 780, 720, 850],
        ['ruins-bell-prowler', 1170, 1100, 1240],
        ['ruins-string-puppet', 1570, 1510, 1630],
        ['ruins-bell-prowler', 2000, 1940, 2070],
      ]);

    const westStele = gallery.npcs.find(({ npcId }) => npcId === 'ruins-stele-west')!;
    const eastStele = gallery.npcs.find(({ npcId }) => npcId === 'ruins-stele-east')!;
    expect(Math.hypot(westStele.x - 900, westStele.y - 600)).toBeGreaterThan(128);
    expect(Math.hypot(eastStele.x - 2000, eastStele.y - 600)).toBeGreaterThan(128);
    for (const map of [causeway, gallery]) {
      for (const portal of map.portals) for (const npc of map.npcs) {
        expect(Math.hypot(portal.x - npc.x, portal.y - npc.y), `${map.id}/${portal.id}/${npc.npcId}`).toBeGreaterThan(128);
      }
    }

    const sanctumEntry = gallery.portals.find(({ targetMapId }) => targetMapId === 'ruins-bell-sanctum')!;
    const sanctum = worldCatalog.maps['ruins-bell-sanctum']!;
    const freeReturn = sanctum.portals.find(({ targetMapId }) => targetMapId === 'ruins-echo-gallery')!;
    const q17Ready = beforeBSave();
    q17Ready.quests.q17 = {
      status: 'active',
      counters: { 'ruins-stele-west': 1, 'ruins-stele-east': 1, 'ruins-string-puppet': 2 },
    };
    expect(getQuestView(q17Ready, 'q17', catalog).status).toBe('ready');
    expect(portalRequirements(sanctumEntry, q17Ready, catalog).open).toBe(false);
    q17Ready.quests.q17.status = 'claimed';
    expect(portalRequirements(sanctumEntry, q17Ready, catalog).open).toBe(true);
    expect(freeReturn.requiredQuestId).toBeNull();
    expect(portalRequirements(freeReturn, q17Ready, catalog).open).toBe(true);
    expect(sanctum).toMatchObject({ id: 'ruins-bell-sanctum', width: 1800, height: 720, safe: false, boss: true });
    expect(sanctum.spawns.find(({ id }) => id === 'entry')).toMatchObject({ x: 160, y: 600 });
    expect(sanctum.monsters.map(({ monsterId, x, roamLeft, roamRight }) => [monsterId, x, roamLeft, roamRight]))
      .toEqual([['ruins-bell-keeper', 1200, 700, 1560]]);
  });

  it('keeps q17 and q20 independent and requires three bell fragments at turn-in', () => {
    const q17 = worldCatalog.quests.q17!;
    const q20 = worldCatalog.quests.q20!;
    expect(q17.prerequisiteIds).toEqual(['q16']);
    expect(q20.prerequisiteIds).toEqual(['q16']);
    expect(q20.objectives.some((objective) => objective.type === 'reach')).toBe(false);

    const fromQ16 = beforeBSave();
    const acceptedQ20 = acceptQuest(fromQ16, 'q20', catalog);
    expect(acceptedQ20.ok).toBe(true);
    if (!acceptedQ20.ok) return;
    const acceptedBoth = acceptQuest(acceptedQ20.value, 'q17', catalog);
    expect(acceptedBoth.ok).toBe(true);
    if (!acceptedBoth.ok) return;

    const afterProwlerKill = recordQuestEvent(acceptedBoth.value.quests, { type: 'killed', monsterId: 'ruins-bell-prowler' }, worldCatalog);
    expect(afterProwlerKill.q20?.counters['ruins-bell-prowler']).toBe(1);
    expect(afterProwlerKill.q17?.counters).not.toHaveProperty('ruins-bell-prowler');

    const data = acceptedBoth.value;
    data.quests.q20!.counters['ruins-bell-prowler'] = 3;
    data.player.bag = [{ itemId: 'muted-bell-fragment', quantity: 3 }];
    expect(getQuestView(data, 'q20', catalog).status).toBe('ready');
    data.player.bag = [];
    expect(getQuestView(data, 'q20', catalog).status).toBe('active');
    expect(planQuestClaim(data, 'q20', catalog)).toMatchObject({ ok: false, code: 'NOT_READY' });
    data.player.bag = [{ itemId: 'muted-bell-fragment', quantity: 3 }];
    expect(planQuestClaim(data, 'q20', catalog)).toMatchObject({
      ok: true,
      value: { removeItems: [{ itemId: 'muted-bell-fragment', quantity: 3 }] },
    });
    expect(getQuestView(data, 'q17', catalog).status).toBe('active');
  });

  it('adds the third real ruins node and rejects invalid inspect targets, placements, or stage gates', () => {
    expect(ANCIENT_RUINS_LANDMARKS['ruins-echo-gallery']).toMatchObject({ x: 67, y: 39 });
    const atlas = atlasViewModel(catalog, beforeBSave(), 'ruins-echo-gallery');
    expect(atlas.maps.map(({ id }) => id)).toEqual(['ruins-tide-camp', 'ruins-root-causeway', 'ruins-echo-gallery', 'ruins-bell-sanctum']);
    expect(atlas.totalCount).toBe(4);

    const wrongTarget = structuredClone(worldCatalog);
    const westObjective = wrongTarget.quests.q17!.objectives[0]!;
    if (westObjective.type !== 'inspect') throw new Error('q17 must begin with an inspect objective.');
    westObjective.targetId = 'ruins-pathfinder';
    expect(validateWorld(wrongTarget, rulesCatalog).ok).toBe(false);

    const wrongPlacement = structuredClone(worldCatalog);
    wrongPlacement.maps['ruins-echo-gallery']!.npcs.find(({ npcId }) => npcId === 'ruins-stele-west')!.x = 880;
    expect(validateWorld(wrongPlacement, rulesCatalog).ok).toBe(false);

    const wrongGate = structuredClone(worldCatalog);
    wrongGate.maps['ruins-root-causeway']!.portals.find(({ targetMapId }) => targetMapId === 'ruins-echo-gallery')!.requiredQuestId = 'q17';
    expect(validateWorld(wrongGate, rulesCatalog).ok).toBe(false);
  });
});
