/** Synthetic Lv20 UI slice only. Never reads or overwrites a player's save. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { rulesCatalog as rules } from '../../src/content/rules/index.js';
import { worldCatalog as world } from '../../src/content/world/index.js';
import { startNewGame } from '../../src/app/gameplay.js';
import { createPlayer, deriveStats } from '../../src/domain/progression/index.js';
import { createEmptyProfile, characterFromSave } from '../../src/persistence/profile.js';
import { measureProfile, prepareProfile, SAVE_FORMAT_VERSION } from '../../src/persistence/validate.js';
import { fullCharacterProfile } from '../../tests/fixtures/full-character-profile.js';

const directory = 'output/playwright/class-completion-beta89-20261107-01'; mkdirSync(directory,{recursive:true});
const started=startNewGame('合成二轉盜賊',{rules,world},()=> 'fixture-player','rogue');
if('error' in started)throw Error(started.error);
const data=started.gameplay.saveData;
data.player={...createPlayer('合成二轉盜賊',rules,'rogue'),job:'rogue',level:20,ap:95,sp:6,
  skillRanks:{'rogue-double-stab':1,'rogue-shadow-lunge':1,'rogue-smoke':1,'rogue-dagger-mastery':1,'rogue-combo-rhythm':1}};
const stats=deriveStats(data.player,rules);data.player.hp=stats.maxHp;data.player.mp=stats.maxMp;
data.location={mapId:'town',spawnId:'center'};data.visitedMaps=['camp','town'];
const profile=createEmptyProfile(data.settings);profile.slots[0]!.characterId='fixture-rogue';profile.activeCharacterId='fixture-rogue';
profile.characters['fixture-rogue']=characterFromSave(data,'fixture-rogue');
const other=structuredClone(data);other.player=createPlayer('倉庫接收者',rules);other.location={mapId:'camp',spawnId:'start'};other.visitedMaps=['camp'];
profile.slots[1]!.characterId='fixture-receiver';profile.characters['fixture-receiver']=characterFromSave(other,'fixture-receiver');
const checked=prepareProfile(profile,{rules,world});if(!checked.ok)throw Error(checked.message);
writeFileSync(directory+'/fixture.json',JSON.stringify({formatVersion:SAVE_FORMAT_VERSION,data:checked.value.data,savedAt:'synthetic-20261107'},null,2));
const capacity=fullCharacterProfile();
for(let index=4;index<6;index++) {const id=`character-${index+1}`;capacity.slots.push({slotId:`slot-${index+1}`,characterId:id});capacity.characters[id]={...structuredClone(capacity.characters[`character-${index%2+1}`]!),characterId:id};}
capacity.deletedCharacter={...structuredClone(capacity.characters['character-1']!),characterId:'deleted-capacity'};
capacity.warehouse=Array.from({length:24},()=>({itemId:'sunwell-oathdagger',quantity:1}));
const validCapacity=prepareProfile(capacity,{rules,world});if(!validCapacity.ok)throw Error(validCapacity.message);
const metrics=measureProfile(validCapacity.value.data);if(metrics.error)throw Error(metrics.error);
writeFileSync('output/class-completion-20261107/capacity.json',JSON.stringify({slots:6,archived:1,warehouse:24,bytes:metrics.bytes,maxBytes:65536,depthChecked:true},null,2));
console.log(JSON.stringify({fixture:directory+'/fixture.json',capacityBytes:metrics.bytes}));
