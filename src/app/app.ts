import type { AssetManifest } from '../contracts/asset-manifest.js';
import type { CommandDraft, GameCommand } from '../contracts/commands.js';
import type { ContentCatalog } from '../contracts/definitions.js';
import type { EntityId, MonsterState, RandomSource, SaveData, Settings } from '../contracts/types.js';
import type { AudioController, AudioFactory, CloudPort, MusicIntensity, Persistence, StorageLike, UiSnapshot, WorldSnapshot } from '../contracts/ports.js';
import { createAudio } from '../audio/index.js';
import { FIXED_STEP_SECONDS, FixedStepClock } from './fixed-step.js';
import { AssetManifestLoadError, loadRequiredAssetManifests, loadRequiredHeroAnchors, type ManifestFetcher } from './assets.js';
import { composeContentCatalog } from './catalog.js';
import { AppCommandQueue } from './command-queue.js';
import { DEFAULT_KEY_BINDINGS, KeyboardControls, type GameAction, type KeyBindings } from './keyboard.js';
import { appCommand, createInitialAppState, createUiSnapshot, type GameAppState, type StartupStatus, worldIsFrozen } from './state.js';
import { completeMapTransition, failMapTransition, makeWorldSnapshot, restoreGame, startNewGame, stepGameplay } from './gameplay.js';
import { BRIGHTWOOD_GAME_ID, createPersistence, SAVE_FORMAT_VERSION } from '../persistence/index.js';

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
  gameId?: string;
  storage?: StorageLike | null;
  cloud?: CloudPort | null;
  audioFactory?: AudioFactory;
  seed?: number;
  sessionPrefix?: string;
  onStateChange?: (state: GameAppState) => void;
  onFixedStep?: (step: AppFixedStep) => void;
  onWorldSnapshot?: (snapshot: WorldSnapshot) => void;
};

const DEFAULT_AUDIO_SETTINGS: Settings = {
  masterVolume: 0.8,
  musicVolume: 0.35,
  sfxVolume: 0.65,
  muted: false,
  bindings: {},
};

const MAX_REMEMBERED_AUDIO_EVENT_IDS = 512;
const TITLE_MUSIC_KEY = 'theme-title';
/** Monsters in these modes have noticed the hero; within this range the combat layer comes in. */
const ENGAGED_MONSTER_MODES = new Set(['chase', 'windup', 'dash', 'recovery']);
const COMBAT_MUSIC_RANGE_PX = 720;
/** Combat music lingers this long after the last threat so it doesn't flap at the edge of aggro. */
const COMBAT_MUSIC_HOLD_MS = 4500;
const BOSS_MONSTER_IDS = new Set(['guardian', 'frost-tide-warden', 'sunwell-sentinel', 'ruins-bell-keeper']);
const ATTACK_SOUND_BY_SKILL: Record<string, string> = { 'heavy-strike': 'attack-heavy', sweep: 'attack-sweep' };
const TUNABLE_STELE_IDS = ['ruins-stele-west', 'ruins-stele-east'] as const;
const FOCUS_DISCARDED_COMMAND_TYPES: ReadonlySet<CommandDraft['type']> = new Set([
  'attack', 'pickup', 'interact', 'inspect', 'useItem', 'togglePause',
]);
const FOCUS_TRANSIENT_GAMEPLAY_TYPES: ReadonlySet<CommandDraft['type']> = new Set([
  'attack', 'pickup', 'interact', 'inspect', 'useItem',
]);

/** Owns one app state, command sequence, game clock, RNG and EntityId sequence. */
export class GameApp {
  private stateValue: GameAppState;
  private readonly commands = new AppCommandQueue();
  private readonly clock = new FixedStepClock();
  private readonly options: AppOptions;
  private initialization: Promise<AppStartupResult> | null = null;
  private keyboard: KeyboardControls | null = null;
  private pendingGameplayCommands: GameCommand[] = [];
  private persistence: Persistence | null = null;
  private persistenceMode: 'local' | 'cloud' | 'preview' | 'memory' = 'memory';
  private legacyImportDismissedForSession = false;
  private temporaryPlay = false;
  private lastUiClickAt = -Infinity;
  private saveFingerprint: string | null = null;
  private operationGeneration = 0;
  private audioController: AudioController | null = null;
  private audioUnlockInFlight: Promise<void> | null = null;
  private readonly pendingAudioEvents: string[] = [];
  private audioMusicKey: string | null = null;
  private audioAmbienceKey: string | null | undefined = undefined;
  private audioIntensity: MusicIntensity = 'explore';
  private audioDucked: boolean | null = null;
  private lastThreatAtMs = -Infinity;
  /** Last seen combat/audio state per monster; states can be mutated in place between frames. */
  private audioMonsterStates = new Map<EntityId, { dead: boolean; enraged: boolean; phaseTransitionStartedAtMs: number | null }>();
  private audioPaused: boolean | null = null;
  private audioSettingsFingerprint: string | null = null;
  private audioEventSequence = 0;
  private readonly audioEventIds = new Set<string>();
  private readonly audioEventOrder: string[] = [];

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

  dispatchUi(command: CommandDraft): GameCommand {
    this.unlockAudioFromGesture();
    const queued = this.dispatch(command);
    // One click can dispatch several commands (e.g. selling every material); play a single click for them.
    const now = Date.now();
    if (now - this.lastUiClickAt >= 50) {
      this.lastUiClickAt = now;
      this.playAudioOnce(`ui-click:${queued.seq}`, 'ui-click');
    }
    return queued;
  }

