// The Brightwood score. Every region varies one leitmotif, "the First Oath", so the world sounds
// like one story: a rising 5–1–2–3 call that each region re-harmonises and re-orchestrates.
//
// Explore tracks run 32 bars as A (8) · A′ (8) · B (8) · A″ (8). Their combat layer is the same
// length on the same harmony, so the game can fade it in or out at any moment and stay in tune.
// Boss tracks have a base layer and a phase-2 layer built the same way.

import { Score } from '../lib/score.mjs';

// ── Shared material ────────────────────────────────────────────────────────────────────────────

/** 8-bar "Oath" progression: I · vi · IV–I · IV–I · I · iii · I6/4–V · I (minor modes read i · VI …). */
const progressionA = (minor) => [
  { root: 1, beats: 4 }, { root: 6, beats: 4 },
  { root: 4, beats: 2 }, { root: 1, beats: 2 },
  { root: 4, beats: 2 }, { root: 1, beats: 2 },
  { root: 1, beats: 4 }, { root: 3, beats: 4 },
  { root: 1, beats: 2, bassDegree: 5 }, { root: 5, beats: 2, ...(minor ? { mode: 'harmonic' } : {}) },
  { root: 1, beats: 4 },
];

/** 8-bar bridge: vi · IV · I · V · vi · IV · ii · V (minor: VI · iv · i · V · VI · iv · iv · V). */
const progressionB = (minor) => [
  { root: 6, beats: 4 }, { root: 4, beats: 4 }, { root: 1, beats: 4 },
  { root: 5, beats: 4, ...(minor ? { mode: 'harmonic' } : {}) },
  { root: 6, beats: 4 }, { root: 4, beats: 4 }, { root: minor ? 4 : 2, beats: 4 },
  { root: 5, beats: 4, ...(minor ? { mode: 'harmonic' } : {}) },
];

/** The Oath theme (bars 1–8). Degrees: 1 = tonic, 0 = leading note below, -2 = dominant below. */
const OATH = [
  [-2, 1], [1, 2], [2, 1],
  [3, 2], [2, 1], [1, 1],
  [3, 1.5], [4, 0.5], [5, 2],
  [6, 1], [5, 1], [3, 2],
  [-2, 1], [1, 2], [2, 1],
  [3, 2], [5, 1], [4, 1],
  [3, 1], [2, 1], [0, 1], [2, 1],
  [1, 4],
];

/** The answering phrase (bars 9–16, same harmony). */
const OATH_ANSWER = [
  [5, 2], [6, 1], [5, 1],
  [3, 3], [1, 1],
  [4, 1], [6, 1], [5, 1], [3, 1],
  [6, 2], [5, 2],
  [5, 1], [4, 1], [3, 1], [2, 1],
  [3, 2], [5, 2],
  [3, 2], [2, 2],
  [1, 4],
];

/** Bridge melody over progressionB. */
const BRIDGE = [
  [3, 3], [4, 0.5], [3, 0.5],
  [6, 2], [5, 1], [4, 1],
  [5, 3], [3, 1],
  [2, 2], [0, 1], [2, 1],
  [3, 2], [6, 2],
  [8, 2], [6, 1], [4, 1],
  [4, 1], [6, 1], [4, 1], [2, 1],
  [5, 4],
];

/** A sustained counter-line for the A sections (horns/trumpets). */
const COUNTER = [
  [3, 4], [3, 4], [6, 2], [5, 2], [4, 2], [3, 2], [5, 4], [5, 4], [5, 2], [4, 2], [3, 4],
];

const quiet = (line, factor) => line.map(([degree, beats, vel = 1]) => [degree, beats, vel * factor]);

/** Cymbal swell into `bar` plus a crash on it. */
function lift(score, bar, { vel = 0.7, crash = true, beats = 4 } = {}) {
  score.note('swell', score.bar(bar) - beats, beats, 60, vel * 0.8);
  if (crash) score.note('cymbal', score.bar(bar), 2, 60, vel);
}

// ── Title: "The First Oath" ──────────────────────────────────────────────────────────────────

function title() {
  const s = new Score({ name: 'theme-title', bpm: 72, bars: 32, tonic: 62, mode: 'ionian' });
  const A = progressionA(false);
  const B = progressionB(false);
  // A: a lone horn over harp and hushed strings.
  s.pad('violas', A, 0, 8, { low: 50, high: 69, vel: 0.32 });
  s.bass('basses', A, 0, 8, { octave: 38, vel: 0.4 });
  s.arpeggio('harp', A, 0, 8, { pattern: [0, 1, 2, 3, 4, 3, 2, 1], step: 0.5, low: 50, high: 81, vel: 0.38 });
  s.melody('horns', OATH, 0, { octave: 0, vel: 0.62, progression: A, progressionBars: 8 });
  for (const bar of [1, 3, 5, 7]) s.note('celesta', s.bar(bar) + 2, 2, 86, 0.4);
  s.note('timpani', 0, 1, 38, 0.45);
  lift(s, 8, { vel: 0.45, crash: false });
  // A′: strings take the answer, horns hold the counter-line, a distant choir.
  s.melody('violins1', OATH_ANSWER, 8, { octave: 1, vel: 0.62, progression: A, progressionStart: 8, progressionBars: 8 });
  s.melody('flute', quiet(OATH_ANSWER, 0.7), 8, { octave: 1, progression: A, progressionStart: 8, progressionBars: 8 });
  s.melody('horns', COUNTER, 8, { octave: 0, vel: 0.45, progression: A, progressionStart: 8, progressionBars: 8 });
  s.pad('violas', A, 8, 8, { low: 50, high: 69, vel: 0.4 });
  s.pad('choirOo', A, 8, 8, { low: 55, high: 72, vel: 0.3 });
  s.bass('basses', A, 8, 8, { octave: 38, vel: 0.5 });
  s.arpeggio('harp', A, 8, 8, { pattern: [0, 2, 4, 2], step: 0.5, low: 55, high: 86, vel: 0.35 });
  for (const bar of [8, 12]) s.note('timpani', s.bar(bar), 1, 38, 0.55);
  // B: celli sing the bridge; the choir opens up; a roll builds into the last statement.
  s.melody('celli', BRIDGE, 16, { octave: -1, vel: 0.66, progression: B, progressionStart: 16, progressionBars: 8 });
  s.pad('violins2', B, 16, 8, { low: 64, high: 83, vel: 0.33 });
  s.pad('choir', B, 16, 8, { low: 57, high: 74, vel: 0.36 });
  s.bass('basses', B, 16, 8, { octave: 38, vel: 0.5 });
  s.arpeggio('harp', B, 16, 8, { pattern: [0, 1, 2, 3], step: 1, low: 55, high: 86, vel: 0.33 });
  s.note('timpaniRoll', s.bar(22), 8, 38, 0.7);
  lift(s, 24, { vel: 0.75 });
  // A″: the full orchestra.
  s.melody('violins1', OATH, 24, { octave: 1, vel: 0.8, progression: A, progressionStart: 24, progressionBars: 8 });
  s.melody('flute', quiet(OATH, 0.8), 24, { octave: 1, progression: A, progressionStart: 24, progressionBars: 8 });
  s.melody('horns', OATH, 24, { octave: 0, vel: 0.75, progression: A, progressionStart: 24, progressionBars: 8 });
  s.melody('trumpets', COUNTER, 24, { octave: 0, vel: 0.5, progression: A, progressionStart: 24, progressionBars: 8 });
  s.pad('violas', A, 24, 8, { low: 52, high: 72, vel: 0.5 });
  s.pad('choir', A, 24, 8, { low: 57, high: 76, vel: 0.42 });
  s.bass('basses', A, 24, 8, { octave: 38, vel: 0.6 });
  s.bass('trombones', A, 24, 7, { octave: 38, vel: 0.4 });
  s.arpeggio('harp', A, 24, 8, { pattern: [0, 1, 2, 3, 4, 3, 2, 1], step: 0.5, low: 50, high: 86, vel: 0.42 });
  s.rootHits('timpani', A, 24, 8, { offsets: [0, 2], vel: 0.6 });
  for (const bar of [24, 28]) s.note('bassDrum', s.bar(bar), 1, 36, 0.6);
  return {
    key: 'theme-title',
    layers: [{ layer: 'base', score: s }],
    levels: {
      horns: -1, violins1: 0, flute: -6, trumpets: -7, celli: 0, violas: -9, violins2: -9, choir: -10, choirOo: -11,
      basses: -9, trombones: -11, harp: -8, celesta: -14, timpani: -9, timpaniRoll: -8, bassDrum: -10, swell: -15, cymbal: -14,
    },
    reverb: { size: 0.88, damp: 0.3 },
  };
}

