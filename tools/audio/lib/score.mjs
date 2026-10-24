// Music theory, an arranging DSL and the score renderer.
//
// A Score is a list of note events on a beat grid. Rendering groups events by orchestral section,
// renders each section on its own, measures its loudness and scales it to the level the
// arrangement asked for (relative LU), so the balance is set by measurement rather than by ear.

import {
  Biquad, LoopMix, SR, compress, dbGain, hallReverb, limit, loudness, midiHz, rng, seedOf, stereo,
} from './dsp.mjs';
import * as inst from './instruments.mjs';

export const MODES = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
  phrygianDominant: [0, 1, 4, 5, 7, 8, 10],
};

/** Scale degree (1 = tonic, 8 = octave, 0 = leading note below, -2 = dominant below) to MIDI. */
export function degreeNote(tonic, mode, degree) {
  const scaleSteps = MODES[mode];
  const index = degree - 1;
  const octave = Math.floor(index / 7);
  const step = ((index % 7) + 7) % 7;
  return tonic + octave * 12 + scaleSteps[step];
}

/** Pitch classes of a diatonic chord on `root` (triad, or with seventh / sus / add9). */
export function chordPitchClasses(tonic, mode, chord) {
  const chordMode = chord.mode ?? mode;
  const degrees = chord.degrees ?? [0, 2, 4, ...(chord.seventh ? [6] : [])].map((step) => chord.root + step);
  return degrees.map((degree) => ((degreeNote(tonic, chordMode, degree) % 12) + 12) % 12);
}

/** Smooth voice-leading: each voice moves to the nearest chord tone, then every pitch class is covered. */
export function voiceChord(pcs, previous, low, high) {
  const nearest = (target, pc) => {
    let best = null;
    for (let note = low; note <= high; note += 1) {
      if (((note % 12) + 12) % 12 !== pc) continue;
      if (best === null || Math.abs(note - target) < Math.abs(best - target)) best = note;
    }
    return best;
  };
  const voices = previous.map((target) => {
    let best = null;
    for (const pc of pcs) {
      const candidate = nearest(target, pc);
      if (candidate !== null && (best === null || Math.abs(candidate - target) < Math.abs(best - target))) best = candidate;
    }
    return best ?? target;
  });
  const missing = pcs.filter((pc) => !voices.some((note) => ((note % 12) + 12) % 12 === pc));
  for (const pc of missing) {
    // Move the voice whose pitch class is doubled most cheaply.
    let bestVoice = -1;
    let bestCost = Infinity;
    for (let v = 0; v < voices.length; v += 1) {
      const pcV = ((voices[v] % 12) + 12) % 12;
      if (voices.filter((note) => ((note % 12) + 12) % 12 === pcV).length < 2) continue;
      const candidate = nearest(voices[v], pc);
      if (candidate !== null && Math.abs(candidate - voices[v]) < bestCost) {
        bestCost = Math.abs(candidate - voices[v]);
        bestVoice = v;
      }
    }
    if (bestVoice >= 0) voices[bestVoice] = nearest(voices[bestVoice], pc);
  }
  return voices.sort((a, b) => a - b);
}

