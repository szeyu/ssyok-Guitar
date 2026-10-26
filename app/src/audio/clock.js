// The one clock. AudioContext time is the only time there is: the sound is scheduled against it a little ahead, and the lane
// and the count-in read the position from it. Positions are in slots (eighth notes) and keep counting through a loop:
// engine/practice.js songSlot turns one into the song's slot.

const AHEAD = .25;   // seconds of notes queued in advance. ponytail: a tempo change or seek takes this long to be heard

let ctx;
/** The page's one AudioContext, made on first use (call it from a click, so the browser lets it sound). */
export const audioContext = () => (ctx ??= new AudioContext());

/**
 * A clock that calls play(slot, time, counting) for every slot as its time comes near: counting is true for the count-in
 * slots before the start. lap() is called each time the loop comes round and may return a new rate (slots a second).
 * Call tick() often while playing (every frame): it queues the next notes.
 */
export function createClock({ play, lap }) {
  let marks = [], next = 0, start = 0, startT = 0, loop = { a: 0, b: Infinity }, rate = 1, held = 0, playing = false;
  // the position is piecewise: from each mark on it runs at that mark's rate. A loop's wrap and a tempo change add a mark.
  const at = t => { let m = marks[0]; for (const x of marks) if (x.t <= t) m = x; return m.pos + (t - m.t) * m.rate; };
  const heard = () => ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);   // the moment reaching the ears now

  return {
    get playing() { return playing; },
    /** { pos, countLeft }: where the song is (held while paused), and slots of count-in still to go (0 once it is over). */
    now() {
      if (!playing) return { pos: held, countLeft: 0 };
      const t = heard(), p = at(t);
      return t < startT ? { pos: start, countLeft: start - p } : { pos: p, countLeft: 0 };
    },
    /** Starts from pos (rounded down to a slot) after lead slots of count-in. */
    start(pos, slotsPerSecond, lead) {
      audioContext();
      rate = slotsPerSecond; start = Math.floor(pos); next = start - lead;
      const t0 = ctx.currentTime + .06;
      startT = t0 + lead / rate; marks = [{ t: t0, pos: next, rate }]; playing = true;
    },
    stop() { if (playing) held = this.now().pos; playing = false; },
    /** Jumps to pos; playing carries on from there without a count-in. */
    seek(pos) {
      held = pos;
      if (!playing) return;
      const t = ctx.currentTime + .02;
      start = Math.ceil(pos); startT = t; next = start; marks = [{ t, pos, rate }];
    },
    setLoop(range) { loop = range; },
    setRate(slotsPerSecond) {
      rate = slotsPerSecond;
      if (!playing) return;
      const t = ctx.currentTime;
      marks.push({ t, pos: at(t), rate });
    },
    tick() {
      if (!playing) return;
      const end = ctx.currentTime + AHEAD;
      for (;;) {
        const m = marks.at(-1);
        if (next >= loop.b) {                                        // the loop comes round: carry on from its start, maybe faster
          const t = m.t + (loop.b - m.pos) / m.rate;
          if (t > end) break;
          rate = lap?.() ?? rate;
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
