# Independent mission-confidence review — November 16, 2026

## Question and evidence boundary

Reviewed whether the current three authored missions have lawful, affordable, timely completion routes under current mechanics; separately reviewed normal research-failure recovery and four-station replication evidence. This is an independent read of current source, retained calculation recipes/results and the parent's actual browser-run artifacts. This reviewer did not operate the browsers or run a new test suite, change source, inject state or modify gameplay. Source inspection and JSON summarization are audit of evidence, not an additional observed playthrough.

The evidence supports **existence of playable successful routes**, including all Weather optional goals. It does not support guaranteed wins, an estimated population win rate, first-time human discoverability, real-time workload quality, zero role waiting or venue-network qualification. Failed original policies remain important evidence and must not be replaced by successful targeted follow-ups.

## Current four-station proof inspected

Files under `/tmp/nasa-four-station-results/` as inspected:

| Run | Seed | Actual outcome on all four peers | Preparation/evaluator | Funding / spend / remaining M | Goal day / deadline |
| --- | ---: | --- | --- | --- | --- |
| weather-all | 20261116 | required 2/2, optional 2/2; not scrubbed | 11 delivered contracts, 11 successful tests; no evaluator errors | 255 / 196.6 / 58.4 | 390.219 / 400 |
| moon | 20261116 | required 3/3; not scrubbed | 10 delivered contracts, 8 successful tests; no evaluator errors | 250 / 231.4 / 18.6 | 304.978 / 455 |
| mars | 20261116 | required 4/4; not scrubbed | 16 delivered contracts (17 engine/part units); no evaluator errors; advisory lift-ratio warning remains | 960 / 299.1 / 660.9 | 497 / 1277 |
| weather-recovery | 20261117 | required 2/2, optional 2/2; not scrubbed | Radar research fails, normal retry succeeds; 11 delivered contracts, 10 successful tests; no evaluator errors | 255 / 207.7 / 47.3 | 390.219 / 400 |
| moon-recovery | 20261120 | required 3/3; not scrubbed | Initial lab research fails; ordinary Northgate partnership grants lab capability, hardware delivered; no evaluator errors | 272 / 250.4 / 21.6 | 402.978 / 455 |
| mars-recovery | 20261118 | required 4/4; not scrubbed | Initial camera research fails; paid retry and later transfer window, all hardware delivered; no evaluator errors | 1005 / 315.2 / 689.8 | 1269 / 1277 |

For each completed artifact above, four final state hashes are identical, `identicalResults` is true, every peer's goal outcomes/score agree, no sync errors are recorded, and the page-error list is empty. No open manual coordination commitment remains in these states. Actual Comms decisions and earned funding remain in state. Weather's positive funding and Moon's reductions are not overwritten to make the route affordable.

**Metric correction:** the runner originally set `success:true` whenever the walkthrough finished. This is not a mission-win definition. Parent was informed and intends to retain explicit `walkthroughCompleted` versus `missionWon` fields. Until then, use `results[].score`, actual `goalOutcomes`, no scrub, error list and convergence as the evidence, never the generic success flag alone.

## Why these are normal routes rather than state-patched solutions

Inspected `/tmp/nasa-four-station-missions.mjs` and the three normal-action calculation source families. The actual browser runner creates four isolated contexts, creates/joins a host session through actual manual WebRTC, claims one station per peer, and dispatches that role's existing typed action functions. Core calendar actions are host-owned. Every action/group is followed by host confirmation and a four-peer state-convergence barrier. Apart from controlling and then checking the host's initial random seed, it does not write a desired GameState, unlock, budget, delivery, reliability or result into the store.

The calendar is paused and advanced with normal host tick actions. That is accelerated controlled scheduling, not a human four-player real-time playtest. Dispatching an action through its existing exported function proves normal reducer/network acceptance but not that a first-time user found/clicked the corresponding control. Source UI/menu accessibility was independently inspected as below.

### Planner control and menu accessibility

- **Moon:** requested kerolox 4,500 kN and 320 s are inside current 20–10,000 kN and 280–360 s definitions; lander fuel 1.6 t is inside 0.1–2,000 t. These are normal StatValue/Slider edits through `actions.setPartStat`; no bound bypass. Single large booster is a documented alternative to the advanced twin-engine route.
- **Mars:** upper-stage fuel 23 t, orbiter fuel 2 t, lander fuel 0.8 t and lander antenna 200 kbps are inside current fuel and 1–10,000 kbps ranges. The recipes change these before signing hardware; normal `partEditable` checks still apply. Existing two booster engines are ordinary initial design data, not an injected count.
- **Weather:** extra spectrometer/radar are added through the existing equipment action; performance 5 and 3 are inside 1–10. Other draft settings remain the initial values. Contracted catalogue parts legitimately replace minima with their actual larger tank/performance stats through current procurement rules; they are not hidden slider edits.
- `availableManeuvers` exposes Launch from Earth, transfer to Moon/Mars, Enter orbit at the target, release the second Mars spacecraft, land a lander and Weather's one-click GEO orbit raise. The recipes do not use an undisclosed maneuver type or a forbidden landing branch. Custom maneuver/branch IDs identify ordinary menu-created objects rather than granting capability.
- Earth 200 km, Moon 100 km and Mars 1,000 km target altitudes are supported by body-bound altitude sliders. Mars departure/travel values 239/258 and recovery 1017/252 are inside the ordinary transfer ranges; launch dates 230/300/390/398/1017 respect mission bounds. `setLaunchDay` shifts scheduled transfer departure through its existing reducer behavior.
- Moon's five-day UI transfer is computed by the model as about 4.978 days (child-body Hohmann path). The reported actual arrival correctly uses the evaluator result rather than assuming the literal requested five days.

## Deadline/result interpretation

