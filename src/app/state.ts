import type { AssetManifest } from '../contracts/asset-manifest.js';
import type { CommandDraft, GameCommand, PanelId } from '../contracts/commands.js';
import type { ContentCatalog } from '../contracts/definitions.js';
import type { HeroAnchorManifest } from '../contracts/hero-anchors.js';
import type { GameProfile, RandomSource, SaveStatus, SaveUpgradeRequired, UiSnapshot } from '../contracts/index.js';
import { createNextEntityId, createSeededRandom } from '../contracts/helpers.js';
import { deriveStats } from '../domain/progression/index.js';
import { activeTelegraphRemainingMs, bodyOverlapsTelegraph } from '../domain/combat/telegraph.js';
import { escapedRogueTrial } from '../domain/combat/rogue.js';
import { getQuestViews } from '../domain/quests/index.js';
import { questMarkerStates } from '../domain/quests/selection.js';
import { applyPanelCommand, isWorldFrozen } from './panels.js';
import { PASSIVE_RECOVERY_DELAY_MS, type GameplayState } from './gameplay.js';
import { deriveCombatUiState } from './combat-ui-state.js';
import { canShowContextHints, deriveMovementHint } from './movement-hint.js';
import { canTradeWithMerchant, isNearSpecializationMentor, portalBlockMessage, resolveInteractionTarget, unclaimedPortalQuest } from './interaction-target.js';
import { findPickupTarget } from './pickup-target.js';
import { deriveActiveGuard } from './guard-status.js';
import { COMBAT_TRIAL_TARGET_BODY, ROGUE_TRIAL_IDS, classCatalog, combatTrialAttack } from '../content/world/class-quests.js';
import { canChooseSpecialization, specializationMentors } from '../content/rules/specializations.js';
import { effectiveJob } from '../content/rules/jobs.js';
import { isBossMonster } from '../content/rules/monsters.js';

export type StartupStatus = 'loading' | 'ready' | 'incomplete';

export type GameAppState = {
  screen: UiSnapshot['screen'];
  panels: PanelId[];
  windowFocused: boolean;
  focusResumeRequired: boolean;
  gameTimeMs: number;
  worldRevision: number;
  mapVisualLoad: UiSnapshot['mapVisualLoad'];
  holdBasicAttack: boolean;
  backgroundMotion: boolean;
  startupStatus: StartupStatus;
  startupIssues: string[];
  catalog: ContentCatalog | null;
  assetManifests: AssetManifest[] | null;
  heroAnchors: HeroAnchorManifest | null;
  gameplay: GameplayState | null;
  profile: GameProfile | null;
  characterBusy: boolean;
  saveStatus: SaveStatus;
  saveMessage: string | null;
  saveUpgrade: SaveUpgradeRequired | null;
  legacyImportAvailable: boolean;
  legacyImportMessage: string | null;
  random: RandomSource;
  nextEntityId: () => string;
};

export type AppCommandResult = {
  state: GameAppState;
  handled: boolean;
};

export function createInitialAppState(seed = 0, sessionPrefix = 'game'): GameAppState {
  return {
    screen: 'loading',
    panels: [],
    windowFocused: true,
    focusResumeRequired: false,
    gameTimeMs: 0,
    worldRevision: 0,
    mapVisualLoad: null,
    holdBasicAttack: false,
    backgroundMotion: true,
    startupStatus: 'loading',
    startupIssues: [],
    catalog: null,
    assetManifests: null,
    heroAnchors: null,
    gameplay: null,
    profile: null,
    characterBusy: false,
    saveStatus: 'unavailable',
    saveMessage: null,
    saveUpgrade: null,
    legacyImportAvailable: false,
    legacyImportMessage: null,
    random: createSeededRandom(seed),
    nextEntityId: createNextEntityId(sessionPrefix),
  };
}

