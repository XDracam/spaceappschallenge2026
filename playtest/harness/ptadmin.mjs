#!/usr/bin/env node
// Overseer CLI: node ptadmin.mjs status | stop [reason] | extend MINUTES
const argv = process.argv.slice(2);
const port = process.env.PT_PORT ?? 4700;
try {
  const res = await fetch(`http://127.0.0.1:${port}/admin`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ argv }),
  });
  console.log((await res.json()).out);
} catch {
  console.log('harness not running');
  process.exit(1);
}
