#!/usr/bin/env node
// Playtest harness: builds the game, serves the build, opens one isolated browser
// station per player and exposes a small HTTP API that the player CLI (pt.mjs) and
// the overseer CLI (ptadmin.mjs) talk to. Everything observed goes to
// playtest/runs/<round>/ for triage. See playtest/README.md.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLAYTEST_DIR = path.resolve(HERE, '..');
const GAME_DIR = path.resolve(PLAYTEST_DIR, '..', 'game');

// ------------------------------------------------------------------ options

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}
const opt = parseArgs(process.argv.slice(2));
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 13);
const ROUND = String(opt.round ?? stamp);
const MINUTES = Number(opt.minutes ?? 25);
const SPEED_SCALE = Number(opt.speed ?? 0.5);        // calendar speed relative to the game's default
const LOBBY = String(opt.lobby ?? 'manual');          // manual: players connect themselves; auto: harness seats everyone
const PLAYERS = Math.max(1, Math.min(4, Number(opt.players ?? 4)));
const PORT = Number(opt.port ?? process.env.PT_PORT ?? 4700);
const GAME_PORT = Number(opt['game-port'] ?? PORT + 10);
const HEADED = !!opt.headed;
const RUN_DIR = path.join(PLAYTEST_DIR, 'runs', ROUND);
const DIST_DIR = opt.dist ? path.resolve(String(opt.dist)) : path.join(RUN_DIR, 'dist');

// Stations render for a Full HD seat; players get a 1280x720 view of it and give
// coordinates in that view, so what they see maps 1:1 to what they click.
const NATIVE = { width: 1920, height: 1080 };
const VIEW = { width: 1280, height: 720 };
const K = NATIVE.width / VIEW.width;
const SETTLE_MS = 600;
const DEFAULT_DAYS_PER_SECOND = 30.44 / 60;           // game/src/core/state.ts

fs.mkdirSync(RUN_DIR, { recursive: true });
for (let i = 1; i <= PLAYERS; i++) fs.mkdirSync(path.join(RUN_DIR, 'shots', `p${i}`), { recursive: true });
fs.mkdirSync(path.join(RUN_DIR, 'state'), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = Date.now();
let deadline = t0 + MINUTES * 60_000;
const elapsed = () => Date.now() - t0;
const mmss = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
function logEvent(ev) {
  fs.appendFileSync(path.join(RUN_DIR, 'events.jsonl'), JSON.stringify({ t: Math.round(elapsed() / 100) / 10, ...ev }) + '\n');
}
const rel = (file) => path.relative(RUN_DIR, file).replace(/\\/g, '/');

// ------------------------------------------------------------------ build + serve

function build() {
  if (opt.dist) return { skipped: true };
  const run = (cmd) => spawnSync(cmd, { cwd: GAME_DIR, shell: true, encoding: 'utf8' });
  const tc = run('npx tsc --noEmit');
  const typecheck = { ok: tc.status === 0, output: (tc.stdout + tc.stderr).trim().slice(0, 6000) };
  const b = run(`npx vite build --outDir "${DIST_DIR}" --emptyOutDir --logLevel warn`);
  if (b.status !== 0) {
    fs.writeFileSync(path.join(RUN_DIR, 'build-error.txt'), b.stdout + b.stderr);
    console.error('BUILD FAILED\n' + (b.stdout + b.stderr).slice(-3000));
    process.exit(2);
  }
  return { typecheck };
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
function serveGame() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (url === '/__blank') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><title>tools</title>'); return; }
      let file = path.join(DIST_DIR, url === '/' ? 'index.html' : url);
      if (!file.startsWith(DIST_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST_DIR, 'index.html');
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(GAME_PORT, '127.0.0.1', () => resolve(srv));
  });
}

// ------------------------------------------------------------------ browser

function findBrowser() {
  const expected = chromium.executablePath();
  if (expected && fs.existsSync(expected)) return { executablePath: expected };
  const root = path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
  if (fs.existsSync(root)) {
    const dirs = fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const d of dirs) {
      for (const sub of ['chrome-win64', 'chrome-win']) {
        const exe = path.join(root, d, sub, 'chrome.exe');
        if (fs.existsSync(exe)) return { executablePath: exe };
      }
    }
  }
  return { channel: 'msedge' };
}

