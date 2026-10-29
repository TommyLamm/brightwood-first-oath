import { describe, expect, it } from 'vitest';
import type { PlayerProgress } from '../src/contracts/index.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { createPlayer } from '../src/domain/progression/index.js';
import { resolveItemUse } from '../src/app/item-use.js';

function playerWith(
  bag: PlayerProgress['bag'],
  vitals: Partial<Pick<PlayerProgress, 'hp' | 'mp'>> = {},
): PlayerProgress {
  return {
    ...createPlayer('測試旅人', rulesCatalog),
    ...vitals,
    bag: structuredClone(bag),
  };
}

function useItem(player: PlayerProgress, requestedItemId: string, nowMs = 2000, potionReadyAtMs = 0) {
  return resolveItemUse({ player, rules: rulesCatalog, requestedItemId, nowMs, potionReadyAtMs });
}

function expectInputsUnchanged(player: PlayerProgress, beforePlayer: PlayerProgress, beforeRules: typeof rulesCatalog): void {
  expect(player).toEqual(beforePlayer);
  expect(rulesCatalog).toEqual(beforeRules);
}

describe('resolveItemUse', () => {
  it('checks cooldown first, rejects before the deadline, and accepts exactly at it', () => {
    const player = playerWith([{ itemId: 'small-red', quantity: 1 }], { hp: 20 });
    const beforePlayer = structuredClone(player);
    const beforeRules = structuredClone(rulesCatalog);

    const cooling = useItem(player, 'unknown-item', 999, 1000);
    expect(cooling).toEqual({ ok: false, code: 'COOLDOWN', message: '藥水還在冷卻中。' });

    const ready = useItem(player, 'small-red', 1000, 1000);
    expect(ready.ok).toBe(true);
    if (!ready.ok) throw new Error(ready.message);
    expect(ready.value.itemId).toBe('small-red');
    expect(ready.value.player.hp).toBe(80);
    expect(ready.value.player.bag).toEqual([]);
    expectInputsUnchanged(player, beforePlayer, beforeRules);
  });

  it('uses the requested small potion while it is in stock, even when a large one is available', () => {
    const player = playerWith([
      { itemId: 'small-red', quantity: 1 },
      { itemId: 'large-red', quantity: 2 },
    ], { hp: 20 });
    const beforePlayer = structuredClone(player);
    const beforeRules = structuredClone(rulesCatalog);

    const result = useItem(player, 'small-red');

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.value.itemId).toBe('small-red');
    expect(result.value.player.hp).toBe(80);
    expect(result.value.player.bag).toEqual([{ itemId: 'large-red', quantity: 2 }]);
    expectInputsUnchanged(player, beforePlayer, beforeRules);
  });

  it('falls back from an empty small red or blue stack to its matching large potion', () => {
    const scenarios = [
      { requested: 'small-red', resolved: 'large-red', hp: 20, mp: 10, nextHp: 80, nextMp: 10 },
      { requested: 'small-blue', resolved: 'large-blue', hp: 20, mp: 10, nextHp: 20, nextMp: 40 },
    ] as const;

    for (const scenario of scenarios) {
      const player = playerWith([{ itemId: scenario.resolved, quantity: 1 }], { hp: scenario.hp, mp: scenario.mp });
      const beforePlayer = structuredClone(player);
      const beforeRules = structuredClone(rulesCatalog);

      const result = useItem(player, scenario.requested);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.message);
      expect(result.value.itemId).toBe(scenario.resolved);
      expect(result.value.player.hp).toBe(scenario.nextHp);
      expect(result.value.player.mp).toBe(scenario.nextMp);
      expect(result.value.player.bag).toEqual([]);
      expectInputsUnchanged(player, beforePlayer, beforeRules);
    }
  });

  it('does not replace a requested large potion with a small one and keeps the restock message', () => {
    const player = playerWith([{ itemId: 'small-red', quantity: 1 }], { hp: 20 });
    const beforePlayer = structuredClone(player);
    const beforeRules = structuredClone(rulesCatalog);

    const missingLarge = useItem(player, 'large-red');
    expect(missingLarge).toEqual({
      ok: false,
      code: 'NOT_FOUND',
      message: '大紅藥水已經用完了，可向木葉鎮的木葉商人補貨。',
    });

    const noRedStock = playerWith([], { hp: 20 });
    const beforeNoRedStock = structuredClone(noRedStock);
    const missingSmall = useItem(noRedStock, 'small-red');
    expect(missingSmall).toEqual({
      ok: false,
      code: 'NOT_FOUND',
      message: '小紅藥水已經用完了，可向木葉鎮的木葉商人補貨。',
    });
    expectInputsUnchanged(noRedStock, beforeNoRedStock, beforeRules);
    expectInputsUnchanged(player, beforePlayer, beforeRules);
  });

  it('returns the domain rejection for full HP, full MP, and a dead player', () => {
    const scenarios = [
      {
        player: playerWith([{ itemId: 'small-red', quantity: 1 }]),
        itemId: 'small-red',
        code: 'REQUIREMENT',
        message: 'HP 已滿，現在使用小紅藥水不會有效果。',
      },
      {
        player: playerWith([{ itemId: 'small-blue', quantity: 1 }]),
        itemId: 'small-blue',
        code: 'REQUIREMENT',
        message: 'MP 已滿，現在使用小藍藥水不會有效果。',
      },
      {
        player: playerWith([{ itemId: 'small-red', quantity: 1 }], { hp: 0 }),
        itemId: 'small-red',
        code: 'DEAD',
        message: '倒下時不能使用藥水。',
      },
    ] as const;

    for (const scenario of scenarios) {
      const beforePlayer = structuredClone(scenario.player);
      const beforeRules = structuredClone(rulesCatalog);
      const result = useItem(scenario.player, scenario.itemId);
      expect(result).toEqual({ ok: false, code: scenario.code, message: scenario.message });
      expectInputsUnchanged(scenario.player, beforePlayer, beforeRules);
    }
  });

  it('passes unknown and non-consumable item failures through from the domain', () => {
    const player = playerWith([]);
    const beforePlayer = structuredClone(player);
    const beforeRules = structuredClone(rulesCatalog);

    const unknown = useItem(player, 'unknown-item');
    expect(unknown).toEqual({ ok: false, code: 'NOT_FOUND', message: '找不到物品：unknown-item。' });

    const nonConsumable = useItem(player, 'snail-shell');
    expect(nonConsumable).toEqual({ ok: false, code: 'REQUIREMENT', message: '「蝸殼」不能使用。' });
    expectInputsUnchanged(player, beforePlayer, beforeRules);
  });
});
