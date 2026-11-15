# Playtest — 2026-11-15 — unattended agent playtest loop (run 1115d)

- Status: completed (one round played; one earlier round triaged and worked)
- Facilitator: the playtest loop (`playtest/loop/overnight.workflow.js`), started by the user; no person watched the rounds
- Participants / roles: four AI agents per round, each told nothing about the game. Round 1115d-r01: player 1 Mission Planner and host, player 2 Procurement, player 3 Science, player 4 Communications. They chose the roles themselves.
- Prototype version or files: `game/` on branch `playtest/main-1115`. Round 1115m-r01 played the game as it was on the branch at 03:42 that night (after `2853128`, before any change of this run); round 1115d-r01 played it with the changes `47dbfd5` and `5c4f9c9`. Each round served its own production build.
- Scenario and rules: mission "Weather satellite", manual lobby (host, invite codes, reply codes), 30-minute session, calendar at 0.5x of the game's default speed.
- Related ideas and questions: D-005, D-012, D-014, D-015, D-020; Q-005, Q-008, Q-011, Q-014, Q-027, Q-028. Earlier round: [agent playtest r001](2026-11-14-agent-playtest-r001.md).
- Question this experiment investigates: when a loop plays, triages and changes the game without a person, which problems of first-time players go away, which come back, and what do the changes cost?

The loop was allowed to change rules, balance and mission content without approval for this one run ([user direction](../notes/2026-11-15-overnight-playtest-autonomy.md)). Nothing it changed is an accepted decision. The list for the team, with the command to drop each change, is [`playtest/morning.md`](../../playtest/morning.md); the per-change log is [`playtest/changes.md`](../../playtest/changes.md).

## Hypothesis

Expected: fixing what one round's players stumbled over lets the next round's players get further. Counting against it: the next round stops at the same place, or a change causes a new problem that is as large as the one it removed.

## Setup

Harness, loop and limits are described in [`playtest/README.md`](../../playtest/README.md). Per round: four fresh agents play; a triage agent classifies the findings (bug, clarity, design, agent artifact) and gives a verdict on each change of the round before; up to four bugs or unclear screens are fixed in one polish commit; one design finding is reworked in one commit. Before a commit, a judge agent that was not told the author's reasons compares the players' screenshots with a running one-player session and accepts or rejects each change. Each commit passes typecheck and build.

- The run began with round 1115m-r01, which had been played at 03:42 the same night and was cut short by a restart before triage (no player reports, no `summary.json`). This run triaged it from notes, chat, events, state and screenshots, and worked on its findings first. It then played one round of its own, 1115d-r01 (started 12:30 local time).
- Commits of this run: `git log 7a679a6..HEAD`, made between 11:51 and 16:43.
- Tuning values set by the harness, not by the game: calendar speed 0.5x, session length 30 minutes, 1280x720 view of a 1920x1080 station.
- Random seed: one seeded roll at launch per session. Round 1115d-r01: `seed` 2716581686, `playthroughSeed` 795590274 (from `final-state.json`). Round 1115m-r01 has no final state file.
- Publication: the autonomy note says nothing is pushed. The playtest README, changed at 02:07, records a later user direction (`pushToMain: true`): every accepted commit is rebased onto `origin/main` and pushed there, which deploys the site. The loop ran with that option. When this record was written, `origin/main` held the loop's commits up to `2741ccb`; `edf688e` was only on the branch and is pushed together with this record (check `git log origin/main`).

What this kind of test can show: bugs, dead ends, unclear wording, missing feedback, and moments without anything to do for these players. What it cannot show: enjoyment, how people coordinate by voice, or that a role has enough to do (D-014, `AGENTS.md`).

## Actual sequence

