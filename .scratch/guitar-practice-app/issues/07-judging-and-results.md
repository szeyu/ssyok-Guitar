# 07: Judging and results card

**What to build:** Tapping the down and up arrow keys while playing judges each tap against the nearest scheduled stroke. A verdict word rises off the hit line: Good; Early or Late by so many ms; Down here or Up here for the wrong direction; No strum here or Rest here where there is no stroke. Misses add up per bar. When the song ends, a paper results card shows the on-time percentage and the bar that gave you the most trouble. It offers Play again, A bit slower, Practise that bar (loops that bar) and Songs. The judging is pure engine logic, fed tap times and directions.

**Blocked by:** 04 (Player: sound and strum lane)

**Status:** done

- [x] Tests with fake tap times cover: a tap within the window is Good; outside it is Early or Late with the right ms; a wrong direction is caught; a tap over a pass gets "No strum here"; misses count per bar; the worst bar and percentage come out right
- [x] Practise that bar starts a one-bar loop on the worst bar
- [x] The ?verdict and ?done flags show the verdict words and the results card without playing

## Comments

Done in 19b26a6, with review fixes after. The Good window is ±90 ms. Taps are judged against the nearest stroke: a tap whose nearest slot is a pass or rest, within 90 ms of it, gets No strum here or Rest here; any other tap goes to the nearest stroke (direction, then timing). Misses include strokes played with no tap, so on-time % = strokes with a Good tap ÷ strokes played. A bit slower and Practise that bar both slow to 85% of the tempo just played (no slower than 40 bpm); Practise that bar then loops the worst bar. The whole song ends with the results card instead of looping; taps after its end are ignored.
