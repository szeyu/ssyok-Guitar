// Songs from the songs folder (songs/index.json lists them in library order, each file is one song), and what this browser
// keeps: the songs added or edited in the builder, and each song's memory (fingering picks, capo, last bar).
// The browser half works on any storage with getItem, setItem and removeItem (localStorage in the app, a fake in the tests).
import { validateSong, songErrors } from './engine/song.js';

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

/** A pasted song file: { song, errors }, errors as songErrors gives them ({ bar, text }), or one for text that is not JSON. */
export function readSongFile(text) {
  let song;
  try { song = JSON.parse(text); } catch (e) { return { song: null, errors: [{ text: 'That is not valid JSON: ' + e.message }] }; }
  return { song, errors: songErrors(song) };
}

// a song's memory under a new title
const moveMemory = (storage, from, to) => {
  const memory = storage.getItem(MEMORY_KEY + from);
  if (memory !== null) { storage.setItem(MEMORY_KEY + to, memory); storage.removeItem(MEMORY_KEY + from); }
};

/** Saves a song in this browser, replacing the one it was edited from (was: that song's title) or a saved one with its title.
 *  taken: the titles of every song in the library. A song edited from the songs folder (was names no saved song) is saved as a
 *  copy with source: the folder song's title, so it keeps that song's place whatever its title. A renamed song takes its memory.
 *  Returns the errors as { bar, text }; nothing is saved unless there are none. */
export function saveSong(storage, song, { was = null, taken = [] } = {}) {
  const errors = songErrors(song);
  if (song?.title !== was && taken.includes(song?.title)) errors.push({ text: 'There is already a song with this title.' });
  if (errors.length) return errors;
  const list = savedList(storage), same = s => s.title === was || s.title === song.title, at = list.findIndex(same);
  const edited = list.find(s => s.title === was), { source: _, ...copy } = song, source = was === null ? undefined : edited ? edited.source : was;
  const next = list.filter(s => !same(s));
  next.splice(at < 0 ? next.length : at, 0, source ? { ...copy, source } : copy);   // an edited song keeps its place
  if (!storage || !write(storage, SONGS_KEY, next)) return [{ text: 'This browser would not save the song: its storage is full or turned off.' }];
  if (was !== null && was !== song.title) try { moveMemory(storage, was, song.title); } catch {}
  return [];
}

/** Removes a song saved in this browser. A song added here loses its memory too; a copy of a folder song gives its memory back
 *  to the folder song. */
export function removeSong(storage, title) {
  if (!storage) return;
  const list = savedList(storage), source = list.find(s => s.title === title)?.source;
  write(storage, SONGS_KEY, list.filter(s => s.title !== title));
  try { if (!source) storage.removeItem(MEMORY_KEY + title); else if (source !== title) moveMemory(storage, title, source); } catch {}
}

/** What this browser remembers of a song: { picks } (chord name to the fingering's index), and capo and bar once set. */
export const songMemory = (storage, title) => ({ picks: {}, ...read(storage, MEMORY_KEY + title, {}) });

/** Remembers some of { picks, capo, bar } for a song, keeping the rest. */
export function remember(storage, title, change) {
  if (storage) write(storage, MEMORY_KEY + title, { ...songMemory(storage, title), ...change });
}

/** The library: the folder's songs in index order, each replaced by this browser's copy of it (source, or failing that the
 *  title, names the folder song), then the songs added in this browser. saved: the titles that come from this browser;
 *  files: the titles in the folder's places (a folder song or a copy of one). */
export function withSaved(files, saved) {
  const folderTitle = s => s.source ?? s.title, mine = new Map(saved.map(s => [folderTitle(s), s]));
  const songs = files.map(s => mine.get(s.title) ?? s);
  return { songs: [...songs, ...saved.filter(s => !files.some(f => f.title === folderTitle(s)))], saved: new Set(saved.map(s => s.title)), files: new Set(songs.map(s => s.title)) };
}

/** Fetches and validates every song in the index. A file that fails, or repeats a title already loaded, is skipped and named in
 *  notes. Then the browser's songs join (withSaved). */
export async function loadSongs(base = 'songs/', storage = browserStorage()) {
  const { songs: files, notes } = await loadFiles(base);
  const saved = savedSongs(storage);
  return { ...withSaved(files, saved.songs), notes: [...notes, ...saved.notes] };
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
