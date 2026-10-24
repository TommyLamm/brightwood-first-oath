import type { Id } from '../../contracts/index.js';
import type { ItemDef } from '../../contracts/index.js';

export const items: Record<Id, ItemDef> = {
  'starter-sword': {
    id: 'starter-sword', name: '練習短劍', kind: 'weapon', slot: 'weapon', stackLimit: 1,
    minLevel: 1, attack: 4, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 40, sellPrice: 10, iconKey: 'item:starter-sword', visualKey: 'equip:starter-sword',
  },
  'iron-sword': {
    id: 'iron-sword', name: '鐵製長劍', kind: 'weapon', slot: 'weapon', stackLimit: 1,
    minLevel: 10, attack: 12, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 300, sellPrice: 75, iconKey: 'item:iron-sword', visualKey: 'equip:iron-sword',
  },
  'steel-sword': {
    id: 'steel-sword', name: '精鋼長劍', kind: 'weapon', slot: 'weapon', stackLimit: 1,
    minLevel: 20, attack: 24, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 900, sellPrice: 225, iconKey: 'item:steel-sword', visualKey: 'equip:steel-sword',
  },
  'guardian-sword': {
    id: 'guardian-sword', name: '守衛之刃', kind: 'weapon', slot: 'weapon', stackLimit: 1,
    minLevel: 28, attack: 38, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    // Only the guardian drops it (see monsters.guardian.drops); the shop does not sell the boss prize.
    buyPrice: 0, sellPrice: 450, iconKey: 'item:guardian-sword', visualKey: 'equip:guardian-sword',
  },
  'frost-tide-sword': {
    id: 'frost-tide-sword', name: '冰潮長鋒', kind: 'weapon', slot: 'weapon', stackLimit: 1,
    minLevel: 30, attack: 50, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    // Awarded once by the Frost Isles finale; the merchant cannot sell this reward.
    buyPrice: 0, sellPrice: 800, iconKey: 'item:frost-tide-sword', visualKey: 'equip:frost-tide-sword',
  },
  'cloth-shirt': {
    id: 'cloth-shirt', name: '旅行布衣', kind: 'body', slot: 'body', stackLimit: 1,
    minLevel: 1, attack: 0, defense: 2, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 40, sellPrice: 10, iconKey: 'item:cloth-shirt', visualKey: 'actor:hero-cloth',
  },
  'leather-vest': {
    id: 'leather-vest', name: '輕革甲', kind: 'body', slot: 'body', stackLimit: 1,
    minLevel: 10, attack: 0, defense: 7, hpBonus: 20, restoreHp: 0, restoreMp: 0,
    buyPrice: 250, sellPrice: 60, iconKey: 'item:leather-vest', visualKey: 'actor:hero-leather',
  },
  'iron-mail': {
    id: 'iron-mail', name: '鐵環甲', kind: 'body', slot: 'body', stackLimit: 1,
    minLevel: 20, attack: 0, defense: 14, hpBonus: 40, restoreHp: 0, restoreMp: 0,
    buyPrice: 700, sellPrice: 175, iconKey: 'item:iron-mail', visualKey: 'actor:hero-iron',
  },
  'cloth-cap': {
    id: 'cloth-cap', name: '布帽', kind: 'hat', slot: 'hat', stackLimit: 1,
    minLevel: 1, attack: 0, defense: 1, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 30, sellPrice: 7, iconKey: 'item:cloth-cap', visualKey: 'equip:cloth-cap',
  },
  'leather-cap': {
    id: 'leather-cap', name: '皮帽', kind: 'hat', slot: 'hat', stackLimit: 1,
    minLevel: 10, attack: 0, defense: 4, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 180, sellPrice: 45, iconKey: 'item:leather-cap', visualKey: 'equip:leather-cap',
  },
  'iron-helm': {
    id: 'iron-helm', name: '鐵盔', kind: 'hat', slot: 'hat', stackLimit: 1,
    minLevel: 20, attack: 0, defense: 8, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 500, sellPrice: 125, iconKey: 'item:iron-helm', visualKey: 'equip:iron-helm',
  },
  'small-red': {
    id: 'small-red', name: '小紅藥水', kind: 'consumable', slot: null, stackLimit: 99,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 80, restoreMp: 0,
    buyPrice: 20, sellPrice: 5, iconKey: 'item:small-red', visualKey: null,
  },
  'large-red': {
    id: 'large-red', name: '大紅藥水', kind: 'consumable', slot: null, stackLimit: 99,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 200, restoreMp: 0,
    buyPrice: 45, sellPrice: 11, iconKey: 'item:large-red', visualKey: null,
  },
  'small-blue': {
    id: 'small-blue', name: '小藍藥水', kind: 'consumable', slot: null, stackLimit: 99,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 40,
    buyPrice: 25, sellPrice: 6, iconKey: 'item:small-blue', visualKey: null,
  },
  'large-blue': {
    id: 'large-blue', name: '大藍藥水', kind: 'consumable', slot: null, stackLimit: 99,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 100,
    buyPrice: 55, sellPrice: 13, iconKey: 'item:large-blue', visualKey: null,
  },
  'snail-shell': {
    id: 'snail-shell', name: '蝸殼', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 3, iconKey: 'item:snail-shell', visualKey: null,
  },
  'slime-gel': {
    id: 'slime-gel', name: '黏液', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 5, iconKey: 'item:slime-gel', visualKey: null,
  },
  'mushroom-cap': {
    id: 'mushroom-cap', name: '菌蓋', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 8, iconKey: 'item:mushroom-cap', visualKey: null,
  },
  'boar-tusk': {
    id: 'boar-tusk', name: '野豬牙', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 12, iconKey: 'item:boar-tusk', visualKey: null,
  },
  'stone-chip': {
    id: 'stone-chip', name: '石片', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 18, iconKey: 'item:stone-chip', visualKey: null,
  },
  'metal-shard': {
    id: 'metal-shard', name: '金屬片', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 25, iconKey: 'item:metal-shard', visualKey: null,
  },
  'frost-fang': {
    id: 'frost-fang', name: '霜牙', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 35, iconKey: 'item:frost-fang', visualKey: null,
  },
  'forest-seed': {
    id: 'forest-seed', name: '林心種子', kind: 'quest', slot: null, stackLimit: 99,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 0, iconKey: 'item:forest-seed', visualKey: null,
  },
  'spore-sample': {
    id: 'spore-sample', name: '孢子樣本', kind: 'quest', slot: null, stackLimit: 99,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 0, iconKey: 'item:spore-sample', visualKey: null,
  },
  'ridge-emblem': {
    id: 'ridge-emblem', name: '山徑印記', kind: 'quest', slot: null, stackLimit: 99,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 0, iconKey: 'item:ridge-emblem', visualKey: null,
  },
  'ice-shell': {
    id: 'ice-shell', name: '冰殼', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 28, iconKey: 'item:ice-shell', visualKey: null,
  },
  'amber-scale': {
    id: 'amber-scale', name: '琥珀甲片', kind: 'material', slot: null, stackLimit: 999,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 42, iconKey: 'item:amber-scale', visualKey: null,
  },
  'guardian-core': {
    id: 'guardian-core', name: '守衛核心', kind: 'quest', slot: null, stackLimit: 99,
    minLevel: 1, attack: 0, defense: 0, hpBonus: 0, restoreHp: 0, restoreMp: 0,
    buyPrice: 0, sellPrice: 0, iconKey: 'item:guardian-core', visualKey: null,
  },
};