  attachKeyboard(gameRoot: HTMLElement, uiRoot: HTMLElement, bindings: KeyBindings = {}): void {
    this.keyboard?.dispose();
    this.keyboard = new KeyboardControls({
      gameRoot,
      uiRoot,
      dispatch: (command) => this.dispatch(command),
      getPanels: () => this.stateValue.panels,
      onWindowFocusChange: (windowFocused) => this.setWindowFocused(windowFocused),
      onTrustedGesture: () => { void this.unlockAudioFromGesture(); },
    }, { ...bindings, ...getSavedKeyBindings(this.stateValue.gameplay?.saveData.settings.bindings) });
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
    const state = this.stateValue;
    if (!windowFocused) {
      this.keyboard?.input.releaseAll();
      this.commands.discard(FOCUS_DISCARDED_COMMAND_TYPES);
      this.pendingGameplayCommands = [];

      const shouldRequireResume = state.focusResumeRequired
        || (state.gameplay !== null && ['playing', 'paused', 'loading'].includes(state.screen));
      let gameplay = state.gameplay;
      if (gameplay?.bufferedAttack) {
        gameplay = { ...gameplay };
        delete gameplay.bufferedAttack;
      }
      if (state.windowFocused || shouldRequireResume !== state.focusResumeRequired || gameplay !== state.gameplay) {
        this.setState({ ...state, windowFocused: false, focusResumeRequired: shouldRequireResume, gameplay });
      }
    } else if (!state.windowFocused) {
      this.setState({ ...state, windowFocused: true });
    }
    this.clock.clearAccumulator();
  }

  update(deltaMs: number): void {
    this.enqueueHeldPickup();
    const wasFrozen = worldIsFrozen(this.stateValue);
    const queued = this.commands.drain();
    const gameplayCommands: GameCommand[] = [];
    for (const command of queued) {
      const applied = appCommand(this.stateValue, command);
      if (applied.handled) this.setState(applied.state);
      else if (this.handleAppCommand(command)) continue;
      else gameplayCommands.push(command);
    }

    const lifecycleCommands = gameplayCommands.filter((command) =>
      (command.type === 'respawn' && this.stateValue.screen === 'dead')
      || (command.type === 'retryBoss' && this.stateValue.screen === 'result')
      || (command.type === 'returnTown'
        && (this.stateValue.screen === 'playing' || this.stateValue.screen === 'result')));
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
      const nextPanels = lifecycle.screen !== 'playing' ? [] : this.stateValue.panels;
      this.setState({ ...this.stateValue, gameplay: lifecycle.gameplay, screen: lifecycle.screen, panels: nextPanels });
    }
    const lifecycleSequences = new Set(lifecycleCommands.map(({ seq }) => seq));
    const commandsWithoutStart = gameplayCommands.filter((command) => !lifecycleSequences.has(command.seq));
    const commandsForNextStep = wasFrozen
      ? commandsWithoutStart.filter(({ type }) => !FOCUS_TRANSIENT_GAMEPLAY_TYPES.has(type))
      : commandsWithoutStart;

    if (wasFrozen) this.clock.clearAccumulator();
    if (worldIsFrozen(this.stateValue)) {
      this.clock.advance(deltaMs, true);
      if (this.stateValue.focusResumeRequired) {
        const safePendingCommands = this.pendingGameplayCommands.filter(({ type }) => !FOCUS_TRANSIENT_GAMEPLAY_TYPES.has(type));
        const safeQueuedCommands = commandsForNextStep.filter(({ type }) => !FOCUS_TRANSIENT_GAMEPLAY_TYPES.has(type));
        this.pendingGameplayCommands = [...safePendingCommands, ...safeQueuedCommands];
      } else {
        this.pendingGameplayCommands = [];
      }
      return;
    }

    const frame = this.clock.advance(deltaMs, false);
    this.pendingGameplayCommands.push(...commandsForNextStep);
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
      const previousGameplay = this.stateValue.gameplay;
      const nextPanels = result.screen !== 'playing' ? [] : this.stateValue.panels;
      this.setState({ ...this.stateValue, gameplay: result.gameplay, screen: result.screen, panels: nextPanels });
      if (input.jumpPressed && previousGameplay && result.gameplay
        && ['grounded', 'climbing'].includes(previousGameplay.movement.mode)
        && result.gameplay.movement.mode === 'airborne'
        && result.gameplay.movement.velocity.y < 0) {
        this.playAudioOnce(`jump:${result.gameplay.playerEntityId}:${gameTimeMs}`, 'jump');
      }
      this.checkpointIfChanged(result.gameplay?.saveData ?? null);
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

  /** Holding the pickup key collects one nearby drop per gameplay pickup interval (150ms). */
  private enqueueHeldPickup(): void {
    const { gameplay, screen, gameTimeMs } = this.stateValue;
    if (screen !== 'playing' || !gameplay || !this.isActionHeld('pickup')) return;
    if (gameTimeMs < gameplay.nextPickupAtMs) return;
    const { x, y } = gameplay.movement.position;
    if (!gameplay.drops.some(({ position }) => Math.hypot(position.x - x, position.y - y) <= 90)) return;
    this.commands.enqueue({ type: 'pickup', payload: {} });
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
    this.setState({ ...this.stateValue, gameplay: result.gameplay, screen: result.screen, panels: [] });
    this.checkpointIfChanged(result.gameplay?.saveData ?? null);
  }

  failMapTransition(message: string): void {
    const { gameplay } = this.stateValue;
    if (!gameplay) return;
    const result = failMapTransition(gameplay, message);
    this.setState({ ...this.stateValue, gameplay: result.gameplay, screen: result.screen });
  }

