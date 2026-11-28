import './styles.css';
import { classActionSkill, classPortrait, classSkillNames, combatSlotIconKey, playerClassLabel, equipmentJobLabel } from './class-presentation.js';
import { buildRosterManager } from './roster-manager.js';
import { specializationPanel } from './specialization-panel.js';
import { isSpecialization, playerSkillRank, specializationMentors, specializations } from '../content/rules/specializations.js';
import { canEquipForJob, effectiveJob, jobs, resolveSkillSlot } from '../content/rules/jobs.js';
import './journal.css';
import './world-map.css';
import './illustrated-panels.css';
import './control-art.css';
import './forest-hud.css';
import './image-quality.css';
import './reading-size.css';
import './local-map.css';
import { controlImage, decorateControl, installControlSkins } from './control-art.js';
import { buildQuestRewards, buildVisualStats, buildVisualQuests, chooseJournalQuest, objectivePlaces, questActorPortrait } from './illustrated-panels.js';
import { buildWorldMap } from './world-map.js';
import { PLANNED_REGIONS, savedProgressDisplayMapId } from './world-map-model.js';
import { deriveWorldProgress, frostRouteMarkerInspectCommand, groupWorldQuests, saveUpgradeConfirmCommand, saveUpgradePrompt } from './world-progress-model.js';
import {
  DEFAULT_KEY_BINDINGS,
  findKeyBindingConflict,
  getEffectiveKeyCodes,
  resolveEffectiveBindings,
  type GameAction,
  type KeyBindings,
} from '../app/keyboard.js';
import type { CommandDraft, PanelId } from '../contracts/commands.js';
import { BAG_CAPACITY } from '../contracts/limits.js';
import type { StorageLike, UiController, UiSnapshot } from '../contracts/ports.js';
import type { PlayerJob, PlayerProgress, Settings } from '../contracts/types.js';
import { resolveQuestClaim } from '../domain/quests/claim.js';
import { validatePlayerName } from '../domain/progression/index.js';
import { POTION_COOLDOWN_MS, resolveItemUse } from '../app/item-use.js';
import { isLowHealth, skillCooldownMs } from '../domain/combat/index.js';
import { reconcileBagViewState } from './bag-view-state.js';
import { previewEquipmentAction } from './equipment-preview.js';
import { previewEquipmentStats, type EquipmentStatsPreview } from './equipment-stats-preview.js';
import { previewMaterialSale } from './material-sale-preview.js';
import { previewSale } from './sale-preview.js';
import { previewBuy } from './trade-preview.js';
import { previewMaximumBuy } from './maximum-buy-preview.js';
import { previewApAllocation } from './ap-allocation-preview.js';
import { previewSkillLearning } from './skill-learning-preview.js';
import { countInventoryEntries, inventoryFilterForItem, INVENTORY_FILTERS, selectInventoryEntries, type InventoryFilter } from './inventory-entries.js';
import { SHOP_FILTERS, selectShopOffers, type ShopFilter } from './shop-offers.js';
import { resolveNpcMapTarget } from './npc-map-target.js';
import { resolveQuestMapTarget, type LocalMapFocus } from './local-map-model.js';
import { createQuestTrackerState, inspectObjectiveAction, isTrackableQuest, questTrackerSummary, selectTrackerQuest } from './quest-tracker.js';
import { makeQuestCueBadge, questObjectiveCue, questObjectiveDropSource } from './quest-cue.js';
import { combatTrialAttack, trialObjectiveTargetId } from '../content/world/class-quests.js';
import { contextHint } from './context-hint.js';
import { npcServiceCueAppearance, questCueStyle, type QuestCueKind, type QuestNpcCueState } from '../render/quest-guidance.js';
import { createReadingPreference, type ReadingSize } from './reading-preference.js';
import { createScreenModalFocus } from './screen-modal-focus.js';
import { nextInventoryBagIndex } from './inventory-navigation.js';
import { updateLocalMapMarkers } from './local-map.js';

const PANEL_LABELS: Record<PanelId, string> = {
  inventory: '背包',
  equipment: '裝備',
  skills: '技能',
  stats: '能力',
  quests: '任務',
  map: '世界地圖',
  shop: '商店',
  dialogue: '對話',
  settings: '設定',
};

const PANEL_ORDER: PanelId[] = [
  'inventory', 'equipment', 'skills', 'stats', 'quests', 'map', 'shop', 'dialogue', 'settings',
];

const KEY_ACTIONS: { id: Exclude<GameAction, 'escape'>; label: string }[] = [
  { id: 'moveLeft', label: '向左移動' },
  { id: 'moveRight', label: '向右移動' },
  { id: 'climbUp', label: '向上攀爬' },
  { id: 'climbDown', label: '向下攀爬' },
  { id: 'jump', label: '跳躍' },
  { id: 'attack', label: '普通攻擊' },
  { id: 'pickup', label: '拾取' },
  { id: 'interact', label: '互動' },
  { id: 'skill1', label: '快捷技能 1' },
  { id: 'skill2', label: '快捷技能 2' },
  { id: 'skill3', label: '快捷技能 3' },
  { id: 'potionHp', label: '使用 HP 藥水' },
  { id: 'potionMp', label: '使用 MP 藥水' },
  { id: 'inventory', label: '開啟背包' },
  { id: 'equipment', label: '開啟裝備' },
  { id: 'skills', label: '開啟技能' },
  { id: 'stats', label: '開啟能力' },
  { id: 'quests', label: '開啟任務' },
  { id: 'map', label: '開啟地圖' },
];

type UiAction =
  | 'show-atlas-terrain'
  | 'advance-specialization' | 'toggle-advanced-skill'
  | 'open-panel' | 'close-panel' | 'continue' | 'new-role' | 'create-confirm' | 'create-cancel' | 'choose-route' | 'select-character'
  | 'retry-save' | 'retry-map-load' | 'confirm-save-upgrade' | 'discard-save' | 'import-legacy-save' | 'dismiss-legacy-import' | 'play-temporary' | 'toggle-pause' | 'return-title' | 'respawn' | 'retry-boss'
  | 'return-town' | 'attack' | 'pickup' | 'interact' | 'inspect-stele' | 'inspect-route-marker' | 'review-sidequest' | 'use-item' | 'select-bag' | 'select-bag-upgrade'
  | 'inventory-filter' | 'shop-filter' | 'select-map' | 'review-npc-map' | 'review-quest-map' | 'review-quest-item' | 'select-quest' | 'track-quest'
  | 'equip-bag' | 'sell-bag' | 'sell-materials' | 'unequip' | 'allocate-ap' | 'learn-skill' | 'review-skill' | 'review-specialization' | 'accept-quest'
  | 'claim-quest' | 'buy' | 'select-max-buy' | 'settings-mute' | 'settings-reading-size' | 'settings-hold-attack' | 'settings-background-motion' | 'settings-rebind' | 'use-cloud-version'
  | 'toggle-key-guide' | 'toggle-quest-tracker' | 'settings-reset-bindings' | 'reload-page';

type KeyGuideItem = {
  label: string;
  action: GameAction;
};

type PanelFocusSnapshot = {
  panel: PanelId;
  focusKey?: string;
  value?: string;
  selection: { start: number | null; end: number | null; direction: 'forward' | 'backward' | 'none' | null } | null;
  scrollTop: number;
};

function bagFocusIndex(focusKey: string | undefined): number | null {
  const match = /^(?:bag-slot|sell-quantity|shop-sell-quantity)-(\d+)$/.exec(focusKey ?? '');
  return match ? Number(match[1]) : null;
}

function clearBagFocus(snapshot: PanelFocusSnapshot | null): PanelFocusSnapshot | null {
  return snapshot && bagFocusIndex(snapshot.focusKey) !== null
    ? { ...snapshot, focusKey: undefined, value: undefined, selection: null }
    : snapshot;
}

function isBagIndexedControl(element: HTMLElement): boolean {
  return bagFocusIndex(element.dataset.focus) !== null
    || element.dataset.bagIndex !== undefined
    || element.dataset.sellQuantity !== undefined;
}

function clearOverflowingSellValue(
  snapshot: PanelFocusSnapshot | null,
  bag: NonNullable<UiSnapshot['saveData']>['player']['bag'],
  reducedQuantities: ReadonlySet<number>,
): PanelFocusSnapshot | null {
  if (!snapshot || !reducedQuantities.size) return snapshot;
  const index = bagFocusIndex(snapshot.focusKey);
  if (index === null || !reducedQuantities.has(index) || snapshot.value === undefined) return snapshot;
  const value = Number(snapshot.value);
  const max = bag[index]?.quantity;
  return max !== undefined && Number.isFinite(value) && value > max
    ? { ...snapshot, value: undefined, selection: null }
    : snapshot;
}

type QuickIconCacheEntry = {
  signature: string;
  node: HTMLElement;
  failed: boolean;
};

const KEY_GUIDE_SECTIONS: {
  category: string;
  items: KeyGuideItem[];
}[] = [
  {
    category: '移動與探索',
    items: [
      { label: '向左 / 向右移動', action: 'moveLeft' },
      { label: '向上 / 向下爬梯', action: 'climbUp' },
      { label: '跳躍', action: 'jump' },
      { label: '互動 / NPC 對話', action: 'interact' },
      { label: '拾取掉落物', action: 'pickup' },
    ],
  },
  {
    category: '戰鬥與技能',
    items: [
      { label: '普通攻擊', action: 'attack' },
      { label: '重斬（技能 1）', action: 'skill1' },
      { label: '橫掃（技能 2）', action: 'skill2' },
      { label: '堅韌守護（技能 3）', action: 'skill3' },
    ],
  },
  {
    category: '快捷藥水',
    items: [
      { label: 'HP 藥水（紅藥水）', action: 'potionHp' },
      { label: 'MP 藥水（藍藥水）', action: 'potionMp' },
    ],
  },
  {
    category: '介面面板',
    items: [
      { label: '道具背包', action: 'inventory' },
      { label: '裝備欄', action: 'equipment' },
      { label: '技能清單', action: 'skills' },
      { label: '能力值屬性', action: 'stats' },
      { label: '任務日誌', action: 'quests' },
      { label: '大地圖', action: 'map' },
      { label: '關閉面板／暫停', action: 'escape' },
    ],
  },
];

// Settings updates replace the bindings object. HUD and panels can share its derived labels.
const keyLabelsByBindings = new WeakMap<KeyBindings, ReadonlyMap<GameAction, string>>();

function effectiveKeyText(bindings: KeyBindings, action: GameAction): string {
  let labels = keyLabelsByBindings.get(bindings);
  if (!labels) {
    const effective = resolveEffectiveBindings(bindings);
    labels = new Map((Object.keys(DEFAULT_KEY_BINDINGS) as GameAction[])
      .map((key) => [key, formatKeyCodes(getEffectiveKeyCodes(key, effective))]));
    keyLabelsByBindings.set(bindings, labels);
  }
  return labels.get(action) ?? '未生效';
}

function questKeyText(view: UiSnapshot, action: 'attack' | 'skill1'): string {
  const label = effectiveKeyText(view.saveData?.settings.bindings ?? DEFAULT_KEY_BINDINGS, action);
  return label === '左／右 Ctrl' ? 'Ctrl' : label;
}

function formatKeyCodes(codes: readonly string[]): string {
  if (codes.length === 0) return '未生效';
  if (codes.includes('ControlLeft') && codes.includes('ControlRight') && codes.length === 2) return '左／右 Ctrl';
  if (codes.includes('AltLeft') && codes.includes('AltRight') && codes.length === 2) return '左／右 Alt';
  return codes.map(codeLabel).join('／');
}

function getKeyBadgeText(bindings: Partial<Record<GameAction, string>>, item: KeyGuideItem): string {
  if (item.action === 'moveLeft') {
    const left = effectiveKeyText(bindings, 'moveLeft');
    const right = effectiveKeyText(bindings, 'moveRight');
    return left === '←' && right === '→' ? '← / →' : `${left} / ${right}`;
  }
  if (item.action === 'climbUp') {
    const up = effectiveKeyText(bindings, 'climbUp');
    const down = effectiveKeyText(bindings, 'climbDown');
    return up === '↑' && down === '↓' ? '↑ / ↓' : `${up} / ${down}`;
  }
  return effectiveKeyText(bindings, item.action);
}

function makeElement<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function makeButton(
  document: Document,
  label: string,
  action: UiAction,
  options: { className?: string; disabled?: boolean; title?: string; data?: Record<string, string> } = {},
): HTMLButtonElement {
  const button = makeElement(document, 'button', options.className ?? 'ms-button', label);
  button.type = 'button';
  button.dataset.uiAction = action;
  button.disabled = options.disabled ?? false;
  if (options.title) button.title = options.title;
  for (const [key, value] of Object.entries(options.data ?? {})) button.dataset[key] = value;
  decorateControl(button, label, action);
  return button;
}

function makeBadge(document: Document, text: string, tone = ''): HTMLElement {
  return makeElement(document, 'span', 'ms-badge' + (tone ? ' ms-badge--' + tone : ''), text);
}

function makeJournalIcon(document: Document, name: string): HTMLElement {
  const assets: Record<string, string> = {
    inventory: 'icon-backpack', equipment: 'icon-tunic', skills: 'icon-skillbook',
    stats: 'icon-compass', quests: 'icon-scroll', map: 'icon-map',
    shop: 'icon-backpack', dialogue: 'icon-scroll',
  };
  const icon = makeElement(document, 'span', 'ms-journal-icon');
  icon.setAttribute('aria-hidden', 'true');
  if (name === 'shop' || name === 'dialogue') {
    icon.append(controlImage(document, name === 'shop' ? 'trade' : 'dialogue'));
    return icon;
  }
  const asset = assets[name];
  if (asset) {
    const image = makeElement(document, 'img', 'ms-journal-icon__image');
    image.src = new URL('assets/interface/journal/' + asset + '.png', document.baseURI).href;
    image.alt = '';
    image.draggable = false;
    icon.append(image);
  } else icon.append(controlImage(document, 'settings'));
  return icon;
}

function makeInterfaceIcon(
  document: Document,
  view: UiSnapshot,
  key: string,
  label: string,
  className: string,
): HTMLElement {
  const missingIcon = (message: string): HTMLElement => {
    const fallback = makeBadge(document, message, 'missing');
    fallback.classList.add(className, 'ms-interface-icon-fallback');
    fallback.setAttribute('aria-label', label + message);
    return fallback;
  };
  const asset = view.interfaceManifest?.images.find((image) => image.key === key);
  if (!asset) return missingIcon('圖示未載入');

  const image = makeElement(document, 'img', className);
  image.src = new URL(asset.url, document.baseURI).href;
  image.alt = label;
  image.width = asset.displayWidth;
  image.height = asset.displayHeight;
  image.draggable = false;
  image.dataset.assetKey = key;
  image.addEventListener('error', () => {
    image.replaceWith(missingIcon('圖示載入失敗'));
  }, { once: true });
  return image;
}

function makeSectionTitle(document: Document, title: string, note?: string): HTMLElement {
  const row = makeElement(document, 'div', 'ms-section-title');
  row.append(makeElement(document, 'h3', '', title));
  if (note) row.append(makeBadge(document, note, 'temporary'));
  return row;
}

function formatNumber(value: number): string {
  return Math.max(0, Math.floor(value)).toLocaleString('zh-HK');
}

function formatEquipmentStatsPreview(preview: EquipmentStatsPreview): string {
  return '攻擊 ' + formatNumber(preview.before.attack) + ' → ' + formatNumber(preview.after.attack)
    + '；防禦 ' + formatNumber(preview.before.defense) + ' → ' + formatNumber(preview.after.defense)
    + '；生命上限 ' + formatNumber(preview.before.maxHp) + ' → ' + formatNumber(preview.after.maxHp);
}

function percent(value: number, maximum: number): number {
  if (maximum <= 0) return 0;
  return Math.max(0, Math.min(100, (value / maximum) * 100));
}

function jobLabel(job: string): string {
  return job === 'swordsman' ? '劍士' : job === 'archer' ? '弓箭手' : job === 'rogue' ? '盜賊' : job === 'mage' ? '法師' : '初心者';
}

function codeLabel(code: string | undefined): string {
  if (!code) return '未設定';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const labels: Record<string, string> = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Space: 'Space', AltLeft: '左 Alt', AltRight: '右 Alt',
    ControlLeft: '左 Ctrl', ControlRight: '右 Ctrl', Escape: 'Esc',
  };
  return labels[code] ?? code;
}

function remainingSeconds(milliseconds: number): string {
  return (Math.ceil(milliseconds / 100) / 10).toFixed(1) + ' 秒';
}

function compactQuickSlotState(text: string): string {
  return text.replace(/(\d+(?:\.\d+)?) 秒/g, '$1秒');
}

const SKILL_READY_CUE_MS = 520;

function renderCooldownProgress(track: HTMLElement, remaining: number, duration: number): void {
  const visible = remaining > 0 && duration > 0;
  if (track.hidden === visible) track.hidden = !visible;
  if (!visible) return;
  const percent = Math.round(clamp(1 - remaining / duration, 0, 1) * 100) + '%';
  if (track.style.getPropertyValue('--cooldown-progress') !== percent) track.style.setProperty('--cooldown-progress', percent);
}

function statusLabel(status: UiSnapshot['saveStatus']): string {
  return {
    unavailable: '未連線',
    loading: '讀取中',
    ready: '可保存',
    saving: '保存中',
    saved: '雲端已保存',
    localSaved: '本機已保存',
    previewOnly: '預覽暫存・未正式保存',
    loadError: '讀取失敗',
    saveError: '保存失敗',
    upgradeRequired: '等待升級確認',
    conflict: '其他裝置已有更新',
    localConflict: '其他分頁已更新',
    authLost: '登入狀態失效',
    incompatible: '存檔格式不相容',
  }[status];
}

function slotLabel(slot: 'weapon' | 'body' | 'hat'): string {
  return { weapon: '武器', body: '護甲', hat: '帽子' }[slot];
}

function kindLabel(kind: string): string {
  return {
    weapon: '武器', body: '護甲', hat: '帽子', consumable: '消耗品', material: '材料', quest: '任務物品',
  }[kind] ?? kind;
}

function itemDetails(item: UiSnapshot['catalog']['rules']['items'][string]): string {
  const effects: string[] = [];
  if (item.attack) effects.push('攻擊 +' + item.attack);
  if (item.defense) effects.push('防禦 +' + item.defense);
  if (item.hpBonus) effects.push('最大 HP +' + item.hpBonus);
  if (item.restoreHp) effects.push('恢復 HP ' + item.restoreHp);
  if (item.restoreMp) effects.push('恢復 MP ' + item.restoreMp);
  return [
    '需求 Lv.' + item.minLevel + (item.slot ? '・' + equipmentJobLabel(item) : ''),
    effects.length ? effects.join('・') : '沒有直接能力效果',
    ...(item.stackLimit > 1 ? ['每格最多 ' + item.stackLimit + ' 個'] : []),
    '買價 ' + (item.buyPrice > 0 ? formatNumber(item.buyPrice) : '不可購買'),
    '賣價 ' + formatNumber(item.sellPrice),
  ].join('\n');
}

function makeEquipmentComparison(
  document: Document,
  view: UiSnapshot,
  player: NonNullable<UiSnapshot['saveData']>['player'],
  item: UiSnapshot['catalog']['rules']['items'][string],
): HTMLElement | null {
  const slot = item.slot;
  if (!slot) return null;
  if (!canEquipForJob(player,item)) return makeElement(document,'p','ms-disabled-reason',equipmentJobLabel(item)+'，目前路線無法裝備。');
  // Compare against what is worn now so players can tell an upgrade without opening 裝備.
  const currentId = player.equipment[slot];
  const current = currentId ? view.catalog.rules.items[currentId] : undefined;
  const compare = makeElement(document, 'figure', 'ms-compare');
  compare.setAttribute('aria-label', '裝備比較');
  const pair = makeElement(document, 'div', 'ms-compare__pair');
  const tile = (label: string, piece: typeof item | undefined): HTMLElement => {
    const node = makeElement(document, 'div', 'ms-compare__piece');
    const name = piece?.name ?? '空的' + slotLabel(slot) + '欄';
    const icon = makeInterfaceIcon(document, view, piece?.iconKey ?? 'slot:normal', name, 'ms-compare__icon');
    icon.setAttribute('aria-hidden', 'true');
    node.append(icon, makeElement(document, 'span', 'ms-compare__label', label), makeElement(document, 'strong', '', name));
    return node;
  };
  const arrow = makeElement(document, 'span', 'ms-compare__arrow', '→');
  arrow.setAttribute('aria-hidden', 'true');
  pair.append(tile('目前裝備', current), arrow, tile('比較裝備', item));
  const differences = makeElement(document, 'figcaption', 'ms-compare__differences');
  const stats = [['攻擊', 'attack'], ['防禦', 'defense'], ['最大 HP', 'hpBonus']] as const;
  for (const [label, key] of stats) {
    const delta = (item[key] ?? 0) - (current?.[key] ?? 0);
    if (delta === 0) continue;
    differences.append(makeElement(document, 'span', delta > 0 ? 'ms-compare__up' : 'ms-compare__down',
      label + (delta > 0 ? ' +' : ' −') + Math.abs(delta)));
  }
  if (!differences.childElementCount) differences.textContent = '能力相同';
  compare.append(pair, differences);
  return compare;
}

/** Gear the hero can wear now that beats the equipped piece on some stat and loses on none. */
function isWearableUpgrade(
  view: UiSnapshot,
  player: NonNullable<UiSnapshot['saveData']>['player'],
  item: UiSnapshot['catalog']['rules']['items'][string],
): boolean {
  if (!item.slot || player.level < item.minLevel || !canEquipForJob(player,item)) return false;
  const currentId = player.equipment[item.slot];
  const current = currentId ? view.catalog.rules.items[currentId] : undefined;
  const deltas = (['attack', 'defense', 'hpBonus'] as const).map((key) => (item[key] ?? 0) - (current?.[key] ?? 0));
  return deltas.some((delta) => delta > 0) && deltas.every((delta) => delta >= 0);
}

function wearableUpgradeIndices(view: UiSnapshot, player: NonNullable<UiSnapshot['saveData']>['player']): number[] {
  return selectInventoryEntries(player.bag, view.catalog.rules.items, 'equipment')
    .filter(({ item }) => item && isWearableUpgrade(view, player, item))
    .map(({ bagIndex }) => bagIndex);
}

function targetName(view: UiSnapshot, id: string, type: string): string {
  if (type === 'kill') return view.catalog.rules.monsters[id]?.name ?? id;
  if (type === 'reach') return view.catalog.world.maps[id]?.name ?? id;
  if (type === 'inspect') return view.catalog.world.npcs[trialObjectiveTargetId(id)]?.name ?? id;
  return view.catalog.rules.items[id]?.name ?? id;
}

type TrackedObjective = UiSnapshot['questViews'][number]['objectives'][number];

function objectiveLabel(view: UiSnapshot, objective: TrackedObjective): string {
  const action = objective.type === 'inspect' ? inspectObjectiveAction(objective.targetId)
    : { kill: '擊敗', collect: '持有', equip: '裝備', reach: '到達' }[objective.type];
  return action + ' ' + targetName(view, objective.targetId, objective.type);
}

function objectiveCount(objective: TrackedObjective): string {
  return Math.min(objective.current, objective.required) + '/' + objective.required;
}

function objectiveText(view: UiSnapshot, objective: TrackedObjective): string {
  return objectiveLabel(view, objective) + ' ' + objectiveCount(objective);
}

function makeQuestGuideRow(
  document: Document, kind: QuestCueKind, text: string,
  { count, place, npcState, icon, dropSource, keyLabel }: {
    count?: string; place?: string; npcState?: QuestNpcCueState; icon?: HTMLElement; dropSource?: HTMLElement; keyLabel?: string;
  } = {},
): HTMLElement {
  const line = makeElement(document, 'span', 'ms-quest-tracker__objective');
  const label = makeElement(document, 'span', '', text);
  if (icon) label.prepend(icon);
  if (keyLabel) label.prepend(makeElement(document, 'kbd', 'ms-quest-guide-key', keyLabel), ' ');
  if (place) label.append(makeElement(document, 'span', 'ms-quest-tracker__place', place));
  if (dropSource) label.append(dropSource);
  line.append(makeQuestCueBadge(document, kind, npcState), label);
  if (count) line.append(makeElement(document, 'strong', 'ms-quest-tracker__counter', count));
  return line;
}

function makeObjectiveGuideRow(
  document: Document, view: UiSnapshot, questId: string, objective: TrackedObjective, count = objectiveCount(objective),
): HTMLElement {
  const kind = questObjectiveCue(objective);
  const iconKey = kind === 'item' ? view.catalog.rules.items[objective.targetId]?.iconKey : undefined;
  const actorKey = objective.type === 'kill' ? view.catalog.rules.monsters[objective.targetId]?.actorKey
    : objective.type === 'inspect' ? view.catalog.world.npcs[trialObjectiveTargetId(objective.targetId)]?.actorKey : undefined;
  const icon = iconKey && view.interfaceManifest
    ? makeInterfaceIcon(document, view, iconKey, '', 'ms-quest-tracker__item-icon')
    : questActorPortrait(document, view, actorKey);
  icon?.setAttribute('aria-hidden', 'true');
  const monster = questObjectiveDropSource(view, questId, objective);
  const dropSource = monster ? makeElement(document, 'span', 'ms-quest-tracker__drop-source') : undefined;
  if (monster && dropSource) {
    const sourcePortrait = questActorPortrait(document, view, monster.actorKey);
    dropSource.append(makeQuestCueBadge(document, 'monster'));
    if (sourcePortrait) dropSource.append(sourcePortrait);
    dropSource.append('來源：' + monster.name);
  }
  const trial = objective.type === 'inspect' && objective.current < objective.required && combatTrialAttack(trialObjectiveTargetId(objective.targetId));
  return makeQuestGuideRow(document, kind, objectiveLabel(view, objective), {
    count, icon, dropSource, keyLabel: trial ? questKeyText(view, trial.action) : undefined,
  });
}

function preserveFocus(container: HTMLElement, renderContent: () => void, skipDisabled = false): void {
  const document = container.ownerDocument;
  const active = document.activeElement;
  const key = active instanceof HTMLElement && container.contains(active) ? active.dataset.focus : undefined;
  const value = active instanceof HTMLInputElement || active instanceof HTMLSelectElement ? active.value : undefined;
  let selection: { start: number | null; end: number | null; direction: 'forward' | 'backward' | 'none' | null } | null = null;
  if (active instanceof HTMLInputElement && active.type !== 'range') {
    try {
      selection = {
        start: active.selectionStart,
        end: active.selectionEnd,
        direction: active.selectionDirection,
      };
    } catch {
      selection = null;
    }
  }
  renderContent();
  if (!key || !document.hasFocus()) return;
  const replacement = Array.from(container.querySelectorAll<HTMLElement>('[data-focus]'))
    .find((element) => element.dataset.focus === key && (!skipDisabled || !element.matches(':disabled')));
  if (!replacement) return;
  if (value !== undefined && (replacement instanceof HTMLInputElement || replacement instanceof HTMLSelectElement)) {
    replacement.value = value;
  }
  replacement.focus();
  if (selection && replacement instanceof HTMLInputElement && selection.start !== null && selection.end !== null) {
    try {
      replacement.setSelectionRange(selection.start, selection.end, selection.direction ?? undefined);
    } catch {
      // Range inputs and browser-managed fields may not support text selection.
    }
  }
}

