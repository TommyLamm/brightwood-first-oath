import { describe, expect, it, vi } from 'vitest';
import type { AttackInstance, CombatActor, CombatState, RandomSource } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { createCombatState, stepCombat, tryAttack } from '../src/domain/combat/index.js';

function actor(overrides: Partial<CombatActor> = {}): CombatActor {
  return {
    id: 'player',
    position: { x: 100, y: 600 },
    facing: 1,
    hp: 100,
    stats: { maxHp: 100, maxMp: 40, attack: 50, defense: 10 },
    faction: 'player',
    body: { width: 24, height: 44 },
    knockbackImmune: false,
    skillRanks: { 'heavy-strike': 3, sweep: 4 },
    ...overrides,
  };
}

function fixedRandom(value = 0): RandomSource {
  return { next: () => value };
}

function prepareAttack(
  skillId = 'basic',
  source = actor(),
  state: CombatState = createCombatState(),
  nowMs = 1_000,
): { state: CombatState; attack: AttackInstance } {
  const result = tryAttack(state, { sourceId: source.id, skillId }, [source], rulesCatalog, nowMs, () => 'attack-1');
  if (!result.ok) throw new Error(`Failed to prepare test attack: ${result.code}`);
  return result.value;
}

describe('combat', () => {
  it('creates an empty state and prepares attacks with a fixed origin, facing, rank, and cooldown', () => {
    expect(createCombatState()).toEqual({ attacks: [], cooldowns: {} });
    const source = actor({
      position: { x: 123, y: 456 },
      facing: -1,
      skillRanks: { 'heavy-strike': 3 },
    });
    const original = createCombatState();
    const prepared = tryAttack(original, { sourceId: source.id, skillId: 'heavy-strike' }, [source], rulesCatalog, 1_000, () => 'attack-1');

    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.value.attack).toEqual({
      id: 'attack-1',
      sourceId: 'player',
      skillId: 'heavy-strike',
      startedAtMs: 1_000,
      facing: -1,
      origin: { x: 123, y: 456 },
      rank: 3,
      hitIds: [],
    });
    expect(prepared.value.state.cooldowns.player['heavy-strike']).toBe(1_650);
    expect(original).toEqual({ attacks: [], cooldowns: {} });
    expect(prepared.value.attack.origin).not.toBe(source.position);
  });

  it('rejects missing, dead, unlearned, non-attack, enemy-faction, cooldown, and action-locked requests without mutation', () => {
    const base = createCombatState();
    const missing = tryAttack(base, { sourceId: 'missing', skillId: 'basic' }, [], rulesCatalog, 1_000, vi.fn());
    expect(missing).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(tryAttack(base, { sourceId: 'player', skillId: 'basic' }, [actor({ hp: 0 })], rulesCatalog, 1_000, vi.fn()))
      .toMatchObject({ ok: false, code: 'DEAD' });
    expect(tryAttack(base, { sourceId: 'player', skillId: 'heavy-strike' }, [actor({ skillRanks: {} })], rulesCatalog, 1_000, vi.fn()))
      .toMatchObject({ ok: false, code: 'REQUIREMENT' });
    expect(tryAttack(base, { sourceId: 'player', skillId: 'iron-guard' }, [actor()], rulesCatalog, 1_000, vi.fn()))
      .toMatchObject({ ok: false, code: 'INVALID' });
    expect(tryAttack(base, { sourceId: 'player', skillId: 'enemy-melee' }, [actor()], rulesCatalog, 1_000, vi.fn()))
      .toMatchObject({ ok: false, code: 'REQUIREMENT' });

    const prepared = prepareAttack('basic');
    const cooldownAttempt = tryAttack(prepared.state, { sourceId: 'player', skillId: 'basic' }, [actor()], rulesCatalog, 1_100, vi.fn());
    expect(cooldownAttempt).toMatchObject({ ok: false, code: 'COOLDOWN' });
    const lockedAttempt = tryAttack(prepared.state, { sourceId: 'player', skillId: 'heavy-strike' }, [actor()], rulesCatalog, 1_100, vi.fn());
    expect(lockedAttempt).toMatchObject({ ok: false, code: 'NOT_READY' });
    expect(prepared.state.attacks).toHaveLength(1);
    expect(prepared.state.cooldowns.player.basic).toBe(1_550);
  });

  it('uses only the attack snapshot for facing and foot-pivot collision geometry', () => {
    const prepared = prepareAttack();
    const sourceAfterTurning = actor({ position: { x: 400, y: 600 }, facing: -1 });
    const frontTarget = actor({ id: 'front', position: { x: 145, y: 600 }, faction: 'enemy' });
    const behindTarget = actor({ id: 'behind', position: { x: 55, y: 600 }, faction: 'enemy' });
    const aboveTarget = actor({ id: 'above', position: { x: 145, y: 520 }, faction: 'enemy' });
    const belowTarget = actor({ id: 'below', position: { x: 145, y: 660 }, faction: 'enemy' });

    const result = stepCombat(prepared.state, [sourceAfterTurning, frontTarget, behindTarget, aboveTarget, belowTarget], rulesCatalog, 0.03, 1_200, fixedRandom());
    expect(result.hits.map((hit) => hit.targetId)).toEqual(['front']);
  });

  it('does not hit before the active window, hits on a tick crossing into it, and never repeats a target', () => {
    const source = actor();
    const target = actor({ id: 'enemy', position: { x: 145, y: 600 }, faction: 'enemy' });
    const prepared = prepareAttack('basic', source);

    const before = stepCombat(prepared.state, [source, target], rulesCatalog, 0.03, 1_179, fixedRandom());
    expect(before.hits).toHaveLength(0);
    const crossing = stepCombat(before.state, [source, target], rulesCatalog, 0.03, 1_200, fixedRandom());
    expect(crossing.hits.map((hit) => hit.targetId)).toEqual(['enemy']);
    expect(crossing.state.attacks[0]?.hitIds).toEqual(['enemy']);

    const wholeWindowStep = stepCombat(prepared.state, [source, target], rulesCatalog, 0.25, 1_300, fixedRandom());
    expect(wholeWindowStep.hits.map((hit) => hit.targetId)).toEqual(['enemy']);

    const repeated = stepCombat(crossing.state, [source, target], rulesCatalog, 0.02, 1_220, fixedRandom());
    expect(repeated.hits).toHaveLength(0);
    const after = stepCombat(repeated.state, [source, target], rulesCatalog, 0.02, 1_280, fixedRandom());
    expect(after.hits).toHaveLength(0);
    expect(after.state.attacks).toHaveLength(1);
    expect(stepCombat(after.state, [source, target], rulesCatalog, 0.02, 1_560, fixedRandom()).state.attacks).toHaveLength(0);
  });

  it('starts attacks crossed during the tick and reports dead or missing sources while clearing their attacks', () => {
    const state = prepareAttack('basic', actor(), createCombatState(), 1_010).state;
    const started = stepCombat(state, [actor()], rulesCatalog, 0.02, 1_020, fixedRandom());
    expect(started.started.map((attack) => attack.id)).toEqual(['attack-1']);

    const deadSource = stepCombat(state, [actor({ hp: 0 })], rulesCatalog, 0.02, 1_020, fixedRandom());
    expect(deadSource.rejected).toEqual([{ sourceId: 'player', code: 'DEAD' }]);
    expect(deadSource.state.attacks).toHaveLength(0);
    const missingSource = stepCombat(state, [], rulesCatalog, 0.02, 1_020, fixedRandom());
    expect(missingSource.rejected).toEqual([{ sourceId: 'player', code: 'NOT_FOUND' }]);
  });

  it('caps sweep at three nearest targets with deterministic entity-id tie breaking', () => {
    const source = actor({ skillRanks: { sweep: 4 } });
    const prepared = prepareAttack('sweep', source);
    const targets = [
      actor({ id: 'enemy-z', position: { x: 130, y: 600 }, faction: 'enemy' }),
      actor({ id: 'enemy-a', position: { x: 130, y: 600 }, faction: 'enemy' }),
      actor({ id: 'enemy-b', position: { x: 145, y: 600 }, faction: 'enemy' }),
      actor({ id: 'enemy-c', position: { x: 160, y: 600 }, faction: 'enemy' }),
    ];

    const result = stepCombat(prepared.state, [source, ...targets], rulesCatalog, 0.04, 1_280, fixedRandom());
    expect(result.hits.map((hit) => hit.targetId)).toEqual(['enemy-a', 'enemy-z', 'enemy-b']);
  });

  it('applies fixed-rank damage, seeded variance, away-from-source knockback, and boss immunity as Hit data', () => {
    const source = actor({ stats: { maxHp: 100, maxMp: 40, attack: 100, defense: 10 } });
    const prepared = prepareAttack('heavy-strike', source);
    const target = actor({
      id: 'boss',
      position: { x: 140, y: 600 },
      faction: 'enemy',
      stats: { maxHp: 100, maxMp: 0, attack: 20, defense: 10 },
      knockbackImmune: true,
    });
    const result = stepCombat(prepared.state, [source, target], rulesCatalog, 0.03, 1_230, fixedRandom(0));

    expect(result.hits).toEqual([{
      attackId: 'attack-1',
      sourceId: 'player',
      targetId: 'boss',
      damage: 133,
      knockback: { x: 0, y: 0 },
    }]);
    expect(target.hp).toBe(100);
  });

  it('lets enemy attacks target players in their stored facing direction and emits player knockback', () => {
    const source = actor({
      id: 'monster',
      position: { x: 100, y: 600 },
      facing: -1,
      faction: 'enemy',
      stats: { maxHp: 50, maxMp: 0, attack: 20, defense: 0 },
      skillRanks: {},
    });
    const prepared = prepareAttack('enemy-melee', source);
    expect(prepared.attack.rank).toBe(1);
    const player = actor({ id: 'player-target', position: { x: 60, y: 600 } });
    const result = stepCombat(prepared.state, [source, player], rulesCatalog, 0.03, 1_360, fixedRandom(0));

    expect(result.hits).toHaveLength(1);
    expect(result.hits[0]).toMatchObject({ targetId: 'player-target', damage: 14, knockback: { x: -140, y: -120 } });
  });
});
