/**
 * Procedural ambience: every map theme gets continuous "beds" (filtered noise with slow wind gusts
 * and swells) plus one-shot events (birds, fire crackle, drips, bells…) scheduled at random
 * intervals and positions. Nothing is shipped as a file and nothing ever loops audibly.
 *
 * All Web Audio calls are best-effort: a browser that lacks a node type simply gets fewer sounds.
 */

type NoiseColour = 'white' | 'pink' | 'brown';

type Bed = {
  noise: NoiseColour;
  filter: BiquadFilterType;
  frequency: number;
  q?: number;
  gain: number;
  /** Slow sweep of the filter frequency: rate in Hz, depth as a fraction of `frequency`. */
  sweep?: { rate: number; depth: number };
  /** Slow swell of the level (waves): rate in Hz, depth 0..1. */
  swell?: { rate: number; depth: number };
  /** Random gusts: the level wanders between min..max × gain every few seconds. */
  gust?: { min: number; max: number; every: [number, number] };
};

type EventKind =
  | 'songbird' | 'tit' | 'dove' | 'seabird' | 'eagle' | 'cricket'
  | 'crackle' | 'drip' | 'droplet' | 'bell' | 'chime' | 'anvil' | 'pebble' | 'creak' | 'thud';

type EventSpec = { kind: EventKind; every: [number, number]; gain: number };

type Preset = { beds: Bed[]; events: EventSpec[]; wet: number; tones?: number[] };