// ── Town: Leafwood waltz ─────────────────────────────────────────────────────────────────────

const TOWN_A = [
  { root: 1, beats: 3 }, { root: 5, beats: 3 }, { root: 6, beats: 3 }, { root: 4, beats: 3 },
  { root: 1, beats: 3 }, { root: 4, beats: 3 }, { root: 5, beats: 3 }, { root: 1, beats: 3 },
];
const TOWN_B = [
  { root: 6, beats: 3 }, { root: 3, beats: 3 }, { root: 4, beats: 3 }, { root: 1, beats: 3 },
  { root: 2, beats: 3 }, { root: 5, beats: 3 }, { root: 1, beats: 3 }, { root: 5, beats: 3 },
];
const TOWN_TUNE = [
  [1, 1], [3, 1], [5, 1],
  [5, 1.5], [4, 0.5], [2, 1],
  [3, 1], [1, 1], [3, 1],
  [4, 2], [6, 1],
  [5, 1], [6, 0.5], [5, 0.5], [3, 1],
  [4, 1], [6, 1], [8, 1],
  [7, 1], [5, 1], [2, 1],
  [1, 3],
];
const TOWN_BRIDGE = [
  [6, 1.5], [5, 0.5], [3, 1],
  [5, 2], [3, 1],
  [4, 1], [6, 1], [8, 1],
  [5, 3],
  [6, 1.5], [4, 0.5], [2, 1],
  [5, 1], [7, 1], [9, 1],
  [8, 2], [5, 1],
  [2, 2], [5, 1],
];

function town() {
  const s = new Score({ name: 'theme-town', bpm: 104, beatsPerBar: 3, bars: 32, tonic: 65, mode: 'ionian' });
  const waltz = (start, bars, progression, vel = 0.55) => {
    s.bass('pizz', progression, start, bars, { octave: 41, vel });
    s.stabs('pizz', progression, start, bars, { hits: [[1, 0.5, 0.7], [2, 0.5, 0.6]], voices: 3, low: 57, high: 72, vel });
  };
  // A: flute tune over pizzicato oom-pah-pah.
  waltz(0, 8, TOWN_A);
  s.melody('flute', TOWN_TUNE, 0, { octave: 0, vel: 0.62 });
  s.arpeggio('harp', TOWN_A, 0, 8, { pattern: [0, 2, 4], step: 1, low: 60, high: 84, vel: 0.3 });
  for (const bar of [0, 4]) s.note('glock', s.bar(bar), 1, 89, 0.35);
  // A′: violins sing it an octave up, the flute floats a descant, tambourine joins.
  waltz(8, 8, TOWN_A);
  s.melody('violins1', TOWN_TUNE, 8, { octave: 1, vel: 0.62 });
  s.pad('flute', TOWN_A, 8, 8, { voices: 1, low: 77, high: 89, vel: 0.36 });
  s.rhythm('tambourine', 'x..', 8, 8, { vel: 0.4 });
  s.arpeggio('harp', TOWN_A, 8, 8, { pattern: [0, 2, 4, 2, 1, 2], step: 0.5, low: 60, high: 84, vel: 0.3 });
  // B: a warm horn song over strings.
  s.bass('pizz', TOWN_B, 16, 8, { octave: 41, vel: 0.5 });
  s.melody('horns', TOWN_BRIDGE, 16, { octave: 0, vel: 0.6 });
  s.pad('violas', TOWN_B, 16, 8, { low: 53, high: 70, vel: 0.36 });
  s.arpeggio('harp', TOWN_B, 16, 8, { pattern: [0, 1, 2, 3, 2, 1], step: 0.5, low: 57, high: 84, vel: 0.32 });
  for (const bar of [17, 19, 21, 23]) s.note('glock', s.bar(bar) + 2, 1, 84, 0.3);
  // A″: everyone together.
  waltz(24, 8, TOWN_A, 0.62);
  s.melody('violins1', TOWN_TUNE, 24, { octave: 1, vel: 0.72 });
  s.melody('flute', quiet(TOWN_TUNE, 0.85), 24, { octave: 1 });
  s.pad('horns', TOWN_A, 24, 8, { voices: 2, low: 57, high: 70, vel: 0.42 });
  s.rhythm('tambourine', 'x.o', 24, 8, { vel: 0.45 });
  s.arpeggio('harp', TOWN_A, 24, 8, { pattern: [0, 2, 4, 2, 1, 2], step: 0.5, low: 60, high: 86, vel: 0.34 });
  for (const bar of [24, 28]) s.note('timpani', s.bar(bar), 1, 41, 0.5);
  s.note('cymbal', s.bar(24), 2, 60, 0.35);
  return {
    key: 'theme-town',
    layers: [{ layer: 'base', score: s }],
    levels: {
      flute: -1, violins1: 0, horns: -2, pizz: -8, harp: -9, violas: -10, glock: -14, tambourine: -15, timpani: -12, cymbal: -18,
    },
    reverb: { size: 0.8, damp: 0.38 },
  };
}

// ── Region themes with combat layers ─────────────────────────────────────────────────────────

/**
 * Builds a combat layer that follows the explore layer's harmony. `style` picks the colour:
 * forest (spiccato + taiko), ridge (heavy toms, anvils, low brass), frost (pizzicato + muted brass),
 * sands (hand drums, phrygian ostinato), ruins (measured pizzicato + distant bells).
 */
