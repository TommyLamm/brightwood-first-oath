import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAudio } from '../src/audio/audio-controller.js';
import type { AssetManifest } from '../src/contracts/asset-manifest.js';
import type { Settings } from '../src/contracts/types.js';

const settings = { masterVolume: 0.8, musicVolume: 0.35, sfxVolume: 0.65, muted: false } as Settings;

const param = () => ({ value: 1, setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });

/** Minimal Web Audio stand-in whose decoder rejects Ogg, like Safari before 18.4. */
function installFakeAudio(started: unknown[], starts: (number | undefined)[] = []) {
  class FakeContext {
    state = 'suspended';
    currentTime = 0;
    destination = node();
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
    createGain() { return { ...node(), gain: param() }; }
    createBufferSource() {
      const source = { ...node(), buffer: null as unknown, loop: false, onended: null, stop: vi.fn(), playbackRate: param(),
        start: vi.fn((at?: number) => { started.push(source.buffer); starts.push(at); }) };
      return source;
    }
    async decodeAudioData(data: ArrayBuffer) {
      const kind = new TextDecoder().decode(data);
      if (kind === 'ogg') throw new DOMException('Unable to decode audio data', 'EncodingError');
      return { kind } as unknown as AudioBuffer;
    }
  }
  vi.stubGlobal('AudioContext', FakeContext);
  const fetched: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    fetched.push(url);
    const body = new TextEncoder().encode(url.endsWith('.ogg') ? 'ogg' : url.endsWith('.m4a') ? 'm4a' : 'wav');
    return { ok: true, status: 200, arrayBuffer: async () => body.buffer };
  }));
  return fetched;
}

const manifest: AssetManifest = {
  version: 1, pack: 'audio', images: [], animations: [],
  audio: [
    { key: 'theme-town', url: 'assets/audio/theme-town.ogg', fallbackUrl: 'assets/audio/theme-town.m4a', kind: 'music', loop: true },
    { key: 'ui-click', url: 'assets/audio/ui-click.wav', kind: 'sfx', loop: false },
    { key: 'theme-wood', url: 'assets/audio/theme-wood.ogg', kind: 'music', loop: true, group: 'theme-wood', layer: 'base' },
    { key: 'theme-wood:combat', url: 'assets/audio/theme-wood-combat.ogg', kind: 'music', loop: true, group: 'theme-wood', layer: 'combat' },
  ],
};

afterEach(() => { vi.unstubAllGlobals(); });

describe('music fallback encoding', () => {
  it('plays the M4A copy when the browser cannot decode Ogg Vorbis', async () => {
    const started: unknown[] = [];
    const fetched = installFakeAudio(started);
    const audio = createAudio(manifest, settings);
    await audio.setMusic('theme-town');
    await audio.unlock();
    expect(fetched).toContain('assets/audio/theme-town.ogg');
    expect(fetched).toContain('assets/audio/theme-town.m4a');
    expect(fetched.indexOf('assets/audio/theme-town.ogg')).toBeLessThan(fetched.indexOf('assets/audio/theme-town.m4a'));
    expect(started).toEqual([{ kind: 'm4a' }]);
    audio.dispose();
  });

  it('does not fetch a fallback when the primary file decodes', async () => {
    const started: unknown[] = [];
    const fetched = installFakeAudio(started);
    const audio = createAudio({ ...manifest, audio: [{ ...manifest.audio[0]!, url: 'assets/audio/theme-town.wav' }] }, settings);
    await audio.setMusic('theme-town');
    await audio.unlock();
    expect(fetched).toEqual(['assets/audio/theme-town.wav']);
    expect(started).toEqual([{ kind: 'wav' }]);
    audio.dispose();
  });
});

describe('music loading', () => {
  it('downloads a track once when setMusic and the unlock preload overlap', async () => {
    const started: unknown[] = [];
    const fetched = installFakeAudio(started);
    const audio = createAudio(manifest, settings);
    await audio.unlock();
    await Promise.all([audio.setMusic('theme-town'), audio.unlock()]);
    expect(fetched.filter((url) => url.endsWith('theme-town.ogg'))).toHaveLength(1);
    audio.dispose();
  });
});

describe('adaptive music sets', () => {
  it('starts every layer of a set on the same sample and frees the previous set', async () => {
    const started: unknown[] = [];
    const starts: (number | undefined)[] = [];
    // This fake decodes Ogg too, so tag every body as playable.
    installFakeAudio(started, starts);
    const audio = createAudio({ ...manifest, audio: manifest.audio.map((entry) => ({ ...entry, url: entry.url.replace('.ogg', '.wav') })) }, settings);
    await audio.unlock();
    await audio.setMusic('theme-wood');
    expect(started).toHaveLength(2);
    expect(new Set(starts).size).toBe(1);
    audio.setMusicIntensity('combat');
    await audio.setMusic('theme-town');
    expect(started).toHaveLength(3);
    audio.dispose();
  });

  it('holds music without downloading anything when no set is wanted', async () => {
    const started: unknown[] = [];
    const fetched = installFakeAudio(started);
    const audio = createAudio(manifest, settings);
    await audio.setMusic('theme-town');
    await audio.setMusic(null);
    await audio.unlock();
    expect(fetched.filter((url) => !url.endsWith('.wav'))).toEqual([]);
    expect(started).toEqual([]);
    audio.dispose();
  });

  it('ignores music keys it does not know', async () => {
    const started: unknown[] = [];
    installFakeAudio(started);
    const audio = createAudio(manifest, settings);
    await audio.unlock();
    await audio.setMusic('theme-unknown');
    expect(started).toEqual([]);
    audio.dispose();
  });
});
