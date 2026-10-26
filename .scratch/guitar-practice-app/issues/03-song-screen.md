# 03: Song screen

**What to build:** Opening a song from the library shows its song screen, as in the Hum mockup. It has: the chords you need as chord boxes in the song's own voicings, with coloured finger numbers and "N ways to play it"; a picker for another fingering; "Suggest easiest fingerings"; each distinct strum pattern with its bar count, the one covering most of the song marked; the capo pills with a note on which fret sounds like the record; and the three Start choices (Learn the strum, Play it slowly at 70%, Play along as the primary action), plus Whole song and Edit song links and Songs to go back. The engine gains the logic behind it: voicing choice (your pick, then the song's preference, then the library's first), the easiest-fingering suggestion, the strum summary, and capo transposition of sounding chord names, including slash-chord basses.

**Blocked by:** 01 (App skeleton and library screen)

**Status:** done

- [x] Every chord box draws the song's own shape where the song defines one
- [x] A picked fingering replaces the song's shape on the screen
- [x] Tests: the suggestion never picks a barre shape where an open one exists; the strum summary counts bars per pattern and marks one covering over half the bars; capo names transpose, slash basses included
- [x] Esc on the song screen goes back to the library
- [x] A screenshot matches the Hum mockup's song screen in layout and colour

## Comments

Done in 9fa73c2, with review fixes in the following commit. Capo names now follow the sounding key: the song's first chord moved up by the capo, a minor chord counting as its relative major. Flat keys spell with flats, so Perfect at capo 1 reads Dbadd9. Picks and the chosen capo last only for the visit until ticket 09. The Start buttons and the Whole song / Edit song links are wired in tickets 04, 06 and 09. Perfect's strum list shows two "Pre-chorus, 16 bars" rows because two different patterns both first appear in the pre-chorus.
