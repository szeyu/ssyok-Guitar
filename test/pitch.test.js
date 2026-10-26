import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPitch, cents, nearestString } from '../app/src/audio/pitch.js';
import { OPEN_HZ, stringHz, pluckString } from '../app/src/audio/synth.js';
import { noteHz } from '../app/src/engine/song.js';

const SR = 44100, CENTS = 5;                                   // tolerance: ±5 cents (about ±0.3 Hz at 110, ±1 Hz at 329.6)
const sine = (hz, n = 4096, sr = SR) => Float32Array.from({ length: n }, (_, i) => .5 * Math.sin(2 * Math.PI * hz * i / sr));
const near = (got, want, tol = CENTS) => assert.ok(got && Math.abs(cents(got, want)) <= tol, `${got} Hz is not within ${tol} cents of ${want} Hz`);

test('pitch detection reads a 110 Hz and a 329.6 Hz sine', () => {
  near(detectPitch(sine(110), SR), 110);
  near(detectPitch(sine(329.6), SR), 329.6);
  near(detectPitch(sine(82.41, 4096, 48000), 48000), 82.41);  // the low E, in the 4096 samples the microphone reads, at 48 kHz
});

test('silence and near silence have no pitch', () => {
  assert.equal(detectPitch(new Float32Array(4096), SR), null);
  assert.equal(detectPitch(sine(110).map(x => x / 100), SR), null);
});

test('the nearest string and how far off it is', () => {
  const { s, cents: c } = nearestString(196 * 2 ** (-12 / 1200), OPEN_HZ);
  assert.equal(s, 3); assert.ok(Math.abs(c + 12) < 1e-9);
});

test('the string model plays in tune: standard tuning, a semitone a fret', () => {
  ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'].forEach((name, s) => {
    assert.ok(Math.abs(cents(stringHz(s, 0), noteHz(name))) < 1, `string ${s} is not ${name}`);
    for (let fret = 1; fret <= 12; fret++) assert.ok(Math.abs(stringHz(s, fret) / stringHz(s, 0) - 2 ** (fret / 12)) < 1e-12);
  });
  for (const s of [0, 1, 2, 3, 4, 5]) {                                    // the plucked string itself, rendered and read back by the detector
    const { data, rate } = pluckString(stringHz(s, 0), SR, .5);
    near(detectPitch(data.subarray(4410, 4410 + 4096), SR) * rate, stringHz(s, 0));
  }
});
