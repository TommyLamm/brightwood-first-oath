import type { AssetManifest } from '../contracts/asset-manifest.js';
import type { CommandDraft, GameCommand } from '../contracts/commands.js';
import type { ContentCatalog } from '../contracts/definitions.js';
import type { EntityId, RandomSource } from '../contracts/types.js';
import type { UiSnapshot, WorldSnapshot } from '../contracts/ports.js';
import { FIXED_STEP_SECONDS, FixedStepClock } from './fixed-step.js';
import { AssetManifestLoadError, loadRequiredAssetManifests, type ManifestFetcher } from './assets.js';
import { composeContentCatalog } from './catalog.js';
import { AppCommandQueue } from './command-queue.js';
import { KeyboardControls, type GameAction, type KeyBindings } from './keyboard.js';
import { appCommand, createInitialAppState, createUiSnapshot, type GameAppState, type StartupStatus, worldIsFrozen } from './state.js';
import { completeMapTransition, failMapTransition, makeWorldSnapshot, stepGameplay } from './gameplay.js';

export type AppStartupResult = {
  ready: boolean;
  status: StartupStatus;
  issues: readonly string[];
};

export type AppFixedStep = {
  dtSeconds: typeof FIXED_STEP_SECONDS;
  gameTimeMs: number;
  commands: readonly GameCommand[];
  catalog: ContentCatalog;
  assetManifests: readonly AssetManifest[];
  random: RandomSource;
  nextEntityId: () => EntityId;
};

export type AppOptions = {
  baseUrl: string;
  fetcher: ManifestFetcher;
  seed?: number;
  sessionPrefix?: string;
  onStateChange?: (state: GameAppState) => void;
  onFixedStep?: (step: AppFixedStep) => void;
  onWorldSnapshot?: (snapshot: WorldSnapshot) => void;
};

/** Owns one app state, command sequence, game clock, RNG and EntityId sequence. */
export class GameApp {
  private stateValue: GameAppState;
  private readonly commands = new AppCommandQueue();
  private readonly clock = new FixedStepClock();
  private readonly options: AppOptions;
  private initialization: Promise<AppStartupResult> | null = null;
  private keyboard: KeyboardControls | null = null;
  private pendingGameplayCommands: GameCommand[] = [];

  constructor(options: AppOptions) {
    this.options = options;
    this.stateValue = createInitialAppState(options.seed ?? randomSeed(), options.sessionPrefix ?? randomSessionPrefix());
  }

  get state(): GameAppState {
    return this.stateValue;
  }

  get uiSnapshot(): UiSnapshot | null {
    return createUiSnapshot(this.stateValue);
  }

  get queuedCommandCount(): number {
    return this.commands.length + this.pendingGameplayCommands.length;
  }

  initialize(): Promise<AppStartupResult> {
    if (this.initialization) return this.initialization;
    this.initialization = this.initializeOnce();
    return this.initialization;
  }

  dispatch(command: CommandDraft): GameCommand {
    return this.commands.enqueue(command);
  }

  attachKeyboard(gameRoot: HTMLElement, uiRoot: HTMLElement, bindings: KeyBindings = {}): void {
    this.keyboard?.dispose();
    this.keyboard = new KeyboardControls({
      gameRoot,
      uiRoot,
      dispatch: (command) => this.dispatch(command),
      getPanels: () => this.stateValue.panels,
      onWindowFocusChange: (windowFocused) => this.setWindowFocused(windowFocused),
    }, bindings);
  }

  setKeyBindings(bindings: KeyBindings): void {
    this.keyboard?.setBindings(bindings);
  }

  getInputFrame() {
    return this.keyboard?.input.consumeMovementFrame() ?? {
      moveX: 0 as const,
      climbY: 0 as const,
      jumpPressed: false,
      downHeld: false,
    };
  }

  isActionHeld(action: GameAction): boolean {
    return this.keyboard?.input.isHeld(action) ?? false;
  }

  setScreen(screen: GameAppState['screen']): void {
    this.setState({ ...this.stateValue, screen });
  }

  setWindowFocused(windowFocused: boolean): void {
    if (this.stateValue.windowFocused === windowFocused) return;
    this.setState({ ...this.stateValue, windowFocused });
    this.clock.clearAccumulator();
    if (!windowFocused) this.pendingGameplayCommands = [];
  }

