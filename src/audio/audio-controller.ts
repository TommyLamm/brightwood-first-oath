import type { AssetAudio, AssetManifest, AudioLayer } from '../contracts/asset-manifest.js';
import type { AudioController, MusicIntensity } from '../contracts/ports.js';
import type { Settings } from '../contracts/types.js';
import { createAmbience, type Ambience } from './ambience.js';

/** Time constants (seconds) for setTargetAtTime: ~3× reaches the target. */
const SET_FADE_IN = 0.7;
const SET_FADE_OUT = 0.9;
const FIRST_SET_FADE_IN = 0.15;
const LAYER_RISE = 0.55;
const LAYER_FALL = 1.1;
const SET_RELEASE_SECONDS = 4;
const MAX_SFX_VOICES_PER_KEY = 4;
const AMBIENCE_LEVEL = 0.9;
const COMBAT_AMBIENCE_DUCK = 0.3;
const MENU_DUCK = 0.4;

type AudioGraph = {
  master: GainNode;
  /** User music volume. */
  music: GainNode;
  /** Stinger ducking (victory fanfare etc.). */
  stingerDuck: GainNode;
  /** Music + ambience bed, lowered while a menu is open. */
  atmosphere: GainNode;
  ambience: GainNode;
  sfx: GainNode;
};

type LayerVoice = { key: string; layer: AudioLayer; source: AudioBufferSourceNode; gain: GainNode };

type MusicSet = {
  key: string;
  gain: GainNode;
  layers: LayerVoice[];
  released: boolean;
};

type SfxVoice = {
  key: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
  released: boolean;
};

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

function safeVolume(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/** Resolves after the next animation frame, or shortly anyway when frames are throttled (hidden tab, tests). */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 100);
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => { clearTimeout(timer); resolve(); });
  });
}

function createContext(): AudioContext | null {
  const browser = globalThis as typeof globalThis & { webkitAudioContext?: AudioContextConstructor };
  const Constructor = browser.AudioContext ?? browser.webkitAudioContext;
  if (!Constructor) return null;
  try {
    return new Constructor({ latencyHint: 'interactive' });
  } catch {
    return null;
  }
}

/** Moves a gain smoothly; falls back to an immediate value where automation is unsupported. */
function glide(parameter: AudioParam, value: number, at: number, timeConstant: number): void {
  try {
    parameter.cancelScheduledValues(at);
    parameter.setValueAtTime(parameter.value, at);
    parameter.setTargetAtTime(value, at, timeConstant);
  } catch {
    try { parameter.value = value; } catch { /* best-effort */ }
  }
}

function layerLevel(layer: AudioLayer, intensity: MusicIntensity): number {
  if (layer === 'base') return 1;
  if (layer === 'combat') return intensity === 'explore' ? 0 : 1;
  return intensity === 'phase2' ? 1 : 0;
}

/**
 * Creates a lazy Web Audio controller. It does not create an AudioContext or
 * play anything until the host calls unlock() from a player gesture.
 *
 * Music is organised in sets (a map's `musicKey`): every layer of a set starts on the same
 * sample, loops with it, and fades in or out as the intensity changes. Only the playing set's
 * buffers stay decoded (a 100 s stereo layer is ~38 MB of PCM), effects stay resident.
 */