const PRESETS: Record<string, Preset> = {
  camp: {
    wet: 0.18,
    beds: [
      { noise: 'brown', filter: 'lowpass', frequency: 320, gain: 0.16, sweep: { rate: 0.13, depth: 0.3 } },
      { noise: 'pink', filter: 'highpass', frequency: 3800, gain: 0.025, gust: { min: 0.3, max: 1.4, every: [3, 8] } },
    ],
    events: [
      { kind: 'crackle', every: [0.08, 0.6], gain: 0.3 },
      { kind: 'songbird', every: [2.5, 7], gain: 0.11 },
      { kind: 'tit', every: [6, 14], gain: 0.09 },
      { kind: 'dove', every: [14, 28], gain: 0.08 },
    ],
  },
  town: {
    wet: 0.2,
    beds: [
      { noise: 'pink', filter: 'bandpass', frequency: 1700, q: 0.7, gain: 0.06 },
      { noise: 'white', filter: 'bandpass', frequency: 3600, q: 1.3, gain: 0.018 },
      { noise: 'pink', filter: 'bandpass', frequency: 620, q: 1.6, gain: 0.05, swell: { rate: 0.7, depth: 0.55 }, gust: { min: 0.5, max: 1.3, every: [2, 5] } },
    ],
    events: [
      { kind: 'droplet', every: [0.05, 0.28], gain: 0.05 },
      { kind: 'songbird', every: [3, 9], gain: 0.09 },
      { kind: 'tit', every: [5, 12], gain: 0.08 },
      { kind: 'bell', every: [28, 50], gain: 0.16 },
      { kind: 'anvil', every: [7, 16], gain: 0.07 },
    ],
  },
  forest: {
    wet: 0.22,
    beds: [
      { noise: 'pink', filter: 'highpass', frequency: 2600, gain: 0.04, gust: { min: 0.25, max: 1.5, every: [2.5, 7] } },
      { noise: 'brown', filter: 'lowpass', frequency: 520, gain: 0.07, sweep: { rate: 0.05, depth: 0.4 }, gust: { min: 0.5, max: 1.2, every: [4, 9] } },
    ],
    events: [
      { kind: 'songbird', every: [1.2, 4.5], gain: 0.13 },
      { kind: 'tit', every: [4, 10], gain: 0.1 },
      { kind: 'dove', every: [10, 24], gain: 0.08 },
      { kind: 'cricket', every: [5, 12], gain: 0.04 },
    ],
  },
  rock: {
    wet: 0.3,
    beds: [
      { noise: 'brown', filter: 'bandpass', frequency: 420, q: 0.8, gain: 0.17, sweep: { rate: 0.07, depth: 0.5 }, gust: { min: 0.35, max: 1.5, every: [3, 9] } },
      { noise: 'pink', filter: 'bandpass', frequency: 1250, q: 5, gain: 0.018, sweep: { rate: 0.11, depth: 0.25 }, gust: { min: 0, max: 1.4, every: [4, 10] } },
    ],
    events: [
      { kind: 'pebble', every: [5, 13], gain: 0.13 },
      { kind: 'eagle', every: [18, 40], gain: 0.07 },
      { kind: 'anvil', every: [20, 45], gain: 0.04 },
    ],
  },
  frost: {
    wet: 0.3,
    beds: [
      { noise: 'brown', filter: 'lowpass', frequency: 750, gain: 0.15, swell: { rate: 0.09, depth: 0.8 } },
      { noise: 'white', filter: 'highpass', frequency: 6500, gain: 0.012, gust: { min: 0.3, max: 1.6, every: [2, 6] } },
      { noise: 'brown', filter: 'bandpass', frequency: 520, q: 0.9, gain: 0.08, gust: { min: 0.3, max: 1.4, every: [3, 8] } },
    ],
    events: [
      { kind: 'creak', every: [9, 22], gain: 0.07 },
      { kind: 'chime', every: [7, 16], gain: 0.04 },
      { kind: 'seabird', every: [16, 34], gain: 0.05 },
    ],
  },
  'frost-pine': {
    wet: 0.28,
    beds: [
      { noise: 'pink', filter: 'bandpass', frequency: 900, q: 2.2, gain: 0.07, sweep: { rate: 0.09, depth: 0.35 }, gust: { min: 0.2, max: 1.6, every: [2.5, 7] } },
      { noise: 'brown', filter: 'lowpass', frequency: 300, gain: 0.09 },
      { noise: 'white', filter: 'highpass', frequency: 7000, gain: 0.01, gust: { min: 0.2, max: 1.5, every: [2, 5] } },
    ],
    events: [
      { kind: 'creak', every: [7, 16], gain: 0.08 },
      { kind: 'thud', every: [10, 22], gain: 0.07 },
      { kind: 'tit', every: [9, 20], gain: 0.05 },
    ],
  },
  'frost-cave': {
    wet: 0.55,
    beds: [
      { noise: 'brown', filter: 'lowpass', frequency: 130, gain: 0.2, sweep: { rate: 0.04, depth: 0.3 } },
      { noise: 'pink', filter: 'bandpass', frequency: 310, q: 3.5, gain: 0.025, sweep: { rate: 0.06, depth: 0.2 } },
    ],
    events: [
      { kind: 'drip', every: [0.7, 3], gain: 0.2 },
      { kind: 'creak', every: [12, 26], gain: 0.06 },
      { kind: 'pebble', every: [18, 35], gain: 0.05 },
    ],
  },
  sand: {
    wet: 0.18,
    beds: [
      { noise: 'brown', filter: 'lowpass', frequency: 850, gain: 0.13, swell: { rate: 0.075, depth: 0.85 } },
      { noise: 'pink', filter: 'highpass', frequency: 3200, gain: 0.04, gust: { min: 0.3, max: 1.5, every: [2, 6] } },
    ],
    events: [
      { kind: 'seabird', every: [9, 20], gain: 0.06 },
      { kind: 'chime', every: [16, 34], gain: 0.03 },
    ],
  },
  'sand-dune': {
    wet: 0.15,
    beds: [
      { noise: 'brown', filter: 'bandpass', frequency: 360, q: 0.7, gain: 0.2, sweep: { rate: 0.06, depth: 0.45 }, gust: { min: 0.35, max: 1.6, every: [2.5, 7] } },
      { noise: 'pink', filter: 'highpass', frequency: 2600, gain: 0.06, gust: { min: 0.2, max: 1.7, every: [2, 5] } },
    ],
    events: [
      { kind: 'pebble', every: [6, 13], gain: 0.05 },
      { kind: 'eagle', every: [25, 50], gain: 0.05 },
    ],
  },
  sunwell: {
    wet: 0.4,
    tones: [220, 221.4, 330.6, 440.8],
    beds: [
      { noise: 'brown', filter: 'bandpass', frequency: 460, q: 0.8, gain: 0.1, gust: { min: 0.4, max: 1.4, every: [3, 8] } },
      { noise: 'pink', filter: 'highpass', frequency: 3000, gain: 0.025, gust: { min: 0.3, max: 1.4, every: [2, 6] } },
    ],
    events: [
      { kind: 'chime', every: [4, 10], gain: 0.07 },
      { kind: 'pebble', every: [12, 24], gain: 0.04 },
    ],
  },
};

