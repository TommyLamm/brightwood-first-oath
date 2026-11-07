import { describe, expect, it } from 'vitest';
import { createPlayer, applyProgressAction, deriveStats } from '../src/domain/progression/index.js';
import { rulesCatalog as rules } from '../src/content/rules/index.js';
import { worldCatalog as world } from '../src/content/world/index.js';
import { startNewGame } from '../src/app/gameplay.js';
import { activeSaveData, createPersistence, prepareProfile, profileFromLegacySave, updateActiveCharacter } from '../src/persistence/index.js';
import { characterFromSave } from '../src/persistence/profile.js';
import { classCatalog, classItemId, questForPlayer } from '../src/content/world/class-quests.js';
import type { PlayerProgress } from '../src/contracts/index.js';

const catalog = { rules, world };
function apply(player: PlayerProgress, action: Parameters<typeof applyProgressAction>[1]): PlayerProgress {
  const result = applyProgressAction(player, action, rules); if (!result.ok) throw Error(result.message); return result.value;
}
function save(route: 'swordsman' | 'archer' | 'mage' = 'swordsman') {
  const result = startNewGame('符文測試', catalog, () => 'test-id', route);
  if ('error' in result) throw Error(result.error); return result.gameplay.saveData;
}

describe('mage attributes and format 7', () => {
  it('has equal initial attributes, an independent formula and atomic INT AP spending', () => {
    for (const job of ['swordsman','archer','mage'] as const) {
      const player = createPlayer('測試', rules, job); expect(player.str + player.dex + player.int!).toBe(20);
    }
    const player = createPlayer('法師', rules, 'mage');
    expect(player).toMatchObject({ str: 4, dex: 4, int: 12, equipment: { weapon: 'starter-staff' } });
    expect(deriveStats(player,rules)).toMatchObject({ maxHp: 56, maxMp: 72, attack: 31, defense: 3, critChance: .05 });
    const leveled = apply(player,{type:'setLevelFloor',level:2});
    expect(deriveStats(apply(leveled,{type:'allocateAp',stat:'int',amount:5}),rules).attack).toBe(41);
    expect(applyProgressAction(leveled,{type:'allocateAp',stat:'int',amount:6},rules).ok).toBe(false);
    expect(leveled.int).toBe(12);
  });
  it('grants SP once, applies passives exactly once and rejects foreign weapons/skills', () => {
    const player = apply(apply(apply(createPlayer('法',rules,'mage'),{type:'setLevelFloor',level:10}),{type:'changeJob'}),{type:'setLevelFloor',level:30});
    expect(player.sp).toBe(21);
    const trained = apply(apply(player,{type:'learnSkill',skillId:'mage-rune-study'}),{type:'learnSkill',skillId:'mage-mana-affinity'});
    expect(deriveStats(trained,rules)).toMatchObject({ attack:31*1.02, maxMp:254 });
    expect(trained.mp).toBe(246);
    expect(applyProgressAction(trained,{type:'changeJob'},rules).ok).toBe(false);
    expect(applyProgressAction(trained,{type:'learnSkill',skillId:'archer-double-shot'},rules).ok).toBe(false);
    const sword = apply(trained,{type:'addItem',stack:{itemId:'iron-sword',quantity:1}});
    expect(applyProgressAction(sword,{type:'equip',bagIndex:sword.bag.length-1},rules).ok).toBe(false);
  });
  it('migrates formats 1–5 without spending AP or changing old stats', () => {
    const old = save(); delete old.player.int;
    for (let format = 1; format <= 5; format++) {
      const result = prepareProfile(old,catalog,format); expect(result.ok).toBe(true);
      if (result.ok) expect(activeSaveData(result.value.data)?.player).toEqual({...old.player,int:4});
    }
    expect(old.player).not.toHaveProperty('int');
  });
  it('migrates a format-6 roster with stable IDs, independent bags and shared settings', () => {
    const old = profileFromLegacySave(save()); old.slots[1]!.characterId='archer-1';
    old.characters['archer-1']=characterFromSave(save('archer'),'archer-1');
    Object.values(old.characters).forEach(({player})=>delete player.int);
    const bytes=JSON.stringify(old); const result=prepareProfile(old,catalog,6); expect(result.ok).toBe(true);
    if(!result.ok)return;
    expect(result.value.data.slots).toEqual(old.slots); expect(JSON.stringify(old)).toBe(bytes);
    for(const character of Object.values(result.value.data.characters)) expect(character.player.int).toBe(4);
    expect(prepareProfile(result.value.data,catalog,7).ok).toBe(true);
    expect(prepareProfile(result.value.data,catalog,6).ok).toBe(false);
    const changed=activeSaveData(result.value.data)!; changed.player.coins++;
    expect(updateActiveCharacter(result.value.data,changed).characters['archer-1']).toEqual(result.value.data.characters['archer-1']);
  });
  it('rejects missing/invalid INT, excess AP, mislabeled mage data and unknown formats', () => {
    const profile=profileFromLegacySave(save('mage'));
    expect(prepareProfile(profile,catalog,7).ok).toBe(true);
    expect(prepareProfile(profile,catalog,6).ok).toBe(false);
    expect(prepareProfile(profile,catalog,9).ok).toBe(false);
    for(const value of [undefined,-1,NaN,12.5,13]) {
      const copy=structuredClone(profile); copy.characters['legacy-1']!.player.int=value;
      if(value===undefined)delete copy.characters['legacy-1']!.player.int;
      expect(prepareProfile(copy,catalog,7).ok).toBe(false);
    }
  });
  it('preserves exact format-6 bytes until explicit backup/upgrade, then writes the current format', async () => {
    const profile=profileFromLegacySave(save()); delete profile.characters['legacy-1']!.player.int;
    const key='mage-test:save:v1'; const raw=JSON.stringify({formatVersion:6,data:profile,savedAt:'old'});
    const entries=new Map([[key,raw]]);
    const persistence=createPersistence({gameId:'mage-test',development:false,cloud:null,catalog,
      storage:{getItem:key=>entries.get(key)??null,setItem:(key,value)=>{entries.set(key,value);},removeItem:key=>{entries.delete(key);}}});
    const loaded=await persistence.initialize(); expect(loaded.saveUpgrade?.formatVersion).toBe(6);
    expect(entries.get(key)).toBe(raw);
    await persistence.confirmSaveUpgrade(); await persistence.flush();
    expect(entries.get(key+':format6-backup')).toBe(raw);
    expect(JSON.parse(entries.get(key)!)).toMatchObject({formatVersion:8,data:{characters:{'legacy-1':{player:{int:4}}}}});
    persistence.dispose();
  });
  it('resolves all six weapon stages and caches each route independently', () => {
    const mage={job:'mage' as const}; const archer={job:'archer' as const};
    expect(classItemId('guardian-sword',mage)).toBe('guardian-staff');
    const quest=questForPlayer(world.quests.q02!,mage);
    expect(quest).toMatchObject({giverNpcId:'mage-mentor',reward:{job:'mage',items:[{itemId:'iron-staff',quantity:1}]}});
    expect(classCatalog(catalog,mage).world.quests.q02).toEqual(quest);
    expect(classCatalog(catalog,archer).world.quests.q02?.reward.job).toBe('archer');
    expect(classCatalog(classCatalog(catalog,archer),mage).world.quests.q02).toEqual(quest);
    expect(classCatalog(classCatalog(catalog,mage),{job:'swordsman'})).toBe(catalog);
  });
});
