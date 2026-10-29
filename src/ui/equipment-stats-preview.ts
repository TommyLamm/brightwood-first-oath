import type { DerivedStats, Result } from '../contracts/index.js';
import { applyProgressAction, deriveStats } from '../domain/progression/index.js';
import type { EquipmentPreviewInput } from './equipment-preview.js';

export type EquipmentStatsPreview = {
  before: DerivedStats;
  after: DerivedStats;
};

/** Previews the domain equipment action as before/after derived stats only. */
export function previewEquipmentStats(input: EquipmentPreviewInput): Result<EquipmentStatsPreview> {
  const result = applyProgressAction(input.player, input.action, input.rules);
  if (!result.ok) return { ok: false, code: result.code, message: result.message };

  return {
    ok: true,
    value: {
      before: deriveStats(input.player, input.rules),
      after: deriveStats(result.value, input.rules),
    },
  };
}
