import type { PlayerJob, PlayerProgress, SpecializationId } from '../../contracts/index.js';

export const specializations: Record<SpecializationId, { name: string; job: PlayerJob; skill: string; description: string }> = {
  guardian: { name: '劍衛', job: 'swordsman', skill: 'guardian-rally', description: '守護戰吼：恢復少量HP並獲得短時間防禦，適合穩定近戰。' },
  berserker: { name: '狂劍', job: 'swordsman', skill: 'berserker-flurry', description: '狂風三斬：長收招的三段近身範圍攻擊；受擊會中斷後續段落。' },
  marksman: { name: '神射', job: 'archer', skill: 'marksman-snipe', description: '貫星狙擊：長前搖、長射程的單發穿透箭，最多三個目標。' },
  ranger: { name: '遊俠', job: 'archer', skill: 'ranger-volley', description: '游擊連射：安全後撤並連射三箭，保持與敵人的距離。' },
  elementalist: { name: '元素', job: 'mage', skill: 'elementalist-nova', description: '極寒新星：自身周圍大範圍冰霜，普通怪緩速，首領不受控制。' },
  arcanist: { name: '秘法', job: 'mage', skill: 'arcanist-siphon', description: '汲魔彈：穿透魔彈命中實際怪物後回復MP，最多兩個目標。' },
  shadowblade: { name: '影刃', job: 'rogue', skill: 'shadowblade-venom', description: '淬毒突刺：命中施加四秒毒傷；近身從敵人背後命中提高25%傷害。' },
  thrower: { name: '飛鏢', job: 'rogue', skill: 'thrower-shuriken', description: '迴旋三鏢：以短刃為武器焦點連發三枚實體飛鏢，碰牆消失。' },
};

export function isSpecialization(value: unknown): value is SpecializationId {
  return typeof value === 'string' && Object.hasOwn(specializations, value);
}

export function advancedSkill(player: Pick<PlayerProgress, 'job' | 'level' | 'specialization'>): string | null {
  const branch = player.specialization && specializations[player.specialization];
  return branch && player.job === branch.job && player.level >= 20 ? branch.skill : null;
}

export function playerSkillRank(player: PlayerProgress, skillId: string): number {
  return advancedSkill(player) === skillId ? 1 : player.skillRanks[skillId] ?? 0;
}