const INIT_SCRIPT = `
  window.__MC_PLAYTEST__ = true;
  window.__ptClip = '';
  try {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (t) => { window.__ptClip = String(t); },
      readText: async () => window.__ptClip,
    } });
  } catch (e) {}
`;

/** @type {{id:number,page:any,context:any,shotN:number,readIdx:number,lastHash:string,dialog:any,clipSeen:string,queue:Promise<any>,stats:any,done:boolean}[]} */
const players = [];
let browser;
let toolsPage;
const chat = [];                 // { n, at, from, text, attach? }
const attachments = new Map();   // id -> text
let nextAttach = 1;
let finished = false;

async function downscale(buf, w, h) {
  const out = await toolsPage.evaluate(async ({ b64, w, h }) => {
    const res = await fetch('data:image/png;base64,' + b64);
    const bmp = await createImageBitmap(await res.blob());
    const c = new OffscreenCanvas(w, h);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(bmp, 0, 0, w, h);
    const blob = await c.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, { b64: buf.toString('base64'), w, h });
  return Buffer.from(out, 'base64');
}

function withTimeout(promise, ms, what) {
  return Promise.race([promise, sleep(ms).then(() => { throw new Error(`timeout: ${what}`); })]);
}

async function shot(p, clip) {
  const png = await withTimeout(p.page.screenshot({ type: 'png', caret: 'initial', ...(clip ? { clip } : {}) }), 10_000, 'screenshot');
  const hash = crypto.createHash('sha1').update(png).digest('hex');
  let w = VIEW.width, h = VIEW.height;
  if (clip) {
    const f = Math.min(1, VIEW.width / clip.width, VIEW.height / clip.height);
    w = Math.round(clip.width * f); h = Math.round(clip.height * f);
  }
  const jpg = await downscale(png, w, h);
  const file = path.join(RUN_DIR, 'shots', `p${p.id}`, `${String(++p.shotN).padStart(4, '0')}${clip ? '-zoom' : ''}.jpg`);
  fs.writeFileSync(file, jpg);
  if (!clip) p.lastHash = hash;
  return { file, hash, w, h };
}

async function drainActions(p) {
  try {
    return await withTimeout(p.page.evaluate(() => (window.__mc ? window.__mc.drain().map((a) => ({ type: a.type, args: JSON.stringify(a.args).slice(0, 300) })) : [])), 3000, 'drain');
  } catch { return []; }
}

async function newPlayer(id) {
  const context = await browser.newContext({ viewport: NATIVE, deviceScaleFactor: 1 });
  await context.addInitScript(INIT_SCRIPT);
  const page = await context.newPage();
  const p = { id, page, context, shotN: 0, readIdx: 0, lastHash: '', dialog: null, clipSeen: '', queue: Promise.resolve(), done: false,
    stats: { commands: 0, looks: 0, inputs: 0, inputsNoEffect: 0, gameActions: 0, firstGameActionAt: null, lastGameActionAt: null, longestGapS: 0, says: 0, notes: 0, consoleErrors: 0 } };
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      if (m.type() === 'error') p.stats.consoleErrors++;
      logEvent({ ev: 'console', player: id, level: m.type(), text: m.text().slice(0, 800) });
    }
  });
  page.on('pageerror', (e) => { p.stats.consoleErrors++; logEvent({ ev: 'pageerror', player: id, text: String(e?.stack ?? e).slice(0, 1500) }); });
  page.on('dialog', (d) => {
    p.dialog = d;
    logEvent({ ev: 'dialog', player: id, kind: d.type(), text: d.message() });
    setTimeout(() => { if (p.dialog === d) { p.dialog = null; d.dismiss().catch(() => {}); } }, 120_000);
  });
  await page.goto(`http://127.0.0.1:${GAME_PORT}/`);
  players.push(p);
  return p;
}

// ------------------------------------------------------------------ player commands

