import type { CommandDraft, PanelId } from '../contracts/commands.js';
import type { InputFrame } from '../contracts/types.js';
import { escCommandForPanels } from './panels.js';

export type GameAction =
  | 'moveLeft' | 'moveRight' | 'climbUp' | 'climbDown' | 'jump' | 'attack'
  | 'pickup' | 'interact' | 'skill1' | 'skill2' | 'skill3' | 'potionHp' | 'potionMp'
  | 'inventory' | 'equipment' | 'skills' | 'stats' | 'quests' | 'map' | 'escape';

export type KeyBindings = Partial<Record<GameAction, string>>;
declare const effectiveKeyBindingsBrand: unique symbol;
export type EffectiveKeyBindings = Readonly<Partial<Record<GameAction, string>>> & {
  readonly [effectiveKeyBindingsBrand]: true;
};

export type KeyBindingConflict = Readonly<{
  action: GameAction;
  code: string;
}>;

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

const GAME_ACTIONS = Object.keys(DEFAULT_KEY_BINDINGS) as GameAction[];
const HELD_MOVEMENT_ACTIONS = new Set<GameAction>(['moveLeft', 'moveRight', 'climbUp', 'climbDown']);
const VALID_KEY_CODE = /^[A-Za-z][A-Za-z0-9]*$/;

/** Resolve defaults and saved overrides with the same exact-code precedence as the runtime parser. */
export function resolveEffectiveBindings(overrides: KeyBindings = {}): EffectiveKeyBindings {
  const next: KeyBindings = { ...DEFAULT_KEY_BINDINGS };
  for (const action of GAME_ACTIONS) {
    const code = overrides[action];
    if (typeof code === 'string' && VALID_KEY_CODE.test(code)) {
      for (const boundAction of GAME_ACTIONS) {
        if (next[boundAction] === code) delete next[boundAction];
      }
      next[action] = code;
    }
  }
  return next as EffectiveKeyBindings;
}

function codesForBinding(action: GameAction, code: string): string[] {
  if (action === 'attack' && code === 'ControlLeft') return [code, 'ControlRight'];
  if (action === 'jump' && code === 'AltLeft') return [code, 'AltRight'];
  return [code];
}

function actionForCode(bindings: EffectiveKeyBindings, code: string): GameAction | null {
  if (code === 'ControlRight' && bindings.attack === 'ControlLeft') return 'attack';
  if (code === 'AltRight' && bindings.jump === 'AltLeft') return 'jump';
  return GAME_ACTIONS.find((action) => bindings[action] === code) ?? null;
}

/** Return codes used by this action's runtime input, including held movement codes and one-way aliases. */
export function getEffectiveKeyCodes(action: GameAction, effective: EffectiveKeyBindings): readonly string[] {
  const code = effective[action];
  if (!code) return [];
  // Movement reads heldCodes through isHeld directly, even when keyDown dispatches the code elsewhere.
  if (HELD_MOVEMENT_ACTIONS.has(action)) return [code];
  return codesForBinding(action, code)
    .filter((candidate) => actionForCode(effective, candidate) === action);
}

/** Find another action whose current binding would be claimed by this candidate. */
export function findKeyBindingConflict(
  effective: EffectiveKeyBindings,
  action: GameAction,
  candidateCode: string,
): KeyBindingConflict | null {
  if (!VALID_KEY_CODE.test(candidateCode)) return null;
  const candidateCodes = codesForBinding(action, candidateCode);

  for (const otherAction of GAME_ACTIONS) {
    if (otherAction === action) continue;
    const otherCode = effective[otherAction];
    if (!otherCode) continue;
    const conflictCode = candidateCodes.find((code) => codesForBinding(otherAction, otherCode).includes(code));
    if (conflictCode) return { action: otherAction, code: conflictCode };
  }
  return null;
}

export type KeyDownContext = {
  focused: boolean;
  uiFocused?: boolean;
  textInput: boolean;
  repeat?: boolean;
  panels: readonly PanelId[];
};

