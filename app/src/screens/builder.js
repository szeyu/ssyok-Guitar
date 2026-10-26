// The song builder: the title, tempo, capo and beats in a bar, then the bars one at a time, each a chord and a stroke per slot
// (strummed or picked). A bar with several chords, or strummed and picked together, is edited as text. Lyrics can be pasted and
// fitted to the sections, or a whole song file pasted instead. Saving goes through the store, which checks the song first:
// an invalid song is not saved, and its errors are listed by bar.
import { CAPO_MAX, HITS, REST, slotsPerBar } from '../engine/song.js';
import { CHORDS } from '../engine/chords.js';
import { fitLyrics, placeLyrics } from '../engine/lyrics.js';
import { browserStorage, saveSong, readSongFile } from '../store.js';
import { el, strumRow } from '../views/dom.js';
import { showScreen, onScreen } from './shell.js';

const $ = id => document.getElementById(id), words = s => s.trim().split(/\s+/);
const METERS = [{ label: '3/4', beats: 3 }, { label: '4/4', beats: 4 }, { label: '6/8', beats: 3, compound: true }];
const STRUM = 'D.DU.UDU', PICK = { 8: '5 3 2 3 1 3 2 3', 6: '5 3 2 1 2 3' };
const STROKE_NAME = { D: 'down', U: 'up', '>': 'accented down', x: 'chuck', [REST]: 'pass' };
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

let draft, was = null, back = 'library', badBars = new Set();
let hooks = { titles: () => [], isFile: () => false, saved: () => {} };
const asText = new WeakSet();                                   // bars the author chose to edit as text

/** What the builder needs from the app: titles() every song's title, isFile(title) whether it is from the songs folder, and
 *  saved(song) once a song is saved. */
export const setupBuilder = h => { hooks = h; };

/** Opens the builder on a copy of a song to edit, or with null on a new one. from: the screen Cancel and Esc go back to. */
export function openBuilder(song, from = 'library') {
  was = song?.title ?? null; back = from;
  load(song ?? { title: '', bpm: 90, capo: 0, beats: 4, bars: [{ chord: 'G', strum: STRUM }] });
  $('builderHead').textContent = song ? 'Edit song' : 'Add a song';
  $('bSave').textContent = song ? 'Save changes' : 'Add song';
  $('builderNote').textContent = !song ? 'Build it bar by bar, or paste a song file.'
    : hooks.isFile(song.title) ? "This song is from the songs folder. Saving keeps your copy in this browser, in its place in the library. Remove the copy there to get the folder's version back."
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
const fit = (list, pad) => [...list, ...Array(slots()).fill(pad)].slice(0, slots());
// a bar the cells can show: one chord, strummed or picked (not both), a stroke for every slot, and picks of single strings
const cellable = bar => !/\s/.test(bar.chord.trim()) && !!bar.strum !== !!bar.pluck && (!bar.strum || bar.strum.length === slots())
  && (!bar.pluck || (words(bar.pluck).length === slots() && words(bar.pluck).every(t => /^[1-6.]$/.test(t))));
const editedAsText = bar => asText.has(bar) || !cellable(bar);

// a click on a cell: strummed, it goes hit, hit harder, chuck, pass and round (in simple time a hit keeps the hand's direction);
// picked, it goes . 6 5 4 3 2 1 and round
function nextStroke(bar, i) {
  if (bar.pluck) { const t = words(bar.pluck)[i]; return t === REST ? '6' : t === '1' ? REST : String(t - 1); }
  const cycle = draft.compound ? [...HITS, REST] : [HITS[i % 2], ...HITS.slice(2), REST];
  return cycle[(cycle.indexOf(bar.strum[i]) + 1) % cycle.length];
}

function render() {
  $('bCapo').replaceChildren(...Array.from({ length: CAPO_MAX + 1 }, (_, fret) => pill(fret, fret === draft.capo, () => { draft.capo = fret; render(); }, fret ? `Capo on fret ${fret}` : 'No capo')));
  const meter = METERS.findIndex(m => m.beats === (draft.beats ?? 4) && !!m.compound === !!draft.compound);
  $('bBeats').replaceChildren(...METERS.map((m, i) => pill(m.label, i === meter, () => setMeter(m))));
  const names = [...new Set([...Object.keys(CHORDS), ...Object.keys(draft.chords ?? {})])];
  $('bBars').replaceChildren(...draft.bars.map((bar, n) => barRow(bar, n, names)));
}

const pill = (text, on, onclick, ariaLabel) => el('button', { type: 'button', textContent: text, className: on ? 'on' : '', ariaPressed: String(on), onclick, ...ariaLabel ? { ariaLabel } : {} });
const field = (label, input, className = '') => el('label', { className: 'field ' + className }, el('span', { textContent: label }), input);
const textInput = (bar, key, size, title = '') => el('input', { value: bar[key] ?? '', size, title, spellcheck: false, oninput: e => { if (e.target.value.trim() || key === 'chord') bar[key] = e.target.value; else delete bar[key]; } });

// changing the beats in a bar trims or pads every bar's strokes; a tune is written for one bar length, so it goes
function setMeter({ beats, compound }) {
  draft.beats = beats; if (compound) draft.compound = true; else delete draft.compound;
  for (const bar of draft.bars) {
    delete bar.tune;
    if (bar.strum) bar.strum = (bar.strum + STRUM.slice(bar.strum.length)).slice(0, slots());
    if (bar.pluck) bar.pluck = fit(words(bar.pluck), REST).join(' ');
    if (bar.syllables) bar.syllables = fit(words(bar.syllables), REST).join(' ');
  }
  render();
}

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
    body = [
      field('Chord', el('select', { onchange: e => { bar.chord = e.target.value; } },
        ...[...new Set([...names, bar.chord])].map(c => el('option', { value: c, textContent: c, selected: c === bar.chord })))),
      el('button', { type: 'button', className: 'kind', textContent: picked ? 'Picked' : 'Strummed', title: 'Switch this bar between strumming and picking single strings',
        onclick: () => { if (picked) { delete bar.pluck; bar.strum = STRUM.slice(0, slots()); } else { delete bar.strum; bar.pluck = PICK[slots()]; } render(); } }),
      el('span', { className: 'cells', role: 'group', ariaLabel: `Bar ${n + 1} strokes` }, ...strumRow(draft, n, ({ count, text: glyph, tone }) => {
        const at = i++, t = tokens[at];
        return el('button', { type: 'button', className: `cell ${tone}`, ariaLabel: `${count}: ${picked ? (t === REST ? 'rest' : 'string ' + t) : STROKE_NAME[t]}. Click to change`,
          onclick: () => { tokens[at] = nextStroke(bar, at); if (picked) bar.pluck = tokens.join(' '); else bar.strum = tokens.join(''); render(); $('bBars').children[n].querySelectorAll('.cell')[at].focus(); } },
          el('b', { textContent: glyph }), el('small', { textContent: count }));
      })),
    ];
  }
  const tools = el('span', { className: 'barTools' },
    el('button', { type: 'button', className: 'ghost', textContent: text ? 'Edit with cells' : 'Edit as text', hidden: text && !cellable(bar),
      onclick: () => { if (text) asText.delete(bar); else asText.add(bar); render(); } }),
    el('button', { type: 'button', className: 'ghost', textContent: 'Copy', ariaLabel: `Copy bar ${n + 1}`, title: 'Add a copy of this bar after it',
      onclick: () => { const copy = structuredClone(bar); delete copy.section; draft.bars.splice(n + 1, 0, copy); if (text) asText.add(copy); render(); } }),
    el('button', { type: 'button', className: 'ghost', textContent: 'Delete', ariaLabel: `Delete bar ${n + 1}`, disabled: draft.bars.length < 2,
      onclick: () => { draft.bars.splice(n, 1); render(); } }));
  row.append(...head, ...body, field('Words', textInput(bar, 'lyric', 22, 'The words sung in this bar')), tools);
  return row;
}

