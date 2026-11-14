# Procurement terminology and interfaces

Draft proposal, November 14, 2026. The user requested consistent terminology and specific abstract inputs and outputs. The terms Task, Resource, Call, Offer, Contract, Allocation, and Budget are selected in [D-006](../docs/decisions.md#d-006--procurement-terminology). The record shapes, ownership, and update rules below are assistant proposals for review.

Players coordinate through direct conversation. The messages here are proposed system integration. Information visibility and the [Task boundary](tasks-and-conversation.md) remain under review.

## Shared conventions

Every record has a stable `id` and increasing `revision`. Every message carries `messageId`, `source`, `effectiveAt`, and its payload. References use IDs. Updates name the expected previous revision so outdated changes can be detected. Repeated delivery of the same message has one effect.

Proposed prototype units are integer credits for money and integer simulation ticks for time. Durations and absolute times have distinct fields. Property definitions specify their unit and value type in the authored content.

## Entities

| Term | Meaning and fields | Owner |
| --- | --- | --- |
| `Task` | A shared goal with `id`, `revision`, `authorRole`, `title`, `criteria`, `neededAt`, `priority`, `status`. Status is `open`, `completed`, or `withdrawn`. | Shared goal. `authorRole` records provenance. Editing authority and completion evaluation remain open. |
| `Resource` | An authored part, person, or service definition with `id`, `revision`, `kind`, `name`, `properties`. | Authored content. Science can change which definitions are accessible. |
| `Offer` | Supplier terms with `id`, `revision`, `supplierId`, `resourceId`, `quantity`, `price`, `leadTime`, `riskProfileId`, `cancellationTermsId`, `expiresAt`, optional `callId`. Price is the total for the stated quantity. | Procurement content and supplier events. |
| `Call` | An invitation to address a task, with `id`, `revision`, `taskId`, `taskRevision`, `closesAt`, `status`, `offerIds`. Status is `open`, `closed`, or `withdrawn`. | Procurement. Offers reference authored content. |
| `Contract` | Accepted terms with `id`, `revision`, `offerSnapshot`, `signedAt`, `expectedAt`, `deliveredAt`, `status`. Status is `active`, `delivered`, `cancelled`, or `failed`. | Procurement, with changes caused by supplier or external events. |
| `Allocation` | A reservation linking a contract quantity to a task with `id`, `revision`, `contractId`, `taskId`, `criterionId`, `quantity`, `status`. Status is `reserved`, `available`, or `released`. | Procurement. |
| `Budget` | `fundingTotal`, `spent`, `committed`, with `available = fundingTotal - spent - committed`. | Procurement accounts for spending and commitments. External outcomes change funding. |

`criteria` is an AND/OR tree whose nodes have stable IDs. A procurement leaf specifies `kind`, `quantity`, and property comparisons such as `thrust >= 12 kN`. A task can contain other kinds of criteria evaluated by other systems. The Task records shared intent. Procurement reports evidence for the leaves it can address. Players discuss solutions across roles.

`Allocation` supports several contracts serving one task and a multi-unit contract serving several tasks. The sum of reserved and available allocation quantities cannot exceed the contract quantity. Released allocations and historical contracts remain visible. A resource definition identifies what a supplier provides. Contracts and allocations track what the team can use and where it is reserved.

`spent` is money already paid and `committed` is unpaid contractual obligations. Moving a payment from committed to spent preserves available funds. Settlement rules determine their changes when cancelling.

An offer snapshot retains the accepted terms when catalogue terms change. `expectedAt` initially equals `signedAt + leadTime`. Contract changes record their cause and previous values. Risk profiles and cancellation terms are authored records whose resolution and payment schedules remain open under Q-005 and Q-023.

## Inputs to procurement

| Message | Producer | Required payload and effect |
| --- | --- | --- |
| `TaskChanged` | Planning, science, comms, or another task author through the shared task list | Full current `Task`. Reassess linked offers, contracts and allocations against its revision. Withdrawal releases reservations through an explicit procurement action. |
| `FundingChanged` | Scenario or communications outcome | Signed `amountDelta`, `causeId`. Changes `fundingTotal` once. |
| `AvailabilityChanged` | Science unlock or communications outcome | `targetType` (`resource` or `offer`), `targetId`, `available`, `causeId`. Changes future procurement options. |
| `ContractAffected` | Authored supplier event or communications outcome | `contractId`, `expectedRevision`, `causeId`, typed effect. Initial effects are `delay(newExpectedAt)` or `terminate(reason)`. |
| `OfferChanged` | Authored supplier event | Full current `Offer` or its withdrawal. Existing contracts retain their accepted terms. |
| `TimeAdvanced` | Scenario clock | Absolute `now`. Drives Call deadlines, offer expiry, and due actions according to authored scenario rules. |

The scenario supplies initial tasks, definitions, offers, funding and time. Persistent shared needs for parts, people or services may be recorded as Tasks. Players discuss options and ask one another for help directly. The procurement prototype can inject these same inputs locally.

## Outputs from procurement

| Message | Recipient | Required payload and meaning |
| --- | --- | --- |
| `TaskAssessmentChanged` | Procurement assessment view and shared completion evaluation. Other-role visibility remains open. | `taskId`, `taskRevision`, and a result per `criterionId`. Each result contains candidate options (`offerIds`, total price, earliest availability), `allocationIds`, unmet comparisons, and `onTime` (`yes`, `no`, or `unknown`). Each criterion reports `uncovered`, `reserved`, or `available`. Reserved means an active contract covers the required capability and quantity. Available requires delivery and matching capability and quantity. `onTime` separately reports whether availability meets `neededAt`. |
| `ContractChanged` | Shared mission state. Player-facing visibility remains open. | Full current `Contract`, `causeId`, affected `allocationIds`. Reports signing, delay, delivery, cancellation or failure. |
| `AllocationChanged` | Shared mission state and systems evaluating Task evidence. | Full current `Allocation`. Planning and research can identify which contracted capacity is reserved and delivered for their task. |
| `BudgetChanged` | Shared mission state. Player-facing visibility remains open. | Full current `Budget` and `causeId`. |
| `TaskChanged` | Shared Task list | An explicitly created or revised persistent shared goal. Help requests and negotiations take place through conversation. |

Procurement publishes assessments for the current task revision. A changed task triggers reassessment while signed terms remain recorded. A delivered contract whose resource fails revised criteria leaves those criteria uncovered. The shared task evaluator combines procurement evidence with evidence from other systems to determine completion.

## Example exchange

1. Planning publishes task `T1`, revision 1, requiring one engine with `thrust >= 12 kN` by tick 80.
2. Procurement finds offer `O1` for one matching engine, price 30 credits and lead time 20 ticks.
3. Procurement signs at tick 10. Contract `C1` is expected at tick 30. Allocation `A1` reserves its engine for `T1`. The assessment reports `reserved`.
4. A supplier event delays `C1` to tick 90. Procurement publishes the changed contract and an assessment showing the deadline gap. The game records the affected Task. Procurement tells planning about the delay and discusses responses.
5. Procurement can seek a replacement, or planning can revise `T1` to a later deadline. Each subsequent assessment names the task revision it evaluates.

## Choices still requiring agreement

- The detailed responsibilities and behavior of each entity, including allocation rules.
- Who may revise or complete shared tasks and how changes are authorized.
- Payment schedules, cancellation settlements, and recovery when funding falls below commitments.
- Delivery versus assembly or qualification readiness. `delivered` currently means arrival. Assembly and training need separate task evidence once their rules exist.
- The exact authored reliability model and conditions that trigger delivery, delay, or failure.
