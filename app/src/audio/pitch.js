// Pitch detection: the fundamental of a stretch of sound, and how far it is from the nearest open string. Pure: no audio
// objects, so node --test can run it on made-up buffers.
// ponytail: plain autocorrelation, as the prototype. Swap in YIN or similar if it proves flaky on real guitars.

const LOW_HZ = 70, HIGH_HZ = 1000, QUIET_RMS = .01;

/** The fundamental in Hz of buf (a Float32Array of samples at sampleRate), between 70 and 1000 Hz; null if it is too quiet
 *  or has no clear pitch. buf needs a little more than sampleRate / 70 samples (2048 at 44.1 kHz will do). */
export function detectPitch(buf, sampleRate) {
  const lo = Math.floor(sampleRate / HIGH_HZ), hi = Math.ceil(sampleRate / LOW_HZ), n = buf.length - hi - 1, c = new Float64Array(hi + 2);
  if (n < hi) return null;
  let power = 0, max = 0;
  for (let i = 0; i < n; i++) power += buf[i] * buf[i];
  if (Math.sqrt(power / n) < QUIET_RMS) return null;
  for (let lag = lo; lag <= hi + 1; lag++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += buf[i] * buf[i + lag];
    c[lag] = sum; if (lag <= hi && sum > max) max = sum;
  }
  for (let l = lo + 1; l <= hi; l++) if (c[l] > .9 * max && c[l] >= c[l - 1] && c[l] >= c[l + 1]) {   // the first strong peak, so the reading is not an octave low
    const bend = c[l - 1] - 2 * c[l] + c[l + 1];
    return sampleRate / (l + (bend ? (c[l - 1] - c[l + 1]) / (2 * bend) : 0));   // a parabola through the peak finds it between samples
  }
  return null;
}

/** Cents from ref Hz up to hz (negative: hz is flat). */
export const cents = (hz, ref) => 1200 * Math.log2(hz / ref);

/** The string (index into openHz, thickest first) whose open pitch is nearest hz, and how many cents off it hz is. */
export function nearestString(hz, openHz) {
  const off = openHz.map(f => cents(hz, f)), s = off.reduce((b, c, i) => Math.abs(c) < Math.abs(off[b]) ? i : b, 0);
  return { s, cents: off[s] };
}