// the errors under the bars, each led by its bar when it names one; the rows with errors are marked
function showErrors(errors) {
  badBars = new Set(errors.flatMap(e => { const m = e.match(/^Bar (\d+): /); return m ? [m[1] - 1] : []; }));
  $('bErrors').hidden = !errors.length;
  $('bErrors').querySelector('ul').replaceChildren(...errors.map(e => {
    const m = e.match(/^(Bar \d+): (.*)$/);
    return el('li', {}, ...m ? [el('b', { textContent: m[1] }), ' ' + m[2]] : [e]);
  }));
  $('bBars').querySelectorAll('.barRow').forEach((row, n) => row.classList.toggle('bad', badBars.has(n)));
  if (errors.length) $('bErrors').scrollIntoView({ block: 'nearest' });
  return errors.length;
}

// the song as it would be saved: the title and tempo from their fields, and no empty words or sections
function built() {
  const song = { ...structuredClone(draft), title: $('bTitle').value.trim(), bpm: Number($('bBpm').value) };
  song.bars = song.bars.map(bar => Object.fromEntries(Object.entries(bar).filter(([k, v]) => k === 'chord' || typeof v !== 'string' || v.trim())));
  return song;
}

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
  const song = built(), errors = saveSong(browserStorage(), song, { was, taken: hooks.titles() });
  if (!showErrors(errors)) hooks.saved(song);
};
$('bCancel').onclick = $('builderBack').onclick = () => showScreen(back);
const lyricsGo = r => r.bars.forEach((b, n) => { if (b.lyric) draft.bars[n].lyric = b.lyric; else delete draft.bars[n].lyric; });
$('lyrFit').onclick = () => {
  const r = fitLyrics(draft.bars, $('lyrText').value);
  lyricsGo(r); render();
  const sung = draft.bars.filter(b => b.section).length;
  $('lyrInfo').textContent = !sung ? 'Name the sections first (Verse, Chorus and so on, on their first bars): the blocks go on them.'
    : `${r.placed} of ${r.blocks} blocks placed, on ${r.sections.join(', ') || 'no sung section'}.` + (r.blocks > r.placed ? ` The song has only ${r.placed} sung sections.` : '');
};
$('lyrFill').onclick = () => {
  const every = Math.max(1, Math.round(+$('lyrEvery').value) || 1), from = Math.max(1, Math.round(+$('lyrFrom').value) || 1) - 1;
  const r = placeLyrics(draft.bars, $('lyrText').value, every, from);
  lyricsGo(r); render();
  $('lyrInfo').textContent = `${r.placed} of ${r.lines} lines placed` + (r.placed < r.lines ? ', then the bars ran out.' : '.') + (r.placed ? ` The next free bar is ${r.next + 1}.` : '');
  $('lyrFrom').value = r.next + 1;
};

onScreen('builder', { esc: () => showScreen(back) });