  update(deltaMs: number): void {
    const wasFrozen = worldIsFrozen(this.stateValue);
    const queued = this.commands.drain();
    const gameplayCommands: GameCommand[] = [];
    for (const command of queued) {
      const applied = appCommand(this.stateValue, command);
      if (applied.handled) this.setState(applied.state);
      else gameplayCommands.push(command);
    }

    const newGameCommands = gameplayCommands.filter((command) => command.type === 'newGame');
    if (!this.stateValue.gameplay && newGameCommands.length > 0 && this.stateValue.catalog) {
      const start = stepGameplay(null, {
        catalog: this.stateValue.catalog,
        commands: newGameCommands,
        input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
        dtSeconds: 0,
        nowMs: this.stateValue.gameTimeMs,
        random: this.stateValue.random,
        nextEntityId: this.stateValue.nextEntityId,
      });
      this.setState({ ...this.stateValue, gameplay: start.gameplay, screen: start.screen });
    }
    const lifecycleCommands = gameplayCommands.filter((command) =>
      (command.type === 'respawn' && this.stateValue.screen === 'dead')
      || (command.type === 'retryBoss' && this.stateValue.screen === 'result')
      || (command.type === 'returnTown' && this.stateValue.screen === 'result'));
    if (this.stateValue.gameplay && this.stateValue.catalog && lifecycleCommands.length > 0) {
      const lifecycle = stepGameplay(this.stateValue.gameplay, {
        catalog: this.stateValue.catalog,
        commands: lifecycleCommands,
        input: { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false },
        dtSeconds: 0,
        nowMs: this.stateValue.gameTimeMs,
        random: this.stateValue.random,
        nextEntityId: this.stateValue.nextEntityId,
      });
      this.setState({ ...this.stateValue, gameplay: lifecycle.gameplay, screen: lifecycle.screen });
    }
    const lifecycleSequences = new Set(lifecycleCommands.map(({ seq }) => seq));
    const commandsWithoutStart = gameplayCommands.filter((command) => command.type !== 'newGame'
      && !lifecycleSequences.has(command.seq));

    if (wasFrozen) this.clock.clearAccumulator();
    if (worldIsFrozen(this.stateValue)) {
      this.clock.advance(deltaMs, true);
      this.pendingGameplayCommands = [];
      return;
    }

    const frame = this.clock.advance(deltaMs, false);
    this.pendingGameplayCommands.push(...commandsWithoutStart);
    if (frame.steps === 0) return;

    const catalog = this.stateValue.catalog;
    const assetManifests = this.stateValue.assetManifests;
    if (!catalog || !assetManifests) {
      this.setState({ ...this.stateValue, gameTimeMs: frame.gameTimeMs });
      this.pendingGameplayCommands = [];
      return;
    }

    for (let index = 0; index < frame.tickTimesMs.length; index += 1) {
      if (worldIsFrozen(this.stateValue)) {
        this.clock.clearAccumulator();
        this.pendingGameplayCommands = [];
        break;
      }
      const gameTimeMs = frame.tickTimesMs[index]!;
      this.setState({ ...this.stateValue, gameTimeMs });
      const commands = index === 0 ? this.pendingGameplayCommands : [];
      const input = this.getInputFrame();
      const result = stepGameplay(this.stateValue.gameplay, {
        catalog,
        commands,
        input,
        dtSeconds: FIXED_STEP_SECONDS,
        nowMs: gameTimeMs,
        random: this.stateValue.random,
        nextEntityId: this.stateValue.nextEntityId,
      });
      this.setState({ ...this.stateValue, gameplay: result.gameplay, screen: result.screen });
      if (result.openPanel) {
        const panel = appCommand(this.stateValue, { type: 'setPanel', payload: { panel: result.openPanel } });
        this.setState(panel.state);
      }
      if (result.gameplay) {
        this.options.onWorldSnapshot?.(makeWorldSnapshot(result.gameplay, catalog, gameTimeMs));
      }
      this.options.onFixedStep?.({
        dtSeconds: FIXED_STEP_SECONDS,
        gameTimeMs,
        commands,
        catalog,
        assetManifests,
        random: this.stateValue.random,
        nextEntityId: this.stateValue.nextEntityId,
      });
      if (index === 0) this.pendingGameplayCommands = [];
    }
  }

  reportRuntimeIssue(message: string): void {
    this.setState({
      ...this.stateValue,
      startupStatus: 'incomplete',
      startupIssues: [...this.stateValue.startupIssues, message],
    });
  }

  completeMapTransition(): void {
    const { gameplay, catalog, nextEntityId, gameTimeMs } = this.stateValue;
    if (!gameplay || !catalog) return;
    const result = completeMapTransition(gameplay, catalog, nextEntityId, gameTimeMs);
    this.setState({ ...this.stateValue, gameplay: result.gameplay, screen: result.screen });
  }

  failMapTransition(message: string): void {
    const { gameplay } = this.stateValue;
    if (!gameplay) return;
    const result = failMapTransition(gameplay, message);
    this.setState({ ...this.stateValue, gameplay: result.gameplay, screen: result.screen });
  }

  dispose(): void {
    this.keyboard?.dispose();
    this.keyboard = null;
    this.commands.drain();
    this.pendingGameplayCommands = [];
    this.clock.clearAccumulator();
  }

  private async initializeOnce(): Promise<AppStartupResult> {
    const catalogResult = composeContentCatalog();
    if (!catalogResult.ok) return this.failStartup([catalogResult.message]);

    let manifests: AssetManifest[];
    try {
      manifests = await loadRequiredAssetManifests(this.options.baseUrl, this.options.fetcher);
    } catch (error) {
      const messages = error instanceof AssetManifestLoadError
        ? error.issues.map(({ pack, message }) => `[${pack}] ${message}`)
        : [error instanceof Error ? error.message : String(error)];
      return this.failStartup(messages);
    }

    this.setState({
      ...this.stateValue,
      screen: 'title',
      startupStatus: 'ready',
      startupIssues: [],
      catalog: catalogResult.value,
      assetManifests: manifests,
    });
    return { ready: true, status: 'ready', issues: [] };
  }

  private failStartup(issues: string[]): AppStartupResult {
    this.setState({
      ...this.stateValue,
      screen: 'error',
      startupStatus: 'incomplete',
      startupIssues: issues,
      catalog: null,
      assetManifests: null,
    });
    return { ready: false, status: 'incomplete', issues };
  }

  private setState(state: GameAppState): void {
    this.stateValue = state;
    this.options.onStateChange?.(state);
  }
}

function randomSeed(): number {
  const values = new Uint32Array(1);
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(values);
    return values[0] ?? 0;
  }
  return Date.now() >>> 0;
}

function randomSessionPrefix(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `session-${Date.now().toString(36)}`;
}
