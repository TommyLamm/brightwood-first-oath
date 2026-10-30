import type { UiSnapshot } from '../contracts/ports.js';
import { decorateControl } from './control-art.js';
import type { QuestView } from '../contracts/definitions.js';
import { questDropByQuest } from '../content/rules/index.js';
import { previewApAllocation } from './ap-allocation-preview.js';
import { resolveNpcMapTarget } from './npc-map-target.js';

function node<K extends keyof HTMLElementTagNameMap>(document: Document, tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const item = document.createElement(tag);
  item.className = className;
  item.textContent = text;
  return item;
}
function picture(document: Document, path: string, className: string, alt = ''): HTMLImageElement {
  const image = node(document, 'img', className);
  image.src = new URL(path, document.baseURI).href;
  image.alt = alt;
  image.draggable = false;
  image.addEventListener('error', () => { image.hidden = true; }, { once: true });
  return image;
}
function button(document: Document, label: string, action: string, data: Record<string, string> = {}, className = 'ms-button'): HTMLButtonElement {
  const item = node(document, 'button', className, label);
  item.type = 'button';
  item.dataset.uiAction = action;
  Object.assign(item.dataset, data);
  item.dataset.focus = action + ':' + Object.values(data).join(':');
  decorateControl(item, label, action);
  return item;
}
function icon(document: Document, view: UiSnapshot, key: string, label: string): HTMLElement {
  const asset = view.interfaceManifest?.images.find((image) => image.key === key);
  if (asset) return picture(document, asset.url, 'ms-visual-icon', label);
  return node(document, 'span', 'ms-visual-icon ms-visual-icon--fallback', label.slice(0, 1));
}
function actor(document: Document, view: UiSnapshot, key: string, label: string): HTMLElement {
  const asset = view.actorManifest?.images.find((image) => image.key === key);
  if (!asset) return icon(document, view, 'marker:quest', label);
  const image = node(document, 'span', 'ms-visual-actor');
  image.style.backgroundImage = 'url("' + new URL(asset.url, document.baseURI).href + '")';
  image.style.backgroundSize = (asset.columns * 100) + '% ' + (asset.rows * 100) + '%';
  image.setAttribute('role', 'img');
  image.setAttribute('aria-label', label);
  return image;
}
function token(document: Document, view: UiSnapshot, key: string, label: string, value: string | number): HTMLElement {
  const item = node(document, 'div', 'ms-visual-token');
  item.append(icon(document, view, key, ''), node(document, 'span', '', label), node(document, 'strong', '', String(value)));
  return item;
}

