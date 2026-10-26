import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPitch, cents, nearestString, findOnset, ONSET_WINDOW } from '../app/src/audio/pitch.js';
import { OPEN_HZ, stringHz, pluckString } from '../app/src/audio/synth.js';
import { STRINGS, noteHz } from '../app/src/engine/song.js';

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
  const { string, cents: off } = nearestString(OPEN_HZ[3] * 2 ** (-12 / 1200), OPEN_HZ);
  assert.equal(string, 3); assert.ok(Math.abs(off + 12) < 1e-9);
});

test('an onset is found where the strum starts in the buffer, not where the frame noticed it', () => {
  const at = 3000, buf = sine(110).map((x, i) => i < at ? 0 : x);   // silence, then a strum at sample 3000
  const i = findOnset(buf, 0, .03);
  assert.ok(i > at - ONSET_WINDOW && i <= at, `onset at ${i}, strum at ${at}`);
  assert.equal(findOnset(new Float32Array(4096), 0, .03), -1);       // silence: none
  assert.equal(findOnset(sine(110), .35, .03), -1);                  // a steady note already as loud before: none
});

test('the string model plays in tune: standard tuning', () => {
  STRINGS.forEach((name, s) => {
    assert.ok(Math.abs(cents(stringHz(s, 0), noteHz(name))) < 1, `string ${s} is not ${name}`);
    const { data, rate } = pluckString(stringHz(s, 0), SR, .5);        // the plucked string itself, rendered and read back by the detector
    near(detectPitch(data.subarray(4410, 4410 + 4096), SR) * rate, stringHz(s, 0));
  });
});
