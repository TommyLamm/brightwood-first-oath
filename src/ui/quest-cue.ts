import type { QuestView } from '../contracts/definitions.js';
import type { UiSnapshot } from '../contracts/ports.js';
import { questDropByQuest } from '../content/rules/monsters.js';
import { combatTrialActions } from '../content/world/class-quests.js';
import { questCueStyle, type QuestCueKind, type QuestNpcCueState } from '../render/quest-guidance.js';

type Objective = QuestView['objectives'][number];

const objectiveCues: Record<Objective['type'], QuestCueKind> = {
  kill: 'monster', collect: 'item', equip: 'item', reach: 'portal', inspect: 'npc',
};

export function questObjectiveCue(objective: Objective): QuestCueKind {
  return objective.type === 'inspect' && combatTrialActions.has(objective.targetId) ? 'monster' : objectiveCues[objective.type];
}

export function questObjectiveDropSource(view: Pick<UiSnapshot, 'catalog'>, questId: string, objective: Objective): string | undefined {
  const source = questDropByQuest[questId];
  if (objective.type === 'collect' && objective.current < objective.required && source?.itemId === objective.targetId) {
    return view.catalog.rules.monsters[source.monsterId]?.name;
  }
}

export function makeQuestCueBadge(document: Document, kind: QuestCueKind, npcState?: QuestNpcCueState): HTMLElement {
  const appearance = questCueStyle(kind, npcState);
  const badge = document.createElement('span');
  badge.className = 'ms-quest-cue';
  badge.textContent = appearance.symbol;
  badge.style.color = '#' + appearance.color.toString(16);
  badge.setAttribute('aria-hidden', 'true');
  return badge;
}
