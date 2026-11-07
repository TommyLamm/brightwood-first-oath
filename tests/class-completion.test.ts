import { describe, expect, it } from 'vitest';
import type { CombatActor, GameProfile, InputFrame, PlayerJob, PlayerProgress, SpecializationId } from '../src/contracts/index.js';
import { rulesCatalog as rules } from '../src/content/rules/index.js';
import { worldCatalog as world } from '../src/content/world/index.js';
import { advancedSkill, specializations } from '../src/content/rules/specializations.js';
import { resolveSkillSlot } from '../src/content/rules/jobs.js';
import { applyProgressAction, createPlayer, deriveStats } from '../src/domain/progression/index.js';
import { createCombatState, stepCombat, tryAttack } from '../src/domain/combat/index.js';
import { createMonster } from '../src/domain/actors/index.js';
import { startNewGame, stepGameplay, type GameplayState } from '../src/app/gameplay.js';
import { characterFromSave, createEmptyProfile } from '../src/persistence/profile.js';
import { applyProfileAction, type ProfileAction } from '../src/persistence/profile-actions.js';
import { measureProfile, prepareProfile } from '../src/persistence/validate.js';
import { deriveActiveGuard } from '../src/app/guard-status.js';

const catalog = { rules, world };
let seq = 0;
const nextId = () => `completion-${++seq}`;
const idle: InputFrame = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };
function fresh(route: PlayerJob = 'swordsman'): GameplayState {
  const result = startNewGame('晨芽', catalog, nextId, route);
  if ('error' in result) throw Error(result.error);
  return result.gameplay;
}
function roster(): GameProfile {
  const first = fresh(); const second = fresh('rogue');
  const profile = createEmptyProfile(first.saveData.settings);
  profile.slots[0]!.characterId = 'first'; profile.slots[1]!.characterId = 'second'; profile.activeCharacterId = 'first';
  profile.characters = { first: characterFromSave(first.saveData, 'first'), second: characterFromSave(second.saveData, 'second') };
  return profile;
}
function change(profile: GameProfile, action: ProfileAction): GameProfile {
  const result = applyProfileAction(profile, action, catalog); if (!result.ok) throw Error(result.message); return result.value;
}
function advance(branch: SpecializationId): PlayerProgress {
  let p = createPlayer('二轉', rules, specializations[branch].job);
  for (const action of [{ type: 'setLevelFloor', level: 10 }, { type: 'changeJob' }, { type: 'setLevelFloor', level: 20 }, { type: 'advanceJob', specialization: branch }] as const) {
    const result = applyProgressAction(p, action, rules); if (!result.ok) throw Error(result.message); p = result.value;
  }
  return p;
}
function actor(id: string, x: number, player?: PlayerProgress): CombatActor {
  return { id, position: { x, y: 600 }, facing: 1, hp: 10000, body: { width: 24, height: 48 }, knockbackImmune: true,
    stats: { maxHp: 10000, maxMp: 1000, attack: 100, defense: 0, critChance: 0 }, faction: player ? 'player' : 'enemy',
    skillRanks: player?.skillRanks ?? {}, ...(player?.specialization ? { specialization: player.specialization } : {}) };
}
function tick(g: GameplayState, nowMs: number, dtSeconds: number, skillId?: string): GameplayState {
  return stepGameplay(g, { catalog, commands: skillId ? [{ seq: ++seq, type: 'attack', payload: { skillId } }] : [],
    input: idle, nowMs, dtSeconds, random: { next: () => .5 }, nextEntityId: nextId }).gameplay!;
}

