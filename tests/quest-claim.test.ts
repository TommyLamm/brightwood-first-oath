import { describe, expect, it } from 'vitest';
import type { ContentCatalog, Reward, SaveData } from '../src/contracts/index.js';
import { createNextEntityId } from '../src/contracts/helpers.js';
import { rulesCatalog } from '../src/content/rules/index.js';
import { worldCatalog } from '../src/content/world/index.js';
import { resolveQuestClaim } from '../src/domain/quests/claim.js';
import { startNewGame } from '../src/app/gameplay.js';

const catalog: ContentCatalog = { rules: rulesCatalog, world: worldCatalog };

function createSaveData(): SaveData {
  const started = startNewGame('測試旅人', catalog, createNextEntityId('quest-claim'));
  if ('error' in started) throw new Error(started.error);
  return structuredClone(started.gameplay.saveData);
}

function setReadyQuest(data: SaveData, questId: string, counters: Record<string, number>): void {
  data.quests[questId] = { status: 'active', counters };
}

function expectInputsUnchanged(
  data: SaveData,
  originalData: SaveData,
  sourceCatalog: ContentCatalog,
  originalCatalog: ContentCatalog,
): void {
  expect(data).toEqual(originalData);
  expect(sourceCatalog).toEqual(originalCatalog);
}

