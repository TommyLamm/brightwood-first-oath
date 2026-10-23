import './styles.css';
import './journal.css';
import './world-map.css';
import './illustrated-panels.css';
import { buildVisualStats, buildVisualQuests } from './illustrated-panels.js';
import { buildWorldMap } from './world-map.js';
import { PLANNED_REGIONS } from './world-map-model.js';
import { DEFAULT_KEY_BINDINGS, type GameAction } from '../app/keyboard.js';
import type { CommandDraft, PanelId } from '../contracts/commands.js';
import type { UiController, UiSnapshot } from '../contracts/ports.js';
import type { Settings } from '../contracts/types.js';

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

const KEY_ACTIONS: { id: string; label: string }[] = [
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
  | 'retry-save' | 'discard-save' | 'play-temporary' | 'toggle-pause' | 'return-title' | 'respawn' | 'retry-boss'
  | 'return-town' | 'attack' | 'pickup' | 'interact' | 'use-item' | 'select-bag'
  | 'inventory-filter' | 'select-map' | 'select-quest'
  | 'equip-bag' | 'sell-bag' | 'sell-materials' | 'unequip' | 'allocate-ap' | 'learn-skill' | 'accept-quest'
  | 'claim-quest' | 'buy' | 'settings-mute' | 'settings-rebind' | 'use-cloud-version'
  | 'toggle-key-guide' | 'settings-reset-bindings' | 'reload-page';

type KeyGuideItem = {
  label: string;
  action: GameAction;
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

function getKeyBadgeText(bindings: Partial<Record<GameAction, string>>, item: KeyGuideItem): string {
  if (item.action === 'moveLeft') {
    const left = codeLabel(bindings.moveLeft ?? DEFAULT_KEY_BINDINGS.moveLeft);
    const right = codeLabel(bindings.moveRight ?? DEFAULT_KEY_BINDINGS.moveRight);
    return left === '←' && right === '→' ? '← / →' : `${left} / ${right}`;
  }
  if (item.action === 'climbUp') {
    const up = codeLabel(bindings.climbUp ?? DEFAULT_KEY_BINDINGS.climbUp);
    const down = codeLabel(bindings.climbDown ?? DEFAULT_KEY_BINDINGS.climbDown);
    return up === '↑' && down === '↓' ? '↑ / ↓' : `${up} / ${down}`;
  }
  const code = bindings[item.action] ?? DEFAULT_KEY_BINDINGS[item.action];
  if (item.action === 'jump' && (!code || code === 'AltLeft' || code === 'AltRight')) {
    return 'Alt';
  }
  if (item.action === 'attack' && (!code || code === 'ControlLeft' || code === 'ControlRight')) {
    return 'Ctrl';
  }
  return codeLabel(code);
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
  const asset = assets[name];
  if (asset) {
    const image = makeElement(document, 'img', 'ms-journal-icon__image');
    image.src = new URL('assets/interface/journal/' + asset + '.png', document.baseURI).href;
    image.alt = '';
    image.draggable = false;
    icon.append(image);
  } else icon.textContent = '⚙';
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

function shopKindOrder(kind: string): number {
  return ['consumable', 'weapon', 'body', 'hat'].indexOf(kind) >>> 0;
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
    kill: '擊敗', collect: '持有', equip: '裝備', reach: '到達',
  }[objective.type];
  return action + ' ' + targetName(view, objective.targetId, objective.type)
    + ' ' + Math.min(objective.current, objective.required) + '/' + objective.required;
}

function preserveFocus(container: HTMLElement, renderContent: () => void): void {
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
    .find((element) => element.dataset.focus === key);
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
  region.append(header, questTracker);
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
      data: slot.kind === 'item' ? { itemId: slot.id } : { skillId: slot.id },
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
  const focusBanner = makeElement(document, 'div', 'ms-focus-banner', '遊戲已暫停：畫面失去焦點。點一下遊戲畫面即可繼續。');
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
  let inventoryFilter = 'all';
  let selectedMapId: string | null = null;
  let selectedQuestId: string | null = null;
  let createRequested = false;
  let replaceConfirmed = false;
  let discardConfirmed = false;
  let nameDraft = '旅人';
  let shopQuantities = new Map<string, number>();
  let sellQuantities = new Map<number, number>();
  let pendingBinding: string | null = null;
  let bindingMessage = '';
  // Which row the message is about, so it shows next to that row instead of below all 17 bindings.
  let bindingMessageAction: string | null = null;
  let keyGuideExpanded = false;
  let lastKeyGuideSignature = '';
  let disposed = false;

  const dispatchDraft = (command: CommandDraft): void => {
    if (!disposed) dispatch(command);
  };

  const renderKeyGuide = (view: UiSnapshot | null): void => {
    keyGuideToggle.textContent = '?';
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
    headerRow.append(
      makeElement(document, 'h4', '', '操作按鍵提示'),
      makeButton(document, '✕ 收起', 'toggle-key-guide', {
        className: 'ms-button ms-button--close',
        title: '收起按鍵提示',
      }),
    );
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

  const captureNameInput = (): HTMLInputElement => {
    const input = makeElement(document, 'input', 'ms-input');
    input.type = 'text';
    input.maxLength = 16;
    input.autocomplete = 'off';
    input.placeholder = '輸入角色名稱';
    input.value = nameDraft;
    input.dataset.focus = 'character-name';
    input.setAttribute('aria-label', '角色名稱');
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
      hp.title = 'HP 偏低，記得按 ' + codeLabel(view.saveData?.settings.bindings.potionHp ?? DEFAULT_KEY_BINDINGS.potionHp) + ' 喝紅色藥水';
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
    const signature = JSON.stringify({ quests: view.questViews, map: view.saveData?.location.mapId, chapterComplete });
    if (signature === lastQuestSignature) return;
    lastQuestSignature = signature;
    const quest = view.questViews.find((entry) => entry.status === 'ready')
      ?? view.questViews.find((entry) => entry.status === 'active')
      ?? view.questViews.find((entry) => entry.status === 'available');
    questTracker.replaceChildren();
    const heading = makeElement(document, 'span', 'ms-quest-tracker__heading', '任務手帳');
    heading.prepend(makeJournalIcon(document, 'quests'));
    const title = quest?.title ?? (chapterComplete ? '第一章完成' : '自由探索');
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
      ? (chapterComplete ? '古礦已重歸寧靜，可繼續自由探索木葉世界。' : '探索世界，尋找新的故事。')
      : quest.status === 'available' ? '與' + giver + '交談'
      : quest.status === 'ready' ? '任務完成，向' + recipient + '回報'
      : quest.objectives.map((objective) => objectiveText(view, objective)).join(' · ');
    const detailLine = makeElement(document, 'span', 'ms-quest-tracker__detail', detail);
    // Keep the map name in one piece: it used to wrap as 「（赤岩山」/「徑）」.
    if (place) detailLine.append(makeElement(document, 'span', 'ms-quest-tracker__place', place));
    questTracker.append(heading, makeElement(document, 'strong', '', title), detailLine);
    questTracker.title = title + '｜' + detail + place;
  };

  const updateQuickButtons = (view: UiSnapshot): void => {
    const player = view.saveData?.player;
    const playing = view.screen === 'playing';
    const keyForSkill: Record<string, string> = {
      basic: 'attack',
      'heavy-strike': 'skill1',
      sweep: 'skill2',
      'iron-guard': 'skill3',
      'small-red': 'potionHp',
      'small-blue': 'potionMp',
    };
    for (const [skillId, button] of quickButtons) {
      const key = button.querySelector<HTMLElement>('.ms-quick-slot__key');
      if (key) {
        const action = keyForSkill[skillId] as GameAction;
        key.textContent = codeLabel(view.saveData?.settings.bindings[action] ?? DEFAULT_KEY_BINDINGS[action]);
      }
      const definition = quickDefinitions.find((slot) => slot.id === skillId);
      const iconHost = button.querySelector<HTMLElement>('.ms-quick-slot__icon');
      if (iconHost) {
        const iconKey = definition?.kind === 'item'
          ? view.catalog.rules.items[skillId]?.iconKey
          : definition?.kind === 'skill' ? 'skill:' + skillId : view.catalog.rules.items['starter-sword']?.iconKey;
        iconHost.replaceChildren(iconKey
          ? makeInterfaceIcon(document, view, iconKey, definition?.label ?? skillId, 'ms-quick-slot__icon-image')
          : makeBadge(document, '普攻', 'neutral'));
      }
      const skill = view.catalog.rules.skills[skillId];
      const state = button.querySelector<HTMLElement>('.ms-quick-slot__state');
      const label = button.querySelector<HTMLElement>('.ms-quick-slot__label');
      if (!player || !skill) {
        button.disabled = true;
        if (state) state.textContent = '尚未載入';
        continue;
      }
      if (label) label.textContent = skill.name;
      if (skillId === 'basic') {
        button.disabled = !playing;
        if (state) state.textContent = 'MP 0';
        button.title = '普通攻擊：MP 0';
        continue;
      }
      const rank = player.skillRanks[skillId] ?? 0;
      button.classList.toggle('is-unlearned', rank === 0);
      const cooldown = Math.max(0, (view.skillReadyAtMs[skillId] ?? 0) - view.nowMs);
      const reason = rank === 0 ? '未學習' : player.mp < skill.mpCost ? 'MP 不足' : cooldown > 0 ? '冷卻中' : '';
      // A running buff matters more than why it can't be recast right now.
      const buffLeftSec = skill.kind === 'buff' && rank > 0
        ? Math.ceil(Math.max(0, (view.guardUntilMs ?? 0) - view.nowMs) / 1000) : 0;
      button.classList.toggle('is-unavailable', Boolean(reason) && buffLeftSec === 0);
      button.classList.toggle('is-buff-active', buffLeftSec > 0);
      button.disabled = !playing || Boolean(reason);
      if (state) state.textContent = buffLeftSec > 0 ? buffLeftSec + ' 秒' : reason || ('等級 ' + rank + '・MP ' + skill.mpCost);
      button.title = skill.name + '｜' + skillDetails(skill, rank)
        + (buffLeftSec > 0 ? '｜效果剩餘 ' + buffLeftSec + ' 秒' : '') + (reason ? '｜' + reason : '');
    }
    for (const slotId of ['small-red', 'small-blue'] as const) {
      const fallbackId = slotId === 'small-red' ? 'large-red' : 'large-blue';
      const button = quickButtons.get(slotId);
      const state = button?.querySelector<HTMLElement>('.ms-quick-slot__state');
      const label = button?.querySelector<HTMLElement>('.ms-quick-slot__label');
      const iconHost = button?.querySelector<HTMLElement>('.ms-quick-slot__icon');
      const smallCount = player?.bag
        .filter((stack) => stack.itemId === slotId)
        .reduce((sum, stack) => sum + stack.quantity, 0) ?? 0;
      const largeCount = player?.bag
        .filter((stack) => stack.itemId === fallbackId)
        .reduce((sum, stack) => sum + stack.quantity, 0) ?? 0;
      const activeItemId = smallCount > 0 || largeCount === 0 ? slotId : fallbackId;
      const count = activeItemId === slotId ? smallCount : largeCount;
      const item = view.catalog.rules.items[activeItemId];
      if (button) button.dataset.itemId = activeItemId;
      if (label && item) label.textContent = item.name;
      if (iconHost && item?.iconKey) {
        iconHost.replaceChildren(makeInterfaceIcon(document, view, item.iconKey, item.name, 'ms-quick-slot__icon-image'));
      }
      const cooldown = Math.max(0, view.potionReadyAtMs - view.nowMs);
      const reason = count === 0 ? '沒有藥水' : cooldown > 0 ? '冷卻中' : '';
      if (button) button.disabled = !playing || Boolean(reason);
      if (state) state.textContent = reason || ('×' + count);
      if (button) button.title = (item?.name ?? activeItemId) + (reason ? '｜' + reason : '');
    }
    pickupButton.disabled = !playing;
    interactButton.disabled = !playing;
    const bindings = view.saveData?.settings.bindings ?? DEFAULT_KEY_BINDINGS;
    pickupButton.textContent = codeLabel(bindings.pickup ?? DEFAULT_KEY_BINDINGS.pickup) + ' 拾取';
    interactButton.textContent = codeLabel(bindings.interact ?? DEFAULT_KEY_BINDINGS.interact) + ' 互動';
    pauseButton.hidden = !playing;
    pauseButton.disabled = !playing;
    const atTown = player !== undefined && view.saveData?.location.mapId === 'town';
    returnTownButton.hidden = !player || atTown || !playing || !view.saveData?.visitedMaps.includes('town');
    returnTownButton.disabled = !view.canReturnTown;
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
  };

  const renderScreen = (view: UiSnapshot): void => {
    const signature = JSON.stringify({
      screen: view.screen,
      error: view.error,
      saveStatus: view.saveStatus,
      hasSave: view.saveData !== null,
      canReturnTown: view.canReturnTown,
      createRequested,
      replaceConfirmed,
      discardConfirmed,
      saveMessage: view.saveStatus === 'loadError' ? view.saveMessage : null,
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
      if ((view.screen === 'title' && !view.error) || showCreate) {
      if (showCreate) {
        const card = makeScreenCard(document, '建立角色', view.saveData
          ? (replaceConfirmed ? '第二次確認：既有角色進度將被取代，且無法復原。' : '建立新角色會取代目前角色，請先確認後再送出。')
          : '輸入角色名稱，確認後開始冒險。');
        card.append(captureNameInput());
        if (view.saveData && !replaceConfirmed) {
          card.append(makeButton(document, '我了解，繼續確認', 'create-confirm', { className: 'ms-button ms-button--danger' }));
        } else {
          card.append(makeButton(document, view.saveData ? '確認取代並建立' : '確認建立角色', 'create-confirm', {
            className: 'ms-button ms-button--primary',
            disabled: !nameDraft.trim(),
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
            makeElement(document, 'p', 'ms-warning', '此版本不能讀取目前存檔格式。請重新開啟相容版本；不會以新資料覆蓋雲端進度。'),
            makeButton(document, '暫時遊玩', 'play-temporary', { className: 'ms-button ms-button--secondary' }),
          );
        } else if (view.saveData) {
          // Say whose adventure 繼續冒險 resumes before the player picks it over 建立新角色.
          const saved = view.saveData.player;
          // An arena save resumes at the mine entrance (see restoreGame), so name that instead.
          const savedMap = view.catalog?.world.maps[view.saveData.location.mapId];
          const place = savedMap?.boss ? view.catalog?.world.maps['mine-gate']?.name : savedMap?.name;
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
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'paused') {
        const card = makeScreenCard(document, '冒險已暫停', '怪物與時間都已停止。按 Esc 或「繼續遊戲」回到冒險。');
        card.append(
          makeButton(document, '繼續遊戲', 'toggle-pause', { className: 'ms-button ms-button--primary' }),
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
        const claimed = questIds.filter((id) => view.saveData!.quests[id]?.status === 'claimed').length;
        const card = makeScreenCard(document, '第一章「守衛的誓約」完成', '古礦守衛已平息，礦道守望者收下了守衛核心。木葉地區重歸寧靜，你的冒險仍可繼續。');
        const summary = makeElement(document, 'ul', 'ms-help-list');
        for (const line of [
          '角色：' + player.name + '・Lv.' + player.level + '・' + jobLabel(player.job),
          '完成任務：' + claimed + ' / ' + questIds.length,
          '持有金幣：' + formatNumber(player.coins),
        ]) summary.append(makeElement(document, 'li', '', line));
        card.append(summary);
        card.append(makeButton(document, '繼續自由探索', 'continue', { className: 'ms-button ms-button--primary' }));
        card.append(makeButton(document, '返回標題', 'return-title', { className: 'ms-button ms-button--secondary' }));
        screenLayer.hidden = false;
        screenLayer.append(card);
        return;
      }
      if (view.screen === 'result') {
        // This screen only appears after the guardian is defeated and its core collected.
        const card = makeScreenCard(document, '古礦守衛已被擊敗！', '守衛核心已收入背包。返回後前往赤岩山徑，向礦道守望者回報。');
        card.append(makeButton(document, '返回城鎮', 'return-town', {
          className: 'ms-button ms-button--primary',
          disabled: !view.canReturnTown,
          title: view.canReturnTown ? '返回木葉鎮' : '目前不可回城',
        }));
        card.append(makeButton(document, '再次挑戰守衛', 'retry-boss', { className: 'ms-button ms-button--secondary' }));
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
        if (view.screen === 'playing') focusGameCanvas();
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
      shopQuantities: Array.from(shopQuantities.entries()),
      sellQuantities: Array.from(sellQuantities.entries()),
      pendingBinding,
      bindingMessage,
      bindingMessageAction,
    });
    if (!force && signature === lastPanelSignature) return;
    lastPanelSignature = signature;
    const samePanel = panelHost.querySelector<HTMLElement>('.ms-panel')?.dataset.panel === panel;
    const scrollTop = samePanel ? panelHost.querySelector<HTMLElement>('.ms-panel__body')?.scrollTop ?? 0 : 0;
    const openDetails = new Set(samePanel
      ? Array.from(panelHost.querySelectorAll<HTMLDetailsElement>('details[open][data-detail-id]')).map((detail) => detail.dataset.detailId)
      : []);
    preserveFocus(panelHost, () => {
      const card = makeElement(document, 'section', 'ms-panel');
      card.setAttribute('aria-label', PANEL_LABELS[panel]);
      card.dataset.panel = panel;
      const heading = makeElement(document, 'header', 'ms-panel__header');
      const title = makeElement(document, 'div', 'ms-panel__title');
      title.append(
        makeElement(document, 'h2', '', PANEL_LABELS[panel]),
      );
      const closeButton = makeButton(document, '關閉', 'close-panel', {
        className: 'ms-button ms-button--close',
        title: '關閉最上層面板',
      });
      closeButton.dataset.focus = 'panel-close';
      heading.append(title, closeButton);
      const body = makeElement(document, 'div', 'ms-panel__body');
      body.append(buildPanelContent(document, view, panel, {
        selectedBagIndex,
        selectedMapId,
        selectedQuestId,
        inventoryFilter,
        shopQuantities,
        sellQuantities,
        pendingBinding,
        bindingMessage,
        bindingMessageAction,
      }));
      for (const detail of body.querySelectorAll<HTMLDetailsElement>('details[data-detail-id]')) {
        detail.open = openDetails.has(detail.dataset.detailId);
      }
      card.append(heading, body);
      panelHost.replaceChildren(card);
    });
    const renderedBody = panelHost.querySelector<HTMLElement>('.ms-panel__body');
    if (renderedBody && samePanel) renderedBody.scrollTop = scrollTop;
  };

  const handleAction = (button: HTMLButtonElement, view: UiSnapshot): void => {
    const action = button.dataset.uiAction as UiAction | undefined;
    if (!action) return;
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
        dispatchDraft({ type: 'continue', payload: {} });
        focusGameCanvas(button);
        return;
      case 'new-role':
        createRequested = true;
        replaceConfirmed = false;
        nameDraft = '旅人';
        lastScreenSignature = '';
        renderScreen(view);
        return;
      case 'create-confirm':
        if (view.saveData && !replaceConfirmed) {
          replaceConfirmed = true;
          lastScreenSignature = '';
          renderScreen(view);
          return;
        }
        if (!nameDraft.trim()) return;
        createRequested = false;
        replaceConfirmed = false;
        dispatchDraft({ type: 'newGame', payload: { name: nameDraft.trim() } });
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
      case 'toggle-pause':
        dispatchDraft({ type: 'togglePause', payload: {} });
        if (view.screen === 'paused') focusGameCanvas(button);
        return;
      case 'return-title':
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
        focusGameCanvas(button);
        return;
      case 'use-item': {
        const itemId = button.dataset.itemId;
        if (itemId) dispatchDraft({ type: 'useItem', payload: { itemId } });
        if (view.panels.length === 0) focusGameCanvas(button);
        return;
      }
      case 'select-bag':
        selectedBagIndex = Number(button.dataset.bagIndex);
        if (Number.isInteger(selectedBagIndex)) renderPanel(view, true);
        return;
      case 'inventory-filter':
        inventoryFilter = button.dataset.kind ?? 'all';
        selectedBagIndex = null;
        renderPanel(view, true);
        return;
      case 'equip-bag': {
        const bagIndex = Number(button.dataset.bagIndex);
        if (Number.isInteger(bagIndex)) dispatchDraft({ type: 'equip', payload: { bagIndex } });
        return;
      }
      case 'sell-materials': {
        const bag = view.saveData?.player.bag ?? [];
        // Highest index first so earlier stacks keep their positions while emptied ones are removed.
        for (let bagIndex = bag.length - 1; bagIndex >= 0; bagIndex -= 1) {
          const stack = bag[bagIndex]!;
          const item = view.catalog.rules.items[stack.itemId];
          if (item?.kind !== 'material' || item.sellPrice <= 0) continue;
          sellQuantities.delete(bagIndex);
          dispatchDraft({ type: 'sell', payload: { bagIndex, quantity: stack.quantity } });
        }
        return;
      }
      case 'sell-bag': {
        const bagIndex = Number(button.dataset.bagIndex);
        const maxQuantity = view.saveData?.player.bag[bagIndex]?.quantity ?? 1;
        const rawQuantity = Number(button.dataset.quantity ?? sellQuantities.get(bagIndex) ?? 1);
        const quantity = clampInteger(rawQuantity, 1, maxQuantity);
        if (Number.isInteger(bagIndex) && quantity > 0) {
          sellQuantities.delete(bagIndex);
          dispatchDraft({ type: 'sell', payload: { bagIndex, quantity } });
        }
        return;
      }
      case 'unequip': {
        const slot = button.dataset.slot;
        if (slot === 'weapon' || slot === 'body' || slot === 'hat') dispatchDraft({ type: 'unequip', payload: { slot } });
        return;
      }
      case 'allocate-ap': {
        const stat = button.dataset.stat;
        const available = view.saveData?.player.ap ?? 0;
        const amount = clampInteger(Number(button.dataset.amount ?? 1), 1, Math.max(1, available));
        if (stat === 'str' || stat === 'dex') dispatchDraft({ type: 'allocateAp', payload: { stat, amount } });
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
        if (questId) dispatchDraft({ type: 'claimQuest', payload: { questId } });
        return;
      }
      case 'buy': {
        const itemId = button.dataset.itemId;
        const stackable = (currentView?.catalog.rules.items[itemId ?? '']?.stackLimit ?? 1) > 1;
        if (itemId) dispatchDraft({ type: 'buy', payload: { itemId, quantity: stackable ? shopQuantities.get(itemId) ?? 1 : 1 } });
        return;
      }
      case 'settings-mute': {
        if (!view.saveData) return;
        const settings: Settings = { ...view.saveData.settings, muted: !view.saveData.settings.muted };
        dispatchDraft({ type: 'setSettings', payload: { settings } });
        return;
      }
      case 'use-cloud-version':
        dispatchDraft({ type: 'useCloudVersion', payload: {} });
        return;
      case 'settings-rebind': {
        const actionId = button.dataset.actionId;
        if (!actionId || !KEY_ACTIONS.some(({ id }) => id === actionId)) return;
        pendingBinding = actionId;
        bindingMessageAction = actionId;
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
    currentView = view;
    // Before a character is in the world, hide the empty in-game HUD and show the cover art instead.
    shell.classList.toggle('is-pregame', createRequested
      || view.screen === 'title' || view.screen === 'create' || view.screen === 'loading' || view.screen === 'error');
    renderProfile(view);
    renderMapIndicator(view);
    updateQuickButtons(view);
    renderScreen(view);
    renderFooter(view);
    renderPanel(view);
    renderKeyGuide(view);
    renderQuestTracker(view);
    for (const [panel, button] of panelButtons) {
      const top = view.panels.at(-1) === panel;
      button.classList.toggle('is-active', top);
      button.setAttribute('aria-expanded', String(top));
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
  };

  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-ui-action]');
    if (!button || !shell.contains(button) || button.disabled || !currentView) return;
    handleAction(button, currentView);
  };

  const onInput = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.dataset.focus === 'character-name') {
      nameDraft = target.value;
      lastScreenSignature = '';
      const confirmButton = screenLayer.querySelector<HTMLButtonElement>('[data-ui-action="create-confirm"]');
      if (confirmButton && currentView && (!currentView.saveData || replaceConfirmed)) {
        confirmButton.disabled = !nameDraft.trim();
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
      if (!Number.isInteger(value) || value < 1) return;
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
    event.preventDefault();
    event.stopPropagation();
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
    // Compare against the effective bindings (defaults + saved overrides) so a new key
    // cannot silently steal a default binding from another action.
    const effective: Record<string, string> = { ...DEFAULT_KEY_BINDINGS, ...bindings };
    const duplicate = Object.entries(effective).find(([action, boundCode]) => action !== pendingBinding && boundCode === code);
    if (duplicate) {
      const action = KEY_ACTIONS.find((entry) => entry.id === duplicate[0])?.label ?? duplicate[0];
      bindingMessage = codeLabel(code) + ' 已綁定「' + action + '」，請選擇另一個按鍵。';
      renderPanel(currentView, true);
      return;
    }
    const settings: Settings = { ...currentView.saveData.settings, bindings: { ...bindings, [pendingBinding]: code } };
    bindingMessage = '已將按鍵設為 ' + codeLabel(code) + '。';
    pendingBinding = null;
    dispatchDraft({ type: 'setSettings', payload: { settings } });
    renderPanel(currentView, true);
  };

  // The key guide floats above every panel, so Esc should fold it away first instead of
  // pausing the game (or closing the panel underneath) while the card stays open.
  const onEscapeKeyGuide = (event: Event): void => {
    if (!(event instanceof KeyboardEvent) || event.code !== 'Escape' || !keyGuideExpanded || pendingBinding) return;
    event.preventDefault();
    event.stopPropagation();
    keyGuideExpanded = false;
    renderKeyGuide(currentView);
  };
  const keyWindow = shell.ownerDocument.defaultView;

  shell.addEventListener('click', onClick);
  shell.addEventListener('input', onInput);
  shell.addEventListener('change', onChange);
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
      shell.removeEventListener('click', onClick);
      shell.removeEventListener('input', onInput);
      shell.removeEventListener('change', onChange);
      shell.removeEventListener('keydown', onKeyDown);
      keyWindow?.removeEventListener('keydown', onEscapeKeyGuide, true);
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

type PanelBuildState = {
  selectedBagIndex: number | null;
  selectedMapId: string | null;
  selectedQuestId: string | null;
  inventoryFilter: string;
  shopQuantities: Map<string, number>;
  sellQuantities: Map<number, number>;
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
      content.append(buildVisualQuests(document, view, state.selectedQuestId));
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
  const categories = [
    { id: 'all', label: '全部' },
    { id: 'equipment', label: '裝備' },
    { id: 'consumable', label: '消耗品' },
    { id: 'material', label: '材料' },
    { id: 'quest', label: '任務物品' },
  ];
  const categoryBar = makeElement(document, 'div', 'ms-category-bar');
  for (const category of categories) {
    const button = makeButton(document, category.label, 'inventory-filter', {
      className: 'ms-chip' + (state.inventoryFilter === category.id ? ' is-active' : ''),
      data: { kind: category.id },
    });
      button.dataset.focus = 'inventory-filter-' + category.id;
    categoryBar.append(button);
  }
  parent.append(categoryBar);

  const filtered = player.bag
    .map((stack, bagIndex) => ({ stack, bagIndex, item: view.catalog.rules.items[stack.itemId] }))
    .filter(({ item }) => {
      if (state.inventoryFilter === 'all') return true;
      if (state.inventoryFilter === 'equipment') return item?.kind === 'weapon' || item?.kind === 'body' || item?.kind === 'hat';
      return item?.kind === state.inventoryFilter;
    });
  const selected = filtered.find(({ bagIndex }) => bagIndex === state.selectedBagIndex) ?? null;
  const layout = makeElement(document, 'div', 'ms-inventory-layout');
  const grid = makeElement(document, 'div', 'ms-bag-grid');
  grid.setAttribute('aria-label', '32 格背包');
  for (let index = 0; index < 32; index += 1) {
    const entry = filtered[index];
    if (!entry) {
      const empty = makeElement(document, 'div', 'ms-bag-slot ms-bag-slot--empty');
      empty.setAttribute('aria-label', '空背包格 ' + (index + 1));
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
    slot.setAttribute('aria-label', (item?.name ?? stack.itemId) + ' ×' + stack.quantity + '，背包第 ' + (index + 1) + ' 格');
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
    detail.append(
      makeElement(document, 'h3', '', '選取一件物品'),
      makeElement(document, 'p', '', '選取背包格後可查看需求、能力、價格，並使用、裝備或出售。'),
    );
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
      detail.append(makeButton(document, '使用一個', 'use-item', {
        className: 'ms-button ms-button--primary',
        data: { itemId: stack.itemId },
      }));
    }
    if (item?.slot) {
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
      detail.append(compare);
      const tooLow = player.level < item.minLevel;
      detail.append(makeButton(document, '裝備', 'equip-bag', {
        className: 'ms-button ms-button--primary',
        disabled: tooLow,
        title: tooLow ? '需要等級 ' + item.minLevel + ' 才能裝備' : '裝備' + item.name,
        data: { bagIndex: String(bagIndex) },
      }));
      if (tooLow) detail.append(makeElement(document, 'span', 'ms-disabled-reason', '需要 Lv.' + item.minLevel + ' 才能裝備（目前 Lv.' + player.level + '）'));
    }
    if (item && item.kind !== 'quest' && item.sellPrice > 0) {
      const atMerchant = view.interaction?.npcId === 'merchant';
      const quantity = makeElement(document, 'input', 'ms-input ms-input--quantity');
      quantity.type = 'number';
      quantity.min = '1';
      quantity.max = String(stack.quantity);
      quantity.step = '1';
      quantity.value = String(clampInteger(state.sellQuantities.get(bagIndex) ?? 1, 1, stack.quantity));
      quantity.dataset.sellQuantity = String(bagIndex);
      quantity.dataset.focus = 'sell-quantity-' + bagIndex;
      quantity.setAttribute('aria-label', '出售數量');
      detail.append(quantity, makeButton(document, '出售選取數量', 'sell-bag', {
        className: 'ms-button ms-button--secondary',
        disabled: !atMerchant,
        title: atMerchant ? '出售所選數量' : '需在商人互動中出售',
        data: { bagIndex: String(bagIndex) },
      }));
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
    if (itemId) card.append(makeButton(document, '卸下' + slotLabel(slot), 'unequip', {
      className: 'ms-button ms-button--secondary',
      data: { slot },
    }));
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
  const key = (action: 'skill1' | 'skill2' | 'skill3') => codeLabel(bindings[action] ?? DEFAULT_KEY_BINDINGS[action]);
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
    const levelReady = player.level >= skill.requiredLevel;
    const jobReady = skill.requiredJob === 'any' || player.job === skill.requiredJob;
    const rankReady = rank < skill.maxRank;
    const reason = !rankReady ? '已達最高等級' : !levelReady ? '需要 Lv.' + skill.requiredLevel : !jobReady ? '需轉職為劍士' : player.sp < 1 ? '需要 1 SP' : '';
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
    card.append(makeButton(document, !rankReady ? '已滿級' : learned ? '提升至等級 ' + (rank + 1) : '學習技能', 'learn-skill', {
      className: 'ms-button ms-button--primary',
      disabled: Boolean(reason),
      title: reason || '消耗 1 SP 學習或提升技能',
      data: { skillId: skill.id },
    }));
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
  parent.append(makeElement(document, 'p', 'ms-wallet', '持有金幣：' + formatNumber(player.coins)));
  const offers = Object.values(view.catalog.rules.items)
    .filter((item) => item.buyPrice > 0 && item.kind !== 'quest')
    .sort((a, b) => shopKindOrder(a.kind) - shopKindOrder(b.kind) || a.minLevel - b.minLevel || a.buyPrice - b.buyPrice);
  const grid = makeElement(document, 'div', 'ms-shop-grid');
  for (const item of offers) {
    const stackable = item.stackLimit > 1;
    const quantity = stackable ? clampInteger(state.shopQuantities.get(item.id) ?? 1, 1, 99) : 1;
    const total = quantity * item.buyPrice;
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
    // Equipment does not stack (each piece takes a bag slot), so only consumables get a quantity box.
    if (stackable) {
      const quantityRow = makeElement(document, 'label', 'ms-quantity-row');
      quantityRow.append(makeElement(document, 'span', '', '數量 1–99'));
      const input = makeElement(document, 'input', 'ms-input ms-input--quantity');
      input.type = 'number';
      input.min = '1';
      input.max = '99';
      input.step = '1';
      input.value = String(quantity);
      input.dataset.shopQuantity = item.id;
      input.dataset.focus = 'shop-quantity-' + item.id;
      input.setAttribute('aria-label', item.name + ' 購買數量');
      quantityRow.append(input);
      card.append(quantityRow);
    }
    card.append(makeElement(document, 'strong', 'ms-shop-card__total', '總價 ' + formatNumber(total) + ' 金幣'));
    const reason = !atMerchant ? '需在商人互動中購買' : total > player.coins ? '金幣不足' : '';
    card.append(makeButton(document, '購買', 'buy', {
      className: 'ms-button ms-button--primary',
      disabled: Boolean(reason),
      title: reason || '購買 ' + quantity + ' 個，總價 ' + total + ' 金幣',
      data: { itemId: item.id },
    }));
    if (reason) card.append(makeElement(document, 'span', 'ms-disabled-reason', reason));
    grid.append(card);
  }
  parent.append(makeSectionTitle(document, '商店貨品'));
  parent.append(grid);

  const sellable = player.bag
    .map((stack, bagIndex) => ({ stack, bagIndex, item: view.catalog.rules.items[stack.itemId] }))
    .filter(({ item }) => item && item.kind !== 'quest' && item.sellPrice > 0);
  const sellSection = makeElement(document, 'section', 'ms-sell-section');
  sellSection.append(makeSectionTitle(document, '出售背包物品'));
  // Monster materials have no other use; selling them stack by stack was tedious.
  const materials = sellable.filter(({ item }) => item?.kind === 'material');
  if (materials.length > 0) {
    const total = materials.reduce((sum, { stack, item }) => sum + (item?.sellPrice ?? 0) * stack.quantity, 0);
    sellSection.append(makeButton(document, '出售全部素材（+' + formatNumber(total) + ' 金幣）', 'sell-materials', {
      className: 'ms-button ms-button--primary', disabled: !atMerchant,
      title: atMerchant ? '一次出售背包中所有怪物素材' : '需在商人互動中出售',
    }));
  }
  if (sellable.length === 0) sellSection.append(makeElement(document, 'p', 'ms-empty-state', '目前沒有可出售物品。'));
  for (const { stack, bagIndex, item } of sellable) {
    if (!item) continue;
    const quantity = clampInteger(state.sellQuantities.get(bagIndex) ?? 1, 1, stack.quantity);
    const row = makeElement(document, 'div', 'ms-sell-row');
    row.append(
      makeInterfaceIcon(document, view, item.iconKey, item.name, 'ms-sell-row__icon'),
      makeElement(document, 'strong', '', item.name + ' ×' + stack.quantity),
      makeElement(document, 'span', '', '賣價 ' + formatNumber(item.sellPrice) + '／個・合計 ' + formatNumber(item.sellPrice * quantity)),
    );
    const input = makeElement(document, 'input', 'ms-input ms-input--quantity');
    input.type = 'number';
    input.min = '1';
    input.max = String(stack.quantity);
    input.step = '1';
    input.value = String(quantity);
    input.dataset.sellQuantity = String(bagIndex);
    input.dataset.focus = 'shop-sell-quantity-' + bagIndex;
    input.setAttribute('aria-label', item.name + ' 出售數量');
    row.append(input, makeButton(document, '出售', 'sell-bag', {
      className: 'ms-button ms-button--secondary',
      disabled: !atMerchant,
      title: atMerchant ? '出售所選數量' : '需在商人互動中出售',
      data: { bagIndex: String(bagIndex) },
    }));
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
  if (interaction.npcId === 'merchant') parent.append(makeButton(document, '開啟商店', 'open-panel', {
    className: 'ms-button ms-button--primary', data: { panel: 'shop' },
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
      card.append(makeButton(document, '接取任務', 'accept-quest', {
        className: 'ms-button ms-button--primary', data: { questId: quest.questId },
      }));
    } else if (quest.status === 'ready') {
      card.append(makeElement(document, 'p', 'ms-reward-line', '獎勵：' + rewardText(view, quest.reward)));
      card.append(makeButton(document, '領取任務獎勵', 'claim-quest', {
        className: 'ms-button ms-button--primary', data: { questId: quest.questId },
      }));
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
  parent.append(makeButton(document, settings.muted ? '開啟音效' : '靜音', 'settings-mute', {
    className: 'ms-button ms-button--secondary',
    title: settings.muted ? '開啟遊戲音效' : '靜音所有遊戲音效',
  }));
  const volumeGrid = makeElement(document, 'div', 'ms-volume-grid');
  const channels: { id: 'masterVolume' | 'musicVolume' | 'sfxVolume'; label: string }[] = [
    { id: 'masterVolume', label: '總音量' },
    { id: 'musicVolume', label: '音樂音量' },
    { id: 'sfxVolume', label: '音效音量' },
  ];
  for (const channel of channels) {
    const label = makeElement(document, 'label', 'ms-volume-control');
    label.append(makeElement(document, 'span', '', channel.label + ' ' + Math.round(settings[channel.id] * 100) + '%'));
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
    label.append(slider);
    volumeGrid.append(label);
  }
  parent.append(volumeGrid, makeSectionTitle(document, '桌面操作說明'));
  const help = makeElement(document, 'ul', 'ms-help-list');
  const helpText = [
    '用鍵盤移動、跳躍與戰鬥；畫面上的按鈕也可以用滑鼠點擊。',
    '按住拾取鍵可以連續撿起附近的掉落物。',
    '背包／裝備／技能／能力／任務／地圖可由各自快捷鍵開啟；Esc 關閉最上層面板，沒有面板時暫停遊戲。',
    '點擊「更改按鍵」後按下新按鍵；已被其他動作使用的按鍵會被拒絕，Esc 不可重綁。',
    '技能快捷 1／2／3 對應重斬、橫掃、堅韌守護；未學或冷卻中會顯示狀態。',
  ];
  for (const text of helpText) help.append(makeElement(document, 'li', '', text));
  parent.append(help, makeSectionTitle(document, '鍵位設定'));
  const bindingList = makeElement(document, 'div', 'ms-binding-list');
  for (const action of KEY_ACTIONS) {
    const row = makeElement(document, 'div', 'ms-binding-row');
    const value = codeLabel(settings.bindings[action.id] ?? DEFAULT_KEY_BINDINGS[action.id as GameAction]);
    const rebindButton = makeButton(document, state.pendingBinding === action.id ? '按鍵中…' : '更改按鍵', 'settings-rebind', {
      className: 'ms-button ms-button--small',
      data: { actionId: action.id },
    });
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
