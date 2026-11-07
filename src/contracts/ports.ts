import type Phaser from 'phaser';
import type { AssetManifest } from './asset-manifest.js';
import type { HeroAnchorManifest } from './hero-anchors.js';
import type { CommandDraft, PanelId } from './commands.js';
import type {
  ContentCatalog,
  MapDef,
  QuestView,
  RulesCatalog,
  WorldCatalog,
} from './definitions.js';
import type {
  AttackInstance,
  EntityId,
  GameProfile,
  Id,
  MovementState,
  MonsterState,
  ProjectileState,
  SaveData,
  Settings,
  Telegraph,
  Vec2,
} from './types.js';

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type CloudMode = 'authenticated' | 'guest' | 'preview' | 'standalone';

export type CloudReady = {
  mode: CloudMode;
  progressAvailable: boolean;
  capabilities: string[];
};

export type CloudRecord = {
  data: unknown;
  revision: number;
  formatVersion: number;
  gameVersion: string;
  updatedAt: string;
};

export type CloudSaved = CloudRecord & { saved: true };

export type CloudSaveInput = {
  data: GameProfile;
  revision: number;
  formatVersion: 9;
  requestId: string;
};

export type CloudPort = {
  ready(): Promise<CloudReady>;
  loadProgress(): Promise<CloudRecord | null>;
  saveProgress(input: CloudSaveInput): Promise<CloudSaved | null>;
};

export type CloudError = Error & {
  code?: number;
  machineCode?: string;
};

export type SaveUpgradeRequired = {
  formatVersion: number;
  source: 'local' | 'cloud' | 'preview';
};

export type SaveStatus =
  | 'unavailable'
  | 'loading'
  | 'ready'
  | 'saving'
  | 'saved'
  | 'localSaved'
  | 'previewOnly'
  | 'loadError'
  | 'saveError'
  | 'upgradeRequired'
  | 'conflict'
  | 'localConflict'
  | 'authLost'
  | 'incompatible';

export type LoadOutcome = {
  mode: 'local' | 'cloud' | 'preview' | 'memory';
  status: SaveStatus;
  data: SaveData | null;
  /** Canonical format-6 data; data above is only the active character projection. */
  profile?: GameProfile | null;
  message?: string | null;
  legacyImportAvailable?: boolean;
  legacyImportMessage?: string | null;
  saveUpgrade?: SaveUpgradeRequired | null;
};

export type Persistence = {
  initialize(): Promise<LoadOutcome>;
  importLegacySave?(): Promise<LoadOutcome>;
  /** Explicitly approves upgrading a loaded format 1–5 save to the current write format. */
  confirmSaveUpgrade(): void;
  checkpoint(data: SaveData): void;
  checkpointProfile?(profile: GameProfile): void;
  getProfile?(): GameProfile | null;
  /** Flushes queued checkpoints; false means progress has not been confirmed. */
  flush?(): Promise<boolean>;
  retry(): Promise<void>;
  invalidate(): void;
  /** Moves an unreadable local save aside (kept under a backup key) so a new character can be created. */
  discardUnreadableLocalSave?(): boolean;
  dispose(): void;
};

export type SaveValidator = (
  raw: unknown,
  catalog: ContentCatalog,
) => import('./types.js').Result<SaveData>;

export type VisualEvent = {
  id: EntityId;
  /** 'exp' is the reward popup over a defeated monster; 'damage' is only damage the hero takes. */
  kind: 'damage' | 'levelup' | 'pickup' | 'hit' | 'buff' | 'exp';
  position: Vec2;
  value?: number;
  key?: Id;
  /** A DEX critical hit; the number is drawn larger and gold. */
  critical?: boolean;
  projectile?: boolean;
  magic?: boolean;
  atMs: number;
};

export type DropState = {
  id: EntityId;
  itemId: Id | null;
  quantity: number;
  coins: number;
  position: Vec2;
  expiresAtMs: number;
};

export type WorldSnapshot = {
  poisonedIds?: EntityId[];
  mapId: Id;
  nowMs: number;
  questViews: QuestView[];
  player: {
    id: EntityId;
    movement: MovementState;
    hp: number;
    maxHp: number;
    animationKey: string;
    visual: { weapon: Id | null; body: Id | null; hat: Id | null };
    /** Hit or respawn grace period; the renderer flickers the hero until then. */
    invulnerableUntilMs?: number;
    aimReady?: boolean;
    rhythmStacks?: number;
  };
  monsters: MonsterState[];
  drops: DropState[];
  npcs: MapDef['npcs'];
  attacks: AttackInstance[];
  projectiles?: ProjectileState[];
  smoke?: { position: Vec2; expiresAtMs: number };
  telegraphs: Telegraph[];
  effects: VisualEvent[];
};

