# Procurement orders and department supply

Approved prototype target · November 14, 2026 · I-080 · [D-018](../docs/decisions.md#d-018--procurement-order-and-department-supply-prototype)

[Visual walkthrough](concepts/orders.html) · [Accepted direction D-017](../docs/decisions.md#d-017--procurement-amendments-call-timing-and-direct-department-needs)

## Goal state

Procurement can turn a spoken need or a launch-part Task into one or more purchases, choose quantities and delivery terms, compare the effect of waiting for Offers, and adjust active deliveries when circumstances change. A receiving department can actually use delivered supply. The player can see the cost, arrival, remaining funds and affected use before every commitment.

This proposal covers items 1, 2, 4 and 5 from the [discussion](../docs/notes/2026-11-14-procurement-order-decisions.md). Item 6 works through ordinary repeated orders throughout. The detailed rules below were approved as a prototype target under D-018; implementation status and observations are tracked separately. D-017 records the preceding direction. Values in the visual walkthrough are illustrative balancing fixtures.

## Approved prototype choices

| Choice | Result |
| --- | --- |
| Order controls are quantity, delivery option and destination | Delivery options show an exact quoted date and total. Operational reliability is an Offer property. |
| Delivery options are supplier-authored Standard, Priority and Flexible schedules where supported | The dates and price differences vary by supplier. Required delivery dates guide comparison. |
| Amend an active Contract's delivery schedule | Procurement sees a fee, revised arrival and consequences before accepting. |
| Calls have 7, 14 or 30 agency-day response windows | Eligible responders and their estimated terms are visible before opening. |
| Destination is shared supply, a department, or a launch Task criterion | A purchase needs no Task. Department ownership and project use are separate records. |
| Science selects an available or incoming compatible test unit in its existing project screen | One unit supports one active research project at a time and becomes reusable when that project ends. |
| Repeated orders each have their own quantity, terms and destination | Different delivery batches require ordinary orders. Finite Offers track remaining quantity. |
| Split flight supply uses identical hardware, with quantity-weighted geometric mean reliability | Every supplying Contract contributes; splitting an unchanged purchase does not alter the result. This is a game approximation. |

Testing packages remain a later decision because the assurance control was questioned. Reservations remain optional and additional supplier-event content is deferred under D-017. Existing delay effects provide the first amendment scenario.

## The player's recurring activity

Understand a need through conversation or a launch Task → compare suppliers and delivery options → decide whether to buy or wait for a Call → commit and assign supply → review changes and amend or replace → the receiving player uses delivery.

Procurement can browse all supply, compare another purchase or manage another Contract while a Call or delivery is pending. Scenario design must provide competing meaningful needs. Available controls alone cannot establish that a player remains engaged.

## Configurable orders

The Resource inspector becomes an order composer. The player selects a supplier, quantity, destination and one of its available delivery options. A date entered as “Needed by” is a comparison target. It never promises that a supplier can meet that date.

Each supplier publishes authored offsets and prices for supported options. Standard is its baseline. Priority uses its earliest supported slot and a surcharge. Flexible uses a later slot and a discount when offered. Unsupported options explain their limit. Quantity is priced per unit initially, with stock or Offer limits applied. Prices are rounded once using the shared currency precision.

All options show arrival, total cost, difference from Standard and time before or after the need date. Operational reliability remains visible for flight hardware and does not improve just because the player chooses a later arrival. Supplier and Resource choices can still have different reliability. No new delivery-probability roll is introduced in this slice. Existing authored events can change expectations.

Example fixture at day 0, with $40 M available and one camera needed for Science by day 60

| Supplier | Priority | Standard | Flexible |
| --- | --- | --- | --- |
| Orbital Commons | day 45, $12 M | day 75, $9 M | day 105, $8 M |
| Swift | day 30, $15 M | day 50, $13 M | unavailable |
| Meridian | unavailable | day 65, $11 M | day 95, $9 M |

Comms access and modifiers feed these quotes through the existing shared state. A signed Contract snapshots the terms. Later relations changes affect new quotes, while explicit events can still affect active Contracts. The composer labels those effects separately. Partner Offers expose only the delivery options their authored agreement supports.

The primary action opens a compact confirmation containing Resource, quantity, destination, arrival, total commitment, funds remaining and any lateness. State changes while the confirmation is open require a refreshed quote and another deliberate confirmation.

## Amendments and replacement

Selecting an active Contract opens its current terms and “Change delivery”. Its delivery options are recomputed from the current day, completed work and any event delay. Authored rules specify the earliest achievable date, supported options and an amendment cutoff. The accepted Contract stores its original baseline and cutoff. Repeated amendments cannot restart production or restore an expired change window.

For this first slice, a supplier's change quote carries a nonnegative fee paid immediately. The original goods commitment stays booked. A later requested date can have a zero fee, while an earlier one can cost more. Initial Flexible discounts apply when first signing. Original cancellation terms and their time-progress baseline remain attached to the original goods commitment, with amendment fees retained as spent. Moving arrival later must not increase the cancellation refund or reset production progress. This avoids making money through repeated schedule changes.

The review presents current arrival → proposed arrival, fee, total lifetime cost, new available funds and every affected Task or department/project. Confirming updates the same Contract ID and revision, expected arrival and history atomically. Procurement's draft is local until acceptance.

Delivered, cancelled and failed Contracts have no delivery amendment. A cancelled Contract offers “Find replacement”, which opens a new order with its former Resource and destination as a draft. The new purchase gets its own ID and accounting. Selecting a replacement never silently cancels a still-active Contract. Existing cancellation confirmation shows the actual refund before the player proceeds.

Example fixture, separate from the initial shopping screen

- On day 20, an event moves a Science camera from day 45 to day 80. Science needs it by day 60.
- Procurement can accept day 80, pay $2 M to recover to day 55, or inspect another supplier.
- Choosing recovery changes a $12 M Contract's lifetime cost to $14 M. With $40 M funding and no other obligations, $12 M remains committed, $2 M is spent and $26 M is available.
- On delivery, the $12 M moves to spent. Science receives the unit. Its department need date determines the delay warning.

## Calls with visible consequences

A Call can start from a launch Task criterion or directly from a catalogue Resource. The latter lets procurement source a departmental purchase without inventing a Task. Its target stores a snapshot of requested capability, quantity, destination and need date. A live Task link remains available for comparison.

The player compares 7, 14 and 30 agency-day response windows. Each option previews the closing date, named eligible responders, estimated price ranges and earliest estimated arrivals if signed when the Call closes. It shows whether that would leave enough time for the selected use. Estimates are labeled as estimates. There is no automatic assertion that a longer Call is better.

Suppliers have authored minimum response times. All Offers arrive when the Call closes, using the current accessible suppliers and authored terms. Changes in access, research or market conditions update the preview with the cause. An affected open Call retains its requested capability snapshot. If planning changes its Task, the Call is marked “Requirement changed”; procurement can continue and compare the Offers against current requirements or withdraw and reopen.

Use deterministic authored terms for the same supplier, requirement and market conditions. Reopening a Call under unchanged conditions cannot reroll better terms. Opening a Call commits no purchase funds. Offers retain the existing 90-day validity period.

Calls may request any positive supported quantity, regardless of coverage elsewhere. The composer shows existing supply and warns about duplication. Each finite Offer tracks remaining quantity; accepting one unit from an Offer for three leaves two. An explicitly indivisible partner deal states “Whole Offer only” before signing.

## Departments and actual use

The destination picker has three groups

- Shared supply.
- Department, with Science initially having a concrete consumer and the other stations able to hold supply.
- Launch Task and criterion.

A department allocation is a reservation of Contract quantity. Contract records continue to be inventory. Shared supply is the remaining unreserved quantity. Procurement can move free quantities between destinations, including after delivery. An in-use unit must first be released by its consuming department. Existing Task coverage and departmental use draw on the same quantity total.

The smallest complete department flow uses the existing recipe test hardware. It covers every current recipe with a `testPart` requirement and the New measurements method. Camera, spectrometer and surface-lab units already exist in the flight catalogue. Their department destination determines use. A delivered research unit does not become a flight requirement or add spacecraft mass.

Science's project draft shows “Optional test unit”, the recipe's capability minimum and the required arrival date. Science communicates a shortage to procurement directly. Starting research creates a research project and its equipment requirement, with no procurement Task or automatic shopping request.

Science can select one matching unit already assigned to Science, including an incoming unit. A draft selection stays local; starting the project validates availability and reserves the unit atomically. The same small equipment control is available on a running project, so supply arriving later can be selected through an explicit assignment action. Lists show “Ready”, “Arrives day …”, “In use by …” or an explicit mismatch. Procurement sees department inventory and actual use when inspecting supply, while unfulfilled project wishes stay in Science's project UI.

Research rule selected for this prototype

- A project may run without a test unit, keeping its base odds.
- Select and receive a compatible unit before project resolution to gain the existing 10 percentage point bonus, capped at the current 97% final chance.
- The project holds that unit until completion or cancellation, then releases it for reuse. Test use is nondestructive in this initial slice.
- Show both base and equipped odds; future delivery shows a conditional benefit. Changing the project end date immediately updates the equipment timing warning.
- A cancelled or failed supply Contract releases the reservation and marks equipment missing. It leaves the research project running at base odds.

Science adds one resource selector and a small Supplies view alongside its existing research calendar. Planning sees quantities and arrival changes in its existing part status. Comms retains its relationship and opportunity actions. The common news feed reports purchases, deliveries and amendments to their affected destinations.

## Multiple orders throughout

Every order independently chooses quantity, supplier, schedule and destination. “Order again” copies a Resource into a fresh quote using current terms, displays existing supply and asks for confirmation. No parent order or special batch workflow is required.

Example: one camera for Science on day 45 at $12 M, followed by two identical cameras for a launch requirement on day 105 at $8 M each. There are two Contracts, three units and a $28 M commitment. Another example splits the two flight units across two separate one-unit Contracts with different arrival dates. Both must count toward the same Task.

The current planner counts several Allocations but takes a design part's actual attributes from one Contract. Integration must aggregate every contributing Contract. For a repeated component slot, this slice supports homogeneous hardware with identical kind, variant, stats and per-unit mass. Different suppliers, schedules, prices and contractual reliability can coexist. A mismatched hardware allocation shows a specific explanation before commitment.

The selected reliability aggregation keeps the current one-factor-per-design-part abstraction. For N equivalent units with supplier reliabilities r_i and quantities q_i, use the quantity-weighted geometric mean, exp(sum(q_i × ln(r_i)) / N), as the displayed effective reliability and existing part factor. This is an explicit game approximation. It makes splitting identical supply into separate Contracts neutral. A physically different unit-level failure model would be a separate change. Planning shows the contributing Contracts and quantities in existing details so the aggregate can be explained.

## Visual integration

The [visual walkthrough](concepts/orders.html) illustrates five views with fixture data. It is an approval document with static screen studies.

| Surface | Placement and interaction |
| --- | --- |
| Procurement frame | Existing top navigation, calendar and Budget remain persistent. Dark panels, cyan selected controls, amber timing warnings, Exo 2 headings and Inter body text follow the incumbent style. |
| Left panel | Launch needs and department supply totals. Department totals describe purchased/incoming/in-use supply. Selecting a department filters catalogue compatibility and Contracts. |
| Catalogue center | Resource browsing and supplier options. Selecting a Resource opens its order composer. |
| Right composer | Destination and needed-by date, quantity, delivery-option rows, consequences and a fixed Review order action. Flight requirements and department notes are distinguishable. |
| Contracts center | Rows show quantity, destination, current arrival and explicit changed status. “Order again” and “Find replacement” lead to ordinary order composition. |
| Amendment inspector | Current-versus-proposed table above a fixed Review amendment action. Other purchases remain accessible when editing is suspended. |
| Calls center | Three response-window rows with eligible suppliers, estimated cost/arrival and deadline impact. A fixed Open Call action stays near the selected summary. |
| Science project | Equipment appears beside project estimates. Supply selection does not change the field map or research-combination workflow. |

At 1920×1080 use three columns approximately 280px / flexible / 400px. At 1440×900 use 240px / flexible / 340px. Individual lists and detail bodies scroll inside the station, while Budget, active subject and confirmation actions stay visible. Color is paired with text. Controls have labels, keyboard focus, and dates and quantities use consistent units. Notifications preserve the active draft and never automatically change its subject.

## Shared-state integration

| Owning files | Required changes |
| --- | --- |
| `game/src/core/model.ts` | Add authored delivery options to Offers, chosen delivery terms and amendment history to Contracts, destination alternatives to Allocations, standalone requirement snapshots to Calls, finite Offer quantity tracking and project supply reservations. Keep existing entity IDs and contract-only inventory. |
| `game/src/stations/procurement/rules.ts` | One pure quote path shared by UI and reducers for sign/amend, deadline previews, destination compatibility and remaining quantities. Dates, prices and blockers come from this path. |
| `game/src/stations/procurement/logic.ts` | Sign parameterized orders, apply delivery amendments atomically, reserve department quantities, resolve Calls from snapshotted requests and settle cancellation/delivery. |
| Procurement data and UI | Author supplier schedule profiles and response times. Extend Inspector, Dialog, CallsView, ContractsView, Needs and comparison to use current drafts and their quotes. |
| Science `logic.ts`, `slice.ts`, `model/research.ts` | Replace `testTaskId` dependency with project equipment requirements and reservations. Validate fit, exclusive quantity and delivery before awarding the existing bonus. |
| Science `DraftProject.tsx`, `LabPanel.tsx` | Replace the automatic request checkbox with supply status and selection. Expose supply on running projects and in a small department list. |
| Planner `derive.ts` and existing details | Aggregate all matching current-Task Allocations and display quantity coverage. Derive a homogeneous actual part and the selected combined reliability from every supply lot. |
| Comms effects and shared news | Existing delivery effects update Contract revisions and destination-aware warnings. Route status information to the affected departments and flight parts. |
| Core persistence and action dispatch | Migrate old state and validate quote revisions, offer capacity and reservation availability when actions replay in host order. A stale action returns readable feedback and performs no partial spending. |

No department resource duplicates are created outside Contracts. A unit allocated to a Task cannot simultaneously be reserved for Science. A forecast date cannot become a delivered status. Needs with zero free quantity disable selection with the cause shown.

Migration must retain old signed prices, quantities, IDs and cancellation terms. Existing Contracts get a legacy schedule snapshot. Existing Task Allocations get an explicit Task destination. Old Science test Tasks are migrated to project equipment requirements and department allocations where links exist, then withdrawn while history remains. Free research stock remains assigned to Science. A supplied legacy unit that fails the recipe's actual criteria is displayed as incompatible. Loading a prior save must run this migration before its version is accepted.

## Observable completion criteria

1. From a spoken Science need, procure a unit for Science, receive it, select it for a project and show its actual bonus without creating a Task.
2. Compare two schedules for the same Offer, see different quoted cost/arrival, sign one and observe matching Contract and Budget values.
3. Change a Call window and see the closing date, responder set and estimated arrival consequences change before opening. Received Offers match the authored rules and named market changes.
4. Apply an existing delivery-delay effect and recover an active Contract through a feasible amendment. Both stations show the revised date and the exact fee is accounted for once.
5. Make two differently scheduled purchases of one Resource. Each delivers independently, can be amended independently and contributes the correct quantity to department use or the same launch Task.
6. Attempt competing reservations or purchases against the same finite quantity. The first accepted action wins and the other gets a readable refreshed state without overspending or double use.
7. Resume an old save with Science test Tasks and Contracts, preserving money and supply through migration.
8. In a four-player session, observe whether procurement has worthwhile choices, whether players can explain tradeoffs and whether using the new controls interrupts conversation. Record waiting and repetitive work as well as successful interactions.

These are implementation checks and playtest criteria, not claims that they have passed. This concept has been reviewed against the source and illustrated in a separate document.

## Source boundary

The CML paper identifies acquisition activities such as Calls for information, sourcing and long-lead procurement. The [checked acquisition sources](../docs/notes/2026-11-14-procurement-order-decisions.md#verified-external-scope) support real delivery schedules, solicitation deadlines and contract modifications. The proposed UI, supplier curves, amendment fees, Call window lengths, research reuse and reliability aggregation are game design choices selected for this prototype.