function combatLayer(name, { bpm, tonic, mode, A, B, style }) {
  const s = new Score({ name: `${name}:combat`, bpm, bars: 32, tonic, mode });
  const sections = [[0, A], [8, A], [16, B], [24, A]];
  for (const [start, progression] of sections) {
    const peak = start === 24;
    const bridge = start === 16;
    const ostinatoOctave = style === 'ridge' ? 38 : style === 'frost' || style === 'ruins' ? 50 : 43;
    if (style === 'frost') {
      s.ostinato('pizz', progression, start, 8, { figure: [0, 7, 12, 7], step: 0.5, octave: ostinatoOctave, vel: 0.7, length: 0.5 });
    } else if (style === 'ruins') {
      s.ostinato('pizz', progression, start, 8, { figure: [0, 12, 7, 12], step: 0.5, octave: ostinatoOctave, vel: 0.54, length: 0.34 });
    } else if (style === 'sands') {
      s.ostinato('spiccato', progression, start, 8, { figure: [0, 0, 12, 0, 7, 0, 12, 0], step: 0.5, octave: ostinatoOctave, vel: 0.65, length: 0.35, accents: [1, 0.7, 0.8, 0.7] });
    } else {
      s.ostinato('spiccato', progression, start, 8, {
        figure: style === 'ridge' ? [0, 0, 0, 0, 12, 0, 0, 0] : [0, 0, 12, 0],
        step: style === 'ridge' ? 0.25 : 0.5, octave: ostinatoOctave, vel: 0.68, length: 0.3, accents: [1, 0.65, 0.8, 0.65],
      });
    }
    s.bass('basses', progression, start, 8, { octave: 31, pattern: [[0, 1.5, 0, 1], [2, 1.5, 0, 0.8]], vel: 0.6 });
    // Percussion
    if (style === 'sands') {
      s.rhythm('frameDrum', 'X..x..X.X..x..x.', start, 8, { midi: 45, vel: 0.75 });
      s.rhythm('frameTek', '..x.xx.x..x.x.xx', start, 8, { midi: 45, vel: 0.6 });
      s.rhythm('taiko', 'X...............', start, 8, { midi: 38, vel: 0.7 });
      if (!bridge) s.rhythm('tambourine', '.x.x.x.x.x.x.x.x', start, 8, { vel: 0.4 });
    } else if (style === 'ridge') {
      s.rhythm('taiko', 'X..x..x.X.x.x...', start, 8, { midi: 36, vel: 0.8 });
      s.rhythm('toms', '........x.x.X.xx', start + 3, 1, { midi: 45, vel: 0.7 });
      s.rhythm('toms', '........x.x.X.xx', start + 7, 1, { midi: 45, vel: 0.75 });
      s.rhythm('anvil', '...x', start, 8, { midi: 84, vel: 0.5 });
    } else if (style === 'frost') {
      s.rhythm('toms', 'X.....x.X.......', start, 8, { midi: 43, vel: 0.7 });
      s.rhythm('snare', '....x.......x..o', start, 8, { vel: 0.5 });
    } else if (style === 'ruins') {
      s.rhythm('toms', 'X.......x.......', start, 8, { midi: 43, vel: 0.48 });
      s.rhythm('anvil', '....x.......x...', start, 8, { midi: 84, vel: 0.24 });
    } else {
      s.rhythm('taiko', 'X..x..x.X..x.x..', start, 8, { midi: 40, vel: 0.75 });
      s.rhythm('snare', 'o.o.X.o.o.o.X.oo', start, 8, { vel: 0.45 });
    }
    s.rootHits('timpani', progression, start, 8, { low: 38, offsets: [0], vel: 0.7 });
    // Brass punctuation (softer in the frost).
    s.stabs('horns', progression, start, 8, {
      hits: [[0, 0.9, 1], [2.5, 0.45, 0.8]], voices: 3, low: 53, high: 70, vel: style === 'frost' ? 0.5 : 0.65,
    });
    if (bridge || peak) {
      s.stabs('trumpets', progression, start, 8, { hits: [[0, 0.5, 1], [1.5, 0.3, 0.8], [3, 0.3, 0.8]], voices: 2, low: 64, high: 79, vel: 0.62 });
      s.pad('tremolo', progression, start, 8, { voices: 3, low: 67, high: 86, vel: 0.45 });
    }
    if (style === 'frost' && peak) s.arpeggio('glock', progression, start, 8, { pattern: [0, 1, 2, 3], step: 0.5, low: 76, high: 96, vel: 0.35, length: 0.6 });
    if (style === 'ruins' && peak) s.arpeggio('glock', progression, start, 8, { pattern: [0, 2, 1, 3], step: 1, low: 76, high: 91, vel: 0.25, length: 0.45 });
    if (start > 0) lift(s, start, { vel: 0.65 });
  }
  s.note('cymbal', 0, 2, 60, 0.6);
  return s;
}

function region({ key, bpm, tonic, mode, style, reverb, explore, levels, combatLevels }) {
  const minor = mode !== 'ionian' && mode !== 'lydian' && mode !== 'mixolydian';
  const A = progressionA(minor);
  const B = progressionB(minor);
  const s = new Score({ name: key, bpm, bars: 32, tonic, mode });
  explore(s, A, B);
  return {
    key,
    layers: [
      { layer: 'base', score: s },
      { layer: 'combat', score: combatLayer(key, { bpm, tonic, mode, A, B, style }), levels: combatLevels },
    ],
    levels,
    reverb,
  };
}

const COMBAT_LEVELS = {
  spiccato: -3, pizz: -4, basses: -7, taiko: -4, toms: -5, snare: -10, timpani: -6, horns: -5, trumpets: -7,
  tremolo: -10, anvil: -13, frameDrum: -5, frameTek: -9, tambourine: -15, glock: -14, swell: -14, cymbal: -13,
};

function brightwood() {
  return region({
    key: 'theme-brightwood', bpm: 84, tonic: 67, mode: 'ionian', style: 'forest',
    reverb: { size: 0.84, damp: 0.34 },
    explore: (s, A, B) => {
      // A: harp ripples, a flute sings the Oath in the morning light.
      s.arpeggio('harp', A, 0, 8, { pattern: [0, 2, 4, 5, 4, 2], step: 0.5, low: 55, high: 86, vel: 0.4 });
      s.pad('violins2', A, 0, 8, { low: 62, high: 81, vel: 0.28 });
      s.pad('celli', A, 0, 8, { voices: 2, low: 43, high: 60, vel: 0.3 });
      s.melody('flute', OATH, 0, { octave: 0, vel: 0.6, progression: A, progressionBars: 8 });
      for (const bar of [1, 3, 5, 7]) s.note('celesta', s.bar(bar) + 3, 1, 91, 0.35);
      // A′: violins answer, flute descant above.
      s.melody('violins1', OATH_ANSWER, 8, { octave: 0, vel: 0.58, progression: A, progressionStart: 8, progressionBars: 8 });
      s.melody('flute', quiet(COUNTER, 0.6), 8, { octave: 1, progression: A, progressionStart: 8, progressionBars: 8 });
      s.arpeggio('harp', A, 8, 8, { pattern: [0, 2, 4, 2], step: 0.5, low: 55, high: 86, vel: 0.36 });
      s.bass('pizz', A, 8, 8, { octave: 43, pattern: [[0, 1, 0, 1], [2, 1, 0, 0.7, true]], vel: 0.55 });
      s.pad('choirOo', A, 8, 8, { low: 55, high: 72, vel: 0.26 });
      // B: horns in the shade of the trees.
      s.melody('horns', BRIDGE, 16, { octave: -1, vel: 0.55, progression: B, progressionStart: 16, progressionBars: 8 });
      s.pad('violas', B, 16, 8, { low: 55, high: 72, vel: 0.3 });
      s.arpeggio('harp', B, 16, 8, { pattern: [0, 1, 2, 3], step: 1, low: 55, high: 86, vel: 0.34 });
      s.bass('basses', B, 16, 8, { octave: 31, vel: 0.36 });
      for (const bar of [17, 19, 21]) s.note('glock', s.bar(bar) + 2, 1, 91, 0.25);
      // A″: flute and violins together.
      s.melody('violins1', OATH, 24, { octave: 0, vel: 0.62, progression: A, progressionStart: 24, progressionBars: 8 });
      s.melody('flute', quiet(OATH, 0.85), 24, { octave: 1, progression: A, progressionStart: 24, progressionBars: 8 });
      s.melody('horns', COUNTER, 24, { octave: -1, vel: 0.45, progression: A, progressionStart: 24, progressionBars: 8 });
      s.arpeggio('harp', A, 24, 8, { pattern: [0, 2, 4, 5, 4, 2], step: 0.5, low: 55, high: 86, vel: 0.4 });
      s.pad('violas', A, 24, 8, { low: 55, high: 72, vel: 0.34 });
      s.bass('basses', A, 24, 8, { octave: 31, vel: 0.4 });
      s.note('timpani', s.bar(24), 1, 43, 0.4);
    },
    levels: {
      flute: -1, violins1: 0, horns: -2, harp: -7, violins2: -11, violas: -11, celli: -11, choirOo: -13, pizz: -10,
      basses: -12, celesta: -15, glock: -16, timpani: -13,
    },
    combatLevels: COMBAT_LEVELS,
  });
}

