import type { ErrorCode, PlayerProgress, RulesCatalog } from '../contracts/index.js';
import { applyProgressAction } from '../domain/progression/index.js';

export type MaterialSaleAction = Readonly<{
  bagIndex: number;
  quantity: number;
}>;

export type MaterialSaleCode = ErrorCode | 'NOT_AT_MERCHANT' | 'NO_MATERIALS' | null;

export type MaterialSalePreview = Readonly<{
  actions: readonly MaterialSaleAction[];
  candidateStacks: number;
  nominalProceeds: number;
  expectedSoldStacks: number;
  expectedRejectedStacks: number;
  expectedProceeds: number;
  disabled: boolean;
  reason: string | null;
  code: MaterialSaleCode;
}>;

export type MaterialSalePreviewInput = {
  player: PlayerProgress;
  rules: RulesCatalog;
  atMerchant: boolean;
};

export function collectMaterialSaleActions(
  player: PlayerProgress,
  rules: RulesCatalog,
): readonly MaterialSaleAction[] {
  const actions: MaterialSaleAction[] = [];

  for (let bagIndex = player.bag.length - 1; bagIndex >= 0; bagIndex -= 1) {
    const stack = player.bag[bagIndex];
    if (stack === undefined) continue;

    const item = rules.items[stack.itemId];
    if (item === undefined || item.kind !== 'material' || item.sellPrice <= 0) continue;

    actions.push(Object.freeze({ bagIndex, quantity: stack.quantity }));
  }

  return Object.freeze(actions);
}

function makePreview(
  actions: readonly MaterialSaleAction[],
  nominalProceeds: number,
  outcome: Omit<MaterialSalePreview, 'actions' | 'candidateStacks' | 'nominalProceeds'>,
): MaterialSalePreview {
  return Object.freeze({
    actions,
    candidateStacks: actions.length,
    nominalProceeds,
    ...outcome,
  });
}

export function previewMaterialSale(input: MaterialSalePreviewInput): MaterialSalePreview {
  const actions = collectMaterialSaleActions(input.player, input.rules);
  const nominalProceeds = actions.reduce((total, action) => {
    const stack = input.player.bag[action.bagIndex];
    const item = stack === undefined ? undefined : input.rules.items[stack.itemId];
    return total + (item === undefined ? 0 : item.sellPrice * action.quantity);
  }, 0);

  if (!input.atMerchant) {
    return makePreview(actions, nominalProceeds, {
      expectedSoldStacks: 0,
      expectedRejectedStacks: actions.length,
      expectedProceeds: 0,
      disabled: true,
      reason: '需在商人互動中出售',
      code: 'NOT_AT_MERCHANT',
    });
  }

  if (actions.length === 0) {
    return makePreview(actions, nominalProceeds, {
      expectedSoldStacks: 0,
      expectedRejectedStacks: 0,
      expectedProceeds: 0,
      disabled: true,
      reason: '沒有可出售的素材。',
      code: 'NO_MATERIALS',
    });
  }

  let simulatedPlayer = input.player;
  let expectedSoldStacks = 0;
  let expectedRejectedStacks = 0;
  let firstFailure: { code: ErrorCode; message: string } | null = null;

  for (const action of actions) {
    const result = applyProgressAction(
      simulatedPlayer,
      { type: 'sell', bagIndex: action.bagIndex, quantity: action.quantity },
      input.rules,
    );

    if (result.ok) {
      simulatedPlayer = result.value;
      expectedSoldStacks += 1;
      continue;
    }

    expectedRejectedStacks += 1;
    if (firstFailure === null) firstFailure = { code: result.code, message: result.message };
  }

  return makePreview(actions, nominalProceeds, {
    expectedSoldStacks,
    expectedRejectedStacks,
    expectedProceeds: simulatedPlayer.coins - input.player.coins,
    disabled: expectedSoldStacks === 0,
    reason: firstFailure?.message ?? null,
    code: firstFailure?.code ?? null,
  });
}
