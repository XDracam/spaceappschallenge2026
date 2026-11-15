# Morning list — playtest loop, run 1115d (2026-11-15)

Read this first. Record of the run: [docs/playtests/2026-11-15-agent-playtest-loop.md](../docs/playtests/2026-11-15-agent-playtest-loop.md). Per-change log: [changes.md](changes.md).

The players were AI agents. Nothing below shows that people enjoy the game or that a role has enough to do. The loop was allowed to change rules and content without approval ([user direction](../docs/notes/2026-11-15-overnight-playtest-autonomy.md)); none of its changes is an accepted decision. Each one is yours to keep or drop.

Rounds: 1115m-r01 (played 03:42, triaged and worked in this run) and 1115d-r01 (played 12:30). Commits: `git log 7a679a6..HEAD`.

## (a) Where the game stands

Yesterday evening (round r001) four agent players finished the weather mission with 2 of 2 goals, Science never learned what to research, and the first round on the game as it was rebuilt overnight (1115m-r01) could not confirm its orders and ended in a scrub. Now orders sign on the first press and the weather mission depends on two researches by Science; the one round played on that (1115d-r01) reached a flown launch with all nine parts delivered, then lost both goals to a booster failure at 92 % / 86 % shown and stopped at minute 17 with nothing left to try. The loop's answer to that, Science testing delivered parts, is in the game but no four-player round has played it, and the dead end after the result, the 2:40 lobby and a Planner who is finished after 39 seconds are unchanged.

## (b) Reworks, the one I would keep most first

Reverts only apply cleanly newest first (checked with `git revert --no-commit` at `edf688e`): `edf688e`, then `2741ccb`, then `5c4f9c9`, then `47dbfd5`. Any other order conflicts.

### 1. `5c4f9c9` — the weather mission needs Science (R1115m-r01-03)

- **Problem and evidence.** Science had nothing to do: all nine needs were inside the starting research, research took 4 to 5 months against a launch after 6, and Science could learn of a need only after the Planner ordered and Procurement pressed "Ask science to develop it". Round 1115m-r01: player 3 made 0 game actions, waited 635 of 720 s, asked four times which research the design needs and was told "none" (`runs/1115m-r01/events.jsonl`, `chat.jsonl`, `notes.jsonl` t=424).
- **What is different for players.** The starting design's camera (4.5, limit now 4) and antenna (600 kbps, limit now 200) cannot be bought until Science has researched them; one first-step tech covers each. Research takes half as long in the weather mission (2 to 2.5 months). Science sees "The mission needs" from the first second, read from the Planner's rocket, with a "Finish by" date. Procurement sees Science's state on the need ("Beyond research · Science until 17 Mar"). The request step is gone: no "Ask science to develop it" / "Withdraw", no "Requests from Procurement".
- **What the later round showed.** Round 1115d-r01, triage verdict "helped": the Science player understood the job within about a minute, started both researches in the first 26 s, both were done in March, Procurement bought the camera and antenna afterwards, and the team reached the launch. Follow-ups from the same round: Science had no further action after those two clicks, and the wording "open a Call" led three players to plan around a Call that was never needed (R1115d-r01-11). Not seen: a failed research and its retry, the Mars mission.
- **What it could have unbalanced.** The mission is harder: both researches succeed together 81 % of the time; a failed one costs two more months and then needs priority delivery, a Call or a later launch. 19 M more is spent. The camera can be ordered on time only between the end of research and 31 Mar and from one of three suppliers. It contradicts D-020 as written (Procurement decides buy or develop and posts a request); `docs/decisions.md` was not changed. Mars games lose the request button too. State version 3 to 4 (saves migrated, requests dropped); loading a version-3 save was not checked.
- **Drop it.** `edf688e` and `2741ccb` build on it, so:
  `git revert --no-edit edf688e 2741ccb 5c4f9c9`
  This also drops the part tests and the second polish commit. `git revert 5c4f9c9` alone conflicts in nine files. To keep `2741ccb`: `git revert edf688e`, then `git revert 5c4f9c9` and resolve `game/src/stations/procurement/ui/Needs.tsx` and `playtest/changes.md` by hand.

### 2. `edf688e` — Science tests delivered parts (R1115d-r01-01)