export type WorldRenderer = {
  loadMap(map: MapDef, onProgress?: (progress: { completed: number; total: number }) => void): Promise<void>;
  render(snapshot: WorldSnapshot): void;
  resize(width: number, height: number): void;
  setBackgroundMotion?(enabled: boolean): void;
  dispose(): void;
};

export type UiSnapshot = {
  screen: 'title' | 'create' | 'loading' | 'playing' | 'paused' | 'dead' | 'result' | 'chapter' | 'error';
  error?: string;
  profile?: GameProfile | null;
  characterBusy?: boolean;
  aimReady?: boolean;
  saveData: SaveData | null;
  stats: import('./types.js').DerivedStats | null;
  questViews: QuestView[];
  catalog: ContentCatalog;
  interfaceManifest?: AssetManifest | null;
  /** False while the page/iframe has lost focus; explicit resume may still be required after return. */
  windowFocused?: boolean;
  /** App-only safety gate: returning focus does not resume the world until the player chooses Continue. */
  focusResumeRequired?: boolean;
  /** The target selected by the same range/priority rules as the interact command. */
  interactionHint?: {
    targetKey: string;
    kind: 'npc' | 'portal';
    label: string;
    blockedMessage: string | null;
  } | null;
  /** Contextual movement reminder; an interactable target takes priority in the HUD. */
  movementHint?: { targetKey: string; kind: 'climb'; attached: boolean }
    | { targetKey: string; kind: 'drop' } | null;
  /** The unexpired nearby drop selected by the actual pickup command. */
  pickupHint?: { targetKey: string; label: string; blockedMessage?: string | null } | null;
  /** Runtime-only location for the open terrain guide; never persisted. */
  playerPosition?: Vec2 | null;
  /** Device-local opt-in for repeating the keyboard basic attack while held. */
  holdBasicAttack?: boolean;
  backgroundMotion?: boolean;
  /** Runtime-only visual load gate; counts files, not transferred bytes. */
  mapVisualLoad?: { requestId: number; mapId: string; name: string; status: 'loading' | 'failed'; completed: number; total: number; message: string | null } | null;
  /** Read-only combat timing hints for the six quickbar slots. */
  combatUi?: { actionLockUntilMs: number; bufferedSkillId: Id | null };
  /** Actor sheets, used for NPC dialogue portraits. */
  actorManifest?: AssetManifest | null;
  saveStatus: SaveStatus;
  /** Human-readable detail for the current save status, when the app has one. */
  saveMessage?: string | null;
  /** Old-format save details requiring an explicit choice before the first format 5 write. */
  saveUpgrade?: SaveUpgradeRequired | null;
  /** A validated, local legacy save can be copied only after explicit player choice. */
  legacyImportAvailable?: boolean;
  legacyImportMessage?: string | null;
  toast: string | null;
  panels: PanelId[];
  interaction: { npcId: Id; dialogue: string[] } | null;
  canReturnTown: boolean;
  nowMs: number;
  skillReadyAtMs: Record<Id, number>;
  potionReadyAtMs: number;
  /** Game time when 堅韌守護's defence bonus wears off; 0 or past means inactive. */
  guardUntilMs?: number;
  activeGuard?: { defenseBonus: number; remainingSeconds: number } | null;
};

export type UiController = {
  render(view: UiSnapshot): void;
  setPanel(panel: PanelId | null): void;
  isInputCaptured(): boolean;
  dispose(): void;
};

/** explore = base layer only; combat adds the combat layer; phase2 (boss) adds every layer. */
export type MusicIntensity = 'explore' | 'combat' | 'phase2';

export type AudioController = {
  unlock(): Promise<void>;
  /**
   * Selects a music set (a map's `musicKey`); its layers start together and crossfade in.
   * null holds whatever is playing and starts nothing new (e.g. while a save loads).
   */
  setMusic(key: string | null): Promise<void>;
  setMusicIntensity(level: MusicIntensity): void;
  /** Procedural ambience for a map theme (`MapDef.themeKey`), or null for none. */
  setAmbience(themeKey: string | null): void;
  playSfx(key: string): void;
  setSettings(settings: Settings): void;
  setPaused(paused: boolean): void;
  /** Lowers music and ambience (without pausing) while a menu such as settings is open. */
  setDucked(ducked: boolean): void;
  dispose(): void;
};

export type WorldRendererFactory = (
  scene: Phaser.Scene,
  assetManifests: AssetManifest[],
  catalog: ContentCatalog,
  heroAnchors?: HeroAnchorManifest,
) => WorldRenderer;

export type UiFactory = (
  root: HTMLElement,
  dispatch: (command: CommandDraft) => void,
) => UiController;

export type AudioFactory = (
  manifest: AssetManifest,
  settings: Settings,
) => AudioController;

export type RulesValidator = (catalog: RulesCatalog) => import('./types.js').Result<RulesCatalog>;

export type WorldValidator = (
  world: WorldCatalog,
  rules: RulesCatalog,
) => import('./types.js').Result<WorldCatalog>;
