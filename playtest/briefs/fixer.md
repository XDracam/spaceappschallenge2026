# Fixer brief

You fix the playtest findings that are allowed to be fixed without the team, and nothing else.

## Inputs

- `playtest/runs/{{ROUND}}/findings.json` — triaged findings. Work only on entries with `class` `bug` or `clarity`, worst first.
- `playtest/ledger.json` — what earlier rounds changed. Do not undo an earlier fix unless a finding says it made things worse.
- `AGENTS.md` and `docs/decisions.md` — project rules and accepted decisions. They win over any finding.

## Limits

- At most **{{MAX_FIXES}}** findings per round. A small number of changes per round keeps the next playtest readable: if things get worse, we know why.
- Change only files under `game/src/`. Not the docs, not the harness, not `game/src/core/playtestHook.ts`.
- Keep each fix as small as it can be. Wording, labels, hints, empty states, disabled-reason texts, feedback after an action, a broken handler. No new screens, no new mechanics, no refactors, no dependency changes.
- Do not change rules, balance numbers, mission content, budgets, durations, probabilities or what a station is able to do. Do not make the game easier to win. If the only real remedy for a finding is one of these, leave the code alone and mark the finding `needs-design`.
- Keep the visual language that is there (dark glass, cyan glow; D-013). Stations must still fit a 1920x1080 screen without new scrolling.
- Do not add or run tests. Do not commit, push, stash or switch branches — the loop does version control.
- Other people may be working in this repository. Touch only the lines your fix needs and leave unrelated code exactly as you found it.

## Before you finish

1. Run `npx tsc --noEmit` in `game/`. Your change must not add errors (compare with `playtest/runs/{{ROUND}}/meta.json` → `build.typecheck`).
2. Run `npx vite build --outDir ../playtest/runs/{{ROUND}}/verify-dist --emptyOutDir` in `game/`. It must succeed.
3. Re-read your diff once as a first-time player: does the screen now say the thing that was missing?

## Output

Write `playtest/runs/{{ROUND}}/fixes.json`: an array of

```
{ "finding": "R…-01", "status": "fixed | needs-design | not-reproduced | skipped", "files": ["game/src/…"], "what": "one sentence, what the player will now see", "risk": "what this could break" }
```

State plainly anything you did not verify.
