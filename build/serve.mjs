#!/usr/bin/env node
// Static server for dist/ with the 404 page. Usage: node build/serve.mjs [port] [--watch]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const port = +(process.argv.find((a) => /^\d+$/.test(a)) || process.env.PORT || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    fs.createReadStream(path.join(DIST, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache', 'x-robots-tag': 'noindex, nofollow' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving dist/ at http://localhost:${port}/`));

if (process.argv.includes('--watch')) {
  let timer = null;
  const rebuild = () => { clearTimeout(timer); timer = setTimeout(() => { const b = spawn(process.execPath, [path.join(ROOT, 'build', 'build.mjs')], { stdio: 'inherit' }); }, 150); };
  for (const d of ['courses', 'shared', 'build']) fs.watch(path.join(ROOT, d), { recursive: true }, rebuild);
  console.log('Watching courses/, shared/ and build/ for changes.');
}
