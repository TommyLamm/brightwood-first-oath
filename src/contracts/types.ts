export type Id = string;
export type EntityId = string;
export type Facing = -1 | 1;

export type Vec2 = {
  x: number;
  y: number;
};

export type ErrorCode =
  | 'INVALID'
  | 'LOCKED'
  | 'INSUFFICIENT_COINS'
  | 'BAG_FULL'
  | 'NOT_FOUND'
  | 'REQUIREMENT'
  | 'COOLDOWN'
  | 'NO_MP'
  | 'DEAD'
  | 'NOT_READY'
  | 'OUT_OF_RANGE';

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; code: ErrorCode; message: string };

export type RandomSource = {
  next(): number;
};

export type InputFrame = {
  moveX: -1 | 0 | 1;
  climbY: -1 | 0 | 1;
  jumpPressed: boolean;
  downHeld: boolean;
};

export type MovementState = {
  position: Vec2;
  velocity: Vec2;
  facing: Facing;
  mode: 'grounded' | 'airborne' | 'climbing' | 'dead';
  footholdId: Id | null;
  ladderId: Id | null;
  dropThroughUntilMs: number;
  knockbackUntilMs: number;
};

export type MovementConfig = {
  speed: number;
  climbSpeed: number;
  gravity: number;
  jumpVelocity: number;
  terminalVelocity: number;
  width: number;
  height: number;
};

export type BagStack = {
  itemId: Id;
  quantity: number;
};

export type EquipmentSlot = 'weapon' | 'body' | 'hat';

export type Equipment = {
  weapon: Id | null;
  body: Id | null;
  hat: Id | null;
};

export type PlayerProgress = {
  name: string;
  job: 'beginner' | 'swordsman';
  level: number;
  exp: number;
  str: number;
  dex: number;
  ap: number;
  sp: number;
  hp: number;
  mp: number;
  coins: number;
  skillRanks: Record<Id, number>;
  bag: BagStack[];
  equipment: Equipment;
};

export type QuestState = {
  status: 'active' | 'claimed';
  counters: Record<Id, number>;
};

export type Settings = {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  bindings: Record<string, string>;
};

export type SaveData = {
  player: PlayerProgress;
  quests: Record<Id, QuestState>;
  visitedMaps: Id[];
  location: { mapId: Id; spawnId: Id };
  flags: { bossDefeated: boolean; chapterComplete: boolean };
  settings: Settings;
};

export type SaveEnvelope = {
  formatVersion: 1;
  data: SaveData;
  savedAt: string;
};

export type DerivedStats = {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  /** 0–1 chance that a hit deals CRITICAL_MULTIPLIER damage. Monsters have 0. */
  critChance: number;
};

export type Reward = {
  exp: number;
  coins: number;
  items: BagStack[];
  minLevel?: number;
  job?: 'swordsman';
};

export type CombatActor = {
  id: EntityId;
  position: Vec2;
  facing: Facing;
  hp: number;
  stats: DerivedStats;
  faction: 'player' | 'enemy';
  body: { width: number; height: number };
  knockbackImmune: boolean;
  skillRanks: Record<Id, number>;
};

export type AttackRequest = {
  sourceId: EntityId;
  skillId: Id;
};

export type AttackInstance = {
  id: EntityId;
  sourceId: EntityId;
  skillId: Id;
  startedAtMs: number;
  facing: Facing;
  origin: Vec2;
  rank: number;
  hitIds: EntityId[];
};

export type CombatState = {
  attacks: AttackInstance[];
  cooldowns: Record<EntityId, Record<Id, number>>;
};

export type Hit = {
  attackId: EntityId;
  sourceId: EntityId;
  targetId: EntityId;
  damage: number;
  critical: boolean;
  knockback: Vec2;
};

export type CombatStep = {
  state: CombatState;
  hits: Hit[];
  started: AttackInstance[];
  rejected: { sourceId: EntityId; code: ErrorCode }[];
};

export type MonsterMode = 'idle' | 'patrol' | 'chase' | 'windup' | 'recovery' | 'dead';

export type MonsterState = {
  id: EntityId;
  monsterId: Id;
  spawnId: Id;
  movement: MovementState;
  hp: number;
  mode: MonsterMode;
  idleUntilMs: number;
  lastAttackAtMs: number;
  phase: 1 | 2;
  deadAtMs: number | null;
  width: number;
  height: number;
  pendingSkillId: Id | null;
  attackOrigin: Vec2 | null;
  attackFacing: Facing | null;
  deathReported: boolean;
};

export type Telegraph = {
  id: EntityId;
  sourceId: EntityId;
  kind: 'rect';
  rect: { x: number; y: number; width: number; height: number };
  resolveAtMs: number;
};

export type ActorStep = {
  monsters: MonsterState[];
  attackRequests: AttackRequest[];
  telegraphs: Telegraph[];
  deaths: EntityId[];
  respawnRequests: EntityId[];
};
