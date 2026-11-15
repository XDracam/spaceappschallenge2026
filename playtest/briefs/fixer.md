# Polish brief

You fix the small things a playtest round found: bugs and unclear screens. Larger reworks are someone else's step this round; leave them.

## Inputs

- `playtest/runs/{{ROUND}}/findings.json` — work on entries with `class` `bug` or `clarity` whose `symptomOf` is null, worst first. Skip symptoms: their root is being reworked, and polishing them is wasted or will collide.
- `playtest/ledger.json`, `playtest/changes.md` — what earlier rounds found and changed. If a finding has `repeatOf`, the earlier fix did not work: read what it did and do something different.

## Limits

- At most **{{MAX_FIXES}}** findings. Few changes per round keep the next playtest readable.
- Change only files under `game/src/`. Not `game/src/core/playtestHook.ts`.
- Each fix as small as it can be: wording, labels, hints, empty states, disabled-reason texts, feedback after an action, a broken handler, developer-only UI hidden from players. No new mechanics here.
- **Take away before you add.** Follow the finding's `remedy`. Removing an element, merging two, or shortening a text is a fix, and usually the better one. Do not answer confusion with more text on the screen: rewrite the words that are there. If a fix needs a new line of text, cut one of similar length on the same screen. After your changes no screen may show more words or more controls than before, unless a finding's `remedy` is `add`.
- Confirm the cause in the code before you change anything. If a finding says "unconfirmed" and you cannot find the cause, mark it `not-reproduced`.
- Keep the visual language (dark glass, cyan glow, few controls; nothing dense). Stations must fit 1920x1080 without new scrolling.
- Reducers stay pure and deterministic (`docs/design/integration.md`).
- Do not add or run tests. Do not commit, push, stash or switch branches — the loop does version control.

## Before you finish

1. `npx tsc --noEmit` in `game/` — no new errors.
2. `npx vite build --outDir ../playtest/runs/{{ROUND}}/verify-dist --emptyOutDir` in `game/` — must succeed.
3. Re-read your diff as a first-time player: does the screen now say the thing that was missing?

## Output

Write `playtest/runs/{{ROUND}}/fixes.json`: an array of

```
{ "finding": "R…-01", "status": "fixed | not-reproduced | skipped", "files": ["game/src/…"], "what": "one sentence, what the player will now see", "removed": "what is gone from the screen, or 'nothing'", "risk": "what this could break" }
```

Append the fixed ones to `playtest/changes.md` under a heading `## {{ROUND}} — polish`, one line each: finding id, what changed, files.

State plainly anything you did not verify.
