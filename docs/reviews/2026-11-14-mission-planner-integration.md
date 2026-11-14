# Mission planner integration review — November 14, 2026

Reviewed incoming commits `638ca47`, `345a1b0`, and `7d12226` against local procurement commit `d7d7fbc`. These are documentation and concept findings. No implementation or playtest was reviewed.

The incoming module's README records acceptance of its proposals as the baseline. Its source notes record user selections. Several detailed documents still label the same material as proposals. This review uses the module README and source notes when identifying its current baseline.

## Git integration

The pull encountered one textual conflict in `docs/README.md`. Both sides added links to their respective module. The resolution retains the procurement entries and the mission-planner entry. Incoming module content and local concept records are preserved.

## Resolution after user review

The user responded to the six findings. [D-008](../decisions.md#d-008--procurement-alignment-after-incoming-mission-planner-work) records the resulting direction. The original findings below remain as review history.

| Finding | Disposition |
| --- | --- |
| 1. Task routing | Shared role-neutral Tasks win. Corrected the incoming publication wording. |
| 2. Inventory | Contract-only inventory wins. Delivered Contracts represent available resources. |
| 3. Replacement identity | Outside procurement's responsibility. Procurement consumes Tasks and tracks Contracts and Allocations. |
| 4. Research access | Retain alternative purchase and diplomacy routes. Domestic research limits do not globally block acquisition. |
| 5. Physical feasibility | Outside procurement's scope. Procurement checks the supplied criteria. Planner owns detailed mission feasibility. |
| 6. Visibility | Closed as a concept conflict. Accepted planner displays require normal state integration and coexist with spoken coordination. |

See the [verbatim user response](../notes/2026-11-14-procurement-alignment.md).

## Findings at time of pull

### 1. Task routing and responsibility

Our current model uses shared Tasks with no assigned solving role, and players discuss solutions directly. The planner UI has a “Send to procurement” action and “the planner's procurement tasks.” Its beyond-research section also explicitly supports one Task with procurement, research, and diplomacy routes.

This is a wording and workflow tension. Sending could mean publishing a shared need while procurement sees a relevant view, or it could mean creating an assigned procurement job. The latter conflicts with the shared-problem concept.

The integration decision is what the button does and how the planner's Task view relates to the global list. A filtered view and lifecycle feedback can coexist with spoken coordination.

Sources include [our Task boundary](../../procurement/tasks-and-conversation.md#task-boundary-to-explore), [planner sending tasks](../../mission-planner/ui.md#publishing-tasks), and [beyond-research parts](../../mission-planner/rocket-configurator.md#beyond-research-parts).

### 2. Delivered parts and inventory

The original contract-only inventory is brainstorming. Incoming user direction says a completed contract leaves the agency with a usable part, and the accepted lifecycle keeps a delivered unused part in inventory until launch.

Our Contract and Allocation records might represent that continued entitlement, or integration might introduce a separate physical-part record. The question is whether a Contract represents only procurement history or also the enduring thing available for use. This affects reassignment, surplus, returns, and resource identity. The original idea should be reconciled with the incoming direction rather than treated as an accepted prohibition on ownership.

Sources include [contract-only brainstorm](../design/roles.md#resource-management-and-procurement--i-001), [our records](../../procurement/interfaces.md#entities), [planner lifecycle](../../mission-planner/rocket-configurator.md#part-lifecycle), and the [user lifecycle notes](../../mission-planner/notes/2026-11-14-ui-and-testing.md#changing-contracted-parts).

### 3. Task identity when replacing a part

Our procurement model supports revising a shared Task, retaining an old Contract, and reassessing whether its Allocation still fits. The incoming planner freezes a contracted part's stats, then creates a new replacement draft that follows the Task-and-Contract flow while the old entry remains.

Immutable accepted terms align across the documents. The unresolved point is whether the shared goal retains its Task ID while a design-slot revision and new Contract replace the old solution, or whether replacement creates a new Task. Without an explicit relationship, old and new needs may be counted twice, or the old Task may look like an outstanding obligation after replacement.

Sources include [our reassessment rules](../../procurement/interfaces.md#outputs-from-procurement), [redesign scenario](../../procurement/scenarios.md#3-the-mission-changes-after-signing), and [replacement lifecycle](../../mission-planner/rocket-configurator.md#part-lifecycle).

### 4. Research limits versus access to procurement

The incoming design permits a part beyond domestic research to be acquired expensively or through diplomacy. Our `AvailabilityChanged` draft expresses availability as a boolean on a Resource or Offer.

A research lock cannot automatically make every acquisition route unavailable. Integration needs to represent domestic research limits separately from supplier access, terms, and diplomatic acquisition. The exact representation is open. An Offer-based solution may be sufficient, but a Resource-wide availability change could block valid paths.

Sources include [availability input](../../procurement/interfaces.md#inputs-to-procurement), [research limits](../../mission-planner/rocket-configurator.md#research-limits), and [alternative acquisition routes](../../mission-planner/rocket-configurator.md#beyond-research-parts).

### 5. Task fit versus mission feasibility

The planner publishes slider minimums. Accepted parts can satisfy those minimums and still make the mission fail because actual mass is higher. Our assessment can report that a Task's capability, quantity, and deadline match without proving the assembled mission is feasible.

The integration needs a clear meaning of Task completion and actual-part selection. Determine whether upper bounds or compatibility constraints are included in a Task, or whether the planner's live test remains responsible for checking their consequences after a candidate or Contract is selected. Selection, delivery, and mission validation are distinct states requiring consistent feedback.

Sources include [planner minimums and mass](../../mission-planner/rocket-configurator.md#link-to-procurement) and [our Task assessments](../../procurement/interfaces.md#outputs-from-procurement).

### 6. Information visibility and conversation

We left visibility open to protect meaningful communication. The incoming accepted UI shows Budget, expected delivery, procurement status, and per-goal reliability estimates to planning.

Those displays can support direct conversation, but they settle some visibility choices that our current documents still describe as open. Integration should specify which facts are shared and which comparisons, options, and uncertainties each role discovers and explains. The reliability estimate also requires the actual part's reliability to be accessible to the planning simulation.

Sources include [our visibility question](../questions.md#q-031--tasks-conversation-and-information-visibility), [planner UI](../../mission-planner/ui.md#layout), and [goal risk estimates](../../mission-planner/solar-system-and-maneuvers.md#final-playthrough-outcome).

## Incoming direction that resolves earlier open questions

The planner notes record these selections. They are new context for our docs, rather than choices to ask the user to make again.

- All preparation runs in real time on an agency calendar at one real minute per calendar month.
- Flight happens once at the end in fast-forward. Planning previews are immediate. Goal outcomes are partial and reliability can cause failures.
- Launch time ends preparation. Every part must be delivered before launch. The exact treatment of assembly deadlines still needs integration.
- Parts and Contracts remain within one mission level. This can coexist with overarching progress in other things, whose carryover remains open.
- The planner owns payload design. Science contributes goals and research. Its requests must be reconciled with the planner's design authority.
- The mission-planner module uses TypeScript and canvas. Its first authored mission is a Mars orbiter and lander. Its current standalone integration uses development controls.

Our root mission-flow, concept, questions, and taxonomy documents still describe several of these as open brainstorming. They need a follow-up synchronization using these sources. This review preserves the differing records for the user's review.

Sources include the [module baseline](../../mission-planner/README.md), [time and outcome selections](../../mission-planner/notes/2026-11-14-solar-system-and-maneuvers.md), [payload ownership](../../mission-planner/notes/2026-11-14-maneuvers-and-configurator.md#follow-up-answers), and [build decisions](../../mission-planner/notes/2026-11-14-build-decisions.md).

## Areas that already align

- Parts are requested individually while planning continues.
- Procurement chooses Offers and cancels Contracts. Planner cancellation is discussed verbally.
- Accepted terms and actual contracted stats remain recorded when the mission design changes.
- One difficult Task may have several routes involving procurement, research and diplomacy.
- Each module can prototype independently before shared interfaces are implemented.