/** Builds the desktop UI package. All gameplay changes leave through the supplied app dispatcher. */
export function createUi(
  root: HTMLElement,
  dispatch: (command: CommandDraft) => void,
  options: { gameId: string; storage: StorageLike | null },
): UiController {
  const document = root.ownerDocument;
  const questTrackerState = createQuestTrackerState(options.gameId, options.storage);
  const readingPreference = createReadingPreference(options.gameId, options.storage);
  const shell = makeElement(document, 'section', 'maple-ui');
  installControlSkins(shell);
  shell.setAttribute('aria-label', 'Brightwood: First Oath 遊戲介面');
  // Resolve public artwork from the entry URL so version/preview subdirectories work.
  for (const [name, file] of Object.entries({
    panel: 'parchment-panel', tray: 'leather-tray', sign: 'wooden-sign',
    button: 'system-button', slot: 'quick-slot',
  })) {
    shell.style.setProperty('--journal-' + name, 'url("' + new URL('assets/interface/journal/' + file + '.png', document.baseURI).href + '")');
  }
  shell.style.setProperty('--title-backdrop', 'url("' + new URL('cover.png', document.baseURI).href + '")');

  const header = makeElement(document, 'header', 'ms-header');
  const keyGuide = makeElement(document, 'div', 'ms-key-guide');
  const keyGuideToggle = makeButton(document, '?', 'toggle-key-guide', {
    className: 'ms-button ms-system-button ms-key-guide__toggle',
    title: '點擊展開或收起按鍵提示',
  });
  keyGuideToggle.setAttribute('aria-expanded', 'false');
  keyGuideToggle.setAttribute('aria-controls', 'ms-key-guide-card');
  keyGuideToggle.setAttribute('aria-label', '按鍵提示');

  const keyGuideCard = makeElement(document, 'div', 'ms-card ms-key-guide__card');
  keyGuideCard.id = 'ms-key-guide-card';
  keyGuideCard.hidden = true;
  keyGuide.append(keyGuideToggle, keyGuideCard);

  const hud = makeElement(document, 'div', 'ms-hud');
  const bossVitals = makeElement(document, 'div', 'ms-boss-vitals');
  bossVitals.hidden = true;
  const bossHeading = makeElement(document, 'div', 'ms-boss-vitals__heading');
  const bossName = makeElement(document, 'strong');
  const bossPhase = makeElement(document, 'span', 'ms-boss-vitals__phase');
  bossPhase.setAttribute('role', 'status');
  bossPhase.hidden = true;
  const bossHealth = makeElement(document, 'span');
  const bossBar = makeElement(document, 'progress', 'ms-boss-vitals__bar');
  bossHeading.append(bossName, bossPhase, bossHealth);
  bossVitals.append(bossHeading, bossBar);
  const profile = makeElement(document, 'section', 'ms-card ms-profile');
  const quickbar = makeElement(document, 'section', 'ms-quickbar');
  const mapCard = makeElement(document, 'section', 'ms-card ms-map-indicator');
  const mapNameLabel = makeElement(document, 'strong', '', '尚未開始');
  const mapCoins = makeElement(document, 'span', 'ms-map-indicator__coins');
  mapCoins.hidden = true;
  mapCard.append(mapNameLabel, mapCoins);
  const region = makeElement(document, 'aside', 'ms-region');
  const systemControls = makeElement(document, 'nav', 'ms-system-controls');
  systemControls.setAttribute('aria-label', '遊戲系統');
  const questTracker = makeElement(document, 'section', 'ms-card ms-quest-tracker');
  questTracker.setAttribute('aria-label', '任務追蹤');
  const questToggle = makeButton(document, '', 'toggle-quest-tracker', { className: 'ms-quest-tracker__toggle' });
  const questArrow = makeElement(document, 'span', 'ms-quest-tracker__arrow');
  questArrow.setAttribute('aria-hidden', 'true');
  const questTitle = makeElement(document, 'strong', 'ms-quest-tracker__title');
  const questProgress = makeElement(document, 'span', 'ms-quest-tracker__progress');
  const questSummaryCue = makeQuestCueBadge(document, 'npc');
  questSummaryCue.hidden = true;
  const questTarget = makeElement(document, 'span', 'ms-quest-tracker__target');
  const questCounter = makeElement(document, 'span', 'ms-quest-tracker__counter');
  questCounter.setAttribute('role', 'status');
  questCounter.setAttribute('aria-live', 'polite');
  questProgress.append(questSummaryCue, questTarget, questCounter);
  questToggle.append(questArrow, questTitle, questProgress);
  const questMeter = makeElement(document, 'progress', 'ms-quest-tracker__meter');
  questMeter.max = 1;
  questMeter.hidden = true;
  questMeter.setAttribute('aria-hidden', 'true');
  const questBody = makeElement(document, 'div', 'ms-quest-tracker__body');
  questBody.id = 'ms-quest-tracker-body';
  questToggle.setAttribute('aria-controls', questBody.id);
  const questDetail = makeElement(document, 'span', 'ms-quest-tracker__detail');
  const questReview = makeButton(document, '', 'review-sidequest', { className: 'ms-quest-tracker__review' });
  questReview.textContent = '查看任務 →';
  const shortcutClass = 'ms-quest-tracker__review ms-quest-tracker__shortcut';
  const questMapReview = makeButton(document, '', 'review-quest-map', { className: shortcutClass });
  questMapReview.append(makeQuestCueBadge(document, 'portal'), document.createTextNode('查看地點'));
  questMapReview.hidden = true;
  const questItemReview = makeButton(document, '', 'review-quest-item', { className: shortcutClass });
  const questItemReviewLabel = document.createTextNode('');
  questItemReview.append(makeQuestCueBadge(document, 'item'), questItemReviewLabel);
  questItemReview.hidden = true;
  const questActions = makeElement(document, 'div', 'ms-quest-tracker__actions');
  questActions.append(questItemReview, questMapReview, questReview);
  questBody.append(questDetail, questActions);
  questTracker.append(questToggle, questMeter, questBody);
  const interactionHintRow = makeElement(document, 'div', 'ms-interaction-hint');
  const interactionHintText = makeElement(document, 'span', '');
  const pickupBagButton = makeButton(document, '', 'open-panel', {
    className: 'ms-button ms-button--small ms-context-button ms-interaction-hint__bag',
    data: { panel: 'inventory' },
  });
  pickupBagButton.append(makeJournalIcon(document, 'inventory'), document.createTextNode('整理背包'));
  pickupBagButton.hidden = true;
  const portalQuestReview = makeButton(document, '', 'select-quest', {
    className: 'ms-button ms-button--small ms-context-button ms-interaction-hint__quest',
  });
  const portalQuestCue = makeQuestCueBadge(document, 'npc');
  portalQuestReview.append(portalQuestCue, document.createTextNode('查看通行任務'));
  portalQuestReview.hidden = true;
  interactionHintRow.append(interactionHintText, pickupBagButton, portalQuestReview);
  let contextTargetKey: string | null = null;
  let contextPickupKey: string | null = null;
  interactionHintRow.hidden = true;
  interactionHintRow.setAttribute('role', 'note');
  const bottomBar = makeElement(document, 'div', 'ms-bottom-bar');
  const actionBar = makeElement(document, 'div', 'ms-action-bar');
  const controls = makeElement(document, 'nav', 'ms-controls');
  controls.setAttribute('aria-label', '遊戲面板');
  const panelButtons = new Map<PanelId, HTMLButtonElement>();
  for (const panel of PANEL_ORDER) {
    const button = makeButton(document, PANEL_LABELS[panel], 'open-panel', {
      className: 'ms-button ms-journal-tab',
      data: { panel },
    });
    button.setAttribute('aria-label', '開啟' + PANEL_LABELS[panel]);
    button.title = PANEL_LABELS[panel];
    button.replaceChildren(makeJournalIcon(document, panel), makeElement(document, 'span', '', panel === 'map' ? '地圖' : PANEL_LABELS[panel]));
    if (panel === 'settings') {
      button.className = 'ms-button ms-system-button';
      systemControls.append(button);
    } else if (panel === 'shop' || panel === 'dialogue') {
      button.className = 'ms-button ms-context-button';
      actionBar.append(button);
    } else controls.append(button);
    panelButtons.set(panel, button);
  }
  const pauseButton = makeButton(document, 'Ⅱ', 'toggle-pause', { className: 'ms-button ms-system-button', title: '暫停遊戲' });
  pauseButton.setAttribute('aria-label', '暫停遊戲');
  const returnTownButton = makeButton(document, '返回城鎮', 'return-town', { className: 'ms-button ms-button--secondary' });
  actionBar.append(returnTownButton);
  systemControls.append(keyGuide, pauseButton);
  header.append(mapCard, systemControls);
  region.append(header, interactionHintRow, questTracker);
  hud.append(bossVitals, region);
  bottomBar.append(profile, quickbar, controls);

  const quickSlots = makeElement(document, 'div', 'ms-quickbar__slots');
  const quickDefinitions = [
    { id: 'basic', label: '普通攻擊', kind: 'attack', action: 'attack' },
    { id: 'heavy-strike', label: '重斬', kind: 'skill', action: 'skill1' },
    { id: 'sweep', label: '橫掃', kind: 'skill', action: 'skill2' },
    { id: 'iron-guard', label: '堅韌守護', kind: 'skill', action: 'skill3' },
    { id: 'small-red', label: 'HP 藥水', kind: 'item', action: 'potionHp' },
    { id: 'small-blue', label: 'MP 藥水', kind: 'item', action: 'potionMp' },
  ] as const;
  const quickButtons: {
    slot: typeof quickDefinitions[number]; button: HTMLButtonElement; key: HTMLElement;
    iconHost: HTMLElement; label: HTMLElement; state: HTMLElement; cooldownTrack: HTMLElement; previousInputs: unknown[];
  }[] = [];
  for (const slot of quickDefinitions) {
    const button = makeButton(document, '', slot.kind === 'item' ? 'use-item' : 'attack', {
      className: 'ms-quick-slot',
      data: slot.kind === 'item' ? { itemId: slot.id, quickSlot: slot.id } : { skillId: slot.id, quickSlot: slot.id },
    });
    const keyHint = makeElement(document, 'span', 'ms-quick-slot__key', '—');
    const icon = makeElement(document, 'span', 'ms-quick-slot__icon');
    const label = makeElement(document, 'strong', 'ms-quick-slot__label', slot.label);
    const state = makeElement(document, 'span', 'ms-quick-slot__state', '');
    const cooldownTrack = makeElement(document, 'span', 'ms-quick-slot__cooldown');
    cooldownTrack.hidden = true;
    cooldownTrack.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-label', slot.label);
    if (slot.kind === 'item') button.classList.add('ms-quick-slot--item');
    button.append(keyHint, icon, label, state, cooldownTrack);
    quickSlots.append(button);
    quickButtons.push({ slot, button, key: keyHint, iconHost: icon, label, state, cooldownTrack, previousInputs: [] });
  }
  quickbar.setAttribute('aria-label', '戰鬥與藥水快捷列');
  quickbar.append(quickSlots);

  const panelHost = makeElement(document, 'div', 'ms-panel-host');
  const panelWarning = makeElement(document, 'span', 'ms-panel__warning');
  const warningSymbol = makeElement(document, 'span', 'ms-panel__warning-symbol', '!');
  warningSymbol.setAttribute('aria-hidden', 'true');
  panelWarning.append(warningSymbol, document.createTextNode('位於攻擊預警區'));
  panelWarning.setAttribute('role', 'status');
  panelWarning.hidden = true;
  panelHost.hidden = true;
  const screenLayer = makeElement(document, 'div', 'ms-screen-layer');
  screenLayer.hidden = true;
  const toast = makeElement(document, 'div', 'ms-toast');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  const footer = makeElement(document, 'footer', 'ms-footer');
  const errorText = makeElement(document, 'span', 'ms-footer__error');
  const footerActions = makeElement(document, 'div', 'ms-footer__actions');
  footer.append(footerActions, errorText);
  footer.hidden = true;

  // The world freezes while the page has lost focus (see worldIsFrozen); say so instead of looking hung.
  const focusBanner = makeElement(document, 'div', 'ms-focus-banner', '遊戲畫面失去焦點，冒險已安全暫停。');
  focusBanner.setAttribute('role', 'status');
  focusBanner.hidden = true;
  shell.append(hud, bottomBar, actionBar, panelHost, screenLayer, toast, focusBanner, footer);
  root.append(shell);
  shell.dataset.readingSize = readingPreference.size;
  const gameSurface = document.getElementById('game-root');
  const modalFocus = createScreenModalFocus(screenLayer, [hud, bottomBar, actionBar, panelHost, toast, footer,
    ...(gameSurface && !gameSurface.contains(root) ? [gameSurface] : [])]);

  let currentView: UiSnapshot | null = null;
  let lastScreenSignature = '';
  let playerProfileView: ReturnType<typeof makePlayerProfileView> | null | undefined;
  let lastMapCoins: number | null = null;
  let lastQuestTracker: {
    views: UiSnapshot['questViews'];
    interfaceManifest: UiSnapshot['interfaceManifest'];
    actorManifest: UiSnapshot['actorManifest'];
    bindings: KeyBindings | undefined;
    mapId: string | undefined;
    chapterComplete: boolean;
    collapsed: boolean;
    trackedQuestId: string | null;
  } | undefined;
  let lastPanelSignature = '';
  let lastPanelSources: {
    panel: PanelId;
    data: UiSnapshot['saveData'] | PlayerProgress | undefined;
    quests: UiSnapshot['questViews'] | undefined;
    interaction: UiSnapshot['interaction'] | undefined;
    signature: string;
  } | null = null;
  let lastFooterActionStatus: UiSnapshot['saveStatus'] | null = null;
  let selectedBagIndex: number | null = null;
  let inventoryFilter: InventoryFilter = 'all';
  let shopFilter: ShopFilter = 'all';
  let selectedMapId: string | null = null;
  let selectedMapFocus: LocalMapFocus | null = null;
  let questMapReturn: PanelFocusSnapshot | null = null;
  let selectedQuestId: string | null = null;
  let pendingQuestReview = false;
  let pendingMapReview = false;
  let pendingSkillReview: string | null = null;
  let pendingSpecializationReview = false;
  let pendingBagReview = false;
  let createRequested = false;
  let plannedJobDraft: PlayerJob = 'swordsman';
  let slotDraft: string | undefined;
  let discardConfirmed = false;
  let nameDraft = '旅人';
  let shopQuantities = new Map<string, number>();
  let sellQuantities = new Map<number, number>();
  const emptyBag: NonNullable<UiSnapshot['saveData']>['player']['bag'] = [];
  let lastReconciledBag = emptyBag;
  let bagStateMessage = '';
  let bagHeadingRestorePending = false;
  let pendingBinding: Exclude<GameAction, 'escape'> | null = null;
  let bindingMessage = '';
  // Which row the message is about, so it shows next to that row instead of below all 17 bindings.
  let bindingMessageAction: string | null = null;
  let keyGuideExpanded = false;
  let lastKeyGuideInputs: readonly unknown[] = [];
  let panelFocusBeforeResume: PanelFocusSnapshot | null = null;
  let lastPanelFocus: PanelFocusSnapshot | null = null;
  let restoreFocusAfterResume = false;
  let disposed = false;
  const quickIconCache = new Map<string, QuickIconCacheEntry>();

  const clearTransientViewState = (): void => {
    selectedBagIndex = null;
    pendingQuestReview = false;
    pendingMapReview = false;
    questMapReturn = null;
    pendingSkillReview = null;
    pendingSpecializationReview = false;
    pendingBagReview = false;
    sellQuantities = new Map();
    shopQuantities = new Map();
    bagStateMessage = '';
    bagHeadingRestorePending = false;
    pendingBinding = null;
    bindingMessage = '';
    bindingMessageAction = null;
    lastPanelFocus = clearBagFocus(lastPanelFocus);
    panelFocusBeforeResume = clearBagFocus(panelFocusBeforeResume);
  };

  const dispatchDraft = (command: CommandDraft): void => {
    if (!disposed) dispatch(command);
  };

  const capturePanelFocus = (view: UiSnapshot, activeElement: Element | null = document.activeElement): PanelFocusSnapshot | null => {
    const panel = view.panels.at(-1);
    const active = activeElement;
    if (!panel || !(active instanceof HTMLElement) || !panelHost.contains(active)) return null;

    let value: string | undefined;
    let selection: PanelFocusSnapshot['selection'] = null;
    if (active instanceof HTMLInputElement || active instanceof HTMLSelectElement || active instanceof HTMLTextAreaElement) {
      value = active.value;
    }
    if ((active instanceof HTMLInputElement && active.type !== 'range') || active instanceof HTMLTextAreaElement) {
      try {
        selection = {
          start: active.selectionStart,
          end: active.selectionEnd,
          direction: active.selectionDirection,
        };
      } catch {
        selection = null;
      }
    }
    return {
      panel,
      ...(active.dataset.focus ? { focusKey: active.dataset.focus } : {}),
      ...(value !== undefined ? { value } : {}),
      selection,
      scrollTop: panelHost.querySelector<HTMLElement>('.ms-panel__body')?.scrollTop ?? 0,
    };
  };

  const renderQuickIcon = (
    slotId: string,
    host: HTMLElement,
    view: UiSnapshot,
    assetKey: string | null,
    label: string,
    className: string,
    plainFallback?: string,
  ): void => {
    const asset = assetKey ? view.interfaceManifest?.images.find((image) => image.key === assetKey) : undefined;
    const url = asset ? new URL(asset.url, document.baseURI).href : null;
    const isPlainFallback = assetKey === null && plainFallback !== undefined;
    const descriptor = JSON.stringify({
      assetKey,
      url,
      displayWidth: asset?.displayWidth ?? null,
      displayHeight: asset?.displayHeight ?? null,
      label,
      className,
      missing: !asset && !isPlainFallback,
      plainFallback: isPlainFallback ? plainFallback : null,
    });
    let entry = quickIconCache.get(slotId);
    if (!entry || entry.signature !== descriptor) {
      const nextEntry: QuickIconCacheEntry = { signature: descriptor, node: document.createElement('span'), failed: false };
      const missingIcon = (message: string): HTMLElement => {
        const fallback = makeBadge(document, message, 'missing');
        fallback.classList.add(className, 'ms-interface-icon-fallback');
        fallback.setAttribute('aria-label', label + message);
        return fallback;
      };
      if (asset && url) {
        const image = makeElement(document, 'img', className);
        image.alt = label;
        image.width = asset.displayWidth;
        image.height = asset.displayHeight;
        image.draggable = false;
        image.dataset.assetKey = assetKey!;
        image.addEventListener('error', () => {
          if (quickIconCache.get(slotId) !== nextEntry) return;
          const fallback = missingIcon('圖示載入失敗');
          nextEntry.node = fallback;
          nextEntry.failed = true;
          if (image.parentNode) image.replaceWith(fallback);
        }, { once: true });
        image.src = url;
        nextEntry.node = image;
      } else if (isPlainFallback) {
        nextEntry.node = makeBadge(document, plainFallback!, 'neutral');
      } else {
        nextEntry.node = missingIcon('圖示未載入');
      }
      quickIconCache.set(slotId, nextEntry);
      entry = nextEntry;
    }
    if (host.childNodes.length !== 1 || host.firstChild !== entry.node) host.replaceChildren(entry.node);
  };

  const renderKeyGuide = (view: UiSnapshot | null): void => {
    if (view?.panels.length) keyGuideExpanded = false;
    if (keyGuideCard.hidden !== !keyGuideExpanded) {
      keyGuideToggle.classList.toggle('is-active', keyGuideExpanded);
      keyGuideToggle.setAttribute('aria-expanded', String(keyGuideExpanded));
      keyGuideCard.hidden = !keyGuideExpanded;
    }
    if (!keyGuideExpanded) return;

    const bindings = (view?.saveData?.settings.bindings ?? DEFAULT_KEY_BINDINGS) as Partial<Record<GameAction, string>>;
    const player = view?.saveData?.player;
    const inputs = [bindings, player && effectiveJob(player), player?.specialization, player?.advancedSkillEquipped,
      player?.equipment.weapon, view?.catalog.rules, view?.interfaceManifest];
    if (keyGuideCard.hasChildNodes() && inputs.every((value, index) => value === lastKeyGuideInputs[index])) return;
    lastKeyGuideInputs = inputs;

    keyGuideCard.replaceChildren();

    const headerRow = makeElement(document, 'div', 'ms-key-guide__header');
    const closeButton = makeButton(document, '✕ 收起', 'toggle-key-guide', {
      className: 'ms-button ms-button--close',
      title: '收起按鍵提示',
    });
    closeButton.setAttribute('aria-label', '✕ 收起：操作按鍵提示');
    const settingsShortcut = makeButton(document, '改鍵', 'open-panel', {
      className: 'ms-button ms-button--small', data: { panel: 'settings' }, title: '自訂快捷鍵',
    });
    settingsShortcut.setAttribute('aria-label', '自訂快捷鍵');
    const actions = makeElement(document, 'div', 'ms-key-guide__actions');
    actions.append(settingsShortcut, closeButton);
    headerRow.append(makeElement(document, 'h4', '', '操作按鍵提示'), actions);
    keyGuideCard.append(headerRow);

    for (const section of KEY_GUIDE_SECTIONS) {
      const secEl = makeElement(document, 'div', 'ms-key-guide__section');
      secEl.append(makeElement(document, 'div', 'ms-key-guide__section-title', section.category));
      const grid = makeElement(document, 'div', 'ms-key-guide__grid');
      for (const item of section.items) {
        const row = makeElement(document, 'div', 'ms-key-guide__row');
        const skill = player && view ? classActionSkill(player, view.catalog.rules, item.action ?? '') : undefined;
        const action = makeElement(document, 'span', 'ms-key-guide__action', skill?.name ?? item.label);
        const iconKey = skill && view ? combatSlotIconKey(player, view.catalog.rules, skill.id) : null;
        if (iconKey && view?.interfaceManifest) action.prepend(makeInterfaceIcon(document, view, iconKey, '', 'ms-key-guide__icon'));
        row.append(action, makeElement(document, 'span', 'ms-key-guide__badge', getKeyBadgeText(bindings, item)));
        grid.append(row);
      }
      secEl.append(grid);
      keyGuideCard.append(secEl);
    }

  };

  const nameFeedbackId = 'brightwood-first-oath-character-name-feedback';
  const presentNameFeedback = (
    input: HTMLInputElement,
    feedback: HTMLParagraphElement | null,
    checked: ReturnType<typeof validatePlayerName>,
  ): void => {
    input.setAttribute('aria-describedby', nameFeedbackId);
    input.setAttribute('aria-invalid', String(!checked.ok));
    if (!feedback) return;
    feedback.className = checked.ok ? 'ms-panel-note' : 'ms-warning';
    feedback.textContent = checked.ok
      ? `建立後將使用名稱「${checked.value}」。`
      : checked.message;
  };

  const captureNameInput = (checked: ReturnType<typeof validatePlayerName>): HTMLInputElement => {
    const input = makeElement(document, 'input', 'ms-input');
    input.type = 'text';
    input.maxLength = 16;
    input.autocomplete = 'off';
    input.placeholder = '輸入角色名稱';
    input.value = nameDraft;
    input.dataset.focus = 'character-name';
    input.setAttribute('aria-label', '角色名稱');
    input.setAttribute('aria-describedby', nameFeedbackId);
    input.setAttribute('aria-invalid', String(!checked.ok));
    return input;
  };

  const renderProfile = (view: UiSnapshot): void => {
    const player = view.saveData?.player;
    if (!player) {
      if (playerProfileView === null) return;
      playerProfileView = null;
      profile.replaceChildren(
        makeElement(document, 'div', 'ms-profile__portrait ms-profile__portrait--empty', '劍'),
        makeElement(document, 'div', 'ms-profile__main', '登入或建立角色後開始冒險'),
      );
      return;
    }
    if (!playerProfileView) {
      playerProfileView = makePlayerProfileView(document);
      profile.replaceChildren(...playerProfileView.elements);
    }
    const { portrait, hero, guard, name, level, hp, mp, exp } = playerProfileView;
    const portraitPath = classPortrait(player);
    if (hero.getAttribute('src') !== portraitPath) hero.setAttribute('src', portraitPath);
    if (name.textContent !== player.name) {
      name.textContent = player.name;
      portrait.setAttribute('aria-label', '開啟' + player.name + '的角色資訊');
    }
    const levelText = 'Lv.' + player.level;
    if (level.textContent !== levelText) level.textContent = levelText;
    const activeGuard = view.activeGuard;
    const hideGuard = !activeGuard;
    if (guard.hidden !== hideGuard) guard.hidden = hideGuard;
    if (activeGuard) {
      const bonus = '+' + activeGuard.defenseBonus;
      if (guard.textContent !== bonus) guard.textContent = bonus;
      const description = '防禦加成 ' + bonus + '，剩餘 ' + activeGuard.remainingSeconds + ' 秒';
      if (guard.title !== description) {
        guard.title = description;
        portrait.setAttribute('aria-description', description);
      }
    } else if (guard.title) {
      guard.removeAttribute('title');
      portrait.removeAttribute('aria-description');
    }
    const maxHp = view.stats?.maxHp ?? player.hp;
    if (hp.update(player.hp, maxHp)) {
      const lowHealth = isLowHealth(player.hp, maxHp);
      hp.element.classList.toggle('is-low', lowHealth);
      if (lowHealth) hp.element.title = 'HP 偏低';
      else hp.element.removeAttribute('title');
    }
    mp.update(player.mp, view.stats?.maxMp ?? player.mp);
    hp.setRecovering(view.passiveRecovery === 'hp');
    mp.setRecovering(view.passiveRecovery === 'mp');
    const atMaxLevel = player.level >= view.catalog.rules.progression.maxLevel;
    const nextExp = view.catalog.rules.progression.expToNext[player.level] ?? 0;
    if (exp.update(atMaxLevel ? 1 : player.exp, atMaxLevel ? 1 : nextExp, atMaxLevel ? 'MAX' : undefined)) {
      exp.element.title = atMaxLevel ? 'EXP：MAX（已達等級上限）' : 'EXP：' + formatNumber(player.exp) + ' / ' + formatNumber(nextExp);
    }
  };

  const renderMapIndicator = (view: UiSnapshot): void => {
    const mapId = view.saveData?.location.mapId;
    const name = mapId ? view.catalog.world.maps[mapId]?.name ?? mapId : '尚未開始';
    if (mapNameLabel.textContent !== name) mapNameLabel.textContent = name;
    const coins = view.saveData?.player.coins ?? null;
    if (lastMapCoins === coins) return;
    lastMapCoins = coins;
    mapCoins.hidden = coins === null;
    if (coins !== null) mapCoins.textContent = '金幣 ' + formatNumber(coins);
  };

  const renderBossVitals = ({ bossVitals: boss }: UiSnapshot): void => {
    const hidden = !boss;
    if (bossVitals.hidden !== hidden) bossVitals.hidden = hidden;
    if (!boss) return;
    if (bossName.textContent !== boss.name) {
      bossName.textContent = boss.name;
      bossBar.setAttribute('aria-label', boss.name + '生命值');
    }
    const phaseLabel = boss.changingPhase ? '階段轉換' : boss.phase === 2 ? '第二階段' : '';
    if (bossPhase.textContent !== phaseLabel) {
      bossPhase.textContent = phaseLabel;
      bossPhase.hidden = phaseLabel === '';
      bossVitals.classList.toggle('is-second-phase', boss.phase === 2);
      bossVitals.classList.toggle('is-changing-phase', boss.changingPhase);
    }
    if (bossBar.max !== boss.maxHp || bossBar.value !== boss.hp) {
      bossBar.max = boss.maxHp;
      bossBar.value = boss.hp;
      bossHealth.textContent = formatNumber(boss.hp) + ' / ' + formatNumber(boss.maxHp);
    }
  };

  const renderQuestTracker = (view: UiSnapshot): void => {
    const chapterComplete = Boolean(view.saveData?.flags.chapterComplete);
    const mapId = view.saveData?.location.mapId;
    const bindings = view.saveData?.settings.bindings;
    const collapsed = questTrackerState.collapsed;
    if (lastQuestTracker?.views === view.questViews && lastQuestTracker.mapId === mapId
      && lastQuestTracker.interfaceManifest === view.interfaceManifest
      && lastQuestTracker.actorManifest === view.actorManifest
      && lastQuestTracker.bindings === bindings
      && lastQuestTracker.chapterComplete === chapterComplete && lastQuestTracker.collapsed === collapsed
      && lastQuestTracker.trackedQuestId === questTrackerState.trackedQuestId) return;
    if (view.saveData) questTrackerState.reconcile(view.questViews);
    const trackedQuestId = questTrackerState.trackedQuestId;
    lastQuestTracker = { views: view.questViews, interfaceManifest: view.interfaceManifest, actorManifest: view.actorManifest,
      bindings, mapId, chapterComplete, collapsed, trackedQuestId };
    const worldComplete = deriveWorldProgress(view.saveData, view.questViews.map(({ questId }) => questId)).worldComplete;
    const quest = selectTrackerQuest(view.questViews, trackedQuestId);
    const title = quest?.title ?? (worldComplete ? '世界旅程完成' : chapterComplete ? '第一章完成' : '自由探索');
    const definition = quest ? view.catalog.world.quests[quest.questId] : undefined;
    const giver = definition ? view.catalog.world.npcs[definition.giverNpcId]?.name ?? definition.giverNpcId : '任務委託人';
    const recipient = definition ? view.catalog.world.npcs[definition.turnInNpcId]?.name ?? definition.turnInNpcId : '任務委託人';
    const npcId = quest?.status === 'available' ? definition?.giverNpcId
      : quest?.status === 'ready' ? definition?.turnInNpcId : undefined;
    const npcPlace = npcId ? resolveNpcMapTarget(view.catalog.world, npcId) : null;
    const place = npcPlace ? '（' + npcPlace.mapName + '）' : '';
    const objectiveMap = quest?.status === 'active' && view.saveData
      ? resolveQuestMapTarget(view.catalog.world, view.saveData, quest) : undefined;
    const mapName = npcPlace?.mapName ?? objectiveMap?.name;
    questMapReview.hidden = !mapName;
    if (mapName && quest) {
      const useNpc = npcPlace && npcId;
      questMapReview.dataset.uiAction = useNpc ? 'review-npc-map' : 'review-quest-map';
      questMapReview.dataset.npcId = useNpc || '';
      questMapReview.dataset.questId = quest.questId;
      const mapLabel = '查看「' + quest.title + '」目標地點 · ' + mapName;
      questMapReview.title = mapLabel;
      questMapReview.setAttribute('aria-label', mapLabel);
    }
    const remainingObjectives = quest?.objectives.filter(({ current, required }) => current < required) ?? [];
    const hasItem = ({ targetId }: TrackedObjective) => view.saveData?.player.bag.some(({ itemId }) => itemId === targetId);
    const itemObjective = quest?.status === 'active'
      ? remainingObjectives.find((objective) => objective.type === 'equip' && hasItem(objective))
        ?? remainingObjectives.find((objective) => objective.type === 'collect' && hasItem(objective))
      : undefined;
    questItemReview.hidden = !itemObjective;
    if (itemObjective) {
      questItemReview.dataset.itemId = itemObjective.targetId;
      const item = targetName(view, itemObjective.targetId, itemObjective.type);
      const category = itemObjective.type === 'equip' ? '裝備' : '道具';
      questItemReviewLabel.data = '查看' + category;
      questItemReview.title = '在背包查看任務' + category + ' ' + item;
      questItemReview.setAttribute('aria-label', questItemReview.title);
    }
    const objectives = remainingObjectives.length ? remainingObjectives : quest?.objectives ?? [];
    const detail = !quest
      ? (worldComplete ? '四區主線已完成；可自由探索並重看冒險手帳。'
        : chapterComplete ? '古礦已重歸寧靜，可繼續自由探索木葉世界。' : '探索世界，尋找新的故事。')
      : quest.status === 'available' && quest.questId === 'q09'
        ? '前往霜雪群島的雪痕海岸找' + giver + '，接續主線'
      : quest.status === 'available' ? '與' + giver + '交談'
      : quest.status === 'ready' ? '任務完成，向' + recipient + '回報'
      : objectives.map((objective) => objectiveText(view, objective)).join(' · ');
    if (collapsed) {
      if (questDetail.hasChildNodes()) questDetail.replaceChildren();
    } else if (quest?.status === 'active' && objectives.length > 0) {
      const rows = objectives.slice(0, 2).map((objective) => makeObjectiveGuideRow(document, view, quest.questId, objective));
      questDetail.replaceChildren(...rows);
      if (objectives.length > rows.length) {
        questDetail.append(makeElement(document, 'span', 'ms-quest-tracker__more', '另有 ' + (objectives.length - rows.length) + ' 項'));
      }
    } else if (quest?.status === 'available' || quest?.status === 'ready') {
      const portrait = questActorPortrait(document, view, npcId ? view.catalog.world.npcs[npcId]?.actorKey : undefined);
      questDetail.replaceChildren(makeQuestGuideRow(document, 'npc', detail, { place, npcState: quest.status, icon: portrait }));
    } else {
      questDetail.textContent = detail;
    }
    const summary = questTrackerSummary(quest, (objective) => targetName(view, objective.targetId, objective.type));
    const firstObjective = quest?.status === 'active' ? remainingObjectives[0] : undefined;
    const npcState = quest?.status === 'available' || quest?.status === 'ready' ? quest.status : undefined;
    const summaryCue = collapsed && (firstObjective || npcState)
      ? questCueStyle(firstObjective ? questObjectiveCue(firstObjective) : 'npc', npcState) : null;
    questSummaryCue.hidden = summaryCue === null;
    if (summaryCue) {
      questSummaryCue.textContent = summaryCue.symbol;
      questSummaryCue.style.color = '#' + summaryCue.color.toString(16);
    }
    questTitle.textContent = title;
    questTarget.textContent = summary.label;
    const counterText = collapsed && npcState === 'ready' ? '可交付' : summary.value;
    if (questCounter.textContent !== counterText) questCounter.textContent = counterText;
    questMeter.hidden = summary.fraction === undefined;
    questMeter.value = summary.fraction ?? 0;
    questTracker.classList.toggle('is-collapsed', collapsed);
    questTracker.classList.toggle('is-ready', quest?.status === 'ready');
    questArrow.textContent = collapsed ? '▸' : '▾';
    questToggle.setAttribute('aria-expanded', String(!collapsed));
    questToggle.setAttribute('aria-label', (collapsed ? '展開' : '收起') + '任務追蹤：' + title + '，' + summary.label + ' ' + summary.value);
    questBody.hidden = collapsed;
    questReview.hidden = !quest;
    const explicitlyTracked = quest !== undefined && quest.questId === trackedQuestId;
    questReview.textContent = explicitlyTracked ? '指定追蹤 · 查看任務 →' : '查看任務 →';
    questReview.dataset.questId = quest?.questId ?? '';
    questTracker.title = (explicitlyTracked ? '指定追蹤｜' : '') + title + '｜' + detail + place;
  };

  const updateInteractionHint = (view: UiSnapshot): void => {
    const canShow = view.screen === 'playing' && view.focusResumeRequired !== true && view.panels.length === 0;
    const hint = canShow
      ? contextHint(view, (action) => effectiveKeyText(view.saveData?.settings.bindings ?? DEFAULT_KEY_BINDINGS, action))
      : null;
    const visible = hint !== null;
    shell.classList.toggle('has-interaction-hint', visible);
    interactionHintRow.hidden = !visible;
    contextPickupKey = hint?.secondaryPickupKey ?? null;
    pickupBagButton.hidden = !hint || view.pickupHint?.targetKey !== hint.targetKey || !view.pickupHint.bagFull;
    const portal = view.interactionHint;
    const questId = hint && portal?.targetKey === hint.targetKey ? portal.blockedQuestId : undefined;
    const gateQuest = questId && view.questViews.find(({ questId: id }) => id === questId);
    portalQuestReview.hidden = !gateQuest;
    if (gateQuest) {
      const state = gateQuest.status === 'available' || gateQuest.status === 'ready' ? gateQuest.status : undefined;
      const { symbol, color } = questCueStyle('npc', state);
      if (portalQuestCue.textContent !== symbol) {
        portalQuestCue.textContent = symbol;
        portalQuestCue.style.color = '#' + color.toString(16);
      }
      const label = '查看通行任務「' + gateQuest.title + '」';
      if (portalQuestReview.title !== label || portalQuestReview.dataset.questId !== gateQuest.questId) {
        portalQuestReview.title = label;
        portalQuestReview.setAttribute('aria-label', label);
        portalQuestReview.dataset.questId = gateQuest.questId;
      }
    }
    if (!hint) {
      contextTargetKey = null;
      if (interactionHintText.textContent !== '') interactionHintText.textContent = '';
      delete interactionHintRow.dataset.targetKey;
      delete interactionHintRow.dataset.iconKey;
      interactionHintRow.removeAttribute('title');
      return;
    }
    const interaction = view.interactionHint?.targetKey === hint.targetKey ? view.interactionHint
      : view.pickupHint?.targetKey === hint.targetKey ? view.pickupHint : null;
    contextTargetKey = interaction && !interaction.blockedMessage ? hint.targetKey : null;
    const text = hint.text;
    const icon = hint.parts.find((part): part is { iconKey: string } => typeof part !== 'string' && 'iconKey' in part);
    const iconKey = icon?.iconKey ?? '';
    if (interactionHintRow.title !== text || (interactionHintRow.dataset.iconKey ?? '') !== iconKey) {
      interactionHintText.replaceChildren(...hint.parts.map((part) => {
        if (typeof part === 'string') return part;
        if ('key' in part) return makeElement(document, 'kbd', '', part.key);
        if ('questStatus' in part) return makeQuestCueBadge(document, 'npc', part.questStatus);
        if ('specialization' in part) {
          const { symbol, color } = npcServiceCueAppearance.specialization;
          const badge = makeElement(document, 'span', 'ms-quest-cue', symbol);
          badge.style.color = '#' + color.toString(16);
          badge.setAttribute('aria-hidden', 'true');
          return badge;
        }
        const image = makeInterfaceIcon(document, view, part.iconKey, '', 'ms-interaction-hint__item');
        image.setAttribute('aria-hidden', 'true');
        return image;
      }));
      interactionHintRow.dataset.iconKey = iconKey;
    }
    interactionHintRow.classList.toggle('is-blocked', Boolean(interaction?.blockedMessage));
    if (interactionHintRow.title !== text) interactionHintRow.title = text;
    const targetKey = hint.targetKey;
    if (interactionHintRow.dataset.targetKey !== targetKey) interactionHintRow.dataset.targetKey = targetKey;
  };

  const updateQuickButtons = (view: UiSnapshot): void => {
    const player = view.saveData?.player;
    const bindings = view.saveData?.settings.bindings ?? DEFAULT_KEY_BINDINGS;
    const playing = view.screen === 'playing';
    const focusBlocked = view.focusResumeRequired === true;
    const quickbarBlock = !playing ? '不可操作' : focusBlocked ? '按「繼續遊戲」恢復'
      : view.panels.includes('settings') ? '設定中' : '';
    const canAct = quickbarBlock === '';
    const showRecoveryCues = canAct && view.panels.length === 0;
    const lowHealth = showRecoveryCues && player && view.stats
      && isLowHealth(player.hp, view.stats.maxHp);
    const stanceBlock = view.combatUi?.stanceBlock;
    const stanceReason = stanceBlock ? { airborne: '需站穩', climbing: '攀爬中', knockback: '受擊硬直' }[stanceBlock] : '';
    let needsMana = false;
    for (const [slotIndex, entry] of quickButtons.entries()) {
      const { slot, button, key, iconHost, label, state, cooldownTrack } = entry;
      const definitionId = slot.id;
      const slotId = player && slotIndex < 4 ? resolveSkillSlot(player, slotIndex as 0|1|2|3) : definitionId;
      const basic = slot.kind === 'attack';
      const trial = slotId === 'rogue-double-stab' && player?.job === 'beginner' && effectiveJob(player) === 'rogue'
        && view.saveData?.location.mapId === 'town' && view.saveData.quests.q02?.status === 'active';
      const rank = player && slot.kind !== 'item' ? (basic || trial ? 1 : playerSkillRank(player, slotId)) : 0;
      const skill = slot.kind === 'item' ? undefined : view.catalog.rules.skills[slotId];
      const iconKey = slot.kind !== 'item' ? combatSlotIconKey(player, view.catalog.rules, slotId) : null;
      const buffUntilMs = skill?.id === 'guardian-rally' ? view.rallyUntilMs : view.guardUntilMs;
      const buffLeftSec = skill?.kind === 'buff' && rank > 0 ? Math.ceil(Math.max(0, (buffUntilMs ?? 0) - view.nowMs) / 1000) : 0;
      const activeDefense = buffLeftSec > 0 ? view.activeGuard?.defenseBonus : undefined;
      const windingUp = canAct && view.combatUi?.windingUpSkillId === slotId;
      const interrupted = canAct && !windingUp && view.combatUi?.interruptedSkillId === slotId;
      const queued = canAct && view.combatUi?.bufferedSkillId === slotId;
      const lacksMana = Boolean(player && skill && rank > 0 && !basic && !trial && player.mp < skill.mpCost);
      needsMana ||= lacksMana;
      const readyAt = slot.kind === 'item' ? view.potionReadyAtMs : view.skillReadyAtMs[slotId] ?? 0;
      const cooldown = Math.max(0, readyAt - view.nowMs);
      const actionLock = Math.max(0, (view.combatUi?.actionLockUntilMs ?? 0) - view.nowMs);
      const skillReady = canAct && slot.kind === 'skill' && rank > 0 && readyAt > 0 && cooldown === 0
        && view.nowMs - readyAt < SKILL_READY_CUE_MS && actionLock === 0
        && buffLeftSec === 0 && !stanceBlock && !lacksMana && !windingUp && !interrupted;
      const healthPotion = slotId === 'small-red';
      const showRecoveryCue = healthPotion ? lowHealth === true : showRecoveryCues && needsMana;
      const full = slot.kind === 'item' && Boolean(player && view.stats
        && (healthPotion ? player.hp >= view.stats.maxHp : player.mp >= view.stats.maxMp));
      // Timers invalidate at the same precision shown on the button.
      const inputs = slot.kind === 'item' ? [
        view.catalog, view.interfaceManifest, quickbarBlock, bindings, player?.bag,
        full, showRecoveryCue, Math.ceil(cooldown / 100),
      ] : rank === 0 ? [
        view.catalog, view.interfaceManifest, quickbarBlock, bindings, slotId, Boolean(player),
        player?.job, player?.level, Boolean(player?.sp),
      ] : [
        view.catalog, view.interfaceManifest, quickbarBlock, bindings, slotId, rank, trial, lacksMana, basic && view.aimReady, iconKey,
        Math.ceil(cooldown / 100),
        Math.ceil(actionLock / 100),
        buffLeftSec, activeDefense, queued, stanceBlock, windingUp, interrupted, skillReady,
      ];
      if (inputs.length === entry.previousInputs.length && inputs.every((value, index) => value === entry.previousInputs[index])) continue;
      entry.previousInputs = inputs;
      const cooldownText = cooldown > 0 ? remainingSeconds(cooldown) : '';
      const binding = effectiveKeyText(bindings, slot.action);
      if (key.title !== binding) {
        key.textContent = binding === '左／右 Ctrl' ? 'Ctrl' : binding;
        key.title = binding;
      }

      if (slot.kind === 'item') {
        const fallbackId = healthPotion ? 'large-red' : 'large-blue';
        const smallCount = player?.bag
          .filter((stack) => stack.itemId === slotId)
          .reduce((sum, stack) => sum + stack.quantity, 0) ?? 0;
        const largeCount = player?.bag
          .filter((stack) => stack.itemId === fallbackId)
          .reduce((sum, stack) => sum + stack.quantity, 0) ?? 0;
        const activeItemId = smallCount > 0 || largeCount === 0 ? slotId : fallbackId;
        const count = activeItemId === slotId ? smallCount : largeCount;
        const item = view.catalog.rules.items[activeItemId];
        const itemName = item?.name ?? activeItemId;
        button.dataset.itemId = activeItemId;
        label.textContent = itemName;
        renderQuickIcon(slotId, iconHost, view, item?.iconKey ?? null, itemName, 'ms-quick-slot__icon-image');

        renderCooldownProgress(cooldownTrack, cooldown, POTION_COOLDOWN_MS);
        const showFull = count > 0 && cooldown === 0 && full;
        const reason = count === 0 ? '沒有藥水'
          : cooldownText ? '冷卻 ' + cooldownText
            : showFull ? (healthPotion ? 'HP 已滿' : 'MP 已滿') : '';
        const displayState = quickbarBlock || reason || ('×' + count);
        const recommend = showRecoveryCue && !reason;
        const recoveryHint = recommend ? (healthPotion ? 'HP 偏低，可補血' : 'MP 不足，可補充 MP') : '';
        button.classList.toggle('is-unavailable', Boolean(reason));
        button.classList.toggle('is-health-recommended', healthPotion && recommend);
        button.classList.toggle('is-mana-recommended', !healthPotion && recommend);
        button.disabled = !canAct || Boolean(reason);
        const compactState = canAct && cooldownText && count > 0 ? cooldownText : displayState;
        state.textContent = canAct && showFull ? '滿 · ×' + count : compactQuickSlotState(compactState);
        const quantity = '數量 ' + count;
        button.title = itemName + '｜' + quantity + (quickbarBlock ? '｜' + quickbarBlock : '')
          + (reason ? '｜' + reason : '') + (recoveryHint ? '｜' + recoveryHint : '');
        button.setAttribute('aria-label', itemName + '，' + quantity + (reason || !canAct ? '，' + displayState : '')
          + (recoveryHint ? '，' + recoveryHint : ''));
        continue;
      }

      button.dataset.skillId = slotId;
      renderQuickIcon(slotId, iconHost, view, iconKey, skill?.name ?? slot.label, 'ms-quick-slot__icon-image', basic ? '普攻' : undefined);
      if (!player || !skill) {
        button.disabled = true;
        cooldownTrack.hidden = true;
        state.textContent = '尚未載入';
        continue;
      }
      label.textContent = skill.name;
      const unlearned = rank === 0;
      const learnable = canAct && unlearned && player.sp > 0
        && previewSkillLearning({ player, rules: view.catalog.rules, skillId: slotId }).ok;
      button.dataset.uiAction = unlearned ? 'review-skill' : 'attack';
      button.classList.toggle('is-unlearned', unlearned);
      button.classList.toggle('is-skill-learnable', learnable);
      renderCooldownProgress(cooldownTrack, unlearned ? 0 : cooldown, skillCooldownMs(skill, rank));
      const castBlock = unlearned ? (learnable ? '可學習' : '未學習') : stanceReason || (lacksMana ? 'MP 不足' : '');
      const reason = castBlock || (cooldownText ? '冷卻 ' + cooldownText : '');
      const castFeedback = windingUp ? '施放中' : interrupted ? '已中斷' : skillReady ? '就緒' : '';
      const displayState = quickbarBlock || castFeedback
        || (buffLeftSec > 0 ? buffLeftSec + ' 秒'
          : reason || (queued ? '已排隊'
            : actionLock > 0 ? '動作中 ' + remainingSeconds(actionLock)
              : basic ? 'MP 0' : '等級 ' + rank + '・MP ' + skill.mpCost));
      button.classList.toggle('is-unavailable', !canAct || (Boolean(reason) && buffLeftSec === 0));
      button.classList.toggle('has-action-feedback', Boolean(castFeedback) || (canAct && !reason && buffLeftSec === 0 && (queued || actionLock > 0)));
      button.classList.toggle('is-action-queued', queued);
      button.classList.toggle('is-winding-up', windingUp);
      button.classList.toggle('is-cast-interrupted', interrupted);
      button.classList.toggle('is-skill-ready', skillReady);
      // A click may still buffer a basic attack during a short cooldown.
      button.disabled = !canAct || (!unlearned && Boolean(basic ? stanceReason : reason));
      const showAim = canAct && view.aimReady === true && basic && !stanceReason;
      const compactState = canAct && !castBlock && !castFeedback && buffLeftSec === 0 && cooldownText ? cooldownText : displayState;
      state.textContent = compactQuickSlotState(castFeedback || (trial && canAct && !reason ? '試煉・MP 0' : showAim ? '瞄準就緒' : compactState));
      button.classList.toggle('is-buff-active', showAim || buffLeftSec > 0);
      button.title = basic ? skill.name + '：MP 0'
        : skill.name + '｜' + skillDetails(skill, rank);
      if (buffLeftSec > 0) button.title += '｜效果剩餘 ' + buffLeftSec + ' 秒';
      if (activeDefense) button.title += '｜目前防禦加成 +' + activeDefense;
      if (castFeedback) button.title += '｜' + castFeedback;
      if (reason) button.title += '｜' + reason;
      if (queued) button.title += '｜已排隊';
      else if (!reason && actionLock > 0 && canAct && buffLeftSec === 0) button.title += '｜動作中 ' + remainingSeconds(actionLock);
      if (quickbarBlock) button.title += '｜' + quickbarBlock;
      const reviewLabel = unlearned && canAct ? '開啟技能詳情' : '';
      if (reviewLabel) button.title += '｜' + reviewLabel;
      const queueState = queued && displayState !== '已排隊' ? '，已排隊' : '';
      button.setAttribute('aria-label', skill.name + ' ' + displayState + queueState + (reviewLabel ? ' ' + reviewLabel : ''));
    }

    pauseButton.hidden = !playing;
    pauseButton.disabled = !playing || focusBlocked;
    const atTown = player !== undefined && view.saveData?.location.mapId === 'town';
    returnTownButton.hidden = !player || atTown || !playing || !view.saveData?.visitedMaps.includes('town');
    returnTownButton.disabled = !view.canReturnTown || focusBlocked;
    returnTownButton.title = view.canReturnTown
      ? '立即返回木葉鎮'
      : view.saveData?.location.mapId === 'guardian-arena'
        ? '首領戰尚未結束，暫時不能返回城鎮。'
        : '目前狀態不允許回城。';
    const mapPanelButton = panelButtons.get('map');
    if (mapPanelButton) mapPanelButton.disabled = !player;
    const dialogueButton = panelButtons.get('dialogue');
    if (dialogueButton) {
      dialogueButton.disabled = !view.interaction;
      dialogueButton.hidden = !view.interaction;
    }
    const shopButton = panelButtons.get('shop');
    if (shopButton) {
      shopButton.disabled = !view.canTrade;
      shopButton.hidden = shopButton.disabled;
    }
    actionBar.hidden = ![returnTownButton, dialogueButton, shopButton].some((button) => button && !button.hidden);
    updateInteractionHint(view);
  };

  const renderScreen = (view: UiSnapshot): void => {
    const showCreate = createRequested || view.screen === 'create';
    const showTitle = view.screen === 'title' && !view.error && !showCreate;
    const quietPlaying = view.screen === 'playing' && !showCreate && !view.characterBusy
      && view.saveStatus !== 'conflict' && view.saveStatus !== 'localConflict'
      && !view.mapVisualLoad && !view.saveUpgrade && view.focusResumeRequired !== true;
    const signature = quietPlaying ? 'playing' : JSON.stringify({
      screen: view.screen,
      error: view.error,
      saveStatus: view.saveStatus,
      saveUpgrade: view.saveUpgrade ?? null,
      focusResumeRequired: view.focusResumeRequired ?? false,
      mapVisualLoad: view.mapVisualLoad ? { mapId: view.mapVisualLoad.mapId, name: view.mapVisualLoad.name,
        status: view.mapVisualLoad.status, message: view.mapVisualLoad.message } : null,
      hasSave: view.saveData !== null,
      profile: showTitle ? view.profile : undefined,
      characterBusy: view.characterBusy,
      canReturnTown: view.canReturnTown,
      createRequested,
      plannedJobDraft,
      slotDraft,
      discardConfirmed,
      saveMessage: view.saveMessage,
      legacyImportAvailable: view.legacyImportAvailable,
      legacyImportMessage: view.legacyImportMessage,
      nameDraft,
    });
    if (signature === lastScreenSignature) return;
    lastScreenSignature = signature;
    preserveFocus(screenLayer, () => {
      const specializationPreviewOpen = showCreate
        && screenLayer.querySelector<HTMLDetailsElement>('.ms-route-specializations')?.open === true;
      screenLayer.hidden = true;
      screenLayer.replaceChildren();

      if (view.characterBusy) {
        screenLayer.hidden = false;
        screenLayer.append(makeScreenCard(document, '正在保存角色進度', '保存完成後繼續，請稍候。'));
        return;
      }
      if (view.saveStatus === 'conflict') {
        const card = makeScreenCard(document, '進度版本衝突', '另一個裝置已有較新的雲端進度。請載入雲端版本後再繼續。');
        card.append(makeButton(document, '載入雲端版本', 'use-cloud-version', {
          className: 'ms-button ms-button--primary',
        }));
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.saveStatus === 'localConflict') {
        const card = makeScreenCard(document, '本機進度已在其他分頁更新', '這個分頁的進度已經過期，尚未保存的變更會放棄。請重新載入本機進度後再繼續。');
        card.append(makeButton(document, '重新載入本機進度', 'retry-save', {
          className: 'ms-button ms-button--primary',
        }));
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'loading' && !view.mapVisualLoad) {
        screenLayer.hidden = false;
        screenLayer.append(makeScreenCard(document, '正在準備冒險', '載入世界資料與存檔狀態。'));
        return;
      }
      if (view.mapVisualLoad) {
        const load = view.mapVisualLoad;
        const failed = load.status === 'failed';
        const card = makeScreenCard(document, failed ? '地圖未能載入' : '正在前往' + load.name,
          failed ? '地圖素材未能載入。請檢查連線後重試，冒險進度仍保留。' : '正在準備地圖；完成前冒險會安全暫停。');
        if (failed) {
          card.append(makeButton(document, '重試地圖載入', 'retry-map-load', { className: 'ms-button ms-button--primary' }),
            makeButton(document, '返回標題', 'return-title', { className: 'ms-button ms-button--secondary' }));
          if (load.message) {
            const details = makeElement(document, 'details', 'ms-screen-card__details');
            details.append(makeElement(document, 'summary', '', '技術細節'), makeElement(document, 'code', '', load.message));
            card.append(details);
          }
        } else {
          const progressHost = makeElement(document, 'div', 'ms-map-load-progress');
          progressHost.setAttribute('aria-live', 'off');
          const progress = makeElement(document, 'progress');
          progress.setAttribute('aria-label', '地圖素材載入進度');
          progressHost.append(progress, makeElement(document, 'p', 'ms-map-load-progress__label'));
          card.append(progressHost);
        }
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.saveUpgrade) {
        createRequested = false;
        const prompt = saveUpgradePrompt(view.saveUpgrade);
        const card = makeScreenCard(document, prompt.title, prompt.explanation);
        card.append(makeElement(document, 'p', 'ms-screen-card__status', '存檔狀態：' + statusLabel(view.saveStatus)));
        if (view.saveData) {
          const saved = view.saveData.player;
          const savedMapId = savedProgressDisplayMapId(view.saveData.location.mapId);
          const place = view.catalog.world.maps[savedMapId]?.name;
          card.append(makeElement(document, 'p', 'ms-screen-card__save',
            '待確認進度：' + saved.name + '・Lv.' + saved.level + ' ' + jobLabel(saved.job) + (place ? '・' + place : '')));
        }
        if (view.saveMessage) card.append(makeElement(document, 'p', 'ms-warning', view.saveMessage));
        card.append(
          makeButton(document, prompt.confirmLabel, 'confirm-save-upgrade', {
            className: 'ms-button ms-button--primary',
          }),
          makeButton(document, prompt.temporaryLabel, 'play-temporary', {
            className: 'ms-button ms-button--secondary',
          }),
        );
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (showTitle || showCreate) {
      if (showCreate) {
        const card = makeScreenCard(document, '建立角色', '在空欄位開始新的冒險。既有角色進度會保留；先選訓練路線，Lv.10 完成試煉後正式轉職。');
        card.classList.add('ms-screen-card--create');
        const content = makeElement(document, 'div', 'ms-create-content');
        content.append(...card.children);
        const checkedName = validatePlayerName(nameDraft);
        const nameInput = captureNameInput(checkedName);
        const nameFeedback = makeElement(document, 'p');
        nameFeedback.id = nameFeedbackId;
        presentNameFeedback(nameInput, nameFeedback, checkedName);
        content.append(nameInput, nameFeedback);
        const routes = makeElement(document, 'div', 'ms-character-routes');
        routes.setAttribute('aria-label', '訓練路線');
        for (const route of ['swordsman', 'archer', 'mage', 'rogue'] as const) {
          const button = makeButton(document, jobs[route].name + '訓練', 'choose-route', {
            data: { job: route }, className: 'ms-button ' + (route === plannedJobDraft ? 'ms-button--primary' : 'ms-button--secondary'),
          });
          button.dataset.focus = 'choose-route-' + route;
          button.setAttribute('aria-pressed', String(route === plannedJobDraft));
          button.append(makeInterfaceIcon(document,view,route === 'swordsman' ? 'skill:heavy-strike' : 'skill:' + jobs[route].basicSkill,jobs[route].name,'ms-route-icon'));
          routes.append(button);
        }
        content.append(routes);
        const route = jobs[plannedJobDraft];
        const weapon = view.catalog.rules.items[route.starterWeapon];
        const firstSkill = view.catalog.rules.skills[route.skillSlots[0]];
        if (weapon && firstSkill) {
          const loadout = makeElement(document, 'div', 'ms-route-loadout');
          for (const { iconKey, label, name } of [
            { iconKey: weapon.iconKey, label: '起始武器', name: weapon.name },
            { iconKey: 'skill:' + firstSkill.id, label: '轉職後可學', name: firstSkill.name },
          ]) {
            const entry = makeElement(document, 'div', 'ms-route-loadout__entry');
            const description = makeElement(document, 'div', 'ms-route-loadout__text');
            description.append(makeElement(document, 'small', '', label), makeElement(document, 'strong', '', name));
            entry.append(makeInterfaceIcon(document, view, iconKey, '', 'ms-route-preview-icon'), description);
            loadout.append(entry);
          }
          content.append(loadout);
        }
        content.append(makeElement(document, 'p', 'ms-screen-card__save', plannedJobDraft === 'rogue'
          ? '短刃起步，敏捷為主、力量為輔。近身連刺、影步切入與煙幕撤離；沒有無敵，注意敵人預警。'
          : plannedJobDraft === 'mage'
          ? '魔杖起步，智力為主、敏捷為輔。站定施法、冰霜控場並保留MP閃現；零MP魔杖彈可持續冒險。'
          : plannedJobDraft === 'archer'
          ? '短弓起步，敏捷為主、力量為輔。角色擁有獨立背包、任務與探索進度。'
          : '短劍起步，力量為主、敏捷為輔。角色擁有獨立背包、任務與探索進度。'));
        const preview = makeElement(document, 'details', 'ms-screen-card__details ms-route-specializations');
        preview.open = specializationPreviewOpen;
        const previewSummary = makeElement(document, 'summary', undefined, 'Lv.20 二轉分支');
        previewSummary.dataset.focus = 'route-specializations';
        const branches = makeElement(document, 'ul');
        for (const branch of Object.values(specializations)) {
          if (branch.job !== plannedJobDraft) continue;
          const item = makeElement(document, 'li');
          const description = makeElement(document, 'div', 'ms-route-specializations__text');
          description.append(makeElement(document, 'strong', undefined, branch.name), makeElement(document, 'span', '', branch.description));
          item.append(makeInterfaceIcon(document, view, 'skill:' + branch.skill, '', 'ms-route-preview-icon'), description);
          branches.append(item);
        }
        preview.append(previewSummary, branches);
        content.append(preview);
        const actions = makeElement(document, 'div', 'ms-create-actions');
        const confirmButton = makeButton(document, '確認建立角色', 'create-confirm', {
          className: 'ms-button ms-button--primary', disabled: !checkedName.ok,
          title: checkedName.ok ? '' : checkedName.message,
        });
        confirmButton.dataset.focus = 'create-confirm';
        actions.append(confirmButton, makeButton(document, '取消', 'create-cancel', { className: 'ms-button ms-button--secondary' }));
        card.append(content, actions);
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
        const card = makeScreenCard(document, 'Brightwood: First Oath', '森林的怪物躁動不安，古礦深處似乎有東西正在甦醒。\n從晨光營地出發，立下你的第一個誓約。');
        const status = makeElement(document, 'p', 'ms-screen-card__status', '存檔狀態：' + statusLabel(view.saveStatus));
        card.append(status);
        card.append(buildReadingChoices(document, readingPreference.size));
        if (view.saveStatus === 'loadError') {
          card.append(
            makeElement(document, 'p', 'ms-warning', (view.saveMessage ? view.saveMessage + ' ' : '') + '請重試讀取；若存檔已無法修復，可另存備份後重新開始，或選擇不寫入正式存檔的暫時遊玩。'),
            makeButton(document, '重試讀取存檔', 'retry-save', { className: 'ms-button ms-button--primary' }),
            makeButton(document, discardConfirmed ? '再按一次確認：備份並重新開始' : '備份損毀存檔並重新開始', 'discard-save', { className: 'ms-button ms-button--secondary' }),
            makeButton(document, '暫時遊玩', 'play-temporary', { className: 'ms-button ms-button--secondary' }),
          );
        } else if (view.saveStatus === 'incompatible') {
          card.append(
            makeElement(document, 'p', 'ms-warning', view.saveMessage ?? '此版本不能讀取目前存檔。原始資料已保留。'),
            makeButton(document, '暫時遊玩', 'play-temporary', { className: 'ms-button ms-button--secondary' }),
          );
        } else if (view.saveData) {
          // Say whose adventure 繼續冒險 resumes before the player picks it over 建立新角色.
          const saved = view.saveData.player;
          // Only Guardian arena saves resume at the mine entrance; other boss maps resume in place.
          const savedMapId = savedProgressDisplayMapId(view.saveData.location.mapId);
          const place = view.catalog?.world.maps[savedMapId]?.name;
          card.append(makeElement(document, 'p', 'ms-screen-card__save',
            '上次進度：' + saved.name + '・Lv.' + saved.level + ' ' + jobLabel(saved.job) + (place ? '・' + place : '')));
          card.append(
            makeButton(document, '繼續冒險', 'continue', { className: 'ms-button ms-button--primary' }),
            makeButton(document, '建立新角色', 'new-role', { className: 'ms-button ms-button--secondary',
              disabled: view.profile?.slots.every(({ characterId }) => characterId !== null) }),
          );
        } else {
          card.append(makeButton(document, '建立角色', 'new-role', { className: 'ms-button ms-button--primary' }));
          card.append(makeButton(document, '暫時遊玩', 'play-temporary', { className: 'ms-button ms-button--secondary' }));
        }
        if (view.profile && ['ready', 'saved', 'localSaved', 'previewOnly', 'saving', 'saveError', 'unavailable'].includes(view.saveStatus)) {
          const slots = makeElement(document, 'div', 'ms-character-slots');
          slots.setAttribute('aria-label', '角色欄位');
          for (const [index, slot] of view.profile.slots.entries()) {
            const character = slot.characterId ? view.profile.characters[slot.characterId] : null;
            if (character) {
              const place = view.catalog.world.maps[character.location.mapId]?.name ?? '';
              slots.append(makeButton(document, (slot.characterId === view.profile.activeCharacterId ? '目前｜' : '')
                + character.player.name + '・Lv.' + character.player.level + ' ' + playerClassLabel(character.player)
                + '・' + place + '｜選擇並繼續', 'select-character', {
                  data: { characterId: character.characterId }, disabled: view.saveStatus === 'saving' || view.saveStatus === 'saveError',
                  className: 'ms-button ms-character-slot',
                }));
            } else {
              slots.append(makeButton(document, '空欄位 ' + (index + 1) + '・建立角色', 'new-role', {
                data: { slotId: slot.slotId }, className: 'ms-button ms-character-slot',
                disabled: view.saveStatus === 'saving' || view.saveStatus === 'saveError',
              }));
            }
          }
          card.append(slots);
          card.append(buildRosterManager(document, view, dispatchDraft));
        }
        if (view.legacyImportAvailable) {
          card.append(
            makeElement(document, 'p', 'ms-screen-card__save', view.legacyImportMessage ?? '找到這台裝置保留的舊版進度。'),
            makeButton(document, '匯入舊版進度', 'import-legacy-save', { className: 'ms-button ms-button--secondary' }),
            makeButton(document, '暫不匯入', 'dismiss-legacy-import', { className: 'ms-button ms-button--secondary' }),
          );
        } else if (view.legacyImportMessage) {
          card.append(makeElement(document, 'p', 'ms-screen-card__save', view.legacyImportMessage));
        }
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'paused') {
        const focusResume = view.focusResumeRequired === true;
        const card = makeScreenCard(document,
          focusResume ? '畫面已安全暫停' : '冒險已暫停',
          focusResume
            ? '畫面曾離開遊戲，冒險已安全暫停。按「繼續遊戲」恢復冒險。'
            : '怪物與時間都已停止。按「繼續遊戲」回到冒險。');
        if (focusResume) card.classList.add('ms-screen-card--focus-resume');
        const continueButton = makeButton(document, '繼續遊戲', 'toggle-pause', { className: 'ms-button ms-button--primary' });
        continueButton.dataset.focus = 'focus-resume';
        card.append(
          continueButton,
          makeButton(document, '返回標題', 'return-title', { className: 'ms-button ms-button--secondary' }),
        );
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'dead') {
        // Mirrors the respawn rule in gameplay: town once visited, otherwise the starting camp.
        const safeMapId = view.saveData?.visitedMaps.includes('town') ? 'town' : 'camp';
        const safeMapName = view.catalog.world.maps[safeMapId]?.name ?? '安全地點';
        const card = makeScreenCard(document, '角色倒下了', '你將在' + safeMapName + '醒來，HP 與 MP 全滿；任務進度、背包與金幣都會保留。');
        card.append(
          makeButton(document, '返回' + safeMapName, 'respawn', { className: 'ms-button ms-button--primary' }),
          makeButton(document, '返回標題', 'return-title', { className: 'ms-button ms-button--secondary' }),
        );
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'chapter' && view.saveData) {
        const player = view.saveData.player;
        const questIds = Object.keys(view.catalog.world.quests);
        const firstChapterClaimed = questIds.filter((id) => /^q0[1-8]$/.test(id)
          && view.saveData!.quests[id]?.status === 'claimed').length;
        const card = makeScreenCard(document, '第一章「守衛的誓約」完成', '古礦守衛已被擊敗，守衛核心已交付，q08 獎勵也已手動領取。接續主線時，從赤岩山徑向東穿過古礦入口回到守衛祭壇，再走東側航路前往雪痕海岸找雪芽。');
        const summary = makeElement(document, 'ul', 'ms-help-list');
        for (const line of [
          '角色：' + player.name + '・Lv.' + player.level + '・' + playerClassLabel(player),
          '第一章主線：' + firstChapterClaimed + ' / 8 項已領獎',
          '持有金幣：' + formatNumber(player.coins),
        ]) summary.append(makeElement(document, 'li', '', line));
        card.append(summary);
        card.append(makeButton(document, '繼續冒險', 'continue', { className: 'ms-button ms-button--primary' }));
        card.append(makeButton(document, '返回標題', 'return-title', { className: 'ms-button ms-button--secondary' }));
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'result') {
        const bellResult = view.saveData?.location.mapId === 'ruins-bell-sanctum';
        const frostResult = view.saveData?.location.mapId === 'frost-tide-cavern';
        const sunwellResult = view.saveData?.location.mapId === 'sand-sunwell-altar';
        const title = bellResult ? '誓鐘已恢復寧靜！'
          : frostResult ? '冰潮守望獸已被擊敗！'
          : sunwellResult ? '日井守衛已被擊敗！'
            : '古礦守衛已被擊敗！';
        const guardianQuestStatus = view.questViews.find(({ questId }) => questId === 'q08')?.status;
        const body = bellResult
          ? '失序司鐘者已倒下。返回潮痕營站向芷衡回報委託，或再次挑戰司鐘者。'
          : frostResult
          ? '守望獸已沉入冰潮深處。返回雪痕海岸向雪芽回報，並可再次進入洞窟挑戰。'
          : sunwellResult
            ? '日井祭壇暫時歸於平靜。返回日井盆地後沿西路回琉砂手動領取日井誓刃與金幣，祭壇仍可再次挑戰。'
            : guardianQuestStatus === 'active' || guardianQuestStatus === 'ready'
              ? '守衛核心已收入背包；這次勝利只完成戰鬥。請回赤岩山徑找礦道守望者交付核心並手動領取 q08 獎勵，第一章才會完成。'
              : guardianQuestStatus === 'available'
                ? '守衛核心已收入背包；q08 必須在任務進行時擊敗守衛才會累計。請先回赤岩山徑向礦道守望者接取 q08，再重返祭壇完成委託並手動領獎。'
                : guardianQuestStatus === 'claimed'
                  ? '守衛核心已收入背包；q08 獎勵已領取，第一章已完成。祭壇仍可再次挑戰。'
                  : '守衛核心已收入背包；請回赤岩山徑找礦道守望者查看 q08 前置與接取狀態，完成委託後再手動領獎。';
        const returnLabel = bellResult ? '返回潮痕營站' : frostResult ? '返回雪痕海岸' : sunwellResult ? '返回日井盆地' : '返回城鎮';
        const retryLabel = bellResult ? '再次挑戰司鐘者' : frostResult ? '再次挑戰守望獸' : sunwellResult ? '再次挑戰日井守衛' : '再次挑戰守衛';
        const card = makeScreenCard(document, title, body);
        card.append(makeButton(document, returnLabel, 'return-town', {
          className: 'ms-button ms-button--primary',
          disabled: !view.canReturnTown,
          title: view.canReturnTown ? returnLabel : '首領戰尚未結束，暫時不能返回。',
        }));
        card.append(makeButton(document, retryLabel, 'retry-boss', { className: 'ms-button ms-button--secondary' }));
        card.append(makeButton(document, '返回標題', 'return-title', { className: 'ms-button ms-button--secondary' }));
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'error' || (view.screen === 'title' && view.error)) {
        // The raw loader error ("GET … failed: Failed to fetch") means nothing to a player; lead with what
        // to do and keep the technical line folded away for bug reports.
        const card = makeScreenCard(document, '冒險無法開始', '有些遊戲檔案沒有下載成功，通常是網路暫時不穩。請重新載入頁面再試一次。');
        if (view.error) {
          const details = makeElement(document, 'details', 'ms-screen-card__details');
          details.append(makeElement(document, 'summary', '', '技術細節'), makeElement(document, 'code', '', view.error));
          card.append(details);
        }
        card.append(makeButton(document, '重新載入', 'reload-page', { className: 'ms-button ms-button--primary' }));
        card.append(makeButton(document, '返回標題', 'return-title', { className: 'ms-button ms-button--secondary' }));
        screenLayer.hidden = false;
        screenLayer.append(card);
      }
      if (view.screen === 'playing' && view.focusResumeRequired === true) {
        const card = makeScreenCard(document, '畫面已安全暫停', '畫面曾離開遊戲，冒險已安全暫停。按「繼續遊戲」恢復冒險。');
        card.classList.add('ms-screen-card--focus-resume');
        const continueButton = makeButton(document, '繼續遊戲', 'toggle-pause', { className: 'ms-button ms-button--primary' });
        continueButton.dataset.focus = 'focus-resume';
        card.append(
          continueButton,
          makeButton(document, '返回標題', 'return-title', { className: 'ms-button ms-button--secondary' }),
        );
        screenLayer.hidden = false;
        screenLayer.append(card);
      }
    });
    if (view.saveStatus === 'saveError') {
      const returnButton = screenLayer.querySelector('[data-ui-action="return-title"]');
      returnButton?.before(
        makeElement(document, 'p', 'ms-warning', view.saveMessage || '角色進度尚未保存。'),
        makeButton(document, '重試保存', 'retry-save', { className: 'ms-button ms-button--primary' }),
      );
    }
    modalFocus.sync();
  };

  const renderFooter = (view: UiSnapshot): void => {
    const hideFocusBanner = view.windowFocused !== false || view.screen !== 'playing';
    if (focusBanner.hidden !== hideFocusBanner) focusBanner.hidden = hideFocusBanner;
    const error = view.error ?? '';
    if (errorText.textContent !== error) errorText.textContent = error;
    const retryInDialog = view.saveStatus === 'saveError' && !screenLayer.hidden
      && screenLayer.querySelector('[data-ui-action="retry-save"]') !== null;
    // Keep recovery actions available without a permanent save badge occupying the HUD.
    const hideFooter = retryInDialog
      || (!view.error && !['loadError', 'saveError', 'conflict', 'localConflict'].includes(view.saveStatus));
    if (footer.hidden !== hideFooter) footer.hidden = hideFooter;
    const toastText = view.toast ?? '';
    const hideToast = retryInDialog || !toastText;
    if (toast.textContent !== toastText) toast.textContent = toastText;
    if (toast.hidden !== hideToast) toast.hidden = hideToast;
    // An open panel fills the middle of the screen; lift the toast above it so it never covers panel rows.
    toast.classList.toggle('ms-toast--top', view.panels.length > 0);
    if (lastFooterActionStatus === view.saveStatus) return;
    lastFooterActionStatus = view.saveStatus;
    footerActions.replaceChildren();
    if (view.saveStatus === 'loadError') {
      footerActions.append(
        makeButton(document, '重試讀取', 'retry-save', { className: 'ms-button ms-button--small' }),
        makeButton(document, '暫時遊玩', 'play-temporary', { className: 'ms-button ms-button--small' }),
      );
    } else if (view.saveStatus === 'saveError') {
      footerActions.append(makeButton(document, '重試保存', 'retry-save', { className: 'ms-button ms-button--small' }));
    } else if (view.saveStatus === 'conflict') {
      footerActions.append(makeButton(document, '載入雲端版本', 'use-cloud-version', { className: 'ms-button ms-button--small' }));
    } else if (view.saveStatus === 'localConflict') {
      footerActions.append(makeButton(document, '重新載入本機進度', 'retry-save', { className: 'ms-button ms-button--small' }));
    }
  };

  const focusGameCanvas = (button?: HTMLButtonElement): void => {
    const document = shell.ownerDocument;
    const canvas = document.querySelector<HTMLCanvasElement>('#game-root canvas');
    if (!document.hasFocus() || !canvas || canvas.closest('[inert]')) return;
    button?.blur();
    const active = document.activeElement;
    if (active instanceof HTMLElement && shell.contains(active)) active.blur();
    if (canvas.tabIndex < 0) canvas.tabIndex = 0;
    canvas.focus({ preventScroll: true });
  };

  const reconcilePanelBag = (view: UiSnapshot, panel: PanelId | null, force: boolean): boolean => {
    const previousBag = lastReconciledBag;
    const nextBag = view.saveData?.player.bag ?? emptyBag;
    if (previousBag === nextBag && !force) return false;
    const activeBeforeReconciliation = document.activeElement;
    const activeBagControl = activeBeforeReconciliation instanceof HTMLElement
      && panelHost.contains(activeBeforeReconciliation)
      && isBagIndexedControl(activeBeforeReconciliation);
    const hadBagFocusSnapshot = bagFocusIndex(lastPanelFocus?.focusKey) !== null
      || bagFocusIndex(panelFocusBeforeResume?.focusKey) !== null
      || bagHeadingRestorePending;
    const reconciliation = reconcileBagViewState(previousBag, nextBag, selectedBagIndex, sellQuantities);
    selectedBagIndex = reconciliation.selectedBagIndex;
    sellQuantities = reconciliation.sellQuantities;
    lastReconciledBag = nextBag;
    const bagPanel = panel === 'inventory' || panel === 'shop';
    const bagStructureChanged = reconciliation.structureChanged;
    if (bagStructureChanged) {
      bagStateMessage = reconciliation.hadAffectedState ? '請重新選取物品' : '';
      lastPanelFocus = clearBagFocus(lastPanelFocus);
      panelFocusBeforeResume = clearBagFocus(panelFocusBeforeResume);
      bagHeadingRestorePending = bagPanel
        && (view.focusResumeRequired === true || restoreFocusAfterResume)
        && (hadBagFocusSnapshot || activeBagControl);
    } else {
      const reducedQuantities = new Set<number>();
      for (let index = 0; index < previousBag.length; index += 1) {
        const before = previousBag[index]!;
        const after = nextBag[index];
        if (after && before.itemId === after.itemId && after.quantity < before.quantity) reducedQuantities.add(index);
      }
      if (reducedQuantities.size > 0) {
        lastPanelFocus = clearOverflowingSellValue(lastPanelFocus, nextBag, reducedQuantities);
        panelFocusBeforeResume = clearOverflowingSellValue(panelFocusBeforeResume, nextBag, reducedQuantities);
        if (activeBeforeReconciliation instanceof HTMLInputElement
          && activeBeforeReconciliation.dataset.sellQuantity !== undefined) {
          const bagIndex = Number(activeBeforeReconciliation.dataset.sellQuantity);
          const max = nextBag[bagIndex]?.quantity;
          if (max !== undefined && reducedQuantities.has(bagIndex)
            && Number(activeBeforeReconciliation.value) > max) {
            const clamped = sellQuantities.get(bagIndex) ?? clampInteger(Number(activeBeforeReconciliation.value), 1, max);
            activeBeforeReconciliation.value = String(clampInteger(clamped, 1, max));
          }
        }
      }
    }
    return bagStructureChanged && bagPanel && activeBagControl;
  };

  const renderPanel = (view: UiSnapshot, force = false): void => {
    const panel = view.panels.at(-1) ?? null;
    const skipBagFocusPreservation = reconcilePanelBag(view, panel, force);
    const focusStableBagHeading = skipBagFocusPreservation
      && view.focusResumeRequired !== true && !restoreFocusAfterResume;
    if (focusStableBagHeading) bagHeadingRestorePending = false;
    // Leaving settings mid-rebind used to keep 「按鍵中…」 armed (and old feedback) for the next visit.
    if (panel !== 'settings' && (pendingBinding !== null || bindingMessage !== '')) {
      pendingBinding = null;
      bindingMessage = '';
      bindingMessageAction = null;
    }
    panelHost.hidden = panel === null;
    panelHost.classList.toggle('is-world-map', panel === 'map');
    panelHost.classList.toggle('is-illustrated-panel', panel === 'stats' || panel === 'quests');
    if (!view.panels.includes('quests')) selectedQuestId = null;
    if (!view.panels.includes('map')) {
      selectedMapId = null;
      selectedMapFocus = null;
      pendingMapReview = false;
    }
    if (questMapReturn && !view.panels.includes(questMapReturn.panel)) questMapReturn = null;
    if (!panel) {
      if (lastPanelSignature !== '') {
        lastPanelSignature = '';
        lastPanelSources = null;
        panelHost.replaceChildren();
          if (view.screen === 'playing' && view.focusResumeRequired !== true) focusGameCanvas();
      }
      return;
    }
    const inventory = panel === 'inventory';
    const shop = panel === 'shop';
    const trackedQuestId = questTrackerState.trackedQuestId;
    const inventoryQuest = inventory ? selectTrackerQuest(view.questViews, trackedQuestId) : undefined;
    const data = inventory || shop ? view.saveData?.player : view.saveData;
    const quests = inventory || shop ? undefined : view.questViews;
    const interaction = inventory || shop ? undefined : view.interaction;
    const previousSources = lastPanelSources;
    // Gameplay replaces these branches when they change. Serialize only after a reference changes.
    let sources = previousSources;
    if (force || !sources || sources.panel !== panel || sources.data !== data
      || sources.quests !== quests || sources.interaction !== interaction) {
      let details: unknown = data;
      if (shop && view.saveData) {
        const { coins, bag, equipment, job, plannedJob, level } = view.saveData.player;
        details = { coins, bag, equipment, job, plannedJob, level };
      } else if (inventory && view.saveData) {
        const player = view.saveData.player;
        const selected = player.bag[selectedBagIndex ?? -1];
        // Current HP and MP are only shown in the selected consumable's use preview.
        if (!selected || view.catalog.rules.items[selected.itemId]?.kind !== 'consumable') {
          const { hp, mp, ...inventoryPlayer } = player;
          details = inventoryPlayer;
        }
      } else if (view.saveData && (panel === 'map' || panel === 'quests')) {
        const { hp, mp, ...progress } = view.saveData.player;
        details = { ...view.saveData, player: progress };
      }
      sources = { panel, data, quests, interaction, signature: JSON.stringify({ data: details, quests, interaction }) };
    }
    lastPanelSources = sources;
    const signature = JSON.stringify({
      panel,
      interfaceReady: Boolean(view.interfaceManifest),
      actorsReady: panel === 'map' && Boolean(view.actorManifest),
      inventoryQuestId: inventoryQuest?.questId,
      inventoryQuestStatus: inventoryQuest?.status,
      canTrade: (inventory || shop) && view.canTrade,
      nearSpecializationMentor: (panel === 'skills' || panel === 'dialogue') && view.nearSpecializationMentor === true,
      canReturnTown: view.canReturnTown,
      selectedBagIndex,
      selectedMapId,
      selectedMapFocus,
      selectedQuestId,
      trackedQuestId,
      inventoryFilter,
      readingSize: readingPreference.size,
      holdBasicAttack: view.holdBasicAttack ?? false,
      backgroundMotion: view.backgroundMotion ?? true,
      activeGuardBonus: panel === 'stats' ? view.activeGuard?.defenseBonus ?? 0 : 0,
      shopFilter,
      potionCooling: inventory && view.nowMs < view.potionReadyAtMs,
      shopQuantities: Array.from(shopQuantities.entries()),
      sellQuantities: Array.from(sellQuantities.entries()),
      bagStateMessage,
      pendingBinding,
      bindingMessage,
      bindingMessageAction,
    });
    if (!force && signature === lastPanelSignature && sources.signature === previousSources?.signature) return;
    lastPanelSignature = signature;
    const samePanel = panelHost.querySelector<HTMLElement>('.ms-panel')?.dataset.panel === panel;
    const previousFocus = document.activeElement;
    const previouslyFocusedDialogueControl = panel === 'dialogue' && samePanel
      && previousFocus instanceof HTMLElement && panelHost.contains(previousFocus)
      ? previousFocus.dataset.focus
      : undefined;
    const scrollTop = samePanel ? panelHost.querySelector<HTMLElement>('.ms-panel__body')?.scrollTop ?? 0 : 0;
    const openDetails = new Set(samePanel
      ? Array.from(panelHost.querySelectorAll<HTMLDetailsElement>('details[open][data-detail-id]')).map((detail) => detail.dataset.detailId)
      : []);
    const buildPanel = (): void => {
      const card = makeElement(document, 'section', 'ms-panel');
      card.setAttribute('aria-label', PANEL_LABELS[panel]);
      card.dataset.panel = panel;
      const heading = makeElement(document, 'header', 'ms-panel__header');
      const title = makeElement(document, 'div', 'ms-panel__title');
      title.append(makeElement(document, 'h2', '', PANEL_LABELS[panel]), panelWarning);
      if (panel === 'inventory' || panel === 'shop') {
        const headingTitle = title.querySelector<HTMLElement>('h2');
        if (headingTitle) {
          headingTitle.tabIndex = -1;
          headingTitle.dataset.focus = 'panel-heading';
        }
      }
      const closeButton = makeButton(document, '關閉', 'close-panel', {
        className: 'ms-button ms-button--close',
        title: '關閉最上層面板',
      });
      closeButton.setAttribute('aria-label', '關閉' + PANEL_LABELS[panel]);
      closeButton.dataset.focus = 'panel-close';
      heading.append(title, closeButton);
      const body = makeElement(document, 'div', 'ms-panel__body');
      body.append(buildPanelContent(document, view, panel, {
        selectedBagIndex,
        selectedMapId,
        selectedMapFocus,
        selectedQuestId,
        trackedQuestId,
        inventoryFilter,
        readingSize: readingPreference.size,
        shopFilter,
        shopQuantities,
        sellQuantities,
        bagStateMessage,
        pendingBinding,
        bindingMessage,
        bindingMessageAction,
      }));
      if (samePanel) {
        for (const detail of body.querySelectorAll<HTMLDetailsElement>('details[data-detail-id]')) {
          detail.open = openDetails.has(detail.dataset.detailId);
        }
      }
      card.append(heading, body);
      panelHost.replaceChildren(card);
    };
    if (skipBagFocusPreservation) {
      buildPanel();
      if (focusStableBagHeading) panelHost.querySelector<HTMLElement>('[data-focus="panel-heading"]')?.focus();
    } else {
      preserveFocus(panelHost, buildPanel, panel === 'dialogue');
    }
    if (panel === 'dialogue') {
      const dialogueButtons = Array.from(panelHost.querySelectorAll<HTMLButtonElement>(
        '.ms-panel[data-panel="dialogue"] button[data-ui-action]:not(:disabled)',
      ));
      const focusFirstDialogueAction = (): void => {
        const firstAction = dialogueButtons.find((button) => button.dataset.uiAction !== 'close-panel')
          ?? dialogueButtons[0];
        firstAction?.focus();
      };
      if (!samePanel) focusFirstDialogueAction();
      else if (previouslyFocusedDialogueControl && !dialogueButtons.some((button) =>
        button.dataset.focus === previouslyFocusedDialogueControl)) focusFirstDialogueAction();
    }
    const renderedBody = panelHost.querySelector<HTMLElement>('.ms-panel__body');
    if (renderedBody && samePanel) renderedBody.scrollTop = scrollTop;
    if (questMapReturn?.panel === panel) {
      const { focusKey, scrollTop } = questMapReturn;
      questMapReturn = null;
      const shortcut = Array.from(panelHost.querySelectorAll<HTMLElement>('[data-focus]'))
        .find((element) => element.dataset.focus === focusKey);
      shortcut?.focus({ preventScroll: true });
      if (renderedBody) renderedBody.scrollTop = scrollTop;
    }
    if (panel === 'map' && pendingMapReview) {
      pendingMapReview = false;
      const terrain = panelHost.querySelector<HTMLDetailsElement>('details.ms-local-map');
      if (terrain) terrain.open = true;
      const target = terrain?.querySelector('summary')
        ?? panelHost.querySelector<HTMLButtonElement>('.ms-atlas-landmark[aria-pressed="true"]');
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'nearest' });
    }
    if (panel === 'inventory' && pendingBagReview) {
      pendingBagReview = false;
      const item = panelHost.querySelector<HTMLElement>('.ms-bag-slot[aria-pressed="true"]');
      item?.focus({ preventScroll: true });
      item?.scrollIntoView({ block: 'nearest' });
    }
    if (panel === 'quests' && pendingQuestReview) {
      pendingQuestReview = false;
      const heading = panelHost.querySelector<HTMLElement>('.ms-journal-sheet .ms-journal-heading h3');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start' });
      }
    }
    if (panel === 'skills' && pendingSkillReview) {
      const heading = document.getElementById('brightwood-first-oath-skill-heading-' + pendingSkillReview);
      pendingSkillReview = null;
      heading?.focus({ preventScroll: true });
      heading?.closest('.ms-skill-card')?.scrollIntoView({ block: 'nearest' });
    }
    if (panel === 'skills' && pendingSpecializationReview) {
      pendingSpecializationReview = false;
      const heading = panelHost.querySelector<HTMLElement>('[data-focus="specialization-heading"]');
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'start' });
    }
  };

  const restoreCommittedFocus = (view: UiSnapshot): void => {
    const panel = view.panels.at(-1) ?? null;
    if (!panel || panelHost.hidden) {
      bagHeadingRestorePending = false;
      focusGameCanvas();
      return;
    }

    const saved = panelFocusBeforeResume?.panel === panel ? panelFocusBeforeResume : null;
    const restoreBagHeading = bagHeadingRestorePending && (panel === 'inventory' || panel === 'shop');
    const usable = (element: HTMLElement): boolean => !element.matches(':disabled')
      && element.tabIndex >= 0
      && !element.closest('[hidden]');
    let target = restoreBagHeading
      ? panelHost.querySelector<HTMLElement>('[data-focus="panel-heading"]') ?? undefined
      : saved?.focusKey
      ? Array.from(panelHost.querySelectorAll<HTMLElement>('[data-focus]'))
        .find((element) => element.dataset.focus === saved.focusKey && usable(element))
      : undefined;
    if (!target) {
      target = Array.from(panelHost.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex]'))
        .find(usable);
    }
    target ??= panelHost.querySelector<HTMLElement>('[data-focus="panel-close"]') ?? undefined;
    if (target && saved?.focusKey && target.dataset.focus === saved.focusKey
      && saved.value !== undefined
      && (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) {
      target.value = saved.value;
    }
    target?.focus();
    if (target && saved?.focusKey && target.dataset.focus === saved.focusKey && saved.selection
      && ((target instanceof HTMLInputElement && target.type !== 'range') || target instanceof HTMLTextAreaElement)
      && saved.selection.start !== null && saved.selection.end !== null) {
      try {
        target.setSelectionRange(saved.selection.start, saved.selection.end, saved.selection.direction ?? undefined);
      } catch {
        // Some browser-managed controls do not support text selection.
      }
    }
    const body = panelHost.querySelector<HTMLElement>('.ms-panel__body');
    if (body && saved) body.scrollTop = saved.scrollTop;
    if (restoreBagHeading || bagHeadingRestorePending) bagHeadingRestorePending = false;
  };

  const handleAction = (button: HTMLButtonElement, view: UiSnapshot): void => {
    const action = button.dataset.uiAction as UiAction | undefined;
    if (!action) return;
    if (view.focusResumeRequired === true
      && ['attack', 'pickup', 'interact', 'return-town', 'use-item', 'inspect-stele', 'inspect-route-marker'].includes(action)) return;
    switch (action) {
      case 'track-quest': {
        const quest = view.questViews.find(({ questId }) => questId === button.dataset.questId);
        if (!isTrackableQuest(quest)) return;
        questTrackerState.trackQuest(questTrackerState.trackedQuestId === quest.questId ? null : quest.questId);
        renderQuestTracker(view);
        renderPanel(view, true);
        panelHost.querySelector<HTMLButtonElement>('[data-ui-action="track-quest"]')?.focus();
        return;
      }
      case 'select-quest': {
        if (!view.questViews.some(({ questId }) => questId === button.dataset.questId)) return;
        selectedQuestId = button.dataset.questId!;
        pendingQuestReview = true;
        if (view.panels.at(-1) === 'map') questMapReturn = capturePanelFocus(view, button);
        if (view.panels.at(-1) === 'quests') renderPanel(view, true);
        else dispatchDraft({ type: 'setPanel', payload: { panel: 'quests' } });
        return;
      }
      case 'show-atlas-terrain': {
        const terrain = panelHost.querySelector<HTMLDetailsElement>('details.ms-local-map');
        if (!terrain) return;
        terrain.open = true;
        const summary = terrain.querySelector('summary');
        summary?.focus({ preventScroll: true });
        summary?.scrollIntoView({ block: 'start' });
        return;
      }
      case 'select-map':
        if (!button.dataset.mapId || (!view.catalog.world.maps[button.dataset.mapId] && !PLANNED_REGIONS.some(({ id }) => id === button.dataset.mapId))) return;
        selectedMapId = button.dataset.mapId;
        selectedMapFocus = null;
        renderPanel(view, true);
        return;
      case 'review-npc-map':
      case 'review-quest-map': {
        const latestView = currentView ?? view;
        const { world } = latestView.catalog;
        const id = action === 'review-npc-map' ? button.dataset.npcId : button.dataset.questId;
        if (!id) return;
        const focus: LocalMapFocus = { kind: action === 'review-npc-map' ? 'npc' : 'quest', id };
        const mapId = focus.kind === 'npc' ? resolveNpcMapTarget(world, id)?.mapId
          : latestView.saveData && resolveQuestMapTarget(world, latestView.saveData,
            latestView.questViews.find(({ questId }) => questId === id))?.id;
        if (!mapId) return;
        selectedMapId = mapId;
        selectedMapFocus = focus;
        pendingMapReview = true;
        if (latestView.panels.at(-1) === 'quests') questMapReturn = capturePanelFocus(latestView, button);
        if (latestView.panels.at(-1) === 'map') {
          renderPanel(latestView, true);
          return;
        }
        dispatchDraft({ type: 'setPanel', payload: { panel: 'map' } });
        return;
      }
      case 'open-panel': {
        const panel = PANEL_ORDER.find((entry) => entry === button.dataset.panel);
        if (!panel) return;
        const closing = view.panels.at(-1) === panel;
        dispatchDraft(closing
          ? { type: 'closePanel', payload: {} }
          : { type: 'setPanel', payload: { panel } });
        focusGameCanvas(button);
        return;
      }
      case 'close-panel':
        dispatchDraft({ type: 'closePanel', payload: {} });
        if (view.panels.length <= 1) focusGameCanvas(button);
        return;
      case 'continue':
        clearTransientViewState();
        dispatchDraft({ type: 'continue', payload: {} });
        focusGameCanvas(button);
        return;
      case 'new-role':
        clearTransientViewState();
        createRequested = true;
        slotDraft = button.dataset.slotId ?? view.profile?.slots.find(({ characterId }) => characterId === null)?.slotId;
        plannedJobDraft = 'swordsman';
        nameDraft = '旅人';
        lastScreenSignature = '';
        renderScreen(view);
        return;
      case 'choose-route':
        plannedJobDraft = button.dataset.job === 'rogue' ? 'rogue' : button.dataset.job === 'mage' ? 'mage' : button.dataset.job === 'archer' ? 'archer' : 'swordsman';
        lastScreenSignature = '';
        renderScreen(view);
        return;
      case 'select-character':
        clearTransientViewState();
        if (button.dataset.characterId) dispatchDraft({ type: 'selectCharacter', payload: { characterId: button.dataset.characterId } });
        focusGameCanvas(button);
        return;
      case 'advance-specialization': {
        const id = button.dataset.specialization;
        if (!isSpecialization(id)) return;
        if (button.dataset.confirmed !== 'true') {
          button.dataset.confirmed = 'true'; button.textContent = '再次點擊確認這個分支（此角色只能選一次）'; return;
        }
        dispatchDraft({ type: 'advanceJob', payload: { specialization: id } }); return;
      }
      case 'toggle-advanced-skill':
        dispatchDraft({ type: 'setAdvancedSkill', payload: { enabled: !view.saveData?.player.advancedSkillEquipped } }); return;
      case 'create-confirm':
        clearTransientViewState();
        const checkedName = validatePlayerName(nameDraft);
        if (!checkedName.ok) return;
        createRequested = false;
        dispatchDraft({ type: 'newGame', payload: { name: checkedName.value, plannedJob: plannedJobDraft, slotId: slotDraft } });
        focusGameCanvas(button);
        return;
      case 'create-cancel':
        createRequested = false;
        lastScreenSignature = '';
        if (view.screen === 'create') dispatchDraft({ type: 'returnTitle', payload: {} });
        else renderScreen(view);
        return;
      case 'retry-save':
        discardConfirmed = false;
        dispatchDraft({ type: 'retrySave', payload: {} });
        return;
      case 'retry-map-load':
        dispatchDraft({ type: 'retryMapLoad', payload: {} });
        return;
      case 'confirm-save-upgrade':
        {
          const command = saveUpgradeConfirmCommand(view.saveUpgrade);
          if (command) dispatchDraft(command);
        }
        return;
      case 'import-legacy-save':
        if (view.legacyImportAvailable) dispatchDraft({ type: 'importLegacySave', payload: {} });
        return;
      case 'dismiss-legacy-import':
        dispatchDraft({ type: 'dismissLegacyImport', payload: {} });
        return;
      case 'discard-save':
        if (!discardConfirmed) {
          discardConfirmed = true;
          lastScreenSignature = '';
          renderScreen(view);
          return;
        }
        discardConfirmed = false;
        dispatchDraft({ type: 'discardUnreadableSave', payload: {} });
        return;
      case 'play-temporary':
        dispatchDraft({ type: 'playTemporary', payload: {} });
        focusGameCanvas(button);
        return;
      case 'review-sidequest': {
        const questId = button.dataset.questId;
        if (!questId || !view.questViews.some(({ questId: id }) => id === questId)) return;
        selectedQuestId = questId;
        if (view.panels.at(-1) === 'quests') {
          renderPanel(view, true);
          return;
        }
        dispatchDraft({ type: 'setPanel', payload: { panel: 'quests' } });
        return;
      }
      case 'toggle-pause':
        dispatchDraft({ type: 'togglePause', payload: {} });
        return;
      case 'return-title':
        clearTransientViewState();
        dispatchDraft({ type: 'returnTitle', payload: {} });
        return;
      case 'reload-page':
        document.defaultView?.location.reload();
        return;
      case 'respawn':
        dispatchDraft({ type: 'respawn', payload: {} });
        focusGameCanvas(button);
        return;
      case 'retry-boss':
        dispatchDraft({ type: 'retryBoss', payload: {} });
        focusGameCanvas(button);
        return;
      case 'return-town':
        if (!view.canReturnTown) return;
        dispatchDraft({ type: 'returnTown', payload: {} });
        focusGameCanvas(button);
        return;
      case 'attack': {
        const skillId = button.dataset.skillId;
        if (skillId) dispatchDraft({ type: 'attack', payload: { skillId } });
        focusGameCanvas(button);
        return;
      }
      case 'pickup':
        dispatchDraft({ type: 'pickup', payload: {} });
        focusGameCanvas(button);
        return;
      case 'interact':
        dispatchDraft({ type: 'interact', payload: {} });
        // The dispatch may update the UI synchronously or on the next game tick. Keep the
        // dialogue's own first-action focus if it has already opened; otherwise return input
        // to the canvas so movement still works after an out-of-range interaction.
        if (currentView?.panels.at(-1) !== 'dialogue') focusGameCanvas(button);
        return;
      case 'inspect-stele': {
        const targetId = button.dataset.targetId;
        if (targetId) dispatchDraft({ type: 'inspect', payload: { targetId } });
        return;
      }
      case 'inspect-route-marker':
        {
          const command = frostRouteMarkerInspectCommand(
            view.interaction?.npcId,
            view.questViews.find(({ questId }) => questId === 'q21')?.status,
          );
          if (command) dispatchDraft(command);
        }
        return;
      case 'use-item': {
        const itemId = button.dataset.itemId;
        if (itemId) {
          if (button.dataset.inventoryUse === 'true') {
            const player = view.saveData?.player;
            if (!player) return;
            const preview = resolveItemUse({
              player,
              rules: view.catalog.rules,
              requestedItemId: itemId,
              nowMs: view.nowMs,
              potionReadyAtMs: view.potionReadyAtMs,
            });
            if (!preview.ok) return;
          }
          dispatchDraft({ type: 'useItem', payload: { itemId } });
        }
        if (view.panels.length === 0) focusGameCanvas(button);
        return;
      }
      case 'select-bag':
        selectedBagIndex = Number(button.dataset.bagIndex);
        if (Number.isInteger(selectedBagIndex)) {
          bagStateMessage = '';
          renderPanel(view, true);
        }
        return;
      case 'review-quest-item': {
        const latestView = currentView ?? view;
        const index = latestView.saveData?.player.bag.findIndex(({ itemId }) => itemId === button.dataset.itemId) ?? -1;
        if (index < 0) return;
        const item = latestView.catalog.rules.items[button.dataset.itemId ?? ''];
        inventoryFilter = inventoryFilterForItem(item);
        selectedBagIndex = index;
        pendingBagReview = true;
        bagStateMessage = '';
        if (latestView.panels.at(-1) === 'inventory') renderPanel(latestView, true);
        else dispatchDraft({ type: 'setPanel', payload: { panel: 'inventory' } });
        return;
      }
      case 'select-bag-upgrade': {
        const player = view.saveData?.player;
        if (!player) return;
        const upgrades = wearableUpgradeIndices(view, player);
        const current = selectedBagIndex ?? -1;
        const next = upgrades.find((index) => index > current) ?? upgrades[0];
        if (next === undefined) return;
        inventoryFilter = 'equipment';
        selectedBagIndex = next;
        bagStateMessage = '';
        renderPanel(view, true);
        panelHost.querySelector<HTMLButtonElement>('[data-focus="bag-slot-' + next + '"]')?.focus();
        return;
      }
      case 'inventory-filter':
        {
          const filter = INVENTORY_FILTERS.find(({ id }) => id === button.dataset.kind);
          if (!filter || filter.id === inventoryFilter) return;
          inventoryFilter = filter.id;
        }
        selectedBagIndex = null;
        renderPanel(view, true);
        return;
      case 'shop-filter': {
        const filter = SHOP_FILTERS.find(({ id }) => id === button.dataset.kind);
        if (!filter || filter.id === shopFilter) return;
        shopFilter = filter.id;
        renderPanel(view, true);
        return;
      }
      case 'equip-bag': {
        const bagIndex = Number(button.dataset.bagIndex);
        const player = view.saveData?.player;
        if (!player || !Number.isInteger(bagIndex)) return;
        const preview = previewEquipmentAction({
          player,
          rules: view.catalog.rules,
          action: { type: 'equip', bagIndex },
        });
        if (!preview.disabled) dispatchDraft({ type: 'equip', payload: { bagIndex } });
        return;
      }
      case 'sell-materials': {
        const player = view.saveData?.player;
        if (!player) return;
        const preview = previewMaterialSale({
          player,
          rules: view.catalog.rules,
          atMerchant: view.canTrade,
        });
        if (preview.disabled) return;
        for (const { bagIndex, quantity } of preview.actions) {
          sellQuantities.delete(bagIndex);
          dispatchDraft({ type: 'sell', payload: { bagIndex, quantity } });
        }
        return;
      }
      case 'sell-bag': {
        const bagIndex = Number(button.dataset.bagIndex);
        const player = view.saveData?.player;
        if (!player) return;
        const maxQuantity = player.bag[bagIndex]?.quantity ?? 1;
        const rawQuantity = Number(button.dataset.quantity ?? sellQuantities.get(bagIndex) ?? 1);
        const quantity = clampInteger(rawQuantity, 1, maxQuantity);
        if (Number.isInteger(bagIndex) && quantity > 0) {
          const preview = previewSale({
            player,
            rules: view.catalog.rules,
            bagIndex,
            quantity,
            atMerchant: view.canTrade,
          });
          if (preview.disabled) return;
          sellQuantities.delete(bagIndex);
          dispatchDraft({ type: 'sell', payload: { bagIndex, quantity } });
        }
        return;
      }
      case 'unequip': {
        const slot = button.dataset.slot;
        const player = view.saveData?.player;
        if (!player || (slot !== 'weapon' && slot !== 'body' && slot !== 'hat')) return;
        const preview = previewEquipmentAction({
          player,
          rules: view.catalog.rules,
          action: { type: 'unequip', slot },
        });
        if (!preview.disabled) dispatchDraft({ type: 'unequip', payload: { slot } });
        return;
      }
      case 'allocate-ap': {
        const stat = button.dataset.stat;
        const available = view.saveData?.player.ap ?? 0;
        const amount = clampInteger(Number(button.dataset.amount ?? 1), 1, Math.max(1, available));
        const latestView = currentView;
        const player = latestView?.saveData?.player;
        if (!latestView || !player || (stat !== 'str' && stat !== 'dex' && stat !== 'int' && stat !== 'luk')) return;
        const preview = previewApAllocation({ player, rules: latestView.catalog.rules, stat, amount });
        if (preview.ok) dispatchDraft({ type: 'allocateAp', payload: { stat, amount } });
        return;
      }
      case 'learn-skill': {
        const skillId = button.dataset.skillId;
        if (skillId) dispatchDraft({ type: 'learnSkill', payload: { skillId } });
        return;
      }
      case 'review-skill': {
        if (view.screen !== 'playing' || view.focusResumeRequired || !button.dataset.skillId) return;
        pendingSkillReview = button.dataset.skillId;
        if (view.panels.at(-1) === 'skills') renderPanel(view, true);
        else dispatchDraft({ type: 'setPanel', payload: { panel: 'skills' } });
        return;
      }
      case 'review-specialization': {
        if (view.screen !== 'playing' || view.focusResumeRequired || !view.nearSpecializationMentor) return;
        pendingSpecializationReview = true;
        dispatchDraft({ type: 'setPanel', payload: { panel: 'skills' } });
        return;
      }
      case 'accept-quest': {
        const questId = button.dataset.questId;
        if (questId) dispatchDraft({ type: 'acceptQuest', payload: { questId } });
        return;
      }
      case 'claim-quest': {
        const questId = button.dataset.questId;
        const latestView = currentView;
        const saveData = latestView?.saveData;
        if (!questId || !latestView || !saveData) return;
        if (resolveQuestClaim(saveData, questId, latestView.catalog).ok) {
          dispatchDraft({ type: 'claimQuest', payload: { questId } });
        }
        return;
      }
      case 'buy': {
        const itemId = button.dataset.itemId;
        const player = view.saveData?.player;
        const item = itemId ? view.catalog.rules.items[itemId] : undefined;
        if (!itemId || !player || !item) return;
        const quantity = item.stackLimit > 1
          ? clampInteger(shopQuantities.get(itemId) ?? 1, 1, 99)
          : 1;
        const preview = previewBuy({
          player,
          rules: view.catalog.rules,
          itemId,
          quantity,
          atMerchant: view.canTrade,
        });
        if (!preview.disabled) dispatchDraft({ type: 'buy', payload: { itemId, quantity: preview.quantity } });
        return;
      }
      case 'select-max-buy': {
        const itemId = button.dataset.itemId;
        const latestView = currentView;
        const player = latestView?.saveData?.player;
        const item = itemId && latestView ? latestView.catalog.rules.items[itemId] : undefined;
        if (!itemId || !latestView || !player || !item || item.stackLimit <= 1) return;
        const preview = previewMaximumBuy({
          player,
          rules: latestView.catalog.rules,
          itemId,
          atMerchant: latestView.canTrade,
        });
        if (preview.disabled) return;
        shopQuantities.set(itemId, preview.quantity);
        renderPanel(latestView, true);
        return;
      }
      case 'settings-reading-size': {
        const size = button.dataset.readingSize;
        if (size !== 'standard' && size !== 'large') return;
        readingPreference.set(size);
        shell.dataset.readingSize = size;
        lastScreenSignature = '';
        renderScreen(view);
        renderPanel(view, true);
        const readingHost = view.panels.at(-1) === 'settings' ? panelHost : screenLayer;
        readingHost.querySelector<HTMLButtonElement>('[data-ui-action="settings-reading-size"][data-reading-size="' + size + '"]')?.focus();
        return;
      }
      case 'settings-mute': {
        if (!view.saveData) return;
        const settings: Settings = { ...view.saveData.settings, muted: !view.saveData.settings.muted };
        dispatchDraft({ type: 'setSettings', payload: { settings } });
        return;
      }
      case 'settings-hold-attack':
        dispatchDraft({ type: 'setHoldAttack', payload: { enabled: button.dataset.holdAttack === 'true' } });
        return;
      case 'settings-background-motion':
        dispatchDraft({ type: 'setBackgroundMotion', payload: { enabled: button.dataset.backgroundMotion === 'true' } });
        return;
      case 'use-cloud-version':
        clearTransientViewState();
        dispatchDraft({ type: 'useCloudVersion', payload: {} });
        return;
      case 'settings-rebind': {
        const actionId = button.dataset.actionId;
        const action = KEY_ACTIONS.find(({ id }) => id === actionId);
        if (!action) return;
        pendingBinding = action.id;
        bindingMessageAction = action.id;
        bindingMessage = '按一下新按鍵；Esc 保留關閉最上層面板。';
        renderPanel(view, true);
        return;
      }
      case 'settings-reset-bindings': {
        if (!view.saveData || Object.keys(view.saveData.settings.bindings).length === 0) return;
        pendingBinding = null;
        bindingMessage = '';
        bindingMessageAction = null;
        dispatchDraft({ type: 'setSettings', payload: { settings: { ...view.saveData.settings, bindings: {} } } });
        renderPanel(view, true);
        // The reset button is now disabled and cannot keep focus; hold the scroll position on the list.
        panelHost.querySelector<HTMLElement>('.ms-binding-list [data-focus]')?.focus();
        return;
      }
      case 'toggle-key-guide': {
        keyGuideExpanded = !keyGuideExpanded;
        renderKeyGuide(currentView);
        focusGameCanvas(button);
        return;
      }
      case 'toggle-quest-tracker':
        questTrackerState.toggle();
        renderQuestTracker(view);
        return;
    }
  };

  const renderPanelButtons = (view: UiSnapshot, previousView: UiSnapshot | null): void => {
    const topPanel = view.panels.at(-1);
    const player = view.saveData?.player;
    const previousPlayer = previousView?.saveData?.player;
    if (previousView && topPanel === previousView.panels.at(-1) && view.questViews === previousView.questViews
      && player?.bag.length === previousPlayer?.bag.length && player?.ap === previousPlayer?.ap && player?.sp === previousPlayer?.sp) return;

    for (const [panel, button] of panelButtons) {
      const top = topPanel === panel;
      button.classList.toggle('is-active', top);
      button.setAttribute('aria-expanded', String(top));
      if (panel === 'inventory') {
        if (player) {
          const used = player.bag.length;
          const label = PANEL_LABELS[panel];
          button.setAttribute('aria-label', '開啟' + label + '（已用 ' + used + '／' + BAG_CAPACITY + ' 格）');
          button.title = label + '：已用 ' + used + '／' + BAG_CAPACITY + ' 格'
            + (used >= 28 ? '；可出售或使用物品整理空位' : '');
          if (used >= 28) button.dataset.badge = String(used);
          else delete button.dataset.badge;
        } else {
          button.setAttribute('aria-label', '開啟' + PANEL_LABELS[panel]);
          button.title = PANEL_LABELS[panel];
          delete button.dataset.badge;
        }
        continue;
      }
      if (panel === 'quests') {
        const readyCount = player ? view.questViews.filter(({ status }) => status === 'ready').length : 0;
        if (readyCount > 0) {
          button.dataset.badge = String(readyCount);
          button.setAttribute('aria-label', '開啟任務（待回報 ' + readyCount + ' 項）');
          button.title = '任務：' + readyCount + ' 項待回報，請查看手帳中的回報 NPC 與獎勵';
        } else {
          delete button.dataset.badge;
          button.setAttribute('aria-label', '開啟' + PANEL_LABELS[panel]);
          button.title = PANEL_LABELS[panel];
        }
        continue;
      }
      const unspent = panel === 'stats' ? player?.ap ?? 0 : panel === 'skills' ? player?.sp ?? 0 : 0;
      if (unspent > 0) {
        button.dataset.badge = String(unspent);
        button.setAttribute('aria-label', '開啟' + PANEL_LABELS[panel] + '（可分配 ' + unspent + (panel === 'stats' ? ' AP' : ' SP') + '）');
      } else if (button.dataset.badge !== undefined) {
        delete button.dataset.badge;
        button.setAttribute('aria-label', '開啟' + PANEL_LABELS[panel]);
      }
    }
  };

  const render = (view: UiSnapshot): void => {
    if (disposed) return;
    const previousView = currentView;
    questTrackerState.selectCharacter(view.profile?.activeCharacterId ?? null);
    if (previousView?.profile?.activeCharacterId && previousView.profile.activeCharacterId !== view.profile?.activeCharacterId) {
      clearTransientViewState();
      selectedQuestId = null;
      selectedMapId = null;
      selectedMapFocus = null;
      lastReconciledBag = emptyBag;
      lastPanelFocus = null;
      panelFocusBeforeResume = null;
    }
    const previousResumeGate = previousView?.focusResumeRequired === true;
    const nextResumeGate = view.focusResumeRequired === true;
    if (nextResumeGate && !previousResumeGate && previousView) {
      const panel = previousView.panels.at(-1);
      panelFocusBeforeResume = capturePanelFocus(previousView)
        ?? (panel && lastPanelFocus?.panel === panel ? lastPanelFocus : null);
    }
    if (previousView?.screen === 'playing' && view.screen === 'paused' && view.panels.length > 0) {
      const panel = view.panels.at(-1);
      panelFocusBeforeResume = capturePanelFocus(previousView)
        ?? (panel && lastPanelFocus?.panel === panel ? lastPanelFocus : null);
    }
    if (previousView && ((previousResumeGate && !nextResumeGate)
      || (previousView.screen === 'paused' && view.screen === 'playing'))) {
      restoreFocusAfterResume = true;
    }
    if (restoreFocusAfterResume && view.screen !== 'playing' && view.screen !== 'paused') {
      restoreFocusAfterResume = false;
      panelFocusBeforeResume = null;
    }
    const enteringLoad = (view.screen === 'loading' && previousView?.screen !== 'loading')
      || (view.saveStatus === 'loading' && previousView?.saveStatus !== 'loading');
    if (enteringLoad) clearTransientViewState();
    currentView = view;
    shell.classList.toggle('is-focus-resume-gated', nextResumeGate);
    // Before a character is in the world, hide the empty in-game HUD and show the cover art instead.
    shell.classList.toggle('is-pregame', createRequested
      || view.screen === 'title' || view.screen === 'create' || view.screen === 'loading' || view.screen === 'error');
    renderProfile(view);
    renderMapIndicator(view);
    renderBossVitals(view);
    updateQuickButtons(view);
    const gameWasCovered = !screenLayer.hidden;
    renderScreen(view);
    if (gameWasCovered && screenLayer.hidden && view.screen === 'playing' && view.panels.length === 0
      && !nextResumeGate && !restoreFocusAfterResume) focusGameCanvas();
    if (view.mapVisualLoad) {
      const loadProgress = screenLayer.querySelector<HTMLProgressElement>('.ms-map-load-progress progress');
      const loadLabel = screenLayer.querySelector<HTMLElement>('.ms-map-load-progress__label');
      if (loadProgress && loadLabel) {
        const { completed, total } = view.mapVisualLoad;
        loadProgress.max = Math.max(1, total);
        if (total > 0) loadProgress.value = completed;
        else loadProgress.removeAttribute('value');
        loadLabel.textContent = total > 0 && completed < total
          ? '已載入 ' + completed + ' / ' + total + ' 份地圖素材'
          : '素材已就緒，正在整理地圖…';
      }
    }
    renderFooter(view);
    renderPanel(view);
    const warningHidden = !view.panelDanger;
    if (panelWarning.hidden !== warningHidden) panelWarning.hidden = warningHidden;
    if (view.panels.at(-1) === 'map') updateLocalMapMarkers(panelHost, view);
    if (view.panels.at(-1) === 'stats' && view.activeGuard) {
      const seconds = panelHost.querySelector<HTMLElement>('[data-guard-seconds]');
      const value = String(view.activeGuard.remainingSeconds);
      if (seconds && seconds.textContent !== value) seconds.textContent = value;
    }
    if (view.panels.length === 0) lastPanelFocus = null;
    renderKeyGuide(view);
    renderQuestTracker(view);
    renderPanelButtons(view, previousView);
    if (restoreFocusAfterResume && view.screen === 'playing' && !nextResumeGate
      && screenLayer.hidden && view.saveStatus !== 'conflict' && view.saveStatus !== 'localConflict' && !view.saveUpgrade) {
      restoreCommittedFocus(view);
      restoreFocusAfterResume = false;
      panelFocusBeforeResume = null;
    }
  };

  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-ui-action]');
    if (!button || !shell.contains(button) || button.disabled || !currentView) return;
    handleAction(button, currentView);
    // Pointer users can resume moving immediately; keyboard users keep the disclosure focused.
    if (button === questToggle && event instanceof MouseEvent && event.detail > 0) focusGameCanvas(button);
  };

  const rememberPanelFocus = (event: Event): void => {
    if (!currentView) return;
    const active = event.type === 'focusout' && event.target instanceof HTMLElement
      ? event.target : document.activeElement;
    const saved = capturePanelFocus(currentView, active);
    if (saved) lastPanelFocus = saved;
  };

  const onInput = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.dataset.focus === 'character-name') {
      nameDraft = target.value;
      lastScreenSignature = '';
      const checkedName = validatePlayerName(nameDraft);
      const feedback = screenLayer.querySelector<HTMLParagraphElement>(`#${nameFeedbackId}`);
      presentNameFeedback(target, feedback, checkedName);
      const confirmButton = screenLayer.querySelector<HTMLButtonElement>('[data-ui-action="create-confirm"]');
      if (confirmButton && currentView) {
        confirmButton.disabled = !checkedName.ok;
        confirmButton.title = checkedName.ok ? '' : checkedName.message;
      }
      return;
    }
    if (target instanceof HTMLInputElement && target.dataset.settingsChannel && currentView?.saveData) {
      const value = Math.round(Number(target.value) * 100) + '%';
      target.setAttribute('aria-valuetext', value);
      const label = target.dataset.settingsLabel;
      const output = target.closest('label')?.querySelector('span');
      if (label && output) output.textContent = label + ' ' + value;
      return;
    }
    // Store quantities while typing. Rebuilding the panel later, on the blur that precedes a
    // click on 購買／出售, replaced the button between mousedown and mouseup and ate that click.
    if (target instanceof HTMLInputElement && (target.dataset.shopQuantity || target.dataset.sellQuantity !== undefined)) {
      const value = Number(target.value);
      if (target.dataset.shopQuantity) shopQuantities.set(target.dataset.shopQuantity, clampInteger(value, 1, 99));
      else {
        const bagIndex = Number(target.dataset.sellQuantity);
        const max = currentView?.saveData?.player.bag[bagIndex]?.quantity ?? 1;
        sellQuantities.set(bagIndex, clampInteger(value, 1, max));
      }
      if (currentView) renderPanel(currentView);
    }
  };

  const onChange = (event: Event): void => {
    if (!currentView) return;
    const target = event.target;
    if (target instanceof HTMLInputElement && target.dataset.settingsChannel && currentView.saveData) {
      const channel = target.dataset.settingsChannel as 'masterVolume' | 'musicVolume' | 'sfxVolume';
      const settings = { ...currentView.saveData.settings, [channel]: clamp(Number(target.value), 0, 1) };
      dispatchDraft({ type: 'setSettings', payload: { settings } });
      return;
    }
    if (target instanceof HTMLInputElement && target.dataset.shopQuantity) {
      const quantity = clampInteger(Number(target.value), 1, 99);
      const unchanged = shopQuantities.get(target.dataset.shopQuantity) === quantity;
      shopQuantities.set(target.dataset.shopQuantity, quantity);
      if (unchanged) target.value = String(quantity);
      else if (currentView) renderPanel(currentView, true);
      return;
    }
    if (target instanceof HTMLInputElement && target.dataset.sellQuantity !== undefined) {
      const bagIndex = Number(target.dataset.sellQuantity);
      const max = currentView.saveData?.player.bag[bagIndex]?.quantity ?? 1;
      const quantity = clampInteger(Number(target.value), 1, max);
      const unchanged = sellQuantities.get(bagIndex) === quantity;
      sellQuantities.set(bagIndex, quantity);
      if (unchanged) target.value = String(quantity);
      else if (currentView) renderPanel(currentView, true);
    }
  };

  const onKeyDown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent) || !pendingBinding || !currentView?.saveData) return;
    const target = event.target;
    if (currentView.focusResumeRequired === true && target instanceof Element
      && target.closest('.ms-screen-card--focus-resume')) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    const code = event.code;
    if (code === 'Escape') {
      bindingMessage = 'Esc 保留給關閉最上層面板。';
      pendingBinding = null;
      renderPanel(currentView, true);
      return;
    }
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(code)) {
      bindingMessage = '這個按鍵無法綁定，請改用其他按鍵。';
      renderPanel(currentView, true);
      return;
    }
    const bindings = currentView.saveData.settings.bindings;
    const conflict = findKeyBindingConflict(resolveEffectiveBindings(bindings), pendingBinding, code);
    if (conflict) {
      const action = KEY_ACTIONS.find((entry) => entry.id === conflict.action)?.label
        ?? (conflict.action === 'escape' ? '關閉面板／暫停' : conflict.action);
      bindingMessage = codeLabel(code) + ' 與「' + action + '」衝突，請選擇另一個按鍵。';
      renderPanel(currentView, true);
      return;
    }
    const settings: Settings = { ...currentView.saveData.settings, bindings: { ...bindings, [pendingBinding]: code } };
    bindingMessage = '已將按鍵設為 ' + codeLabel(code) + '。';
    pendingBinding = null;
    dispatchDraft({ type: 'setSettings', payload: { settings } });
    renderPanel(currentView, true);
  };

  const onDialogueActionRepeat = (event: Event): void => {
    if (!(event instanceof KeyboardEvent) || !event.repeat || (event.code !== 'Enter' && event.code !== 'Space')) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>(
      '.ms-panel[data-panel="dialogue"] button[data-ui-action]',
    );
    if (!button || !panelHost.contains(button)) return;
    // The focused task action can disappear after the first Enter, moving focus to another
    // action while the physical key is still held. Ignore repeats so one hold remains one action.
    event.preventDefault();
    event.stopPropagation();
  };

  const onInventoryNavigation = (event: Event): void => {
    if (!(event instanceof KeyboardEvent) || event.ctrlKey || event.altKey || event.metaKey || pendingBinding
      || !screenLayer.hidden || currentView?.screen !== 'playing' || currentView.panels.at(-1) !== 'inventory') return;
    const target = event.target;
    const button = target instanceof Element ? target.closest<HTMLButtonElement>('.ms-bag-grid button[data-ui-action="select-bag"]') : null;
    if (!button || !panelHost.contains(button)) return;
    const grid = button.closest<HTMLElement>('.ms-bag-grid')!;
    const buttons = Array.from(grid.querySelectorAll<HTMLButtonElement>('button[data-ui-action="select-bag"]'));
    const indices = buttons.map(slot => Number(slot.dataset.bagIndex));
    const columns = getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
    const next = nextInventoryBagIndex(indices, Number(button.dataset.bagIndex), event.key, columns);
    if (next === null) return;
    event.preventDefault(); event.stopPropagation();
    const nextButton = buttons.find(slot => Number(slot.dataset.bagIndex) === next);
    if (!nextButton || (nextButton === button && button.getAttribute('aria-pressed') === 'true')) return;
    nextButton.focus();
    nextButton.click();
  };

  // Close the guide before Escape can pause gameplay.
  const onEscapeKeyGuide = (event: Event): void => {
    if (!(event instanceof KeyboardEvent) || event.code !== 'Escape') return;
    const target = event.target instanceof Element ? event.target : null;
    const active = document.activeElement instanceof Element ? document.activeElement : null;
    const textEntry = [target, active].some((element) => element !== null
      && element.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]') !== null);
    const gameRoot = document.getElementById('game-root');
    const belongsToGame = target !== null && (shell.contains(target) || root.contains(target) || gameRoot?.contains(target) === true);
    if (belongsToGame && !textEntry && (currentView?.saveStatus === 'conflict' || currentView?.saveStatus === 'localConflict' || currentView?.saveUpgrade)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!keyGuideExpanded || pendingBinding) return;
    event.preventDefault();
    event.stopPropagation();
    keyGuideExpanded = false;
    renderKeyGuide(currentView);
  };
  const keyWindow = shell.ownerDocument.defaultView;
  const onModalTab = (event: KeyboardEvent): void => modalFocus.onKeyDown(event);

  shell.addEventListener('click', onClick);
  shell.addEventListener('focusin', rememberPanelFocus, true);
  shell.addEventListener('focusout', rememberPanelFocus, true);
  shell.addEventListener('input', onInput);
  shell.addEventListener('change', onChange);
  shell.addEventListener('keydown', onDialogueActionRepeat, true);
  shell.addEventListener('keydown', onInventoryNavigation);
  shell.addEventListener('keydown', onKeyDown);
  keyWindow?.addEventListener('keydown', onEscapeKeyGuide, true);
  keyWindow?.addEventListener('keydown', onModalTab, true);

  return {
    get trackedQuestId() { return questTrackerState.trackedQuestId; },
    get contextTargetKey() { return contextTargetKey; },
    get contextPickupKey() { return contextPickupKey; },
    render,
    setPanel(panel): void {
      dispatchDraft({ type: 'setPanel', payload: { panel } });
    },
    isInputCaptured(): boolean {
      if (!currentView) return false;
      const active = document.activeElement;
      return currentView.screen !== 'playing'
        || currentView.panels.length > 0
        || !screenLayer.hidden
        || pendingBinding !== null
        || (active instanceof HTMLElement && shell.contains(active)
          && (active.matches('input, textarea, select, [contenteditable="true"]') || active.tagName === 'BUTTON'));
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      clearTransientViewState();
      shell.removeEventListener('click', onClick);
      shell.removeEventListener('focusin', rememberPanelFocus, true);
      shell.removeEventListener('focusout', rememberPanelFocus, true);
      shell.removeEventListener('input', onInput);
      shell.removeEventListener('change', onChange);
      shell.removeEventListener('keydown', onDialogueActionRepeat, true);
      shell.removeEventListener('keydown', onInventoryNavigation);
      shell.removeEventListener('keydown', onKeyDown);
      keyWindow?.removeEventListener('keydown', onEscapeKeyGuide, true);
      keyWindow?.removeEventListener('keydown', onModalTab, true);
      modalFocus.dispose();
      quickIconCache.clear();
      shell.remove();
      currentView = null;
    },
  };
}

