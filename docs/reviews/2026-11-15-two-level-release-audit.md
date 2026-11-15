# Two-level hackathon release audit

Date: November 15, 2026. Requested by the user: expert subagents to audit the two current levels for quality, playability, balance and the shortest route to a hackathon release.

**Subsequent implementation:** the user approved fixing these findings under D-029. See [release-fix observations](../playtests/2026-11-15-release-fixes-walkthrough.md) for the current implementation, revised Mars costs/timing and checks actually performed. The audit below retains its original pre-fix findings.

## Verdict

**Both levels have affordable, physically feasible solutions. Neither is yet verified as release-ready multiplayer gameplay.** Weather is the stronger introductory demo. Mars has a richer planning problem but weaker opening Science activity and less discoverable solutions. Fix a small set of progression, result-truthfulness and recovery problems before adding content or tightening budgets.

These are audit recommendations, not accepted new mechanics. No game source was changed, no tests were added or run, and no commit or push was made.

## Evidence and limits

Five independent expert packets covered economy/solvability, physics/outcomes, four-role activity, multiplayer/release reliability, and first-time UX/accessibility. The parent checked primary findings and synthesized them. Impeccable's technical audit and fresh Web Interface Guidelines were used for the UI packet; this was not its separate dual-assessment design critique workflow.

- TypeScript `--noEmit` and Vite production build passed on the current checkout. The build emitted a bundle-size advisory (approximately 547 kB JS, 176 kB gzip); no demonstrated performance blocker.
- Numerical exploration called the actual evaluator, maneuver defaults and procurement quote/ranking functions. It proves feasible evaluated configurations under stated conditions, not successful player navigation, full stochastic wins or multiplayer completion.
- Browser observation on a separate localhost origin preserved the previously existing saved game. Both missions could be selected and started; Weather's opening design and Science needs were inspected, then Mars Science was observed displaying “Nothing. Every part in the Planner's design is within research.” No projects or contracts were executed in this browser pass. The host lobby lacked an in-session mission picker. The audit calendar was paused afterward.
- No four-person session, end-to-end UI route completion, fresh network join/resume exercise, or venue-network check was performed. Fun, real player idle time and first-time completion rate remain unmeasured. Existing historical playtests are not evidence that today's checkout passes these checks.
- The Impeccable detector found four side-tab accent warnings, verified as functional role/category/status styling; no release work is recommended for these.

## Quantitative baseline

| Measure | Weather satellite | Mars orbiter + lander |
| --- | --- | --- |
| Starting budget | $350M | $900M |
| Feasible route hardware | $100.4M | $245.9M |
| Required research on that route | $19M | $0 |
| Remaining funds before optional activities | $230.6M / 66% | $654.1M / 73% |
| Latest delivery under the schedule below | Day 152 | Day 213 |
| Default launch | Day 180 / about 5m55s | Day 230 / about 7m33s |
| Evaluated goal completion | Day 180.219 | Day 497 |
| Individual evaluated goal probabilities before Comms | 92.3%, 88.2% | 90.86%, 88.16%, 89.96%, 87.28% |

Conditions: neutral industry trust, no event modifiers, immediate procurement except Weather camera/antenna ordered on day 61 following first-attempt research success. Costs exclude optional tests and Comms projects. Per-goal probabilities are correlated through shared parts; they are not the probability of a complete mission win.

### Weather reference route

Research Larger sensor arrays and Ka-band downlink concurrently ($9M + $10M, 60.88 days each). Publish the initial design's part requests and purchase recommended catalogue offers, ordering the camera/antenna after research. Launch to 200 km on day 180 and raise orbit to 35,786 km. The evaluator reports no errors and both goals achievable.

Procurement changes the rocket materially: the draft 80 t booster tank maps to a 120 t offer, and the 2 t upper tank to a 6 t offer. The original draft is 236.91 m/s short; contracted recommendations provide 15.450 km/s against 13.335 km/s required. This removes the intended fuel-sizing puzzle without deliberate resizing. That is acceptable for an introduction, but should not be described as a validated fuel puzzle.

Each opening research project has 90% success, giving 81% probability that both succeed first time. A failed camera project followed by ordinary retry/delivery misses the default launch; moving launch before the day-400 deadline remains a recovery route. The player must understand this recovery.

Standard camera delivery arrives around day 152, too late to complete its 30.44-day test before day 180. Priority delivery costs $27.6M instead of $23M, arrives around day 125 and allows testing by day 156. This is a useful trade-off, not automatically a defect.

### Mars reference route

