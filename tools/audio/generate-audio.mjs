// Renders the Brightwood score and sound effects, encodes them and writes the audio manifest.
//
//   node tools/audio/generate-audio.mjs            render everything, encode, validate
//   node tools/audio/generate-audio.mjs --only theme-town,attack   re-render just these keys
//   node tools/audio/generate-audio.mjs --check    validate the committed files only
//
// Music: 48 kHz stereo, Ogg Vorbis (q5) with an AAC/M4A copy for browsers whose Web Audio
// cannot decode Vorbis (Safari before 18.4). Effects: 48 kHz mono PCM16 WAV (no codec delay).
// Needs ffmpeg on PATH, or FFMPEG=/path/to/ffmpeg.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, stat, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SR, loudness, rng } from './lib/dsp.mjs';
import { masterLayers, renderScore } from './lib/score.mjs';
import { MUSIC } from './scores/music.mjs';
import { SFX_KEYS, renderSfx } from './scores/sfx.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO_DIR = path.join(ROOT, 'public/assets/audio');
const MUSIC_LUFS = -16;
const STINGER_LUFS = -15;
/** Music ducks under these one-shots (gain multiplier on the music bus while they play). */
const STINGER_DUCK = { 'boss-win': 0.25, death: 0.2, levelup: 0.55, quest: 0.6 };
/** Random pitch variation in cents so repeated combat sounds never machine-gun. */
const SFX_VARIANCE = { attack: 45, 'attack-heavy': 30, 'attack-sweep': 35, hit: 60, 'crit-hit': 30, hurt: 40, jump: 40, 'monster-die': 50, pickup: 20, telegraph: 25 };
const MUSIC_ENCODINGS = [
  { ext: 'ogg', args: ['-c:a', 'libvorbis', '-q:a', '5'] },
  { ext: 'm4a', args: ['-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart'] },
];

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (!spawnSync('ffmpeg', ['-version']).error) return 'ffmpeg';
  // winget installs ffmpeg without refreshing PATH for already-running shells.
  const packages = path.join(process.env.LOCALAPPDATA ?? '', 'Microsoft/WinGet/Packages');
  if (existsSync(packages)) {
    for (const entry of readdirSync(packages).filter((name) => name.startsWith('Gyan.FFmpeg'))) {
      for (const build of readdirSync(path.join(packages, entry))) {
        const candidate = path.join(packages, entry, build, 'bin', 'ffmpeg.exe');
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return null;
}

const FFMPEG = findFfmpeg();

function ffmpeg(args) {
  if (!FFMPEG) throw new Error('ffmpeg is required to encode/verify music; install it or set FFMPEG=/path/to/ffmpeg');
  const result = spawnSync(FFMPEG, ['-v', 'error', '-y', ...args], { maxBuffer: 1024 * 1024 * 1024 });
  if (result.error) throw new Error(`ffmpeg failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`ffmpeg failed: ${result.stderr.toString()}`);
  return result.stdout;
}

/** 32-bit float WAV, used only as the lossless hand-off to the encoders. */
function encodeFloatWav(channels) {
  const frames = channels[0].length;
  const dataLength = frames * channels.length * 4;
  const wav = Buffer.alloc(44 + dataLength);
  wav.write('RIFF', 0, 'ascii');
  wav.writeUInt32LE(36 + dataLength, 4);
  wav.write('WAVEfmt ', 8, 'ascii');
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(3, 20);
  wav.writeUInt16LE(channels.length, 22);
  wav.writeUInt32LE(SR, 24);
  wav.writeUInt32LE(SR * channels.length * 4, 28);
  wav.writeUInt16LE(channels.length * 4, 32);
  wav.writeUInt16LE(32, 34);
  wav.write('data', 36, 'ascii');
  wav.writeUInt32LE(dataLength, 40);
  let offset = 44;
  for (let i = 0; i < frames; i += 1) {
    for (const channel of channels) {
      wav.writeFloatLE(channel[i], offset);
      offset += 4;
    }
  }
  return wav;
}

/** Mono PCM16 WAV with TPDF dither for the shipped effects. */
function encodePcm16(samples, seed) {
  const random = rng(seed);
  const dataLength = samples.length * 2;
  const wav = Buffer.alloc(44 + dataLength);
  wav.write('RIFF', 0, 'ascii');
  wav.writeUInt32LE(36 + dataLength, 4);
  wav.write('WAVEfmt ', 8, 'ascii');
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(SR, 24);
  wav.writeUInt32LE(SR * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36, 'ascii');
  wav.writeUInt32LE(dataLength, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const dither = (random() - random()) / 32_768;
    const value = Math.max(-1, Math.min(1, samples[i] + dither));
    wav.writeInt16LE(Math.round(value * 32_767), 44 + i * 2);
  }
  return wav;
}

// ── Catalogue ───────────────────────────────────────────────────────────────────────────────

const tracks = MUSIC.map((build) => build());
const fileKey = (key) => key.replace(':', '-');

function manifestEntries() {
  const entries = [];
  for (const track of tracks) {
    for (const { layer } of track.layers) {
      const key = layer === 'base' ? track.key : `${track.key}:${layer}`;
      const base = `assets/audio/${fileKey(key)}`;
      if (track.stinger) {
        entries.push({ key, url: `${base}.ogg`, fallbackUrl: `${base}.m4a`, kind: 'sfx', loop: false, duck: STINGER_DUCK[key] });
      } else {
        entries.push({ key, url: `${base}.ogg`, fallbackUrl: `${base}.m4a`, kind: 'music', loop: true, group: track.key, layer });
      }
    }
  }
  for (const key of SFX_KEYS) {
    entries.push({ key, url: `assets/audio/${key}.wav`, kind: 'sfx', loop: false, ...(SFX_VARIANCE[key] ? { variance: SFX_VARIANCE[key] } : {}) });
  }
  return entries;
}

// ── Render ──────────────────────────────────────────────────────────────────────────────────

async function renderTrack(track, scratch) {
  const started = Date.now();
  const mixes = track.layers.map(({ score, levels }) => renderScore(score, {
    levels: { ...track.levels, ...(levels ?? {}) }, reverb: track.reverb ?? {},
  }));
  masterLayers(mixes, { lufs: track.stinger ? STINGER_LUFS : MUSIC_LUFS, loop: !track.stinger });
  const report = [];
  for (const [index, { layer }] of track.layers.entries()) {
    const key = layer === 'base' ? track.key : `${track.key}:${layer}`;
    const source = path.join(scratch, `${fileKey(key)}.wav`);
    await writeFile(source, encodeFloatWav([mixes[index].L, mixes[index].R]));
    for (const { ext, args } of MUSIC_ENCODINGS) {
      ffmpeg(['-i', source, ...args, '-map_metadata', '-1', '-fflags', '+bitexact', path.join(AUDIO_DIR, `${fileKey(key)}.${ext}`)]);
    }
    report.push(`${key} ${loudness(mixes[index]).toFixed(1)} LUFS`);
  }
  process.stdout.write(`  ${report.join(' · ')} (${((Date.now() - started) / 1000).toFixed(1)} s)\n`);
}

async function generate(only) {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'bw-audio-'));
  try {
    for (const track of tracks) {
      if (only && !only.has(track.key)) continue;
      process.stdout.write(`rendering ${track.key}\n`);
      await renderTrack(track, scratch);
    }
    for (const key of SFX_KEYS) {
      if (only && !only.has(key)) continue;
      await writeFile(path.join(AUDIO_DIR, `${key}.wav`), encodePcm16(renderSfx(key), key.length * 7919));
    }
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
  const entries = manifestEntries();
  const manifest = { version: 1, pack: 'audio', images: [], animations: [], audio: entries };
  await writeFile(path.join(AUDIO_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  // Remove files from earlier generations that the manifest no longer references.
  const keep = new Set(['manifest.json', ...entries.flatMap(({ url, fallbackUrl }) => [url, fallbackUrl].filter(Boolean).map((u) => path.basename(u)))]);
  for (const name of await readdir(AUDIO_DIR)) {
    if (!keep.has(name)) await unlink(path.join(AUDIO_DIR, name));
  }
}

// ── Validate ────────────────────────────────────────────────────────────────────────────────

function decodeStereo(file) {
  const pcm = ffmpeg(['-i', file, '-f', 'f32le', '-acodec', 'pcm_f32le', '-ac', '2', '-ar', String(SR), '-']);
  const frames = pcm.length / 8;
  const L = new Float32Array(frames);
  const R = new Float32Array(frames);
  for (let i = 0; i < frames; i += 1) {
    L[i] = pcm.readFloatLE(i * 8);
    R[i] = pcm.readFloatLE(i * 8 + 4);
  }
  return { L, R };
}

function rms(channel, start, count) {
  let sum = 0;
  for (let i = start; i < start + count; i += 1) sum += channel[i] * channel[i];
  return Math.sqrt(sum / count);
}

function checkLoop(key, { L, R }, expectedFrames, label) {
  // Ogg keeps the exact length; AAC may pad by up to a frame that the edit list trims in browsers.
  const tolerance = label === 'ogg' ? 0 : 2048;
  assert.ok(Math.abs(L.length - expectedFrames) <= tolerance, `${key} ${label}: ${L.length} frames, expected ${expectedFrames}`);
  const window = Math.round(SR * 0.05);
  const n = Math.min(L.length, expectedFrames);
  for (const channel of [L, R]) {
    // The old generator faded every loop to silence; renders now wrap their tails round instead.
    assert.ok(rms(channel, n - window, window) > 0.002, `${key} ${label} loop end fades to silence`);
    // The step across the seam (last sample → first) must look like any other step in the file:
    // a click would be far larger than the file's 99.9th-percentile sample-to-sample change.
    const steps = new Float32Array(n - 1);
    for (let i = 1; i < n; i += 1) steps[i - 1] = Math.abs(channel[i] - channel[i - 1]);
    steps.sort();
    const typical = steps[Math.floor(steps.length * 0.999)];
    const seam = Math.abs(channel[0] - channel[n - 1]);
    assert.ok(seam <= typical * 1.5 + 1e-4, `${key} ${label} loop seam clicks (step ${seam.toFixed(4)} vs ${typical.toFixed(4)})`);
  }
  let peak = 0;
  for (const channel of [L, R]) for (const value of channel) peak = Math.max(peak, Math.abs(value));
  assert.ok(peak <= 0.98, `${key} ${label} must not clip (peak ${peak.toFixed(3)})`);
}

const skippedDecode = [];

async function validate() {
  const manifest = JSON.parse(await readFile(path.join(AUDIO_DIR, 'manifest.json'), 'utf8'));
  assert.equal(manifest.version, 1);
  assert.equal(manifest.pack, 'audio');
  assert.deepEqual(manifest.images, []);
  assert.deepEqual(manifest.animations, []);
  assert.deepEqual(manifest.audio, manifestEntries(), 'manifest.json is out of date; re-run the generator');
  for (const entry of manifest.audio) {
    assert.ok(!entry.url.startsWith('/') && !entry.url.includes('..'), `${entry.key} URL must be entry-relative`);
  }
  for (const track of tracks) {
    for (const { layer, score } of track.layers) {
      const key = layer === 'base' ? track.key : `${track.key}:${layer}`;
      const ogg = await readFile(path.join(AUDIO_DIR, `${fileKey(key)}.ogg`));
      assert.equal(ogg.toString('ascii', 0, 4), 'OggS', `${key} must be an Ogg stream`);
      assert.ok(ogg.includes(Buffer.from('vorbis')), `${key} must be Vorbis`);
      const m4a = await readFile(path.join(AUDIO_DIR, `${fileKey(key)}.m4a`));
      assert.equal(m4a.toString('ascii', 4, 8), 'ftyp', `${key} fallback must be an MP4/M4A file`);
      if (!FFMPEG) { skippedDecode.push(key); continue; }
      for (const ext of ['ogg', 'm4a']) {
        const decoded = decodeStereo(path.join(AUDIO_DIR, `${fileKey(key)}.${ext}`));
        if (track.stinger) {
          assert.ok(Math.abs(decoded.L.length - score.length) <= 2048, `${key} ${ext} length`);
        } else {
          checkLoop(key, decoded, score.length, ext);
          if (layer === 'base' && ext === 'ogg') {
            const lufs = loudness(decoded);
            assert.ok(lufs > MUSIC_LUFS - 2.5 && lufs < MUSIC_LUFS + 1, `${key} loudness ${lufs.toFixed(1)} LUFS`);
          }
        }
      }
    }
    const lengths = new Set(track.layers.map(({ score }) => score.length));
    assert.equal(lengths.size, 1, `${track.key} layers must share one length so they stay in sync`);
    if (!track.stinger) for (const { score } of track.layers) assert.equal(score.length % 640, 0, `${track.key} loop must be a multiple of 640 samples`);
  }
  for (const key of SFX_KEYS) {
    const wav = await readFile(path.join(AUDIO_DIR, `${key}.wav`));
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt16LE(20), 1, `${key} PCM format`);
    assert.equal(wav.readUInt16LE(22), 1, `${key} channel count`);
    assert.equal(wav.readUInt32LE(24), SR, `${key} sample rate`);
    assert.equal(wav.readUInt16LE(34), 16, `${key} bit depth`);
    assert.equal(wav.readUInt32LE(40), wav.length - 44, `${key} data size`);
    const duration = (wav.length - 44) / (SR * 2);
    assert.ok(duration >= 0.05 && duration <= 1.5, `${key} must be 0.05–1.5 seconds`);
    let peak = 0;
    for (let offset = 44; offset + 1 < wav.length; offset += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(offset)) / 32_768);
    assert.ok(peak <= 0.9, `${key} must leave headroom`);
  }
}

const onlyArg = process.argv.find((arg) => arg.startsWith('--only='))
  ?? (process.argv.includes('--only') ? `--only=${process.argv[process.argv.indexOf('--only') + 1]}` : null);
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;

if (!process.argv.includes('--check')) await generate(only);
await validate();

let totalBytes = 0;
for (const name of await readdir(AUDIO_DIR)) totalBytes += (await stat(path.join(AUDIO_DIR, name))).size;
const entries = manifestEntries();
if (skippedDecode.length) process.stdout.write(`ffmpeg not found: skipped decode checks for ${skippedDecode.join(', ')}\n`);
process.stdout.write(`${process.argv.includes('--check') ? 'Validated' : 'Generated and validated'} ${entries.length} audio entries `
  + `(${entries.filter(({ kind }) => kind === 'music').length} music layers, ${entries.filter(({ kind }) => kind === 'sfx').length} effects/stingers; `
  + `${(totalBytes / 1024 / 1024).toFixed(1)} MiB on disk)\n`);
