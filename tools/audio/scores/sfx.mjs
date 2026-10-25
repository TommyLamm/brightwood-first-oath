// Layered sound effects. Each recipe returns a mono Float32Array at SR; the generator trims,
// fades and peak-normalises them. Layers follow the usual game-audio split: a transient (what
// you notice), a body (what it weighs) and a tail/sweetener (what it is made of).

import { Biquad, SR, Svf, TAU, clamp, rng, seconds, softClip } from '../lib/dsp.mjs';
import { pluck } from '../lib/instruments.mjs';

const buffer = (length) => new Float32Array(seconds(length));

function mixInto(target, source, at = 0, gain = 1) {
  const offset = seconds(at);
  for (let i = 0; i < source.length && offset + i < target.length; i += 1) target[offset + i] += source[i] * gain;
  return target;
}

/** Band-passed noise whose centre sweeps exponentially through `path` (Hz) — swings, swirls, wind. */
function whoosh(random, length, { path = [400, 2400, 900], peakAt = 0.35, q = 1.6, curve = 2 } = {}) {
  const out = buffer(length);
  const filter = new Svf(path[0], q);
  const n = out.length;
  for (let i = 0; i < n; i += 1) {
    const p = i / n;
    const segment = Math.min(path.length - 2, Math.floor(p * (path.length - 1)));
    const local = p * (path.length - 1) - segment;
    const centre = path[segment] * (path[segment + 1] / path[segment]) ** local;
    if ((i & 15) === 0) filter.set(centre, q);
    filter.tick(random.bi());
    const env = p < peakAt ? (p / peakAt) ** curve : ((1 - p) / (1 - peakAt)) ** (curve * 0.8);
    out[i] = filter.band * env * 1.8;
  }
  return out;
}

/** Pitch-falling sine "body" (impacts, drops). */
function thump(length, from, to, { decay = 0.08, drive = 1.4 } = {}) {
  const out = buffer(length);
  let phase = 0;
  for (let i = 0; i < out.length; i += 1) {
    const t = i / SR;
    const f = to + (from - to) * Math.exp(-t / (decay * 0.5));
    phase += TAU * f / SR;
    out[i] = softClip(Math.sin(phase) * Math.exp(-t / decay), drive);
  }
  return out;
}

/** Filtered noise burst (transients, crunch, cloth). */
function burst(random, length, { type = 'bandpass', freq = 2500, q = 1, decay = 0.02, attack = 0.0008 } = {}) {
  const out = buffer(length);
  const filter = new Biquad(type, freq, q);
  for (let i = 0; i < out.length; i += 1) {
    const t = i / SR;
    out[i] = filter.tick(random.bi()) * clamp(t / attack, 0, 1) * Math.exp(-t / decay);
  }
  return out;
}

/** Metallic ring from inharmonic partials (blades, armour, coins). */
function ring(random, length, partials, { decay = 0.25, level = 1 } = {}) {
  const out = buffer(length);
  for (const [frequency, amp, decayScale = 1] of partials) {
    let phase = random() * TAU;
    const tau = decay * decayScale;
    for (let i = 0; i < out.length; i += 1) {
      phase += TAU * frequency / SR;
      out[i] += Math.sin(phase) * amp * level * Math.exp(-(i / SR) / tau) * clamp(i / 30, 0, 1);
    }
  }
  return out;
}

/** FM chirp blips for magic sparkles. */
function sparkle(random, length, { count = 6, low = 1800, high = 4200, spread = 0.5, decay = 0.12, rising = true } = {}) {
  const out = buffer(length);
  for (let k = 0; k < count; k += 1) {
    const at = (k / count) * spread * length + random() * 0.02;
    const frequency = rising ? low + (high - low) * (k / Math.max(1, count - 1)) : high - (high - low) * (k / Math.max(1, count - 1));
    const note = ring(random, decay * 4, [[frequency * (1 + random.bi() * 0.02), 1], [frequency * 2.01, 0.25, 0.5]], { decay });
    mixInto(out, note, at, 0.5 + random() * 0.3);
  }
  return out;
}

