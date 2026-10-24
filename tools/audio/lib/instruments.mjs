// Synthesised orchestral voices. Every function renders one note as a mono Float32Array at SR,
// including its natural release/decay tail. `vel` is 0..1; `random` is a seeded generator.

import { Biquad, SR, Svf, TAU, adsr, clamp, polyBlep, seconds, softClip, whiteNoise } from './dsp.mjs';

const velocityGain = (vel) => 0.18 + 0.82 * vel ** 1.4;

/** Bowed string section: detuned band-limited saws, delayed vibrato, bow noise and body resonances. */
export function strings(hz, dur, vel, random, {
  voices = 5, detune = 9, attack = 0.16, release = 0.45, bright = 1, vibrato = 1, tremolo = 0, sustain = 0.86,
} = {}) {
  const env = adsr(dur, { a: attack, d: 0.35, s: sustain, r: release });
  const n = env.length;
  const out = new Float32Array(n);
  for (let v = 0; v < voices; v += 1) {
    const spreadCents = voices > 1 ? detune * ((v / (voices - 1)) * 2 - 1) : 0;
    const f0 = hz * 2 ** ((spreadCents + random.bi() * 2.5) / 1200);
    let phase = random();
    let vibPhase = random() * TAU;
    let driftPhase = random() * TAU;
    const vibRate = random.range(4.7, 5.9) * TAU / SR;
    const driftRate = random.range(0.08, 0.3) * TAU / SR;
    const vibDepth = 0.0042 * vibrato * random.range(0.7, 1.2);
    const onsetDelay = random.range(0.15, 0.35);
    for (let i = 0; i < n; i += 1) {
      const t = i / SR;
      const onset = clamp((t - onsetDelay) / 0.5, 0, 1);
      const f = f0 * (1 + vibDepth * onset * Math.sin(vibPhase) + 0.0011 * Math.sin(driftPhase));
      vibPhase += vibRate;
      driftPhase += driftRate;
      const dt = f / SR;
      phase += dt;
      if (phase >= 1) phase -= 1;
      out[i] += 2 * phase - 1 - polyBlep(phase, dt);
    }
  }
  const norm = 1 / Math.sqrt(voices);
  const lp = new Svf(1000, 0.65);
  const body1 = new Biquad('peak', 420, 1.1, 2.5);
  const body2 = new Biquad('peak', 2600, 1.4, 3);
  const air = new Biquad('highshelf', 7000, 0.7, -6);
  const bow = new Svf(3200, 1.2);
  const baseCut = Math.min(14_000, hz * (2.2 + 5.5 * vel * bright) + 500 * bright);
  const tremRate = 11.5 * TAU / SR;
  for (let i = 0; i < n; i += 1) {
    if ((i & 31) === 0) lp.set(baseCut * (0.55 + 0.45 * env[i]), 0.65);
    let value = lp.tick(out[i] * norm);
    bow.tick(random.bi());
    const t = i / SR;
    value += bow.band * 0.05 * Math.exp(-t / 0.09) * vel;
    value = air.tick(body2.tick(body1.tick(value)));
    if (tremolo > 0) value *= 1 - tremolo * 0.5 * (1 + Math.sin(i * tremRate));
    out[i] = value * env[i] * velocityGain(vel);
  }
  return out;
}

