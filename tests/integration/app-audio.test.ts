import { describe, expect, it } from 'vitest';
import type { AssetPack } from '../../src/contracts/asset-manifest.js';
import type { AudioController, AudioFactory } from '../../src/contracts/ports.js';
import type { Settings } from '../../src/contracts/types.js';
import { GameApp } from '../../src/app/app.js';
import { createHeroAnchorFixture } from './asset-fixtures.js';

const imageKeys: Record<Exclude<AssetPack, 'audio'>, string[]> = {
  actors: [
    'actor:hero-cloth', 'actor:hero-leather', 'actor:hero-iron',
    'equip:starter-sword', 'equip:iron-sword', 'equip:steel-sword', 'equip:guardian-sword',
    'equip:cloth-cap', 'equip:leather-cap', 'equip:iron-helm',
    'actor:snail', 'actor:slime', 'actor:mushroom', 'actor:boar', 'actor:golem', 'actor:sentinel', 'actor:guardian',
    'actor:guide', 'actor:mentor', 'actor:merchant', 'actor:healer', 'actor:keeper',
  ],
  environment: [
    ...(['camp', 'town', 'forest', 'rock'] as const).flatMap((theme) =>
      (['sky', 'far', 'mid'] as const).map((layer) => `env:${theme}:${layer}`)),
    'env:tile-ground', 'env:tile-platform', 'env:tile-slope', 'env:ladder',
    'env:portal', 'env:town-sign', 'env:mine-door', 'env:altar',
  ],
  interface: [
    ...[
      'starter-sword', 'iron-sword', 'steel-sword', 'guardian-sword', 'cloth-shirt', 'leather-vest',
      'iron-mail', 'cloth-cap', 'leather-cap', 'iron-helm', 'small-red', 'large-red', 'small-blue',
      'large-blue', 'snail-shell', 'slime-gel', 'mushroom-cap', 'boar-tusk', 'stone-chip', 'metal-shard',
      'forest-seed', 'spore-sample', 'ridge-emblem', 'guardian-core',
    ].map((id) => `item:${id}`),
    ...['heavy-strike', 'sweep', 'iron-guard', 'vitality', 'rest-recovery'].map((id) => `skill:${id}`),
    'marker:quest', 'marker:portal', 'marker:shop', 'marker:player', 'panel:frame',
    'button:normal', 'button:hover', 'button:pressed', 'bar:hp', 'bar:mp', 'bar:exp',
    'slot:normal', 'slot:selected', 'vfx:heavy-strike', 'vfx:sweep', 'vfx:hit', 'vfx:levelup', 'vfx:guard',
  ],
};

const audioKeys = [
  'theme-town', 'theme-field', 'theme-boss', 'ui-click', 'jump', 'attack', 'hit', 'hurt',
  'pickup', 'potion', 'equip', 'quest', 'levelup', 'portal', 'death', 'boss-win',
];

function validManifest(pack: AssetPack): unknown {
  if (pack === 'audio') {
    return {
      version: 1,
      pack,
      images: [],
      animations: [],
      audio: audioKeys.map((key) => ({
        key,
        url: `assets/audio/${key}.wav`,
        kind: key.startsWith('theme-') ? 'music' : 'sfx',
        loop: key.startsWith('theme-'),
      })),
    };
  }
  return {
    version: 1,
    pack,
    images: imageKeys[pack].map((key, index) => ({
      key,
      url: `assets/${pack}/${index}.png`,
      columns: 1,
      rows: 1,
      displayWidth: 64,
      displayHeight: 64,
      pivotX: 0.5,
      pivotY: 0.5,
    })),
    animations: [],
    audio: [],
  };
}

const fetchManifests = async (url: string) => {
  if (url.endsWith('/assets/actors/anchors.json')) {
    return { ok: true, status: 200, json: async () => createHeroAnchorFixture() };
  }
  const pack = url.split('/').at(-2) as AssetPack;
  return { ok: true, status: 200, json: async () => validManifest(pack) };
};

function flushAudioUnlock(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createAudioRecorder() {
  const calls = {
    unlock: 0,
    music: [] as string[],
    sfx: [] as string[],
    settings: [] as Settings[],
    paused: [] as boolean[],
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
      playSfx: (key) => { calls.sfx.push(key); },
      setSettings: (next) => { calls.settings.push(structuredClone(next)); },
      setPaused: (paused) => { calls.paused.push(paused); },
      dispose: () => { calls.dispose += 1; },
    };
    return audio;
  };
  return { calls, factory };
}

describe('T14 app audio wiring', () => {
  it('waits for a UI gesture, follows gameplay lifecycle, and deduplicates attack events', async () => {
    const { calls, factory } = createAudioRecorder();
    const app = new GameApp({
      baseUrl: './',
      fetcher: fetchManifests,
      audioFactory: factory,
      seed: 1401,
      sessionPrefix: 'audio-integration',
    });

    const startup = await app.initialize();
    expect(startup.ready).toBe(true);
    expect(calls.manifestAudioCount).toBe(16);
    expect(calls.initialSettings).toMatchObject({ masterVolume: 0.8, musicVolume: 0.35, sfxVolume: 0.65, muted: false });
    expect(calls.unlock).toBe(0);
    expect(calls.music).toEqual([]);

    app.dispatchUi({ type: 'playTemporary', payload: {} });
    app.update(0);
    await flushAudioUnlock();
    expect(app.state.screen).toBe('playing');
    expect(calls.unlock).toBe(1);
    expect(calls.music).toEqual(['theme-field']);
    expect(calls.sfx).toEqual(['ui-click']);
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
    expect(calls.music.at(-1)).toBe('theme-boss');

    app.dispose();
    expect(calls.dispose).toBe(1);
  });
});
