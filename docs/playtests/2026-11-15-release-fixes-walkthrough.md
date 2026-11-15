# Playtest — 2026-11-15 — release-fix implementation checks

- Status: completed implementation walkthrough; not a human multiplayer playtest.
- Facilitator: Codex parent, with five Sol implementation packets and one independent Sol source reviewer.
- Participants / roles: one agent operating four browser tabs, host Planning plus Procurement, Science and Communications peers. No human participant observations.
- Prototype: current working tree under `game/`, following [audit](../reviews/2026-11-15-two-level-release-audit.md) and [approval](../notes/2026-11-15-release-fixes-approval.md), D-029 / I-093.
- Scenario: both missions' route controls and station guidance, controlled Weather scrub, retry, connected mission change to Mars, host reload and one peer rejoin; numerical evaluation of complete feasible routes.
- Question: do the identified defects have concrete repairs, and do the shared UI/recovery flows work together?

## Hypothesis

Existing mechanics can support a hackathon demonstration after focused fixes, without new levels, infrastructure or broad economy changes. Physical feasibility and UI/network checks provide different evidence; neither proves human enjoyment.

## Setup

Local Vite on `127.0.0.1:5191`. Three peers joined through actual invite/reply exchanges and claimed separate seats; host claimed Planning. Normal seeded gameplay and clock, paused when checking controls. Default budgets remain Weather $350M / Mars $900M. Browser actions used the real rendered interface, with no injected game-state fixture.

The attempted viewport override did not affect the planning tab: reading `innerWidth/innerHeight` returned **1280×720**. Screenshots and controls were inspected at that actual viewport; this is not controlled Full HD qualification. The override was reset and created tabs/server cleaned up.

Temporary source calculations independently called the actual evaluator, quotes, actions and persistence code. These constructed scenarios are distinguished below from browser gameplay. No test suite was added or run. All changes remain uncommitted; concurrent title-screen work was preserved.

## Actual sequence

1. Four browser tabs connected via WebRTC and claimed all four stations. Weather started successfully; host navigation showed three connected peers and four occupied stations.
2. Using DOM controls and keyboard Enter, Planning added launch and the geostationary raise. The rendered Issues message showed the exact original-draft shortfall: **236.91 m/s**, with required/available values, rather than only rounded km/s.
3. Procurement's new “Your procurement loop” disclosure expanded with draft/publication, shared-budget, delivery, testing and Science-supply guidance. Science showed sensor/downlink jobs; starting sensor research reduced available funds from $350M to $341M.
4. Clicking Cancel project opened the in-game confirmation, showing **$4.5M refund from $9M invested** and explaining the declining refund. Cancelling the confirmation retained the running project.
5. Keyboard checking caught ineffective popup focus in the initial patch. The implementation was corrected to focus after the popup became visible and retain the original branch control across menu/editor replacement. Rechecking showed focus on the menu option, then the editor's named slider; Escape returned it to the branch Next step button.
6. A deliberately unprocured Weather mission was launched through the in-game warning, producing a scrub. Science's result explained the failure and reserved recovery for the host. Planning's finished result exposed Choose mission and Retry mission.
7. Retry returned the connected group to fresh Weather planning, day 0, full budget and no research project. Four seats and three connections remained. Planning's route, playback, popup and selections reset.
8. A second controlled Weather scrub was used to Choose mission. All stations returned to the lobby with their seats retained, and the host still showed all three peers Connected. Selecting Mars and starting brought the group into the new mission without another code exchange.
9. Mars Science displayed camera requirement **4 against limit 3**, with its $9M/four-month sensor route. Selecting the slower five-month optics alternative showed an explicit order-by/launch-slip warning.
10. On Mars, keyboard controls added Launch → Transfer → Enter orbit → Release Lander → Land on Mars. The separated lander had its own DOM Next step, and the expanded route editor listed every maneuver for editing. The transfer editor focused its named Departure date slider. This navigation used the draft rocket and still had fuel errors; it was not a successful mission completion.
11. While paused, Home on the named launch-date slider moved launch to the following day. Comms' project picker showed the new finishes-on/after-launch warning before starting. Starting Deep-space ground station access showed the continuing occupied-slot warning and reduced budget to $890M.
12. Reloading the host showed a saved Mars game. Peers displayed host-left guidance. Continuing restored day 13, the plan, $890M budget and the Comms project, with the calendar paused and old peer claims cleared. One fresh invitation/reply exchange reconnected Science; reclaiming its seat displayed the restored Mars state.

During the Mars route check, concurrent title-screen edits briefly caused a missing-import hot-reload overlay while their new file was being written. That file subsequently appeared; the overlay cleared, and a fresh host reload used the new title screen. Those edits were neither reverted nor attributed to this fix packet. Final typecheck/build includes them.

## Committed plan and single resolution

