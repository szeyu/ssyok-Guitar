# 08: Microphone and tuner

**What to build:** "Listen to me" in Tools asks for the microphone and judges real strums. It detects onsets and sends them through the same judging as the arrow keys, so the verdicts and the results card behave the same. It advises headphones, and if access is refused it says so in plain words. The Tuner in Tools shows how far each string is from its pitch. The latency offset stays fixed (calibration is out of scope).

**Blocked by:** 07 (Judging and results card)

**Status:** ready-for-agent

- [ ] Tests: pitch detection reads a 110 Hz and a 329.6 Hz sine within tolerance; the string model plays in tune
- [ ] A refused microphone shows a plain message and the app keeps working
- [ ] Mic verdicts and key verdicts come from the same judging code
