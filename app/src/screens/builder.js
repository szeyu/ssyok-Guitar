// The song builder: the title, tempo, capo and beats in a bar, then the bars one at a time, each a chord and a stroke per slot
// (strummed or picked). A bar with several chords, or strummed and picked together, is edited as text. Lyrics can be pasted and
// fitted to the sections, or a whole song file pasted instead. Saving goes through the store, which checks the song first:
// an invalid song is not saved, and its errors are listed by bar.
import { CAPO_MAX, REST, STROKES, DEFAULT_STRUM, slotsPerBar, words } from '../engine/song.js';
import { CHORDS } from '../engine/chords.js';
import { fitLyrics, placeLyrics } from '../engine/lyrics.js';
import { cellable, nextStroke, setMeter, withoutEmpty } from '../engine/edit.js';
import { browserStorage, saveSong, readSongFile } from '../store.js';
import { el, strumRow } from '../views/dom.js';
import { showScreen, onScreen } from './shell.js';

const $ = id => document.getElementById(id);
const METERS = [{ label: '3/4', beats: 3 }, { label: '4/4', beats: 4 }, { label: '6/8', beats: 3, compound: true }];
const PICK = { 8: '5 3 2 3 1 3 2 3', 6: '5 3 2 1 2 3' };
const EXAMPLE = `{
 "title": "My song",
 "bpm": 90,
 "bars": [
  { "chord": "Am", "strum": "D.DU.UDU", "section": "Verse", "lyric": "words for this bar" },
  { "chord": "F",  "strum": "D.DU.UDU" },
  { "chord": "C",  "strum": "D.xU.UxU" },
  { "chord": "G",  "strum": ">.DU>.DU" }
 ]
}`;

let draft, editing = null, returnTo = 'library', badBars = new Set(), cells = [];
let app = { titles: () => [], isFile: () => false, saved: () => {} };
const asText = new WeakSet();                                   // bars the author chose to edit as text

/** What the builder needs from the app: titles() every song's title, isFile(title) whether it is from the songs folder, and
 *  saved(song) once a song is saved. */
export const setupBuilder = needs => { app = needs; };

/** Opens the builder on a copy of a song to edit, or with null on a new one. from: the screen Cancel and Esc go back to. */
export function openBuilder(song, from = 'library') {
  editing = song?.title ?? null; returnTo = from;
  load(song ?? { title: '', bpm: 90, capo: 0, beats: 4, bars: [{ chord: 'G', strum: DEFAULT_STRUM }] });
  $('builderHead').textContent = song ? 'Edit song' : 'Add a song';
  $('bSave').textContent = song ? 'Save changes' : 'Add song';
  $('builderNote').textContent = !song ? 'Build it bar by bar, or paste a song file.'
    : app.isFile(song.title) ? "From the songs folder. Saving keeps your copy in this browser, in its place; remove the copy to get the folder's back."
    : 'This song was added in this browser.';
  $('lyrInfo').textContent = '';
  showErrors([]);
  showScreen('builder');
}

/** Pastes a song file's text into the builder and loads it, as the Load button does (the ?paste flag uses it). */
export function pasteFile(text) { $('bPaste').open = true; $('bFile').value = text; loadFile(); }

function load(song) {
  draft = { capo: 0, beats: 4, ...structuredClone(song) };
  $('bTitle').value = draft.title ?? ''; $('bBpm').value = draft.bpm ?? '';
  render();
}

const slots = () => slotsPerBar(draft);
const editedAsText = bar => asText.has(bar) || !cellable(draft, bar);

function render() {
  $('bCapo').replaceChildren(...Array.from({ length: CAPO_MAX + 1 }, (_, fret) => pill(fret, fret === draft.capo, () => { draft.capo = fret; render(); }, fret ? `Capo on fret ${fret}` : 'No capo')));
  const meter = METERS.findIndex(m => m.beats === (draft.beats ?? 4) && !!m.compound === !!draft.compound);
  $('bBeats').replaceChildren(...METERS.map((m, i) => pill(m.label, i === meter, () => { setMeter(draft, m); render(); })));
  const names = [...new Set([...Object.keys(CHORDS), ...Object.keys(draft.chords ?? {})])];
  cells = [];
  $('bBars').replaceChildren(...draft.bars.map((bar, n) => barRow(bar, n, names)));
}

