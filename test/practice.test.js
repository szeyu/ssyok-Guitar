import { test } from 'node:test';
import assert from 'node:assert/strict';
import { soundingName, strumSummary, slowBpm, capoOf, loopRange, songSlot, speedUp, TEMPO_MIN, TEMPO_MAX, countIn } from '../app/src/engine/practice.js';
import { handAt, playedAt } from '../app/src/engine/hand.js';
import { slotAt, sections, lyricLines } from '../app/src/engine/song.js';

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

// four bars of 4/4, eight slots each: G Em C D
const four = { title: 'x', bpm: 80, bars: ['G', 'Em', 'C', 'D'].map(chord => ({ chord, strum: 'D.DU.UDU' })) };
const barOf = (song, loop, slot) => slotAt(song, songSlot(song, loop, slot)).bar;

test('a whole-song loop and a one-bar loop', () => {
  assert.deepEqual(loopRange(four, 'song', 13), { a: 0, b: 32 });
  assert.deepEqual(loopRange(four, 'bar', 13), { a: 8, b: 16 });
});

test('a loop over the last bar wraps to the first', () => {
  const loop = loopRange(four, 'change', 26);         // in the last bar: the change is D back round to G
  assert.deepEqual([24, 31, 32, 39, 40, 47].map(s => barOf(four, loop, s)), [3, 3, 0, 0, 3, 3]);
});

test('a chord-change loop runs from the start of the chord you are in through the next chord', () => {
  const s = { title: 'x', bpm: 80, bars: ['G', 'G', 'G', 'Em', 'C C'].map(chord => ({ chord, strum: 'D.DU.UDU' })) };
  const loop = loopRange(s, 'change', 3);             // in bar 1: from bar 1 through bar 4's Em, the next chord
  assert.deepEqual(loop, { a: 0, b: 32 });
  assert.deepEqual([...new Set([0, 23, 24, 31].map(i => slotAt(s, songSlot(s, loop, i)).chord))], ['G', 'Em']);
  assert.deepEqual(loopRange(s, 'change', 13), { a: 8, b: 32 });   // from bar 2, where the playhead is
  // inside a bar of two chords, the change is from the second half to what follows
  const half = { ...s, bars: [{ chord: 'C E7', strum: 'D.DU.UDU' }, { chord: 'Am', strum: 'D.DU.UDU' }] };
  assert.deepEqual(loopRange(half, 'change', 1), { a: 0, b: 8 });
  assert.deepEqual(loopRange(half, 'change', 5), { a: 4, b: 16 });
});

test('a song of one chord loops its bar and the next for a chord change', () => {
  const one = { title: 'x', bpm: 80, bars: [{ chord: 'G', strum: 'D.DU.UDU' }, { chord: 'G', strum: 'D.DU.UDU' }] };
  assert.deepEqual(loopRange(one, 'change', 9), { a: 8, b: 24 });
});

test('speeding up adds 5 bpm each time a loop comes round, up to the top of the tempo range', () => {
  assert.equal(speedUp(80), 85);
  assert.equal(speedUp(speedUp(80)), 90);
  assert.equal(speedUp(TEMPO_MAX), TEMPO_MAX);
});

test('the tempo range is 40 to 140, as the prototype has it', () => {
  assert.deepEqual([TEMPO_MIN, TEMPO_MAX], [40, 140]);
  assert.equal(speedUp(138), 140);
});

test('the sections along the top: where each starts and how many bars it runs', () => {
  const s = { title: 'x', bpm: 80, bars: [{}, { section: 'Verse' }, {}, {}, { section: 'Chorus' }].map(b => ({ chord: 'G', strum: 'D.DU.UDU', ...b })) };
  assert.deepEqual(sections(s), [{ name: 'Start', bar: 0, bars: 1 }, { name: 'Verse', bar: 1, bars: 3 }, { name: 'Chorus', bar: 4, bars: 1 }]);
});

