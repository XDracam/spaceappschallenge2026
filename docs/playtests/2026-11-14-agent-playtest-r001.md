# Playtest — 2026-11-14 — agent playtest, round r001

- Status: completed
- Facilitator: Claude (overseer session), at the user's request
- Participants / roles: four AI agents (Claude Sonnet), each told nothing about the game. Player 1: Mission Planner and host. Player 2: Procurement. Player 3: Science. Player 4: Communications. They chose the roles themselves.
- Prototype version or files: `game/` working tree of 2026-11-14, about 23:50, including uncommitted changes (mission picker, weather-satellite mission). Served as a production build.
- Scenario and rules: default mission "Weather satellite", manual lobby (host, invite codes, reply codes), 45-minute session. Calendar slowed to 0.25x by the harness.
- Related ideas and questions: D-012, D-014, D-015, Q-019.
- Question this experiment investigates: can four players with no explanation connect, find their jobs and finish a mission, and where do they lose time?

## Hypothesis

Expected: agents get stuck in the copy-paste lobby and on the planner's canvas. Counting against it: they reach launch without help.

## Setup

Harness and limits are described in [`playtest/README.md`](../../playtest/README.md). Each agent controlled one isolated browser station through screenshots, clicks and typing, could talk to the others by text, and logged think-aloud notes. The agents were instructed not to read any project file.

What this kind of test can show: bugs, dead ends, unclear wording, missing feedback, moments without anything to do for these players. What it cannot show: enjoyment, how people coordinate by voice, or that a role has enough to do (D-014). The agents acted faster than assumed (about 10 seconds per move), and the slowed calendar stretched every wait fourfold.

## Actual sequence

- 1:03 — Player 1 offers to host. 1:18 to 1:28 — three invite codes sent. 2:38 — all connected. 2:58 — mission started.
- 3:17 to 3:52 — planner adds a manoeuvre, orders all nine parts, adds fuel after the plan came up 0.24 km/s short.
- 3:54 to 4:40 — procurement signs nine contracts.
- 3:38 to 6:36 — science starts three projects.
- 3:01 to 25:04 — communications answers eleven messages and starts four projects.
- About 5:00 onward — planner, procurement and science report nothing left to do.
- 26:49 — launch. 28:14 — all four end the session.

## Committed plan and single resolution

One session, one launch. Result shown to the players: 2 of 2 goals achieved, 135.5 M of 340 M spent, 9 deliveries, 2 research successes, one part glitch. Final state: `playtest/runs/r001/final-state.json` (local, not in git).

## Observations

Counts: 207 inputs, 3 without visible effect; 0 console errors; 64 notes (22 confused, 19 good, 10 waiting, 8 idea, 3 bug, 1 stuck, 1 tool).

- All four players reported having nothing meaningful to do from about minute 5 until launch at minute 27.
- The science player never received a request and could not tell which research helps a weather satellite; the map showed Mars topics.
- Three pairs of fields shown as connected on the science map all gave "No obvious link" on the bench.
- Communications negotiated a discounted engine that procurement had already bought. Neither station showed the other's state; the "Review & sign" button was greyed out without a reason.
- A "DEV" button on the communications station opened a panel that can fire events (`game/src/stations/comms/ui/App.tsx:38`).
- The science project screen showed "placeholder: the personnel model is still open (Q-019)" (`game/src/stations/science/ui/DraftProject.tsx:127`).
- Clock labels disagreed: fixed text "1 min = 1 month" on science and in the planner briefing, computed "1 min ≈ 0.2 months" in the planner header. Caused by the harness slowing the calendar after the mission had started.
- After the result card no player found a next step.
- Named as clear by the players: the "How does connecting work?" text, station cards in the lobby, the planner briefing and "Next" hint, live issue texts ("Short by 0.24 km/s"), procurement's needs list with "Fits" tags and the sign flow, communications' "AFFECTS …" tags and outcome panel, the shared news feed, the result card.

Full list with evidence: `playtest/runs/r001/findings.json` (16 findings: 3 bug, 7 clarity, 5 design, 1 agent artifact).

## Interpretation

- The hypothesis was wrong: the lobby and the canvas were not obstacles for these players.
- The idle time is not yet evidence about the game. At the default speed the same sequence would leave under two idle minutes before a six-minute launch. It needs a re-test at 0.5x and 1.0x.
- The science and communications–procurement observations are about what a station shows of the others. Whether that is a wording problem or a rules question is for the team.
- One session with one seed. Agents read every word on screen and do not get bored or impatient the way people do.

## Follow-up

- Ideas to add or revise: none recorded yet.
- Questions answered or still open: none answered.
- Proposed changes: the bug and clarity findings in `findings.json`. None made.
- Decisions actually accepted, with source: none.
