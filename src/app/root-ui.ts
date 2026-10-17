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

  const dispatchPanel = (panel: PanelId): void => dispatch({ type: 'setPanel', payload: { panel } });

  const render = (view: UiSnapshot): void => {
    currentView = view;
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
      label.textContent = view.screen === 'error' ? '遊戲內容尚未完成' : '楓之故事';
      hud.append(label);
    }

    if (view.screen === 'title' || view.screen === 'create') {
      actions.append(nameInput);
      appendButton(actions, '開始新遊戲', () => dispatch({ type: 'newGame', payload: { name: nameInput.value } }));
      appendButton(actions, '繼續遊戲', () => dispatch({ type: 'continue', payload: {} }));
      appendButton(actions, '暫時遊玩', () => dispatch({ type: 'playTemporary', payload: {} }));
    }
    if (player) {
      for (const panel of ['inventory', 'equipment', 'skills', 'stats', 'quests', 'map', 'settings'] as const) {
        appendButton(actions, panelTitle(panel), () => dispatchPanel(panel));
      }
    }
    if (view.screen === 'paused') appendButton(actions, '繼續', () => dispatch({ type: 'togglePause', payload: {} }));
    if (view.screen === 'dead') appendButton(actions, '返回安全地點', () => dispatch({ type: 'respawn', payload: {} }));
    if (view.screen === 'result') {
      appendButton(actions, '再戰首領', () => dispatch({ type: 'retryBoss', payload: {} }));
      if (view.canReturnTown) appendButton(actions, '回城', () => dispatch({ type: 'returnTown', payload: {} }));
    }

    const status = document.createElement('span');
    status.textContent = `存檔：${view.saveStatus}${view.toast ? `｜${view.toast}` : ''}`;
    details.append(status);
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
    content.textContent = view.saveData.player.bag.map(({ itemId, quantity }) => `${itemId} ×${quantity}`).join('、') || '背包是空的。';
  } else if (panel === 'equipment' && view.saveData) {
    const equipment = view.saveData.player.equipment;
    content.textContent = `武器：${equipment.weapon ?? '無'}｜身體：${equipment.body ?? '無'}｜帽子：${equipment.hat ?? '無'}`;
  } else if (panel === 'stats' && view.stats && view.saveData) {
    const player = view.saveData.player;
    content.textContent = `STR ${player.str}｜DEX ${player.dex}｜攻擊 ${view.stats.attack}｜防禦 ${view.stats.defense}｜楓幣 ${player.coins}`;
  } else if (panel === 'quests') {
    const questViews = view.questViews;
    if (questViews.length === 0) {
      content.textContent = '尚無任務。';
    } else {
      content.textContent = '';
      for (const quest of questViews) {
        const line = document.createElement('span');
        line.textContent = `${quest.title}：${quest.status}`;
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
  } else if (panel === 'settings' && view.saveData) {
    content.textContent = `音量 ${Math.round(view.saveData.settings.masterVolume * 100)}%｜${view.saveData.settings.muted ? '靜音' : '開啟音效'}`;
    appendButton(details, view.saveData.settings.muted ? '開啟音效' : '靜音', () => dispatch({
      type: 'setSettings',
      payload: { settings: { ...view.saveData!.settings, muted: !view.saveData!.settings.muted } },
    }));
  } else if (panel === 'dialogue' && view.interaction) {
    content.textContent = view.interaction.dialogue.join(' ');
  } else {
    content.textContent = '目前沒有可顯示的內容。';
  }
  details.append(content);
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
        heading.textContent = '正在載入開發內容';
        body.textContent = '檢查規則、世界資料與四個正式資產包。';
      } else if (state.startupStatus === 'incomplete') {
        heading.textContent = '開發中：目前內容尚未完成';
        body.textContent = state.startupIssues.join('\n');
      } else {
        heading.textContent = '內容目錄與資產清單已就緒';
        body.textContent = '目前只核對 catalog 與 manifest；實際圖像／音訊載入、核心玩法與可玩流程尚未接線。';
      }
      panel.hidden = false;
    },
    dispose(): void {
      panel.remove();
    },
  };
}
