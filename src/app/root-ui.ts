import type { CommandDraft } from '../contracts/commands.js';
import type { PanelId } from '../contracts/commands.js';
import type { UiSnapshot } from '../contracts/ports.js';
import type { GameAppState } from './state.js';

export type RootStatusView = {
  update(state: GameAppState, title?: string, details?: string): void;
  dispose(): void;
};

export type AppUiController = {
  render(view: UiSnapshot): void;
  setPanel(panel: PanelId | null): void;
  isInputCaptured(): boolean;
  dispose(): void;
};

function appendButton(
  parent: HTMLElement,
  label: string,
  onClick: () => void,
  disabled = false,
): HTMLButtonElement {
  const button = parent.ownerDocument.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  parent.append(button);
  return button;
}

function panelTitle(panel: PanelId): string {
  return {
    inventory: '背包',
    equipment: '裝備',
    skills: '技能',
    stats: '能力值',
    quests: '任務',
    map: '地圖',
    shop: '商店',
    dialogue: '對話',
    settings: '設定',
  }[panel];
}

/** Renders the app-owned UI contract and dispatches every action back to GameApp. */
export function createAppUi(root: HTMLElement, dispatch: (command: CommandDraft) => void): AppUiController {
  const document = root.ownerDocument;
  const container = document.createElement('section');
  container.setAttribute('aria-label', '遊戲介面');
  Object.assign(container.style, {
    position: 'absolute',
    inset: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    pointerEvents: 'none',
    color: '#f4eddd',
    font: '14px/1.45 system-ui, sans-serif',
  });
  const hud = document.createElement('div');
  const actions = document.createElement('div');
  const details = document.createElement('div');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.maxLength = 16;
  nameInput.placeholder = '角色名稱';
  nameInput.value = '旅人';
  nameInput.setAttribute('aria-label', '角色名稱');
  for (const element of [hud, actions, details]) {
    Object.assign(element.style, {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center',
      pointerEvents: 'auto',
    });
  }
  details.style.marginTop = 'auto';
  details.style.padding = '10px 12px';
  details.style.maxHeight = '38%';
  details.style.overflow = 'auto';
  details.style.background = 'rgba(17, 24, 29, .86)';
  details.style.border = '1px solid rgba(244, 237, 221, .28)';
  details.style.borderRadius = '8px';
  container.append(hud, actions, details);
  root.append(container);
  let currentView: UiSnapshot | null = null;
  let lastRenderSignature = '';

  const dispatchPanel = (panel: PanelId): void => dispatch({ type: 'setPanel', payload: { panel } });

  const render = (view: UiSnapshot): void => {
    currentView = view;
    const signature = JSON.stringify({
      screen: view.screen,
      error: view.error,
      saveData: view.saveData,
      stats: view.stats,
      questViews: view.questViews,
      saveStatus: view.saveStatus,
      toast: view.toast,
      panels: view.panels,
      interaction: view.interaction,
      canReturnTown: view.canReturnTown,
    });
    if (signature === lastRenderSignature) return;
    lastRenderSignature = signature;
    hud.replaceChildren();
    actions.replaceChildren();
    details.replaceChildren();
    const player = view.saveData?.player;
    if (player) {
      const label = document.createElement('span');
      label.textContent = `${player.name}｜Lv.${player.level} ${player.job}｜HP ${player.hp}/${view.stats?.maxHp ?? player.hp}｜MP ${player.mp}/${view.stats?.maxMp ?? player.mp}`;
      hud.append(label);
    } else {
      const label = document.createElement('span');
      label.textContent = view.screen === 'error' ? '遊戲內容尚未完成' : 'Brightwood: First Oath';
      hud.append(label);
    }

    if (view.screen === 'title') {
      if (view.saveData) {
        actions.append(nameInput);
        appendButton(actions, '繼續遊戲', () => dispatch({ type: 'continue', payload: {} }));
        if (['ready', 'saved', 'localSaved', 'previewOnly'].includes(view.saveStatus)) {
          appendButton(actions, '建立新角色', () => dispatch({ type: 'newGame', payload: { name: nameInput.value } }));
        }
      } else if (view.saveStatus === 'loadError' || view.saveStatus === 'incompatible' || view.saveStatus === 'unavailable') {
        appendButton(actions, '重試讀取存檔', () => dispatch({ type: 'retrySave', payload: {} }));
        if (!view.error) appendButton(actions, '暫時遊玩', () => dispatch({ type: 'playTemporary', payload: {} }));
      } else {
        actions.append(nameInput);
        appendButton(actions, '開始新遊戲', () => dispatch({ type: 'newGame', payload: { name: nameInput.value } }));
        appendButton(actions, '暫時遊玩', () => dispatch({ type: 'playTemporary', payload: {} }));
        appendButton(actions, '繼續遊戲', () => dispatch({ type: 'continue', payload: {} }), true);
      }
    }
    if (view.screen === 'create') {
      actions.append(nameInput);
      appendButton(actions, view.saveData ? '確認取代並建立' : '確認建立角色', () => dispatch({ type: 'newGame', payload: { name: nameInput.value } }));
      appendButton(actions, '取消', () => dispatch({ type: 'returnTitle', payload: {} }));
    }
    if (player && (view.screen === 'playing' || view.screen === 'paused' || view.screen === 'dead' || view.screen === 'result')) {
      for (const panel of ['inventory', 'equipment', 'skills', 'stats', 'quests', 'map', 'settings'] as const) {
        appendButton(actions, panelTitle(panel), () => dispatchPanel(panel));
      }
      appendButton(actions, '普通攻擊', () => dispatch({ type: 'attack', payload: { skillId: 'basic' } }));
      for (const skillId of ['heavy-strike', 'sweep', 'iron-guard'] as const) {
        if ((player.skillRanks[skillId] ?? 0) > 0) {
          const skill = view.catalog.rules.skills[skillId];
          appendButton(actions, skill?.name ?? skillId, () => dispatch({ type: 'attack', payload: { skillId } }));
        }
      }
      if (player.bag.some(({ itemId }) => itemId === 'small-red')) {
        appendButton(actions, '紅水', () => dispatch({ type: 'useItem', payload: { itemId: 'small-red' } }));
      }
      if (player.bag.some(({ itemId }) => itemId === 'small-blue')) {
        appendButton(actions, '藍水', () => dispatch({ type: 'useItem', payload: { itemId: 'small-blue' } }));
      }
      appendButton(actions, '拾取', () => dispatch({ type: 'pickup', payload: {} }));
      appendButton(actions, '互動', () => dispatch({ type: 'interact', payload: {} }));
      if (view.screen === 'playing') appendButton(actions, '暫停', () => dispatch({ type: 'togglePause', payload: {} }));
      appendButton(actions, '返回標題', () => dispatch({ type: 'returnTitle', payload: {} }));
    }
    if (view.screen === 'paused') appendButton(actions, '繼續', () => dispatch({ type: 'togglePause', payload: {} }));
    if (view.screen === 'dead') appendButton(actions, '返回安全地點', () => dispatch({ type: 'respawn', payload: {} }));
    if (view.screen === 'result') {
      appendButton(actions, '再戰首領', () => dispatch({ type: 'retryBoss', payload: {} }));
      if (view.canReturnTown) {
        const mapId = view.saveData?.location.mapId;
        const returnLabel = mapId === 'sand-sunwell-altar' ? '返回日井盆地' : mapId === 'frost-tide-cavern' ? '返回雪痕海岸' : '回城';
        appendButton(actions, returnLabel, () => dispatch({ type: 'returnTown', payload: {} }));
      }
    }

    const status = document.createElement('span');
    status.textContent = `存檔：${saveStatusLabel(view.saveStatus)}${view.toast ? `｜${view.toast}` : ''}`;
    details.append(status);
    if (!view.error && (view.saveStatus === 'saveError' || view.saveStatus === 'loadError' || view.saveStatus === 'unavailable')) {
      appendButton(details, '重試存檔', () => dispatch({ type: 'retrySave', payload: {} }));
    }
    if ((view.saveStatus === 'loadError' || view.saveStatus === 'unavailable') && !view.error) {
      appendButton(details, '暫時遊玩', () => dispatch({ type: 'playTemporary', payload: {} }));
    }
    if (view.saveStatus === 'conflict') {
      appendButton(details, '載入雲端版本', () => dispatch({ type: 'useCloudVersion', payload: {} }));
    }
    if (view.interaction) {
      const dialogue = document.createElement('p');
      dialogue.textContent = view.interaction.dialogue.join(' ');
      details.append(dialogue);
    }
    const panel = view.panels.at(-1);
    if (panel) renderPanel(details, view, panel, dispatch, document);
  };

  return {
    render,
    setPanel(panel): void {
      dispatch({ type: 'setPanel', payload: { panel } });
    },
    isInputCaptured(): boolean {
      return (currentView?.panels.length ?? 0) > 0 || document.activeElement === nameInput;
    },
    dispose(): void {
      container.remove();
      currentView = null;
    },
  };
}

