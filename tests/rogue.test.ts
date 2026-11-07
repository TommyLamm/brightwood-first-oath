import { describe, expect, it } from 'vitest';
import type { CombatActor, GameCommand, InputFrame, PlayerJob, PlayerProgress } from '../src/contracts/index.js';
import { rulesCatalog as rules } from '../src/content/rules/index.js';
import { worldCatalog as world } from '../src/content/world/index.js';
import { classCatalog, classItemId, questForPlayer, ROGUE_TRIAL_IDS } from '../src/content/world/class-quests.js';
import { DAGGER_BY_SWORD } from '../src/content/rules/items.js';
import { applyProgressAction, createPlayer, deriveStats } from '../src/domain/progression/index.js';
import { createCombatState, stepCombat, tryAttack } from '../src/domain/combat/index.js';
import { lungeDestination } from '../src/domain/combat/rogue.js';
import { createMonster, stepActors } from '../src/domain/actors/index.js';
import { acceptQuest, getQuestView } from '../src/domain/quests/index.js';
import { resolveQuestClaim } from '../src/domain/quests/claim.js';
import { startNewGame, stepGameplay, type GameplayState } from '../src/app/gameplay.js';
import { activeSaveData, createPersistence, measureProfile, prepareProfile, profileFromLegacySave } from '../src/persistence/index.js';
import { characterFromSave } from '../src/persistence/profile.js';

const catalog={rules,world};
const idle:InputFrame={moveX:0,climbY:0,jumpPressed:false,downHeld:false};
let seq=0;const nextId=()=>`rogue-${++seq}`;
function game(route:PlayerJob='rogue', trained=true):GameplayState {
  const result=startNewGame('短刃測試',catalog,nextId,route);if('error' in result)throw Error(result.error);
  const g=result.gameplay;g.monsters=[];g.movement.mode='grounded';g.movement.footholdId='camp:ground';
  if(trained)g.saveData.player={...g.saveData.player,job:route,level:30,ap:145,sp:16,
    skillRanks:{'rogue-double-stab':1,'rogue-shadow-lunge':1,'rogue-smoke':1,'rogue-dagger-mastery':1,'rogue-combo-rhythm':1}};
  const stats=deriveStats(g.saveData.player,rules);g.saveData.player.hp=stats.maxHp;g.saveData.player.mp=stats.maxMp;
  return g;
}
function tick(g:GameplayState,nowMs:number,dtSeconds:number,skillId?:string,input=idle,content=catalog):GameplayState {
  return stepGameplay(g,{catalog:content,commands:skillId?[{seq:++seq,type:'attack',payload:{skillId}}]:[],input,
    nowMs,dtSeconds,random:{next:()=>.5},nextEntityId:nextId}).gameplay!;
}
function command(g:GameplayState,nowMs:number,cmd:Omit<GameCommand,'seq'>):GameplayState {
  return stepGameplay(g,{catalog,commands:[{...cmd,seq:++seq} as GameCommand],input:idle,nowMs,dtSeconds:0,
    random:{next:()=>.5},nextEntityId:nextId}).gameplay!;
}
function apply(player:PlayerProgress,action:Parameters<typeof applyProgressAction>[1]):PlayerProgress {
  const result=applyProgressAction(player,action,rules);if(!result.ok)throw Error(result.message);return result.value;
}
function actor(id:string,x:number):CombatActor {return {id,position:{x,y:600},facing:1,hp:1000,
  stats:{maxHp:1000,maxMp:0,attack:100,defense:0,critChance:0},faction:id==='player'?'player':'enemy',
  body:{width:24,height:48},knockbackImmune:true,skillRanks:{'rogue-double-stab':1}};}
function nearMonster(g:GameplayState):GameplayState {
  const map=world.maps.camp!,spawn=map.monsters[0]!;g.monsters=[createMonster(nextId(),spawn,map,rules)];
  g.monsters[0]!.hp=1000;g.monsters[0]!.idleUntilMs=10000;
  g.movement.position.x=spawn.x-35;return g;
}

