# Implementation walkthrough — 2026-11-15 — Contract need context

- Status: completed limited browser check.
- Facilitator and participant: assistant operating Procurement alone.
- Prototype files: ContractTimeline, ContractsView, Needs, timing helper and procurement.css.
- Scenario: isolated Weather satellite game at localhost:5191, paused January 11, day 10. Nine planner needs created using the existing development action.
- Related: I-082, D-019 and the Contract view analysis.
- Question: can procurement identify the use behind a delivery and reach uncovered needs from Contracts?

## Hypothesis

Showing the related Task/criterion or research-project name on each row should make delivery purpose available without opening details. An expandable Mission needs panel should preserve access to uncovered needs while retaining a wide chart by default.

## Setup

Started a separate game origin to avoid a review save being used by concurrent work. Initial funding was 350 M. The calendar was paused before purchasing. No automated tests were added or run.

## Actual sequence

- Opened Contracts with no contracts. The Mission needs control showed nine uncovered needs.
- Expanded the existing needs list. It contained coverage, requirements and deadlines. Escape closed it and retained focus on the disclosure. Enter reopened it.
- Selected T-01, Booster · Kerosene / oxygen engine. This opened its purchasing context in Catalogue.
- Used the existing suggestion and order confirmation flow to acquire one Taiga KL-2000 from Swiftworks Orbital for 38.2 M, arriving May 13. It was allocated to T-01, needed June 30.
- Returned to Contracts. The timeline showed the full related need name, Contract 10, T-01, the June 30 need date and 48 days early. Removed a repeated criterion suffix from the derived label.
- Mission needs showed eight uncovered needs. T-01 was marked contracted with the same May 13 arrival and June 30 deadline.
- Switched between Incoming timeline and All contracts with the needs panel open. Closed it using Close and confirmed focus returned to the disclosure.
- Inspected at 1280×720 and 1920×1080, then reset the viewport override. Saved `/tmp/nasa-timeline-mission-needs.jpg` and `/tmp/nasa-timeline-related-need.jpg`.

## Committed plan and single resolution

One simulated order was confirmed in the isolated review game. No launch or mission resolution ran. The game remains paused on January 11 with one active allocated contract and eight uncovered criteria.

## Observations

The row and Mission needs list agreed on the Task, arrival and deadline. The uncovered counter changed after allocation. The expandable panel uses the existing list and its coverage logic. It overlays part of the chart while open, and Close restores the unobstructed overview.

## Interpretation

This establishes the exercised Task linkage and navigation behavior. Research-project naming follows the existing timing helper but was not exercised with a running research allocation in this new game. Revised requirements and partial quantities remain source-reviewed through the reused Needs component. Player comprehension, multiplayer usefulness and large-list behavior were not established.

## Follow-up

- Implemented as a response to the user's question about missing needs context. The expandable presentation is an assistant implementation choice.
- Typecheck, production build and whitespace checks passed. The existing bundle-size warning remains.
