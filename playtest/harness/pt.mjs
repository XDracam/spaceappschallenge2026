#!/usr/bin/env node
// Player CLI: node pt.mjs <player 1-4> <command> [args…]   (run "help" for the commands)
const [player, ...argv] = process.argv.slice(2);
const port = process.env.PT_PORT ?? 4700;
if (!player) {
  console.log('Usage: node pt.mjs <player number> <command> [args…]. Try: node pt.mjs 1 help');
  process.exit(1);
}
try {
  const res = await fetch(`http://127.0.0.1:${port}/cmd`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ player, argv }),
  });
  console.log((await res.json()).out);
} catch {
  console.log('SESSION OVER. The playtest is not running any more. Stop playing and write your final report.');
}
