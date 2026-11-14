# Procurement state walkthroughs

Earlier proposed state checks, retained as implementation reference after the accessible-gameplay clarification on November 14, 2026. See the current [gameplay walkthroughs](workflows.md). Each walkthrough names the starting state, trigger, player choices, conversation, and expected record changes. They are design fixtures for discussion. No walkthrough or software test has been run.

Tasks are shared needs supplied by other systems. Procurement consumes them, creates procurement records, and reports evidence. Players negotiate by speaking. Inventory consists of Contracts.

## Fixture assumptions

Use the mockup's fictional Mars preparation state for the acquisition examples. Funding is 120 credits, spent is 18, existing commitments are 22, and available funds are 80. The existing commitments are a power Contract. A delivered lab-computer Contract accounts for the spent 18 credits.

The engine Task needs one engine with thrust at least 900 kN and Isp at least 340 s by April 2029. The current agency date is September 2028. Three authored Offers exist.

| Offer | Price | Delivery | Reliability |
| --- | --- | --- | --- |
| Kestrel | 27 | June 2029, late | 91% |
| Atlas | 42 | February 2029, on time | 97% |
| Pioneer | 55 | December 2028, on time | 84% |

Reset before each independent walkthrough unless its setup says otherwise. For numerical examples only, assume payment on delivery and a cancellation settlement costing half the price. These are proposed fixture rules. Payment schedules and cancellation settlement still need an explicit design choice before implementation. Real-time calendar uses the documented baseline of one real minute per calendar month.

## 1. Acquire and deliver a catalogue item

**Start** with the uncovered engine Task and the fixture Budget.

**Player sequence**

1. Inspect the Task and compare all three Offers.
2. Discuss cost, timing and reliability with planning. Choose Atlas.
3. Accept its Offer to create a Contract. Inspect the financial effect.
4. Allocate its one engine to the Task.
5. Advance the scenario to the authored delivery date.

**Expected checkpoints**

- Signing creates an active Contract with a snapshot of accepted terms. Committed becomes 64 and available becomes 38. Signing by itself leaves the Task's procurement criterion uncovered until an Allocation links the supply.
- Allocation changes coverage to reserved. It does not spend more money.
- Delivery changes Contract state to delivered and allocated coverage to available. The Contract remains the inventory record. Under the fixture payment rule, spent becomes 60, committed becomes 22, and available remains 38.
- Task assessments name the current Task revision. Shared Task evaluation uses that evidence for completion.

**System exchange** uses Task input, then Contract, Budget, Allocation and assessment outputs. Time and the authored delivery rule cause fulfillment.

## 2. Use an existing delivered Contract

**Start** with the delivered lab-computer Contract, unallocated. Science publishes a shared Task that the computer can satisfy.

**Player sequence** is to inspect existing Contracts, identify the match, and Allocate its quantity. Procurement explains what is already available to science.

**Expected checkpoints**

- A new Allocation links the delivered Contract to the incoming Task.
- The assessment reports available supply immediately.
- There is no new Offer acceptance, Contract or payment. Budget is unchanged.
- No separate stock or owned-part inventory record is created.

**System exchange** uses Task input and Allocation and assessment outputs.

## 3. Negotiate before buying

**Start** with a variant of the fixture where only 30 credits remain available. Kestrel is affordable but late. Atlas and Pioneer exceed available funds.

**Player sequence**

1. Compare the gaps and tell planning what the affordable option would mean.
2. Planning chooses whether to change the schedule. In this walkthrough, it changes the need-by date to July 2029 through its own system.
3. Procurement receives the revised Task, reassesses Kestrel, then signs and Allocates it.

**Expected checkpoints**

- Before the revision, the late Offer is accurately shown as late. Conversation has no financial effect.
- Procurement creates no support Task and does not edit the shared goal itself.
- The incoming Task revision changes timing assessment. Accepted price and quantity consume 27 credits of availability, leaving 3 in this variant.
- If planning declines a schedule change, the Task remains unresolved. The interface does not claim that conversation succeeded automatically.

**System exchange** uses a revised Task input following speech, then the normal acquisition outputs.

## 4. Open a Call while doing other work

**Start** with an engine need and no satisfactory catalogue option in a variant of the fixture.

**Player sequence**

1. Open a Call against the current engine Task revision.
2. While awaiting responses, inspect the power Contract and compare camera Offers.
3. An authored supplier response introduces an engine Offer costing 35 credits with on-time delivery.
4. Return to the Call, compare its response against the current Task, and accept it if it still fits.

**Expected checkpoints**

- The Call retains which Task revision its invitation used.
- Opening or waiting on the Call leaves other procurement work accessible. A Call is an invitation to fictional suppliers. Players keep talking directly.
- An authored response arrives as an Offer associated with the Call. It is evaluated against the latest Task even if the Task changed during the wait.
- Signing creates a Contract and reduces available funds by 35. The Call itself creates no purchase commitment under this fixture.