/** Brass: lip scoop, envelope-driven brightness ("blare") and gentle saturation. */
export function brass(hz, dur, vel, random, {
  bright = 1, attack = 0.05, release = 0.2, voices = 3, detune = 6, sustain = 0.8,
} = {}) {
  const env = adsr(dur, { a: attack, d: 0.25, s: sustain, r: release });
  const n = env.length;
  const raw = new Float32Array(n);
  for (let v = 0; v < voices; v += 1) {
    const cents = voices > 1 ? detune * ((v / (voices - 1)) * 2 - 1) : 0;
    const f0 = hz * 2 ** ((cents + random.bi() * 2) / 1200);
    let phase = random();
    let vibPhase = random() * TAU;
    const vibRate = random.range(4.8, 5.6) * TAU / SR;
    for (let i = 0; i < n; i += 1) {
      const t = i / SR;
      const scoop = 1 - 0.022 * Math.exp(-t / 0.035);
      const vib = 1 + 0.0025 * clamp((t - 0.35) / 0.4, 0, 1) * Math.sin(vibPhase);
      vibPhase += vibRate;
      const dt = (f0 * scoop * vib) / SR;
      phase += dt;
      if (phase >= 1) phase -= 1;
      raw[i] += 2 * phase - 1 - polyBlep(phase, dt);
    }
  }
  const lp = new Svf(800, 0.9);
  const lp2 = new Svf(800, 0.6);
  const out = new Float32Array(n);
  const drive = 1 + vel * 1.6 * bright;
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const rise = clamp(t / (attack * 1.3), 0, 1);
    const fenv = rise * (0.55 + 0.45 * Math.exp(-Math.max(0, t - attack) / 0.28));
    if ((i & 15) === 0) {
      const cut = Math.min(15_000, hz * (1.1 + (2.5 + 7 * vel * bright) * fenv * (0.3 + 0.7 * env[i])));
      lp.set(cut, 0.9);
      lp2.set(cut * 1.5, 0.6);
    }
    const value = lp2.tick(lp.tick(raw[i] / Math.sqrt(voices)));
    out[i] = softClip(value * 1.4, drive) * env[i] * velocityGain(vel) * 0.8;
  }
  return out;
}

/** Flute / ney: near-sine tone, breath noise tuned to the pitch, chiff on the attack, vibrato. */
export function flute(hz, dur, vel, random, { breath = 0.12, attack = 0.06, release = 0.16, vibrato = 1, chiff = 0.35 } = {}) {
  const env = adsr(dur, { a: attack, d: 0.12, s: 0.9, r: release });
  const n = env.length;
  const out = new Float32Array(n);
  const noiseBand = new Svf(Math.min(hz * 2, 9000), 2.2);
  const chiffBand = new Svf(Math.min(hz * 4, 12_000), 1.5);
  let phase = random() * TAU;
  let vibPhase = random() * TAU;
  const vibRate = random.range(4.9, 5.5) * TAU / SR;
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const onset = clamp((t - 0.18) / 0.35, 0, 1);
    const f = hz * (1 + 0.0055 * vibrato * onset * Math.sin(vibPhase));
    vibPhase += vibRate;
    phase += TAU * f / SR;
    const tone = Math.sin(phase) + 0.2 * Math.sin(2 * phase) + 0.07 * Math.sin(3 * phase) + 0.025 * Math.sin(4 * phase);
    const white = random.bi();
    noiseBand.tick(white);
    chiffBand.tick(white);
    const breathLevel = breath * (0.6 + 0.4 * (1 + Math.sin(vibPhase * 0.5)) * 0.5);
    const value = tone * 0.8 + noiseBand.band * breathLevel * 2.2 + chiffBand.band * chiff * Math.exp(-t / 0.035);
    out[i] = value * env[i] * velocityGain(vel) * 0.6;
  }
  return out;
}

/**
 * Karplus–Strong plucked string with fractional delay, loop damping and pick-position comb.
 * `decay` is the T60 in seconds for the fundamental; `damp` releases the note after `dur`.
 */
