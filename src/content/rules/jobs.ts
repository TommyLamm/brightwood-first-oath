import type { Id, ItemDef, PlayerJob, PlayerProgress, RulesCatalog } from '../../contracts/index.js';
import { advancedSkill } from './specializations.js';

export type JobDefinition = {
  id: PlayerJob;
  name: string;
  mainStat: 'str' | 'dex' | 'int';
  secondaryStat: 'str' | 'dex' | 'int';
  starterWeapon: Id;
  basicSkill: Id;
  skillSlots: readonly [Id, Id, Id];
  learnableSkills: readonly Id[];
};

export const jobs: Record<PlayerJob, JobDefinition> = {
  rogue: {
    id: 'rogue', name: '盜賊', mainStat: 'dex', secondaryStat: 'str',
    starterWeapon: 'starter-dagger', basicSkill: 'dagger-basic',
    skillSlots: ['rogue-double-stab', 'rogue-shadow-lunge', 'rogue-smoke'],
    learnableSkills: ['rogue-double-stab', 'rogue-shadow-lunge', 'rogue-smoke', 'rogue-dagger-mastery', 'rogue-combo-rhythm'],
  },
  mage: {
    id: 'mage', name: '法師', mainStat: 'int', secondaryStat: 'dex',
    starterWeapon: 'starter-staff', basicSkill: 'wand-basic',
    skillSlots: ['mage-mana-bolt', 'mage-frost-ring', 'mage-blink'],
    learnableSkills: ['mage-mana-bolt', 'mage-frost-ring', 'mage-blink', 'mage-mana-affinity', 'mage-rune-study'],
  },
  swordsman: {
    id: 'swordsman', name: '劍士', mainStat: 'str', secondaryStat: 'dex',
    starterWeapon: 'starter-sword', basicSkill: 'basic',
    skillSlots: ['heavy-strike', 'sweep', 'iron-guard'],
    learnableSkills: ['heavy-strike', 'sweep', 'iron-guard', 'vitality', 'rest-recovery'],
  },
  archer: {
    id: 'archer', name: '弓箭手', mainStat: 'dex', secondaryStat: 'str',
    starterWeapon: 'starter-bow', basicSkill: 'bow-basic',
    skillSlots: ['archer-double-shot', 'archer-piercing-shot', 'archer-retreat-shot'],
    learnableSkills: ['archer-double-shot', 'archer-piercing-shot', 'archer-retreat-shot', 'archer-bow-mastery', 'archer-steady-aim'],
  },
};

export function isPlayerJob(value: unknown): value is PlayerJob {
  return value === 'swordsman' || value === 'archer' || value === 'mage' || value === 'rogue';
}

export function effectiveJob(player: Pick<PlayerProgress, 'job' | 'plannedJob'>): PlayerJob {
  return player.job === 'beginner' ? player.plannedJob ?? 'swordsman' : player.job;
}

export function jobName(job: PlayerProgress['job']): string {
  return job === 'beginner' ? '初心者' : jobs[job].name;
}

export function canEquipForJob(player: Pick<PlayerProgress, 'job' | 'plannedJob'>, item: ItemDef): boolean {
  // Existing weapons predate the optional restriction and belong to the sword route.
  return item.allowedJobs ? item.allowedJobs.includes(effectiveJob(player))
    : item.slot !== 'weapon' || effectiveJob(player) === 'swordsman';
}

export function resolveSkillSlot(player: Pick<PlayerProgress, 'job' | 'plannedJob'> & Partial<PlayerProgress>, slot: 0 | 1 | 2 | 3): Id {
  const job = jobs[effectiveJob(player)];
  if (slot === 3 && player.advancedSkillEquipped && player.level !== undefined) {
    const id = advancedSkill({ ...player, level: player.level });
    if (id) return id;
  }
  return slot === 0 ? job.basicSkill : job.skillSlots[slot - 1];
}

export function bowPassiveBonus(player: PlayerProgress, rules: RulesCatalog, skillId: string): number {
  const skill = rules.skills[skillId];
  if (player.job !== 'archer' || !skill || skill.requiredJob !== 'archer' || player.level < skill.requiredLevel) return 0;
  return Math.min(skill.maxRank, Math.max(0, player.skillRanks[skillId] ?? 0)) * (skill.damagePerRank ?? 0);
}

export function magePassiveRank(player: PlayerProgress, rules: RulesCatalog, skillId: string): number {
  const skill = rules.skills[skillId];
  if (player.job !== 'mage' || !skill || skill.requiredJob !== 'mage' || player.level < skill.requiredLevel) return 0;
  return Math.min(skill.maxRank, Math.max(0, player.skillRanks[skillId] ?? 0));
}

export function roguePassiveRank(player: PlayerProgress, rules: RulesCatalog, skillId: string): number {
  const skill = rules.skills[skillId];
  if (player.job !== 'rogue' || !rules.items[player.equipment.weapon ?? '']?.allowedJobs?.includes('rogue')
    || skill?.requiredJob !== 'rogue' || player.level < skill.requiredLevel) return 0;
  return Math.min(skill.maxRank, Math.max(0, player.skillRanks[skillId] ?? 0));
}
