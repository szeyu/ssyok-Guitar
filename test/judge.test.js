import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge, missesByBar, summary, WINDOW_MS } from '../app/src/engine/judge.js';

// 4/4 at 60 bpm: 2 slots a second, so a slot is 500 ms. Bar 1 strums D.DU.UDU (slot 1 and 4 are passes); bar 2 is picked.
const song = { title: 't', bpm: 60, bars: [{ chord: 'G', strum: 'D.DU.UDU' }, { chord: 'C', pluck: '5 . 3 2 1 2 3 2' }, { chord: 'G', strum: 'DUDUDUDU', section: 'Chorus' }] };
const RATE = 2;
const tap = (slot, ms) => slot + ms / 1000 * RATE;           // a tap's position in slots, ms off a slot

test('a tap within the window is Good', () => {
  assert.deepEqual(judge(song, tap(0, 0), 'D', RATE), { word: 'Good', ms: 0, text: 'Good', good: true, slot: 0, bar: 0 });
  assert.equal(judge(song, tap(2, WINDOW_MS), 'D', RATE).word, 'Good');
  assert.equal(judge(song, tap(3, -WINDOW_MS), 'U', RATE).word, 'Good');
});

test('outside the window a tap is Early or Late by its ms', () => {
  assert.deepEqual(judge(song, tap(2, -120), 'D', RATE), { word: 'Early', ms: -120, text: 'Early 120 ms', good: false, slot: 2, bar: 0 });
  assert.deepEqual(judge(song, tap(3, 150), 'U', RATE), { word: 'Late', ms: 150, text: 'Late 150 ms', good: false, slot: 3, bar: 0 });
  assert.equal(judge(song, tap(0, WINDOW_MS + 1), 'D', RATE).word, 'Late');
});

test('the wrong direction says which way the stroke goes, even in time', () => {
  assert.equal(judge(song, tap(0, 0), 'U', RATE).text, 'Down here');
  assert.equal(judge(song, tap(3, 10), 'D', RATE).text, 'Up here');
  assert.equal(judge(song, tap(8, 0), 'U', RATE).word, 'Good', 'a picked note is judged on time only');
});

test('a tap over a pass is No strum here, over a picked rest Rest here', () => {
  assert.equal(judge(song, tap(1, 0), 'U', RATE).text, 'No strum here');
  assert.equal(judge(song, tap(4, 20), 'D', RATE).text, 'No strum here');
  assert.deepEqual(judge(song, tap(9, -30), 'U', RATE), { word: 'Rest here', ms: -30, text: 'Rest here', good: false, slot: 9, bar: 1 });
});

// the whole song played: bar 1 has 6 hits (slots 0 2 3 5 6 7), bar 2 has 7 picked notes (all but slot 9), bar 3 has 8
const all = Array.from({ length: 24 }, (_, i) => i);
const run = taps => taps.map(([slot, ms, dir]) => judge(song, tap(slot, ms), dir, RATE));
const clean = all.filter(s => s !== 1 && s !== 4 && s !== 9).map(s => [s, 0, s < 8 || s > 15 ? 'DU'[s % 2] : 'D']);

test('misses count per bar: a bad tap, and a stroke played with no tap', () => {
  assert.deepEqual(missesByBar(song, run(clean), all), {});
  const taps = clean.filter(([s]) => s !== 20);                // bar 3: one stroke left untapped
  taps.push([1, 0, 'U'], [16, 150, 'D'], [17, 0, 'D']);          // bar 1: a tap over a pass; bar 3: one late, one the wrong way
  assert.deepEqual(missesByBar(song, run(taps), all), { 0: 1, 2: 3 });
  assert.deepEqual(missesByBar(song, run([]), [0, 1, 2]), { 0: 2 }, 'only the strokes that were played count');
});

test('the summary gives the on-time percentage and the worst bar', () => {
  assert.deepEqual(summary(song, run(clean), all), { onTime: 21, percentOnTime: 100, worstBar: null, taps: 21, hits: 21, misses: {} });
  // 21 strokes: bar 3 leaves 2 untapped; bar 2 taps one late; bar 1 adds an early tap on a stroke also tapped on time
  const taps = clean.filter(([s]) => s !== 12 && s !== 20 && s !== 21).concat([[2, -200, 'D'], [12, 200, 'D']]);
  const out = summary(song, run(taps), all);
  assert.equal(out.onTime, 18);
  assert.equal(out.percentOnTime, 86);
  assert.equal(out.worstBar, 2);
  assert.deepEqual(out.misses, { 0: 1, 1: 1, 2: 2 });
  assert.equal(summary(song, run(clean.filter(([s]) => s !== 0 && s !== 8)), all).worstBar, 0, 'a tie goes to the earlier bar');
});
