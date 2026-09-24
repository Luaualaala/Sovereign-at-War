'use strict';
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = __dirname;
const PORT = Number(process.env.SOVEREIGNS_PORT || 8837);
const SAVE_DIR = path.resolve(ROOT, process.env.SOVEREIGNS_SAVE_DIRECTORY || 'saves');
if(path.relative(ROOT,SAVE_DIR).startsWith('..') || path.isAbsolute(path.relative(ROOT,SAVE_DIR))) throw new Error('Save files must remain inside this game project.');
for (const file of ['data.js', 'core.js', 'research.js', 'warfare.js', 'systems.js']) require(path.join(ROOT, file));
const GS = globalThis.GS;
const staticFiles = new Map(['index.html', 'styles.css', 'data.js', 'core.js', 'research.js', 'warfare.js', 'systems.js', 'ui.js'].map(file => ['/' + file, file]));
const slots = /^(1|2|3|auto0|auto1|auto2)$/;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const json = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
async function versions() {
  const entries = await fsp.readdir(SAVE_DIR).catch(() => []), found = [];
  for (const name of entries.filter(n => /^(1|2|3|auto[012])-\d+-[a-f0-9]+\.json$/.test(n))) {
    try {
      const saved = JSON.parse(await fsp.readFile(path.join(SAVE_DIR, name), 'utf8'));
      GS.restore(saved.data);
      found.push({ ...saved, filename: name });
    } catch { /* An interrupted save never hides a prior intact revision. */ }
  }
  return found.sort((a, b) => b.created - a.created);
}
function allowedOrigin(req) {
  const allowed = [`127.0.0.1:${PORT}`, `localhost:${PORT}`];
  if (!allowed.includes(req.headers.host)) return false;
  if (req.headers.origin && !allowed.map(h => 'http://' + h).includes(req.headers.origin)) return false;
  return !req.headers['sec-fetch-site'] || ['same-origin', 'none'].includes(req.headers['sec-fetch-site']);
}
async function body(req) {
  const chunks = []; let bytes = 0;
  for await (const chunk of req) { bytes += chunk.length; if (bytes > 26000000) throw new Error('Save exceeds the supported size.'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
const server = http.createServer(async (req, res) => {
  try {
    if (!allowedOrigin(req)) return json(res, 403, { error: 'This local game accepts requests only from its own address.' });
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`), pathname = url.pathname;
    if (pathname === '/api/health' && req.method === 'GET') return json(res, 200, { app: 'sovereigns-at-war', version: 1, root: ROOT, port: PORT });
    if (pathname === '/api/saves' && req.method === 'GET') {
      const all = await versions(), seen = new Set();
      return json(res, 200, { saves: all.filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; }).map(({ data, filename, ...v }) => ({ ...v, versions: all.filter(s => s.id === v.id).length })) });
    }
    const match = pathname.match(/^\/api\/saves\/([^/]+)$/);
    if (match) {
      const id = match[1]; if (!slots.test(id)) return json(res, 400, { error: 'Choose manual slot 1–3 or rotating autosave 0–2.' });
      if (req.method === 'GET') { const saved = (await versions()).find(v => v.id === id); return saved ? json(res, 200, { data: saved.data, name: saved.name, created: saved.created }) : json(res, 404, { error: 'This save slot is empty.' }); }
      if (req.method === 'POST') {
        if (!String(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { error: 'Save requests require JSON.' });
        const input = await body(req), state = GS.restore(input.data);
        const name = String(input.name || `${GS.country(state, state.player).short} · ${GS.date(state.day)}`).slice(0, 100);
        const saved = { id, name, day: state.day, country: GS.country(state, state.player).name, created: Date.now(), data: input.data };
        await fsp.mkdir(SAVE_DIR, { recursive: true });
        const filename = `${id}-${saved.created}-${crypto.randomBytes(4).toString('hex')}.json`;
        await fsp.writeFile(path.join(SAVE_DIR, filename), JSON.stringify(saved), { encoding: 'utf8', flag: 'wx' });
        GS.restore(JSON.parse(await fsp.readFile(path.join(SAVE_DIR, filename), 'utf8')).data);
        return json(res, 201, { ok: true, id, name, day: saved.day, created: saved.created });
      }
      return json(res, 405, { error: 'Use GET or POST for campaign saves.' });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Unsupported request.' });
    const file = staticFiles.get(pathname === '/' ? '/index.html' : pathname);
    if (!file) { if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); } return json(res, 404, { error: 'Game resource not found.' }); }
    const content = await fsp.readFile(path.join(ROOT, file));
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cross-Origin-Resource-Policy': 'same-origin' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) { if (!res.headersSent) json(res, 400, { error: error.message }); else res.end(); }
});
server.on('error', error => { console.error(`Sovereigns at War could not start: ${error.message}`); process.exitCode = 1; });
server.listen(PORT, '127.0.0.1', () => console.log(`Sovereigns at War ready at http://127.0.0.1:${PORT}/. Saves remain in ${SAVE_DIR}.`));
process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
