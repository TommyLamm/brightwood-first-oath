import { describe, expect, it } from 'vitest';
import { AssetManifestLoadError, loadRequiredAssetManifests, parseAssetManifest } from '../../src/app/assets.js';
import { GameApp } from '../../src/app/app.js';
import { composeContentCatalog } from '../../src/app/catalog.js';
import { AppCommandQueue } from '../../src/app/command-queue.js';
import { FixedStepClock, FIXED_STEP_MS } from '../../src/app/fixed-step.js';
import { KeyboardInputState } from '../../src/app/keyboard.js';
import { applyPanelCommand, escCommandForPanels, isWorldFrozen } from '../../src/app/panels.js';
import { createInitialAppState, createUiSnapshot, worldIsFrozen } from '../../src/app/state.js';
import { startNewGame } from '../../src/app/gameplay.js';

describe('T14-a app foundation', () => {
  it('composes only the validated rules and world catalogs', () => {
    const result = composeContentCatalog();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.value.rules.items)).toHaveLength(26);
      expect(Object.keys(result.value.world.maps)).toHaveLength(9);
    }
  });

  it('keeps command sequencing in one FIFO queue', () => {
    const queue = new AppCommandQueue();
    const first = queue.enqueue({ type: 'setPanel', payload: { panel: 'inventory' } });
    const second = queue.enqueue({ type: 'closePanel', payload: {} });

    expect(first.seq).toBe(1);
    expect(second.seq).toBe(2);
    expect(queue.drain()).toEqual([first, second]);
    expect(queue.length).toBe(0);
  });

  it('advances at 60 Hz, caps catch-up, and clears accumulated time while frozen', () => {
    const clock = new FixedStepClock();
    expect(clock.advance(FIXED_STEP_MS, false).steps).toBe(1);

    const catchUp = clock.advance(1_000, false);
    expect(catchUp.steps).toBe(5);
    expect(catchUp.droppedBacklog).toBe(true);
    expect(clock.pendingMs).toBe(0);

    const beforePause = clock.gameTimeMs;
    clock.advance(FIXED_STEP_MS / 2, false);
    const paused = clock.advance(500, true);
    expect(paused.steps).toBe(0);
    expect(paused.gameTimeMs).toBe(beforePause);
    expect(clock.pendingMs).toBe(0);
  });

  it('closes the top panel before pausing and only freezes for pause/settings/blur', () => {
    const initial = createInitialAppState(7, 'test');
    const playing = { ...initial, screen: 'playing' as const };
    const withInventory = applyPanelCommand(playing, { type: 'setPanel', payload: { panel: 'inventory' } });
    const withQuest = applyPanelCommand(withInventory, { type: 'setPanel', payload: { panel: 'quests' } });

    expect(escCommandForPanels(withQuest.panels).type).toBe('closePanel');
    expect(applyPanelCommand(withQuest, { type: 'closePanel', payload: {} }).panels).toEqual(['inventory']);
    expect(isWorldFrozen(withQuest, true)).toBe(false);

    const settings = applyPanelCommand(playing, { type: 'setPanel', payload: { panel: 'settings' } });
    expect(isWorldFrozen(settings, true)).toBe(true);
    expect(worldIsFrozen({ ...playing, screen: 'paused' })).toBe(true);
    expect(worldIsFrozen({ ...playing, windowFocused: false })).toBe(true);
  });

  it('uses KeyboardEvent.code bindings, stops printable input, and releases held state', () => {
    const input = new KeyboardInputState();
    input.keyDown('ArrowLeft', { focused: true, textInput: false, panels: [] });
    input.keyDown('AltLeft', { focused: true, textInput: false, panels: [] });
    expect(input.consumeMovementFrame()).toEqual({ moveX: -1, climbY: 0, jumpPressed: true, downHeld: false });
    expect(input.consumeMovementFrame().jumpPressed).toBe(false);

    expect(input.keyDown('ControlRight', { focused: true, textInput: false, panels: [] }).command)
      .toEqual({ type: 'attack', payload: { skillId: 'basic' } });

    input.rebind('attack', 'KeyX');
    expect(input.keyDown('KeyX', { focused: true, textInput: false, panels: [] }).command)
      .toEqual({ type: 'attack', payload: { skillId: 'basic' } });
    expect(input.keyDown('KeyX', { focused: true, textInput: true, panels: [] }).command).toBeNull();
    input.releaseAll();
    expect(input.consumeMovementFrame()).toEqual({ moveX: 0, climbY: 0, jumpPressed: false, downHeld: false });
  });

  it('allows Escape from a focused UI control without allowing gameplay input or text-entry shortcuts', () => {
    const input = new KeyboardInputState();
    expect(input.keyDown('Escape', {
      focused: false, uiFocused: true, textInput: false, panels: ['quests'],
    })).toEqual({ command: { type: 'closePanel', payload: {} }, preventDefault: true });
    expect(input.keyDown('ControlLeft', {
      focused: false, uiFocused: true, textInput: false, panels: ['quests'],
    })).toEqual({ command: null, preventDefault: false });
    expect(input.keyDown('Escape', {
      focused: false, uiFocused: true, textInput: true, panels: ['quests'],
    })).toEqual({ command: null, preventDefault: false });
    expect(input.keyDown('Escape', {
      focused: false, uiFocused: false, textInput: false, panels: ['quests'],
    })).toEqual({ command: null, preventDefault: false });
  });

  it('rejects a present but incomplete manifest and reports all missing pack manifests', async () => {
    expect(() => parseAssetManifest({
      version: 1,
      pack: 'actors',
      images: [{
        key: 'equip:starter-sword', url: 'assets/actors/sword.png', columns: 1, rows: 1,
        displayWidth: 64, displayHeight: 64, pivotX: 0.25, pivotY: 0.8,
      }],
      animations: [],
      audio: [],
    }, 'actors')).toThrow(/required keys missing/);

    const fetcher = async () => ({ ok: false, status: 404, json: async () => null });
    try {
      await loadRequiredAssetManifests('./', fetcher);
    } catch (error) {
      expect(error).toBeInstanceOf(AssetManifestLoadError);
      if (error instanceof AssetManifestLoadError) {
        expect(error.issues.map(({ pack }) => pack)).toEqual(['actors', 'environment', 'interface', 'audio']);
        expect(error.issues.every(({ message }) => message.includes('HTTP 404'))).toBe(true);
      }
    }
  });

  it('keeps startup incomplete when a required pack or hero anchors are missing', async () => {
    const app = new GameApp({
      baseUrl: './',
      fetcher: async () => ({ ok: false, status: 404, json: async () => null }),
      seed: 3,
      sessionPrefix: 'startup-test',
    });

    const result = await app.initialize();
    expect(result.ready).toBe(false);
    expect(result.status).toBe('incomplete');
    expect(result.issues).toHaveLength(5);
    expect(app.state.screen).toBe('error');
    expect(app.state.catalog).not.toBeNull();
    expect(app.state.assetManifests).toBeNull();
    expect(app.state.heroAnchors).toBeNull();
    app.dispose();
  });

  it('builds the UI snapshot from the active gameplay state', () => {
    const catalog = composeContentCatalog();
    expect(catalog.ok).toBe(true);
    if (!catalog.ok) return;
    const started = startNewGame('旅人', catalog.value, createInitialAppState(2, 'ui-test').nextEntityId);
    expect('error' in started).toBe(false);
    if ('error' in started) return;

    const interfaceManifest = {
      version: 1 as const,
      pack: 'interface' as const,
      images: [],
      animations: [],
      audio: [],
    };

    const snapshot = createUiSnapshot({
      ...createInitialAppState(2, 'ui-test'),
      catalog: catalog.value,
      assetManifests: [interfaceManifest],
      gameplay: started.gameplay,
      screen: 'playing',
    });
    expect(snapshot?.saveData?.player.name).toBe('旅人');
    expect(snapshot?.questViews).toHaveLength(Object.keys(catalog.value.world.quests).length);
    expect(snapshot?.stats?.maxHp).toBeGreaterThan(0);
    expect(snapshot?.panels).toEqual([]);
    // A fresh hero has not reached 木葉鎮 yet, so 返回城鎮 must not skip camp's q01 gate.
    expect(snapshot?.canReturnTown).toBe(false);
    expect(snapshot?.interfaceManifest).toBe(interfaceManifest);

    const arenaGameplay = structuredClone(started.gameplay);
    arenaGameplay.saveData.location = { mapId: 'guardian-arena', spawnId: 'entry' };
    arenaGameplay.saveData.visitedMaps.push('town');
    const arenaSnapshot = createUiSnapshot({
      ...createInitialAppState(2, 'ui-test'),
      catalog: catalog.value,
      gameplay: arenaGameplay,
      screen: 'playing',
    });
    expect(arenaSnapshot?.canReturnTown).toBe(false);

    arenaGameplay.bossResult = true;
    const resultSnapshot = createUiSnapshot({
      ...createInitialAppState(2, 'ui-test'),
      catalog: catalog.value,
      gameplay: arenaGameplay,
      screen: 'result',
    });
    expect(resultSnapshot?.canReturnTown).toBe(true);
  });
});
