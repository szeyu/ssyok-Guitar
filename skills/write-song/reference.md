# Song file format

What `validateSong` in `app/src/engine/song.js` accepts. That function is the source of truth; when this page and it disagree, it wins.

Everything sits on a **grid** of eighth notes: each bar has a fixed number of **slots**, and every per-slot field has exactly that many entries.

## The grid

| Feel | Fields | Slots | Counted |
| --- | --- | --- | --- |
| 4/4 | `beats: 4` (or leave out) | 8 | 1 & 2 & 3 & 4 & |
| 3/4 (waltz) | `beats: 3` | 6 | 1 & 2 & 3 & |
| 6/8 | `beats: 3, compound: true` | 6 | 1 2 3 4 5 6, pulse on 1 and 4 |

A 12/8 bar is two 6/8 bars. A 2/4 bar has no grid of its own: join pairs of 2/4 bars into one 4/4 bar. A pickup (notes before the first downbeat) is a full bar with rests in front, e.g. `....D.` in 3/4.

## Song fields

| Field | Value |
| --- | --- |
| `title` | Required text, unique among the songs (two versions of a song need distinct titles). |
| `bpm` | Required whole number, 40 to 200: the beat you count. In 4/4 and 3/4 that is quarter notes a minute. In 6/8 it is the dotted-quarter pulse (1 and 4); the app plays a 6/8 song at bpm × 1.5 quarter notes a minute, so one eighth lasts 60 / bpm / 3 seconds. A chart giving ♪ = 180 in 6/8 is `bpm: 60`; a chart giving ♩ = 90 in 6/8 is `bpm: 60` too. |
| `capo` | Optional whole number, 0 to 7. Chord names and frets are the shapes played above the capo. |
| `beats` | Optional, 3 or 4. Default 4. |
| `compound` | Optional `true` for 6/8; needs `beats: 3`. Leave out otherwise. |
| `chords` | Optional block of the song's own chord shapes (below). |
| `bars` | Required list, at least one bar, in playing order. |

## Bar fields

Every bar has a `chord` and at least one of `strum` or `pluck`.

| Field | Value |
| --- | --- |
| `chord` | A chord name, or several separated by spaces to split the bar evenly. |
| `strum` | Exactly one character per slot, no spaces. |
| `pluck` | Exactly one entry per slot, separated by spaces. |
| `section` | Optional section name ("Intro", "Verse 1"), on the first bar of the section only. |
| `lyric` | Optional words sung in this bar, plain text. |
| `syllables` | Optional words timed to slots: one entry per slot, separated by spaces. |
| `tune` | Optional melody: one entry per slot, separated by spaces. |

### chord

- Every name must be in the library (`CHORDS` in `app/src/engine/chords.js`: today `G Em C D Dm Am E A F`) or in the song's `chords` block.
- Several names split the bar evenly: `"C E7"` in 4/4 is C on slots 1–4, E7 on 5–8. The number of names must divide the slot count: 1, 2, 4 (or 8) in 4/4; 1, 2, 3 (or 6) in 3/4 and 6/8. Repeat a name to hold it: `"G G G D"` in 4/4 changes to D on beat 4, `"C C C C C C C G"` on the last "&". In 3/4 the split is by slot, not by beat: `"Em D"` is Em on slots 1–3 and D from the "&" of 2; for a change on beat 3, write `"Em Em D"`. Only a change inside an eighth cannot be said.
- In a picked bar the chord is what the fretting hand shows and where a plain string number takes its fret.

### strum

Characters: `D` down, `U` up, `>` accented down, `x` chuck (muted hit), `.` the hand swings past without touching.

- In 4/4 and 3/4 the hand is a pendulum: `D` only on the numbers (slots 1, 3, 5, 7 counting from 1, i.e. even indexes from 0), `U` only on the "&". `>` and `x` may sit on any slot. `D.DUDU` and `D.DU.UDU` are valid; `DDU...` is not (the second `D` is on an "&").
- In 6/8 there is no pendulum: any slot may be `D` or `U`, and `>` and `x` are played as downs. The common pattern is `>DD>DD`.

### pluck

Each entry is one of:

- `.` rest.
- A string number, `6` (thickest, low E) to `1` (thinnest, high e). The fret comes from the bar's chord.
- Up to three different string numbers together, played at once: `53`, `521`. Not `5531` (four digits) or `55` (repeat).
- Notes with their own fret, `string:fret`, fret 0 to 20: `2:3` is string 2 at fret 3, `2:0` the open string. Join notes played together with `+`: `5:3+2:1`. A `+` group may mix in plain string numbers, which take the chord's fret: `5:3+2`.