const pill = (text, on, onclick, ariaLabel) => el('button', { type: 'button', textContent: text, className: on ? 'on' : '', ariaPressed: String(on), onclick, ...ariaLabel ? { ariaLabel } : {} });
const field = (label, input, className = '') => el('label', { className: 'field ' + className }, el('span', { textContent: label }), input);
const textInput = (bar, key, size, title = '') => el('input', { value: bar[key] ?? '', size, title, spellcheck: false, oninput: e => { if (e.target.value.trim() || key === 'chord') bar[key] = e.target.value; else delete bar[key]; } });

function barRow(bar, n, names) {
  const text = editedAsText(bar), row = el('li', { className: 'barRow' + (badBars.has(n) ? ' bad' : '') });
  const head = [el('b', { textContent: `Bar ${n + 1}` }), field('Section', textInput(bar, 'section', 9, 'Name a section on its first bar, for example Verse or Chorus'))];
  let body;
  if (text) body = [
    field('Chords', textInput(bar, 'chord', 8, 'One chord, or several separated by spaces to share the bar')),
    field('Strum', textInput(bar, 'strum', slots() + 1, `${slots()} characters: D U > x and ${REST}`), 'mono'),
    field('Picks', textInput(bar, 'pluck', slots() * 2 + 2, `${slots()} entries separated by spaces: string numbers, string:fret, or ${REST}`), 'mono'),
    field('Timed words', textInput(bar, 'syllables', 24, `${slots()} entries separated by spaces, ${REST} where nothing is sung`)),
  ];
  else {
    const picked = !!bar.pluck, tokens = picked ? words(bar.pluck) : [...bar.strum];
    let i = 0;
    cells[n] = [];
    body = [
      field('Chord', el('select', { onchange: e => { bar.chord = e.target.value; } },
        ...[...new Set([...names, bar.chord])].map(c => el('option', { value: c, textContent: c, selected: c === bar.chord })))),
      el('button', { type: 'button', className: 'kind', textContent: picked ? 'Picked' : 'Strummed', title: 'Switch this bar between strumming and picking single strings',
        onclick: () => { if (picked) { delete bar.pluck; bar.strum = DEFAULT_STRUM.slice(0, slots()); } else { delete bar.strum; bar.pluck = PICK[slots()]; } render(); } }),
      el('span', { className: 'cells', role: 'group', ariaLabel: `Bar ${n + 1} strokes` }, ...strumRow(draft, n, ({ count, text: glyph, tone }) => {
        const at = i++, t = tokens[at];
        return cells[n][at] = el('button', { type: 'button', className: `cell ${tone}`, ariaLabel: `${count}: ${picked ? (t === REST ? 'rest' : 'string ' + t) : STROKES[t]}. Click to change`,
          onclick: () => { tokens[at] = nextStroke(draft, bar, at); if (picked) bar.pluck = tokens.join(' '); else bar.strum = tokens.join(''); render(); cells[n][at].focus(); } },
          el('b', { textContent: glyph }), el('small', { textContent: count }));
      })),
    ];
  }
  const tools = el('span', { className: 'barTools' },
    el('button', { type: 'button', className: 'ghost', textContent: text ? 'Edit with cells' : 'Edit as text', hidden: text && !cellable(draft, bar),
      onclick: () => { if (text) asText.delete(bar); else asText.add(bar); render(); } }),
    el('button', { type: 'button', className: 'ghost', textContent: 'Copy', ariaLabel: `Copy bar ${n + 1}`, title: 'Add a copy of this bar after it',
      onclick: () => { const copy = structuredClone(bar); delete copy.section; draft.bars.splice(n + 1, 0, copy); if (text) asText.add(copy); render(); } }),
    el('button', { type: 'button', className: 'ghost', textContent: 'Delete', ariaLabel: `Delete bar ${n + 1}`, disabled: draft.bars.length < 2,
      onclick: () => { draft.bars.splice(n, 1); render(); } }));
  row.append(...head, ...body, field('Words', textInput(bar, 'lyric', 22, 'The words sung in this bar')), tools);
  return row;
}

