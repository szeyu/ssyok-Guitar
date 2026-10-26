// Pasted lyrics onto a song's bars, for the builder. Pure: bars in, new bars and a summary out (the bars given are not changed).

// a heading a lyrics page puts between sections: [Verse 1], Chorus:, Bridge
const HEADING = /^\[.*\]$|^(verse|chorus|pre-?chorus|bridge|intro|outro|refrain)\b[^a-z]*$/i;
// sections with nothing sung: their bars get no words
const UNSUNG = /intro|interlude|instrumental|outro|solo|turnaround/i;

const copy = bars => bars.map(bar => ({ ...bar }));
const sungLines = text => text.split('\n').map(line => line.trim()).filter(Boolean);

/** A whole song's lyrics fitted to its sections. A blank line or a heading ends a block; each block goes, in order, onto the
 *  next sung section (intros, interludes, instrumentals, solos and outros are skipped), its lines spread evenly over that
 *  section's bars. Words already on the bars are cleared first, and a bar given words loses its timed words (they would hide them). Returns { bars, placed, blocks, sections } (sections: the names
 *  of the sections that got a block). */
export function fitLyrics(bars, text) {
  const blocks = text.split('\n').reduce((all, raw) => {
    const line = raw.trim();
    if (!line || HEADING.test(line)) all.push([]); else all.at(-1).push(line);
    return all;
  }, [[]]).filter(block => block.length);
  const starts = bars.flatMap((bar, n) => bar.section ? [n] : []);
  const sung = starts.map((at, i) => ({ at, bars: (starts[i + 1] ?? bars.length) - at, name: bars[at].section })).filter(s => !UNSUNG.test(s.name));
  const out = copy(bars);
  for (const bar of out) delete bar.lyric;
  const used = sung.slice(0, blocks.length);
  used.forEach((section, i) => blocks[i].forEach((line, j) => {
    const bar = out[section.at + Math.floor(j * section.bars / blocks[i].length)];
    bar.lyric = bar.lyric ? bar.lyric + ' / ' + line : line;
    delete bar.syllables;
  }));
  return { bars: out, placed: used.length, blocks: blocks.length, sections: used.map(s => s.name) };
}

/** One sung line every so many bars: the first on bar from (0 = the first), the next every bars later, and so on until the bars
 *  run out. Returns { bars, placed, lines, next } (next: the bar after the last line's stretch, where the next run would start). */
export function placeLyrics(bars, text, every, from = 0) {
  const lines = sungLines(text), out = copy(bars);
  let placed = 0;
  lines.forEach((line, i) => { const bar = out[from + i * every]; if (bar) { bar.lyric = line; delete bar.syllables; placed++; } });
  return { bars: out, placed, lines: lines.length, next: from + placed * every };
}