/** Growl: saw with lowpass and tremolo, sliding in pitch (monster voices). */
function growl(random, length, { from = 110, to = 70, cutoff = 900, tremolo = 22, rough = 0.4 } = {}) {
  const out = buffer(length);
  const filter = new Svf(cutoff, 1.4);
  const formant = new Biquad('peak', 650, 2, 8);
  let phase = 0;
  for (let i = 0; i < out.length; i += 1) {
    const p = i / out.length;
    const t = i / SR;
    const f = from * (to / from) ** p * (1 + 0.04 * Math.sin(TAU * 6 * t)) * (1 + rough * 0.02 * random.bi());
    phase += f / SR;
    if (phase >= 1) phase -= 1;
    const saw = 2 * phase - 1 + random.bi() * rough * 0.3;
    if ((i & 15) === 0) filter.set(cutoff * (0.6 + 0.6 * Math.sin(Math.PI * p)), 1.4);
    const am = 1 - 0.35 * (1 + Math.sin(TAU * tremolo * t)) * 0.5;
    const env = clamp(t / 0.06, 0, 1) * Math.min(1, (1 - p) * 4);
    out[i] = formant.tick(filter.tick(saw)) * am * env;
  }
  return out;
}

function fadeTail(samples, length = 0.02) {
  const fade = Math.min(samples.length, seconds(length));
  for (let i = 0; i < fade; i += 1) samples[samples.length - 1 - i] *= i / fade;
  return samples;
}