export type KeyDownResult = {
  command: CommandDraft | null;
  preventDefault: boolean;
};

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
  private bindings: EffectiveKeyBindings = resolveEffectiveBindings();
  private heldCodes = new Set<string>();
  private jumpPressed = false;

  constructor(bindings: KeyBindings = {}) {
    this.setBindings(bindings);
  }

  setBindings(bindings: KeyBindings): void {
    this.bindings = { ...resolveEffectiveBindings(bindings) };
    this.releaseAll();
  }

  rebind(action: GameAction, code: string): void {
    if (!VALID_KEY_CODE.test(code)) throw new RangeError(`Invalid KeyboardEvent.code: ${code}`);
    const next = { ...this.bindings };
    for (const boundAction of Object.keys(next) as GameAction[]) {
      if (next[boundAction] === code) delete next[boundAction];
    }
    next[action] = code;
    this.bindings = next as EffectiveKeyBindings;
    this.releaseAll();
  }

  keyDown(code: string, context: KeyDownContext): KeyDownResult {
    const action = actionForCode(this.bindings, code);
    if (context.textInput || (!context.focused && !(context.uiFocused && action === 'escape'))) {
      return { command: null, preventDefault: false };
    }
    this.heldCodes.add(code);
    if (context.repeat) return { command: null, preventDefault: false };

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
  onTrustedGesture?(): void;
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
    const uiFocused = this.isUiControlFocused(event.target);
    if (!focused && this.inputHasHeldKeys()) this.input.releaseAll();
    if (!focused && !uiFocused) {
      return;
    }
    if (focused && event.isTrusted) this.options.onTrustedGesture?.();
    if (focused && (event.ctrlKey || event.altKey) && !textInput) event.preventDefault();
    const result = this.input.keyDown(event.code, {
      focused,
      uiFocused,
      textInput,
      repeat: event.repeat,
      panels: this.options.getPanels(),
    });
    if (result.preventDefault) event.preventDefault();
    if (result.command) this.options.dispatch(result.command);
  };
  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.input.keyUp(event.code);
    // Releasing Alt on its own activates the browser menu bar on Windows (Firefox, and the Chrome/Edge
    // app menu), which steals keyboard focus mid-fight. Alt is the default jump key, so swallow it.
    if ((event.code === 'AltLeft' || event.code === 'AltRight')
      && this.isGameInputFocused(event.target)
      && !isTextEntryTarget(event.target)) event.preventDefault();
  };
  private readonly handleBlur = (): void => {
    this.input.releaseAll();
    this.options.onWindowFocusChange(false);
  };
  private readonly handleFocus = (): void => {
    const doc = this.options.uiRoot.ownerDocument;
    if (doc.visibilityState !== 'hidden' && doc.hasFocus()) this.options.onWindowFocusChange(true);
  };
  private readonly handleVisibility = (): void => {
    if (this.options.uiRoot.ownerDocument.visibilityState === 'hidden') this.handleBlur();
    else this.handleFocus();
  };
  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.isTrusted) this.options.onTrustedGesture?.();
    // A click on the game always means the player is back, even if no window focus event fired.
    const doc = this.options.uiRoot.ownerDocument;
    if (doc.visibilityState !== 'hidden' && doc.hasFocus()) this.options.onWindowFocusChange(true);
    const canvas = this.options.gameRoot.querySelector('canvas');
    if (canvas) {
      canvas.tabIndex = 0;
      canvas.focus();
    }
  };
  // UI-only buttons (e.g. "建立角色") dispatch nothing, but a click on them still unlocks title music.
  private readonly handleUiClick = (event: MouseEvent): void => {
    if (event.isTrusted) this.options.onTrustedGesture?.();
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
    options.uiRoot.addEventListener('click', this.handleUiClick);
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
    this.options.uiRoot.removeEventListener('click', this.handleUiClick);
    this.input.releaseAll();
  }

  private inputHasHeldKeys(): boolean {
    return (Object.keys(DEFAULT_KEY_BINDINGS) as GameAction[]).some((action) => this.input.isHeld(action));
  }

  private isGameInputFocused(target: EventTarget | null): boolean {
    const doc = this.options.gameRoot.ownerDocument;
    const active = doc.activeElement;
    const targetNode = target !== null && typeof target === 'object' && 'nodeType' in target
      ? target as Node
      : null;
    const isBodyOrGameActive = this.options.gameRoot.contains(active)
      || active === doc.body
      || active === doc.documentElement
      || active === null;
    const isBodyOrGameTarget = targetNode !== null && (
      this.options.gameRoot.contains(targetNode)
      || targetNode === doc.body
      || targetNode === doc.documentElement
      || targetNode === doc
    );
    return isBodyOrGameActive
      && !this.options.uiRoot.contains(active)
      && isBodyOrGameTarget
      && !this.options.uiRoot.contains(targetNode)
      && !isTextEntryTarget(active)
      && !isTextEntryTarget(target);
  }

  private isUiControlFocused(target: EventTarget | null): boolean {
    const active = this.options.uiRoot.ownerDocument.activeElement;
    const targetNode = target !== null && typeof target === 'object' && 'nodeType' in target
      ? target as Node
      : null;
    return targetNode !== null
      && this.options.uiRoot.contains(active)
      && this.options.uiRoot.contains(targetNode)
      && !isTextEntryTarget(active)
      && !isTextEntryTarget(target);
  }
}
