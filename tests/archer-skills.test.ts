import { describe, expect, it } from 'vitest';
import type { ContentCatalog, GameCommand, InputFrame } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { startNewGame, stepGameplay, type GameplayState } from '../src/app/gameplay.js';
import { KeyboardInputState } from '../src/app/keyboard.js';
import { deriveStats } from '../src/domain/progression/index.js';
import { applyMonsterHit, createMonster, stepActors } from '../src/domain/actors/index.js';

const catalog: ContentCatalog = { rules: rulesCatalog, world: worldCatalog };
const idle: InputFrame = { moveX: 0, climbY: 0, jumpPressed: false, downHeld: false };
let sequence = 0;
const nextId = (): string => `archer-${++sequence}`;
function game(): GameplayState {
  const started = startNewGame('弓術測試', catalog, nextId, 'archer');
  if ('error' in started) throw new Error(started.error);
  const gameplay = started.gameplay;
  gameplay.monsters = [];
  gameplay.saveData.player = { ...gameplay.saveData.player, job: 'archer', level: 30, ap: 145, sp: 8,
    skillRanks: { 'archer-double-shot': 1, 'archer-piercing-shot': 1, 'archer-retreat-shot': 1,
      'archer-bow-mastery': 5, 'archer-steady-aim': 5 } };
  const stats = deriveStats(gameplay.saveData.player, rulesCatalog);
  gameplay.saveData.player.hp = stats.maxHp; gameplay.saveData.player.mp = stats.maxMp;
  gameplay.movement.mode = 'grounded';
  gameplay.movement.footholdId = worldCatalog.maps.camp!.footholds.find((line) => line.y1 === 600 && line.x1 <= 150 && line.x2 >= 150)!.id;
  return gameplay;
}
function tick(current: GameplayState, nowMs: number, dtSeconds: number, skillId?: string, input = idle, content = catalog): GameplayState {
  const commands: GameCommand[] = skillId ? [{ type: 'attack', payload: { skillId }, seq: ++sequence }] : [];
  return stepGameplay(current, { catalog: content, commands, input, dtSeconds, nowMs, random: { next: () => 0.5 }, nextEntityId: nextId }).gameplay!;
}

