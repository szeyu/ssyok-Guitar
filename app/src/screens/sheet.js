// The whole song on one page: every bar as a card, grouped by section, or the raw data behind it (the song file's JSON).
import { songMeta, sections, slotAt, slotsPerBar } from '../engine/song.js';
import { el, strumRow } from '../views/dom.js';
import { showScreen, onScreen } from './shell.js';

const $ = id => document.getElementById(id);
let song;

// one glyph per slot, as the library card writes a strum
const glyph = ({ stroke: k, text, tone }) => el('span', { textContent: text, className: [tone, k.hit ? '' : 'pass', k.accent ? 'accent' : ''].join(' ').trim() });

/** A song as its file reads: one field, fingering or bar per line. */
export function songJson({ bars, chords, ...top }) {
  const list = (items, pad) => items.map(x => pad + JSON.stringify(x)).join(',\n');
  const lines = Object.entries(top).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  if (chords) lines.push(` "chords": {\n${Object.entries(chords).map(([name, shapes]) => `  ${JSON.stringify(name)}: [\n${list(shapes, '   ')}\n  ]`).join(',\n')}\n }`);
  lines.push(` "bars": [\n${list(bars, '  ')}\n ]`);
  return `{\n${lines.join(',\n')}\n}`;
}

/** Shows the sheet for a song, as bars or (raw true) as its raw data. A click on a bar calls play(bar index). */
export function showSheet(s, play, raw = false) {
  song = s;
  $('sheetTitle').textContent = song.title;
  $('sheetMeta').textContent = songMeta(song);
  const per = slotsPerBar(song);
  $('sheetBars').replaceChildren(...sections(song).map(sec => el('section', { className: 'sheetSec' },
    el('h2', { textContent: sec.name }),
    el('div', { className: 'sheetGrid' }, ...Array.from({ length: sec.bars }, (_, i) => {
      const n = sec.bar + i, bar = song.bars[n], lyric = slotAt(song, n * per).lyric;
      return el('button', { type: 'button', className: 'sbar' + (i && song.bars[n - 1].chord === bar.chord ? ' same' : ''), ariaLabel: `Bar ${n + 1}, ${bar.chord}${lyric ? ', ' + lyric : ''}. Play from here`, onclick: () => play(n) },
        el('small', { textContent: `Bar ${n + 1}` }), el('b', { textContent: bar.chord }),
        el('span', { className: 'pat', ariaHidden: 'true' }, ...strumRow(song, n, glyph)), el('span', { className: 'words', textContent: lyric }));
    })))));
  $('sheetRaw').textContent = songJson(song);
  showRaw(raw);
  showScreen('sheet');
}

function showRaw(raw) {
  $('sheetBars').hidden = $('sheetHint').hidden = raw; $('sheetRaw').hidden = !raw;
  $('sheetBarsBtn').ariaPressed = String(!raw); $('sheetRawBtn').ariaPressed = String(raw);
}

$('sheetBarsBtn').onclick = () => showRaw(false);
$('sheetRawBtn').onclick = () => showRaw(true);
$('sheetBack').onclick = () => showScreen('song');
onScreen('sheet', { esc: () => showScreen('song') });