  dispose(): void {
    this.operationGeneration += 1;
    this.persistence?.dispose();
    this.persistence = null;
    this.keyboard?.dispose();
    this.keyboard = null;
    try { this.audioController?.dispose(); } catch { /* Audio cleanup must not interrupt app disposal. */ }
    this.audioController = null;
    this.audioUnlockInFlight = null;
    this.pendingAudioEvents.length = 0;
    this.audioMusicKey = null;
    this.audioPaused = null;
    this.audioSettingsFingerprint = null;
    this.audioEventIds.clear();
    this.audioEventOrder.length = 0;
    this.commands.drain();
    this.pendingGameplayCommands = [];
    this.clock.clearAccumulator();
  }

  private async initializeOnce(): Promise<AppStartupResult> {
    const catalogResult = composeContentCatalog();
    if (!catalogResult.ok) return this.failStartup([catalogResult.message]);
    const generation = ++this.operationGeneration;
    const catalog = catalogResult.value;
    this.setState({ ...this.stateValue, screen: 'loading', startupStatus: 'loading', startupIssues: [], catalog });

    this.persistence?.dispose();
    this.temporaryPlay = false;
    this.saveFingerprint = null;
    const persistence = createPersistence({
      gameId: this.options.gameId ?? BRIGHTWOOD_GAME_ID,
      storage: this.options.storage ?? null,
      cloud: this.options.cloud ?? null,
      catalog,
      onStatus: (saveStatus, message) => {
        if (this.persistence !== persistence) return;
        const upgrade = this.stateValue.saveUpgrade;
        const upgraded = upgrade?.source === 'local' && saveStatus === 'localSaved'
          || upgrade?.source === 'cloud' && saveStatus === 'saved';
        this.setState({
          ...this.stateValue,
          saveStatus,
          saveMessage: upgraded
            ? upgrade?.source === 'local'
              ? `已備份 format ${upgrade.formatVersion} 原始存檔並升級至 format ${SAVE_FORMAT_VERSION}。`
              : `format ${SAVE_FORMAT_VERSION} 已由平台確認保存。`
            : message ?? null,
          saveUpgrade: upgraded ? null : this.stateValue.saveUpgrade,
        });
      },
    });
    this.persistence = persistence;
    this.persistenceMode = 'memory';

    const [assetsResult, anchorsResult, saveResult] = await Promise.allSettled([
      loadRequiredAssetManifests(this.options.baseUrl, this.options.fetcher),
      loadRequiredHeroAnchors(this.options.baseUrl, this.options.fetcher),
      persistence.initialize(),
    ]);
    if (generation !== this.operationGeneration || this.persistence !== persistence) {
      return { ready: false, status: 'incomplete', issues: ['初始化已被較新的工作階段取代。'] };
    }

    if (saveResult.status === 'fulfilled') this.applyLoadOutcome(saveResult.value, 'loading');
    else this.setState({ ...this.stateValue, saveStatus: 'loadError', saveMessage: errorMessage(saveResult.reason, '存檔初始化失敗。') });

    const startupIssues: string[] = [];
    if (assetsResult.status === 'rejected') {
      const error = assetsResult.reason;
      startupIssues.push(...(error instanceof AssetManifestLoadError
        ? error.issues.map(({ pack, message }) => `[${pack}] ${message}`)
        : [errorMessage(error, '遊戲資產載入失敗。')]));
    }
    if (anchorsResult.status === 'rejected') {
      startupIssues.push(errorMessage(anchorsResult.reason, '主角裝備定位資料載入失敗。'));
    }
    if (startupIssues.length > 0 || assetsResult.status !== 'fulfilled' || anchorsResult.status !== 'fulfilled') {
      return this.failStartup(startupIssues, catalog);
    }

    const assetManifests = assetsResult.value;
    const heroAnchors = anchorsResult.value;

    this.setState({
      ...this.stateValue,
      screen: 'title',
      startupStatus: 'ready',
      startupIssues: [],
      catalog,
      assetManifests,
      heroAnchors,
    });
    this.initializeAudio(assetManifests);
    return { ready: true, status: 'ready', issues: [] };
  }

  private failStartup(issues: string[], catalog: ContentCatalog | null = null): AppStartupResult {
    this.setState({
      ...this.stateValue,
      screen: 'error',
      startupStatus: 'incomplete',
      startupIssues: issues,
      catalog,
      assetManifests: null,
      heroAnchors: null,
    });
    return { ready: false, status: 'incomplete', issues };
  }

