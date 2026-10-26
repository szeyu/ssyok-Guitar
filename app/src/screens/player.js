// The player: the top bar with the song and its section timeline (or the strum steps' stepper), the Tools menu, the stage (the two 3D windows with the
// floating chord box, the strum lane, the verdict word on each tap), the transport, and the results card at the song's end. One clock drives the sound, the 3D, the lane and the count-in;
// nothing is drawn while the player is hidden, or while it is paused with nothing changing.
import { slotAt, slotsPerBar, sections, lyricLines } from '../engine/song.js';
import { voicing } from '../engine/chords.js';
import { loopRange, songSlot, speedUp, countIn, strumSteps, stepAt, stepSong, slowBpm, TEMPO_MIN, TEMPO_MAX } from '../engine/practice.js';
import { judge, summary } from '../engine/judge.js';
import { handAt, playedAt } from '../engine/hand.js';
import { createClock, audioContext, heardTime } from '../audio/clock.js';
import { createSynth } from '../audio/synth.js';
import { drawLane, positionAt, hitLineY } from '../views/lane.js';
import { chordBox } from '../views/chordbox.js';
import { el } from '../views/dom.js';
import { showScreen, onScreen, screenShowing } from './shell.js';

const $ = id => document.getElementById(id);
const LOG = new URLSearchParams(location.search).has('log');   // ?log: a trace of when each slot is scheduled and when it is drawn
const ICON = { play: 'M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z', pause: 'M6 4h4.5v16H6zM13.5 4H18v16h-4.5z' };
const LOOPS = [['song', 'whole song'], ['bar', 'this bar'], ['change', 'this chord change']];

let song, source, step = null, picks, capo = 0, bpm = 80, kind = 'song', loop, start = 0, melody = true, ramp = false, synth, raf = 0;
let playerView = true, showHand = true, scenes;               // scenes: the 3D windows, made on first opening (null: no WebGL)
// song: what plays, the source song or a strum step's stage made from it; step: the strum step playing, null = the whole song
let drawn, sped = null;            // sped: { time, bpm }, a speed-up the readout shows once it is heard
const resetDrawn = () => { drawn = { slot: -1, words: '', chord: '', next: '' }; };
resetDrawn();
// the run being judged: a verdict for each tap, and the song slots played (not counted in), for the results card
let verdicts = [], played = new Set();
const resetRun = () => { verdicts = []; played = new Set(); };
const scheduled = new Map();                                   // slot -> audio time, for the ?log trace
const rate = () => bpm / 60 * (song.compound ? 3 : 2);          // slots a second; bpm is the song's unit (the dotted quarter in 6/8)
const per = () => slotsPerBar(song);
const fretsOf = chord => voicing(song, chord, picks).frets;
const still = matchMedia('(prefers-reduced-motion: reduce)');   // reduced motion: the hand still moves (it shows the change); the strings do not glow or shake, the strum arrow does not swing, the fingers do not pop

const clock = createClock({
  play(slot, t, counting) {
    const { pulses, slots } = countIn(song);
    if (counting) { if ((start - slot) % slots === 0) synth.click(t, start - slot === pulses * slots); return; }
    const songAt = songSlot(song, loop, slot), here = slotAt(song, songAt), inBar = songAt % per(), stroke = here.stroke;
    played.add(songAt);
    if (LOG) { scheduled.set(slot, t); console.log(`PLAY slot=${slot} at=${t.toFixed(3)} bar=${here.bar + 1} count=${here.count} chord=${here.chord} bpm=${bpm}`); }
    if (inBar % slots === 0) synth.click(t, inBar === 0);
    if (melody && here.note) synth.sing(here.note.hz * 2 ** (capo / 12), t, here.note.slots / rate());
    if (!stroke.hit) return;
    if (stroke.chuck) return synth.chuck(t);
    const frets = fretsOf(here.chord), up = f => f < 0 ? -1 : f + capo;
    if (stroke.pluck) return synth.pick(stroke.pluck.map(s => ({ s, fret: up(stroke.fret[s] ?? frets[s]) })).filter(n => n.fret >= 0), t);
    synth.strum(frets.map(up), stroke.dir, stroke.accent, t);
  },
  lap(time) {                                                   // a loop comes round: a little faster if asked (the clock takes the new rate from here)
    if (kind === 'song' && !step) return 0;                     // the whole song (not a stage) ends instead, and shows how it went
    if (ramp) { bpm = speedUp(bpm); sped = { time, bpm }; }
    return rate();
  },
});

