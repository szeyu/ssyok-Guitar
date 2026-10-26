import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORDS, chordShapes, voicingIndex, voicing, easiestFingerings } from '../app/src/engine/chords.js';

const ROCK_G = { name: 'Rock G', frets: [3, -1, 0, 0, 3, 3], fingers: [2, 0, 0, 0, 3, 4], tip: '' };
const song = (over = {}) => ({ title: 'x', bpm: 80, bars: [{ chord: 'G', strum: 'D.DU.UDU' }, { chord: 'C', strum: 'D.DU.UDU' }], ...over });

test("a song's own shape joins the library's for that song only", () => {
  const withRock = song({ chords: { G: [ROCK_G] } });
  assert.deepEqual(chordShapes(withRock, 'G').map(v => v.name), ['Open, fingers 2-1-3', 'Open, fingers 3-2-4', 'Open, 4 fingers', 'Barre, 3rd fret', 'Rock G']);
  assert.equal(CHORDS.G.length, 4);
  assert.equal(chordShapes(song(), 'G').length, 4);
});

test("a song's shape the library already has is not listed twice", () => {
  const same = { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] };
  assert.equal(chordShapes(song({ chords: { G: [same] } }), 'G').length, 4);
  assert.equal(voicingIndex(song({ chords: { G: [same] } }), 'G', {}), 1);
});

test("a chord only the song knows has the song's shapes", () => {
  const E7 = { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] };
  assert.deepEqual(chordShapes(song({ chords: { E7: [E7] } }), 'E7').map(v => v.frets), [E7.frets]);
});

test("the voicing is your pick, else the song's own shape, else the library's first", () => {
  const withRock = song({ chords: { G: [ROCK_G] } });
  assert.equal(voicingIndex(song(), 'G', {}), 0);
  assert.equal(voicingIndex(withRock, 'G', {}), 4);
  assert.equal(voicingIndex(withRock, 'G', { G: 2 }), 2);
  assert.equal(voicing(withRock, 'G', {}).name, 'Rock G');
  assert.equal(voicing(withRock, 'G', { G: 2 }).name, 'Open, 4 fingers');
});

test('a pick past the end of the list falls back to the song or library shape', () => {
  assert.equal(voicingIndex(song(), 'G', { G: 9 }), 0);
});

test('the easiest fingerings for G to C use the G that moves least to C', () => {
  // the library's tip for G "Open, fingers 3-2-4": faster change to C
  assert.deepEqual(easiestFingerings(song()), { G: 1, C: 0 });
});

test('the suggestion never picks a barre shape where an open one exists', () => {
  // the song's own chord is the F barre exactly, so moving from the barre F would cost nothing
  const Fbar = { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], hard: true };
  const s = song({ chords: { Fx: [Fbar] }, bars: [{ chord: 'F', strum: 'D.DU.UDU' }, { chord: 'Fx', strum: 'D.DU.UDU' }, { chord: 'G C', strum: 'D.DU.UDU' }] });
  const best = easiestFingerings(s);
  assert.deepEqual(Object.keys(best), ['F', 'Fx', 'G', 'C']);
  for (const name of ['F', 'G', 'C']) assert.equal(chordShapes(s, name)[best[name]].hard, undefined, name);
  assert.equal(best.Fx, 0);   // a chord with only a barre shape keeps it
});