test('the count-in is one bar of the pulse: four in 4/4, three in 3/4, two dotted quarters in 6/8', () => {
  assert.deepEqual(countIn(four), { pulses: 4, slots: 2 });
  assert.deepEqual(countIn({ beats: 3 }), { pulses: 3, slots: 2 });
  assert.deepEqual(countIn({ beats: 3, compound: true }), { pulses: 2, slots: 3 });
});

test('the words under the line: a plain line stays up until the next, and shows the next line with its chord', () => {
  const s = { title: 'x', bpm: 80, bars: [{ lyric: 'one two' }, {}, { chord: 'C', lyric: 'three' }, {}].map(b => ({ chord: 'G', strum: 'D.DU.UDU', ...b })) };
  assert.deepEqual(lyricLines(s, 9), { now: { chord: 'G', text: 'one two', sung: 'one two' }, next: { chord: 'C', text: 'three' } });
  assert.deepEqual(lyricLines(s, 30), { now: { chord: 'C', text: 'three', sung: 'three' }, next: null });
});

test('timed words light up as they are sung, and belong to their own bar only', () => {
  const s = { title: 'x', bpm: 80, beats: 3, bars: [{ syllables: 'Hap- py birth- day to .' }, {}, { lyric: 'you' }].map(b => ({ chord: 'G', strum: 'D.DUDU', ...b })) };
  assert.deepEqual(lyricLines(s, 0).now, { chord: 'G', text: 'Hap-py birth-day to', sung: 'Hap-' });
  assert.equal(lyricLines(s, 3).now.sung, 'Hap-py birth-day');
  assert.deepEqual(lyricLines(s, 7), { now: null, next: { chord: 'G', text: 'you' } });
});

// the fretting hand: which shape it heads for, and when it lands
const twoChords = { title: 'x', bpm: 120, bars: [{ chord: 'G', strum: 'D.DU.UDU' }, { chord: 'C', strum: 'D.DU.UDU' }] };
const fullTempo = song => song.bpm / 60 * 2;                     // slots a second at the song's own tempo (4/4)

test('the hand reaches the next chord shape before that chord sounds, at full tempo', () => {
  const rate = fullTempo(twoChords), hand = handAt(twoChords, loopRange(twoChords, 'song', 0), 3, rate);
  assert.equal(hand.chord, 'G'); assert.equal(hand.next, 'C');
  assert.equal(hand.sounds, 8);                                  // C sounds on bar 2's first slot
  assert.ok((hand.sounds - hand.lands) / rate >= .05, 'lands at least 50 ms early');
  assert.equal(handAt(twoChords, loopRange(twoChords, 'song', 0), hand.lands, rate).move, 1);
  assert.equal(handAt(twoChords, loopRange(twoChords, 'song', 0), 2, rate).move, 0);   // early in the bar it still holds G
});

test('a bar of two chords moves the hand at each chord inside the bar', () => {
  const song = { title: 'x', bpm: 120, bars: [{ chord: 'C E', strum: 'D.DU.UDU' }, { chord: 'Am', strum: 'D.DU.UDU' }] };
  const loop = loopRange(song, 'song', 0), rate = fullTempo(song);
  const first = handAt(song, loop, 1, rate), second = handAt(song, loop, 5, rate);
  assert.deepEqual([first.chord, first.next, first.sounds], ['C', 'E', 4]);
  assert.deepEqual([second.chord, second.next, second.sounds], ['E', 'Am', 8]);
  assert.ok(first.lands < 4 && second.lands < 8);
});

test('at the end of a loop the hand heads back to the loop\'s first chord', () => {
  const song = { title: 'x', bpm: 120, bars: ['G', 'C', 'D'].map(chord => ({ chord, strum: 'D.DU.UDU' })) };
  const loop = loopRange(song, 'bar', 9);                        // bar 2 (C) on its own
  assert.equal(handAt(song, loop, 15, fullTempo(song)).next, 'C');
  assert.equal(handAt(song, loopRange(song, 'song', 0), 23, fullTempo(song)).next, 'G');   // the song comes round to bar 1
});