function ridge() {
  return region({
    key: 'theme-ridge', bpm: 76, tonic: 62, mode: 'aeolian', style: 'ridge',
    reverb: { size: 0.9, damp: 0.42, low: 160 },
    explore: (s, A, B) => {
      // A: celli carry the Oath in minor over a held low D; distant drums.
      s.note('basses', 0, 32, 38, 0.32);
      s.melody('celli', OATH, 0, { octave: -1, vel: 0.62, progression: A, progressionBars: 8 });
      s.pad('horns', A, 0, 8, { voices: 3, low: 50, high: 65, vel: 0.3 });
      s.rhythm('taiko', 'X...............', 0, 8, { midi: 36, vel: 0.45 });
      for (const bar of [3, 7]) s.note('anvil', s.bar(bar) + 3, 1, 84, 0.3);
      // A′: horns answer with dignity, tremolo strings shiver.
      s.melody('horns', OATH_ANSWER, 8, { octave: 0, vel: 0.62, progression: A, progressionStart: 8, progressionBars: 8 });
      s.pad('tremolo', A, 8, 8, { low: 57, high: 74, vel: 0.3 });
      s.pad('celli', A, 8, 8, { voices: 2, low: 43, high: 57, vel: 0.36 });
      s.bass('basses', A, 8, 8, { octave: 31, vel: 0.4 });
      s.rootHits('timpani', A, 8, 8, { offsets: [0], vel: 0.42 });
      // B: trombones and a low choir, building with a roll.
      s.melody('trombones', BRIDGE, 16, { octave: -1, vel: 0.58, progression: B, progressionStart: 16, progressionBars: 8 });
      s.pad('choirOo', B, 16, 8, { low: 50, high: 67, vel: 0.36 });
      s.pad('violas', B, 16, 8, { low: 55, high: 70, vel: 0.32 });
      s.bass('basses', B, 16, 8, { octave: 31, vel: 0.42 });
      s.note('timpaniRoll', s.bar(22), 8, 38, 0.6);
      lift(s, 24, { vel: 0.6 });
      // A″: violins and horns in octaves.
      s.melody('violins1', OATH, 24, { octave: 0, vel: 0.68, progression: A, progressionStart: 24, progressionBars: 8 });
      s.melody('horns', OATH, 24, { octave: -1, vel: 0.62, progression: A, progressionStart: 24, progressionBars: 8 });
      s.melody('trombones', COUNTER, 24, { octave: -1, vel: 0.4, progression: A, progressionStart: 24, progressionBars: 8 });
      s.pad('violas', A, 24, 8, { low: 55, high: 72, vel: 0.36 });
      s.bass('basses', A, 24, 8, { octave: 31, vel: 0.48 });
      s.rootHits('timpani', A, 24, 8, { offsets: [0, 2], vel: 0.5 });
      s.rhythm('taiko', 'X.......X.......', 24, 8, { midi: 36, vel: 0.5 });
    },
    levels: {
      celli: 0, horns: -1, violins1: 0, trombones: -3, basses: -10, tremolo: -12, violas: -11, choirOo: -11,
      taiko: -10, timpani: -10, timpaniRoll: -9, anvil: -17, swell: -16, cymbal: -15,
    },
    combatLevels: COMBAT_LEVELS,
  });
}

function frost() {
  return region({
    key: 'theme-frost', bpm: 70, tonic: 64, mode: 'aeolian', style: 'frost',
    reverb: { size: 0.92, damp: 0.18, high: 9500 },
    explore: (s, A, B) => {
      // A: a celesta plays the Oath like falling snow over glassy harmonics.
      s.pad('glass', A, 0, 8, { low: 76, high: 91, vel: 0.4 });
      s.melody('celesta', OATH, 0, { octave: 1, vel: 0.55, legato: 1, progression: A, progressionBars: 8 });
      s.arpeggio('harp', A, 0, 8, { pattern: [0, 2, 4, 3], step: 1, low: 64, high: 91, vel: 0.3 });
      s.pad('choirOo', A, 0, 8, { low: 52, high: 67, vel: 0.26 });
      s.note('basses', 0, 32, 40, 0.24);
      // A′: alto flute, glock echoes, shimmering tremolo.
      s.melody('flute', OATH_ANSWER, 8, { octave: 0, vel: 0.55, progression: A, progressionStart: 8, progressionBars: 8 });
      s.pad('tremolo', A, 8, 8, { low: 71, high: 86, vel: 0.22 });
      s.pad('choirOo', A, 8, 8, { low: 52, high: 67, vel: 0.3 });
      for (const bar of [9, 11, 13, 15]) s.note('glock', s.bar(bar) + 2, 2, 88, 0.3);
      s.bass('basses', A, 8, 8, { octave: 28, vel: 0.3 });
      // B: celli under ice, harp drops.
      s.melody('celli', BRIDGE, 16, { octave: -1, vel: 0.58, progression: B, progressionStart: 16, progressionBars: 8 });
      s.pad('glass', B, 16, 8, { low: 76, high: 91, vel: 0.36 });
      s.arpeggio('harp', B, 16, 8, { pattern: [3, 2, 1, 0], step: 1, low: 64, high: 91, vel: 0.3 });
      s.bass('basses', B, 16, 8, { octave: 28, vel: 0.3 });
      // A″: violins high, celesta doubling, horns distant.
      s.melody('violins1', OATH, 24, { octave: 1, vel: 0.6, progression: A, progressionStart: 24, progressionBars: 8 });
      s.melody('celesta', quiet(OATH, 0.8), 24, { octave: 1, legato: 1, progression: A, progressionStart: 24, progressionBars: 8 });
      s.melody('horns', COUNTER, 24, { octave: -1, vel: 0.38, progression: A, progressionStart: 24, progressionBars: 8 });
      s.pad('glass', A, 24, 8, { low: 76, high: 91, vel: 0.36 });
      s.bass('basses', A, 24, 8, { octave: 28, vel: 0.34 });
      s.note('timpani', s.bar(24), 1, 40, 0.38);
    },
    levels: {
      celesta: -2, flute: -1, celli: 0, violins1: 0, horns: -6, glass: -11, harp: -9, choirOo: -12, tremolo: -14,
      glock: -14, basses: -13, timpani: -14,
    },
    combatLevels: COMBAT_LEVELS,
  });
}