export function appCommand(state: GameAppState, command: CommandDraft | GameCommand): AppCommandResult {
  if (state.characterBusy) return { state, handled: true };
  if (command.type === 'setPanel' || command.type === 'closePanel') {
    const panelState = applyPanelCommand(state, command);
    return { state: { ...state, panels: panelState.panels }, handled: true };
  }
  if (command.type === 'togglePause') {
    if (!state.windowFocused || state.mapVisualLoad
      || (state.screen !== 'playing' && state.screen !== 'paused')
      || state.saveStatus === 'conflict'
      || state.saveStatus === 'localConflict'
      || (state.saveUpgrade !== null && state.saveUpgrade !== undefined)) {
      return { state, handled: true };
    }
    if (state.focusResumeRequired) {
      return {
        state: {
          ...state,
          screen: state.screen === 'paused' ? 'playing' : state.screen,
          focusResumeRequired: false,
        },
        handled: true,
      };
    }
    const panelState = applyPanelCommand(state, command);
    return { state: { ...state, screen: panelState.screen }, handled: true };
  }
  return { state, handled: false };
}

export function worldIsFrozen(state: GameAppState): boolean {
  return isWorldFrozen(state, state.windowFocused) || state.focusResumeRequired || Boolean(state.mapVisualLoad) || state.characterBusy
    || state.saveStatus === 'conflict' || state.saveStatus === 'localConflict';
}

