# Open questions

All questions below are open as of November 14, 2026, unless marked closed. No numerical values or answers have been selected except where a decision is linked. The order below identifies dependencies, not an approved roadmap.

## Q-001 — Players and role ownership

**Status: closed 2026-11-14 by [D-012](decisions.md#d-012--four-players-on-four-separate-stations).** Four players by default, each on their own station from a separate seat; no switching or sharing of stations during game time. Since every station is occupied, unattended roles do not arise at the default count. Fewer-player play stays deferred (I-014). The exact role split per station follows [roles](design/roles.md).

Original question: Multiplayer is the initial focus; fewer-player gameplay comes later. How many players and roles? Can players share roles or switch at any time? What happens to unattended roles? Role structures remain open.

## Q-002 — Shared or competing outcomes

Does everyone share a mission result, do individuals have additional goals, or do multiple teams compete? The idea that everyone can fail is part of the brainstorm; scoring and competitive structure are open.

## Q-003 — First mission scenario and audience

What destination, mission type, audience, and session duration should the first prototype serve? Blocks a concrete catalog and a playable paper scenario.

## Q-004 — Goals and success

How are science goals chosen and expressed? What is the win condition? Can a failed mission still return useful science? Are there hard constraints beyond achieving the goals? Blocks outcome rules.

## Q-005 — Procurement and reliability

Which items are procured? What can money change? How do delivery and reliability affect the plan and its resolution? Blocks supplier options and economic balance.

## Q-006 — Public relations and procurement effects

Is public relations the selected communications role? Who are its stakeholders, how is reception modeled, and what does it change? How much control do players have over the response? Blocks communications mechanics and its link to procurement.

Partly answered 2026-11-14 (I-043): four stakeholders with one trust level each; trust gives passive modifiers (e.g. industry trust affects procurement). Exact numbers are proposals in the [communications module](../communications/README.md).

## Q-007 — Scheduling

How are time, dependencies, priorities, and launch windows represented? What can be rescheduled and at what cost? Blocks timeline rules.

## Q-008 — Resolution and randomness

How do repeatable planning/configuration simulations differ from the earlier idea of one final mission simulation? How does final resolution fit real-time events and interventions? How is reliability modeled, and what do players know about risk? All are open.

## Q-009 — Engineering depth

Which of mass, power, launch capacity, orbit, data, spacecraft communications, and mission lifetime belong in the first prototype? How simplified should they be? Blocks engineering scope and numerical model research.

## Q-010 — Feedback before commitment

Which checks and warnings are visible during planning and play? Can players commit to an invalid plan? What distinguishes feedback, a preview, and a live intervention if those concepts are used?

## Q-011 — New sessions and replay

After a result, can a new session reuse an earlier design? Is comparison across sessions part of the game? How would this relate to a campaign or a roguelite run?

## Q-012 — Platform and technology

The mission-planner module selects web, TypeScript and HTML canvas, with Preact for panels. D-009 adopts the documented web/TypeScript/canvas baseline for the separate procurement prototype. D-012 fixes four separate stations as a design choice. How they connect, shared networking, hosting and common architecture remain open.

Answered 2026-11-14 by D-015: host-browser peer-to-peer (WebRTC, copy-paste signaling), one app with four station views, GitHub Pages hosting. Open: STUN/TURN choice and host hand-over.

## Q-013 — Publication and license

What license should the project use, and what submission obligations apply? Blocks license selection and submission claims, not local concept work.

## Q-014 — Concurrent activity and communication

What meaningful work can each role do at the same time? How can roles affect one another without forcing a player to wait? What makes communication fun instead of administrative overhead?

## Q-015 — Communications events and consequences

How are authored messages, dialogue options, reception, and consequences selected and presented? How can player-caused events and political or personal situations affect other roles while remaining fair and understandable?

Partly answered 2026-11-14 (I-042, I-043): events come from a scripted timeline, state triggers, random picks from an authored pool, and other players; options show hints, not numbers; unanswered events expire with a default outcome; a shared news feed shows internal events. See [event system](design/events.md).

## Q-016 — Real time, difficulty, and switching

**Status: partly closed by D-012.** Switching and sharing stations during game time are out, and unattended roles do not arise at the default four players. Still open: how real time advances and what difficulty sliders change.

Original question: How does real time advance? What do difficulty sliders change? Can anyone switch to any role at any time, including a role already occupied? How does the system keep unattended roles and in-progress work moving?

## Q-017 — Science minigames

What details could players discover through minigames? How do results affect planning and keep science active alongside other roles? What is fun for players without specialist knowledge?

## Q-018 — Campaign and roguelite structure

Would a campaign or roguelite structure work better? What overarching progress carries across missions? In a roguelite, what failure count ends a run? In a campaign, what are the consequences of failure? How do these structures relate to the space agency idea [redacted for publication]?

## Q-019 — Personnel model

Named people with developing skills, skilled pools that can be allocated, or department headcounts? How can the chosen approach communicate training and qualification while avoiding uninteresting money sliders? See [personnel](design/personnel.md).

## Q-020 — Personnel management across roles

What rules are consistent across roles? Who assigns, trains, recruits, replaces, or moves people, and how does RP acquiring them interact with each role managing its own staff? How are research assignments and astronaut availability represented?

## Q-021 — Shared task structure

Are tasks, problems, and goals separate concepts or views of one list? How are new tasks revealed, completion criteria expressed with AND/OR, and responsibility discovered? How do players coordinate without forcing idle waits? See [shared tasks](design/shared-tasks.md).

## Q-022 — Guaranteeing task solutions

Does “every task has at least one solution” mean a theoretical solution exists in authored content, a solution is currently accessible, or one is affordable and timely given the current state? What happens when deadlines, budgets, contracts, or event-driven constraints rule out options? How do Calls and risk affect this guarantee?

## Q-023 — Contract inventory and discarded things

D-008 selects contract-only inventory. What exactly does a Contract represent over its lifecycle? How are active, fulfilled, cancelled, discarded, replaced, or historical contracts and their associated items tracked? What is a discarded item versus a cancelled contract?

## Q-024 — Need dates and assembly

How do we track when a part is needed, assembly duration, delivery and minimum lead time? What happens when timing changes, dependencies slip, or a needed part arrives late? The exact meaning of “minimum duration until there” is open.

## Q-025 — Editing tasks and changing constraints

What happens to requests, offers, contracts, and deadlines when planning edits a task or an event changes its constraints? Which state changes are visible, and who can revise needs or cancel commitments? Procurement consumes the supplied Task identity. Replacement Task identity is outside its scope under D-008.

## Q-026 — Authored content boundary

What counts as runtime dynamic generation? Can the game randomly select or combine authored events, outcomes, missions, or offers, and can players create tasks during play? How can tasks be uncovered and Calls produce multiple offers under the hand-crafted-content baseline? D-005 does not settle these details.

## Q-027 — Research mechanics

How are researchers assigned, duration and budget determined, and rough rewards communicated? How do failure, project unlocks, events, and cross-role options work? Does procurement provide project needs? Is there a tech tree?

## Q-028 — Catalogue, Calls, and contracts

What belongs in the authored catalogue and what can Calls offer? How are multiple offers, costs, lead times, cancellation, and risk determined? How should the theoretical ability to solve any problem coexist with limited resources, hand-crafted content, and Q-022?

## Q-029 — Mission planning configurator

What does a simplified 2D simulation model, what parameters and launch windows does it expose, and how realistic should it be? How do research unlocks, live goal changes, and task creation work? How does it relate to final mission resolution?

## Q-030 — Proactive and reactive communications

How do visual-novel interactions and unhandled events turn into consequences or positive opportunities? How do galas or relationship projects run, use staff or funding, unlock options, and trigger further events? Which effects are visible to other roles?

Partly answered 2026-11-14 (I-073): 2–3 concurrent projects costing money, calendar time, and trust with other stakeholders; negotiations deliver parts (as offers to procurement), research, money, or services. No comms staff.


## Q-031 — Tasks, conversation, and information visibility

Which persistent shared goals should be Tasks, and which requests or negotiations should happen through direct conversation? D-008 accepts planner displays of Budget, delivery status and goal risk. What additional procurement options and assessment details should other roles see? How can the interface help players reference facts while preserving meaningful conversation? See D-007 and the proposed [Task boundary](../procurement/tasks-and-conversation.md).

## Q-032 — Graph scale and orientation

How large is the research graph (the v2 mockup uses about 130 nodes), how much is known at the start, and how does the player orient in it? Relabeling is dropped; each node carries a factual description. How do search, filters, zoom and a frontier list support orientation, and are descriptions ever revealed gradually? See I-066 and I-068.

## Q-033 — Combining nodes into projects

How many nodes can be combined (the mockup uses two or three)? Are recipes fixed and authored, discovered by trial, or hinted by the graph? What do failed or unknown combinations cost? How does this stay inside the hand-crafted baseline (D-005, Q-026) and keep science from becoming an idle game? See I-069.

## Q-034 — Shared event system details

How are internal events routed to stations, and who decides on them when they touch two stations? How are event odds weighted by trust and other state, and how is randomness kept fair (no runtime generation, D-005)? What does the shared news feed show? How exactly do in-flight events nudge results? Blocks the event implementation for every station. See [event system](design/events.md).

## Q-035 — Hierarchical cluster naming and details tabs

How many nodes does the graph need, and how are clusters named at each zoom level (fixed hierarchy, or labels derived from the visible nodes)? What do the details-pane tabs (datasets, observation methods, related papers or analyses) contain, are they hand-authored per field (D-005), and how do they connect to the deferred data analysis (I-070)? The mockup shows one description per field and three fixed zoom levels. See I-075 and I-076.

## Q-036 — Comms gating of techs

Which techs start blocked and need comms approval, and what can comms do to a running project (block it, slow it, refund it)? Does a block lift by itself after some time? Who is told? The first version blocks and enables whole techs and shows the reason in the tree. See I-080.

## Q-037 — Mass and cost effects of upgrades

The user's example was "better camera modules for less weight". The planner derives mass from stats, so research only raises limits and unlocks parts. Should upgrades also change mass, cost or reliability of parts (the planner and procurement would need to read them)? See I-078.

## Q-038 — Hidden parts of the tree

How much of the tree does the player see at the start, and how do they find routes (fog by distance, scouting projects, hints from partners)? How many routes should a goal have, and can all of them be blocked? See I-081.
