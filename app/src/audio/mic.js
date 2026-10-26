// The microphone: strum onsets (a jump in loudness) and the pitch it hears, for Listen to me and the tuner. The mic is open
// while either wants it, and closed (the browser's recording light off) when neither does.
import { audioContext } from './clock.js';
import { detectPitch } from './pitch.js';

/** Seconds from a strum to the app hearing it through the microphone. Fixed: calibrating it per device is out of scope.
 *  ponytail: a rough allowance (the prototype's 40 ms); add a calibration step if verdicts read late on real devices. */
export const MIC_LATENCY = .04;
const ONSET_RMS = .03, ONSET_JUMP = 2, ONSET_GAP = .12;   // an onset: louder than this, twice the running level, and 120 ms after the last
const RECENT = 512;                                        // onsets look at the newest samples only, so they are not smeared over the window

const want = { onset: null, pitch: null };
let opening, stream, analyser, buf, raf = 0, level = 0, last = 0;

/** Starts listening for kind ('onset': fn(ago) on each strum heard, ago in seconds; 'pitch': fn(hz or null) each frame),
 *  or with fn null stops it. Resolves false if the microphone is refused or missing, and that listener is dropped. */
export async function listen(kind, fn) {
  want[kind] = fn;
  if (!want.onset && !want.pitch) { close(); return true; }
  if (!fn) return true;
  try {
    await (opening ??= open());
    return true;
  } catch {
    opening = null; want[kind] = null;
    return false;
  }
}

async function open() {
  const ctx = audioContext();
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  await ctx.resume();
  analyser = ctx.createAnalyser(); analyser.fftSize = 4096; buf = new Float32Array(analyser.fftSize);
  ctx.createMediaStreamSource(stream).connect(analyser);
  if (!want.onset && !want.pitch) return close();          // turned off again while the browser was asking
  raf = requestAnimationFrame(hear);
}

function close() {
  cancelAnimationFrame(raf); raf = 0;
  stream?.getTracks().forEach(t => t.stop());
  opening = stream = analyser = null;
}

function hear() {
  raf = requestAnimationFrame(hear);
  analyser.getFloatTimeDomainData(buf);
  if (want.onset) {
    let p = 0;
    for (let i = buf.length - RECENT; i < buf.length; i++) p += buf[i] * buf[i];
    const rms = Math.sqrt(p / RECENT), now = analyser.context.currentTime;
    if (rms > ONSET_RMS && rms > level * ONSET_JUMP && now - last > ONSET_GAP) { last = now; want.onset(MIC_LATENCY); }
    level += (rms - level) * .2;
  }
  want.pitch?.(detectPitch(buf, analyser.context.sampleRate));
}