Before ordering, request upper-stage tank 23 t (recommended offer supplies 80 t), orbiter tank 2 t (4 t), lander tank 0.8 t (1.6 t), and lander antenna 200 kbps (600 kbps). Leave other requests unchanged. Launch day 230; default Mars transfer departs day 239 and travels 258 days. Insert into **1,000 km Mars orbit**, release the lander and land. All four goals are achievable on day 497, with no errors and a low-lift-ratio warning (1.08).

The initial recommended configuration fails insertion. Increasing only the upper tank is insufficient. With the feasible configuration above but the default 250 km insertion altitude, landing has 596.84 m/s against 600 required; the 1,000 km route leaves 676.80 m/s. This explains why a naive “add fuel” solution can remain frustrating.

## Prioritized findings

### R1 — P1: Positive events can award impossible goals

`game/src/stations/planner/result.ts:25–27,48–52` applies a positive Comms rescue roll to every failed goal whenever another goal succeeded. It does not check whether the failed goal was physically achievable. Reaching Mars orbit without planning a landing can therefore still be awarded a landing.

**Minimum repair:** require physical feasibility before a rescue; preferably restrict rescue to explicitly eligible reliability failures. Keep physically absent instruments, missing routes and missed deadlines failed. Verify with a partially successful mission containing an impossible goal and a positive event, plus an eligible reliability failure that may be rescued.

### R2 — P1: Legitimate Science choices permanently lock prerequisites

`science/model/tree.ts:188` rejects covered grants, but `science/data/techs.ts:69–77` requires both Lightweight panels and Concentrators for Metamorphic cells although each grants solar output 24. Completing either blocks the other. At `techs.ts:135–144`, Optical terminal (6000) can similarly cover Adaptive coding (5000), blocking Phased array because both are required.

**Minimum repair:** allow an unresearched covered tech when it is still needed as a prerequisite, with truthful UI explanation. Verify both completion orders and the later unlock. These are optional high-tier routes in the demonstrated solutions, so this does not make the base levels impossible.

### R3 — P1 demo recovery: No retry or level change after results

Planner `ui/Playthrough.tsx:172` and `shell/ResultOverlay.tsx:68` offer Close only. Existing restart/return-to-lobby/set-mission/record-attempt reducers in `core/coreActions.ts:132–160` have no UI callers. Changing levels requires close/rehost and exchanging invitations again.

**Minimum repair:** host-only Retry and Choose mission using the existing reducers, preserving peer connections and recording the result consistently. Verify all four stations follow the reset and selection. This is a demo-flow priority, not proof that a single session cannot finish.

### R4 — P1 gameplay target: Mars lacks an opening Science job

Mars initial design lies entirely within its initial research (`planner/data/missions/marsOrbiterLander.ts:46–95`). Science consequently shows no mission needs (`science/ui/App.tsx:65`), directly confirmed in the browser. Tests need delivered contracts (`science/model/tests.ts:109–110`), while catalogue lead times have a two-month floor (`procurement/data/catalogue.ts:134`). Approximately two real minutes pass before even immediately ordered test hardware arrives. Optional speculative research exists, so this is a lack of directed useful activity rather than a complete action lock.

**Proposal requiring balance re-evaluation:** give Mars one immediately useful authored research objective or explicit opening reliability work. Do not arbitrarily lower limits without checking the full route. Weather also has a two-minute burst/wait research pattern; real player observation must assess whether its other decisions are sufficient.

### R5 — P2 but high-value: Mars shortfalls and guidance obscure recovery

`planner/physics/evaluate.ts:372–374` rounds the failing landing above to “needs 0.60 km/s, has 0.60 km/s.”

**Minimum repair:** show the deficit in m/s and provide a concise mission-specific clue about preserving lander fuel, orbit altitude and data rate. Keep the full reference solution as facilitator guidance if desired. Verify the 596.84-versus-600 case is understandable through the interface.

### R6 — P2 but cheap: Comms safety prose overclaims effects

Cheapest-bid audit/test-clause choices describe fixed shortcuts or faults, but their actual effects are trust, delay and/or price (`comms/data/weather/eventsTriggered.ts:86–91`; `mars/eventsTriggered.ts:129–134`). They do not improve hardware reliability.

**Minimum repair:** align prose with implemented consequences and explain that Science testing changes part risk. Adding a new reliability mechanic is unnecessary for this release.

## UI/accessibility technical audit

Source assessment with limited rendered opening inspection; no WCAG or Full HD conformance claim. The screenshot used the browser's existing viewport, not a controlled 1920×1080 viewport. Desktop station layout is the release target; lack of mobile support is not treated as a blocker.

