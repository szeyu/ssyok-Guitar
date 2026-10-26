// Practice settings applied to a song: the capo, tempo choices, loops, the count-in and the strum summary. Pure: no DOM, audio, 3D or shared state.
import { NOTES, ALIAS, strumPatterns, slotsPerBar, slotAt } from './song.js';
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
export const TEMPO_MIN = 20, TEMPO_MAX = 200;

/** "Speed up each loop": 5 bpm more each time a loop comes round, up to TEMPO_MAX. */
export const speedUp = bpm => Math.min(TEMPO_MAX, bpm + 5);

/** The slots a loop plays, { a, b } (a inclusive, b exclusive), chosen at a slot of the song:
 *  'song' the whole song; 'bar' the bar holding the slot; 'change' the next chord change from there, the last stretch of the
 *  chord before it and the first of the chord after (a stretch is one chord's part of one bar). The change from the last bar
 *  back to the first counts, so b can run past the song's end: songSlot wraps it. A song of one chord loops two bars. */
export function loopRange(song, kind, slot) {
  const per = slotsPerBar(song), total = song.bars.length * per, start = Math.floor(slot / per) * per;
  if (kind === 'song') return { a: 0, b: total };
  if (kind === 'bar') return { a: start, b: start + per };
  const parts = song.bars.flatMap((bar, n) => { const cs = barChords(bar), len = per / cs.length; return cs.map((chord, j) => ({ chord, a: n * per + j * len, b: n * per + (j + 1) * len })); });
  const from = parts.findIndex(p => slot < p.b);
  for (let k = from; k < from + parts.length; k++) {
    const p = parts[k % parts.length], q = parts[(k + 1) % parts.length];
    if (p.chord !== q.chord) return { a: p.a, b: q.b + (k + 1 >= parts.length ? total : 0) };
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

/** The song's sections in order for the timeline: { name, bar, bars }. Bars before the first named section are "Start". */
export function sections(song) {
  const out = [];
  song.bars.forEach((bar, n) => { if (!n || bar.section) out.push({ name: bar.section ?? 'Start', bar: n, bars: 0 }); out.at(-1).bars++; });
  return out;
}

/** The one-bar count-in: how many pulses, and how many slots each lasts (a quarter is 2 slots, a 6/8 dotted quarter 3). */
export const countIn = song => song.compound ? { pulses: 2, slots: 3 } : { pulses: song.beats === 3 ? 3 : 4, slots: 2 };

/** The words under the hit line at a song slot: now, the line being sung { chord, text, sung } (sung is the part of text sung so
 *  far: timed words up to this slot, a plain line all at once), and next, the line after it { chord, text }; each null when there
 *  is none. A plain line stays up for up to 8 bars until the next starts; timed words show only in their own bar. */
export function lyricLines(song, slot) {
  const per = slotsPerBar(song), n = Math.floor(slot / per), words = m => m < song.bars.length ? slotAt(song, m * per).lyric : '';
  let from = n;
  while (from > 0 && from > n - 8 && !words(from)) from--;
  const shown = words(from) && (from === n || !song.bars[from].syllables);
  let to = shown ? from + 1 : n + 1;
  while (to < song.bars.length && to < n + 8 && !words(to)) to++;
  const sung = () => {
    if (!song.bars[from].syllables) return words(from);
    const upTo = from === n ? slot % per : per - 1;
    return Array.from({ length: upTo + 1 }, (_, i) => slotAt(song, from * per + i).syllable).filter(Boolean).reduce((a, x) => a + x + (x.endsWith('-') ? '' : ' '), '').trim();
  };
  return {
    now: shown ? { chord: song.bars[from].chord, text: words(from), sung: sung() } : null,
    next: words(to) ? { chord: song.bars[to].chord, text: words(to) } : null,
  };
}
