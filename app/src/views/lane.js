// The strum lane: a canvas on the kraft strip where strokes fall to the ink hit line, thickest string on the left. Sideways
// (across), the same lane is drawn turned and flipped onto the canvas: strokes slide right to left into a hit line near the
// left edge, the strings run as rows with the thin e on top, as tab is written; words and arrows stay upright.
// Every colour and font is read from the tokens on :root, so nothing here names one.
import { slotAt, slotsPerBar, stretchSlots } from '../engine/song.js';
import { songSlot, countIn } from '../engine/practice.js';
import { PIMA } from '../engine/hand.js';
import { css } from './dom.js';

const ROW = 50, BELOW = 76;                                   // pixels per slot; room under the hit line for the string names
// a colour, any CSS form, as "r,g,b": a 1-pixel canvas paints it and reads it back
const rgb = colour => { const px = new OffscreenCanvas(1, 1).getContext('2d'); px.fillStyle = colour; px.fillRect(0, 0, 1, 1); return px.getImageData(0, 0, 1, 1).data.slice(0, 3).join(); };
let T;                                                        // T: the tokens (palette and font; drawLane calls it P), read once the stylesheet is in
const tokens = () => T ??= Object.fromEntries(['ink', 'ink-2', 'bg', 'coral', 'brass', 'brass-deep', 'link', 'lane', 'lane-str', 'stroke-d', 'stroke-u', 'pluck', 'chuck', 'ui']
  .map(n => [n.replace('-', ''), css('--' + n)]).concat([['laneClear', `rgba(${rgb(css('--lane'))},0)`]]));
const still = matchMedia('(prefers-reduced-motion: reduce)');   // reduced motion: no swell or glow on the next chord
// text cut to a width with an ellipsis, rather than squeezed
const fit = (ctx, text, max) => { if (ctx.measureText(text).width <= max) return text; while (text && ctx.measureText(text + '…').width > max) text = text.slice(0, -1); return text + '…'; };
const tab = f => f < 0 ? '×' : String(f);

/** Where the hit line sits on the lane canvas, in CSS pixels: { y } down from the top, or sideways { x } in from the left. */
export const hitLine = (cv, across) => across ? { x: BELOW - 25 } : { y: cv.clientHeight - BELOW };

// where the strings and the hit line sit in a lane w by h (as drawn upright; sideways, w is the canvas's height); sideways the
// chord names, words and section names need three rows under the strings, so the strings start further in
function layout(w, h, across) {
  const right = across ? 60 : 74, x0 = across ? 100 : Math.max(70, Math.min(104, w * .26)), gap = Math.min(48, (w - x0 - right - 18) / 5);
  return { hit: h - BELOW, colX: s => x0 + gap * s, right: w - right };
}

// an arrow for a stroke: solid for a hit, dashed for a pass
function arrow(ctx, x, y, dir, size, dashed) {
  const s = dir === 'D' ? 1 : -1, l = size / 2;
  ctx.save(); ctx.lineWidth = size > 18 ? 2.8 : 2.2; ctx.lineCap = ctx.lineJoin = 'round'; if (dashed) ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(x, y - s * l); ctx.lineTo(x, y + s * l); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x - l * .5, y + s * l * .4); ctx.lineTo(x, y + s * l); ctx.lineTo(x + l * .5, y + s * l * .4); ctx.stroke(); ctx.restore();
}

/**
 * Draws the lane at a position (fractional slot, as the clock counts it through the loop).
 * frets(chord) gives the fingering's frets; countLeft is the count-in still to go, in slots (0 when over).
 */
