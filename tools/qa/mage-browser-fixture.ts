/** Isolated browser fixtures only. Preserve normal UI progress before installing synthetic data. */
import { readFileSync, writeFileSync } from 'node:fs';
import { rulesCatalog as rules } from '../../src/content/rules/index.js';
import { worldCatalog as world } from '../../src/content/world/index.js';
import { deriveStats } from '../../src/domain/progression/index.js';
import { activeSaveData, prepareProfile } from '../../src/persistence/index.js';
import { characterFromSave } from '../../src/persistence/profile.js';

const dir='output/playwright/mage-beta87-20261106-01';
const raw=readFileSync(dir+'/normal-two-characters.storage.json','utf8');
const original=JSON.parse(raw) as {formatVersion:number;data:unknown};
const checked=prepareProfile(original.data,{rules,world},original.formatVersion);
if(!checked.ok)throw Error(checked.message);
const profile=checked.value.data;
const save=activeSaveData(profile);if(!save)throw Error('Missing normal character');
save.player={...save.player,name:'合成Lv14法術短段',job:'mage',plannedJob:'mage',level:14,exp:0,str:4,dex:4,int:12,ap:65,sp:0,
  skillRanks:{'mage-mana-bolt':1,'mage-frost-ring':1,'mage-blink':1,'mage-mana-affinity':1,'mage-rune-study':1}};
const stats=deriveStats(save.player,rules);save.player.hp=stats.maxHp;save.player.mp=stats.maxMp;
save.location={mapId:'camp',spawnId:'start'};
const id='fixture-mage-14';profile.slots[2]!.characterId=id;profile.characters[id]=characterFromSave(save,id);profile.activeCharacterId=id;
const valid=prepareProfile(profile,{rules,world},7);if(!valid.ok)throw Error(valid.message);
const envelope=JSON.stringify({formatVersion:7,data:valid.value.data,savedAt:new Date().toISOString()});
writeFileSync(dir+'/mage14.fixture.json',envelope);
const installer=(text:string)=>`async (page) => { await page.evaluate(raw=>localStorage.setItem('brightwood-first-oath:save:v1',raw),${JSON.stringify(text)}); await page.reload(); await page.waitForTimeout(700); }\n`;
writeFileSync(dir+'/install-fixture.js',installer(envelope));writeFileSync(dir+'/restore-normal.js',installer(raw));
console.log({synthetic:true,level:14,skills:save.player.skillRanks,stats,bytes:Buffer.byteLength(envelope)});