// ---- drawing: one frame at a time, only while something changes ----
function redraw() { if (!raf) raf = requestAnimationFrame(frame); }
function frame() {
  raf = 0;
  if (screenShowing() !== 'player') return;
  clock.tick();
  if (clock.over) return finish();
  const { pos, countLeft } = clock.now();
  drawLane($('lane'), { song, loop, pos, countLeft, frets: fretsOf });
  const hand = handAt(song, loop, pos, rate());
  showChords(hand);
  if (scenes?.draw) {                                          // still loading: a promise
    const eased = hand.move * hand.move * (3 - 2 * hand.move);  // the fingers set off and land gently
    scenes.draw({ pos, at: i => playedAt(song, songSlot(song, loop, i), picks), capo, playing: clock.playing, lit: clock.playing && !countLeft && !still.matches,
      still: still.matches, playerView, showHand, hand: { cur: voicing(song, hand.chord, picks), nxt: voicing(song, hand.next, picks), move: eased } });
  }
  const slot = Math.floor(pos), songAt = songSlot(song, loop, slot);
  if (sped && heardTime() >= sped.time) { showTempo(sped.bpm); sped = null; }
  if (LOG && clock.playing && !countLeft && slot !== drawn.slot && scheduled.has(slot)) {
    const heard = heardTime(), late = (heard - scheduled.get(slot)) * 1000;
    console.log(`DRAW slot=${slot} at=${heard.toFixed(3)} scheduled=${scheduled.get(slot).toFixed(3)} late=${late.toFixed(1)}ms bpm=${bpm}`);
    scheduled.delete(slot);
  }
  if (!countLeft) drawn.slot = slot;
  showWhere(songAt);
  if (clock.playing) raf = requestAnimationFrame(frame);
  else if (LOG) console.log('IDLE: the frame loop stops until something changes');
}

// the floating chord box: the chord held now and the next one, redrawn only when they change
function showChords({ chord, next }) {
  if (drawn.chord === chord && drawn.next === next) return;
  drawn.chord = chord; drawn.next = next;
  $('chordFloat').ariaLabel = `${chord}, next: ${next}`;
  $('chordFloat').replaceChildren(el('p', { textContent: chord }), el('p', { className: 'nx' }, 'next: ', el('b', { textContent: next })),
    chordBox(voicing(song, chord, picks)), chordBox(voicing(song, next, picks)));
}

// the section timeline and the words follow the position; the DOM changes only when what they show does
function showWhere(songAt) {
  const bar = Math.floor(songAt / per()), all = sections(song), j = all.findLastIndex(s => s.bar <= bar), sec = all[j];
  [...$('timeline').children].forEach((li, i) => {
    const b = li.firstChild;
    b.classList.toggle('past', i < j); b.classList.toggle('now', i === j);
    if (i === j) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  $('timeline').style.setProperty('--through', ((songAt / per() - sec.bar) / sec.bars).toFixed(3));
  const { now, next } = lyricLines(song, songAt), key = JSON.stringify([now, next, step?.n]);
  if (key === drawn.words) return;
  drawn.words = key;
  if (step) {                                                  // a stage has no words: say how to play it
    $('lyricNow').replaceChildren(); $('lyricNext').replaceChildren(step.say);
    return;
  }
  $('lyricNow').replaceChildren(...now ? [el('mark', { textContent: now.chord }), el('span', { textContent: now.sung }), el('span', { className: 'unsung', textContent: now.text.slice(now.sung.length) })] : []);
  $('lyricNext').replaceChildren(...next ? ['next: ', el('b', { textContent: next.chord }), ' ' + next.text] : []);
}

// ---- judging: the arrow keys tap along, a verdict word rises off the hit line, and the song's end shows the results ----
const placeVerdict = () => { $('verdict').style.top = `${$('lane').offsetTop + hitLineY($('lane')) - 56}px`; };   // just above the hit line
/** Shows a verdict's words over the hit line: rising and fading, or with held true staying put (the ?verdict flag). */
export function showVerdict(text, held = false) {
  const v = $('verdict');
  v.textContent = text; v.dataset.tone = text === 'Good' ? 'good' : / here$/.test(text) ? 'bad' : 'off';
  placeVerdict();
  v.classList.toggle('held', held);
  v.getAnimations().forEach(a => a.cancel());
  if (!held) v.animate(still.matches ? [{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }]   // reduced motion: no rise
    : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 1, offset: .4 }, { opacity: 0, transform: 'translateY(-48px)' }], { duration: 900, easing: 'ease-out' });
}

