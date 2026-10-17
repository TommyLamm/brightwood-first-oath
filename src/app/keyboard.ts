import type { CommandDraft, PanelId } from '../contracts/commands.js';
import type { InputFrame } from '../contracts/types.js';
import { escCommandForPanels } from './panels.js';

export type GameAction =
  | 'moveLeft' | 'moveRight' | 'climbUp' | 'climbDown' | 'jump' | 'attack'
  | 'pickup' | 'interact' | 'skill1' | 'skill2' | 'skill3' | 'potionHp' | 'potionMp'
  | 'inventory' | 'equipment' | 'skills' | 'stats' | 'quests' | 'map' | 'escape';

export type KeyBindings = Partial<Record<GameAction, string>>;

export const DEFAULT_KEY_BINDINGS: Readonly<Record<GameAction, string>> = {
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  climbUp: 'ArrowUp',
  climbDown: 'ArrowDown',
  jump: 'AltLeft',
  attack: 'ControlLeft',
  pickup: 'KeyZ',
  interact: 'Space',
  skill1: 'Digit1',
  skill2: 'Digit2',
  skill3: 'Digit3',
  potionHp: 'KeyQ',
  potionMp: 'KeyW',
  inventory: 'KeyI',
  equipment: 'KeyE',
  skills: 'KeyK',
  stats: 'KeyC',
  quests: 'KeyJ',
  map: 'KeyM',
  escape: 'Escape',
};

export type KeyDownContext = {
  focused: boolean;
  textInput: boolean;
  repeat?: boolean;
  panels: readonly PanelId[];
};

export type KeyDownResult = {
  command: CommandDraft | null;
  preventDefault: boolean;
};

function actionForCode(bindings: KeyBindings, code: string): GameAction | null {
  if (code === 'ControlRight' && bindings.attack === 'ControlLeft') return 'attack';
  if (code === 'AltRight' && bindings.jump === 'AltLeft') return 'jump';
  return (Object.keys(bindings) as GameAction[]).find((action) => bindings[action] === code) ?? null;
}

function panelForAction(action: GameAction): PanelId | null {
  switch (action) {
    case 'inventory': return 'inventory';
    case 'equipment': return 'equipment';
    case 'skills': return 'skills';
    case 'stats': return 'stats';
    case 'quests': return 'quests';
    case 'map': return 'map';
    default: return null;
  }
}

/** DOM-independent KeyboardEvent.code state, also used by browser event wiring. */
export class KeyboardInputState {
  private bindings: KeyBindings = { ...DEFAULT_KEY_BINDINGS };
  private heldCodes = new Set<string>();
  private jumpPressed = false;

  constructor(bindings: KeyBindings = {}) {
    this.setBindings(bindings);
  }

  setBindings(bindings: KeyBindings): void {
    const next: KeyBindings = { ...DEFAULT_KEY_BINDINGS };
    for (const action of Object.keys(DEFAULT_KEY_BINDINGS) as GameAction[]) {
      const code = bindings[action];
      if (typeof code === 'string' && /^[A-Za-z][A-Za-z0-9]*$/.test(code)) {
        for (const boundAction of Object.keys(next) as GameAction[]) {
          if (next[boundAction] === code) delete next[boundAction];
        }
        next[action] = code;
      }
    }
    this.bindings = next;
    this.releaseAll();
  }

  rebind(action: GameAction, code: string): void {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(code)) throw new RangeError(`Invalid KeyboardEvent.code: ${code}`);
    const next = { ...this.bindings };
    for (const boundAction of Object.keys(next) as GameAction[]) {
      if (next[boundAction] === code) delete next[boundAction];
    }
    next[action] = code;
    this.bindings = next;
    this.releaseAll();
  }

  keyDown(code: string, context: KeyDownContext): KeyDownResult {
    if (!context.focused || context.textInput) return { command: null, preventDefault: false };
    this.heldCodes.add(code);
    if (context.repeat) return { command: null, preventDefault: false };

    const action = actionForCode(this.bindings, code);
    if (!action) return { command: null, preventDefault: false };
    if (action === 'jump') this.jumpPressed = true;
    if (action === 'escape') return { command: escCommandForPanels(context.panels), preventDefault: true };

    const panel = panelForAction(action);
    if (panel) {
      let command: CommandDraft;
      if (context.panels.at(-1) === panel) command = { type: 'closePanel', payload: {} };
      else command = { type: 'setPanel', payload: { panel } };
      return { command, preventDefault: true };
    }

    switch (action) {
      case 'moveLeft':
      case 'moveRight':
      case 'climbUp':
      case 'climbDown':
      case 'jump':
        return { command: null, preventDefault: true };
      case 'attack': return { command: { type: 'attack', payload: { skillId: 'basic' } }, preventDefault: true };
      case 'pickup': return { command: { type: 'pickup', payload: {} }, preventDefault: true };
      case 'interact': return { command: { type: 'interact', payload: {} }, preventDefault: true };
      case 'skill1': return { command: { type: 'attack', payload: { skillId: 'heavy-strike' } }, preventDefault: true };
      case 'skill2': return { command: { type: 'attack', payload: { skillId: 'sweep' } }, preventDefault: true };
      case 'skill3': return { command: { type: 'attack', payload: { skillId: 'iron-guard' } }, preventDefault: true };
      case 'potionHp': return { command: { type: 'useItem', payload: { itemId: 'small-red' } }, preventDefault: true };
      case 'potionMp': return { command: { type: 'useItem', payload: { itemId: 'small-blue' } }, preventDefault: true };
      default: return { command: null, preventDefault: false };
    }
  }

  keyUp(code: string): void {
    this.heldCodes.delete(code);
  }

  isHeld(action: GameAction): boolean {
    const code = this.bindings[action];
    return code !== undefined && this.heldCodes.has(code);
  }

  consumeMovementFrame(): InputFrame {
    const left = this.isHeld('moveLeft');
    const right = this.isHeld('moveRight');
    const up = this.isHeld('climbUp');
    const down = this.isHeld('climbDown');
    const frame: InputFrame = {
      moveX: left === right ? 0 : left ? -1 : 1,
      climbY: up === down ? 0 : up ? -1 : 1,
      jumpPressed: this.jumpPressed,
      downHeld: down,
    };
    this.jumpPressed = false;
    return frame;
  }

  releaseAll(): void {
    this.heldCodes.clear();
    this.jumpPressed = false;
  }
}

