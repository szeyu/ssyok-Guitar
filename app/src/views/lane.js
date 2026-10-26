// The strum lane: a canvas on the kraft strip where strokes fall to the ink hit line, thickest string on the left.
// Every colour and font is read from the tokens on :root, so nothing here names one.
import { slotAt, slotsPerBar } from '../engine/song.js';
import { barChords } from '../engine/chords.js';
import { songSlot, countIn } from '../engine/practice.js';

const ROW = 50, BELOW = 76;                                   // pixels per slot; room under the hit line for the string names
const PIMA = 'pppima';                                        // the picking finger for each string: thumb on the three bass strings
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let T;                                                        // the tokens, read once the stylesheet is in
const tokens = () => T ??= Object.fromEntries(['ink', 'ink-2', 'bg', 'coral', 'brass', 'brass-deep', 'link', 'lane', 'lane-str', 'stroke-d', 'stroke-u', 'pluck', 'chuck', 'ui']
  .map(n => [n.replace('-', ''), css('--' + n)]));
const tab = f => f < 0 ? '×' : String(f);

// where the strings and the hit line sit in a lane w by h
function layout(w, h) {
  const right = 74, x0 = Math.max(70, Math.min(104, w * .26)), gap = Math.min(48, (w - x0 - right - 18) / 5);
  return { hit: h - BELOW, colX: s => x0 + gap * s, right: w - right };
}

// an arrow for a stroke: solid for a hit, dashed for a pass
function arrow(g, x, y, dir, size, dashed) {
  const s = dir === 'D' ? 1 : -1, l = size / 2;
  g.save(); g.lineWidth = size > 18 ? 2.8 : 2.2; g.lineCap = g.lineJoin = 'round'; if (dashed) g.setLineDash([3, 4]);
  g.beginPath(); g.moveTo(x, y - s * l); g.lineTo(x, y + s * l); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(x - l * .5, y + s * l * .4); g.lineTo(x, y + s * l); g.lineTo(x + l * .5, y + s * l * .4); g.stroke(); g.restore();
}

/**
 * Draws the lane at a position (fractional slot, as the clock counts it through the loop).
 * frets(chord) gives the fingering's frets; countLeft is the count-in still to go, in slots (0 when over).
 */