test('a chord held over several bars: the hand heads for the next different chord, and moves only before it', () => {
  const song = { title: 'x', bpm: 120, bars: ['G', 'G', 'D'].map(chord => ({ chord, strum: 'D.DU.UDU' })) };
  const loop = loopRange(song, 'song', 0), rate = fullTempo(song), early = handAt(song, loop, 2, rate);
  assert.deepEqual([early.chord, early.next, early.sounds, early.move], ['G', 'D', 16, 0]);
  assert.ok(handAt(song, loop, early.lands, rate).move === 1 && early.lands < 16);
});

test('what the hands play at a slot: the stroke, its count, the fingering\'s frets and the riff marks', () => {
  const song = { title: 'x', bpm: 80, bars: [{ chord: 'C', pluck: '5 2:3+3 1:0 . 6:12 3 2 1' }] };
  const played = playedAt(song, 1, {});
  assert.deepEqual([played.count, played.frets, played.riff], ['&', [-1, 3, 2, 0, 1, 0], [{ string: 4, fret: 3 }]]);
  assert.deepEqual(played.stroke, slotAt(song, 1).stroke);
});

// ---- strum steps ----
import { strumSteps, stepSong, STEP_BPM } from '../app/src/engine/practice.js';
import { validateSong } from '../app/src/engine/song.js';

const METERS = { '4/4': {}, '3/4': { beats: 3 }, '6/8': { beats: 3, compound: true } };
const sixBars = meter => ({ title: 'Six', bpm: 96, capo: 2, ...METERS[meter], bars: ['G', 'C D', 'Em', 'G', 'C', 'D'].map((chord, n) => ({ chord, ...(n === 1 ? { pluck: meter === '4/4' ? '4 3 2 1 4 3 2 1' : '4 3 2 1 4 3' } : { strum: meter === '4/4' ? 'D.DU.UDU' : 'D.DUDU' }), lyric: 'la', section: n ? undefined : 'Verse' })) });

test('every step in every meter is a valid strum for that meter', () => {
  for (const meter of Object.keys(METERS)) {
    const song = sixBars(meter), all = strumSteps(song);
    assert.ok(all.length >= 4, meter);
    all.forEach((step, i) => {
      assert.ok(step.name && step.say, `${meter} step ${i + 1} is named and explained`);
      assert.deepEqual(validateSong({ ...song, bars: [{ chord: 'G', strum: step.strum }] }), [], `${meter} step ${i + 1}: ${step.strum}`);
    });
  }
});

test('the step sets follow the meter', () => {
  assert.equal(strumSteps(sixBars('4/4'))[0].strum, 'D.D.D.D.');
  assert.equal(strumSteps(sixBars('3/4'))[0].strum, 'D.D.D.');
  assert.equal(strumSteps(sixBars('6/8'))[0].strum, 'D..D..');   // down on the pulse, 1 and 4
});

test('stage N plays its step over the first four bars, with their chords', () => {
  const song = sixBars('4/4'), stage = stepSong(song, 3);
  assert.deepEqual(stage.bars.map(b => b.chord), ['G', 'C D', 'Em', 'G']);
  assert.ok(stage.bars.every(b => b.strum === strumSteps(song)[2].strum && !b.pluck && !b.lyric));
  assert.equal(slotAt(stage, 8 + 4).chord, 'D');                  // a two-chord bar keeps both chords
  assert.deepEqual(validateSong(stage), []);
  assert.equal(stepSong({ ...song, bars: song.bars.slice(0, 2) }, 1).bars.length, 2);   // a shorter song: all its bars
});

test('a stage plays at 60 bpm in the song\'s unit, the dotted quarter in 6/8', () => {
  assert.equal(STEP_BPM, 60);
  for (const meter of Object.keys(METERS)) assert.equal(stepSong(sixBars(meter), 1).bpm, 60);
});

test('making a stage leaves the song as it was, so leaving the steps plays the whole song again', () => {
  const song = sixBars('6/8'), before = structuredClone(song);
  for (let n = 1; n <= strumSteps(song).length; n++) stepSong(song, n);
  assert.deepEqual(song, before);
});
