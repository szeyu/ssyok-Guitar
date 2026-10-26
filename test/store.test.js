// The browser half of the store, against a fake storage: saved songs, the library merge, and each song's memory.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveSong, savedSongs, removeSong, songMemory, remember, withSaved, readSongFile, SONGS_KEY, MEMORY_KEY } from '../app/src/store.js';

const fake = () => {
  const m = new Map();
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m };
};
const song = (title, over = {}) => ({ title, bpm: 80, bars: [{ chord: 'G', strum: 'D.DU.UDU' }], ...over });
const titles = s => savedSongs(s).songs.map(x => x.title);

test('a saved song comes back, and an edit replaces it in its place', () => {
  const s = fake();
  assert.deepEqual(saveSong(s, song('A')), []);
  saveSong(s, song('B'));
  assert.deepEqual(saveSong(s, song('A2', { bpm: 90 }), { was: 'A', taken: ['A', 'B'] }), []);
  assert.deepEqual(titles(s), ['A2', 'B']);
  assert.equal(savedSongs(s).songs[0].bpm, 90);
  assert.deepEqual(saveSong(s, song('Jingle Bells'), { was: 'Jingle Bells', taken: ['Jingle Bells', 'A2', 'B'] }), [], 'a built-in edited keeps its title');
  assert.deepEqual(titles(s), ['A2', 'B', 'Jingle Bells']);
});

test('a title another song has is refused, and nothing is saved', () => {
  const s = fake();
  assert.deepEqual(saveSong(s, song('Jingle Bells'), { taken: ['Jingle Bells'] }), ['There is already a song with this title.']);
  assert.equal(s.getItem(SONGS_KEY), null);
});

test('a pasted file with errors names each bar, and is not saved', () => {
  const s = fake();
  const text = JSON.stringify(song('Bad', { bars: [{ chord: 'G', strum: 'D.DU.UDU' }, { chord: 'Q', strum: 'D.DU.UDU' }, { chord: 'C', strum: 'DDDD' }] }));
  const { song: pasted, errors } = readSongFile(text);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /^Bar 2: unknown chord "Q"/);
  assert.match(errors[1], /^Bar 3: "strum" must be exactly 8 characters/);
  assert.deepEqual(saveSong(s, pasted), errors);
  assert.equal(s.getItem(SONGS_KEY), null);
  assert.match(readSongFile('{ "title": ').errors[0], /^That is not valid JSON/);
});

test('remove takes the song and its memory, and leaves the others', () => {
  const s = fake();
  saveSong(s, song('A')); saveSong(s, song('B'));
  remember(s, 'A', { capo: 2 });
  removeSong(s, 'A');
  assert.deepEqual(titles(s), ['B']);
  assert.equal(s.getItem(MEMORY_KEY + 'A'), null);
});

test('memory keeps picks, capo and last bar per title, each change keeping the rest', () => {
  const s = fake();
  assert.deepEqual(songMemory(s, 'A'), { picks: {} });
  remember(s, 'A', { picks: { G: 2 } });
  remember(s, 'A', { capo: 3 });
  remember(s, 'A', { bar: 7 });
  assert.deepEqual(songMemory(s, 'A'), { picks: { G: 2 }, capo: 3, bar: 7 });
  assert.deepEqual(songMemory(s, 'B'), { picks: {} });
});

test('broken or blocked storage reads as empty, and a song that no longer validates is noted', () => {
  const s = fake();
  s.setItem(SONGS_KEY, '{ not json'); s.setItem(MEMORY_KEY + 'A', 'nope');
  assert.deepEqual(savedSongs(s), { songs: [], notes: [] });
  assert.deepEqual(songMemory(s, 'A'), { picks: {} });
  assert.deepEqual(songMemory(null, 'A'), { picks: {} });
  s.setItem(SONGS_KEY, JSON.stringify([song('Old', { bpm: 5 }), song('Fine')]));
  assert.deepEqual(titles(s), ['Fine']);
  assert.match(savedSongs(s).notes[0], /bpm/);
  const full = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem() {} };
  assert.match(saveSong(full, song('A'))[0], /would not save/);
});

test('the library: folder songs first, a browser copy in its file\'s place, then added songs', () => {
  const files = [song('X'), song('Y')], mine = [song('Z'), song('Y', { bpm: 100 })];
  const { songs, saved } = withSaved(files, mine);
  assert.deepEqual(songs.map(x => x.title), ['X', 'Y', 'Z']);
  assert.equal(songs[1].bpm, 100);
  assert.deepEqual([...saved], ['Z', 'Y']);
});
