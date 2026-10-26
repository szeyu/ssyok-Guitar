// The guitar sound: a string model for strums, picked notes and riffs, a chuck, the click on the pulse, and the melody voice.
// Everything is scheduled at an AudioContext time; nothing here knows about songs.

/** The open strings in standard tuning (E2 A2 D3 G3 B3 E4), thickest first. */
export const OPEN_HZ = [82.41, 110, 146.83, 196, 246.94, 329.63];
/** The pitch of string s (0 = thickest) at a fret (where the note sounds: the capo already added). */
export const stringHz = (s, fret) => OPEN_HZ[s] * 2 ** (fret / 12);

/** Karplus-Strong: a burst of noise goes round a delay line one string-period long, smoothed each lap, as a plucked string does.
 *  Returns seconds of samples at sampleRate, and the playback rate that tunes them to freq (the delay is whole samples). */
export function pluckString(freq, sampleRate, seconds = 2.5) {
  const sr = sampleRate, N = Math.max(2, Math.round(sr / freq + .5)), d = new Float32Array(Math.round(sr * seconds));
  let prev = 0;
  for (let i = 0; i < N; i++) prev = d[i] = .55 * (Math.random() * 2 - 1) + .45 * prev;     // slightly dulled noise: a softer pick
  for (let i = N; i < d.length; i++) d[i] = (d[i - N] + d[i - N + 1]) * .4985;               // each lap: average two samples, lose a little
  for (let i = 0, f = sr * .4; i < f; i++) d[d.length - 1 - i] *= i / f;                     // fade the tail so a long note ends without a click
  return { data: d, rate: freq * (N - .5) / sr };                                            // averaging d[i-N] and d[i-N+1] makes the period N - .5
}

/** A synth on ctx. Frets are where the note sounds (the capo already added). */
export function createSynth(ctx) {
  // strings -> guitar body (a low bump, soft top) -> volume -> limiter
  const out = ctx.createGain(), body = ctx.createBiquadFilter(), top = ctx.createBiquadFilter(), level = ctx.createGain();
  out.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);
  body.type = 'peaking'; body.frequency.value = 190; body.Q.value = .8; body.gain.value = 5;
  top.type = 'lowpass'; top.frequency.value = 5200; level.gain.value = .7;
  body.connect(top).connect(level).connect(out);

  // ponytail: one string model (pluckString) for every string; swap for recorded samples if it sounds thin.
  const bufs = new Map(), ringing = [];
  function pluckBuf(freq) {
    const key = Math.round(freq * 4);
    if (!bufs.has(key)) {
      const { data, rate } = pluckString(freq, ctx.sampleRate), buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.copyToChannel(data, 0);
      bufs.set(key, { buf, rate });
    }
    return bufs.get(key);
  }
  function twang(s, fret, t, vel) {
    const { buf, rate } = pluckBuf(stringHz(s, fret)), src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.playbackRate.value = rate; g.gain.setValueAtTime(vel * (.9 + .2 * Math.random()), t);
    ringing[s]?.gain.setTargetAtTime(0, t, .006);              // a string sounds one note at a time: the new pluck cuts the old one
    ringing[s] = g; src.connect(g).connect(body); src.start(t);
  }
  function blip(freq, t, gain, dur) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + .05);
  }

  return {
    /** A strum across frets (6 entries, thickest first, -1 = not played). Up strokes catch the treble strings; an accent is faster and harder. */
    strum(frets, dir, accent, t) {
      const order = dir === 'D' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2];
      const gap = accent ? .009 : dir === 'D' ? .015 : .012, vel = accent ? .85 : dir === 'D' ? .55 : .4;
      order.filter(s => frets[s] >= 0).forEach((s, i) => twang(s, frets[s], t + i * gap + (Math.random() - .5) * .004, vel));
    },
    /** Picked notes together: [{ s, fret }]. */
    pick(notes, t) { for (const { s, fret } of notes) twang(s, fret, t, .8); },
    /** A chuck: strings hit while muted, which also stops every ringing string. */
    chuck(t) {
      const n = Math.floor(ctx.sampleRate * .05), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1500; g.gain.value = .4;
      ringing.forEach(r => r?.gain.setTargetAtTime(0, t, .008));
      src.connect(f).connect(g).connect(out); src.start(t);
    },
    /** The click on the pulse; strong on the first of a bar. */
    click(t, strong) { blip(strong ? 1600 : 1000, t, .06, .04); },
    /** The melody voice: a soft sustained tone that stands out from the strumming. */
    sing(hz, t, dur) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = hz;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3, t + .02); g.gain.setValueAtTime(.3, t + dur * .8); g.gain.linearRampToValueAtTime(0, t + dur * .97);
      o.connect(g).connect(out); o.start(t); o.stop(t + dur);
    },
    /** Fades everything in (on) or out, as play and pause do. */
    volume(on) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, .015); },
  };
}