describe('archer skills', () => {
  it('fires twice for one MP/cooldown transaction and cancels the unfired second arrow after interruption', () => {
    const original = game();
    const cast = tick(original, 0, 0, 'archer-double-shot');
    expect(cast.saveData.player.mp).toBe(original.saveData.player.mp - 6);
    expect(cast.combat.cooldowns[cast.playerEntityId]?.['archer-double-shot']).toBe(850);
    const first = tick(cast, 180, 0.18);
    expect(first.combat.projectiles).toHaveLength(1);
    const both = tick(first, 300, 0.12);
    expect(both.combat.projectiles).toHaveLength(2);
    expect(both.saveData.player.mp).toBe(cast.saveData.player.mp);
    const interrupted = structuredClone(first);
    interrupted.movement.knockbackUntilMs = 500;
    const stopped = tick(interrupted, 300, 0.12);
    expect(stopped.combat.projectiles).toHaveLength(1);
    expect(stopped.combat.projectiles![0]!.id).toMatch(/:arrow:0$/);
    expect(stopped.combat.attacks).toHaveLength(0);
    expect(stopped.saveData.player.mp).toBe(cast.saveData.player.mp);
  });

  it('charges aim with simulation time, clears it on movement, and snapshots mastery plus one first-arrow bonus', () => {
    let current = tick(game(), 599, 0.599);
    expect(current.aimReady).toBe(false);
    current = tick(current, 599, 0);
    expect(current.aimReady).toBe(false);
    current = tick(current, 600, 0.001);
    expect(current.aimReady).toBe(true);
    current = tick(current, 610, 0.01, undefined, { ...idle, moveX: 1 });
    expect(current.aimReady).not.toBe(true);
    current = tick(current, 1210, 0.6);
    expect(current.aimReady).toBe(true);
    const attack = tick(current, 1210, 0, 'archer-double-shot');
    expect(attack.aimReady).not.toBe(true);
    expect(attack.combat.attacks[0]!.projectileStats!.attack).toBeCloseTo(deriveStats(current.saveData.player, rulesCatalog).attack);
    const arrows = tick(attack, 1510, 0.3).combat.projectiles!;
    expect(arrows).toHaveLength(2);
    expect(arrows[0]!.firstHitBonus).toBe(0.1);
    expect(arrows[1]!.firstHitBonus).toBeUndefined();
  });

  it('keeps aim and MP when an attack is rejected, and maps the keyboard to the active job slots', () => {
    const current = game(); current.aimReady = true; current.aimStillMs = 600; current.saveData.player.mp = 0;
    const rejected = tick(current, 0, 0, 'archer-double-shot');
    expect(rejected.combat.attacks).toHaveLength(0);
    expect(rejected.saveData.player.mp).toBe(0);
    expect(rejected.aimReady).toBe(true);
    const keyboard = new KeyboardInputState();
    keyboard.setAttackSkills(['bow-basic', 'archer-double-shot', 'archer-piercing-shot', 'archer-retreat-shot']);
    const context = { focused: true, textInput: false, panels: [] };
    expect(keyboard.keyDown('ControlLeft', context).command).toMatchObject({ payload: { skillId: 'bow-basic' } });
    expect(keyboard.keyDown('Digit1', context).command).toMatchObject({ payload: { skillId: 'archer-double-shot' } });
    expect(keyboard.keyDown('Digit3', context).command).toMatchObject({ payload: { skillId: 'archer-retreat-shot' } });
  });

  it('caps retreat at 100px, preserves direction and rejects blocked or airborne starts without spending MP', () => {
    const original = game();
    let current = tick(original, 0, 0, 'archer-retreat-shot');
    for (let time = 20; time <= 220; time += 20) current = tick(current, time, 0.02);
    expect(original.movement.position.x - current.movement.position.x).toBeLessThanOrEqual(100.001);
    expect(original.movement.position.x - current.movement.position.x).toBeGreaterThan(80);
    expect(current.movement.facing).toBe(1);
    expect(current.saveData.player.mp).toBe(original.saveData.player.mp - 8);
    const wall = { ...worldCatalog.maps.camp!, walls: [{ x: 120, y: 500, width: 18, height: 100 }] };
    const content = { ...catalog, world: { ...worldCatalog, maps: { ...worldCatalog.maps, camp: wall } } };
    const blocked = tick(original, 0, 0, 'archer-retreat-shot', idle, content);
    expect(blocked.saveData.player.mp).toBe(original.saveData.player.mp);
    expect(blocked.combat.attacks).toHaveLength(0);
    const partialWall = { ...wall, walls: [{ x: 100, y: 500, width: 1, height: 100 }] };
    const partialContent = { ...content, world: { ...content.world, maps: { ...content.world.maps, camp: partialWall } } };
    let partial = tick(original, 0, 0, 'archer-retreat-shot', idle, partialContent);
    for (let time = 20; time <= 220; time += 20) partial = tick(partial, time, 0.02, undefined, idle, partialContent);
    expect(partial.movement.position.x).toBeGreaterThanOrEqual(113);
    expect(partial.saveData.player.mp).toBe(original.saveData.player.mp - 8);
    const airborne = structuredClone(original); airborne.movement.mode = 'airborne';
    expect(tick(airborne, 0, 0, 'archer-retreat-shot').saveData.player.mp).toBe(original.saveData.player.mp);
  });

  it('routes archer basic attacks through flight and clears arrows plus aim when changing maps', () => {
    let current = tick(game(), 0, 0, 'basic');
    expect(current.combat.attacks[0]!.skillId).toBe('bow-basic');
    current = tick(current, 180, 0.18);
    expect(current.combat.projectiles).toHaveLength(1);
    current.saveData.visitedMaps.push('town');
    current.aimReady = true;
    const changed = stepGameplay(current, { catalog, input: idle, commands: [{ type: 'returnTown', payload: {}, seq: ++sequence }],
      dtSeconds: 0, nowMs: 180, random: { next: () => 0.5 }, nextEntityId: nextId });
    expect(changed.screen).toBe('loading');
    expect(changed.gameplay!.combat.projectiles ?? []).toHaveLength(0);
    expect(changed.gameplay!.aimReady).toBeUndefined();
  });

  it('makes a ranged-hit monster react within bounded pursuit without changing normal melee aggro', () => {
    const map = worldCatalog.maps.camp!;
    const monster = createMonster('snail-target', map.monsters[0]!, map, rulesCatalog);
    const attacked = applyMonsterHit([monster], { attackId: 'arrow', sourceId: 'hero', targetId: monster.id, damage: 1,
      critical: false, projectile: true, knockback: { x: 0, y: 0 } }, 0)[0]!;
    const player = { id: 'hero', position: { x: 700, y: 600 }, facing: 1 as const, hp: 100,
      stats: { maxHp: 100, maxMp: 40, attack: 30, defense: 0, critChance: 0 }, faction: 'player' as const,
      body: { width: 24, height: 44 }, knockbackImmune: false, skillRanks: {} };
    const next = stepActors([attacked], player, map, rulesCatalog, 1 / 60, 100).monsters[0]!;
    expect(next.mode).toBe('chase');
    expect(next.movement.position.x).toBeGreaterThanOrEqual(map.monsters[0]!.roamLeft);
    expect(monster.provokedUntilMs).toBeUndefined();
  });
});
