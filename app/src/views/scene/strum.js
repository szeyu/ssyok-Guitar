// The strumming hand's side: the right hand, following an arrow that swings through every count (solid for a hit, hollow for a pass), the upcoming
// strokes queued towards the bridge with their counts, picked notes with their picking finger, riff notes marked at their own
// fret, the strings a chord skips marked, and struck strings that glow and shake.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PIMA } from '../../engine/hand.js';
import { stringZ, dotX, labelTexture } from './guitar.js';

const HAND_URL = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.19/dist/profiles/generic-hand/right.glb';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const strokeAngle = dir => dir === 'D' ? Math.PI / 2 : -Math.PI / 2;   // the cone points +z (towards the floor) for a down stroke

/** Adds the strum marks and the strumming hand to the scene. update({ at, pos, capo, lit, still, playerView, show }) draws them
 *  at a position; show: the hand is shown. ready() is called once the hand model has arrived. */
export function createStrum(scene, C, strings, ready) {
  const DIR = { D: C.strokeD, U: C.strokeU };
  const sprite = (map, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, transparent: true })); s.scale.setScalar(size); scene.add(s); return s; };
  const text = (txt, colour, w = 64, px = 44) => labelTexture(txt, null, colour, C.font, w, px);
  // the arrows draw over the hand, so the stroke stays readable as the hand passes over it
  const arrowMat = () => new THREE.MeshBasicMaterial({ transparent: true, depthTest: false });
  const arrowMesh = (mat, r, h) => {
    const g = new THREE.Group(), head = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), mat), shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * .3, r * .3, h * 1.2, 8), mat);
    head.position.y = h / 2; shaft.position.y = -h * .6; head.renderOrder = shaft.renderOrder = 1; g.add(head, shaft); scene.add(g); return g;
  };
  const strokeMat = arrowMat(), arrow = arrowMesh(strokeMat, 1, 2.2);
  const word = (txt, colour, w) => { const sp = sprite(text(txt, colour, w, 40), 1); sp.scale.set(w / 28, 64 / 28, 1); return sp; };
  const words = { D: word('down', DIR.D, 160), U: word('up', DIR.U, 160), M: word("pass, don't hit", C.onScene, 320) };
  const noPlay = [0, 1, 2, 3, 4, 5].map(s => { const d = sprite(labelTexture('×', C.skip, C.skipInk, C.font), 1); d.position.set(15.5, 1.2, stringZ(s, 15.5)); return d; });
  const countTex = Object.fromEntries(['1', '2', '3', '4', '5', '6', '&'].map(t => [t, text(t, C.onScene)]));
  const disc = txt => labelTexture(txt, C.pluck, C.ink, C.font);   // a picking finger, or a riff note's fret
  const dots = () => [0, 1, 2].map(() => sprite(disc('p'), 1.5));
  // the picked strings of a stroke, each marked with its picking finger, at x
  const showPicks = (dots, stroke, x, opacity) => dots.forEach((d, n) => {
    const string = stroke.pluck?.[n];
    d.visible = string !== undefined;
    if (d.visible) { d.material.map = disc(PIMA[string]); d.material.opacity = opacity; d.position.set(x, 1.2, stringZ(string, 10)); }
  });
  const plucked = dots();                                        // the notes being picked right now
  const riff = [0, 1, 2, 3].map(() => sprite(disc('0'), 1.1));
  const queue = Array.from({ length: 7 }, () => {
    const mat = arrowMat();
    return { g: arrowMesh(mat, .75, 1.6), mat, cnt: sprite(countTex['1'], 1.5), dots: dots() };
  });
  const shake = () => performance.now() / 1000;
  const colour = new THREE.Color(), glowColour = new THREE.Color(C.stringGlow), skipColour = new THREE.Color(C.skip);

  // the right hand, open, palm down over the strings, fingers towards the floor and tilted down so they brush the strings; it
  // follows the arrow. The model is in metres, the scene in cm; offline there is no model and the arrow plays alone.
  const hand = new THREE.Group(); hand.scale.setScalar(100); hand.visible = false; scene.add(hand);
  let fingertip;                                                 // the middle fingertip in the model, which the hand is placed by
  new GLTFLoader().load(HAND_URL, g => {
    const skin = new THREE.MeshStandardMaterial({ color: C.skin, roughness: .7 });
    g.scene.traverse(o => { if (o.isSkinnedMesh) { o.material = skin; o.frustumCulled = false; } });
    const at = n => g.scene.getObjectByName(n).position;
    const along = at('middle-finger-phalanx-proximal').clone().sub(at('wrist')).normalize();
    const across = at('index-finger-phalanx-proximal').clone().sub(at('pinky-finger-phalanx-proximal'));
    across.addScaledVector(along, -across.dot(along)).normalize();
    const basis = (f, i) => new THREE.Matrix4().makeBasis(f, i, V().crossVectors(f, i));
    const towards = V(0, -.45, 1).normalize();                   // the fingers' way in the scene; the index side faces the neck (+x)
    hand.quaternion.setFromRotationMatrix(basis(towards, V(1, 0, 0)).multiply(basis(along, across).transpose()));
    fingertip = at('middle-finger-tip').clone();
    hand.add(g.scene);
    ready();
  }, undefined, () => {});                                       // ponytail: no model (offline), no hand; the arrow still swings

  return {
    /** at(i): { stroke, frets, count, riff } at clock slot i; pos the clock's position; lit: strings may glow (playing, past the
     *  count-in, motion allowed); still (reduced motion): the arrow does not swing, it stands where the stroke ends;
     *  playerView: the counts sit on the side nearer you. */
    update({ at, pos, capo, lit, still, playerView, show }) {
      // the hand keeps swinging through every count, even when it misses the strings
      const s0 = Math.floor(pos), phase = pos - s0, hit = at(s0), here = at(Math.round(pos)), lastStroke = hit.stroke;
      const way = lastStroke.dir === 'D' ? 1 : -1, turns = !still && at(s0 + 1).stroke.dir === lastStroke.dir ? 2 : 1;   // the same way twice: the hand comes back silently between
      const swing = still ? way : way * Math.sin(Math.PI * phase * turns), down = still ? way > 0 : way * Math.cos(Math.PI * phase * turns) >= 0;
      const now = still ? lastStroke : turns === 2 && phase > .25 && phase < .75 ? { hit: false } : here.stroke;
      strokeMat.color.set(now.hit ? DIR[down ? 'D' : 'U'] : C.onScene); strokeMat.wireframe = !now.hit;   // a pass is a hollow arrow
      strokeMat.opacity = now.hit ? 1 : .7;
      arrow.visible = !now.pluck;
      arrow.rotation.x = strokeAngle(down ? 'D' : 'U');
      const frets = here.frets, zLo = stringZ(frets.findIndex(f => f >= 0), 10) - 1.3, zHi = stringZ(5, 10) + 1.3;
      arrow.position.set(10, 2.5, (zLo + zHi) / 2 + (zHi - zLo) / 2 * (now.pluck ? 0 : swing));   // the swing covers only the strings the chord plays
      hand.visible = show && !!fingertip;
      if (fingertip) hand.position.set(10, 1.6, arrow.position.z + 1).sub(fingertip.clone().multiplyScalar(100).applyQuaternion(hand.quaternion));   // picking: the hand waits above the middle of the strings
      for (const key of 'DUM') { const sp = words[key]; sp.visible = !now.pluck && key === (now.hit ? (down ? 'D' : 'U') : 'M'); sp.position.set(now.hit ? 16 : 19, 2.5, arrow.position.z); }
      noPlay.forEach((d, s) => d.visible = frets[s] < 0);
      const age = pos - s0;
      riff.forEach((d, n) => {                                   // a riff note off the chord shape gets its own spot on the neck
        const r = hit.riff[n];
        d.visible = !!r && age < 1.5;
        if (d.visible) { const x = dotX(r.fret + capo); d.material.map = disc(String(r.fret)); d.position.set(x, .9, stringZ(r.string, x)); d.material.opacity = 1 - age / 1.5; }
      });
      showPicks(plucked, lastStroke, 10, Math.max(.25, 1 - age));
      const glow = lit && lastStroke.hit && !lastStroke.chuck ? Math.max(0, 1 - age * 1.6) : 0;
      const rings = s => lastStroke.pluck ? lastStroke.pluck.includes(s) : hit.frets[s] >= 0 && (lastStroke.dir === 'D' || s >= 2);
      const t = shake();
      strings.forEach((mesh, s) => {
        const on = frets[s] >= 0 && rings(s) ? glow : 0;
        mesh.material.emissive.copy(frets[s] < 0 ? skipColour : colour.copy(glowColour).multiplyScalar(on));   // skipped strings stay red, struck ones glow warm
        mesh.scale.x = mesh.scale.z = 1 + on * (.9 + Math.sin(t * (70 + s * 9)) * .5);   // and blur wide, the way a vibrating string looks
      });
      // upcoming strokes wait in a line towards the bridge, fade in at the far end, and reach the arrow exactly on their count
      queue.forEach((q, n) => {
        const i = s0 + 1 + n, { stroke, count } = at(i), x = 10 - (i - pos) / 2 * 9, fade = THREE.MathUtils.clamp((x + 14) / 7, 0, 1);
        q.g.position.set(x, 2.5, (zLo + zHi) / 2); q.g.rotation.x = strokeAngle(stroke.dir); q.g.scale.setScalar(stroke.accent ? 1.4 : 1);
        q.mat.color.set(!stroke.hit ? C.onScene : stroke.pluck ? C.pluck : stroke.chuck ? C.chuck : DIR[stroke.dir]); q.mat.wireframe = !stroke.hit; q.mat.opacity = fade * (stroke.hit ? .95 : .7);
        q.g.visible = !stroke.pluck;
        showPicks(q.dots, stroke, x, fade * .9);
        q.cnt.material.map = countTex[count]; q.cnt.material.opacity = fade * (stroke.hit ? .9 : .5);
        q.cnt.position.set(x, 2.5, (zLo + zHi) / 2 + (playerView ? -5 : 5));
      });
    },
  };
}
