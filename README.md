# Guitar practice

A browser app for practising songs on guitar. Pick a song, see its chord shapes and strum, then play along with a falling strum lane, a 3D fretting hand and a strumming hand. The app judges your timing from the keyboard or the microphone.

It's for personal practice. Nothing is sold.

## Run it

The app is plain JavaScript with no build step and no npm packages. Serve the repo root and open `/app/`. This little server tells the browser not to cache, so a plain reload always picks up changes:

```sh
node tools/serve.js
# then open http://localhost:8765/app/
```

Opening `app/index.html` straight from disk won't work, because the browser blocks it from reading the songs folder.

It needs a network connection for the font, three.js and the hand models (from jsDelivr). Offline, the hands show as dots.

## What it does

- **Library and song screen:** chord boxes, fingering choices, the main strum, and a capo that respells chords in the song's key.
- **Player:**
  - a strum lane that stays in time with the sound
  - tempo from 40 to 140
  - loops for one bar or one chord change, and "Speed up each loop"
  - a section timeline you can click
- **3D views:** the fretting hand reaches each chord just before it sounds, and the camera follows it up the neck. There's also a strumming hand and a floating chord box.
- **Strum steps:** teaches the song's strum in stages over its first four bars.
- **Judging:**
  - the arrow keys or "Listen to me" (the microphone) give verdicts like "Late 40 ms"
  - a results card at the end shows your score and the bar to practise
- **Tuner:** shows each string's offset in cents.
- **Song builder:**
  - add or edit songs, or paste lyrics or a song file
  - each song remembers your picks, capo and last bar
  - a whole-song sheet

## Layout

```
app/
  index.html
  styles/            tokens.css (the Hum theme) and app.css
  src/
    main.js          start-up and routing
    store.js         loading songs, saved songs, per-song memory
    engine/          song model, chords, practice steps, judging, lyrics, editing, hand poses (no DOM; tested)
    audio/           clock, synth, mic, pitch detection
    screens/         library, song, player, results, tuner, builder, sheet
    views/           DOM helpers, strum lane, chord box, 3D scene
  songs/             one JSON file per song, listed in index.json
    src/             python3 scripts that write some song files bar by bar
skills/write-song/   how to chart a song into the song format (see reference.md)
test/                node:test suites
tools/               screenshot and timing scripts
```

## Add a song

Follow [skills/write-song/SKILL.md](skills/write-song/SKILL.md). The format is in [skills/write-song/reference.md](skills/write-song/reference.md). Each song is written by a python3 script, one bar per line, and then listed in `app/songs/index.json`. You can also paste a song into the builder in the app.

## Test

```sh
node --test
```

The tests cover the song engine, pitch detection and storage.

## Tools

Both tools need Chrome or Chromium on your PATH, or set `$CHROME` to point at it.

- `node tools/screenshots.js` takes a screenshot of every screen state in headless Chrome and saves them to `shots/`. If nothing is serving the repo, it starts its own server.
- `node tools/trace.js "<url>&log"` plays a song in real time and reports how far the lane falls behind the sound. Use `&perf` instead of `&log` for 3D frame times.

### URL flags

These flags open a state directly, for checking or screenshots. Songs are numbered from 0 in library order, so `?song=2` is the third song. The full list is at the top of `app/src/main.js`.

| Example | Opens |
|---|---|
| `?song=2` | that song's song screen |
| `?song=2&play=1&at=7` | the player, paused at bar 7 (add `&go=1` to start playing) |
| `?song=2&drill=2` | strum step 2 |
| `?song=2&done=1` | the results card, from a made-up run |
| `?song=2&play=1&tuner=1` | the tuner with made-up readings |
| `?build=1` | the song builder |
| `?song=2&sheet=1` | the whole-song sheet |

## Licence

Apache 2.0, see [LICENSE](LICENSE).
