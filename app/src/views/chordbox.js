// A chord box: the chord's shape as an SVG diagram, thickest string on the left, the nut at the top. Colours come from the
// .cb-* rules in app.css (tokens), so nothing here names a colour: dots by finger (f1-f4), x for a string not played, o for open.

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; };
const L = 16, R = 104, TOP = 30, ROW = 24, FRETS = 4;     // strings from x = 16 to 104, four fret rows 24 high under the nut
const sx = s => L + (R - L) * s / 5, fy = f => TOP + ROW * f;

/** The SVG for one fingering { frets, fingers }. A shape above the 4th fret starts lower down the neck and names its first fret. */
export function chordBox(shape) {
  const pressed = shape.frets.filter(f => f > 0), base = Math.max(0, ...pressed) > FRETS ? Math.min(...pressed) : 1;
  const box = svg('svg', { class: 'cb', viewBox: '-20 0 140 136', width: 140, height: 136, 'aria-hidden': 'true' });
  if (base === 1) box.append(svg('rect', { class: 'cb-nut', x: L - 1, y: TOP - 4, width: R - L + 2, height: 5, rx: 2 }));
  else box.append(svg('text', { class: 'cb-base', x: L - 10, y: fy(.5) + 4 }, base + 'fr'));
  for (let f = base === 1 ? 1 : 0; f <= FRETS; f++) box.append(svg('line', { class: 'cb-fret', x1: L, y1: fy(f), x2: R, y2: fy(f) }));
  for (let s = 0; s < 6; s++) box.append(svg('line', { class: 'cb-str', x1: sx(s), y1: TOP, x2: sx(s), y2: fy(FRETS), 'stroke-width': (2.2 - .28 * s).toFixed(2) }));
  for (let f = 1; f <= 4; f++) {                          // one finger can hold several strings at one fret: a barre, drawn as a bar
    const ss = shape.fingers.flatMap((x, s) => x === f && shape.frets[s] > 0 ? [s] : []);
    if (!ss.length) continue;
    const y = fy(shape.frets[ss[0]] - base + .5), x1 = sx(ss[0]), x2 = sx(ss.at(-1));
    if (x2 > x1) box.append(svg('rect', { class: 'cb-bar f' + f, x: x1, y: y - 7, width: x2 - x1, height: 14 }));
    for (const x of new Set([x1, x2])) box.append(svg('circle', { class: 'cb-dot f' + f, cx: x, cy: y, r: 8 }));
    box.append(svg('text', { class: 'cb-n', x: x1, y: y + 3.6 }, f));
  }
  shape.frets.forEach((f, s) => {
    if (f < 0) box.append(svg('path', { class: 'cb-x', d: `M${sx(s) - 4} 10l8 8M${sx(s) + 4} 10l-8 8` }));
    else if (!f) box.append(svg('circle', { class: 'cb-o', cx: sx(s), cy: 14, r: 4.2 }));
  });
  return box;
}
