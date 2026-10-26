# 05: 3D hands and chord box

**What to build:** The player's left side shows the two 3D views as dark windows set in paper frames. The fretting view has the guitar and a skinned hand that moves finger by finger into each chord shape, landing a moment before the chord sounds. Skipped strings are marked, and riff notes with their own fret are marked on the neck. The strumming view shows the strumming hand, with arrows for each stroke (solid for a hit, hollow for a pass) and struck strings that glow and shake. A floating paper chord box shows the current and next chord. Tools has Player's view (on: as you hold it; off: the audience's view) and Show the hand. On slow machines the views drop resolution down to half until frames keep up. The pixel ratio is capped at 1.5.

**Blocked by:** 04 (Player: sound and strum lane)

**Status:** ready-for-agent

- [ ] The hand reaches each chord shape before the chord sounds, at full tempo
- [ ] Multi-chord bars move the hand at each chord inside the bar
- [ ] Riff-note markers appear on the right string and fret
- [ ] Turning off Player's view mirrors both views; turning off Show the hand hides it
- [ ] Quality drops when frames are slow (seen in the ?perf trace) and the player stays usable