/** Judges a tap going dir ('D' or 'U') pressed ago seconds back, against the nearest slot of the song as it is heard. */
function tap(dir, ago) {
  const { pos, countLeft } = clock.now(ago);
  if (countLeft > .5) return;                                   // still counting in (half a slot early is the first stroke, early)
  const at = pos - countLeft, near = Math.round(at), v = judge(song, songSlot(song, loop, near) + at - near, dir, rate());
  verdicts.push(v); showVerdict(v.text);
}

// the song has played to its end: stop, go back to the start, and show how it went
function finish() { togglePlay(); seek(0); showResults(); }

/** The results card for the run so far: the on-time percentage and the bar with the most misses, by number and section. */
export function showResults() {
  const r = summary(source, verdicts, played), bar = r.worstBar;
  const sec = bar === null ? null : sections(source).findLast(x => x.bar <= bar);
  $('resultsScore').textContent = r.taps ? `${r.percentOnTime}%` : '';
  $('resultsSay').textContent = !r.taps ? 'Next time, tap the down and up arrows along with the strokes, and you will see how your timing went.'
    : `${r.onTime} of ${r.hits} strokes on time.` + (bar === null ? ' Not one miss.' : ` Bar ${bar + 1}${sec.name !== 'Start' ? `, in ${sec.name},` : ''} gave you the most trouble.`);
  $('practiseBar').hidden = !r.taps || bar === null;
  $('practiseBar').dataset.bar = bar;
  $('results').hidden = false; $('again').focus();
}
function closeResults() { $('results').hidden = true; resetRun(); }

/** ?done: the results card from a fixed made-up run fed through the real judging, so its numbers are what the engine says:
 *  every stroke of the song tapped the right way, a little off but inside the window, except that every 17th slot's stroke
 *  is left untapped and bar 3 is all late (140 ms, or less at a fast tempo, so it stays nearest its own slot). */
export function demoResults() {
  resetRun();
  for (let s = 0; s < source.bars.length * per(); s++) {
    played.add(s);
    const { stroke, bar } = slotAt(source, s);
    if (!stroke.hit || s % 17 === 5) continue;
    const ms = bar === 2 ? Math.min(140, 400 / rate()) : s % 5 * 12;
    verdicts.push(judge(source, s + ms / 1000 * rate(), stroke.dir, rate()));
  }
  showResults();
}

// ---- the transport ----
function showTempo(v) {
  bpm = Math.round(Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, v)));
  $('tempo').value = bpm; $('bpm').textContent = bpm;
  $('tempo').style.setProperty('--fill', `${100 * (bpm - TEMPO_MIN) / (TEMPO_MAX - TEMPO_MIN)}%`);
}
function setTempo(v) { sped = null; showTempo(v); clock.setRate(rate()); }

function setLoop(k) {
  kind = k; resetRun();
  const { pos } = clock.now(), songAt = songSlot(song, loop, Math.floor(pos));
  loop = loopRange(song, kind, songAt); clock.setLoop(loop);
  if (Math.floor(pos) !== songAt) clock.seek(songAt + pos % 1);       // the position had run on past the song's end inside a loop
  $('loop').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
  redraw();
}

