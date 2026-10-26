# 03: Song screen

**What to build:** Opening a song from the library shows its song screen, as in the Hum mockup. It has: the chords you need as chord boxes in the song's own voicings, with coloured finger numbers and "N ways to play it"; a picker for another fingering; "Suggest easiest fingerings"; each distinct strum pattern with its bar count, the one covering most of the song marked; the capo pills with a note on which fret sounds like the record; and the three Start choices (Learn the strum, Play it slowly at 70%, Play along as the primary action), plus Whole song and Edit song links and Songs to go back. The engine gains the logic behind it: voicing choice (your pick, then the song's preference, then the library's first), the easiest-fingering suggestion, the strum summary, and capo transposition of sounding chord names, including slash-chord basses.

**Blocked by:** 01 (App skeleton and library screen)

**Status:** ready-for-agent

- [ ] Every chord box draws the song's own shape where the song defines one
- [ ] A picked fingering replaces the song's shape on the screen
- [ ] Tests: the suggestion never picks a barre shape where an open one exists; the strum summary counts bars per pattern and marks one covering over half the bars; capo names transpose, slash basses included
- [ ] Esc on the song screen goes back to the library
- [ ] A screenshot matches the Hum mockup's song screen in layout and colour
