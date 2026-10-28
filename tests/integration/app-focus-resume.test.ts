import { describe, expect, it } from 'vitest';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import type { CommandDraft } from '../../src/contracts/commands.js';
import type { AudioController, AudioFactory } from '../../src/contracts/ports.js';
import { GameApp } from '../../src/app/app.js';
import { AppCommandQueue } from '../../src/app/command-queue.js';
import { KeyboardControls, KeyboardInputState } from '../../src/app/keyboard.js';
import { appCommand, createInitialAppState, worldIsFrozen } from '../../src/app/state.js';
import { createHeroAnchorFixture, createManifestFixture } from './asset-fixtures.js';

const fetchManifests = async (url: string) => {
  if (url.endsWith('/assets/actors/anchors.json')) {
    return { ok: true, status: 200, json: async () => createHeroAnchorFixture() };
  }
  const pack = url.split('/').at(-2) as AssetPack;
  return { ok: true, status: 200, json: async () => createManifestFixture(pack) };
};

function createAudioRecorder() {
  const paused: boolean[] = [];
  const factory: AudioFactory = () => {
    const audio: AudioController = {
      unlock: async () => {},
      setMusic: async () => {},
      setMusicIntensity: () => {},
      setAmbience: () => {},
      playSfx: () => {},
      setSettings: () => {},
      setPaused: (value) => { paused.push(value); },
      setDucked: () => {},
      dispose: () => {},
    };
    return audio;
  };
  return { factory, paused };
}

async function startedApp(seed: number) {
  const audio = createAudioRecorder();
  const app = new GameApp({
    baseUrl: './',
    fetcher: fetchManifests,
    audioFactory: audio.factory,
    seed,
    sessionPrefix: `focus-${seed}`,
  });
  const startup = await app.initialize();
  expect(startup.ready).toBe(true);
  app.dispatch({ type: 'playTemporary', payload: {} });
  app.update(0);
  expect(app.state.screen).toBe('playing');
  return { app, audio };
}

class TestWindow extends EventTarget {}

class TestDocument extends EventTarget {
  visibilityState: DocumentVisibilityState = 'visible';
  activeElement: TestElement | null = null;
  focused = true;
  readonly defaultView = new TestWindow();

  hasFocus(): boolean {
    return this.focused;
  }
}

class TestElement extends EventTarget {
  tabIndex = -1;
  canvas: TestElement | null = null;
  readonly children = new Set<TestElement>();

  constructor(readonly ownerDocument: TestDocument) {
    super();
  }

  querySelector(selector: string): TestElement | null {
    return selector === 'canvas' ? this.canvas : null;
  }

  contains(target: Node | null): boolean {
    return target === this || [...this.children].some((child) => child.contains(target));
  }

  focus(): void {
    this.ownerDocument.activeElement = this;
  }
}

