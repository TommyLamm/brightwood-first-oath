import type {
  ContentCatalog,
  Id,
  PlayerProgress,
  QuestClaimPlan,
  Result,
  SaveData,
} from '../../contracts/index.js';
import { applyProgressAction } from '../progression/index.js';
import { planQuestClaim } from './index.js';

export type ResolvedQuestClaim = {
  player: PlayerProgress;
  nextQuests: QuestClaimPlan['nextQuests'];
  reward: QuestClaimPlan['reward'];
};

/** Calculate a full quest claim without changing its save data or catalog inputs. */
export function resolveQuestClaim(
  data: SaveData,
  questId: Id,
  catalog: ContentCatalog,
): Result<ResolvedQuestClaim> {
  const claim = planQuestClaim(data, questId, catalog);
  if (!claim.ok) return claim;

  let updated = applyProgressAction(
    data.player,
    { type: 'removeItems', items: claim.value.removeItems },
    catalog.rules,
  );
  if (!updated.ok) return updated;

  let claimedPlayer = updated.value;
  if (claim.value.reward.minLevel !== undefined) {
    updated = applyProgressAction(
      claimedPlayer,
      { type: 'setLevelFloor', level: claim.value.reward.minLevel },
      catalog.rules,
    );
    if (!updated.ok) return updated;
    claimedPlayer = updated.value;
  }

  if (claim.value.reward.job === 'swordsman') {
    updated = applyProgressAction(claimedPlayer, { type: 'changeJob' }, catalog.rules);
    if (!updated.ok) return updated;
    claimedPlayer = updated.value;
  }

  updated = applyProgressAction(
    claimedPlayer,
    { type: 'gainReward', reward: { ...claim.value.reward, minLevel: undefined, job: undefined } },
    catalog.rules,
  );
  if (!updated.ok) return updated;

  return {
    ok: true,
    value: {
      player: updated.value,
      nextQuests: claim.value.nextQuests,
      reward: claim.value.reward,
    },
  };
}