A tab line reads straight across: the tab's top line is string 1. Example, a riff inside the C shape in 6/8: `2 2:0 3 2 2:3 2:5`.

### Mixed bar

A bar with both `strum` and `pluck` is mixed. Both are checked in full (the strum's pendulum too, in simple time). On each slot the strum plays where it hits; where the strum has `.`, the pluck entry plays. Write `.` in `pluck` wherever the strum hits.

```json
{"chord": "Am", "strum": "D.....D.", "pluck": ". 3 2 1 . 3 . 1"}
```

### lyric and syllables

Use one or the other in a bar. When `syllables` is present the app builds the bar's line from it and ignores `lyric`.

- `lyric`: the words sung in the bar. The first word is the word the bar's chord lands on; words sung before a section's first chord go on the bar before it.
- `syllables`: one entry per slot, `.` where nothing starts, a trailing `-` joins a syllable to the next one. `Jin- . gle . bells, . . .`. The engine checks only the entry count.

### tune

One entry per slot: a note with its octave, `A4` (440 Hz), `F#4`, `Bb3`, octaves 2 to 6; `.` holds the previous note; `_` is silence. A held note is its note then `.` entries: a dotted quarter in 3/4 is `G4 . .`.

## The chords block

Chord name → list of one or more fingerings. The first fingering is the shape shown for that chord in this song, and a library name given here overrides the library for this song.

```json
"chords": {
  "Bm": [{"name": "Barre, 2nd fret", "frets": [-1, 2, 4, 4, 3, 2], "fingers": [0, 1, 3, 4, 2, 1], "tip": "Finger 1 lies flat across five strings."}],
  "G":  [{"name": "Rock G", "frets": [3, -1, 0, 0, 3, 3], "fingers": [2, 0, 0, 0, 3, 4], "tip": "Finger 2 mutes the A string."}]
}
```

- The name must start with a note letter: `A`–`G`, optionally `#` or `b`. `D/F#`, `Cadd9`, `A(9)` are fine.
- `frets`: six whole numbers, thickest string first, `-1` not played, `0` open, up to 20.
- `fingers`: six numbers, 0 to 4 (1 index … 4 pinky). Every pressed string (fret > 0) needs a finger; every open or unplayed string has 0. A barre is the same finger on several strings.
- `name` and `tip` are not checked but the app shows them; give both.

## Things the format cannot say

Write the closest thing and report it. Known approximations:

| In the chart | Write |
| --- | --- |
| Hammer-on, pull-off, slide | The notes as separate picked notes on consecutive slots. |
| Bend, vibrato, harmonic | The plain note; report it. |
| Up-strum arrow over a chord in a fingerstyle tab | The chord's notes together in one `+` group. |
| Sixteenth notes | Two app bars per tab bar at double `bpm`, each of the tab bar's sixteenths one slot. The count and bar numbers read double. Only works when the doubled bpm is at most 200. |
| Repeats, endings, D.S., coda | Written out in full, in playing order. |
| Ritardando, fermata, tempo change | Left out; one `bpm` for the whole song. |
| Triplets in 4/4, swing | The nearest straight eighths. |

## Worked examples

4/4, strummed, a two-chord bar:

```json
{"title": "Example", "bpm": 90, "beats": 4, "bars": [
  {"chord": "G", "strum": "D.DU.UDU", "section": "Verse"},
  {"chord": "C D", "strum": "D.DUD.DU"}
]}
```

3/4 with a pickup and a timed melody (Happy Birthday):

```json
{"title": "Happy Birthday", "bpm": 96, "capo": 0, "beats": 3, "bars": [
  {"chord": "G", "strum": "....D.", "section": "Song", "syllables": ". . . . Hap- py", "tune": "_ . . . D4 D4"},
  {"chord": "G", "strum": "D.DUDU", "syllables": "birth- . day . to .", "tune": "E4 . D4 . G4 ."}
]}
```

6/8 with a riff intro and an own voicing:

```json
{"title": "Example 6/8", "bpm": 60, "capo": 4, "beats": 3, "compound": true,
 "chords": {"Am7": [{"name": "Open", "frets": [-1, 0, 2, 0, 1, 0], "fingers": [0, 0, 2, 0, 1, 0], "tip": "C shape with finger 3 lifted."}]},
 "bars": [
  {"chord": "C", "pluck": "2 2:0 3 2 2:3 2:5", "section": "Intro"},
  {"chord": "Am7", "strum": ">DD>DD", "section": "Verse"}
]}
```

Fingerstyle bar from a tab, 3/4, bass and melody together then broken notes:

```json
{"chord": "G", "pluck": "3:4+6:3 . 5:5 2:2 2:3 2:5"}
```