describe('app focus resume safety', () => {
  it('keeps gameplay and audio frozen after focus returns until explicit resume', async () => {
    const { app, audio } = await startedApp(2301);
    app.update(20);
    const before = {
      gameTimeMs: app.state.gameTimeMs,
      position: structuredClone(app.state.gameplay!.movement.position),
      hp: app.state.gameplay!.saveData.player.hp,
      mp: app.state.gameplay!.saveData.player.mp,
      cooldowns: structuredClone(app.state.gameplay!.combat.cooldowns),
    };

    app.setWindowFocused(false);
    expect(app.state.focusResumeRequired).toBe(true);
    app.update(200);
    app.setWindowFocused(true);
    app.update(200);

    expect(worldIsFrozen(app.state)).toBe(true);
    expect(app.state.gameTimeMs).toBe(before.gameTimeMs);
    expect(app.state.gameplay?.movement.position).toEqual(before.position);
    expect(app.state.gameplay?.saveData.player).toMatchObject({ hp: before.hp, mp: before.mp });
    expect(app.state.gameplay?.combat.cooldowns).toEqual(before.cooldowns);
    expect(audio.paused.at(-1)).toBe(true);

    app.dispatch({ type: 'togglePause', payload: {} });
    app.update(20);
    expect(app.state.focusResumeRequired).toBe(false);
    expect(app.state.screen).toBe('playing');
    expect(app.state.gameTimeMs).toBeGreaterThan(before.gameTimeMs);
    expect(audio.paused.at(-1)).toBe(false);
    app.dispose();
  });

  it('clears buffered input and pending transients while retaining explicit queued commands and started attacks', async () => {
    const { app } = await startedApp(2302);
    app.state.gameplay!.bufferedAttack = { skillId: 'heavy-strike', expiresAtMs: app.state.gameTimeMs + 500 };
    const startedAttacks = app.state.gameplay!.combat.attacks;
    app.dispatch({ type: 'attack', payload: { skillId: 'basic' } });
    app.update(5);
    expect(app.queuedCommandCount).toBe(1);

    app.dispatch({ type: 'attack', payload: { skillId: 'heavy-strike' } });
    app.dispatch({ type: 'pickup', payload: {} });
    app.dispatch({ type: 'interact', payload: {} });
    app.dispatch({ type: 'inspect', payload: { targetId: 'ruins-stele-west' } });
    app.dispatch({ type: 'useItem', payload: { itemId: 'small-red' } });
    app.dispatch({ type: 'togglePause', payload: {} });
    app.dispatch({ type: 'acceptQuest', payload: { questId: 'q01' } });

    app.setWindowFocused(false);
    expect(app.state.gameplay?.bufferedAttack).toBeUndefined();
    expect(app.state.gameplay?.combat.attacks).toBe(startedAttacks);
    expect(app.queuedCommandCount).toBe(1);

    app.update(100);
    expect(app.queuedCommandCount).toBe(1);
    app.setWindowFocused(true);
    app.update(100);
    expect(app.queuedCommandCount).toBe(1);
    app.dispose();
  });

  it('keeps the focus gate when a map load finishes', async () => {
    const { app } = await startedApp(2303);
    const town = app.state.catalog!.world.maps.town!;
    app.state.gameplay!.pendingTransition = {
      mapId: town.id,
      spawnId: town.spawns[0]!.id,
      after: 'travel',
    };
    app.setScreen('loading');
    app.setWindowFocused(false);
    app.setWindowFocused(true);

    app.completeMapTransition();
    expect(app.state.screen).toBe('playing');
    expect(app.state.focusResumeRequired).toBe(true);
    expect(worldIsFrozen(app.state)).toBe(true);

    app.dispatch({ type: 'returnTitle', payload: {} });
    app.update(0);
    expect(app.state.screen).toBe('loading');
    expect(app.state.focusResumeRequired).toBe(false);
    app.dispose();
  });

  it('limits resume to focused playing or paused screens and leaves panel focus changes inside the page', async () => {
    const initial = createInitialAppState(4, 'focus-commands');
    for (const screen of ['title', 'loading', 'dead', 'result'] as const) {
      const state = { ...initial, screen, focusResumeRequired: true };
      const result = appCommand(state, { type: 'togglePause', payload: {} });
      expect(result.handled).toBe(true);
      expect(result.state.screen).toBe(screen);
      expect(result.state.focusResumeRequired).toBe(true);
    }

    const pausedBehindGate = { ...initial, screen: 'paused' as const, focusResumeRequired: true };
    const resumed = appCommand(pausedBehindGate, { type: 'togglePause', payload: {} });
    expect(resumed.state).toMatchObject({ screen: 'playing', focusResumeRequired: false });
    const blurredPaused = { ...pausedBehindGate, windowFocused: false };
    expect(appCommand(blurredPaused, { type: 'togglePause', payload: {} }).state).toBe(blurredPaused);

    const document = new TestDocument();
    const gameRoot = new TestElement(document);
    const canvas = new TestElement(document);
    gameRoot.canvas = canvas;
    gameRoot.children.add(canvas);
    const uiRoot = new TestElement(document);
    const uiButton = new TestElement(document);
    uiRoot.children.add(uiButton);
    document.activeElement = canvas;
    const focusChanges: boolean[] = [];
    const controls = new KeyboardControls({
      gameRoot: gameRoot as unknown as HTMLElement,
      uiRoot: uiRoot as unknown as HTMLElement,
      dispatch: () => {},
      getPanels: () => ['inventory'],
      onWindowFocusChange: (focused) => focusChanges.push(focused),
    });
    controls.input.keyDown('ArrowLeft', { focused: true, textInput: false, panels: [] });
    document.activeElement = uiButton;
    gameRoot.dispatchEvent(new Event('focusout'));
    expect(controls.input.isHeld('moveLeft')).toBe(false);
    expect(focusChanges).toEqual([]);

    document.focused = false;
    document.defaultView.dispatchEvent(new Event('focus'));
    document.focused = true;
    document.visibilityState = 'hidden';
    document.defaultView.dispatchEvent(new Event('focus'));
    expect(focusChanges).toEqual([]);
    document.visibilityState = 'visible';
    document.defaultView.dispatchEvent(new Event('focus'));
    expect(focusChanges).toEqual([true]);
    document.visibilityState = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(focusChanges).toEqual([true, false]);
    controls.dispose();
  });

  it('keeps the focus gate behind save blockers for rebound Escape commands', async () => {
    const { app } = await startedApp(2305);
    const input = new KeyboardInputState();
    input.rebind('escape', 'KeyP');
    const togglePause = input.keyDown('KeyP', {
      focused: true,
      textInput: false,
      panels: [],
    }).command;
    if (!togglePause || togglePause.type !== 'togglePause') {
      throw new Error('Rebound Escape should produce a togglePause command.');
    }

    const blockers = [
      { saveStatus: 'conflict' as const, saveUpgrade: null },
      { saveStatus: 'ready' as const, saveUpgrade: { formatVersion: 4, source: 'local' as const } },
    ];
    for (const blocker of blockers) {
      for (const screen of ['playing', 'paused'] as const) {
        const blockedState = {
          ...app.state,
          screen,
          focusResumeRequired: true,
          ...blocker,
        };
        const result = appCommand(blockedState, togglePause);
        expect(result.handled).toBe(true);
        expect(result.state).toBe(blockedState);
        expect(result.state.panels).toBe(blockedState.panels);
        expect(result.state.gameplay).toBe(blockedState.gameplay);
        expect(result.state).toMatchObject({
          screen,
          focusResumeRequired: true,
          saveStatus: blocker.saveStatus,
          saveUpgrade: blocker.saveUpgrade,
        });
      }
    }

    for (const screen of ['playing', 'paused'] as const) {
      const resumableState = {
        ...app.state,
        screen,
        focusResumeRequired: true,
        saveStatus: 'ready' as const,
        saveUpgrade: null,
      };
      const resumed = appCommand(resumableState, togglePause);
      expect(resumed.state.screen).toBe('playing');
      expect(resumed.state.focusResumeRequired).toBe(false);
      expect(resumed.state.panels).toBe(resumableState.panels);
      expect(resumed.state.gameplay).toBe(resumableState.gameplay);
    }

    const legacyState = {
      ...app.state,
      screen: 'paused' as const,
      focusResumeRequired: true,
      saveStatus: 'ready' as const,
    };
    expect(Reflect.deleteProperty(legacyState, 'saveUpgrade')).toBe(true);
    const legacyResume = appCommand(legacyState, togglePause);
    expect(legacyResume.state).toMatchObject({ screen: 'playing', focusResumeRequired: false });

    const manuallyPaused = appCommand({
      ...app.state,
      screen: 'playing',
      focusResumeRequired: false,
      saveStatus: 'ready',
      saveUpgrade: null,
    }, togglePause);
    expect(manuallyPaused.state.screen).toBe('paused');
    const manuallyResumed = appCommand(manuallyPaused.state, togglePause);
    expect(manuallyResumed.state.screen).toBe('playing');
    app.dispose();
  });

  it('discards command types without renumbering retained sequence ids', () => {
    const queue = new AppCommandQueue();
    queue.enqueue({ type: 'attack', payload: { skillId: 'basic' } });
    const retained = queue.enqueue({ type: 'acceptQuest', payload: { questId: 'q01' } });
    queue.enqueue({ type: 'useItem', payload: { itemId: 'small-red' } });

    queue.discard(new Set<CommandDraft['type']>(['attack', 'useItem']));
    expect(queue.drain()).toEqual([retained]);
    expect(queue.enqueue({ type: 'closePanel', payload: {} }).seq).toBe(4);
  });
});