function ruins() {
  return region({
    key: 'theme-ruins', bpm: 96, tonic: 62, mode: 'aeolian', style: 'ruins',
    reverb: { size: 0.9, damp: 0.34, high: 7600 },
    explore: (s, A, B) => {
      // The Oath returns as a quiet flute call, answered by distant bells in the old stone halls.
      s.note('basses', 0, 32, 38, 0.26);
      s.pad('celli', A, 0, 8, { voices: 2, low: 43, high: 58, vel: 0.24 });
      s.melody('flute', quiet(OATH, 0.64), 0, { octave: 0, progression: A, progressionBars: 8 });
      s.arpeggio('harp', A, 0, 8, { pattern: [0, 2, 4, 2], step: 1, low: 50, high: 74, vel: 0.24, length: 0.65 });
      for (const bar of [0, 3, 6]) s.note('bell', s.bar(bar) + 2, 1.5, 83, 0.26);

      // A′: the woodwind phrase changes while the bell answers leave space between calls.
      s.melody('flute', quiet(OATH_ANSWER, 0.6), 8, { octave: 0, progression: A, progressionStart: 8, progressionBars: 8 });
      s.pad('violas', A, 8, 8, { low: 55, high: 70, vel: 0.22 });
      s.bass('pizz', A, 8, 8, { octave: 43, pattern: [[0, 1.5, 0, 0.55], [2, 1.5, 0, 0.5]], vel: 0.33 });
      for (const bar of [9, 12, 15]) s.note('bell', s.bar(bar) + 1, 1.5, 86, 0.23);

      // B: lower notes recall the broken signal, with the same shared minor bridge harmony.
      s.melody('celli', quiet(BRIDGE, 0.68), 16, { octave: -1, progression: B, progressionStart: 16, progressionBars: 8 });
      s.pad('choirOo', B, 16, 8, { low: 52, high: 67, vel: 0.2 });
      s.arpeggio('harp', B, 16, 8, { pattern: [0, 2, 1, 3], step: 1, low: 50, high: 74, vel: 0.2, length: 0.65 });
      for (const bar of [17, 21, 23]) s.note('bell', s.bar(bar) + 2, 1.5, 79, 0.22);

      // A″: the familiar call returns, with a soft woodwind answer rather than a full brass swell.
      s.melody('flute', quiet(OATH, 0.7), 24, { octave: 0, progression: A, progressionStart: 24, progressionBars: 8 });
      s.melody('violins1', quiet(OATH_ANSWER, 0.48), 24, { octave: 0, progression: A, progressionStart: 24, progressionBars: 8 });
      s.pad('celli', A, 24, 8, { voices: 2, low: 43, high: 58, vel: 0.28 });
      s.bass('pizz', A, 24, 8, { octave: 43, vel: 0.3 });
      s.arpeggio('harp', A, 24, 8, { pattern: [0, 2, 4, 2], step: 1, low: 50, high: 74, vel: 0.24, length: 0.65 });
      for (const bar of [24, 27, 30]) s.note('bell', s.bar(bar) + 2, 1.5, 83, 0.3);
    },
    levels: {
      flute: -2, celli: -3, violins1: -9, violas: -12, choirOo: -14, harp: -10, pizz: -12,
      basses: -14, bell: -11, glock: -16, timpani: -16, swell: -18, cymbal: -18,
    },
    combatLevels: {
      ...COMBAT_LEVELS, pizz: -7, celli: -3, flute: -2, bell: -13, toms: -8, anvil: -15,
    },
  });
}

// Phrygian-dominant material for the Sunwell sands (D E♭ F♯ G A B♭ C).
const SANDS_A = [
  { root: 1, beats: 4 }, { root: 2, beats: 4 }, { root: 1, beats: 4 }, { root: 2, beats: 4 },
  { root: 4, beats: 4 }, { root: 2, beats: 4 }, { root: 2, beats: 2 }, { root: 1, beats: 2 }, { root: 1, beats: 4 },
];
const SANDS_B = [
  { root: 4, beats: 4 }, { root: 7, beats: 4 }, { root: 2, beats: 4 }, { root: 1, beats: 4 },
  { root: 4, beats: 4 }, { root: 2, beats: 4 }, { root: 7, beats: 2 }, { root: 2, beats: 2 }, { root: 1, beats: 4 },
];
const SANDS_TUNE = [
  [5, 1], [4, 0.5], [3, 0.5], [2, 1], [1, 1],
  [2, 2], [4, 1], [6, 1],
  [5, 2], [3, 1], [1, 1],
  [6, 2], [4, 1], [2, 1],
  [4, 1], [5, 1], [6, 2],
  [6, 1], [5, 1], [4, 1], [2, 1],
  [2, 2], [3, 1], [2, 1],
  [1, 4],
];
const SANDS_ORNATE = [
  [1, 0.5], [2, 0.5], [3, 1], [5, 2],
  [6, 1], [5, 0.5], [4, 0.5], [2, 2],
  [3, 0.5], [2, 0.5], [3, 1], [5, 1], [3, 1],
  [4, 1], [2, 1], [2, 2],
  [8, 2], [6, 1], [4, 1],
  [2, 1], [4, 1], [6, 1], [4, 1],
  [4, 1], [2, 1], [3, 2],
  [1, 4],
];
const SANDS_BRIDGE = [
  [4, 2], [6, 1], [8, 1],
  [7, 2], [9, 1], [7, 1],
  [6, 3], [4, 1],
  [5, 2], [3, 2],
  [8, 1], [6, 1], [4, 1], [6, 1],
  [9, 2], [6, 2],
  [7, 2], [6, 2],
  [5, 4],
];

function sands() {
  const key = 'theme-sands';
  const bpm = 88;
  const tonic = 62;
  const mode = 'phrygianDominant';
  const s = new Score({ name: key, bpm, bars: 32, tonic, mode });
  // A tonic drone throughout, like wind over the dunes.
  s.note('celli', 0, 128, 38, 0.32);
  // A: ney over oud and hand drums.
  s.melody('ney', SANDS_TUNE, 0, { octave: 0, vel: 0.62 });
  s.arpeggio('oud', SANDS_A, 0, 8, { pattern: [0, 2, 1, 2], step: 0.5, low: 50, high: 69, vel: 0.45, length: 0.6 });
  s.rhythm('frameDrum', 'X......x.X......', 0, 8, { midi: 45, vel: 0.5 });
  s.rhythm('frameTek', '....x..x....x.xx', 0, 8, { midi: 45, vel: 0.42 });
  // A′: violins in unison with the ornamented line, ney holds long notes.
  s.melody('violins1', SANDS_ORNATE, 8, { octave: 1, vel: 0.6 });
  s.pad('ney', SANDS_A, 8, 8, { voices: 1, low: 69, high: 81, vel: 0.36 });
  s.arpeggio('oud', SANDS_A, 8, 8, { pattern: [0, 2, 1, 2, 3, 2], step: 0.5, low: 50, high: 69, vel: 0.45, length: 0.6 });
  s.rhythm('frameDrum', 'X......x.X......', 8, 8, { midi: 45, vel: 0.55 });
  s.rhythm('frameTek', '....x..x....x.xx', 8, 8, { midi: 45, vel: 0.45 });
  s.rhythm('shaker', '.x.x.x.x.x.x.x.x', 8, 8, { vel: 0.35 });
  // B: celli and a veiled choir; the drums thin out.
  s.melody('celli', SANDS_BRIDGE, 16, { octave: -1, vel: 0.6 });
  s.pad('choirOo', SANDS_B, 16, 8, { low: 55, high: 70, vel: 0.32 });
  s.arpeggio('harp', SANDS_B, 16, 8, { pattern: [0, 1, 2, 3], step: 1, low: 55, high: 86, vel: 0.32 });
  s.rhythm('frameDrum', 'X...............', 16, 8, { midi: 45, vel: 0.45 });
  lift(s, 24, { vel: 0.5 });
  // A″: violins and ney in octaves, horns underneath, tambourine.
  s.melody('violins1', SANDS_TUNE, 24, { octave: 1, vel: 0.66 });
  s.melody('ney', quiet(SANDS_TUNE, 0.85), 24, { octave: 0 });
  s.pad('horns', SANDS_A, 24, 8, { voices: 3, low: 53, high: 67, vel: 0.36 });
  s.arpeggio('oud', SANDS_A, 24, 8, { pattern: [0, 2, 1, 2], step: 0.5, low: 50, high: 69, vel: 0.48, length: 0.6 });
  s.rhythm('frameDrum', 'X..x...x.X..x...', 24, 8, { midi: 45, vel: 0.6 });
  s.rhythm('frameTek', '..x.x..x..x.x.xx', 24, 8, { midi: 45, vel: 0.5 });
  s.rhythm('tambourine', '....x.......x...', 24, 8, { vel: 0.4 });
  const A = SANDS_A;
  const B = SANDS_B;
  return {
    key,
    layers: [
      { layer: 'base', score: s },
      { layer: 'combat', score: combatLayer(key, { bpm, tonic, mode, A, B, style: 'sands' }), levels: COMBAT_LEVELS },
    ],
    levels: {
      ney: -1, violins1: 0, celli: -2, oud: -7, horns: -9, choirOo: -11, harp: -10, frameDrum: -9, frameTek: -13,
      shaker: -18, tambourine: -16, swell: -16, cymbal: -16,
    },
    reverb: { size: 0.86, damp: 0.45, high: 6800 },
  };
}

