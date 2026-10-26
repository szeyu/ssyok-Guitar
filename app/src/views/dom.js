// Small DOM helpers the screens share.
import { slotAt, slotsPerBar, strokeGlyph } from '../engine/song.js';

/** A design token's value from :root, such as css('--ink'). */
export const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** An element with its properties set and its children appended. */
export const el = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };

/** One slot as a glyph in a strum line: a pass is dimmed, an accent larger (strumRow's make, for the library card and the sheet). */
export const glyph = ({ stroke, text, tone }) => el('span', { textContent: text, className: [tone, stroke.hit ? '' : 'pass', stroke.accent ? 'accent' : ''].join(' ').trim() });

/** One bar's slots, each mapped through make({ stroke, count, text, tone }) to an element. */
export function strumRow(song, n, make) {
  const per = slotsPerBar(song);
  return Array.from({ length: per }, (_, i) => { const { stroke, count } = slotAt(song, n * per + i); return make({ stroke, count, ...strokeGlyph(stroke) }); });
}
