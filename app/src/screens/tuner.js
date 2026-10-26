// The tuner, opened from Tools: a needle per string, ±50 cents across; the string heard is lit. It listens until closed.
import { STRINGS } from '../engine/song.js';
import { OPEN_HZ } from '../audio/synth.js';
import { onPitch } from '../audio/mic.js';
import { nearestString } from '../audio/pitch.js';
import { el } from '../views/dom.js';

const $ = id => document.getElementById(id);
const NAMES = STRINGS.map((note, i) => i === STRINGS.length - 1 ? note[0].toLowerCase() : note[0]);   // E A D G B e
const IN_TUNE = 5, NEEDLE_CENTS = 50, NOT_A_STRING = 250;   // within ±5 cents is in tune; the needle spans ±50; strings are at most 500 cents apart
const BLOCKED = "The microphone is blocked, so the tuner can't hear your guitar. Allow it in the browser's site settings, then open the tuner again.";

function showPanel(open) {
  $('tuner').hidden = !open; $('tunerBtn').setAttribute('aria-pressed', String(open));
  if (!open) return;
  $('tunerSay').textContent = 'Play one open string and let it ring.';
  $('tunerStrings').replaceChildren(...NAMES.map(name => el('li', { ariaLabel: `${name} string` },
    el('b', { textContent: name }), el('span', { className: 'meter' }, el('i')), el('span', { className: 'off', textContent: '–' }))));
}

/** Opens or closes the tuner (no argument: the other way). If the microphone is refused it stays open and says so. */
export async function toggleTuner(open = $('tuner').hidden) {
  showPanel(open);
  if (!open) return void onPitch(null);                       // the mic stays open if Listen to me is on
  if (!await onPitch(showTuning)) { $('tunerSay').textContent = BLOCKED; $('tunerStrings').replaceChildren(); }
}

/** The tuner showing made-up readings (Hz, for ?tuner), without the microphone. */
export function showFakeTuning(readings) { showPanel(true); readings.forEach(showTuning); }

// a reading: the string it is nearest gets the needle and is lit; the other strings keep their last reading
function showTuning(hz) {
  if (!hz) return;                                            // quiet: the last reading stays
  const { string, cents } = nearestString(hz, OPEN_HZ), off = Math.round(cents), ok = Math.abs(off) <= IN_TUNE;
  if (Math.abs(off) > NOT_A_STRING) return;                   // above the thinnest or below the thickest string: not an open string
  [...$('tunerStrings').children].forEach((li, i) => { li.classList.toggle('now', i === string); li.ariaCurrent = i === string ? 'true' : null; });
  const li = $('tunerStrings').children[string];
  li.style.setProperty('--c', Math.max(-NEEDLE_CENTS, Math.min(NEEDLE_CENTS, off)) / NEEDLE_CENTS);
  li.classList.toggle('ok', ok);
  li.lastChild.textContent = off > 0 ? `+${off}` : String(off);
  const say = `${NAMES[string]} string: ${ok ? 'in tune' : off < 0 ? `${-off} cents low, tighten it` : `${off} cents high, loosen it`}`;
  if ($('tunerSay').textContent !== say) $('tunerSay').textContent = say;
}

$('tunerBtn').onclick = () => toggleTuner();
$('tunerClose').onclick = () => toggleTuner(false);