/** Jumps to a song slot. The loop follows: a bar or chord-change loop is chosen again where you land. */
function seek(slot) {
  loop = loopRange(song, kind, slot); clock.setLoop(loop); clock.seek(slot);
  redraw();
}

function togglePlay() {
  if (clock.playing) { clock.stop(); synth.volume(false); }
  else {
    if (!$('results').hidden) closeResults();                   // Space on the card: play again
    const ctx = audioContext(); ctx.resume();
    synth ??= createSynth(ctx); synth.volume(true);
    const { pulses, slots } = countIn(song);
    start = Math.floor(clock.now().pos);
    clock.setLoop(loop); clock.start(start, rate(), pulses * slots);
  }
  const on = clock.playing;
  $('play').setAttribute('aria-label', on ? 'Pause' : 'Play');
  $('play').querySelector('path').setAttribute('d', on ? ICON.pause : ICON.play);
  redraw();
}

/** Opens or closes the Tools menu (no argument: the other way). */
export function toggleTools(open = $('tools').hidden) {
  $('tools').hidden = !open; $('toolsBtn').setAttribute('aria-expanded', String(open));
}
const toggle = (id, on) => $(id).setAttribute('aria-pressed', String(on));

/** Player's view (on: the guitar as you hold it; off: as the audience sees it) and Show the hand. */
export function setView({ player = playerView, hand = showHand } = {}) {
  toggle('playerView', playerView = player); toggle('showHand', showHand = hand);
  redraw();
}

/** Opens the player for a song with your fingering picks and capo, at a strum step's stage (0 = the whole song), at a tempo
 *  (the song's, or STEP_BPM for a stage), at a bar (0 = the start), paused or playing. */
export function openPlayer(s, { picks: p = {}, capo: c = 0, step: n = 0, tempo, bar = 0, play = false } = {}) {
  if (clock.playing) togglePlay();
  source = s; picks = p; capo = c;
  // the 3D loads on first opening, so nothing of it exists behind the library; without WebGL (or offline) the player goes on without it
  if (scenes === undefined) scenes = import('../views/scene/index.js').then(m => { scenes = m.createScenes([...document.querySelectorAll('#player .scene')], redraw); redraw(); }, () => { scenes = null; });
  $('playerSong').textContent = source.title;
  $('timeline').replaceChildren(...sections(source).map(sec => el('li', { style: `flex-grow:${Math.max(sec.bars, source.bars.length / 24)}` },   // a short section stays readable
    el('button', { type: 'button', textContent: sec.name, title: `${sec.name}, bar ${sec.bar + 1}`, ariaLabel: `${sec.name}, bar ${sec.bar + 1}`, onclick: () => seek(sec.bar * per()) }))));
  $('pulse').hidden = !source.compound;
  setStep(n, { tempo, bar });
  showScreen('player');
  if (play) togglePlay();
  redraw();
}

/** Plays strum step n (1 = the first) over the song's first bars at STEP_BPM, or with 0 (or a step the song does not have)
 *  the whole song again at its own tempo. From the start, or a bar given; playing goes on if it was. While stepping the loop
 *  stays the stage's bars: the bar and chord-change loops are off. */
function setStep(n, { tempo, bar = 0 } = {}) {
  const all = strumSteps(source);
  step = stepAt(source, n) ?? null;
  song = step ? stepSong(source, step) : source;
  kind = 'song'; resetDrawn();
  $('timeline').hidden = !!step; $('steps').hidden = !step; toggle('stepsBtn', !!step);
  $('loop').querySelectorAll('button').forEach(b => { b.disabled = !!step && b.dataset.kind !== 'song'; });
  if (step) {
    $('stepDots').replaceChildren(...all.map(x => el('button', { type: 'button', textContent: x.n, title: x.name, ariaLabel: `Step ${x.n}: ${x.name}`,
      ariaCurrent: x === step ? 'step' : null, onclick: () => setStep(x.n) })));
    $('stepName').textContent = step.name;
    $('stepPrev').disabled = step.n === 1;
    $('stepNext').textContent = step.n < all.length ? 'Next step' : 'Now the song';
  }
  const at = Math.min(song.bars.length - 1, Math.max(0, bar)) * per();
  loop = loopRange(song, kind, at); clock.setLoop(loop); clock.seek(at);
  setTempo(tempo ?? song.bpm); setLoop('song');
}