describe('rogue foundation and safe saves',()=>{
  it('creates equal-budget DEX characters and applies mastery only with a dagger',()=>{
    const fresh=createPlayer('刃',rules,'rogue');expect(fresh).toMatchObject({str:4,dex:12,int:4,equipment:{weapon:'starter-dagger'}});
    expect(deriveStats(fresh,rules)).toMatchObject({maxHp:60,maxMp:48,attack:31,defense:2,critChance:.068});
    const trained=apply(apply(apply(fresh,{type:'setLevelFloor',level:10}),{type:'changeJob'}),{type:'learnSkill',skillId:'rogue-dagger-mastery'});
    expect(deriveStats(trained,rules).attack).toBeCloseTo(31*1.015);
    expect(deriveStats({...trained,equipment:{...trained.equipment,weapon:null}},rules).attack).toBe(27);
    expect(applyProgressAction(trained,{type:'learnSkill',skillId:'mage-mana-bolt'},rules).ok).toBe(false);
    const points=apply(trained,{type:'allocateAp',stat:'dex',amount:5});expect(points.ap).toBe(trained.ap-5);
    expect(deriveStats(points,rules).attack-deriveStats(trained,rules).attack).toBeCloseTo(10*1.015);
  });
  it('reads old 1–7 without mutating bytes and never accepts rogue data mislabeled as old',()=>{
    const old=game('swordsman',false).saveData;delete old.player.int;delete old.player.luk;
    for(let format=1;format<=5;format++)expect(prepareProfile(old,catalog,format).ok).toBe(true);
    const historical = (profile: ReturnType<typeof profileFromLegacySave>) => { delete profile.warehouse; delete profile.deletedCharacter;
      for (const character of Object.values(profile.characters)) delete character.player.luk; return profile; };
    const roster=historical(profileFromLegacySave(old));const original=JSON.stringify(roster);
    expect(prepareProfile(roster,catalog,6).ok).toBe(true);expect(JSON.stringify(roster)).toBe(original);
    const seventh=historical(profileFromLegacySave(game('mage',false).saveData));
    expect(prepareProfile(seventh,catalog,7).ok).toBe(true);
    const rogue=historical(profileFromLegacySave(game('rogue',false).saveData));
    for(const format of [6,7,10])expect(prepareProfile(rogue,catalog,format).ok).toBe(false);
    expect(prepareProfile(rogue,catalog,8).ok).toBe(true);
    delete rogue.characters['legacy-1']!.player.int;expect(prepareProfile(rogue,catalog,8).ok).toBe(false);
  });
  it('backs up exact format-7 bytes before writing 9 and stops on failed backup',async()=>{
    const data=profileFromLegacySave(game('mage',false).saveData);const key='rogue-qa:save:v1';
    delete data.warehouse; delete data.deletedCharacter; for (const character of Object.values(data.characters)) delete character.player.luk;
    const raw=JSON.stringify({formatVersion:7,data,savedAt:'old'});
    for(const fail of [false,true]) {
      const entries=new Map([[key,raw]]);
      const persistence=createPersistence({gameId:'rogue-qa',development:false,cloud:null,catalog,
        storage:{getItem:k=>entries.get(k)??null,setItem:(k,v)=>{if(fail&&k.includes('backup'))throw Error('blocked');entries.set(k,v);},removeItem:k=>{entries.delete(k);}}});
      expect((await persistence.initialize()).saveUpgrade?.formatVersion).toBe(7);expect(entries.get(key)).toBe(raw);
      persistence.confirmSaveUpgrade();await persistence.flush();
      if(fail)expect(entries.get(key)).toBe(raw);else {
        expect(entries.get(key+':format7-backup')).toBe(raw);expect(JSON.parse(entries.get(key)!).formatVersion).toBe(9);
      }
      persistence.dispose();
    }
  });
  it('keeps four routes separate and within the 64KiB profile budget',()=>{
    const profile=profileFromLegacySave(game('swordsman',false).saveData);
    for(const [i,route] of (['archer','mage','rogue'] as const).entries()) {
      const id=route+'-1';profile.slots[i+1]!.characterId=id;profile.characters[id]=characterFromSave(game(route,false).saveData,id);
    }
    const checked=prepareProfile(profile,catalog,9);expect(checked.ok).toBe(true);expect(measureProfile(profile).bytes).toBeLessThan(65536);
    expect(activeSaveData(profile)?.player.equipment.weapon).toBe('starter-sword');
    profile.activeCharacterId='rogue-1';expect(activeSaveData(profile)?.player.equipment.weapon).toBe('starter-dagger');
    expect(classCatalog(classCatalog(catalog,{job:'mage'}),{job:'rogue'}).world.quests.q02!.reward.job).toBe('rogue');
  });
});

