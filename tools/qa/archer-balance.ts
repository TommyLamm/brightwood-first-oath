/** Small deterministic equal-budget comparison, not a full encounter simulator. */
import { writeFileSync } from 'node:fs';
import { createPlayer, deriveStats } from '../../src/domain/progression/index.js';
import { rulesCatalog as rules } from '../../src/content/rules/index.js';
import { calculateDamage } from '../../src/domain/combat/damage.js';
import type { CombatActor, PlayerJob } from '../../src/contracts/index.js';

const rows=[];
for(const level of [10,20,30]) for(const job of ['swordsman','archer'] as PlayerJob[]) {
  const player=createPlayer('比較',rules,job);player.job=job;player.level=level;
  const ap=5*(level-1),main=Math.floor(ap*.8),secondary=ap-main;
  player[job==='archer'?'dex':'str']+=main; player[job==='archer'?'str':'dex']+=secondary;
  const sp=level-9,primary=Math.min(10,sp),area=Math.min(10,Math.max(0,sp-10)),passive=Math.max(0,sp-20);
  const ids=job==='archer'?['archer-double-shot','archer-piercing-shot','archer-bow-mastery']:['heavy-strike','sweep','vitality'];
  player.skillRanks=Object.fromEntries(ids.map((id,i)=>[id!,[primary,area,passive][i]!]).filter(([,rank])=>(rank as number)>0));
  const tier=level===10?'iron':level===20?'steel':'frost-tide';
  player.equipment.weapon=`${tier}-${job==='archer'?'bow':'sword'}`;
  player.equipment.body=level===10?'cloth-shirt':level===20?'leather-vest':'iron-mail';
  const stats=deriveStats(player,rules);
  const source:CombatActor={id:'p',position:{x:0,y:600},facing:1,hp:stats.maxHp,stats,faction:'player',body:{width:24,height:44},knockbackImmune:false,skillRanks:player.skillRanks};
  const target:CombatActor={...source,id:'t',faction:'enemy',stats:{...stats,defense:level===10?2:level===20?9:20}};
  const dps=(id:string,rank:number,targets=1)=>{
    const skill=rules.skills[id]!;
    let draw=0; const ordinary=calculateDamage(source,target,skill,rank,{next:()=>draw++===0?.5:.999}).damage;
    draw=0; const critical=calculateDamage(source,target,skill,rank,{next:()=>draw++===0?.5:0}).damage;
    const hits=skill.projectile?.shotOffsetsMs.length??1;
    const period=Math.max(skill.cooldownMs,skill.windupMs+skill.activeMs+skill.recoveryMs);
    return Math.round((ordinary*(1-stats.critChance)+critical*stats.critChance)*hits*targets*1000/period*10)/10;
  };
  rows.push({level,job,ap,sp,allocation:{main,secondary,primary,area,passive},...stats,
    basicDps:dps(job==='archer'?'bow-basic':'basic',1),singleSkillDps:dps(ids[0]!,primary),threeTargetDps:area?dps(ids[1]!,area,3):null,
    singleMpPerSecond:Math.round(rules.skills[ids[0]!]!.mpCost/(Math.max(rules.skills[ids[0]!]!.cooldownMs,rules.skills[ids[0]!]!.windupMs+rules.skills[ids[0]!]!.activeMs+rules.skills[ids[0]!]!.recoveryMs)/1000)*10)/10});
}
writeFileSync('output/archer-20261106/balance.json',JSON.stringify({method:'equal AP 80/20, SP primary/area/passive, equal weapon tier; expected critical damage; stationary cooldown limited; excludes flight/position/interruption/potion time',rows},null,2)+'\n');
console.table(rows.map(({allocation,...row})=>row));