The evaluator rejects goal maneuvers arriving after the mission deadline (`evaluate.ts` goal loop). `playthrough.ts` adds a 30-day presentation tail to `endDay`. Therefore Weather endDay420.219 does not mean its day390.219 goals missed day400, and Mars research-recovery endDay1299 does not mean its day1269 goals missed day1277.

The inspected successful main routes achieve their goals through actual base goal events before deadline, rather than relying on an in-flight rescue event after deadline. The Mars recovery calculation's day1289 unfavorable insertion narrative does not revoke its day1269 goals in the retained seeded outcome. No code changed to force this interpretation.

`kind:'failure'` can also be an authored unfavorable in-flight modifier narrative even if all goals succeed. Count actual goal outcomes and scrub status; do not equate any failure event with a failed mission. Conversely a positive evaluator probability is not actual completion: the flight roll must still be inspected.

## Fixed ten-seed evidence — original policies retained

All three initial batches declared adjacent seeds 20261116 through 20261125 before execution and retained every result. This small deterministic sample is useful coverage, not statistical certification or evidence of independent trials.

| Mission | Original all-goal completions | Preparation qualification | Retained counterexamples |
| --- | --- | --- | --- |
| Weather | 7/10 with both required and both optional goals | Initial policy cannot always procure delayed radar before fixed launch390 | Seeds17/21 scrub after radar-research delay; seed19 ordinary reliability loss |
| Moon | 7/10 required3/3 | 9/10 actually launch-ready; all geometric routes alone do not imply readiness | Seed17 upper-stage engine loss0/3; seed21 landing-leg loss1/3; seed20 repeated lab-research policy exhausts recovery time/budget and scrubs |
| Mars | 9/10 required4/4 | 10/10 physically achievable, delivered, nonnegative final budget and no evaluator errors under the policy | Seed22 surface-lab reliability loss leaves3/4 |

These failures are not erased. Seed20 Moon's repeat-lab policy failure does not prove Moon structurally impossible: an authored Comms alternative exists. Weather research delay likewise needs a changed procurement/Comms policy, not a patched unlock.

### Recovery evidence and honest limits

- **Weather:** actual four-station seed17 recovery is now complete as listed above. Normal radar retry and industry-support projects make delivery/test scheduling viable; no budget/reliability injection. The separately retained coordinated ten-seed recovery variant still has seed21 actual solar reliability loss (required1/2, optional0/2). Do not call that variant 10/10 wins. Source/reducer evidence can establish recovered readiness even when a legitimate roll loses goals.
- **Moon seed20:** retained separate recovery calculation stops repeated lab retries after the first failure and starts the existing 6 M Northgate regolith-lab partnership. It completes normally, a real catalogue lab is purchased, a natural late-delivery event is answered with paid expediting, launch moves398 and all goals occur402.978 before455. Funding272/spend250.4/available21.6. The original failed seed20 remains unchanged in the ten-seed table. The completed four-station `moon-recovery.json` now independently confirms this exact outcome/budget, no evaluator errors, all hardware delivered, four matching state hashes/results and no page/sync errors.
- **Mars seed18:** retained calculation shows first sensor failure, paid normal retry and a later transfer window; launch1017, all goals1269 before1277, funding1005/spend315.2/available689.8. It does not use the flagged ion-offer anomaly. The completed four-station `mars-recovery.json` now independently confirms the exact outcome/budget, all hardware delivered, four matching state hashes/results and no page/sync errors.

## Assessment

No structural blocker found in the inspected successful routes: parts, research, procurement, dates, fuel/data/power and final budget fit current authored rules, and actual three main four-station runs complete all goals. The strongest defensible claim is: **all three missions have now been completed under normal actions across four connected browser stations, with Weather's two optional goals included; a legitimate research-failure recovery for each mission has also completed successfully across the four connected stations.**

Do not claim every seed or arbitrary crew policy wins. The sample explicitly shows stochastic losses and poor recovery decisions. Human comprehension, discovery, concurrent role satisfaction and venue-network behavior remain separate questions that this evidence does not answer.

## Final closure after all six connected runs

Read the completed Moon20 and Mars18 recovery artifacts, including each peer's actual score/result, confirmed final budget, evaluation issues, hardware delivery status, research histories and state hashes. All six retained connected runs meet the table above, without a scrub, evaluator error, negative final available budget or mismatched peer result. The two completed recovery traces preserve the failed initial research attempt and paid/partner recovery; no favorable replacement of the failure was performed. No structural mission blocker identified.

Action-count tables include host calendar ticks attributed to the host's Planner browser; they must not be presented as counts of meaningful Planner decisions or used to infer role engagement. The separate original ten-seed policy losses remain retained, including legitimate reliability losses and the poor repeated-lab/late-radar policies. Successful targeted recovery is evidence of an alternative route, not erasure of those outcomes.

The separate four-seat retry/change-mission observation is now completed and recorded below. This source/artifact review added no game changes, browser operations or test suite.

## Final connected-session recovery closure

Inspected `/tmp/nasa-four-station-results/session-flow.json`, distinct from the six mission-completion cases. After the completed Mars run, Retry converged across all peers at attempt2, retained exactly one prior history record and preserved all four seats. Choose mission then converged to Moon in planning with the same seat ownership. The final sync entries show Planner host and Procurement/Science/Comms clients still connected at their correct station IDs, each with null error; the artifact page-error list is empty. Parent explicitly waited for all four station views after the change before recording this, avoiding a premature pre-effect observation.

This supports the implemented host-only recovery path and connected-group preservation in the observed local manual-WebRTC session. It does not extend the six mission-run claim to a newly completed second Moon attempt; no such extra result is recorded. Original batch failures and targeted recovery outcomes remain separate. No gameplay source edits were made by this confidence pass.