const MAX_EVENT_VOICES = 18;
const SCHEDULE_AHEAD = 0.6;
const TICK_MS = 200;

export type Ambience = {
  setPreset(theme: string | null): void;
  /** 0..1 extra attenuation, e.g. 0.3 while fighting so music and effects read clearly. */
  setDuck(amount: number): void;
  dispose(): void;
};

type Random = () => number;

function noiseBuffer(context: BaseAudioContext, colour: NoiseColour, random: Random): AudioBuffer {
  const length = Math.round(context.sampleRate * 7);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0; let b1 = 0; let b2 = 0; let brown = 0;
  for (let i = 0; i < length; i += 1) {
    const white = random() * 2 - 1;
    if (colour === 'white') data[i] = white * 0.5;
    else if (colour === 'pink') {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.16;
    } else {
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = brown * 3.5;
    }
  }
  // Remove the drift between the last and first sample so the loop point never clicks.
  const drift = data[length - 1] - data[0];
  for (let i = 0; i < length; i += 1) data[i] -= drift * (i / (length - 1));
  return buffer;
}

function impulseResponse(context: BaseAudioContext, random: Random): AudioBuffer {
  const length = Math.round(context.sampleRate * 2.6);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const t = i / context.sampleRate;
      data[i] = (random() * 2 - 1) * Math.exp(-t / 0.55) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  return buffer;
}

const between = (random: Random, [low, high]: [number, number]) => low + (high - low) * random();

type Voice = { stop(): void };

/** One preset playing: beds, scheduled events and its own fade gain. */
class Scene {
  readonly output: GainNode;
  private readonly sources: (AudioScheduledSourceNode)[] = [];
  private readonly gusts: { gain: GainNode; bed: Bed; nextAt: number }[] = [];
  private readonly nextEventAt: number[];
  private stopped = false;

  constructor(
    private readonly context: AudioContext,
    private readonly preset: Preset,
    private readonly noise: Record<NoiseColour, AudioBuffer>,
    destination: AudioNode,
    private readonly wetSend: AudioNode,
    private readonly random: Random,
    private readonly voices: Set<Voice>,
  ) {
    this.output = context.createGain();
    this.output.gain.value = 0;
    this.output.connect(destination);
    const now = context.currentTime;
    for (const bed of preset.beds) this.startBed(bed, now);
    for (const frequency of preset.tones ?? []) this.startTone(frequency, now);
    this.nextEventAt = preset.events.map((event) => now + between(random, event.every) * random());
  }

  fadeTo(level: number, timeConstant: number): void {
    const now = this.context.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setTargetAtTime(level, now, timeConstant);
  }

  private startBed(bed: Bed, now: number): void {
    const source = this.context.createBufferSource();
    source.buffer = this.noise[bed.noise];
    source.loop = true;
    source.playbackRate.value = 0.9 + this.random() * 0.2;
    const filter = this.context.createBiquadFilter();
    filter.type = bed.filter;
    filter.frequency.value = bed.frequency;
    filter.Q.value = bed.q ?? 0.7;
    const level = this.context.createGain();
    level.gain.value = bed.gain;
    source.connect(filter).connect(level).connect(this.output);
    if (bed.sweep) this.modulate(filter.frequency, bed.frequency * bed.sweep.depth, bed.sweep.rate, now);
    if (bed.swell) {
      const swell = this.context.createGain();
      swell.gain.value = 1 - bed.swell.depth / 2;
      level.disconnect();
      level.connect(swell).connect(this.output);
      this.modulate(swell.gain, bed.swell.depth / 2, bed.swell.rate, now);
    }
    if (bed.gust) this.gusts.push({ gain: level, bed, nextAt: now });
    source.start(now, this.random() * 6);
    this.sources.push(source);
  }

