# Prototype improvement review — November 14, 2026

This pass improves the existing Full HD HTML design artifact. The research chat supplied proposals and reference observations. The only directly inspected reference gameplay was part of Sourcing Lab, as its research records state. This pass inspected our own scenarios, actions and prototype behavior. It makes no new claim about those reference games or player enjoyment.

## Design choices made in this pass

| Proposal | Disposition and reasoning |
| --- | --- |
| Persistent catalogue, shared needs and Budget | Retained. Fits D-011 and the research-equipment, personnel and mission-hardware situation. No new task-first gate. |
| Highlight matches with an optional filter | Implemented as a design proposal. Focusing an engine need leaves all 15 original Resources browsable. Matches only narrows it to the two matching catalogue engines. Useful alternatives stay discoverable by default. |
| Show ready, promised and missing supply | Implemented, including quantities and current criteria. A signed Contract creates a promise. Delivery creates usable supply. Late or incompatible reservations require review. |
| Side-by-side comparison | Implemented on demand for up to three selected Resources. It shows price, arrival, relevant qualification, reliability, current criteria and available Budget after purchasing one. No weighted recommendation. |
| Durable change review | Implemented for actual fixture outcomes. Funding, delivery, Task, research and supplier changes record their cause and affected objects. This is state review. Teammates still negotiate by talking. |
| Preserve context through Calls | Implemented for category, search and sort. Calls expose response date and opening Task revision. Response review compares authored Offers against current criteria. |
| Recheck confirmation after live changes | Implemented. An affordable changed purchase needs renewed review. A no-longer-valid action is blocked with a reason. A Contract delivered during cancellation review cannot be cancelled under active-Contract terms. |
| Bulk purchasing and reallocation | Implemented through quantity Allocations within Contracts. The fixture can publish two computer needs and split a three-unit Contract 2+1. Promised and ready quantities can both be reserved. |
| Editable basket or full acquisition forecast | Deferred. Ordinary procurement still uses a short confirmation. The shared Budget and visible needs support the current rough exercise without adding another financial workflow. |
| Weighted scoring and staged sourcing lessons | Omitted. They would add a scoring model or serialized process before this station's discovery and coordination loop has been experienced with players. |
| Deep supplier negotiation, staff growth and service schedules | Deferred. Their underlying models and role boundaries remain open. The mockup retains basic authored Calls and named personnel fixtures. |

These choices are reversible prototype proposals. Existing selected terminology, contract-only inventory, authored content, direct conversation and the standalone directory are preserved.

## Relevant scenarios and supported behavior

- Research requisites and personnel compete with engine and instrument needs for one Budget. A bench and researcher can both be contracted, then delivered; their shared need shows each state correctly.
- Funding can rise or fall while Contracts exist or a confirmation is open. Commitments and allocations are retained, including if available funds become negative. Further unaffordable procurement is blocked in this fixture.
- An authored engine Task revision raises supplied thrust criteria from 900 to 940 kN. Atlas remains a 920 kN Contract. Its reservation is flagged. Procurement never edits the Task through its station actions.
- An authored supplier delay changes expected arrival and causes a timing gap against the need-by date. Procurement retains the Contract until the player acts.
- A new domestic instrument Offer provides a cheaper, lower-reliability route while external acquisition remains available. Existing Contracts retain snapshots of their accepted terms.
- Call waiting allows independent purchases. Returned Offers survive a Task revision and are checked against current criteria.
- Delivered resources remain in Contract inventory. Allocations can be released and reassigned while Budget stays unchanged. Named people remain single candidates in this illustrative fixture.

Actual observations and arithmetic are recorded in the [interface walkthrough](../docs/playtests/2026-11-14-procurement-interface-walkthrough.md).

## Limits

This is still an HTML interaction prototype with local authored inputs. The selected TypeScript/canvas implementation baseline in D-009 is unchanged. No shared base, networking, multiplayer role implementation or final mission simulation has been added.

Time advances through a fixture control. There is one authored response per supported Call target. No probabilistic reliability resolution, research execution, training, personnel development, service time-slot scheduling, general AND/OR evaluator, recurring salaries or negotiated counteroffers are implemented. The partial coverage evaluator handles the supplied fixture criteria and quantities. Unsupported computer-need Calls explain the missing authored response.

Payment on delivery, active cancellation cost of 50%, named people being single candidates, and blocking purchases beyond available Budget are prototype rules. They do not resolve the open economic, personnel or failure-recovery questions. Repetition of a comms control is another explicit fixture event, not an implementation of network message deduplication.

Manual interface checks can establish arithmetic, transitions, fit feedback and independent procurement work while a Call is pending. They cannot establish that the role is fun, that the catalogue and economy are balanced, or that all roles stay meaningfully active together.
