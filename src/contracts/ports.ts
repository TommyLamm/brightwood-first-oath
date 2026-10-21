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
  Id,
  MovementState,
  MonsterState,
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
  data: SaveData;
  revision: number;
  formatVersion: 1;
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
  | 'conflict'
  | 'authLost'
  | 'incompatible';

export type LoadOutcome = {
  mode: 'local' | 'cloud' | 'preview' | 'memory';
  status: SaveStatus;
  data: SaveData | null;
};

export type Persistence = {
  initialize(): Promise<LoadOutcome>;
  checkpoint(data: SaveData): void;
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
  kind: 'damage' | 'levelup' | 'pickup' | 'hit' | 'buff';
  position: Vec2;
  value?: number;
  key?: Id;
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
  };
  monsters: MonsterState[];
  drops: DropState[];
  npcs: MapDef['npcs'];
  attacks: AttackInstance[];
  telegraphs: Telegraph[];
  effects: VisualEvent[];
};

export type WorldRenderer = {
  loadMap(map: MapDef): Promise<void>;
  render(snapshot: WorldSnapshot): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

export type UiSnapshot = {
  screen: 'title' | 'create' | 'loading' | 'playing' | 'paused' | 'dead' | 'result' | 'chapter' | 'error';
  error?: string;
  saveData: SaveData | null;
  stats: import('./types.js').DerivedStats | null;
  questViews: QuestView[];
  catalog: ContentCatalog;
  interfaceManifest?: AssetManifest | null;
  saveStatus: SaveStatus;
  /** Human-readable detail for the current save status, when the app has one. */
  saveMessage?: string | null;
  toast: string | null;
  panels: PanelId[];
  interaction: { npcId: Id; dialogue: string[] } | null;
  canReturnTown: boolean;
  nowMs: number;
  skillReadyAtMs: Record<Id, number>;
  potionReadyAtMs: number;
  /** Game time when 堅韌守護's defence bonus wears off; 0 or past means inactive. */
  guardUntilMs?: number;
};

export type UiController = {
  render(view: UiSnapshot): void;
  setPanel(panel: PanelId | null): void;
  isInputCaptured(): boolean;
  dispose(): void;
};

export type AudioController = {
  unlock(): Promise<void>;
  setMusic(key: string): Promise<void>;
  playSfx(key: string): void;
  setSettings(settings: Settings): void;
  setPaused(paused: boolean): void;
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
