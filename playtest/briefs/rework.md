# Rework brief

You rework one part of the game that playtests showed to be broken at the root, not at the surface. The team is asleep and has given this night's loop the freedom to change systems, rules, balance and mission content without approval (`docs/notes/2026-11-15-overnight-playtest-autonomy.md`). Use it: a real fix to the mechanic beats a better label on a mechanic that does not work.

## Your finding

`{{FINDING}}` in `playtest/runs/{{ROUND}}/findings.json` (or, if it is from an earlier round, in that round's folder — see `playtest/ledger.json`). Read it, the findings that name it in `symptomOf`, and the evidence they point to: player reports, notes, chat, screenshots. Understand what the players were trying to do before you design anything.

Then read what the game intends here: `docs/concept.md`, `docs/design/roles.md`, `docs/design/integration.md`, and the folder of the station concerned (`mission-planner/`, `procurement/`, `science/`, `communications/`). Read `playtest/changes.md` for what earlier rounds already changed, and whether a rework of this finding was tried and reverted — if so, take a different approach.

## What you may change

Anything under `game/src/` that the rework needs: reducers and rules, numbers, what a station shows and can do, shared state, mission and event content, the lobby and the end of the game. If you change the lobby flow, keep `playtest/harness/server.mjs` → `autoLobby()` working with it.

## What a good rework looks like

- It removes the cause. If Science has no traceable effect on the mission, give it one; do not write a tooltip claiming it has.
- **Every role has something meaningful to do at the same time, and none simply waits on another.** This is the project's central design requirement. Prefer changes that create real exchanges between stations — one station needs, sees or changes something another one owns — over changes inside one station.
- Players can trace consequences: what I did, what it changed, where a teammate sees it.
- It does not make the game easier just to stop players struggling. Remove confusion and dead time, keep decisions and trade-offs. Change balance numbers where the evidence says they are off.
- **It is the simplest mechanism that removes the cause.** Before adding anything, ask in this order: can the problem be removed by deleting something (a step, a choice, a concept)? By merging two things into one? By letting an existing element carry the information? Only then add. One new element that players will use beats five that cover every case. The team has rejected dense screens before; the players in these tests are agents who read everything and will not complain about clutter, so restraint is your job.
- **Pay for what you add.** For every control, panel, chip or text you add, look for one on the same screen that is now redundant and remove it. If your rework makes an older mechanism pointless, delete that mechanism instead of leaving both.
- It fits one coherent commit that you can finish and verify now. A smaller rework that works beats a larger one that half works. If the right fix is too big, do the first self-contained part and write down the rest.

## Constraints that stay

- Four stations, one player each, peer-to-peer with one host (D-012, D-015).
- Content is hand-authored: no runtime generation of missions, parts or events (D-005).
- Reducers are pure and deterministic; all state changes are actions (`docs/design/integration.md`). If you change the shape of `GameState`, raise `STATE_VERSION` in `game/src/core/state.ts`.
- Visual language: dark glass, cyan glow, rounded panels (D-013). Few, clear controls; do not build dense screens. Everything fits 1920x1080.
- Do not touch `game/src/core/playtestHook.ts`. Do not add or run tests. Do not commit, push, stash or switch branches.

## Verify in the running game

1. `npx tsc --noEmit` in `game/` — no errors.
2. See your change work. Start a one-player session on a spare port and drive it yourself:
   ```
   node playtest/harness/start.mjs --round {{ROUND}}-check --players 1 --lobby auto --minutes 12 --port 4720
   PT_PORT=4720 node playtest/harness/pt.mjs 1 look
   ```
   `pt.mjs 1 help` lists the commands; the roster pill at the bottom left lets one player switch between stations. When done: `PT_PORT=4720 node playtest/harness/ptadmin.mjs stop`. Always stop it, also when something failed.
3. Look at every screen you changed in a screenshot. Check that nothing overflows and that a first-time player would understand what is new without being told.

## Output

Write `playtest/runs/{{ROUND}}/rework.json`:

```
{ "finding": "…", "status": "done | partial | abandoned", "what": "what is different for the players, two or three sentences", "added": ["each new control, panel, chip, text or concept a player meets"], "removed": ["each one a player no longer meets"], "files": ["…"], "verified": "what you saw working in the running game", "notVerified": "what you could not check", "risk": "what this could break or unbalance", "next": "what is left, if partial" }
```

Append to `playtest/changes.md` under a heading `## {{ROUND}} — rework of {{FINDING}}`: the problem in one sentence with its evidence, what you changed and why this approach, what it added to and removed from the screens, what it could break, and what the team should look at when deciding to keep it.

If you abandon the rework, restore every file you touched (`git checkout -- <file>`, delete new files) so the tree is as you found it, and say why in `rework.json`.
