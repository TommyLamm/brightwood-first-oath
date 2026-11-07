import { describe, expect, it } from 'vitest';
import type { CombatActor, ContentCatalog, GameCommand, InputFrame } from '../src/contracts/index.js';
import { rulesCatalog as rules } from '../src/content/rules/index.js';
import { worldCatalog as world } from '../src/content/world/index.js';
import { startNewGame, stepGameplay, type GameplayState } from '../src/app/gameplay.js';
import { deriveStats } from '../src/domain/progression/index.js';
import { blinkDestination } from '../src/domain/combat/mage.js';
import { createCombatState, stepCombat, tryAttack } from '../src/domain/combat/index.js';
import { createMonster, stepActors } from '../src/domain/actors/index.js';

const catalog:ContentCatalog={rules,world}; const idle:InputFrame={moveX:0,climbY:0,jumpPressed:false,downHeld:false};
let seq=0; const nextId=()=>`mage-${++seq}`;
function game():GameplayState {
  const result=startNewGame('星紋',catalog,nextId,'mage'); if('error' in result)throw Error(result.error);
  const g=result.gameplay; g.monsters=[];
  g.saveData.player={...g.saveData.player,job:'mage',level:30,ap:145,sp:15,
    skillRanks:{'mage-mana-bolt':1,'mage-frost-ring':1,'mage-blink':1,'mage-mana-affinity':2,'mage-rune-study':1}};
  const stats=deriveStats(g.saveData.player,rules); g.saveData.player.hp=stats.maxHp;g.saveData.player.mp=stats.maxMp;
  g.movement.mode='grounded';g.movement.footholdId=world.maps.camp!.footholds.find(f=>f.y1===600&&f.x1<=150&&f.x2>=150)!.id;
  return g;
}
function tick(g:GameplayState,nowMs:number,dtSeconds:number,skillId?:string,input=idle,content=catalog):GameplayState {
  const commands:GameCommand[]=skillId?[{type:'attack',payload:{skillId},seq:++seq}]:[];
  return stepGameplay(g,{catalog:content,commands,input,nowMs,dtSeconds,random:{next:()=>.5},nextEntityId:nextId}).gameplay!;
}
function actor(id:string,x:number):CombatActor {return {id,position:{x,y:600},facing:1,hp:500,
  stats:{maxHp:500,maxMp:0,attack:31,defense:0,critChance:0},faction:id==='player'?'player':'enemy',body:{width:24,height:40},
  knockbackImmune:true,skillRanks:{'mage-frost-ring':1}};}

