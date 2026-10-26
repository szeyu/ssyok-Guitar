// Songs from the songs folder: songs/index.json lists them in library order, each file is one song.
import { validateSong } from './engine/song.js';

/** Fetches and validates every song in the index. A file that fails, or repeats a title already loaded, is skipped and named in notes. */
export async function loadSongs(base = 'songs/') {
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