  private handleAppCommand(command: GameCommand): boolean {
    switch (command.type) {
      case 'newGame':
        this.handleNewGame(command.payload.name);
        return true;
      case 'continue':
        if (this.stateValue.saveUpgrade) {
          this.setToast('請先選擇備份並升級，或暫時遊玩；未升級前不會寫入新格式。');
          return true;
        }
        if (this.stateValue.screen === 'chapter' && this.stateValue.gameplay) {
          this.setState({ ...this.stateValue, screen: 'playing', saveMessage: null });
        } else if (this.stateValue.screen !== 'title' || !this.stateValue.gameplay) {
          this.setToast('目前沒有可繼續的角色。');
        } else {
          const dead = this.stateValue.gameplay.saveData.player.hp <= 0;
          this.setState({ ...this.stateValue, screen: dead ? 'dead' : 'playing', worldRevision: this.stateValue.worldRevision + 1, saveMessage: null });
        }
        return true;
      case 'playTemporary':
        this.startTemporaryGame();
        return true;
      case 'retrySave':
        this.retryPersistence();
        return true;
      case 'confirmSaveUpgrade':
        if (this.stateValue.screen !== 'title' || !this.stateValue.saveUpgrade
          || !['upgradeRequired', 'saveError'].includes(this.stateValue.saveStatus) || !this.persistence) {
          this.setToast('目前沒有可確認的存檔升級。');
        } else {
          this.persistence.confirmSaveUpgrade();
        }
        return true;
      case 'importLegacySave':
        if (this.stateValue.screen !== 'title' || !this.stateValue.legacyImportAvailable
          || this.persistenceMode !== 'local' || this.temporaryPlay) {
          this.setToast('目前沒有可匯入的舊版進度。');
        } else {
          void this.importLegacyProgress();
        }
        return true;
      case 'dismissLegacyImport':
        if (this.stateValue.screen !== 'title' || !this.stateValue.legacyImportAvailable) {
          this.setToast('目前沒有可略過的舊版進度匯入。');
        } else {
          const message = '已暫不匯入；這台裝置保留的舊版進度沒有變更。';
          this.legacyImportDismissedForSession = true;
          this.setState({
            ...this.stateValue,
            saveMessage: null,
            legacyImportAvailable: false,
            legacyImportMessage: message,
          });
        }
        return true;
      case 'discardUnreadableSave':
        if (this.stateValue.screen !== 'title' || this.stateValue.saveStatus !== 'loadError') {
          this.setToast('目前沒有需要清除的損毀存檔。');
        } else if (!this.persistence?.discardUnreadableLocalSave?.()) {
          this.setToast('無法清除這份存檔；請重試讀取，或改用暫時遊玩。');
        } else {
          void this.reloadPersistence('已將無法讀取的存檔另存為備份，現在可以建立新角色。');
        }
        return true;
      case 'useCloudVersion':
        if (this.stateValue.saveStatus !== 'conflict') this.setToast('目前沒有待處理的雲端版本衝突。');
        else if (!this.options.cloud) this.setToast('此版本沒有可用的雲端存檔介面。');
        else void this.reloadPersistence('雲端版本已重新載入。');
        return true;
      case 'returnTitle':
        if (this.stateValue.saveStatus === 'conflict') {
          this.setState({ ...this.stateValue, screen: 'title', panels: [], focusResumeRequired: false, saveMessage: '存檔衝突尚未解決；請選擇載入雲端版本。' });
        } else if (!this.temporaryPlay && ['saving', 'saveError'].includes(this.stateValue.saveStatus)) {
          this.setToast('請先完成或重試存檔，再返回標題。');
        } else if (this.temporaryPlay) {
          void this.reloadPersistence('已返回標題畫面。', true);
        } else {
          // Keep queued ordinary checkpoints alive; reinitializing here would cancel them.
          this.setState({ ...this.stateValue, screen: 'title', panels: [], focusResumeRequired: false, saveMessage: null });
        }
        return true;
      case 'setSettings': {
        const gameplay = this.stateValue.gameplay;
        if (!gameplay) this.setToast('目前沒有可儲存的設定。');
        else {
          const updated = {
            ...gameplay,
            saveData: {
              ...gameplay.saveData,
              settings: { ...command.payload.settings, bindings: { ...command.payload.settings.bindings } },
            },
          };
          this.setState({ ...this.stateValue, gameplay: updated });
          this.checkpointIfChanged(updated.saveData);
        }
        return true;
      }
      default:
        return false;
    }
  }

  private handleNewGame(name: string): void {
    const state = this.stateValue;
    if (state.saveUpgrade && !this.temporaryPlay) {
      this.setToast('請先處理舊格式存檔；可備份並升級，或選擇暫時遊玩。');
      return;
    }
    if (state.startupStatus !== 'ready' || !state.catalog || !state.assetManifests || !state.heroAnchors) {
      this.setToast('遊戲資產尚未就緒，暫時不能建立角色。');
      return;
    }
    if (state.screen !== 'title' && state.screen !== 'create') return;
    // Ask for a second confirmation only when an existing (or unknown) save could be replaced.
    if (state.screen === 'title' && (state.gameplay || (!this.temporaryPlay && !this.canWriteProgress()))) {
      this.setState({ ...state, screen: 'create', saveMessage: '再次確認即可建立角色；現有角色的進度將被取代。' });
      return;
    }
    if (!this.temporaryPlay && !this.canWriteProgress()) {
      this.setToast('存檔尚未安全初始化；請先重試或選擇暫時遊玩。');
      return;
    }
    const started = startNewGame(name, state.catalog, state.nextEntityId);
    if ('error' in started) {
      this.setState({ ...state, screen: 'create', saveMessage: started.error });
      return;
    }
    this.saveFingerprint = null;
    this.setState({
      ...state,
      gameplay: started.gameplay,
      screen: 'playing',
      panels: [],
      focusResumeRequired: false,
      saveMessage: this.temporaryPlay ? '暫時遊玩不會寫入本機或雲端存檔。' : null,
      saveUpgrade: null,
      legacyImportAvailable: false,
      legacyImportMessage: null,
      worldRevision: state.worldRevision + 1,
    });
    this.checkpointIfChanged(started.gameplay.saveData);
  }