export function buildVisualStats(document: Document, view: UiSnapshot): HTMLElement {
  const root = node(document, 'div', 'ms-visual-stats');
  const player = view.saveData?.player;
  const stats = view.stats;
  if (!player || !stats) {
    root.append(node(document, 'p', 'ms-empty-state', '角色能力尚未載入。'));
    return root;
  }
  const describeAllocation = (label: string, stat: 'str' | 'dex', amount: number): {
    disabled: boolean;
    title: string;
    ariaLabel: string;
  } => {
    const preview = previewApAllocation({ player, rules: view.catalog.rules, stat, amount });
    const statName = stat === 'str' ? '力量' : '敏捷';
    if (!preview.ok) {
      return { disabled: true, title: preview.message, ariaLabel: label + '，' + statName + '，' + preview.message };
    }
    const { before, after, remainingAp } = preview.value;
    const description = '預計消耗 ' + amount + ' AP；' + statName + '加點：攻擊 ' + before.attack + '→' + after.attack
      + '；防禦 ' + before.defense + '→' + after.defense
      + '；暴擊率 ' + (before.critChance * 100).toFixed(1) + '%→' + (after.critChance * 100).toFixed(1)
      + '%；剩餘 AP ' + remainingAp;
    return { disabled: false, title: description, ariaLabel: label + '，' + description };
  };
  const heading = node(document, 'div', 'ms-ability-heading');
  const identity = node(document, 'div', 'ms-ability-identity');
  identity.append(picture(document, 'assets/interface/journal/hero-portrait-chibi.png', 'ms-ability-avatar'),
    node(document, 'strong', '', player.name), node(document, 'span', '', 'Lv.' + player.level + ' · ' + (player.job === 'swordsman' ? '劍士' : '初心者')));
  const points = node(document, 'div', 'ms-ability-points');
  points.append(token(document, view, 'skill:heavy-strike', '可用 AP', player.ap));
  const skills = button(document, '', 'open-panel', { panel: 'skills' }, 'ms-button ms-ability-sp');
  skills.append(icon(document, view, 'skill:iron-guard', ''), node(document, 'span', '', '技能 SP'), node(document, 'strong', '', String(player.sp)), node(document, 'span', '', '→'));
  points.append(skills);
  heading.append(identity, points);
  root.append(heading);

  const cards = node(document, 'div', 'ms-ability-cards');
  for (const spec of [
    { stat: 'str', name: '力量', file: 'strength-training-v1.png', value: player.str, theme: 'power', summary: '重擊更有力', effects: ['攻擊 +2／點'] },
    { stat: 'dex', name: '敏捷', file: 'dexterity-training-v1.png', value: player.dex, theme: 'precision', summary: '精準而穩健', effects: ['攻擊 +1／點', '暴擊 +0.4%／點', '防禦 +1／4點'] },
  ]) {
    const card = node(document, 'section', 'ms-ability-card ms-ability-card--' + spec.theme);
    const art = node(document, 'div', 'ms-ability-art');
    art.append(picture(document, 'assets/interface/illustrated/' + spec.file, '', spec.name + '訓練插畫'));
    const title = node(document, 'div', 'ms-ability-title');
    title.append(node(document, 'h3', '', spec.name + ' ' + spec.stat.toUpperCase()), node(document, 'strong', '', String(spec.value)));
    const effects = node(document, 'div', 'ms-ability-effects');
    for (const effect of spec.effects) effects.append(node(document, 'span', '', effect));
    const actions = node(document, 'div', 'ms-ability-actions');
    for (const amount of [1, Math.min(5, Math.max(1, player.ap))]) {
      if (amount === 1 && actions.childElementCount > 0) continue;
      const add = button(document, '+' + amount, 'allocate-ap', { stat: spec.stat, amount: String(amount) }, 'ms-button ms-button--' + (amount === 1 ? 'primary' : 'secondary'));
      const allocation = describeAllocation('+' + amount, spec.stat as 'str' | 'dex', amount);
      add.disabled = allocation.disabled;
      add.title = allocation.title;
      add.setAttribute('aria-label', allocation.ariaLabel);
      actions.append(add);
    }
    card.append(art, title, node(document, 'p', 'ms-ability-summary', spec.summary), effects, actions);
    cards.append(card);
  }
  root.append(cards);
  const totals = node(document, 'div', 'ms-ability-totals');
  totals.append(
    token(document, view, 'item:steel-sword', '攻擊', stats.attack),
    token(document, view, 'skill:iron-guard', '防禦', stats.defense),
    token(document, view, 'skill:sweep', '暴擊', (stats.critChance * 100).toFixed(1) + '%'),
    token(document, view, 'item:small-red', '最大 HP', stats.maxHp),
    token(document, view, 'item:small-blue', '最大 MP', stats.maxMp),
  );
  root.append(totals);
  const foot = node(document, 'div', 'ms-ability-foot');
  if (player.ap > 5) {
    for (const [stat, name] of [['str', '力量'], ['dex', '敏捷']] as const) {
      const label = '全部 AP → ' + name + '（' + player.ap + '）';
      const addAll = button(document, label, 'allocate-ap', { stat, amount: String(player.ap) }, 'ms-button ms-button--secondary');
      const allocation = describeAllocation(label, stat, player.ap);
      addAll.disabled = allocation.disabled;
      addAll.title = allocation.title;
      addAll.setAttribute('aria-label', allocation.ariaLabel);
      foot.append(addAll);
    }
  }
  if (player.ap < 1) foot.append(node(document, 'p', 'ms-panel-note', player.level >= view.catalog.rules.progression.maxLevel ? '已達等級上限，沒有可用 AP。' : '升級時可獲得 5 AP。'));
  const help = node(document, 'details', 'ms-visual-details');
  help.dataset.detailId = 'ability-rules';
  help.append(node(document, 'summary', '', '能力規則'), node(document, 'p', '', '力量每點提升 2 攻擊；敏捷每點提升 1 攻擊與 0.4% 暴擊率，每 4 點提升 1 防禦。暴擊率上限 40%，暴擊傷害 ×1.5。AP 用於能力，SP 用於技能。'));
  foot.append(help);
  root.append(foot);
  return root;
}

