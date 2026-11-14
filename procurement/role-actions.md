# Role actions affecting procurement

Assistant proposal, November 14, 2026. The scope requested by the user is procurement actions and actions from other roles that affect the systems procurement interacts with. Procurement terminology is selected in D-006. The action set and detailed effects remain under discussion.

Players coordinate by talking directly. System messages below describe state integration. The proposed [Task and conversation boundary](tasks-and-conversation.md) governs when a persistent shared goal is recorded.

Procurement consumes shared Tasks. It publishes Contracts, Allocations, Budget changes, and assessments. Task creation and replacement Task identity are handled by the planner/shared Task design under D-008.

## Procurement

| Player action | State or evidence affected | Published output |
| --- | --- | --- |
| Inspect and compare options | Evaluate Offers against a Task's current criteria, deadline and available Budget. | Task assessment containing options, cost, timing and gaps, through `TaskAssessmentChanged`. |
| Open or withdraw a Call | Create or withdraw a Call linked to a Task revision. Authored responses can supply Offers. | Call state is visible in procurement. Relevant options appear in Task assessments. A dedicated Call message is still unspecified. |
| Accept an Offer | Create a Contract with accepted terms. Account for its financial obligations in Budget. | `ContractChanged`, `BudgetChanged`. Payment timing remains open. |
| Allocate, reallocate or release quantity | Create or change an Allocation linking a Contract quantity to a Task criterion. | `AllocationChanged`, affected `TaskAssessmentChanged` outputs. |
| Cancel a Contract | Update Contract, settle its terms, and update affected Allocations and Budget. | `ContractChanged`, `AllocationChanged`, `BudgetChanged`, affected Task assessments. Settlement rules remain open. |
| Discuss a blocker or propose a compromise | Tell teammates about cost, delivery, risk or access problems. They choose how to respond through their systems. | Conversation. Agreed changes later produce the relevant state updates. |

Selecting a replacement can combine accepting a new Offer, changing Allocations, and cancelling the old Contract. The player needs to see the combined financial and timing consequences. Whether replacement becomes one interface action remains open.

## Mission planning

| Player action | Procurement-facing consequence | Existing proposed input |
| --- | --- | --- |
| Configure or revise mission, payload or objectives | Can create, change or withdraw Tasks for required parts, people and services. The planner publishes the resulting needs. | `TaskChanged`. |
| Set or revise preparation schedule | Can change when resources are needed, including assembly and test deadlines. | `TaskChanged` with revised `neededAt`. |
| Accept a proposed capability compromise | Revises the relevant Task criteria, quantity, deadline or priority. Procurement reassesses its existing commitments. | `TaskChanged`. |

## Science

| Player action | Procurement-facing consequence | Existing proposed input |
| --- | --- | --- |
| Choose or revise scientific goals | Changes instrument and service needs. A persistent shared need may become a Task. Science discusses its implications with planning and procurement. | `TaskChanged`. |
| Start, staff or change a research project | Changes actual project needs for people, equipment, services or funding. Discuss shortages. Record persistent shared goals where they need completion tracking. Personnel assignment can also affect availability, depending on the selected staffing model. | `TaskChanged`. Personnel state updates require further definition. |
| Choose research targeting a procurement blocker | A later project result may unlock authored Resources or Offers or create new needs. | `OfferChanged` for changed purchase terms, potentially `TaskChanged` for new shared goals. |

Research completion, failure and unlocks are outcomes produced by the research rules. Their timing and rewards remain uncertain in the brainstorm.

## Communications

| Player action | Possible procurement-facing outcomes | Existing proposed input |
| --- | --- | --- |
| Choose a dialogue response or accept an agreement | Funding changes, supplier access or restrictions, altered Contract conditions, or new obligations. | `FundingChanged`, `AvailabilityChanged`, `ContractAffected`, `OfferChanged`, and/or `TaskChanged` as applicable. |
| Start, staff or change a relationship project or gala | Can create needs for personnel, services or funding. Discuss those needs. Later results can create opportunities, access changes, or funding changes. | Relevant project state and outcome messages. `TaskChanged` applies when a persistent shared goal is recorded. |
| Act on a problem discussed with teammates | Choose a dialogue or relationship action after discussing a funding or supplier problem. | Actual outcomes use the same state messages. |

The player chooses an action. The communications rules and authored content determine its effects. A request for funding can fail or come with new obligations.

## Boundary details still open

- Project Budget authorization and payment. Spending authority and transfer records have not been defined. Players can discuss funding needs while the game tracks actual financial changes.
- Personnel assignments, qualification and availability. These may affect procurement assessments, but a consistent personnel model and corresponding message remain open.
- Improved delivery, changed reliability or other altered Contract conditions need effect types beyond the current `delay` and `terminate` proposals. Earlier `ContractAffected` examples cover a limited set.
- Assembly or qualification evidence and actual use of delivered resources need their eventual shared rules. Allocations currently represent reservations and availability.

See the [interface draft](interfaces.md), [roles](../docs/design/roles.md), and [personnel alternatives](../docs/design/personnel.md).