  private startTemporaryGame(): void {
    const state = this.stateValue;
    if (state.startupStatus !== 'ready' || !state.catalog || !state.assetManifests || !state.heroAnchors) {
      this.setToast('必要遊戲資產尚未就緒，暫時不能開始遊玩。');
      return;
    }
    this.operationGeneration += 1;
    this.persistence?.invalidate();
    this.persistenceMode = 'memory';
    this.temporaryPlay = true;
    const gameplay = state.gameplay
      ? restoreGame(state.gameplay.saveData, state.catalog, state.nextEntityId).gameplay
      : (() => {
          const started = startNewGame('旅人', state.catalog!, state.nextEntityId);
          if ('error' in started) return null;
          return started.gameplay;
        })();
    if (!gameplay) {
      this.setToast('暫時角色建立失敗。');
      return;
    }
    this.saveFingerprint = null;
    this.setState({
      ...state,
      gameplay,
      screen: gameplay.saveData.player.hp <= 0 ? 'dead' : 'playing',
      panels: [],
      saveStatus: 'unavailable',
      saveMessage: '暫時遊玩不會寫入本機或雲端存檔。',
      saveUpgrade: null,
      legacyImportAvailable: false,
      legacyImportMessage: null,
      worldRevision: state.worldRevision + 1,
    });
  }

  private async importLegacyProgress(): Promise<void> {
    const persistence = this.persistence;
    const catalog = this.stateValue.catalog;
    if (!persistence?.importLegacySave || !catalog || this.stateValue.startupStatus !== 'ready'
      || !this.stateValue.legacyImportAvailable || this.persistenceMode !== 'local' || this.temporaryPlay) {
      this.setToast('目前沒有可匯入的舊版進度。');
      return;
    }
    const generation = ++this.operationGeneration;
    this.saveFingerprint = null;
    this.setState({
      ...this.stateValue,
      screen: 'loading',
      panels: [],
      saveStatus: 'loading',
      saveMessage: '正在確認這台裝置的舊版進度…',
      legacyImportAvailable: false,
      legacyImportMessage: null,
    });
    try {
      const outcome = await persistence.importLegacySave();
      if (generation !== this.operationGeneration || this.persistence !== persistence) return;
      this.applyLoadOutcome(outcome, 'title');
    } catch (error) {
      if (generation !== this.operationGeneration || this.persistence !== persistence) return;
      this.setState({
        ...this.stateValue,
        screen: 'title',
        saveStatus: 'loadError',
        saveMessage: errorMessage(error, '舊版進度匯入未能完成；原件仍保留。'),
        legacyImportAvailable: false,
        legacyImportMessage: null,
      });
    }
  }

  private retryPersistence(): void {
    const status = this.stateValue.saveStatus;
    if (status === 'saveError' && this.persistence) {
      void this.persistence.retry();
      return;
    }
    if (status === 'loadError' || status === 'unavailable' || status === 'incompatible') {
      void this.reloadPersistence('存檔已重新載入。');
      return;
    }
    this.setToast('目前沒有需要重試的存檔作業。');
  }

  private async reloadPersistence(successMessage: string, clearFocusResume = false): Promise<void> {
    const persistence = this.persistence;
    const catalog = this.stateValue.catalog;
    if (!persistence || !catalog || this.stateValue.startupStatus !== 'ready') {
      this.setToast('存檔或遊戲資產尚未就緒。');
      return;
    }
    const generation = ++this.operationGeneration;
    this.temporaryPlay = false;
    this.saveFingerprint = null;
    persistence.invalidate();
    this.setState({
      ...this.stateValue,
      screen: 'loading',
      panels: [],
      ...(clearFocusResume ? { focusResumeRequired: false } : {}),
      saveStatus: 'loading',
      saveMessage: '正在重新載入存檔…',
      saveUpgrade: null,
      legacyImportAvailable: false,
      legacyImportMessage: null,
    });
    try {
      const outcome = await persistence.initialize();
      if (generation !== this.operationGeneration || this.persistence !== persistence) return;
      this.applyLoadOutcome(outcome, 'title');
      if (!outcome.legacyImportAvailable
        && (outcome.status === 'ready' || outcome.status === 'localSaved' || outcome.status === 'previewOnly')) {
        this.setState({ ...this.stateValue, saveMessage: successMessage });
      }
    } catch (error) {
      if (generation !== this.operationGeneration || this.persistence !== persistence) return;
      this.setState({ ...this.stateValue, screen: 'title', saveStatus: 'loadError', saveMessage: errorMessage(error, '讀取存檔失敗。') });
    }
  }

  private applyLoadOutcome(outcome: import('../contracts/ports.js').LoadOutcome, screen: GameAppState['screen']): void {
    const state = this.stateValue;
    const catalog = state.catalog;
    if (!catalog) return;
    this.persistenceMode = outcome.mode;
    this.temporaryPlay = false;
    let gameplay: GameAppState['gameplay'] = null;
    let repairedArenaLocation = false;
    if (outcome.data) {
      const restored = restoreGame(outcome.data, catalog, state.nextEntityId);
      gameplay = restored.gameplay;
      repairedArenaLocation = restored.repairedArenaLocation;
    }
    this.saveFingerprint = outcome.data ? saveFingerprint(outcome.data) : null;
    this.setState({
      ...state,
      gameplay,
      screen,
      panels: [],
      saveStatus: outcome.status,
      saveMessage: repairedArenaLocation ? '首領戰存檔已安全返回礦道入口。' : outcome.message ?? null,
      saveUpgrade: outcome.saveUpgrade ?? null,
      legacyImportAvailable: outcome.legacyImportAvailable === true && !this.legacyImportDismissedForSession,
      legacyImportMessage: this.legacyImportDismissedForSession && outcome.legacyImportAvailable
        ? '已暫不匯入；這台裝置保留的舊版進度沒有變更。'
        : outcome.legacyImportMessage ?? null,
      worldRevision: state.worldRevision + 1,
    });
    if (repairedArenaLocation && gameplay) this.checkpointIfChanged(gameplay.saveData);
  }

