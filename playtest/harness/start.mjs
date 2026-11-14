#!/usr/bin/env node
// Start the harness detached and return once it is ready (or failed), so a caller
// whose own process ends — an agent step in the overnight loop — does not take the
// round down with it. Same options as server.mjs.
//   node harness/start.mjs --round r002 --lobby auto --minutes 40
// Prints READY … (exit 0) or the reason it could not start (exit 1).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const roundAt = argv.indexOf('--round');
if (roundAt < 0 || !argv[roundAt + 1]) {
  console.log('start.mjs needs --round ID');
  process.exit(1);
}
const portAt = argv.indexOf('--port');
const port = portAt >= 0 ? argv[portAt + 1] : process.env.PT_PORT ?? 4700;
const runDir = path.resolve(HERE, '..', 'runs', argv[roundAt + 1]);
fs.mkdirSync(runDir, { recursive: true });

// A harness left over from an earlier round would hold the port: refuse rather than mix rounds.
const alive = await fetch(`http://127.0.0.1:${port}/admin`, { method: 'POST', body: JSON.stringify({ argv: ['status'] }) }).then((r) => r.ok, () => false);
if (alive) {
  console.log(`A harness is already running on port ${port}. Stop it first: node harness/ptadmin.mjs stop`);
  process.exit(1);
}

const logFile = path.join(runDir, 'harness.log');
const out = fs.openSync(logFile, 'a');
const child = spawn(process.execPath, [path.join(HERE, 'server.mjs'), ...argv], { detached: true, stdio: ['ignore', out, out], windowsHide: true });
child.unref();

const started = Date.now();
let exited = null;
child.on('exit', (code) => { exited = code; });
while (Date.now() - started < 240_000) {
  await new Promise((r) => setTimeout(r, 1000));
  const log = fs.readFileSync(logFile, 'utf8');
  const ready = log.split('\n').find((l) => l.startsWith('READY'));
  if (ready) {
    console.log(ready);
    process.exit(0);
  }
  if (exited !== null) {
    console.log(`Harness exited with code ${exited} before it was ready:\n${log.slice(-2500)}`);
    process.exit(1);
  }
}
console.log(`Harness not ready after 4 minutes:\n${fs.readFileSync(logFile, 'utf8').slice(-2500)}`);
process.exit(1);
