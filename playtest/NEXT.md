# Next steps (handoff, 2026-11-15 about 21:50)

> **Historical handoff — superseded.** These November 15 package/branch instructions are preserved as evidence, not the current task list. Recovery, room-code joining and the Lunar mission exist in current source. Do not repeat these merges or rebuild these packages from this handoff. Read the [current prototype](../docs/current-prototype.md), [post-submission audit](../docs/reviews/2026-11-16-post-submission-audit.md) and current user authorization before new work.

Work was split into packages built by separate agents in their own checkouts, each judged by an independent agent before it may go to `main`. Rules: `briefs/package.md`. Reports and verdicts: `packages/`.

## On main

| Package | Commit | Note |
|---|---|---|
| 0 — core: attempts, restart, score, back to lobby | `af11ed7` | API in `packages/contract.md`. No screen uses it yet; package A does. |
| D1 — Procurement cleanup | `430c04f`, `1c4692a` | Judge: accepted after repairs (`packages/judge-d1.json`). |
| D2 — Communications cleanup | `8afd318` | Judge: accepted after repairs (`packages/judge-d2.json`). |
| M — third mission (lunar ice lander), specification only | `255f7c6` | `mission-planner/notes/2026-11-15-third-mission-proposal.md`. Not built. |

Neither D1 nor D2 has been played by four testers yet.

## Not on main

| Package | Where | State |
|---|---|---|
| A — end of mission (shared result card, debrief, score, Try again, back to mission choice) | branch `pkg/a`, checkout `../mc-pkg-a` | Judge: accept once five things are repaired (`packages/judge-a.json`). Repairs were started and are **unfinished** (commit "wip: repairs after judge"). Typecheck passes; do not merge as is. |
| B — planner: choose between two designs, order after deciding | branch `pkg/b`, checkout `../mc-pkg-b` | Built, rebased on main, typecheck and build pass. **Not judged** (judge was stopped mid-session). |
| C — faster joining | — | Not started. Host mission choice in the lobby was moved into A's repairs. |
| Third mission build | — | Not started. Touches planner data, comms content, lobby card: build after A and B are in. |

Both branches are based on `11ae2db`; rebase onto current `main` first.

## To finish

1. A: finish the five repairs in `judge-a.json` (mission choice on the host lobby screen; true per-goal reasons; "next time" only what a station could have done; score: no credit for scrubs, deliveries = share of needed parts on the pad — in `core/score.ts`; card about half as dense; consistent playback header). Then gate and merge.
2. B: run the judge (brief in this session's history; key question: is the design choice a real trade-off or does one design dominate). Then repairs, gate, merge. B's planner files conflict easily with other planner work — it already needed three hand-merges against the task-coordination commit.
3. After A is in: remove or relabel the Communications station's own launch card, which sits under the shared result card.
4. One budget figure on all four stations (R1115d-r01-06, rejected twice when done on one station only). `spendByStation` and `stillToBuy` are ready in `stations/procurement/rules.ts`. The Planner's "to buy" figure also disagrees with Procurement's.
5. Playtest: one round on the weather mission, one on Mars (`loop/overnight.workflow.js`, `plan` argument). Nothing since `edf688e` has been played.
6. `communications/README.md` line 44 ("hints, not numbers") contradicts the game after D2; its owner should update it.

## Every push to main deploys

`main` publishes to https://missioncontrol.dractec.com/ when `game/` changes. Before pushing: typecheck, build, four-player start (`node harness/start.mjs --round x --lobby auto --minutes 2`).

Agents leave dev servers running that lock `node_modules`; if `npm ci` fails with EPERM, stop stray `node`/`esbuild` processes of that checkout first.