const HELP = `You control one computer showing a web page. Commands (run each with the same prefix):
  look                      take a screenshot of your screen (1280x720). Open the printed file to see it.
  click X Y                 left click at X,Y (coordinates in the screenshot)
  dblclick X Y | rclick X Y
  hover X Y                 move the mouse there (tooltips)
  drag X1 Y1 X2 Y2          press at X1,Y1, move, release at X2,Y2
  scroll X Y up|down [N]    mouse wheel at X,Y, N notches (default 3)
  type "text"               type on the keyboard into whatever has focus
  key NAME                  press a key: Enter, Escape, Tab, Backspace, ArrowDown, Control+A ...
  paste [N]                 paste into the focused field: your own clipboard, or shared text #N from the chat
  zoom X1 Y1 X2 Y2          sharper close-up of a region of your screen (for small text)
  text                      the readable text currently on your screen
  wait S                    do nothing for S seconds (max 30), then screenshot. One wait per command; do not chain several.
  reload                    reload the page (like F5)
  dialog accept|dismiss     answer a browser popup (OK / Cancel)
  say "message"             talk to the other players (everyone hears it)
  say --clip "message"      same, and attach whatever you last copied so others can paste it
  note KIND "what happened" log an observation the moment it happens. KIND: confused | stuck | bug | waiting | good | idea | tool
  status                    time left
  finish "reason"           you have nothing more to try (ends your session)
Every command that changes something prints a new screenshot file. New messages from other players are printed after every command.`;