// ── Bosses ──────────────────────────────────────────────────────────────────────────────────

const BOSS_A = [
  { root: 1, beats: 4 }, { root: 6, beats: 4 }, { root: 4, beats: 4 }, { root: 5, beats: 4, mode: 'harmonic' },
  { root: 1, beats: 4 }, { root: 6, beats: 4 }, { root: 4, beats: 4 }, { root: 5, beats: 4, mode: 'harmonic' },
];
const BOSS_B = [
  { root: 4, beats: 4 }, { root: 6, beats: 4 }, { root: 3, beats: 4 }, { root: 7, beats: 4 },
  { root: 4, beats: 4 }, { root: 6, beats: 4 }, { root: 5, beats: 4, mode: 'harmonic' }, { root: 5, beats: 4, mode: 'harmonic' },
];
const BOSS_THEME = [
  [1, 1], [2, 0.5], [3, 0.5], [5, 2],
  [6, 2], [5, 1], [3, 1],
  [4, 1], [6, 1], [8, 1], [6, 1],
  [5, 2], [2, 1], [0, 1],
  [1, 1], [2, 0.5], [3, 0.5], [5, 1], [8, 1],
  [8, 2], [6, 2],
  [4, 1], [6, 1], [4, 1], [1, 1],
  [2, 2], [0, 2],
];
const BOSS_BRIDGE = [
  [8, 3], [6, 1],
  [6, 2], [8, 2],
  [7, 2], [5, 2],
  [9, 3], [7, 1],
  [6, 1], [8, 1], [11, 2],
  [10, 2], [8, 2],
  [7, 2], [9, 2],
  [12, 4],
];
function boss({ key, bpm, tonic, mode, colour, A = BOSS_A, B = BOSS_B, theme = BOSS_THEME, bridge = BOSS_BRIDGE }) {
  const base = new Score({ name: key, bpm, bars: 32, tonic, mode });
  const rage = new Score({ name: `${key}:phase2`, bpm, bars: 32, tonic, mode });
  const sections = [[0, A, 'A'], [8, A, 'A2'], [16, B, 'B'], [24, A, 'A3']];
  for (const [start, progression, part] of sections) {
    const figure = colour === 'sunwell' ? [0, 0, 12, 0, 7, 0, 12, 0] : [0, 0, 12, 0, 0, 0, 12, 7];
    base.ostinato('spiccato', progression, start, 8, { figure, step: 0.5, octave: 43, vel: 0.72, length: 0.3, accents: [1, 0.7, 0.85, 0.7] });
    base.bass('basses', progression, start, 8, { octave: 31, pattern: [[0, 1, 0, 1], [1, 1, 0, 0.8], [2, 1, 0, 0.9], [3, 1, 0, 0.8]], vel: 0.6 });
    base.rhythm('taiko', 'X..x..x.X.x.x...', start, 8, { midi: 36, vel: 0.8 });
    base.rootHits('timpani', progression, start, 8, { low: 38, offsets: [0, 2], vel: 0.7 });
    if (part === 'A') {
      base.melody('horns', theme, start, { octave: -1, vel: 0.75, progression, progressionStart: start, progressionBars: 8 });
      base.melody('trombones', theme, start, { octave: -1, vel: 0.6, progression, progressionStart: start, progressionBars: 8 });
      base.pad('violas', progression, start, 8, { low: 55, high: 70, vel: 0.4 });
    } else if (part === 'A2') {
      base.melody('violins1', theme, start, { octave: 1, vel: 0.75, progression, progressionStart: start, progressionBars: 8 });
      base.melody('horns', theme, start, { octave: 0, vel: 0.7, progression, progressionStart: start, progressionBars: 8 });
      base.stabs('trumpets', progression, start, 8, { hits: [[0, 0.5, 1], [2.5, 0.4, 0.85]], voices: 2, low: 64, high: 79, vel: 0.6 });
      base.rhythm('snare', '....X.......X.x.', start, 8, { vel: 0.5 });
    } else if (part === 'B') {
      base.melody('trombones', bridge, start, { octave: -2, vel: 0.72, progression, progressionStart: start, progressionBars: 8 });
      base.melody('horns', bridge, start, { octave: -1, vel: 0.62, progression, progressionStart: start, progressionBars: 8 });
      base.pad('tremolo', progression, start, 8, { low: 62, high: 79, vel: 0.45 });
      base.rhythm('snare', 'o.o.x.o.o.o.x.oo', start, 8, { vel: 0.45 });
    } else {
      base.melody('trumpets', theme, start, { octave: 0, vel: 0.72, progression, progressionStart: start, progressionBars: 8 });
      base.melody('violins1', theme, start, { octave: 1, vel: 0.8, progression, progressionStart: start, progressionBars: 8 });
      base.melody('horns', theme, start, { octave: -1, vel: 0.75, progression, progressionStart: start, progressionBars: 8 });
      base.pad('violas', progression, start, 8, { low: 55, high: 72, vel: 0.45 });
      base.rhythm('snare', '....X.......X.xx', start, 8, { vel: 0.5 });
    }
    if (colour === 'frost') base.arpeggio('celesta', progression, start, 8, { pattern: [0, 2, 1, 3, 2, 4, 3, 1], step: 0.25, low: 76, high: 98, vel: 0.36, length: 0.5 });
    if (colour === 'sunwell') {
      base.rhythm('frameTek', 'x.xxx.x.x.xxx.xx', start, 8, { midi: 45, vel: 0.55 });
      base.arpeggio('oud', progression, start, 8, { pattern: [0, 1, 2, 1], step: 0.25, low: 50, high: 69, vel: 0.45, length: 0.4 });
    }
    if (colour === 'guardian') base.rhythm('anvil', '...x', start, 8, { midi: 80, vel: 0.45 });
    if (start > 0) lift(base, start, { vel: 0.75 });

    // Phase 2: choir, tremolo, snare drive, brass hits and a rolling floor of drums.
    rage.pad(colour === 'frost' ? 'choirOo' : 'choir', progression, start, 8, { voices: 4, low: 55, high: 76, vel: 0.62 });
    rage.pad('tremolo', progression, start, 8, { voices: 3, low: 72, high: 91, vel: 0.5 });
    rage.rhythm('snare', 'xoxoXoxoxoxoXoxo', start, 8, { vel: 0.5 });
    rage.rhythm('bassDrum', 'X...X...X...X...', start, 8, { midi: 33, vel: 0.65 });
    rage.rhythm('toms', '........X.x.X.XX', start + 7, 1, { midi: 45, vel: 0.75 });
    rage.rhythm('toms', '............X.XX', start + 3, 1, { midi: 47, vel: 0.65 });
    rage.stabs('trumpets', progression, start, 8, { hits: [[0.5, 0.3, 0.8], [1.5, 0.3, 0.8], [3, 0.6, 1]], voices: 3, low: 64, high: 81, vel: 0.65 });
    rage.ostinato('timpani', progression, start, 8, { figure: [0], step: 1, octave: 38, vel: 0.6, length: 1 });
    rage.note('cymbal', rage.bar(start), 2, 60, 0.7);
    rage.note('cymbal', rage.bar(start + 4), 2, 60, 0.6);
    if (colour === 'frost') rage.arpeggio('glock', progression, start, 8, { pattern: [0, 1, 2, 3, 2, 1], step: 0.5, low: 79, high: 98, vel: 0.4, length: 0.5 });
    if (colour === 'guardian') rage.rhythm('anvil', '.x.x', start, 8, { midi: 84, vel: 0.4 });
    if (colour === 'sunwell') rage.rhythm('frameDrum', 'X.xX.xX.X.xX.xXx', start, 8, { midi: 45, vel: 0.65 });
  }
  base.note('cymbal', 0, 2, 60, 0.7);
  return {
    key,
    layers: [
      { layer: 'base', score: base },
      {
        layer: 'phase2', score: rage,
        levels: {
          choir: -4, choirOo: -4, tremolo: -7, snare: -9, bassDrum: -6, toms: -7, trumpets: -6, timpani: -7,
          cymbal: -13, glock: -13, anvil: -14, frameDrum: -8,
        },
      },
    ],
    levels: {
      horns: -1, trombones: -3, violins1: 0, trumpets: -2, spiccato: -5, basses: -8, taiko: -5, timpani: -7,
      violas: -11, tremolo: -11, snare: -11, celesta: -12, frameTek: -11, oud: -9, anvil: -15, swell: -15, cymbal: -13,
    },
    reverb: { size: 0.86, damp: 0.38 },
  };
}

