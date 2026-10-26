// The library screen: one card per song, in index order, and a note naming any file that was skipped.
import { slotAt, slotsPerBar, chordsUsed, hasMelody, hasLyrics, mainStrumBar, strokeGlyph } from '../engine/song.js';

const el = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };

const meta = s => [`${s.bpm} bpm`, s.capo ? `capo on fret ${s.capo}` : 'no capo', s.compound ? '6/8 time' : s.beats === 3 ? '3/4 time' : '4/4 time', `${s.bars.length} bars`,
  hasMelody(s) ? 'melody' : '', hasLyrics(s) ? 'lyrics' : ''].filter(Boolean).join(', ');

// one bar's strokes as glyphs, one per slot
function strumGlyphs(song, n) {
  const per = slotsPerBar(song);
  return Array.from({ length: per }, (_, i) => {
    const k = slotAt(song, n * per + i).stroke, { text, tone } = strokeGlyph(k);
    return el('span', { textContent: text, className: [tone, k.hit ? '' : 'pass', k.accent ? 'accent' : ''].join(' ').trim() });
  });
}

/** Draws the song cards and the folder note into the library screen. */
export function renderLibrary({ songs, notes }) {
  // ponytail: cards do nothing yet; opening the song screen comes with ticket 03
  document.getElementById('songBox').replaceChildren(...songs.map(song => el('button', { className: 'song', type: 'button' },
    el('b', { textContent: song.title }),
    el('span', { className: 'meta', textContent: meta(song) }),
    el('div', { className: 'chips' }, ...chordsUsed(song).map(c => el('i', { textContent: c }))),
    el('div', { className: 'pat', ariaLabel: 'Main strum' }, ...strumGlyphs(song, mainStrumBar(song))))));
  document.getElementById('fileNote').replaceChildren(`${songs.length} from the songs folder.`, ...notes.map(t => el('div', { className: 'err', textContent: t })));
}
