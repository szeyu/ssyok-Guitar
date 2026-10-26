// Start-up: load the songs and show the library.
import { loadSongs } from './store.js';
import { renderLibrary } from './screens/library.js';

renderLibrary(await loadSongs());