export function pluck(hz, dur, vel, random, { decay = 3, bright = 0.6, pick = 0.13, damp = false, body = 0, noiseMix = 0.15 } = {}) {
  const ring = damp ? Math.min(decay, dur + 0.25) : decay;
  const n = seconds(ring + 0.05);
  const out = new Float32Array(n);
  const coefficient = clamp(0.25 + 0.7 * bright * (0.6 + 0.4 * vel), 0.05, 0.98);
  const filterDelay = (1 - coefficient) / coefficient;
  const period = SR / hz;
  const readDelay = Math.max(2, period - filterDelay);
  const loss = 10 ** (-3 / (decay * hz));
  const size = Math.ceil(period) + 8;
  const line = new Float32Array(size);
  const excitationLength = Math.max(2, Math.round(period));
  // A finger pulls the string into a triangle (harmonics fall as 1/n²); a little noise adds the
  // grain of nail/gut. Brighter instruments get more noise and a sharper triangle.
  const noise = whiteNoise(excitationLength, random);
  const apex = clamp(pick, 0.05, 0.5) * excitationLength;
  const grain = noiseMix;
  const combed = new Float32Array(excitationLength);
  let mean = 0;
  for (let i = 0; i < excitationLength; i += 1) {
    const shape = i < apex ? i / apex : (excitationLength - i) / (excitationLength - apex);
    combed[i] = shape * (1 - grain) + noise[i] * grain * 0.6;
    mean += combed[i];
  }
  mean /= excitationLength;
  let smooth = 0;
  const softness = clamp(0.12 + 0.85 * vel * bright, 0.08, 1);
  for (let i = 0; i < excitationLength; i += 1) {
    smooth += softness * (combed[i] - mean - smooth);
    combed[i] = smooth;
  }
  let lowpass = 0;
  let write = 0;
  const releaseStart = seconds(dur);
  for (let i = 0; i < n; i += 1) {
    let readPos = write - readDelay;
    while (readPos < 0) readPos += size;
    const i0 = Math.floor(readPos);
    const frac = readPos - i0;
    const delayed = line[i0 % size] * (1 - frac) + line[(i0 + 1) % size] * frac;
    lowpass += coefficient * (delayed - lowpass);
    let feedback = loss;
    if (damp && i > releaseStart) feedback *= 0.985;
    const value = (i < excitationLength ? combed[i] : 0) + feedback * lowpass;
    line[write] = value;
    write = (write + 1) % size;
    out[i] = value;
  }
  if (body > 0) {
    const resonance = new Biquad('peak', 260, 1.2, 4 * body);
    const resonance2 = new Biquad('peak', 1400, 1.5, 2 * body);
    for (let i = 0; i < n; i += 1) out[i] = resonance2.tick(resonance.tick(out[i]));
  }
  const fade = seconds(0.04);
  for (let i = 0; i < fade; i += 1) out[n - 1 - i] *= i / fade;
  const gain = velocityGain(vel) * 0.9;
  for (let i = 0; i < n; i += 1) out[i] *= gain;
  return out;
}

const MALLETS = {
  celesta: { ratios: [1, 2, 3, 4.17, 5.43], amps: [1, 0.36, 0.12, 0.06, 0.03], decays: [1.6, 0.8, 0.45, 0.25, 0.15], hammer: 0.06 },
  glock: { ratios: [1, 2.76, 5.4, 8.93], amps: [1, 0.45, 0.22, 0.08], decays: [2.6, 1.1, 0.5, 0.2], hammer: 0.08 },
  bell: {
    ratios: [0.5, 1, 1.183, 1.506, 2, 2.514, 2.662, 3.011, 4.166],
    amps: [0.55, 1, 0.65, 0.45, 0.5, 0.25, 0.22, 0.15, 0.08],
    decays: [7, 5, 4, 3.2, 3, 2, 1.8, 1.4, 0.9], hammer: 0.12,
  },
  chime: { ratios: [1, 2.32, 4.25, 6.63], amps: [1, 0.5, 0.25, 0.12], decays: [3.5, 2, 1.2, 0.6], hammer: 0.04 },
  anvil: { ratios: [1, 2.31, 3.78, 5.07, 6.9], amps: [1, 0.7, 0.5, 0.35, 0.2], decays: [1.1, 0.7, 0.45, 0.3, 0.2], hammer: 0.3 },
  glass: { ratios: [1, 2.01, 3.03], amps: [1, 0.12, 0.05], decays: [4, 2, 1], hammer: 0 },
};

