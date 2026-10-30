import './styles.css';
import './journal.css';
import './world-map.css';
import './illustrated-panels.css';
import './control-art.css';
import { controlImage, decorateControl, installControlSkins, setControlLabel } from './control-art.js';
import { buildVisualStats, buildVisualQuests, chooseJournalQuest, objectivePlaces } from './illustrated-panels.js';
import { buildWorldMap } from './world-map.js';
import { PLANNED_REGIONS, savedProgressDisplayMapId } from './world-map-model.js';
import { deriveWorldProgress, frostRouteMarkerInspectCommand, groupWorldQuests, saveUpgradeConfirmCommand, saveUpgradePrompt } from './world-progress-model.js';
import {
  DEFAULT_KEY_BINDINGS,
  findKeyBindingConflict,
  getEffectiveKeyCodes,
  resolveEffectiveBindings,
  type GameAction,
} from '../app/keyboard.js';
import type { CommandDraft, PanelId } from '../contracts/commands.js';
import type { UiController, UiSnapshot } from '../contracts/ports.js';
import type { Settings } from '../contracts/types.js';
import { resolveQuestClaim } from '../domain/quests/claim.js';
import { validatePlayerName } from '../domain/progression/index.js';
import { resolveItemUse } from '../app/item-use.js';
import { reconcileBagViewState } from './bag-view-state.js';
import { previewEquipmentAction } from './equipment-preview.js';
import { previewEquipmentStats, type EquipmentStatsPreview } from './equipment-stats-preview.js';
import { previewMaterialSale } from './material-sale-preview.js';
import { previewSale } from './sale-preview.js';
import { previewBuy } from './trade-preview.js';
import { previewMaximumBuy } from './maximum-buy-preview.js';
import { previewApAllocation } from './ap-allocation-preview.js';
import { previewSkillLearning } from './skill-learning-preview.js';
import { INVENTORY_FILTERS, selectInventoryEntries, type InventoryFilter } from './inventory-entries.js';
import { SHOP_FILTERS, selectShopOffers, type ShopFilter } from './shop-offers.js';
import { resolveNpcMapTarget } from './npc-map-target.js';

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
  | 'open-panel' | 'close-panel' | 'continue' | 'new-role' | 'create-confirm' | 'create-cancel'
  | 'retry-save' | 'confirm-save-upgrade' | 'discard-save' | 'import-legacy-save' | 'dismiss-legacy-import' | 'play-temporary' | 'toggle-pause' | 'return-title' | 'respawn' | 'retry-boss'
  | 'return-town' | 'attack' | 'pickup' | 'interact' | 'inspect-stele' | 'inspect-route-marker' | 'review-sidequest' | 'use-item' | 'select-bag'
  | 'inventory-filter' | 'shop-filter' | 'select-map' | 'review-npc-map' | 'select-quest'
  | 'equip-bag' | 'sell-bag' | 'sell-materials' | 'unequip' | 'allocate-ap' | 'learn-skill' | 'accept-quest'
  | 'claim-quest' | 'buy' | 'select-max-buy' | 'settings-mute' | 'settings-rebind' | 'use-cloud-version'
  | 'toggle-key-guide' | 'settings-reset-bindings' | 'reload-page';

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

function effectiveKeyText(bindings: Partial<Record<GameAction, string>>, action: GameAction): string {
  const codes = getEffectiveKeyCodes(action, resolveEffectiveBindings(bindings));
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
  return job === 'swordsman' ? '劍士' : '初心者';
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
    '需求 Lv.' + item.minLevel,
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
  if (!item.slot) return null;
  // Compare against what is worn now so players can tell an upgrade without opening 裝備.
  const currentId = player.equipment[item.slot];
  const current = currentId ? view.catalog.rules.items[currentId] : undefined;
  const compare = makeElement(document, 'p', 'ms-compare', '對比' + (current ? '「' + current.name + '」' : '空的' + slotLabel(item.slot) + '欄') + '：');
  const stats = [['攻擊', 'attack'], ['防禦', 'defense'], ['最大 HP', 'hpBonus']] as const;
  let changed = false;
  for (const [label, key] of stats) {
    const delta = (item[key] ?? 0) - (current?.[key] ?? 0);
    if (delta === 0) continue;
    if (changed) compare.append('・');
    changed = true;
    compare.append(makeElement(document, 'span', delta > 0 ? 'ms-compare__up' : 'ms-compare__down', label + (delta > 0 ? ' ▲' : ' ▼') + Math.abs(delta)));
  }
  if (!changed) compare.append('能力相同');
  return compare;
}

/** Gear the hero can wear now that beats the equipped piece on some stat and loses on none. */
function isWearableUpgrade(
  view: UiSnapshot,
  player: NonNullable<UiSnapshot['saveData']>['player'],
  item: UiSnapshot['catalog']['rules']['items'][string],
): boolean {
  if (!item.slot || player.level < item.minLevel) return false;
  const currentId = player.equipment[item.slot];
  const current = currentId ? view.catalog.rules.items[currentId] : undefined;
  const deltas = (['attack', 'defense', 'hpBonus'] as const).map((key) => (item[key] ?? 0) - (current?.[key] ?? 0));
  return deltas.some((delta) => delta > 0) && deltas.every((delta) => delta >= 0);
}

function targetName(view: UiSnapshot, id: string, type: string): string {
  if (type === 'kill') return view.catalog.rules.monsters[id]?.name ?? id;
  if (type === 'reach') return view.catalog.world.maps[id]?.name ?? id;
  if (type === 'inspect') return view.catalog.world.npcs[id]?.name ?? id;
  return view.catalog.rules.items[id]?.name ?? id;
}

function rewardText(view: UiSnapshot, reward: UiSnapshot['questViews'][number]['reward']): string {
  const parts = ['EXP ' + formatNumber(reward.exp), '金幣 ' + formatNumber(reward.coins)];
  for (const stack of reward.items) {
    const item = view.catalog.rules.items[stack.itemId];
    parts.push((item?.name ?? stack.itemId) + ' ×' + stack.quantity);
  }
  if (reward.minLevel) parts.push('至少升至 Lv.' + reward.minLevel);
  if (reward.job) parts.push('轉職：' + jobLabel(reward.job));
  return parts.join('・');
}

