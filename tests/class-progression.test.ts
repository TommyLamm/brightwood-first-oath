import { describe, expect, it } from 'vitest';
import { applyProgressAction, createPlayer, deriveStats } from '../src/domain/progression/index.js';
import { rulesCatalog as rules } from '../src/content/rules/index.js';
import type { PlayerProgress } from '../src/contracts/index.js';

function apply(player: PlayerProgress, action: Parameters<typeof applyProgressAction>[1]): PlayerProgress {
  const result = applyProgressAction(player, action, rules);
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

describe('class progression', () => {
  it('starts bow training with equal total attributes and an independent defensive tradeoff', () => {
    const sword = createPlayer('劍', rules);
    const bow = createPlayer('弓', rules, 'archer');
    expect(bow.str + bow.dex).toBe(sword.str + sword.dex);
    expect(bow.equipment.weapon).toBe('starter-bow');
    expect(deriveStats(bow, rules)).toMatchObject({ attack: 31, defense: 3, maxHp: 64, maxMp: 48 });
    const dex = apply(bow, { type: 'setLevelFloor', level: 2 });
    const result = apply(dex, { type: 'allocateAp', stat: 'dex', amount: 5 });
    expect(deriveStats(result, rules).attack - deriveStats(dex, rules).attack).toBe(10);
    expect(deriveStats(result, rules).defense).toBe(deriveStats(dex, rules).defense);
  });

  it('grants bow SP only after the selected route graduates and cannot repeat the graduation', () => {
    const beginner = apply(createPlayer('弓', rules, 'archer'), { type: 'setLevelFloor', level: 10 });
    expect(beginner.sp).toBe(0);
    expect(applyProgressAction(beginner, { type: 'changeJob', job: 'swordsman' }, rules).ok).toBe(false);
    const archer = apply(beginner, { type: 'changeJob', job: 'archer' });
    expect(archer).toMatchObject({ job: 'archer', sp: 1 });
    expect(applyProgressAction(archer, { type: 'changeJob', job: 'archer' }, rules).ok).toBe(false);
    const capped = apply(archer, { type: 'setLevelFloor', level: 30 });
    expect(capped.sp).toBe(21);
    expect(capped.hp).toBe(470);
    expect(capped.mp).toBe(135);
  });

  it('rejects cross-class skills and weapons without spending points or removing equipment', () => {
    const archer = apply(apply(createPlayer('弓', rules, 'archer'), { type: 'setLevelFloor', level: 10 }), { type: 'changeJob' });
    const before = structuredClone(archer);
    expect(applyProgressAction(archer, { type: 'learnSkill', skillId: 'heavy-strike' }, rules).ok).toBe(false);
    expect(archer).toEqual(before);
    const learned = apply(archer, { type: 'learnSkill', skillId: 'archer-double-shot' });
    expect(learned).toMatchObject({ sp: 0, skillRanks: { 'archer-double-shot': 1 } });
    const carryingSword = apply(learned, { type: 'addItem', stack: { itemId: 'iron-sword', quantity: 1 } });
    const bagIndex = carryingSword.bag.findIndex((stack) => stack.itemId === 'iron-sword');
    expect(applyProgressAction(carryingSword, { type: 'equip', bagIndex }, rules).ok).toBe(false);
    expect(carryingSword.equipment.weapon).toBe('starter-bow');
    expect(carryingSword.bag[bagIndex].quantity).toBe(1);
  });
});