/** Additive struck/metallic instruments with per-partial decay and a short hammer transient. */
export function mallet(hz, dur, vel, random, { kind = 'celesta', length, decayScale = 1, softAttack = 0 } = {}) {
  const preset = MALLETS[kind];
  const longest = Math.max(...preset.decays) * decayScale;
  const n = seconds(length ?? Math.min(longest * 1.2, Math.max(dur + 0.3, longest)));
  const out = new Float32Array(n);
  const strike = 0.5 + 0.5 * vel;
  for (let p = 0; p < preset.ratios.length; p += 1) {
    const f = hz * preset.ratios[p] * (1 + random.bi() * 0.0015);
    if (f >= SR * 0.45) continue;
    const amp = preset.amps[p] * (p === 0 ? 1 : strike);
    const tau = (preset.decays[p] * decayScale) / 6.9;
    const step = TAU * f / SR;
    let phase = random() * TAU;
    for (let i = 0; i < n; i += 1) {
      const t = i / SR;
      const attackGain = softAttack > 0 ? clamp(t / softAttack, 0, 1) : clamp(t / 0.0015, 0, 1);
      out[i] += Math.sin(phase) * amp * Math.exp(-t / tau) * attackGain;
      phase += step;
    }
  }
  if (preset.hammer > 0) {
    const click = new Svf(Math.min(hz * 6, 14_000), 0.8);
    const count = Math.min(n, seconds(0.02));
    for (let i = 0; i < count; i += 1) out[i] += click.tick(random.bi()) * preset.hammer * vel * Math.exp(-i / SR / 0.004);
  }
  const fade = Math.min(n, seconds(0.05));
  for (let i = 0; i < fade; i += 1) out[n - 1 - i] *= i / fade;
  const gain = velocityGain(vel) * 0.5;
  for (let i = 0; i < n; i += 1) out[i] *= gain;
  return out;
}

const VOWELS = {
  ah: [[800, 1, 8], [1150, 0.5, 9], [2900, 0.25, 12], [3900, 0.1, 14]],
  oh: [[450, 1, 8], [800, 0.4, 9], [2830, 0.16, 12], [3800, 0.06, 14]],
  oo: [[350, 1, 7], [600, 0.25, 8], [2400, 0.06, 12], [3400, 0.03, 14]],
  ee: [[270, 1, 7], [2300, 0.35, 11], [3000, 0.25, 12], [3700, 0.08, 14]],
};

/** Choir pad: a crowd of detuned saws through vowel formants, plus breath. */
export function choir(hz, dur, vel, random, { vowel = 'ah', voices = 7, attack = 0.45, release = 0.9, detune = 14 } = {}) {
  const env = adsr(dur, { a: attack, d: 0.4, s: 0.9, r: release });
  const n = env.length;
  const source = new Float32Array(n);
  for (let v = 0; v < voices; v += 1) {
    const cents = detune * ((v / Math.max(1, voices - 1)) * 2 - 1);
    const f0 = hz * 2 ** ((cents + random.bi() * 4) / 1200);
    let phase = random();
    let vibPhase = random() * TAU;
    const vibRate = random.range(4.5, 5.8) * TAU / SR;
    const depth = random.range(0.003, 0.0065);
    for (let i = 0; i < n; i += 1) {
      const f = f0 * (1 + depth * Math.sin(vibPhase));
      vibPhase += vibRate;
      const dt = f / SR;
      phase += dt;
      if (phase >= 1) phase -= 1;
      source[i] += 2 * phase - 1 - polyBlep(phase, dt);
    }
  }
  const formants = VOWELS[vowel].map(([frequency, gain, q]) => ({ filter: new Biquad('bandpass', frequency, q), gain }));
  const out = new Float32Array(n);
  const norm = 1 / Math.sqrt(voices);
  for (let i = 0; i < n; i += 1) {
    const x = source[i] * norm + random.bi() * 0.06;
    let value = 0;
    for (const formant of formants) value += formant.filter.tick(x) * formant.gain;
    out[i] = value * env[i] * velocityGain(vel) * 2.6;
  }
  return out;
}

