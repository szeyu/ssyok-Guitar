// Practice settings applied to a song: the capo, tempo choices, loops, the count-in and the strum summary. Pure: no DOM, audio, 3D or shared state.
import { NOTES, ALIAS, strumPatterns, slotsPerBar, stretchSlots } from './song.js';
import { chordsUsed, barChords } from './chords.js';

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const FLAT_KEYS = [5, 10, 3, 8, 1, 6];                         // F Bb Eb Ab Db Gb major
const pitch = note => NOTES.indexOf(ALIAS[note] ?? note);

/** A chord's name as it sounds with the capo on a fret: every note letter moves up, the bass of a slash chord too, spelled with
 *  flats or sharps for the key the song then sounds in (D/F# capo 2 = E/G#). The key is the song's first chord (a minor one
 *  counts as its relative major), or the chord itself when no song is given. */
// ponytail: the first chord stands in for the key; a song "key" field would replace the guess if songs start to need it
export function soundingName(name, capo, song) {
  const [, root, minor] = (song ? chordsUsed(song)[0] : name).match(/^([A-G][#b]?)(m(?!aj))?/);
  const spell = FLAT_KEYS.includes((pitch(root) + capo + (minor ? 3 : 0)) % 12) ? FLATS : SHARPS;
  return name.replace(/[A-G][#b]?/g, note => spell[(pitch(note) + capo) % 12]);
}

/** "Play it slowly": 70% of the song's tempo (in 6/8 the dotted-quarter pulse, as the song gives it). */
export const slowBpm = song => Math.round(song.bpm * .7);

/** The capo in play: the fret you chose (0 = none), else the song's, else none. */
export const capoOf = (song, chosen) => chosen ?? song.capo ?? 0;

/** Each different strum (or picking pattern) in the song, as strumPatterns gives them, with most = it covers over half the song's bars. */
export const strumSummary = song => strumPatterns(song).map(p => ({ ...p, most: p.bars > song.bars.length / 2 }));

/** The tempo range the player offers, in the song's own unit (quarter notes, or the dotted-quarter pulse in 6/8). */
export const TEMPO_MIN = 40, TEMPO_MAX = 140;

/** "Speed up each loop": 5 bpm more each time a loop comes round, up to TEMPO_MAX. */
export const speedUp = bpm => Math.min(TEMPO_MAX, bpm + 5);

/** The slots a loop plays, { a, b } (a inclusive, b exclusive), chosen at a slot of the song:
 *  'song' the whole song; 'bar' the bar holding the slot; 'change' from the start of the chord stretch the slot is in through
 *  the end of the next chord's first stretch, so you hear the whole chord and the change (a stretch is one chord's part of one
 *  bar). The change from the last bar back to the first counts, so b can run past the song's end: songSlot wraps it. A song of
 *  one chord loops two bars. */
export function loopRange(song, kind, slot) {
  const per = slotsPerBar(song), total = song.bars.length * per, start = Math.floor(slot / per) * per;
  if (kind === 'song') return { a: 0, b: total };
  if (kind === 'bar') return { a: start, b: start + per };
  const parts = song.bars.flatMap((bar, n) => { const len = stretchSlots(song, n); return barChords(bar).map((chord, j) => ({ chord, a: n * per + j * len, b: n * per + (j + 1) * len })); });
  const from = parts.findIndex(p => slot < p.b), here = parts[from];
  for (let k = from + 1; k < from + parts.length; k++) {
    const next = parts[k % parts.length];
    if (next.chord !== here.chord) return { a: here.a, b: next.b + (k >= parts.length ? total : 0) };
  }
  return { a: start, b: start + 2 * per };
}

/** The song slot played at a position that keeps counting past a loop's end: it comes round to the loop's start, and a loop
 *  running past the song's end carries on from the first bar. */
export function songSlot(song, loop, slot) {
  const total = song.bars.length * slotsPerBar(song);
  if (slot >= loop.b) slot = loop.a + (slot - loop.a) % (loop.b - loop.a);
  return slot % total;
}

/** The one-bar count-in: how many pulses, and how many slots each lasts (a quarter is 2 slots, a 6/8 dotted quarter 3). */
export const countIn = song => song.compound ? { pulses: 2, slots: 3 } : { pulses: song.beats === 3 ? 3 : 4, slots: 2 };

// The strum steps: a beginner path from "down on the beat" to a full pattern, one set per meter, played over the song's first bars.
const STEPS = {
  4: [
    { name: 'Down on every beat', strum: 'D.D.D.D.', say: 'Count 1 2 3 4. Hit down on each number. Let the hand come back up without touching the strings.' },
    { name: 'Down and up, all eight', strum: 'DUDUDUDU', say: 'Count 1 & 2 & 3 & 4 &. Down on the numbers, up on the "&". The hand never stops.' },
    { name: 'Miss one up', strum: 'D.DUDUDU', say: 'Same swing, but miss the strings on the first "&". Keep the hand moving through the miss.' },
    { name: 'The full pattern', strum: 'D.DU.UDU', say: 'Now also miss the down on 3. The hand still swings down there, it just does not touch.' },
    { name: 'Add the chuck', strum: 'D.xU.UxU', say: 'On 2 and 4 the side of the hand lands on the strings, so you hear a click, not a chord.' },
  ],
  3: [
    { name: 'Down on every beat', strum: 'D.D.D.', say: 'Count 1 2 3, like a waltz. Hit down on each number.' },
    { name: 'Down and up, all six', strum: 'DUDUDU', say: 'Count 1 & 2 & 3 &. Down on the numbers, up on the "&". The hand never stops.' },
    { name: 'The waltz strum', strum: 'D.DUDU', say: 'Miss the strings on the first "&". The hand keeps swinging through the miss.' },
    { name: 'Lean on the one', strum: '>.DUDU', say: 'Hit the 1 harder than the rest. That is what makes it feel like three.' },
  ],
  6: [
    { name: 'Down on the pulse', strum: 'D..D..', say: 'Count 1 2 3 4 5 6. Hit down on 1 and 4 only: that is the slow pulse of the song.' },
    { name: 'Down on all six', strum: 'DDDDDD', say: 'Six even down strokes. Keep them small and relaxed.' },
    { name: 'Lean on 1 and 4', strum: '>DD>DD', say: 'Same six downs, but hit 1 and 4 harder. This is the classic 6/8 strum.' },
    { name: 'Add the ups', strum: '>DU>DU', say: 'Up strokes on 3 and 6 make it flow: down, down, up, twice.' },
  ],
};

/** The song's strum steps, in order: { name, strum, say } for its meter (4/4, 3/4 or 6/8). */
export const strumSteps = song => STEPS[song.compound ? 6 : song.beats === 3 ? 3 : 4];

/** A stage's tempo in the song's unit: 60 quarters a minute, and in 6/8 60 dotted quarters (the pulse the song's bpm counts). */
export const STEP_BPM = 60;

/** Stage n (1 = the first) as a song of its own: the song's first four bars, their chords kept, every bar strummed with the
 *  step, at STEP_BPM. The song itself is left as it was. */
export const stepSong = (song, n) => ({ ...song, bpm: STEP_BPM,
  bars: song.bars.slice(0, 4).map(bar => ({ chord: bar.chord, strum: strumSteps(song)[n - 1].strum })) });
