# Changes made by the playtest loop

Every change the unattended loop made to the game, newest at the bottom. Nothing here is an accepted decision: each entry says what was changed, on what evidence, and how to drop it (`git revert <hash>`).

## Carried over from playtest/overnight-1115 (judge accepted, replay: helped)

- Rr001-04: hide Comms Dev button and debug drawer outside the dev server.
- Rr001-10: label planner goal percentages as chance of success, from part reliability.

## 1115m-r01 — polish

- R1115m-r01-01: order quotes no longer go stale each game day or when another station spends; the quote token holds the lead time and on-time flag instead of the calendar date and the budget figure, the dialog still shows the live arrival date. Files: game/src/stations/procurement/rules.ts
- R1115m-r01-04: Planner launch chip labelled 'Launch · change ▾'; when late deliveries are the only errors the next-step pill is a button 'Next: move launch to <arrival date>'; 'Waiting for N deliveries' no longer repeats the launch date. Files: game/src/stations/planner/ui/TopBar.tsx, game/src/stations/planner/ui/NextStep.tsx, game/src/stations/planner/ui/styles.css
- R1115m-r01-05: uncovered mission needs show 'Order by <date>' (standard delivery, fastest fitting supplier; amber within 30 days, red when passed) instead of 'Needed <date>', and are listed first, most urgent on top. Files: game/src/stations/procurement/ui/Needs.tsx
- R1115m-r01-09: a scrubbed launch is shown as 'Launch scrubbed' in the Planner header, the result cards and the Comms card and chip; no in-flight events, 'Mission end' or 'Part failures' for a rocket that never flew. Files: game/src/stations/planner/result.ts, game/src/stations/planner/ui/TopBar.tsx, game/src/stations/planner/ui/Playthrough.tsx, game/src/stations/planner/ui/styles.css, game/src/stations/comms/ui/store.ts, game/src/stations/comms/ui/Header.tsx, game/src/stations/comms/ui/Overlays.tsx, game/src/stations/comms/ui/styles.css

## 1115m-r01 — rework of R1115m-r01-03

**Problem.** Science had nothing to do in the weather mission: all nine needs were inside the starting research, research took 4-5 months against a launch after 6, and Science could only learn of a need after the Planner had ordered and Procurement had pressed "Ask science to develop it". Evidence: player 3 made 0 game actions and waited 635 of 720 s (events.jsonl), asked four times which research the design needs and was told "none" (chat.jsonl), and noted "Unclear whether any research can pay off before launch" (notes.jsonl t=424); `state/00959.json` has no research project and no request.

**What changed.**

1. Mission content (weather satellite only): the agency's starting research is lower for two parts of the starting design. Camera limit 6 -> 4 and the imagery goal now needs performance 4.5 (was 3; the design's camera is 4.5), antenna limit 3000 -> 200 kbps (the design's antenna is 600; the camera sends 225). The catalogue cannot sell either part until Science has researched it. One first-step tech covers each (Larger sensor arrays or Adaptive optics; Ka-band downlink or Larger deployable dish). The existing Comms project "Northgate imager research" is a second way to the camera.
2. Research time per mission: `MissionDef.researchTimeFactor` (weather 0.5, Mars unchanged). A first-step tech now takes 2-2.5 months in the weather mission, so a project started in the first minute ends in March and leaves the 3 months the fastest camera supplier needs before the launch on 30 Jun.
3. Science reads the needs from the Planner's rocket instead of waiting for a request. Every part of the design that is beyond research and not under contract appears under "The mission needs" from the first second, follows the Planner's sliders, and names the day research has to be finished for the part to arrive before launch. The request step is deleted: `research.requests`, Procurement's "Ask science to develop it" / "Withdraw" and the "Buy or develop" block are gone (state version 4).
4. Procurement sees how far Science is, on the need itself: the "Beyond research" chip now reads "Beyond research · Science not started" or "· Science until 17 Mar", the need also gets its "Order by" date while it waits for research, and the inspector says which limit is missing and until when Science is on it. When the research succeeds, the news line says which need can now be bought and the chip disappears.

**Why this approach.** The cause was three hand-overs in a row (Planner orders, Procurement asks, Science acts) in front of a mission that needed no research. Deleting the request removes two of them and lets the design itself carry the information; lowering two limits gives Science a job the mission depends on without a new system. The buy-or-develop choice of D-020 stays as wait for Science or open a Call, decided by talking rather than by a button.

**Added to the screens.** Science: panel "The mission needs" (replaces "Requests from Procurement") with a "Finish by <date>" line and the shortest routes with cost and duration; the end date in the tech inspector ("2 months, done 11 Mar 2030"). Procurement: Science's state in the existing chip and one callout.
**Removed from the screens.** Science: "Requests from Procurement"; ★ marks on techs deeper than the shortest route. Procurement: the "Buy or develop" block with its two paragraphs and the "Ask science to develop it" / "Withdraw" buttons; the static callout "Created beyond research: <keys>…"; the two request news lines.

**What it could break.** The weather mission is harder: both researches succeed together 81 % of the time; a failed one costs two more months and then needs priority delivery, a Call or a later launch. A launch date that is not moved still scrubs (R1115m-r01-02 is open). Science still has little to do once both projects run (about 2 of the 6 minutes). Mars games: Procurement can no longer file a request; Science sees the needs directly. Saves of version 3 are migrated (requests dropped). `Task.beyondResearch` is still written but nothing reads it any more.

**For the team to look at.** Whether dropping the explicit request (D-020: "resource planning decides buy or develop") is acceptable; whether 4 / 4.5 for the camera and 200 kbps for the antenna are the right numbers; whether research should give more than access to parts (reliability, lead time), so Science has decisions in the second half. Files: game/src/core/model.ts, state.ts, persist.ts; game/src/stations/planner/data/missions/weatherGeo.ts, planner/model/types.ts; game/src/stations/science/logic.ts, model/research.ts, model/tree.ts, ui/App.tsx, ui/styles.css, README.md; game/src/stations/procurement/logic.ts, rules.ts, ui/Inspector.tsx, ui/Needs.tsx, ui/uiState.ts.
