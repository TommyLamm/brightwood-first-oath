import type { EquipmentSlot, ErrorCode, PlayerProgress, RulesCatalog } from '../contracts/index.js';
import { applyProgressAction } from '../domain/progression/index.js';

export type EquipmentPreviewAction =
  | { type: 'equip'; bagIndex: number }
  | { type: 'unequip'; slot: EquipmentSlot };

export type EquipmentPreviewInput = {
  player: PlayerProgress;
  rules: RulesCatalog;
  action: EquipmentPreviewAction;
};

export type EquipmentActionPreview = {
  disabled: boolean;
  reason: string | null;
  code: ErrorCode | null;
};

/** Read-only equipment preview. The domain's cloned player is intentionally discarded. */
export function previewEquipmentAction(input: EquipmentPreviewInput): EquipmentActionPreview {
  const result = applyProgressAction(input.player, input.action, input.rules);
  if (!result.ok) {
    return { disabled: true, reason: result.message, code: result.code };
  }

  return { disabled: false, reason: null, code: null };
}