describe('rogue melee windows and transactions',()=>{
  it('hits a target once per stab, retains each budget and cancels the future stab on death',()=>{
    const all=[actor('player',100),actor('enemy',140)];
    const proposal=tryAttack(createCombatState(),{sourceId:'player',skillId:'rogue-double-stab'},all,rules,0,nextId);if(!proposal.ok)throw Error(proposal.message);
    const first=stepCombat(proposal.value.state,all,rules,.15,150,{next:()=>.5},world.maps.camp);expect(first.hits).toHaveLength(1);
    expect(first.hits[0]?.knockback).toEqual({x:0,y:0});
    expect(stepCombat(first.state,all,rules,.02,170,{next:()=>.5}).hits).toHaveLength(0);
    const second=stepCombat(first.state,all,rules,.18,330,{next:()=>.5});expect(second.hits).toHaveLength(1);
    expect(stepCombat(second.state,all,rules,.01,340,{next:()=>.5}).hits).toHaveLength(0);
    const dead=[{...all[0]!,hp:0},all[1]!];expect(stepCombat(first.state,dead,rules,.18,330,{next:()=>.5}).hits).toHaveLength(0);
    expect(stepCombat(first.state,[all[0]!,actor('enemy',300)],rules,.18,330,{next:()=>.5}).hits).toHaveLength(0);
    expect(stepCombat(proposal.value.state,all,rules,0,330,{next:()=>.5}).hits).toHaveLength(0);
  });
  it('charges one MP payment, respects recovery/cooldown and cancels future hits under hit-stun',()=>{
    const g=nearMonster(game());const cast=tick(g,0,0,'rogue-double-stab');expect(cast.saveData.player.mp).toBe(g.saveData.player.mp-6);
    const first=tick(cast,150,.15);expect(first.monsters[0]!.hp).toBeLessThan(1000);
    const locked=tick(first,170,.02,'basic',{...idle,moveX:1,jumpPressed:true});expect(locked.movement.position).toEqual(first.movement.position);
    locked.movement.knockbackUntilMs=1000;
    const interrupted=tick(locked,330,.16);expect(interrupted.combat.attacks.filter(a=>a.sourceId===g.playerEntityId)).toHaveLength(0);expect(interrupted.monsters[0]!.hp).toBe(first.monsters[0]!.hp);
    expect(interrupted.saveData.player.mp).toBe(cast.saveData.player.mp);
    const dry=game();dry.saveData.player.mp=0;expect(tick(dry,0,0,'rogue-double-stab').combat.attacks).toHaveLength(0);
    expect(tick(dry,0,0,'basic').combat.attacks[0]?.skillId).toBe('dagger-basic');
  });
  it('caps rhythm at three, consumes it on accepted actives and clears it on expiry or hit-stun',()=>{
    let g=nearMonster(game());
    for(const now of [0,500,1000]) {g=tick(g,now,0,'basic');g=tick(g,now+120,.12);g.monsters[0]!.movement.position={x:g.movement.position.x+35,y:600};g.monsters[0]!.movement.mode='grounded';g.monsters[0]!.movement.knockbackUntilMs=0;}
    expect(g.rogueRhythm?.stacks).toBe(3);
    const active=tick(g,1500,0,'rogue-double-stab');expect(active.combat.attacks.find(a=>a.sourceId===g.playerEntityId)?.damageBonus).toBe(.015);expect(active.rogueRhythm).toBeUndefined();
    expect(tick(g,6000,.01).rogueRhythm).toBeUndefined();
    g.movement.knockbackUntilMs=2000;expect(tick(g,1600,.01).rogueRhythm).toBeUndefined();
    const miss=tick(game(),0,0,'basic');expect(tick(miss,150,.15).rogueRhythm).toBeUndefined();
  });
  it('sweeps the whole lunge body, stops at walls, gaps, all doors and bounds, and grants no invulnerability',()=>{
    const g=game(),map=world.maps.camp!,claimed=new Set<string>();
    expect(lungeDestination(g.movement,map,rules.movement,0,claimed)!.position.x).toBe(246);
    const wall={...map,walls:[{x:200,y:500,width:10,height:100}]};expect(lungeDestination(g.movement,wall,rules.movement,0,claimed)!.position.x).toBe(200-rules.movement.width/2);
    const gap={...map,footholds:[{...map.footholds[0]!,x1:0,x2:200,y1:600,y2:600}]};expect(lungeDestination(g.movement,gap,rules.movement,0,claimed)!.position.x).toBeLessThanOrEqual(200+rules.movement.width/2);
    const door={...map,portals:[{...map.portals[0]!,x:200,requiredQuestId:null}]};expect(lungeDestination(g.movement,door,rules.movement,0,claimed)!.position.x).toBeLessThan(200);
    expect(lungeDestination(g.movement,{...map,width:200},rules.movement,0,claimed)!.position.x).toBe(200-rules.movement.width/2);
    const cast=tick(g,0,0,'rogue-shadow-lunge'),moved=tick(cast,180,.18);expect(moved.movement.position.x).toBe(246);expect(moved.invulnerableUntilMs).toBe(g.invulnerableUntilMs);
    const stuck={...map,walls:[{x:150+rules.movement.width/2,y:500,width:10,height:100}]};const content={rules,world:{...world,maps:{...world.maps,camp:stuck}}};
    expect(tick(g,0,0,'rogue-shadow-lunge',idle,content).saveData.player.mp).toBe(g.saveData.player.mp);
  });
  it('blocks dagger hits through walls and limits each stab to one target',()=>{
    const all=[actor('player',100),actor('enemy-a',140),actor('enemy-b',150)];
    const cast=tryAttack(createCombatState(),{sourceId:'player',skillId:'rogue-double-stab'},all,rules,0,nextId);if(!cast.ok)throw Error(cast.message);
    const blocked={...world.maps.camp!,walls:[{x:120,y:500,width:8,height:100}]};
    expect(stepCombat(cast.value.state,all,rules,.33,330,{next:()=>.5},blocked).hits).toHaveLength(0);
    expect(stepCombat(cast.value.state,all,rules,.33,330,{next:()=>.5},world.maps.camp).hits.map(h=>h.targetId)).toEqual(['enemy-a','enemy-a']);
  });
  it('slows ordinary monsters only inside a short smoke zone and never controls bosses',()=>{
    let g=nearMonster(game());const hp=g.monsters[0]!.hp;g=tick(g,0,0,'rogue-smoke');g=tick(g,200,.2);
    expect(g.smoke?.expiresAtMs).toBe(2380);expect(g.monsters[0]!.hp).toBe(hp);
    g=tick(g,220,.02);expect(g.monsters[0]!.smokeSlowedUntilMs).toBe(221);
    const monster=g.monsters[0]!;monster.movement.knockbackUntilMs=0;monster.mode='patrol';monster.idleUntilMs=0;
    const player=actor('player',0);player.hp=0;
    const slow=stepActors([monster],player,world.maps.camp!,rules,.1,220).monsters[0]!;
    const fast=stepActors([{...monster,smokeSlowedUntilMs:0}],player,world.maps.camp!,rules,.1,220).monsters[0]!;
    expect(Math.abs(slow.movement.position.x-monster.movement.position.x)).toBeCloseTo(Math.abs(fast.movement.position.x-monster.movement.position.x)*.5);
    monster.movement.position.x+=300;g.monsters=[monster];expect(tick(g,240,.02).monsters[0]!.smokeSlowedUntilMs).toBe(0);
    expect(tick(g,2400,.01).smoke).toBeUndefined();
    const map=world.maps['guardian-arena']!,boss=createMonster(nextId(),map.monsters[0]!,map,rules);g.monsters=[boss];g.saveData.location={mapId:map.id,spawnId:'left'};
    g.smoke={position:{...boss.movement.position},expiresAtMs:5000};const out=tick(g,1000,.01);expect(out.monsters[0]!.smokeSlowedUntilMs).toBe(0);expect(out.monsters[0]!.hp).toBe(boss.hp);
    g.saveData.player.hp=0;expect(tick(g,1100,.01).smoke).toBeUndefined();
  });
});

