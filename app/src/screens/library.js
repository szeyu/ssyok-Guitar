// The library screen: one card per song, the folder's in index order and then this browser's, the add card, and a note naming
// any file that was skipped. A song kept in this browser has a two-step Remove under its card.
import { mainStrumBar, songMeta } from '../engine/song.js';
import { chordsUsed } from '../engine/chords.js';
import { el, strumRow } from '../views/dom.js';

// one bar's strokes as glyphs, one per slot
const glyph = ({ stroke: k, text, tone }) => el('span', { textContent: text, className: [tone, k.hit ? '' : 'pass', k.accent ? 'accent' : ''].join(' ').trim() });

/** Draws the song cards and the folder note into the library screen. on: open(index) for a card, add() for the add card,
 *  remove(title) once a Remove is confirmed. */
export function renderLibrary({ songs, notes, saved = new Set(), files = new Set() }, on) {
  const card = (song, i) => el('button', { className: 'song', type: 'button', onclick: () => on.open(i) },
    el('b', { textContent: song.title }),
    el('span', { className: 'meta', textContent: (saved.has(song.title) ? (files.has(song.title) ? 'Edited in this browser. ' : 'Added in this browser. ') : '') + songMeta(song) }),
    el('div', { className: 'chips' }, ...chordsUsed(song).map(c => el('i', { textContent: c }))),
    el('div', { className: 'pat', ariaLabel: 'Main strum' }, ...strumRow(song, mainStrumBar(song), glyph)));
  document.getElementById('songBox').replaceChildren(...songs.map((song, i) => saved.has(song.title) ? el('div', { className: 'songWrap' }, card(song, i), removal(song.title, on.remove)) : card(song, i)),
    el('button', { className: 'song add', type: 'button', onclick: on.add }, el('b', { textContent: 'Add a song' }), el('span', { className: 'meta', textContent: 'Build it bar by bar, or paste a song file' })));
  const mine = songs.filter(s => saved.has(s.title) && !files.has(s.title)).length;
  document.getElementById('fileNote').replaceChildren(`${songs.length - mine} from the songs folder${mine ? `, ${mine} added in this browser` : ''}.`, ...notes.map(t => el('div', { className: 'err', textContent: t })));
}

// Remove, then "Remove?" to confirm or Keep to back out; no browser dialog
function removal(title, remove) {
  const box = el('div', { className: 'removal' });
  const ask = () => {
    const yes = el('button', { type: 'button', className: 'ghost danger', textContent: 'Remove?', ariaLabel: `Yes, remove ${title}`, onclick: () => remove(title) });
    box.replaceChildren(yes, el('button', { type: 'button', className: 'ghost', textContent: 'Keep', onclick: () => { idle(); box.firstChild.focus(); } }));
    yes.focus();
  };
  const idle = () => box.replaceChildren(el('button', { type: 'button', className: 'ghost', textContent: 'Remove', ariaLabel: `Remove ${title}`, onclick: ask }));
  idle();
  return box;
}
