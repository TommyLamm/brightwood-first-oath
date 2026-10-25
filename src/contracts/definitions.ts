import type {
  BagStack,
  Id,
  MovementConfig,
  QuestState,
  Reward,
} from './types.js';

export type ItemKind = 'weapon' | 'body' | 'hat' | 'consumable' | 'material' | 'quest';

export type ItemDef = {
  id: Id;
  name: string;
  kind: ItemKind;
  slot: 'weapon' | 'body' | 'hat' | null;
  stackLimit: number;
  minLevel: number;
  attack: number;
  defense: number;
  hpBonus: number;
  restoreHp: number;
  restoreMp: number;
  buyPrice: number;
  sellPrice: number;
  iconKey: string;
  visualKey: string | null;
};

export type SkillKind = 'attack' | 'buff' | 'passive';
export type SkillJob = 'any' | 'swordsman' | 'enemy';

export type SkillDef = {
  id: Id;
  name: string;
  kind: SkillKind;
  maxRank: number;
  requiredLevel: number;
  requiredJob: SkillJob;
  mpCost: number;
  cooldownMs: number;
  windupMs: number;
  activeMs: number;
  recoveryMs: number;
  reach: number;
  height: number;
  targets: number;
  multiplierBase: number;
  multiplierPerRank: number;
  durationMs: number;
  defensePerRank: number;
  hpPerRank: number;
  regenPerRank: number;
  effectKey: string | null;
};

export type MonsterDrop = {
  itemId: Id;
  chance: number;
  min: number;
  max: number;
};

export type MonsterDef = {
  id: Id;
  name: string;
  level: number;
  maxHp: number;
  attack: number;
  defense: number;
  exp: number;
  coins: number;
  speed: number;
  width: number;
  height: number;
  aggroRange: number;
  attackRange: number;
  attackWindupMs: number;
  attackCooldownMs: number;
  respawnMs: number;
  actorKey: string;
  drops: MonsterDrop[];
};

export type Foothold = {
  id: Id;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dropThrough: boolean;
};

export type Ladder = {
  id: Id;
  x: number;
  topY: number;
  bottomY: number;
};

export type Portal = {
  id: Id;
  x: number;
  y: number;
  targetMapId: Id;
  targetSpawnId: Id;
  requiredQuestId: Id | null;
  minLevel: number;
};

export type SpawnPoint = {
  id: Id;
  x: number;
  y: number;
};

export type Wall = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NpcPlacement = {
  npcId: Id;
  x: number;
  y: number;
};

export type MonsterSpawn = {
  spawnId: Id;
  monsterId: Id;
  x: number;
  y: number;
  roamLeft: number;
  roamRight: number;
};

export type MapDef = {
  id: Id;
  name: string;
  width: number;
  height: number;
  themeKey: string;
  musicKey: string;
  safe: boolean;
  spawns: SpawnPoint[];
  footholds: Foothold[];
  ladders: Ladder[];
  walls: Wall[];
  portals: Portal[];
  npcs: NpcPlacement[];
  monsters: MonsterSpawn[];
  boss: boolean;
};

export type NpcRole = 'mentor' | 'merchant' | 'healer' | 'scout' | 'keeper';

export type NpcDef = {
  id: Id;
  name: string;
  role: NpcRole;
  dialogueId: Id;
  actorKey: string;
};

export type QuestObjectiveType = 'reach' | 'kill' | 'collect' | 'equip' | 'inspect';

export type QuestObjective = {
  type: QuestObjectiveType;
  targetId: Id;
  count: number;
};

export type QuestDef = {
  id: Id;
  name: string;
  giverNpcId: Id;
  turnInNpcId: Id;
  prerequisiteIds: Id[];
  minLevel: number;
  objectives: QuestObjective[];
  consumeItems: BagStack[];
  reward: Reward;
  summary: string;
  acceptText: string;
  progressText: string;
  completeText: string;
};

export type DialogueLine = {
  speaker: string;
  text: string;
};

export type RulesCatalog = {
  items: Record<Id, ItemDef>;
  skills: Record<Id, SkillDef>;
  monsters: Record<Id, MonsterDef>;
  progression: {
    maxLevel: number;
    expToNext: number[];
  };
  movement: MovementConfig;
};

export type WorldCatalog = {
  maps: Record<Id, MapDef>;
  npcs: Record<Id, NpcDef>;
  quests: Record<Id, QuestDef>;
  dialogues: Record<Id, DialogueLine[]>;
};

export type ContentCatalog = {
  rules: RulesCatalog;
  world: WorldCatalog;
};

export type QuestView = {
  questId: Id;
  title: string;
  status: 'locked' | 'available' | 'active' | 'ready' | 'claimed';
  objectives: {
    type: QuestObjective['type'];
    targetId: Id;
    current: number;
    required: number;
  }[];
  reward: Reward;
};

export type QuestClaimPlan = {
  nextQuests: Record<Id, QuestState>;
  removeItems: BagStack[];
  reward: Reward;
};
