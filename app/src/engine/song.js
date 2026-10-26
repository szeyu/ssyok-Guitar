// The song engine: a song file in, answers out. Pure: no DOM, audio, 3D or shared state.
// A song is bars of eighth-note slots: beats × 2 per bar (6/8 is beats: 3 with compound: true, counted 1 to 6).
import { CHORDS } from './chords.js';

const COUNT = ['1', '&', '2', '&', '3', '&', '4', '&'];
const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const ALIAS = { Db: 'C#', 'D#': 'Eb', Gb: 'F#', 'G#': 'Ab', 'A#': 'Bb' };
const whole = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const words = s => s.trim().split(/\s+/);

/** Eighth-note slots in one bar of the song: 8 in 4/4, 6 in 3/4 and 6/8. */
export const slotsPerBar = song => (song.beats === 3 ? 3 : 4) * 2;

/** A song file's problems as sentences for its author, naming the bar; empty when the song is valid. */
export function validateSong(o) {
  const err = [];
  if (!o || typeof o !== 'object' || Array.isArray(o)) return ['The song must be one JSON object: { "title": ..., "bpm": ..., "bars": [...] }'];
  if (typeof o.title !== 'string' || !o.title.trim()) err.push('"title" is missing.');
  if (!whole(o.bpm, 40, 200)) err.push('"bpm" must be a whole number from 40 to 200.');
  if (o.capo !== undefined && !whole(o.capo, 0, 7)) err.push('"capo" must be a whole number from 0 to 7.');
  if (o.beats !== undefined && o.beats !== 3 && o.beats !== 4) err.push('"beats" (beats in a bar) must be 3 or 4.');
  if (o.compound !== undefined && typeof o.compound !== 'boolean' || o.compound && o.beats !== 3) err.push('"compound": true (6/8 time) needs "beats": 3, which gives six eighth notes in a bar.');
  const beats = o.beats === 3 ? 3 : 4;
  const own = o.chords && typeof o.chords === 'object' && !Array.isArray(o.chords) ? o.chords : {};
  if (o.chords !== undefined && own !== o.chords) err.push('"chords" must be an object: chord name to a list of fingerings.');
  for (const [name, vs] of Object.entries(own)) {
    if (!/^[A-G][#b]?/.test(name)) err.push(`Chord "${name}": the name must start with a note letter, A to G.`);
    if (!Array.isArray(vs) || !vs.length) { err.push(`Chord "${name}" needs a list with at least one fingering.`); continue; }
    vs.forEach((v, i) => {
      const at = `Chord "${name}", fingering ${i + 1}: `;
      if (!Array.isArray(v?.frets) || v.frets.length !== 6 || !v.frets.every(f => whole(f, -1, 20))) err.push(at + '"frets" must be six whole numbers, thickest string first (-1 = do not play, 0 = open).');
      else if (!Array.isArray(v.fingers) || v.fingers.length !== 6 || !v.fingers.every(f => whole(f, 0, 4))) err.push(at + '"fingers" must be six numbers from 0 to 4 (0 = no finger).');
      else if (v.frets.some((f, s) => (f > 0) !== (v.fingers[s] > 0))) err.push(at + 'every pressed string needs a finger, and open or unplayed strings must have finger 0.');
    });
  }
  if (!Array.isArray(o.bars) || !o.bars.length) err.push('"bars" must be a list with at least one bar.');
  else o.bars.forEach((b, i) => {
    const at = `Bar ${i + 1}: `;
    const names = typeof b?.chord === 'string' && b.chord.trim() ? words(b.chord) : [String(b?.chord)];
    for (const c of names) if (!CHORDS[c] && !own[c]) err.push(at + `unknown chord "${c}". Known chords: ${Object.keys(CHORDS).join(', ')}.`);
    if (beats * 2 % names.length) err.push(at + `${names.length} chords cannot share a bar of ${beats * 2} counts evenly. Use ${beats === 3 ? '2 or 3' : '2 or 4'} chords, or one.`);
    if (b?.lyric !== undefined && typeof b.lyric !== 'string') err.push(at + '"lyric" must be text.');
    if (b?.syllables !== undefined && !(typeof b.syllables === 'string' && words(b.syllables).length === beats * 2)) err.push(at + `"syllables" must be ${beats * 2} entries separated by spaces, one per eighth note, with . where nothing is sung.`);
    if (b?.tune !== undefined && !(typeof b.tune === 'string' && words(b.tune).length === beats * 2 && words(b.tune).every(x => /^([._]|[A-G][#b]?[2-6])$/.test(x)))) err.push(at + `"tune" must be ${beats * 2} entries separated by spaces: a note with its octave such as G4 or F#4, . to hold, or _ for silence.`);
    if (b?.pluck !== undefined) {
      const t = typeof b.pluck === 'string' ? words(b.pluck) : [];
      const note = x => /^[1-6](:\d{1,2})?$/.test(x) && !(+x.split(':')[1] > 20);
      if (t.length !== beats * 2 || !t.every(x => x === '.' || (/^[1-6]{1,3}$/.test(x) && new Set(x).size === x.length) || x.split('+').every(note))) err.push(at + `"pluck" must be ${beats * 2} entries separated by spaces: a string number 1 to 6 (6 = thickest), digits together to pluck several at once, a string with its own fret such as 2:3 (joined with + to play several), or . to rest.`);
      if (b.strum === undefined) return;                       // picked only; with a strum as well, the strum is checked below
    }
    if (typeof b?.strum !== 'string' || !/^[DU.>x]+$/.test(b.strum) || b.strum.length !== beats * 2) err.push(at + `"strum" must be exactly ${beats * 2} characters from D U > x and . (one per eighth note, ${beats} beats in a bar).`);
    else if (!o.compound) [...b.strum].forEach((ch, s) => { if (ch === 'UD'[s % 2]) err.push(at + `stroke ${s + 1} is "${ch}", but the hand moves ${s % 2 ? 'up' : 'down'} on "${COUNT[s]}".`); });
  });
  return err;
}

/** The chords a song uses, each once, in the order they first sound. */
export const chordsUsed = song => [...new Set(song.bars.flatMap(b => words(b.chord)))];

// What the hand does on one slot of a bar. A mixed bar (strum and pluck) strums where the strum hits and picks elsewhere.
function strokeOf(bar, i, compound) {
  const pl = bar.pluck && words(bar.pluck);
  const ch = !pl ? bar.strum[i] : !bar.strum ? pl[i] : bar.strum[i] !== '.' ? bar.strum[i] : pl[i] ?? '.';
  const swing = 'DU'[i % 2];                                   // the hand is a pendulum: down on the numbers, up on the "&"
  if (pl && !(bar.strum && 'DU>x'.includes(ch))) {
    if (ch === '.') return { dir: swing, hit: false, accent: false, chuck: false, pluck: [], fret: {} };
    // picked strings numbered the guitarist's way (6 = thickest), returned as string indices 0 (thickest) to 5; "2:3" is string 2 at its own fret 3
    const notes = /[:+]/.test(ch) ? ch.split('+').map(n => { const [st, fr] = n.split(':'); return { s: 6 - st, f: fr === undefined ? null : +fr }; }) : [...ch].map(d => ({ s: 6 - d, f: null }));
    return { dir: swing, hit: true, accent: false, chuck: false, pluck: notes.map(n => n.s), fret: Object.fromEntries(notes.filter(n => n.f !== null).map(n => [n.s, n.f])) };
  }
  // in 6/8 accents and chucks are down strokes: that feel is played mostly with downs
  return { dir: ch === 'D' || ch === 'U' ? ch : compound && ch !== '.' ? 'D' : swing, hit: ch !== '.', accent: ch === '>', chuck: ch === 'x', pluck: null, fret: {} };
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
