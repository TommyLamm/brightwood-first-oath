import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22_050;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO_DIR = path.join(ROOT, 'public/assets/audio');
const TARGET_PEAK = 0.82;

const midi = (note) => 440 * 2 ** ((note - 69) / 12);

function envelope(t, duration, attack, release, pluck = false) {
  if (t < attack) return Math.max(0, t / attack);
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return pluck ? Math.exp(-2.5 * (t - attack) / duration) : 0.76;
}

function oscillator(phase, shape) {
  const sine = Math.sin(phase);
  if (shape === 'triangle') return (2 / Math.PI) * Math.asin(sine);
  if (shape === 'square') return sine < 0 ? -1 : 1;
  if (shape === 'saw') return 2 * (phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2) + 0.5));
  return sine;
}

function addTone(samples, {
  start, duration, frequency, endFrequency = frequency, amplitude, shape = 'sine',
  attack = 0.012, release = 0.06, pluck = false, partials = [],
}) {
  const first = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const count = Math.min(samples.length - first, Math.ceil(duration * SAMPLE_RATE));
  if (count <= 0) return;
  const safeAttack = Math.max(0.001, Math.min(attack, duration * 0.45));
  const safeRelease = Math.max(0.001, Math.min(release, duration * 0.45));
  const slope = (endFrequency - frequency) / duration;
  for (let i = 0; i < count; i += 1) {
    const t = i / SAMPLE_RATE;
    const env = envelope(t, duration, safeAttack, safeRelease, pluck);
    const phase = 2 * Math.PI * (frequency * t + 0.5 * slope * t * t);
    let value = oscillator(phase, shape);
    for (const [ratio, partialAmplitude] of partials) {
      value += Math.sin(phase * ratio) * partialAmplitude;
    }
    samples[first + i] += value * env * amplitude;
  }
}

function addNoise(samples, { start, duration, amplitude, seed = 1, attack = 0.01, release = 0.08, tilt = 0.985 }) {
  const first = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const count = Math.min(samples.length - first, Math.ceil(duration * SAMPLE_RATE));
  let state = seed >>> 0;
  let filtered = 0;
  for (let i = 0; i < count; i += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const white = ((state >>> 0) / 0x7fffffff) - 1;
    filtered = filtered * tilt + white * (1 - tilt);
    const t = i / SAMPLE_RATE;
    const env = envelope(t, duration, attack, release);
    samples[first + i] += filtered * env * amplitude;
  }
}