// The Bell Sanctum's score uses a measured, tolling pulse and a Phrygian descent,
// rather than reusing one of the earlier boss arrangements with a different colour.
const RUINS_A = [
  { root: 1, beats: 4 }, { root: 1, beats: 4 }, { root: 6, beats: 4 }, { root: 5, beats: 4 },
  { root: 1, beats: 4 }, { root: 4, beats: 4 }, { root: 6, beats: 4 }, { root: 5, beats: 4 },
];
const RUINS_B = [
  { root: 4, beats: 4 }, { root: 6, beats: 4 }, { root: 1, beats: 4 }, { root: 5, beats: 4 },
  { root: 4, beats: 4 }, { root: 3, beats: 4 }, { root: 5, beats: 4 }, { root: 1, beats: 4 },
];
const RUINS_TOLL = [
  [1, 2], [3, 1], [2, 1], [5, 2], [4, 1], [3, 1], [1, 2], [0, 1], [-2, 1],
  [1, 2], [5, 1], [4, 1], [3, 2], [2, 1], [1, 1], [0, 2], [-2, 2],
];
const RUINS_ANSWER = [
  [5, 2], [4, 1], [3, 1], [1, 2], [2, 1], [3, 1], [5, 2], [8, 2],
  [6, 2], [5, 1], [4, 1], [3, 2], [1, 1], [0, 1], [-2, 2], [1, 2],
];

function bossRuins() {
  const base = new Score({ name: 'boss-ruins', bpm: 128, bars: 32, tonic: 57, mode: 'phrygian' });
  const phase2 = new Score({ name: 'boss-ruins:phase2', bpm: 128, bars: 32, tonic: 57, mode: 'phrygian' });
  const sections = [[0, RUINS_A, 'toll'], [8, RUINS_A, 'answer'], [16, RUINS_B, 'bridge'], [24, RUINS_A, 'return']];
  for (const [start, progression, section] of sections) {
    base.ostinato('pizz', progression, start, 8, {
      figure: section === 'bridge' ? [0, 7, 12, 7] : [0, 12, 7, 12], step: 0.5, octave: 48, vel: 0.48, length: 0.3,
    });
    base.bass('basses', progression, start, 8, { octave: 31, pattern: [[0, 2, 0, 1], [2, 2, 0, 0.8]], vel: 0.55 });
    base.pad('celli', progression, start, 8, { low: 45, high: 60, vel: 0.42 });
    base.rhythm('timpani', 'X...............', start, 8, { midi: 38, vel: 0.55 });
    if (section === 'toll') {
      base.melody('horns', RUINS_TOLL, start, { octave: -1, vel: 0.68, progression, progressionStart: start, progressionBars: 8 });
      base.melody('bell', [[1, 2], [5, 2], [3, 4], [1, 4], [0, 4]], start, { octave: 1, vel: 0.62, progression, progressionStart: start, progressionBars: 8 });
    } else if (section === 'answer') {
      base.melody('violins1', RUINS_ANSWER, start, { octave: 0, vel: 0.58, progression, progressionStart: start, progressionBars: 8 });
      base.pad('violas', progression, start, 8, { low: 57, high: 69, vel: 0.28 });
      base.rhythm('frameDrum', 'X.......x.......', start, 8, { midi: 45, vel: 0.4 });
    } else if (section === 'bridge') {
      base.melody('trombones', RUINS_TOLL, start, { octave: -2, vel: 0.58, progression, progressionStart: start, progressionBars: 8 });
      base.melody('horns', RUINS_ANSWER, start, { octave: -1, vel: 0.54, progression, progressionStart: start, progressionBars: 8 });
      base.pad('tremolo', progression, start, 8, { low: 62, high: 77, vel: 0.28 });
      base.rhythm('snare', '....X.......x...', start, 8, { vel: 0.36 });
    } else {
      base.melody('trumpets', RUINS_TOLL, start, { octave: 0, vel: 0.6, progression, progressionStart: start, progressionBars: 8 });
      base.melody('bell', RUINS_ANSWER, start, { octave: 1, vel: 0.52, progression, progressionStart: start, progressionBars: 8 });
      base.pad('violas', progression, start, 8, { low: 55, high: 72, vel: 0.34 });
      base.rhythm('frameDrum', 'X...x...X.x.x...', start, 8, { midi: 45, vel: 0.5 });
    }
    for (const bar of [start, start + 4]) base.note('bell', base.bar(bar), 1, 50, section === 'bridge' ? 0.52 : 0.42);
    if (start > 0) lift(base, start, { vel: 0.48, crash: false });

    phase2.pad('choirOo', progression, start, 8, { voices: 3, low: 52, high: 72, vel: 0.56 });
    phase2.pad('tremolo', progression, start, 8, { voices: 3, low: 67, high: 86, vel: 0.4 });
    phase2.ostinato('timpani', progression, start, 8, { figure: [0, 0, 7, 0], step: 0.5, octave: 38, vel: 0.52, length: 0.36 });
    phase2.rhythm('bassDrum', 'X...X...X...X...', start, 8, { midi: 33, vel: 0.56 });
    phase2.rhythm('snare', 'x.x.X.x.x.x.X.x.', start, 8, { vel: 0.44 });
    phase2.rhythm('taiko', 'X.......x...X...', start, 8, { midi: 36, vel: 0.46 });
    phase2.stabs('trumpets', progression, start, 8, { hits: [[0.5, 0.3, 0.7], [2.5, 0.3, 0.72]], voices: 3, low: 62, high: 78, vel: 0.48 });
    phase2.rhythm('toms', '............X.XX', start + 3, 1, { midi: 46, vel: 0.62 });
    phase2.rhythm('toms', '........X.x.X.XX', start + 7, 1, { midi: 43, vel: 0.7 });
    phase2.note('bell', phase2.bar(start), 2, 50, 0.48);
    phase2.note('bell', phase2.bar(start + 4), 2, 53, 0.42);
    if (section === 'toll' || section === 'return') {
      phase2.melody('horns', RUINS_TOLL, start, { octave: -1, vel: 0.54, progression, progressionStart: start, progressionBars: 8 });
    } else {
      phase2.melody('violins1', RUINS_ANSWER, start, { octave: 0, vel: 0.48, progression, progressionStart: start, progressionBars: 8 });
    }
    if (start > 0) lift(phase2, start, { vel: 0.6, crash: false });
  }
  return {
    key: 'boss-ruins',
    layers: [
      { layer: 'base', score: base },
      {
        layer: 'phase2', score: phase2,
        levels: { choirOo: -4, tremolo: -8, timpani: -7, bassDrum: -8, snare: -9, taiko: -7, trumpets: -7, toms: -8, bell: -5, horns: -5, violins1: -3 },
      },
    ],
    levels: {
      horns: -2, trombones: -4, violins1: -3, trumpets: -3, pizz: -7, basses: -8, celli: -10,
      violas: -9, timpani: -8, frameDrum: -8, snare: -9, tremolo: -10, bell: -7, swell: -14,
    },
    reverb: { size: 0.88, damp: 0.32 },
  };
}