function makePlayerProfileView(document: Document) {
  const portrait = makeButton(document, '', 'open-panel', {
    className: 'ms-profile__portrait', data: { panel: 'stats' },
  });
  const hero = makeElement(document, 'img', 'ms-profile__hero');
  hero.alt = '';
  hero.draggable = false;
  const guard = makeElement(document, 'span', 'ms-profile__guard');
  guard.hidden = true;
  guard.setAttribute('aria-hidden', 'true');
  portrait.append(hero, guard);
  portrait.title = '角色資訊：職業、能力與經驗值';
  const main = makeElement(document, 'div', 'ms-profile__main');
  const heading = makeElement(document, 'div', 'ms-profile__heading');
  const name = makeElement(document, 'strong');
  const level = makeBadge(document, '', 'level');
  heading.append(name, level);
  const hp = makeMeter(document, 'HP', 'hp');
  const mp = makeMeter(document, 'MP', 'mp');
  const exp = makeMeter(document, 'EXP', 'exp');
  main.append(heading, hp.element, mp.element);
  return { elements: [portrait, main, exp.element], portrait, hero, guard, name, level, hp, mp, exp };
}

function makeMeter(document: Document, label: string, tone: string) {
  const meter = makeElement(document, 'div', 'ms-meter ms-meter--' + tone);
  const heading = makeElement(document, 'div', 'ms-meter__label');
  const reading = makeElement(document, 'strong');
  heading.append(makeElement(document, 'span', '', label), reading);
  const track = makeElement(document, 'div', 'ms-meter__track');
  const fill = makeElement(document, 'span', 'ms-meter__fill');
  track.append(fill);
  meter.append(heading, track);
  meter.setAttribute('role', 'meter');
  meter.setAttribute('aria-label', label);
  meter.setAttribute('aria-valuemin', '0');
  let previousValue: number | undefined;
  let previousMaximum: number | undefined;
  let previousLabel: string | undefined;
  let recovering = false;
  return {
    element: meter,
    setRecovering(active: boolean): void {
      if (recovering === active) return;
      recovering = active;
      meter.classList.toggle('is-recovering', active);
      if (active) meter.setAttribute('aria-description', '脫戰恢復中');
      else meter.removeAttribute('aria-description');
    },
    update(value: number, maximum: number, override?: string): boolean {
      if (value === previousValue && maximum === previousMaximum && override === previousLabel) return false;
      if (maximum !== previousMaximum) meter.setAttribute('aria-valuemax', String(maximum));
      previousValue = value;
      previousMaximum = maximum;
      previousLabel = override;
      const valueText = override ?? formatNumber(value) + (tone === 'exp' ? ' / ' : '/') + formatNumber(maximum);
      fill.style.width = percent(value, maximum) + '%';
      reading.textContent = valueText;
      meter.setAttribute('aria-valuenow', String(Math.min(value, maximum)));
      meter.setAttribute('aria-valuetext', valueText);
      return true;
    },
  };
}

