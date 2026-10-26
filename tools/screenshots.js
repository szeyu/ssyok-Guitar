// Screenshot check: every screen state in headless Chrome, beside the Hum mockup.
// Usage: node tools/screenshots.js [--base http://localhost:8765] [--out DIR]
// Needs only Node and google-chrome. Default output: shots/ at the repo root (git-ignored).
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// One line per screen state. A later ticket un-skips its state by deleting `skip`.
const STATES = [
  { name: 'library', path: 'app/', size: [1280, 800] },
  { name: 'library-narrow', path: 'app/', size: [390, 844] },
  { name: 'song', path: 'app/?song=2', size: [1280, 800], skip: 'ticket 03' },
  { name: 'player-mid-song', path: 'app/', size: [1280, 800], skip: 'ticket 04' },
  { name: 'tools', path: 'app/', size: [1280, 800], skip: 'ticket 04' },
  { name: 'results', path: 'app/', size: [1280, 800], skip: 'ticket 07' },
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : fallback;
};
let base = arg('--base', 'http://localhost:8765').replace(/\/?$/, '/');
const out = resolve(arg('--out', join(root, 'shots')));

const fail = (msg) => { console.error(msg); process.exitCode = 1; };
const answers = (url) => fetch(url).then((r) => r.ok, () => false);
const freePort = () => new Promise((ok) => {
  const s = createServer().listen(0, () => { const { port } = s.address(); s.close(() => ok(port)); });
});

if (spawnSync('google-chrome', ['--version']).error) {
  fail('google-chrome not found; install Chrome to run the screenshot check.');
  process.exit(1);
}

let server;
if (!(await answers(base))) {
  const port = await freePort();
  server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: root, stdio: 'ignore' });
  base = `http://localhost:${port}/`;
  for (let i = 0; i < 50 && !(await answers(base)); i++) await new Promise((r) => setTimeout(r, 100));
  console.log(`started python3 -m http.server ${port} for this run`);
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

  for (const s of STATES) {
    if (s.skip) { console.log(`skipped ${s.name}: added by ${s.skip}`); continue; }
    const file = join(out, `${s.name}.png`);
    rmSync(file, { force: true });
    spawnSync('google-chrome', [
      '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars',
      `--window-size=${s.size.join(',')}`, '--virtual-time-budget=9000', `--screenshot=${file}`, base + s.path,
    ], { stdio: 'ignore', timeout: 60000 });
    if (existsSync(file) && statSync(file).size > 0) console.log(file);
    else fail(`failed: ${s.name} (${base + s.path}) wrote no screenshot`);
  }
} finally {
  server?.kill();
}