const QUEST_STATUS: Record<QuestView['status'], { label: string; mark: string }> = {
  active: { label: '進行中', mark: '◆' }, ready: { label: '可回報', mark: '!' },
  available: { label: '可接取', mark: '+' }, locked: { label: '未解鎖', mark: '◇' }, claimed: { label: '已完成', mark: '✓' },
};

export function chooseJournalQuest(quests: readonly QuestView[], selectedId: string | null): QuestView | undefined {
  return quests.find(({ questId }) => questId === selectedId)
    ?? quests.find(({ status }) => status === 'ready')
    ?? quests.find(({ status }) => status === 'active')
    ?? quests.find(({ status }) => status === 'available')
    ?? quests.find(({ status }) => status === 'locked')
    ?? quests.at(-1);
}

export function objectivePlaces(
  view: Pick<UiSnapshot, 'catalog'>,
  questId: string,
  objective: QuestView['objectives'][number],
): string {
  if (objective.type === 'inspect') {
    return Object.values(view.catalog.world.maps)
      .filter((map) => map.npcs.some(({ npcId }) => npcId === objective.targetId))
      .map(({ name }) => name).join('／');
  }
  if (objective.type === 'reach') return view.catalog.world.maps[objective.targetId]?.name ?? '';
  if (objective.type === 'equip') return '裝備欄';

  const claimedPrerequisites = new Set<string>();
  const addPrerequisites = (id: string): void => {
    for (const prerequisite of view.catalog.world.quests[id]?.prerequisiteIds ?? []) {
      if (claimedPrerequisites.has(prerequisite)) continue;
      claimedPrerequisites.add(prerequisite);
      addPrerequisites(prerequisite);
    }
  };
  addPrerequisites(questId);

  const reachableMaps = new Set<string>(['camp']);
  const pendingMaps = ['camp'];
  while (pendingMaps.length > 0) {
    const mapId = pendingMaps.shift()!;
    for (const portal of view.catalog.world.maps[mapId]?.portals ?? []) {
      if (portal.requiredQuestId !== null && !claimedPrerequisites.has(portal.requiredQuestId)) continue;
      if (!reachableMaps.has(portal.targetMapId)) {
        reachableMaps.add(portal.targetMapId);
        pendingMaps.push(portal.targetMapId);
      }
    }
  }

  const conditionalSource = questDropByQuest[questId];
  const monsterIds = objective.type === 'kill'
    ? new Set([objective.targetId])
    : new Set([
      ...(conditionalSource?.itemId === objective.targetId ? [conditionalSource.monsterId] : []),
      ...Object.values(view.catalog.rules.monsters)
        .filter((monster) => monster.drops.some((drop) => drop.itemId === objective.targetId && drop.chance > 0))
        .map(({ id }) => id),
    ]);
  return Object.entries(view.catalog.world.maps)
    .filter(([mapId, map]) => reachableMaps.has(mapId) && map.monsters.some(({ monsterId }) => monsterIds.has(monsterId)))
    .map(([, map]) => map.name).join('／');
}
export function buildVisualQuests(document: Document, view: UiSnapshot, selectedId: string | null): HTMLElement {
  const root = node(document, 'div', 'ms-visual-journal');
  const quests = view.questViews;
  const selected = chooseJournalQuest(quests, selectedId);
  if (!selected) {
    root.append(node(document, 'p', 'ms-empty-state', '建立角色後開始你的第一段旅程。'));
    return root;
  }
  const completed = quests.filter(({ status }) => status === 'claimed').length;
  const banner = node(document, 'div', 'ms-quest-journey');
  banner.append(picture(document, 'assets/interface/illustrated/quest-journey-v1.png', '', '從森林出發，走向赤岩山徑與古礦的冒險旅程'));
  const bannerText = node(document, 'div', 'ms-quest-journey__title');
  bannerText.append(node(document, 'span', '', '第一章 · 初誓之旅'), node(document, 'strong', '', '冒險手帳'), node(document, 'span', '', '已完成 ' + completed + ' / ' + quests.length));
  banner.append(bannerText);
  root.append(banner);

  const route = node(document, 'nav', 'ms-quest-route');
  route.setAttribute('aria-label', '主線任務路線');
  for (const [index, quest] of quests.entries()) {
    const status = QUEST_STATUS[quest.status];
    const stop = button(document, '', 'select-quest', { questId: quest.questId }, 'ms-quest-stop is-' + quest.status);
    stop.classList.toggle('is-selected', quest.questId === selected.questId);
    stop.setAttribute('aria-pressed', String(quest.questId === selected.questId));
    stop.setAttribute('aria-label', quest.title + '，' + status.label);
    stop.title = quest.title + ' · ' + status.label;
    stop.append(node(document, 'span', 'ms-quest-stop__number', quest.status === 'claimed' ? '✓' : quest.status === 'locked' ? '◇' : String(index + 1)), node(document, 'span', '', quest.title));
    route.append(stop);
  }
  root.append(route);

  const definition = view.catalog.world.quests[selected.questId];
  const card = node(document, 'article', 'ms-journal-sheet is-' + selected.status);
  const title = node(document, 'header', 'ms-journal-heading');
  const status = QUEST_STATUS[selected.status];
  title.append(icon(document, view, 'marker:quest', ''), node(document, 'h3', '', selected.title), node(document, 'span', 'ms-journal-status', status.mark + ' ' + status.label));
  card.append(title);
  if (selected.status === 'locked') {
    const locked = node(document, 'div', 'ms-journal-locked');
    locked.append(picture(document, 'assets/interface/journal/icon-scroll.png', '', '尚未展開的任務'), node(document, 'strong', '', '下一段旅程，等你開啟'));
    for (const id of definition?.prerequisiteIds ?? []) {
      if (view.saveData?.quests[id]?.status === 'claimed') continue;
      const prerequisite = view.catalog.world.quests[id];
      locked.append(node(document, 'p', '', '先完成「' + (prerequisite?.name ?? id) + '」後解鎖'));
    }
    if (definition && view.saveData && definition.minLevel > view.saveData.player.level) locked.append(node(document, 'p', '', '需要 Lv.' + definition.minLevel));
    card.append(locked);
  } else {
    const objectives = node(document, 'div', 'ms-journal-objectives');
    for (const objective of selected.objectives) {
      const tile = node(document, 'div', 'ms-journal-objective');
      const current = Math.min(objective.required, Math.max(0, objective.current));
      const done = current >= objective.required;
      tile.classList.toggle('is-done', done);
      const targetName = objective.type === 'kill' ? view.catalog.rules.monsters[objective.targetId]?.name
        : objective.type === 'reach' ? view.catalog.world.maps[objective.targetId]?.name
          : objective.type === 'inspect' ? view.catalog.world.npcs[objective.targetId]?.name
            : view.catalog.rules.items[objective.targetId]?.name;
      const inspectNpc = objective.type === 'inspect' ? view.catalog.world.npcs[objective.targetId] : undefined;
      const art = objective.type === 'kill'
        ? actor(document, view, view.catalog.rules.monsters[objective.targetId]?.actorKey ?? '', targetName ?? '')
        : inspectNpc
          ? actor(document, view, inspectNpc.actorKey, targetName ?? '')
          : icon(document, view, objective.type === 'reach' ? 'marker:portal' : 'item:' + objective.targetId, targetName ?? '');
      const target = node(document, 'div', 'ms-journal-objective__target');
      target.append(node(document, 'span', 'ms-journal-objective__verb', { kill: '擊敗', collect: '收集', equip: '裝備', reach: '抵達', inspect: '調律' }[objective.type]), node(document, 'strong', '', targetName ?? objective.targetId), node(document, 'small', '', objectivePlaces(view, selected.questId, objective)));
      const quantity = node(document, 'strong', 'ms-journal-objective__count', (done ? '✓ ' : '') + current + ' / ' + objective.required);
      const progress = node(document, 'progress', 'ms-journal-progress');
      progress.max = Math.max(1, objective.required);
      progress.value = current;
      progress.setAttribute('aria-label', (targetName ?? objective.targetId) + '進度');
      tile.append(art, target, quantity, progress);
      objectives.append(tile);
    }
    card.append(objectives);

    const contacts = node(document, 'div', 'ms-journal-contacts');
    for (const [role, npcId] of [['接取', definition?.giverNpcId], ['回報', definition?.turnInNpcId]]) {
      if (!npcId) continue;
      const npc = view.catalog.world.npcs[npcId];
      const place = Object.values(view.catalog.world.maps).find((map) => map.npcs.some((placement) => placement.npcId === npcId));
      const contact = node(document, 'div', 'ms-journal-contact');
      const text = node(document, 'div', '');
      text.append(node(document, 'span', '', role + ' · ' + (place?.name ?? '')), node(document, 'strong', '', npc?.name ?? npcId));
      contact.append(actor(document, view, npc?.actorKey ?? '', npc?.name ?? npcId), text);
      contacts.append(contact);
    }
    card.append(contacts);
    if (selected.status !== 'claimed') {
      const instruction = selected.status === 'ready' ? '目標已完成，請回報 NPC 領獎。' : selected.status === 'available' ? '先與接取 NPC 交談，再開始目標。' : '依圖示完成目標，再回報 NPC。';
      card.append(node(document, 'p', 'ms-journal-next', instruction));
    }

    const rewards = node(document, 'section', 'ms-journal-rewards');
    rewards.setAttribute('aria-label', selected.status === 'claimed' ? '已領取的任務獎勵' : '任務獎勵');
    rewards.append(node(document, 'h4', '', selected.status === 'claimed' ? '已領獎勵' : '完成獎勵'));
    rewards.append(token(document, view, 'marker:quest', 'EXP', selected.reward.exp.toLocaleString('zh-HK')), token(document, view, 'marker:shop', '金幣', selected.reward.coins.toLocaleString('zh-HK')));
    for (const item of selected.reward.items) {
      const name = view.catalog.rules.items[item.itemId]?.name ?? item.itemId;
      const reward = node(document, 'div', 'ms-journal-reward-item');
      reward.append(icon(document, view, 'item:' + item.itemId, ''), node(document, 'span', '', name), node(document, 'strong', '', '×' + item.quantity));
      rewards.append(reward);
    }
    if (selected.reward.minLevel) rewards.append(node(document, 'span', 'ms-journal-reward-extra', '至少 Lv.' + selected.reward.minLevel));
    if (selected.reward.job) rewards.append(node(document, 'span', 'ms-journal-reward-extra', '轉職：劍士'));
    card.append(rewards);
    const details = node(document, 'details', 'ms-visual-details');
    details.dataset.detailId = 'quest-story:' + selected.questId;
    const story = selected.status === 'ready' || selected.status === 'claimed' ? definition?.completeText : selected.status === 'available' ? definition?.acceptText : definition?.progressText;
    details.append(node(document, 'summary', '', '故事與任務說明'), node(document, 'p', '', story ?? definition?.summary ?? ''));
    card.append(details);
  }
  const mapNpcId = selected.status === 'ready' ? definition?.turnInNpcId
    : selected.status === 'available' ? definition?.giverNpcId
      : undefined;
  const mapTarget = mapNpcId ? resolveNpcMapTarget(view.catalog.world, mapNpcId) : null;
  const map = mapTarget && mapNpcId
    ? button(document, selected.status === 'ready' ? '查看回報 NPC 地圖 →' : '查看接取 NPC 地圖 →', 'review-npc-map', { npcId: mapNpcId }, 'ms-button ms-journal-map-button')
    : button(document, '查看世界地圖 →', 'open-panel', { panel: 'map' }, 'ms-button ms-journal-map-button');
  if (mapTarget) {
    const role = selected.status === 'ready' ? '回報' : '接取';
    const description = selected.title + ' · ' + role + ' NPC：' + mapTarget.npcName + '，所在地圖：' + mapTarget.mapName + '。只查看地圖，不會移動角色。';
    map.title = description;
    map.setAttribute('aria-label', description);
  }
  card.append(map);
  root.append(card);
  return root;
}
