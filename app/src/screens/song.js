// The song screen: everything needed before playing one song. Its chords as chord boxes in the song's voicings (pick another
// in the picker), the strum patterns, the capo, the three ways to start, Back to bar N, and the links to the sheet and the builder.
// The browser remembers each song's picks, capo and last bar played (store.js).
import { songMeta, CAPO_MAX } from '../engine/song.js';
import { chordsUsed, chordShapes, voicingIndex, voicing, easiestFingerings, shapeLabel } from '../engine/chords.js';
import { soundingName, strumSummary, slowBpm, capoOf } from '../engine/practice.js';
import { chordBox } from '../views/chordbox.js';
import { el, strumRow } from '../views/dom.js';
import { openPlayer } from './player.js';
import { showScreen, onScreen } from './shell.js';
import { showSheet } from './sheet.js';
import { openBuilder } from './builder.js';
import { browserStorage, songMemory, remember } from '../store.js';
const $ = id => document.getElementById(id), paren = t => t && ` (${t})`;
const SUGGEST = 'Suggest easiest fingerings', SHOWN_STRUMS = 3;

let song, memory, picks, pickerFor = '';
const rememberChange = change => { Object.assign(memory, change); remember(browserStorage(), song.title, change); };

/** Draws the song screen for a song, with the picker closed. */
export function showSong(s) {
  song = s;
  memory = songMemory(browserStorage(), song.title);
  picks = memory.picks;
  pickerFor = '';
  $('songTitle').textContent = song.title;
  $('songMeta').textContent = songMeta(song);
  $('slowNote').textContent = `The whole song at ${slowBpm(song)} bpm`;
  $('playNote').textContent = `Full speed, ${song.bpm} bpm`;
  $('suggest').textContent = SUGGEST;
  $('suggest').onclick = () => { Object.assign(picks, easiestFingerings(song)); rememberChange({ picks }); renderChords(); $('suggest').textContent = 'Using the fingerings that move least'; };
  $('goSteps').onclick = () => playSong({ step: 1 });
  $('goSlow').onclick = () => playSong({ tempo: slowBpm(song), play: true });
  $('goPlay').onclick = () => playSong({ tempo: song.bpm, play: true });
  $('whole').onclick = () => showSheet(song, bar => playSong({ bar }));
  $('edit').onclick = () => openBuilder(song, 'song');
  renderChords(); renderCapo(); renderStrums(); renderResume();
}

// the bar the song was left at, from the last time it played (not the first bar: Play along starts there)
function renderResume() {
  const bar = memory.bar;
  $('resume').hidden = !(bar > 0 && bar < song.bars.length);
  $('resume').textContent = `Back to bar ${bar + 1}`;
  $('resume').onclick = () => playSong({ bar });
}

onScreen('song', { esc: () => closePicker() || showScreen('library'), show: renderResume });
document.getElementById('songBack').onclick = () => showScreen('library');

/** Opens the player on the song showing, with its fingering picks and capo. Options as openPlayer's. */
export const playSong = options => openPlayer(song, { picks, capo: capoOf(song, memory.capo), onBar: bar => rememberChange({ bar }), ...options });

/** Opens the picker of fingerings for one of the song's chords; '' closes it. */
export function openPicker(name) { pickerFor = chordsUsed(song).includes(name) ? name : ''; renderChords(); }

/** Closes the picker if it is open, and says whether it was. */
export function closePicker() { const was = !!pickerFor; if (was) openPicker(''); return was; }

/** Puts the capo on a fret, 0 = none. */
export function setCapo(fret) { rememberChange({ capo: fret }); renderCapo(); }

function renderChords() {
  $('voicings').replaceChildren(...chordsUsed(song).map(name => {
    const v = voicing(song, name, picks), ways = chordShapes(song, name).length;
    return el('button', { type: 'button', className: 'chordCard' + (name === pickerFor ? ' on' : ''), title: v.tip ?? '', ariaExpanded: String(name === pickerFor), onclick: () => { openPicker(name === pickerFor ? '' : name); if (pickerFor) $('picker').scrollIntoView({ block: 'nearest' }); } },
      el('b', { className: 'name', textContent: name }), chordBox(v), el('span', { className: 'note', textContent: v.name }),
      el('span', { className: 'many', textContent: ways > 1 ? `${ways} ways to play it` : '' }));
  }));
  const picker = $('picker');
  picker.hidden = !pickerFor;
  if (!pickerFor) return picker.replaceChildren();
  const on = voicingIndex(song, pickerFor, picks);
  picker.replaceChildren(...chordShapes(song, pickerFor).map((v, i) => el('button', {
    type: 'button', className: 'card' + (i === on ? ' sel' : ''), ariaPressed: String(i === on),
    onclick: () => { picks[pickerFor] = i; rememberChange({ picks }); $('suggest').textContent = SUGGEST; openPicker(''); },
  }, chordBox(v), el('b', { textContent: v.name + paren(shapeLabel(song, pickerFor, i)) }), el('span', { textContent: v.tip ?? '' }))));
}

function renderCapo() {
  const capo = capoOf(song, memory.capo), record = song.capo ?? 0;
  $('capo').replaceChildren(...Array.from({ length: CAPO_MAX + 1 }, (_, fret) => el('button', { type: 'button', textContent: fret, className: fret === capo ? 'on' : '', ariaPressed: String(fret === capo), ariaLabel: fret ? `Capo on fret ${fret}` : 'No capo', onclick: () => setCapo(fret) })));
  $('capoNote').replaceChildren(`${record ? `Capo on ${record}` : 'No capo'} sounds like the record`,
    ...capo ? [el('br'), `The chords sound as ${chordsUsed(song).map(c => soundingName(c, capo, song)).join(', ')}`] : []);
}

// one keycap per eighth-note slot: a hit stands up, an accent is inked, a pass is an outline with a dash
const keycap = ({ stroke: k, count, text, tone }) =>
  el('span', { className: `slot ${!k.hit ? 'rest' : k.accent ? 'acc' : 'hit ' + tone}` }, el('b', { textContent: k.hit ? text : '–' }), el('em', { textContent: count }));

function renderStrums() {
  const all = strumSummary(song), more = all.length - SHOWN_STRUMS;
  $('strums').replaceChildren(...all.slice(0, SHOWN_STRUMS).map(p => el('div', { className: 'pattern' },
    el('span', { textContent: (p.most ? 'Most of the song' : p.section ?? 'Whole song') + (all.length > 1 ? `, ${p.bars} bar${p.bars > 1 ? 's' : ''}` : '') }),
    el('div', { className: 'slots', ariaLabel: 'Strokes, one per eighth note' }, ...strumRow(song, p.bar, keycap)))),
  ...more > 0 ? [el('p', { className: 'hint', textContent: `and ${more} more pattern${more > 1 ? 's' : ''}, used in fewer bars` })] : []);
}
