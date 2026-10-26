// Start-up: load the songs, wire the screens, and read the URL flags.
// URL flags open a state directly, for screenshots: ?song=<index> opens that song's song screen, ?capo=<fret> sets its capo,
// ?pick=<chord> opens the fingering picker for one of its chords.
import { loadSongs } from './store.js';
import { renderLibrary } from './screens/library.js';
import { showSong, openPicker, closePicker, setCapo } from './screens/song.js';
import { CAPO_MAX } from './engine/song.js';

const SCREENS = { library: 'library', song: 'songScreen' };

/** Shows one screen and hides the others. */
function showScreen(name) {
  for (const [key, id] of Object.entries(SCREENS)) document.getElementById(id).hidden = key !== name;
  scrollTo(0, 0);
}

const library = await loadSongs();
const openSong = i => { showSong(library.songs[i]); showScreen('song'); };
renderLibrary(library, openSong);
document.getElementById('songBack').onclick = () => showScreen('library');

addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.target.matches?.('input, select, textarea, [contenteditable]')) return;
  if (!document.getElementById('songScreen').hidden && !closePicker()) showScreen('library');
});

const Q = new URLSearchParams(location.search);
if (library.songs[Q.get('song')]) {
  openSong(+Q.get('song'));
  if (Q.has('capo')) setCapo(Math.min(CAPO_MAX, Math.max(0, Math.round(+Q.get('capo')) || 0)));
  if (Q.has('pick')) openPicker(Q.get('pick'));
}
