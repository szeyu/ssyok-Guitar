# 11: Camera follows the hand up the neck

**What to build:** The fretting camera follows the hand along the neck, so notes high up the neck stay in view (frets 9 to 15 in the D-major Always With Me). It eases back to the nut for open chords. It frames the frets the current bar uses, eased so it does not jitter between bars.

**Blocked by:** 05 (3D hands and chord box)

**Status:** done

- [x] In the D-major Always With Me, bars at frets 9 to 15 show the hand and the marked notes in frame
- [x] Open-chord songs look as before
- [x] The camera moves smoothly with no jumps at bar lines

## Comments

Done in ab093b7, with review fixes after. The camera is a critically damped spring (ω = 8/s), stepped by real time, so it never overshoots and moves the same at any frame rate. It aims at the bar 0.5 s ahead, so it arrives with the hand. The framing (`cameraTarget`, engine/hand.js) keeps the bar's highest fret within 13 cm of where the nut sits in the open framing, so the right of the window stays clear for the floating chord box. With reduced motion it cuts at the bar. Checked at 1280×800 in Always With Me bars 41, 44, 46 (fret 15 on high e) and 48 (D(10)): every marked note and the hand are in frame and clear of the chord box. Perfect at bar 7 looks as before. The tops of the raised fingers touch the window's top edge high up the neck; the camera height was left alone so open-chord framing stays the same.
