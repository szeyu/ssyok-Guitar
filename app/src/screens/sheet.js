// The whole song on one page: every bar as a card, grouped by section, or the raw data behind it (the song file's JSON).
import { songMeta, sections, slotAt, slotsPerBar } from '../engine/song.js';
import { songJson } from '../engine/edit.js';
import { el, strumRow, glyph } from '../views/dom.js';
import { showScreen, onScreen } from './shell.js';

const $ = id => document.getElementById(id);
let song;

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