function makeScreenCard(document: Document, title: string, description: string): HTMLElement {
  const card = makeElement(document, 'section', 'ms-screen-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.tabIndex = -1;
  card.setAttribute('aria-label', title);
  card.append(
    makeElement(document, 'h1', '', title),
    makeElement(document, 'p', 'ms-screen-card__description', description),
  );
  return card;
}

function skillDetails(skill: UiSnapshot['catalog']['rules']['skills'][string], rank: number, includeRank = true): string {
  const parts = [
    ...(includeRank ? ['等級 ' + rank + '/' + skill.maxRank] : []),
    '需求 Lv.' + skill.requiredLevel + ' ' + (skill.requiredJob === 'rogue' ? '盜賊' : skill.requiredJob === 'mage' ? '法師' : skill.requiredJob === 'archer' ? '弓箭手' : skill.requiredJob === 'swordsman' ? '劍士' : '初心者'),
  ];
  // Passives have no cost or cooldown; "MP 0｜冷卻 0ms" only added noise.
  if (skill.kind !== 'passive') parts.push('MP ' + skill.mpCost, '冷卻 ' + (skillCooldownMs(skill, rank) / 1000) + ' 秒');
  // Must match domain/combat calculateDamage: multiplierBase + multiplierPerRank × (rank − 1).
  if (skill.kind === 'attack') parts.push('倍率 ' + (skill.multiplierBase + skill.multiplierPerRank * (Math.max(1, rank) - 1)).toFixed(2));
  if (skill.kind === 'buff') parts.push('持續 ' + Math.round(skill.durationMs / 1000) + ' 秒・防禦 +' + skill.defensePerRank * Math.max(1, rank));
  if (skill.hpPerRank) parts.push('最大 HP +' + skill.hpPerRank * Math.max(1, rank));
  if (skill.regenPerRank) parts.push('脫戰後每 2 秒恢復 ' + skill.regenPerRank * Math.max(1, rank) + (skill.requiredJob === 'mage' ? ' MP・最大MP +' + 8 * Math.max(1, rank) : ' HP'));
  if (skill.id === 'rogue-double-stab') parts.push('兩段各自命中・每段倍率如上・MP只扣一次');
  if (skill.id === 'rogue-shadow-lunge') parts.push('地面切入最多96・最多2目標・不穿牆門・無無敵');
  if (skill.kind === 'zone') parts.push('半徑105・持續' + ((2200 + (Math.max(1,rank)-1)*100)/1000).toFixed(1) + '秒・區內普通怪移速減50%・首領免疫');
  if (skill.id === 'rogue-combo-rhythm') parts.push('有效近身命中累積3層・4秒有效・下次連刺或影步消耗・受擊清除');
  if (skill.kind === 'movement') parts.push('地面位移最多120・碰撞阻擋・無無敵');
  if (skill.id === 'mage-frost-ring') parts.push('半徑125・最多5目標・普通怪緩速40%／1.5秒・首領免疫緩速');
  if (skill.damagePerRank) parts.push((skill.id === 'rogue-combo-rhythm' ? '3層後下次主動攻擊' : skill.id === 'archer-steady-aim' ? '首個命中' : '攻擊') + ' +' + Number((skill.damagePerRank * Math.max(1,rank) * 100).toFixed(1)) + '%');
  if (skill.projectile) parts.push('水平射程 ' + skill.reach + '・最多 ' + skill.targets + ' 目標' + (skill.projectile.shotOffsetsMs.length > 1 ? '・兩箭' : ''));
  return parts.join('｜');
}

/** What one more SP buys, so 提升至等級 N says what it changes. Empty when unlearned or maxed. */
function skillNextRankPreview(skill: UiSnapshot['catalog']['rules']['skills'][string], rank: number): string {
  if (rank < 1 || rank >= skill.maxRank) return '';
  const next = rank + 1;
  const parts: string[] = [];
  if (skill.kind === 'attack') parts.push('倍率 ' + (skill.multiplierBase + skill.multiplierPerRank * (next - 1)).toFixed(2));
  if (skill.kind === 'buff') parts.push('防禦 +' + skill.defensePerRank * next);
  if (skill.id === 'rogue-smoke') parts.push('持續 ' + ((2200 + (next - 1) * 100) / 1000).toFixed(1) + ' 秒');
  if (skill.cooldownPerRank) parts.push('冷卻 ' + (skillCooldownMs(skill, next) / 1000) + ' 秒');
  if (skill.hpPerRank) parts.push('最大 HP +' + skill.hpPerRank * next);
  if (skill.regenPerRank) parts.push('每 2 秒恢復 ' + skill.regenPerRank * next + (skill.requiredJob === 'mage' ? ' MP・最大MP +' + 8 * next : ' HP'));
  if (skill.damagePerRank) parts.push('加成 +' + Number((skill.damagePerRank * next * 100).toFixed(1)) + '%');
  return parts.length ? '下一級：' + parts.join('｜') : '';
}

const JOURNAL_STATUS_LABELS: Record<UiSnapshot['questViews'][number]['status'], string> = {
  active: '進行中', ready: '可回報', available: '可接取', locked: '未解鎖', claimed: '已領取',
};

function npcLocation(view: UiSnapshot, npcId: string): string {
  const npcName = view.catalog.world.npcs[npcId]?.name ?? npcId;
  const map = Object.values(view.catalog.world.maps).find(({ npcs }) => npcs.some(({ npcId: id }) => id === npcId));
  return npcName + (map ? '（' + map.name + '）' : '');
}

function questNavigationCopy(view: UiSnapshot, quest: UiSnapshot['questViews'][number]): string {
  const definition = view.catalog.world.quests[quest.questId];
  if (!definition) return JOURNAL_STATUS_LABELS[quest.status];
  const returnContact = npcLocation(view, definition.turnInNpcId);
  if (quest.status === 'ready') return '回報：' + returnContact;
  if (quest.status === 'available') return '接取：' + npcLocation(view, definition.giverNpcId);
  if (quest.status === 'locked') {
    const unmet = definition.prerequisiteIds.filter((id) => view.saveData?.quests[id]?.status !== 'claimed');
    const requirements = unmet.map((id) => '「' + (view.catalog.world.quests[id]?.name ?? id) + '」').join('、');
    return (requirements ? '先完成 ' + requirements + '，再接取。' : '完成等級條件後可接取。')
      + '接取：' + npcLocation(view, definition.giverNpcId);
  }
  if (quest.status === 'active') {
    const objective = quest.objectives.find(({ current, required }) => current < required);
    if (objective) {
      const maps = objectivePlaces(view, quest.questId, objective);
      return '目標：' + objectiveText(view, objective) + (maps ? '（' + maps + '）' : '') + '；完成後回報 ' + returnContact;
    }
    return '目標已完成，回報：' + returnContact;
  }
  return '已領取；' + returnContact;
}

function buildWorldEndingFeedback(document: Document, view: UiSnapshot, showSideQuestGuide: boolean): HTMLElement | null {
  if (!view.saveData) return null;
  const progress = deriveWorldProgress(view.saveData, view.questViews.map(({ questId }) => questId));
  if (!progress.worldComplete) return null;
  const card = makeElement(document, 'section', 'ms-journal-sheet is-claimed');
  const title = makeElement(document, 'header', 'ms-journal-heading');
  title.append(makeJournalIcon(document, 'quests'), makeElement(document, 'h3', '', '世界旅程已完成'), makeBadge(document, '歸途已回報', 'level'));
  card.append(title, makeElement(document, 'p', 'ms-journal-next', '你已回到木葉鎮向岩嶺教官完成「帶回歸途」。四區仍可自由往返、再次挑戰；這段旅程回顧可隨時在冒險手帳重看。'));

  if (showSideQuestGuide) {
    const unfinished = progress.unfinishedSideQuestIds
      .map((id) => view.questViews.find((quest) => quest.questId === id))
      .filter((quest): quest is UiSnapshot['questViews'][number] => quest !== undefined);
    const guide = makeElement(document, 'div', 'ms-quest-group');
    guide.append(makeSectionTitle(document, unfinished.length ? '尚未領取的支線' : '四區支線已全部領取'));
    if (unfinished.length) {
      for (const quest of unfinished) {
        const row = makeElement(document, 'div', 'ms-map-row');
        row.append(
          makeElement(document, 'strong', '', quest.title),
          makeBadge(document, JOURNAL_STATUS_LABELS[quest.status], quest.status === 'ready' ? 'level' : 'temporary'),
          makeElement(document, 'span', 'ms-panel-note', questNavigationCopy(view, quest)),
        );
        guide.append(row);
      }
    } else {
      guide.append(makeElement(document, 'p', 'ms-panel-note', '沒有尚未領取的支線；仍可自由探索四區及再次挑戰首領。'));
    }
    card.append(guide);
  }

  const actions = makeElement(document, 'div', 'ms-journal-contacts');
  actions.append(makeButton(document, '繼續探索地圖', 'open-panel', {
    className: 'ms-button ms-button--primary', data: { panel: 'map' },
  }));
  if (progress.unfinishedSideQuestIds.length) {
    actions.append(makeButton(document, '查看未完成支線', 'review-sidequest', {
      className: 'ms-button ms-button--secondary', data: { questId: progress.unfinishedSideQuestIds[0]! },
    }));
  }
  card.append(actions);
  return card;
}

function buildWorldJournal(document: Document, view: UiSnapshot, selectedQuestId: string | null, trackedQuestId: string | null): HTMLElement {
  const selectedQuest = chooseJournalQuest(view.questViews, selectedQuestId);
  const journal = buildVisualQuests(document, view, selectedQuest?.questId ?? null, (action) => questKeyText(view, action));
  const banner = journal.querySelector<HTMLElement>('.ms-quest-journey');
  if (banner) {
    const image = banner.querySelector<HTMLImageElement>('img');
    image?.remove();
    const text = banner.querySelector<HTMLElement>('.ms-quest-journey__title');
    if (text) {
      const progress = deriveWorldProgress(view.saveData, view.questViews.map(({ questId }) => questId));
      text.replaceChildren(
        makeElement(document, 'span', '', '木葉世界 · 霜雪群島 · 黃金沙海 · 遠古遺跡'),
        makeElement(document, 'strong', '', '四區冒險手帳'),
        makeElement(document, 'span', '', `已完成主線章節 ${progress.completedChapterCount} / ${progress.chapters.length}`),
      );
    }
  }
  journal.querySelector('.ms-quest-route')?.remove();
  const selectedCard = journal.querySelector<HTMLElement>('.ms-journal-sheet');
  if (!view.saveData || !selectedCard) return journal;
  if (selectedQuest && isTrackableQuest(selectedQuest)) {
    const actions = makeElement(document, 'div', 'ms-category-bar');
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', '任務操作');
    const tracked = trackedQuestId === selectedQuest.questId;
    const track = makeButton(document, tracked ? '停止指定追蹤' : '追蹤這項任務', 'track-quest', {
      title: tracked ? '恢復自動選擇追蹤任務' : '將此任務固定顯示在遊玩畫面的任務追蹤',
    });
    track.dataset.questId = selectedQuest.questId;
    track.dataset.focus = 'track-quest:' + selectedQuest.questId;
    track.setAttribute('aria-pressed', String(tracked));
    actions.append(track);

    const definition = view.catalog.world.quests[selectedQuest.questId];
    const remaining = selectedQuest.objectives.filter(({ current, required }) => current < required);
    const next = remaining[0];
    const destination = selectedQuest.status === 'available' ? { npcId: definition?.giverNpcId, text: '接取' }
      : selectedQuest.status === 'ready' ? { npcId: definition?.turnInNpcId, text: '回報' }
        : remaining.length === 1 && next?.type === 'inspect' ? { npcId: trialObjectiveTargetId(next.targetId), text: '目標' } : null;
    if (destination?.npcId) {
      const npcId = destination.npcId;
      const target = resolveNpcMapTarget(view.catalog.world, npcId);
      if (target) {
        const title = '查看' + destination.text + '地點：' + target.npcName + '位於「' + target.mapName + '」';
        const button = makeButton(document, '查看' + destination.text + '地點', 'review-npc-map', {
          className: 'ms-button ms-button--secondary',
          title,
          data: { npcId, focus: 'quest-location:' + selectedQuest.questId },
        });
        button.setAttribute('aria-label', title);
        actions.append(button);
      }
    } else {
      const target = resolveQuestMapTarget(view.catalog.world, view.saveData, selectedQuest);
      if (target) {
        const title = '查看目標區域：' + target.name;
        const button = makeButton(document, '地圖 · ' + target.name, 'review-quest-map', {
          className: 'ms-button ms-button--secondary', title,
          data: { questId: selectedQuest.questId, focus: 'quest-location:' + selectedQuest.questId },
        });
        button.setAttribute('aria-label', title);
        actions.append(button);
      }
    }
    if (actions.children.length === 1) {
      actions.append(makeButton(document, '查看世界地圖', 'open-panel', { data: { panel: 'map' } }));
    }
    selectedCard.querySelector('.ms-journal-heading')?.after(actions);
  } else {
    selectedCard.append(makeButton(document, '查看世界地圖', 'open-panel', {
      className: 'ms-button ms-journal-map-button', data: { panel: 'map' },
    }));
  }

  const progress = deriveWorldProgress(view.saveData, view.questViews.map(({ questId }) => questId));
  const ending = buildWorldEndingFeedback(document, view, true);
  if (ending) journal.append(ending);

  for (const group of groupWorldQuests(view.questViews)) {
    const section = makeElement(document, 'section', 'ms-quest-group');
    const note = group.kind === 'mainline'
      ? `${group.claimedCount} / ${group.quests.length} 已完成`
      : `${group.claimedCount} / ${group.quests.length} 已領取`;
    section.append(makeSectionTitle(document, group.label, note));
    const chapter = progress.chapters.find(({ id }) => id === group.id);
    if (chapter) {
      if (chapter.complete && chapter.nextMapId) {
        const nextMap = view.catalog.world.maps[chapter.nextMapId]?.name ?? chapter.nextMapId;
        const nextNpc = chapter.nextNpcId ? view.catalog.world.npcs[chapter.nextNpcId]?.name ?? chapter.nextNpcId : undefined;
        section.append(makeElement(document, 'p', 'ms-journal-next', '下一區入口：' + nextMap + (nextNpc ? '；沿路找' + nextNpc : '')));
      } else if (!chapter.complete) {
        const completionQuest = view.catalog.world.quests[chapter.completionQuestId ?? ''];
        section.append(makeElement(document, 'p', 'ms-panel-note', '章節收束：完成並手動領取「' + (completionQuest?.name ?? chapter.completionQuestId) + '」。'));
      } else if (progress.worldComplete) {
        section.append(makeElement(document, 'p', 'ms-journal-next', '四區主線已完成；可自由往返，並在上方回顧未完成支線。'));
      }
    }

    const route = makeElement(document, 'nav', 'ms-quest-route');
    route.setAttribute('aria-label', group.label);
    group.quests.forEach((quest) => {
      const index = group.questIds.indexOf(quest.questId);
      const stop = makeButton(document, '', 'select-quest', {
        className: 'ms-button ms-quest-stop is-' + quest.status,
        data: { questId: quest.questId },
      });
      const selected = quest.questId === selectedQuest?.questId;
      stop.classList.toggle('is-selected', selected);
      stop.setAttribute('aria-pressed', String(selected));
      stop.setAttribute('aria-label', quest.title + '，' + JOURNAL_STATUS_LABELS[quest.status]);
      stop.title = quest.title + ' · ' + JOURNAL_STATUS_LABELS[quest.status];
      stop.dataset.focus = 'select-quest:' + quest.questId;
      stop.append(
        makeElement(document, 'span', 'ms-quest-stop__number', quest.status === 'claimed' ? '✓' : quest.status === 'locked' ? '◇' : quest.questId.slice(1) || String(index + 1)),
        makeElement(document, 'span', '', quest.title),
      );
      route.append(stop);
    });
    section.append(route);
    journal.append(section);
  }

  if (selectedQuest && selectedQuest.reward.exp > 0
    && view.saveData.player.level >= view.catalog.rules.progression.maxLevel) {
    selectedCard.querySelector('.ms-journal-rewards')?.append(
      makeElement(document, 'span', 'ms-journal-reward-extra', '已達等級上限，EXP 不再累積'),
    );
  }
  return journal;
}

type PanelBuildState = {
  selectedBagIndex: number | null;
  selectedMapId: string | null;
  selectedMapFocus: LocalMapFocus | null;
  selectedQuestId: string | null;
  trackedQuestId: string | null;
  readingSize: ReadingSize;
  inventoryFilter: InventoryFilter;
  shopFilter: ShopFilter;
  shopQuantities: Map<string, number>;
  sellQuantities: Map<number, number>;
  bagStateMessage: string;
  pendingBinding: string | null;
  bindingMessage: string;
  bindingMessageAction: string | null;
};

function buildPanelContent(
  document: Document,
  view: UiSnapshot,
  panel: PanelId,
  state: PanelBuildState,
): HTMLElement {
  const content = makeElement(document, 'div', 'ms-panel-content ms-panel-content--' + panel);
  switch (panel) {
    case 'inventory':
      buildInventoryPanel(document, view, state, content);
      break;
    case 'equipment':
      buildEquipmentPanel(document, view, content);
      break;
    case 'skills':
      buildSkillsPanel(document, view, content);
      break;
    case 'stats':
      content.append(buildVisualStats(document, view));
      break;
    case 'quests':
      content.append(buildWorldJournal(document, view, state.selectedQuestId, state.trackedQuestId));
      break;
    case 'map':
      content.append(buildWorldMap(document, view, state.selectedMapId, state.selectedMapFocus, state.trackedQuestId));
      break;
    case 'shop':
      buildShopPanel(document, view, state, content);
      break;
    case 'dialogue':
      buildDialoguePanel(document, view, content);
      break;
    case 'settings':
      buildSettingsPanel(document, view, state, content);
      break;
  }
  return content;
}

function makeBagCapacity(document: Document, used: number): HTMLElement {
  const nearFull = BAG_CAPACITY - 4;
  const reading = '已用 ' + used + '／' + BAG_CAPACITY + ' 格';
  const capacity = makeElement(document, 'strong', used >= nearFull ? 'ms-bag-usage is-near-full' : 'ms-bag-usage');
  const label = makeElement(document, 'span', '', reading);
  label.setAttribute('aria-hidden', 'true');
  const meter = makeElement(document, 'meter', 'ms-bag-usage__meter');
  meter.min = 0;
  meter.max = BAG_CAPACITY;
  meter.high = nearFull - 1;
  meter.optimum = 0;
  meter.value = used;
  meter.setAttribute('aria-label', '背包容量');
  meter.setAttribute('aria-valuetext', reading);
  capacity.append(label, meter);
  return capacity;
}

function buildInventoryPanel(document: Document, view: UiSnapshot, state: PanelBuildState, parent: HTMLElement): void {
  const player = view.saveData?.player;
  if (!player) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '建立角色後即可使用背包。'));
    return;
  }
  const overview = makeElement(document, 'div', 'ms-inventory-overview');
  const note = makeElement(document, 'p', 'ms-panel-note');
  note.append(makeBagCapacity(document, player.bag.length));
  overview.append(note);
  const upgrades = new Set(wearableUpgradeIndices(view, player));
  if (upgrades.size > 0) {
    const shortcut = makeButton(document, '▲ 可升級裝備（' + upgrades.size + '）', 'select-bag-upgrade', {
      className: 'ms-chip ms-bag-upgrades', title: '查看下一件可升級裝備',
    });
    shortcut.setAttribute('aria-label', '查看下一件可升級裝備，共 ' + upgrades.size + ' 件');
    overview.append(shortcut);
  }
  parent.append(overview);
  if (state.bagStateMessage) {
    const resetNote = makeElement(document, 'p', 'ms-panel-note ms-bag-state-note', state.bagStateMessage);
    resetNote.setAttribute('role', 'status');
    parent.append(resetNote);
  }
  const counts = countInventoryEntries(player.bag, view.catalog.rules.items);
  const categoryBar = makeElement(document, 'div', 'ms-category-bar');
  categoryBar.setAttribute('role', 'group');
  categoryBar.setAttribute('aria-label', '背包分類');
  for (const category of INVENTORY_FILTERS) {
    const count = counts[category.id];
    const button = makeButton(document, category.label + '（' + count + '）', 'inventory-filter', {
      className: 'ms-chip' + (state.inventoryFilter === category.id ? ' is-active' : ''),
      data: { kind: category.id },
    });
    button.setAttribute('aria-pressed', String(state.inventoryFilter === category.id));
    button.dataset.focus = 'inventory-filter-' + category.id;
    button.setAttribute('aria-label', '背包分類：' + category.label + '，' + count + ' 組物品');
    categoryBar.append(button);
  }
  parent.append(categoryBar);

  const filtered = selectInventoryEntries(player.bag, view.catalog.rules.items, state.inventoryFilter);
  const trackedQuest = selectTrackerQuest(view.questViews, state.trackedQuestId);
  const trackedItems = new Set(trackedQuest?.status === 'active' || trackedQuest?.status === 'ready'
    ? trackedQuest.objectives.filter(({ type }) => type === 'collect' || type === 'equip').map(({ targetId }) => targetId)
    : []);
  parent.append(makeElement(document, 'p', 'ms-panel-note', '物品格取得焦點後，可用方向鍵切換選取；Home／End 跳至首末物品。'));
  const categoryLabel = INVENTORY_FILTERS.find(({ id }) => id === state.inventoryFilter)?.label ?? state.inventoryFilter;
  const selected = filtered.find(({ bagIndex }) => bagIndex === state.selectedBagIndex) ?? null;
  const layout = makeElement(document, 'div', 'ms-inventory-layout');
  const grid = makeElement(document, 'div', 'ms-bag-grid');
  grid.setAttribute('aria-label', state.inventoryFilter === 'all'
    ? '全部背包，顯示 ' + filtered.length + ' 組物品，共 ' + BAG_CAPACITY + ' 格'
    : '背包分類「' + categoryLabel + '」，顯示 ' + filtered.length + ' 組物品，共 ' + BAG_CAPACITY + ' 格');
  for (let index = 0; index < BAG_CAPACITY; index += 1) {
    const entry = filtered[index];
    if (!entry) {
      const empty = makeElement(document, 'div', 'ms-bag-slot ms-bag-slot--empty');
      empty.setAttribute('aria-label', (state.inventoryFilter === 'all' ? '空背包格 ' : '分類顯示空位 ') + (index + 1));
      empty.append(makeElement(document, 'span', 'ms-bag-slot__number', String(index + 1).padStart(2, '0')));
      grid.append(empty);
      continue;
    }
    const { stack, bagIndex, item } = entry;
    const slot = makeButton(document, '', 'select-bag', {
      className: 'ms-bag-slot' + (bagIndex === state.selectedBagIndex ? ' is-selected' : ''),
      title: item ? itemDetails(item) : '物品資料缺失：' + stack.itemId,
      data: { bagIndex: String(bagIndex) },
    });
    slot.setAttribute('aria-label', (item?.name ?? stack.itemId) + ' ×' + stack.quantity + '，背包第 ' + (bagIndex + 1) + ' 格');
    slot.setAttribute('aria-pressed', String(bagIndex === state.selectedBagIndex));
    slot.dataset.focus = 'bag-slot-' + bagIndex;
    slot.append(
      makeInterfaceIcon(document, view, item?.iconKey ?? '', item?.name ?? stack.itemId, 'ms-bag-slot__icon'),
      makeElement(document, 'span', 'ms-bag-slot__name', item?.name ?? stack.itemId),
    );
    // A lone item (gear, quest pieces) needs no count; only stacks get the corner badge.
    if (stack.quantity > 1) slot.append(makeElement(document, 'span', 'ms-bag-slot__quantity', '×' + stack.quantity));
    if (upgrades.has(bagIndex)) {
      const upgrade = makeElement(document, 'span', 'ms-bag-slot__upgrade', '▲');
      upgrade.title = '比目前裝備更好';
      slot.append(upgrade);
      slot.setAttribute('aria-label', slot.getAttribute('aria-label') + '，可升級裝備');
    }
    if (trackedQuest && trackedItems.has(stack.itemId)) {
      const badge = makeQuestCueBadge(document, 'item');
      badge.classList.add('ms-bag-slot__quest-cue');
      const task = '追蹤中的任務「' + trackedQuest.title + '」';
      slot.title += '\n' + task;
      slot.setAttribute('aria-label', slot.getAttribute('aria-label') + '，' + task);
      slot.append(badge);
    }
    grid.append(slot);
  }
  layout.append(grid);

  const detail = makeElement(document, 'aside', 'ms-item-detail');
  if (!selected) {
    if (player.bag.length === 0) {
      detail.append(
        makeElement(document, 'h3', '', '背包目前是空的'),
        makeElement(document, 'p', '', '探索並拾取物品後，物品會顯示在這裡。'),
      );
    } else if (filtered.length === 0) {
      detail.append(
        makeElement(document, 'h3', '', '此分類沒有物品'),
        makeElement(document, 'p', '', '可選擇上方「全部」分類查看背包中的其他物品。'),
      );
    } else {
      detail.append(
        makeElement(document, 'h3', '', '選取一件物品'),
        makeElement(document, 'p', '', '選取背包格後可查看需求、能力、價格，並使用、裝備或出售。'),
      );
    }
  } else {
    const { stack, bagIndex, item } = selected;
    const details = makeElement(document, 'pre', 'ms-detail-copy', item ? itemDetails(item) : '目前無此物品資料。');
    detail.append(
      makeInterfaceIcon(document, view, item?.iconKey ?? '', item?.name ?? stack.itemId, 'ms-item-detail__icon'),
      makeElement(document, 'h3', '', item?.name ?? stack.itemId),
      makeBadge(document, kindLabel(item?.kind ?? '未知'), 'category'),
    );
    if (!item?.slot) detail.append(makeElement(document, 'p', 'ms-detail-quantity', '數量 ×' + stack.quantity), details);
    if (item?.kind === 'quest') detail.append(makeElement(document, 'p', 'ms-warning', '任務物品不可出售。'));
    if (item?.kind === 'consumable') {
      const usePreview = resolveItemUse({
        player,
        rules: view.catalog.rules,
        requestedItemId: stack.itemId,
        nowMs: view.nowMs,
        potionReadyAtMs: view.potionReadyAtMs,
      });
      const useRecoverySummary = usePreview.ok
        ? 'HP ' + formatNumber(player.hp) + ' → ' + formatNumber(usePreview.value.player.hp)
          + '；MP ' + formatNumber(player.mp) + ' → ' + formatNumber(usePreview.value.player.mp)
        : '';
      const useButton = makeButton(document, '使用一個', 'use-item', {
        className: 'ms-button ms-button--primary',
        disabled: !usePreview.ok,
        title: usePreview.ok ? '使用一個：' + item.name + '；' + useRecoverySummary : usePreview.message,
        data: { itemId: stack.itemId, inventoryUse: 'true' },
      });
      useButton.setAttribute('aria-label', '使用一個：' + item.name);
      if (usePreview.ok) {
        const usePreviewNote = makeElement(document, 'p', 'ms-panel-note', '使用後預覽：' + useRecoverySummary);
        usePreviewNote.id = 'brightwood-first-oath-use-preview-' + bagIndex;
        useButton.setAttribute('aria-describedby', usePreviewNote.id);
        detail.append(usePreviewNote);
      }
      detail.append(useButton);
      if (!usePreview.ok) detail.append(makeElement(document, 'span', 'ms-disabled-reason', usePreview.message));
    }
    if (item?.slot) {
      const compare = makeEquipmentComparison(document, view, player, item);
      const equipmentPreview = previewEquipmentStats({
        player,
        rules: view.catalog.rules,
        action: { type: 'equip', bagIndex },
      });
      const equipmentSummary = equipmentPreview.ok ? formatEquipmentStatsPreview(equipmentPreview.value) : '';
      const equipButton = makeButton(document, '裝備', 'equip-bag', {
        className: 'ms-button ms-button--primary',
        disabled: !equipmentPreview.ok,
        title: equipmentPreview.ok ? '裝備' + item.name + '；' + equipmentSummary : equipmentPreview.message,
        data: { bagIndex: String(bagIndex) },
      });
      equipButton.setAttribute('aria-label', '裝備：' + item.name);
      detail.append(equipButton);
      if (compare) detail.append(compare);
      if (equipmentPreview.ok) {
        const equipmentPreviewNote = makeElement(document, 'p', 'ms-panel-note', '裝備後預覽：' + equipmentSummary);
        equipmentPreviewNote.id = 'brightwood-first-oath-equip-preview-' + bagIndex;
        equipButton.setAttribute('aria-describedby', equipmentPreviewNote.id);
        detail.append(equipmentPreviewNote);
      }
      if (!equipmentPreview.ok) detail.append(makeElement(document, 'span', 'ms-disabled-reason', equipmentPreview.message));
      detail.append(details);
    }
    if (item && item.kind !== 'quest' && item.sellPrice > 0) {
      const atMerchant = view.canTrade;
      const quantityValue = clampInteger(state.sellQuantities.get(bagIndex) ?? 1, 1, stack.quantity);
      const salePreview = previewSale({
        player,
        rules: view.catalog.rules,
        bagIndex,
        quantity: quantityValue,
        atMerchant,
      });
      const quantity = makeElement(document, 'input', 'ms-input ms-input--quantity');
      quantity.type = 'number';
      quantity.min = '1';
      quantity.max = String(stack.quantity);
      quantity.step = '1';
      quantity.value = String(salePreview.quantity);
      quantity.dataset.sellQuantity = String(bagIndex);
      quantity.dataset.focus = 'sell-quantity-' + bagIndex;
      quantity.setAttribute('aria-label', item.name + ' 出售數量');
      const saleNote = makeElement(document, 'p', 'ms-panel-note', '出售 ×' + salePreview.quantity + ' 可得 ' + formatNumber(salePreview.total) + ' 金幣');
      const sellButton = makeButton(document, '出售選取數量', 'sell-bag', {
        className: 'ms-button ms-button--secondary',
        disabled: salePreview.disabled,
        title: salePreview.reason ?? '出售所選數量，可得 ' + formatNumber(salePreview.total) + ' 金幣',
        data: { bagIndex: String(bagIndex) },
      });
      sellButton.setAttribute('aria-label', '出售選取數量：' + item.name + '，數量 ' + salePreview.quantity + '，收入 ' + formatNumber(salePreview.total) + ' 金幣');
      if (!salePreview.disabled) {
        saleNote.textContent += '；出售後預覽：金幣 ' + formatNumber(player.coins) + ' → ' + formatNumber(player.coins + salePreview.total);
        saleNote.id = 'brightwood-first-oath-inventory-sale-preview-' + bagIndex;
        sellButton.setAttribute('aria-describedby', saleNote.id);
      }
      detail.append(
        saleNote,
        quantity,
        sellButton,
      );
      if (salePreview.reason) detail.append(makeElement(document, 'span', 'ms-disabled-reason', salePreview.reason));
    }
  }
  layout.append(detail);
  parent.append(layout);
}

