import type { AssetManifest } from '../contracts/asset-manifest.js';
import type { CommandDraft, GameCommand, PanelId } from '../contracts/commands.js';
import type { ContentCatalog } from '../contracts/definitions.js';
import type { HeroAnchorManifest } from '../contracts/hero-anchors.js';
import type { RandomSource, SaveStatus, SaveUpgradeRequired, UiSnapshot } from '../contracts/index.js';
import { createNextEntityId, createSeededRandom } from '../contracts/helpers.js';
import { deriveStats } from '../domain/progression/index.js';
import { getQuestView } from '../domain/quests/index.js';
import { applyPanelCommand, isWorldFrozen } from './panels.js';
import type { GameplayState } from './gameplay.js';
import { deriveCombatUiState } from './combat-ui-state.js';
import { portalBlockMessage, resolveInteractionTarget } from './interaction-target.js';

export type StartupStatus = 'loading' | 'ready' | 'incomplete';

export type GameAppState = {
  screen: UiSnapshot['screen'];
  panels: PanelId[];
  windowFocused: boolean;
  focusResumeRequired: boolean;
  gameTimeMs: number;
  worldRevision: number;
  startupStatus: StartupStatus;
  startupIssues: string[];
  catalog: ContentCatalog | null;
  assetManifests: AssetManifest[] | null;
  heroAnchors: HeroAnchorManifest | null;
  gameplay: GameplayState | null;
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
    startupStatus: 'loading',
    startupIssues: [],
    catalog: null,
    assetManifests: null,
    heroAnchors: null,
    gameplay: null,
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
  if (command.type === 'setPanel' || command.type === 'closePanel') {
    const panelState = applyPanelCommand(state, command);
    return { state: { ...state, panels: panelState.panels }, handled: true };
  }
  if (command.type === 'togglePause') {
    if (!state.windowFocused
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
  return isWorldFrozen(state, state.windowFocused) || state.focusResumeRequired;
}

/** Builds the single UI view model from app-owned state. */
export function createUiSnapshot(state: GameAppState): UiSnapshot | null {
  const catalog = state.catalog;
  if (!catalog) return null;

  const gameplay = state.gameplay;
  const saveData = gameplay?.saveData ?? null;
  const questViews = saveData
    ? Object.keys(catalog.world.quests).map((questId) => getQuestView(saveData, questId, catalog))
    : [];
  const stats = saveData ? deriveStats(saveData.player, catalog.rules) : null;
  const playerId = gameplay?.playerEntityId;
  const mapId = saveData?.location.mapId;
  const canShowInteractionHint = state.screen === 'playing'
    && !state.focusResumeRequired
    && state.panels.length === 0;
  let interactionHint: UiSnapshot['interactionHint'] = null;
  if (gameplay && saveData && canShowInteractionHint) {
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
  };
}
