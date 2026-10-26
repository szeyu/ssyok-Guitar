// Practice settings applied to a song: the capo, tempo choices and the strum summary. Pure: no DOM, audio, 3D or shared state.
import { NOTES, ALIAS, strumPatterns } from './song.js';
import { chordsUsed } from './chords.js';

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