describe('format9 and atomic profile management', () => {
  it.each([1,2,3,4,5,6,7,8])('preserves historical format %i and adds zero LUK without spending AP', (format) => {
    const profile = roster(); delete profile.characters.second; profile.slots[1]!.characterId = null;
    const character = profile.characters.first!; delete character.player.luk;
    if (format <= 6) delete character.player.int;
    const { characterId: _id, ...save } = character;
    const old = format <= 5 ? { ...save, settings: profile.settings }
      : { activeCharacterId: profile.activeCharacterId, slots: profile.slots, characters: profile.characters, settings: profile.settings };
    const before = structuredClone(old);
    const prepared = prepareProfile(old, catalog, format);
    expect(prepared.ok).toBe(true); expect(old).toEqual(before);
    if (prepared.ok) {
      const p = Object.values(prepared.value.data.characters)[0]!.player;
      expect(p).toMatchObject({ name: '晨芽', str: 12, dex: 4, int: 4, luk: 0, ap: 0, coins: 120 });
      expect(p.bag).toEqual(character.player.bag);
      expect(prepared.value.data.warehouse).toEqual([]);
      expect(prepareProfile(prepared.value.data, catalog).ok).toBe(true);
    }
  });
  it('rejects future fields in historical saves and rejects invalid branch or AP budgets', () => {
    const p = roster(); const { warehouse: _w, deletedCharacter: _d, ...old } = p;
    expect(prepareProfile(old, catalog, 8).ok).toBe(false);
    p.characters.first!.player.specialization = 'thrower'; expect(prepareProfile(p, catalog).ok).toBe(false);
    delete p.characters.first!.player.specialization;
    p.characters.first!.player.luk = 1; expect(prepareProfile(p, catalog).ok).toBe(false);
  });
  it('renames safely, confirms deletion by name, preserves one backup and restores the same inventory and ID', () => {
    let p = roster(); const original = structuredClone(p);
    expect(applyProfileAction(p, { type: 'rename', characterId: 'first', name: ' ' }, catalog).ok).toBe(false);
    p = change(p, { type: 'rename', characterId: 'first', name: '新晨芽' });
    expect(p.characters.second).toEqual(original.characters.second);
    expect(applyProfileAction(p, { type: 'delete', characterId: 'first', confirmation: '晨芽' }, catalog).ok).toBe(false);
    const saved = structuredClone(p.characters.first);
    p = change(p, { type: 'delete', characterId: 'first', confirmation: '新晨芽' });
    expect(p.activeCharacterId).toBeNull(); expect(p.deletedCharacter).toEqual(saved); expect(p.slots[0]!.characterId).toBeNull();
    expect(applyProfileAction(p, { type: 'delete', characterId: 'second', confirmation: '晨芽' }, catalog).ok).toBe(false);
    expect(applyProfileAction(p, { type: 'purge', confirmation: '錯誤名稱' }, catalog).ok).toBe(false);
    p = change(p, { type: 'restore' }); expect(p.characters.first).toEqual(saved); expect(p.deletedCharacter).toBeNull();
    p = change(p, { type: 'delete', characterId: 'first', confirmation: '新晨芽' });
    p = change(p, { type: 'purge', confirmation: '新晨芽' }); expect(p.deletedCharacter).toBeNull();
    expect(original.characters.first!.player.name).toBe('晨芽');
  });
  it('expands only to six ordered slots and rejects overflow without mutating the profile', () => {
    let p = change(change(roster(), { type: 'expand' }), { type: 'expand' });
    expect(p.slots.map((slot) => slot.slotId)).toEqual(['slot-1','slot-2','slot-3','slot-4','slot-5','slot-6']);
    expect(applyProfileAction(p, { type: 'expand' }, catalog).ok).toBe(false);
    const before = structuredClone(p);
    p.characters.first!.player.name = '長'.repeat(40000);
    p.characters.second!.player.name = '長'.repeat(40000);
    expect(applyProfileAction(p, { type: 'expand' }, catalog).ok).toBe(false);
    expect(measureProfile(before).error).toBeNull();
  });
  it('moves exact quantities across characters and rejects stale item selections', () => {
    const original = roster(); let p = change(original, { type: 'transfer', characterId: 'first', from: 'bag', index: 0, itemId: 'small-red', quantity: 3 });
    expect(p.characters.first!.player.bag[0]!.quantity).toBe(7); expect(p.warehouse).toEqual([{ itemId: 'small-red', quantity: 3 }]);
    p = change(p, { type: 'transfer', characterId: 'second', from: 'warehouse', index: 0, itemId: 'small-red', quantity: 3 });
    expect(p.characters.second!.player.bag[0]!.quantity).toBe(13); expect(p.warehouse).toEqual([]);
    expect(applyProfileAction(p, { type: 'transfer', characterId: 'first', from: 'bag', index: 0, itemId: 'small-blue', quantity: 1 }, catalog).ok).toBe(false);
    expect(original.characters.first!.player.bag[0]!.quantity).toBe(10);
  });
  it('rolls back the whole transfer when warehouse or recipient bag is full, including partial merges', () => {
    const p = roster(); p.warehouse = Array.from({ length: 24 }, () => ({ itemId: 'starter-sword', quantity: 1 }));
    const before = structuredClone(p);
    expect(applyProfileAction(p, { type: 'transfer', characterId: 'first', from: 'bag', index: 0, itemId: 'small-red', quantity: 1 }, catalog).ok).toBe(false);
    expect(p).toEqual(before);
    p.warehouse = [{ itemId: 'small-red', quantity: 3 }];
    p.characters.second!.player.bag = [{ itemId: 'small-red', quantity: rules.items['small-red']!.stackLimit - 1 }, ...Array.from({ length: 31 }, () => ({ itemId: 'starter-sword', quantity: 1 }))];
    const full = structuredClone(p);
    expect(applyProfileAction(p, { type: 'transfer', characterId: 'second', from: 'warehouse', index: 0, itemId: 'small-red', quantity: 3 }, catalog).ok).toBe(false);
    expect(p).toEqual(full);
  });
});

