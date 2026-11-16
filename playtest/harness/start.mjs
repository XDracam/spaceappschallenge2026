#!/usr/bin/env node
// Start the harness detached and return once it is ready (or failed), so a caller
// whose own process ends — an agent step in the overnight loop — does not take the
// round down with it. Same options as server.mjs.
//   node harness/start.mjs --round r002 --lobby auto --minutes 40
// Prints READY … (exit 0) or the reason it could not start (exit 1).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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
const round = argv[roundAt + 1];
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(round)) {
  console.error('Round ID must contain only letters, numbers, dot, underscore or hyphen.');
  process.exit(1);
}
const runsDir = path.resolve(HERE, '..', 'runs');
const runDir = path.join(runsDir, round);
if (fs.existsSync(runDir)) {
  console.error(`Round ${round} already exists at ${runDir}. Choose a fresh --round ID; existing evidence is preserved.`);
  process.exit(1);
}
fs.mkdirSync(runsDir, { recursive: true });

// A harness left over from an earlier round would hold the port: refuse rather than mix rounds.
const alive = await fetch(`http://127.0.0.1:${port}/admin`, { method: 'POST', body: JSON.stringify({ argv: ['status'] }) }).then((r) => r.ok, () => false);
if (alive) {
  console.log(`A harness is already running on port ${port}. Stop it first: node harness/ptadmin.mjs stop`);
  process.exit(1);
}

// A unique launch log cannot contain a previous process's READY marker.
const logFile = path.join(runsDir, `.startup-${round}-${crypto.randomUUID()}.log`);
const out = fs.openSync(logFile, 'wx');
const child = spawn(process.execPath, [path.join(HERE, 'server.mjs'), ...argv], { detached: true, stdio: ['ignore', out, out], windowsHide: true });
child.unref();

const started = Date.now();
let exited = null;
child.on('exit', (code) => { exited = code ?? 1; });
child.on('error', (error) => { fs.appendFileSync(logFile, `Spawn failed: ${error.message}\n`); exited = 1; });
while (Date.now() - started < 240_000) {
  await new Promise((r) => setTimeout(r, 1000));
  const log = fs.readFileSync(logFile, 'utf8');
  // An old READY line from this same child must not win over a known exit.
  if (exited !== null || child.exitCode !== null || child.signalCode !== null) {
    fs.closeSync(out);
    console.log(`Harness exited before readiness was accepted (code ${child.exitCode ?? exited}, signal ${child.signalCode ?? 'none'}; startup log: ${logFile}):\n${log.slice(-2500)}`);
    process.exit(1);
  }
  const ready = log.split('\n').find((l) => l.startsWith(`READY round=${round} `) && l.includes(` pid=${child.pid} `));
  if (ready) {
    fs.closeSync(out);
    fs.renameSync(logFile, path.join(runDir, 'harness.log'));
    console.log(ready);
    process.exit(0);
  }
}
child.kill('SIGTERM');
console.log(`Harness not ready after 4 minutes (startup log: ${logFile}):\n${fs.readFileSync(logFile, 'utf8').slice(-2500)}`);
process.exit(1);