/** Timpani: inharmonic membrane modes with a falling initial pitch and a felt mallet thud. */
export function timpani(hz, dur, vel, random, { length = 3.2 } = {}) {
  const ratios = [1, 1.504, 1.742, 2, 2.245, 2.494, 2.8];
  const amps = [1, 0.55, 0.35, 0.3, 0.18, 0.12, 0.08];
  const decays = [2.8, 1.6, 1.2, 0.9, 0.7, 0.5, 0.4];
  const n = seconds(length);
  const out = new Float32Array(n);
  for (let p = 0; p < ratios.length; p += 1) {
    let phase = random() * TAU;
    const tau = decays[p] * (0.6 + 0.4 * vel) / 6.9;
    for (let i = 0; i < n; i += 1) {
      const t = i / SR;
      const f = hz * ratios[p] * (1 + 0.035 * Math.exp(-t / 0.06));
      phase += TAU * f / SR;
      out[i] += Math.sin(phase) * amps[p] * Math.exp(-t / tau);
    }
  }
  const thud = new Svf(400 + 1400 * vel, 0.7);
  for (let i = 0; i < Math.min(n, seconds(0.05)); i += 1) out[i] += thud.tick(random.bi()) * 0.9 * Math.exp(-i / SR / 0.012);
  const gain = velocityGain(vel) * 0.5;
  for (let i = 0; i < n; i += 1) out[i] = softClip(out[i] * gain, 1.2);
  return out;
}

/** A crescendo/decrescendo timpani roll built from rapid single strokes. */
export function timpaniRoll(hz, dur, vel, random, { from = 0.25, to = 1 } = {}) {
  const n = seconds(dur + 2.5);
  const out = new Float32Array(n);
  let t = 0;
  while (t < dur) {
    const progress = t / dur;
    const strokeVel = vel * (from + (to - from) * progress) * random.range(0.85, 1.05);
    const stroke = timpani(hz, 0.1, strokeVel, random, { length: progress > 0.95 ? 2.4 : 0.9 });
    const offset = seconds(t);
    for (let i = 0; i < stroke.length && offset + i < n; i += 1) out[offset + i] += stroke[i] * 0.55;
    t += random.range(0.048, 0.062);
  }
  return out;
}

/** Big orchestral bass drum / taiko: pitch-swept sine body with skin noise. */
export function drum(hz, dur, vel, random, { length = 1.4, sweep = 1.8, skin = 0.4, tone2 = 0.25, skinFreq = 900 } = {}) {
  const n = seconds(length);
  const out = new Float32Array(n);
  let phase = 0;
  let phase2 = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const f = hz * (1 + sweep * Math.exp(-t / 0.028));
    phase += TAU * f / SR;
    phase2 += TAU * f * 1.59 / SR;
    out[i] = Math.sin(phase) * Math.exp(-t / (length * 0.32)) + Math.sin(phase2) * tone2 * Math.exp(-t / (length * 0.12));
  }
  const skinFilter = new Svf(skinFreq, 0.9);
  for (let i = 0; i < Math.min(n, seconds(0.08)); i += 1) {
    out[i] += skinFilter.tick(random.bi()) * skin * Math.exp(-i / SR / 0.018);
  }
  const gain = velocityGain(vel) * 0.85;
  for (let i = 0; i < n; i += 1) out[i] = softClip(out[i] * gain, 1.6);
  return out;
}

/** Orchestral/military snare: two shell tones plus band-limited wire noise. */
export function snare(hz, dur, vel, random, { length = 0.35, wires = 1 } = {}) {
  const n = seconds(length);
  const out = new Float32Array(n);
  const hp = new Biquad('highpass', 1800, 0.7);
  const peak = new Biquad('peak', 5200, 1, 5);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const shell = Math.sin(TAU * 185 * t) * Math.exp(-t / 0.035) + 0.6 * Math.sin(TAU * 330 * t) * Math.exp(-t / 0.025);
    const noise = peak.tick(hp.tick(random.bi())) * Math.exp(-t / (0.06 + 0.08 * wires));
    out[i] = (shell * 0.6 + noise * 0.8 * wires) * velocityGain(vel) * 0.7;
  }
  return out;
}

