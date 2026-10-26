// Start-up: load the songs, draw the library, and read the URL flags.
// URL flags open a state directly, for screenshots and checks:
//   ?song=<index>  that song's song screen        ?capo=<fret>  its capo        ?pick=<chord>  the fingering picker for a chord
//   &play=1        the player, paused             &at=<bar>     at that bar (1 = the first)
//   &tools=1       with the Tools menu open       &bpm=<n>      at that tempo  &go=1         playing (needs autoplay allowed)
//   &log           a trace of scheduled and drawn slot times in the console (run it with node tools/trace.js <url>)
import { loadSongs } from './store.js';
import { renderLibrary } from './screens/library.js';
import { showSong, openPicker, setCapo, playSong } from './screens/song.js';
import { toggleTools } from './screens/player.js';
import { showScreen } from './screens/shell.js';
import { CAPO_MAX } from './engine/song.js';

const library = await loadSongs();
const openSong = i => { showSong(library.songs[i]); showScreen('song'); };
renderLibrary(library, openSong);

const Q = new URLSearchParams(location.search);
if (library.songs[Q.get('song')]) {
  const song = library.songs[+Q.get('song')];
  openSong(+Q.get('song'));
  if (Q.has('capo')) setCapo(Math.min(CAPO_MAX, Math.max(0, Math.round(+Q.get('capo')) || 0)));
  if (Q.has('pick')) openPicker(Q.get('pick'));
  if (Q.has('play')) {
    playSong({ tempo: +Q.get('bpm') || song.bpm, bar: (Math.round(+Q.get('at')) || 1) - 1, play: Q.has('go') });
    if (Q.has('tools')) toggleTools(true);
  }
}
