// The ?log trace: plays a song in headless Chrome in real time and prints each slot's drawn-vs-scheduled lateness.
// Usage: node tools/trace.js <url with &log> [seconds=14], e.g. node tools/trace.js "http://localhost:8765/app/?song=2&play=1&go=1&bpm=40&log"
// Real time on purpose: --virtual-time-budget runs the page clock ahead of the AudioContext, so the count-in never ends
// and nothing is drawn; and new headless Chrome does not print console lines to stderr, so they are read over CDP.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, seconds = 14] = process.argv.slice(2);
if (!url) { console.error('Usage: node tools/trace.js <url with &log> [seconds]'); process.exit(1); }
const chrome = [process.env.CHROME, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'].find(bin => bin && !spawnSync(bin, ['--version']).error);
const port = 9300 + Math.floor(Math.random() * 600);
const browser = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, '--autoplay-policy=no-user-gesture-required',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'trace-'))}`, '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' });

let page;
for (let i = 0; i < 50 && !page; i++) {
  await new Promise(r => setTimeout(r, 200));
  page = await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json()).then(list => list.find(t => t.type === 'page')?.webSocketDebuggerUrl, () => null);
}
const late = [], socket = new WebSocket(page);
socket.onopen = () => ['Runtime.enable', ['Page.navigate', { url }]].forEach((m, id) => socket.send(JSON.stringify({ id, ...(Array.isArray(m) ? { method: m[0], params: m[1] } : { method: m }) })));
socket.onmessage = e => {
  const { method, params } = JSON.parse(e.data);
  if (method === 'Runtime.exceptionThrown') console.log('ERROR', params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
  if (method !== 'Runtime.consoleAPICalled') return;
  const line = params.args.map(a => a.value ?? a.description).join(' ');
  console.log(line);
  const ms = line.match(/^DRAW .* late=(-?[\d.]+)ms/)?.[1];
  if (ms) late.push(+ms);
};
setTimeout(() => {
  browser.kill();
  late.sort((a, b) => a - b);
  console.log(late.length ? `drawn ${late.length} slots, late ms: min ${late[0]} median ${late[late.length >> 1]} max ${late.at(-1)}` : 'no DRAW lines');
  process.exit(late.length ? 0 : 1);
}, seconds * 1000);