function musicEvents(style) {
  const samples = new Float32Array(SAMPLE_RATE * 20);
  const barSeconds = 2;
  const progressions = {
    town: [60, 67, 57, 62, 65, 60, 55, 62, 57, 60],
    field: [62, 69, 57, 64, 59, 66, 55, 62, 57, 69],
    boss: [50, 50, 53, 48, 50, 46, 48, 53, 50, 46],
  };
  const melodies = {
    town: [[12, null, 16, 19, 17, null, 14, 12], [14, null, 17, 21, 19, 17, null, 14],
      [12, 16, null, 19, 21, null, 19, 16], [14, null, 17, 19, 17, 14, null, 12]],
    field: [[12, 16, 19, 16, 21, 19, 16, 19], [14, 17, 21, 17, 22, 21, 17, 21],
      [12, 16, 21, 19, 24, 21, 19, 16], [14, 17, 21, 19, 24, 21, 19, 17]],
    boss: [[12, null, 15, 18, null, 17, 15, null], [12, 15, null, 18, 17, null, 15, 13],
      [10, null, 14, 17, 15, null, 14, 10], [12, null, 15, 20, 18, 17, null, 15]],
  };
  const rootNotes = progressions[style];
  const motifs = melodies[style];
  const minor = style !== 'town';

  for (let bar = 0; bar < 10; bar += 1) {
    const start = bar * barSeconds;
    const root = rootNotes[bar];
    const third = root + (minor ? 3 : 4);
    const fifth = root + 7;
    const chord = style === 'boss' ? [root, root + 6, root + 7] : [root, third, fifth];
    for (const [index, note] of chord.entries()) {
      addTone(samples, {
        start, duration: 1.96, frequency: midi(note), amplitude: style === 'boss' ? 0.075 : 0.06,
        shape: 'sine', attack: 0.1, release: 0.18, partials: [[2, 0.12]],
      });
      if (index === 0) {
        addTone(samples, { start, duration: 0.82, frequency: midi(root - 12), amplitude: 0.12,
          shape: 'triangle', attack: 0.01, release: 0.16, pluck: true });
        addTone(samples, { start: start + 1, duration: 0.7, frequency: midi(root - 5), amplitude: 0.078,
          shape: 'triangle', attack: 0.015, release: 0.14, pluck: true });
      }
    }

    const motif = motifs[bar % motifs.length];
    for (let step = 0; step < motif.length; step += 1) {
      const offset = motif[step];
      if (offset === null) continue;
      const startAt = start + step * 0.25;
      if (style === 'field') {
        if (startAt + 0.22 > 19.9) continue;
        const chordTones = [root + 12, third + 12, fifth + 12, root + 19];
        const note = chordTones[step % chordTones.length] + (step >= 4 ? 12 : 0);
        addTone(samples, { start: startAt, duration: 0.22, frequency: midi(note), amplitude: 0.105,
          shape: 'triangle', attack: 0.006, release: 0.07, pluck: true, partials: [[2, 0.12]] });
      } else {
        const duration = style === 'boss' ? 0.3 : 0.34;
        if (startAt + duration > 19.9) continue;
        addTone(samples, { start: startAt, duration,
          frequency: midi(root + offset), amplitude: style === 'boss' ? 0.11 : 0.095,
          endFrequency: style === 'boss' && step === 3 ? midi(root + offset - 1) : midi(root + offset),
          shape: style === 'boss' ? 'triangle' : 'sine', attack: 0.02, release: 0.09,
          partials: style === 'boss' ? [[2, 0.16]] : [[2, 0.1]] });
      }
    }

    if (style === 'boss') {
      for (let beat = 0; beat < 4; beat += 1) {
        addTone(samples, { start: start + beat * 0.5, duration: 0.11,
          frequency: midi(36 + (beat % 2) * 7), amplitude: 0.11, shape: 'saw', attack: 0.002,
          release: 0.09, pluck: true });
      }
    }
  }
  return samples;
}

function softenLoopEdges(samples) {
  const fadeSamples = Math.floor(SAMPLE_RATE * 0.04);
  for (let i = 0; i < fadeSamples; i += 1) {
    const progress = i / (fadeSamples - 1);
    const fadeIn = 0.5 - 0.5 * Math.cos(Math.PI * progress);
    samples[i] *= fadeIn;
    samples[samples.length - fadeSamples + i] *= 1 - fadeIn;
  }
}