  private startTone(frequency: number, now: number): void {
    const oscillator = this.context.createOscillator();
    oscillator.frequency.value = frequency;
    const level = this.context.createGain();
    level.gain.value = 0.006;
    oscillator.connect(level).connect(this.output);
    level.connect(this.wetSend);
    this.modulate(level.gain, 0.004, 0.05 + this.random() * 0.08, now);
    oscillator.start(now);
    this.sources.push(oscillator);
  }

  private modulate(parameter: AudioParam, depth: number, rate: number, now: number): void {
    const lfo = this.context.createOscillator();
    lfo.frequency.value = rate;
    const amount = this.context.createGain();
    amount.gain.value = depth;
    lfo.connect(amount).connect(parameter);
    lfo.start(now + this.random() * 2);
    this.sources.push(lfo);
  }

  /** Schedules gusts and events that fall inside the look-ahead window. */
  tick(now: number): void {
    if (this.stopped) return;
    for (const gust of this.gusts) {
      if (gust.nextAt > now + SCHEDULE_AHEAD) continue;
      const { min, max, every } = gust.bed.gust!;
      const target = gust.bed.gain * (min + (max - min) * this.random());
      gust.gain.gain.setTargetAtTime(target, Math.max(now, gust.nextAt), 0.6 + this.random() * 1.4);
      gust.nextAt = Math.max(now, gust.nextAt) + between(this.random, every);
    }
    this.preset.events.forEach((event, index) => {
      let at = this.nextEventAt[index];
      while (at < now + SCHEDULE_AHEAD) {
        if (at >= now - 0.05 && this.voices.size < MAX_EVENT_VOICES) this.trigger(event, Math.max(now, at));
        at = Math.max(at, now - 0.05) + between(this.random, event.every);
      }
      this.nextEventAt[index] = at;
    });
  }

  private trigger(event: EventSpec, at: number): void {
    try {
      const pan = this.context.createStereoPanner();
      pan.pan.value = (this.random() * 2 - 1) * 0.85;
      const level = this.context.createGain();
      level.gain.value = event.gain * (0.6 + 0.4 * this.random());
      level.connect(pan).connect(this.output);
      const send = this.context.createGain();
      send.gain.value = this.preset.wet;
      pan.connect(send).connect(this.wetSend);
      const end = synthesise(this.context, event.kind, at, level, this.noise.white, this.random);
      const voice: Voice = {
        stop: () => {
          try { level.disconnect(); pan.disconnect(); send.disconnect(); } catch { /* already gone */ }
        },
      };
      this.voices.add(voice);
      const lifetimeMs = (end - this.context.currentTime + 0.5) * 1000;
      setTimeout(() => { voice.stop(); this.voices.delete(voice); }, Math.max(100, lifetimeMs));
    } catch {
      // A missing node type only drops this one event.
    }
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    for (const source of this.sources) {
      try { source.stop(); } catch { /* not started or already stopped */ }
      try { source.disconnect(); } catch { /* already disconnected */ }
    }
    try { this.output.disconnect(); } catch { /* already disconnected */ }
  }
}

