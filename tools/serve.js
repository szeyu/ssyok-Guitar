// Serves the repo root for the browser, telling it never to cache, so a plain reload always runs the latest code.
// Usage: node tools/serve.js [port=8765], then open http://localhost:8765/app/
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

/** Starts serving the repo root on port (0: any free one) at host; resolves with the server once it listens. */
// ponytail: no ranges, no gzip; enough for one person practising on their own machine.
export const serve = (port, host = '127.0.0.1') => new Promise((started) => {
  const server = createServer((req, res) => {
    let file;
    try { file = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname)); }
    catch { res.writeHead(400).end(); return; }                // a malformed address answers 400 instead of stopping the server
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(file));
  });
  server.listen(port, host, () => started(server));
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = +(process.argv[2] ?? 8765);
  await serve(port, 'localhost');
  console.log(`Serving the app at http://localhost:${port}/app/ (no caching). Ctrl+C to stop.`);
}
