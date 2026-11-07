import type { ItemDef, PlayerProgress, RulesCatalog } from '../contracts/index.js';
import { effectiveJob, jobs, jobName, resolveSkillSlot } from '../content/rules/jobs.js';
import { specializations } from '../content/rules/specializations.js';

export function playerClassLabel(player: Pick<PlayerProgress,'job'|'plannedJob'> & Partial<PlayerProgress>): string {
  return jobName(player.job) + (player.job === 'beginner' ? '・' + jobs[effectiveJob(player)].name + '訓練' : player.specialization ? '・' + specializations[player.specialization].name : '');
}
export function classPortrait(player: Pick<PlayerProgress,'job'|'plannedJob'>): string {
  if (effectiveJob(player) === 'rogue') return 'assets/interface/portrait-rogue-v1.png';
  if (effectiveJob(player) === 'mage') return 'assets/interface/portrait-mage-v1.png';
  return effectiveJob(player) === 'archer' ? 'assets/interface/portrait-archer-v1.png' : 'assets/interface/journal/hero-portrait-chibi.png';
}
export function classSkillNames(player: Pick<PlayerProgress,'job'|'plannedJob'> & Partial<PlayerProgress>, rules: RulesCatalog): string {
  return ([1,2,3] as const).map((slot) => rules.skills[resolveSkillSlot(player, slot)]?.name ?? '').join('、');
}
export function classActionLabel(player: Pick<PlayerProgress,'job'|'plannedJob'> & Partial<PlayerProgress>, rules: RulesCatalog, action: string): string | null {
  const index = ['attack','skill1','skill2','skill3'].indexOf(action);
  return index < 0 ? null : rules.skills[resolveSkillSlot(player,index as 0|1|2|3)]?.name ?? null;
}
export function equipmentJobLabel(item: ItemDef): string {
  const allowed = item.allowedJobs ?? (item.slot === 'weapon' ? ['swordsman'] as const : []);
  return allowed.length ? allowed.map((job) => jobs[job].name).join('／') + '專用' : '職業共用';
}
