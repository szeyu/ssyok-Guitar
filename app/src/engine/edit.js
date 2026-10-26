// Bar editing and song serialising, for the builder and the sheet. Pure: no DOM.
import { HITS, REST, DEFAULT_STRUM, slotsPerBar, words } from './song.js';

const padTo = (list, length, pad) => [...list, ...Array(length).fill(pad)].slice(0, length);

/** Whether the builder's cells can show a bar: one chord, strummed or picked (not both), a stroke for every slot, and picks of
 *  single strings. Any other bar is edited as text. */
export function cellable(song, bar) {
  const slots = slotsPerBar(song), picks = bar.pluck && words(bar.pluck);
  return !/\s/.test(bar.chord.trim()) && !!bar.strum !== !!bar.pluck && (!bar.strum || bar.strum.length === slots)
    && (!picks || (picks.length === slots && picks.every(t => /^[1-6.]$/.test(t))));
}

/** The stroke a click on slot i of a cellable bar turns to. Strummed: hit, hit harder, chuck, pass and round (in simple time a
 *  hit keeps the hand's direction). Picked: . 6 5 4 3 2 1 and round. */
export function nextStroke(song, bar, i) {
  if (bar.pluck) { const t = words(bar.pluck)[i]; return t === REST ? '6' : t === '1' ? REST : String(t - 1); }
  const cycle = song.compound ? [...HITS, REST] : [HITS[i % 2], ...HITS.slice(2), REST];
  return cycle[(cycle.indexOf(bar.strum[i]) + 1) % cycle.length];
}

/** Sets the beats in a bar ({ beats, compound }), changing the song in place: every bar's strokes and timed words are trimmed or
 *  padded to the new length, and its tune goes (a tune is written for one bar length). */
export function setMeter(song, { beats, compound }) {
  song.beats = beats; if (compound) song.compound = true; else delete song.compound;
  const slots = slotsPerBar(song);
  for (const bar of song.bars) {
    delete bar.tune;
    if (bar.strum) bar.strum = (bar.strum + DEFAULT_STRUM.slice(bar.strum.length)).slice(0, slots);
    for (const key of ['pluck', 'syllables']) if (bar[key]) bar[key] = padTo(words(bar[key]), slots, REST).join(' ');
  }
}

/** The song as it is saved: no empty words, sections or other text on its bars (the chord stays, to be named if empty). */
export const withoutEmpty = song => ({ ...song, bars: song.bars.map(bar => Object.fromEntries(Object.entries(bar).filter(([k, v]) => k === 'chord' || typeof v !== 'string' || v.trim()))) });

/** A song as its file reads: one field, fingering or bar per line. */
export function songJson({ bars, chords, ...top }) {
  const list = (items, pad) => items.map(x => pad + JSON.stringify(x)).join(',\n');
  const lines = Object.entries(top).map(([k, v]) => ` ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  if (chords) lines.push(` "chords": {\n${Object.entries(chords).map(([name, shapes]) => `  ${JSON.stringify(name)}: [\n${list(shapes, '   ')}\n  ]`).join(',\n')}\n }`);
  lines.push(` "bars": [\n${list(bars, '  ')}\n ]`);
  return `{\n${lines.join(',\n')}\n}`;
}
