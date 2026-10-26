# 05: 3D hands and chord box

**What to build:** The player's left side shows the two 3D views as dark windows set in paper frames. The fretting view has the guitar and a skinned hand that moves finger by finger into each chord shape, landing a moment before the chord sounds. Skipped strings are marked, and riff notes with their own fret are marked on the neck. The strumming view shows the strumming hand, with arrows for each stroke (solid for a hit, hollow for a pass) and struck strings that glow and shake. A floating paper chord box shows the current and next chord. Tools has Player's view (on: as you hold it; off: the audience's view) and Show the hand. On slow machines the views drop resolution down to half until frames keep up. The pixel ratio is capped at 1.5.

**Blocked by:** 04 (Player: sound and strum lane)

**Status:** done

- [x] The hand reaches each chord shape before the chord sounds, at full tempo
- [x] Multi-chord bars move the hand at each chord inside the bar
- [x] Riff-note markers appear on the right string and fret
- [x] Turning off Player's view mirrors both views; turning off Show the hand hides it
- [x] Quality drops when frames are slow (seen in the ?perf trace) and the player stays usable

## Comments

The hand's timing is in the engine (`handAt` in `engine/hand.js`, beside `playedAt`, what the strumming hand plays at a slot): it heads for the next *different* chord and lands 80 ms before that chord sounds (a quarter of the stretch at most), travelling over the last slot. Tests cover full tempo, two-chord bars, chords held over bars, and loop wrap. Riff marks come from `riffMarks` in `engine/song.js`, also tested. The 3D is in `views/scene/` (guitar, hand, strum, index with the governor). It loads lazily on first opening the player; without WebGL or offline the player carries on without it. Under swiftshader, `node tools/trace.js "<url>&go=1&perf"` shows the scale going 1 → 0.75 → 0.5, the frame gap going from ~60 ms to ~27 ms, and drawn strokes a median 15 ms late. The strumming view now shows the strumming hand too: the WebXR generic right hand, open and palm down, following the swinging stroke arrow (held still over the strings for picked bars; Show the hand hides it with the fretting hand; offline the arrow plays alone). URL flags: `view=audience`, `hand=0`, `perf`.

Review fixes: Player's view off turns both views round to the audience's side (headstock on the right, thickest string at the top), as the prototype and story 23 do; it does not mirror them, whatever the box above says. Under reduced motion the strum arrow stands still at the end of each stroke and a landing finger does not pop; the fretting hand still moves between chords. The governor also steps back up a quarter at a time, to the 1.5 cap, after 3 s of frames under 20 ms; `?perf` logs each step `down` or `up`.
