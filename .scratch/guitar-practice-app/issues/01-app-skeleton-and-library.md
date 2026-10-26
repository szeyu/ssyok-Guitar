# 01: App skeleton and library screen

**What to build:** Stand up the app in its own folder, laid out as the spec's "Language and layout" section describes: plain JavaScript ES modules, no build step, with three.js pinned in an import map. The Hum design tokens go in one stylesheet. The song engine starts with song-file validation and the slot queries: bar, chord (several per bar split evenly), stroke, count label, syllable and melody note. The song files and their Python scripts move into the app's songs folder. Opening the app shows the library screen: song cards in the index's order, each with tempo, capo, time signature, bar count, chord chips and main strum. Any file that fails validation is named in a note below.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The app opens from a plain static server with no build step and shows the library in the Hum look
- [ ] The song engine has no DOM, audio or 3D imports
- [ ] Node's test runner passes, with no dependencies installed. Tests cover: validation errors (bad bpm, unknown chord, wrong slot count, wrong-direction stroke in simple time, a 3-beat bar with 8 strokes); picked, mixed and riff-note bars; two chords in a bar; timed vs plain lyrics; note-name pitches
- [ ] Every song file in the songs folder passes validation in a test
- [ ] A deliberately broken song file is skipped and named in the library note
- [ ] The prototype folder is unchanged