function saveStatusLabel(status: UiSnapshot['saveStatus']): string {
  return {
    unavailable: '不可用',
    loading: '載入中',
    ready: '就緒',
    saving: '保存中',
    saved: '雲端已保存',
    localSaved: '本機已保存',
    previewOnly: '預覽暫存，未保存至正式帳號',
    loadError: '讀取失敗',
    saveError: '保存失敗',
    conflict: '其他裝置已有更新',
    authLost: '登入狀態失效',
    incompatible: '存檔格式不相容',
  }[status];
}

function renderPanel(
  details: HTMLElement,
  view: UiSnapshot,
  panel: PanelId,
  dispatch: (command: CommandDraft) => void,
  document: Document,
): void {
  const heading = document.createElement('strong');
  heading.textContent = panelTitle(panel);
  details.append(heading);
  appendButton(details, '關閉', () => dispatch({ type: 'closePanel', payload: {} }));
  const content = document.createElement('p');
  if (panel === 'inventory' && view.saveData) {
    const bag = view.saveData.player.bag;
    if (bag.length === 0) content.textContent = '背包是空的。';
    else {
      content.textContent = '';
      bag.forEach(({ itemId, quantity }, bagIndex) => {
        const item = view.catalog.rules.items[itemId];
        const line = document.createElement('span');
        line.textContent = `${item?.name ?? itemId} ×${quantity}`;
        details.append(line);
        if (item?.kind === 'consumable') {
          appendButton(details, '使用', () => dispatch({ type: 'useItem', payload: { itemId } }));
        }
        if (item?.slot) appendButton(details, '裝備', () => dispatch({ type: 'equip', payload: { bagIndex } }));
        if (item?.kind !== 'quest') appendButton(details, '出售 1 個', () => dispatch({ type: 'sell', payload: { bagIndex, quantity: 1 } }));
      });
    }
  } else if (panel === 'equipment' && view.saveData) {
    const equipment = view.saveData.player.equipment;
    content.textContent = `武器：${equipment.weapon ?? '無'}｜身體：${equipment.body ?? '無'}｜帽子：${equipment.hat ?? '無'}`;
    for (const slot of ['weapon', 'body', 'hat'] as const) {
      if (equipment[slot]) appendButton(details, `卸下${slotLabel(slot)}`, () => dispatch({ type: 'unequip', payload: { slot } }));
    }
  } else if (panel === 'stats' && view.stats && view.saveData) {
    const player = view.saveData.player;
    content.textContent = `STR ${player.str}｜DEX ${player.dex}｜攻擊 ${view.stats.attack}｜防禦 ${view.stats.defense}｜暴擊率 ${Math.round(view.stats.critChance * 1000) / 10}%｜金幣 ${player.coins}`;
    content.textContent += `｜可用 AP ${player.ap}｜SP ${player.sp}`;
    if (player.ap > 0) {
      appendButton(details, 'STR +1', () => dispatch({ type: 'allocateAp', payload: { stat: 'str', amount: 1 } }));
      appendButton(details, 'DEX +1', () => dispatch({ type: 'allocateAp', payload: { stat: 'dex', amount: 1 } }));
    }
  } else if (panel === 'skills' && view.saveData) {
    content.textContent = '';
    for (const skill of Object.values(view.catalog.rules.skills).filter((entry) => entry.requiredJob !== 'enemy' && entry.id !== 'basic')) {
      const rank = view.saveData.player.skillRanks[skill.id] ?? 0;
      const line = document.createElement('span');
      line.textContent = `${skill.name} Rank ${rank}/${skill.maxRank}｜需求 Lv.${skill.requiredLevel} ${skill.requiredJob}｜MP ${skill.mpCost}`;
      details.append(line);
      if (rank < skill.maxRank && view.saveData.player.sp > 0) {
        appendButton(details, '學習', () => dispatch({ type: 'learnSkill', payload: { skillId: skill.id } }));
      }
    }
  } else if (panel === 'quests') {
    const questViews = view.questViews;
    if (questViews.length === 0) {
      content.textContent = '尚無任務。';
    } else {
      content.textContent = '';
      for (const quest of questViews) {
        const line = document.createElement('span');
        const objectives = quest.objectives.map((objective) => `${objective.targetId} ${objective.current}/${objective.required}`).join('、');
        line.textContent = `${quest.title}：${quest.status}${objectives ? `｜${objectives}` : ''}`;
        details.append(line);
        if (quest.status === 'available') {
          appendButton(details, '接取', () => dispatch({ type: 'acceptQuest', payload: { questId: quest.questId } }));
        } else if (quest.status === 'ready') {
          appendButton(details, '領取', () => dispatch({ type: 'claimQuest', payload: { questId: quest.questId } }));
        }
      }
    }
  } else if (panel === 'map' && view.saveData) {
    content.textContent = `目前位置：${view.saveData.location.mapId}/${view.saveData.location.spawnId}`;
    content.textContent += `｜已探索：${view.saveData.visitedMaps.map((mapId) => view.catalog.world.maps[mapId]?.name ?? mapId).join('、')}`;
    appendButton(details, '返回城鎮', () => dispatch({ type: 'returnTown', payload: {} }));
  } else if (panel === 'shop' && view.saveData) {
    content.textContent = `${view.interaction?.dialogue.join(' ') ?? '選擇要購買的物品。'}｜金幣 ${view.saveData.player.coins}`;
    for (const item of Object.values(view.catalog.rules.items).filter((entry) => entry.buyPrice > 0 && entry.kind !== 'quest')) {
      const line = document.createElement('span');
      line.textContent = `${item.name}｜${item.buyPrice} 金幣`;
      details.append(line);
      appendButton(details, '購買 1 個', () => dispatch({ type: 'buy', payload: { itemId: item.id, quantity: 1 } }));
    }
  } else if (panel === 'settings' && view.saveData) {
    content.textContent = `音量 ${Math.round(view.saveData.settings.masterVolume * 100)}%｜${view.saveData.settings.muted ? '靜音' : '開啟音效'}`;
    appendButton(details, view.saveData.settings.muted ? '開啟音效' : '靜音', () => dispatch({
      type: 'setSettings',
      payload: { settings: { ...view.saveData!.settings, muted: !view.saveData!.settings.muted } },
    }));
    for (const channel of ['masterVolume', 'musicVolume', 'sfxVolume'] as const) {
      const label = document.createElement('label');
      label.textContent = channel === 'masterVolume' ? '總音量' : channel === 'musicVolume' ? '音樂' : '音效';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '1';
      slider.step = '0.05';
      slider.value = String(view.saveData.settings[channel]);
      slider.setAttribute('aria-label', label.textContent);
      slider.addEventListener('change', () => dispatch({
        type: 'setSettings',
        payload: { settings: { ...view.saveData!.settings, [channel]: Number(slider.value) } },
      }));
      label.append(slider);
      details.append(label);
    }
  } else if (panel === 'dialogue' && view.interaction) {
    content.textContent = view.interaction.dialogue.join(' ');
  } else {
    content.textContent = '目前沒有可顯示的內容。';
  }
  details.append(content);
}