| Round | Lobby mode | How far the team got | Goals achieved | Findings by class | Changes made | Changes reverted |
| --- | --- | --- | --- | --- | --- | --- |
| 1115m-r01 (played before this run, triaged and worked in it) | manual | Lobby done in 2:40. Plan and "Order 9 parts" 45 s after the start. 9 contracts signed, 8 delivered. The camera was signed on day 152 and due 35 days after launch; the launch fired by itself on day 180 and scrubbed. Play ended at minute 16 of 30. | 0 of 2 | 18: 3 bug, 7 clarity (3 of them symptoms), 6 design, 2 agent artifact | Polish `47dbfd5` (4 fixes: stable order quote, launch chip and "move launch" button, "Order by" dates, scrub display). Rework `5c4f9c9` (weather mission needs Science; request step removed). | none |
| 1115d-r01 | manual | Lobby done in 2:40. Plan and "Order 9 parts" 39 s after the start. Both researches started in the first 26 s and done in March. 9 contracts signed by day 74, all delivered. Launch on time on day 180; the booster engine (97.5 %) failed its roll at 92 % / 86 % shown. Play ended at minute 17 of 30. | 0 of 2 | 15: 2 bug, 4 clarity (1 a symptom), 7 design (1 a symptom), 2 agent artifact | Polish `2741ccb` (3 fixes: lost-flight result, partner offer terms, empty needs list). Rework `edf688e` (Science part tests, weakest parts on the Planner, reliability in Procurement, new suggestion order). One polish change turned down by the judge (shared budget label), one finding skipped (limit of four). | none |

Round 1115d-r01 in order (seconds of session; the mission started at 229 s):

- 49 to 209 s: host creates one invite per guest, each guest returns a reply code; all connected at 209 s, mission started at 229 s.
- 244 and 255 s: Science starts the two researches the design depends on. No further Science action.
- 245 to 268 s: Planner adds the manoeuvre, sets the altitude, uses the one-click fix, presses "Order 9 parts". No further Planner action.
- 303 to 530 s: Procurement signs nine contracts, nine confirmations for nine orders, all standard delivery, all by "Review suggestion".
- 248 to 872 s: Comms answers nine messages and starts three projects.
- 570 to 667 s: all four look for a way to raise the 92 % / 86 %, find none and agree to launch as is.
- 950 s: launch. Result: "Booster engine failed during Launch to 35786 km". 135.6 M of 370 M spent.
- 1002 to 1038 s: all four end the session; each gives "no retry or further actions" as the reason.

Changes during preparation of each commit: the first version of the new suggestion order in `edf688e` ranked reliability before part size, proposed a 260 t tank for an 80 t need and left the rocket too weak to lift off; the author changed it to "lightest fitting part first" before the judge saw it.

## Committed plan and single resolution

Two separate sessions, one launch each, no repetition within a session.

- 1115m-r01: nine parts ordered; launch day reached with the camera in transit; scrub; 0 of 2 goals; 138 M of 335 M used. No final state file (the round was cut short); last state `playtest/runs/1115m-r01/state/00959.json`.
- 1115d-r01: nine parts ordered and delivered, two researches done; launch on day 180; booster engine failure; 0 of 2 goals; 135.6 M of 370 M spent. Final state `playtest/runs/1115d-r01/final-state.json`.

During the months between ordering and launch the Planner, Science and (after the last order) Procurement dispatched no game action in round 1115d-r01. The run folders are local and ignored by git.

The two reworks and the second polish commit were checked only in one-player sessions (`playtest/runs/1115m-r01-check`, `1115m-r01-judge`, `1115d-r01-check`, `1115d-r01-judge`). No four-player round has played the game as it is at `edf688e`.

## Observations

Counts, round 1115d-r01: 160 inputs, 0 without visible effect; 0 console or page errors; game actions per player 4 (Planner), 9 (Procurement), 2 (Science), 13 (Comms). Round 1115m-r01: 349 inputs, 3 without effect, all on the order dialog; Science 0 game actions.

What the triage of round 1115d-r01 recorded about the changes made after round 1115m-r01:

- Stable order quote (`47dbfd5`): nine orders took nine confirmations; in the round before, nine orders had taken 83 button presses. Verdict "helped".
- "Order by" dates and sort (`47dbfd5`): the players quoted the dates and every part arrived early. The re-sort when a need is covered cost one agent a misclick. Verdict "helped".
- Launch chip and "move launch" button (`47dbfd5`): the Planner opened the launch-date panel; the button had no occasion because nothing was late. Verdict "helped, weakly".
- Scrub display (`47dbfd5`): no effect on the fault behind it. The same contradiction returned for a launch failure (result and Comms card narrated flight events after the booster had failed).
- Science needed by the weather mission (`5c4f9c9`): the Science player understood the job within about a minute from the panel "The mission needs", both researches ran, Procurement bought the camera and antenna after them, and the team reached a launch. Verdict "helped". Follow-ups: Science had nothing to do after its two clicks; the wording "open a Call" led three players to plan around a Call that was never needed.

