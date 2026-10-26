import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chordsUsed } from '../app/src/engine/chords.js';
import { validateSong, songErrors, slotAt, slotsPerBar, noteHz, stringIndex, hasMelody, hasLyrics, mainStrumBar, stretchSlots, riffMarks } from '../app/src/engine/song.js';

const song = (over = {}) => ({ title: 'x', bpm: 80, bars: [{ chord: 'G', strum: 'D.DU.UDU' }], ...over });

test('a tempo out of range is named', () => {
  assert.deepEqual(validateSong(song({ bpm: 300 })), ['"bpm" must be a whole number from 40 to 200.']);
});

test('an unknown chord is named with its bar, the known chords and where to add one', () => {
  const [e] = validateSong(song({ bars: [{ chord: 'G', strum: 'D.DU.UDU' }, { chord: 'H', strum: 'D.DU.UDU' }] }));
  assert.match(e, /^Bar 2: unknown chord "H"\. Known chords: G, Em, C, D, Dm, Am, E, A, F\. Add it in the song's "chords" block\.$/);
  const E7 = [{ frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }];
  assert.match(validateSong(song({ chords: { E7 }, bars: [{ chord: 'H', strum: 'D.DU.UDU' }] }))[0], /Known chords: G, .*, F, E7\./);
});

test('song errors carry their bar as a number', () => {
  assert.deepEqual(songErrors(song({ bpm: 300, bars: [{ chord: 'G', strum: 'D.DU' }] })).map(e => e.bar), [undefined, 1]);
});

test("a song's own chord is known in that song", () => {
  const E7 = [{ frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }];
  assert.deepEqual(validateSong(song({ chords: { E7 }, bars: [{ chord: 'E7', strum: 'D.DU.UDU' }] })), []);
});

test('a strum with the wrong number of strokes is named', () => {
  assert.deepEqual(validateSong(song({ bars: [{ chord: 'G', strum: 'D.DU' }] })),
    ['Bar 1: "strum" must be exactly 8 characters from D U > x and . (one per eighth note, 4 beats in a bar).']);
});

test('in simple time an up-stroke on a number is the wrong direction', () => {
  assert.deepEqual(validateSong(song({ bars: [{ chord: 'G', strum: 'U.......' }] })),
    ['Bar 1: stroke 1 is "U", but the hand moves down on "1".']);
});

test('a 3-beat bar with 8 strokes is rejected once, asking for 6 characters', () => {
  const errs = validateSong(song({ beats: 3 }));
  assert.equal(errs.length, 1);
  assert.match(errs[0], /^Bar 1: "strum" must be exactly 6 characters/);
});

test('a bad song gets one error per problem: tempo, chord, strum', () => {
  assert.equal(validateSong(song({ bpm: 300, bars: [{ chord: 'H', strum: 'UD' }] })).length, 3);
});

const strokes = (s, bar = 0) => Array.from({ length: slotsPerBar(s) }, (_, i) => slotAt(s, bar * slotsPerBar(s) + i).stroke);

test('a picked bar validates and plucks the strings it names, thickest = 0', () => {
  const s = song({ beats: 3, bars: [{ chord: 'Am', pluck: '5 3 2 1 2 3' }] });
  assert.deepEqual(validateSong(s), []);
  assert.deepEqual(strokes(s).map(k => k.pluck), [[1], [3], [4], [5], [4], [3]]);
});

test('a picked bar naming a string 7 is rejected once', () => {
  assert.equal(validateSong(song({ bars: [{ chord: 'Am', pluck: '5 3 7' }] })).length, 1);
});

test('a mixed bar strums where the strum hits and picks elsewhere', () => {
  const s = song({ bpm: 63, beats: 3, compound: true, bars: [{ chord: 'G', strum: '>..D..', pluck: '6 . 3 . 1 .' }] });
  assert.deepEqual(validateSong(s), []);
  const k = strokes(s);
  assert.deepEqual(k.map(x => x.pluck === null ? (x.accent ? '>' : x.dir) : x.hit ? x.pluck.map(stringIndex).join('') : '.'), ['>', '.', '3', 'D', '1', '.']);
});

test('a riff note uses its own fret; a plain picked string keeps the chord\'s', () => {
  const s = song({ bars: [{ chord: 'C', pluck: '2:3+3 . . . . . . .' }] });
  const k = slotAt(s, 0).stroke;
  assert.deepEqual(k.pluck, [4, 3]);
  assert.deepEqual(k.fret, { 4: 3 });
});

test('a 6/8 riff bar with two chords and the song\'s own E7 validates', () => {
  const E7 = [{ frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }];
  assert.deepEqual(validateSong({ title: 'x', bpm: 65, beats: 3, compound: true, chords: { E7 }, bars: [{ chord: 'C E7', pluck: '2 2:0 3 2:1+3:0 . 2:5' }] }), []);
});

test('two chords split a bar in half', () => {
  const s = song({ bars: [{ chord: 'C E7', strum: 'D.DU.UDU' }] });
  assert.deepEqual(strokes(s).map((_, i) => slotAt(s, i).chord), ['C', 'C', 'C', 'C', 'E7', 'E7', 'E7', 'E7']);
});

test('three chords cannot share a 4/4 bar', () => {
  assert.deepEqual(validateSong(song({ bars: [{ chord: 'C G D', strum: 'D.DU.UDU' }] })),
    ['Bar 1: 3 chords cannot share a bar of 8 counts evenly. Use 2 or 4 chords, or one.']);
});

test('timed lyrics give a syllable per slot; plain lyrics are only a line', () => {
  const s = song({ bars: [{ chord: 'G', strum: 'D.DU.UDU', syllables: 'Jin- . gle . bells, . . .' }, { chord: 'G', strum: 'D.DU.UDU', lyric: 'plain words are not timed' }] });
  assert.equal(slotAt(s, 2).syllable, 'gle');
  assert.equal(slotAt(s, 1).syllable, '');
  assert.equal(slotAt(s, 0).lyric, 'Jin-gle bells,');   // as the prototype shows it: a trailing - joins without a space
  assert.equal(slotAt(s, 10).syllable, null);
  assert.equal(slotAt(s, 10).lyric, 'plain words are not timed');
});

test('6/8 counts 1 to 6 and turns accents into down strokes', () => {
  const s = song({ beats: 3, compound: true, bars: [{ chord: 'G', strum: '>DU>DU' }] });
  assert.deepEqual(strokes(s).map((_, i) => slotAt(s, i).count), ['1', '2', '3', '4', '5', '6']);
  assert.deepEqual(strokes(s).map(k => k.dir), ['D', 'D', 'U', 'D', 'D', 'U']);
});

test('note names give the right pitch', () => {
  assert.equal(noteHz('A4'), 440);
  assert.ok(Math.abs(noteHz('C5') - 523.25) < .01);
  assert.ok(Math.abs(noteHz('F#4') - 369.99) < .01);
});

test('a melody note is heard where it starts, not where it holds', () => {
  const s = song({ bars: [{ chord: 'G', strum: 'D.DU.UDU', tune: 'A4 . _ G4 . . . .' }] });
  assert.deepEqual([0, 1, 2, 3].map(i => slotAt(s, i).note?.name ?? null), ['A4', null, null, 'G4']);
  assert.equal(slotAt(s, 0).note.hz, 440);
});

test('a melody note holds over the . after it, to the end of its bar at most', () => {
  const s = song({ bars: [{ chord: 'G', strum: 'D.DU.UDU', tune: 'A4 . _ G4 . . . .' }] });
  assert.equal(slotAt(s, 0).note.slots, 2);
  assert.equal(slotAt(s, 3).note.slots, 5);
});

test('the chords a song uses, once each, in order', () => {
  assert.deepEqual(chordsUsed(song({ bars: [{ chord: 'G' }, { chord: 'C E7' }, { chord: 'G' }] })), ['G', 'C', 'E7']);
});

test("a guitarist's string number turns into a string index, thickest = 0", () => {
  assert.deepEqual([6, 5, 4, 3, 2, 1].map(stringIndex), [0, 1, 2, 3, 4, 5]);
  assert.equal(stringIndex(stringIndex(2)), 2);   // its own inverse: an index turns back into the number
});

test('a song has a melody when any bar has a tune', () => {
  assert.equal(hasMelody(song()), false);
  assert.equal(hasMelody(song({ bars: [{ chord: 'G', strum: 'D.DU.UDU' }, { chord: 'G', strum: 'D.DU.UDU', tune: 'A4 . . . . . . .' }] })), true);
});

test('a song has lyrics when any bar has a lyric or timed syllables', () => {
  assert.equal(hasLyrics(song()), false);
  assert.equal(hasLyrics(song({ bars: [{ chord: 'G', strum: 'D.DU.UDU', lyric: 'la' }] })), true);
  assert.equal(hasLyrics(song({ bars: [{ chord: 'G', strum: 'D.DU.UDU', syllables: 'la . . . . . . .' }] })), true);
});

test('the main strum is the first bar of the most used strum, or of the most used picking when no bar is strummed', () => {
  assert.equal(mainStrumBar(song({ bars: [{ chord: 'G', pluck: '6 . . . . . . .' }, { chord: 'G', strum: 'D.DU.UDU' }] })), 1);
  assert.equal(mainStrumBar(song({ bars: [{ chord: 'G', strum: 'D.D.D.D.' }, { chord: 'G', strum: 'D.DU.UDU' }, { chord: 'C', strum: 'D.DU.UDU' }] })), 1);
  assert.equal(mainStrumBar(song({ bars: [{ chord: 'G', pluck: '6 . . . . . . .' }, { chord: 'G', pluck: '5 . . . . . . .' }, { chord: 'G', pluck: '5 . . . . . . .' }] })), 1);
});

test("a chord's stretch is its even share of the bar's slots", () => {
  assert.equal(stretchSlots(song({ bars: [{ chord: 'C E7', strum: 'D.DU.UDU' }] }), 0), 4);
  assert.equal(stretchSlots(song({ beats: 3, bars: [{ chord: 'G C D', strum: 'D.DUDU' }] }), 0), 2);
  assert.equal(stretchSlots(song(), 0), 8);
});

test('riff notes with their own fret are marked on the right string and fret', () => {
  const riff = song({ bars: [{ chord: 'C', pluck: '5 2:3+3 1:0 . 6:12 3 2 1' }] });
  assert.deepEqual(riffMarks(riff, 1), [{ string: 4, fret: 3 }]);   // string 2 (index 4) at fret 3; string 3 plays the chord's fret
  assert.deepEqual(riffMarks(riff, 4), [{ string: 0, fret: 12 }]);
  assert.deepEqual(riffMarks(riff, 2), []);                         // an open riff note needs no mark on the neck
  assert.deepEqual(riffMarks(riff, 0), []);
});
