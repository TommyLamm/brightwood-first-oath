import type { CommandDraft, GameCommand, PanelId } from '../contracts/commands.js';
import type { UiSnapshot } from '../contracts/ports.js';

export type AppPanelState = {
  screen: UiSnapshot['screen'];
  panels: PanelId[];
};

export function applyPanelCommand(state: AppPanelState, command: CommandDraft | GameCommand): AppPanelState {
  switch (command.type) {
    case 'setPanel': {
      const panel = command.payload.panel;
      if (panel === null) return { ...state, panels: [] };
      return { ...state, panels: [...state.panels.filter((current) => current !== panel), panel] };
    }
    case 'closePanel':
      return { ...state, panels: state.panels.slice(0, -1) };
    case 'togglePause':
      if (state.screen === 'playing') return { ...state, screen: 'paused' };
      if (state.screen === 'paused') return { ...state, screen: 'playing' };
      return state;
    default:
      return state;
  }
}

export function isWorldFrozen(state: AppPanelState, windowFocused: boolean): boolean {
  return !windowFocused || state.screen !== 'playing' || state.panels.includes('settings');
}

export function escCommandForPanels(panels: readonly PanelId[]): CommandDraft {
  return panels.length > 0
    ? { type: 'closePanel', payload: {} }
    : { type: 'togglePause', payload: {} };
}