/** Orchestral sections: renderer, seating (pan), reverb send and default options. */
export const SECTIONS = {
  violins1: { render: inst.strings, pan: -0.45, send: 0.32, opts: { bright: 1.1 } },
  violins2: { render: inst.strings, pan: -0.18, send: 0.32, opts: { bright: 1 } },
  violas: { render: inst.strings, pan: 0.12, send: 0.3, opts: { bright: 0.9 } },
  celli: { render: inst.strings, pan: 0.38, send: 0.28, opts: { bright: 0.8 } },
  basses: { render: inst.strings, pan: 0.3, send: 0.22, opts: { bright: 0.6, voices: 4 } },
  tremolo: { render: inst.strings, pan: -0.3, send: 0.3, opts: { bright: 1, tremolo: 0.85, vibrato: 0.3 } },
  spiccato: { render: inst.strings, pan: 0.25, send: 0.22, opts: { attack: 0.012, release: 0.09, bright: 0.95, vibrato: 0, sustain: 0.55 } },
  pizz: { render: inst.pluck, pan: 0.15, send: 0.3, opts: { decay: 0.7, bright: 0.35, body: 0.8 } },
  horns: { render: inst.brass, pan: -0.25, send: 0.48, opts: { bright: 0.55, attack: 0.07 } },
  trumpets: { render: inst.brass, pan: 0.22, send: 0.4, opts: { bright: 1.25, attack: 0.035, voices: 2 } },
  trombones: { render: inst.brass, pan: 0.4, send: 0.38, opts: { bright: 0.75, attack: 0.05 } },
  flute: { render: inst.flute, pan: -0.2, send: 0.4, opts: {} },
  ney: { render: inst.flute, pan: -0.08, send: 0.45, opts: { breath: 0.34, chiff: 0.55, vibrato: 1.4 } },
  harp: { render: inst.pluck, pan: -0.55, send: 0.42, opts: { decay: 3.4, bright: 0.55, pick: 0.2, body: 0.4 } },
  oud: { render: inst.pluck, pan: 0.32, send: 0.3, opts: { decay: 1.5, bright: 0.78, pick: 0.11, body: 1, noiseMix: 0.4 } },
  celesta: { render: inst.mallet, pan: 0.45, send: 0.45, opts: { kind: 'celesta' } },
  glock: { render: inst.mallet, pan: 0.5, send: 0.45, opts: { kind: 'glock' } },
  chime: { render: inst.mallet, pan: 0.6, send: 0.55, opts: { kind: 'chime' } },
  bell: { render: inst.mallet, pan: -0.1, send: 0.6, opts: { kind: 'bell' } },
  anvil: { render: inst.mallet, pan: 0.35, send: 0.4, opts: { kind: 'anvil' } },
  glass: { render: inst.glassPad, pan: 0.2, send: 0.6, opts: {} },
  choir: { render: inst.choir, pan: 0, send: 0.55, opts: { vowel: 'ah' } },
  choirOo: { render: inst.choir, pan: 0.05, send: 0.6, opts: { vowel: 'oo' } },
  timpani: { render: inst.timpani, pan: 0.15, send: 0.3, opts: {} },
  timpaniRoll: { render: inst.timpaniRoll, pan: 0.15, send: 0.3, opts: {} },
  bassDrum: { render: inst.drum, pan: 0, send: 0.25, opts: { length: 1.8, sweep: 1.2, skin: 0.3 } },
  taiko: { render: inst.drum, pan: -0.12, send: 0.28, opts: { length: 0.9, sweep: 1.6, skin: 0.55, skinFreq: 1100 } },
  toms: { render: inst.drum, pan: 0.2, send: 0.25, opts: { length: 0.6, sweep: 0.9, skin: 0.4, skinFreq: 1500 } },
  snare: { render: inst.snare, pan: 0.1, send: 0.22, opts: {} },
  cymbal: { render: inst.cymbal, pan: 0.32, send: 0.3, opts: {} },
  swell: { render: inst.cymbal, pan: -0.3, send: 0.35, opts: { swell: true } },
  frameDrum: { render: inst.handDrum, pan: -0.22, send: 0.25, opts: { stroke: 'dum' } },
  frameTek: { render: inst.handDrum, pan: -0.3, send: 0.22, opts: { stroke: 'tek' } },
  shaker: { render: inst.shaker, pan: 0.45, send: 0.2, opts: {} },
  tambourine: { render: inst.shaker, pan: 0.4, send: 0.22, opts: { jingles: true } },
};

/** Beats per sample are quantised so loops are whole multiples of 160 samples (exact at 32/44.1/48 kHz). */
export class Score {
  constructor({ name, bpm, beatsPerBar = 4, bars, tonic, mode, seed = seedOf(name), tail = 0 }) {
    this.name = name;
    this.samplesPerBeat = 160 * Math.round((SR * 60) / bpm / 160);
    this.bpm = (SR * 60) / this.samplesPerBeat;
    this.beatsPerBar = beatsPerBar;
    this.bars = bars;
    this.tonic = tonic;
    this.mode = mode;
    // Loops are exactly `bars` long; one-shots (stingers) get extra room for their ring-out.
    this.loop = tail === 0;
    this.length = this.samplesPerBeat * beatsPerBar * bars + Math.round(tail * SR);
    this.events = [];
    this.random = rng(seed);
    this.voicings = new Map();
  }