const RECIPES = {
  'ui-click': (r) => {
    const out = buffer(0.09);
    mixInto(out, burst(r, 0.05, { freq: 3200, q: 2.5, decay: 0.006 }), 0, 0.9);
    mixInto(out, ring(r, 0.08, [[1480, 0.6], [2960, 0.18]], { decay: 0.018 }), 0, 0.7);
    return out;
  },
  'panel-open': (r) => {
    const out = buffer(0.32);
    mixInto(out, whoosh(r, 0.24, { path: [500, 2600], peakAt: 0.7, q: 0.9 }), 0, 0.55);
    mixInto(out, burst(r, 0.06, { freq: 1800, q: 1.2, decay: 0.012 }), 0.2, 0.7);
    mixInto(out, ring(r, 0.12, [[880, 0.4], [1320, 0.2]], { decay: 0.03 }), 0.2, 0.4);
    return out;
  },
  dialogue: (r) => {
    const out = buffer(0.5);
    mixInto(out, pluck(587.33, 0.3, 0.45, r, { decay: 0.6, bright: 0.5, pick: 0.2, body: 0.5 }), 0, 0.7);
    mixInto(out, pluck(880, 0.3, 0.4, r, { decay: 0.5, bright: 0.5, pick: 0.2 }), 0.06, 0.5);
    return out;
  },
  jump: (r) => {
    const out = buffer(0.26);
    mixInto(out, whoosh(r, 0.2, { path: [350, 1500], peakAt: 0.3, q: 1.1 }), 0, 0.7);
    mixInto(out, burst(r, 0.06, { type: 'lowpass', freq: 900, q: 0.8, decay: 0.012 }), 0, 0.8);
    mixInto(out, burst(r, 0.08, { freq: 2600, q: 0.7, decay: 0.02 }), 0.01, 0.25);
    return out;
  },
  attack: (r) => {
    const out = buffer(0.34);
    mixInto(out, whoosh(r, 0.28, { path: [450, 3200, 1100], peakAt: 0.32, q: 2.2 }), 0, 0.9);
    mixInto(out, whoosh(r, 0.22, { path: [1800, 6500, 2500], peakAt: 0.35, q: 3 }), 0.02, 0.3);
    mixInto(out, ring(r, 0.3, [[2730, 0.25], [3910, 0.18, 0.7], [5320, 0.1, 0.5]], { decay: 0.09 }), 0.06, 0.25);
    return out;
  },
  'attack-heavy': (r) => {
    const out = buffer(0.6);
    mixInto(out, whoosh(r, 0.45, { path: [220, 1900, 500], peakAt: 0.42, q: 1.6, curve: 2.5 }), 0, 1);
    mixInto(out, thump(0.4, 120, 48, { decay: 0.14, drive: 2 }), 0.17, 0.75);
    mixInto(out, ring(r, 0.45, [[1910, 0.3], [2870, 0.22, 0.8], [4410, 0.12, 0.6]], { decay: 0.14 }), 0.16, 0.3);
    return out;
  },
  'attack-sweep': (r) => {
    const out = buffer(0.55);
    mixInto(out, whoosh(r, 0.5, { path: [300, 2600, 700, 2100, 500], peakAt: 0.45, q: 1.8 }), 0, 1);
    mixInto(out, whoosh(r, 0.42, { path: [1500, 5200, 1800], peakAt: 0.5, q: 2.6 }), 0.04, 0.35);
    mixInto(out, ring(r, 0.4, [[2460, 0.2], [3720, 0.15, 0.7]], { decay: 0.12 }), 0.2, 0.25);
    return out;
  },
  hit: (r) => {
    const out = buffer(0.24);
    mixInto(out, burst(r, 0.02, { type: 'highpass', freq: 3500, q: 0.7, decay: 0.003 }), 0, 0.9);
    mixInto(out, thump(0.18, 180, 70, { decay: 0.05, drive: 1.8 }), 0, 0.9);
    mixInto(out, burst(r, 0.1, { freq: 1300, q: 0.9, decay: 0.03 }), 0.003, 0.6);
    return out;
  },
  'crit-hit': (r) => {
    const out = buffer(0.62);
    mixInto(out, burst(r, 0.02, { type: 'highpass', freq: 3000, q: 0.7, decay: 0.004 }), 0, 1);
    mixInto(out, thump(0.3, 220, 55, { decay: 0.09, drive: 2.4 }), 0, 1);
    mixInto(out, burst(r, 0.14, { freq: 1100, q: 0.8, decay: 0.045 }), 0.003, 0.7);
    mixInto(out, ring(r, 0.6, [[1760, 0.35], [2640, 0.3, 0.8], [3960, 0.2, 0.6], [5280, 0.12, 0.5]], { decay: 0.2 }), 0.005, 0.45);
    mixInto(out, sparkle(r, 0.5, { count: 4, low: 2600, high: 4800, spread: 0.25, decay: 0.08 }), 0.03, 0.3);
    return out;
  },
  hurt: (r) => {
    const out = buffer(0.36);
    mixInto(out, burst(r, 0.03, { freq: 2200, q: 0.7, decay: 0.006 }), 0, 0.7);
    mixInto(out, thump(0.28, 140, 60, { decay: 0.08, drive: 2 }), 0, 0.9);
    mixInto(out, burst(r, 0.2, { type: 'lowpass', freq: 700, q: 0.8, decay: 0.05 }), 0.005, 0.5);
    // armour rattle
    mixInto(out, ring(r, 0.25, [[3150, 0.15], [4320, 0.12], [5770, 0.08]], { decay: 0.05 }), 0.02, 0.35);
    return out;
  },
  pickup: (r) => {
    const out = buffer(0.42);
    mixInto(out, ring(r, 0.3, [[1975.5, 0.7], [3951, 0.18], [5928, 0.06]], { decay: 0.11 }), 0, 0.7);
    mixInto(out, ring(r, 0.36, [[2637, 0.7], [5274, 0.16], [7911, 0.05]], { decay: 0.14 }), 0.07, 0.7);
    return out;
  },
  potion: (r) => {
    const out = buffer(0.7);
    for (let k = 0; k < 5; k += 1) {
      const bubble = buffer(0.08);
      let phase = 0;
      const base = 380 + r() * 260;
      for (let i = 0; i < bubble.length; i += 1) {
        const t = i / SR;
        phase += TAU * base * (1 + 2.2 * t / 0.08) / SR;
        bubble[i] = Math.sin(phase) * Math.exp(-t / 0.022);
      }
      mixInto(out, bubble, 0.02 + k * 0.065 + r() * 0.015, 0.55);
    }
    mixInto(out, sparkle(r, 0.55, { count: 6, low: 1500, high: 3800, spread: 0.6, decay: 0.12 }), 0.22, 0.5);
    return out;
  },
  equip: (r) => {
    const out = buffer(0.4);
    mixInto(out, burst(r, 0.12, { freq: 1600, q: 0.6, decay: 0.035 }), 0, 0.5);
    mixInto(out, ring(r, 0.32, [[1240, 0.4], [2350, 0.3, 0.8], [3480, 0.18, 0.6]], { decay: 0.1 }), 0.03, 0.6);
    mixInto(out, ring(r, 0.25, [[1860, 0.35], [3120, 0.2, 0.7]], { decay: 0.07 }), 0.1, 0.5);
    return out;
  },
  guard: (r) => {
    const out = buffer(1.1);
    mixInto(out, ring(r, 0.9, [[620, 0.5], [1310, 0.45, 0.8], [2080, 0.3, 0.6], [2990, 0.18, 0.5]], { decay: 0.35 }), 0, 0.6);
    mixInto(out, thump(0.3, 160, 80, { decay: 0.08 }), 0, 0.5);
    // a rising protective hum
    const hum = buffer(1);
    for (let i = 0; i < hum.length; i += 1) {
      const t = i / SR;
      const env = Math.sin(Math.PI * Math.min(1, t / 0.9)) ** 2;
      hum[i] = (Math.sin(TAU * 293.66 * t) + 0.6 * Math.sin(TAU * 440 * t) + 0.4 * Math.sin(TAU * 587.33 * t * (1 + 0.003 * Math.sin(TAU * 5 * t)))) * env * 0.3;
    }
    mixInto(out, hum, 0.05, 0.6);
    mixInto(out, sparkle(r, 0.8, { count: 5, low: 1200, high: 3000, spread: 0.6, decay: 0.15 }), 0.1, 0.25);
    return out;
  },
  'monster-die': (r) => {
    const out = buffer(0.75);
    mixInto(out, whoosh(r, 0.4, { path: [1400, 300], peakAt: 0.1, q: 0.8 }), 0, 0.7);
    mixInto(out, thump(0.3, 160, 60, { decay: 0.07 }), 0, 0.5);
    mixInto(out, sparkle(r, 0.65, { count: 5, low: 900, high: 2600, spread: 0.5, decay: 0.1, rising: false }), 0.08, 0.45);
    return out;
  },
  telegraph: (r) => {
    const out = buffer(0.62);
    mixInto(out, growl(r, 0.55, { from: 75, to: 95, cutoff: 700, tremolo: 18 }), 0, 0.8);
    mixInto(out, whoosh(r, 0.55, { path: [200, 1200], peakAt: 0.85, q: 2.5, curve: 2.5 }), 0, 0.5);
    mixInto(out, ring(r, 0.4, [[1567, 0.3], [2349, 0.2]], { decay: 0.12 }), 0.08, 0.2);
    return out;
  },
  'boss-phase': (r) => {
    const out = buffer(1.35);
    mixInto(out, growl(r, 1.2, { from: 120, to: 62, cutoff: 1300, tremolo: 26, rough: 0.8 }), 0, 0.9);
    mixInto(out, growl(r, 1.1, { from: 180, to: 90, cutoff: 1800, tremolo: 31, rough: 0.6 }), 0.03, 0.4);
    mixInto(out, whoosh(r, 1.2, { path: [300, 900, 250], peakAt: 0.25, q: 1.1 }), 0, 0.45);
    mixInto(out, thump(0.9, 70, 32, { decay: 0.35, drive: 2.2 }), 0, 0.7);
    return out;
  },
  portal: (r) => {
    const out = buffer(1.3);
    mixInto(out, whoosh(r, 1.2, { path: [180, 900, 3200, 1400], peakAt: 0.55, q: 3.2, curve: 1.6 }), 0, 0.8);
    mixInto(out, sparkle(r, 1.1, { count: 9, low: 1046, high: 4186, spread: 0.6, decay: 0.16 }), 0.15, 0.4);
    const swell = buffer(1.2);
    for (let i = 0; i < swell.length; i += 1) {
      const t = i / SR;
      swell[i] = Math.sin(TAU * (110 + 90 * t) * t) * Math.sin(Math.PI * Math.min(1, t / 1.2)) * 0.5;
    }
    mixInto(out, swell, 0, 0.5);
    return out;
  },
  'stele-tune': (r) => {
    const out = buffer(0.55);
    // A muted stone tap under a pair of softly ringing mineral/copper partials.
    mixInto(out, thump(0.16, 205, 92, { decay: 0.055, drive: 1.25 }), 0, 0.18);
    mixInto(out, ring(r, 0.5, [[587.33, 0.46, 0.9], [880, 0.23, 0.68], [1174.66, 0.12, 0.52], [1760, 0.055, 0.38]], { decay: 0.23, level: 0.78 }), 0.008, 0.62);
    mixInto(out, ring(r, 0.4, [[739.99, 0.16, 0.8], [1479.98, 0.065, 0.5]], { decay: 0.19, level: 0.68 }), 0.075, 0.24);
    return out;
  },
};

