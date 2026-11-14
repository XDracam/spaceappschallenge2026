# Roles and interactions

These are brainstorming areas from the [kickoff](../notes/2026-11-14-kickoff.md), [follow-up](../notes/2026-11-14-brainstorm.md), and [personnel and roles notes](../notes/2026-11-14-personnel-tasks-roles.md), not a selected player count or permission model. Focus is multiplayer first, and switching roles is an idea. See [Q-001](../questions.md#q-001--players-and-role-ownership). The key requirement is meaningful concurrent activity for every role (D-004).

A [procurement-facing action map](../../procurement/role-actions.md) records the current proposed actions and their effects.

## Resource management and procurement — I-001

A [standalone procurement prototype sketch](../../procurement/README.md) explores this role; it is a proposal and has not been tested.

**User brainstorm:** “I need this, how do I get it?” Budget, cost, reliability, delivery time, and the effect of communications belong in the decision.

**Candidate decisions:** select between suppliers, accept a slower delivery, pay more for reliability, or reduce scope to stay within budget. These examples are proposals. The user also suggested procuring astronauts like parts, with high costs and difficult replacement (I-015).

**Needs from others:** science requirements, planning deadlines, and stakeholder effects from communications.

**Contributes:** what the mission can acquire, its cost, its expected availability, and its reliability implications.

**Further ideas:** RP manages money and constrained requests through a large catalogue and Calls (*Ausschreibungen*) with competing offers. With enough money, time, and risk a Call might theoretically solve any problem. A contract list acts as inventory: the proposed model is that nothing is owned, only contracted, with cancellation cost, risk, delays, and minimum time until arrival. RP may also recruit personnel.

**Unresolved:** feasibility of Calls; records of existing, discarded, cancelled, or changed contracts; timing of needs and assembly; how reliability and communications effects work. See Q-005, Q-022–Q-024, and Q-028.

## Communications and public relations — I-002

**User brainstorm:** outward stakeholder communication and how messages are received. Political relations, industry relations, and public relations could be separate roles (I-011). Communications could receive messages and choose dialogue responses, with results affecting other roles (I-012).

**Candidate decisions:** how to respond to outside messages or events from other players. One example is [redacted for publication]. The user suggested political demands, route changes, lost in-mission funding, and extra payloads or objectives as possible adverse outcomes. Funding, supplier access, and delivery priority are other possible effects, not established rules.

**Further ideas:** visual-novel gameplay around incoming outside events. If events cannot be handled, consequences could alter mission constraints, delay or cancel contracts, raise risks, block research, or change funding; events may also offer positive opportunities. Proactive galas and relationship-building could resemble research projects, perhaps with different UI and details, unlocking options for science or procurement, funding, or new events.

**Needs from others:** credible science goals, procurement needs, and the actual schedule.

**Contributes:** a still-undefined effect on the mission's external relationships and procurement.

**Unresolved:** who the stakeholders are, how reception is evaluated, and how this responsibility stays meaningful through preparation. See Q-006.

Spacecraft telemetry and data transmission are distinct from this proposed role. Whether to model those constraints is Q-009.

## Science — I-003

**User brainstorm:** science should be fun; select sensors, destinations, activities, and goals. Science can affect mission planning, with minigames to figure out details (I-016).

**Candidate decisions:** choose a focused objective or a more ambitious combination; select instruments that enable that objective. No particular mission or sensor catalog is selected.

**Research idea:** assign researchers to projects across disciplines; projects take time and budget and may need procurement. Rewards are roughly indicated but not precisely known. Some fail (“yay we found a rock from space”); some may unlock other research, events, or options for procurement, communications, or mission planning. A tech tree is a possibility, not a chosen structure.

**Needs from others:** attainable equipment, available time, and viable mission opportunities.

**Contributes:** mission goals, desired observations, and sensor requirements.

**Unresolved:** how freely goals can be defined, how success is evaluated, and what scientific abstractions suit the audience. See Q-003 and Q-004.

## Mission planning — I-004

**User brainstorm:** decide when, in what order, with which priorities, and within which launch windows.

**Candidate decisions:** sequence deliveries and preparation, choose a launch opportunity, and prioritize observations. Automatic schedule generation is not implied.

**Configurator idea:** design launch, payload, and target using simplified 2D simulations; configure payloads, send them onto orbits, and inspect parameters and launch windows. Adjust goals as needed while things run. Science might unlock planning options. The planner translates initial and event-driven constraints into tasks for a part or person with bounds, creates a task when sufficiently confident, and can edit it later. Planning does not shop for individual tasks; RP handles procurement. These are ideas, with implementation and workflow still open.

**Needs from others:** equipment availability, science priorities, and external commitments.

**Contributes:** an ordered, timed mission plan.

**Unresolved:** time scale, schedule representation, dependencies, and the cost of missing a window. See Q-007.

## Candidate shared planning record

For a paper prototype, a single sheet could hold goals, selected sensors, procurement choices, budget, availability dates, stakeholder commitments, and the mission schedule. This is a proposal, not an implementation schema.

Example dependency to explore: a desired observation requires a sensor; the cheaper supplier delivers after the preferred launch; communications might improve that option; planning must then choose whether to wait, pay more, or change the goal. No numerical effects have been selected.
