// The microphone: strum onsets (a jump in loudness) and the pitch it hears, for Listen to me and the tuner. The mic is open
// while either wants it, and closed (the browser's recording light off) when neither does.
import { audioContext } from './clock.js';
import { detectPitch, findOnset, rms, ONSET_WINDOW } from './pitch.js';

/** Seconds from a strum to the app hearing it through the microphone. Fixed: calibrating it per device is out of scope.
 *  ponytail: a rough allowance (the prototype's 40 ms); add a calibration step if verdicts read late on real devices. */
export const MIC_LATENCY = .04;
const ONSET_RMS = .03, ONSET_GAP = .12;   // an onset: louder than this, twice the level before, and 120 ms after the last

let onsetFn = null, pitchFn = null, asking = null, stream = null, analyser, buf, raf = 0, level = 0, lastOnset = -Infinity;
const wanted = () => Boolean(onsetFn || pitchFn);

/** Calls fn(ago) for each strum heard, ago the seconds since it was played; fn null stops. Resolves false if the
 *  microphone is refused or missing (fn is then dropped). */
export function onOnset(fn) { onsetFn = fn; return update(fn); }
/** Calls fn(hz or null) with the pitch heard each frame; fn null stops. Resolves as onOnset. */
export function onPitch(fn) { pitchFn = fn; return update(fn); }

async function update(fn) {
  if (!wanted()) { close(); return true; }
  if (!fn) return true;
  try {
    await open();
    return true;
  } catch {
    if (onsetFn === fn) onsetFn = null;
    if (pitchFn === fn) pitchFn = null;
    return false;
  }
}

// one request at a time: turning it off and on while the browser asks waits for the same answer, and a stream that
// arrives when nobody wants it any more is stopped at once, so there is never a second stream or loop
async function open() {
  if (stream) return;
  asking ??= navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    .finally(() => { asking = null; });
  const got = await asking;
  if (stream === got) return;                                    // another caller waiting on the same answer set it up
  if (!wanted()) return got.getTracks().forEach(t => t.stop());  // turned off again while the browser was asking
  const ctx = audioContext();
  ctx.resume();
  stream = got;
  analyser = ctx.createAnalyser(); analyser.fftSize = 4096; buf = new Float32Array(analyser.fftSize);
  ctx.createMediaStreamSource(stream).connect(analyser);
  raf = requestAnimationFrame(readFrame);
}

function close() {
  cancelAnimationFrame(raf); raf = 0;
  stream?.getTracks().forEach(t => t.stop());
  stream = analyser = null;
}

// each frame: the newest 4096 samples; a strum is timed by where it starts in them, not by when this frame saw it
function readFrame() {
  raf = requestAnimationFrame(readFrame);
  analyser.getFloatTimeDomainData(buf);
  const { currentTime, sampleRate } = audioContext();
  if (onsetFn) {
    const at = findOnset(buf, level, ONSET_RMS), age = (buf.length - at) / sampleRate;
    if (at >= 0 && currentTime - age - lastOnset > ONSET_GAP) { lastOnset = currentTime - age; onsetFn(MIC_LATENCY + age); }
    level = rms(buf, buf.length - ONSET_WINDOW);
  }
  pitchFn?.(detectPitch(buf, sampleRate));
}