export function drawLane(cv, { song, loop, pos, countLeft, frets, across = false }) {
  const P = tokens(), font = (wt, px) => `${wt} ${px}px ${P.ui}`;
  const dpr = Math.min(devicePixelRatio, 1.5), W = cv.clientWidth, H = cv.clientHeight, [w, h] = across ? [H, W] : [W, H];
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext('2d');
  // the lane is drawn upright in w by h; sideways the canvas maps (x, y) to (h - y, w - x)
  const upright = across ? [0, -dpr, -dpr, 0, h * dpr, w * dpr] : [dpr, 0, 0, dpr, 0, 0];
  ctx.setTransform(...upright); ctx.clearRect(0, 0, w, h); ctx.textBaseline = 'middle';
  // words and arrows sideways: drawn at their mapped place, not turned; at = [x, y] as upright, aside = [x, y] instead when sideways
  const flat = (at, aside, draw) => {
    if (!across) return draw(...at);
    const [x, y] = aside ?? at;
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(h - y, w - x); ctx.restore();
  };
  const text = (t, at, max, aside, align) => flat(at, aside, (x, y) => { if (across && align) ctx.textAlign = align; ctx.fillText(t, x, y, max); });
  const { hit, colX, right } = layout(w, h, across), per = slotsPerBar(song), cur = Math.floor(pos + 1e-6), Y = i => hit - (i - pos) * ROW;
  const slotOf = i => slotAt(song, songSlot(song, loop, i));

  for (let s = 0; s < 6; s++) {                               // the strings, thick to thin
    ctx.strokeStyle = P.lanestr; ctx.globalAlpha = .55; ctx.lineWidth = 3.2 - s * .42;
    ctx.beginPath(); ctx.moveTo(colX(s), 0); ctx.lineTo(colX(s), h - 34); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, hit + 26); ctx.clip();

  const first = Math.max(0, cur - 1), last = Math.ceil(pos + hit / ROW) + 1;
  for (let i = first; i <= last; i++) {
    const here = slotOf(i), stroke = here.stroke, y = Y(i), inBar = songSlot(song, loop, i) % per, prev = i > 0 ? slotOf(i - 1) : null;
    const now = i === cur && !countLeft, chordFrets = frets(here.chord), bar = song.bars[here.bar];
    const segLen = stretchSlots(song, here.bar), s0 = inBar - inBar % segLen, change = !prev || prev.chord !== here.chord;
    const said = inBar === 0 && !bar.syllables && here.lyric, word = here.syllable;   // a plain line under the bar's chord; a timed word beside its row
    ctx.globalAlpha = i < cur ? .2 : 1;

    if (inBar === s0) {                                          // a chord's stretch of the bar: a rule, its name, maybe its section
      ctx.save(); ctx.strokeStyle = P.lanestr; ctx.globalAlpha *= .6; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(0, y + 25); ctx.lineTo(w, y + 25); ctx.stroke(); ctx.restore();
      const grow = change && i > pos && !still.matches ? Math.max(0, 1 - (i - pos) / per) : 0;   // the next chord swells as it arrives
      const words = said || word, nameY = words ? y - 8 : y;
      ctx.save(); if (grow > .4) { ctx.shadowColor = P.brass; ctx.shadowBlur = 20 * grow; }
      ctx.fillStyle = change ? P.ink : P.lanestr; ctx.font = font(600, Math.round((change ? 23 : 19) * (1 + .3 * grow))); ctx.textAlign = 'left';
      text(here.chord, [14, nameY], across ? undefined : colX(0) - 22, [44, y]); ctx.restore();
      const section = inBar === 0 && bar.section;
      if (section) { ctx.fillStyle = P.ink2; ctx.font = font(600, 12); ctx.textAlign = 'left'; text(section, [14, nameY - 18], colX(0) - 22, [66, y]); }
      if (said) { ctx.fillStyle = P.ink2; ctx.font = font(500, 13); ctx.textAlign = 'left'; text(fit(ctx, said, across ? per * ROW - 8 : colX(0) - 22), [14, y + 14], undefined, [22, y]); }
    }
    if (word) {                                               // the syllable sung on this count, beside its row (under the chord name on a chord's row)
      ctx.fillStyle = P.ink; ctx.font = font(600, 16); ctx.textAlign = 'right';
      text(fit(ctx, word, across ? ROW - 4 : colX(0) - 42), [colX(0) - 28, inBar === s0 ? y + 14 : y], undefined, [22, y], 'left');   // clear of the tile, which starts 23px before the first string
    }

    if (stroke.pluck && stroke.hit) {                                   // picked notes: a dot on each string with its fret
      for (const s of stroke.pluck) {
        ctx.fillStyle = P.pluck; ctx.beginPath(); ctx.arc(colX(s), y, now ? 17 : 15, 0, 7); ctx.fill();
        if (now) { ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.fillStyle = P.ink; ctx.font = font(700, 15); ctx.textAlign = 'center'; text(tab(stroke.fret[s] ?? chordFrets[s]), [colX(s), y + 1]);
      }
    } else if (stroke.hit) {                                       // a strum: a card-stock tile over just the strings the chord plays
      const lo = stroke.chuck ? 0 : Math.max(0, chordFrets.findIndex(f => f >= 0)), a = colX(lo) - 23, b = colX(5) + 18, th = stroke.accent ? 40 : 34;
      const col = stroke.chuck ? P.chuck : stroke.dir === 'U' ? P.strokeu : P.stroked, edge = stroke.chuck ? P.ink2 : stroke.dir === 'U' ? P.link : P.brassdeep;
      const top = y - th / 2 + (now ? 3 : 0), alpha = ctx.globalAlpha;
      ctx.fillStyle = edge; ctx.globalAlpha = alpha * (stroke.accent ? 1 : .45); ctx.beginPath(); ctx.roundRect(a, top + (now ? 1 : stroke.accent ? 4 : 3), b - a, th, 12); ctx.fill();
      ctx.globalAlpha = alpha; ctx.fillStyle = P.lane; ctx.beginPath(); ctx.roundRect(a, top, b - a, th, 12); ctx.fill();
      ctx.fillStyle = col; ctx.globalAlpha = alpha * (stroke.accent || now || stroke.chuck ? 1 : .55); ctx.fill(); ctx.globalAlpha = alpha;
      if (now) { ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke(); }
      const firstHit = !Array.from({ length: inBar - s0 }, (_, n) => slotOf(i - 1 - n).stroke).some(q => q.hit && !q.pluck && !q.chuck);
      if (stroke.chuck || firstHit) {                              // fret numbers once per chord, on its first stroke; × on strings not played
        ctx.font = font(600, 17); ctx.textAlign = 'center';
        chordFrets.forEach((f, s) => {
          if (stroke.chuck || f < 0) { ctx.fillStyle = P.coral; text('×', [colX(s), y + (stroke.chuck ? 1 : 0)]); }
          else { ctx.fillStyle = P.ink; text(tab(f), [colX(s), top + th / 2 + 1]); }
        });
      }
    }

    // the count beside each row, with the stroke's direction (or the picking fingers)
    ctx.textAlign = 'center'; ctx.font = font(stroke.accent || now ? 600 : 500, 13);
    if (now) { ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(right + 22, y, 11, 0, 7); ctx.fill(); ctx.fillStyle = P.bg; }
    else ctx.fillStyle = stroke.accent ? P.ink : P.ink2;
    text(here.count, [right + 22, y + 1]);
    ctx.strokeStyle = ctx.fillStyle = stroke.hit && !stroke.chuck ? (stroke.pluck ? P.ink2 : stroke.dir === 'U' ? P.link : P.ink) : P.ink2;
    if (stroke.pluck) { if (stroke.hit) { ctx.font = font(600, 13); text(stroke.pluck.map(s => PIMA[s]).join(''), [right + 50, y + 1]); } }
    else if (stroke.chuck) { ctx.font = font(700, 15); text('×', [right + 48, y + 1]); }
    else { ctx.globalAlpha *= stroke.hit ? 1 : .5; flat([right + 48, y], null, (x, yy) => arrow(ctx, x, yy, stroke.dir, stroke.accent ? 20 : 15, !stroke.hit)); }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  const fade = ctx.createLinearGradient(0, 0, 0, 90);           // the far end of the strip fades into the paper
  fade.addColorStop(0, P.lane); fade.addColorStop(1, P.laneClear);
  ctx.fillStyle = fade; ctx.fillRect(0, 0, w, 90);

  ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, hit + 25); ctx.lineTo(w, hit + 25); ctx.stroke();   // the hit line, under the tile landing on it
  ctx.fillStyle = P.ink2; ctx.font = font(600, 13); ctx.textAlign = 'center';
  'EADGBe'.split('').forEach((n, s) => text(n, [colX(s), h - 18]));

  if (countLeft > 0) {                                        // the count-in, big, above where the first stroke lands
    const { pulses, slots } = countIn(song), n = pulses - Math.ceil(countLeft / slots - 1e-6) + 1;
    ctx.globalAlpha = .9; ctx.fillStyle = P.lane; ctx.fillRect(0, 0, w, hit - 10); ctx.globalAlpha = 1;
    ctx.fillStyle = P.ink; ctx.font = font(700, across ? 96 : 132); text(Math.max(1, n), [w / 2, hit - 190], undefined, [w * .6, h / 2]);
    ctx.fillStyle = P.ink2; ctx.font = font(500, 15); text('Count in: the first stroke lands on the line', [w / 2, hit - 90], w - 20, [w * .18, h / 2]);
  }
}

/** The position under a click at (x, y) in the lane (CSS pixels from its top left), for a lane showing pos. */
export function positionAt(cv, x, y, pos, across = false) { return pos + (across ? x - BELOW : cv.clientHeight - BELOW - y) / ROW; }