| Dimension | Provisional score / 4 | Finding |
| --- | --- | --- |
| Accessibility | 1 | Required route continuation is pointer-only; low-contrast Science statuses |
| Performance | 3 | Event-driven canvas; no measured runtime performance failure |
| Theming | 3 | Coherent planner/procurement; separate Science palette |
| Desktop layout | 3 | Bounded panels and scrolling; controlled Full HD check pending |
| Implementation integrity | 3 | Actionable issues and tasks; contextual detector warnings dismissed |
| Total | 13/20 | Source technical assessment, not gameplay score |

- **P1 accessibility:** `planner/map/MapCanvas.tsx:46` and `map/renderer.ts:332–339,548–552` make mandatory later route steps pointer-only. Initial Launch has a DOM button; subsequent Next-step hints do not. Add a DOM Next step action per branch opening the existing menu. A staffed mouse-operated demo has a workaround; a keyboard-only player cannot complete either level.
- **P1 accessibility, small repair:** Science `.6` whole-node opacity (`science/ui/styles.css:28`) lowers useful status text contrast from 6.52:1 to approximately 3.20:1. Nodes remain clickable inspection buttons. Dim border/background instead. Calculation uses authored colors, not screenshot pixel sampling.
- **P2:** Science cancellation has no confirmation/undo while forfeiting at least half the research investment (`science/ui/App.tsx:99`; `science/logic.ts:155–165`). Reuse in-game confirmation and show the refund.
- **P2:** Science and Procurement need short role-loop instructions. Existing contextual needs, order-by dates, destination actions and unavailable-action explanations are worth preserving.
- **P2:** Label shared planner sliders and provide scoped reduced-motion alternatives for indefinite pulses.

Impeccable command mapping if used for follow-up: `$impeccable harden` for cancellation, `$impeccable clarify` for role guidance, `$impeccable adapt` for keyboard/contrast, then `$impeccable polish`. These are optional execution aids, not additional release scope.

## Reliability and documentation

Host-authoritative ordered actions/resync, seat-race correction, disconnected-seat release, and paused resume with cleared stale seats are supported by source inspection. These are positive implementation findings, not a fresh network verification. Concurrent work changed the Pages workflow and Vite configuration during this audit to derive the deployment base from GitHub Pages; those edits were preserved. Typecheck and local production build passed again afterward; no deployed custom-domain behavior was verified.

- Persistence silently swallows storage failures (`core/persist.ts:23–28`) while lobby text promises a save. Prefer a small save-failure warning.
- Root README still says integration remains open and no experiment has run. Replace contradictory release-facing guidance with an accurate first-session checklist.
- STUN-only WebRTC is an acknowledged prototype limitation (`net/webrtc.ts:13`) with existing fallback guidance. Do not require TURN infrastructure for this release without a demonstrated network need. Verify the actual demo network or prepare the stated fallback.
- Keep the host foreground during a demo: elapsed tick time is clamped, so browser background throttling can slow the calendar.

## Shortest release sequence

1. Repair result feasibility and Science prerequisite progression (R1–R2).
2. Add retry/level-change recovery (R3); correct misleading Comms outcomes and precise fuel feedback (R5–R6).
3. Resolve Mars opening Science work with one small authored change, then re-evaluate cost, timing and physics. Keep Weather introductory and current budgets generous. Procurement and funding have weak economic pressure today, but large budget cuts add unmeasured risk.
4. Add short role/mission guidance and inexpensive contrast/cancellation safeguards. Address keyboard route continuation for an independently playable public release; explicitly record the mouse-only limitation if a staffed demo ships first.
5. Perform one end-to-end four-station walkthrough per mission using the reference routes, including a research-failure launch slip, deadline/scrub feedback, retry/level change, and host reload/rejoin. Use real players to observe comprehension and idle time; agents cannot certify enjoyment. Verify the venue connection or fallback. These are required future observations, not checks already passed.

Release gate: both UI routes can finish; impossible goals stay failed; legal research choices do not brick progression; retry/change-level preserves the group; every player can identify useful opening work and recover from the demonstrated failure cases. Fix observed blockers from that pass. Defer new levels, tech branches, economy redesign, infrastructure expansion and cosmetic redesign.

## Clarification retained from investigation

`stayDays` is explicitly a hazard-assessment horizon (`planner/model/types.ts:212`), not elapsed science collection. Arrival-based goal awards and Weather's 730-day horizon against its day-400 deadline are therefore not a confirmed deadline bug.
