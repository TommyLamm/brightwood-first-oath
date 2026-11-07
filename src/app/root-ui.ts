import type { GameAppState } from './state.js';

export type RootStatusView = {
  update(state: GameAppState, title?: string, details?: string): void;
  dispose(): void;
};

/** Small status banner shown for startup failures and explicit notices. */
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
