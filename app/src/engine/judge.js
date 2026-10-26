// Judging taps against the song's strokes, and the results at the song's end. Pure: no DOM, audio, 3D or shared state.
// A tap comes in as a position in slots (fractional, as the clock counts it, already brought into the song) and a direction.
import { slotAt, slotsPerBar } from './song.js';

/** How far off a stroke a tap can land, either way, and still be Good. */
export const WINDOW_MS = 90;

/** The verdict on one tap at song position at (in slots) going dir ('D' or 'U'; null for a strum heard but not seen, judged on time only), at rate slots a second:
 *  { word, tone ('good' | 'off' | 'bad'), ms (how far off, + is late), text (what to show), good, slot, bar }; null past the song's end (at ≥ its last slot's end).
 *  The rule: a tap whose nearest slot is a pass or a picked rest, within WINDOW_MS of it, is No strum here or Rest here. Any other tap is judged against
 *  the nearest stroke: the wrong direction first (a picked note has none), then Good within ±WINDOW_MS, else Early or Late by its ms. */
export function judge(song, at, dir, rate) {
  const total = song.bars.length * slotsPerBar(song);
  if (at >= total) return null;
  const near = Math.max(0, Math.round(at)), msOff = slot => Math.round((at - slot) / rate * 1000);
  const verdict = (word, tone, slot) => {
    const ms = msOff(slot);
    return { word, tone, ms, text: tone === 'off' ? `${word} ${Math.abs(ms)} ms` : word, good: tone === 'good', slot, bar: slotAt(song, slot).bar };
  };
  const { stroke } = slotAt(song, near);
  if (!stroke.hit && Math.abs(msOff(near)) <= WINDOW_MS) return verdict(stroke.pluck ? 'Rest here' : 'No strum here', 'bad', near);
  let hit = null;                                              // ponytail: scans every slot per tap; fine at a few hundred slots
  for (let s = 0; s < total; s++) if (slotAt(song, s).stroke.hit && (hit === null || Math.abs(at - s) < Math.abs(at - hit))) hit = s;
  if (hit === null) return verdict('No strum here', 'bad', near);
  const want = slotAt(song, hit).stroke;
  if (dir && !want.pluck && dir !== want.dir) return verdict(want.dir === 'D' ? 'Down here' : 'Up here', 'bad', hit);
  const ms = msOff(hit);
  if (Math.abs(ms) <= WINDOW_MS) return verdict('Good', 'good', hit);
  return verdict(ms < 0 ? 'Early' : 'Late', 'off', hit);
}

// the played slots (song slots heard, in any order, repeats fine) that should have been struck or picked
const hitsOf = (song, played) => [...new Set(played)].filter(slot => slotAt(song, slot).stroke.hit);

/** Misses per bar, { bar index: count }, for a run { song, verdicts (judge's, one per tap), played (the song slots heard) }: each tap that was not
 *  Good, and each stroke played with no tap on it at all. Bars with none are left out. (hits: the run's strokes played, if already worked out.) */
export function missesByBar({ song, verdicts, played }, hits = hitsOf(song, played)) {
  const tapped = new Set(verdicts.map(v => v.slot)), misses = {};
  const miss = bar => { misses[bar] = (misses[bar] ?? 0) + 1; };
  for (const v of verdicts) if (!v.good) miss(v.bar);
  for (const slot of hits) if (!tapped.has(slot)) miss(slotAt(song, slot).bar);
  return misses;
}

/** How a run ({ song, verdicts, played }) went: onTime (the strokes played that got a Good tap), percentOnTime (the same, 0 to 100), worstBar (the bar index with the most
 *  misses, the earlier on a tie; null with none), taps, hits (strokes played) and misses (as missesByBar gives them). */
export function summary(run) {
  const hits = hitsOf(run.song, run.played), good = new Set(run.verdicts.filter(v => v.good).map(v => v.slot));
  const missed = missesByBar(run, hits), worst = Object.entries(missed).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const onTime = hits.filter(s => good.has(s)).length;
  return { onTime, percentOnTime: hits.length ? Math.round(100 * onTime / hits.length) : 0,
    worstBar: worst ? +worst[0] : null, taps: run.verdicts.length, hits: hits.length, misses: missed };
}
