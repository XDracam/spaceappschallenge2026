# Package brief — rules for every builder

Several builders work on the game at the same time, each on one package, each in its own checkout. This file holds the rules they share. Your prompt names your package, what it must achieve, the paths you own and where the evidence is.

## Ownership

- You may **read** anything in your checkout.
- You may **write** only the paths your prompt lists as yours. Another builder is editing the rest right now; a change of yours there would collide with theirs.
- `game/src/core/` and `game/src/shared/` belong to nobody during the build. They were prepared beforehand (`playtest/packages/contract.md` says what is there). If you need something from them that is missing, do not edit them: describe the need under `coreRequests` in your report and build as far as you can without it.
- If your package cannot be done without touching a path you do not own, do the part you can, and say exactly which lines elsewhere would have to change (`foreignRequests`).
- Do not commit, push, stash, switch branches or touch any other checkout. Do not add or run tests.

## Where the evidence is

Three playtest rounds with four first-time players each: `playtest/runs/r001/`, `playtest/runs/1115m-r01/`, `playtest/runs/1115d-r01/` (findings.json, triage.md, notes.jsonl, chat.jsonl, reports/, shots/). History: `playtest/ledger.json`, `playtest/changes.md`, `playtest/rejected.md`, `playtest/morning.md`. The challenge the game answers: `docs/challenge.md`. Read the findings your prompt names and open the evidence they point to before you design anything.

The players in those rounds were AI agents. They read every word and never tire of a crowded screen, so they will not have told you that a station shows too much.

## What good work looks like

- **It removes the cause.** A better label on a mechanism that does not work is not a fix.
- **Less before more.** Ask in this order: can the problem be removed by deleting something? By merging two things? By letting an existing element carry the information? Only then add. For everything you add to a screen, look for something on that screen that is now redundant and remove it. The team has rejected dense screens.
- **Every role has something meaningful to do at the same time, and none simply waits on another.** This is the project's central design requirement.
- **Players can trace consequences**: what I did, what it changed, where a teammate sees it.
- **A first-time player who skims understands it** without being told.
- It does not make the game easier just to stop players struggling. Remove confusion and dead time; keep decisions and trade-offs.
- It works for both missions (weather satellite, Mars orbiter + lander).

## Constraints that stay

- Four stations, one player each, peer-to-peer with one host (D-012, D-015). One player may also play alone and switch stations.
- Content is hand-authored: no runtime generation of missions, parts or events (D-005).
- Reducers are pure and deterministic; every state change is an action (`docs/design/integration.md`).
- Visual language: dark glass, cyan glow, rounded panels; few, clear controls. Everything fits 1920x1080 without new scrolling.
- `game/src/core/playtestHook.ts` is not touched.

## Verify in the running game

1. `npx tsc --noEmit` in `game/` — no errors.
2. See your change work. Start a one-player session on the port your prompt gives you and drive it yourself:
   ```
   node playtest/harness/start.mjs --round <your package>-check --players 1 --lobby auto --minutes 15 --port <PORT>
   PT_PORT=<PORT> node playtest/harness/pt.mjs 1 look
   ```
   `pt.mjs 1 help` lists the commands. One command per Bash call. The roster pill at the bottom left switches stations. Add `--mission Mars` to start the other mission; `--speed 2` makes the calendar faster. Each start builds the game from your checkout. Stop it when done: `PT_PORT=<PORT> node playtest/harness/ptadmin.mjs stop`. Always stop it, also when something failed.
3. Look at every screen you changed in a screenshot: nothing overflows, nothing contradicts itself.

## Report

Write `playtest/packages/<your package>.json`:

```
{ "package": "…", "status": "done | partial | abandoned",
  "what": "what is different for the players, a few sentences",
  "added": ["each new control, panel, chip, text or concept a player meets"],
  "removed": ["each one a player no longer meets"],
  "findings": ["ids of the findings this answers"],
  "files": ["…"],
  "verified": "what you saw working in the running game",
  "notVerified": "what you could not check",
  "risk": "what this could break or unbalance",
  "coreRequests": ["…"], "foreignRequests": ["…"],
  "next": "what is left, if partial" }
```

and answer with the same content in plain sentences. If you abandon the package, restore every file you touched so the tree is as you found it, and say why.