function buildEquipmentPanel(document: Document, view: UiSnapshot, parent: HTMLElement): void {
  const player = view.saveData?.player;
  if (!player) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '建立角色後即可管理裝備。'));
    return;
  }
  parent.append(makeElement(document, 'p', 'ms-panel-note', '裝備不佔背包格；卸下裝備時背包需要有空位。'));
  const grid = makeElement(document, 'div', 'ms-equipment-grid');
  for (const slot of ['weapon', 'body', 'hat'] as const) {
    const itemId = player.equipment[slot];
    const item = itemId ? view.catalog.rules.items[itemId] : null;
    const card = makeElement(document, 'section', 'ms-equipment-slot');
    card.append(
      makeElement(document, 'span', 'ms-eyebrow', slotLabel(slot)),
      makeInterfaceIcon(document, view, item?.iconKey ?? 'slot:normal', item?.name ?? slotLabel(slot) + '空槽', 'ms-equipment-slot__icon'),
      makeBadge(document, item ? '已裝備' : '空槽', item ? 'success' : 'neutral'),
      makeElement(document, 'h3', '', item?.name ?? '尚未裝備'),
      makeElement(document, 'pre', 'ms-detail-copy', item ? itemDetails(item) : '此裝備槽目前為空。'),
    );
    if (itemId) {
      const preview = previewEquipmentStats({
        player,
        rules: view.catalog.rules,
        action: { type: 'unequip', slot },
      });
      const summary = preview.ok ? formatEquipmentStatsPreview(preview.value) : '';
      const unequipButton = makeButton(document, '卸下' + slotLabel(slot), 'unequip', {
        className: 'ms-button ms-button--secondary',
        disabled: !preview.ok,
        title: preview.ok ? '卸下' + slotLabel(slot) + '；' + summary : preview.message,
        data: { slot },
      });
      unequipButton.setAttribute('aria-label', '卸下' + slotLabel(slot) + '：' + (item?.name ?? itemId));
      if (preview.ok) {
        const unequipPreviewNote = makeElement(document, 'p', 'ms-panel-note', '卸下後預覽：' + summary);
        unequipPreviewNote.id = 'brightwood-first-oath-unequip-preview-' + slot;
        unequipButton.setAttribute('aria-describedby', unequipPreviewNote.id);
        card.append(unequipPreviewNote);
      }
      card.append(unequipButton);
      if (!preview.ok) card.append(makeElement(document, 'span', 'ms-disabled-reason', preview.message));
    }
    grid.append(card);
  }
  parent.append(grid);
}

