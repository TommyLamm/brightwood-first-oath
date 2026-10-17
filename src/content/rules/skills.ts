import type { Id, SkillDef } from '../../contracts/index.js';

export const skills: Record<Id, SkillDef> = {
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
  'guardian-slam': {
    id: 'guardian-slam', name: '守衛重擊', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 900, activeMs: 100, recoveryMs: 800,
    reach: 180, height: 100, targets: 1, multiplierBase: 1.4, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
  'guardian-wave': {
    id: 'guardian-wave', name: '礦脈震波', kind: 'attack', maxRank: 1, requiredLevel: 1, requiredJob: 'enemy',
    mpCost: 0, cooldownMs: 0, windupMs: 1100, activeMs: 100, recoveryMs: 900,
    reach: 420, height: 50, targets: 1, multiplierBase: 1.1, multiplierPerRank: 0,
    durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null,
  },
};

export const playerLearnableIds = [
  'heavy-strike',
  'sweep',
  'iron-guard',
  'vitality',
  'rest-recovery',
] as const;

export const playerSkillIds = ['basic', ...playerLearnableIds] as const;