  private checkpointIfChanged(data: SaveData | null): void {
    if (!data || this.temporaryPlay || !this.persistence || this.persistenceMode === 'memory') return;
    const fingerprint = saveFingerprint(data);
    if (fingerprint === this.saveFingerprint) return;
    this.saveFingerprint = fingerprint;
    this.persistence.checkpoint(data);
  }

  private canWriteProgress(): boolean {
    return this.persistence !== null
      && this.persistenceMode !== 'memory'
      && ['ready', 'saving', 'saved', 'localSaved', 'previewOnly'].includes(this.stateValue.saveStatus);
  }

  private setToast(message: string): void {
    if (this.stateValue.gameplay) {
      this.setState({
        ...this.stateValue,
        gameplay: { ...this.stateValue.gameplay, toast: message },
      });
    } else {
      this.setState({ ...this.stateValue, saveMessage: message });
    }
  }

  private setState(state: GameAppState): void {
    const previousState = this.stateValue;
    this.stateValue = state;
    this.synchronizeAudio(previousState, state);
    const previousBindings = this.keyboardBindingsFingerprint;
    const nextBindings = JSON.stringify(state.gameplay?.saveData.settings.bindings ?? {});
    if (this.keyboard && previousBindings !== nextBindings) {
      this.keyboard.setBindings(getSavedKeyBindings(state.gameplay?.saveData.settings.bindings));
    }
    this.keyboardBindingsFingerprint = nextBindings;
    this.options.onStateChange?.(state);
  }

  private initializeAudio(manifests: readonly AssetManifest[]): void {
    if (this.audioController) return;
    const manifest = manifests.find(({ pack }) => pack === 'audio');
    if (!manifest) return;
    const settings = this.stateValue.gameplay?.saveData.settings ?? DEFAULT_AUDIO_SETTINGS;
    try {
      this.audioController = (this.options.audioFactory ?? createAudio)(manifest, settings);
      this.audioSettingsFingerprint = audioSettingsFingerprint(settings);
      this.audioPaused = null;
      this.audioMusicKey = null;
      this.audioAmbienceKey = undefined;
      this.audioIntensity = 'explore';
      this.audioDucked = null;
      this.synchronizeAudio(this.stateValue, this.stateValue);
    } catch {
      // Audio setup is optional at runtime; a browser audio error must not block play.
      this.audioController = null;
    }
  }

  private unlockAudioFromGesture(): Promise<void> | null {
    const controller = this.audioController;
    if (!controller) return null;
    if (this.audioUnlockInFlight) return this.audioUnlockInFlight;
    try {
      const unlock = controller.unlock();
      const inFlight = Promise.resolve(unlock).catch(() => undefined).then(() => {
        if (this.audioUnlockInFlight === inFlight) this.audioUnlockInFlight = null;
        this.flushPendingAudioEvents();
      });
      this.audioUnlockInFlight = inFlight;
      return inFlight;
    } catch {
      this.audioUnlockInFlight = null;
      return null;
    }
  }

  private synchronizeAudio(previous: GameAppState, next: GameAppState): void {
    const controller = this.audioController;
    if (!controller) return;

    const settings = next.gameplay?.saveData.settings;
    if (settings) {
      const fingerprint = audioSettingsFingerprint(settings);
      if (fingerprint !== this.audioSettingsFingerprint) {
        this.audioSettingsFingerprint = fingerprint;
        try { controller.setSettings(settings); } catch { /* Volume changes are best-effort. */ }
      }
    }

    const paused = !next.windowFocused || next.focusResumeRequired || next.screen === 'paused';
    if (paused !== this.audioPaused) {
      this.audioPaused = paused;
      try { controller.setPaused(paused); } catch { /* Pause audio best-effort; gameplay remains authoritative. */ }
    }
    // The settings panel keeps playing (quieter) so volume changes can be heard while adjusting.
    const ducked = next.panels.includes('settings');
    if (ducked !== this.audioDucked) {
      this.audioDucked = ducked;
      try { controller.setDucked(ducked); } catch { /* Ducking is cosmetic. */ }
    }

    // null (loading, no map yet) holds the current music so the title theme is not fetched on "continue".
    const musicKey = selectedMusicKey(next);
    if (musicKey !== this.audioMusicKey) {
      this.audioMusicKey = musicKey;
      try { void controller.setMusic(musicKey).catch(() => undefined); } catch { /* Missing music remains silent. */ }
    }

    const ambienceKey = selectedAmbienceKey(next);
    if (ambienceKey !== undefined && ambienceKey !== this.audioAmbienceKey) {
      this.audioAmbienceKey = ambienceKey;
      try { controller.setAmbience(ambienceKey); } catch { /* Ambience is decoration. */ }
    }

    const intensity = this.musicIntensity(previous, next);
    if (intensity !== this.audioIntensity) {
      this.audioIntensity = intensity;
      try { controller.setMusicIntensity(intensity); } catch { /* Adaptive music is best-effort. */ }
    }

    this.playStateTransitionAudio(previous, next);
  }

