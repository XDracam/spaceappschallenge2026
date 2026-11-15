# Cross-role task coordination audit

**Date:** 2026-11-15  
**Status:** source review of the current integrated implementation, alongside the observed two-browser walkthrough linked below. No test suite was run for this audit.  
**Purpose:** document which shared state is surfaced to the four stations, how actionable entries route to work, and which simulation behaviors remain unmodeled. This is implementation evidence, not a new game rule.

## Board coverage

`game/src/core/coordination.ts` combines projections of live game state with persisted player/effect requests. The default view shows open entries with an action for the current station. “All tasks” shows open entries; an additional control includes completed, withdrawn, failed, and expired history. Manual requests have a title, details, author, one assigned station and editable status. Their completion is a player acknowledgement, not a simulation check.

| State | Board entry and action route | Remaining limit |
| --- | --- | --- |
| Planner design and Procurement Tasks | Draft parts prompt Planner to order. Each Task criterion shows quantity, minimums, allocated/delivered supply, Contract timing, mismatch, late supply and open Call. Procurement can open the need; Planner can open the related part. | Supply is considered complete from delivery/fit and Task status; this does not prove the mission goal is achieved. |
| Calls, Offers and Contracts | Outdated Calls link to Procurement Calls. Partner Offers link to Procurement. Contract entries report delivery, needs, lateness and orphaned allocations; Procurement can open the Contract. Late delivered-part tests route Planner to launch timing and Procurement to delivery timing. | Partner Offers have no typed link to their originating Comms event/project. Optional tests need contracted hardware; uncontracted tests are omitted from the board. |
| Research and Science projects | Research entries derive unmet capabilities from the current design, including drafts. They show routes, costs, odds, prerequisites, running route projects and approval blockers. Science can open the relevant technology or mission needs. Part-test entries show reliability improvement, cost, delivery and whether completion fits before launch. | A running prerequisite does not itself satisfy the final capability. Research can fail. Failed and cancelled part tests share a stored outcome and are described as “Failed or cancelled.” |
| Communications events and projects | Inbox entries show message, deadline, choices/effects/costs and ignored outcome; Comms can open the event. Active Comms projects show their expected date and effects. | Budget-blocked offers, available research steps, approvals, tests and event responses expose relevant funding or cancellation actions. Funding availability does not guarantee a suitable Communications opportunity. |
| Effects, funding and requests | Active modifiers and internal news remain visible as reference/history. A negative available balance creates a funding shortfall for Comms, Procurement and Science. Player-created requests are replicated and editable by their author or assignee; Comms mission constraints create a Planner review request. The request retains its original constraint text when edited, so the duplicate notice remains suppressed. | Completing a request does not check or change its underlying game state. Effect requests have no typed event/project link. |
| Planner issues and goals | Non-informational plan issues and goal feasibility entries link to Mission Planning. Unordered parts link to their Planner part. | After planning closes, open entries are read-only and labeled “Planning closed”; feasibility remains an estimate and is not reconciled to the actual mission result. |

## Simulation coverage and limits

| Effect or result | Implemented behavior represented by the board | Remaining simulation limit |
| --- | --- | --- |
| `groundStation` service | The Planner evaluator halves the modeled instrument data-rate requirement; the flag participates in the evaluation cache key. | This is a specific authored modifier, not a general simulation of communications services. |
| `launchSlot`, `testFacility` services | Their flags appear as available-service notices. | They have no effect on planning physics or mission outcomes. |
| `missionConstraint` | Applies a text-derived flag and creates an editable Planner request; the original constraint text is retained across edits, and duplicate flag notices are suppressed, including when a matching request is reconstructed from an older save. | Arbitrary authored text is not checked by the simulation; a player must acknowledge the request. |
| Budget, delivery, price, research, offer, trust and event effects | Derived entries recalculate from shared funding, market, research and event state; event expiry and research failure retain distinct statuses. | A projection reports the modeled state, not whether the resulting task or mission is fully solvable. |
| Launch and result | The Planner has an aggregate issue summary and per-goal feasibility estimate while planning. | Post-launch board status is not yet reconciled with `planner/result.ts`. |

## Review limits

- Source inspection confirms records, projections, filters and direct action routes in code. The [two-browser walkthrough](../playtests/2026-11-15-task-coordination-walkthrough.md) records observed task handoff, procurement, contextual Science requests, Communications effects, and save/resume. It does not establish that four players can coordinate enjoyably or without waiting.
- Shared confirmation requests render in the in-app `ConfirmationPanel`; a source search found no native `alert`, `confirm` or `prompt` calls in `game/`. The walkthrough records the observed launch confirmation and cancellation.
- `GameState.coordination` stores player/effect requests; procurement, research, events, projects, contracts, modifiers and planning items are derived from their source state. This avoids a second mutable status for those projections.
- Market Task criteria remain the procurement source of truth. A withdrawn Task does not erase its Calls, Offers, Contracts or Allocations; the board retains their consequences.
- Station roles identify authors and assignees, not individual peer identities.
- Terra's constructed-state/reducer checks, documented in the walkthrough, are separate from both source review and the two-browser observations; they do not establish full gameplay flows.

## Inspected paths

`game/src/core/coordination.ts`; `game/src/core/{model,state,persist,registerStations}.ts`; `game/src/shell/TaskBoard.tsx`; `game/src/stations/comms/{state/world.ts,data/}`; `game/src/stations/planner/{logic.ts,derive.ts,physics/evaluate.ts,result.ts}`; `game/src/stations/procurement/{logic.ts,rules.ts,timing.ts}`; `game/src/stations/science/{logic.ts,model/research.ts,model/tree.ts,model/tests.ts,ui/App.tsx}`; `game/src/shared/events/{types.ts,engine.ts}`.

## Integration onto the Science tech-tree branch, 2026-11-15

The saved coordination work was initially integrated onto `fc4b015`, then rebased onto `255f7c6` for publishing. D-020 remains the Science decision; coordination and confirmations now use D-021 and D-022. The current [merge walkthrough](../playtests/2026-11-15-task-coordination-merge-walkthrough.md) records observed behavior after this integration. The earlier walkthrough retains its historical Science observations.

Save version 7 initializes shared requests alongside upstream version-6 attempt history. Legacy graph-based version-3 saves are distinguished from tech-tree version-3 saves using the Science slice shape. The upstream migration retires graph projects and initializes the tech tree. Legacy test-equipment allocations are retained as Science department supply, obsolete equipment tasks are withdrawn, and project links are cleared. Existing coordination requests, procurement contracts and budget accounting are preserved. Older authored mission-constraint flags recover explicit Planner review requests where needed.

The merge was checked with TypeScript, a production build, source review and a two-browser walkthrough. No test suite was added or run for this integration. Rare funding/approval branches were reviewed in source rather than exercised end to end.