describe('rogue trial and all weapon tiers',()=>{
  function learner():GameplayState {
    const g=game('rogue',false);g.saveData.player.level=3;g.saveData.player.ap=10;
    g.saveData.quests.q01={status:'claimed',counters:{snail:3}};g.saveData.visitedMaps.push('town');g.saveData.location={mapId:'town',spawnId:'left'};
    place(g,400);return g;
  }
  function place(g:GameplayState,x:number) {g.movement={...g.movement,position:{x,y:350},velocity:{x:0,y:0},mode:'grounded',facing:1,footholdId:'town:platform-2'};}
  it('teaches actual melee, two stabs and a retryable warning escape before one-time graduation',()=>{
    let g=command(learner(),0,{type:'acceptQuest',payload:{questId:'q02'}});expect(getQuestView(g.saveData,'q02',catalog).status).toBe('active');
    place(g,525);g=tick(g,0,0,'basic');g=tick(g,120,.12);expect(g.saveData.quests.q02!.counters[ROGUE_TRIAL_IDS[0]]).toBe(1);
    place(g,685);const mp=g.saveData.player.mp;g=tick(g,500,0,'rogue-double-stab');g=tick(g,650,.15);g=tick(g,830,.18);
    expect(g.saveData.player.mp).toBe(mp);expect(g.saveData.player.skillRanks['rogue-double-stab']).toBeUndefined();expect(g.rogueTrial).toBeDefined();
    g=tick(g,1800,.97);expect(g.saveData.quests.q02!.counters[ROGUE_TRIAL_IDS[2]]).toBe(0);
    g=tick(g,2000,0,'rogue-double-stab');g=tick(g,2150,.15);g=tick(g,2330,.18);
    place(g,550);g=tick(g,3300,.97);expect(getQuestView(g.saveData,'q02',catalog).status).toBe('ready');
    place(g,400);g=command(g,3400,{type:'claimQuest',payload:{questId:'q02'}});
    expect(g.saveData.player).toMatchObject({job:'rogue',level:10,sp:1});expect(g.saveData.player.bag).toContainEqual({itemId:'iron-dagger',quantity:1});
    const before=structuredClone(g.saveData);g=command(g,3500,{type:'claimQuest',payload:{questId:'q02'}});expect(g.saveData).toEqual(before);
    expect(prepareProfile(profileFromLegacySave(g.saveData),catalog,9).ok).toBe(true);
    expect(tick(g,4000,0,'rogue-double-stab').combat.attacks).toHaveLength(0);
  });
  it('routes six tiers, shop objectives and claims while preserving foreign owned gear',()=>{
    let data=learner().saveData;const accepted=acceptQuest(data,'q02',catalog);if(!accepted.ok)throw Error(accepted.message);data=accepted.value;
    data.quests.q02!.counters={town:1,...Object.fromEntries(ROGUE_TRIAL_IDS.map(id=>[id,1]))};data.player.bag.push({itemId:'iron-staff',quantity:1});
    const result=resolveQuestClaim(data,'q02',catalog);expect(result.ok).toBe(true);if(!result.ok)return;
    expect(result.value.player.bag).toContainEqual({itemId:'iron-staff',quantity:1});
    for(const [sword,dagger] of Object.entries(DAGGER_BY_SWORD))expect(rules.items[dagger]).toMatchObject({minLevel:rules.items[sword]!.minLevel,attack:rules.items[sword]!.attack,allowedJobs:['rogue']});
    for(const id of ['q05','q11','q14'])expect(getQuestView(data,id,catalog).reward.items).toEqual(world.quests[id]!.reward.items.map(item=>({...item,itemId:classItemId(item.itemId,data.player)})));
    expect(questForPlayer(world.quests.q06!,data.player).objectives).toContainEqual({type:'equip',targetId:'steel-dagger',count:1});
    data.player.bag=Array.from({length:32},()=>({itemId:'small-red',quantity:99}));const before=structuredClone(data);
    expect(resolveQuestClaim(data,'q02',catalog)).toMatchObject({ok:false,code:'BAG_FULL'});expect(data).toEqual(before);
  });
});
