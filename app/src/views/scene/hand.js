// The fretting hand: a skinned hand model posed finger by finger onto each chord shape, the finger dots it presses (with a
// ghost of where each goes next), and the open and not-played marks behind the nut or capo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fingerStrings } from '../../engine/chords.js';
import { L, fretX, stringZ, dotX, label } from './guitar.js';

// the WebXR "generic hand": a skinned left hand with a flat 25-joint skeleton, so solved joint positions go straight onto the bones
const HAND_URL = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.19/dist/profiles/generic-hand/left.glb';
const V = (x, y, z) => new THREE.Vector3(x, y, z), Y = V(0, 1, 0), mix = THREE.MathUtils.lerp;

// where finger f sits in a shape: a point, or a bar across strings for a barre; null if unused.
// Fingers sharing a fret sit side by side along it, lowest finger nearest the nut, instead of piling onto one spot.
function pose(shape, f, capo) {
  const pressed = fingerStrings(shape, f);
  if (!pressed.length) return null;
  const fret = shape.frets[pressed[0]] + capo, mates = [...new Set(shape.fingers.filter((x, s) => x && shape.frets[s] + capo === fret))].sort(), n = mates.length;
  const x = fretX(fret) + (fretX(fret - 1) - fretX(fret)) * (n > 1 ? .7 - .42 * mates.indexOf(f) / (n - 1) : .35);
  const z1 = stringZ(pressed[0], x), z2 = stringZ(pressed.at(-1), x);
  return { x, z: (z1 + z2) / 2, span: z2 - z1, fret };
}

/** Adds the hand to the scene. update({ cur, nxt, move, capo, show, still }) poses it move (0..1, eased) of the way from shape
 *  cur to nxt; still (reduced motion): a landing finger does not pop. ready() is called once the hand model has arrived. */