function header(p) {
  return `[Player ${p.id} | ${mmss(elapsed())} elapsed | ${mmss(deadline - Date.now())} left]`;
}
function unread(p) {
  const fresh = chat.slice(p.readIdx).filter((m) => m.from !== p.id);
  p.readIdx = chat.length;
  if (!fresh.length) return '';
  return '\n--- messages from other players ---\n' + fresh.map((m) => `Player ${m.from} (${mmss(m.at)}): ${m.text}${m.attach ? `  [shared text #${m.attach.id}, ${m.attach.len} characters — "paste ${m.attach.id}" puts it into your focused field]` : ''}`).join('\n');
}
const num = (v, name) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new UserError(`${name} must be a number, got "${v}".`);
  return n;
};
class UserError extends Error {}
function xy(a, i = 0) {
  const x = num(a[i], 'X'), y = num(a[i + 1], 'Y');
  if (x < 0 || y < 0 || x > VIEW.width || y > VIEW.height) throw new UserError(`Coordinates must be inside the ${VIEW.width}x${VIEW.height} screenshot.`);
  return [x * K, y * K];
}

/** Run an input on the page, wait for the UI to settle and return the follow-up screenshot text. */
async function act(p, cmd, args, fn) {
  const before = p.lastHash;
  p.stats.inputs++;
  await Promise.race([fn().catch((e) => { if (!p.dialog) throw e; }), sleep(6000)]);
  await sleep(SETTLE_MS);
  if (p.dialog) {
    logEvent({ ev: 'cmd', player: p.id, cmd, args, dialog: true });
    return dialogText(p);
  }
  const actions = await drainActions(p);
  const s = await shot(p);
  const changed = s.hash !== before;
  noteGameActions(p, actions);
  if (!changed && actions.length === 0 && ['click', 'dblclick', 'rclick', 'drag', 'key', 'type', 'paste'].includes(cmd)) p.stats.inputsNoEffect++;
  logEvent({ ev: 'cmd', player: p.id, cmd, args, actions, screenChanged: changed, shot: rel(s.file) });
  let extra = '';
  const clip = await p.page.evaluate(() => window.__ptClip).catch(() => '');
  if (clip && clip !== p.clipSeen) { p.clipSeen = clip; extra = `\n(Your clipboard now holds ${clip.length} characters of copied text.)`; }
  return `Screenshot: ${s.file}${extra}`;
}
function noteGameActions(p, actions) {
  const real = actions.filter((a) => !a.type.startsWith('core/'));
  if (!real.length) return;
  const now = elapsed();
  if (p.stats.firstGameActionAt === null) p.stats.firstGameActionAt = Math.round(now / 1000);
  else p.stats.longestGapS = Math.max(p.stats.longestGapS, Math.round((now - p.stats.lastGameActionAt * 1000) / 1000));
  p.stats.lastGameActionAt = Math.round(now / 1000);
  p.stats.gameActions += real.length;
}
function dialogText(p) {
  return `A browser popup is open (${p.dialog.type()}): "${p.dialog.message()}"\nAnswer it with: dialog accept   or   dialog dismiss`;
}

async function runCmd(p, argv) {
  const [cmd, ...a] = argv;
  p.stats.commands++;
  if (!cmd || cmd === 'help') return HELP;
  if (cmd === 'status') return `Time left: ${mmss(deadline - Date.now())}.`;
  if (cmd === 'note') {
    const kinds = ['confused', 'stuck', 'bug', 'waiting', 'good', 'idea', 'tool'];
    const kind = kinds.includes(a[0]) ? a.shift() : 'note';
    const text = a.join(' ').trim();
    if (!text) throw new UserError('Usage: note KIND "what happened"');
    p.stats.notes++;
    const rec = { t: Math.round(elapsed() / 1000), player: p.id, kind, text, shot: p.shotN ? `shots/p${p.id}/${String(p.shotN).padStart(4, '0')}.jpg` : null, game: lastSummary[p.id] ?? null };
    fs.appendFileSync(path.join(RUN_DIR, 'notes.jsonl'), JSON.stringify(rec) + '\n');
    return 'Noted.';
  }
  if (finished || Date.now() > deadline) return 'SESSION OVER. Stop playing now and write your final report.';
  if (p.done) return 'You already finished your session. Write your final report.';

  if (cmd === 'say') {
    let attach = null;
    if (a[0] === '--clip') {
      a.shift();
      const clip = await p.page.evaluate(() => window.__ptClip).catch(() => '');
      if (!clip) throw new UserError('Your clipboard is empty — copy something on your screen first.');
      const id = nextAttach++;
      attachments.set(id, clip);
      attach = { id, len: clip.length };
    }
    const text = a.join(' ').trim();
    if (!text && !attach) throw new UserError('Usage: say "message"');
    const m = { n: chat.length + 1, at: elapsed(), from: p.id, text, ...(attach ? { attach } : {}) };
    chat.push(m);
    p.stats.says++;
    fs.appendFileSync(path.join(RUN_DIR, 'chat.jsonl'), JSON.stringify({ ...m, at: Math.round(m.at / 1000) }) + '\n');
    return `Said to everyone${attach ? ` (with your copied text attached as #${attach.id})` : ''}.`;
  }
  if (cmd === 'finish') {
    p.done = true;
    logEvent({ ev: 'finish', player: p.id, reason: a.join(' ') });
    if (players.every((x) => x.done)) setTimeout(() => finalize('all players finished'), 500);
    return 'Session ended for you. Write your final report.';
  }
  if (cmd === 'dialog') {
    if (!p.dialog) return 'No popup is open.';
    const d = p.dialog;
    p.dialog = null;
    if (a[0] === 'accept') await d.accept(); else if (a[0] === 'dismiss') await d.dismiss(); else { p.dialog = d; throw new UserError('Usage: dialog accept | dialog dismiss'); }
    return act(p, cmd, a, async () => {});
  }
  if (p.dialog) return dialogText(p);

  const m = p.page.mouse, kb = p.page.keyboard;
  switch (cmd) {
    case 'look': {
      p.stats.looks++;
      const s = await shot(p);
      logEvent({ ev: 'cmd', player: p.id, cmd, shot: rel(s.file) });
      return `Screenshot: ${s.file}`;
    }
    case 'zoom': {
      const [x1, y1] = xy(a, 0), [x2, y2] = xy(a, 2);
      const clip = { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
      if (clip.width < 20 || clip.height < 20) throw new UserError('Zoom region is too small.');
      const s = await shot(p, clip);
      logEvent({ ev: 'cmd', player: p.id, cmd, args: a, shot: rel(s.file) });
      return `Close-up of screen region ${a.slice(0, 4).join(',')}: ${s.file}\n(Use coordinates from the full screenshot for clicks, not from this close-up.)`;
    }
    case 'text': {
      const t = await p.page.evaluate(() => document.body.innerText);
      logEvent({ ev: 'cmd', player: p.id, cmd });
      return `Text on your screen:\n${t.replace(/\n{3,}/g, '\n\n').slice(0, 7000)}`;
    }
    case 'click': { const [x, y] = xy(a); return act(p, cmd, a, () => m.click(x, y)); }
    case 'dblclick': { const [x, y] = xy(a); return act(p, cmd, a, () => m.dblclick(x, y)); }
    case 'rclick': { const [x, y] = xy(a); return act(p, cmd, a, () => m.click(x, y, { button: 'right' })); }
    case 'hover': { const [x, y] = xy(a); return act(p, cmd, a, () => m.move(x, y, { steps: 4 })); }
    case 'drag': {
      const [x1, y1] = xy(a, 0), [x2, y2] = xy(a, 2);
      return act(p, cmd, a, async () => { await m.move(x1, y1); await m.down(); await m.move(x2, y2, { steps: 16 }); await m.up(); });
    }
    case 'scroll': {
      const [x, y] = xy(a);
      const dir = a[2] === 'up' ? -1 : a[2] === 'down' ? 1 : null;
      if (dir === null) throw new UserError('Usage: scroll X Y up|down [N]');
      const n = Math.max(1, Math.min(20, Number(a[3] ?? 3) || 3));
      return act(p, cmd, a, async () => { await m.move(x, y); for (let i = 0; i < n; i++) { await m.wheel(0, dir * 100); await sleep(30); } });
    }
    case 'type': {
      const text = a.join(' ');
      if (!text) throw new UserError('Usage: type "text"');
      return act(p, cmd, [text.slice(0, 200)], () => kb.type(text, { delay: 8 }));
    }
    case 'key': {
      if (!a[0]) throw new UserError('Usage: key NAME   (Enter, Escape, Tab, Backspace, ArrowDown, Control+A ...)');
      return act(p, cmd, a, () => kb.press(a[0]).catch((e) => { throw new UserError(`Unknown key "${a[0]}".`); }));
    }
    case 'paste': {
      let text;
      if (a[0] !== undefined) {
        const id = Number(String(a[0]).replace('#', ''));
        text = attachments.get(id);
        if (text === undefined) throw new UserError(`There is no shared text #${a[0]}.`);
      } else {
        text = await p.page.evaluate(() => window.__ptClip);
        if (!text) throw new UserError('Your clipboard is empty.');
      }
      const focused = await p.page.evaluate(() => { const e = document.activeElement; return !!e && (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.isContentEditable); });
      if (!focused) throw new UserError('No text field has focus. Click into a text field first, then paste.');
      const r = await act(p, cmd, [a[0] ?? 'own', `${text.length} chars`], () => kb.insertText(text));
      return `Pasted ${text.length} characters.\n${r}`;
    }
    case 'wait': {
      const s = Math.max(1, Math.min(30, num(a[0] ?? 5, 'S')));
      await sleep(s * 1000);
      const sh = await shot(p);
      const actions = await drainActions(p);
      noteGameActions(p, actions);
      logEvent({ ev: 'cmd', player: p.id, cmd, args: [s], shot: rel(sh.file) });
      return `Waited ${s}s. Screenshot: ${sh.file}`;
    }
    case 'reload':
      return act(p, cmd, a, () => p.page.reload());
    default:
      throw new UserError(`Unknown command "${cmd}". Run "help" for the list.`);
  }
}

// ------------------------------------------------------------------ telemetry

const lastSummary = {};
const SUMMARY_FN = () => {
  const m = window.__mc;
  if (!m) return null;
  const s = m.state(), y = m.sync();
  return {
    role: y.role, station: y.station, connected: y.connected, peerId: y.peerId,
    phase: s.meta.phase, mission: s.meta.missionId, seed: s.meta.seed,
    day: Math.round(s.clock.day * 10) / 10, running: s.clock.running, dps: s.clock.daysPerSecond,
    seats: Object.fromEntries(Object.entries(s.meta.seats).map(([k, v]) => [k, v.claimedBy ? (v.playerName || v.claimedBy) : null])),
    budget: s.budget,
    counts: {
      tasks: s.market.tasks.length, openTasks: s.market.tasks.filter((t) => t.status === 'open').length,
      offers: s.market.offers.length, calls: s.market.calls.length,
      contracts: s.market.contracts.length, delivered: s.market.contracts.filter((c) => c.status === 'delivered').length,
      research: s.research.projects.length, researchDone: s.research.projects.filter((p) => p.status === 'succeeded').length,
      news: s.events.news.length, flags: s.events.flags.length,
    },
  };
};
const timeline = { firstHostAt: null, allConnectedAt: null, missionStartAt: null, launchedAt: null, finishedAt: null };
const speedApplied = new Set();
let pollN = 0;
let lastPhaseKey = '';

async function poll() {
  if (finished) return;
  pollN++;
  let host = null;
  const row = { ev: 'poll', players: {} };
  for (const p of players) {
    if (p.dialog) continue;
    const s = await withTimeout(p.page.evaluate(SUMMARY_FN), 3000, 'summary').catch(() => null);
    if (!s) continue;
    lastSummary[p.id] = { role: s.role, station: s.station, phase: s.phase, day: s.day };
    row.players[p.id] = { role: s.role, station: s.station, connected: s.connected };
    if (s.role === 'host') host = { p, s };
    const a = await drainActions(p);          // actions fired by timers etc. between commands
    noteGameActions(p, a);
    if (a.length) logEvent({ ev: 'actions', player: p.id, actions: a });
  }
  const now = Math.round(elapsed() / 1000);
  if (host) {
    const s = host.s;
    Object.assign(row, { host: host.p.id, phase: s.phase, mission: s.mission, day: s.day, running: s.running, dps: s.dps, seats: s.seats, budget: s.budget, counts: s.counts });
    timeline.firstHostAt ??= now;
    const clients = players.filter((p) => row.players[p.id]?.role === 'client' && row.players[p.id]?.connected).length;
    if (clients === PLAYERS - 1) timeline.allConnectedAt ??= now;
    if (s.phase !== 'lobby') timeline.missionStartAt ??= now;
    if (s.phase === 'launched' || s.phase === 'finished') timeline.launchedAt ??= now;
    if (s.phase === 'finished') timeline.finishedAt ??= now;
    // Slow the calendar once per game: an agent needs many seconds per move. Done while
    // still in the lobby, so players never see the speed change under them.
    if ((s.phase === 'lobby' || s.phase === 'planning') && !speedApplied.has(s.seed)) {
      speedApplied.add(s.seed);
      const target = DEFAULT_DAYS_PER_SECOND * SPEED_SCALE;
      await host.p.page.evaluate((d) => window.__mc.setSpeed(d), target).catch(() => {});
      logEvent({ ev: 'speed', daysPerSecond: target, scale: SPEED_SCALE });
    }
    const key = `${s.phase}|${JSON.stringify(s.seats)}`;
    if (key !== lastPhaseKey) { lastPhaseKey = key; logEvent({ ev: 'phase', phase: s.phase, seats: s.seats, day: s.day }); }
    if (pollN % 12 === 0) {
      const full = await host.p.page.evaluate(() => window.__mc.state()).catch(() => null);
      if (full) fs.writeFileSync(path.join(RUN_DIR, 'state', `${String(now).padStart(5, '0')}.json`), JSON.stringify(full));
    }
  }
  fs.appendFileSync(path.join(RUN_DIR, 'state.jsonl'), JSON.stringify({ t: now, ...row }) + '\n');
  if (Date.now() > deadline + 90_000) finalize('time over');
}

async function finalize(reason) {
  if (finished) return;
  finished = true;
  const summary = { round: ROUND, reason, minutesPlanned: MINUTES, durationS: Math.round(elapsed() / 1000), lobby: LOBBY, speedScale: SPEED_SCALE, timeline, players: {}, result: null, final: null };
  for (const p of players) {
    summary.players[p.id] = { ...p.stats, finalSeat: lastSummary[p.id]?.station ?? null, finished: p.done };
    try {
      if (p.dialog) { await p.dialog.dismiss().catch(() => {}); p.dialog = null; }
      const png = await withTimeout(p.page.screenshot({ type: 'png' }), 8000, 'final shot');
      fs.writeFileSync(path.join(RUN_DIR, `final-p${p.id}.png`), png);
      const text = await p.page.evaluate(() => document.body.innerText);
      fs.writeFileSync(path.join(RUN_DIR, `final-p${p.id}.txt`), text);
      const s = await p.page.evaluate(SUMMARY_FN);
      if (s?.role === 'host' || (s && !summary.final)) {
        summary.final = { phase: s.phase, mission: s.mission, day: s.day, budget: s.budget, counts: s.counts, seats: s.seats };
        const full = await p.page.evaluate(() => window.__mc.state());
        fs.writeFileSync(path.join(RUN_DIR, 'final-state.json'), JSON.stringify(full));
      }
      // The result card may be closed to a chip; the planner shows its own result view.
      const card = await p.page.evaluate(() => (document.querySelector('.shell-result-card') ?? document.querySelector('.shell-result-chip'))?.innerText ?? null);
      if (card && (!summary.result || card.length > summary.result.length)) summary.result = card;
    } catch (e) {
      summary.players[p.id].finalizeError = String(e);
    }
  }
  fs.writeFileSync(path.join(RUN_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  logEvent({ ev: 'end', reason });
  console.log(`ROUND ${ROUND} ENDED: ${reason}. Results in ${RUN_DIR}`);
  await browser?.close().catch(() => {});
  setTimeout(() => process.exit(0), 300);
}

// ------------------------------------------------------------------ auto lobby

/** Seat everyone and start the mission without the players (when the lobby is not under test). */
async function autoLobby() {
  const names = ['Avery', 'Blake', 'Casey', 'Devon'];
  const host = players[0];
  const hp = host.page;
  await hp.getByPlaceholder('e.g. Alex').fill(names[0]);
  await hp.getByRole('button', { name: /Host a new game/ }).click();
  // Mission picker (if the lobby has one): --mission "Mars" picks by name, default is the lobby's default.
  const picker = hp.locator('.shell-mission').first();
  if (await picker.waitFor({ timeout: 2000 }).then(() => true, () => false)) {
    if (opt.mission) await hp.locator('.shell-mission', { hasText: new RegExp(String(opt.mission), 'i') }).first().click();
    await hp.getByRole('button', { name: /^Host “/ }).click();
  }
  await hp.locator('.shell-seat').nth(0).click();
  for (let i = 1; i < players.length; i++) {
    const pp = players[i].page;
    await hp.getByRole('button', { name: /\+ Invite/ }).click();
    const inviteBox = hp.getByLabel(`Invite code ${i}`, { exact: true });
    await inviteBox.waitFor({ timeout: 20_000 });
    const invite = await inviteBox.inputValue();
    await pp.getByPlaceholder('e.g. Alex').fill(names[i]);
    await pp.getByRole('button', { name: /Join a game/ }).click();
    await pp.getByLabel('Invite code', { exact: true }).fill(invite);
    await pp.getByRole('button', { name: 'Next' }).click();
    const replyBox = pp.getByLabel('Your reply code', { exact: true });
    await replyBox.waitFor({ timeout: 20_000 });
    const reply = await replyBox.inputValue();
    await hp.getByLabel(`Reply code for invite ${i}`, { exact: true }).fill(reply);
    await hp.getByRole('button', { name: 'Connect', exact: true }).click();
    await pp.locator('.shell-seat').first().waitFor({ timeout: 40_000 });
    await pp.locator('.shell-seat').nth(i).click();
  }
  await sleep(500);
  await hp.getByRole('button', { name: /Start mission/ }).click();
  for (const p of players) await p.page.locator('.st-root').waitFor({ timeout: 20_000 });
}

// ------------------------------------------------------------------ http api

function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });
}

function startApi() {
  const srv = http.createServer(async (req, res) => {
    const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    try {
      const body = await readBody(req);
      if (req.url === '/cmd') {
        const p = players.find((x) => x.id === Number(body.player));
        if (!p) return send(200, { out: `There is no player "${body.player}". Players are 1 to ${PLAYERS}.` });
        // One command at a time per player, in order.
        const run = p.queue.then(async () => {
          try {
            const out = await runCmd(p, body.argv ?? []);
            return `${header(p)}\n${out}${unread(p)}`;
          } catch (e) {
            if (e instanceof UserError) return `${header(p)}\n${e.message}${unread(p)}`;
            logEvent({ ev: 'harness-error', player: p.id, argv: body.argv, text: String(e?.stack ?? e).slice(0, 1500) });
            return `${header(p)}\nThat did not work (${String(e?.message ?? e).split('\n')[0]}). Try "look" to see your screen.${unread(p)}`;
          }
        });
        p.queue = run.catch(() => {});
        return send(200, { out: await run });
      }
      if (req.url === '/admin') {
        const [cmd, arg] = body.argv ?? [];
        if (cmd === 'status') {
          return send(200, { out: JSON.stringify({ round: ROUND, elapsed: mmss(elapsed()), left: mmss(deadline - Date.now()), timeline, players: players.map((p) => ({ id: p.id, done: p.done, ...lastSummary[p.id], ...p.stats })), chat: chat.length }, null, 2) });
        }
        if (cmd === 'stop') { setTimeout(() => finalize(arg ?? 'stopped by overseer'), 100); return send(200, { out: 'stopping' }); }
        if (cmd === 'extend') { deadline += Number(arg ?? 5) * 60_000; return send(200, { out: `left ${mmss(deadline - Date.now())}` }); }
        return send(200, { out: 'admin commands: status | stop [reason] | extend MINUTES' });
      }
      send(404, { out: 'not found' });
    } catch (e) {
      send(500, { out: String(e) });
    }
  });
  srv.listen(PORT, '127.0.0.1');
  return srv;
}

// ------------------------------------------------------------------ main

const meta = { round: ROUND, startedAt: new Date().toISOString(), minutes: MINUTES, speedScale: SPEED_SCALE, lobby: LOBBY, players: PLAYERS, port: PORT, native: NATIVE, view: VIEW };
console.log(`Round ${ROUND}: building game…`);
meta.build = build();
await serveGame();
const launch = findBrowser();
meta.browser = launch;
browser = await chromium.launch({
  ...launch,
  headless: !HEADED,
  args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
});
const toolsCtx = await browser.newContext();
toolsPage = await toolsCtx.newPage();
await toolsPage.goto(`http://127.0.0.1:${GAME_PORT}/__blank`);
for (let i = 1; i <= PLAYERS; i++) await newPlayer(i);
fs.writeFileSync(path.join(RUN_DIR, 'meta.json'), JSON.stringify(meta, null, 2));
if (LOBBY === 'auto') {
  console.log('Seating players (auto lobby)…');
  try {
    await autoLobby();
  } catch (e) {
    // The lobby changed or the stations could not connect: keep the evidence and stop.
    for (const p of players) await p.page.screenshot({ path: path.join(RUN_DIR, `lobby-fail-p${p.id}.png`) }).catch(() => {});
    fs.writeFileSync(path.join(RUN_DIR, 'lobby-fail.txt'), String(e?.stack ?? e));
    console.error(`AUTO LOBBY FAILED: ${String(e?.message ?? e).split('\n')[0]}\nScreens saved in ${RUN_DIR}`);
    await browser.close().catch(() => {});
    process.exit(3);
  }
}
// The session clock starts once the stations are ready for the players.
deadline = Date.now() + MINUTES * 60_000;
startApi();
setInterval(() => poll().catch((e) => logEvent({ ev: 'harness-error', text: `poll: ${e}` })), 10_000);
poll().catch(() => {});
logEvent({ ev: 'ready' });
console.log(`READY round=${ROUND} players=${PLAYERS} lobby=${LOBBY} minutes=${MINUTES} api=http://127.0.0.1:${PORT} run=${RUN_DIR}`);
process.on('SIGINT', () => finalize('interrupted'));
process.on('SIGTERM', () => finalize('interrupted'));
