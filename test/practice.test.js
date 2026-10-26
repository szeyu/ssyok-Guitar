import { test } from 'node:test';
import assert from 'node:assert/strict';
import { soundingName, strumSummary, slowBpm, capoOf } from '../app/src/engine/practice.js';

test('with a capo the chord names sound higher by its fret', () => {
  assert.equal(soundingName('G', 0), 'G');
  assert.equal(soundingName('G', 2), 'A');
  assert.equal(soundingName('Em7', 1), 'Fm7');
  assert.equal(soundingName('Cadd9', 3), 'Ebadd9');
  assert.equal(soundingName('B', 1), 'C');           // wraps past B
  assert.equal(soundingName('Bb', 2), 'C');          // a flat root moves as one note
});

test('a slash chord moves its bass with the capo', () => {
  assert.equal(soundingName('D/F#', 2), 'E/G#');
  assert.equal(soundingName('G/B', 1), 'Ab/C');
});

const perfect = { title: 'Perfect', bpm: 63, capo: 1, bars: ['G', 'Em7', 'Cadd9', 'D', 'D/F#', 'G/B'].map(chord => ({ chord, strum: 'D.DU.UDU' })) };

test('the names are spelled in the key the song sounds in: flats for a flat key', () => {
  assert.deepEqual(['G', 'Em7', 'Cadd9', 'D', 'D/F#', 'G/B'].map(c => soundingName(c, 1, perfect)), ['Ab', 'Fm7', 'Dbadd9', 'Eb', 'Eb/G', 'Ab/C']);
});

test('the names are spelled in the key the song sounds in: sharps for a sharp key', () => {
  // capo 2: G sounds as A, a sharp key, so C sounds as C# and D/F# as E/G#
  assert.deepEqual(['C', 'D/F#', 'Bm'].map(c => soundingName(c, 2, perfect)), ['D', 'E/G#', 'C#m']);
});

test("a song that starts on a minor chord is spelled in its relative major's key", () => {
  // a minor first chord takes its relative major's key: Dm with capo 3 is Fm, the key of Ab, so flats
  const minor = { ...perfect, bars: [{ chord: 'Dm', strum: 'D.DU.UDU' }] };
  assert.equal(soundingName('A', 3, minor), 'C');
  assert.equal(soundingName('E', 3, minor), 'G');
  assert.equal(soundingName('F#', 3, minor), 'A');
  assert.equal(soundingName('C#', 3, minor), 'E');
  assert.equal(soundingName('Bb', 3, minor), 'Db');
});

const bar = (strum, section) => ({ chord: 'G', strum, ...(section ? { section } : {}) });

test('the strum summary counts the bars of each pattern, most used first, named by the section it first turns up in', () => {
  const s = { title: 'x', bpm: 80, bars: [bar('D.D.D.D.', 'Intro'), bar('D.DU.UDU', 'Verse'), bar('D.DU.UDU'), bar('D.D.D.D.'), bar('D.DU.UDU', 'Chorus')] };
  assert.deepEqual(strumSummary(s), [
    { bar: 1, bars: 3, section: 'Verse', most: true },
    { bar: 0, bars: 2, section: 'Intro', most: false },
  ]);
});

test('a pattern covering exactly half the bars is not most of the song', () => {
  const s = { title: 'x', bpm: 80, bars: [bar('D.D.D.D.'), bar('D.D.D.D.'), bar('D.DU.UDU'), bar('D.DU.UDU')] };
  assert.deepEqual(strumSummary(s).map(p => [p.bars, p.most, p.section]), [[2, false, null], [2, false, null]]);
});

test('picked bars are patterns too, told apart by the strings they pick', () => {
  const s = { title: 'x', bpm: 80, beats: 3, bars: [{ chord: 'Am', pluck: '5 3 2 1 2 3' }, { chord: 'Am', pluck: '5 3 2 1 2 3' }, { chord: 'Am', pluck: '6 3 2 1 2 3' }] };
  assert.deepEqual(strumSummary(s).map(p => [p.bar, p.bars, p.most]), [[0, 2, true], [2, 1, false]]);
});

test('playing it slowly is 70% of the song tempo, rounded', () => {
  assert.equal(slowBpm({ bpm: 64 }), 45);
  assert.equal(slowBpm({ bpm: 100 }), 70);
});

test("the capo is the one you chose, else the song's, else none", () => {
  assert.equal(capoOf({ capo: 2 }, 5), 5);
  assert.equal(capoOf({ capo: 2 }, 0), 0);
  assert.equal(capoOf({ capo: 2 }, undefined), 2);
  assert.equal(capoOf({}, undefined), 0);
});