  get beats() { return this.bars * this.beatsPerBar; }

  bar(index) { return index * this.beatsPerBar; }

  secondsOf(beats) { return (beats * this.samplesPerBeat) / SR; }

  note(section, beat, beats, midi, vel, extra = {}) {
    if (!SECTIONS[section]) throw new Error(`unknown section ${section}`);
    this.events.push({ section, beat, beats, midi, vel, ...extra });
  }

  /** Expands an 8-bar (or any) progression [{root, beats, mode?}] across bars [startBar, startBar+bars). */
  chords(progression, startBar, bars) {
    const result = [];
    let beat = this.bar(startBar);
    const end = this.bar(startBar + bars);
    while (beat < end) {
      for (const chord of progression) {
        if (beat >= end) break;
        result.push({ ...chord, beat, beats: Math.min(chord.beats, end - beat) });
        beat += chord.beats;
      }
    }
    return result;
  }

  chordAt(progression, startBar, bars, beat) {
    return this.chords(progression, startBar, bars).find((chord) => beat >= chord.beat && beat < chord.beat + chord.beats);
  }

  pcs(chord) { return chordPitchClasses(this.tonic, this.mode, chord); }

  /** Pitch class in the bass: the root, or `bassDegree` for inversions (e.g. I6/4 over the dominant). */
  bassPc(chord) {
    if (chord.bassDegree === undefined) return this.pcs(chord)[0];
    return ((degreeNote(this.tonic, chord.mode ?? this.mode, chord.bassDegree) % 12) + 12) % 12;
  }

  /** Nearest MIDI note with pitch class `pc` at or above `low`. */
  lift(pc, low) { return low + ((pc - low) % 12 + 12) % 12; }

  /** Short block chords at fixed offsets inside every chord (brass stabs, pizz after-beats). */
  stabs(section, progression, startBar, bars, { hits = [[0, 0.8, 1]], voices = 3, low = 55, high = 74, vel = 0.7 } = {}) {
    let previous = this.voicings.get(`stab:${section}`) ?? Array.from({ length: voices }, (_, i) => low + ((high - low) * (i + 0.5)) / voices);
    for (const chord of this.chords(progression, startBar, bars)) {
      const notes = voiceChord(this.pcs(chord), previous, low, high);
      previous = notes;
      for (const [offset, beats, velScale = 1] of hits) {
        if (offset >= chord.beats) continue;
        for (const midi of notes) this.note(section, chord.beat + offset, beats, midi, vel * velScale);
      }
    }
    this.voicings.set(`stab:${section}`, previous);
  }

  /** One drum per chord on its bass note, folded into the instrument's range (timpani). */
  rootHits(section, progression, startBar, bars, { low = 38, offsets = [0], vel = 0.7, beats = 1 } = {}) {
    for (const chord of this.chords(progression, startBar, bars)) {
      const midi = this.lift(this.bassPc(chord), low);
      for (const offset of offsets) if (offset < chord.beats) this.note(section, chord.beat + offset, beats, midi, vel);
    }
  }

  /** Sustained chords with voice-leading; `voices` sets how many notes, low/high the register. */
  pad(section, progression, startBar, bars, { voices = 3, low = 52, high = 76, vel = 0.5, legato = 1.02, key = section, swell = 0 } = {}) {
    let previous = this.voicings.get(key) ?? Array.from({ length: voices }, (_, i) => low + ((high - low) * (i + 0.5)) / voices);
    for (const chord of this.chords(progression, startBar, bars)) {
      const notes = voiceChord(this.pcs(chord), previous, low, high);
      previous = notes;
      for (const midi of notes) this.note(section, chord.beat, chord.beats * legato, midi, vel + swell * this.random.bi());
    }
    this.voicings.set(key, previous);
  }

