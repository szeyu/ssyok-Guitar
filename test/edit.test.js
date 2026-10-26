// Bar editing and song serialising (engine/edit.js), as the builder and the sheet use them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cellable, nextStroke, setMeter, withoutEmpty, songJson } from '../app/src/engine/edit.js';
import { DEFAULT_STRUM, validateSong } from '../app/src/engine/song.js';

const song = (bars, over = {}) => ({ title: 'x', bpm: 80, bars, ...over });

test('the cells show one chord strummed or picked, a stroke a slot; anything else is text', () => {
  const s = song([]);
  assert.equal(cellable(s, { chord: 'G', strum: DEFAULT_STRUM }), true);
  assert.equal(cellable(s, { chord: 'G', pluck: '5 3 2 3 1 3 2 3' }), true);
  assert.equal(cellable(s, { chord: 'G C', strum: DEFAULT_STRUM }), false, 'two chords');
  assert.equal(cellable(s, { chord: 'G', strum: DEFAULT_STRUM, pluck: '5 3 2 3 1 3 2 3' }), false, 'mixed');
  assert.equal(cellable(s, { chord: 'G', strum: 'D.DU' }), false, 'short strum');
  assert.equal(cellable(s, { chord: 'G', pluck: '5 3 23 3 1 3 2 3' }), false, 'two strings at once');
});

test('a click turns a stroke: in simple time the hand keeps its direction; picks go . 6 5 … 1 and round', () => {
  const s = song([]), bar = { chord: 'G', strum: 'D.DU.UDU' };
  assert.equal(nextStroke(s, bar, 0), '>');
  assert.equal(nextStroke(s, bar, 3), '>');
  assert.equal(nextStroke(s, { strum: 'x.......' }, 0), '.');
  assert.equal(nextStroke(s, { strum: '........' }, 0), 'D');
  assert.equal(nextStroke(s, { strum: '........' }, 1), 'U');
  assert.equal(nextStroke(song([], { beats: 3, compound: true }), { strum: 'D.....' }, 0), 'U', 'in 6/8 every stroke is open to every slot');
  const pick = { pluck: '. 6 1 3 . . . .' };
  assert.deepEqual([0, 1, 2, 3].map(i => nextStroke(s, pick, i)), ['6', '5', '.', '2']);
});

test('a new meter trims or pads every bar\'s strokes and timed words, and drops the tune', () => {
  const s = song([{ chord: 'G', strum: 'D.DU.UDU', syllables: 'a b c d e f g h', tune: 'G4 . . . . . . .' }, { chord: 'C', pluck: '5 3 2 3 1 3 2 3' }]);
  setMeter(s, { beats: 3 });
  assert.deepEqual(s.bars, [{ chord: 'G', strum: 'D.DU.U', syllables: 'a b c d e f' }, { chord: 'C', pluck: '5 3 2 3 1 3' }]);
  assert.equal(s.beats, 3);
  setMeter(s, { beats: 4 });
  assert.deepEqual(s.bars[0], { chord: 'G', strum: 'D.DU.UDU', syllables: 'a b c d e f . .' });
  assert.equal(s.bars[1].pluck, '5 3 2 3 1 3 . .');
  setMeter(s, { beats: 3, compound: true });
  assert.equal(s.compound, true);
  setMeter(s, { beats: 4 });
  assert.equal('compound' in s, false);
  assert.deepEqual(validateSong(s), []);
});

test('a song as saved has no empty words or sections, but keeps its chord', () => {
  const s = song([{ chord: '', strum: DEFAULT_STRUM, lyric: '  ', section: '' }, { chord: 'G', strum: DEFAULT_STRUM, lyric: 'hi' }]);
  assert.deepEqual(withoutEmpty(s).bars, [{ chord: '', strum: DEFAULT_STRUM }, { chord: 'G', strum: DEFAULT_STRUM, lyric: 'hi' }]);
  assert.equal(s.bars[0].lyric, '  ', 'the song given is left alone');
});

test('a song file reads one field, fingering or bar per line, and parses back the same', () => {
  const s = song([{ chord: 'G', strum: DEFAULT_STRUM }, { chord: 'E7', strum: DEFAULT_STRUM }], { chords: { E7: [{ frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }] } });
  const text = songJson(s);
  assert.deepEqual(JSON.parse(text), s);
  assert.equal(text.split('\n').length, 13);
  assert.match(text, /^ {2}\{"chord":"G","strum":"D\.DU\.UDU"\},$/m);
});