function sfxEvents(key) {
  const durations = {
    'ui-click': 0.12, jump: 0.22, attack: 0.3, hit: 0.18, hurt: 0.34, pickup: 0.2,
    potion: 0.46, equip: 0.26, quest: 0.72, levelup: 1.08, portal: 0.92, death: 1.12,
    'boss-win': 1.18,
  };
  const duration = durations[key];
  const samples = new Float32Array(Math.ceil(SAMPLE_RATE * duration));
  const tone = (start, length, from, to, amplitude, shape = 'sine', partials = []) => addTone(samples, {
    start, duration: length, frequency: midi(from), endFrequency: midi(to), amplitude, shape,
    attack: Math.min(0.02, length * 0.16), release: Math.min(0.1, length * 0.28),
    pluck: key === 'ui-click' || key === 'pickup' || key === 'equip', partials,
  });
  const notes = (list, gap, baseAmplitude = 0.2) => list.forEach((note, index) => {
    tone(index * gap, Math.min(0.26, duration - index * gap), note, note, baseAmplitude, 'sine', [[2, 0.14]]);
  });

  switch (key) {
    case 'ui-click': tone(0, duration, 88, 88, 0.56, 'sine'); break;
    case 'jump':
      tone(0, duration, 48, 72, 0.38, 'triangle');
      addNoise(samples, { start: 0, duration: 0.11, amplitude: 0.11, seed: 101, tilt: 0.91 });
      break;
    case 'attack':
      tone(0.02, 0.24, 72, 43, 0.25, 'saw');
      addNoise(samples, { start: 0, duration: 0.29, amplitude: 0.34, seed: 503, tilt: 0.82 });
      break;
    case 'hit':
      tone(0, 0.16, 82, 69, 0.36, 'square', [[2.7, 0.24], [4.1, 0.11]]);
      addNoise(samples, { start: 0, duration: 0.09, amplitude: 0.2, seed: 607, tilt: 0.76 });
      break;
    case 'hurt':
      tone(0, duration, 58, 38, 0.38, 'triangle', [[1.49, 0.16]]);
      addNoise(samples, { start: 0.01, duration: 0.22, amplitude: 0.15, seed: 811, tilt: 0.88 });
      break;
    case 'pickup': notes([84, 91], 0.075, 0.34); break;
    case 'potion': notes([60, 67, 72, 79], 0.095, 0.2); break;
    case 'equip':
      tone(0, 0.2, 76, 76, 0.24, 'sine', [[2.75, 0.32], [4.2, 0.12]]);
      tone(0.06, 0.16, 88, 88, 0.16, 'sine');
      break;
    case 'quest': notes([67, 72, 76, 79], 0.14, 0.24); break;
    case 'levelup': notes([60, 64, 67, 72, 76, 79], 0.14, 0.22); break;
    case 'portal':
      tone(0, duration, 40, 88, 0.22, 'sine', [[2, 0.18], [3, 0.08]]);
      addNoise(samples, { start: 0, duration, amplitude: 0.16, seed: 131, tilt: 0.994 });
      break;
    case 'death': notes([76, 72, 67, 60], 0.23, 0.25); break;
    case 'boss-win': notes([67, 72, 76, 79, 84], 0.18, 0.26); break;
    default: assert.fail(`unknown sound key ${key}`);
  }
  return samples;
}

function normalize(samples, target = TARGET_PEAK) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  assert.ok(peak > 0, 'audio signal must contain sound');
  const gain = target / peak;
  for (let i = 0; i < samples.length; i += 1) samples[i] *= gain;
  return target;
}

function encodePcm16(samples) {
  const dataLength = samples.length * CHANNELS * (BITS_PER_SAMPLE / 8);
  const wav = Buffer.alloc(44 + dataLength);
  wav.write('RIFF', 0, 'ascii');
  wav.writeUInt32LE(36 + dataLength, 4);
  wav.write('WAVE', 8, 'ascii');
  wav.write('fmt ', 12, 'ascii');
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(CHANNELS, 22);
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8), 28);
  wav.writeUInt16LE(CHANNELS * (BITS_PER_SAMPLE / 8), 32);
  wav.writeUInt16LE(BITS_PER_SAMPLE, 34);
  wav.write('data', 36, 'ascii');
  wav.writeUInt32LE(dataLength, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    wav.writeInt16LE(Math.round(value * 32_767), 44 + i * 2);
  }
  return wav;
}

// Music is shipped as Ogg Vorbis (≈110–140 KB per 20 s loop instead of 862 KB of PCM) with an
// AAC/M4A copy for browsers whose Web Audio cannot decode Vorbis (Safari before 18.4).
// Short SFX stay PCM WAV: they are tiny and decode with no codec delay.
const MUSIC_ENCODINGS = [
  { ext: 'ogg', args: ['-c:a', 'libvorbis', '-q:a', '5'] },
  { ext: 'm4a', args: ['-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart'] },
];