/** Builds the single UI view model from app-owned state. */
export function createUiSnapshot(state: GameAppState): UiSnapshot | null {
  const gameplay = state.gameplay;
  const catalog = state.catalog && gameplay ? classCatalog(state.catalog, gameplay.saveData.player) : state.catalog;
  if (!catalog) return null;
  const saveData = gameplay?.saveData ?? null;
  const questViews = saveData
    ? getQuestViews(saveData, catalog)
    : [];
  const stats = saveData ? deriveStats(saveData.player, catalog.rules) : null;
  const playerId = gameplay?.playerEntityId;
  const mapId = saveData?.location.mapId;
  const map = mapId ? catalog.world.maps[mapId] : undefined;
  const boss = map?.boss && (state.screen === 'playing' || state.screen === 'paused')
    ? gameplay?.monsters.find(({ hp, monsterId }) => hp > 0 && isBossMonster(monsterId)) : undefined;
  const bossDefinition = boss ? catalog.rules.monsters[boss.monsterId] : undefined;
  const player = saveData?.player;
  let passiveRecovery: UiSnapshot['passiveRecovery'] = null;
  if (gameplay && player && stats && gameplay.nextRegenAtMs > state.gameTimeMs
    && state.gameTimeMs >= gameplay.attackOrDamageAtMs + PASSIVE_RECOVERY_DELAY_MS && !worldIsFrozen(state)) {
    if (effectiveJob(player) === 'mage') {
      if (player.mp < stats.maxMp) passiveRecovery = 'mp';
    } else if (player.hp < stats.maxHp) passiveRecovery = 'hp';
  }
  const canShowInteractionHint = canShowContextHints(state);
  let interactionHint: UiSnapshot['interactionHint'] = null;
  let pickupHint: UiSnapshot['pickupHint'] = null;
  if (gameplay && saveData && canShowInteractionHint) {
    const pickup = findPickupTarget(gameplay.drops, gameplay.movement.position, state.gameTimeMs, saveData.player, catalog.rules);
    if (pickup) {
      const { drop, result } = pickup;
      const item = drop.itemId === null ? undefined : catalog.rules.items[drop.itemId];
      const bagFull = !result.ok && result.code === 'BAG_FULL';
      pickupHint = {
      targetKey: 'pickup:' + drop.id,
      label: drop.itemId === null ? drop.coins + ' 金幣'
          : (item?.name ?? drop.itemId) + ' × ' + drop.quantity,
        ...(item?.iconKey ? { iconKey: item.iconKey } : {}),
        blockedMessage: result.ok ? null : bagFull ? '背包已滿，請先整理空位' : result.message,
        ...(bagFull ? { bagFull } : {}),
      };
    }
    const target = resolveInteractionTarget(map, gameplay.movement.position);
    if (target?.kind === 'npc') {
      const npc = catalog.world.npcs[target.placement.npcId];
      if (npc) {
        const questStatus = questMarkerStates(questViews, catalog.world.quests).get(npc.id);
        const trialAttack = combatTrialAttack(npc.id);
        const trial = trialAttack && questViews.find(({ questId }) => questId === 'q02');
        const objectives = trial?.status === 'active' ? trial.objectives : [];
        const unfinishedTrialTarget = objectives.some(({ targetId, current, required }) => targetId === npc.id && current < required);
        const retryEscape = npc.id === ROGUE_TRIAL_IDS[1] && !gameplay.rogueTrial
          && objectives.some(({ targetId, current, required }) => targetId === ROGUE_TRIAL_IDS[2] && current < required);
        const trialPrompt = unfinishedTrialTarget ? trialAttack
          : retryEscape && trialAttack ? { ...trialAttack, label: '重試撤離' } : undefined;
        const { position, facing, mode } = gameplay.movement;
        const behindPlayer = trialPrompt && (target.placement.x - position.x) * facing < -COMBAT_TRIAL_TARGET_BODY.width / 2;
        const turn = mode === 'grounded' && behindPlayer ? (facing === 1 ? 'moveLeft' : 'moveRight') : undefined;
        const specializationGuide = map?.id === 'town' && canChooseSpecialization(saveData.player)
          && npc.id === specializationMentors[effectiveJob(saveData.player)];
        let actionLabel = specializationGuide ? '查看二轉分支' : npc.role === 'merchant' ? '開啟商店'
          : npc.actorKey === 'actor:ruins-stele' ? '查看' : undefined;
        if (npc.role === 'healer' && stats) {
          const needsHp = saveData.player.hp < stats.maxHp;
          const needsMp = saveData.player.mp < stats.maxMp;
          if (needsHp && needsMp) actionLabel = '回復 HP／MP';
          else if (needsHp) actionLabel = '回復 HP';
          else if (needsMp) actionLabel = '回復 MP';
          else actionLabel = '交談';
        }
        interactionHint = {
          targetKey: 'npc:' + target.placement.npcId,
          kind: 'npc',
          label: npc.name,
          ...(actionLabel ? { actionLabel } : {}),
          ...(trialPrompt ? { trialAttack: turn ? { ...trialPrompt, turn } : trialPrompt } : {}),
          ...(specializationGuide ? { specializationGuide: true } : {}),
          ...(questStatus ? { questStatus } : {}),
          blockedMessage: null,
        };
      }
    } else if (target?.kind === 'portal') {
      const questId = unclaimedPortalQuest(saveData, target.portal);
      interactionHint = {
        targetKey: 'portal:' + target.portal.id,
        kind: 'portal',
        label: catalog.world.maps[target.portal.targetMapId]?.name ?? target.portal.targetMapId,
        blockedMessage: portalBlockMessage(saveData, target.portal, catalog),
        ...(questId && catalog.world.quests[questId] ? { blockedQuestId: questId } : {}),
      };
    }
  }
  const combatUi = deriveCombatUiState(state.screen === 'playing' || state.screen === 'paused' ? gameplay : null,
    catalog, state.gameTimeMs);
  let trialEscapeDirection: UiSnapshot['trialEscapeDirection'];
  const activeTrial = gameplay?.rogueTrial;
  if (canShowInteractionHint && gameplay && activeTrial && state.gameTimeMs < activeTrial.resolveAtMs) {
    const { position, facing } = gameplay.movement;
    if (!escapedRogueTrial(position, activeTrial.position, catalog.rules.movement.width)) {
      const offset = position.x - activeTrial.position.x;
      trialEscapeDirection = (offset === 0 ? facing : offset) < 0 ? 'moveLeft' : 'moveRight';
    }
  }
  const panelDanger = Boolean(gameplay && gameplay.saveData.player.hp > 0 && state.panels.length > 0
    && !worldIsFrozen(state) && gameplay.telegraphs.some((telegraph) =>
      activeTelegraphRemainingMs(telegraph, state.gameTimeMs) !== null
      && bodyOverlapsTelegraph(gameplay.movement.position, catalog.rules.movement, telegraph.rect)));
  const canReturnTown = gameplay !== null
    && mapId !== 'town'
    && (state.screen === 'playing' || state.screen === 'result')
    && (mapId !== 'guardian-arena' || gameplay.bossResult)
    && (mapId !== 'frost-tide-cavern' || gameplay.bossResult)
    && (mapId !== 'sand-sunwell-altar' || gameplay.bossResult)
    && (mapId !== 'ruins-bell-sanctum' || (gameplay.bossResult && state.screen === 'result'))
    // Before the hero has reached 木葉鎮, 返回城鎮 would skip camp's q01 gate.
    && (mapId === 'ruins-bell-sanctum' && gameplay.bossResult && state.screen === 'result'
      || saveData?.visitedMaps.includes('town') === true);

  return {
    screen: state.screen,
    profile: state.profile,
    characterBusy: state.characterBusy,
    aimReady: state.gameplay?.aimReady === true,
    ...(state.startupIssues.length > 0 ? { error: state.startupIssues.at(-1) } : {}),
    saveData,
    stats,
    passiveRecovery,
    panelDanger,
    bossVitals: boss && bossDefinition ? {
      name: bossDefinition.name,
      hp: boss.hp,
      maxHp: bossDefinition.maxHp,
      phase: boss.phase,
      changingPhase: boss.mode === 'phase-transition',
    } : null,
    questViews,
    catalog,
    interfaceManifest: state.assetManifests?.find((manifest) => manifest.pack === 'interface') ?? null,
    actorManifest: state.assetManifests?.find((manifest) => manifest.pack === 'actors') ?? null,
    windowFocused: state.windowFocused,
    focusResumeRequired: state.focusResumeRequired,
    interactionHint,
    pickupHint,
    trialEscapeDirection,
    playerPosition: gameplay ? { ...gameplay.movement.position } : null,
    ...(gameplay && state.panels.at(-1) === 'map' ? { localMapDrops: gameplay.drops } : {}),
    holdBasicAttack: state.holdBasicAttack,
    backgroundMotion: state.backgroundMotion,
    mapVisualLoad: state.mapVisualLoad ? { ...state.mapVisualLoad } : null,
    movementHint: gameplay && canShowInteractionHint
      ? deriveMovementHint(gameplay.movement, map, catalog.rules.movement) : null,
    combatUi,
    saveStatus: state.saveStatus,
    saveMessage: state.saveMessage,
    saveUpgrade: state.saveUpgrade,
    legacyImportAvailable: state.legacyImportAvailable,
    legacyImportMessage: state.legacyImportMessage,
    toast: gameplay?.toast ?? state.saveMessage,
    panels: [...state.panels],
    interaction: gameplay?.interaction ?? null,
    canTrade: gameplay !== null && canTradeWithMerchant(map, gameplay.movement.position, gameplay.interaction?.npcId),
    nearSpecializationMentor: (state.panels.at(-1) === 'skills' || state.panels.at(-1) === 'dialogue') && gameplay !== null && player !== undefined
      && canChooseSpecialization(player)
      && isNearSpecializationMentor(map, gameplay.movement.position, effectiveJob(player)),
    canReturnTown,
    nowMs: state.gameTimeMs,
    skillReadyAtMs: playerId && gameplay
      ? { ...(gameplay.combat.cooldowns[playerId] ?? {}) }
      : {},
    potionReadyAtMs: gameplay?.potionReadyAtMs ?? 0,
    guardUntilMs: gameplay?.guardUntilMs ?? 0,
    rallyUntilMs: gameplay?.rallyUntilMs ?? 0,
    activeGuard: deriveActiveGuard(gameplay, catalog, state.gameTimeMs),
  };
}
