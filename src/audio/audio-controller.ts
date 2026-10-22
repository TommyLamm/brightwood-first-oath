import type { AssetAudio, AssetManifest } from '../contracts/asset-manifest.js';
import type { AudioController } from '../contracts/ports.js';
import type { Settings } from '../contracts/types.js';

const CROSS_FADE_SECONDS = 0.4;
const MAX_SFX_VOICES_PER_KEY = 4;

type AudioGraph = {
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
};

type MusicVoice = {
  key: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
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

/**
 * Creates a lazy Web Audio controller. It does not create an AudioContext or
 * play anything until the host calls unlock() from a player gesture.
 */
export function createAudio(manifest: AssetManifest, initialSettings: Settings): AudioController {
  const audioByKey = new Map(manifest.audio.map((entry) => [entry.key, entry]));
  const decoded = new Map<string, AudioBuffer>();
  const inflight = new Map<string, { context: AudioContext; promise: Promise<AudioBuffer | null> }>();
  const musicVoices = new Set<MusicVoice>();
  const sfxVoices = new Map<string, SfxVoice[]>();
  let settings = { ...initialSettings };
  let context: AudioContext | null = null;
  let graph: AudioGraph | null = null;
  let musicKey: string | null = null;
  let currentMusic: MusicVoice | null = null;
  let unlocked = false;
  let paused = false;
  let disposed = false;

  function applySettings(): void {
    if (!context || !graph) return;
    try {
      const now = context.currentTime;
      const masterLevel = settings.muted || paused ? 0 : safeVolume(settings.masterVolume);
      graph.master.gain.setValueAtTime(masterLevel, now);
      graph.music.gain.setValueAtTime(safeVolume(settings.musicVolume), now);
      graph.sfx.gain.setValueAtTime(safeVolume(settings.sfxVolume), now);
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
      const sfx = context.createGain();
      music.connect(master);
      sfx.connect(master);
      master.connect(context.destination);
      graph = { master, music, sfx };
      applySettings();
      return true;
    } catch {
      graph = null;
      return false;
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

  async function loadAllBuffers(targetContext: AudioContext): Promise<void> {
    await Promise.all(manifest.audio.map((entry) => loadBuffer(entry, targetContext)));
  }

  function releaseMusicVoice(voice: MusicVoice, stop: boolean): void {
    if (voice.released) return;
    voice.released = true;
    voice.source.onended = null;
    if (stop) {
      try { voice.source.stop(); } catch { /* A source can already have ended. */ }
    }
    try { voice.source.disconnect(); } catch { /* Already disconnected. */ }
    try { voice.gain.disconnect(); } catch { /* Already disconnected. */ }
    musicVoices.delete(voice);
    if (currentMusic === voice) currentMusic = null;
  }

  function fadeMusicOut(voice: MusicVoice, now: number): void {
    if (!context || voice.released) return;
    try {
      const parameter = voice.gain.gain;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(parameter.value, now);
      parameter.linearRampToValueAtTime(0, now + CROSS_FADE_SECONDS);
      voice.source.stop(now + CROSS_FADE_SECONDS);
    } catch {
      releaseMusicVoice(voice, true);
    }
  }

  async function startDesiredMusic(): Promise<void> {
    const targetContext = context;
    if (!targetContext || !graph || !unlocked || paused || disposed || !musicKey) return;
    if (currentMusic?.key === musicKey) return;
    const entry = audioByKey.get(musicKey);
    if (!entry || entry.kind !== 'music') return;
    const buffer = await loadBuffer(entry, targetContext);
    if (!buffer || disposed || context !== targetContext || paused || musicKey !== entry.key) return;

    for (const voice of [...musicVoices]) {
      if (voice !== currentMusic) releaseMusicVoice(voice, true);
    }

    const now = targetContext.currentTime;
    const previous = currentMusic;
    try {
      const source = targetContext.createBufferSource();
      const gain = targetContext.createGain();
      source.buffer = buffer;
      source.loop = entry.loop;
      source.connect(gain);
      gain.connect(graph.music);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + CROSS_FADE_SECONDS);
      const voice: MusicVoice = { key: entry.key, source, gain, released: false };
      source.onended = () => releaseMusicVoice(voice, false);
      musicVoices.add(voice);
      source.start(now);
      currentMusic = voice;
      if (previous) fadeMusicOut(previous, now);
    } catch {
      if (currentMusic && currentMusic !== previous) releaseMusicVoice(currentMusic, true);
      currentMusic = previous;
    }
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
    await loadAllBuffers(targetContext);
    if (disposed || context !== targetContext) return;
    await startDesiredMusic();
  }

  return {
    unlock,

    async setMusic(key: string): Promise<void> {
      if (disposed) return;
      const entry = audioByKey.get(key);
      if (!entry || entry.kind !== 'music') return;
      if (musicKey === key && currentMusic?.key === key) return;
      musicKey = key;
      if (!unlocked || paused || !ensureGraph() || !context) return;
      try {
        await loadBuffer(entry, context);
        await startDesiredMusic();
      } catch {
        // Missing or unsupported music degrades to silence.
      }
    },

    playSfx(key: string): void {
      if (disposed || paused || !unlocked || !context || context.state !== 'running' || !ensureGraph() || !graph) return;
      const entry = audioByKey.get(key);
      if (!entry || entry.kind !== 'sfx') return;
      const buffer = decoded.get(key);
      if (!buffer) return;
      try {
        const voices = sfxVoices.get(key) ?? [];
        while (voices.length >= MAX_SFX_VOICES_PER_KEY) releaseSfxVoice(voices[0], true);
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = false;
        source.connect(gain);
        gain.connect(graph.sfx);
        gain.gain.setValueAtTime(1, context.currentTime);
        const voice: SfxVoice = { key, source, gain, released: false };
        voices.push(voice);
        sfxVoices.set(key, voices);
        source.onended = () => releaseSfxVoice(voice, false);
        source.start();
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
          await loadAllBuffers(targetContext);
          await startDesiredMusic();
        }
      }).catch(() => {
        unlocked = false;
        applySettings();
      });
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      unlocked = false;
      paused = true;
      for (const voice of [...musicVoices]) releaseMusicVoice(voice, true);
      for (const voices of [...sfxVoices.values()]) {
        for (const voice of [...voices]) releaseSfxVoice(voice, true);
      }
      if (graph) {
        try { graph.music.disconnect(); } catch { /* Already disconnected. */ }
        try { graph.sfx.disconnect(); } catch { /* Already disconnected. */ }
        try { graph.master.disconnect(); } catch { /* Already disconnected. */ }
      }
      graph = null;
      decoded.clear();
      const closingContext = context;
      context = null;
      if (closingContext) void closingContext.close().catch(() => undefined);
    },
  };
}
