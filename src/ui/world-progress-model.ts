import type { QuestView } from '../contracts/definitions.js';
import type { CommandDraft } from '../contracts/commands.js';
import type { SaveData } from '../contracts/types.js';
import type { SaveUpgradeRequired } from '../contracts/ports.js';

export type WorldQuestGroupId = 'leaf' | 'frost' | 'sand' | 'ruins' | 'sidequests';

export type WorldQuestGroupDefinition = {
  id: WorldQuestGroupId;
  label: string;
  questIds: readonly string[];
  kind: 'mainline' | 'sidequest';
  completionQuestId?: string;
  nextMapId?: string;
  nextNpcId?: string;
};

const range = (first: number, last: number): string[] =>
  Array.from({ length: last - first + 1 }, (_, index) => 'q' + String(first + index).padStart(2, '0'));

export const WORLD_QUEST_GROUPS: readonly WorldQuestGroupDefinition[] = [
  { id: 'leaf', label: '木葉世界主線', questIds: range(1, 8), kind: 'mainline', completionQuestId: 'q08', nextMapId: 'frost-shore', nextNpcId: 'frost-guide' },
  { id: 'frost', label: '霜雪群島主線', questIds: range(9, 11), kind: 'mainline', completionQuestId: 'q11', nextMapId: 'sand-glass-shore', nextNpcId: 'sands-guide' },
  { id: 'sand', label: '黃金沙海主線', questIds: range(12, 14), kind: 'mainline', completionQuestId: 'q14', nextMapId: 'ruins-tide-camp', nextNpcId: 'ruins-archivist' },
  { id: 'ruins', label: '遠古遺跡主線', questIds: range(15, 19), kind: 'mainline', completionQuestId: 'q19' },
  { id: 'sidequests', label: '四區支線', questIds: ['q20', 'q21', 'q22'], kind: 'sidequest' },
];

export type WorldChapterProgress = WorldQuestGroupDefinition & {
  complete: boolean;
};

export type WorldProgressModel = {
  chapters: WorldChapterProgress[];
  completedChapterCount: number;
  worldComplete: boolean;
  unfinishedSideQuestIds: string[];
};

export function worldQuestGroupId(questId: string): WorldQuestGroupId | null {
  return WORLD_QUEST_GROUPS.find(({ questIds }) => questIds.includes(questId))?.id ?? null;
}

export function groupWorldQuests<T extends Pick<QuestView, 'questId' | 'status'>>(
  quests: readonly T[],
): Array<WorldQuestGroupDefinition & { quests: T[]; claimedCount: number }> {
  return WORLD_QUEST_GROUPS.map((group) => {
    const entries = quests.filter(({ questId }) => group.questIds.includes(questId));
    return {
      ...group,
      quests: entries,
      claimedCount: entries.filter(({ status }) => status === 'claimed').length,
    };
  }).filter(({ quests: entries }) => entries.length > 0);
}

/** Chapter completion is derived only from the corresponding claimed main quest, never a parallel flag. */
export function deriveWorldProgress(
  saveData: Pick<SaveData, 'quests'> | null,
  questIds: readonly string[] = WORLD_QUEST_GROUPS.flatMap(({ questIds: ids }) => ids),
): WorldProgressModel {
  const chapters = WORLD_QUEST_GROUPS
    .filter(({ kind }) => kind === 'mainline')
    .map((group): WorldChapterProgress => ({
      ...group,
      complete: Boolean(group.completionQuestId && saveData?.quests[group.completionQuestId]?.status === 'claimed'),
    }));
  const worldComplete = saveData?.quests.q19?.status === 'claimed';
  const sideQuests = WORLD_QUEST_GROUPS.find(({ id }) => id === 'sidequests')?.questIds ?? [];
  return {
    chapters,
    completedChapterCount: chapters.filter(({ complete }) => complete).length,
    worldComplete,
    unfinishedSideQuestIds: sideQuests.filter((questId) => questIds.includes(questId)
      && saveData?.quests[questId]?.status !== 'claimed'),
  };
}

export type SaveUpgradePrompt = {
  title: string;
  explanation: string;
  confirmLabel: string;
  temporaryLabel: string;
};

/** Player-facing copy keeps local backups, cloud upgrades and preview simulation distinct. */
export function saveUpgradePrompt(upgrade: SaveUpgradeRequired): SaveUpgradePrompt {
  const format = 'format' + upgrade.formatVersion;
  const temporaryLabel = '暫不升級，暫時遊玩（不保存）';
  if (upgrade.source === 'local') {
    return {
      title: '本機存檔升級確認',
      explanation: `目前讀取的是 ${format} 本機存檔。確認後會先備份原始 ${format} 存檔，再升級至 format5 繼續；確認前不會改寫原件。`,
      confirmLabel: `備份 ${format} 並升級繼續`,
      temporaryLabel,
    };
  }
  if (upgrade.source === 'cloud') {
    return {
      title: '雲端存檔升級確認',
      explanation: `目前讀取的是 ${format} 雲端存檔。確認後會明確升級至 format5；這項操作不建立本機備份。`,
      confirmLabel: `確認升級雲端 ${format} 並繼續`,
      temporaryLabel,
    };
  }
  return {
    title: '預覽存檔升級模擬',
    explanation: `預覽載入了模擬的 ${format} 存檔。確認只會模擬升級流程，不保存至正式帳號。`,
    confirmLabel: `模擬升級 ${format} 並繼續`,
    temporaryLabel,
  };
}

export function saveUpgradeConfirmCommand(upgrade: SaveUpgradeRequired | null | undefined): CommandDraft | null {
  return upgrade ? { type: 'confirmSaveUpgrade', payload: {} } : null;
}

export function frostRouteMarkerInspectCommand(
  interactionNpcId: string | undefined,
  questStatus: QuestView['status'] | undefined,
): CommandDraft | null {
  return interactionNpcId === 'frost-route-marker' && questStatus === 'active'
    ? { type: 'inspect', payload: { targetId: 'frost-route-marker' } }
    : null;
}
