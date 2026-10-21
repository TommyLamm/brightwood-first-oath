import type { AssetManifest } from '../contracts/asset-manifest.js';
import type { CommandDraft, GameCommand, PanelId } from '../contracts/commands.js';
import type { ContentCatalog } from '../contracts/definitions.js';
import type { HeroAnchorManifest } from '../contracts/hero-anchors.js';
import type { RandomSource, SaveStatus, UiSnapshot } from '../contracts/index.js';
import { createNextEntityId, createSeededRandom } from '../contracts/helpers.js';
import { deriveStats } from '../domain/progression/index.js';
import { getQuestView } from '../domain/quests/index.js';
import { applyPanelCommand, isWorldFrozen } from './panels.js';
import type { GameplayState } from './gameplay.js';

export type StartupStatus = 'loading' | 'ready' | 'incomplete';

export type GameAppState = {
  screen: UiSnapshot['screen'];
  panels: PanelId[];
  windowFocused: boolean;
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
    const panelState = applyPanelCommand(state, command);
    return { state: { ...state, screen: panelState.screen }, handled: true };
  }
  return { state, handled: false };
}

export function worldIsFrozen(state: GameAppState): boolean {
  return isWorldFrozen(state, state.windowFocused);
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
  const canReturnTown = gameplay !== null
    && mapId !== 'town'
    && (state.screen === 'playing' || state.screen === 'result')
    && (mapId !== 'guardian-arena' || gameplay.bossResult)
    // Before the hero has reached 木葉鎮, 返回城鎮 would skip camp's q01 gate.
    && saveData?.visitedMaps.includes('town') === true;

  return {
    screen: state.screen,
    ...(state.startupIssues.length > 0 ? { error: state.startupIssues.at(-1) } : {}),
    saveData,
    stats,
    questViews,
    catalog,
    interfaceManifest: state.assetManifests?.find((manifest) => manifest.pack === 'interface') ?? null,
    actorManifest: state.assetManifests?.find((manifest) => manifest.pack === 'actors') ?? null,
    saveStatus: state.saveStatus,
    saveMessage: state.saveMessage,
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
