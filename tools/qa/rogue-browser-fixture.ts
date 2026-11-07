/** Isolated QA data. The normal character is backed up before adding a synthetic Lv14 slot. */
import { readFileSync, writeFileSync } from 'node:fs';
import { rulesCatalog as rules } from '../../src/content/rules/index.js';
import { worldCatalog as world } from '../../src/content/world/index.js';
import { jobs } from '../../src/content/rules/jobs.js';
import { classItemId, questForPlayer } from '../../src/content/world/class-quests.js';
import { deriveStats, createPlayer } from '../../src/domain/progression/index.js';
import { activeSaveData, prepareProfile, measureProfile } from '../../src/persistence/index.js';
import { characterFromSave } from '../../src/persistence/profile.js';
import { fullCharacterProfile } from '../../tests/fixtures/full-character-profile.js';

const dir='output/playwright/rogue-beta88-20261106-01';
const raw=readFileSync(dir+'/normal.storage.json','utf8');
const original=JSON.parse(raw) as {formatVersion:number;data:unknown};
const checked=prepareProfile(original.data,{rules,world},original.formatVersion);
if(!checked.ok)throw Error(checked.message);
const profile=checked.value.data,save=activeSaveData(profile);
if(!save)throw Error('Missing normal character');
save.player={...save.player,name:'合成Lv14盜賊短段',job:'rogue',plannedJob:'rogue',level:14,exp:0,str:4,dex:12,int:4,ap:65,sp:0,
  skillRanks:Object.fromEntries(jobs.rogue.learnableSkills.map(id=>[id,1]))};
const stats=deriveStats(save.player,rules);save.player.hp=stats.maxHp;save.player.mp=stats.maxMp;
save.location={mapId:'camp',spawnId:'start'};
const id='fixture-rogue-14';profile.slots[1]!.characterId=id;profile.characters[id]=characterFromSave(save,id);profile.activeCharacterId=id;
const validated=prepareProfile(profile,{rules,world},8);if(!validated.ok)throw Error(validated.message);
const fixture=JSON.stringify({formatVersion:8,data:validated.value.data,savedAt:new Date().toISOString()});
writeFileSync(dir+'/rogue14.fixture.json',fixture);
const installer=(data:string)=>`async (page) => { await page.evaluate(raw=>localStorage.setItem('brightwood-first-oath:save:v1',raw),${JSON.stringify(data)}); await page.reload(); }`;
writeFileSync(dir+'/install-fixture.js',installer(fixture));writeFileSync(dir+'/restore-normal.js',installer(raw));

const maximum=fullCharacterProfile();
for(const [i,route] of (['swordsman','archer','mage','rogue'] as const).entries()) {
  const character=maximum.characters[maximum.slots[i]!.characterId!]!;
  const initial=createPlayer('測',rules,route);
  character.player={...character.player,job:route,plannedJob:route,str:initial.str,dex:initial.dex,int:initial.int,
    skillRanks:Object.fromEntries(jobs[route].learnableSkills.map((id,index)=>[id,[10,8,1,1,1][index]!])),
    equipment:{...character.player.equipment,weapon:classItemId('sunwell-oathblade',{job:route})}};
  for(const base of Object.values(world.quests)) {
    const quest=questForPlayer(base,character.player);
    character.quests[quest.id]={status:'claimed',counters:Object.fromEntries(quest.objectives.flatMap(objective=>
      ['kill','reach','inspect'].includes(objective.type)?[[objective.targetId,objective.count]]:[]))};
  }
  const derived=deriveStats(character.player,rules);character.player.hp=derived.maxHp;character.player.mp=derived.maxMp;
}
const capacity=prepareProfile(maximum,{rules,world},8);if(!capacity.ok)throw Error(capacity.message);
const metrics=measureProfile(maximum);if(metrics.error)throw Error(metrics.error);
writeFileSync('output/rogue-20261106/profile-capacity.json',JSON.stringify({bytes:metrics.bytes,limit:65536,
  characters:4,level:30,bagSlotsEach:32,allQuestsClaimed:true,bindings:64,valid:true},null,2));
const balance=[];
for(const level of [10,20,30])for(const route of ['swordsman','archer','mage','rogue'] as const) {
  const player=createPlayer('比較',rules,route);player.job=route;player.level=level;player[jobs[route].mainStat]!+=(level-1)*5;
  player.equipment.weapon=classItemId(level===10?'iron-sword':level===20?'steel-sword':'sunwell-oathblade',player);
  const value=deriveStats(player,rules),skill=rules.skills[jobs[route].basicSkill]!;
  balance.push({level,route,spSpent:0,apSpent:(level-1)*5,...value,
    basicDpsBeforeDefense:value.attack*skill.multiplierBase*(1+value.critChance*.5)*1000/skill.cooldownMs});
}
writeFileSync('output/rogue-20261106/limited-balance.json',JSON.stringify(balance,null,2));
console.log(JSON.stringify({fixture:'Lv14 synthetic, five rank1 skills',maximumProfileBytes:metrics.bytes,balanceRows:balance.length}));
