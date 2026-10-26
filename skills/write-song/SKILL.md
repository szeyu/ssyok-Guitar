---
name: write-song
description: Chart a song into a song file for the guitar practice app (app/songs/*.json). Use when asked to add a song, convert a chart or tab, or fix a song.
---

# Write a song

A song is one JSON file in `app/songs/`, written by a python3 script in `app/songs/src/` that adds the song one bar per line. The format, field by field, is in [reference.md](reference.md); read it before writing bars.

## Rules

- **Chart the guitar part as the recording plays it**, in full: the intro riff, every passing chord, the chart's voicings, the real strum or picking pattern.
- **Work from what the user supplied**: a chord chart, an Ultimate Guitar screenshot, a fingerstyle tab. A melody (`tune`) comes only from a supplied tab or score; when one is wanted and none was given, ask for a tab. Words come only from lyrics the user supplied; without them, leave the word fields out.
- **One bar per line**: each bar is one `bar(...)` call in the script. Fix a song by editing its script and running it again, so script and file stay in step. A song with no script in `app/songs/src/` gets a small fix in its JSON directly; a larger one starts by writing its script.
- **Two versions** when there is a melody tab: the guitar part alone, and the version with the melody. Separate scripts, separate files; titles as the `title` row in reference.md says.
- **Capo and voicings as the chart says**, written as reference.md's `capo` row and `chord` section say.

## Steps

1. **Collect the sources.** Title, chart or tab, capo, time signature, tempo, and lyrics if given. Done when you can name the chord (or notes) under every bar of the chart. If the chart's bar count looks short or long for the song (a hymn of 15 bars after its pickup, a section one bar off its repeat), ask before guessing which bar is missing; say in the report how you read it.
2. **Pick the grid** from reference.md. Done when one bar of the chart, counted aloud, fills the slots exactly; a tab with sixteenth notes uses the approximation in reference.md.
3. **Write the script.** Copy [template.py](template.py) to `app/songs/src/<slug>.py`, set the slug and header, and write the bars in playing order, repeats written out, a `section` on the first bar of each section. Done when every bar of the chart has its own line and every section's bar count matches the chart.
4. **Run it.** `python3 app/songs/src/<slug>.py` from the repo root. Its asserts name the bar when a slot count is wrong. Done when it prints the bar count with no assertion error.
5. **Index it.** Add `"<slug>.json"` to `app/songs/index.json` (the order the library shows). The test only checks that indexed files exist, so a missing entry passes silently: done when the entry is there.
6. **Test it.** `node --test test/songs.test.js` from the repo root. Done when every test passes; an error names the bar and the field.

## Report

Tell the user the file, the script, the bar count, the capo, and every place the format could not say what the chart says, each with how it was approximated (see the list in reference.md). Name a gap even when it seems small: a slide, a bend, a ritardando, a tempo change, a repeat with endings.
