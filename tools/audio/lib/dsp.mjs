// Offline DSP building blocks for the Brightwood score and effects. Everything is deterministic:
// randomness comes from seeded generators so a regenerated file is byte-identical.

export const SR = 48_000;
export const TAU = Math.PI * 2;

export const midiHz = (note) => 440 * 2 ** ((note - 69) / 12);
export const dbGain = (db) => 10 ** (db / 20);
export const gainDb = (gain) => 20 * Math.log10(Math.max(gain, 1e-12));
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/** mulberry32: small, fast, good enough for audio jitter and noise. */
export function rng(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  next.range = (low, high) => low + (high - low) * next();
  next.bi = () => next() * 2 - 1;
  next.pick = (list) => list[Math.floor(next() * list.length)];
  next.fork = () => rng(Math.floor(next() * 4_294_967_296));
  return next;
}

/** Hashes a label into a seed so each note/voice gets stable but distinct randomness. */
export function seedOf(...parts) {
  let hash = 2_166_136_261;
  for (const char of parts.join('|')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export const seconds = (count) => Math.round(count * SR);

/** PolyBLEP residual for band-limited saw/square oscillators. */
export function polyBlep(phase, dt) {
  if (phase < dt) {
    const t = phase / dt;
    return t + t - t * t - 1;
  }
  if (phase > 1 - dt) {
    const t = (phase - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

/** Topology-preserving state-variable filter (Simper); cheap to modulate per block. */
export class Svf {
  constructor(cutoff = 1000, q = 0.707) {
    this.ic1 = 0;
    this.ic2 = 0;
    this.set(cutoff, q);
  }

  set(cutoff, q = this.q) {
    this.q = q;
    const g = Math.tan(Math.PI * clamp(cutoff, 10, SR * 0.49) / SR);
    const k = 1 / q;
    this.k = k;
    this.a1 = 1 / (1 + g * (g + k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
  }

  /** Returns [low, band, high] for one sample. */
  tick(x) {
    const v3 = x - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.low = v2;
    this.band = v1;
    this.high = x - this.k * v1 - v2;
    return v2;
  }
}

/** RBJ cookbook biquad, transposed direct form II. */
export class Biquad {
  constructor(type, frequency, q = 0.707, gain = 0) {
    this.z1 = 0;
    this.z2 = 0;
    this.set(type, frequency, q, gain);
  }

  set(type, frequency, q = 0.707, gain = 0) {
    const w = TAU * clamp(frequency, 5, SR * 0.49) / SR;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    const a = 10 ** (gain / 40);
    let b0; let b1; let b2; let a0; let a1; let a2;
    switch (type) {
      case 'lowpass':
        b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; break;
      case 'highpass':
        b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; break;
      case 'bandpass':
        b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha; break;
      case 'peak':
        b0 = 1 + alpha * a; b1 = -2 * cos; b2 = 1 - alpha * a; a0 = 1 + alpha / a; a1 = -2 * cos; a2 = 1 - alpha / a; break;
      case 'lowshelf': {
        const s = 2 * Math.sqrt(a) * alpha;
        b0 = a * ((a + 1) - (a - 1) * cos + s); b1 = 2 * a * ((a - 1) - (a + 1) * cos); b2 = a * ((a + 1) - (a - 1) * cos - s);
        a0 = (a + 1) + (a - 1) * cos + s; a1 = -2 * ((a - 1) + (a + 1) * cos); a2 = (a + 1) + (a - 1) * cos - s; break;
      }
      case 'highshelf': {
        const s = 2 * Math.sqrt(a) * alpha;
        b0 = a * ((a + 1) + (a - 1) * cos + s); b1 = -2 * a * ((a - 1) + (a + 1) * cos); b2 = a * ((a + 1) + (a - 1) * cos - s);
        a0 = (a + 1) - (a - 1) * cos + s; a1 = 2 * ((a - 1) - (a + 1) * cos); a2 = (a + 1) - (a - 1) * cos - s; break;
      }
      default: throw new Error(`unknown biquad ${type}`);
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }

  tick(x) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }

  run(buffer) {
    for (let i = 0; i < buffer.length; i += 1) buffer[i] = this.tick(buffer[i]);
    return buffer;
  }
}

export function filter(buffer, type, frequency, q, gain) {
  return new Biquad(type, frequency, q, gain).run(buffer);
}

/** Seeded white noise. */
export function whiteNoise(length, random) {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) out[i] = random.bi();
  return out;
}

/** Paul Kellet's economical pink noise. */
export function pinkNoise(length, random) {
  const out = new Float32Array(length);
  let b0 = 0; let b1 = 0; let b2 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = random.bi();
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    out[i] = (b0 + b1 + b2 + white * 0.1848) * 0.16;
  }
  return out;
}

export function brownNoise(length, random) {
  const out = new Float32Array(length);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = (last + 0.02 * random.bi()) / 1.02;
    out[i] = last * 3.5;
  }
  return out;
}

/** Linear-segment envelope: points are [timeSeconds, level]; curve > 1 makes segments exponential-ish. */
export function envelope(length, points, curve = 1) {
  const out = new Float32Array(length);
  let index = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / SR;
    while (index < points.length - 2 && t >= points[index + 1][0]) index += 1;
    const [t0, v0] = points[index];
    const [t1, v1] = points[Math.min(index + 1, points.length - 1)];
    if (t >= t1) { out[i] = v1; continue; }
    let p = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
    if (curve !== 1) p = v1 < v0 ? 1 - (1 - p) ** curve : p ** (1 / curve);
    out[i] = v0 + (v1 - v0) * p;
  }
  return out;
}

/** Classic attack/decay/sustain/release; `hold` is the gate length in seconds. Returns envelope incl. release. */
export function adsr(hold, { a = 0.01, d = 0.1, s = 0.8, r = 0.2, peak = 1 } = {}) {
  const gate = Math.max(hold, a + 0.001);
  const length = seconds(gate + r);
  const out = new Float32Array(length);
  const aS = Math.max(1, seconds(a));
  const dS = Math.max(1, seconds(d));
  const gS = seconds(gate);
  let level = 0;
  for (let i = 0; i < length; i += 1) {
    if (i < gS) {
      if (i < aS) level = peak * (i / aS);
      else if (i < aS + dS) level = peak + (s * peak - peak) * ((i - aS) / dS);
      else level = s * peak;
      out[i] = level;
    } else {
      const p = (i - gS) / Math.max(1, length - gS);
      out[i] = level * (1 - p) ** 2.2;
    }
  }
  return out;
}

export function scale(buffer, gain) {
  for (let i = 0; i < buffer.length; i += 1) buffer[i] *= gain;
  return buffer;
}

export function multiply(buffer, env) {
  const count = Math.min(buffer.length, env.length);
  for (let i = 0; i < count; i += 1) buffer[i] *= env[i];
  for (let i = count; i < buffer.length; i += 1) buffer[i] = 0;
  return buffer;
}

export function addInto(target, source, offset = 0, gain = 1) {
  for (let i = 0; i < source.length; i += 1) {
    const index = offset + i;
    if (index < 0) continue;
    if (index >= target.length) break;
    target[index] += source[i] * gain;
  }
  return target;
}

export function peakOf(...buffers) {
  let peak = 0;
  for (const buffer of buffers) for (const value of buffer) peak = Math.max(peak, Math.abs(value));
  return peak;
}

export function softClip(value, drive = 1) {
  return Math.tanh(value * drive) / Math.tanh(drive);
}

/** Stereo buffer pair. */
export const stereo = (length) => ({ L: new Float32Array(length), R: new Float32Array(length) });

/**
 * A loopable stereo mix. Sounds that run past the end wrap round to the start, so the
 * decaying tail of the last bar rings under the first bar exactly like a performance would.
 */
export class LoopMix {
  constructor(length, { wrap = true } = {}) {
    this.length = length;
    this.wrap = wrap;
    this.dry = stereo(length);
    this.send = stereo(length);
  }

  add(mono, start, { gain = 1, pan = 0, send = 0.25 } = {}) {
    const angle = (clamp(pan, -1, 1) + 1) * Math.PI / 4;
    const gl = Math.cos(angle) * gain * Math.SQRT2;
    const gr = Math.sin(angle) * gain * Math.SQRT2;
    const { L, R } = this.dry;
    const sL = this.send.L;
    const sR = this.send.R;
    const n = this.length;
    for (let i = 0; i < mono.length; i += 1) {
      let index = start + i;
      if (index >= n || index < 0) {
        if (!this.wrap) continue;
        index = ((index % n) + n) % n;
      }
      const v = mono[i];
      L[index] += v * gl;
      R[index] += v * gr;
      if (send > 0) {
        sL[index] += v * gl * send;
        sR[index] += v * gr * send;
      }
    }
  }
}

/** Freeverb-style stereo hall: 8 damped combs + 4 allpasses per side, with pre-delay and input EQ. */
export function hallReverb(input, { size = 0.86, damp = 0.32, preDelay = 0.022, low = 220, high = 7800, loop = true } = {}) {
  const ratio = SR / 44_100;
  const combTunings = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpassTunings = [556, 441, 341, 225];
  const spread = 23;
  const n = input.L.length;
  const passes = loop ? 2 : 1;
  const out = stereo(n);
  const sides = [input.L, input.R].map((source, side) => {
    const hp = new Biquad('highpass', low, 0.6);
    const lp = new Biquad('lowpass', high, 0.6);
    const combs = combTunings.map((t) => ({
      buffer: new Float32Array(Math.round((t + side * spread) * ratio * 1.18)), index: 0, store: 0,
    }));
    const allpasses = allpassTunings.map((t) => ({
      buffer: new Float32Array(Math.round((t + side * spread) * ratio)), index: 0,
    }));
    const delay = new Float32Array(Math.max(1, seconds(preDelay)));
    return { source, hp, lp, combs, allpasses, delay, delayIndex: 0, target: side === 0 ? out.L : out.R };
  });
  for (let pass = 0; pass < passes; pass += 1) {
    const write = pass === passes - 1;
    for (const state of sides) {
      const { source, hp, lp, combs, allpasses, delay, target } = state;
      for (let i = 0; i < n; i += 1) {
        const pre = delay[state.delayIndex];
        delay[state.delayIndex] = lp.tick(hp.tick(source[i])) * 0.015;
        state.delayIndex = (state.delayIndex + 1) % delay.length;
        let sum = 0;
        for (const comb of combs) {
          const value = comb.buffer[comb.index];
          comb.store = value * (1 - damp) + comb.store * damp;
          comb.buffer[comb.index] = pre + comb.store * size;
          comb.index = (comb.index + 1) % comb.buffer.length;
          sum += value;
        }
        for (const allpass of allpasses) {
          const buffered = allpass.buffer[allpass.index];
          const outValue = buffered - sum;
          allpass.buffer[allpass.index] = sum + buffered * 0.5;
          allpass.index = (allpass.index + 1) % allpass.buffer.length;
          sum = outValue;
        }
        if (write) target[i] = sum;
      }
    }
  }
  return out;
}

/** Stereo-linked feed-forward compressor with soft knee. Runs twice when looping so its state wraps. */
export function compress(mix, { threshold = -18, ratio = 2.5, attack = 0.02, release = 0.25, makeup = 0, loop = true } = {}) {
  const n = mix.L.length;
  const aCoef = Math.exp(-1 / (attack * SR));
  const rCoef = Math.exp(-1 / (release * SR));
  let envelopeDb = -120;
  const gains = new Float32Array(n);
  for (let pass = 0; pass < (loop ? 2 : 1); pass += 1) {
    for (let i = 0; i < n; i += 1) {
      const level = gainDb(Math.max(Math.abs(mix.L[i]), Math.abs(mix.R[i])));
      envelopeDb = level > envelopeDb ? aCoef * envelopeDb + (1 - aCoef) * level : rCoef * envelopeDb + (1 - rCoef) * level;
      const over = envelopeDb - threshold;
      const knee = 6;
      let reduction = 0;
      if (over > knee / 2) reduction = over * (1 - 1 / ratio);
      else if (over > -knee / 2) reduction = ((over + knee / 2) ** 2 / (2 * knee)) * (1 - 1 / ratio);
      gains[i] = dbGain(makeup - reduction);
    }
  }
  for (let i = 0; i < n; i += 1) {
    mix.L[i] *= gains[i];
    mix.R[i] *= gains[i];
  }
  return mix;
}

/** Look-ahead brickwall limiter on a stereo pair; the ceiling is in dBFS. */
export function limit(mix, { ceiling = -1, lookahead = 0.004, release = 0.12, loop = true } = {}) {
  const n = mix.L.length;
  const ceil = dbGain(ceiling);
  const ahead = seconds(lookahead);
  const rCoef = Math.exp(-1 / (release * SR));
  const needed = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const peak = Math.max(Math.abs(mix.L[i]), Math.abs(mix.R[i]));
    needed[i] = peak > ceil ? ceil / peak : 1;
  }
  // Minimum over the look-ahead window (circular when looping) so the gain is down before the peak.
  const windowMin = new Float32Array(n);
  const at = (index) => (index < n ? needed[index] : loop ? needed[index - n] : 1);
  const deque = [];
  let head = 0;
  for (let index = 0; index < n + ahead; index += 1) {
    const value = at(index);
    while (deque.length > head && at(deque[deque.length - 1]) >= value) deque.pop();
    deque.push(index);
    const i = index - ahead;
    if (i < 0) continue;
    while (deque[head] < i) head += 1;
    windowMin[i] = at(deque[head]);
    if (head > 4096) { deque.splice(0, head); head = 0; }
  }
  let gain = 1;
  const gains = new Float32Array(n);
  for (let pass = 0; pass < (loop ? 2 : 1); pass += 1) {
    for (let i = 0; i < n; i += 1) {
      const target = windowMin[i];
      gain = target < gain ? target : target - (target - gain) * rCoef;
      gains[i] = gain;
    }
  }
  for (let i = 0; i < n; i += 1) {
    mix.L[i] = clamp(mix.L[i] * gains[i], -ceil, ceil);
    mix.R[i] = clamp(mix.R[i] * gains[i], -ceil, ceil);
  }
  return mix;
}

/** Integrated loudness in LUFS (BS.1770 K-weighting and gating, RBJ approximation of the filters). */
export function loudness(mix) {
  const channels = [mix.L, ...(mix.R ? [mix.R] : [])].map((channel) => {
    const shelf = new Biquad('highshelf', 1681, 0.7071, 4);
    const hp = new Biquad('highpass', 38, 0.5);
    const out = new Float32Array(channel.length);
    for (let i = 0; i < channel.length; i += 1) out[i] = hp.tick(shelf.tick(channel[i]));
    return out;
  });
  const block = seconds(0.4);
  const hop = seconds(0.1);
  const powers = [];
  for (let start = 0; start + block <= channels[0].length; start += hop) {
    let sum = 0;
    for (const channel of channels) {
      for (let i = start; i < start + block; i += 1) sum += channel[i] * channel[i];
    }
    powers.push(sum / block);
  }
  if (powers.length === 0) return -70;
  const lufs = (power) => -0.691 + 10 * Math.log10(Math.max(power, 1e-12));
  const absolute = powers.filter((power) => lufs(power) > -70);
  if (absolute.length === 0) return -70;
  const mean = absolute.reduce((a, b) => a + b, 0) / absolute.length;
  const relative = absolute.filter((power) => lufs(power) > lufs(mean) - 10);
  return lufs(relative.reduce((a, b) => a + b, 0) / relative.length);
}

/** Cubic-interpolated read for fractional delay/pitch effects. */
export function readCubic(buffer, position) {
  const i = Math.floor(position);
  const f = position - i;
  const at = (k) => buffer[Math.min(buffer.length - 1, Math.max(0, k))];
  const y0 = at(i - 1); const y1 = at(i); const y2 = at(i + 1); const y3 = at(i + 2);
  return y1 + 0.5 * f * (y2 - y0 + f * (2 * y0 - 5 * y1 + 4 * y2 - y3 + f * (3 * (y1 - y2) + y3 - y0)));
}