- **Problem and evidence.** No station could see into or change the launch odds. 92 % / 86 % was fixed by the first nine orders, the suggestion picked the cheapest offer, no research or Comms project touched reliability. Round 1115d-r01: all four look for a lever and find none (`runs/1115d-r01/chat.jsonl` n36 to n45; "my screen only shows the totals, so I can't tell you", n40); Planner idle from t=268, Science from t=255, Procurement from t=530 until the launch at t=950; the booster engine (97.5 %) failed; 0 of 2 goals with 135.6 M of 370 M spent.
- **What is different for players.** Science has a third section "Part tests": a free research team tests one delivered part for a month (weather mission) at 20 % of its price, which halves its risk of failure if the test ends before launch; one test per part. The Planner's Goals card names the three weakest parts. Procurement's offer rows read "96.5 % reliable" and add "time to test" when the part arrives early enough; "All contracts" has a Reliability column. The suggestion no longer picks the cheapest offer: it ranks fit, delivery, budget, then the lightest part and its most reliable supplier.
- **What later rounds showed.** Nothing. No round was played after it. It was seen only in one-player sessions by its author and by the judge (`runs/1115d-r01-check`, `runs/1115d-r01-judge`). Not checked: four players, a full flight with tested parts, a test still running at launch, the Mars mission (2-month tests, engine clusters), priority delivery as the way to make a late part testable, loading a version-4 save, the screens at 1920x1080.
- **What it could have unbalanced.** With every part tested the weather mission goes from about 92 % / 86 % to about 96 % / 93 %; all nine tests cost about 20 M, so money is no limit, only time and the three teams. The new suggestion buys dearer and slower parts by default (Helix is 1.38x), so fewer parts can be tested unless Procurement picks fast suppliers on purpose; a player who only clicks "Review suggestion" never meets that choice. Round 1115m-r01's finding that the suggestion hides the supplier that can still deliver on time (R1115m-r01-06) was not fixed and may interact with the new order. The launch can be moved later at no stated cost, which makes "test everything" available. A test running at launch is lost without refund. Science's left column scrolls at 720 px height. State version 5.
- **Drop it.** `git revert edf688e` (applies cleanly; the game is then as round 1115d-r01's polish left it, which passed typecheck and build).

Why this order: `5c4f9c9` has one four-player round behind it and that round got further than the one before. `edf688e` is larger in what it adds to three screens, changes Procurement's default, and has no four-player round at all. The one argument for dropping `5c4f9c9` first is D-020.

## (c) Polish commits

- `47dbfd5` — 1115m-r01: order quote no longer goes stale every game day (was 83 presses for 9 orders; next round 9 for 9, verdict "helped"); Planner launch chip "Launch · change ▾" and a "Next: move launch to <date>" button when late deliveries are the only errors (panel was opened, button had no occasion); "Order by <date>" on uncovered needs, most urgent first (verdict "helped"; the re-sort cost one agent a misclick); a scrubbed launch is shown as scrubbed (did not reach the fault behind it, see `2741ccb`). Drop: last of the four, `git revert --no-edit edf688e 2741ccb 5c4f9c9 47dbfd5`.
- `2741ccb` — 1115d-r01: a flight that lost every goal shows no in-flight events and the Comms card reads "Flight lost" (this is also a rule change: such a flight can no longer be saved in flight); a Comms option that passes a partner part shows its terms and what is contracted now, Procurement shows "1 mo after signing" instead of a moving date; Procurement's empty needs list says "Waiting for the Planner's order: 9 draft parts." Not played by four players. Drop: `git revert --no-edit edf688e 2741ccb` (alone it conflicts in `game/src/stations/comms/ui/common.tsx`).
- `209aa12`, `dd1128f` (ledger) and `7d7272a` (rejected.md): bookkeeping, no change to the game.

One polish commit holds up to four fixes; a revert drops all of them together.

## (d) Turned down and reverted

- **Turned down by the judge:** R1115d-r01-06, "Shared budget" label with an 8-second note of who spent how much. In the judge's session a Procurement priority-delivery fee appeared as "SHARED · COMMS -0.1 M" on Procurement's own header, because any spend that was not a new contract, funding or Science was attributed to Comms; and Comms still could not see what the parts will cost. The change was discarded; the finding is open. What the judge asked for is in [rejected.md](rejected.md).
- **Reverted by the loop:** nothing. The triage of round 1115d-r01 judged no change of the round before to have harmed play.
- **Skipped:** R1115d-r01-13 (Comms news line starts behind the station badge), because the limit of four polish findings was used.
- **Never judged by a later round:** everything in `2741ccb` and `edf688e`.

## (e) Design findings still open, worst first

1. **A failed or scrubbed launch ends the game** (R1115d-r01-02, R1115m-r01-02; all four players in both rounds). No retry, rebuild or debrief, with the deadline at day 400 and 197 to 234 M unspent. Both sessions stopped at minute 16 to 17 of 30. A contracted part that is still in transit on launch day still scrubs unless the Planner moves the launch.
2. **Launch odds** (R1115d-r01-01). Reworked in `edf688e`, not played. Comms still has nothing that bears on mission success (player 4, report #3).
3. **Planner finished 39 to 45 seconds after the start** (R1115d-r01-04, R1115m-r01-07). No change was made for it directly; `edf688e` gives the Planner the "Weakest parts" line and a reason to move the launch.
4. **Science finished after two clicks** (R1115d-r01-09). The part tests of `edf688e` are aimed at it; not played.
5. **Joining takes 2:40** (R1115d-r01-05, R1115m-r01-11): one invite and one reply code per guest, in turn. One code for the table needs the open choice of how stations connect; the lighter remedy (all invites at once, replies in any order) was not attempted.
6. **Comms options tagged "affects planner" change nothing the Planner can see or do** (R1115m-r01-08). Not changed. Not reported again in round 1115d-r01; the player named the tags as clear, which does not show that they have an effect.
7. **The expediting bonus speeds up a different delivery than the late one** (R1115m-r01-10). Not changed; no delivery was late in round 1115d-r01.
8. **Calls for Offers unused in both rounds and misleading in the second** (R1115d-r01-11).
9. **Controls nobody touched in two rounds** (R1115d-r01-12): delivery options, contract changes, Compare, Department supply; "Launch now", saved versions, Advanced, Solar system view; Comms licences.

Open and not design: shared budget unreadable (R1115d-r01-06, fix turned down); suggestion jumps to a late supplier once standard delivery is late (R1115m-r01-06); a finished one-off Comms project is offered again (R1115m-r01-13); Comms news line hidden behind the badge (R1115d-r01-13). Leftovers named by the judge: the Planner playback still shows "T+30 d" after a scrub; the Comms header chip still reads LAUNCHED after a lost flight; the Planner's two "beyond research" warnings do not say that Science can research them; `Task.beyondResearch` is written and never read.

## (f) Findings that kept coming back

- Nothing to do after the result: r001 (no player found a next step), 1115m-r01, 1115d-r01.
- Planner without a decision after ordering: r001, 1115m-r01, 1115d-r01.
- Science without a job: r001 and 1115m-r01 (none at all), 1115d-r01 (two clicks, after `5c4f9c9`).
- The result shows flight events for a flight that did not happen: 1115m-r01 (scrub), 1115d-r01 (booster failure). Fixed twice; the first fix covered only the scrub. A flight that loses one of several goals still shows every event.
- Lobby 2:40: both rounds.
- Budget not readable as shared: both rounds; no accepted fix.
- Procurement empty until "Order 9 parts": both rounds; the lighter remedy is in `2741ccb`, Procurement still cannot prepare before the order.
- Calls for Offers and the controls of (e) 9 unused: both rounds.
- Agent artifacts, both rounds: clock labels that disagree because the harness slows the calendar; misclicks from fixed coordinates.

## (g) How to take the work

The loop ran with `pushToMain: true` ([README](README.md)): each accepted commit was pushed to `origin/main`, which deploys the site. When this file was written, `origin/main` held the loop's commits up to `2741ccb`; `edf688e` and this file are pushed in the same step that wrote it. Check what arrived:

```
git fetch origin
git log --oneline origin/main -10
```

Your checkout `C:/Users/Peter/Desktop/nasa hackathon/spaceappschallenge2026` had `main` at `5617ccd` when this was written, behind this branch, and may hold uncommitted work that this branch already contains as a commit (the loop did not look into that checkout, so this is not verified). Commit or stash there before anything else, otherwise the merge refuses or conflicts with identical changes:

```
cd "C:/Users/Peter/Desktop/nasa hackathon/spaceappschallenge2026"
git status
git add -A && git commit -m "WIP before taking playtest work"
# or: git stash push -u -m "before-playtest-1115"
```

Take everything (a fast-forward if `main` has no commits of its own):

```
git merge playtest/main-1115
```

Take single commits instead. They build on each other and on the team commits up to `2853128`, so bring `main` to the loop's starting point first and pick oldest first:

```
git merge 7a679a6
git cherry-pick 47dbfd5            # polish 1115m-r01
git cherry-pick 5c4f9c9            # rework: weather mission needs Science
git cherry-pick 2741ccb            # polish 1115d-r01 (needs 5c4f9c9)
git cherry-pick edf688e            # rework: part tests (needs 5c4f9c9 and 2741ccb)
```

If, after the merge, your stash or WIP commit shows only changes that are already in `main`, drop it.

Drop changes that are already on `origin/main` (deleting the branch does not remove them), newest first, then push:

```
git revert edf688e                                    # either: part tests only
git revert --no-edit edf688e 2741ccb 5c4f9c9 47dbfd5  # or: every game change of this run
git push origin main
```

The ledger, `changes.md`, this file and the playtest record stay in either case.

Delete the branch and the loop's worktree if none of it is wanted locally. The round evidence in `playtest/runs/` is not in git and goes with the worktree; copy it first if you want it.

```
cd "C:/Users/Peter/Desktop/nasa hackathon/spaceappschallenge2026"
git worktree remove --force "C:/Users/Peter/Desktop/nasa hackathon/mc-overnight"
git branch -D playtest/main-1115
```
