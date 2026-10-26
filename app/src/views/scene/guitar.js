// The 3D guitar, in centimetres: bridge at x = 0, nut at x = L, the fretboard faces +y, the thickest string at -z.
// Colours come in as tokens (C), so nothing here names one.
import * as THREE from 'three';

export const L = 65;
/** Distance from the bridge to fret n (0 = the nut). */
export const fretX = n => L * 2 ** (-n / 12);
/** Where string s (0 = thickest) crosses x: the strings fan out towards the bridge. */
export const stringZ = (s, x) => (s / 5 - .5) * (5.4 - 1.8 * x / L);
/** Where a fingertip presses fret f: a little behind the fret wire. */
export const dotX = f => fretX(f) + (fretX(f - 1) - fretX(f)) * .35;

/** A text label on a coloured disc, as a sprite. One texture per look, shared: a canvas per label leaks at every chord change. */
const labelTex = new Map();
export function label(txt, bg, fg, font) {
  const key = txt + bg + fg;
  if (!labelTex.has(key)) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
    g.fillStyle = fg; g.font = `700 38px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 32, 35);
    labelTex.set(key, new THREE.CanvasTexture(c));
  }
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex.get(key), depthTest: false, transparent: true }));
}

/** Adds the guitar to the scene: { strings (one mesh each, thickest first), capoBar }. */
export function buildGuitar(scene, C) {
  scene.add(new THREE.AmbientLight(C.light, 1.4));
  const sun = new THREE.DirectionalLight(C.light, 1.6); sun.position.set(20, 60, -40); scene.add(sun);
  const mesh = (geo, color, x, y, z) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: .7 })); m.position.set(x, y, z); scene.add(m); return m; };
  const boardEnd = fretX(20) - .6;
  mesh(new THREE.BoxGeometry(L - boardEnd, .6, 5.8), C.fretboard, (L + boardEnd) / 2, -.3, 0);
  mesh(new THREE.BoxGeometry(L - boardEnd, 1.8, 5.4), C.neck, (L + boardEnd) / 2, -1.5, 0);
  mesh(new THREE.BoxGeometry(16, .6, 7.5), C.headstock, L + 8, -.5, 0);
  mesh(new THREE.CylinderGeometry(19, 19, 9, 48), C.wood, -2, -5.1, 0);                 // lower bout
  mesh(new THREE.CylinderGeometry(14.5, 14.5, 9, 48), C.wood, 19, -5.1, 0);             // upper bout
  mesh(new THREE.CylinderGeometry(4.5, 4.5, .05, 32), C.soundHole, 12, -.58, 0);
  mesh(new THREE.BoxGeometry(2.5, .8, 14), C.headstock, 0, -.2, 0);                     // bridge
  for (let n = 0; n <= 20; n++) mesh(new THREE.BoxGeometry(n ? .18 : .5, .16, 5.8), n ? C.fretWire : C.nut, fretX(n), .06, 0);
  for (const n of [3, 5, 7, 9, 12, 15]) mesh(new THREE.CylinderGeometry(.35, .35, .02, 16), C.inlay, (fretX(n) + fretX(n - 1)) / 2, .01, 0);
  const strings = Array.from({ length: 6 }, (_, s) => {
    const a = new THREE.Vector3(L, .25, stringZ(s, L)), b = new THREE.Vector3(0, .55, stringZ(s, 0)), d = b.clone().sub(a), r = .03 + (5 - s) * .012;
    const m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), s < 4 ? C.stringWound : C.stringPlain, 0, 0, 0);
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return m;
  });
  const capoBar = mesh(new THREE.BoxGeometry(1.1, 1.1, 6.6), C.capoBar, 0, .45, 0);
  return { strings, capoBar };
}