// the errors ({ bar, text }) under the bars, each led by its bar when it has one; the rows with errors are marked
function showErrors(errors) {
  badBars = new Set(errors.filter(e => e.bar).map(e => e.bar - 1));
  $('bErrors').hidden = !errors.length;
  $('bErrors').querySelector('ul').replaceChildren(...errors.map(({ bar, text }) => el('li', {}, ...bar ? [el('b', { textContent: `Bar ${bar}` }), ' ' + text] : [text])));
  $('bBars').querySelectorAll('.barRow').forEach((row, n) => row.classList.toggle('bad', badBars.has(n)));
  if (errors.length) $('bErrors').scrollIntoView({ block: 'nearest' });
  return errors.length;
}

// the song as it would be saved, with the title and tempo from their fields
const built = () => withoutEmpty({ ...structuredClone(draft), title: $('bTitle').value.trim(), bpm: Number($('bBpm').value) });

function loadFile() {
  const { song, errors } = readSongFile($('bFile').value);
  if (!showErrors(errors)) load(song);
}

$('bFile').value = EXAMPLE;
$('bLoad').onclick = loadFile;
$('bAdd').onclick = () => {
  const last = draft.bars.at(-1), bar = structuredClone(last);
  for (const k of ['section', 'lyric', 'syllables']) delete bar[k];
  draft.bars.push(bar); if (asText.has(last)) asText.add(bar);
  render();
  const row = $('bBars').lastElementChild; (row.querySelector('select') ?? row.querySelector('input')).focus();
};
$('bSave').onclick = () => {
  const song = built(), errors = saveSong(browserStorage(), song, { was: editing, taken: app.titles() });
  if (!showErrors(errors)) app.saved(song);
};
$('bCancel').onclick = $('builderBack').onclick = () => showScreen(returnTo);
// the words a lyrics fit gave the bars, copied onto the draft's own bars (they keep their edit-as-text choice)
const takeWords = fitted => fitted.bars.forEach((b, n) => { for (const key of ['lyric', 'syllables']) if (b[key]) draft.bars[n][key] = b[key]; else delete draft.bars[n][key]; });
$('lyrFit').onclick = () => {
  const fitted = fitLyrics(draft.bars, $('lyrText').value);
  takeWords(fitted); render();
  const sung = draft.bars.filter(b => b.section).length;
  $('lyrInfo').textContent = !sung ? 'Name the sections first (Verse, Chorus and so on, on their first bars): the blocks go on them.'
    : `${fitted.placed} of ${fitted.blocks} blocks placed, on ${fitted.sections.join(', ') || 'no sung section'}.` + (fitted.blocks > fitted.placed ? ` The song has only ${fitted.placed} sung sections.` : '');
};
$('lyrFill').onclick = () => {
  const every = Math.max(1, Math.round(+$('lyrEvery').value) || 1), from = Math.max(1, Math.round(+$('lyrFrom').value) || 1) - 1;
  const placed = placeLyrics(draft.bars, $('lyrText').value, every, from);
  takeWords(placed); render();
  $('lyrInfo').textContent = `${placed.placed} of ${placed.lines} lines placed` + (placed.placed < placed.lines ? ', then the bars ran out.' : '.') + (placed.placed ? ` The next free bar is ${placed.next + 1}.` : '');
  $('lyrFrom').value = placed.next + 1;
};

onScreen('builder', { esc: () => showScreen(returnTo) });
