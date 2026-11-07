import type { Id, SkillDef } from '../../contracts/index.js';
import { advancedSkills } from './advanced-skills.js';

const bowSkill = (id: Id, name: string, changes: Partial<SkillDef>): SkillDef => ({
  id, name, kind: 'attack', maxRank: 10, requiredLevel: 10, requiredJob: 'archer',
  mpCost: 0, cooldownMs: 650, windupMs: 180, activeMs: 1, recoveryMs: 469,
  reach: 300, height: 4, targets: 1, multiplierBase: 1, multiplierPerRank: 0,
  durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  projectile: { speed: 750, radius: 3, lifetimeMs: 1000, shotOffsetsMs: [0] },
  ...changes,
});

export const skills: Record<Id, SkillDef> = {
  ...advancedSkills,
  'dagger-basic': bowSkill('dagger-basic', '短刃斬', {
    requiredJob: 'any', requiredLevel: 1, maxRank: 1, cooldownMs: 420, windupMs: 110, activeMs: 70, recoveryMs: 240,
    reach: 48, height: 54, multiplierBase: 0.78, projectile: undefined,
  }),
  'rogue-double-stab': bowSkill('rogue-double-stab', '雙刃連刺', {
    requiredJob: 'rogue', mpCost: 6, cooldownMs: 900, windupMs: 130, activeMs: 250, recoveryMs: 270,
    reach: 58, height: 58, multiplierBase: 0.85, multiplierPerRank: 0.04, projectile: undefined,
    meleeWindows: [{ offsetMs: 0, activeMs: 70 }, { offsetMs: 180, activeMs: 70 }],
  }),
  'rogue-shadow-lunge': bowSkill('rogue-shadow-lunge', '影步突刺', {
    requiredJob: 'rogue', requiredLevel: 12, mpCost: 10, cooldownMs: 3200, windupMs: 160, activeMs: 80, recoveryMs: 360,
    reach: 62, height: 58, targets: 2, multiplierBase: 1.2, multiplierPerRank: 0.06, projectile: undefined,
  }),
  'rogue-smoke': bowSkill('rogue-smoke', '煙幕', {
    kind: 'zone', requiredJob: 'rogue', requiredLevel: 14, mpCost: 12, cooldownMs: 6500, windupMs: 180, activeMs: 0, recoveryMs: 300,
    reach: 105, height: 80, targets: 0, multiplierBase: 0, durationMs: 2200, projectile: undefined,
  }),
  'rogue-dagger-mastery': bowSkill('rogue-dagger-mastery', '短刃精通', {
    kind: 'passive', requiredJob: 'rogue', cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
    reach: 0, height: 0, targets: 0, multiplierBase: 0, damagePerRank: 0.015, projectile: undefined,
  }),
  'rogue-combo-rhythm': bowSkill('rogue-combo-rhythm', '連擊節奏', {
    kind: 'passive', requiredJob: 'rogue', cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
    reach: 0, height: 0, targets: 0, multiplierBase: 0, damagePerRank: 0.015, projectile: undefined,
  }),
  'wand-basic': bowSkill('wand-basic', '魔杖彈', {
    requiredJob: 'any', requiredLevel: 1, maxRank: 1, cooldownMs: 750, windupMs: 240, recoveryMs: 509,
    reach: 220, multiplierBase: 0.65, projectile: { speed: 560, radius: 5, lifetimeMs: 1000, shotOffsetsMs: [0] },
  }),
  'mage-mana-bolt': bowSkill('mage-mana-bolt', '魔力彈', {
    requiredJob: 'mage', mpCost: 8, cooldownMs: 1000, windupMs: 300, recoveryMs: 699,
    reach: 320, multiplierBase: 1.45, multiplierPerRank: 0.09,
    projectile: { speed: 620, radius: 6, lifetimeMs: 1000, shotOffsetsMs: [0] },
  }),
  'mage-frost-ring': bowSkill('mage-frost-ring', '冰霜環', {
    requiredJob: 'mage', requiredLevel: 12, mpCost: 14, cooldownMs: 3500, windupMs: 350, activeMs: 100, recoveryMs: 350,
    reach: 125, height: 125, targets: 5, multiplierBase: 0.95, multiplierPerRank: 0.06, projectile: undefined,
  }),
  'mage-blink': bowSkill('mage-blink', '閃現', {
    kind: 'movement', requiredJob: 'mage', requiredLevel: 14, mpCost: 12, cooldownMs: 5000, cooldownPerRank: 200,
    windupMs: 100, activeMs: 0, recoveryMs: 250, reach: 120, height: 0, targets: 0, multiplierBase: 0, projectile: undefined,
  }),
  'mage-mana-affinity': bowSkill('mage-mana-affinity', '魔力親和', {
    kind: 'passive', requiredJob: 'mage', cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
    reach: 0, height: 0, targets: 0, multiplierBase: 0, regenPerRank: 1, projectile: undefined,
  }),
  'mage-rune-study': bowSkill('mage-rune-study', '符文精研', {
    kind: 'passive', requiredJob: 'mage', cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
    reach: 0, height: 0, targets: 0, multiplierBase: 0, damagePerRank: 0.02, projectile: undefined,
  }),
  'bow-basic': bowSkill('bow-basic', '射箭', { maxRank: 1, requiredLevel: 1, requiredJob: 'any' }),
  'archer-double-shot': bowSkill('archer-double-shot', '二連射', {
    projectile: { speed: 750, radius: 3, lifetimeMs: 1000, shotOffsetsMs: [0, 120] },
    mpCost: 6, cooldownMs: 850, recoveryMs: 519, reach: 320, multiplierBase: 0.75, multiplierPerRank: 0.035,
  }),
  'archer-piercing-shot': bowSkill('archer-piercing-shot', '穿透箭', {
    requiredLevel: 12, mpCost: 10, cooldownMs: 1000, windupMs: 260, recoveryMs: 589,
    reach: 340, targets: 3, multiplierBase: 0.9, multiplierPerRank: 0.055,
  }),
  'archer-retreat-shot': bowSkill('archer-retreat-shot', '後撤射擊', {
    requiredLevel: 14, mpCost: 8, cooldownMs: 5000, windupMs: 120, recoveryMs: 329,
    multiplierBase: 0.7, multiplierPerRank: 0.02,
  }),
  'archer-bow-mastery': bowSkill('archer-bow-mastery', '弓術精通', {
    projectile: undefined,
    kind: 'passive', cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
    reach: 0, height: 0, targets: 0, multiplierBase: 0, damagePerRank: 0.01,
  }),
  'archer-steady-aim': bowSkill('archer-steady-aim', '穩定瞄準', {
    projectile: undefined,
    kind: 'passive', cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
    reach: 0, height: 0, targets: 0, multiplierBase: 0, damagePerRank: 0.02,
  }),
  basic: {
    id: 'basic', name: '普通攻擊', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'any',
    mpCost: 0, cooldownMs: 550, windupMs: 180, activeMs: 80, recoveryMs: 290,
    reach: 65, height: 60, targets: 1, multiplierBase: 1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'heavy-strike': {
    id: 'heavy-strike', name: '重斬', kind: 'attack', maxRank: 10, requiredLevel: 10, requiredJob: 'swordsman',
    mpCost: 6, cooldownMs: 650, windupMs: 220, activeMs: 80, recoveryMs: 350,
    reach: 85, height: 70, targets: 1, multiplierBase: 1.3, multiplierPerRank: 0.08,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: 'vfx:heavy-strike',
  },
  sweep: {
    id: 'sweep', name: '橫掃', kind: 'attack', maxRank: 10, requiredLevel: 12, requiredJob: 'swordsman',
    mpCost: 10, cooldownMs: 850, windupMs: 260, activeMs: 100, recoveryMs: 490,
    reach: 110, height: 80, targets: 3, multiplierBase: 0.8, multiplierPerRank: 0.06,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: 'vfx:sweep',
  },
  'iron-guard': {
    id: 'iron-guard', name: '堅韌守護', kind: 'buff', maxRank: 10, requiredLevel: 14, requiredJob: 'swordsman',
    mpCost: 12, cooldownMs: 1000, windupMs: 200, activeMs: 0, recoveryMs: 200,
    reach: 0, height: 0, targets: 1, multiplierBase: 0, multiplierPerRank: 0,
    durationMs: 30000, defensePerRank: 3, hpPerRank: 0, regenPerRank: 0, effectKey: 'vfx:guard',
  },
  vitality: {
    id: 'vitality', name: '生命鍛鍊', kind: 'passive', maxRank: 10, requiredLevel: 10, requiredJob: 'swordsman',
    mpCost: 0, cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
    reach: 0, height: 0, targets: 0, multiplierBase: 0, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 12, regenPerRank: 0, effectKey: null,
  },
  'rest-recovery': {
    id: 'rest-recovery', name: '休息恢復', kind: 'passive', maxRank: 10, requiredLevel: 10, requiredJob: 'swordsman',
    mpCost: 0, cooldownMs: 0, windupMs: 0, activeMs: 0, recoveryMs: 0,
    reach: 0, height: 0, targets: 0, multiplierBase: 0, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 2, effectKey: null,
  },
  'enemy-melee': {
    id: 'enemy-melee', name: '近身攻擊', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 1400, windupMs: 350, activeMs: 80, recoveryMs: 970,
    reach: 55, height: 70, targets: 1, multiplierBase: 1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'ruins-carapace-bite': {
    id: 'ruins-carapace-bite', name: '陶殼咬擊', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 1400, windupMs: 550, activeMs: 80, recoveryMs: 770,
    reach: 60, height: 70, targets: 1, multiplierBase: 1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'guardian-slam': {
    id: 'guardian-slam', name: '守衛重擊', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 900, activeMs: 100, recoveryMs: 800,
    reach: 180, height: 100, targets: 1, multiplierBase: 1.4, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'frost-crab-charge': {
    id: 'frost-crab-charge', name: '冰甲衝鋒', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 1950, windupMs: 750, activeMs: 250, recoveryMs: 750,
    reach: 220, height: 64, targets: 1, multiplierBase: 1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'sunwell-beetle-charge': {
    id: 'sunwell-beetle-charge', name: '日井突進', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 1950, windupMs: 750, activeMs: 250, recoveryMs: 750,
    reach: 220, height: 64, targets: 1, multiplierBase: 1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'sand-stinger': {
    id: 'sand-stinger', name: '砂棘尾刺', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 850, activeMs: 90, recoveryMs: 680,
    reach: 190, height: 44, targets: 1, multiplierBase: 1.05, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'guardian-wave': {
    id: 'guardian-wave', name: '礦脈震波', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 1100, activeMs: 100, recoveryMs: 900,
    reach: 420, height: 50, targets: 1, multiplierBase: 1.1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'frost-tusk-slam': {
    id: 'frost-tusk-slam', name: '獠牙下砸', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 900, activeMs: 100, recoveryMs: 850,
    reach: 190, height: 120, targets: 1, multiplierBase: 1.3, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'sunwell-sentinel-slam': {
    id: 'sunwell-sentinel-slam', name: '日井雙拳重擊', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 900, activeMs: 100, recoveryMs: 850,
    reach: 190, height: 120, targets: 1, multiplierBase: 1.3, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'low-tide-wave': {
    id: 'low-tide-wave', name: '低潮湧浪', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 1100, activeMs: 100, recoveryMs: 800,
    reach: 380, height: 30, targets: 1, multiplierBase: 1.15, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'ruins-puppet-slap': {
    id: 'ruins-puppet-slap', name: '斷弦拍擊', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 2200, windupMs: 1000, activeMs: 100, recoveryMs: 900,
    reach: 160, height: 100, targets: 1, multiplierBase: 1.1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'ruins-prowler-sweep': {
    id: 'ruins-prowler-sweep', name: '鈴影低掃', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 2400, windupMs: 1100, activeMs: 100, recoveryMs: 900,
    reach: 260, height: 30, targets: 1, multiplierBase: 1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'ruins-bell-slam': {
    id: 'ruins-bell-slam', name: '垂鐘重擊', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 900, activeMs: 100, recoveryMs: 1000,
    reach: 180, height: 120, targets: 1, multiplierBase: 1.25, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'ruins-bell-sweep': {
    id: 'ruins-bell-sweep', name: '低鳴橫掃', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 1200, activeMs: 100, recoveryMs: 1000,
    reach: 360, height: 30, targets: 1, multiplierBase: 1.05, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
};

export const playerLearnableIds = [
  'rogue-double-stab', 'rogue-shadow-lunge', 'rogue-smoke', 'rogue-dagger-mastery', 'rogue-combo-rhythm',
  'mage-mana-bolt', 'mage-frost-ring', 'mage-blink', 'mage-mana-affinity', 'mage-rune-study',
  'archer-double-shot', 'archer-piercing-shot', 'archer-retreat-shot', 'archer-bow-mastery', 'archer-steady-aim',
  'heavy-strike',
  'sweep',
  'iron-guard',
  'vitality',
  'rest-recovery',
] as const;

export const playerSkillIds = ['basic', 'bow-basic', 'wand-basic', 'dagger-basic', ...playerLearnableIds] as const;