function slotLabel(slot: 'weapon' | 'body' | 'hat'): string {
  return { weapon: '武器', body: '身體', hat: '帽子' }[slot];
}

/** Minimal accessible development status surface until the T08 UI is connected. */
export function createRootStatusView(root: HTMLElement): RootStatusView {
  const panel = root.ownerDocument.createElement('section');
  panel.setAttribute('role', 'status');
  panel.setAttribute('aria-live', 'polite');
  Object.assign(panel.style, {
    position: 'absolute',
    left: '12px',
    right: '12px',
    bottom: '12px',
    maxHeight: '40%',
    overflow: 'auto',
    padding: '12px 16px',
    border: '1px solid rgba(244, 237, 221, .32)',
    borderRadius: '8px',
    background: 'rgba(17, 24, 29, .9)',
    color: '#f4eddd',
    font: '14px/1.45 system-ui, sans-serif',
    whiteSpace: 'pre-wrap',
    pointerEvents: 'none',
  });
  const heading = root.ownerDocument.createElement('strong');
  heading.style.display = 'block';
  const body = root.ownerDocument.createElement('span');
  panel.append(heading, body);
  root.append(panel);

  return {
    update(state, explicitTitle, explicitDetails): void {
      if (explicitTitle !== undefined) {
        heading.textContent = explicitTitle;
        body.textContent = explicitDetails ?? '';
        panel.hidden = false;
        return;
      }
      if (state.startupStatus === 'loading') {
        // The main UI already shows a centred 正在準備冒險 card; a second banner here
        // only overlapped the footer buttons.
        panel.hidden = true;
        return;
      } else if (state.startupStatus === 'incomplete') {
        heading.textContent = '遊戲檔案載入失敗';
        body.textContent = state.startupIssues.join('\n');
      } else {
        panel.hidden = true;
        return;
      }
      panel.hidden = false;
    },
    dispose(): void {
      panel.remove();
    },
  };
}
