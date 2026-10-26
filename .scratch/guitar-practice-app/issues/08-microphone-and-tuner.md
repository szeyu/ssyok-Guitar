# 08: Microphone and tuner

**What to build:** "Listen to me" in Tools asks for the microphone and judges real strums. It detects onsets and sends them through the same judging as the arrow keys, so the verdicts and the results card behave the same. It advises headphones, and if access is refused it says so in plain words. The Tuner in Tools shows how far each string is from its pitch. The latency offset stays fixed (calibration is out of scope).

**Blocked by:** 07 (Judging and results card)

**Status:** done

- [x] Tests: pitch detection reads a 110 Hz and a 329.6 Hz sine within tolerance; the string model plays in tune
- [x] A refused microphone shows a plain message and the app keeps working
- [x] Mic verdicts and key verdicts come from the same judging code

## Comments

Done in 9fee0f2, with review fixes after. The string model was up to 13 cents sharp (the playback rate assumed a period of N + .5 samples; it is N - .5) and is now in tune. Pitch tolerance in the tests is ±5 cents. MIC_LATENCY is a fixed 40 ms (calibration is out of scope). A strum's onset time includes the sample's age in the microphone buffer, so it does not depend on when the frame noticed it. The tuner ignores readings more than 250 cents from every string.
