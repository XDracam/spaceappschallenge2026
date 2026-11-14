# Playtest — 2026-11-15 — order integration walkthrough

- Status: limited single-operator interface walkthrough, followed by a fresh-reload recheck after fixes; remaining flows were not exercised.
- Facilitator: assistant, using an isolated local browser origin.
- Participants / roles: one operator acting as Procurement; no multiplayer session.
- Prototype version or files: in-progress integrated game during D-018 implementation; subsequent edits mean this observation is not a verification of the final diff.
- Scenario and rules: local fixture, catalogue camera purchase for Science, amendment and a Resource Call; values are prototype balances.
- Related ideas and questions: I-080, D-018, Q-014, Q-023–Q-028, Q-031.
- Question this experiment investigates: can the visible procurement flows carry a department purchase, amend its delivery and preview Call windows?

## Hypothesis

A Science-bound order should commit its quoted cost without creating a procurement Task; an amendment should separately spend its fee; Call previews should show consequences before opening.

## Setup

The operator used an isolated `127.0.0.1:5178` origin. The initial Budget and offered terms were those of the running prototype. This was not a four-player session and no project outcome was resolved.

## Actual sequence

The operator bought one Panorama C4.5 from Orbital Commons with Priority delivery for Science. The screen showed one incoming Science unit, zero Tasks, $24.4 M committed and $876 M available. An amendment displayed arrival changing May 31 to May 9; after acceptance $0.7 M was spent, the $24.4 M commitment stayed unchanged, and the history and news updated. Order again opened a fresh draft for the same Resource and Science destination.

A standalone Science Call was opened with a 14-day window and no purchase spending. Previews showed zero responders at seven days, Meridian at 14, and Meridian plus Helix at 30. The Calls screen was legible at 1280 × 720 in this inspection.

The first order confirmation refreshed as the date moved but appeared inert to the operator. The operator also identified that reselecting the same Priority option could accelerate a Contract without a new delay. Both were reported for fixes; this walkthrough predates those fixes.

### Fresh-reload recheck after fixes

A full reload replaced stale hot-module assets before this recheck. The operator bought a Swift Priority camera for $27.6 M, arriving July 1. Selecting Priority again showed July 1 → July 1 with a $0 fee. Two camera Contracts from different suppliers had independent dates and a combined $52 M committed.

From an isolated save at day 77, the operator drafted the Science Stereo + Detector recipe, selected an incoming camera and started the project for $15 M. After host confirmation the draft closed; the calendar showed one of three teams busy, 93% base odds and up to 97% conditional odds, with one unit reserved in Science supplies and zero Tasks. Delivery and research resolution were not awaited. Planner behavior and version-1 save migration were not exercised. The operator identified a missing control to assign free shared supply to a department; it was added after this check.

On a later full reload of the final code, Contract 15 had one unallocated shared unit. Assigning it to Science showed zero unallocated and an active Science allocation; releasing it restored one unallocated and retained the released allocation in history. Budget did not change. A [screenshot](../../procurement/concepts/implemented-orders.jpg) records the implemented interface. The final build passed after the assignment and Science ID changes.

## Committed plan and single resolution

Purchases, an amendment and a Science project start were observed across the walkthrough and recheck. No mission or research resolution was run.

## Observations

The inspected purchase, amendment accounting and Call preview displayed the values above. The repeated-Priority case showed no acceleration or fee on fresh reload after its fix. A Science project reserved incoming equipment; its eventual delivery and bonus were not observed. Split flight lots, migration and simultaneous actions were not exercised.

## Interpretation

These observations establish only the listed single-operator interactions in the inspected builds; changes continued after the recheck. They do not establish multiplayer enjoyment, concurrent activity, absence of waiting or correctness of unobserved paths.

## Follow-up

- Recheck the reported order-confirmation feedback after its fix.
- Inspect equipment delivery and research resolution, split flight supply, version-1 migration and stale competing actions.
- Run a four-player playtest before drawing conclusions about engagement or coordination.
- Accepted target: [D-018](../decisions.md#d-018--procurement-order-and-department-supply-prototype).


## Gameplay copy cleanup, November 15, 2026

User requested a simplification pass on the newly added order features. Removed repeated process instructions and mechanics paragraphs, shortened confirmations and labels, omitted empty department rows, and moved released allocations and amendment records into Contract history. The Call composer appears after choosing a target. Science shows the equipment benefit in the odds estimate and a short bonus hint when no unit is selected. Planner incompatibility feedback is shorter.

Observed in the isolated review save at `127.0.0.1:5178`, with the calendar paused. Inspected Contracts, opened Contract history and an amendment confirmation, entered a Resource Call through the catalogue, and inspected Science's running equipment selector and project draft. Arrival dates, supplier estimates, amendment fees, remaining funds, affected use, conditional odds and compatibility blockers remained visible in those flows. Department cancellation destinations now display their department name.

TypeScript and the production build passed. The build retained its bundle-size warning. This was a single-operator UI inspection. Multiplayer readability and enjoyment were not observed.
