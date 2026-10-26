// Practice settings applied to a song: the capo, tempo choices and the strum summary. Pure: no DOM, audio, 3D or shared state.
import { NOTES, ALIAS } from './song.js';

/** A chord's name as it sounds with the capo on a fret: every note letter moves up, the bass of a slash chord too (D/F# capo 2 = E/Ab). */
export const soundingName = (name, capo) => name.replace(/[A-G][#b]?/g, root => NOTES[(NOTES.indexOf(ALIAS[root] ?? root) + capo) % 12]);

/** "Play it slowly": 70% of the song's tempo (in 6/8 the dotted-quarter pulse, as the song gives it). */
export const slowBpm = song => Math.round(song.bpm * .7);

/** Each different strum (or picking pattern) in the song, most used first: the first bar that plays it, how many bars do,
 *  the section it first turns up in (null before any section), and most = it covers over half the song's bars. */
export function strumSummary(song) {
  const seen = new Map();
  let section = null;
  song.bars.forEach((b, n) => {
    section = b.section ?? section;
    const key = (b.strum ?? '') + '|' + (b.pluck ?? '').trim().split(/\s+/).join(' ');
    if (!seen.has(key)) seen.set(key, { bar: n, bars: 0, section });
    seen.get(key).bars++;
  });
  return [...seen.values()].sort((a, b) => b.bars - a.bars).map(p => ({ ...p, most: p.bars > song.bars.length / 2 }));
}
