# Remaining task unification review — 2026-11-15

Status: proposals from independent Terra and Luna source reviews, checked against the current code by the coordinating agent. The user requested consideration with subagents; no gameplay changes are selected by this review. No tests or browser session were run for this review.

Subsequent disposition: the user approved implementation in [the follow-up](../notes/2026-11-15-task-unification-approval.md). D-024 and the [walkthrough](../playtests/2026-11-15-task-unification-walkthrough.md) record the resulting direction and verification. The review below preserves its original proposal status.

## Recommended order

1. Preserve role actions when attaching related records. Running paused research projects carry a Communications action (`game/src/core/coordination.ts`, project derivation), but attachment under a need currently adds the project without merging its action. Attached projects are then excluded from the independent approval-task fallback. A route-level approval action can also be absent when its approval project already exists. Keep a per-role action visible on the parent, or retain an independent action-bearing entry. Matching partner Offers are similarly attached without merging actions: unmet supply often already supplies Procurement's action, but a completed parent must not hide a still-available Offer. These are source-level paths, not reproduced gameplay observations.
2. Add optional explicit association to player requests. A contextual shortcut can supply a stable need/part/technology reference; a generic form can let the player choose an existing need. Never infer attachment from wording. Preserve request ID, author, responsible role, revision, status and original context. Keep unlinked requests standalone; a withdrawn/missing parent must not make its open requests disappear or automatically complete them. Do not add arbitrary nested task trees.
3. Simplify the manual Purpose selector. Only Funding currently changes board grouping; Equipment and Timing have no equivalent board behavior. Remove those two manual choices unless a concrete selected behavior needs them. Retain compatibility with existing stored values and contextual request identities. Funding categorization still has a visible function.
4. Reconsider timing aggregation narrowly. Several requests against the same affected need can be attached there. Unrelated requests to delay or advance launch may conflict; a shared schedule view can compare them without creating one common completion state. Do not merge every timing request into a single automatically completed task.
5. Use one minimal representation for a role action and its destination. Current grouping and navigation inspect display strings for words such as funding, approval and cancellation terms. Small typed action metadata would let the board preserve actions consistently while copy changes independently. This is an internal simplification, not a new gameplay workflow or general task framework.

## Display refinements rather than fewer task concepts

- Waiting needs can be compacted in All tasks, with counts, expected dates and exceptions. Current-role filtering already omits tasks without a role action. Do not store another waiting lifecycle or call waiting complete.
- Show the current blocker, responsible roles and next useful actions before repeated specifications and Contract/research history. Keep full details expandable.
- Reuse the same entry presentation for top-level and related records where practical, including role actions. Currently RelatedWork shows description/navigation but does not render role actions.

## Keep distinct

- Underlying Calls, Offers, Contracts, research and tests have different consequences and lifecycles. Nesting their display does not remove those concepts.
- Keep explicit mission-constraint acknowledgement and obsolete-commitment reconciliation.
- Keep optional tests in Science and Mission overview after supply completion, as D-023 already specifies. Do not reopen completed delivery solely to advertise an optional test. Required timing intervention remains distinguishable from optional testing.
- Keep shared funding as a group with individually editable requests; it is not one fungible request with one manual completion control.

## Source anchors

- `game/src/core/coordination.ts`: request records/purposes; role-action derivation; `coordinationBoard`, `mergeActions`, related research/Offers/tests, independent approval fallback and overview filtering.
- `game/src/shell/TaskBoard.tsx`: actionable filtering, `workLink`, request controls, `RelatedWork`, `MissionOverview` and Purpose selector.
- `game/src/stations/science/ui/App.tsx`: keyed timing/funding shortcuts.
- D-020–D-023 and `docs/design/shared-tasks.md`: accepted boundaries.

Related proposal: I-090. No new decision is recorded; multiplayer usability remains unverified.