Seen in round 1115d-r01 and not in the round before:

- All four players looked for the part behind the success chances and for something that raises them. The Planner saw two totals; Procurement found per-part reliability only in a contract's detail; no research or Comms project touched reliability. 234 M stayed unspent.
- Comms passed a partner's camera to Procurement without seeing its terms; it was 96 % reliable against the 96.5 % already contracted. Procurement read an arrival date on the unsigned offer that moved every day.

Seen in both rounds (the triage marks them as repeats):

- After the result, no station offers anything: no retry, rebuild or debrief. Both rounds ended with 13 to 14 minutes of session unused.
- The Planner was finished 39 to 45 seconds after the start.
- Joining took 2:40 in both rounds: one invite and one reply code per guest, handed over one after another.
- Players could not tell that the budget is shared or who had spent from it.
- Procurement saw a 77-part catalogue and an empty needs list until the Planner pressed "Order 9 parts".
- Calls for Offers, delivery options, contract changes, Compare, Department supply, the Planner's "Launch now", saved versions, Advanced and Solar system view, and the Comms licences were not used.

Named as clear by the players of round 1115d-r01: the station picker, the Planner briefing and "Next" hint, the one-click fix, Science's "The mission needs" panel, Procurement's "Order by" dates, "Fits" tags, suggested offer and three-click order, the contracts timeline, the Comms inbox with outcome texts and "AFFECTS …" tags.

Idle time the triage did not attribute to the slowed calendar, converted to the game's default speed (a 6-minute mission): Planner about 5:40, Science about 3:30 after its researches plus 2 minutes watching them, Procurement about 3:30 after the last order.

Full lists with evidence: `playtest/runs/1115m-r01/findings.json`, `playtest/runs/1115d-r01/findings.json` (local), and [`playtest/ledger.json`](../../playtest/ledger.json) (in git, titles and classes).

## Interpretation

- The hypothesis held for one step: the round after the fixes got from a scrub to a flown launch with all parts delivered and research on the critical path. It did not hold for the end of the session: both rounds ended at 0 goals with nothing left to try at minute 16 to 17.
- The 0 of 2 in round 1115d-r01 is one roll at 92 % / 86 %. One session does not say how often the mission is lost; it does show that these players had no way to act on the odds and no way to continue.
- `5c4f9c9` made the weather mission harder (two researches at 90 % each must both succeed, 81 % together). Round 1115d-r01 saw the case where both succeed. A failed research, its retry and the Mars mission were not seen.
- `edf688e` (part tests) answers the largest finding of round 1115d-r01 on paper and in one-player sessions. Whether four players find it, whether it changes what Planner, Science and Procurement do in the months before launch, and what it does to the balance are not observed.
- A triage verdict of "helped" is one AI agent's reading of one session. The judge is also an AI agent. Neither is evidence that people would prefer the changed game.
- Agents read every word on screen. Round 1115d-r01's team got its plan from texts a person might skim. Agents cannot hover, so the per-part reliability a person could have found in a tooltip was invisible to them; this overstates the "no screen names the weak part" finding somewhat.
- Idle minutes are counts of game actions by agents on a slowed calendar. They are not evidence that people would be waiting or not waiting, and nothing here shows enjoyment (D-014).
- Half of each polish commit's risk is in what it removed or changed as a rule: since `2741ccb`, a flight that lost every goal can no longer be "saved in flight".

## Follow-up

- Ideas to add or revise: none added to `docs/ideas.md` by the loop. Candidates for the team: part tests by Science; needs read from the Planner's design instead of a request; a held launch instead of a scrub; a second flight after a failed one.
- Questions answered or still open: none answered. Touched: Q-005 and Q-008 (what players know about risk and what money can change), Q-011 (what follows a result), Q-014 (concurrent work for Planner and Science), Q-027 (whether Procurement provides Science's needs), Q-028 (what Calls are for in a mission where research is fast).
- Proposed changes: the four game commits `47dbfd5`, `5c4f9c9`, `2741ccb`, `edf688e`, each to keep or drop, and the open findings; see [`playtest/morning.md`](../../playtest/morning.md).
- Conflict with an accepted decision: `5c4f9c9` removes the research request from Procurement to Science that D-020 describes. `docs/decisions.md` was not changed. The code and D-020 now disagree until the team either drops the commit or records a new decision.
- Decisions actually accepted, with source: none.
