# Playtest — 2026-11-15 — Task coordination merge walkthrough

- Status: completed implementation walkthrough
- Facilitator: Codex browser automation
- Participants / roles: one automated operator, separate host and Science peer browsers
- Prototype version or files: working-tree integration onto `fc4b015`, save format 6
- Scenario and rules: Weather satellite, existing legacy review save, paused calendar
- Related ideas and questions: I-087, I-088, D-020, D-021, D-022, Q-031
- Question this experiment investigates: does the restored coordination work with the current Science tech tree and shared state?

## Hypothesis

The integration should preserve procurement and player requests across migration, replicate task handoffs, derive research needs from the live design and route players to station work.

## Setup

Vite served `http://127.0.0.1:5191/`. A host resumed an existing legacy graph-based save. A second browser joined through the normal WebRTC invite/reply flow and claimed Science. The host used Procurement and later Mission Planner. The calendar stayed paused on 11 January 2030; launch remained 30 June 2030. Initial available funding was $312M with $38.2M committed, one active Booster engine contract and nine procurement needs.

## Actual sequence

1. Resumed the migrated save. The active Taiga KL-2000 contract, expected 13 May, budget and procurement needs remained visible. Science showed the current tech tree and arriving engine under Part tests.
2. Procurement created “Plan booster part test”, assigned to Science, describing the engine, delivery, launch date and cost/team/timing review. The request survived a hot reload and resume during integration.
3. Joined a separate Science browser through invite/reply codes. The request appeared in its actionable list. Science edited the description and reassigned it to Procurement. The exact revision appeared on the host and its actionable count increased.
4. Procurement marked the request complete. It left the actionable view. Science saw Completed under All tasks with Include history.
5. Procurement opened a Booster tank supply task and reached its exact need inspector. Science opened the arriving Booster engine test entry from All tasks and reached its part-test anchor.
6. The host switched to Planner and changed camera performance from 4.5 to 8, above researched limit 6. The Science peer immediately displayed the camera need and actionable research task, with alternative routes, costs, odds and research-by date.
7. Open work reached Science mission needs. Science selected Larger sensor arrays and started research. Team usage rose to 1/3 and available funding fell to $303M on both browsers. The task showed the running prerequisite, expected 13 March completion and 90% base success. An alternative route remained available.
8. Opened Planner launch controls and chose Launch now. An in-app confirmation warned about nine undelivered parts and planning ending. Cancel held initial focus. Escape closed it and returned to planning with the original launch date.
9. Captured the integrated Planner task view. Both browsers' warning/error logs were empty at this point.

## Committed plan and single resolution

The agency remained in planning. No launch or mission simulation ran. The walkthrough changed the local review game's requests, camera design and running research project.

## Observations

Both stations saw the same task revisions, completion, design requirement, project progress and shared budget. The default filter exposed Science work when a relevant research step could start. The arriving optional test was visible in All tasks with delivery, cost, reliability improvement and timing information.

## Interpretation

These observations establish the exercised migration and coordination flows. One operator used both browsers, so they provide no evidence about four-player enjoyment, communication quality or waiting. Rare funding/approval branches and late-test launch links were inspected in source but were not exercised end to end. Legacy graph projects are retired by the upstream tech-tree migration. Every migration variant was not exercised.

## Follow-up

- Ideas to add or revise: none introduced by this integration.
- Questions still open: multiplayer play quality, post-launch board reconciliation and simulation effects for `launchSlot` and `testFacility`.
- Proposed changes: none beyond the requested integration.
- Decisions accepted: D-020 Science direction, D-021 coordination and D-022 confirmations, from the linked user notes.

## Implementation checks

TypeScript checking and the Vite production build passed. Git conflict-index and whitespace checks passed. No test suite was added or run for this integration. Source review covered role routing, budget blockers, optional test timing, prerequisites and migration compatibility.

## Publishing integration

Before publishing, remote main advanced to `255f7c6` with attempt history and restart support. Save format was advanced to 7 to combine shared requests with upstream version-6 attempt metadata. TypeScript and production build checks were repeated after resolving the persistence conflict. The browser walkthrough above preceded this rebase.