**System exchange** is a procurement Call action, incoming Offer and time updates, then the normal Contract outputs. The exact Call response timing and closure rules remain to be chosen.

## 5. Recover from a supplier delay

**Start** after Atlas has been signed and Allocated. It is due before the Task's April deadline.

**Trigger** is a supplier event moving delivery to June.

**Player sequence** is to inspect the affected Contract and tell planning about the delay. For this walkthrough, planning agrees to move the need-by date to July and publishes the revision.

**Expected checkpoints**

- Contract expected delivery becomes June. Its accepted technical specifications and price remain recorded.
- The initial assessment shows reserved supply arriving late. Budget is unchanged by the delay fixture.
- The revised Task makes the same supply on time. No duplicate Contract, Allocation, or procurement-created Task is needed.
- A branch in which planning cannot move the deadline proceeds to replacement or leaves an unresolved timing gap.

**System exchange** uses `ContractAffected`, Contract and assessment outputs, then a Task input and reassessment.

## 6. Replace a commitment after requirements change

**Start** after Atlas has been signed and Allocated. Available funds are 38.

**Trigger** is an incoming Task requiring more thrust than Atlas provides. Its ID and revision are supplied by the shared Task/planner design.

**Player sequence**

1. Inspect the mismatch and discuss replacement with planning.
2. Preview cancelling Atlas and choosing an authored replacement Offer costing 55 credits that satisfies the new criteria.
3. Confirm cancellation, release the old Allocation, sign the replacement Contract and Allocate its quantity to the supplied Task.

**Expected checkpoints**

- Requirement changes do not rewrite signed terms or automatically cancel the old Contract.
- The old supply no longer provides matching evidence. The old Contract remains visible as history after cancellation.
- Under fixture settlement, cancelling Atlas adds a cost of 21 credits and removes its 42-credit unpaid commitment. Budget becomes spent 39, committed 22, available 59.
- The replacement brings committed to 77 and available to 4. Its Allocation provides matching reserved supply.
- Procurement uses Task references from the shared system. The walkthrough does not prescribe whether replacement retains or changes a Task ID.

**System exchange** uses Task input and Contract, Allocation, Budget and assessment outputs. The cancellation fixture must be replaced with agreed terms before implementing actual settlement.

## 7. Acquire beyond domestic research

**Start** with a shared instrument Task beyond current domestic research. An external Offer costs 70 credits and is already accessible. The fixture has 80 available.

**Player sequence**

1. Explain the immediate external purchase option to science and comms.
2. Science can pursue research, or comms can negotiate access or terms, while procurement works on other needs.
3. For this walkthrough, a research outcome introduces a cheaper domestic Offer at 35 credits. Procurement compares it with the still-valid external Offer and accepts one.

**Expected checkpoints**

- Missing domestic research does not hide or disable the external route by itself.
- A new Offer or changed access/terms represents the actual outcome. Talking to science alone does not unlock anything.
- A previously signed Contract keeps its accepted terms when a cheaper Offer appears.
- If acquisition succeeds through diplomacy, it is represented through a Contract in the chosen model. A free acquisition can use authored zero-price terms. The precise diplomatic fulfillment mechanism remains a design proposal.

**System exchange** uses Offer or access changes, then normal procurement outputs. Other roles own their research and diplomacy actions.

## 8. Handle a funding cut with active obligations

**Start** after Atlas has been signed. Funding is 120, spent is 18, committed is 64, and available is 38.

**Trigger** is a 70-credit funding cut. Funding becomes 50 and available becomes minus 32.

**Player sequence**

1. Inspect the deficit and existing obligations. Tell comms and planning what is exposed.
2. For this walkthrough, comms obtains 40 credits through an authored outcome. Procurement receives the actual funding change.
3. Reassess the remaining Budget and obligations.

**Expected checkpoints**

- The cut preserves existing Contracts, Allocations and spending history. It exposes the deficit.
- Conversation creates no automatic funding and no support Task.
- The funding outcome changes funding to 90 and available to 8. Commitments remain 64.
- If comms fails, the deficit persists and the team must choose another response. The rules for further commitments or insolvency remain an unresolved policy question.

**System exchange** uses funding inputs and Budget outputs. Each funding input has one effect, including if its message is repeated.

## Additional quantity check

A Contract supplies three computers. Allocate two to one shared Task and one to another. Trying to reserve an additional computer must expose that all three are already reserved. Releasing one reservation makes that quantity available for reassignment while the Contract and its cost remain intact. This exercises Allocations beyond the mockup's single-unit examples.

## Decisions these walkthroughs expose

- Payment timing, cancellation settlement and behavior during a funding deficit.
- Call response timing, withdrawal and treatment of changed Task criteria.
- How cancellation or replacement is presented as one or several player actions.
- Time-specific service availability and personnel qualification, which need further modeling before those scenarios are executable.

See the broader [gameplay situations](scenarios.md), [role actions](role-actions.md), [interfaces](interfaces.md), and [Task and conversation boundary](tasks-and-conversation.md).