/** Builds one event's nodes starting at `at`, connected to `out`; returns when it ends. */
function synthesise(context: AudioContext, kind: EventKind, at: number, out: AudioNode, white: AudioBuffer, random: Random): number {
  const tone = (type: OscillatorType, start: number, duration: number, points: [number, number][], peak: number, attack = 0.01) => {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(points[0][1], start);
    for (const [time, frequency] of points.slice(1)) oscillator.frequency.linearRampToValueAtTime(frequency, start + time);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.setTargetAtTime(0, start + Math.max(attack, duration * 0.55), duration * 0.18);
    oscillator.connect(gain).connect(out);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.3);
    return gain;
  };
  const noise = (start: number, duration: number, type: BiquadFilterType, frequency: number, q: number, peak: number, decay = duration / 3) => {
    const source = context.createBufferSource();
    source.buffer = white;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.002);
    gain.gain.setTargetAtTime(0, start + 0.002, decay);
    source.connect(filter).connect(gain).connect(out);
    source.start(start, random() * 5, duration + 0.2);
    return filter;
  };
  const partials = (start: number, base: number, ratios: number[], decay: number, peak: number) => {
    ratios.forEach((ratio, index) => {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = base * ratio;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak / (1 + index * 0.7), start + 0.003);
      gain.gain.setTargetAtTime(0, start + 0.003, decay / (1 + index * 0.4));
      oscillator.connect(gain).connect(out);
      oscillator.start(start);
      oscillator.stop(start + decay * 5);
    });
    return start + decay * 5;
  };

  switch (kind) {
    case 'songbird': {
      // A warbling phrase: 5–12 quick notes hopping around 2.5–6 kHz with up-sweeps.
      const notes = 5 + Math.floor(random() * 8);
      const centre = 2600 + random() * 2200;
      let t = at;
      for (let i = 0; i < notes; i += 1) {
        const f = centre * (0.75 + random() * 0.6);
        const d = 0.04 + random() * 0.07;
        tone('sine', t, d, [[0, f * 0.85], [d * 0.6, f * 1.15], [d, f]], 0.5, 0.006);
        t += d + random() * 0.05;
      }
      return t + 0.3;
    }
    case 'tit': {
      // "tee-cha tee-cha": two notes repeated.
      const high = 4000 + random() * 900;
      let t = at;
      const repeats = 2 + Math.floor(random() * 3);
      for (let i = 0; i < repeats; i += 1) {
        tone('sine', t, 0.11, [[0, high], [0.11, high * 0.97]], 0.5, 0.008);
        tone('sine', t + 0.14, 0.09, [[0, high * 0.78], [0.09, high * 0.72]], 0.45, 0.008);
        t += 0.32;
      }
      return t + 0.3;
    }
    case 'dove': {
      const base = 470 + random() * 70;
      const lengths = [0.28, 0.24, 0.55];
      let t = at;
      for (const length of lengths) {
        tone('triangle', t, length, [[0, base * 0.96], [0.06, base * 1.04], [length, base * 0.94]], 0.5, 0.05);
        t += length + 0.12;
      }
      return t + 0.4;
    }
    case 'seabird': {
      let t = at;
      const calls = 2 + Math.floor(random() * 2);
      for (let i = 0; i < calls; i += 1) {
        const g = tone('sawtooth', t, 0.32, [[0, 1250], [0.08, 1500], [0.32, 950]], 0.18, 0.02);
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2200;
        g.disconnect();
        g.connect(filter).connect(out);
        t += 0.42 + random() * 0.1;
      }
      return t + 0.5;
    }
    case 'eagle': {
      tone('sine', at, 0.8, [[0, 2700], [0.12, 2900], [0.8, 1650]], 0.4, 0.04);
      tone('sine', at + 0.95, 0.55, [[0, 2500], [0.55, 1700]], 0.3, 0.04);
      return at + 2;
    }
    case 'cricket': {
      const f = 4300 + random() * 600;
      let t = at;
      const chirps = 3 + Math.floor(random() * 4);
      for (let c = 0; c < chirps; c += 1) {
        for (let p = 0; p < 3; p += 1) tone('sine', t + p * 0.035, 0.02, [[0, f], [0.02, f]], 0.35, 0.003);
        t += 0.32 + random() * 0.1;
      }
      return t + 0.2;
    }
    case 'crackle': {
      const pops = 1 + Math.floor(random() * 3);
      for (let p = 0; p < pops; p += 1) noise(at + p * random() * 0.04, 0.03, 'bandpass', 1400 + random() * 3500, 1.2, 0.9, 0.004 + random() * 0.01);
      return at + 0.3;
    }
    case 'drip': {
      const f = 850 + random() * 900;
      tone('sine', at, 0.09, [[0, f], [0.025, f * 1.7], [0.09, f * 1.9]], 0.6, 0.002);
      return at + 0.6;
    }
    case 'droplet': {
      const f = 1500 + random() * 1800;
      tone('sine', at, 0.05, [[0, f], [0.05, f * 1.5]], 0.4, 0.002);
      return at + 0.3;
    }
    case 'bell': {
      const base = 196 + random() * 60;
      const end = partials(at, base, [0.5, 1, 1.183, 1.506, 2, 2.514, 3.011], 1.6, 0.35);
      return end;
    }
    case 'chime': {
      const strikes = 3 + Math.floor(random() * 4);
      let end = at;
      for (let s = 0; s < strikes; s += 1) {
        const base = [1568, 1760, 2093, 2349, 2637][Math.floor(random() * 5)];
        end = Math.max(end, partials(at + s * (0.08 + random() * 0.18), base, [1, 2.32, 4.25], 0.5, 0.25));
      }
      return end;
    }
    case 'anvil': {
      const strikes = 2 + Math.floor(random() * 2);
      let end = at;
      for (let s = 0; s < strikes; s += 1) end = Math.max(end, partials(at + s * 0.48, 820 + random() * 40, [1, 2.31, 3.78, 5.07], 0.12, 0.35));
      return end;
    }
    case 'pebble': {
      let t = at;
      let gap = 0.12 + random() * 0.1;
      const count = 3 + Math.floor(random() * 6);
      for (let i = 0; i < count; i += 1) {
        noise(t, 0.04, 'bandpass', 1800 + random() * 2600, 2, 0.9 * (1 - i / count), 0.008);
        t += gap;
        gap *= 0.78;
      }
      return t + 0.3;
    }
    case 'creak': {
      const duration = 0.8 + random() * 0.8;
      const base = 55 + random() * 60;
      const g = tone('sawtooth', at, duration, [[0, base], [duration * 0.3, base * 1.25], [duration * 0.7, base * 0.9], [duration, base * 1.1]], 0.4, 0.15);
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 520 + random() * 300;
      filter.Q.value = 4;
      g.disconnect();
      g.connect(filter).connect(out);
      return at + duration + 0.5;
    }
    case 'thud': {
      noise(at, 0.4, 'lowpass', 260, 0.8, 1, 0.08);
      noise(at + 0.03, 0.5, 'highpass', 3500, 0.7, 0.25, 0.12);
      return at + 0.8;
    }
    default:
      return at;
  }
}