/** Cymbal: metallic square cluster plus bright noise. `swell` > 0 makes a reverse-envelope roll. */
export function cymbal(hz, dur, vel, random, { length = 3.5, swell = false } = {}) {
  const total = swell ? dur + 0.6 : length;
  const n = seconds(total);
  const out = new Float32Array(n);
  const metals = [205.3, 304.4, 369.6, 522.7, 540, 800].map((f) => f * 1.7 * (1 + random.bi() * 0.01));
  const phases = metals.map(() => random());
  const hp = new Biquad('highpass', 5500, 0.6);
  const hp2 = new Biquad('highpass', 3000, 0.6);
  const sheen = new Biquad('highshelf', 9000, 0.7, -4);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    let metal = 0;
    for (let m = 0; m < metals.length; m += 1) {
      phases[m] += metals[m] / SR;
      if (phases[m] >= 1) phases[m] -= 1;
      metal += phases[m] < 0.5 ? 1 : -1;
    }
    const raw = hp.tick(metal / metals.length) * 0.6 + hp2.tick(random.bi()) * 0.5;
    let env;
    if (swell) env = t < dur ? (t / dur) ** 2.6 : Math.exp(-(t - dur) / 0.12);
    else env = Math.exp(-t / (length * 0.24)) * clamp(t / 0.002, 0, 1);
    out[i] = sheen.tick(raw) * env * velocityGain(vel) * 0.55;
  }
  return out;
}

/** Hand/frame drum: "dum" (low, open) or "tek" (rim slap). */
export function handDrum(hz, dur, vel, random, { stroke = 'dum' } = {}) {
  if (stroke === 'dum') return drum(hz, dur, vel, random, { length: 0.55, sweep: 0.6, skin: 0.25, tone2: 0.3, skinFreq: 1200 });
  const n = seconds(0.16);
  const out = new Float32Array(n);
  const band = new Biquad('bandpass', 2400, 1.4);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    out[i] = (band.tick(random.bi()) * 1.6 + Math.sin(TAU * hz * 4.1 * t) * 0.3) * Math.exp(-t / 0.028) * velocityGain(vel);
  }
  return out;
}

/** Shaker / tambourine. */
export function shaker(hz, dur, vel, random, { jingles = false } = {}) {
  const n = seconds(jingles ? 0.3 : 0.12);
  const out = new Float32Array(n);
  const band = new Biquad('bandpass', 7000, 1.1);
  const partials = jingles ? [5400, 6900, 8100, 9600].map((f) => f * (1 + random.bi() * 0.02)) : [];
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const env = clamp(t / 0.008, 0, 1) * Math.exp(-t / (jingles ? 0.07 : 0.03));
    let value = band.tick(random.bi());
    for (const f of partials) value += Math.sin(TAU * f * t) * 0.15 * Math.exp(-t / 0.09);
    out[i] = value * env * velocityGain(vel) * 0.7;
  }
  return out;
}

/** Sustained glassy tone for icy string harmonics / drones. */
export function glassPad(hz, dur, vel, random, { attack = 0.8, release = 1.2 } = {}) {
  const env = adsr(dur, { a: attack, d: 0.5, s: 0.9, r: release });
  const n = env.length;
  const out = new Float32Array(n);
  const partials = [[1, 1], [2, 0.08], [3, 0.12], [5, 0.03]];
  const phases = partials.map(() => random() * TAU);
  let vib = random() * TAU;
  const vibRate = random.range(4, 5) * TAU / SR;
  for (let i = 0; i < n; i += 1) {
    vib += vibRate;
    const f = hz * (1 + 0.002 * Math.sin(vib));
    let value = 0;
    for (let p = 0; p < partials.length; p += 1) {
      phases[p] += TAU * f * partials[p][0] / SR;
      value += Math.sin(phases[p]) * partials[p][1];
    }
    out[i] = value * env[i] * velocityGain(vel) * 0.5;
  }
  return out;
}
