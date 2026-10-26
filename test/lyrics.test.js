import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitLyrics, placeLyrics } from '../app/src/engine/lyrics.js';

const bar = section => ({ chord: 'G', strum: 'D.DU.UDU', ...(section ? { section } : {}) });
// Intro 2 bars, Verse 4, Instrumental 2, Chorus 2
const bars = [bar('Intro'), bar(), bar('Verse'), bar(), bar(), bar(), bar('Instrumental'), bar(), bar('Chorus'), bar()];
const words = b => b.map(x => x.lyric ?? '');

test('blank lines split blocks; the intro and instrumental get none', () => {
  const r = fitLyrics(bars, 'one\ntwo\n\nthree\nfour');
  assert.deepEqual(words(r.bars), ['', '', 'one', '', 'two', '', '', '', 'three', 'four']);
  assert.deepEqual(r.sections, ['Verse', 'Chorus']);
  assert.equal(r.placed, 2);
});

test('headings split blocks too, and are not sung', () => {
  const r = fitLyrics(bars, '[Verse 1]\na\nb\nc\nd\nChorus:\ne\nf');
  assert.deepEqual(words(r.bars), ['', '', 'a', 'b', 'c', 'd', '', '', 'e', 'f']);
});

test('more lines than bars share a bar; extra blocks are counted, not placed', () => {
  const r = fitLyrics(bars, 'a\nb\nc\nd\ne\nf\ng\nh\n\ni\nj\n\nk');
  assert.equal(words(r.bars)[2], 'a / b');
  assert.deepEqual([r.placed, r.blocks], [2, 3]);
});

test('fitting clears old words and leaves the bars given alone', () => {
  const old = bars.map((b, n) => ({ ...b, lyric: 'old ' + n }));
  const r = fitLyrics(old, 'x');
  assert.deepEqual(words(r.bars), ['', '', 'x', '', '', '', '', '', '', '']);
  assert.equal(old[0].lyric, 'old 0');
});

test('every N bars: one line each, from a bar, until the bars run out', () => {
  const r = placeLyrics(bars, 'a\n\nb\nc\nd', 4, 1);
  assert.deepEqual(words(r.bars), ['', 'a', '', '', '', 'b', '', '', '', 'c']);
  assert.deepEqual([r.placed, r.lines, r.next], [3, 4, 13]);
});