  /** Bass on chord roots; `pattern` is [[beatOffset, beats, octaveShift, velScale]] per chord. */
  bass(section, progression, startBar, bars, { octave = 36, pattern = null, vel = 0.6 } = {}) {
    for (const chord of this.chords(progression, startBar, bars)) {
      const rootPc = this.bassPc(chord);
      const fifthPc = this.pcs(chord)[2];
      const root = octave + ((rootPc - octave) % 12 + 12) % 12;
      const fifth = octave + ((fifthPc - octave) % 12 + 12) % 12;
      const steps = pattern ?? [[0, chord.beats, 0, 1]];
      for (const [offset, beats, shift, velScale = 1, useFifth = false] of steps) {
        if (offset >= chord.beats) continue;
        this.note(section, chord.beat + offset, Math.min(beats, chord.beats - offset), (useFifth ? fifth : root) + shift, vel * velScale);
      }
    }
  }

  /** Broken chords: `pattern` indexes the voiced chord (0 = lowest), stepping every `step` beats. */
  arpeggio(section, progression, startBar, bars, { pattern = [0, 1, 2, 3, 2, 1], step = 0.5, low = 55, high = 84, voices = 4, vel = 0.45, length = 1.5, accent = 0.15 } = {}) {
    for (const chord of this.chords(progression, startBar, bars)) {
      const pcs = this.pcs(chord);
      const tones = [];
      for (let note = low; note <= high && tones.length < voices + 3; note += 1) {
        if (pcs.includes(((note % 12) + 12) % 12)) tones.push(note);
      }
      let index = 0;
      for (let beat = 0; beat < chord.beats - 1e-6; beat += step) {
        const tone = tones[pattern[index % pattern.length] % tones.length];
        const strong = Math.abs(beat % 1) < 1e-6 ? accent : 0;
        this.note(section, chord.beat + beat, length, tone, vel + strong + this.random.bi() * 0.04);
        index += 1;
      }
    }
  }

  /**
   * A melody from scale degrees: [[degree, beats, velScale?], ...], degree null = rest.
   * Each note takes the mode of the chord sounding under it (so V in minor gets its leading note).
   */
  melody(section, line, startBar, { octave = 0, vel = 0.7, legato = 0.96, progression = null, progressionStart = 0, progressionBars = this.bars, transpose = 0 } = {}) {
    let beat = this.bar(startBar);
    for (const [degree, beats, velScale = 1] of line) {
      if (degree !== null) {
        const chord = progression ? this.chordAt(progression, progressionStart, progressionBars, beat) : null;
        const midi = degreeNote(this.tonic + octave * 12, chord?.mode ?? this.mode, degree) + transpose;
        this.note(section, beat, beats * legato, midi, vel * velScale);
      }
      beat += beats;
    }
    return beat;
  }

  /** Step-sequenced percussion: one string per bar, chars X (accent) x (normal) o (ghost) . (rest). */
  rhythm(section, pattern, startBar, bars, { midi = 40, vel = 0.7, length = 0.5, humanize = 0.006 } = {}) {
    const steps = pattern.length;
    const stepBeats = this.beatsPerBar / steps;
    for (let bar = startBar; bar < startBar + bars; bar += 1) {
      for (let s = 0; s < steps; s += 1) {
        const char = pattern[s];
        if (char === '.' || char === ' ') continue;
        const level = char === 'X' ? 1 : char === 'x' ? 0.72 : 0.42;
        this.note(section, this.bar(bar) + s * stepBeats + this.random.bi() * humanize * (this.bpm / 60), length, midi, vel * level);
      }
    }
  }

  /** Repeated chord-root/fifth figure (driving string ostinato) following the progression. */
  ostinato(section, progression, startBar, bars, { figure = [0, 0, 12, 0], step = 0.5, octave = 48, vel = 0.6, length = 0.4, accents = [1] } = {}) {
    for (const chord of this.chords(progression, startBar, bars)) {
      const rootPc = this.bassPc(chord);
      const root = octave + ((rootPc - octave) % 12 + 12) % 12;
      let index = 0;
      for (let beat = 0; beat < chord.beats - 1e-6; beat += step) {
        const accent = accents[index % accents.length];
        this.note(section, chord.beat + beat, length, root + figure[index % figure.length], vel * accent);
        index += 1;
      }
    }
  }
}

