// The strumming hand's side: an arrow that swings through every count (solid for a hit, hollow for a pass), the upcoming
// strokes queued towards the bridge with their counts, picked notes with their picking finger, riff notes marked at their own
// fret, the strings a chord skips marked, and struck strings that glow and shake.
import * as THREE from 'three';
import { stringZ, dotX, label } from './guitar.js';

const PIMA = 'pppima';                                           // the picking finger for each string: thumb on the three bass strings

/** Adds the strum marks to the scene. update(state) draws them at a position; see the player's call for the state. */
export function createStrum(scene, C, strings) {
  const DIR = { D: C.strokeD, U: C.strokeU };
  const sprite = (map, size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, transparent: true })); s.scale.setScalar(size); scene.add(s); return s; };
  const text = (txt, colour, w = 64, px = 44) => {
    const c = document.createElement('canvas'); c.width = w; c.height = w === 64 ? 64 : 56;
    const g = c.getContext('2d'); g.font = `700 ${px}px ${C.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = colour; g.fillText(txt, w / 2, c.height / 2 + 2);
    return new THREE.CanvasTexture(c);
  };
  const arrowMesh = (mat, r, h) => {
    const g = new THREE.Group(), head = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), mat), shaft = new THREE.Mesh(new THREE.CylinderGeometry(r * .3, r * .3, h * 1.2, 8), mat);
    head.position.y = h / 2; shaft.position.y = -h * .6; g.add(head, shaft); scene.add(g); return g;
  };
  const arrowMat = new THREE.MeshBasicMaterial({ transparent: true }), arrow = arrowMesh(arrowMat, 1, 2.2);
  const word = (txt, colour, w) => { const sp = sprite(text(txt, colour, w, 40), 1); sp.scale.set(w / 28, 2, 1); return sp; };
  const words = { D: word('DOWN', DIR.D, 160), U: word('UP', DIR.U, 160), M: word("pass, don't hit", C.onScene, 320) };
  const noPlay = [0, 1, 2, 3, 4, 5].map(s => { const d = label('×', C.skip, C.skipInk, C.font); d.position.set(15.5, 1.2, stringZ(s, 15.5)); scene.add(d); return d; });
  const countTex = Object.fromEntries(['1', '2', '3', '4', '5', '6', '&'].map(t => [t, text(t, C.onScene)]));
  const letterTex = Object.fromEntries([...'pima'].map(t => [t, label(t, C.pluck, C.ink, C.font).material.map]));
  const dots = () => [0, 1, 2].map(() => sprite(letterTex.p, 1.5));
  const plucked = dots();                                        // the notes being picked right now
  const fretTex = {}, fretMap = f => fretTex[f] ??= label(String(f), C.pluck, C.ink, C.font).material.map;   // a riff mark shows its fret
  const riff = [0, 1, 2, 3].map(() => sprite(fretMap(0), 1.1));
  const queue = Array.from({ length: 7 }, () => {
    const mat = new THREE.MeshBasicMaterial({ transparent: true });
    return { g: arrowMesh(mat, .75, 1.6), mat, cnt: sprite(countTex['1'], 1.5), dots: dots() };
  });
  const shake = () => performance.now() / 1000;
  const colour = new THREE.Color(), glowColour = new THREE.Color(C.stringGlow), skipColour = new THREE.Color(C.skip);

  return {
    /** at(i): { stroke, frets, count, riff } at clock slot i; pos the clock's position; lit: strings may glow (playing, past the
     *  count-in, motion allowed); playerView: the counts sit on the side nearer you. */
    update({ at, pos, capo, lit, playerView }) {
      // the hand keeps swinging through every count, even when it misses the strings
      const s0 = Math.floor(pos), ph = pos - s0, k0 = at(s0).stroke, here = at(Math.round(pos));
      const d1 = k0.dir === 'D' ? 1 : -1, turns = at(s0 + 1).stroke.dir === k0.dir ? 2 : 1;   // the same way twice: the hand comes back silently between
      const swing = d1 * Math.sin(Math.PI * ph * turns), down = d1 * Math.cos(Math.PI * ph * turns) >= 0;
      const now = turns === 2 && ph > .25 && ph < .75 ? { hit: false } : here.stroke;
      arrowMat.color.set(now.hit ? DIR[down ? 'D' : 'U'] : C.onScene); arrowMat.wireframe = !now.hit;   // a pass is a hollow arrow
      arrowMat.opacity = now.hit ? 1 : .7;
      arrow.visible = !now.pluck;
      arrow.rotation.x = down ? Math.PI / 2 : -Math.PI / 2;     // the cone points +z (towards the floor) for a down stroke
      const fr = here.frets, zLo = stringZ(fr.findIndex(f => f >= 0), 10) - 1.3, zHi = stringZ(5, 10) + 1.3;
      arrow.position.set(10, 2.5, (zLo + zHi) / 2 + (zHi - zLo) / 2 * swing);   // the swing covers only the strings the chord plays
      for (const k of 'DUM') { const sp = words[k]; sp.visible = !now.pluck && k === (now.hit ? (down ? 'D' : 'U') : 'M'); sp.position.set(now.hit ? 16 : 19, 2.5, arrow.position.z); }
      noPlay.forEach((d, s) => d.visible = fr[s] < 0);
      const hit = at(s0), hk = hit.stroke, age = pos - s0;
      riff.forEach((d, n) => {                                   // a riff note off the chord shape gets its own spot on the neck
        const r = hit.riff[n];
        d.visible = !!r && age < 1.5;
        if (d.visible) { const x = dotX(r.fret + capo); d.material.map = fretMap(r.fret); d.position.set(x, .9, stringZ(r.string, x)); d.material.opacity = 1 - age / 1.5; }
      });
      plucked.forEach((d, n) => { const st = hk.pluck?.[n]; d.visible = st !== undefined; if (d.visible) { d.material.map = letterTex[PIMA[st]]; d.material.opacity = Math.max(.25, 1 - age); d.position.set(10, 1.2, stringZ(st, 10)); } });
      const glow = lit && hk.hit && !hk.chuck ? Math.max(0, 1 - age * 1.6) : 0;
      const rings = s => hk.pluck ? hk.pluck.includes(s) : hit.frets[s] >= 0 && (hk.dir === 'D' || s >= 2);
      const t = shake();
      strings.forEach((m, s) => {
        const on = fr[s] >= 0 && rings(s) ? glow : 0;
        m.material.emissive.copy(fr[s] < 0 ? skipColour : colour.copy(glowColour).multiplyScalar(on));   // skipped strings stay red, struck ones glow warm
        m.scale.x = m.scale.z = 1 + on * (.9 + Math.sin(t * (70 + s * 9)) * .5);   // and blur wide, the way a vibrating string looks
      });
      // upcoming strokes wait in a line towards the bridge, fade in at the far end, and reach the arrow exactly on their count
      queue.forEach((q, n) => {
        const i = s0 + 1 + n, { stroke: k, count } = at(i), x = 10 - (i - pos) / 2 * 9, fade = THREE.MathUtils.clamp((x + 14) / 7, 0, 1);
        q.g.position.set(x, 2.5, (zLo + zHi) / 2); q.g.rotation.x = k.dir === 'D' ? Math.PI / 2 : -Math.PI / 2; q.g.scale.setScalar(k.accent ? 1.4 : 1);
        q.mat.color.set(!k.hit ? C.onScene : k.pluck ? C.pluck : k.chuck ? C.chuck : DIR[k.dir]); q.mat.wireframe = !k.hit; q.mat.opacity = fade * (k.hit ? .95 : .7);
        q.g.visible = !k.pluck;
        q.dots.forEach((d, m) => { const st = k.pluck?.[m]; d.visible = st !== undefined; if (d.visible) { d.material.map = letterTex[PIMA[st]]; d.material.opacity = fade * .9; d.position.set(x, 1.2, stringZ(st, 10)); } });
        q.cnt.material.map = countTex[count]; q.cnt.material.opacity = fade * (k.hit ? .9 : .5);
        q.cnt.position.set(x, 2.5, (zLo + zHi) / 2 + (playerView ? -5 : 5));
      });
    },
  };
}