export function createAudio(manifest: AssetManifest, initialSettings: Settings): AudioController {
  const audioByKey = new Map(manifest.audio.map((entry) => [entry.key, entry]));
  const layersBySet = new Map<string, AssetAudio[]>();
  for (const entry of manifest.audio) {
    if (entry.kind !== 'music') continue;
    const set = entry.group ?? entry.key;
    layersBySet.set(set, [...(layersBySet.get(set) ?? []), entry]);
  }
  const oneShots = manifest.audio.filter((entry) => entry.kind === 'sfx');
  const decoded = new Map<string, AudioBuffer>();
  const inflight = new Map<string, { context: AudioContext; promise: Promise<AudioBuffer | null> }>();
  const sets = new Set<MusicSet>();
  const sfxVoices = new Map<string, SfxVoice[]>();
  let settings = { ...initialSettings };
  let context: AudioContext | null = null;
  let graph: AudioGraph | null = null;
  let ambience: Ambience | null = null;
  let ambienceTheme: string | null = null;
  let musicKey: string | null = null;
  let intensity: MusicIntensity = 'explore';
  let currentSet: MusicSet | null = null;
  let unlocked = false;
  let paused = false;
  let ducked = false;
  let disposed = false;
  let stingerUntil = 0;

  function applySettings(): void {
    if (!context || !graph) return;
    try {
      const now = context.currentTime;
      const masterLevel = settings.muted || paused ? 0 : safeVolume(settings.masterVolume);
      graph.master.gain.setValueAtTime(masterLevel, now);
      graph.music.gain.setValueAtTime(safeVolume(settings.musicVolume), now);
      graph.sfx.gain.setValueAtTime(safeVolume(settings.sfxVolume), now);
      graph.ambience.gain.setValueAtTime(safeVolume(settings.sfxVolume) * AMBIENCE_LEVEL, now);
      glide(graph.atmosphere.gain, ducked ? MENU_DUCK : 1, now, 0.2);
    } catch {
      // Audio settings are best-effort; a browser audio failure must not stop play.
    }
  }

  function ensureGraph(): boolean {
    if (disposed) return false;
    if (!context) context = createContext();
    if (!context) return false;
    if (graph) return true;
    try {
      const master = context.createGain();
      const music = context.createGain();
      const stingerDuck = context.createGain();
      const atmosphere = context.createGain();
      const ambienceBus = context.createGain();
      const sfx = context.createGain();
      music.connect(stingerDuck);
      stingerDuck.connect(atmosphere);
      ambienceBus.connect(atmosphere);
      atmosphere.connect(master);
      sfx.connect(master);
      master.connect(context.destination);
      graph = { master, music, stingerDuck, atmosphere, ambience: ambienceBus, sfx };
      applySettings();
      return true;
    } catch {
      graph = null;
      return false;
    }
  }

  function ensureAmbience(): void {
    if (ambience || !context || !graph || disposed) return;
    try {
      ambience = createAmbience(context, graph.ambience);
      ambience.setDuck(intensity === 'explore' ? 0 : COMBAT_AMBIENCE_DUCK);
    } catch {
      ambience = null;
    }
  }

  async function decodeFrom(url: string, targetContext: AudioContext): Promise<AudioBuffer | null> {
    try {
      const base = typeof document === 'undefined' ? undefined : document.baseURI;
      const response = await fetch(base ? new URL(url, base).toString() : url);
      if (!response.ok) return null;
      const encoded = await response.arrayBuffer();
      return await targetContext.decodeAudioData(encoded);
    } catch {
      return null;
    }
  }

  async function decodeEntry(entry: AssetAudio, targetContext: AudioContext): Promise<AudioBuffer | null> {
    // Music ships as Ogg Vorbis; browsers that cannot decode it (older Safari) get the AAC copy.
    const buffer = await decodeFrom(entry.url, targetContext);
    if (buffer || !entry.fallbackUrl) return buffer;
    return decodeFrom(entry.fallbackUrl, targetContext);
  }

  async function loadBuffer(entry: AssetAudio, targetContext: AudioContext): Promise<AudioBuffer | null> {
    const existing = decoded.get(entry.key);
    if (existing) return existing;
    // setMusic() and the unlock preload can ask for the same track at once; share one download.
    let request = inflight.get(entry.key);
    if (!request || request.context !== targetContext) {
      request = { context: targetContext, promise: decodeEntry(entry, targetContext) };
      inflight.set(entry.key, request);
      void request.promise.finally(() => { if (inflight.get(entry.key) === request) inflight.delete(entry.key); });
    }
    const buffer = await request.promise;
    if (!buffer || disposed || context !== targetContext) return null;
    decoded.set(entry.key, buffer);
    return buffer;
  }

  async function loadOneShots(targetContext: AudioContext): Promise<void> {
    await Promise.all(oneShots.map((entry) => loadBuffer(entry, targetContext)));
  }

  /** Frees decoded music that no playing or wanted set needs. */
  function evictMusic(): void {
    const keep = new Set<string>();
    for (const set of sets) if (!set.released) for (const voice of set.layers) keep.add(voice.key);
    for (const entry of layersBySet.get(musicKey ?? '') ?? []) keep.add(entry.key);
    for (const [key] of decoded) {
      const entry = audioByKey.get(key);
      if (entry?.kind === 'music' && !keep.has(key)) decoded.delete(key);
    }
  }

  function releaseSet(set: MusicSet, stop: boolean): void {
    if (set.released) return;
    set.released = true;
    for (const voice of set.layers) {
      voice.source.onended = null;
      if (stop) {
        try { voice.source.stop(); } catch { /* A source can already have ended. */ }
      }
      try { voice.source.disconnect(); } catch { /* Already disconnected. */ }
      try { voice.gain.disconnect(); } catch { /* Already disconnected. */ }
    }
    try { set.gain.disconnect(); } catch { /* Already disconnected. */ }
    sets.delete(set);
    if (currentSet === set) currentSet = null;
    evictMusic();
  }

  function fadeSetOut(set: MusicSet, now: number): void {
    if (!context || set.released) return;
    glide(set.gain.gain, 0, now, SET_FADE_OUT);
    try {
      for (const voice of set.layers) voice.source.stop(now + SET_RELEASE_SECONDS);
      set.layers[0]!.source.onended = () => releaseSet(set, false);
    } catch {
      releaseSet(set, true);
    }
  }

  function applyIntensity(): void {
    if (!context) return;
    const now = context.currentTime;
    for (const voice of currentSet?.layers ?? []) {
      const target = layerLevel(voice.layer, intensity);
      glide(voice.gain.gain, target, now, target > voice.gain.gain.value ? LAYER_RISE : LAYER_FALL);
    }
    ambience?.setDuck(intensity === 'explore' ? 0 : COMBAT_AMBIENCE_DUCK);
  }

  async function startDesiredMusic(): Promise<void> {
    const targetContext = context;
    if (!targetContext || !graph || !unlocked || paused || disposed || !musicKey) return;
    if (currentSet?.key === musicKey) return;
    const wanted = musicKey;
    const entries = layersBySet.get(wanted);
    if (!entries?.length) return;
    const buffers = await Promise.all(entries.map((entry) => loadBuffer(entry, targetContext)));
    if (disposed || context !== targetContext || paused || musicKey !== wanted || currentSet?.key === wanted || !graph) return;
    const playable = entries.flatMap((entry, index) => (buffers[index] ? [{ entry, buffer: buffers[index]! }] : []));
    if (!playable.some(({ entry }) => (entry.layer ?? 'base') === 'base')) return;

    for (const set of [...sets]) if (set !== currentSet) releaseSet(set, true);
    const previous = currentSet;
    // Start every layer on the same sample a moment ahead, so they stay locked together.
    const startAt = targetContext.currentTime + 0.06;
    const set: MusicSet = { key: wanted, gain: targetContext.createGain(), layers: [], released: false };
    try {
      set.gain.connect(graph.music);
      set.gain.gain.setValueAtTime(0, startAt);
      set.gain.gain.setTargetAtTime(1, startAt, previous ? SET_FADE_IN : FIRST_SET_FADE_IN);
      for (const { entry, buffer } of playable) {
        const layer = entry.layer ?? 'base';
        const source = targetContext.createBufferSource();
        const gain = targetContext.createGain();
        source.buffer = buffer;
        source.loop = entry.loop;
        gain.gain.setValueAtTime(layerLevel(layer, intensity), startAt);
        source.connect(gain);
        gain.connect(set.gain);
        set.layers.push({ key: entry.key, layer, source, gain });
      }
      for (const voice of set.layers) voice.source.start(startAt);
      set.layers[0]!.source.onended = () => releaseSet(set, false);
      sets.add(set);
      currentSet = set;
      if (previous) fadeSetOut(previous, startAt);
      evictMusic();
    } catch {
      releaseSet(set, true);
      currentSet = previous;
    }
  }

  function duckForStinger(entry: AssetAudio, buffer: AudioBuffer): void {
    if (!context || !graph || entry.duck === undefined) return;
    const now = context.currentTime;
    const until = now + Math.max(0.3, buffer.duration - 0.8);
    stingerUntil = Math.max(stingerUntil, until);
    glide(graph.stingerDuck.gain, entry.duck, now, 0.08);
    try { graph.stingerDuck.gain.setTargetAtTime(1, stingerUntil, 0.7); } catch { /* best-effort */ }
  }

  function releaseSfxVoice(voice: SfxVoice, stop: boolean): void {
    if (voice.released) return;
    voice.released = true;
    voice.source.onended = null;
    if (stop) {
      try { voice.source.stop(); } catch { /* A source can already have ended. */ }
    }
    try { voice.source.disconnect(); } catch { /* Already disconnected. */ }
    try { voice.gain.disconnect(); } catch { /* Already disconnected. */ }
    const voices = sfxVoices.get(voice.key);
    if (voices) {
      const index = voices.indexOf(voice);
      if (index >= 0) voices.splice(index, 1);
      if (voices.length === 0) sfxVoices.delete(voice.key);
    }
  }

  async function unlock(): Promise<void> {
    if (disposed || !ensureGraph() || !context) return;
    const targetContext = context;
    try {
      await targetContext.resume();
      unlocked = targetContext.state === 'running';
    } catch {
      unlocked = false;
      return;
    }
    if (!unlocked || paused || disposed) {
      applySettings();
      return;
    }
    ensureAmbience();
    ambience?.setPreset(ambienceTheme);
    // The click that unlocks audio usually also changes screens; wait for that frame so a set
    // about to be replaced (e.g. the title theme on "continue") is never downloaded.
    await Promise.all([loadOneShots(targetContext), nextFrame().then(startDesiredMusic)]);
  }

  return {
    unlock,

    async setMusic(key: string | null): Promise<void> {
      if (disposed || (key !== null && !layersBySet.has(key))) return;
      if (musicKey === key && currentSet?.key === key) return;
      musicKey = key;
      if (!unlocked || paused || !ensureGraph() || !context) return;
      try {
        await startDesiredMusic();
      } catch {
        // Missing or unsupported music degrades to silence.
      }
    },

    setMusicIntensity(level: MusicIntensity): void {
      if (disposed || level === intensity) return;
      intensity = level;
      applyIntensity();
    },

    setAmbience(themeKey: string | null): void {
      if (disposed) return;
      ambienceTheme = themeKey;
      if (unlocked && !paused) ambience?.setPreset(themeKey);
    },

    playSfx(key: string): void {
      if (disposed || paused || !unlocked || !context || context.state !== 'running' || !ensureGraph() || !graph) return;
      const entry = audioByKey.get(key);
      if (!entry || entry.kind !== 'sfx') return;
      const buffer = decoded.get(key);
      if (!buffer) return;
      try {
        const voices = sfxVoices.get(key) ?? [];
        while (voices.length >= MAX_SFX_VOICES_PER_KEY) releaseSfxVoice(voices[0]!, true);
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = false;
        if (entry.variance) {
          try { source.playbackRate.value = 2 ** (((Math.random() * 2 - 1) * entry.variance) / 1200); } catch { /* fixed pitch */ }
        }
        source.connect(gain);
        gain.connect(graph.sfx);
        gain.gain.setValueAtTime(1, context.currentTime);
        const voice: SfxVoice = { key, source, gain, released: false };
        voices.push(voice);
        sfxVoices.set(key, voices);
        source.onended = () => releaseSfxVoice(voice, false);
        source.start();
        duckForStinger(entry, buffer);
      } catch {
        // A transient audio failure only drops this sound effect.
      }
    },

    setSettings(nextSettings: Settings): void {
      if (disposed) return;
      settings = {
        ...nextSettings,
        masterVolume: safeVolume(nextSettings.masterVolume),
        musicVolume: safeVolume(nextSettings.musicVolume),
        sfxVolume: safeVolume(nextSettings.sfxVolume),
        bindings: { ...nextSettings.bindings },
      };
      applySettings();
    },

    setPaused(nextPaused: boolean): void {
      if (disposed || paused === nextPaused) return;
      paused = nextPaused;
      applySettings();
      const targetContext = context;
      if (!targetContext || !unlocked) return;
      if (paused) {
        void targetContext.suspend().catch(() => applySettings());
        return;
      }
      void targetContext.resume().then(async () => {
        unlocked = targetContext.state === 'running';
        applySettings();
        if (unlocked) {
          ensureAmbience();
          ambience?.setPreset(ambienceTheme);
          await Promise.all([loadOneShots(targetContext), startDesiredMusic()]);
        }
      }).catch(() => {
        unlocked = false;
        applySettings();
      });
    },

    setDucked(nextDucked: boolean): void {
      if (disposed || ducked === nextDucked) return;
      ducked = nextDucked;
      applySettings();
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      unlocked = false;
      paused = true;
      for (const set of [...sets]) releaseSet(set, true);
      for (const voices of [...sfxVoices.values()]) {
        for (const voice of [...voices]) releaseSfxVoice(voice, true);
      }
      ambience?.dispose();
      ambience = null;
      if (graph) {
        for (const node of Object.values(graph)) {
          try { node.disconnect(); } catch { /* Already disconnected. */ }
        }
      }
      graph = null;
      decoded.clear();
      const closingContext = context;
      context = null;
      if (closingContext) void closingContext.close().catch(() => undefined);
    },
  };
}