const tracks = [
  ...['town', 'field', 'boss'].map((name) => ({
    key: `theme-${name}`, kind: 'music', loop: true,
    filename: `theme-${name}.ogg`, fallbackFilename: `theme-${name}.m4a`, render: () => musicEvents(name),
  })),
  ...['ui-click', 'jump', 'attack', 'hit', 'hurt', 'pickup', 'potion', 'equip', 'quest', 'levelup', 'portal', 'death', 'boss-win']
    .map((key) => ({ key, kind: 'sfx', loop: false, filename: `${key}.wav`, render: () => sfxEvents(key) })),
];

const hasFfmpeg = !spawnSync('ffmpeg', ['-version']).error;

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw new Error(`ffmpeg is required to encode/verify music (${result.error.message})`);
  if (result.status !== 0) throw new Error(`ffmpeg failed: ${result.stderr.toString()}`);
  return result.stdout;
}

/** Decodes a compressed music file back to mono 22.05 kHz PCM16 so it gets the same checks as a WAV. */
function decodeToPcm(file) {
  return ffmpeg(['-i', file, '-f', 's16le', '-acodec', 'pcm_s16le', '-ac', String(CHANNELS), '-ar', String(SAMPLE_RATE), '-']);
}

function measurePeak(pcm, offset = 44) {
  let peak = 0;
  for (; offset + 1 < pcm.length; offset += 2) {
    peak = Math.max(peak, Math.abs(pcm.readInt16LE(offset)) / 32_768);
  }
  return peak;
}

function checkMusicPcm(key, pcm, label) {
  const bytesPerSecond = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);
  const duration = pcm.length / bytesPerSecond;
  // AAC frames pad the end slightly; the encoder delay is trimmed by the container's edit list.
  assert.ok(Math.abs(duration - 20) < 0.05, `${key} ${label} must be 20 seconds (got ${duration})`);
  const firstSample = pcm.readInt16LE(0) / 32_768;
  const lastSample = pcm.readInt16LE(Math.floor(20 * bytesPerSecond) - 2) / 32_768;
  assert.ok(Math.abs(firstSample) < 0.02 && Math.abs(lastSample) < 0.02,
    `${key} ${label} loop boundary must fade smoothly to silence`);
  // Lossy coding can overshoot the 0.82 normalised peak a little; it must still never clip.
  assert.ok(measurePeak(pcm, 0) <= 0.95, `${key} ${label} must leave headroom`);
}

const skippedDecode = [];

