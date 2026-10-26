// The results card at the song's end: paper over the dimmed player with the on-time percentage, the bar that gave the most trouble,
// and what to do next. A modal dialog: focus starts on Play again, Tab stays inside the card, and closing gives focus back.
import { slotAt, slotsPerBar, sections } from '../engine/song.js';
import { judge, summary } from '../engine/judge.js';

const $ = id => document.getElementById(id);
let opener = null, closed = null;

/** Opens the card for a run { song, verdicts, played }. on: { again, slower, practise(bar), songs, close }: each button closes
 *  the card and calls its own; close is called whenever the card closes. */
export function showResults(run, on) {
  const r = summary(run), bar = r.worstBar;
  const sec = bar === null ? null : sections(run.song).findLast(x => x.bar <= bar);
  $('resultsScore').textContent = r.taps ? `${r.percentOnTime}%` : '';
  $('resultsSay').textContent = !r.taps ? 'Next time, tap the down and up arrows along with the strokes, and you will see how your timing went.'
    : `${r.onTime} of ${r.hits} strokes on time.` + (bar === null ? ' Not one miss.' : ` Bar ${bar + 1}${sec.name !== 'Start' ? `, in ${sec.name},` : ''} gave you the most trouble.`);
  $('practiseBar').hidden = !r.taps || bar === null;
  const then = f => () => { closeResults(); f(); };
  $('again').onclick = then(on.again); $('slower').onclick = then(on.slower);
  $('practiseBar').onclick = then(() => on.practise(bar)); $('resultsSongs').onclick = then(on.songs);
  closed = on.close;
  if ($('results').hidden) opener = document.activeElement;
  $('results').hidden = false; $('again').focus();
}

/** True while the card shows. */
export const resultsShowing = () => !$('results').hidden;

/** Closes the card (if it shows) and gives focus back to what had it before. */
export function closeResults() {
  if (!resultsShowing()) return;
  $('results').hidden = true;
  opener?.focus?.(); opener = null;
  closed?.();
}

$('results').addEventListener('keydown', e => {                // Tab and Shift+Tab go round the card's buttons, never out of it
  if (e.key !== 'Tab') return;
  const all = [...$('results').querySelectorAll('button:not([hidden])')], i = all.indexOf(document.activeElement);
  e.preventDefault();
  all[i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + all.length) % all.length].focus();
});

/** A fixed made-up run for ?done=1, the flag the screenshot tool (tools/screenshots.js) opens the card with. The taps go through the
 *  real judging, so the card's numbers are what the engine says: every stroke of the song tapped the right way, a little off but
 *  inside the window, except that every 17th slot's stroke is left untapped and bar 3 is all late (140 ms, or less at a fast
 *  tempo, so it stays nearest its own stroke). rate: slots a second. */
export function demoRun(song, rate) {
  const run = { song, verdicts: [], played: new Set() };
  for (let s = 0; s < song.bars.length * slotsPerBar(song); s++) {
    run.played.add(s);
    const { stroke, bar } = slotAt(song, s);
    if (!stroke.hit || s % 17 === 5) continue;
    const ms = bar === 2 ? Math.min(140, 400 / rate) : s % 5 * 12;
    run.verdicts.push(judge(song, s + ms / 1000 * rate, stroke.dir, rate));
  }
  return run;
}
