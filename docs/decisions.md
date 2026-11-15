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

## D-009 — Standalone procurement technology

Accepted user direction on November 14, 2026. Use the documented web, TypeScript and HTML canvas stack for the procurement prototype. Keep it in the separate `procurement/` directory, without a shared base yet. Integration comes later.

The reference is the [mission-planner build choice](../mission-planner/README.md#build). The [source note](notes/2026-11-14-procurement-stack-and-gameplay.md) records this selection. Gameplay layout and interaction details remain proposals.

## D-010 — Accessible mission-planning gameplay

User direction on November 14, 2026. This is a game highlighting the complexities of planning a space mission. Its scenarios should communicate that complexity, remain fun, and be playable without prior training.

Procurement designs and walkthroughs must serve that player experience. The [revised gameplay walkthroughs](../procurement/workflows.md) explore understandable dilemmas and spoken coordination. Their specific mechanics and pacing remain proposals awaiting experience with players.

See the [source clarification](notes/2026-11-14-accessible-gameplay.md).

## D-011 — Catalogue procurement across competing needs

User clarification on November 14, 2026. Procurement gameplay centers on acquiring things other roles need from a catalogue and managing the available Budget across needs arising throughout preparation. Research requisites and personnel are explicit examples. Purchasing decisions implicitly distribute the Budget. Other stations, including comms, can change overall funding.

The role fulfills needs and contributes to shared Tasks. The previous isolated Offer-comparison mockups were too narrow. The interface should use the space of a Full HD or larger game screen. Specific layout and interaction designs remain proposals.

See the [verbatim clarification](notes/2026-11-14-catalogue-gameplay.md) and the current [catalogue gameplay direction](../procurement/gameplay.md).
## D-012 — Four players on four separate stations

- Date: 2026-11-14
- Status: accepted user direction
- Decision: the game is multiplayer for four people by default. Each player operates their own station from a separate seat. During game time players do not switch or share stations.
- Source / approval: [player stations note](notes/2026-11-14-player-stations.md).
- Rationale and evidence: user decision. Empty Epsilon is an acceptable reference for this **design** choice: one player per station, each with their own seat.
- Alternatives considered: switching roles at any time (I-013, now superseded for game time) and shared roles (Q-001).
- Consequences and limitations: every station is always occupied, so the unattended-role question no longer applies at the default player count. This is not a technical architecture choice. How stations connect, the platform, and the network stay open in Q-012. Play with fewer players is deferred (I-014); four is the default for now. Which responsibility each station covers follows the role brainstorm in [roles](design/roles.md) and is not fixed by this decision.
- Related ideas, questions, and docs: I-013, I-014, I-056, Q-001 (closed), Q-012 (open), Q-016 (partly closed), [roles](design/roles.md).
Merge provenance — the incoming branch used D-006 for this decision. D-006 already identified procurement terminology here. The station decision is retained as D-012, and its incoming idea I-034 is retained as I-056. Original user wording is preserved in the source note.


## D-013 — Align procurement with the planner visual language

- Date: 2026-11-14
- Status: accepted user direction
- Direction: apply the mission planner UI design language to the procurement prototype.
- Implementation: local visual tokens and styling in the existing standalone mockup, including dark glass, cyan glow, rounded panels, pills and planner typography. Detailed layout choices remain prototype adaptations.
- Source and observations: [user request and interface checks](notes/2026-11-14-procurement-planner-style.md), I-058.

## D-014 — UI design and review skills

- Date: 2026-11-14
- Status: accepted user direction.
- Decision: integrate Impeccable for game UI design and refinement and Vercel Web Design Guidelines for implementation review, as applicable to the work.
- Source: [integration request](notes/2026-11-14-ui-skills-integration.md), following the [research](ui-agent-skills-research.md).
- Consequences: retain D-013's planner-derived procurement style; apply web-oriented recommendations in the context of desktop game stations. Review canvas interactions separately. Player coordination and enjoyment still require actual multiplayer observation.
- Related: I-059, D-004, D-007, D-010–D-013.

## D-015 — Integration architecture

- Date: 2026-11-14
- Status: accepted user direction ([integration questions](notes/2026-11-14-integration-questions.md))
- Decision:
  - Connection (resolves the connection part of Q-012): peer-to-peer. One player's browser hosts the authoritative game state; the other stations connect via WebRTC. Signaling by copy-paste connection codes, no third-party matchmaking.
  - Code: one web app with four station views sharing one game-state module and types. Station folders keep their specs and notes.
  - Hosting: online for judges, as a static site on GitHub Pages.
  - Fewer than four players: anyone may hop to an unclaimed station. This relaxes D-012's no-switching rule only for stations nobody has claimed.
  - Shared model uses procurement's D-006 terms (Task, Resource, Call, Offer, Contract, Allocation, Budget). The planner's "Order part" creates a shared Task whose criteria are the slider minimums; the planner keeps its own UI wording.
  - The assistant builds Science and Procurement out to the planner/comms level as part of integration; teammates review.
- Consequences and limitations: WebRTC over the internet needs a STUN server and can fail on strict networks without a TURN relay; copy-paste signaling is clunky but self-contained. If the host closes the tab, the game ends unless state is saved and handed over. Deploying to GitHub Pages needs the repository owner's agreement.
- Related: D-006, D-008, D-012, Q-012, [event system](design/events.md).

## D-016 — Dollars and standard icons in procurement

- Date: 2026-11-14
- Status: accepted user direction
- Direction: use dollar amounts throughout the procurement prototype, a standard icon pack, and explicit names for missing items.
- Implementation: dollar notation such as $22 and $4.50, Lucide Static 0.468.0, and shortage labels drawn from authored Task descriptions.
- Source and observed checks: [user corrections and walkthrough](playtests/2026-11-14-procurement-gameplay-iteration.md#standard-icon-pack-dollars-and-named-shortages).

Identifier alignment — incoming integration architecture keeps D-015. The procurement display decision is retained as D-016 after parallel commits used the same number.

## D-017 — Procurement amendments, Call timing and direct department needs

- Date: 2026-11-14
- Status: accepted user direction for the listed scope, detailed mechanics remain open.
- Source: [User feedback](notes/2026-11-14-procurement-order-decisions.md).
- Accept contract amendments, including responding to inconvenient external delays or cancellations through feasible adjustments or replacement orders.
- Parameterize Call response deadlines and make their consequences visible to players without specialist knowledge.
- Science should not create procurement Tasks. Players communicate needs for resources outside the final launch, and procurement purchases those resources for department use. Final-launch part Tasks remain the existing planning route.
- Use multiple orders with different parameters for different quantities and delivery times.
- Keep production-slot reservations optional. Explore bespoke supplier recovery events later.
- The proposed assurance control is questioned and unselected. Investigate concrete purchasable or contractual terms. No price, duration or probability curve is selected.
- Implementation gap: the integrated Science test-unit request and bonus currently depend on a generated Task and need revision. Department resource use and reservation semantics remain open.
- Related: I-079, D-007, D-011, Q-005, Q-023–Q-025, Q-027–Q-028, Q-031.

## D-018 — Procurement order and department-supply prototype

- Date: 2026-11-14
- Status: accepted prototype target; implementation and playtesting require independent verification.
- Decision: build the detailed [order and department-supply concept](../procurement/order-concept.md) and its [visual walkthrough](../procurement/concepts/orders.html): supplier delivery options, amendments, 7/14/30-day Calls, direct department supply and reusable exclusive Science test units, independent orders with finite quantities, and homogeneous flight supply aggregated with the stated weighted geometric mean. The concept's shared-state, migration, stale-action and accounting safeguards are part of the target.
- Source: [user approval](notes/2026-11-14-procurement-order-approval.md). This refines D-017 for this prototype; it does not close the broader design questions.
- Evidence and limits: the cited acquisition sources support delivery schedules, solicitation deadlines and modifications; numerical curves, research reuse and reliability aggregation are game choices. Fixtures require balancing. Approval is not evidence of implemented behavior or multiplayer enjoyment. Optional slot reservations and deferred supplier events remain outside this selection.
- Related: I-079, I-080, D-004, D-005, D-017, Q-005, Q-008, Q-014, Q-023–Q-028, Q-031.

## D-019 — Reduced Contract timeline prototype

- Date: 2026-11-15
- Status: accepted user direction for implementation; implementation and playtesting require independent verification.
- Decision: add a Contract timeline showing arrivals against actual needs, with enough identity, recipient and quantity information to distinguish orders and their uses. Retain the Table. On a selected Contract, preview one selected amendment as current versus proposed arrival and fee, and provide concise local delay and cutoff feedback.
- Scope: no Upcoming area, Call or Offer-expiry integration, replacement comparison, or dependency graph in this iteration. The broader [timeline design study](../procurement/timeline-design.md) remains historical exploration, not an approved specification. The separate budget composition proposal is not selected by this decision.
- Source: user approval of the reduced implementation scope in the November 15 conversation, following the timeline study.
- November 15 refinement approval: user instructed “then build it” after the [Contract view analysis](reviews/2026-11-15-contract-views.md). Use Incoming timeline / All contracts tabs, a shared wide workspace with explicit selection and Close details in both views, compact timeline Contract IDs, and cancellation in details. Preserve active selection across tabs and clear historical selection when entering Incoming timeline. Date fitting expands only for offscreen proposals and holds the comparison range until the preview clears.
- Limitations: approval is not evidence of runtime behavior or multiplayer enjoyment. Preserve unknown need dates rather than inventing them; distinguish research bonuses from mandatory needs.
- Related: I-081, D-017–D-018, Q-007, Q-024–Q-025, Q-031.

## D-020 — Science is an engineering tech tree

- Date: 2026-11-14
- Status: accepted user direction; implemented and merged to `main` November 15, 2026
- Decision:
  - Science researches engineering upgrades for Mission Planning (propulsion, instruments, power, antenna, protection), shown as a tech tree with prerequisites. It replaces the knowledge graph, combination bench and recipes of the earlier science design.
  - Science's goals are requests from Procurement. Science must find a route through the tree to a tech that delivers the requested limit or unlock. Several routes can lead to the same goal.
  - Procurement (resource planning) chooses per beyond-research part whether to buy it or to develop it. Developing posts a research request to science.
  - Comms effects can block or enable techs. Some techs need an approval from comms before they can start.
  - Results reach the planner as before, through the shared research limits and unlocks.
- Source / approval: [science module note, eighth message](notes/2026-11-14-science-module.md)
- Rationale and evidence: user direction. The tree gives science its own goal-driven puzzle and ties it to Procurement and Comms.
- Alternatives considered: keep the knowledge graph with the tree as a second layer (not chosen by the user).
- Consequences and limitations: the old graph content (fields, descriptions, recipes) is dropped on the branch and kept on `main`. The pure-science findings that fed comms news are gone unless re-added. Tech content is placeholders (D-005).
- Related: D-005, D-015, I-082 to I-085, Q-036 to Q-038, [science module](../science/README.md).

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