function buildSkillsPanel(document: Document, view: UiSnapshot, parent: HTMLElement): void {
  const player = view.saveData?.player;
  if (!player) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '建立角色後即可查看技能。'));
    return;
  }
  // Name the player's own skill keys (they may be rebound) and how much SP is left to spend.
  const bindings = view.saveData?.settings.bindings ?? {};
  const shortcuts = new Map(([1, 2, 3] as const).map((slot) =>
    [resolveSkillSlot(player, slot), effectiveKeyText(bindings, `skill${slot}`)]));
  const note = makeElement(document, 'p', 'ms-panel-note', '');
  note.append(
    makeElement(document, 'strong', '', '可用 SP：' + player.sp),
    document.createTextNode(player.job !== 'beginner' ? '。每次升級獲得 1 SP。' : '。正式轉職後，每次升級獲得 1 SP。'),
  );
  parent.append(note);
  const specialization = specializationPanel(document, player, view, shortcuts);
  if (specialization) parent.append(specialization);
  const grid = makeElement(document, 'div', 'ms-skill-list');
  const learnableSkills = jobs[effectiveJob(player)].learnableSkills;
  const skills = Object.values(view.catalog.rules.skills)
    .filter((skill) => learnableSkills.includes(skill.id))
    // Castable skills first, in quickbar order (1 重斬, 2 橫掃, 3 堅韌守護), then passives.
    .sort((a, b) => Number(a.kind === 'passive') - Number(b.kind === 'passive')
      || a.requiredLevel - b.requiredLevel || a.id.localeCompare(b.id));
  for (const skill of skills) {
    const rank = player.skillRanks[skill.id] ?? 0;
    const learned = rank > 0;
    const rankReady = rank < skill.maxRank;
    const learningPreview = previewSkillLearning({ player, rules: view.catalog.rules, skillId: skill.id });
    const reason = learningPreview.ok ? '' : learningPreview.message;
    const card = makeElement(document, 'article', 'ms-skill-card');
    const head = makeElement(document, 'div', 'ms-skill-card__head');
    const heading = makeElement(document, 'h3', '', skill.name);
    heading.id = 'brightwood-first-oath-skill-heading-' + skill.id;
    heading.dataset.focus = 'skill-heading-' + skill.id;
    heading.tabIndex = -1;
    const shortcut = shortcuts.get(skill.id);
    head.append(
      makeInterfaceIcon(document, view, 'skill:' + skill.id, skill.name, 'ms-skill-card__icon'),
      heading,
      shortcut ? makeElement(document, 'kbd', 'ms-skill-card__key', shortcut)
        : makeBadge(document, skill.kind === 'passive' ? '被動' : '未配置', 'neutral'),
      makeBadge(document, '等級 ' + rank + '/' + skill.maxRank, learned ? 'level' : 'neutral'),
    );
    // The badge above already shows 等級 N/M, so the detail line leaves it out.
    card.append(head, makeElement(document, 'p', 'ms-detail-copy', skillDetails(skill, rank, false)));
    const preview = skillNextRankPreview(skill, rank);
    if (preview) card.append(makeElement(document, 'p', 'ms-skill-card__next', preview));
    if (skill.requiredJob === 'rogue' && skill.kind !== 'passive') card.append(makeElement(document,'p','ms-panel-note','地面出招、收招後才可移動；受擊取消未發生段落，已花MP不退回。煙幕不清除首領仇恨。'));
    if (skill.id === 'archer-steady-aim') card.append(makeElement(document,'p','ms-panel-note','站穩不動600ms後就緒；下一次射擊只強化第一個有效命中。移動、跳躍、攀爬、受擊或射擊會消耗／中斷。'));
    if (skill.id === 'archer-retreat-shot') card.append(makeElement(document,'p','ms-panel-note','需要地面及身後空間，後撤最多100；受地形阻擋，不提供無敵。'));
    if (skill.requiredJob === 'mage' && skill.kind !== 'passive') card.append(makeElement(document,'p','ms-panel-note','地面施法，前搖期間站定；受擊取消未完成的法術，已消耗MP不退回。'));
    if (skill.id === 'mage-mana-affinity') card.append(makeElement(document,'p','ms-panel-note','連續3秒沒有攻擊或受傷後開始回魔；暫停不累積。提升上限不會自動補滿MP。'));
    if (skill.id === 'vitality') card.append(makeElement(document, 'p', 'ms-panel-note', '提升最大 HP；不會自動恢復生命。'));
    if (skill.id === 'rest-recovery') card.append(makeElement(document, 'p', 'ms-panel-note', '連續 3 秒沒有攻擊或受傷時，開始逐步恢復生命。'));
    const actionLabel = !rankReady ? '已滿級' : learned ? '提升至等級 ' + (rank + 1) : '學習技能';
    const learningSummary = learningPreview.ok
      ? '學習後：SP ' + formatNumber(player.sp) + ' → ' + formatNumber(learningPreview.value.remainingSp)
        + (learningPreview.value.before.maxHp !== learningPreview.value.after.maxHp
          ? '；最大 HP ' + formatNumber(learningPreview.value.before.maxHp) + ' → ' + formatNumber(learningPreview.value.after.maxHp)
          : '')
        + (learningPreview.value.before.maxMp !== learningPreview.value.after.maxMp
          ? '；最大 MP ' + formatNumber(learningPreview.value.before.maxMp) + ' → ' + formatNumber(learningPreview.value.after.maxMp) : '')
      : '';
    const actionButton = makeButton(document, actionLabel, 'learn-skill', {
      className: 'ms-button ms-button--primary',
      disabled: Boolean(reason),
      title: learningPreview.ok ? '消耗 1 SP 學習或提升技能；' + learningSummary : learningPreview.message,
      data: { skillId: skill.id },
    });
    actionButton.setAttribute('aria-label', actionLabel + '：' + skill.name + '，目前等級 ' + rank + '/' + skill.maxRank);
    if (learningPreview.ok) {
      const skillPreviewNote = makeElement(document, 'p', 'ms-panel-note', learningSummary);
      skillPreviewNote.id = 'brightwood-first-oath-skill-preview-' + skill.id;
      actionButton.setAttribute('aria-describedby', skillPreviewNote.id);
      card.append(skillPreviewNote);
    }
    card.append(actionButton);
    // The 已滿級 button already says it; only explain blockers the player can act on.
    if (reason && rankReady) card.append(makeElement(document, 'span', 'ms-disabled-reason', reason));
    grid.append(card);
  }
  parent.append(grid);
}