// ── Stingers ────────────────────────────────────────────────────────────────────────────────

function victory() {
  const s = new Score({ name: 'boss-win', bpm: 100, bars: 2, tonic: 62, mode: 'ionian', tail: 3 });
  const third = 1 / 3;
  s.melody('trumpets', [[-2, third], [-2, third], [-2, third], [1, 1], [3, 0.5], [5, 1.5], [8, 4]], 0, { octave: 0, vel: 0.85, legato: 0.92 });
  s.melody('horns', [[-2, 1], [1, 1], [1, 2], [5, 4]], 0, { octave: -1, vel: 0.7 });
  s.note('timpaniRoll', 0, 1, 45, 0.7);
  s.note('timpani', 1, 1, 38, 0.85);
  s.note('timpani', 4, 1, 38, 0.9);
  s.note('cymbal', 4, 2, 60, 0.85);
  s.note('bassDrum', 4, 1, 33, 0.8);
  for (const midi of [62, 66, 69, 74]) s.note('tremolo', 4, 4, midi, 0.6);
  for (const midi of [62, 66, 69]) s.note('choir', 4, 4, midi, 0.55);
  s.note('basses', 4, 4, 38, 0.6);
  s.melody('harp', [[1, 0.125], [3, 0.125], [5, 0.125], [8, 0.125], [10, 0.125], [12, 0.125], [15, 0.25]], 0, { octave: 0, vel: 0.5, legato: 8 });
  return {
    key: 'boss-win', layers: [{ layer: 'base', score: s }], stinger: true,
    levels: { trumpets: 0, horns: -3, timpani: -6, timpaniRoll: -8, cymbal: -10, bassDrum: -9, tremolo: -8, choir: -9, basses: -10, harp: -10 },
    reverb: { size: 0.86 },
  };
}

function defeat() {
  const s = new Score({ name: 'death', bpm: 60, bars: 1, tonic: 62, mode: 'aeolian', tail: 3 });
  s.melody('horns', [[3, 1], [2, 1], [1, 2]], 0, { octave: 0, vel: 0.5 });
  s.melody('celli', [[1, 2], [-3, 1], [-6, 1]], 0, { octave: -1, vel: 0.55 });
  for (const midi of [57, 62, 65]) s.note('choirOo', 0, 4, midi, 0.45);
  s.note('basses', 0, 4, 38, 0.45);
  s.note('bell', 0, 1, 50, 0.45);
  s.note('timpani', 0, 1, 38, 0.4);
  return {
    key: 'death', layers: [{ layer: 'base', score: s }], stinger: true,
    levels: { horns: 0, celli: -2, choirOo: -6, basses: -9, bell: -10, timpani: -12 },
    reverb: { size: 0.9, damp: 0.3 },
  };
}

function levelUp() {
  const s = new Score({ name: 'levelup', bpm: 120, bars: 1, tonic: 62, mode: 'ionian', tail: 2.2 });
  s.melody('harp', [[1, 0.125], [3, 0.125], [5, 0.125], [8, 0.125], [10, 0.125], [12, 0.125], [15, 0.125], [17, 0.125]], 0, { octave: -1, vel: 0.5, legato: 8 });
  s.melody('celesta', [[1, 0.25], [3, 0.25], [5, 0.25], [8, 0.25], [10, 0.5], [12, 2.5]], 0, { octave: 1, vel: 0.6, legato: 2 });
  for (const midi of [62, 66, 69, 74]) s.note('violins2', 1, 3, midi, 0.5);
  for (const midi of [62, 66, 69]) s.note('choir', 1, 3, midi, 0.42);
  s.note('glock', 1, 2, 98, 0.5);
  s.note('swell', 0, 1, 60, 0.4);
  return {
    key: 'levelup', layers: [{ layer: 'base', score: s }], stinger: true,
    levels: { celesta: 0, harp: -3, violins2: -6, choir: -9, glock: -8, swell: -14 },
    reverb: { size: 0.85 },
  };
}

function questCall() {
  const s = new Score({ name: 'quest', bpm: 96, bars: 1, beatsPerBar: 3, tonic: 67, mode: 'ionian', tail: 1.8 });
  s.melody('horns', [[-2, 0.5], [1, 1.5]], 0, { octave: 0, vel: 0.65 });
  for (const midi of [55, 59, 62, 67]) s.note('harp', 0.5, 2, midi, 0.45);
  s.note('glock', 0.5, 1, 91, 0.45);
  s.note('pizz', 0.5, 1, 43, 0.5);
  return {
    key: 'quest', layers: [{ layer: 'base', score: s }], stinger: true,
    levels: { horns: 0, harp: -5, glock: -9, pizz: -9 },
    reverb: { size: 0.8 },
  };
}

export const MUSIC = [
  title,
  town,
  brightwood,
  ridge,
  frost,
  sands,
  ruins,
  () => boss({ key: 'boss-guardian', bpm: 136, tonic: 60, mode: 'aeolian', colour: 'guardian' }),
  () => boss({ key: 'boss-frost', bpm: 128, tonic: 59, mode: 'aeolian', colour: 'frost' }),
  () => boss({
    key: 'boss-sunwell', bpm: 140, tonic: 64, mode: 'phrygianDominant', colour: 'sunwell',
    A: SANDS_A, B: SANDS_B, theme: SANDS_TUNE, bridge: SANDS_BRIDGE,
  }),
  bossRuins,
  victory,
  defeat,
  levelUp,
  questCall,
];