/**
 * Renders a score. `levels` maps section → target loudness relative to the reference (LU),
 * so a melody at 0 sits ~6 LU above a pad at -6 whatever the synth's raw output level is.
 * Returns the stereo dry+reverb mix (not yet normalised; the master stage does that).
 */
export function renderScore(score, { levels = {}, reverb = {}, wet = 0.9, glue = true, human = 1, onSection } = {}) {
  const bySection = new Map();
  for (const event of score.events) {
    if (!bySection.has(event.section)) bySection.set(event.section, []);
    bySection.get(event.section).push(event);
  }
  const dry = stereo(score.length);
  const send = stereo(score.length);
  const reference = -24;
  for (const [section, events] of bySection) {
    const config = SECTIONS[section];
    const sectionMix = new LoopMix(score.length, { wrap: score.loop });
    const random = rng(seedOf(score.name, section));
    for (const event of events) {
      const seconds = score.secondsOf(event.beats);
      const vel = Math.min(1, Math.max(0.02, event.vel + random.bi() * 0.035 * human));
      const timing = random.bi() * 0.006 * SR * human;
      const start = Math.round(event.beat * score.samplesPerBeat + timing);
      const mono = config.render(midiHz(event.midi), seconds, vel, random.fork(), { ...config.opts, ...(event.opts ?? {}) });
      sectionMix.add(mono, start, { gain: 1, pan: event.pan ?? config.pan, send: event.send ?? config.send });
    }
    const measured = loudness(sectionMix.dry);
    const target = reference + (levels[section] ?? -6);
    const gain = measured > -69 ? dbGain(target - measured) : 0;
    onSection?.(section, measured, target);
    for (let i = 0; i < score.length; i += 1) {
      dry.L[i] += sectionMix.dry.L[i] * gain;
      dry.R[i] += sectionMix.dry.R[i] * gain;
      send.L[i] += sectionMix.send.L[i] * gain;
      send.R[i] += sectionMix.send.R[i] * gain;
    }
  }
  const room = hallReverb(send, { ...reverb, loop: score.loop });
  const wetGain = 3 * wet;
  for (let i = 0; i < score.length; i += 1) {
    dry.L[i] += room.L[i] * wetGain;
    dry.R[i] += room.R[i] * wetGain;
  }
  // Remove sub-sonic rumble/DC (synth drums and saturation leave a little) before the glue stage.
  for (const channel of [dry.L, dry.R]) {
    const hp = new Biquad('highpass', 28, 0.7);
    for (let pass = 0; pass < (score.loop ? 2 : 1); pass += 1) {
      for (let i = 0; i < score.length; i += 1) {
        const y = hp.tick(channel[i]);
        if (pass === (score.loop ? 1 : 0)) channel[i] = y;
      }
    }
  }
  if (glue) compress(dry, { threshold: -20, ratio: 1.8, attack: 0.03, release: 0.4, loop: score.loop });
  return dry;
}

/** Scales a set of layers by one gain so the base layer hits `lufs`, then limits each layer. */
export function masterLayers(layers, { lufs = -16, ceiling = -1.2, combinedCeiling = -0.6, loop = true } = {}) {
  const base = layers[0];
  let gain = dbGain(lufs - loudness(base));
  // The layers play together; keep the full stack below the ceiling too.
  const n = base.L.length;
  let stackPeak = 0;
  for (let i = 0; i < n; i += 1) {
    let l = 0; let r = 0;
    for (const layer of layers) {
      const index = i % layer.L.length;
      l += layer.L[index]; r += layer.R[index];
    }
    stackPeak = Math.max(stackPeak, Math.abs(l), Math.abs(r));
  }
  const stackLimit = dbGain(combinedCeiling + 3) / Math.max(stackPeak, 1e-9);
  gain = Math.min(gain, stackLimit);
  for (const layer of layers) {
    for (let i = 0; i < layer.L.length; i += 1) { layer.L[i] *= gain; layer.R[i] *= gain; }
    limit(layer, { ceiling, loop });
  }
  return layers;
}