type KeyboardControlsOptions = {
  gameRoot: HTMLElement;
  uiRoot: HTMLElement;
  dispatch(command: CommandDraft): void;
  getPanels(): readonly PanelId[];
  onWindowFocusChange(focused: boolean): void;
};

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object' || !('closest' in target)) return false;
  const element = target as Element;
  return typeof element.closest === 'function' && element.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]') !== null;
}

/** Installs the browser keyboard lifecycle while keeping the action mapping independently testable. */
export class KeyboardControls {
  readonly input: KeyboardInputState;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const focused = this.isGameInputFocused(event.target);
    const textInput = isTextEntryTarget(event.target) || isTextEntryTarget(this.options.uiRoot.ownerDocument.activeElement);
    if (!focused) {
      if (this.inputHasHeldKeys()) this.input.releaseAll();
      return;
    }
    if ((event.ctrlKey || event.altKey) && !textInput) event.preventDefault();
    const result = this.input.keyDown(event.code, {
      focused,
      textInput,
      repeat: event.repeat,
      panels: this.options.getPanels(),
    });
    if (result.preventDefault) event.preventDefault();
    if (result.command) this.options.dispatch(result.command);
  };
  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.input.keyUp(event.code);
  };
  private readonly handleBlur = (): void => {
    this.input.releaseAll();
    this.options.onWindowFocusChange(false);
  };
  private readonly handleFocus = (): void => {
    this.options.onWindowFocusChange(true);
  };
  private readonly handleVisibility = (): void => {
    if (this.options.uiRoot.ownerDocument.visibilityState === 'hidden') this.handleBlur();
    else if (this.options.uiRoot.ownerDocument.hasFocus()) this.handleFocus();
  };
  private readonly handlePointerDown = (): void => {
    const canvas = this.options.gameRoot.querySelector('canvas');
    if (canvas) {
      canvas.tabIndex = 0;
      canvas.focus();
    }
  };
  private readonly handleGameFocusOut = (): void => {
    const active = this.options.gameRoot.ownerDocument.activeElement;
    if (!this.options.gameRoot.contains(active)) this.input.releaseAll();
  };

  constructor(private readonly options: KeyboardControlsOptions, bindings: KeyBindings = {}) {
    this.input = new KeyboardInputState(bindings);
    const doc = options.uiRoot.ownerDocument;
    const win = doc.defaultView;
    if (!win) throw new Error('Keyboard input requires a browser Window.');
    const canvas = options.gameRoot.querySelector('canvas');
    if (canvas) canvas.tabIndex = 0;

    win.addEventListener('keydown', this.handleKeyDown);
    win.addEventListener('keyup', this.handleKeyUp);
    win.addEventListener('blur', this.handleBlur);
    win.addEventListener('focus', this.handleFocus);
    doc.addEventListener('visibilitychange', this.handleVisibility);
    options.gameRoot.addEventListener('pointerdown', this.handlePointerDown);
    options.gameRoot.addEventListener('focusout', this.handleGameFocusOut);
  }

  setBindings(bindings: KeyBindings): void {
    this.input.setBindings(bindings);
  }

  dispose(): void {
    const doc = this.options.uiRoot.ownerDocument;
    const win = doc.defaultView;
    win?.removeEventListener('keydown', this.handleKeyDown);
    win?.removeEventListener('keyup', this.handleKeyUp);
    win?.removeEventListener('blur', this.handleBlur);
    win?.removeEventListener('focus', this.handleFocus);
    doc.removeEventListener('visibilitychange', this.handleVisibility);
    this.options.gameRoot.removeEventListener('pointerdown', this.handlePointerDown);
    this.options.gameRoot.removeEventListener('focusout', this.handleGameFocusOut);
    this.input.releaseAll();
  }

  private inputHasHeldKeys(): boolean {
    return (Object.keys(DEFAULT_KEY_BINDINGS) as GameAction[]).some((action) => this.input.isHeld(action));
  }

  private isGameInputFocused(target: EventTarget | null): boolean {
    const active = this.options.gameRoot.ownerDocument.activeElement;
    const targetNode = target !== null && typeof target === 'object' && 'nodeType' in target
      ? target as Node
      : null;
    return this.options.gameRoot.contains(active)
      && !this.options.uiRoot.contains(active)
      && targetNode !== null
      && this.options.gameRoot.contains(targetNode)
      && !isTextEntryTarget(active)
      && !isTextEntryTarget(target);
  }
}