  /**
   * Adaptive music level: combat while an aggroed monster is near (held a few seconds after the
   * last threat), phase2 once a boss is past half health or in its second phase.
   */
  private musicIntensity(previous: GameAppState, next: GameAppState): MusicIntensity {
    const gameplay = next.gameplay;
    const catalog = next.catalog;
    if (!gameplay || !catalog || next.screen === 'title' || next.screen === 'create') return 'explore';
    const nowMs = next.gameTimeMs;
    const heroX = gameplay.movement.position.x;
    let enraged = false;
    for (const monster of gameplay.monsters) {
      if (monster.mode === 'dead' || monster.hp <= 0) continue;
      if (ENGAGED_MONSTER_MODES.has(monster.mode) && Math.abs(monster.movement.position.x - heroX) < COMBAT_MUSIC_RANGE_PX) {
        this.lastThreatAtMs = nowMs;
      }
      if (bossEnraged(monster, catalog)) enraged = true;
    }
    const before = previous.gameplay;
    if (before && gameplay.saveData.player.hp < before.saveData.player.hp) this.lastThreatAtMs = nowMs;
    // A new session/game restarts the clock.
    if (this.lastThreatAtMs > nowMs) this.lastThreatAtMs = -Infinity;
    if (enraged) return 'phase2';
    return nowMs - this.lastThreatAtMs < COMBAT_MUSIC_HOLD_MS ? 'combat' : 'explore';
  }

  private playStateTransitionAudio(previous: GameAppState, next: GameAppState): void {
    const newPanels = next.panels.filter((panel) => !previous.panels.includes(panel));
    if (newPanels.length > 0) this.playAudioOnce(`panel:${newPanels.join(',')}:${next.gameTimeMs}:${++this.audioEventSequence}`, 'panel-open');

    const gameplay = next.gameplay;
    if (!gameplay) return;
    const before = previous.gameplay;

    const previousAttackIds = new Set(before?.combat.attacks.map(({ id }) => id) ?? []);
    for (const attack of gameplay.combat.attacks) {
      if (attack.sourceId === gameplay.playerEntityId && !previousAttackIds.has(attack.id)) {
        this.playAudioOnce(`attack:${attack.id}`, ATTACK_SOUND_BY_SKILL[attack.skillId] ?? 'attack');
      }
    }

    const previousEffectIds = new Set(before?.effects.map(({ id }) => id) ?? []);
    for (const effect of gameplay.effects) {
      if (previousEffectIds.has(effect.id)) continue;
      const key = effect.kind === 'hit' ? (effect.critical ? 'crit-hit' : 'hit')
        : effect.kind === 'pickup' ? 'pickup'
          : effect.kind === 'levelup' ? 'levelup'
            : effect.kind === 'buff' ? 'guard'
              : null;
      if (key) this.playAudioOnce(`visual:${effect.id}`, key);
    }

    const previousTelegraphIds = new Set(before?.telegraphs.map(({ id }) => id) ?? []);
    for (const telegraph of gameplay.telegraphs) {
      if (!previousTelegraphIds.has(telegraph.id)) this.playAudioOnce(`telegraph:${telegraph.id}`, 'telegraph');
    }

    const monsterStates = new Map<EntityId, { dead: boolean; enraged: boolean; phaseTransitionStartedAtMs: number | null }>();
    for (const monster of gameplay.monsters) {
      const phaseTransitionStartedAtMs = monster.monsterId === 'ruins-bell-keeper'
        ? monster.bellCycle?.transitionStartedAtMs ?? null
        : null;
      const now = {
        dead: monster.mode === 'dead',
        enraged: next.catalog ? bossEnraged(monster, next.catalog) : false,
        phaseTransitionStartedAtMs,
      };
      const was = this.audioMonsterStates.get(monster.id);
      if (was && !was.dead && now.dead) this.playAudioOnce(`monster-die:${monster.id}`, 'monster-die');
      if (monster.monsterId === 'ruins-bell-keeper') {
        if (was && !was.dead && now.phaseTransitionStartedAtMs !== null
          && now.phaseTransitionStartedAtMs !== was.phaseTransitionStartedAtMs) {
          this.playAudioOnce(`boss-phase:${monster.id}:${now.phaseTransitionStartedAtMs}`, 'boss-phase');
        }
      } else if (was && !was.enraged && now.enraged) {
        this.playAudioOnce(`boss-phase:${monster.id}`, 'boss-phase');
      }
      monsterStates.set(monster.id, now);
    }
    this.audioMonsterStates = monsterStates;

    if (!before) return;
    const previousSteleQuest = before.saveData.quests.q17;
    const currentSteleQuest = gameplay.saveData.quests.q17;
    if (previous.screen === 'playing' && next.screen === 'playing'
      && gameplay.playerEntityId === before.playerEntityId
      && before.pendingTransition === null && gameplay.pendingTransition === null
      && before.saveData.location.mapId === 'ruins-echo-gallery'
      && gameplay.saveData.location.mapId === 'ruins-echo-gallery'
      && previousSteleQuest?.status === 'active' && currentSteleQuest?.status === 'active') {
      for (const targetId of TUNABLE_STELE_IDS) {
        if (before.interaction?.npcId !== targetId || gameplay.interaction?.npcId !== targetId) continue;
        if ((previousSteleQuest.counters[targetId] ?? 0) === 0
          && (currentSteleQuest.counters[targetId] ?? 0) === 1) {
          this.playAudioOnce(`stele-tune:${gameplay.playerEntityId}:${targetId}`, 'stele-tune');
        }
      }
    }
    if (!before.interaction && gameplay.interaction) {
      this.playAudioOnce(`dialogue:${gameplay.interaction.npcId}:${next.gameTimeMs}`, 'dialogue');
    }
    const previousPlayer = before.saveData.player;
    const player = gameplay.saveData.player;
    if (player.hp < previousPlayer.hp) {
      this.playAudioOnce(`hurt:${gameplay.playerEntityId}:${next.gameTimeMs}:${player.hp}`, 'hurt');
    }
    // The jump sound was loaded but never played. A take-off is leaving the ground or a ladder upwards;
    // knockback also launches the hero, so ignore frames where the hero was just hit.
    if (before.movement.mode !== 'airborne' && gameplay.movement.mode === 'airborne'
      && gameplay.movement.velocity.y < 0 && player.hp >= previousPlayer.hp) {
      this.playAudioOnce(`jump:${gameplay.playerEntityId}:${next.gameTimeMs}`, 'jump');
    }
    if (previousPlayer.hp > 0 && player.hp <= 0) {
      this.playAudioOnce(`death:${gameplay.playerEntityId}:${gameplay.deathAtMs ?? next.gameTimeMs}`, 'death');
    }
    if (player.level > previousPlayer.level
      && !gameplay.effects.some(({ id, kind }) => kind === 'levelup' && !previousEffectIds.has(id))) {
      this.playAudioOnce(`levelup:${gameplay.playerEntityId}:${next.gameTimeMs}:${player.level}`, 'levelup');
    }
    if (JSON.stringify(player.equipment) !== JSON.stringify(previousPlayer.equipment)) {
      this.playAudioOnce(`equip:${gameplay.playerEntityId}:${next.gameTimeMs}:${++this.audioEventSequence}`, 'equip');
    }
    if (gameplay.potionReadyAtMs > before.potionReadyAtMs) {
      this.playAudioOnce(`potion:${gameplay.playerEntityId}:${gameplay.potionReadyAtMs}`, 'potion');
    }

    const previousQuests = before.saveData.quests;
    for (const [questId, quest] of Object.entries(gameplay.saveData.quests)) {
      const oldStatus = previousQuests[questId]?.status;
      if ((oldStatus === undefined && quest.status === 'active')
        || (oldStatus === 'active' && quest.status === 'claimed')) {
        this.playAudioOnce(`quest:${questId}:${quest.status}:${next.gameTimeMs}`, 'quest');
      }
    }

    const fromMap = before.saveData.location.mapId;
    const toMap = gameplay.saveData.location.mapId;
    if (fromMap !== toMap && before.pendingTransition?.after === 'travel') {
      this.playAudioOnce(`portal:${fromMap}:${toMap}:${next.gameTimeMs}`, 'portal');
    }
    if (!before.bossResult && gameplay.bossResult) {
      if (gameplay.saveData.location.mapId === 'ruins-bell-sanctum') {
        const bellKeeperId = gameplay.monsters.find(({ monsterId, mode }) => monsterId === 'ruins-bell-keeper' && mode === 'dead')?.id;
        this.playAudioOnce(`oath-bell-restored:${bellKeeperId ?? `${gameplay.playerEntityId}:${next.gameTimeMs}`}`, 'oath-bell-restored');
      } else {
        this.playAudioOnce(`boss-win:${gameplay.playerEntityId}:${next.gameTimeMs}`, 'boss-win');
      }
    }
  }

