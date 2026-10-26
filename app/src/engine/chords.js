// The built-in chord library. Frets and fingers run thickest string (low E) to thinnest; -1 = not played, 0 = open.
// The first voicing of each chord is the default; hard marks barre shapes. A song's own "chords" block adds to it for that song.
export const CHORDS = {
  G: [
    { name: 'Open, fingers 2-1-3', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], tip: 'The textbook shape. Easiest to learn first.' },
    { name: 'Open, fingers 3-2-4', frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], tip: 'Same sound. Faster change to C: fingers 2 and 3 each move one string.' },
    { name: 'Open, 4 fingers',     frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4], tip: 'Fuller sound. Fingers 3 and 4 can stay down for some other chords.' },
    { name: 'Barre, 3rd fret',     frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], hard: true, tip: 'Movable shape: slide it to play any major chord. Hard for beginners.' },
  ],
  Em: [
    { name: 'Open, fingers 2-3', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], tip: 'The textbook shape.' },
    { name: 'Open, fingers 1-2', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 1, 2, 0, 0, 0], tip: 'Same sound. Leaves finger 3 free to land on C next.' },
  ],
  C: [
    { name: 'Open',            frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], tip: 'The textbook shape. Do not strum the low E string.' },
    { name: 'Barre, 3rd fret', frets: [-1, 3, 5, 5, 5, 3], fingers: [0, 1, 3, 3, 3, 1], hard: true, tip: 'Movable shape. Finger 3 flattens across three strings.' },
  ],
  D:  [{ name: 'Open', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], tip: 'Strum only the top four strings.' }],
  Dm: [{ name: 'Open', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], tip: 'Strum only the top four strings.' }],
  Am: [{ name: 'Open', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], tip: 'The E shape moved one string toward the floor. Do not strum the low E string.' }],
  E:  [{ name: 'Open', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], tip: 'All six strings ring.' }],
  A: [
    { name: 'Open, fingers 1-2-3', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], tip: 'Three fingers in a row on the 2nd fret.' },
    { name: 'Open, one finger',    frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 1, 1, 0], tip: 'Finger 1 flattens across three strings. Quick, but it is easy to mute the thinnest string by accident.' },
  ],
  F: [
    { name: 'Small F',         frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], tip: 'Finger 1 presses the two thinnest strings together.' },
    { name: 'Barre, 1st fret', frets: [1, 3, 3, 2, 1, 1],   fingers: [1, 3, 4, 2, 1, 1], hard: true, tip: 'The full barre. The hardest of the beginner chords.' },
  ],
};

const sameShape = (a, b) => a.frets.join() === b.frets.join() && a.fingers.join() === b.fingers.join();

/** The ways to play a chord in this song: the library's shapes, then the song's own that the library lacks. The library is not changed. */
export function chordShapes(song, name) {
  const lib = CHORDS[name] ?? [];
  return [...lib, ...(song.chords?.[name] ?? []).filter(v => !lib.some(x => sameShape(x, v))).map((v, i) => ({ name: 'Fingering ' + (i + 1), tip: '', ...v }))];
}

/** Which of chordShapes(song, name) to play: your pick, else the song's own (first) shape, else the library's first. picks maps a chord name to an index. */
export function voicingIndex(song, name, picks) {
  const shapes = chordShapes(song, name), own = song.chords?.[name]?.[0];
  const pick = picks[name], mine = own ? shapes.findIndex(v => sameShape(v, own)) : -1;
  return pick >= 0 && pick < shapes.length ? pick : Math.max(0, mine);
}

/** The fingering to play for a chord in this song, given your picks. */
export const voicing = (song, name, picks) => chordShapes(song, name)[voicingIndex(song, name, picks)];

// Where a finger sits on the neck, in cm (the nut 65 cm from the bridge, strings fanning from 5.4 to 3.6 cm wide): a point,
// or the middle of a bar across strings. Fingers sharing a fret sit side by side along it. null when the finger is not used.
const SCALE = 65, fretX = n => SCALE * 2 ** (-n / 12), stringZ = (s, x) => (s / 5 - .5) * (5.4 - 1.8 * x / SCALE);
function fingerAt(v, f) {
  const ss = v.fingers.flatMap((x, s) => x === f && v.frets[s] > 0 ? [s] : []);
  if (!ss.length) return null;
  const fr = v.frets[ss[0]], mates = [...new Set(v.fingers.filter((x, s) => x && v.frets[s] === fr))].sort(), n = mates.length;
  const x = fretX(fr) + (fretX(fr - 1) - fretX(fr)) * (n > 1 ? .7 - .42 * mates.indexOf(f) / (n - 1) : .35);
  return { x, z: (stringZ(ss[0], x) + stringZ(ss.at(-1), x)) / 2 };
}
// how far the four fingers travel from one shape to the next; lifting or placing a finger counts 1.5 cm
const travel = (a, b) => [1, 2, 3, 4].reduce((cost, f) => { const p = fingerAt(a, f), q = fingerAt(b, f); return cost + (p && q ? Math.hypot(p.x - q.x, p.z - q.z) : p || q ? 1.5 : 0); }, 0);

/** The fingering per chord (name to an index into chordShapes) that moves the fingers least over the song's changes, the last
 *  bar leading back to the first. A barre (hard) shape is never chosen for a chord that has an open one. */
// ponytail: tries every combination; fine for a song's handful of chords with a few shapes each, needs a smarter search past a few thousand
export function easiestFingerings(song) {
  const seq = song.bars.flatMap(b => b.chord.trim().split(/\s+/)), names = [...new Set(seq)];
  const options = Object.fromEntries(names.map(name => {
    const all = chordShapes(song, name).map((v, i) => i), open = all.filter(i => !chordShapes(song, name)[i].hard);
    return [name, open.length ? open : all];
  }));
  const changes = new Map();                                    // each change from one chord to another, with how often it happens
  seq.forEach((c, n) => { const key = c + ' ' + seq[(n + 1) % seq.length]; changes.set(key, (changes.get(key) ?? 0) + 1); });
  let best, bestCost = Infinity;
  const go = (i, choice) => {
    if (i < names.length) return options[names[i]].forEach(v => go(i + 1, { ...choice, [names[i]]: v }));
    let cost = 0;
    for (const [key, times] of changes) { const [a, b] = key.split(' '); cost += times * travel(chordShapes(song, a)[choice[a]], chordShapes(song, b)[choice[b]]); }
    if (cost < bestCost) { bestCost = cost; best = choice; }
  };
  go(0, {});
  return best;
}
