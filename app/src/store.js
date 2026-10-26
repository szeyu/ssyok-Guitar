// Songs from the songs folder (songs/index.json lists them in library order, each file is one song), and what this browser
// keeps: the songs added or edited in the builder, and each song's memory (fingering picks, capo, last bar).
// The browser half works on any storage with getItem, setItem and removeItem (localStorage in the app, a fake in the tests).
import { validateSong } from './engine/song.js';

/** The keys: one list of saved songs, and one memory per song title. */
export const SONGS_KEY = 'guitar.songs', MEMORY_KEY = 'guitar.memory.';

/** localStorage, or null where the browser blocks it (every function here then reads nothing and saves nothing). */
export const browserStorage = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

const read = (storage, key, fallback) => { try { return JSON.parse(storage?.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (storage, key, value) => { try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const savedList = storage => { const list = read(storage, SONGS_KEY, []); return Array.isArray(list) ? list : []; };

/** The songs saved in this browser that still validate, in the order saved, and a note for each that does not. */
export function savedSongs(storage) {
  const songs = [], notes = [];
  for (const song of savedList(storage)) {
    const errs = validateSong(song);
    if (errs.length) notes.push(`A song saved in this browser was skipped: ${errs[0]}`); else songs.push(song);
  }
  return { songs, notes };
}

/** A pasted song file: { song, errors }, errors as validateSong gives them (naming the bar), or one for text that is not JSON. */
export function readSongFile(text) {
  let song;
  try { song = JSON.parse(text); } catch (e) { return { song: null, errors: ['That is not valid JSON: ' + e.message] }; }
  return { song, errors: validateSong(song) };
}

/** Saves a song in this browser, replacing the one it was edited from (was: that song's title) or a saved one with its title.
 *  taken: the titles of every song in the library. Returns the errors; nothing is saved unless there are none. */
export function saveSong(storage, song, { was = null, taken = [] } = {}) {
  const errors = validateSong(song);
  if (song?.title !== was && taken.includes(song?.title)) errors.push('There is already a song with this title.');
  if (errors.length) return errors;
  const list = savedList(storage), same = s => s.title === was || s.title === song.title, at = list.findIndex(same);
  const next = list.filter(s => !same(s));
  next.splice(at < 0 ? next.length : at, 0, song);              // an edited song keeps its place
  return storage && write(storage, SONGS_KEY, next) ? [] : ['This browser would not save the song: its storage is full or turned off.'];
}

/** Removes a song saved in this browser, and its memory. */
export function removeSong(storage, title) {
  if (!storage) return;
  write(storage, SONGS_KEY, savedList(storage).filter(s => s.title !== title));
  try { storage.removeItem(MEMORY_KEY + title); } catch {}
}

/** What this browser remembers of a song: { picks } (chord name to the fingering's index), and capo and bar once set. */
export const songMemory = (storage, title) => ({ picks: {}, ...read(storage, MEMORY_KEY + title, {}) });

/** Remembers some of { picks, capo, bar } for a song, keeping the rest. */
export function remember(storage, title, change) {
  if (storage) write(storage, MEMORY_KEY + title, { ...songMemory(storage, title), ...change });
}

/** The library: the folder's songs in index order, each replaced by this browser's copy when one has its title, then the songs
 *  added in this browser. saved: the titles that come from this browser. */
export function withSaved(files, saved) {
  const mine = new Map(saved.map(s => [s.title, s]));
  return { songs: [...files.map(s => mine.get(s.title) ?? s), ...saved.filter(s => !files.some(f => f.title === s.title))], saved: new Set(mine.keys()) };
}

/** Fetches and validates every song in the index. A file that fails, or repeats a title already loaded, is skipped and named in
 *  notes. Then the browser's songs join (withSaved). files: the titles from the folder. */
export async function loadSongs(base = 'songs/', storage = browserStorage()) {
  const { songs: files, notes } = await loadFiles(base);
  const saved = savedSongs(storage);
  return { ...withSaved(files, saved.songs), files: new Set(files.map(s => s.title)), notes: [...notes, ...saved.notes] };
}

async function loadFiles(base) {
  const notes = [];
  if (location.protocol === 'file:') return { songs: [], notes: ['The songs folder cannot be read when the page is opened as a file. Serve the repo (python3 -m http.server 8765) and open http://localhost:8765/app/ instead.'] };
  const get = async f => {
    const r = await fetch(base + f, { cache: 'no-store' });
    if (!r.ok) throw new Error('the server answered ' + r.status);
    try { return JSON.parse(await r.text()); } catch (e) { throw new Error('it is not valid JSON (' + e.message + ')'); }
  };
  const names = await get('index.json').catch(e => (notes.push('songs/index.json: ' + e.message), []));
  // each file settles to a song or a note, so the notes read in index order whichever fetch fails first
  const read = await Promise.all(names.map(f => get(f)
    .then(song => { const errs = validateSong(song); if (errs.length) throw new Error(errs[0]); return { song }; })
    .catch(e => ({ note: `songs/${f} was skipped: ${e.message}` }))));
  const songs = [];
  read.forEach(({ song, note }, i) => {
    if (note) notes.push(note);
    else if (songs.some(s => s.title === song.title)) notes.push(`songs/${names[i]} was skipped: a song titled "${song.title}" is already loaded.`);
    else songs.push(song);
  });
  return { songs, notes };
}
