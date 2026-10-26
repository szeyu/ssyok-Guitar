// The one clock. AudioContext time is the only time there is: the sound is scheduled against it a little ahead, and the lane
// and the count-in read the position from it. Positions are in slots (eighth notes) and keep counting through a loop:
// engine/practice.js songSlot turns one into the song's slot.

const AHEAD = .25;   // seconds of notes queued in advance. ponytail: a tempo change or seek takes this long to be heard

let ctx;
/** The page's one AudioContext, made on first use (call it from a click, so the browser lets it sound). */
export const audioContext = () => (ctx ??= new AudioContext());

/** The audio time reaching the ears now: the context's time less the output latency. */
export const heardTime = () => ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);

/**
 * A clock that calls play(slot, time, counting) for every slot as its time comes near: counting is true for the count-in
 * slots before the start. lap(time) is called as each wrap of the loop is queued, with the audio time it will sound at, and
 * may return a new rate (slots a second), or 0 to end there instead: nothing more is queued, and over turns true once the
 * end is heard.
 * Call tick() often while playing (every frame): it queues the next notes.
 */
export function createClock({ play, lap }) {
  let marks = [], next = 0, start = 0, startT = 0, loop = { a: 0, b: Infinity }, rate = 1, held = 0, playing = false, endT = Infinity;
  // the position is piecewise: from each mark on it runs at that mark's rate. A loop's wrap and a tempo change add a mark.
  const posAt = time => { let m = marks[0]; for (const mark of marks) if (mark.t <= time) m = mark; return m.pos + (time - m.t) * m.rate; };

  return {
    get playing() { return playing; },
    /** True once the end a lap asked for has been heard (while still playing: stop it). */
    get over() { return playing && heardTime() >= endT; },
    /** { pos, countLeft }: where the song is (held while paused), and slots of count-in still to go (0 once it is over);
     *  ago seconds back, for a key pressed a moment before. */
    now(ago = 0) {
      if (!playing) return { pos: held, countLeft: 0 };
      const t = Math.min(heardTime() - ago, endT), p = posAt(t);
      return t < startT ? { pos: start, countLeft: start - p } : { pos: p, countLeft: 0 };
    },
    /** Starts from pos (rounded down to a slot) after lead slots of count-in. */
    start(pos, slotsPerSecond, lead) {
      audioContext();
      rate = slotsPerSecond; start = Math.floor(pos); next = start - lead;
      const t0 = ctx.currentTime + .06;
      startT = t0 + lead / rate; marks = [{ t: t0, pos: next, rate }]; playing = true; endT = Infinity;
    },
    stop() { if (playing) held = this.now().pos; playing = false; },
    /** Jumps to pos; playing carries on from there without a count-in. */
    seek(pos) {
      held = pos;
      if (!playing) return;
      const t = ctx.currentTime + .02;
      start = Math.ceil(pos); startT = t; next = start; marks = [{ t, pos, rate }]; endT = Infinity;
    },
    setLoop(range) { loop = range; },
    setRate(slotsPerSecond) {
      rate = slotsPerSecond;
      if (!playing) return;
      const t = ctx.currentTime, pos = posAt(t);
      marks.push({ t, pos, rate });
      if (t < startT) startT = t + (start - pos) / rate;               // in the count-in: the first stroke lands later or sooner
    },
    tick() {
      if (!playing || endT < Infinity) return;
      const end = ctx.currentTime + AHEAD;
      for (;;) {
        const m = marks.at(-1);
        if (next >= loop.b) {                                        // the loop comes round: carry on from its start, maybe faster
          const t = m.t + (loop.b - m.pos) / m.rate;
          if (t > end) break;
          const r = lap?.(t) ?? rate;
          if (!r) { endT = t; break; }
          rate = r;
          marks.push({ t, pos: loop.a, rate }); next = loop.a;
          continue;
        }
        const t = m.t + (next - m.pos) / m.rate;
        if (t > end) break;
        play(next, t, next < start && t < startT);
        next++;
      }
      const old = ctx.currentTime - 2;                                // keep only the marks still needed to place the drawn position
      while (marks.length > 1 && marks[1].t < old) marks.shift();
    },
  };
}
