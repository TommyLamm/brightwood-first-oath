import type { ContentCatalog, ItemDef, PlayerJob, PlayerProgress, QuestDef } from '../../contracts/index.js';
import { effectiveJob } from '../rules/jobs.js';
import { items, STAFF_BY_SWORD, DAGGER_BY_SWORD } from '../rules/items.js';

export const ARCHERY_TARGET_IDS = ['archery-target-low', 'archery-target-high', 'archery-target-far'] as const;
export const ROGUE_TRIAL_IDS = ['rogue-target-close', 'rogue-target-double', 'rogue-target-evade'] as const;
export const BOW_BY_SWORD: Readonly<Record<string, string>> = {
  'starter-sword': 'starter-bow', 'iron-sword': 'iron-bow', 'steel-sword': 'steel-bow',
  'guardian-sword': 'guardian-bow', 'frost-tide-sword': 'frost-tide-bow', 'sunwell-oathblade': 'sunwell-oathbow',
};
type Route = Pick<PlayerProgress, 'job' | 'plannedJob'>;

export function classItemId(itemId: string, player: Route): string {
  return (effectiveJob(player) === 'rogue' ? DAGGER_BY_SWORD[itemId] : effectiveJob(player) === 'mage' ? STAFF_BY_SWORD[itemId]
    : effectiveJob(player) === 'archer' ? BOW_BY_SWORD[itemId] : undefined) ?? itemId;
}

/** Same resolver supplies objective checks, reward previews, capacity checks and final claims. */
export function questForPlayer(quest: QuestDef, player: Route, definitions: Record<string, ItemDef> = items): QuestDef {
  const job = effectiveJob(player);
  if (job === 'swordsman') return quest;
  if (job === 'rogue' && quest.id === 'q02') return {
    ...quest, name: '短刃的進退之道', giverNpcId: 'rogue-mentor', turnInNpcId: 'rogue-mentor',
    objectives: [{ type: 'reach', targetId: 'town', count: 1 },
      ...ROGUE_TRIAL_IDS.map((targetId) => ({ type: 'inspect' as const, targetId, count: 1 }))],
    reward: { ...quest.reward, job: 'rogue', items: [{ itemId: 'iron-dagger', quantity: 1 }] },
    summary: '在木葉鎮向夜嵐學習近身、連刺及預警撤離，完成盜賊轉職。',
    acceptText: '在木葉鎮找夜嵐接取試煉。先靠近近身靶用普攻命中，再對連刺靶按技能1完成兩段連刺；試煉連刺免費。紅框預警出現後離開框線，失敗可再連刺重試。完成後回木葉鎮找夜嵐領獎。',
    progressText: '近身靶需普攻，連刺靶需技能1的兩段都命中。連刺後有900ms紅框預警，請走出框線；失敗只需重試，不要求無傷。回木葉鎮找夜嵐確認進度。',
    completeText: '已掌握近身、連刺與撤離。回木葉鎮找夜嵐，正式成為Lv.10盜賊，領取木葉雙刃與1SP；正式技能需用SP學習。',
  };
  if (job === 'mage' && quest.id === 'q02') return {
    ...quest, name: '符文的初次共鳴', giverNpcId: 'mage-mentor', turnInNpcId: 'mage-mentor',
    objectives: [{ type: 'reach', targetId: 'town', count: 1 },
      ...ARCHERY_TARGET_IDS.map((targetId) => ({ type: 'inspect' as const, targetId, count: 1 }))],
    reward: { ...quest.reward, job: 'mage', items: [{ itemId: 'iron-staff', quantity: 1 }] },
    summary: '向木葉鎮的符文研究者星蘅學習施法，站定用魔杖彈命中三座試煉靶。',
    acceptText: '先站穩，再用零MP魔杖彈命中低位、高臺與遠臺三座靶。爬梯到相同高度，在220射程內施法，完成後回木葉鎮找星蘅轉職。魔力彈與冰霜環要消耗MP，記得為閃現保留魔力。',
    progressText: '魔杖彈不消耗MP。請站在與靶相同高度，按普通攻擊施法；施法前搖期間需站定。三靶全中後回木葉鎮找星蘅回報。',
    completeText: '符文已共鳴。回木葉鎮找星蘅領取木葉符文杖並正式成為Lv.10法師，再使用SP學習魔力彈。',
  };
  if (quest.id === 'q02') return {
    ...quest, name: '弓箭手的選擇', giverNpcId: 'archer-mentor', turnInNpcId: 'archer-mentor',
    objectives: [{ type: 'reach', targetId: 'town', count: 1 },
      ...ARCHERY_TARGET_IDS.map((targetId) => ({ type: 'inspect' as const, targetId, count: 1 }))],
    reward: { ...quest.reward, job: 'archer', items: [{ itemId: 'iron-bow', quantity: 1 }] },
    summary: '在木葉鎮向青翎學習弓術，從相同高度射中三座箭靶。',
    acceptText: '在木葉鎮找青翎接取試煉，再用短弓射中低位箭靶、高臺箭靶與遠臺箭靶。箭只會水平飛行，請爬到對應高度；完成後回木葉鎮向青翎領獎。',
    progressText: '請在木葉鎮用短弓射中三座不同箭靶；重複同一座不會增加進度。高臺箭靶與遠臺箭靶需要爬梯，完成後回木葉鎮找青翎。',
    completeText: '三座箭靶都已命中！回木葉鎮向青翎領獎，完成Lv.10弓術轉職並取得木葉長弓。',
  };
  const replaceWeapons = (text: string): string => Object.entries(job === 'rogue' ? DAGGER_BY_SWORD : job === 'mage' ? STAFF_BY_SWORD : BOW_BY_SWORD).reduce((copy, [sword, bow]) =>
    definitions[sword] && definitions[bow] ? copy.replaceAll(definitions[sword]!.name, definitions[bow]!.name) : copy, text);
  return { ...quest,
    objectives: quest.objectives.map((objective) => objective.type === 'equip'
      ? { ...objective, targetId: classItemId(objective.targetId, player) } : objective),
    reward: { ...quest.reward, items: quest.reward.items.map((stack) => ({ ...stack, itemId: classItemId(stack.itemId, player) })) },
    summary: replaceWeapons(quest.summary), acceptText: replaceWeapons(quest.acceptText),
    progressText: replaceWeapons(quest.progressText), completeText: replaceWeapons(quest.completeText),
  };
}

const catalogCache = new WeakMap<ContentCatalog, Map<PlayerJob, ContentCatalog>>();
const baseCatalogs = new WeakMap<ContentCatalog, ContentCatalog>();
export function classCatalog(catalog: ContentCatalog, player: Route): ContentCatalog {
  catalog = baseCatalogs.get(catalog) ?? catalog;
  const job = effectiveJob(player);
  if (job === 'swordsman') return catalog;
  const cache = catalogCache.get(catalog) ?? new Map<PlayerJob, ContentCatalog>();
  const cached = cache.get(job);
  if (cached) return cached;
  const resolved = { ...catalog, world: { ...catalog.world, quests: Object.fromEntries(Object.entries(catalog.world.quests)
    .map(([id, quest]) => [id, questForPlayer(quest, player, catalog.rules.items)])) } };
  cache.set(job, resolved);
  catalogCache.set(catalog, cache);
  baseCatalogs.set(resolved, catalog);
  return resolved;
}
