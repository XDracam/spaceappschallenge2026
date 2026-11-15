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
