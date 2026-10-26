// Judging taps against the song's strokes, and the results at the song's end. Pure: no DOM, audio, 3D or shared state.
// A tap comes in as a position in slots (fractional, as the clock counts it, already brought into the song) and a direction.
import { slotAt, slotsPerBar } from './song.js';

/** How far off a stroke a tap can land, either way, and still be Good. */
export const WINDOW_MS = 90;

/** The verdict on one tap at song position at (in slots) going dir ('D' or 'U'; null for a strum heard but not seen, judged on time only), at rate slots a second, against the nearest
 *  slot: { word, ms (how far off, + is late), text (what to show), good, slot, bar }. */
export function judge(song, at, dir, rate) {
  const slot = Math.round(at) % (song.bars.length * slotsPerBar(song)), ms = Math.round((at - Math.round(at)) / rate * 1000);
  const { stroke, bar } = slotAt(song, slot);
  // as the prototype has it: no stroke there first, then the direction (a picked note has none), then the timing
  const word = !stroke.hit ? (stroke.pluck ? 'Rest here' : 'No strum here') : dir && !stroke.pluck && dir !== stroke.dir ? (stroke.dir === 'D' ? 'Down here' : 'Up here')
    : Math.abs(ms) <= WINDOW_MS ? 'Good' : ms < 0 ? 'Early' : 'Late';
  return { word, ms, text: word === 'Early' || word === 'Late' ? `${word} ${Math.abs(ms)} ms` : word, good: word === 'Good', slot, bar };
}

// the played slots (song slots heard, in any order, repeats fine) that should have been struck or picked
const hitsOf = (song, played) => [...new Set(played)].filter(slot => slotAt(song, slot).stroke.hit);

/** Misses per bar, { bar index: count }, from the verdicts on a run and the song slots it played: each tap that was not
 *  Good, and each stroke played with no tap on it at all. Bars with none are left out. */
export function missesByBar(song, verdicts, played) {
  const tapped = new Set(verdicts.map(v => v.slot)), misses = {};
  const miss = bar => { misses[bar] = (misses[bar] ?? 0) + 1; };
  for (const v of verdicts) if (!v.good) miss(v.bar);
  for (const slot of hitsOf(song, played)) if (!tapped.has(slot)) miss(slotAt(song, slot).bar);
  return misses;
}

/** How a run went: onTime (the strokes played that got a Good tap), percentOnTime (the same, 0 to 100), worstBar (the bar index with the most
 *  misses, the earlier on a tie; null with none), taps, hits (strokes played) and misses (as missesByBar gives them). */
export function summary(song, verdicts, played) {
  const hits = hitsOf(song, played), good = new Set(verdicts.filter(v => v.good).map(v => v.slot));
  const misses = missesByBar(song, verdicts, played), worst = Object.entries(misses).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const onTime = hits.filter(s => good.has(s)).length;
  return { onTime, percentOnTime: hits.length ? Math.round(100 * onTime / hits.length) : 0,
    worstBar: worst ? +worst[0] : null, taps: verdicts.length, hits: hits.length, misses };
}
