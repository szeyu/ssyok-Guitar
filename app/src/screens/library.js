// The library screen: one card per song, in index order, and a note naming any file that was skipped.
import { slotAt, slotsPerBar, chordsUsed, mainStrumBar, strokeGlyph, songMeta } from '../engine/song.js';

const el = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };

// one bar's strokes as glyphs, one per slot
function strumGlyphs(song, n) {
  const per = slotsPerBar(song);
  return Array.from({ length: per }, (_, i) => {
    const k = slotAt(song, n * per + i).stroke, { text, tone } = strokeGlyph(k);
    return el('span', { textContent: text, className: [tone, k.hit ? '' : 'pass', k.accent ? 'accent' : ''].join(' ').trim() });
  });
}

/** Draws the song cards and the folder note into the library screen. Clicking a card calls open(index). */
export function renderLibrary({ songs, notes }, open) {
  document.getElementById('songBox').replaceChildren(...songs.map((song, i) => el('button', { className: 'song', type: 'button', onclick: () => open(i) },
    el('b', { textContent: song.title }),
    el('span', { className: 'meta', textContent: songMeta(song) }),
    el('div', { className: 'chips' }, ...chordsUsed(song).map(c => el('i', { textContent: c }))),
    el('div', { className: 'pat', ariaLabel: 'Main strum' }, ...strumGlyphs(song, mainStrumBar(song))))));
  document.getElementById('fileNote').replaceChildren(`${songs.length} from the songs folder.`, ...notes.map(t => el('div', { className: 'err', textContent: t })));
}
