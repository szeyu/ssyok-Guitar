// Screenshot check: every screen state in headless Chrome, beside the Hum mockup.
// Usage: node tools/screenshots.js [--base http://localhost:8765] [--out DIR]
// Needs only Node and Chrome ($CHROME, or google-chrome/chromium on PATH). If --base does not
// answer, it serves the repo root itself for this run. Default output: shots/ (git-ignored).
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { serve } from './serve.js';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// One line per screen state. A later ticket un-skips its state: fill in `path`, delete `skip`.
const STATES = [
  { name: 'library', path: 'app/', size: [1280, 800] },
  { name: 'library-narrow', path: 'app/', size: [390, 844] },
  { name: 'song', path: 'app/?song=2', size: [1280, 800] },
  { name: 'player-mid-song', path: 'app/?song=2&play=1&at=7', size: [1280, 800] },
  { name: 'player-high-neck', path: 'app/?song=5&play=1&at=46', size: [1280, 800] },   // Always With Me, G at frets 12 to 15
  { name: 'player-audience', path: 'app/?song=2&play=1&at=7&view=audience', size: [1280, 800] },
  { name: 'tools', path: 'app/?song=2&play=1&at=7&tools=1', size: [1280, 800] },
  { name: 'drill', path: 'app/?song=2&drill=2', size: [1280, 800] },
  { name: 'verdict', path: 'app/?song=2&play=1&at=7&verdict=Late%2040%20ms', size: [1280, 800] },
  { name: 'tuner', path: 'app/?song=2&play=1&at=7&tuner=1', size: [1280, 800] },
  { name: 'results', path: 'app/?song=2&done=1', size: [1280, 800] },
  { name: 'builder', path: 'app/?song=1&edit=1', size: [1280, 800] },
  { name: 'builder-new', path: 'app/?build=1', size: [1280, 800] },
  { name: 'builder-errors', path: 'app/?paste=bad', size: [1280, 1400] },
  { name: 'sheet', path: 'app/?song=2&sheet=1', size: [1280, 800] },
  { name: 'sheet-raw', path: 'app/?song=2&sheet=raw', size: [1280, 800] },
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg) => { console.error(msg); process.exitCode = 1; };
const die = (msg) => { console.error(msg); process.exit(1); };

const flagValue = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  if (i < 0) return fallback;
  const value = process.argv[i + 1];
  if (!value || value.startsWith('--')) die(`${flag} needs a value, e.g. ${flag} ${fallback}`);
  return value;
};
let base = flagValue('--base', 'http://localhost:8765').replace(/\/?$/, '/');
const out = resolve(flagValue('--out', join(root, 'shots')));

const chrome = [process.env.CHROME, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']
  .find((bin) => bin && !spawnSync(bin, ['--version']).error);
if (!chrome) die('Chrome not found: set $CHROME or put google-chrome/chromium on PATH.');

const statusOf = (url) => fetch(url).then((res) => res.status, () => 0);

let server;
const stopServer = () => server?.close();
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopServer(); process.exit(1); });

if (!(await statusOf(base))) {
  server = await serve(0);
  base = `http://127.0.0.1:${server.address().port}/`;
  console.log(`serving the repo root at ${base} for this run`);
}

try {
  mkdirSync(out, { recursive: true });
  const mockup = join(root, 'prototype/designs/hum/shot.png');
  if (existsSync(mockup)) {
    copyFileSync(mockup, join(out, 'hum-mockup.png'));
    console.log(join(out, 'hum-mockup.png'));
  } else {
    console.log(`note: Hum mockup missing at ${mockup}; continuing without it`);
  }

  for (const state of STATES) {
    if (state.skip) { console.log(`skipped ${state.name}: ${state.skip}`); continue; }
    const url = base + state.path;
    const file = join(out, `${state.name}.png`);
    rmSync(file, { force: true });
    const status = await statusOf(url);
    if (status !== 200) { fail(`failed: ${state.name} (${url}) answered ${status || 'nothing'}, not 200`); continue; }
    // Async: the built-in server lives in this process and must keep answering Chrome.
    await promisify(execFile)(chrome, [
      '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
      `--window-size=${state.size.join(',')}`, '--virtual-time-budget=9000', `--screenshot=${file}`, url,
    ], { timeout: 60000 }).catch(() => {});
    if (existsSync(file) && statSync(file).size > 0) console.log(file);
    else fail(`failed: ${state.name} (${url}) wrote no screenshot`);
  }
} finally {
  stopServer();
}
