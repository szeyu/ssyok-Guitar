// The library screen: one card per song, in index order, and a note naming any file that was skipped.
import { slotAt, slotsPerBar, chordsUsed } from '../engine/song.js';

const el = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };

const meta = s => [`${s.bpm} bpm`, s.capo ? `capo on fret ${s.capo}` : 'no capo', s.compound ? '6/8 time' : s.beats === 3 ? '3/4 time' : '', `${s.bars.length} bars`,
  s.bars.some(b => b.tune) ? 'melody' : '', s.bars.some(b => b.lyric || b.syllables) ? 'lyrics' : ''].filter(Boolean).join(', ');

// one bar's strokes as glyphs: arrows for strums (dashed = swing past without touching), string numbers for picks, ✕ for a chuck
function strumGlyphs(song, n) {
  const per = slotsPerBar(song);
  return Array.from({ length: per }, (_, i) => {
    const k = slotAt(song, n * per + i).stroke;
    const [text, tone] = k.pluck ? (k.hit ? [k.pluck.map(s => 6 - s).join(''), 'pluck'] : ['·', 'mute'])
      : k.chuck ? ['✕', 'mute'] : [k.hit ? (k.dir === 'D' ? '↓' : '↑') : (k.dir === 'D' ? '⇣' : '⇡'), k.hit ? (k.dir === 'D' ? 'down' : 'up') : 'mute'];
    return el('span', { textContent: text, className: [tone, k.hit ? '' : 'pass', k.accent ? 'accent' : ''].join(' ').trim() });
  });
}

/** Draws the song cards and the folder note into the library screen. */
export function renderLibrary({ songs, notes }) {
  document.getElementById('songBox').replaceChildren(...songs.map(({ song }) => {
    const main = Math.max(0, song.bars.findIndex(b => b.strum));   // ponytail: the first strummed bar; the strum summary (ticket 03) can pick the most used one
    // ponytail: cards do nothing yet; opening the song screen comes with ticket 03
    return el('button', { className: 'song', type: 'button' },
      el('b', { textContent: song.title }),
      el('span', { className: 'meta', textContent: meta(song) }),
      el('div', { className: 'chips' }, ...chordsUsed(song).map(c => el('i', { textContent: c }))),
      el('div', { className: 'pat', ariaLabel: 'Main strum' }, ...strumGlyphs(song, main)));
  }));
  document.getElementById('fileNote').replaceChildren(`${songs.length} from the songs folder.`, ...notes.map(t => el('div', { className: 'err', textContent: t })));
}