No commit or push. The browser used two intentional scrubbed Weather attempts to exercise result recovery; it did not complete either reference mission successfully. Complete feasible routes were evaluated separately against actual current game functions:

| Route | Current numerical result |
| --- | --- |
| Weather reference | Initial requests/recommended hardware, sensor + downlink research; launch day 180, 200 km then 35,786 km. Both goals achievable; hardware $100.4M + research $19M. |
| Mars first research success | Existing reference tank/downlink requests; camera ordered day 122 after sensor research. Hardware **$247.8M + $9M research**, latest delivery day 213, launch 230, default departure 239/travel 258, 1,000 km capture and separated landing. All four goals achievable with no errors; lift-ratio warning remains. |
| Mars sensor failure then successful retry | Second completion day 244, camera delivery day 335; retain other previously ordered reference hardware. Launch **day 1017**, newly selected default transfer departs 1017/travels 252, arrival **1269 before deadline 1277**. All four evaluated goals achievable, no errors; hardware $247.8M + research $18M. Delaying only launch to 336 and waiting in orbit was not established safe; waiting can lose fuel through boiloff. |

The audit's original $245.9M / zero-research Mars route is historical: the approved opening Science change now adds camera research and changes its quote.

## Observations and source calculations

- TypeScript `--noEmit` and Vite production build passed after integration. Build: 149 modules, approximately 555 kB JS / 179 kB gzip. Bundle-size advisory remains; no measured performance failure.
- A constructed positive-event scenario with an otherwise partially successful mission left missing landing/surface goals failed. Missing camera, inadequate data and missed-deadline goals likewise remained failed. A physically achievable goal lost to a camera reliability factor could still be rescued. This exercised the actual result function, exposed only in a temporary bundle.
- Exact original Mars edge case now reports **“short by 3.16 m/s (needs 600.00 m/s, has 596.84 m/s)”** with landing-fuel guidance. Numerical evidence; the browser independently showed the same precision format on larger shortfalls.
- Source calculations covered both completion orders of the solar prerequisite pair and both coding/optical orders; later technology remained startable. Initial researched techs retained their researched status.
- Refund calculations for a $9M/120-day project gave $4.5M initially, $2.3M halfway, $0M at its end. UI/reducer use the same helper. Browser independently showed the initial refund confirmation.
- Authored-color Science status contrast calculates to **6.85:1** after removing whole-node opacity; this is not a full WCAG assessment or screenshot-pixel measurement.
- Actual-module transport/reducer exploration preserved four claims, checked attempt-history deduplication and ordered client replay. Browser retry/change-level independently preserved the four-seat live group.
- Actual-module persistence exploration forced `localStorage.setItem` to throw: save returned false with failed status, then a restored write returned true with saved status. The warning component/retry action was source-reviewed; no browser storage failure was induced.
- Comms audit/test-clause and facility-access outcome prose now reflects the actual effects; no new hardware-reliability mechanism was added. Timing warnings appeared in both picker and active card.
- Planner/Comms reduced-motion rules were source-reviewed. Reduced-motion browser emulation was not performed.
- A fresh independent Sol source review found no actionable integration blocker. Review is not evidence of enjoyment or absence of idle periods.

## Interpretation

The audited code defects and interface gaps have repairs with direct source/numerical evidence and a real four-station recovery walkthrough. Generous budgets are retained deliberately; the economy still allows substantial reserves. Weather's catalogue supplies still solve its initial draft fuel deficit automatically, appropriate to the selected introductory role.

The Mars opening now has a relevant Science decision and a feasible schedule. Research failure remains recoverable but can require moving launch and the transfer to the later window. This is a harder route, not a guarantee that a first-time player will discover it. Sensor/Comms project durations can still create idle periods; useful opening work does not prove sustained concurrent engagement.

## Follow-up

- **Still required for release qualification:** human four-player completion of both missions, recording confusion and idle intervals; actual venue-network connection or prepared fallback; successful end-to-end UI procurement/research/flight run rather than only evaluated reference states; controlled Full HD check.
- No new levels, budget cuts, TURN service or cosmetic redesign were added by this fix packet. STUN-only connectivity and background host-clock throttling remain documented prototype limitations.
- Accepted implementation scope and Mars tuning: D-029, [user approval](../notes/2026-11-15-release-fixes-approval.md).

## Subsequent integration before publication

On the user's request to commit and push all work, newer remote commits were merged. They add PeerJS room codes with manual signalling retained as fallback, Communications consequence previews and actual project changes, and mission-specific Science availability. Conflicts were resolved by the corresponding Sol owners, retaining the audit fixes and the incoming behavior. The earlier four-browser observations above describe the pre-merge manual-code build; they are not a new room-code or combined-balance playtest. The original locally assigned audit-fix decision D-027 was aligned to D-029 because the upstream room-code decision already used D-027; title-screen D-028 is retained.
