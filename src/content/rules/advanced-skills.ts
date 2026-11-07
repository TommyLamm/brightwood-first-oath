import type { SkillDef } from '../../contracts/index.js';

const skill = (id: string, name: string, changes: Partial<SkillDef>): SkillDef => ({
  id, name, kind: 'attack', maxRank: 1, requiredLevel: 20, requiredJob: 'swordsman',
  mpCost: 18, cooldownMs: 5000, windupMs: 300, activeMs: 100, recoveryMs: 500,
  reach: 100, height: 80, targets: 3, multiplierBase: 1.8, multiplierPerRank: 0,
  durationMs: 0, defensePerRank: 0, hpPerRank: 0, regenPerRank: 0, effectKey: null, ...changes,
});
export const advancedSkills: Record<string, SkillDef> = {
  'guardian-rally': skill('guardian-rally', '守護戰吼', { kind: 'buff', requiredSpecialization: 'guardian', mpCost: 20,
    cooldownMs: 12000, reach: 0, activeMs: 0, targets: 1, multiplierBase: 0, durationMs: 6000, defensePerRank: 20, effectKey: 'vfx:guard' }),
  'berserker-flurry': skill('berserker-flurry', '狂風三斬', { requiredSpecialization: 'berserker', mpCost: 22,
    cooldownMs: 4500, windupMs: 220, activeMs: 390, recoveryMs: 550, multiplierBase: .85,
    meleeWindows: [{ offsetMs: 0, activeMs: 70 }, { offsetMs: 160, activeMs: 70 }, { offsetMs: 320, activeMs: 70 }], effectKey: 'vfx:sweep' }),
  'marksman-snipe': skill('marksman-snipe', '貫星狙擊', { requiredJob: 'archer', requiredSpecialization: 'marksman',
    mpCost: 18, cooldownMs: 4000, windupMs: 550, activeMs: 1, recoveryMs: 549, reach: 440, height: 4, multiplierBase: 2.2,
    projectile: { speed: 900, radius: 3, lifetimeMs: 1000, shotOffsetsMs: [0] } }),
  'ranger-volley': skill('ranger-volley', '游擊連射', { requiredJob: 'archer', requiredSpecialization: 'ranger',
    mpCost: 18, cooldownMs: 5000, windupMs: 120, activeMs: 1, recoveryMs: 579, reach: 300, height: 4, targets: 1, multiplierBase: .8,
    projectile: { speed: 750, radius: 3, lifetimeMs: 1000, shotOffsetsMs: [0, 120, 240] } }),
  'elementalist-nova': skill('elementalist-nova', '極寒新星', { requiredJob: 'mage', requiredSpecialization: 'elementalist',
    mpCost: 24, cooldownMs: 6000, windupMs: 450, reach: 170, height: 170, targets: 6, multiplierBase: 1.65 }),
  'arcanist-siphon': skill('arcanist-siphon', '汲魔彈', { requiredJob: 'mage', requiredSpecialization: 'arcanist',
    mpCost: 14, cooldownMs: 5000, windupMs: 300, activeMs: 1, recoveryMs: 549, reach: 340, height: 6, targets: 2, multiplierBase: 1.5,
    projectile: { speed: 620, radius: 6, lifetimeMs: 1000, shotOffsetsMs: [0] } }),
  'shadowblade-venom': skill('shadowblade-venom', '淬毒突刺', { requiredJob: 'rogue', requiredSpecialization: 'shadowblade',
    mpCost: 16, cooldownMs: 4000, windupMs: 150, activeMs: 80, recoveryMs: 350, reach: 65, height: 58, targets: 1, multiplierBase: 1.5 }),
  'thrower-shuriken': skill('thrower-shuriken', '迴旋三鏢', { requiredJob: 'rogue', requiredSpecialization: 'thrower',
    mpCost: 16, cooldownMs: 3500, windupMs: 170, activeMs: 1, recoveryMs: 529, reach: 280, height: 5, targets: 1, multiplierBase: .8,
    projectile: { speed: 700, radius: 5, lifetimeMs: 1000, shotOffsetsMs: [0, 100, 200] } }),
};
