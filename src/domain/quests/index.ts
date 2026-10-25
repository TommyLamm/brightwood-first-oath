import type {
  BagStack,
  ContentCatalog,
  Id,
  QuestClaimPlan,
  QuestDef,
  QuestState,
  QuestView,
  Result,
  SaveData,
} from '../../contracts/index.js';

export type QuestEvent =
  | { type: 'reached'; mapId: Id }
  | { type: 'killed'; monsterId: Id }
  | { type: 'inspected'; targetId: Id };

function cloneQuests(quests: Record<Id, QuestState>): Record<Id, QuestState> {
  return Object.fromEntries(Object.entries(quests).map(([id, state]) => [id, {
    status: state.status,
    counters: { ...state.counters },
  }])) as Record<Id, QuestState>;
}

function cloneStacks(stacks: BagStack[]): BagStack[] {
  return stacks.map((stack) => ({ ...stack }));
}

function cloneReward(reward: QuestDef['reward']): QuestDef['reward'] {
  return { ...reward, items: cloneStacks(reward.items) };
}

function countItem(data: SaveData, itemId: Id): number {
  return data.player.bag.reduce((sum, stack) => sum + (stack.itemId === itemId ? stack.quantity : 0), 0);
}

function objectiveCount(
  data: SaveData,
  questId: Id,
  objective: QuestDef['objectives'][number],
  catalog: ContentCatalog,
): number {
  switch (objective.type) {
    case 'kill':
      return data.quests[questId]?.counters[objective.targetId] ?? 0;
    case 'inspect':
      return data.quests[questId]?.counters[objective.targetId] ?? 0;
    case 'reach':
      return data.visitedMaps.includes(objective.targetId)
        ? objective.count
        : Math.min(objective.count, data.quests[questId]?.counters[objective.targetId] ?? 0);
    case 'collect':
      return countItem(data, objective.targetId);
    case 'equip': {
      const slot = catalog.rules.items[objective.targetId]?.slot;
      return slot && data.player.equipment[slot] === objective.targetId ? objective.count : 0;
    }
  }
}

function allPrerequisitesClaimed(data: SaveData, quest: QuestDef): boolean {
  return quest.prerequisiteIds.every((id) => data.quests[id]?.status === 'claimed');
}

function objectivesFor(data: SaveData, questId: Id, quest: QuestDef, catalog: ContentCatalog): QuestView['objectives'] {
  return quest.objectives.map((objective) => ({
    type: objective.type,
    targetId: objective.targetId,
    current: objectiveCount(data, questId, objective, catalog),
    required: objective.count,
  }));
}

function isReady(data: SaveData, questId: Id, quest: QuestDef, catalog: ContentCatalog): boolean {
  return objectivesFor(data, questId, quest, catalog).every(({ current, required }) => current >= required);
}

export function getQuestView(data: SaveData, questId: Id, catalog: ContentCatalog): QuestView {
  const quest = catalog.world.quests[questId];
  if (!quest) throw new RangeError(`Unknown quest ID: ${questId}`);

  const state = data.quests[questId];
  let status: QuestView['status'];
  if (state?.status === 'claimed') status = 'claimed';
  else if (state?.status === 'active') status = isReady(data, questId, quest, catalog) ? 'ready' : 'active';
  else if (!allPrerequisitesClaimed(data, quest) || data.player.level < quest.minLevel) status = 'locked';
  else status = 'available';

  return {
    questId,
    title: quest.name,
    status,
    // Claimed quests consumed their items and may have unequipped gear since; report them as met.
    objectives: status === 'claimed'
      ? quest.objectives.map((objective) => ({
        type: objective.type, targetId: objective.targetId, current: objective.count, required: objective.count,
      }))
      : objectivesFor(data, questId, quest, catalog),
    reward: cloneReward(quest.reward),
  };
}

function error<T>(code: 'INVALID' | 'LOCKED' | 'NOT_FOUND' | 'REQUIREMENT' | 'NOT_READY', message: string): Result<T> {
  return { ok: false, code, message };
}

export function acceptQuest(data: SaveData, questId: Id, catalog: ContentCatalog): Result<SaveData> {
  const quest = catalog.world.quests[questId];
  if (!quest) return error('NOT_FOUND', `找不到任務資料（${questId}）。`);
  if (data.quests[questId]) return error('REQUIREMENT', `「${quest.name}」已經接取過了。`);
  if (!allPrerequisitesClaimed(data, quest)) return error('LOCKED', `請先完成前置任務，才能接取「${quest.name}」。`);
  if (data.player.level < quest.minLevel) return error('LOCKED', `「${quest.name}」需要達到 Lv.${quest.minLevel} 才能接取。`);

  const nextQuests = cloneQuests(data.quests);
  const counters: Record<Id, number> = {};
  for (const objective of quest.objectives) {
    if (objective.type === 'kill' || objective.type === 'reach' || objective.type === 'inspect') {
      counters[objective.targetId] = 0;
    }
  }
  nextQuests[questId] = { status: 'active', counters };
  return { ok: true, value: { ...data, quests: nextQuests } };
}

export function recordQuestEvent(
  quests: Record<Id, QuestState>,
  event: QuestEvent,
  world: ContentCatalog['world'],
): Record<Id, QuestState> {
  const nextQuests = cloneQuests(quests);
  for (const [questId, state] of Object.entries(nextQuests)) {
    if (state.status !== 'active') continue;
    const quest = world.quests[questId];
    if (!quest) continue;
    for (const objective of quest.objectives) {
      const matches = (event.type === 'killed' && objective.type === 'kill' && objective.targetId === event.monsterId)
        || (event.type === 'reached' && objective.type === 'reach' && objective.targetId === event.mapId)
        || (event.type === 'inspected' && objective.type === 'inspect' && objective.targetId === event.targetId);
      if (matches) state.counters[objective.targetId] = Math.min(
        objective.count,
        (state.counters[objective.targetId] ?? 0) + 1,
      );
    }
  }
  return nextQuests;
}

export function planQuestClaim(data: SaveData, questId: Id, catalog: ContentCatalog): Result<QuestClaimPlan> {
  const quest = catalog.world.quests[questId];
  if (!quest) return error('NOT_FOUND', `找不到任務資料（${questId}）。`);
  if (data.quests[questId]?.status !== 'active' || !isReady(data, questId, quest, catalog)) {
    return error('NOT_READY', `「${quest.name}」的目標尚未完成。`);
  }
  const requiredForRemoval = new Map<Id, number>();
  for (const stack of quest.consumeItems) {
    requiredForRemoval.set(stack.itemId, (requiredForRemoval.get(stack.itemId) ?? 0) + stack.quantity);
  }
  for (const [itemId, quantity] of requiredForRemoval) {
    if (countItem(data, itemId) < quantity) return error('NOT_READY', `交付「${quest.name}」需要 ${catalog.rules.items[itemId]?.name ?? itemId} ×${quantity}，背包裡的數量不足。`);
  }

  const nextQuests = cloneQuests(data.quests);
  nextQuests[questId] = { ...nextQuests[questId]!, status: 'claimed' };
  return {
    ok: true,
    value: {
      nextQuests,
      removeItems: cloneStacks(quest.consumeItems),
      reward: cloneReward(quest.reward),
    },
  };
}