/** Creates the ambience engine on an existing context; output goes to `destination`. */
export function createAmbience(context: AudioContext, destination: AudioNode, seed = Date.now()): Ambience {
  let state = seed >>> 0;
  const random: Random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const input = context.createGain();
  const duck = context.createGain();
  input.connect(duck).connect(destination);
  let reverb: AudioNode = input;
  try {
    const convolver = context.createConvolver();
    convolver.buffer = impulseResponse(context, random);
    convolver.connect(input);
    reverb = convolver;
  } catch {
    // Without a convolver the dry sound still plays.
  }
  let noise: Record<NoiseColour, AudioBuffer> | null = null;
  const voices = new Set<Voice>();
  let current: Scene | null = null;
  let currentTheme: string | null = null;
  const fading = new Set<Scene>();
  let disposed = false;

  const timer = setInterval(() => {
    if (disposed || context.state !== 'running') return;
    try { current?.tick(context.currentTime); } catch { /* ambience is decoration */ }
  }, TICK_MS);

  return {
    setPreset(theme) {
      if (disposed || theme === currentTheme) return;
      currentTheme = theme;
      if (current) {
        const old = current;
        old.fadeTo(0, 0.7);
        fading.add(old);
        setTimeout(() => { old.stop(); fading.delete(old); }, 4000);
        current = null;
      }
      const preset = theme ? PRESETS[theme] : undefined;
      if (!preset) return;
      try {
        noise ??= {
          white: noiseBuffer(context, 'white', random),
          pink: noiseBuffer(context, 'pink', random),
          brown: noiseBuffer(context, 'brown', random),
        };
        current = new Scene(context, preset, noise, input, reverb, random, voices);
        current.fadeTo(1, 0.9);
        current.tick(context.currentTime);
      } catch {
        current = null;
      }
    },

    setDuck(amount) {
      if (disposed) return;
      try { duck.gain.setTargetAtTime(1 - Math.min(1, Math.max(0, amount)), context.currentTime, 0.8); } catch { /* best-effort */ }
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      clearInterval(timer);
      current?.stop();
      for (const scene of fading) scene.stop();
      for (const voice of voices) voice.stop();
      voices.clear();
      try { input.disconnect(); duck.disconnect(); reverb.disconnect(); } catch { /* already disconnected */ }
    },
  };
}

export const AMBIENCE_THEMES = Object.keys(PRESETS);