describe('resolveQuestClaim', () => {
  it('claims a ready quest and leaves save data and catalog unchanged', () => {
    const data = createSaveData();
    setReadyQuest(data, 'q01', { snail: 3 });
    const originalData = structuredClone(data);
    const originalCatalog = structuredClone(catalog);

    const result = resolveQuestClaim(data, 'q01', catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.value.nextQuests.q01?.status).toBe('claimed');
    expect(result.value.player.level).toBeGreaterThanOrEqual(3);
    expect(result.value.player.coins).toBe(originalData.player.coins + 80);
    expect(result.value.player.bag).toContainEqual({
      itemId: 'small-red',
      quantity: (originalData.player.bag.find((stack) => stack.itemId === 'small-red')?.quantity ?? 0) + 5,
    });
    expectInputsUnchanged(data, originalData, catalog, originalCatalog);
  });

  it('rejects a full bag when delivered items do not free enough reward space', () => {
    const scenarioCatalog = structuredClone(catalog);
    scenarioCatalog.world.quests.q04!.reward = {
      ...scenarioCatalog.world.quests.q04!.reward,
      items: [
        { itemId: 'leather-cap', quantity: 1 },
        { itemId: 'iron-helm', quantity: 1 },
      ],
    };
    const data = createSaveData();
    setReadyQuest(data, 'q04', { mushroom: 6 });
    data.player.bag = [
      ...Array.from({ length: 31 }, () => ({ itemId: 'snail-shell', quantity: 1 })),
      { itemId: 'spore-sample', quantity: 4 },
    ];
    const originalData = structuredClone(data);
    const originalCatalog = structuredClone(scenarioCatalog);

    const result = resolveQuestClaim(data, 'q04', scenarioCatalog);

    expect(result).toMatchObject({ ok: false, code: 'BAG_FULL' });
    expectInputsUnchanged(data, originalData, scenarioCatalog, originalCatalog);
  });

  it('claims from a full bag when the delivered item stack frees a reward slot', () => {
    const data = createSaveData();
    setReadyQuest(data, 'q04', { mushroom: 6 });
    data.player.bag = [
      ...Array.from({ length: 31 }, () => ({ itemId: 'snail-shell', quantity: 1 })),
      { itemId: 'spore-sample', quantity: 4 },
    ];
    const originalData = structuredClone(data);
    const originalCatalog = structuredClone(catalog);

    const result = resolveQuestClaim(data, 'q04', catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.value.nextQuests.q04?.status).toBe('claimed');
    expect(result.value.player.bag).toHaveLength(32);
    expect(result.value.player.bag).not.toContainEqual({ itemId: 'spore-sample', quantity: 4 });
    expect(result.value.player.bag).toContainEqual({ itemId: 'leather-cap', quantity: 1 });
    expectInputsUnchanged(data, originalData, catalog, originalCatalog);
  });

  it('claims when a full bag can merge the reward into an existing stack', () => {
    const scenarioCatalog = structuredClone(catalog);
    scenarioCatalog.world.quests.q01!.reward = {
      exp: 0,
      coins: 0,
      items: [{ itemId: 'snail-shell', quantity: 9 }],
    } satisfies Reward;
    const data = createSaveData();
    setReadyQuest(data, 'q01', { snail: 3 });
    data.player.bag = [
      { itemId: 'snail-shell', quantity: 990 },
      ...Array.from({ length: 31 }, () => ({ itemId: 'spore-sample', quantity: 1 })),
    ];
    const originalData = structuredClone(data);
    const originalCatalog = structuredClone(scenarioCatalog);

    const result = resolveQuestClaim(data, 'q01', scenarioCatalog);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.value.player.bag).toHaveLength(32);
    expect(result.value.player.bag[0]).toEqual({ itemId: 'snail-shell', quantity: 999 });
    expectInputsUnchanged(data, originalData, scenarioCatalog, originalCatalog);
  });

  it('accepts a reward at the coin cap and rejects one coin over without mutation', () => {
    const exactData = createSaveData();
    setReadyQuest(exactData, 'q01', { snail: 3 });
    exactData.player.coins = 9_999_919;
    const exactOriginal = structuredClone(exactData);
    const overflowData = createSaveData();
    setReadyQuest(overflowData, 'q01', { snail: 3 });
    overflowData.player.coins = 9_999_920;
    const overflowOriginal = structuredClone(overflowData);
    const originalCatalog = structuredClone(catalog);

    const exact = resolveQuestClaim(exactData, 'q01', catalog);
    const overflow = resolveQuestClaim(overflowData, 'q01', catalog);

    expect(exact.ok).toBe(true);
    if (exact.ok) expect(exact.value.player.coins).toBe(9_999_999);
    expect(overflow).toMatchObject({ ok: false, code: 'INVALID' });
    expectInputsUnchanged(exactData, exactOriginal, catalog, originalCatalog);
    expectInputsUnchanged(overflowData, overflowOriginal, catalog, originalCatalog);
  });

  it('raises the level floor before changing job, then applies the reward', () => {
    const data = createSaveData();
    data.quests.q01 = { status: 'claimed', counters: {} };
    setReadyQuest(data, 'q02', {});
    data.visitedMaps.push('town');
    const originalData = structuredClone(data);
    const originalCatalog = structuredClone(catalog);

    const result = resolveQuestClaim(data, 'q02', catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.value.player.level).toBeGreaterThanOrEqual(10);
    expect(result.value.player.job).toBe('swordsman');
    expect(result.value.nextQuests.q02?.status).toBe('claimed');
    expect(result.value.reward).toMatchObject({ minLevel: 10, job: 'swordsman' });
    expectInputsUnchanged(data, originalData, catalog, originalCatalog);
  });

  it('safely rejects unknown, incomplete, and already claimed quests', () => {
    const unknownData = createSaveData();
    const unknownOriginal = structuredClone(unknownData);
    const incompleteData = createSaveData();
    setReadyQuest(incompleteData, 'q01', { snail: 0 });
    const incompleteOriginal = structuredClone(incompleteData);
    const claimedData = createSaveData();
    claimedData.quests.q01 = { status: 'claimed', counters: { snail: 3 } };
    const claimedOriginal = structuredClone(claimedData);
    const originalCatalog = structuredClone(catalog);

    const unknown = resolveQuestClaim(unknownData, 'q999', catalog);
    const incomplete = resolveQuestClaim(incompleteData, 'q01', catalog);
    const claimed = resolveQuestClaim(claimedData, 'q01', catalog);

    expect(unknown).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(incomplete).toMatchObject({ ok: false, code: 'NOT_READY' });
    expect(claimed).toMatchObject({ ok: false, code: 'NOT_READY' });
    expectInputsUnchanged(unknownData, unknownOriginal, catalog, originalCatalog);
    expectInputsUnchanged(incompleteData, incompleteOriginal, catalog, originalCatalog);
    expectInputsUnchanged(claimedData, claimedOriginal, catalog, originalCatalog);
  });
});
