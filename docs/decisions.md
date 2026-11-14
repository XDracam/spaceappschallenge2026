# Decision log

This log records explicit project direction. Proposed mechanics remain in [ideas](ideas.md) until accepted. Entries link their source notes.

## D-001 — Work in the prototype phase

- Date: 2026-11-14
- Status: accepted user direction
- Decision: treat this as prototype work.
- Rationale: the user explicitly identified the current phase.
- Consequence: keep mechanics and implementation choices proportional to the question being explored. This does not itself choose a paper prototype or technology stack.
- Related: [prototype proposal](prototype.md), I-006, Q-012.

## D-002 — Prepare, then simulate once

- Date: 2026-11-14
- Status: reclassified as brainstorming on 2026-11-14, following the user's clarification; retained for history.
- Originally recorded: the mission is planned and prepared, then simulated once, producing a win or failure; everyone can fail.
- Correction: this was recorded too strongly as an accepted rule. It remains an idea, including the possibility everyone fails. Real-time play and a campaign are also ideas; their relationship to this flow is open.
- Unresolved: timing of the simulation, preparation and live events, cooperative versus competitive outcomes, success thresholds, uncertainty, and reuse of a design.
- Related: I-005, [mission flow](design/mission-flow.md), Q-002, Q-004, Q-008, Q-011.

## D-003 — Persist ideas in structured documentation

- Date: 2026-11-14
- Status: accepted user direction
- Decision: keep structured project documentation that preserves all substantive ideas.
- Rationale: explicit setup request.
- Consequence: keep source notes, an idea register, accepted decisions, unresolved questions, current design, and future experiment evidence linked. Markdown is the initial setup format, not a game technology decision.
- Related: [documentation workflow](README.md).

## D-004 — Keep every role engaged concurrently

- Date: 2026-11-14
- Status: key design requirement stated by the user; implementation remains open.
- Intent: give every role something meaningful to do at the same time; avoid hard dependencies that leave someone idle, waiting for another role.
- Related: [brainstorm notes](notes/2026-11-14-brainstorm.md), I-017, Q-014.

## D-005 — Hand-crafted content baseline

- Date: 2026-11-14
- Status: user-stated baseline.
- Direction: no runtime dynamic generation; hand-craft missions, part lists, possible events, and similar content.
- Source: [personnel and roles notes](notes/2026-11-14-personnel-tasks-roles.md).
- Open boundary: whether and how authored content can be selected, varied, combined, or revealed at runtime, and how player-created tasks relate to this baseline. Do not assume that all randomness or changing state is prohibited. See Q-026.
- Related: I-023, [shared tasks](design/shared-tasks.md), Q-026.

## D-006 — Procurement terminology

Accepted by the user on November 14, 2026. Use these terms consistently across procurement and the current design documents.

| Term | Meaning |
| --- | --- |
| Task | A goal and its completion criteria. |
| Resource | A part, person, or service that can be supplied. |
| Call | An invitation to suppliers to submit Offers addressing a Task. |
| Offer | Supplier terms for providing a Resource. |
| Contract | An accepted Offer and the resulting commitment. |
| Allocation | Contracted quantity reserved for a particular Task criterion. |
| Budget | Funding, spending, commitments, and available funds. |

Players open a Call, receive Offers, sign a Contract, and allocate what it provides to Tasks. Catalogue Offers can also be accepted directly.

Record fields, ownership, state transitions, payment schedules, and detailed mechanics remain under discussion. Related material includes I-036 and the [procurement interfaces](../procurement/interfaces.md). The [terminology discussion](notes/2026-11-14-procurement-terminology.md) records the user's selection and the previous term for Call.

## D-007 — Direct conversation between roles

User direction on November 14, 2026. Players coordinate by talking directly to one another. This communication is an important part of the gameplay.

Tasks are shared problems whose applicable roles may be unclear, as in the original brainstorm. The assistant's support-Task workflow has been withdrawn. The exact distinction between persistent Tasks and conversational requests remains a design question. Information visibility and automated interface assistance also remain open.

See the [source clarification](notes/2026-11-14-tasks-and-conversation.md), the [shared Tasks brainstorm](design/shared-tasks.md), and the proposed [Task boundary](../procurement/tasks-and-conversation.md).

## D-008 — Procurement alignment after incoming mission-planner work

User clarification on November 14, 2026, following the integration review.

- Tasks are shared problems. Replace the incoming role-addressed “Send to procurement” workflow with publication to the shared Task list.
- Inventory is contract-only. A delivered Contract continues to represent what is available for use and Allocation.
- Procurement consumes Tasks and publishes assessments and its own procurement records. Task creation and replacement Task identity belong to the planner/shared Task design.
- Domestic research limits are distinct from acquisition routes. Expensive external purchase and diplomacy can remain possible before domestic research unlocks a part.
- Detailed mission feasibility and the mass consequences of slider minimums remain within the planner's scope. Procurement checks the supplied Task criteria.
- Planner displays for Budget, delivery status and goal risk require ordinary state integration. They do not create a concept conflict with direct player conversation. Broader visibility details can be considered during interface design.

See the [user response](notes/2026-11-14-procurement-alignment.md) and the [review resolution](reviews/2026-11-14-mission-planner-integration.md#resolution-after-user-review).

## Future decision template

```markdown
## D-### — Title

- Date: YYYY-MM-DD
- Status: proposed / accepted / superseded by D-###
- Decision:
- Source / approval:
- Rationale and evidence:
- Alternatives considered:
- Consequences and limitations:
- Related ideas, questions, and docs:
```
