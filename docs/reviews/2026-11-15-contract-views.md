# Contract view analysis — 2026-11-15

User feedback identifies a subtle Timeline/Table control, awkward pill styling, usage discrepancies and unclear “Fit dates” behavior. This review covers the integrated Procurement station. The user subsequently instructed “then build it”, selecting the layout recommendations below for implementation under D-019.

## Findings and proposed direction

1. The two small independent pill buttons look like secondary actions. Their selected state mainly changes text and border color. Use proper tabs attached to the content boundary, with a prominent selected underline, stronger text and keyboard tab navigation. Proposed labels are “Incoming timeline” and “All contracts” to expose their different coverage.
2. Changing views also changes the workspace. Timeline hides Needs and opens details only after selection. Table restores Needs and always opens details, falling back to the newest Contract. Use the wide Contracts workspace for both, with explicit selection and the same Close details action. Preserve active selections across views. Clear a historical selection when entering the incoming timeline.
3. Table supplies Contract IDs and suppliers, while timeline orders with the same resource and recipient can look identical. A compact Contract ID in each timeline row would make spoken references and cross-view matching easier. Avoid adding full supplier descriptions to every row.
4. “Fit dates” repeats the initial calculation because there are no pan or zoom controls. Subsequent changes can leave the range stale. Automatically fit current arrivals, known need dates and Today. While comparing amendments, expand only to reveal an offscreen proposal and retain that range across options. Clearing the preview restores the current delivery range. Retain padding and a minimum range. Launch remains a contextual reference when inside that range, following the existing behavior.

## Implemented refinement

Removed the manual “Fit dates” action. Outside amendment comparisons, the range is derived from current data. A comparison holds its initial range, expanding only when a valid proposal would be offscreen. The expanded range remains stable when choosing an earlier option, preserving other marker positions. Clearing the preview or selecting another Contract ends the comparison and restores the range for actual arrivals and needs. This refines the first automatic-fit implementation, which rescaled for every option.

Implemented Incoming timeline / All contracts as proper tabs with selected underlines and arrow/Home/End keyboard navigation. Both views use the same wide Contracts workspace. Details require an explicit selection and have the same Close details action. Active selection persists across tabs. Entering Incoming timeline clears historical selections. Direct links to historical Contracts open All contracts. Timeline rows include compact Contract IDs. Table cancellation actions moved to the shared details panel.

## Evidence and limits

- Inspected ContractsView, ContractTimeline, Station, uiState and procurement.css. Two independent agents reviewed design and source behavior. The static Impeccable detector returned no findings, despite the interaction problems identified here.
- Compared Timeline and Table in the existing isolated review save at localhost:5178. Table visibly restored Needs and opened Contract 18 details without explicit row selection.
- Selected Contract 18 and previewed Flexible delivery on November 4, beyond the original October 15 axis end. The axis automatically expanded through November 19 and displayed the proposal. Deselecting the proposal restored the October 15 end. Arrival, budget and game clock remained unchanged.
- Follow-up verification in a fresh review tab at 1280×720 checked Priority → Flexible → Priority → clear. The first Priority preview retained the October 15 end. Flexible expanded it to November 19. Returning to Priority retained the November 19 end and all three actual-arrival marker positions (7.61905%, 32.8571%, 74.7619%). Clearing restored the October 15 end and original marker positions. Screenshot `/tmp/nasa-timeline-stable-comparison.jpg` shows the earlier proposal using the retained expanded scale.
- Existing timeline walkthrough records the prior manual-fit behavior. This refinement supersedes that behavior without changing the historical observation.
- After layout implementation, verified keyboard ArrowRight and Home tab navigation, Enter selection in Table, retained active Contract 18 selection across tabs, equal selected workspace widths, and Close details restoring the full-width overview. All contracts no longer opens the newest Contract automatically or restores the Needs rail.
- Checked the layout at 1280×720 and 1920×1080, then reset the viewport override. Saved `/tmp/nasa-contract-tabs-timeline.jpg` and `/tmp/nasa-contract-tabs-table.jpg` at Full HD.
- The cancellation dialog opened from Contract 15 details. Automatic approval review rejected final confirmation of this simulated cancellation because it treated the fee as consequential. Kept the Contract. No cancellation was executed.
- Used normal calendar progression in the isolated review save to obtain history instead. Contract 2 delivered May 9. Selected its Delivered row in All contracts, then switched to Incoming timeline and observed selection/details clear. Left this review save paused on May 20, day 139. During calendar progression, an unanswered Communications event delayed Contract 15 to July 31. The original player save at port 5173 was not used.
- Selected Flexible in Table, switched to Incoming timeline and observed the preview remain selected with November 19 axis end. Switching to Priority retained that end and both actual-arrival positions. Clearing restored the October 15 end. Closed details afterward.
- TypeScript checking, production build and whitespace checks passed. The existing bundle-size warning remains. Reviewed changed UI against Web Design Guidelines, applying the desktop game context to navigation and state.
- This is a source review and single-operator browser check. Player comprehension and multiplayer usability have not been established. No automated tests were added or run.

Related to I-082 and D-019.

## Needs-context follow-up

The user questioned the missing Mission needs panel and whether related needs were properly displayed. Hiding the rail removed access to uncovered needs, and timeline rows only showed Task codes or department/research-bonus labels. The timing helper already supplied the actual Task/criterion and project names.

Timeline rows now show those names, with Contract ID, recipient/Task code and date provenance retained in compact metadata. Repeated criterion suffixes are omitted when already present in the Task title. Both Contract views offer an expandable Mission needs control with an uncovered/review count, reusing the existing coverage list. Close and Escape return focus to the control. Selecting a need opens its purchasing context. This is an assistant refinement responding to the missing-context concern, rather than a separately approved new gameplay rule.

See the [dated walkthrough](../playtests/2026-11-15-contract-needs-walkthrough.md) for actual Task linkage, counter and keyboard observations, the simulated order, and verification limits.
