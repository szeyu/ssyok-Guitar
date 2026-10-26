// Start-up: load the songs, draw the library, and read the URL flags.
// URL flags open a state directly, for screenshots and checks:
//   ?song=<index>  that song's song screen        ?capo=<fret>  its capo        ?pick=<chord>  the fingering picker for a chord
//   &play=1        the player, paused             &at=<bar>     at that bar (1 = the first)
//   &tools=1       with the Tools menu open       &bpm=<n>      at that tempo  &go=1         playing (needs autoplay allowed)
//   &view=audience the 3D seen as the audience sees it   &hand=0  without the 3D hand   &perf  3D frame times and resolution scale
//   &drill=<n>     the player at strum step n (play=1 not needed)
//   &verdict=<words>  a verdict over the hit line, held still (e.g. Late 40 ms; empty: Good)   &tone=good|off|bad  its colour (default off; Good: good)
//   &tuner=1       the tuner, with fixed made-up readings (low E in tune, A 8 cents high, G 14 cents low, lit); no microphone
//   &done=1        the results card, from a fixed made-up run of taps judged by the real engine (results.js demoRun)
//   &log           a trace of scheduled and drawn slot times in the console (run it with node tools/trace.js <url>)
import { loadSongs } from './store.js';
import { renderLibrary } from './screens/library.js';
import { showSong, openPicker, setCapo, playSong } from './screens/song.js';
import { toggleTools, setView, showVerdict, demoResults } from './screens/player.js';
import { showFakeTuning } from './screens/tuner.js';
import { showScreen } from './screens/shell.js';
import { CAPO_MAX } from './engine/song.js';

const library = await loadSongs();
const openSong = i => { showSong(library.songs[i]); showScreen('song'); };
renderLibrary(library, openSong);

const Q = new URLSearchParams(location.search);
if (library.songs[Q.get('song')]) {
  openSong(+Q.get('song'));
  if (Q.has('capo')) setCapo(Math.min(CAPO_MAX, Math.max(0, Math.round(+Q.get('capo')) || 0)));
  if (Q.has('pick')) openPicker(Q.get('pick'));
  if (['play', 'drill', 'verdict', 'done', 'tuner'].some(f => Q.has(f))) {
    playSong({ step: Math.round(+Q.get('drill')) || 0, tempo: +Q.get('bpm') || undefined, bar: (Math.round(+Q.get('at')) || 1) - 1, play: Q.has('go') });
    if (Q.has('tools')) toggleTools(true);
    setView({ player: Q.get('view') !== 'audience', hand: Q.get('hand') !== '0' });
    if (Q.has('verdict')) showVerdict({ text: Q.get('verdict') || 'Good', tone: Q.get('tone') || (Q.get('verdict') ? 'off' : 'good') }, true);
    if (Q.has('done')) demoResults();
    if (Q.has('tuner')) showFakeTuning([82.41, 110 * 2 ** (8 / 1200), 196 * 2 ** (-14 / 1200)]);
  }
}
