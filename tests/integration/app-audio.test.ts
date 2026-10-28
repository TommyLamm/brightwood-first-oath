import { describe, expect, it } from 'vitest';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import type { AudioController, AudioFactory, MusicIntensity } from '../../src/contracts/ports.js';
import type { Settings } from '../../src/contracts/types.js';
import { GameApp } from '../../src/app/app.js';
import { requiredAssetKeys } from '../../src/app/assets.js';
import { createHeroAnchorFixture, createManifestFixture } from './asset-fixtures.js';

const fetchManifests = async (url: string) => {
  if (url.endsWith('/assets/actors/anchors.json')) {
    return { ok: true, status: 200, json: async () => createHeroAnchorFixture() };
  }
  const pack = url.split('/').at(-2) as AssetPack;
  return { ok: true, status: 200, json: async () => createManifestFixture(pack) };
};

function flushAudioUnlock(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createAudioRecorder() {
  const calls = {
    unlock: 0,
    music: [] as (string | null)[],
    intensity: [] as MusicIntensity[],
    ambience: [] as (string | null)[],
    sfx: [] as string[],
    settings: [] as Settings[],
    paused: [] as boolean[],
    ducked: [] as boolean[],
    dispose: 0,
    manifestAudioCount: 0,
    initialSettings: null as Settings | null,
  };
  const factory: AudioFactory = (manifest, settings) => {
    calls.manifestAudioCount = manifest.audio.length;
    calls.initialSettings = structuredClone(settings);
    const audio: AudioController = {
      unlock: async () => { calls.unlock += 1; },
      setMusic: async (key) => { calls.music.push(key); },
      setMusicIntensity: (level) => { calls.intensity.push(level); },
      setAmbience: (theme) => { calls.ambience.push(theme); },
      playSfx: (key) => { calls.sfx.push(key); },
      setSettings: (next) => { calls.settings.push(structuredClone(next)); },
      setPaused: (paused) => { calls.paused.push(paused); },
      setDucked: (ducked) => { calls.ducked.push(ducked); },
      dispose: () => { calls.dispose += 1; },
    };
    return audio;
  };
  return { calls, factory };
}

async function startedApp(seed: number) {
  const { calls, factory } = createAudioRecorder();
  const app = new GameApp({ baseUrl: './', fetcher: fetchManifests, audioFactory: factory, seed, sessionPrefix: `audio-${seed}` });
  const startup = await app.initialize();
  expect(startup.ready).toBe(true);
  return { app, calls };
}

describe('app audio wiring', () => {
  it('waits for a UI gesture, follows gameplay lifecycle, and deduplicates attack events', async () => {
    const { app, calls } = await startedApp(1401);
    expect(calls.manifestAudioCount).toBe(requiredAssetKeys('audio').length);
    expect(calls.initialSettings).toMatchObject({ masterVolume: 0.8, musicVolume: 0.35, sfxVolume: 0.65, muted: false });
    expect(calls.unlock).toBe(0);
    // The title theme is requested up front; the controller holds it until a gesture unlocks audio.
    expect(calls.music).toEqual(['theme-title']);

    app.dispatchUi({ type: 'playTemporary', payload: {} });
    app.update(0);
    await flushAudioUnlock();
    expect(app.state.screen).toBe('playing');
    expect(calls.unlock).toBe(1);
    expect(calls.music.at(-1)).toBe('theme-brightwood');
    expect(calls.ambience.at(-1)).toBe('camp');
    expect(calls.sfx).toContain('ui-click');
    expect(calls.paused.at(-1)).toBe(false);

    app.dispatch({ type: 'attack', payload: { skillId: 'basic' } });
    app.update(20);
    app.update(20);
    expect(calls.sfx.filter((key) => key === 'attack')).toHaveLength(1);

    const settings = { ...app.state.gameplay!.saveData.settings, masterVolume: 0.4, musicVolume: 0.2, sfxVolume: 0.5 };
    app.dispatch({ type: 'setSettings', payload: { settings } });
    app.update(0);
    expect(calls.settings.at(-1)).toMatchObject({ masterVolume: 0.4, musicVolume: 0.2, sfxVolume: 0.5 });

    app.dispatch({ type: 'togglePause', payload: {} });
    app.update(0);
    expect(calls.paused.at(-1)).toBe(true);
    app.dispatch({ type: 'togglePause', payload: {} });
    app.update(0);
    expect(calls.paused.at(-1)).toBe(false);

    app.state.gameplay!.pendingTransition = { mapId: 'guardian-arena', spawnId: 'entry', after: 'travel' };
    app.completeMapTransition();
    expect(calls.music.at(-1)).toBe('boss-guardian');
    expect(calls.ambience.at(-1)).toBe('rock');

    app.dispose();
    expect(calls.dispose).toBe(1);
  });

  it('keeps music playing but ducked while the settings panel is open', async () => {
    const { app, calls } = await startedApp(1402);
    app.dispatchUi({ type: 'playTemporary', payload: {} });
    app.update(0);
    await flushAudioUnlock();
    const pausesBefore = calls.paused.length;

    app.dispatchUi({ type: 'setPanel', payload: { panel: 'settings' } });
    app.update(0);
    await flushAudioUnlock();
    expect(app.state.panels).toContain('settings');
    expect(calls.ducked.at(-1)).toBe(true);
    expect(calls.paused.slice(pausesBefore)).not.toContain(true);
    expect(calls.sfx).toContain('panel-open');
    app.dispose();
  });

  it('raises the boss to phase 2 music once it is below half health', async () => {
    const { app, calls } = await startedApp(1403);
    app.dispatchUi({ type: 'playTemporary', payload: {} });
    app.update(0);
    await flushAudioUnlock();
    app.state.gameplay!.pendingTransition = { mapId: 'guardian-arena', spawnId: 'entry', after: 'travel' };
    app.completeMapTransition();
    app.update(20);
    const guardian = app.state.gameplay!.monsters.find(({ monsterId }) => monsterId === 'guardian');
    expect(guardian).toBeDefined();
    const maxHp = app.state.catalog!.rules.monsters.guardian!.maxHp;
    guardian!.hp = Math.floor(maxHp / 2) - 1;
    app.update(20);
    expect(calls.intensity.at(-1)).toBe('phase2');
    expect(calls.sfx).toContain('boss-phase');
    app.dispose();
  });

  it('keeps Bell Keeper phase music on phase one through the transition and uses its single result stinger', async () => {
    const { app, calls } = await startedApp(1405);
    app.dispatchUi({ type: 'playTemporary', payload: {} });
    app.update(0);
    await flushAudioUnlock();

    app.state.gameplay!.pendingTransition = { mapId: 'ruins-bell-sanctum', spawnId: 'entry', after: 'travel' };
    app.completeMapTransition();
    expect(calls.music.at(-1)).toBe('boss-ruins');
    const bell = app.state.gameplay!.monsters.find(({ monsterId }) => monsterId === 'ruins-bell-keeper')!;
    bell.hp = 4000;
    const priorIntensities = calls.intensity.length;

    app.update(20);
    expect(app.state.gameplay?.monsters.find(({ id }) => id === bell.id)?.mode).toBe('phase-transition');
    expect(calls.sfx.filter((key) => key === 'boss-phase')).toHaveLength(1);
    for (let tick = 0; tick < 45; tick += 1) app.update(20);
    expect(app.state.gameplay?.monsters.find(({ id }) => id === bell.id)?.phase).toBe(1);
    expect(calls.intensity.slice(priorIntensities)).not.toContain('phase2');

    for (let tick = 0; tick < 30; tick += 1) app.update(20);
    expect(app.state.gameplay?.monsters.find(({ id }) => id === bell.id)?.phase).toBe(2);
    expect(calls.intensity.at(-1)).toBe('phase2');
    expect(calls.sfx.filter((key) => key === 'boss-phase')).toHaveLength(1);

    const gameplay = app.state.gameplay!;
    const liveBell = gameplay.monsters.find(({ monsterId }) => monsterId === 'ruins-bell-keeper')!;
    liveBell.hp = 1;
    liveBell.mode = 'idle';
    gameplay.movement = {
      ...gameplay.movement,
      position: { x: liveBell.movement.position.x - 40, y: 600 },
      velocity: { x: 0, y: 0 },
      facing: 1,
      mode: 'grounded',
    };
    const nowMs = app.state.gameTimeMs;
    gameplay.combat.attacks = [{
      id: 'hero-final-bell-hit',
      sourceId: gameplay.playerEntityId,
      skillId: 'basic',
      startedAtMs: nowMs - app.state.catalog!.rules.skills.basic!.windupMs,
      facing: 1,
      origin: { ...gameplay.movement.position },
      rank: 1,
      hitIds: [],
    }];
    app.update(60);
    expect(app.state.gameplay?.bossResult).toBe(true);
    expect(calls.sfx.filter((key) => key === 'oath-bell-restored')).toHaveLength(1);
    expect(calls.sfx).not.toContain('boss-win');
    app.update(20);
    expect(calls.sfx.filter((key) => key === 'oath-bell-restored')).toHaveLength(1);
    app.dispose();
  });

  it('does not emit the Bell Keeper phase cue when the player dies on its transition tick', async () => {
    const { app, calls } = await startedApp(1406);
    app.dispatchUi({ type: 'playTemporary', payload: {} });
    app.update(0);
    await flushAudioUnlock();

    app.state.gameplay!.pendingTransition = { mapId: 'ruins-bell-sanctum', spawnId: 'entry', after: 'travel' };
    app.completeMapTransition();
    const gameplay = app.state.gameplay!;
    const bell = gameplay.monsters.find(({ monsterId }) => monsterId === 'ruins-bell-keeper')!;
    bell.hp = 4000;
    gameplay.saveData.player = { ...gameplay.saveData.player, hp: 1 };
    gameplay.movement = {
      ...gameplay.movement,
      position: { x: 1170, y: 600 },
      velocity: { x: 0, y: 0 },
      mode: 'grounded',
    };
    gameplay.combat.attacks = [{
      id: 'bell-kills-player-during-transition',
      sourceId: bell.id,
      skillId: 'ruins-bell-slam',
      startedAtMs: app.state.gameTimeMs - 900,
      facing: -1,
      origin: { x: 1200, y: 600 },
      rank: 1,
      hitIds: [],
    }];

    app.update(20);
    expect(app.state.screen).toBe('dead');
    expect(app.state.gameplay?.monsters.find(({ id }) => id === bell.id)?.bellCycle?.transitionStartedAtMs).toBeNull();
    expect(calls.sfx).not.toContain('boss-phase');
    app.dispose();
  });

  it('plays a stele tune once when q17 records a fresh inspection', async () => {
    const { app, calls } = await startedApp(1404);
    app.dispatchUi({ type: 'playTemporary', payload: {} });
    app.update(0);
    await flushAudioUnlock();

    const gameplay = app.state.gameplay!;
    gameplay.saveData.location = { mapId: 'ruins-echo-gallery', spawnId: 'left' };
    gameplay.saveData.quests.q17 = {
      status: 'active',
      counters: { 'ruins-stele-west': 0, 'ruins-stele-east': 0, 'ruins-string-puppet': 0 },
    };
    gameplay.monsters = [];
    gameplay.movement = {
      ...gameplay.movement,
      position: { x: 900, y: 420 },
      velocity: { x: 0, y: 0 },
      mode: 'grounded',
      footholdId: 'ruins-echo-gallery:platform-1',
      ladderId: null,
    };

    app.dispatch({ type: 'interact', payload: {} });
    app.update(20);
    expect(app.state.gameplay?.interaction?.npcId).toBe('ruins-stele-west');
    app.dispatch({ type: 'inspect', payload: { targetId: 'ruins-stele-west' } });
    app.update(20);
    expect(app.state.gameplay?.saveData.quests.q17?.counters['ruins-stele-west']).toBe(1);
    expect(calls.sfx.filter((key) => key === 'stele-tune')).toHaveLength(1);

    app.dispatch({ type: 'inspect', payload: { targetId: 'ruins-stele-west' } });
    app.update(20);
    expect(app.state.gameplay?.saveData.quests.q17?.counters['ruins-stele-west']).toBe(1);
    expect(calls.sfx.filter((key) => key === 'stele-tune')).toHaveLength(1);
    app.dispose();
  });
});
