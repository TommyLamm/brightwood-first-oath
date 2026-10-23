import type { Id, QuestDef, Result, RulesCatalog, WorldCatalog } from '../../contracts/index.js';
import { questDropByQuest } from '../rules/index.js';

const expectedMapIds = ['camp', 'town', 'forest-edge', 'mushroom-wood', 'red-ridge', 'mine-gate', 'guardian-arena', 'frost-shore', 'frost-pine-pass', 'frost-tide-cavern'];
const expectedNpcIds = ['guide', 'mentor', 'merchant', 'healer', 'keeper', 'frost-guide'];
const expectedQuestIds = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08', 'q09', 'q10'];
const expectedNpcPlacements: Record<Id, Id> = {
  guide: 'camp', mentor: 'town', merchant: 'town', healer: 'town', keeper: 'red-ridge', 'frost-guide': 'frost-shore',
};
const expectedThemes: Record<Id, string> = {
  camp: 'camp', town: 'town', 'forest-edge': 'forest', 'mushroom-wood': 'forest',
  'red-ridge': 'rock', 'mine-gate': 'rock', 'guardian-arena': 'rock', 'frost-shore': 'frost', 'frost-pine-pass': 'frost-pine', 'frost-tide-cavern': 'frost-cave',
};
const expectedMusic: Record<Id, string> = {
  camp: 'theme-field', town: 'theme-town', 'forest-edge': 'theme-field', 'mushroom-wood': 'theme-field',
  'red-ridge': 'theme-field', 'mine-gate': 'theme-field', 'guardian-arena': 'theme-boss', 'frost-shore': 'theme-field', 'frost-pine-pass': 'theme-field', 'frost-tide-cavern': 'theme-field',
};

function failure(message: string): Result<WorldCatalog> {
  return { ok: false, code: 'INVALID', message };
}

function hasRecordKey<T>(record: Record<Id, T>, id: Id): boolean {
  return Object.prototype.hasOwnProperty.call(record, id);
}

function textValid(text: string): boolean {
  const sentences = (text.match(/[。！？]/g) ?? []).length;
  return [...text].length >= 30 && [...text].length <= 100 && sentences >= 2 && sentences <= 4;
}

function validateQuestText(quest: QuestDef): string | null {
  for (const [label, text] of [
    ['acceptText', quest.acceptText], ['progressText', quest.progressText], ['completeText', quest.completeText],
  ] as const) {
    if ([...text].length < 30 || !text.includes('回')) {
      return `Quest ${quest.id} ${label} must state its objective and a return/report instruction`;
    }
  }
  return null;
}

