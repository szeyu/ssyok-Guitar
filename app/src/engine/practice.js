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

const LAND_EARLY = .08;   // seconds: the fretting hand lands this long before the chord sounds, so you see the change coming

/** The fretting hand at a position (fractional, counted through the loop as the clock counts it), at rate slots a second:
 *  chord, the shape held; next, the next different chord it heads for (round the loop; chord itself if the loop never
 *  changes); sounds, the position next sounds at; lands, the position the hand arrives there, a moment before; move, 0
 *  (holding chord) to 1 (on next). The hand travels during the last slot before the change (a third of a short stretch). */
export function handAt(song, loop, pos, rate) {
  const per = slotsPerBar(song), stretch = s => stretchSlots(song, Math.floor(s / per));
  const chordAt = s => barChords(song.bars[Math.floor(s / per)])[Math.floor(s % per / stretch(s))];
  const at = Math.floor(pos), here = songSlot(song, loop, at), chord = chordAt(here);
  const ends = at - here % stretch(here) + stretch(here);                     // where this chord's stretch ends
  let len = stretch(here), sounds = ends, next = chordAt(songSlot(song, loop, sounds));
  for (let k = 0; next === chord && k < song.bars.length * per; k++) {          // the same chord again: look on to the change
    const s = songSlot(song, loop, sounds);
    len = stretch(s); sounds += len; next = chordAt(songSlot(song, loop, sounds));
  }
  if (next === chord) { sounds = ends; len = stretch(here); }
  const lands = sounds - Math.min(LAND_EARLY * rate, len / 4), travel = Math.min(1, len / 3);
  return { chord, next, sounds, lands, move: Math.min(1, Math.max(0, (pos - (lands - travel)) / travel)) };
}