describe('mage spell transactions and timing',()=>{
  it('casts a zero-MP basic and one paid bolt, locks the windup and rejects airborne casts',()=>{
    const g=game();g.saveData.player.mp=0;
    const basic=tick(g,0,0,'basic');expect(basic.combat.attacks[0]?.skillId).toBe('wand-basic');
    expect(tick(basic,260,.26).combat.projectiles).toHaveLength(1);expect(basic.saveData.player.mp).toBe(0);
    const original=game();const cast=tick(original,0,0,'mage-mana-bolt');
    expect(cast.saveData.player.mp).toBe(original.saveData.player.mp-8);
    const held=tick(cast,200,.2,undefined,{...idle,moveX:1,jumpPressed:true,climbY:1});
    expect(held.movement.position).toEqual(original.movement.position);
    expect(held.combat.projectiles??[]).toHaveLength(0);
    const fired=tick(held,320,.12);expect(fired.combat.projectiles).toHaveLength(1);
    expect(fired.saveData.player.mp).toBe(cast.saveData.player.mp);
    const air=game();air.movement.mode='airborne';
    expect(tick(air,0,0,'mage-mana-bolt').saveData.player.mp).toBe(air.saveData.player.mp);
  });
  it('interrupts unfired magic on hit-stun without refunding MP or clearing already flying bolts',()=>{
    const cast=tick(game(),0,0,'mage-mana-bolt');cast.movement.knockbackUntilMs=800;
    const cancelled=tick(cast,320,.32);expect(cancelled.combat.attacks).toHaveLength(0);
    expect(cancelled.combat.projectiles??[]).toHaveLength(0);expect(cancelled.saveData.player.mp).toBe(cast.saveData.player.mp);
    const fired=tick(tick(game(),0,0,'mage-mana-bolt'),320,.32);fired.movement.knockbackUntilMs=800;
    expect(tick(fired,340,.02).combat.projectiles).toHaveLength(1);
  });
  it('sweeps magic bolts against walls and never advances projectiles on zero dt',()=>{
    let g=tick(game(),0,0,'mage-mana-bolt');g=tick(g,320,.32);
    expect(tick(g,320,0).combat.projectiles).toEqual(g.combat.projectiles);
    const content={...catalog,world:{...world,maps:{...world.maps,camp:{...world.maps.camp!,walls:[{x:210,y:500,width:20,height:100}]}}}};
    const stopped=tick(g,500,.18,undefined,idle,content);expect(stopped.combat.projectiles??[]).toHaveLength(0);
  });
  it('hits on both sides of the fixed frost origin, caps at five, blocks walls and protects boss transitions',()=>{
    const source=actor('player',300);const targets=[250,270,330,365,385,405,420].map((x,i)=>actor('enemy-'+i,x));
    const protectedActor=actor('protected',300);protectedActor.projectileImmune=true;
    const all=[source,...targets,protectedActor];const cast=tryAttack(createCombatState(),{sourceId:'player',skillId:'mage-frost-ring'},all,rules,0,nextId);
    expect(cast.ok).toBe(true);if(!cast.ok)return;
    const map={...world.maps.camp!,walls:[{x:340,y:480,width:10,height:120}]};
    const wall=stepCombat(cast.value.state,all,rules,.4,400,{next:()=>.5},map);
    expect(wall.hits.map(h=>h.targetId)).toEqual(['enemy-1','enemy-2','enemy-0']);
    const open=stepCombat(cast.value.state,all,rules,.4,400,{next:()=>.5},world.maps.camp);
    expect(open.hits).toHaveLength(5);expect(open.hits.some(h=>h.targetId==='protected')).toBe(false);
    expect(stepCombat(open.state,all,rules,.02,420,{next:()=>.5},world.maps.camp).hits).toHaveLength(0);
  });
  it('applies one 40% movement slow to ordinary monsters, then expires it',()=>{
    const g=game();const map=world.maps.camp!;const spawn=map.monsters.find(s=>s.monsterId==='snail')!;
    g.movement.position.x=spawn.x-100;g.monsters=[createMonster(nextId(),spawn,map,rules)];
    const cast=tick(g,0,0,'mage-frost-ring');const hit=tick(cast,400,.4);
    expect(hit.monsters[0]?.slowedUntilMs).toBe(1900);
    expect(hit.effects.find(effect=>effect.kind==='hit')).toMatchObject({magic:true});
    expect(hit.effects.find(effect=>effect.kind==='hit')?.key).toBeUndefined();
    const monster=hit.monsters[0]!;monster.movement.knockbackUntilMs=0;monster.mode='patrol';monster.idleUntilMs=0;
    const player=actor('player',0);player.hp=0;
    const slow=stepActors([monster],player,map,rules,.1,600).monsters[0]!;
    const full=stepActors([{...monster,slowedUntilMs:0}],player,map,rules,.1,600).monsters[0]!;
    expect(Math.abs(slow.movement.position.x-monster.movement.position.x)).toBeCloseTo(Math.abs(full.movement.position.x-monster.movement.position.x)*.6);
    const expired=stepActors([monster],player,map,rules,.1,2000).monsters[0]!;
    expect(Math.abs(expired.movement.position.x-monster.movement.position.x)).toBeCloseTo(Math.abs(full.movement.position.x-monster.movement.position.x));
  });
  it('blinks through the normal body solver, stops at walls/gaps/locks and never grants invulnerability',()=>{
    const g=game();const map=world.maps.camp!;
    expect(blinkDestination(g.movement,map,rules.movement,0)?.position.x).toBe(g.movement.position.x+120);
    const blocked={...map,walls:[{x:200,y:500,width:10,height:100}]};
    const destination=blinkDestination(g.movement,blocked,rules.movement,0)!;
    expect(destination.position.x).toBe(200-rules.movement.width/2);
    const gap={...map,footholds:[{...map.footholds[0]!,x1:0,x2:200,y1:600,y2:600}]};
    expect(blinkDestination(g.movement,gap,rules.movement,0)!.position.x).toBeLessThanOrEqual(200+rules.movement.width/2);
    expect(blinkDestination(g.movement,{...map,width:200},rules.movement,0)!.position.x).toBe(200-rules.movement.width/2);
    const locked={...map,portals:[{id:'lock',x:200,y:600,targetMapId:'town',targetSpawnId:'left',requiredQuestId:'q01',minLevel:1}]};
    expect(blinkDestination(g.movement,locked,rules.movement,0)!.position.x).toBeLessThan(200);
    expect(blinkDestination(g.movement,locked,rules.movement,0,new Set(['q01']))!.position.x).toBe(g.movement.position.x+120);
    const cast=tick(g,0,0,'mage-blink');const moved=tick(cast,120,.12);
    expect(moved.movement.position.x).toBe(g.movement.position.x+120);
    expect(moved.invulnerableUntilMs).toBe(g.invulnerableUntilMs);expect(moved.saveData.player.mp).toBe(g.saveData.player.mp-12);
    const stuck={...map,walls:[{x:g.movement.position.x+rules.movement.width/2,y:500,width:10,height:100}]};
    const content={...catalog,world:{...world,maps:{...world.maps,camp:stuck}}};
    expect(tick(g,0,0,'mage-blink',idle,content).saveData.player.mp).toBe(g.saveData.player.mp);
  });
  it('regenerates MP after three seconds out of combat, respects caps and spends rank on blink cooldown',()=>{
    let g=game();g.saveData.player.mp-=10;const mp=g.saveData.player.mp;
    expect(tick(g,2990,2.99).saveData.player.mp).toBe(mp);
    g=tick(g,3000,.01);expect(g.saveData.player.mp).toBe(mp+2);
    expect(tick(g,3000,0).saveData.player.mp).toBe(mp+2);
    expect(tick(g,5000,0).saveData.player.mp).toBe(mp+2);
    g=tick(g,3500,.5,'mage-mana-bolt');expect(tick(g,6000,2.5).saveData.player.mp).toBe(mp+2-8);
    const ranked=game();ranked.saveData.player.skillRanks['mage-blink']=10;ranked.saveData.player.sp=6;
    expect(tick(ranked,0,0,'mage-blink').combat.cooldowns[ranked.playerEntityId]?.['mage-blink']).toBe(3200);
  });
  it('damages a boss with frost without slowing it and clears magic on death',()=>{
    let g=game();const map=world.maps['guardian-arena']!;const spawn=map.monsters[0]!;
    g.saveData.location={mapId:map.id,spawnId:map.spawns[0]!.id};
    g.movement.position={x:spawn.x-70,y:600};g.movement.footholdId=map.footholds.find(f=>f.y1===600)!.id;
    g.monsters=[createMonster(nextId(),spawn,map,rules)];const hp=g.monsters[0]!.hp;
    g=tick(tick(g,0,0,'mage-frost-ring'),400,.4);
    expect(g.monsters[0]!.hp).toBeLessThan(hp);expect(g.monsters[0]!.slowedUntilMs).toBeUndefined();
    g.monsters=[];g.combat=createCombatState();g=tick(tick(g,1000,0,'mage-mana-bolt'),1320,.32);
    expect(g.combat.projectiles).toHaveLength(1);g.saveData.player.hp=0;
    expect(tick(g,1340,.02).combat.projectiles??[]).toHaveLength(0);
  });
});
