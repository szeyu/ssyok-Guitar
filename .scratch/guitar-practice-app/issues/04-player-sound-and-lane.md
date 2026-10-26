# 04: Player: sound and strum lane

**What to build:** Play along, or Play it slowly, opens the player. One audio clock drives everything. A one-bar count-in with big numbers comes first, then the song sounds: strums, picked notes and riff notes from the string model, chucks, a click on the pulse, and the melody voice when the song has a tune and Melody is on. The strum lane draws on the kraft strip:
- strokes falling to the ink hit line
- tiles covering only the strings the chord plays
- fret numbers once per chord
- distinct accents, chucks, passes and picks; downs and ups in different colours
- the next chord swelling as it arrives
- the count beside each row
- the words under the line, lighting up as sung, with the next line below

The transport has back-to-start, play/pause (Space), tempo (dotted-quarter pulse shown in 6/8), loop pills (whole song, this bar, this chord change) and a Tools menu with "Speed up each loop". The top bar shows the song and its section timeline, which you can click to jump. Clicking the lane seeks.

**Blocked by:** 03 (Song screen)

**Status:** done

- [x] Tests: loops over the last bar wrap to the first; a chord-change loop covers the two chords; speed-up adds 5 bpm per loop
- [x] Sound, lane and count-in stay in step at 40 and 140 bpm (checked by ear and with the ?log trace)
- [x] Nothing renders while the player is hidden or paused and idle
- [x] Esc closes the Tools menu
- [x] A mid-song screenshot matches the Hum mockup's lane

## Comments

Done in 8a4f736, with review fixes in the following commit. Timing, measured with `node tools/trace.js` on Perfect: drawn strokes land 5–9 ms after their scheduled time (median), at most 32 ms, at both 40 and 140 bpm. That's within one or two frames. The by-ear check is still the user's. The chord-change loop runs from the start of the current chord's stretch through the end of the next chord's, so the change is always heard. The tempo range is 40–140 bpm. Until ticket 07 the whole-song loop repeats and speeds up each time round. URL flags for checks: `play=1`, `at=<bar>`, `tools=1`, `bpm=`, `go=1`, `log`.