describe('second advancement and combat', () => {
  it.each(Object.keys(specializations) as SpecializationId[])('%s preserves AP/SP and base skills and resolves an optional third-slot skill', (branch) => {
    const p = advance(branch);
    expect(p.ap).toBe(95); expect(p.sp).toBe(11); expect(p.skillRanks).toEqual({});
    expect(resolveSkillSlot(p, 3)).toBe(specializations[branch].skill);
    expect(applyProgressAction(p, { type: 'advanceJob', specialization: branch }, rules).ok).toBe(false);
    const disabled = applyProgressAction(p, { type: 'setAdvancedSkill', enabled: false }, rules);
    expect(disabled.ok && resolveSkillSlot(disabled.value, 3)).not.toBe(specializations[branch].skill);
    if (rules.skills[specializations[branch].skill]!.kind !== 'buff') {
      const source = actor('player', 100, p); const actors = [source, actor('target', 130)];
      const accepted = tryAttack(createCombatState(), { sourceId: 'player', skillId: advancedSkill(p)! }, actors, rules, 0, nextId);
      expect(accepted.ok).toBe(true);
      delete source.specialization;
      expect(tryAttack(createCombatState(), { sourceId: 'player', skillId: advancedSkill(p)! }, actors, rules, 0, nextId).ok).toBe(false);
    }
  });
  it('uses LUK in the same AP and critical formula and enforces caps', () => {
    const p = advance('shadowblade'); const before = deriveStats(p, rules);
    const result = applyProgressAction(p, { type: 'allocateAp', stat: 'luk', amount: 10 }, rules);
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.value.ap).toBe(85); expect(deriveStats(result.value, rules).critChance).toBeCloseTo(before.critChance + .02); }
    expect(deriveStats({ ...p, luk: 10000 }, rules).critChance).toBe(.3);
  });
  it('requires a matching Lv20 route and applies the backstab bonus only from behind', () => {
    expect(applyProgressAction(createPlayer('低等', rules), { type: 'advanceJob', specialization: 'guardian' }, rules).ok).toBe(false);
    const p = advance('shadowblade'); const source = actor('player', 100, p); const target = actor('target', 130);
    const hit = (facing: -1 | 1) => {
      target.facing = facing;
      const attack = tryAttack(createCombatState(), { sourceId: source.id, skillId: 'dagger-basic' }, [source,target], rules, 0, nextId);
      if (!attack.ok) throw Error(attack.message);
      return stepCombat(attack.value.state, [source,target], rules, .2, 180, { next: () => .5 }).hits[0]!.damage;
    };
    expect(hit(1)).toBeGreaterThan(hit(-1));
  });
  it('gives venom four finite ticks, freezes on dt0 and clears on death', () => {
    let g = fresh('rogue'); g.saveData.player = advance('shadowblade'); g.movement.mode = 'grounded'; g.movement.footholdId = 'camp:ground';
    const map = world.maps.camp!; const spawn = map.monsters[0]!; g.monsters = [createMonster(nextId(),spawn,map,rules)];
    const target = g.monsters[0]!; target.hp = 10000; target.idleUntilMs = 100000;
    g.movement.position = { x: spawn.x - 30, y: spawn.y };
    g = tick(g, 1, 0, 'shadowblade-venom'); g = tick(g, 170, .169);
    expect(g.poisons).toHaveLength(1);
    const hp = g.monsters[0]!.hp;
    g = tick(g, 1170, 0); expect(g.monsters[0]!.hp).toBe(hp);
    g = tick(g, 1170, 1); expect(g.monsters[0]!.hp).toBeLessThan(hp);
    for (const now of [2170,3170,4170]) g = tick(g,now,1);
    expect(g.poisons).toEqual([]);
    g.poisons = [{ targetId: target.id, damage: 1, nextTickAtMs: 5000, expiresAtMs: 9000 }]; g.saveData.player.hp = 0;
    g = tick(g, 4200, .03); expect(g.poisons).toBeUndefined();
  });
  it('skips poison ticks during boss transition without accumulating a burst afterward', () => {
    let g = fresh('rogue'); g.saveData.player = advance('shadowblade');
    const map = world.maps['ruins-bell-sanctum']!;
    g.saveData.location = { mapId: map.id, spawnId: map.spawns[0]!.id };
    g.movement.position = { x: 100, y: 600 };
    const boss = createMonster(nextId(), map.monsters[0]!, map, rules);
    boss.hp = 4000; boss.mode = 'phase-transition';
    boss.bellCycle = { sequenceIndex: 0, nextAttackAtMs: 2500, transitionStartedAtMs: 0, transitionEndsAtMs: 2500, transitionUsed: true };
    g.monsters = [boss];
    g.poisons = [{ targetId: boss.id, damage: 10, nextTickAtMs: 1000, expiresAtMs: 4000 }];
    g = tick(g, 1000, 1); g = tick(g, 2000, 1);
    expect(g.monsters[0]!.hp).toBe(4000);
    g = tick(g, 3000, 1);
    expect(g.monsters[0]!.hp).toBe(3990);
    expect(g.poisons?.[0]!.nextTickAtMs).toBe(4000);
  });
  it('guardian rally heals a bounded amount and expires without overwriting the original guard', () => {
    let g = fresh(); g.saveData.player = advance('guardian'); g.saveData.player.hp = 100;
    g = tick(g,1,0,'guardian-rally');
    expect(g.saveData.player.hp).toBe(100 + Math.floor(deriveStats(g.saveData.player,rules).maxHp*.08));
    expect(deriveActiveGuard(g,catalog,2)?.defenseBonus).toBe(20);
    expect(deriveActiveGuard(g,catalog,6002)).toBeNull(); expect(g.guardUntilMs).toBe(0);
  });
  it('siphon restores MP for actual monster hits, including its final piercing target', () => {
    let g = fresh('mage'); g.saveData.player = advance('arcanist'); g.movement.mode = 'grounded'; g.movement.footholdId = 'camp:ground';
    g.movement.position = { x: 800, y: 600 };
    const map = world.maps.camp!;
    g.monsters = map.monsters.slice(0,2).map((spawn) => { const m = createMonster(nextId(),spawn,map,rules); m.hp = 10000; m.idleUntilMs = 100000; return m; });
    const mp = g.saveData.player.mp;
    g = tick(g,1,0,'arcanist-siphon'); g = tick(g,301,.3); g = tick(g,601,.3); g = tick(g,901,.3);
    expect(g.monsters.every((m) => m.hp < 10000)).toBe(true);
    expect(g.saveData.player.mp).toBe(mp - 14 + 12);
  });
  it('three projectiles emit once each and the melee flurry has three independent hit windows', () => {
    const p = advance('thrower'); const source = actor('player',100,p);
    const accepted = tryAttack(createCombatState(),{sourceId:source.id,skillId:'thrower-shuriken'},[source],rules,0,nextId);
    if (!accepted.ok) throw Error(accepted.message);
    const first = stepCombat(accepted.value.state,[source],rules,.4,400,{next:()=>.5});
    expect(first.state.projectiles).toHaveLength(3); expect(new Set(first.state.projectiles!.map((a)=>a.id)).size).toBe(3);
    const next = stepCombat(first.state,[source],rules,.01,410,{next:()=>.5}); expect(next.state.projectiles).toHaveLength(3);
    const sword = actor('sword',100,advance('berserker')); const target = actor('target',130);
    const flurry = tryAttack(createCombatState(),{sourceId:sword.id,skillId:'berserker-flurry'},[sword,target],rules,0,nextId);
    if (!flurry.ok) throw Error(flurry.message);
    let state = flurry.value.state; let hits = 0; let previous = 0;
    for (const now of [250,410,570]) { const step = stepCombat(state,[sword,target],rules,(now-previous)/1000,now,{next:()=>.5}); hits += step.hits.length; state = step.state; previous = now; }
    expect(hits).toBe(3);
  });
});