  private playAudioOnce(eventId: string, key: string): void {
    const controller = this.audioController;
    if (!controller || this.audioEventIds.has(eventId)) return;
    this.audioEventIds.add(eventId);
    this.audioEventOrder.push(eventId);
    if (this.audioEventOrder.length > MAX_REMEMBERED_AUDIO_EVENT_IDS) {
      const expiredId = this.audioEventOrder.shift();
      if (expiredId) this.audioEventIds.delete(expiredId);
    }
    if (this.audioUnlockInFlight) {
      this.pendingAudioEvents.push(key);
      return;
    }
    this.playAudioKey(key);
  }

  private flushPendingAudioEvents(): void {
    if (!this.audioController || this.audioUnlockInFlight) return;
    for (const key of this.pendingAudioEvents.splice(0)) this.playAudioKey(key);
  }

  private playAudioKey(key: string): void {
    const controller = this.audioController;
    if (!controller) return;
    try { controller.playSfx(key); } catch { /* A dropped sound must never alter gameplay. */ }
  }

  private keyboardBindingsFingerprint = '{}';
}

function audioSettingsFingerprint(settings: Settings): string {
  return `${settings.masterVolume}:${settings.musicVolume}:${settings.sfxVolume}:${settings.muted}`;
}

function selectedMusicKey(state: GameAppState): string | null {
  if (state.screen === 'title' || state.screen === 'create') return TITLE_MUSIC_KEY;
  const gameplay = state.gameplay;
  if (!gameplay || !state.catalog) return null;
  return state.catalog.world.maps[gameplay.saveData.location.mapId]?.musicKey ?? null;
}

/** Ambience follows the map's visual theme; the title screen is music only. undefined = no change. */
function selectedAmbienceKey(state: GameAppState): string | null | undefined {
  if (state.screen === 'title' || state.screen === 'create') return null;
  const gameplay = state.gameplay;
  if (!gameplay || !state.catalog) return undefined;
  return state.catalog.world.maps[gameplay.saveData.location.mapId]?.themeKey ?? null;
}

function bossEnraged(monster: MonsterState, catalog: ContentCatalog): boolean {
  if (!BOSS_MONSTER_IDS.has(monster.monsterId) || monster.mode === 'dead' || monster.hp <= 0) return false;
  if (monster.monsterId === 'ruins-bell-keeper') return monster.phase === 2;
  const maxHp = catalog.rules.monsters[monster.monsterId]?.maxHp ?? Infinity;
  return monster.phase === 2 || monster.hp <= maxHp / 2;
}

function getSavedKeyBindings(bindings: Record<string, string> | undefined): KeyBindings {
  const result: KeyBindings = {};
  if (!bindings) return result;
  for (const action of Object.keys(DEFAULT_KEY_BINDINGS) as GameAction[]) {
    const code = bindings[action];
    if (typeof code === 'string') result[action] = code;
  }
  return result;
}

function saveFingerprint(data: SaveData): string {
  return JSON.stringify(data);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
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
