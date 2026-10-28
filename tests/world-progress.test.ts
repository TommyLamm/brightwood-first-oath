import { describe, expect, it } from 'vitest';
import type { QuestView } from '../src/contracts/definitions.js';
import type { SaveData } from '../src/contracts/types.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { startNewGame } from '../src/app/gameplay.js';
import {
  deriveWorldProgress,
  frostRouteMarkerInspectCommand,
  groupWorldQuests,
  saveUpgradeConfirmCommand,
  saveUpgradePrompt,
  worldQuestGroupId,
} from '../src/ui/world-progress-model.js';

const catalog = { rules: rulesCatalog, world: worldCatalog };

function save(): SaveData {
  const result = startNewGame('旅人', catalog, () => 'world-progress-test');
  if ('error' in result) throw new Error(result.error);
  return result.gameplay.saveData;
}

function quest(questId: string, status: QuestView['status']): Pick<QuestView, 'questId' | 'status'> {
  return { questId, status };
}

describe('four-region journal progress', () => {
  it('derives each chapter only from its final claimed main quest', () => {
    const data = save();
    data.flags.chapterComplete = true;
    data.quests.q08 = { status: 'active', counters: {} };
    data.quests.q11 = { status: 'active', counters: {} };
    data.quests.q14 = { status: 'active', counters: {} };
    data.quests.q19 = { status: 'active', counters: {} };

    expect(deriveWorldProgress(data).chapters.map(({ complete }) => complete)).toEqual([false, false, false, false]);
    expect(deriveWorldProgress(data).worldComplete).toBe(false);

    data.quests.q08.status = 'claimed';
    data.quests.q11.status = 'claimed';
    data.quests.q14.status = 'claimed';
    data.quests.q19.status = 'claimed';
    expect(deriveWorldProgress(data).chapters.map(({ complete }) => complete)).toEqual([true, true, true, true]);
    expect(deriveWorldProgress(data).completedChapterCount).toBe(4);
  });

  it('recognizes q19 as the ending while leaving outstanding side quests available for review', () => {
    const data = save();
    data.visitedMaps = ['camp', 'town'];
    for (const questId of ['q08', 'q11', 'q14', 'q19']) data.quests[questId] = { status: 'claimed', counters: {} };
    data.quests.q20 = { status: 'active', counters: {} };

    const progress = deriveWorldProgress(data, Object.keys(worldCatalog.quests));
    expect(progress.worldComplete).toBe(true);
    expect(progress.unfinishedSideQuestIds).toEqual(['q20', 'q21', 'q22']);
    expect(progress.completedChapterCount).toBe(4);
  });

  it('keeps the four area mainlines and three optional quests in separate journal groups', () => {
    const entries = [
      ...Array.from({ length: 19 }, (_, index) => quest('q' + String(index + 1).padStart(2, '0'), 'locked')),
      quest('q20', 'available'), quest('q21', 'active'), quest('q22', 'ready'),
    ];
    expect(entries.map(({ questId }) => [questId, worldQuestGroupId(questId)])).toEqual([
      ...Array.from({ length: 8 }, (_, index) => ['q' + String(index + 1).padStart(2, '0'), 'leaf']),
      ...Array.from({ length: 3 }, (_, index) => ['q' + String(index + 9).padStart(2, '0'), 'frost']),
      ...Array.from({ length: 3 }, (_, index) => ['q' + String(index + 12).padStart(2, '0'), 'sand']),
      ...Array.from({ length: 5 }, (_, index) => ['q' + String(index + 15).padStart(2, '0'), 'ruins']),
      ['q20', 'sidequests'], ['q21', 'sidequests'], ['q22', 'sidequests'],
    ]);
    expect(groupWorldQuests(entries).map(({ id, quests: grouped }) => [id, grouped.length])).toEqual([
      ['leaf', 8], ['frost', 3], ['sand', 3], ['ruins', 5], ['sidequests', 3],
    ]);
  });

  it('uses distinct explicit wording for local backup, cloud upgrade and preview simulation', () => {
    const local = saveUpgradePrompt({ formatVersion: 4, source: 'local' });
    expect(local.confirmLabel).toBe('備份 format4 並升級繼續');
    expect(local.explanation).toContain('備份原始 format4');

    const cloud = saveUpgradePrompt({ formatVersion: 4, source: 'cloud' });
    expect(cloud.confirmLabel).toContain('確認升級雲端 format4');
    expect(cloud.confirmLabel).not.toContain('備份');
    expect(cloud.explanation).toContain('不建立本機備份');

    const preview = saveUpgradePrompt({ formatVersion: 4, source: 'preview' });
    expect(preview.confirmLabel).toContain('模擬升級');
    expect(preview.explanation).toContain('不保存至正式帳號');
    expect(local.temporaryLabel).toBe('暫不升級，暫時遊玩（不保存）');
  });

  it('dispatches only the confirmed format-upgrade and active frost marker inspect commands', () => {
    expect(saveUpgradeConfirmCommand({ formatVersion: 4, source: 'local' }))
      .toEqual({ type: 'confirmSaveUpgrade', payload: {} });
    expect(saveUpgradeConfirmCommand(null)).toBeNull();
    expect(frostRouteMarkerInspectCommand('frost-route-marker', 'active'))
      .toEqual({ type: 'inspect', payload: { targetId: 'frost-route-marker' } });
    expect(frostRouteMarkerInspectCommand('ruins-stele-west', 'active')).toBeNull();
    expect(frostRouteMarkerInspectCommand('frost-route-marker', 'ready')).toBeNull();
  });
});