function buildShopPanel(document: Document, view: UiSnapshot, state: PanelBuildState, parent: HTMLElement): void {
  const player = view.saveData?.player;
  if (!player) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '建立角色後即可使用商店。'));
    return;
  }
  const atMerchant = view.canTrade;
  parent.append(makeElement(document, 'p', 'ms-panel-note', atMerchant
    ? '歡迎光臨！需要藥水或新裝備嗎？'
    : '請先靠近木葉商人並互動，再進行購買。'));
  if (!atMerchant) {
    const mapTarget = resolveNpcMapTarget(view.catalog.world, 'merchant');
    if (mapTarget) {
      const announcement = '查看商人所在地圖：' + mapTarget.npcName + ' 位於「' + mapTarget.mapName + '」。只查看地圖，不會移動角色。';
      const mapButton = makeButton(document, '查看商人所在地圖', 'review-npc-map', {
        className: 'ms-button ms-button--secondary',
        title: announcement,
        data: { npcId: 'merchant', focus: 'shop-merchant-map' },
      });
      mapButton.setAttribute('aria-label', announcement);
      parent.append(mapButton);
    }
  }
  if (state.bagStateMessage) {
    const resetNote = makeElement(document, 'p', 'ms-panel-note ms-bag-state-note', state.bagStateMessage);
    resetNote.setAttribute('role', 'status');
    parent.append(resetNote);
  }
  parent.append(makeElement(document, 'p', 'ms-wallet', '持有金幣：' + formatNumber(player.coins)));
  const capacityNote = makeElement(document, 'p', 'ms-panel-note');
  capacityNote.append(
    document.createTextNode('背包：'),
    makeBagCapacity(document, player.bag.length),
    document.createTextNode('。可堆疊物品可補入同類未滿堆疊；能否購買依各貨品提示。'),
  );
  parent.append(capacityNote);
  const offers = selectShopOffers(view.catalog.rules.items, state.shopFilter,player);
  const grid = makeElement(document, 'div', 'ms-shop-grid');
  for (const item of offers) {
    const stackable = item.stackLimit > 1;
    const quantity = stackable ? clampInteger(state.shopQuantities.get(item.id) ?? 1, 1, 99) : 1;
    const preview = previewBuy({ player, rules: view.catalog.rules, itemId: item.id, quantity, atMerchant });
    const card = makeElement(document, 'article', 'ms-shop-card');
    // Flag gear the hero cannot wear yet or already owns, so nobody spends 1,800 金幣 on a duplicate.
    const badges = makeElement(document, 'div', 'ms-shop-card__badges');
    badges.append(makeBadge(document, kindLabel(item.kind), 'category'));
    if (item.slot) {
      badges.append(makeBadge(document,equipmentJobLabel(item),'neutral'));
      const owned = Object.values(player.equipment).includes(item.id) || player.bag.some((stack) => stack.itemId === item.id);
      if (player.level < item.minLevel) badges.append(makeBadge(document, 'Lv.' + item.minLevel + ' 才能裝備', 'warning'));
      if (owned) badges.append(makeBadge(document, '已擁有', 'neutral'));
      else if (isWearableUpgrade(view, player, item)) badges.append(makeBadge(document, '▲ 可升級', 'success'));
    } else if (stackable) {
      // Show the potions already carried so restocking doesn't need a trip to the bag panel.
      const carried = player.bag.reduce((sum, stack) => sum + (stack.itemId === item.id ? stack.quantity : 0), 0);
      badges.append(makeBadge(document, '持有 ×' + carried, 'neutral'));
    }
    card.append(
      makeInterfaceIcon(document, view, item.iconKey, item.name, 'ms-shop-card__icon'),
      badges,
      makeElement(document, 'h4', '', item.name),
      // The card already shows 單價 below, so drop the duplicate 買價 line from the shared details.
      makeElement(document, 'pre', 'ms-detail-copy', itemDetails(item).split('\n').filter((line) => !line.startsWith('買價')).join('\n')),
      makeElement(document, 'span', 'ms-shop-card__price', '單價 ' + formatNumber(item.buyPrice) + ' 金幣'),
    );
    if (item.slot) {
      const compare = makeEquipmentComparison(document, view, player, item);
      if (compare) card.append(compare);
    }
    // Equipment does not stack (each piece takes a bag slot), so only consumables get a quantity box.
    if (stackable) {
      const quantityRow = makeElement(document, 'label', 'ms-quantity-row');
      quantityRow.append(makeElement(document, 'span', '', '數量 1–99'));
      const input = makeElement(document, 'input', 'ms-input ms-input--quantity');
      input.type = 'number';
      input.min = '1';
      input.max = '99';
      input.step = '1';
      input.value = String(preview.quantity);
      input.dataset.shopQuantity = item.id;
      input.dataset.focus = 'shop-quantity-' + item.id;
      input.setAttribute('aria-label', item.name + ' 購買數量');
      quantityRow.append(input);
      card.append(quantityRow);
      const quantityOnePreview = previewBuy({ player, rules: view.catalog.rules, itemId: item.id, quantity: 1, atMerchant });
      const maxBuyButton = makeButton(document, '選擇最大可買量', 'select-max-buy', {
        className: 'ms-button ms-button--secondary',
        disabled: quantityOnePreview.disabled,
        title: quantityOnePreview.reason ?? '依目前金幣與背包空間設定數量，最多99；不會立即購買。',
        data: { itemId: item.id },
      });
      maxBuyButton.setAttribute('aria-label', '選擇最大可買量：' + item.name);
      maxBuyButton.dataset.focus = 'shop-max-' + item.id;
      card.append(maxBuyButton);
    }
    card.append(makeElement(document, 'strong', 'ms-shop-card__total', '總價 ' + formatNumber(preview.total) + ' 金幣'));
    const buyButton = makeButton(document, '購買', 'buy', {
      className: 'ms-button ms-button--primary',
      disabled: preview.disabled,
      title: preview.reason || '購買 ' + preview.quantity + ' 個，總價 ' + preview.total + ' 金幣',
      data: { itemId: item.id },
    });
    buyButton.setAttribute('aria-label', '購買：' + item.name + '，數量 ' + preview.quantity + '，總價 ' + formatNumber(preview.total) + ' 金幣');
    if (!preview.disabled) {
      const buyPreviewNote = makeElement(
        document,
        'p',
        'ms-panel-note',
        '購買後預覽：金幣 ' + formatNumber(player.coins) + ' → ' + formatNumber(player.coins - preview.total),
      );
      buyPreviewNote.id = 'brightwood-first-oath-buy-preview-' + item.id;
      buyButton.setAttribute('aria-describedby', buyPreviewNote.id);
      card.append(buyPreviewNote);
    }
    card.append(buyButton);
    if (preview.reason) card.append(makeElement(document, 'span', 'ms-disabled-reason', preview.reason));
    grid.append(card);
  }
  parent.append(makeSectionTitle(document, '商店貨品'));
  const categoryBar = makeElement(document, 'div', 'ms-category-bar');
  categoryBar.setAttribute('role', 'group');
  categoryBar.setAttribute('aria-label', '商店貨品分類');
  for (const category of SHOP_FILTERS) {
    const count = selectShopOffers(view.catalog.rules.items, category.id,player).length;
    const button = makeButton(document, category.label + '（' + count + '）', 'shop-filter', {
      className: 'ms-chip' + (state.shopFilter === category.id ? ' is-active' : ''),
      data: { kind: category.id },
    });
    button.dataset.focus = 'shop-filter-' + category.id;
    button.setAttribute('aria-label', '商店分類：' + category.label + '，' + count + ' 件貨品');
    button.setAttribute('aria-pressed', String(state.shopFilter === category.id));
    categoryBar.append(button);
  }
  parent.append(categoryBar);
  const categoryLabel = SHOP_FILTERS.find(({ id }) => id === state.shopFilter)?.label ?? state.shopFilter;
  parent.append(makeElement(
    document,
    'p',
    'ms-panel-note',
    '目前分類「' + categoryLabel + '」共 ' + offers.length + ' 件貨品。只篩選購買貨品，出售清單維持全部。',
  ));
  if (offers.length === 0) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '目前分類沒有可購買貨品。'));
  }
  parent.append(grid);

  const sellable = player.bag
    .map((stack, bagIndex) => ({ stack, bagIndex, item: view.catalog.rules.items[stack.itemId] }))
    .filter(({ item }) => item && item.kind !== 'quest' && item.sellPrice > 0);
  const sellSection = makeElement(document, 'section', 'ms-sell-section');
  sellSection.append(makeSectionTitle(document, '出售背包物品'));
  // Monster materials have no other use; selling them stack by stack was tedious.
  const materialSalePreview = previewMaterialSale({ player, rules: view.catalog.rules, atMerchant });
  if (materialSalePreview.actions.length > 0) {
    const allMaterialsSell = materialSalePreview.expectedSoldStacks === materialSalePreview.candidateStacks;
    const label = allMaterialsSell
      ? '出售全部素材（預計收入 +' + formatNumber(materialSalePreview.expectedProceeds) + ' 金幣）'
      : materialSalePreview.expectedSoldStacks > 0
        ? '依序出售素材（預計收入 +' + formatNumber(materialSalePreview.expectedProceeds) + ' 金幣）'
        : '出售全部素材';
    const materialSaleButton = makeButton(document, label, 'sell-materials', {
      className: 'ms-button ms-button--primary',
      disabled: materialSalePreview.disabled,
      title: materialSalePreview.reason ?? '一次出售背包中所有怪物素材；預計收入 ' + formatNumber(materialSalePreview.expectedProceeds) + ' 金幣',
    });
    sellSection.append(materialSaleButton);
    if (materialSalePreview.expectedSoldStacks > 0) {
      const materialSalePreviewNote = makeElement(
        document,
        'p',
        'ms-panel-note',
        '出售後預覽：背包已用 ' + formatNumber(player.bag.length) + '／' + BAG_CAPACITY + ' → ' +
          formatNumber(player.bag.length - materialSalePreview.expectedSoldStacks) + '／' + BAG_CAPACITY + ' 格；騰出 ' +
          formatNumber(materialSalePreview.expectedSoldStacks) + ' 格。 金幣預覽：' +
          formatNumber(player.coins) + ' → ' + formatNumber(player.coins + materialSalePreview.expectedProceeds) + '。',
      );
      materialSalePreviewNote.id = 'brightwood-first-oath-material-sale-preview';
      materialSaleButton.setAttribute('aria-describedby', materialSalePreviewNote.id);
      sellSection.append(materialSalePreviewNote);
    }
    if (materialSalePreview.expectedSoldStacks > 0 && materialSalePreview.expectedRejectedStacks > 0) {
      sellSection.append(makeElement(
        document,
        'p',
        'ms-panel-note',
        '預計成交 ' + materialSalePreview.expectedSoldStacks + '／' + materialSalePreview.candidateStacks + ' 組',
      ));
    }
    if (materialSalePreview.reason) {
      sellSection.append(makeElement(document, 'span', 'ms-disabled-reason', materialSalePreview.reason));
    }
  }
  if (sellable.length === 0) sellSection.append(makeElement(document, 'p', 'ms-empty-state', '目前沒有可出售物品。'));
  for (const { stack, bagIndex, item } of sellable) {
    if (!item) continue;
    const quantity = clampInteger(state.sellQuantities.get(bagIndex) ?? 1, 1, stack.quantity);
    const preview = previewSale({
      player,
      rules: view.catalog.rules,
      bagIndex,
      quantity,
      atMerchant,
    });
    const row = makeElement(document, 'div', 'ms-sell-row');
    const price = makeElement(document, 'span', '', '賣價 ' + formatNumber(item.sellPrice) + '／個・合計 ' + formatNumber(preview.total));
    if (!preview.disabled) {
      price.textContent += '；出售後預覽：金幣 ' + formatNumber(player.coins) + ' → ' + formatNumber(player.coins + preview.total);
      price.id = 'brightwood-first-oath-shop-sale-preview-' + bagIndex;
    }
    row.append(
      makeInterfaceIcon(document, view, item.iconKey, item.name, 'ms-sell-row__icon'),
      makeElement(document, 'strong', '', item.name + ' ×' + stack.quantity),
      price,
    );
    const input = makeElement(document, 'input', 'ms-input ms-input--quantity');
    input.type = 'number';
    input.min = '1';
    input.max = String(stack.quantity);
    input.step = '1';
    input.value = String(preview.quantity);
    input.dataset.sellQuantity = String(bagIndex);
    input.dataset.focus = 'shop-sell-quantity-' + bagIndex;
    input.setAttribute('aria-label', item.name + ' 出售數量');
    const sellButton = makeButton(document, '出售', 'sell-bag', {
      className: 'ms-button ms-button--secondary',
      disabled: preview.disabled,
      title: preview.reason ?? '出售所選數量，可得 ' + formatNumber(preview.total) + ' 金幣',
      data: { bagIndex: String(bagIndex) },
    });
    sellButton.setAttribute('aria-label', '出售：' + item.name + '，數量 ' + preview.quantity + '，收入 ' + formatNumber(preview.total) + ' 金幣');
    if (!preview.disabled) sellButton.setAttribute('aria-describedby', price.id);
    row.append(input, sellButton);
    if (preview.reason) row.append(makeElement(document, 'span', 'ms-disabled-reason', preview.reason));
    sellSection.append(row);
  }
  parent.append(sellSection);
}

