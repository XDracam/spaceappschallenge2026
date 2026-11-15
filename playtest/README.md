# Agent playtest harness

Four AI players, each with no knowledge of the game, play one multiplayer session on four isolated browser stations. What they struggle with is logged for triage and fixing.

An agent playtest finds friction: bugs, dead ends, unclear labels, missing feedback, a role with nothing to do. It is not evidence of enjoyment or of how people coordinate (see `AGENTS.md` and D-014).

## Parts

| Path | What it is |
|---|---|
| `harness/server.mjs` | Builds the game, serves the build, opens one browser context per player (1920x1080), records everything. |
| `harness/pt.mjs` | Player CLI: `node harness/pt.mjs <player> <command>`. Screenshot, click, type, paste, talk, note. `help` lists the commands. |
| `harness/start.mjs` | Starts the harness detached and returns at `READY` (for unattended loops). |
| `loop/overnight.workflow.js` | The unattended loop: play, triage, fix, gate, commit. Runs only in a dedicated git worktree. |
| `harness/ptadmin.mjs` | Overseer CLI: `status`, `stop [reason]`, `extend MINUTES`. |
| `briefs/player.md` | What a player agent is told. Nothing about the game. |
| `briefs/triage.md` | How a round becomes classified findings. |
| `briefs/fixer.md` | Polish step: bugs and unclear screens, small diffs. |
| `briefs/rework.md` | Rework step: one root problem per round — systems, rules, mission content. |
| `briefs/judge.md` | Judge step: an agent that did not make the change accepts only what is clearly better. |
| `rejected.md` | Changes the judge turned down, and why. |
| `changes.md` | Every change the loop made, with evidence and how to drop it. |
| `ledger.json` | Findings of every round. |
| `morning.md` | Written at the end of a night: what to keep, what to drop, what is still open. |
| `runs/<round>/` | One round's evidence (ignored by git). |

The game has one hook for this: `game/src/core/playtestHook.ts`. It installs only when the harness sets `window.__MC_PLAYTEST__` before the app loads, and gives the harness read access to the state, the actions a browser dispatched, and the calendar speed.

## Running a round

```bash
cd playtest && npm install
```

```bash
node harness/server.mjs --round r001 --lobby manual --minutes 30
```

Wait for the `READY` line, then start the player agents with `briefs/player.md`.

| Option | Default | Meaning |
|---|---|---|
| `--round ID` | timestamp | Folder name under `runs/`. |
| `--lobby manual\|auto` | `manual` | `manual`: players host, invite and join themselves (tests the lobby). `auto`: the harness seats everyone and starts the mission. |
| `--mission TEXT` | lobby default | With `--lobby auto`: pick the mission whose name contains TEXT. |
| `--minutes N` | 25 | Session length. Afterwards every command answers `SESSION OVER`. |
| `--speed X` | 0.5 | Calendar speed relative to the game's default, set while the game is still in the lobby. Agents needed about 10 s per move in round r001; at 0.25 they sat idle for most of the session. Recorded in `meta.json`. |
| `--players N` | 4 | Number of stations. |
| `--headed` | off | Show the browser windows. |
| `--dist DIR` | build now | Serve an existing build instead of building. |
| `--port N` | 4700 | Harness API port (game is served on port + 10). |

Each round serves its own build (`runs/<round>/dist`), so source edits during play do not reach the players.

## What a round records

- `summary.json` — per-player counters (commands, inputs without effect, game actions, time to first game action, longest gap between game actions, notes), lobby and mission timeline, final state, mission result text.
- `notes.jsonl` — think-aloud notes from the players with screenshot and game day.
- `chat.jsonl` — what the players said to each other.
- `events.jsonl` — every command with the game actions it dispatched and whether the screen changed; console errors; page errors.
- `state.jsonl`, `state/*.json`, `final-state.json` — the host's game state over time.
- `shots/pN/*.jpg` — every screen a player saw. `final-pN.png` / `.txt` — last screen of each station.
- `meta.json` — options and the typecheck result of the build.

## Known limits

- The player sees a 1280x720 rendering of a 1920x1080 station. Small text is softer than on a real screen; players can `zoom`.
- The slowed calendar makes on-screen statements about real time ("1 real minute = 1 month") inaccurate. Triage treats confusion about that as an artifact.
- Players talk through text that arrives when they next act, not through live voice.
- A player agent could read files it should not. The brief forbids it; the harness does not prevent it.

## The overnight loop

`loop/overnight.workflow.js` runs until morning in a dedicated git worktree on its own branch. Per round:

1. **Play** — four fresh players, no knowledge of the game. Every third round they do the lobby themselves.
2. **Triage** — findings by class (bug, clarity, design, agent artifact), surface symptoms linked to their root, a verdict on each change of the previous round, and one design finding picked for rework.
3. **Revert** — changes that triage judged to have harmed play are taken back.
4. **Polish** — up to four bugs or unclear screens. One commit.
5. **Rework** — the picked root problem: rules, balance, content, what stations show each other. Verified in a running one-player session. One commit.

Before anything is committed, a fresh agent that was not told the author's reasons compares the game before (the players' screenshots) and after (a running session) and accepts only what is clearly better for a first-time player; the rest is discarded and logged in `rejected.md`. Each commit then passes typecheck and build, or the tree is put back. If the game no longer starts in a round, the changes since it last started are reverted. Nothing is pushed.

The loop may change rules and content without approval for the night of 2026-11-15 ([user direction](../docs/notes/2026-11-15-overnight-playtest-autonomy.md)). What it changes is not an accepted decision; `morning.md` lists each change with the command to drop it.
