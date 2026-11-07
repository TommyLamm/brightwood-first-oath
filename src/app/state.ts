import type { AssetManifest } from '../contracts/asset-manifest.js';
import type { CommandDraft, GameCommand, PanelId } from '../contracts/commands.js';
import type { ContentCatalog } from '../contracts/definitions.js';
import type { HeroAnchorManifest } from '../contracts/hero-anchors.js';
import type { GameProfile, RandomSource, SaveStatus, SaveUpgradeRequired, UiSnapshot } from '../contracts/index.js';
import { createNextEntityId, createSeededRandom } from '../contracts/helpers.js';
import { deriveStats } from '../domain/progression/index.js';
import { getQuestView } from '../domain/quests/index.js';
import { applyPanelCommand, isWorldFrozen } from './panels.js';
import type { GameplayState } from './gameplay.js';
import { deriveCombatUiState } from './combat-ui-state.js';
import { deriveMovementHint } from './movement-hint.js';
import { portalBlockMessage, resolveInteractionTarget } from './interaction-target.js';
import { findPickupTarget } from './pickup-target.js';
import { deriveActiveGuard } from './guard-status.js';
import { classCatalog } from '../content/world/class-quests.js';

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
  lastUnavailableCommand: string | null;
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
    lastUnavailableCommand: null,
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
  return isWorldFrozen(state, state.windowFocused) || state.focusResumeRequired || Boolean(state.mapVisualLoad) || state.characterBusy;
}

/** Builds the single UI view model from app-owned state. */
export function createUiSnapshot(state: GameAppState): UiSnapshot | null {
  const gameplay = state.gameplay;
  const catalog = state.catalog && gameplay ? classCatalog(state.catalog, gameplay.saveData.player) : state.catalog;
  if (!catalog) return null;
  const saveData = gameplay?.saveData ?? null;
  const questViews = saveData
    ? Object.keys(catalog.world.quests).map((questId) => getQuestView(saveData, questId, catalog))
    : [];
  const stats = saveData ? deriveStats(saveData.player, catalog.rules) : null;
  const playerId = gameplay?.playerEntityId;
  const mapId = saveData?.location.mapId;
  const canShowInteractionHint = state.screen === 'playing'
    && !state.mapVisualLoad
    && !state.focusResumeRequired
    && state.panels.length === 0;
  let interactionHint: UiSnapshot['interactionHint'] = null;
  let pickupHint: UiSnapshot['pickupHint'] = null;
  if (gameplay && saveData && canShowInteractionHint) {
    const pickup = findPickupTarget(gameplay.drops, gameplay.movement.position, state.gameTimeMs, saveData.player, catalog.rules);
    if (pickup) {
      const { drop, result } = pickup;
      pickupHint = {
      targetKey: 'pickup:' + drop.id,
      label: drop.itemId === null ? drop.coins + ' 金幣'
        : (catalog.rules.items[drop.itemId]?.name ?? drop.itemId) + ' × ' + drop.quantity,
        blockedMessage: result.ok ? null : result.code === 'BAG_FULL' ? '背包已滿，請先整理空位' : result.message,
      };
    }
    const map = catalog.world.maps[mapId ?? ''];
    const target = resolveInteractionTarget(map, gameplay.movement.position);
    if (target?.kind === 'npc') {
      const npc = catalog.world.npcs[target.placement.npcId];
      if (npc) {
        interactionHint = {
          targetKey: 'npc:' + target.placement.npcId,
          kind: 'npc',
          label: npc.name,
          blockedMessage: null,
        };
      }
    } else if (target?.kind === 'portal') {
      interactionHint = {
        targetKey: 'portal:' + target.portal.id,
        kind: 'portal',
        label: catalog.world.maps[target.portal.targetMapId]?.name ?? target.portal.targetMapId,
        blockedMessage: portalBlockMessage(saveData, target.portal, catalog),
      };
    }
  }
  const combatUi = gameplay && (state.screen === 'playing' || state.screen === 'paused')
    ? deriveCombatUiState(gameplay, catalog, state.gameTimeMs)
    : { actionLockUntilMs: 0, bufferedSkillId: null };
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
    questViews,
    catalog,
    interfaceManifest: state.assetManifests?.find((manifest) => manifest.pack === 'interface') ?? null,
    actorManifest: state.assetManifests?.find((manifest) => manifest.pack === 'actors') ?? null,
    windowFocused: state.windowFocused,
    focusResumeRequired: state.focusResumeRequired,
    interactionHint,
    pickupHint,
    playerPosition: gameplay ? { ...gameplay.movement.position } : null,
    holdBasicAttack: state.holdBasicAttack,
    backgroundMotion: state.backgroundMotion,
    mapVisualLoad: state.mapVisualLoad ? { ...state.mapVisualLoad } : null,
    movementHint: gameplay && canShowInteractionHint
      ? deriveMovementHint(gameplay.movement, catalog.world.maps[mapId ?? ''], catalog.rules.movement) : null,
    combatUi,
    saveStatus: state.saveStatus,
    saveMessage: state.saveMessage,
    saveUpgrade: state.saveUpgrade,
    legacyImportAvailable: state.legacyImportAvailable,
    legacyImportMessage: state.legacyImportMessage,
    toast: gameplay?.toast ?? state.saveMessage,
    panels: [...state.panels],
    interaction: gameplay?.interaction ?? null,
    canReturnTown,
    nowMs: state.gameTimeMs,
    skillReadyAtMs: playerId && gameplay
      ? { ...(gameplay.combat.cooldowns[playerId] ?? {}) }
      : {},
    potionReadyAtMs: gameplay?.potionReadyAtMs ?? 0,
    guardUntilMs: gameplay?.guardUntilMs ?? 0,
    activeGuard: deriveActiveGuard(gameplay, catalog, state.gameTimeMs),
  };
}