function objectiveText(view: UiSnapshot, objective: UiSnapshot['questViews'][number]['objectives'][number]): string {
  const action = {
    kill: '擊敗', collect: '持有', equip: '裝備', reach: '到達', inspect: '調律',
  }[objective.type];
  const objectiveAction = objective.type === 'inspect' && objective.targetId === 'frost-route-marker' ? '調查' : action;
  return objectiveAction + ' ' + targetName(view, objective.targetId, objective.type)
    + ' ' + Math.min(objective.current, objective.required) + '/' + objective.required;
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
  if (!key) return;
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
export function createUi(root: HTMLElement, dispatch: (command: CommandDraft) => void): UiController {
  const document = root.ownerDocument;
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
  const profile = makeElement(document, 'section', 'ms-card ms-profile');
  const quickbar = makeElement(document, 'section', 'ms-quickbar');
  const mapCard = makeElement(document, 'section', 'ms-card ms-map-indicator');
  const region = makeElement(document, 'aside', 'ms-region');
  const systemControls = makeElement(document, 'nav', 'ms-system-controls');
  systemControls.setAttribute('aria-label', '遊戲系統');
  const questTracker = makeElement(document, 'button', 'ms-quest-tracker');
  questTracker.type = 'button';
  questTracker.dataset.uiAction = 'open-panel';
  questTracker.dataset.panel = 'quests';
  questTracker.setAttribute('aria-label', '開啟任務日誌');
  const interactionHintRow = makeElement(document, 'div', 'ms-interaction-hint');
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
    button.replaceChildren(makeJournalIcon(document, panel), makeElement(document, 'span', '', PANEL_LABELS[panel]));
    if (panel === 'settings') {
      button.className = 'ms-button ms-system-button';
      systemControls.append(button);
    } else if (panel === 'shop' || panel === 'dialogue') {
      button.className = 'ms-button ms-context-button';
      actionBar.append(button);
    } else controls.append(button);
    panelButtons.set(panel, button);
  }
  const pickupButton = makeButton(document, '拾取', 'pickup', { className: 'ms-button ms-button--secondary' });
  const interactButton = makeButton(document, '互動', 'interact', { className: 'ms-button ms-button--secondary' });
  const pauseButton = makeButton(document, 'Ⅱ', 'toggle-pause', { className: 'ms-button ms-system-button', title: '暫停遊戲' });
  pauseButton.setAttribute('aria-label', '暫停遊戲');
  const returnTownButton = makeButton(document, '返回城鎮', 'return-town', { className: 'ms-button ms-button--secondary' });
  actionBar.prepend(pickupButton, interactButton);
  actionBar.append(returnTownButton);
  systemControls.append(keyGuide, pauseButton);
  header.append(mapCard, systemControls);
  region.append(header, interactionHintRow, questTracker);
  hud.append(profile, region);
  bottomBar.append(actionBar, quickbar, controls);

  const quickSlots = makeElement(document, 'div', 'ms-quickbar__slots');
  const quickDefinitions = [
    { id: 'basic', label: '普通攻擊', kind: 'attack' },
    { id: 'heavy-strike', label: '重斬', kind: 'skill' },
    { id: 'sweep', label: '橫掃', kind: 'skill' },
    { id: 'iron-guard', label: '堅韌守護', kind: 'skill' },
    { id: 'small-red', label: 'HP 藥水', kind: 'item' },
    { id: 'small-blue', label: 'MP 藥水', kind: 'item' },
  ] as const;
  const quickButtons = new Map<string, HTMLButtonElement>();
  for (const slot of quickDefinitions) {
    const button = makeButton(document, '', slot.kind === 'item' ? 'use-item' : 'attack', {
      className: 'ms-quick-slot',
      data: slot.kind === 'item' ? { itemId: slot.id, quickSlot: slot.id } : { skillId: slot.id, quickSlot: slot.id },
    });
    const keyHint = makeElement(document, 'span', 'ms-quick-slot__key', '—');
    const icon = makeElement(document, 'span', 'ms-quick-slot__icon');
    const label = makeElement(document, 'strong', 'ms-quick-slot__label', slot.label);
    const state = makeElement(document, 'span', 'ms-quick-slot__state', '');
    button.setAttribute('aria-label', slot.label);
    if (slot.kind === 'item') button.classList.add('ms-quick-slot--item');
    button.append(keyHint, icon, label, state);
    quickSlots.append(button);
    quickButtons.set(slot.id, button);
  }
  quickbar.setAttribute('aria-label', '戰鬥與藥水快捷列');
  quickbar.append(quickSlots);

  const panelHost = makeElement(document, 'div', 'ms-panel-host');
  panelHost.hidden = true;
  const screenLayer = makeElement(document, 'div', 'ms-screen-layer');
  screenLayer.hidden = true;
  const toast = makeElement(document, 'div', 'ms-toast');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  const footer = makeElement(document, 'footer', 'ms-footer');
  const saveState = makeElement(document, 'span', 'ms-footer__save');
  const errorText = makeElement(document, 'span', 'ms-footer__error');
  const footerActions = makeElement(document, 'div', 'ms-footer__actions');
  footer.append(saveState, footerActions, errorText);

  // The world freezes while the page has lost focus (see worldIsFrozen); say so instead of looking hung.
  const focusBanner = makeElement(document, 'div', 'ms-focus-banner', '遊戲畫面失去焦點，冒險已安全暫停。');
  focusBanner.setAttribute('role', 'status');
  focusBanner.hidden = true;
  shell.append(hud, bottomBar, panelHost, screenLayer, toast, focusBanner, footer);
  root.append(shell);

  let currentView: UiSnapshot | null = null;
  let lastScreenSignature = '';
  let lastProfileSignature = '';
  let lastMapSignature = '';
  let lastQuestSignature = '';
  let lastPanelSignature = '';
  let lastFooterActionStatus: UiSnapshot['saveStatus'] | null = null;
  let selectedBagIndex: number | null = null;
  let inventoryFilter: InventoryFilter = 'all';
  let shopFilter: ShopFilter = 'all';
  let selectedMapId: string | null = null;
  let selectedQuestId: string | null = null;
  let createRequested = false;
  let replaceConfirmed = false;
  let discardConfirmed = false;
  let nameDraft = '旅人';
  let shopQuantities = new Map<string, number>();
  let sellQuantities = new Map<number, number>();
  let lastReconciledBag: NonNullable<UiSnapshot['saveData']>['player']['bag'] = [];
  let bagStateMessage = '';
  let bagHeadingRestorePending = false;
  let pendingBinding: Exclude<GameAction, 'escape'> | null = null;
  let bindingMessage = '';
  // Which row the message is about, so it shows next to that row instead of below all 17 bindings.
  let bindingMessageAction: string | null = null;
  let keyGuideExpanded = false;
  let lastKeyGuideSignature = '';
  let panelFocusBeforeResume: PanelFocusSnapshot | null = null;
  let lastPanelFocus: PanelFocusSnapshot | null = null;
  let restoreFocusAfterResume = false;
  let disposed = false;
  const quickIconCache = new Map<string, QuickIconCacheEntry>();

  const clearTransientViewState = (): void => {
    selectedBagIndex = null;
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
    setControlLabel(keyGuideToggle, '?');
    keyGuideToggle.classList.toggle('is-active', keyGuideExpanded);
    keyGuideToggle.setAttribute('aria-expanded', String(keyGuideExpanded));
    keyGuideCard.hidden = !keyGuideExpanded;
    if (!keyGuideExpanded) return;

    const bindings = (view?.saveData?.settings.bindings ?? DEFAULT_KEY_BINDINGS) as Partial<Record<GameAction, string>>;
    const signature = JSON.stringify(bindings);
    if (signature === lastKeyGuideSignature && keyGuideCard.hasChildNodes()) return;
    lastKeyGuideSignature = signature;

    keyGuideCard.replaceChildren();

    const headerRow = makeElement(document, 'div', 'ms-key-guide__header');
    const closeButton = makeButton(document, '✕ 收起', 'toggle-key-guide', {
      className: 'ms-button ms-button--close',
      title: '收起按鍵提示',
    });
    closeButton.setAttribute('aria-label', '✕ 收起：操作按鍵提示');
    headerRow.append(makeElement(document, 'h4', '', '操作按鍵提示'), closeButton);
    keyGuideCard.append(headerRow);

    for (const section of KEY_GUIDE_SECTIONS) {
      const secEl = makeElement(document, 'div', 'ms-key-guide__section');
      secEl.append(makeElement(document, 'div', 'ms-key-guide__section-title', section.category));
      const grid = makeElement(document, 'div', 'ms-key-guide__grid');
      for (const item of section.items) {
        const row = makeElement(document, 'div', 'ms-key-guide__row');
        row.append(
          makeElement(document, 'span', 'ms-key-guide__action', item.label),
          makeElement(document, 'span', 'ms-key-guide__badge', getKeyBadgeText(bindings, item)),
        );
        grid.append(row);
      }
      secEl.append(grid);
      keyGuideCard.append(secEl);
    }

    const tip = makeElement(document, 'p', 'ms-key-guide__tip', '💡 可在「設定」面板中自訂快捷鍵位');
    keyGuideCard.append(tip);
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
    const signature = player
      ? JSON.stringify({ player, stats: view.stats, interfaceReady: Boolean(view.interfaceManifest) })
      : 'empty';
    if (signature === lastProfileSignature) return;
    lastProfileSignature = signature;
    profile.replaceChildren();
    if (!player) {
      profile.append(
        makeElement(document, 'div', 'ms-profile__portrait ms-profile__portrait--empty', '劍'),
        makeElement(document, 'div', 'ms-profile__main', '登入或建立角色後開始冒險'),
      );
      return;
    }

    const portrait = makeElement(document, 'div', 'ms-profile__portrait');
    const hero = makeElement(document, 'img', 'ms-profile__hero');
    hero.src = new URL('assets/interface/journal/hero-portrait-chibi.png', document.baseURI).href;
    hero.alt = '';
    hero.draggable = false;
    portrait.append(hero);
    portrait.setAttribute('role', 'img');
    portrait.setAttribute('aria-label', player.name + '的角色頭像');
    const main = makeElement(document, 'div', 'ms-profile__main');
    const heading = makeElement(document, 'div', 'ms-profile__heading');
    heading.append(
      makeElement(document, 'strong', '', player.name),
      makeBadge(document, 'Lv.' + player.level, 'level'),
      makeBadge(document, jobLabel(player.job), 'job'),
    );
    const hp = makeMeter(document, 'HP', player.hp, view.stats?.maxHp ?? player.hp, 'hp');
    // Static (not pulsing): the profile is rebuilt on every HP change, which would restart an animation.
    const maxHp = view.stats?.maxHp ?? player.hp;
    if (player.hp > 0 && player.hp <= maxHp * 0.3) {
      hp.classList.add('is-low');
      hp.title = 'HP 偏低，記得按 ' + effectiveKeyText(view.saveData?.settings.bindings ?? {}, 'potionHp') + ' 喝紅色藥水';
    }
    const mp = makeMeter(document, 'MP', player.mp, view.stats?.maxMp ?? player.mp, 'mp');
    const atMaxLevel = player.level >= view.catalog.rules.progression.maxLevel;
    const nextExp = view.catalog.rules.progression.expToNext[player.level] ?? 0;
    const exp = atMaxLevel
      ? makeMeter(document, 'EXP', 1, 1, 'exp', 'MAX')
      : makeMeter(document, 'EXP', player.exp, nextExp, 'exp');
    main.append(heading, hp, mp, exp);
    profile.append(portrait, main);
  };

  const renderMapIndicator = (view: UiSnapshot): void => {
    const data = view.saveData;
    const signature = data ? data.location.mapId + ':' + data.location.spawnId + ':' + data.player.coins : 'none';
    if (signature === lastMapSignature) return;
    lastMapSignature = signature;
    mapCard.replaceChildren();
    if (!data) {
      mapCard.append(makeElement(document, 'strong', '', '尚未開始'));
      return;
    }
    const map = view.catalog.world.maps[data.location.mapId];
    mapCard.append(
      makeElement(document, 'strong', '', map?.name ?? data.location.mapId),
      makeElement(document, 'span', 'ms-map-indicator__coins', '金幣 ' + formatNumber(data.player.coins)),
    );
  };

  const renderQuestTracker = (view: UiSnapshot): void => {
    const chapterComplete = Boolean(view.saveData?.flags.chapterComplete);
    const worldComplete = deriveWorldProgress(view.saveData, view.questViews.map(({ questId }) => questId)).worldComplete;
    const signature = JSON.stringify({ quests: view.questViews, map: view.saveData?.location.mapId, chapterComplete });
    if (signature === lastQuestSignature) return;
    lastQuestSignature = signature;
    const quest = view.questViews.find((entry) => entry.status === 'ready')
      ?? view.questViews.find((entry) => entry.status === 'active')
      ?? view.questViews.find((entry) => entry.status === 'available');
    questTracker.replaceChildren();
    const heading = makeElement(document, 'span', 'ms-quest-tracker__heading', '任務手帳');
    heading.prepend(makeJournalIcon(document, 'quests'));
    const title = quest?.title ?? (worldComplete ? '世界旅程完成' : chapterComplete ? '第一章完成' : '自由探索');
    const definition = quest ? view.catalog.world.quests[quest.questId] : undefined;
    const giver = definition ? view.catalog.world.npcs[definition.giverNpcId]?.name ?? definition.giverNpcId : '任務委託人';
    const recipient = definition ? view.catalog.world.npcs[definition.turnInNpcId]?.name ?? definition.turnInNpcId : '任務委託人';
    // Name the NPC's map too: after dying (respawn is always 木葉鎮) players otherwise had to
    // remember that 礦道守望者 waits three maps away.
    const where = (npcId: string | undefined): string => {
      const map = npcId ? Object.values(view.catalog.world.maps).find((entry) => entry.npcs.some((npc) => npc.npcId === npcId)) : undefined;
      return map ? '（' + map.name + '）' : '';
    };
    const place = !quest ? ''
      : quest.status === 'available' ? where(definition?.giverNpcId)
      : quest.status === 'ready' ? where(definition?.turnInNpcId)
      : '';
    const detail = !quest
      ? (worldComplete ? '四區主線已完成；可自由探索並重看冒險手帳。'
        : chapterComplete ? '古礦已重歸寧靜，可繼續自由探索木葉世界。' : '探索世界，尋找新的故事。')
      : quest.status === 'available' && quest.questId === 'q09'
        ? '前往霜雪群島的雪痕海岸找' + giver + '，接續主線'
      : quest.status === 'available' ? '與' + giver + '交談'
      : quest.status === 'ready' ? '任務完成，向' + recipient + '回報'
      : quest.objectives.map((objective) => objectiveText(view, objective)).join(' · ');
    const detailLine = makeElement(document, 'span', 'ms-quest-tracker__detail', detail);
    // Keep the map name in one piece: it used to wrap as 「（赤岩山」/「徑）」.
    if (place) detailLine.append(makeElement(document, 'span', 'ms-quest-tracker__place', place));
    questTracker.append(heading, makeElement(document, 'strong', '', title), detailLine);
    questTracker.title = title + '｜' + detail + place;
  };

  const updateInteractionHint = (view: UiSnapshot): void => {
    const hint = view.interactionHint ?? null;
    const visible = view.screen === 'playing'
      && view.focusResumeRequired !== true
      && view.panels.length === 0
      && hint !== null;
    shell.classList.toggle('has-interaction-hint', visible);
    interactionHintRow.hidden = !visible;
    if (!visible || !hint) {
      if (interactionHintRow.textContent !== '') interactionHintRow.textContent = '';
      delete interactionHintRow.dataset.targetKey;
      if (interactButton.title !== '') interactButton.title = '';
      return;
    }
    const verb = hint.kind === 'portal' ? '前往' : '互動';
    const text = effectiveKeyText(view.saveData?.settings.bindings ?? {}, 'interact') + ' ' + verb + '：' + hint.label
      + (hint.blockedMessage ? '｜' + hint.blockedMessage : '');
    if (interactionHintRow.textContent !== text) interactionHintRow.textContent = text;
    if (interactionHintRow.title !== text) interactionHintRow.title = text;
    if (interactionHintRow.dataset.targetKey !== hint.targetKey) interactionHintRow.dataset.targetKey = hint.targetKey;
    if (interactButton.title !== text) interactButton.title = text;
  };

  const updateQuickButtons = (view: UiSnapshot): void => {
    const player = view.saveData?.player;
    const playing = view.screen === 'playing';
    const focusBlocked = view.focusResumeRequired === true;
    const canAct = playing && !focusBlocked;
    const keyForSkill: Record<string, GameAction> = {
      basic: 'attack',
      'heavy-strike': 'skill1',
      sweep: 'skill2',
      'iron-guard': 'skill3',
      'small-red': 'potionHp',
      'small-blue': 'potionMp',
    };
    for (const [slotId, button] of quickButtons) {
      button.classList.toggle('has-action-feedback', false);
      const slot = quickDefinitions.find((definition) => definition.id === slotId);
      const key = button.querySelector<HTMLElement>('.ms-quick-slot__key');
      if (key) {
        const action = keyForSkill[slotId]!;
        key.textContent = effectiveKeyText(view.saveData?.settings.bindings ?? {}, action);
      }
      const iconHost = button.querySelector<HTMLElement>('.ms-quick-slot__icon');
      const state = button.querySelector<HTMLElement>('.ms-quick-slot__state');
      const label = button.querySelector<HTMLElement>('.ms-quick-slot__label');
      if (!slot || !iconHost || !state || !label) continue;

      if (slot.kind === 'item') {
        const fallbackId = slotId === 'small-red' ? 'large-red' : 'large-blue';
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
        button.setAttribute('aria-label', itemName);
        renderQuickIcon(slotId, iconHost, view, item?.iconKey ?? null, itemName, 'ms-quick-slot__icon-image');

        const cooldown = Math.max(0, view.potionReadyAtMs - view.nowMs);
        const reason = count === 0 ? '沒有藥水' : cooldown > 0 ? '冷卻 ' + remainingSeconds(cooldown) : '';
        const displayState = !playing ? '不可操作'
          : focusBlocked ? '按「繼續遊戲」恢復'
            : reason || ('×' + count);
        button.classList.toggle('is-unavailable', Boolean(reason));
        button.disabled = !canAct || Boolean(reason);
        state.textContent = compactQuickSlotState(displayState);
        button.title = itemName + (reason ? '｜' + reason : '｜數量 ' + count);
        button.setAttribute('aria-label', itemName + ' ' + displayState);
        continue;
      }

      const iconKey = slot.kind === 'skill'
        ? 'skill:' + slotId
        : view.catalog.rules.items['starter-sword']?.iconKey ?? null;
      renderQuickIcon(slotId, iconHost, view, iconKey, slot.label, 'ms-quick-slot__icon-image', slot.kind === 'attack' ? '普攻' : undefined);

      const skill = view.catalog.rules.skills[slotId];
      if (!player || !skill) {
        button.disabled = true;
        state.textContent = '尚未載入';
        continue;
      }
      label.textContent = skill.name;
      button.setAttribute('aria-label', skill.name);
      const basic = slotId === 'basic';
      const rank = basic ? 1 : player.skillRanks[slotId] ?? 0;
      button.classList.toggle('is-unlearned', !basic && rank === 0);
      const cooldown = Math.max(0, (view.skillReadyAtMs[slotId] ?? 0) - view.nowMs);
      const reason = basic
        ? cooldown > 0 ? '冷卻 ' + remainingSeconds(cooldown) : ''
        : rank === 0 ? '未學習'
          : player.mp < skill.mpCost ? 'MP 不足'
            : cooldown > 0 ? '冷卻 ' + remainingSeconds(cooldown) : '';
      // Keep the active buff duration above cast blockers, as the old quickbar did.
      const buffLeftSec = skill.kind === 'buff' && rank > 0
        ? Math.ceil(Math.max(0, (view.guardUntilMs ?? 0) - view.nowMs) / 1000) : 0;
      const actionLock = Math.max(0, (view.combatUi?.actionLockUntilMs ?? 0) - view.nowMs);
      const queued = view.combatUi?.bufferedSkillId === slotId;
      const screenState = !playing ? '不可操作' : focusBlocked ? '按「繼續遊戲」恢復' : '';
      const displayState = screenState
        || (buffLeftSec > 0 ? buffLeftSec + ' 秒'
          : reason || (queued ? '已排隊'
            : actionLock > 0 ? '動作中 ' + remainingSeconds(actionLock)
              : basic ? 'MP 0' : '等級 ' + rank + '・MP ' + skill.mpCost));
      button.classList.toggle('is-unavailable', Boolean(reason) && buffLeftSec === 0);
      button.classList.toggle('is-buff-active', buffLeftSec > 0);
      button.classList.toggle('has-action-feedback', canAct && !reason && buffLeftSec === 0 && (queued || actionLock > 0));
      // Preserve the old rank/MP/cooldown disabled policy; action lock and a live queue are display-only.
      button.disabled = !canAct || (!basic && Boolean(reason));
      state.textContent = compactQuickSlotState(displayState);
      button.title = basic ? skill.name + '：MP 0'
        : skill.name + '｜' + skillDetails(skill, rank);
      if (buffLeftSec > 0) button.title += '｜效果剩餘 ' + buffLeftSec + ' 秒';
      if (reason) button.title += '｜' + reason;
      else if (queued && !screenState && buffLeftSec === 0) button.title += '｜已排隊';
      else if (actionLock > 0 && !screenState && buffLeftSec === 0) button.title += '｜動作中 ' + remainingSeconds(actionLock);
      if (screenState) button.title += '｜' + screenState;
      button.setAttribute('aria-label', skill.name + ' ' + displayState);
    }

    pickupButton.disabled = !canAct;
    interactButton.disabled = !canAct;
    const bindings = view.saveData?.settings.bindings ?? {};
    setControlLabel(pickupButton, effectiveKeyText(bindings, 'pickup') + ' 拾取');
    setControlLabel(interactButton, effectiveKeyText(bindings, 'interact') + ' 互動');
    pauseButton.hidden = !playing;
    pauseButton.disabled = !canAct;
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
      shopButton.disabled = view.interaction?.npcId !== 'merchant';
      shopButton.hidden = shopButton.disabled;
    }
    updateInteractionHint(view);
  };

  const renderScreen = (view: UiSnapshot): void => {
    const signature = JSON.stringify({
      screen: view.screen,
      error: view.error,
      saveStatus: view.saveStatus,
      saveUpgrade: view.saveUpgrade ?? null,
      focusResumeRequired: view.focusResumeRequired ?? false,
      hasSave: view.saveData !== null,
      canReturnTown: view.canReturnTown,
      createRequested,
      replaceConfirmed,
      discardConfirmed,
      saveMessage: view.saveMessage,
      legacyImportAvailable: view.legacyImportAvailable,
      legacyImportMessage: view.legacyImportMessage,
      nameDraft,
    });
    if (signature === lastScreenSignature) return;
    lastScreenSignature = signature;
    preserveFocus(screenLayer, () => {
      screenLayer.hidden = true;
      screenLayer.replaceChildren();

      const showCreate = createRequested || view.screen === 'create';
      if (view.saveStatus === 'conflict') {
        const card = makeScreenCard(document, '進度版本衝突', '另一個裝置已有較新的雲端進度。請載入雲端版本後再繼續。');
        card.append(makeButton(document, '載入雲端版本', 'use-cloud-version', {
          className: 'ms-button ms-button--primary',
        }));
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'loading') {
        screenLayer.hidden = false;
        screenLayer.append(makeScreenCard(document, '正在準備冒險', '載入世界資料與存檔狀態。'));
        return;
      }
      if (view.saveUpgrade) {
        createRequested = false;
        replaceConfirmed = false;
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
      if ((view.screen === 'title' && !view.error) || showCreate) {
      if (showCreate) {
        const card = makeScreenCard(document, '建立角色', view.saveData
          ? (replaceConfirmed ? '第二次確認：既有角色進度將被取代，且無法復原。' : '建立新角色會取代目前角色，請先確認後再送出。')
          : '輸入角色名稱，確認後開始冒險。');
        const checkedName = validatePlayerName(nameDraft);
        const nameInput = captureNameInput(checkedName);
        const nameFeedback = makeElement(document, 'p');
        nameFeedback.id = nameFeedbackId;
        presentNameFeedback(nameInput, nameFeedback, checkedName);
        card.append(nameInput, nameFeedback);
        if (view.saveData && !replaceConfirmed) {
          card.append(makeButton(document, '我了解，繼續確認', 'create-confirm', { className: 'ms-button ms-button--danger' }));
        } else {
          card.append(makeButton(document, view.saveData ? '確認取代並建立' : '確認建立角色', 'create-confirm', {
            className: 'ms-button ms-button--primary',
            disabled: !checkedName.ok,
            title: checkedName.ok ? '' : checkedName.message,
          }));
        }
        const confirmButton = card.querySelector<HTMLButtonElement>('[data-ui-action="create-confirm"]');
        if (confirmButton) confirmButton.dataset.focus = 'create-confirm';
        card.append(makeButton(document, '取消', 'create-cancel', { className: 'ms-button ms-button--secondary' }));
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
        const card = makeScreenCard(document, 'Brightwood: First Oath', '森林的怪物躁動不安，古礦深處似乎有東西正在甦醒。\n從晨光營地出發，立下你的第一個誓約。');
        const status = makeElement(document, 'p', 'ms-screen-card__status', '存檔狀態：' + statusLabel(view.saveStatus));
        card.append(status);
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
            makeButton(document, '建立新角色', 'new-role', { className: 'ms-button ms-button--secondary' }),
          );
        } else {
          card.append(makeButton(document, '建立角色', 'new-role', { className: 'ms-button ms-button--primary' }));
          card.append(makeButton(document, '暫時遊玩', 'play-temporary', { className: 'ms-button ms-button--secondary' }));
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
        if (focusResume) continueButton.focus();
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
          '角色：' + player.name + '・Lv.' + player.level + '・' + jobLabel(player.job),
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
        continueButton.focus();
      }
    });
  };

  const renderFooter = (view: UiSnapshot): void => {
    focusBanner.hidden = !(view.windowFocused === false && view.screen === 'playing');
    saveState.textContent = '存檔狀態：' + statusLabel(view.saveStatus);
    errorText.textContent = view.error ?? '';
    toast.textContent = view.toast ?? '';
    toast.hidden = !view.toast;
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
    }
  };

  const focusGameCanvas = (button?: HTMLButtonElement): void => {
    button?.blur();
    const active = shell.ownerDocument.activeElement;
    if (active instanceof HTMLElement && shell.contains(active)) active.blur();
    const canvas = shell.ownerDocument.querySelector<HTMLCanvasElement>('#game-root canvas');
    canvas?.focus();
  };

  const renderPanel = (view: UiSnapshot, force = false): void => {
    const panel = view.panels.at(-1) ?? null;
    const previousBag = lastReconciledBag;
    const nextBag = view.saveData?.player.bag ?? [];
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
    lastReconciledBag = nextBag.map((stack) => ({ ...stack }));
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
    const skipBagFocusPreservation = bagStructureChanged && bagPanel && activeBagControl;
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
    if (panel !== 'quests') selectedQuestId = null;
    if (panel !== 'map') selectedMapId = null;
    if (!panel) {
      if (lastPanelSignature !== '') {
        lastPanelSignature = '';
        panelHost.replaceChildren();
          if (view.screen === 'playing' && view.focusResumeRequired !== true) focusGameCanvas();
      }
      return;
    }
    const signature = JSON.stringify({
      panel,
      data: view.saveData,
      interfaceReady: Boolean(view.interfaceManifest),
      quests: view.questViews,
      interaction: view.interaction,
      canReturnTown: view.canReturnTown,
      selectedBagIndex,
      selectedMapId,
      selectedQuestId,
      inventoryFilter,
      shopFilter,
      potionCooling: panel === 'inventory' && view.nowMs < view.potionReadyAtMs,
      shopQuantities: Array.from(shopQuantities.entries()),
      sellQuantities: Array.from(sellQuantities.entries()),
      bagStateMessage,
      pendingBinding,
      bindingMessage,
      bindingMessageAction,
    });
    if (!force && signature === lastPanelSignature) return;
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
      title.append(
        makeElement(document, 'h2', '', PANEL_LABELS[panel]),
      );
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
        selectedQuestId,
        inventoryFilter,
        shopFilter,
        shopQuantities,
        sellQuantities,
        bagStateMessage,
        pendingBinding,
        bindingMessage,
        bindingMessageAction,
      }));
      for (const detail of body.querySelectorAll<HTMLDetailsElement>('details[data-detail-id]')) {
        detail.open = openDetails.has(detail.dataset.detailId);
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
      case 'select-quest':
        if (!view.questViews.some(({ questId }) => questId === button.dataset.questId)) return;
        selectedQuestId = button.dataset.questId!;
        renderPanel(view, true);
        return;
      case 'select-map':
        if (!button.dataset.mapId || (!view.catalog.world.maps[button.dataset.mapId] && !PLANNED_REGIONS.some(({ id }) => id === button.dataset.mapId))) return;
        selectedMapId = button.dataset.mapId;
        renderPanel(view, true);
        return;
      case 'review-npc-map': {
        const npcId = button.dataset.npcId;
        if (!npcId) return;
        const latestView = currentView ?? view;
        const mapTarget = resolveNpcMapTarget(latestView.catalog.world, npcId);
        if (!mapTarget) return;
        selectedMapId = mapTarget.mapId;
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
        replaceConfirmed = false;
        nameDraft = '旅人';
        lastScreenSignature = '';
        renderScreen(view);
        return;
      case 'create-confirm':
        clearTransientViewState();
        if (view.saveData && !replaceConfirmed) {
          replaceConfirmed = true;
          lastScreenSignature = '';
          renderScreen(view);
          return;
        }
        const checkedName = validatePlayerName(nameDraft);
        if (!checkedName.ok) return;
        createRequested = false;
        replaceConfirmed = false;
        dispatchDraft({ type: 'newGame', payload: { name: checkedName.value } });
        focusGameCanvas(button);
        return;
      case 'create-cancel':
        createRequested = false;
        replaceConfirmed = false;
        lastScreenSignature = '';
        if (view.screen === 'create') dispatchDraft({ type: 'returnTitle', payload: {} });
        else renderScreen(view);
        return;
      case 'retry-save':
        discardConfirmed = false;
        dispatchDraft({ type: 'retrySave', payload: {} });
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
          atMerchant: view.interaction?.npcId === 'merchant',
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
            atMerchant: view.interaction?.npcId === 'merchant',
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
        if (!latestView || !player || (stat !== 'str' && stat !== 'dex')) return;
        const preview = previewApAllocation({ player, rules: latestView.catalog.rules, stat, amount });
        if (preview.ok) dispatchDraft({ type: 'allocateAp', payload: { stat, amount } });
        return;
      }
      case 'learn-skill': {
        const skillId = button.dataset.skillId;
        if (skillId) dispatchDraft({ type: 'learnSkill', payload: { skillId } });
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
          atMerchant: view.interaction?.npcId === 'merchant',
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
          atMerchant: latestView.interaction?.npcId === 'merchant',
        });
        if (preview.disabled) return;
        shopQuantities.set(itemId, preview.quantity);
        renderPanel(latestView, true);
        return;
      }
      case 'settings-mute': {
        if (!view.saveData) return;
        const settings: Settings = { ...view.saveData.settings, muted: !view.saveData.settings.muted };
        dispatchDraft({ type: 'setSettings', payload: { settings } });
        return;
      }
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
    }
  };

  const render = (view: UiSnapshot): void => {
    if (disposed) return;
    const previousView = currentView;
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
    updateQuickButtons(view);
    renderScreen(view);
    renderFooter(view);
    renderPanel(view);
    if (view.panels.length === 0) lastPanelFocus = null;
    renderKeyGuide(view);
    renderQuestTracker(view);
    for (const [panel, button] of panelButtons) {
      const top = view.panels.at(-1) === panel;
      button.classList.toggle('is-active', top);
      button.setAttribute('aria-expanded', String(top));
      if (panel === 'inventory') {
        const player = view.saveData?.player;
        if (player) {
          const used = player.bag.length;
          const label = PANEL_LABELS[panel];
          button.setAttribute('aria-label', '開啟' + label + '（已用 ' + used + '／32 格）');
          button.title = label + '：已用 ' + used + '／32 格'
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
        const readyCount = view.saveData
          ? view.questViews.filter(({ status }) => status === 'ready').length
          : 0;
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
      // Unspent AP/SP badges: new players otherwise rarely discover the stats/skills panels.
      const unspent = panel === 'stats' ? view.saveData?.player.ap ?? 0
        : panel === 'skills' ? view.saveData?.player.sp ?? 0 : 0;
      if (unspent > 0) {
        button.dataset.badge = String(unspent);
        button.setAttribute('aria-label', '開啟' + PANEL_LABELS[panel] + '（可分配 ' + unspent + (panel === 'stats' ? ' AP' : ' SP') + '）');
      } else if (button.dataset.badge !== undefined) {
        delete button.dataset.badge;
        button.setAttribute('aria-label', '開啟' + PANEL_LABELS[panel]);
      }
    }
    if (restoreFocusAfterResume && view.screen === 'playing' && !nextResumeGate
      && screenLayer.hidden && view.saveStatus !== 'conflict' && !view.saveUpgrade) {
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
      if (confirmButton && currentView && (!currentView.saveData || replaceConfirmed)) {
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

  // The key guide floats above every panel, so Esc should fold it away first instead of
  // pausing the game (or closing the panel underneath) while the card stays open.
  const onEscapeKeyGuide = (event: Event): void => {
    if (!(event instanceof KeyboardEvent) || event.code !== 'Escape') return;
    const target = event.target instanceof Element ? event.target : null;
    const active = document.activeElement instanceof Element ? document.activeElement : null;
    const textEntry = [target, active].some((element) => element !== null
      && element.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]') !== null);
    const gameRoot = document.getElementById('game-root');
    const belongsToGame = target !== null && (shell.contains(target) || root.contains(target) || gameRoot?.contains(target) === true);
    if (belongsToGame && !textEntry && (currentView?.saveStatus === 'conflict' || currentView?.saveUpgrade)) {
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

  shell.addEventListener('click', onClick);
  shell.addEventListener('focusin', rememberPanelFocus, true);
  shell.addEventListener('focusout', rememberPanelFocus, true);
  shell.addEventListener('input', onInput);
  shell.addEventListener('change', onChange);
  shell.addEventListener('keydown', onDialogueActionRepeat, true);
  shell.addEventListener('keydown', onKeyDown);
  keyWindow?.addEventListener('keydown', onEscapeKeyGuide, true);

  return {
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
      shell.removeEventListener('keydown', onKeyDown);
      keyWindow?.removeEventListener('keydown', onEscapeKeyGuide, true);
      quickIconCache.clear();
      shell.remove();
      currentView = null;
    },
  };
}

function makeMeter(
  document: Document,
  label: string,
  value: number,
  maximum: number,
  tone: string,
  valueText = formatNumber(value) + ' / ' + formatNumber(maximum),
): HTMLElement {
  const meter = makeElement(document, 'div', 'ms-meter ms-meter--' + tone);
  const heading = makeElement(document, 'div', 'ms-meter__label');
  heading.append(makeElement(document, 'span', '', label));
  heading.append(makeElement(document, 'strong', '', valueText));
  const track = makeElement(document, 'div', 'ms-meter__track');
  const fill = makeElement(document, 'span', 'ms-meter__fill');
  fill.style.width = percent(value, maximum) + '%';
  track.append(fill);
  meter.append(heading, track);
  meter.setAttribute('role', 'meter');
  meter.setAttribute('aria-label', label);
  meter.setAttribute('aria-valuemin', '0');
  meter.setAttribute('aria-valuemax', String(maximum));
  meter.setAttribute('aria-valuenow', String(Math.min(value, maximum)));
  meter.setAttribute('aria-valuetext', valueText);
  return meter;
}

function makeScreenCard(document: Document, title: string, description: string): HTMLElement {
  const card = makeElement(document, 'section', 'ms-screen-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
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
    '需求 Lv.' + skill.requiredLevel + ' ' + (skill.requiredJob === 'swordsman' ? '劍士' : '初心者'),
  ];
  // Passives have no cost or cooldown; "MP 0｜冷卻 0ms" only added noise.
  if (skill.kind !== 'passive') parts.push('MP ' + skill.mpCost, '冷卻 ' + (skill.cooldownMs / 1000) + ' 秒');
  // Must match domain/combat calculateDamage: multiplierBase + multiplierPerRank × (rank − 1).
  if (skill.kind === 'attack') parts.push('倍率 ' + (skill.multiplierBase + skill.multiplierPerRank * (Math.max(1, rank) - 1)).toFixed(2));
  if (skill.kind === 'buff') parts.push('持續 ' + Math.round(skill.durationMs / 1000) + ' 秒・防禦 +' + skill.defensePerRank * Math.max(1, rank));
  if (skill.hpPerRank) parts.push('最大 HP +' + skill.hpPerRank * Math.max(1, rank));
  if (skill.regenPerRank) parts.push('每 2 秒恢復 ' + skill.regenPerRank * Math.max(1, rank) + ' HP');
  return parts.join('｜');
}

/** What one more SP buys, so 提升至等級 N says what it changes. Empty when unlearned or maxed. */
function skillNextRankPreview(skill: UiSnapshot['catalog']['rules']['skills'][string], rank: number): string {
  if (rank < 1 || rank >= skill.maxRank) return '';
  const next = rank + 1;
  const parts: string[] = [];
  if (skill.kind === 'attack') parts.push('倍率 ' + (skill.multiplierBase + skill.multiplierPerRank * (next - 1)).toFixed(2));
  if (skill.kind === 'buff') parts.push('防禦 +' + skill.defensePerRank * next);
  if (skill.hpPerRank) parts.push('最大 HP +' + skill.hpPerRank * next);
  if (skill.regenPerRank) parts.push('每 2 秒恢復 ' + skill.regenPerRank * next + ' HP');
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

function buildWorldJournal(document: Document, view: UiSnapshot, selectedQuestId: string | null): HTMLElement {
  const selectedQuest = chooseJournalQuest(view.questViews, selectedQuestId);
  const journal = buildVisualQuests(document, view, selectedQuest?.questId ?? null);
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

  const progress = deriveWorldProgress(view.saveData, view.questViews.map(({ questId }) => questId));
  const ending = buildWorldEndingFeedback(document, view, true);
  if (ending) journal.insertBefore(ending, selectedCard);

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
    journal.insertBefore(section, selectedCard);
  }

  if (selectedQuest?.questId === 'q21') {
    for (const verb of selectedCard.querySelectorAll<HTMLElement>('.ms-journal-objective__verb')) {
      if (verb.textContent === '調律') verb.textContent = '調查';
    }
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
  selectedQuestId: string | null;
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
      content.append(buildWorldJournal(document, view, state.selectedQuestId));
      break;
    case 'map':
      content.append(buildWorldMap(document, view, state.selectedMapId));
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

function buildInventoryPanel(document: Document, view: UiSnapshot, state: PanelBuildState, parent: HTMLElement): void {
  const player = view.saveData?.player;
  if (!player) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '建立角色後即可使用背包。'));
    return;
  }
  // Say how full the bag is, so a "bag full" refusal never comes as a surprise.
  const used = player.bag.length;
  const note = makeElement(document, 'p', 'ms-panel-note', '');
  const usage = makeElement(document, 'strong', used >= 28 ? 'ms-bag-usage is-near-full' : 'ms-bag-usage', '已用 ' + used + '／32 格');
  note.append(usage, document.createTextNode('。點選物品可查看能力與價格；滑鼠停留可看完整名稱。'));
  parent.append(note);
  if (state.bagStateMessage) {
    const resetNote = makeElement(document, 'p', 'ms-panel-note ms-bag-state-note', state.bagStateMessage);
    resetNote.setAttribute('role', 'status');
    parent.append(resetNote);
  }
  const categories = INVENTORY_FILTERS;
  const categoryBar = makeElement(document, 'div', 'ms-category-bar');
  categoryBar.setAttribute('role', 'group');
  categoryBar.setAttribute('aria-label', '背包分類');
  for (const category of categories) {
    const count = selectInventoryEntries(player.bag, view.catalog.rules.items, category.id).length;
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
  const categoryLabel = categories.find(({ id }) => id === state.inventoryFilter)?.label ?? state.inventoryFilter;
  note.append(document.createTextNode(' 目前分類「' + categoryLabel + '」共 ' + filtered.length + ' 組物品。'
    + (state.inventoryFilter === 'all' ? '' : ' 其他分類的物品仍計入已用格數。')));
  const selected = filtered.find(({ bagIndex }) => bagIndex === state.selectedBagIndex) ?? null;
  const layout = makeElement(document, 'div', 'ms-inventory-layout');
  const grid = makeElement(document, 'div', 'ms-bag-grid');
  grid.setAttribute('aria-label', state.inventoryFilter === 'all'
    ? '全部背包，顯示 ' + filtered.length + ' 組物品，共 32 格'
    : '背包分類「' + categoryLabel + '」，顯示 ' + filtered.length + ' 組物品，共 32 格');
  for (let index = 0; index < 32; index += 1) {
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
    if (item && isWearableUpgrade(view, player, item)) {
      const upgrade = makeElement(document, 'span', 'ms-bag-slot__upgrade', '▲');
      upgrade.title = '比目前裝備更好';
      slot.append(upgrade);
      slot.setAttribute('aria-label', slot.getAttribute('aria-label') + '，可升級裝備');
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
    detail.append(
      makeInterfaceIcon(document, view, item?.iconKey ?? '', item?.name ?? stack.itemId, 'ms-item-detail__icon'),
      makeElement(document, 'h3', '', item?.name ?? stack.itemId),
      makeBadge(document, kindLabel(item?.kind ?? '未知'), 'category'),
      makeElement(document, 'p', 'ms-detail-quantity', '數量 ×' + stack.quantity),
      makeElement(document, 'pre', 'ms-detail-copy', item ? itemDetails(item) : '目前無此物品資料。'),
    );
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
      if (compare) detail.append(compare);
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
      if (equipmentPreview.ok) {
        const equipmentPreviewNote = makeElement(document, 'p', 'ms-panel-note', '裝備後預覽：' + equipmentSummary);
        equipmentPreviewNote.id = 'brightwood-first-oath-equip-preview-' + bagIndex;
        equipButton.setAttribute('aria-describedby', equipmentPreviewNote.id);
        detail.append(equipmentPreviewNote);
      }
      detail.append(equipButton);
      if (!equipmentPreview.ok) detail.append(makeElement(document, 'span', 'ms-disabled-reason', equipmentPreview.message));
    }
    if (item && item.kind !== 'quest' && item.sellPrice > 0) {
      const atMerchant = view.interaction?.npcId === 'merchant';
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
  const key = (action: 'skill1' | 'skill2' | 'skill3') => effectiveKeyText(bindings, action);
  const note = makeElement(document, 'p', 'ms-panel-note', '');
  note.append(
    makeElement(document, 'strong', '', '可用 SP：' + player.sp),
    document.createTextNode((player.job === 'swordsman' ? '。每次升級獲得 1 SP。' : '。轉職為劍士後，每次升級獲得 1 SP。') + '快捷鍵 ' + key('skill1') + '／' + key('skill2') + '／' + key('skill3') + ' 對應重斬、橫掃、堅韌守護。'),
  );
  parent.append(note);
  const grid = makeElement(document, 'div', 'ms-skill-list');
  const skills = Object.values(view.catalog.rules.skills)
    .filter((skill) => skill.requiredJob !== 'enemy' && skill.id !== 'basic')
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
    head.append(
      makeInterfaceIcon(document, view, 'skill:' + skill.id, skill.name, 'ms-skill-card__icon'),
      makeElement(document, 'h3', '', skill.name),
      makeBadge(document, '等級 ' + rank + '/' + skill.maxRank, learned ? 'level' : 'neutral'),
    );
    // The badge above already shows 等級 N/M, so the detail line leaves it out.
    card.append(head, makeElement(document, 'p', 'ms-detail-copy', skillDetails(skill, rank, false)));
    const preview = skillNextRankPreview(skill, rank);
    if (preview) card.append(makeElement(document, 'p', 'ms-skill-card__next', preview));
    if (skill.kind === 'passive') card.append(makeElement(document, 'p', 'ms-panel-note', '被動技能不會放入快捷欄。'));
    if (skill.id === 'vitality') card.append(makeElement(document, 'p', 'ms-panel-note', '提升最大 HP；不會自動恢復生命。'));
    if (skill.id === 'rest-recovery') card.append(makeElement(document, 'p', 'ms-panel-note', '連續 3 秒沒有攻擊或受傷時，開始逐步恢復生命。'));
    const actionLabel = !rankReady ? '已滿級' : learned ? '提升至等級 ' + (rank + 1) : '學習技能';
    const learningSummary = learningPreview.ok
      ? '學習後：SP ' + formatNumber(player.sp) + ' → ' + formatNumber(learningPreview.value.remainingSp)
        + (learningPreview.value.before.maxHp !== learningPreview.value.after.maxHp
          ? '；最大 HP ' + formatNumber(learningPreview.value.before.maxHp) + ' → ' + formatNumber(learningPreview.value.after.maxHp)
          : '')
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
  const atMerchant = view.interaction?.npcId === 'merchant';
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
  const used = player.bag.length;
  const capacityNote = makeElement(document, 'p', 'ms-panel-note');
  capacityNote.append(
    document.createTextNode('背包：'),
    makeElement(document, 'strong', used >= 28 ? 'ms-bag-usage is-near-full' : 'ms-bag-usage', '已用 ' + used + '／32 格'),
    document.createTextNode('。可堆疊物品可補入同類未滿堆疊；能否購買依各貨品提示。'),
  );
  parent.append(capacityNote);
  const offers = selectShopOffers(view.catalog.rules.items, state.shopFilter);
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
      const owned = Object.values(player.equipment).includes(item.id) || player.bag.some((stack) => stack.itemId === item.id);
      if (player.level < item.minLevel) badges.append(makeBadge(document, 'Lv.' + item.minLevel + ' 才能裝備', 'warning'));
      if (owned) badges.append(makeBadge(document, '已擁有', 'neutral'));
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
    const count = selectShopOffers(view.catalog.rules.items, category.id).length;
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
        '出售後預覽：背包已用 ' + formatNumber(player.bag.length) + '／32 → ' +
          formatNumber(player.bag.length - materialSalePreview.expectedSoldStacks) + '／32 格；騰出 ' +
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

  if (relevant.length === 0) return;
  parent.append(makeSectionTitle(document, '任務對話'));
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
      card.append(makeElement(document, 'p', 'ms-reward-line', '目標：' + quest.objectives.map((objective) => objectiveText(view, objective)).join('；')));
      card.append(makeElement(document, 'p', 'ms-reward-line', '獎勵：' + rewardText(view, quest.reward)));
      const acceptButton = makeButton(document, '接取任務', 'accept-quest', {
        className: 'ms-button ms-button--primary',
        data: { questId: quest.questId, focus: 'dialogue-accept-' + quest.questId },
      });
      acceptButton.setAttribute('aria-label', '接取任務：' + quest.title);
      card.append(acceptButton);
    } else if (quest.status === 'ready') {
      card.append(makeElement(document, 'p', 'ms-reward-line', '獎勵：' + rewardText(view, quest.reward)));
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
    } else {
      card.append(makeElement(document, 'p', 'ms-reward-line', '進度：' + quest.objectives.map((objective) => objectiveText(view, objective)).join('；')));
    }
    parent.append(card);
  }
}

function buildSettingsPanel(document: Document, view: UiSnapshot, state: PanelBuildState, parent: HTMLElement): void {
  const settings = view.saveData?.settings;
  if (!settings) {
    parent.append(makeElement(document, 'p', 'ms-empty-state', '建立角色後即可調整設定。'));
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
    '技能快捷 ' + skillKeys + ' 對應重斬、橫掃、堅韌守護；未學或冷卻中會顯示狀態。',
    '普通攻擊與技能按一下施放；長按不會連續施放。',
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
