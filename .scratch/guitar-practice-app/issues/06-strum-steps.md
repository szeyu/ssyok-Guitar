# 06: Strum steps

**What to build:** "Learn the strum" on the song screen, and "Strum steps" in the player, step through the song's strum in stages over its first four bars. Each stage starts at 60 bpm (the 6/8 equivalent in compound time), and a stepper in the top bar shows the stage and lets you move between stages. The step sets follow the song's meter: 4/4, 3/4 or 6/8. The engine owns the step sets and how a stage maps onto the song's bars.

**Blocked by:** 04 (Player: sound and strum lane)

**Status:** done

- [x] Tests: every step in every meter's set is a valid strum for that meter; stage N maps onto the first four bars of the song
- [x] Leaving the steps returns to the whole song at the song's tempo
- [x] The ?drill= flag opens a stage directly

## Comments

- Done in 0046a97, with code-review fixes after it (stepper dots and "Now the song" as in the prototype, loop pills off while stepping, one `meterOf`, step objects from the engine, a meter-aware test of the step sets).
- Stage tempo is 60 on the dotted-quarter pulse in 6/8, as in the prototype. That makes the strokes 3 a second, against 2 a second in 4/4 and 3/4. 40 would match the stroke speed; left for the user to decide.
- A stage keeps only the chords and the step's strum: it drops the lyric, pluck, section and tune of its bars.
- Leaving the steps (Back to the whole song, Now the song, Strum steps again, or Esc) returns to the song at its own bpm.
- Both chords of a two-chord bar are kept in a stage (the prototype kept only the first): a deliberate improvement, so the stage changes chords where the song does.