export function createHand(scene, C, ready) {
  const open = new THREE.Group(); scene.add(open);
  const hand = new THREE.Group(); hand.scale.setScalar(100); scene.add(hand);          // the model is in metres, the scene in cm
  const skin = new THREE.MeshStandardMaterial({ color: C.skin, roughness: .7 });
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.3, 1, 20), skin); arm.scale.x = 1.2; scene.add(arm);
  const seg = (mesh, A, B) => { const d = B.clone().sub(A), len = d.length(); mesh.position.copy(A).addScaledVector(d, .5); mesh.quaternion.setFromUnitVectors(Y, d.normalize()); mesh.scale.y = len; };
  // the palm under the neck facing up at it, fingers pointing past the treble edge, index towards the nut.
  // In the model fingers point -y, index is towards -z, the palm faces +x.
  const Ft = V(0, .91, -.4).normalize(), It = V(1, 0, 0), Pt = V().crossVectors(Ft, It);
  const R = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(Pt, Ft, It)
    .multiply(new THREE.Matrix4().makeBasis(V(1, 0, 0), V(0, -1, 0), V(0, 0, -1)).transpose()));
  let rig;
  new GLTFLoader().load(HAND_URL, g => {
    g.scene.traverse(o => { if (o.isSkinnedMesh) { o.material = skin; o.frustumCulled = false; } });
    hand.add(g.scene);
    const rest = n => { const b = g.scene.getObjectByName(n); return { b, p: b.position.clone().multiplyScalar(100), q: b.quaternion.clone() }; };
    const chain = (pre, parts) => parts.map(x => rest(pre + x));
    rig = {
      wrist: rest('wrist'),
      fingers: ['index', 'middle', 'ring', 'pinky'].map(n => ({ meta: rest(n + '-finger-metacarpal'), j: chain(n + '-finger-', ['phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip']) })),
      thumb: chain('thumb-', ['metacarpal', 'phalanx-proximal', 'phalanx-distal', 'tip']),
    };
    rig.c0 = rig.fingers.reduce((c, f) => c.addScaledVector(f.j[0].p, .25), V(0, 0, 0));   // the middle of the knuckle line
    ready();
  }, undefined, () => {});                                       // ponytail: no model (offline), no hand; the finger dots still show
  const put = (r, p, q) => { r.b.position.copy(p).multiplyScalar(.01); r.b.quaternion.copy(q); };
  // Poses a 4-joint chain: the last bone leaves the tip along n, a 2-bone solve covers root -> last joint with the middle joint
  // pushed towards poleRef. Each bone turns by the smallest rotation from its parent's pose, so fingers flex without twisting.
  function solve(j, knuckle, tip, n, poleRef, give) {
    const l = [0, 1, 2].map(i => j[i].p.distanceTo(j[i + 1].p)), reach = (l[0] + l[1]) * .98;
    const j3 = tip.clone().addScaledVector(n, l[2]);
    let d = j3.distanceTo(knuckle);
    if (d > reach) { if (give) knuckle.lerp(j3, 1 - reach / d); else { j3.lerp(knuckle, 1 - reach / d); tip = j3.clone().addScaledVector(n, -l[2]); } d = reach; }
    const room = Math.max(Math.abs(l[0] - l[1]) + .3, (l[0] + l[1]) * .6);
    if (give && d < room) { const away = knuckle.clone().sub(j3).normalize(); knuckle.copy(j3).addScaledVector(away, room); d = room; }   // too cramped: the knuckle backs off so the finger can curl
    d = Math.max(d, Math.abs(l[0] - l[1]) + .05);
    const u = j3.clone().sub(knuckle).normalize(), al = (l[0] * l[0] - l[1] * l[1] + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l[0] * l[0] - al * al));
    const pole = poleRef.clone().addScaledVector(u, -poleRef.dot(u)).normalize();
    const pts = [knuckle, knuckle.clone().addScaledVector(u, al).addScaledVector(pole, h), j3, tip];
    let delta = R.clone();
    for (let i = 0; i < 4; i++) {
      if (i < 3) {
        const from = j[i + 1].p.clone().sub(j[i].p).normalize().applyQuaternion(delta), to = pts[i + 1].clone().sub(pts[i]).normalize();
        delta = new THREE.Quaternion().setFromUnitVectors(from, to).multiply(delta);
      }
      put(j[i], pts[i], delta.clone().multiply(j[i].q));
    }
  }
  const fingers = [1, 2, 3, 4].map(f => {
    const make = () => {
      const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: C.finger[f], transparent: true });
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1, 12), mat); bar.rotation.x = Math.PI / 2;
      const dot = label(f, C.finger[f], C.ink, C.font);
      g.add(bar, dot); scene.add(g);
      return { g, bar, mats: [mat, dot.material] };
    };
    const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: C.finger[f] }));
    line.frustumCulled = false; scene.add(line);
    const cell = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: C.finger[f], transparent: true, depthWrite: false }));
    cell.rotation.x = -Math.PI / 2; scene.add(cell);            // lies flat on the board, between the two fret wires
    const ghost = make(); ghost.g.scale.setScalar(.75);          // the next position is drawn smaller, so it reads as "next", not "now"
    return { f, live: make(), ghost, line, cell };
  });
  const place = (o, p, y, alpha) => { o.g.position.set(p.x, y, p.z); o.bar.scale.y = Math.max(p.span, .01); o.mats.forEach(mat => mat.opacity = alpha); };
  let shown = {};

  return {
    update({ cur, nxt, move, capo, show, still }) {
      const openX = capo ? dotX(capo) + 1.5 : L + 1.3;          // open and not-played marks sit just behind the capo, or the nut
      const frets = cur.frets.join();
      if (shown.frets !== frets || shown.capo !== capo) {
        shown = { frets, capo }; open.children.forEach(o => o.material.dispose()); open.clear();
        cur.frets.forEach((f, s) => {
          if (f > 0) return;
          const d = f === 0 ? label('O', C.scene2, C.onScene, C.font) : label('×', C.skip, C.skipInk, C.font);
          d.scale.setScalar(.7); d.position.set(openX, 1.2, stringZ(s, openX)); open.add(d);
        });
      }
      const middleX = v => { const xs = [1, 2, 3, 4].map(f => pose(v, f, capo)).filter(Boolean).map(p => p.x); return xs.length ? xs.reduce((a, b) => a + b) / xs.length : (capo ? dotX(capo + 2) : L - 6); };
      const origin = V(mix(middleX(cur), middleX(nxt), move), -.2, 3.9);    // the whole hand slides along the neck with the chord
      const rigid = p => p.clone().sub(rig.c0).applyQuaternion(R).add(origin);
      hand.visible = arm.visible = show && !!rig;
      if (rig) {
        for (const r of [rig.wrist, ...rig.fingers.map(x => x.meta)]) put(r, rigid(r.p), R.clone().multiply(r.q));
        const w = rigid(rig.wrist.p);
        seg(arm, w, w.clone().addScaledVector(V(-.35, -.6, .7).normalize(), 24));
        const thumbRoot = rigid(rig.thumb[0].p);                // the thumb pad rests on the back of the neck
        solve(rig.thumb, thumbRoot, V(thumbRoot.x + .5, -3.2, -.6), V(0, -.3, 1).normalize(), V(0, -1, .3), false);
      }
      for (const { live, ghost, line, f, cell } of fingers) {
        const a = pose(cur, f, capo), b = pose(nxt, f, capo), moves = !!(a && b && (a.x !== b.x || a.z !== b.z || a.span !== b.span));
        live.g.visible = !!(a || b);
        live.g.scale.setScalar(b && (moves || !a) && !still ? 1 + .45 * Math.sin(Math.PI * THREE.MathUtils.clamp((move - .7) / .3, 0, 1)) : 1);   // a finger that lands pops once
        if (a && b) place(live, { x: mix(a.x, b.x, move), z: mix(a.z, b.z, move), span: mix(a.span, b.span, move) }, .5 + Math.sin(Math.PI * move) * 1.2, 1);
        else if (a) place(live, a, .5 + move * 2.5, 1 - .8 * move);   // not needed next: lifts off
        else if (b) place(live, b, 3 - move * 2.5, .2 + .8 * move);   // needed next: hovers over its spot, then lands
        const on = move < .5 ? a : b;                               // the patch belongs to the shape being held, and swaps at the change
        cell.visible = !!on;
        if (on) { cell.position.set((fretX(on.fret) + fretX(on.fret - 1)) / 2, .03, on.z); cell.scale.set(fretX(on.fret - 1) - fretX(on.fret) - .3, on.span + .62, 1); cell.material.opacity = .55 * Math.abs(1 - 2 * move); }
        ghost.g.visible = line.visible = moves;
        if (moves) { place(ghost, b, .5, .22); line.geometry.setFromPoints([live.g.position, ghost.g.position]); }
        if (!rig) continue;
        // the finger comes round the treble edge and stands its last joint on the string
        const j = rig.fingers[f - 1].j, knuckle = rigid(j[0].p), used = a || b;
        const tip = used ? live.g.position.clone() : V(knuckle.x - .2, 1.6, 1.6);                 // unused fingers hover, relaxed
        const span = used ? live.bar.scale.y : 0, flat = span > .05;                        // a barre lies flat across the strings
        if (flat) tip.z -= span / 2;
        if (used) tip.y += .55;                                                             // the tip joint sits inside the fingertip
        solve(j, knuckle, tip, (flat ? V(0, .12, 1) : V(0, 1, .35)).normalize(), V(0, .7, .7), true);
      }
    },
  };
}
