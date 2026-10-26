import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHORDS, chordShapes, voicingIndex, voicing, easiestFingerings, shapeLabel } from '../app/src/engine/chords.js';

const ROCK_G = { name: 'Rock G', frets: [3, -1, 0, 0, 3, 3], fingers: [2, 0, 0, 0, 3, 4], tip: '' };
const song = (over = {}) => ({ title: 'x', bpm: 80, bars: [{ chord: 'G', strum: 'D.DU.UDU' }, { chord: 'C', strum: 'D.DU.UDU' }], ...over });

test("a song's own shape joins the library's for that song only", () => {
  const withRock = song({ chords: { G: [ROCK_G] } }), plain = chordShapes(song(), 'G');
  assert.ok(plain.length > 1, 'G has more than one shape');
  assert.deepEqual(chordShapes(withRock, 'G'), [...plain, ROCK_G]);
  assert.ok(!chordShapes(song(), 'G').some(v => v.name === 'Rock G'));
  assert.ok(!CHORDS.G.some(v => v.name === 'Rock G'));
});

test("a song's shape the library already has is not listed twice", () => {
  const same = { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] };
  const s = song({ chords: { G: [same] } });
  assert.equal(chordShapes(s, 'G').length, chordShapes(song(), 'G').length);
  assert.deepEqual(voicing(s, 'G', {}).fingers, same.fingers);   // and it is still the song's choice
});

test("a chord only the song knows has the song's shapes", () => {
  const E7 = { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] };
  assert.deepEqual(chordShapes(song({ chords: { E7: [E7] } }), 'E7').map(v => v.frets), [E7.frets]);
});

test("the voicing is your pick, else the song's own shape, else the library's first", () => {
  const withRock = song({ chords: { G: [ROCK_G] } });
  assert.equal(voicingIndex(song(), 'G', {}), 0);
  assert.equal(voicingIndex(withRock, 'G', { G: 2 }), 2);
  assert.equal(voicing(withRock, 'G', {}).name, 'Rock G');
  assert.equal(voicing(withRock, 'G', { G: 2 }), chordShapes(withRock, 'G')[2]);
});

test('a pick past the end of the list falls back to the song or library shape', () => {
  assert.equal(voicingIndex(song(), 'G', { G: 9 }), 0);
});

test('the easiest fingerings for G to C use the G that moves least to C', () => {
  // the library's tip for G "Open, fingers 3-2-4": faster change to C
  const best = easiestFingerings(song());
  assert.deepEqual(chordShapes(song(), 'G')[best.G].fingers, [3, 2, 0, 0, 0, 4]);
  assert.equal(chordShapes(song(), 'C')[best.C].hard, undefined);
});

test('the suggestion never picks a barre shape where an open one exists', () => {
  // the song's own chord is the F barre exactly, so moving from the barre F would cost nothing
  const Fbar = { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], hard: true };
  const s = song({ chords: { Fx: [Fbar] }, bars: [{ chord: 'F', strum: 'D.DU.UDU' }, { chord: 'Fx', strum: 'D.DU.UDU' }, { chord: 'G C', strum: 'D.DU.UDU' }] });
  const best = easiestFingerings(s);
  assert.deepEqual(new Set(Object.keys(best)), new Set(['F', 'Fx', 'G', 'C']));
  for (const name of ['F', 'G', 'C']) assert.equal(chordShapes(s, name)[best[name]].hard, undefined, name);
  assert.equal(chordShapes(s, 'Fx')[best.Fx].hard, true);   // a chord with only a barre shape keeps it
});

test("the picker marks the song's own shape, or the library's first when the song has none", () => {
  const withRock = song({ chords: { G: [ROCK_G] } }), shapes = chordShapes(withRock, 'G');
  assert.deepEqual(shapes.map((v, i) => shapeLabel(withRock, 'G', i)).filter(Boolean), ["the song's"]);
  assert.equal(shapeLabel(withRock, 'G', shapes.findIndex(v => v.name === 'Rock G')), "the song's");
  assert.equal(shapeLabel(song(), 'G', 0), 'default');
  assert.deepEqual(chordShapes(song(), 'G').map((v, i) => shapeLabel(song(), 'G', i)).filter(Boolean), ['default']);
});
