import type { Id, MonsterDef } from '../../contracts/index.js';

export const monsters: Record<Id, MonsterDef> = {
  snail: {
    id: 'snail', name: '苔殼蝸牛', level: 1, maxHp: 50, attack: 6, defense: 0, exp: 20, coins: 5,
    speed: 32, width: 28, height: 24, aggroRange: 300, attackRange: 55,
    attackWindupMs: 350, attackCooldownMs: 1400, respawnMs: 8000, actorKey: 'actor:snail',
    drops: [{ itemId: 'snail-shell', chance: 1, min: 1, max: 1 }, { itemId: 'small-red', chance: 0.2, min: 1, max: 1 }, { itemId: 'small-blue', chance: 0.1, min: 1, max: 1 }],
  },
  slime: {
    id: 'slime', name: '嫩芽史萊姆', level: 8, maxHp: 120, attack: 12, defense: 2, exp: 40, coins: 10,
    speed: 55, width: 32, height: 32, aggroRange: 300, attackRange: 55,
    attackWindupMs: 350, attackCooldownMs: 1400, respawnMs: 8000, actorKey: 'actor:slime',
    drops: [{ itemId: 'slime-gel', chance: 1, min: 1, max: 1 }, { itemId: 'small-red', chance: 0.2, min: 1, max: 1 }, { itemId: 'small-blue', chance: 0.1, min: 1, max: 1 }],
  },
  mushroom: {
    id: 'mushroom', name: '菌傘菇', level: 12, maxHp: 260, attack: 20, defense: 5, exp: 75, coins: 16,
    speed: 60, width: 32, height: 42, aggroRange: 300, attackRange: 55,
    attackWindupMs: 350, attackCooldownMs: 1400, respawnMs: 8000, actorKey: 'actor:mushroom',
    drops: [{ itemId: 'mushroom-cap', chance: 1, min: 1, max: 1 }, { itemId: 'small-red', chance: 0.2, min: 1, max: 1 }, { itemId: 'small-blue', chance: 0.1, min: 1, max: 1 }],
  },
  boar: {
    id: 'boar', name: '赤背野豬', level: 16, maxHp: 520, attack: 30, defense: 9, exp: 130, coins: 24,
    speed: 85, width: 48, height: 36, aggroRange: 300, attackRange: 55,
    attackWindupMs: 350, attackCooldownMs: 1400, respawnMs: 8000, actorKey: 'actor:boar',
    drops: [{ itemId: 'boar-tusk', chance: 1, min: 1, max: 1 }, { itemId: 'small-red', chance: 0.2, min: 1, max: 1 }, { itemId: 'small-blue', chance: 0.1, min: 1, max: 1 }, { itemId: 'steel-sword', chance: 0.03, min: 1, max: 1 }],
  },
  golem: {
    id: 'golem', name: '礦岩魔像', level: 21, maxHp: 1000, attack: 40, defense: 15, exp: 220, coins: 36,
    speed: 38, width: 50, height: 62, aggroRange: 300, attackRange: 55,
    attackWindupMs: 350, attackCooldownMs: 1400, respawnMs: 8000, actorKey: 'actor:golem',
    drops: [{ itemId: 'stone-chip', chance: 1, min: 1, max: 1 }, { itemId: 'small-red', chance: 0.2, min: 1, max: 1 }, { itemId: 'small-blue', chance: 0.1, min: 1, max: 1 }],
  },
  sentinel: {
    id: 'sentinel', name: '鏽甲哨兵', level: 25, maxHp: 1600, attack: 48, defense: 20, exp: 350, coins: 50,
    speed: 65, width: 40, height: 58, aggroRange: 300, attackRange: 55,
    attackWindupMs: 350, attackCooldownMs: 1400, respawnMs: 8000, actorKey: 'actor:sentinel',
    drops: [{ itemId: 'metal-shard', chance: 1, min: 1, max: 1 }, { itemId: 'small-red', chance: 0.2, min: 1, max: 1 }, { itemId: 'small-blue', chance: 0.1, min: 1, max: 1 }, { itemId: 'iron-mail', chance: 0.03, min: 1, max: 1 }],
  },
  'frost-wolf': {
    id: 'frost-wolf', name: '霜牙雪狼', level: 30, maxHp: 980, attack: 46, defense: 18, exp: 480, coins: 75,
    speed: 102, width: 50, height: 42, aggroRange: 320, attackRange: 60,
    attackWindupMs: 500, attackCooldownMs: 1450, respawnMs: 8000, actorKey: 'actor:frost-wolf',
    drops: [{ itemId: 'frost-fang', chance: 1, min: 1, max: 1 }, { itemId: 'small-red', chance: 0.15, min: 1, max: 1 }],
  },
  'frost-crab': {
    id: 'frost-crab', name: '冰甲蟹', level: 30, maxHp: 1250, attack: 50, defense: 24, exp: 530, coins: 85,
    speed: 58, width: 56, height: 36, aggroRange: 340, attackRange: 220,
    attackWindupMs: 750, attackCooldownMs: 1950, respawnMs: 8000, actorKey: 'actor:frost-crab',
    drops: [{ itemId: 'ice-shell', chance: 1, min: 1, max: 1 }, { itemId: 'small-red', chance: 0.18, min: 1, max: 1 }],
  },
  guardian: {
    // T00 requires collision dimensions; 08 leaves the boss dimensions unspecified.
    // These are project-specific logical dimensions, not an original-game measurement.
    id: 'guardian', name: '古礦守衛', level: 30, maxHp: 6000, attack: 55, defense: 28, exp: 2000, coins: 500,
    speed: 42, width: 56, height: 80, aggroRange: 300, attackRange: 55,
    attackWindupMs: 900, attackCooldownMs: 0, respawnMs: 0, actorKey: 'actor:guardian',
    drops: [{ itemId: 'guardian-sword', chance: 1, min: 1, max: 1 }],
  },
  'frost-tide-warden': {
    id: 'frost-tide-warden', name: '冰潮守望獸', level: 30, maxHp: 7600, attack: 62, defense: 30, exp: 2400, coins: 1600,
    speed: 44, width: 72, height: 72, aggroRange: 460, attackRange: 420,
    attackWindupMs: 900, attackCooldownMs: 900, respawnMs: 0, actorKey: 'actor:frost-tide-warden',
    drops: [],
  },
};

export const questDropByQuest: Readonly<Record<Id, { monsterId: Id; itemId: Id }>> = {
  q03: { monsterId: 'slime', itemId: 'forest-seed' },
  q04: { monsterId: 'mushroom', itemId: 'spore-sample' },
  q06: { monsterId: 'boar', itemId: 'ridge-emblem' },
  q08: { monsterId: 'guardian', itemId: 'guardian-core' },
};
