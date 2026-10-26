// The hands at a slot or position: when the fretting hand moves between chords, and what the strumming hand plays. Pure: no
// DOM, audio, 3D or shared state.
import { slotsPerBar, stretchSlots, slotAt, riffMarks } from './song.js';
import { barChords, voicing } from './chords.js';
import { songSlot } from './practice.js';

/** The picking finger for each string (0 = thickest): the thumb on the three bass strings. */
export const PIMA = 'pppima';

/** What the strumming hand plays at a song slot: { stroke, count } as slotAt gives them, frets (the fingering's, with your
 *  picks) and riff (the riff notes with their own fret, as riffMarks gives them). */
export function playedAt(song, slot, picks) {
  const { stroke, count, chord } = slotAt(song, slot);
  return { stroke, count, frets: voicing(song, chord, picks).frets, riff: riffMarks(song, slot) };
}

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
