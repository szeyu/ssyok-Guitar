# 06: Strum steps

**What to build:** "Learn the strum" on the song screen, and "Strum steps" in the player, step through the song's strum in stages over its first four bars. Each stage starts at 60 bpm (the 6/8 equivalent in compound time), and a stepper in the top bar shows the stage and lets you move between stages. The step sets follow the song's meter: 4/4, 3/4 or 6/8. The engine owns the step sets and how a stage maps onto the song's bars.

**Blocked by:** 04 (Player: sound and strum lane)

**Status:** ready-for-agent

- [ ] Tests: every step in every meter's set is a valid strum for that meter; stage N maps onto the first four bars of the song
- [ ] Leaving the steps returns to the whole song at the song's tempo
- [ ] The ?drill= flag opens a stage directly
