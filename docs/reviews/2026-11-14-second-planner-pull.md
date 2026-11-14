# Second mission-planner pull review — November 14, 2026

Reviewed six incoming commits after `7d12226`, ending at `1051783`, against procurement commit `ea60f30`. The incoming work adds the planner application, a player-station decision, interface documentation and UI revisions. This review inspected source and design notes. Planner runtime, build and reported critic scores were not independently validated in this pass.

## What we can learn

### Keep each station focused

The user's incoming decision sets four people at separate stations and seats, with no sharing or switching during game time. Networking and hosting remain open. The planner's Procurement panel was removed after user feedback. Its part rows retain supply status, and development controls stand in for procurement.

This supports keeping our catalogue and spending decisions in procurement while exposing useful status to the other stations. It also makes simultaneous useful work more important. Station occupancy alone cannot establish that its player has something interesting to do.

Sources include the [verbatim station decision](../notes/2026-11-14-player-stations.md), [planner UX notes](../../mission-planner/notes/2026-11-14-ux-review.md), and [planner Rocket rows](../../mission-planner/app/src/ui/RocketTab.tsx).

### Deadline pressure has a mission consequence

The user chose a mission completion deadline. The authored Mars mission uses day 1277, July 1, 2033. Goals achieved after it do not count. The running agency calendar still triggers flight when it reaches the planned launch date.

For procurement, a late cheaper part can lead to a later launch or a more costly faster mission plan, while the completion deadline gives planning a reason to care. This is stronger context for talking about a delivery tradeoff. The procurement station should show the dates supplied by planning and let that player evaluate the flight consequences.

Sources include the [deadline feedback](../../mission-planner/notes/2026-11-14-ui-feedback.md#deadline), [authored mission](../../mission-planner/app/src/data/missions/marsOrbiterLander.ts), and [clock handling](../../mission-planner/app/src/state/store.ts).

### Explain consequences where decisions happen

Incoming revisions show order readiness on part rows, expose why a goal is blocked, replace specialist shorthand with plain labels, and confirm consequences before launching. The review notes describe critic-agent assessments, not human usability evidence.

For procurement, useful transfers are concise missing/late explanations and dates beside the affected Resource or Contract. Our existing promised/ready distinction, specific fit gaps and changed-confirmation review already exercise that direction. Avoid turning the planner's one-next-step hint into an automatic spending priority for procurement's several simultaneous needs.

Sources include [UX notes](../../mission-planner/notes/2026-11-14-ux-review.md), [part labels](../../mission-planner/app/src/ui/partInfo.tsx), [readiness display](../../mission-planner/app/src/ui/RocketTab.tsx), and [next-step logic](../../mission-planner/app/src/ui/NextStep.tsx).

### Remove equivalent choices

The user removed extra tanks because increasing tank capacity already supplied the same choice. A stage now has one tank in the current interaction.

For procurement, catalogue alternatives should differ in useful capability, price, qualification, timing or risk. More variants and controls do not themselves create more decisions. This is a design lesson to evaluate, rather than evidence that a specific catalogue is fun.

Source is the [extra-tank feedback](../../mission-planner/notes/2026-11-14-ux-review.md).

### Use the concrete planner data as an integration reference

The planner implements Preact panels and a canvas map. Its part-need record carries kind, variant, numeric minimums, research gaps, dates and a design-part reference. Contracts return actual stats, actual mass, supplier, dates and reliability.

These give us real planner-facing examples when a shared interface is designed. The planner's data shape remains scoped to its current part workflow. Our wider Resource catalogue, personnel, research requisites and split Allocations require a broader model or mapping.

Sources include the [interface document](../../mission-planner/procurement-interface.md), [runtime types](../../mission-planner/app/src/model/types.ts), [build choices](../../mission-planner/notes/2026-11-14-build-decisions.md), and [planner store](../../mission-planner/app/src/state/store.ts).

## Gaps to preserve for integration

1. **Task scope and cancellation.** The incoming runtime has one `ProcurementTask` per design part and a Contract directly tied to its Task and part IDs. Cancelling the Contract sets that Task to `cancelled`. Our shared goal may still need a solution, and a quantity Contract can serve several Tasks. D-008 remains authoritative. The planner record needs mapping or revision before becoming a shared schema.
2. **Accounting.** The planner's `budgetSpentM` counts signed Contract prices minus refunds. Our illustrative mockup separates spent from committed and pays on delivery. Both reduce available funds on signing, but their spending labels and cancellation timing differ. Shared accounting and settlement need one chosen model at integration. This pull does not select one silently.
3. **Units and lifecycle labels.** The planner uses agency days, millions, reliability 0..1 and `running` Contracts. Our mockup uses scenario months, arbitrary credits, displayed percentages and `Active`. These need explicit conversions and mappings. The actual type also includes `neededByDay`, absent from the incoming interface table. That documentation field was added during review.
4. **Changing deadlines.** The store updates `neededByDay` when launch changes only for open/changed part Tasks. Integration must keep current need-by information available for reviewing contracted supply too. This is a source finding. No runtime reproduction was attempted.
5. **Older wording.** The new interface still contains the old routed-task and delivered-part ownership wording. D-008 selects shared role-neutral Tasks and contract-only inventory. A cross-module note now points out that precedence; the imported runtime remains intact for review.

## Merge decisions and provenance

Five files had textual conflicts. Both modules and their source notes were preserved. The station decision arrived as D-006 and its idea as I-034. Those IDs already identify procurement terminology and the standalone procurement direction. The incoming station records are therefore retained as **D-012** and **I-056**, with corrected references and explicit provenance. Original quoted user wording is unchanged.

AGENTS.md now combines the selected module stack and the four-station decision, retaining open networking and license questions. The root README acknowledges the implemented planner and procurement interaction artifact. UI conflict resolution retains the newer Rocket/Versions station layout and the shared-Task semantics already selected in D-008.

The imported application was not restyled, integrated or behaviorally modified in this review. Useful lessons and integration gaps are recorded for the next design or implementation step.