export function drawLane(cv, { song, loop, pos, countLeft, frets }) {
  const P = tokens(), font = (wt, px) => `${wt} ${px}px ${P.ui}`;
  const dpr = Math.min(devicePixelRatio, 2), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.textBaseline = 'middle';
  const { hit, colX, right } = layout(w, h), per = slotsPerBar(song), cur = Math.floor(pos + 1e-6), Y = i => hit - (i - pos) * ROW;
  const at = i => slotAt(song, songSlot(song, loop, i));

  for (let s = 0; s < 6; s++) {                               // the strings, thick to thin
    g.strokeStyle = P.lanestr; g.globalAlpha = .55; g.lineWidth = 3.2 - s * .42;
    g.beginPath(); g.moveTo(colX(s), 0); g.lineTo(colX(s), h - 34); g.stroke();
  }
  g.globalAlpha = 1;
  g.save(); g.beginPath(); g.rect(0, 0, w, hit + 26); g.clip();

  const first = Math.max(0, cur - 1), last = Math.ceil(pos + hit / ROW) + 1;
  for (let i = first; i <= last; i++) {
    const x = at(i), k = x.stroke, y = Y(i), si = songSlot(song, loop, i) % per, prev = i > 0 ? at(i - 1) : null;
    const now = i === cur && !countLeft, fr = frets(x.chord);
    const segLen = per / barChords(song.bars[x.bar]).length, s0 = si - si % segLen, change = !prev || prev.chord !== x.chord;
    g.globalAlpha = i < cur ? .2 : 1;

    if (si === s0) {                                          // a chord's stretch of the bar: a rule, its name, maybe its section
      g.save(); g.strokeStyle = P.lanestr; g.globalAlpha *= .6; g.lineWidth = 1.5; g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(0, y + 25); g.lineTo(w, y + 25); g.stroke(); g.restore();
      const grow = change && i > pos ? Math.max(0, 1 - (i - pos) / per) : 0;   // the next chord swells as it arrives
      g.save(); if (grow > .4) { g.shadowColor = P.brass; g.shadowBlur = 20 * grow; }
      g.fillStyle = change ? P.ink : P.lanestr; g.font = font(600, Math.round((change ? 23 : 19) * (1 + .3 * grow))); g.textAlign = 'left';
      g.fillText(x.chord, 14, y, colX(0) - 22); g.restore();
      const section = si === 0 && song.bars[x.bar].section;
      if (section) { g.fillStyle = P.ink2; g.font = font(600, 12); g.textAlign = 'left'; g.fillText(section, 14, y - 24, colX(0) - 22); }
    }

    if (k.pluck && k.hit) {                                   // picked notes: a dot on each string with its fret
      for (const s of k.pluck) {
        g.fillStyle = P.pluck; g.beginPath(); g.arc(colX(s), y, now ? 17 : 15, 0, 7); g.fill();
        if (now) { g.strokeStyle = P.ink; g.lineWidth = 3; g.stroke(); }
        g.fillStyle = P.ink; g.font = font(700, 15); g.textAlign = 'center'; g.fillText(tab(k.fret[s] ?? fr[s]), colX(s), y + 1);
      }
    } else if (k.hit) {                                       // a strum: a card-stock tile over just the strings the chord plays
      const lo = k.chuck ? 0 : Math.max(0, fr.findIndex(f => f >= 0)), a = colX(lo) - 23, b = colX(5) + 18, th = k.accent ? 40 : 34;
      const col = k.chuck ? P.chuck : k.dir === 'U' ? P.strokeu : P.stroked, edge = k.chuck ? P.ink2 : k.dir === 'U' ? P.link : P.brassdeep;
      const top = y - th / 2 + (now ? 3 : 0), alpha = g.globalAlpha;
      g.fillStyle = edge; g.globalAlpha = alpha * (k.accent ? 1 : .45); g.beginPath(); g.roundRect(a, top + (now ? 1 : k.accent ? 4 : 3), b - a, th, 12); g.fill();
      g.globalAlpha = alpha; g.fillStyle = P.lane; g.beginPath(); g.roundRect(a, top, b - a, th, 12); g.fill();
      g.fillStyle = col; g.globalAlpha = alpha * (k.accent || now || k.chuck ? 1 : .55); g.fill(); g.globalAlpha = alpha;
      if (now) { g.strokeStyle = P.ink; g.lineWidth = 3; g.stroke(); }
      const firstHit = !Array.from({ length: si - s0 }, (_, n) => at(i - 1 - n).stroke).some(q => q.hit && !q.pluck && !q.chuck);
      if (k.chuck || firstHit) {                              // fret numbers once per chord, on its first stroke; × on strings not played
        g.font = font(600, 17); g.textAlign = 'center';
        fr.forEach((f, s) => {
          if (k.chuck || f < 0) { g.fillStyle = P.coral; g.fillText('×', colX(s), y + (k.chuck ? 1 : 0)); }
          else { g.fillStyle = P.ink; g.fillText(tab(f), colX(s), top + th / 2 + 1); }
        });
      }
    }

    // the count beside each row, with the stroke's direction (or the picking fingers)
    g.textAlign = 'center'; g.font = font(k.accent || now ? 600 : 500, 13);
    if (now) { g.fillStyle = P.ink; g.beginPath(); g.arc(right + 22, y, 11, 0, 7); g.fill(); g.fillStyle = P.bg; }
    else g.fillStyle = k.accent ? P.ink : P.ink2;
    g.fillText(x.count, right + 22, y + 1);
    g.strokeStyle = g.fillStyle = k.hit && !k.chuck ? (k.pluck ? P.ink2 : k.dir === 'U' ? P.link : P.ink) : P.ink2;
    if (k.pluck) { if (k.hit) { g.font = font(600, 13); g.fillText(k.pluck.map(s => PIMA[s]).join(''), right + 50, y + 1); } }
    else if (k.chuck) { g.font = font(700, 15); g.fillText('×', right + 48, y + 1); }
    else { g.globalAlpha *= k.hit ? 1 : .5; arrow(g, right + 48, y, k.dir, k.accent ? 20 : 15, !k.hit); }
    g.globalAlpha = 1;
  }
  g.restore();
  const fade = g.createLinearGradient(0, 0, 0, 90);           // the far end of the strip fades into the paper
  fade.addColorStop(0, P.lane); fade.addColorStop(1, P.lane + '00');   // --lane is #rrggbb, so + '00' is it see-through
  g.fillStyle = fade; g.fillRect(0, 0, w, 90);

  g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(0, hit + 25); g.lineTo(w, hit + 25); g.stroke();   // the hit line, under the tile landing on it
  g.fillStyle = P.ink2; g.font = font(600, 13); g.textAlign = 'center';
  'EADGBe'.split('').forEach((n, s) => g.fillText(n, colX(s), h - 18));

  if (countLeft > 0) {                                        // the count-in, big, above where the first stroke lands
    const { pulses, slots } = countIn(song), n = pulses - Math.ceil(countLeft / slots - 1e-6) + 1;
    g.globalAlpha = .9; g.fillStyle = P.lane; g.fillRect(0, 0, w, hit - 10); g.globalAlpha = 1;
    g.fillStyle = P.ink; g.font = font(700, 132); g.fillText(Math.max(1, n), w / 2, hit - 190);
    g.fillStyle = P.ink2; g.font = font(500, 15); g.fillText('Count in: the first stroke lands on the line', w / 2, hit - 90, w - 20);
  }
}

/** The position under a click at height y in the lane, for a lane showing pos. */
export function positionAt(cv, y, pos) { return pos + (layout(cv.clientWidth, cv.clientHeight).hit - y) / ROW; }