export function validateWorld(world: WorldCatalog, rules: RulesCatalog): Result<WorldCatalog> {
  const exactIds = [
    ['map', world.maps, expectedMapIds],
    ['NPC', world.npcs, expectedNpcIds],
    ['quest', world.quests, expectedQuestIds],
  ] as const;
  for (const [label, record, expected] of exactIds) {
    const actual = Object.keys(record).sort();
    if (actual.length !== expected.length || actual.some((id, index) => id !== [...expected].sort()[index])) {
      return failure(`World must contain exactly ${expected.length} approved ${label} IDs`);
    }
  }

  for (const [mapId, map] of Object.entries(world.maps)) {
    if (map.id !== mapId || map.height !== 720 || map.width <= 0) return failure(`Map key/dimensions invalid: ${mapId}`);
    if (map.themeKey !== expectedThemes[mapId] || map.musicKey !== expectedMusic[mapId]) {
      return failure(`Map theme/music key invalid: ${mapId}`);
    }
    if (map.boss !== (mapId === 'guardian-arena') || map.safe !== (mapId === 'town')) {
      return failure(`Map safe/boss classification invalid: ${mapId}`);
    }
    const spawnIds = new Set(map.spawns.map(({ id }) => id));
    if (!spawnIds.has('left') || !spawnIds.has('right')) return failure(`Map requires left/right spawns: ${mapId}`);
    for (const spawn of map.spawns) {
      if (spawn.x < 0 || spawn.x > map.width || spawn.y !== 600 || !Number.isFinite(spawn.x)) return failure(`Invalid spawn in ${mapId}: ${spawn.id}`);
    }
    const ground = map.footholds.find((foothold) => foothold.id === `${mapId}:ground`);
    if (!ground || ground.x1 !== 0 || ground.x2 !== map.width || ground.y1 !== 600 || ground.y2 !== 600 || ground.dropThrough) {
      return failure(`Map ground does not match the shared world plane: ${mapId}`);
    }
    for (const foothold of map.footholds) {
      if (!(foothold.x1 < foothold.x2)) return failure(`Invalid foothold in ${mapId}: ${foothold.id}`);
    }
    for (const ladder of map.ladders) {
      if (!(ladder.topY < ladder.bottomY)) return failure(`Invalid ladder in ${mapId}: ${ladder.id}`);
    }
    if (map.walls.length !== 2 || map.walls.some((wall) => wall.y !== 0 || wall.height !== 720 || wall.width !== 32)
      || map.walls[0]?.x !== 0 || map.walls[1]?.x !== map.width - 32) {
      return failure(`Map must have only its two edge walls: ${mapId}`);
    }

    for (const portal of map.portals) {
      const target = world.maps[portal.targetMapId];
      if (!target || !target.spawns.some((spawn) => spawn.id === portal.targetSpawnId)) {
        return failure(`Portal target or spawn does not exist: ${mapId}/${portal.id}`);
      }
      if (portal.x < 0 || portal.x > map.width || portal.y !== 600) return failure(`Invalid portal position: ${mapId}/${portal.id}`);
      if (portal.requiredQuestId !== null && !hasRecordKey(world.quests, portal.requiredQuestId)) {
        return failure(`Portal prerequisite does not exist: ${mapId}/${portal.id}`);
      }
      const reciprocal = target.portals.some((back) => back.targetMapId === mapId);
      if (!reciprocal) return failure(`Portal has no reverse route: ${mapId}/${portal.id}`);
    }

    const seenMonsterIds = new Map<Id, number>();
    for (const monster of map.monsters) {
      const count = (seenMonsterIds.get(monster.monsterId) ?? 0) + 1;
      seenMonsterIds.set(monster.monsterId, count);
      if (!hasRecordKey(rules.monsters, monster.monsterId)) return failure(`Unknown monster in ${mapId}: ${monster.monsterId}`);
      if (monster.spawnId !== `${mapId}:${monster.monsterId}:${count}`) return failure(`Unstable monster spawn ID: ${mapId}/${monster.spawnId}`);
      if (monster.y !== 600 || monster.x < 0 || monster.x > map.width
        || monster.roamLeft < 0 || monster.roamLeft > monster.x || monster.roamRight < monster.x || monster.roamRight > map.width) {
        return failure(`Monster position or roam range is invalid: ${mapId}/${monster.spawnId}`);
      }
    }
    if (mapId === 'camp') {
      const requiredSnails = world.quests.q01?.objectives
        .find((objective) => objective.type === 'kill' && objective.targetId === 'snail')?.count ?? 0;
      const campSnails = map.monsters.filter(({ monsterId }) => monsterId === 'snail').length;
      if (campSnails < requiredSnails) {
        return failure('Camp must provide enough snail spawns to complete q01 without respawns');
      }
    }
    for (const placement of map.npcs) {
      if (!hasRecordKey(world.npcs, placement.npcId) || placement.x < 0 || placement.x > map.width || placement.y !== 600) {
        return failure(`Invalid NPC placement in ${mapId}: ${placement.npcId}`);
      }
    }
  }

  const normalMonsterIds = new Set<Id>();
  for (const map of Object.values(world.maps)) for (const monster of map.monsters) {
    if (monster.monsterId !== 'guardian') normalMonsterIds.add(monster.monsterId);
  }
  if (normalMonsterIds.size !== 8 || !world.maps['guardian-arena']?.boss
    || world.maps['guardian-arena'].monsters.length !== 1 || world.maps['guardian-arena'].monsters[0]?.monsterId !== 'guardian') {
    return failure('World must use eight ordinary monsters and one arena guardian');
  }

  for (const [npcId, npc] of Object.entries(world.npcs)) {
    if (npc.id !== npcId || npc.actorKey !== `actor:${npcId}` || npc.dialogueId.length === 0) return failure(`NPC identity or actor key invalid: ${npcId}`);
    const expectedMapId = expectedNpcPlacements[npcId];
    const placements = Object.entries(world.maps).flatMap(([mapId, map]) => map.npcs
      .filter((placement) => placement.npcId === npcId).map(() => mapId));
    if (placements.length !== 1 || placements[0] !== expectedMapId) return failure(`NPC placement is not unique or assigned correctly: ${npcId}`);
    const lines = world.dialogues[npc.dialogueId];
    if (!lines?.length || lines.some((line) => line.speaker !== npc.name || !textValid(line.text))) {
      return failure(`NPC dialogue speaker or text requirements invalid: ${npcId}`);
    }
  }
  if (Object.keys(world.dialogues).length !== expectedNpcIds.length) return failure('World must have one dialogue entry for each NPC');

  const questItemSources = new Map<Id, Id>();
  for (const [questId, source] of Object.entries(questDropByQuest)) {
    const quest = world.quests[questId];
    if (!quest || !hasRecordKey(rules.monsters, source.monsterId) || rules.items[source.itemId]?.kind !== 'quest') {
      return failure(`Quest drop source is invalid: ${questId}`);
    }
    if (!quest.objectives.some((objective) => objective.type === 'collect' && objective.targetId === source.itemId)) {
      return failure(`Quest drop is not referenced by a collect objective: ${questId}`);
    }
    if (!Object.values(world.maps).some((map) => map.monsters.some((monster) => monster.monsterId === source.monsterId))) {
      return failure(`Quest drop monster has no world spawn: ${questId}`);
    }
    questItemSources.set(source.itemId, questId);
  }
  for (const item of Object.values(rules.items)) {
    if (item.kind === 'quest' && !questItemSources.has(item.id)) return failure(`Quest item has no T01 drop source: ${item.id}`);
  }

  for (const [questId, quest] of Object.entries(world.quests)) {
    if (quest.id !== questId || !hasRecordKey(world.npcs, quest.giverNpcId) || !hasRecordKey(world.npcs, quest.turnInNpcId)) {
      return failure(`Quest identity or NPC reference invalid: ${questId}`);
    }
    const expectedPrerequisite = questId === 'q01' ? [] : [`q${String(Number(questId.slice(1)) - 1).padStart(2, '0')}`];
    if (quest.prerequisiteIds.length !== expectedPrerequisite.length
      || quest.prerequisiteIds.some((id, index) => id !== expectedPrerequisite[index])) return failure(`Quest prerequisite sequence invalid: ${questId}`);
    if (quest.minLevel !== (questId === 'q02' ? 3 : 1) || !quest.objectives.length || quest.objectives.some((objective) => objective.count <= 0)) {
      return failure(`Quest level or objective invalid: ${questId}`);
    }
    for (const objective of quest.objectives) {
      if (objective.type === 'reach' && !hasRecordKey(world.maps, objective.targetId)) return failure(`Unknown reach map in ${questId}`);
      if (objective.type === 'kill' && (!hasRecordKey(rules.monsters, objective.targetId)
        || !Object.values(world.maps).some((map) => map.monsters.some((spawn) => spawn.monsterId === objective.targetId)))) {
        return failure(`Unknown/unplaced kill target in ${questId}`);
      }
      if ((objective.type === 'collect' || objective.type === 'equip') && !hasRecordKey(rules.items, objective.targetId)) {
        return failure(`Unknown item target in ${questId}`);
      }
      if (objective.type === 'equip' && !rules.items[objective.targetId]?.slot) return failure(`Equip objective is not equipment in ${questId}`);
    }
    for (const stack of [...quest.consumeItems, ...quest.reward.items]) {
      if (!hasRecordKey(rules.items, stack.itemId) || !Number.isInteger(stack.quantity) || stack.quantity <= 0) {
        return failure(`Quest item quantity/reference invalid: ${questId}/${stack.itemId}`);
      }
    }
    const textError = validateQuestText(quest);
    if (textError) return failure(textError);
    const turnInNpc = world.npcs[quest.turnInNpcId]!;
    const turnInMapId = expectedNpcPlacements[quest.turnInNpcId]!;
    const turnInMapName = world.maps[turnInMapId]!.name;
    for (const text of [quest.acceptText, quest.progressText, quest.completeText]) {
      if (!text.includes(turnInNpc.name) || !text.includes(turnInMapName)) {
        return failure(`Quest ${questId} text must name its return NPC and location`);
      }
    }
  }

  const visited = new Set<Id>();
  const visiting = new Set<Id>();
  const visit = (questId: Id): boolean => {
    if (visiting.has(questId)) return false;
    if (visited.has(questId)) return true;
    visiting.add(questId);
    for (const prerequisite of world.quests[questId]?.prerequisiteIds ?? []) {
      if (!world.quests[prerequisite] || !visit(prerequisite)) return false;
    }
    visiting.delete(questId);
    visited.add(questId);
    return true;
  };
  for (const questId of Object.keys(world.quests)) if (!visit(questId)) return failure(`Quest prerequisite cycle or missing link: ${questId}`);

  const reachableMaps = new Set<Id>(['camp']);
  const pendingMaps: Id[] = ['camp'];
  while (pendingMaps.length) {
    const currentId = pendingMaps.shift()!;
    for (const portal of world.maps[currentId]?.portals ?? []) {
      if (!reachableMaps.has(portal.targetMapId)) {
        reachableMaps.add(portal.targetMapId);
        pendingMaps.push(portal.targetMapId);
      }
    }
  }
  if (reachableMaps.size !== expectedMapIds.length) return failure('All maps must be reachable from camp');

  const claimedQuests = new Set<Id>();
  const rewardedItems = new Set<Id>();
  for (const questId of expectedQuestIds) {
    const quest = world.quests[questId]!;
    const unlockedMaps = new Set<Id>(['camp']);
    const queue: Id[] = ['camp'];
    while (queue.length) {
      const currentId = queue.shift()!;
      for (const portal of world.maps[currentId]?.portals ?? []) {
        if ((portal.requiredQuestId === null || claimedQuests.has(portal.requiredQuestId))
          && !unlockedMaps.has(portal.targetMapId)) {
          unlockedMaps.add(portal.targetMapId);
          queue.push(portal.targetMapId);
        }
      }
    }
    const giverMapId = expectedNpcPlacements[quest.giverNpcId];
    const turnInMapId = expectedNpcPlacements[quest.turnInNpcId];
    if (!giverMapId || !unlockedMaps.has(giverMapId)) {
      return failure(`Quest ${questId} giver NPC is on a locked map: ${giverMapId}`);
    }
    if (!turnInMapId || !unlockedMaps.has(turnInMapId)) {
      return failure(`Quest ${questId} turn-in NPC is on a locked map: ${turnInMapId}`);
    }
    for (const objective of quest.objectives) {
      if (objective.type === 'reach' && !unlockedMaps.has(objective.targetId)) {
        return failure(`Quest ${questId} reach target is locked at quest stage: ${objective.targetId}`);
      }
      if (objective.type === 'kill') {
        const canKill = [...unlockedMaps].some((mapId) =>
          world.maps[mapId]?.monsters.some((spawn) => spawn.monsterId === objective.targetId));
        if (!canKill) return failure(`Quest ${questId} kill target is not in unlocked maps: ${objective.targetId}`);
      }
      if (objective.type === 'collect') {
        const conditionalSource = questDropByQuest[questId];
        const canCollectConditional = conditionalSource?.itemId === objective.targetId
          && [...unlockedMaps].some((mapId) =>
            world.maps[mapId]?.monsters.some((spawn) => spawn.monsterId === conditionalSource.monsterId));
        const canCollectNormal = [...unlockedMaps].some((mapId) =>
          world.maps[mapId]?.monsters.some((spawn) =>
            rules.monsters[spawn.monsterId]?.drops.some((drop) => drop.itemId === objective.targetId && drop.chance > 0)));
        if (!canCollectConditional && !canCollectNormal && !rewardedItems.has(objective.targetId)) {
          return failure(`Quest ${questId} collect target is not obtainable in unlocked maps: ${objective.targetId}`);
        }
      }
      if (objective.type === 'equip') {
        const merchantUnlocked = unlockedMaps.has(expectedNpcPlacements.merchant!);
        const canBuy = merchantUnlocked && (rules.items[objective.targetId]?.buyPrice ?? 0) > 0;
        if (!rewardedItems.has(objective.targetId) && !canBuy) {
          return failure(`Quest ${questId} equip target is not obtainable at quest stage: ${objective.targetId}`);
        }
      }
    }
    claimedQuests.add(questId);
    for (const rewardItem of quest.reward.items) rewardedItems.add(rewardItem.itemId);
  }

  return { ok: true, value: world };
}
