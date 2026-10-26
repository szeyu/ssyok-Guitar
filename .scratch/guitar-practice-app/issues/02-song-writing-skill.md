# 02: Song-writing skill

**What to build:** Add the project's own skill folder at the repo root, separate from the installed skills, holding the skill that teaches an agent to chart a song into a song file. It carries the charting rules from the spec: the recording's guitar part, work from a supplied chart or tab, never guess a melody, one bar per line in a Python script, two versions (guitar alone and with melody), capo, own voicings, user-supplied lyrics only, report approximations, add to the index. It also carries the format reference (field by field, with the grid rules) and a starting Python template. Prove it by having a fresh agent use only the skill to chart a short song from a supplied chart.

**Blocked by:** 01 (App skeleton and library screen)

**Status:** done

- [x] The skill has a description that triggers on adding, converting or fixing a song
- [x] The format reference matches what the engine validates today: strum, pluck with string:fret and +, mixed bars, multi-chord bars, the chords block, sections, lyrics, syllables, tune, compound 6/8
- [x] The template writes a valid song file when run, one bar call per line
- [x] The skill tells the agent to run the song-file test before handing back, and to list what the format could not express
- [x] A fresh agent given only the skill and a short chart produces a song file that passes the test

## Comments

Done in 03ce467. A fresh agent given only the skill and an Amazing Grace chart (public domain, 3/4) produced a song file that passed `node --test test/songs.test.js`; its notes (a two-chord bar splits by slot in 3/4; ask when a chart's bar count looks off) were folded into the skill. The trial song was removed.