$('play').onclick = togglePlay;
$('stepsBtn').onclick = () => setStep(step ? 0 : 1);
$('stepsDone').onclick = () => setStep(0);
$('stepPrev').onclick = () => setStep(step.n - 1);
$('stepNext').onclick = () => setStep(step.n + 1);   // past the last step: the song
$('reset').onclick = () => { resetRun(); seek(0); };
$('again').onclick = () => { closeResults(); togglePlay(); };
$('slower').onclick = () => { closeResults(); setTempo(slowBpm({ bpm })); togglePlay(); };   // 70% of the tempo just played
$('practiseBar').onclick = () => { const bar = +$('practiseBar').dataset.bar; closeResults(); seek(bar * per()); setLoop('bar'); togglePlay(); };
$('resultsSongs').onclick = () => { closeResults(); showScreen('library'); };
$('tempo').min = TEMPO_MIN; $('tempo').max = TEMPO_MAX;
$('tempo').oninput = e => setTempo(+e.target.value);
$('loop').replaceChildren(...LOOPS.map(([k, label]) => el('button', { type: 'button', textContent: label, onclick: () => setLoop(k) })));
$('loop').querySelectorAll('button').forEach((b, i) => { b.dataset.kind = LOOPS[i][0]; });
$('toolsBtn').onclick = () => toggleTools();
$('melody').onclick = () => toggle('melody', melody = !melody);
$('ramp').onclick = () => toggle('ramp', ramp = !ramp);
$('playerView').onclick = () => setView({ player: !playerView });
$('showHand').onclick = () => setView({ hand: !showHand });
$('playerHome').onclick = () => showScreen('library');
$('playerSong').onclick = () => showScreen('song');
$('lane').onclick = e => {                                      // clicking the lane jumps to the bar under the pointer
  const { pos } = clock.now(), r = e.currentTarget.getBoundingClientRect();
  const songAt = songSlot(song, loop, Math.max(0, Math.round(positionAt(e.currentTarget, e.clientY - r.top, pos))));
  seek(Math.floor(songAt / per()) * per());
};
$('lane').onkeydown = e => {                                    // with the lane focused, the arrows jump a bar back or on
  const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
  if (!step) return;
  e.preventDefault();
  const bar = Math.floor(songSlot(song, loop, Math.floor(clock.now().pos)) / per());
  seek(Math.min(song.bars.length - 1, Math.max(0, bar + step)) * per());
};
new ResizeObserver(() => { placeVerdict(); redraw(); }).observe($('lane'));
new ResizeObserver(redraw).observe(document.querySelector('#player .views'));
document.fonts?.addEventListener?.('loadingdone', redraw);

onScreen('player', {
  esc() {                                                       // Esc closes the results card, then Tools, then leaves the steps, then the player
    if (!$('results').hidden) { closeResults(); $('play').focus(); } else if (!$('tools').hidden) toggleTools(false); else if (step) setStep(0); else showScreen('song');
  },
  leave() { if (clock.playing) togglePlay(); toggleTools(false); closeResults(); },
});
addEventListener('keydown', e => {
  if (screenShowing() !== 'player') return;
  const dir = { ArrowDown: 'D', ArrowUp: 'U' }[e.key];
  if (dir && clock.playing && !e.target.matches('input, textarea, select')) {   // the arrows tap along (not on the tempo slider)
    e.preventDefault();
    if (!e.repeat) tap(dir, Math.max(0, performance.now() - e.timeStamp) / 1000);
    return;
  }
  if (e.key !== ' ' || e.target.matches('input:not([type=range]), textarea')) return;
  e.preventDefault();                                           // Space plays and pauses, and does not also press the focused button
  if (!e.repeat) togglePlay();
});
addEventListener('keyup', e => { if (e.key === ' ' && screenShowing() === 'player') e.preventDefault(); });