export const SFX_KEYS = Object.keys(RECIPES);

/** Per-sound loudness trim (dB) applied after peak normalisation, so busy layers don't jump out. */
const TRIM = {
  'ui-click': -9, 'panel-open': -8, dialogue: -7, jump: -6, attack: -3, 'attack-heavy': -1, 'attack-sweep': -2,
  hit: -2, 'crit-hit': -1, hurt: -2, pickup: -6, potion: -5, equip: -5, guard: -4, 'monster-die': -4,
  telegraph: -3, 'boss-phase': 0, portal: -4, 'stele-tune': -5,
};

export function renderSfx(key) {
  const random = rng(Math.abs([...key].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16_777_619), 2_166_136_261)));
  const samples = RECIPES[key](random);
  // Gentle DC/rumble cut, then peak-normalise to -1 dBFS and apply the trim.
  const hp = new Biquad('highpass', 30, 0.7);
  for (let i = 0; i < samples.length; i += 1) samples[i] = hp.tick(samples[i]);
  fadeTail(samples);
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  const gain = (10 ** (-1 / 20) / Math.max(peak, 1e-9)) * 10 ** ((TRIM[key] ?? 0) / 20);
  for (let i = 0; i < samples.length; i += 1) samples[i] *= gain;
  return samples;
}
