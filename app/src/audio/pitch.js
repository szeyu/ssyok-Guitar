// Pitch detection and strum onsets: the fundamental of a stretch of sound, how far it is from the nearest open string, and where
// in a buffer a strum starts. Pure: no audio objects, so node --test can run it on made-up buffers.
// ponytail: plain autocorrelation, as the prototype. Swap in YIN or similar if it proves flaky on real guitars.

const LOW_HZ = 70, HIGH_HZ = 1000, QUIET_RMS = .01;

/** The loudness (root mean square) of buf from sample from up to (not including) to. */
export function rms(buf, from = 0, to = buf.length) {
  let power = 0;
  for (let i = from; i < to; i++) power += buf[i] * buf[i];
  return Math.sqrt(power / (to - from));
}

/** The fundamental in Hz of buf (a Float32Array of samples at sampleRate), between 70 and 1000 Hz; null if it is too quiet
 *  or has no clear pitch. buf needs a little more than sampleRate / 70 samples (2048 at 44.1 kHz will do). */
export function detectPitch(buf, sampleRate) {
  const lo = Math.floor(sampleRate / HIGH_HZ), hi = Math.ceil(sampleRate / LOW_HZ), n = buf.length - hi - 1, corr = new Float64Array(hi + 2);
  if (n < hi || rms(buf, 0, n) < QUIET_RMS) return null;
  let max = 0;
  for (let lag = lo; lag <= hi + 1; lag++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += buf[i] * buf[i + lag];
    corr[lag] = sum; if (lag <= hi && sum > max) max = sum;
  }
  for (let l = lo + 1; l <= hi; l++) if (corr[l] > .9 * max && corr[l] >= corr[l - 1] && corr[l] >= corr[l + 1]) {   // the first strong peak, so the reading is not an octave low
    const bend = corr[l - 1] - 2 * corr[l] + corr[l + 1];
    return sampleRate / (l + (bend ? (corr[l - 1] - corr[l + 1]) / (2 * bend) : 0));   // a parabola through the peak finds it between samples
  }
  return null;
}

/** Onsets are found to within this many samples. */
export const ONSET_WINDOW = 256;

/** Where a strum starts in buf: the first sample of the first window louder than threshold and twice the window before it
 *  (the first window is compared with prevRms, the level before buf); -1 if there is none. */
export function findOnset(buf, prevRms, threshold) {
  let before = prevRms;
  for (let i = 0; i + ONSET_WINDOW <= buf.length; i += ONSET_WINDOW) {
    const level = rms(buf, i, i + ONSET_WINDOW);
    if (level > threshold && level > 2 * before) return i;
    before = level;
  }
  return -1;
}

/** Cents from ref Hz up to hz (negative: hz is flat). */
export const cents = (hz, ref) => 1200 * Math.log2(hz / ref);

/** The string (index into openHz, thickest first) whose open pitch is nearest hz, and how many cents off it hz is. */
export function nearestString(hz, openHz) {
  const off = openHz.map(f => cents(hz, f)), string = off.reduce((best, here, i) => Math.abs(here) < Math.abs(off[best]) ? i : best, 0);
  return { string, cents: off[string] };
}
