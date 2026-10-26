// The song engine: a song file in, answers out. Pure: no DOM, audio, 3D or shared state.
// A song is bars of eighth-note slots: beats × 2 per bar (6/8 is beats: 3 with compound: true, counted 1 to 6).
import { CHORDS } from './chords.js';

const COUNT = ['1', '&', '2', '&', '3', '&', '4', '&'];
const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ALIAS = { Db: 'C#', 'D#': 'Eb', Gb: 'F#', 'G#': 'Ab', 'A#': 'Bb' };
const whole = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const words = s => s.trim().split(/\s+/);

// The strum vocabulary, one character per eighth-note slot: D down, U up, > accented down, x chuck (a muted hit),
// and REST, where the hand swings past without touching (REST is also a picked bar's rest).
const HITS = 'DU>x', REST = '.';

/** A guitarist's string number (6 = thickest … 1 = thinnest) as a string index (0 = thickest). Its own inverse. */
export const stringIndex = number => 6 - number;

/** Eighth-note slots in one bar of the song: 8 in 4/4, 6 in 3/4 and 6/8. */
export const slotsPerBar = song => (song.beats === 3 ? 3 : 4) * 2;

/** A song file's problems as sentences for its author, naming the bar; empty when the song is valid. */
export function validateSong(song) {
  const err = [];
  if (!song || typeof song !== 'object' || Array.isArray(song)) return ['The song must be one JSON object: { "title": ..., "bpm": ..., "bars": [...] }'];
  if (typeof song.title !== 'string' || !song.title.trim()) err.push('"title" is missing.');
  if (!whole(song.bpm, 40, 200)) err.push('"bpm" must be a whole number from 40 to 200.');
  if (song.capo !== undefined && !whole(song.capo, 0, 7)) err.push('"capo" must be a whole number from 0 to 7.');
  if (song.beats !== undefined && song.beats !== 3 && song.beats !== 4) err.push('"beats" (beats in a bar) must be 3 or 4.');
  if ((song.compound !== undefined && typeof song.compound !== 'boolean') || (song.compound && song.beats !== 3)) err.push('"compound": true (6/8 time) needs "beats": 3, which gives six eighth notes in a bar.');
  const beats = song.beats === 3 ? 3 : 4, slots = slotsPerBar(song);
  const songChords = song.chords && typeof song.chords === 'object' && !Array.isArray(song.chords) ? song.chords : {};
  if (song.chords !== undefined && songChords !== song.chords) err.push('"chords" must be an object: chord name to a list of fingerings.');
  for (const [name, fingerings] of Object.entries(songChords)) {
    if (!/^[A-G][#b]?/.test(name)) err.push(`Chord "${name}": the name must start with a note letter, A to G.`);
    if (!Array.isArray(fingerings) || !fingerings.length) { err.push(`Chord "${name}" needs a list with at least one fingering.`); continue; }
    fingerings.forEach((fingering, i) => {
      const at = `Chord "${name}", fingering ${i + 1}: `;
      if (!Array.isArray(fingering?.frets) || fingering.frets.length !== 6 || !fingering.frets.every(f => whole(f, -1, 20))) err.push(at + '"frets" must be six whole numbers, thickest string first (-1 = do not play, 0 = open).');
      else if (!Array.isArray(fingering.fingers) || fingering.fingers.length !== 6 || !fingering.fingers.every(f => whole(f, 0, 4))) err.push(at + '"fingers" must be six numbers from 0 to 4 (0 = no finger).');
      else if (fingering.frets.some((f, string) => (f > 0) !== (fingering.fingers[string] > 0))) err.push(at + 'every pressed string needs a finger, and open or unplayed strings must have finger 0.');
    });
  }
  if (!Array.isArray(song.bars) || !song.bars.length) err.push('"bars" must be a list with at least one bar.');
  else song.bars.forEach((bar, i) => {
    const at = `Bar ${i + 1}: `;
    const names = typeof bar?.chord === 'string' && bar.chord.trim() ? words(bar.chord) : [String(bar?.chord)];
    for (const name of names) if (!CHORDS[name] && !songChords[name]) err.push(at + `unknown chord "${name}". Known chords: ${Object.keys(CHORDS).join(', ')}.`);
    if (slots % names.length) err.push(at + `${names.length} chords cannot share a bar of ${slots} counts evenly. Use ${beats === 3 ? '2 or 3' : '2 or 4'} chords, or one.`);
    if (bar?.lyric !== undefined && typeof bar.lyric !== 'string') err.push(at + '"lyric" must be text.');
    if (bar?.syllables !== undefined && !(typeof bar.syllables === 'string' && words(bar.syllables).length === slots)) err.push(at + `"syllables" must be ${slots} entries separated by spaces, one per eighth note, with . where nothing is sung.`);
    if (bar?.tune !== undefined && !(typeof bar.tune === 'string' && words(bar.tune).length === slots && words(bar.tune).every(entry => /^([._]|[A-G][#b]?[2-6])$/.test(entry)))) err.push(at + `"tune" must be ${slots} entries separated by spaces: a note with its octave such as G4 or F#4, . to hold, or _ for silence.`);
    if (bar?.pluck !== undefined) {
      const pluckTokens = typeof bar.pluck === 'string' ? words(bar.pluck) : [];
      const riffNote = token => /^[1-6](:\d{1,2})?$/.test(token) && !(+token.split(':')[1] > 20);
      if (pluckTokens.length !== slots || !pluckTokens.every(token => token === REST || (/^[1-6]{1,3}$/.test(token) && new Set(token).size === token.length) || token.split('+').every(riffNote))) err.push(at + `"pluck" must be ${slots} entries separated by spaces: a string number 1 to 6 (6 = thickest), digits together to pluck several at once, a string with its own fret such as 2:3 (joined with + to play several), or . to rest.`);
      if (bar.strum === undefined) return;                       // picked only; with a strum as well, the strum is checked below
    }
    if (typeof bar?.strum !== 'string' || ![...bar.strum].every(ch => (HITS + REST).includes(ch)) || bar.strum.length !== slots) err.push(at + `"strum" must be exactly ${slots} characters from ${[...HITS].join(' ')} and ${REST} (one per eighth note, ${beats} beats in a bar).`);
    else if (!song.compound) [...bar.strum].forEach((ch, slot) => { if (ch === 'UD'[slot % 2]) err.push(at + `stroke ${slot + 1} is "${ch}", but the hand moves ${slot % 2 ? 'up' : 'down'} on "${COUNT[slot]}".`); });
  });
  return err;
}

/** Whether any bar has a melody line to sing or hear. */
export const hasMelody = song => song.bars.some(bar => bar.tune);

/** Whether any bar has words, plain or timed. */
export const hasLyrics = song => song.bars.some(bar => bar.lyric || bar.syllables);

/** The bar that shows how the song is strummed: the first strummed bar, or bar 0 when every bar is picked. */
// ponytail: the first strummed bar; the strum summary (ticket 03) can pick the most used one
export const mainStrumBar = song => Math.max(0, song.bars.findIndex(bar => bar.strum));

/** How a stroke is drawn: an arrow for a strum (dashed = swing past without touching), string numbers for a pick, ✕ for a chuck.
 *  tone is down, up, pluck or mute. */
export function strokeGlyph(stroke) {
  if (stroke.pluck) return stroke.hit ? { text: stroke.pluck.map(stringIndex).join(''), tone: 'pluck' } : { text: '·', tone: 'mute' };
  if (stroke.chuck) return { text: '✕', tone: 'mute' };
  const down = stroke.dir === 'D';
  return stroke.hit ? { text: down ? '↓' : '↑', tone: down ? 'down' : 'up' } : { text: down ? '⇣' : '⇡', tone: 'mute' };
}

/** The chords a song uses, each once, in the order they first sound. */
export const chordsUsed = song => [...new Set(song.bars.flatMap(b => words(b.chord)))];

// What the hand does on one slot of a bar. A mixed bar (strum and pluck) strums where the strum hits and picks elsewhere.
function strokeOf(bar, i, compound) {
  const pluckTokens = bar.pluck && words(bar.pluck);
  const ch = !pluckTokens ? bar.strum[i] : !bar.strum ? pluckTokens[i] : bar.strum[i] !== REST ? bar.strum[i] : pluckTokens[i] ?? REST;
  const swing = 'DU'[i % 2];                                   // the hand is a pendulum: down on the numbers, up on the "&"
  if (pluckTokens && !(bar.strum && HITS.includes(ch))) {
    if (ch === REST) return { dir: swing, hit: false, accent: false, chuck: false, pluck: [], fret: {} };
    // picked strings numbered the guitarist's way (6 = thickest), returned as string indices 0 (thickest) to 5; "2:3" is string 2 at its own fret 3
    const notes = /[:+]/.test(ch) ? ch.split('+').map(n => { const [st, fr] = n.split(':'); return { s: stringIndex(st), f: fr === undefined ? null : +fr }; }) : [...ch].map(d => ({ s: stringIndex(d), f: null }));
    return { dir: swing, hit: true, accent: false, chuck: false, pluck: notes.map(n => n.s), fret: Object.fromEntries(notes.filter(n => n.f !== null).map(n => [n.s, n.f])) };
  }
  // in 6/8 accents and chucks are down strokes: that feel is played mostly with downs
  return { dir: ch === 'D' || ch === 'U' ? ch : compound && ch !== REST ? 'D' : swing, hit: ch !== REST, accent: ch === '>', chuck: ch === 'x', pluck: null, fret: {} };
}

/**
 * Everything about one slot of the song, counted from the first slot of bar 1 (slot must be inside the song):
 *   bar       the bar's index
 *   chord     the chord sounding there; several chords in a bar split it evenly
 *   stroke    { dir 'D'|'U', hit, accent, chuck, pluck, fret }: pluck is null for a strum, else the string indices picked
 *             (0 = thickest), and fret maps a string index to a riff note's own fret
 *   count     the count label: 1 & 2 & ..., or 1 to 6 in 6/8
 *   syllable  the word sung on this slot in a timed bar ('' when nothing is sung there), null when the bar is not timed
 *   lyric     the bar's words as one line, '' when it has none
 *   note      the melody note starting on this slot, { name, hz }, or null
 */
export function slotAt(song, slot) {
  const per = slotsPerBar(song), n = Math.floor(slot / per), i = slot % per, bar = song.bars[n];
  const chords = words(bar.chord);
  const timed = bar.syllables ? words(bar.syllables).map(x => x === '.' ? '' : x) : null;
  const tune = bar.tune ? words(bar.tune)[i] : '.';
  return {
    bar: n,
    chord: chords[Math.floor(i * chords.length / per)],
    stroke: strokeOf(bar, i, !!song.compound),
    count: song.compound ? '123456'[i] : COUNT[i],
    syllable: timed ? timed[i] : null,
    lyric: timed ? timed.filter(Boolean).reduce((a, x) => a + x + (x.endsWith('-') ? '' : ' '), '').trim() : bar.lyric ?? '',
    note: /^[A-G]/.test(tune) ? { name: tune, hz: noteHz(tune) } : null,
  };
}

/** The pitch in Hz of a note name with its octave, such as A4 (440) or F#4. No capo: that is a practice setting. */
export function noteHz(name) {
  const [, letter, octave] = name.match(/^([A-G][#b]?)(\d)$/);
  return 440 * 2 ** ((NOTES.indexOf(ALIAS[letter] ?? letter) + 12 * (octave - 4) - 9) / 12);
}
