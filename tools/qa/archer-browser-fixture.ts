import { writeFileSync } from 'node:fs';
import { fullCharacterProfile } from '../../tests/fixtures/full-character-profile.js';
import { deriveStats } from '../../src/domain/progression/index.js';
import { rulesCatalog } from '../../src/content/rules/index.js';
import { worldCatalog } from '../../src/content/world/index.js';
import { prepareProfile } from '../../src/persistence/validate.js';
const profile=fullCharacterProfile();profile.settings.bindings={};
const base=structuredClone(profile.characters['character-2']!);
const maps=['guardian-arena','frost-tide-cavern','sand-sunwell-altar','ruins-bell-sanctum'];
for(let index=0;index<4;index+=1){
 const id=`character-${index+1}`, character=structuredClone(base);
 character.characterId=id;character.player.name=['試煉木葉','試煉霜雪','試煉沙海','試煉遺跡'][index]!;
 character.player.str=33;character.player.dex=128;character.player.ap=0;character.player.sp=0;
 character.player.skillRanks={'archer-double-shot':6,'archer-piercing-shot':6,'archer-retreat-shot':3,'archer-bow-mastery':3,'archer-steady-aim':3};
 character.player.bag=[{itemId:'large-red',quantity:20},{itemId:'large-blue',quantity:20}];
 character.player.equipment={weapon:'sunwell-oathbow',body:'iron-mail',hat:'iron-helm'};
 const stats=deriveStats(character.player,rulesCatalog);character.player.hp=stats.maxHp;character.player.mp=stats.maxMp;
 const map=worldCatalog.maps[maps[index]!]!;
 character.location={mapId:map.id,spawnId:map.spawns.some(({id})=>id==='right')&&index===1?'right':map.spawns.some(({id})=>id==='entry')?'entry':map.spawns[0]!.id};
 character.flags={bossDefeated:true,chapterComplete:false};profile.characters[id]=character;
}
profile.activeCharacterId='character-1';
const prepared=prepareProfile(profile,{rules:rulesCatalog,world:worldCatalog},6);
if(!prepared.ok) throw new Error(prepared.message);
const envelope={formatVersion:6,data:prepared.value.data,savedAt:new Date().toISOString()};
writeFileSync('output/playwright/archer-beta86-20261106-01/four-bosses.fixture.json',JSON.stringify(envelope,null,2));
writeFileSync('output/playwright/archer-beta86-20261106-01/install-fixture.js',`async (page) => { const fixture=${JSON.stringify(envelope)}; await page.evaluate((fixture)=>localStorage.setItem('brightwood-first-oath:save:v1',JSON.stringify(fixture)),fixture); await page.reload(); return {synthetic:true,characters:Object.keys(fixture.data.characters),maps:Object.values(fixture.data.characters).map(c=>c.location.mapId)}; }`);
console.log('Prepared four isolated, explicitly synthetic boss characters');