function makeDialogueObjectives(document: Document, view: UiSnapshot, quest: UiSnapshot['questViews'][number]): HTMLElement {
  const list = makeElement(document, 'ul', 'ms-dialogue-objectives');
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', quest.status === 'active' ? '任務進度' : '任務目標');
  for (const objective of quest.objectives) {
    const complete = objective.current >= objective.required;
    const entry = makeElement(document, 'li', complete ? 'is-complete' : '');
    const count = (complete ? '✓ ' : '') + objectiveCount(objective);
    entry.append(makeObjectiveGuideRow(document, view, quest.questId, objective, count));
    list.append(entry);
  }
  return list;
}

function buildDialoguePanel(document: Document, view: UiSnapshot, parent: HTMLElement): void {
  const interaction = view.interaction;
  if (!interaction) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '目前沒有正在進行的 NPC 對話。靠近 NPC 後按互動。'));
    return;
  }
  const npc = view.catalog.world.npcs[interaction.npcId];
  // A bust cut from the NPC's idle sheet (first frame, top half) so the panel shows who is talking.
  const head = makeElement(document, 'div', 'ms-dialogue-head');
  const sheet = npc ? view.actorManifest?.images.find((image) => image.key === npc.actorKey) : undefined;
  if (sheet) {
    const portrait = makeElement(document, 'div', 'ms-dialogue-portrait');
    portrait.style.backgroundImage = 'url("' + new URL(sheet.url, document.baseURI).href + '")';
    portrait.style.backgroundSize = (sheet.columns * 200) + '% ' + (sheet.rows * 200) + '%';
    portrait.setAttribute('aria-hidden', 'true');
    head.append(portrait);
  }
  head.append(makeElement(document, 'h3', '', npc?.name ?? interaction.npcId));
  parent.append(head);
  const relevant = view.questViews.filter((quest) => {
    const definition = view.catalog.world.quests[quest.questId];
    if (!definition) return false;
    return (quest.status === 'available' && definition.giverNpcId === interaction.npcId)
      || (quest.status === 'ready' && definition.turnInNpcId === interaction.npcId)
      || (quest.status === 'active' && definition.giverNpcId === interaction.npcId);
  });
  const questNpcText = (quest: UiSnapshot['questViews'][number]): string => {
    const definition = view.catalog.world.quests[quest.questId]!;
    return quest.status === 'ready' ? definition.completeText
      : quest.status === 'active' ? definition.progressText
        : definition.acceptText;
  };
  // The quest card below already quotes the NPC's quest line; don't print it twice.
  const shownInCards = new Set(relevant.map(questNpcText));
  const lines = makeElement(document, 'div', 'ms-dialogue-lines');
  for (const line of interaction.dialogue) {
    if (!shownInCards.has(line)) lines.append(makeElement(document, 'p', '', line));
  }
  parent.append(lines);
  if (interaction.npcId === 'mentor') {
    const ending = buildWorldEndingFeedback(document, view, false);
    if (ending) parent.append(ending);
  }
  if (interaction.npcId === 'ruins-stele-west' || interaction.npcId === 'ruins-stele-east') {
    const quest = view.questViews.find(({ questId }) => questId === 'q17');
    if (view.saveData?.quests.q17?.status === 'active') {
      const objective = quest?.objectives.find(({ targetId, type }) => type === 'inspect' && targetId === interaction.npcId);
      const tuned = objective !== undefined && objective.current >= objective.required;
      parent.append(makeElement(document, 'p', 'ms-panel-note', tuned ? '這塊石碑已留下調律回聲。' : '確認調律後，這塊石碑的記錄便會清晰。'));
      parent.append(makeButton(document, '調律石碑', 'inspect-stele', {
        className: 'ms-button ms-button--primary',
        data: { targetId: interaction.npcId, focus: 'dialogue-inspect-' + interaction.npcId },
      }));
    }
  }
  if (interaction.npcId === 'frost-route-marker' && view.saveData?.quests.q21?.status === 'active') {
    const quest = view.questViews.find(({ questId }) => questId === 'q21');
    const objective = quest?.objectives.find(({ targetId, type }) => type === 'inspect' && targetId === 'frost-route-marker');
    const inspected = objective !== undefined && objective.current >= objective.required;
    parent.append(makeElement(document, 'p', 'ms-panel-note', inspected
      ? '航標方向已記錄。回雪痕海岸找雪芽報告。'
      : '沿霜松隘道梯路登上高台，調查航標一次，再回雪痕海岸找雪芽報告。'));
    if (!inspected) {
      parent.append(makeButton(document, '調查航標', 'inspect-route-marker', {
        className: 'ms-button ms-button--primary',
      }));
    }
  }
  if (interaction.npcId === 'merchant') parent.append(makeButton(document, '開啟商店', 'open-panel', {
    className: 'ms-button ms-button--primary', data: { panel: 'shop', focus: 'dialogue-open-shop' },
  }));
  if (interaction.npcId === 'healer') {
    parent.append(makeElement(document, 'p', 'ms-panel-note', '與晨露互動可在城鎮免費恢復 HP／MP。'));
  }

  if (relevant.length > 0) parent.append(makeSectionTitle(document, '任務對話'));
  for (const quest of relevant) {
    const definition = view.catalog.world.quests[quest.questId];
    if (!definition) continue;
    const card = makeElement(document, 'article', 'ms-dialogue-quest');
    const npcText = questNpcText(quest);
    card.append(
      makeElement(document, 'h4', '', quest.title),
      makeElement(document, 'p', 'ms-detail-copy', npcText),
      makeElement(document, 'p', 'ms-panel-note', definition.summary),
    );
    if (quest.status === 'available') {
      card.append(makeDialogueObjectives(document, view, quest));
      card.append(buildQuestRewards(document, view, quest, 'h5'));
      const acceptButton = makeButton(document, '接取任務', 'accept-quest', {
        className: 'ms-button ms-button--primary',
        data: { questId: quest.questId, focus: 'dialogue-accept-' + quest.questId },
      });
      acceptButton.setAttribute('aria-label', '接取任務：' + quest.title);
      card.append(acceptButton);
    } else if (quest.status === 'ready') {
      card.append(buildQuestRewards(document, view, quest, 'h5'));
      const claimPreview = view.saveData
        ? resolveQuestClaim(view.saveData, quest.questId, view.catalog)
        : null;
      const claimReason = claimPreview?.ok === false
        ? claimPreview.message || '目前無法領取任務獎勵'
        : claimPreview === null ? '目前無法領取任務獎勵' : '';
      const claimButton = makeButton(document, '領取任務獎勵', 'claim-quest', {
        className: 'ms-button ms-button--primary',
        disabled: !claimPreview?.ok,
        title: claimReason || '領取任務獎勵',
        data: { questId: quest.questId, focus: 'dialogue-claim-' + quest.questId },
      });
      claimButton.setAttribute('aria-label', '領取任務獎勵：' + quest.title);
      card.append(claimButton);
      if (claimReason) card.append(makeElement(document, 'span', 'ms-disabled-reason', claimReason));
      if (claimPreview?.ok === false && claimPreview.code === 'BAG_FULL') {
        const bag = makeButton(document, '', 'open-panel', {
          className: 'ms-button ms-button--small ms-context-button',
          data: { panel: 'inventory', focus: 'dialogue-claim-bag-' + quest.questId },
        });
        bag.append(makeJournalIcon(document, 'inventory'), document.createTextNode('整理背包'));
        card.append(bag);
      }
    } else {
      card.append(makeDialogueObjectives(document, view, quest));
    }
    parent.append(card);
  }
  const player = view.saveData?.player;
  if (player && view.nearSpecializationMentor && specializationMentors[effectiveJob(player)] === interaction.npcId) {
    parent.append(makeButton(document, '查看二轉分支', 'review-specialization', {
      className: 'ms-button ms-button--primary',
      data: { focus: 'dialogue-review-specialization' },
    }));
  }
}

function buildReadingChoices(document: Document, size: ReadingSize): HTMLElement {
  const readingChoices = makeElement(document, 'div', 'ms-category-bar');
  readingChoices.classList.add('ms-reading-options');
  readingChoices.setAttribute('role', 'group');
  readingChoices.setAttribute('aria-label', '閱讀字級');
  for (const [choice, label] of [['standard', '標準字級'], ['large', '較大字級']] as const) {
    const button = makeButton(document, label, 'settings-reading-size', {
      className: 'ms-chip' + (size === choice ? ' is-active' : ''),
      data: { readingSize: choice },
    });
    button.setAttribute('aria-pressed', String(size === choice));
    button.dataset.focus = 'reading-size:' + choice;
    readingChoices.append(button);
  }
  return readingChoices;
}

function buildSettingsPanel(document: Document, view: UiSnapshot, state: PanelBuildState, parent: HTMLElement): void {
  const attackChoices = makeElement(document, 'div', 'ms-category-bar ms-reading-options');
  attackChoices.setAttribute('role', 'group'); attackChoices.setAttribute('aria-label', '普通攻擊操作');
  for (const [enabled, label] of [[false, '按一下施放'], [true, '按住連續攻擊']] as const) {
    const button = makeButton(document, label, 'settings-hold-attack', {
      className: 'ms-chip' + ((view.holdBasicAttack ?? false) === enabled ? ' is-active' : ''), data: { holdAttack: String(enabled) },
    });
    button.setAttribute('aria-pressed', String((view.holdBasicAttack ?? false) === enabled));
    button.dataset.focus = 'hold-attack:' + String(enabled);
    attackChoices.append(button);
  }
  parent.append(makeSectionTitle(document, '普通攻擊操作'), attackChoices,
    makeElement(document, 'p', 'ms-panel-note', '只影響鍵盤普通攻擊；連續攻擊遵守原本的冷卻與動作時間。技能仍按一下施放。'));
  const settings = view.saveData?.settings;
  parent.append(makeSectionTitle(document, '閱讀字級'), buildReadingChoices(document, state.readingSize),
    makeElement(document, 'p', 'ms-panel-note', '放大對話、任務說明與操作提示的文字，保留遊戲畫面的比例。'));
  const backgroundChoices = makeElement(document, 'div', 'ms-category-bar ms-reading-options');
  backgroundChoices.setAttribute('role', 'group'); backgroundChoices.setAttribute('aria-label', '背景視差');
  for (const [enabled, label] of [[true, '跟隨移動'], [false, '保持靜止']] as const) {
    const button = makeButton(document, label, 'settings-background-motion', {
      className: 'ms-chip' + ((view.backgroundMotion ?? true) === enabled ? ' is-active' : ''), data: { backgroundMotion: String(enabled) },
    });
    button.setAttribute('aria-pressed', String((view.backgroundMotion ?? true) === enabled));
    button.dataset.focus = 'background-motion:' + String(enabled); backgroundChoices.append(button);
  }
  parent.append(makeSectionTitle(document, '背景視差'), backgroundChoices,
    makeElement(document, 'p', 'ms-panel-note', '選擇遠近背景是否隨探索產生視差移動；未設定時採用系統減少動態效果偏好。'));
  if (!settings) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '建立角色後可調整音量與操作按鍵。'));
    return;
  }
  parent.append(makeElement(document, 'p', 'ms-panel-note', 'Esc 固定用來關閉最上層面板，沒有面板時則暫停遊戲，因此不能重新綁定。'));
  const muteButton = makeButton(document, settings.muted ? '開啟音效' : '靜音', 'settings-mute', {
    className: 'ms-button ms-button--secondary',
    title: settings.muted ? '開啟遊戲音效' : '靜音所有遊戲音效',
  });
  muteButton.setAttribute('aria-describedby', 'brightwood-first-oath-audio-settings-note');
  parent.append(muteButton);
  let audioSettingsNoteText: string;
  if (settings.muted) {
    audioSettingsNoteText = '目前已靜音；調整音量不會解除靜音，可按「開啟音效」。';
  } else if (settings.masterVolume === 0) {
    audioSettingsNoteText = '總音量為 0%；如需聲音，請調高總音量。';
  } else if (settings.musicVolume === 0 && settings.sfxVolume === 0) {
    audioSettingsNoteText = '音樂與音效音量均為 0%；可分別調高需要的音量。';
  } else if (settings.musicVolume === 0) {
    audioSettingsNoteText = '音樂音量為 0%；音效保留目前設定。';
  } else if (settings.sfxVolume === 0) {
    audioSettingsNoteText = '音效音量為 0%；音樂保留目前設定。';
  } else {
    audioSettingsNoteText = '總音量會共同控制音樂與音效；靜音不會清除滑桿設定。';
  }
  const audioSettingsNote = makeElement(document, 'p', 'ms-panel-note', audioSettingsNoteText);
  audioSettingsNote.id = 'brightwood-first-oath-audio-settings-note';
  parent.append(audioSettingsNote);
  const volumeGrid = makeElement(document, 'div', 'ms-volume-grid');
  const channels: { id: 'masterVolume' | 'musicVolume' | 'sfxVolume'; label: string }[] = [
    { id: 'masterVolume', label: '總音量' },
    { id: 'musicVolume', label: '音樂音量' },
    { id: 'sfxVolume', label: '音效音量' },
  ];
  for (const channel of channels) {
    const label = makeElement(document, 'label', 'ms-volume-control');
    label.append(controlImage(document, channel.id === 'musicVolume' ? 'music' : channel.id === 'sfxVolume' ? 'sfx' : 'volume-on'), makeElement(document, 'span', '', channel.label + ' ' + Math.round(settings[channel.id] * 100) + '%'));
    const slider = makeElement(document, 'input', 'ms-range');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.05';
    slider.value = String(settings[channel.id]);
    slider.dataset.settingsChannel = channel.id;
    slider.dataset.settingsLabel = channel.label;
    slider.dataset.focus = 'volume-' + channel.id;
    slider.setAttribute('aria-label', channel.label);
    slider.setAttribute('aria-valuetext', Math.round(settings[channel.id] * 100) + '%');
    slider.setAttribute('aria-describedby', 'brightwood-first-oath-audio-settings-note');
    label.append(slider);
    volumeGrid.append(label);
  }
  parent.append(volumeGrid, makeSectionTitle(document, '桌面操作說明'));
  const help = makeElement(document, 'ul', 'ms-help-list');
  const skillKeys = (['skill1', 'skill2', 'skill3'] as const)
    .map((action) => effectiveKeyText(settings.bindings, action))
    .join('／');
  const helpText = [
    '用鍵盤移動、跳躍與戰鬥；畫面上的按鈕也可以用滑鼠點擊。',
    '按住拾取鍵可以連續撿起附近的掉落物。',
    '背包／裝備／技能／能力／任務／地圖可由各自快捷鍵開啟；Esc 關閉最上層面板，沒有面板時暫停遊戲。',
    '點擊「更改按鍵」後按下新按鍵；已被其他動作使用的按鍵會被拒絕，Esc 不可重綁。',
    '技能快捷 ' + skillKeys + ' 對應' + (view.saveData ? classSkillNames(view.saveData.player,view.catalog.rules) : '目前職業的三個主動技能') + '；未學或冷卻中會顯示狀態。',
    view.holdBasicAttack ? '普通攻擊可按住連續施放，放開即停止；技能仍按一下施放。'
      : '普通攻擊與技能按一下施放；上方可選擇按住連續普通攻擊。',
  ];
  for (const text of helpText) help.append(makeElement(document, 'li', '', text));
  parent.append(help, makeSectionTitle(document, '鍵位設定'));
  const bindingList = makeElement(document, 'div', 'ms-binding-list');
  for (const action of KEY_ACTIONS) {
    const row = makeElement(document, 'div', 'ms-binding-row');
    const value = effectiveKeyText(settings.bindings, action.id);
    const pending = state.pendingBinding === action.id;
    const currentKeyText = '目前按鍵 ' + value;
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', action.label + '，' + currentKeyText);
    const rebindLabel = pending
      ? '按鍵中：' + action.label + '，' + currentKeyText + '，按 Esc 取消'
      : '更改按鍵：' + action.label + '，' + currentKeyText;
    const rebindButton = makeButton(document, pending ? '按鍵中…' : '更改按鍵', 'settings-rebind', {
      className: 'ms-button ms-button--small',
      data: { actionId: action.id },
    });
    rebindButton.setAttribute('aria-label', rebindLabel);
    rebindButton.title = rebindLabel;
    rebindButton.dataset.focus = 'binding-' + action.id;
    row.append(
      makeElement(document, 'span', '', action.label),
      makeBadge(document, value, 'neutral'),
      rebindButton,
    );
    bindingList.append(row);
    if (state.bindingMessage && state.bindingMessageAction === action.id) {
      const note = makeElement(document, 'p', 'ms-panel-note ms-binding-note', state.bindingMessage);
      note.setAttribute('role', 'status');
      bindingList.append(note);
    }
  }
  const escapeRow = makeElement(document, 'div', 'ms-binding-row');
  escapeRow.append(makeElement(document, 'span', '', '關閉面板／暫停'), makeBadge(document, 'Esc 固定', 'warning'));
  bindingList.append(escapeRow);
  // Without this, a player who rebound keys into a mess had to fix each row by hand.
  const customised = Object.keys(settings.bindings).length > 0;
  const resetButton = makeButton(document, customised ? '恢復預設按鍵' : '目前為預設按鍵', 'settings-reset-bindings', {
    className: 'ms-button ms-button--secondary ms-binding-reset',
    disabled: !customised,
    title: customised ? '清除所有自訂按鍵，改回預設配置' : '目前使用的就是預設按鍵',
  });
  resetButton.dataset.focus = 'binding-reset';
  parent.append(resetButton, bindingList);
  if (state.bindingMessage && !KEY_ACTIONS.some(({ id }) => id === state.bindingMessageAction)) {
    parent.append(makeElement(document, 'p', 'ms-panel-note', state.bindingMessage));
  }
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.floor(clamp(value, min, max));
}
