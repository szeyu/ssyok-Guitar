// The two 3D windows: one scene (the guitar, the fretting hand, the strum marks) seen by two cameras, each with its own
// renderer. The pixel ratio is capped at 1.5; when frames come slow the quality governor drops it a step at a time down to
// half, and steps it back up once frames stay fast; ?perf logs frame times and each scale it chose. Colours are the design tokens, read once.
import * as THREE from 'three';
import { css } from '../dom.js';
import { buildGuitar, fretX, dotX, L } from './guitar.js';
import { createHand } from './hand.js';
import { createStrum } from './strum.js';

const PERF = new URLSearchParams(location.search).has('perf'), CAM = new URLSearchParams(location.search).has('cam');   // ?cam: the fretting camera's shift each frame
const FAST_FOR = 3000;                                          // ms of fast frames before a step back up
// the fretting camera glides to a new place on the neck as a critically damped spring: it sets off and arrives gently, never
// overshoots, and the same whatever the frame rate. OMEGA per second: most of the way in about half a second
const OMEGA = 8, SETTLED = .01;                                 // cm: closer than this, and still, it has arrived
// the cameras look down at the guitar; up is the thickest string's side. Player's view turns them half round, so the headstock is
// on the left and the thickest string at the bottom, as you look down at your own guitar (and as tab is written)
const CAMS = [
  { pos: [57, 22, -11], tgt: [57, 0, 0], zoom: .72, follow: true },   // fretting hand; follows the hand up the neck
  { pos: [10, 30, -14], tgt: [10, 0, 0], zoom: .85 },                 // strumming hand
];
const TOKENS = { wood: 'wood', neck: 'neck', fretboard: 'fretboard', headstock: 'headstock', soundHole: 'sound-hole', nut: 'nut', inlay: 'inlay', fretWire: 'fret-wire',
  stringWound: 'string-wound', stringPlain: 'string-plain', capoBar: 'capo-bar', skin: 'skin', skip: 'skip', skipInk: 'skip-ink', stringGlow: 'string-glow', light: 'light',
  ink: 'ink', onScene: 'on-scene', scene2: 'scene-2', strokeD: 'stroke-d', strokeU: 'stroke-u', pluck: 'pluck', chuck: 'chuck', font: 'ui' };

/** Puts the 3D into the two .scene elements. Returns { draw(state) }, or null when the browser cannot draw WebGL (the player
 *  works on without it). ready() is called when a hand model arrives, so a paused player can draw it. */
export function createScenes(elements, ready) {
  const C = Object.fromEntries(Object.entries(TOKENS).map(([k, n]) => [k, css('--' + n)]));
  C.finger = ['', ...[1, 2, 3, 4].map(f => css('--f' + f))];
  let renderers;
  try {
    renderers = elements.map(el => {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.domElement.className = 'gl'; el.append(r.domElement);
      return r;
    });
  } catch { return null; }

  const scene = new THREE.Scene(), { strings, capoBar } = buildGuitar(scene, C);
  const hand = createHand(scene, C, ready), strum = createStrum(scene, C, strings, ready);
  const cams = CAMS.map(() => new THREE.PerspectiveCamera(40, 1, 1, 500));
  const top = Math.min(devicePixelRatio, 1.5);
  let scale = top, slow = 16, fast = 0, last = 0, perf = { n: 0, f: 0, s: 0, gap: 0 };
  let camX, camV = 0, camAt = 0;                                // the fretting camera's shift along the neck (cm), its speed, when it moved
  renderers.forEach(r => r.setPixelRatio(scale));

  // the governor: a running average of the time between frames; above 28 ms, a quarter fewer pixels, down to half; under 20 ms
  // for FAST_FOR, a quarter more, up to the cap
  const step = by => {
    scale = Math.min(top, Math.max(.5, scale + by)); slow = 16; fast = 0;
    renderers.forEach(r => r.setPixelRatio(scale));
    if (PERF) console.log('PERF scale', scale, by < 0 ? 'down' : 'up');
  };
  function govern(now, playing) {
    const dt = now - last; last = now;
    if (!playing || dt > 200) return;                            // paused, or the first frame after a pause: not a measurement
    slow += (dt - slow) * .05;
    fast = slow < 20 ? fast + dt : 0;
    if (slow > 28 && scale > .5) step(-.25);
    else if (fast > FAST_FOR && scale < top) step(.25);
  }

  // moves the fretting camera towards shift x (cm); still: cuts straight there. True while it is still on its way
  function follow(x, now, still) {
    const dt = now - camAt > 100 ? 1 / 60 : (now - camAt) / 1000;   // after a pause it sets off from rest, not with a jump
    camAt = now;
    if (camX === undefined || still) { camX = x; camV = 0; return false; }
    const e = camX - x, j = camV + OMEGA * e, k = Math.exp(-OMEGA * dt);   // the spring's exact step
    camX = x + (e + j * dt) * k; camV = (camV - OMEGA * j * dt) * k;
    if (Math.abs(camX - x) < SETTLED && Math.abs(camV) < SETTLED) { camX = x; camV = 0; }
    return camX !== x;
  }

  return {
    /** Draws both windows. state: { pos, at, hand: { cur, nxt, move }, capo, camFret, playing, lit, still, playerView, showHand } (see the
     *  player); camFret: the fret the fretting camera heads for (cameraFretAt). Returns true while that camera is still moving, so
     *  a paused player draws on until it arrives. */
    draw(state) {
      const t0 = performance.now();
      govern(t0, state.playing);
      const moving = follow(fretX(state.camFret) - L, t0, state.still);
      capoBar.visible = state.capo > 0;
      if (state.capo) capoBar.position.x = dotX(state.capo);
      const { pos, at, capo, lit, still, playerView } = state;
      hand.update({ ...state.hand, capo, show: state.showHand, still });
      strum.update({ pos, at, capo, lit, still, playerView, show: state.showHand });
      const times = renderers.map((r, i) => {
        const el = r.domElement.parentElement, w = el.clientWidth, h = el.clientHeight, cam = cams[i], c = CAMS[i];
        if (!w || !h) return 0;
        const size = r.getSize(new THREE.Vector2());
        if (size.x !== w || size.y !== h) { r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
        const dx = c.follow ? camX : 0, tgt = new THREE.Vector3(c.tgt[0] + dx, c.tgt[1], c.tgt[2]);
        cam.position.set(c.pos[0] + dx, c.pos[1], c.pos[2]).lerp(tgt, 1 - c.zoom);
        cam.up.set(0, 0, state.playerView ? 1 : -1); cam.lookAt(tgt);
        const s = performance.now(); r.render(scene, cam); return performance.now() - s;
      });
      if (PERF && state.playing) {                               // ?perf: averages over 30 frames
        perf.n++; perf.f += times[0]; perf.s += times[1]; perf.gap += t0 - (perf.last ?? t0); perf.last = t0;
        if (perf.n === 30) {
          console.log('PERF', `frame every ${(perf.gap / 30).toFixed(1)}ms  fretting 3D ${(perf.f / 30).toFixed(2)}ms  strumming 3D ${(perf.s / 30).toFixed(2)}ms  scale ${scale}`);
          perf = { n: 0, f: 0, s: 0, gap: 0, last: t0 };
        }
      } else perf.last = undefined;
      if (CAM && state.playing) console.log('CAM', t0.toFixed(1), camX.toFixed(3));
      return moving;
    },
  };
}