async function validate() {
  const manifest = JSON.parse(await readFile(path.join(AUDIO_DIR, 'manifest.json'), 'utf8'));
  assert.equal(manifest.version, 1);
  assert.equal(manifest.pack, 'audio');
  assert.deepEqual(manifest.images, []);
  assert.deepEqual(manifest.animations, []);
  assert.equal(manifest.audio.length, 16);
  assert.equal(new Set(manifest.audio.map(({ key }) => key)).size, 16);

  for (const track of tracks) {
    const entry = manifest.audio.find(({ key }) => key === track.key);
    assert.ok(entry, `manifest missing ${track.key}`);
    assert.equal(entry.kind, track.kind);
    assert.equal(entry.loop, track.loop);
    assert.ok(!entry.url.startsWith('/') && !entry.url.includes('..'), `${track.key} URL must be entry-relative`);
    if (track.kind === 'music') {
      assert.equal(entry.url, `assets/audio/${track.filename}`, `${track.key} URL`);
      assert.equal(entry.fallbackUrl, `assets/audio/${track.fallbackFilename}`, `${track.key} fallback URL`);
      const ogg = await readFile(path.join(ROOT, 'public', entry.url));
      assert.equal(ogg.toString('ascii', 0, 4), 'OggS', `${track.key} must be an Ogg stream`);
      assert.ok(ogg.includes(Buffer.from('vorbis')), `${track.key} must be Vorbis`);
      const m4a = await readFile(path.join(ROOT, 'public', entry.fallbackUrl));
      assert.equal(m4a.toString('ascii', 4, 8), 'ftyp', `${track.key} fallback must be an MP4/M4A file`);
      // Decoding needs ffmpeg; without it --check still verifies the containers and says what it skipped.
      if (hasFfmpeg) {
        checkMusicPcm(track.key, decodeToPcm(path.join(ROOT, 'public', entry.url)), 'ogg');
        checkMusicPcm(track.key, decodeToPcm(path.join(ROOT, 'public', entry.fallbackUrl)), 'm4a');
      } else skippedDecode.push(track.key);
      continue;
    }
    assert.equal(entry.fallbackUrl, undefined, `${track.key} SFX need no fallback`);
    const wav = await readFile(path.join(ROOT, 'public', entry.url));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt32LE(16), 16, `${track.key} fmt chunk`);
    assert.equal(wav.readUInt16LE(20), 1, `${track.key} PCM format`);
    assert.equal(wav.readUInt16LE(22), CHANNELS, `${track.key} channel count`);
    assert.equal(wav.readUInt32LE(24), SAMPLE_RATE, `${track.key} sample rate`);
    assert.equal(wav.readUInt16LE(34), BITS_PER_SAMPLE, `${track.key} bit depth`);
    assert.equal(wav.readUInt32LE(40), wav.length - 44, `${track.key} data size`);
    assert.ok(wav.length > 44, `${track.key} must contain samples`);
    const duration = (wav.length - 44) / (SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8));
    assert.ok(duration >= 0.1 && duration <= 1.2, `${track.key} must be 0.1–1.2 seconds`);
    assert.ok(measurePeak(wav) <= 0.9, `${track.key} must leave PCM headroom`);
  }
}

if (!process.argv.includes('--check')) {
  if (!hasFfmpeg) throw new Error('ffmpeg is required to encode the music tracks; install it or run with --check');
  const manifest = {
    version: 1,
    pack: 'audio',
    images: [],
    animations: [],
    audio: tracks.map(({ key, kind, loop, filename, fallbackFilename }) => ({
      key,
      url: `assets/audio/${filename}`,
      ...(fallbackFilename ? { fallbackUrl: `assets/audio/${fallbackFilename}` } : {}),
      kind,
      loop,
    })),
  };
  await writeFile(path.join(AUDIO_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'bw-audio-'));
  try {
    for (const track of tracks) {
      const samples = track.render();
      if (track.kind === 'music') softenLoopEdges(samples);
      normalize(samples);
      const wav = encodePcm16(samples);
      if (track.kind !== 'music') {
        await writeFile(path.join(AUDIO_DIR, track.filename), wav);
        continue;
      }
      const source = path.join(scratch, `${track.key}.wav`);
      await writeFile(source, wav);
      for (const { ext, args } of MUSIC_ENCODINGS) {
        const out = path.join(AUDIO_DIR, ext === 'ogg' ? track.filename : track.fallbackFilename);
        ffmpeg(['-i', source, ...args, '-map_metadata', '-1', '-fflags', '+bitexact', out]);
      }
    }
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

await validate();
const primaryBytes = (await Promise.all(tracks.map(({ filename }) => readFile(path.join(AUDIO_DIR, filename)))))
  .reduce((total, file) => total + file.length, 0);
if (skippedDecode.length) {
  process.stdout.write(`ffmpeg not found: skipped decoding ${skippedDecode.join(', ')} (length, loop edge and headroom checks)\n`);
}
process.stdout.write(`${process.argv.includes('--check') ? 'Validated' : 'Generated and validated'} ${tracks.length} original tracks `
  + `(3 Ogg Vorbis music loops with M4A fallbacks, 13 PCM16 WAV effects; ${primaryBytes} bytes loaded per browser)\n`);
