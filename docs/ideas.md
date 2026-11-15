# Idea register

All entries created November 14, 2026. User ideas come from the [kickoff](notes/2026-11-14-kickoff.md), [follow-up brainstorm](notes/2026-11-14-brainstorm.md), and [personnel and roles notes](notes/2026-11-14-personnel-tasks-roles.md). User clarification: these concept mechanics are brainstorming; the concurrent activity goal is highlighted as a key requirement. Assistant-generated additions are explicitly proposals.

| ID | Idea | Source | Status | Next step / detail |
| --- | --- | --- | --- | --- |
| I-001 | Resource management includes obtaining what is needed, balancing budget, cost, reliability, and delivery time; communications affects it. | User kickoff | Brainstorm | [Role mechanics](design/roles.md); resolve Q-005 and Q-006 |
| I-002 | Communications is likely public relations: outward stakeholders and how messages are received. | User kickoff | Brainstorm | Define stakeholders and effects in Q-006 |
| I-003 | Science supplies enjoyable choices about sensors, destination, activities, and goals. | User kickoff | Brainstorm | Resolve mission scenario and goals in Q-003 and Q-004 |
| I-004 | Mission planning concerns timing, order, priorities, and launch windows. | User kickoff | Brainstorm | Define schedule mechanics in Q-007 |
| I-005 | Finish planning and preparation, then simulate once and win or fail; everyone can fail. | User kickoff | Brainstorm; D-002 corrected | [Mission flow](design/mission-flow.md); resolve Q-002 and Q-008 |
| I-006 | Explore the core choices in a paper prototype before selecting software technology. | Assistant setup proposal | Proposal | [Prototype plan](prototype.md); no experiment has occurred |
| I-007 | Explain the final outcome with a debrief tracing consequences to choices and uncertainty. | Assistant setup proposal | Proposal | Resolve Q-004 and Q-008; inspect challenge feedback guidance |
| I-008 | Show an evolving shared mission record during preparation. | Assistant setup proposal | Proposal | [Candidate planning record](design/roles.md); evaluate whether it helps negotiation |
| I-009 | Use stakeholder responses to alter funding, supplier access, or delivery priority. | Assistant setup proposal | Proposal | Candidate implementations of I-001/I-002; select none until Q-006 is resolved |
| I-010 | Communications can go badly: politicians demand extras, routes change, funding stops during a mission, or additional payloads and objectives appear. | User brainstorm | Brainstorm | Examples and impact chains in [brainstorm](brainstorm.md) |
| I-011 | Split external communications into political, industry, public relations, or other areas. | User brainstorm | Brainstorm | Role split and ownership are open, Q-006 |
| I-012 | Communications receives messages and chooses dialogue responses; reactions have visible results affecting other roles, including player-caused events and an example [redacted for publication]. | User brainstorm | Brainstorm | Event and response design, Q-015 |
| I-013 | Real-time play, difficulty sliders, and switching roles at any time, inspired by Empty Epsilon. | User brainstorm | Brainstorm; switching superseded by D-012 | Switching during game time rejected by D-012; real time and difficulty remain open in Q-016 |
| I-014 | Focus on multiplayer first; explore fewer-player gameplay later. | User brainstorm | Working focus; default of four set by D-012 | Fewer-player play deferred; four is the default |
| I-015 | Procure astronauts like parts: expensive and hard to replace. | User brainstorm | Brainstorm | Q-005; exact crew model open |
| I-016 | Science affects mission planning and uses minigames to work out details. | User brainstorm | Brainstorm | Q-017 |
| I-017 | Give every role meaningful activity simultaneously; avoid hard waits on another role. | User brainstorm | Key design requirement, D-004 | Q-014; concrete implementation open |
| I-018 | Make the extensive communication involved in mission planning fun. | User brainstorm | Central design aim | Q-014 and Q-015 |
| I-019 | Start missions with a broad destination goal, such as going to an icy moon or the Moon. | User brainstorm | Brainstorm | Q-003 and Q-004 |
| I-020 | Roguelite: run a space agency [redacted for publication] through progressively harder missions, build up, and stop after one or a set number of failures. | User brainstorm | Brainstorm; alternative to I-021 | Q-018; threshold and progress open |
| I-021 | Maybe use a campaign instead of a roguelite, retaining some overarching progress. | User follow-up | Brainstorm; alternative to I-020 | Q-018; progression and failure consequences open |

| I-022 | Consistent personnel management for every role: named developing people, skilled pools, or department headcounts; procurement can acquire people. Communicate training complexity. | User personnel notes | Brainstorm; alternatives open | [Personnel](design/personnel.md); Q-019 and Q-020 |
| I-023 | No runtime dynamic generation; hand-craft missions, parts lists, possible events, and similar content. | User personnel notes | User baseline, D-005 | Q-026 defines the boundary |
| I-024 | A global list of tasks, problems, and goals is the heart of play: start with one broad task, discover more, and complete them; criteria can use AND/OR and do not have obvious role ownership. | User personnel notes | Brainstorm | [Shared tasks](design/shared-tasks.md); Q-021 |
| I-025 | Every task must have at least one solution. | User personnel notes | Proposed design principle | Q-022: theoretical versus affordable and feasible solutions |
| I-026 | Track procured parts or contracts, including discarded things, and determine when parts are needed for assembly. | User personnel notes | Open questions | Q-023 and Q-024 |
| I-027 | Science manages research projects across disciplines: assign researchers and time, spend budget and perhaps procure resources; uncertain rough rewards, failure, and unlocks. | User personnel notes | Brainstorm | [Roles](design/roles.md); Q-027 |
| I-028 | RP handles constrained requests through a large catalogue and Calls; multiple offers trade money, time, and risk; Calls might theoretically solve any problem. | User personnel notes | Brainstorm | Q-022 and Q-028 |
| I-029 | Procurement inventory consists of contracts rather than owned things, with cancellation costs, risks, delays, and minimum time until arrival. | User personnel notes and alignment clarification | Contract-only inventory accepted in D-008. Detailed terms open. | Q-023 and Q-028; timing interpretation open |
| I-030 | Mission planning uses a simplified 2D configurator and simulation for payloads, orbits, parameters, and launch windows, steering goals as things run. | User personnel notes | Brainstorm | Q-008 and Q-029; planning simulation versus final mission |
| I-031 | Planning converts initial and event-driven mission constraints into editable tasks for a part or person with bounds, rather than shopping for each task. | User personnel notes | Brainstorm | [Shared tasks](design/shared-tasks.md); Q-025 |
| I-032 | Communications uses visual-novel-style outside events; unhandled issues create positive or negative consequences for constraints, contracts, risk, research, and funding. | User personnel notes | Brainstorm | Q-015 and Q-030 |
| I-033 | Communications proactively runs galas or relationship-building activities, perhaps like research projects, to unlock options, funding, or further events. | User personnel notes | Brainstorm | Q-030 |
| I-056 | Four players by default, each on their own station from a separate seat; no switching or sharing of stations during game time. Empty Epsilon is a design reference only. | User decision, [player stations note](notes/2026-11-14-player-stations.md) | Accepted, D-012 | How stations connect stays open in Q-012; fewer players deferred |

| I-034 | Explore a standalone procurement prototype in `procurement/`, with integration later and no shared base yet. | [User request](notes/2026-11-14-procurement-prototype.md) | User direction; mechanics open | [Procurement sketch](../procurement/README.md) |
| I-035 | Explore procurement as managing a portfolio of contracts against changing requests, with a debrief and authored stand-ins for other roles. | Assistant proposal | Proposal; untested | [Procurement sketch](../procurement/README.md); Q-023–Q-028 |

| I-036 | Define a consistent procurement vocabulary and typed inputs and outputs around shared tasks, resources, offers, Calls, contracts, allocations and budget. | User request for precision, assistant model proposal | Vocabulary accepted in D-006, record shapes and behavior proposed | [Interface draft](../procurement/interfaces.md) |

| I-037 | Walk through concrete procurement situations involving competing funds, revised needs, assembly timing, bulk allocations, surplus, funding cuts, conditional deals, research unlocks, Calls, training, and service capacity. | Assistant examples requested by user | Brainstorm scenarios | [Gameplay scenarios](../procurement/scenarios.md) |

| I-038 | Organize the concept using Participants, Systems, Entities, Rules, Actions, Events, Authored content, and Interfaces, with examples and cross-category relationships. | Assistant taxonomy requested by user | Proposal for review | [Concept taxonomy](taxonomy.md) |

| I-039 | Map each role's player actions to procurement-facing state changes and outcomes, including explicit gaps in budget and personnel integration. | Assistant proposal requested by user | Proposal for review | [Role actions](../procurement/role-actions.md) |

| I-040 | Players coordinate by talking directly. Explore Tasks as persistent shared goals with evaluable criteria, with help requests and negotiation happening in conversation. Withdraw the assistant's support-Task workflow. | User communication clarification and assistant boundary proposal | Direct conversation is user direction. Exact Task boundary remains proposed. | [Task and conversation boundary](../procurement/tasks-and-conversation.md) |

| I-041 | Use the documented web, TypeScript and HTML canvas stack in the separate procurement directory. Explore a workspace for shared Tasks, catalogue/Calls, Contracts and Budget, using an authored Mars preparation scenario and local stand-in controls. | User stack selection, assistant gameplay proposal | Technology accepted in D-009. Gameplay remains proposed. | [Procurement player experience](../procurement/README.md#current-player-experience-direction) |

| I-042 | Validate procurement through end-to-end walkthroughs covering catalogue acquisition, reuse of delivered Contracts, spoken negotiation, Calls, delays, replacement, research alternatives, and funding cuts. | Assistant proposal requested by user | Earlier state checks retained as implementation reference. Gameplay reframed under D-010. | [Gameplay](../procurement/workflows.md), [state checks](../procurement/state-walkthroughs.md) |

| I-043 | Highlight mission-planning complexity through fun scenarios playable without prior training. Explore offers as understandable dilemmas, discoveries, and conversations, with automatic record maintenance and a compact commitment confirmation. | User experience requirement, assistant interaction proposals | Experience accepted in D-010. Specific interactions remain proposed. | [Gameplay walkthroughs](../procurement/workflows.md) |

| I-044 | Procurement acquires resources, research requisites and personnel from a catalogue, managing Budget across needs throughout the team. Other stations can change overall funding. Use Full HD or larger space for the game UI. | User gameplay and mockup correction | Accepted direction in D-011. Specific layout and catalogue mechanics remain proposed. | [Catalogue gameplay](../procurement/gameplay.md) |

| I-046 | Study comparable games for catalogue acquisition, equipment/personnel purchasing, delivery, supporting needs, future obligations, multiplayer spending visibility, replacement comparisons and optional supplier negotiation. | User research request; sourced assistant analysis, November 14, 2026 | Research and proposals; no mechanics selected or playtests performed | [Initial game references](../procurement/game-references.md); subsequent research identified Sourcing Lab and TAC/SCM as closer Call comparisons, documented in the [follow-up](../procurement/research-design-alternatives.md). |

| I-045 | Explore the catalogue and Budget gameplay through a standalone Full HD mockup with mixed resources, shared needs, procurement confirmation, Contracts and authored supplier responses. | Assistant design requested by user | Proposed design artifact. Fixture rules illustrative. | [Desktop mockup](../procurement/mockups/README.md) |

| I-047 | Make the procurement challenge about assembling a coherent acquisition portfolio across several live needs, with visible consequences and independent actions while other work is pending. | Research synthesis; [detailed analysis](../procurement/research-design-alternatives.md) | Proposal, untested | Compare opportunities, tradeoffs, pacing and concurrent activity in the shared scenario. |
| I-048 | Explore four alternative procurement emphasis models: catalogue discovery, Budget and timing portfolio, supplier relationships, and Contract recovery; retain catalogue and Budget management in each. | Research synthesis; [design alternatives](../procurement/research-design-alternatives.md#four-alternatives-for-the-station) | Competing proposals, untested | Compare the same scenario, learning burden and role boundaries. |
| I-049 | Explore Calls as an investment of time for authored alternatives; compare quick Calls, targeted Calls and supplier negotiation, with explicit tradeoffs and independent work during the wait. | Sourcing Lab and TAC/SCM research; [Call alternatives](../procurement/research-design-alternatives.md#calls-three-alternatives) | Alternatives, untested | Resolve Q-026 and Q-028 before implementation; keep direct catalogue purchase viable. |
| I-050 | Explore visibility, editable purchase plans and clear consequences for existing Contracts when needs change; assess whether a budget preview informs choices without prescribing an optimum. | Factorio UI and X-COM research; [principles](../procurement/research-design-alternatives.md#principles-for-this-game) | Proposal, untested | Preserve contract-only inventory and direct conversation. |
| I-051 | Compare scripted supplier outcomes, communicated probabilities and bounded unknowns; make opportunity to respond visible while leaving reliability rules open. | Sourcing game research and existing scenarios; [risk alternatives](../procurement/research-design-alternatives.md#uncertainty-and-change) | Alternatives, untested | Resolve Q-008, Q-022 and Q-026; no randomness rule selected. |

| I-052 | Explore a persistent catalogue workspace with shared needs, Budget, contextual inspection and durable change notices; compare an on-demand side-by-side view with a compact tray. | [UI flow research](../procurement/ui-flow-research.md); existing Full HD mockup | Proposal; untested | Compare with task-centered, staged sourcing and portfolio dashboard layouts. |
| I-053 | Explore nonblocking Call and Contract-change flows that preserve browsing context, distinguish promised from available supply, and recheck changed facts at commitment. | [UI flow research](../procurement/ui-flow-research.md) | Proposal; exact timing and rules open | Evaluate concurrent work, state changes, accessibility and Q-016/Q-023–Q-026. |

| I-054 | Adapt the reference research into the existing rough prototype using optional match filtering and comparison, accurate ready/promised quantities, persistent changes and current-fact confirmation. | Assistant implementation choices under the user improvement request | Prototype proposals with manual interface observations. Enjoyment and multiplayer unvalidated. | [Review](../procurement/prototype-review.md), [walkthrough](playtests/2026-11-14-procurement-interface-walkthrough.md) |

| I-055 | Explore a vibrant illustrated space-agency strategy-game aesthetic: a shared mission as the visual anchor, role-specific workspaces, bold color, tactile components and readable consequences. | Assistant visual proposal, November 14, 2026; user rejected the initial nasacore mockup direction. | Proposal for discussion; no visual direction selected. | [Visual exploration](notes/2026-11-14-visual-aesthetic.md) |

| I-057 | Apply lessons from the implemented planner: focused separate stations, meaningful mission-deadline consequences, contextual explanations and removing equivalent controls. Treat planner part records as integration examples while preserving broader procurement Tasks, quantity Allocations and shared Budget semantics. | Assistant source review of incoming commits through 1051783 | Lessons and integration proposals; planner runtime not independently validated in this pass | [Second pull review](reviews/2026-11-14-second-planner-pull.md) |

| I-058 | Apply the mission planner visual language to the procurement prototype. | User direction, November 14, 2026 | Accepted styling direction in D-013. The catalogue layout adaptation is an assistant implementation choice. | [Source and observed checks](notes/2026-11-14-procurement-planner-style.md) |

| I-059 | Use Impeccable for targeted game UI design iteration, Vercel Web Design Guidelines for implementation review, Anthropic frontend-design as an alternative visual lead, and UI UX Pro Max selectively as a reference library. Ground all work in separate stations, meaningful concurrent activity, direct conversation and accessible gameplay. | [User research request](notes/2026-11-14-ui-agent-skills.md); [source-reviewed comparison](ui-agent-skills-research.md), November 14, 2026 | Impeccable and Vercel accepted in D-014 and installed; remaining tools optional; no benchmark | Compare actual populated station designs and inspect relevant behavior when requested; no new visual style or game mechanics selected |

| I-060 | Refine procurement clarity through readable need dates, distinct purchase blockers, empty-search recovery, stable focus and immediate allocation validation. | Assistant implementation under the requested Impeccable and Web Design Guidelines review | Implemented prototype refinements with single-operator browser observations. Multiplayer experience remains unvalidated. | [UI audit](playtests/2026-11-14-procurement-ui-audit.md) |

| I-061 | Audit the procurement station for major game UX requirements: persistent information, scrolling, reach, interruptions and gameplay annoyance, informed by the ludography. Keep minor polish outside this review. | [User request and scope correction](notes/2026-11-14-gameplay-ux-audit-request.md), November 14, 2026 | User direction for the audit; no new UI mechanics approved | [High-level gameplay UX audit](reviews/2026-11-14-procurement-gameplay-ux.md) |
| I-062 | Separate persistent mission awareness from scrolling detail; give station modes one active subject; preview multi-need plans; distinguish attention from history; reduce repeated bookkeeping while preserving commitment safeguards; establish meaningful independent role choices before claiming concurrency. | [Source- and browser-grounded audit](reviews/2026-11-14-procurement-gameplay-ux.md), November 14, 2026 | Proposed requirements and design gates, unselected; no multiplayer validation | Extends I-047/I-050/I-052/I-053; timing, risk and visibility remain open in Q-007/Q-008/Q-010/Q-014/Q-016/Q-031 |

| I-063 | Align procurement information emphasis with player decisions and distinguish current need, inspected Resource, purchase destination, compatibility, availability and reservation. Foreground acquisition tradeoffs and actionable changes. | Assistant proposals under the user semantic-hierarchy audit request | Reviewed in source and browser. Proposed changes await iteration. | [Semantic hierarchy findings](playtests/2026-11-14-procurement-ui-audit.md#semantic-information-hierarchy-review) |

| I-064 | Trial a lightweight acquisition draft, fixed mission overview and action area, contextual Contract/Call/Task inspection, direct card comparison and persistent supply exceptions in the procurement mockup. | Assistant implementation under the gameplay audit improvement request | Implemented interface experiment. Economic rules and multiplayer experience remain open. | [Walkthrough and implementation choices](playtests/2026-11-14-procurement-gameplay-iteration.md) |

Identifier alignment on November 14, 2026 — parallel documentation used I-061 for both the gameplay audit request and the semantic-hierarchy proposals. The gameplay audit keeps I-061. The semantic-hierarchy entry is retained as I-063 with its source wording preserved.

| I-065 | Science must not feel like an idle game; players do actual data analysis and science work. | User, [science module note](notes/2026-11-14-science-module.md) | User direction | Q-017, Q-027; concrete mechanic open |
| I-066 | Research-field overview as a knowledge graph: navigate and explore future research directions, and draft projects from nodes. Refined: the graph is very large and starts mostly known (player is a senior researcher or professor). | User, [science module note](notes/2026-11-14-science-module.md) | User idea | Mockup in I-067; node content stays hand-crafted (D-005); Q-032 |
| I-067 | Mockup v2: about 130 mostly-known nodes in seven disciplines; each node has a factual description in the details pane (v3); pick two or three nodes on a bench and combine them; a hand-authored recipe gives a project idea, otherwise textbook or long shot. The first draft (single-node questions, hypothesis and analysis screen) is superseded. | Assistant proposal | Proposal | [redacted for publication]; not playtested |
| I-068 | Orientation as a player task by relabeling nodes. | User, [science module note](notes/2026-11-14-science-module.md) | Withdrawn by the user on Nov 14 (third message); orientation now comes from factual node descriptions | Q-032 |
| I-069 | Create project drafts by selecting and combining specific nodes, like an alchemy phone game. | User, [science module note](notes/2026-11-14-science-module.md) | User idea | Q-033, Q-026 |
| I-070 | Concrete data analysis (choose data, clean it, fit models, claim with confidence) as science gameplay. | User, [science module note](notes/2026-11-14-science-module.md) | Deferred; kept in mind for later | Parked screen in the design canvas; Q-017 |
| I-071 | Science visual prototype (boards 1 and 2 of the mockup, without data analysis) built in `science/` with the mission planner's stack (Preact, TypeScript, Vite). Not integrated with other stations yet. | User, [science module note](notes/2026-11-14-science-module.md) | User direction (build, stack); content is a proposal | [Science module](../science/README.md); not run in a browser yet |
| I-072 | One shared event system on every station: any station can trigger events that can affect anything, shown like a news feed; external (comms-only) and internal (mission/other stations) events must be distinguishable. | User, [comms questions](../communications/notes/2026-11-14-comms-questions.md) | User direction | [Event system](design/events.md); Q-034 |
| I-073 | Communications: four stakeholders (government, industry, public/media, foreign agencies + universities) with one trust level each; events (about one per real minute, hints not numbers, expire with default outcome) plus 2–3 proactive projects costing money, time, and trust; negotiations deliver parts (as offers to procurement), research, money, or services; recurring characters; inbox-centred station layout; no staff; result counts goals only. | User, [comms questions](../communications/notes/2026-11-14-comms-questions.md) | User direction | [Communications module](../communications/README.md); refines I-002, I-011, I-012, I-032, I-033 |
| I-074 | A few mild in-flight events per mission, resolved automatically from the state at launch (comms: trust levels; possibly science and procurement too). | User, [comms questions](../communications/notes/2026-11-14-comms-questions.md) | User direction | [Event system](design/events.md#in-flight-events) |
| I-075 | Much larger graph (many more nodes) with flexible cluster naming: cluster labels change with zoom level, coarser when zoomed out and finer when zoomed in. | User, [science module note](notes/2026-11-14-science-module.md) | Tentative user idea; not built | Q-035; extends I-066 and Q-032 |
| I-076 | "Level design" of the details pane: split a field's information into tab-like views for datasets, observation methods, and related papers or analyses. | User, [science module note](notes/2026-11-14-science-module.md) | Tentative user idea; not built; wording interpreted, see note | Q-035; relates to the deferred data analysis (I-070) |
| I-077 | Science task inbox: tasks posted by Mission Planning (raise a research limit, unlock a part) shown in the science UI; opening one marks its related fields. The search module, the inspect/combine mode switch, and the "tried so far" log were removed, and the bench changes only through an explicit button. | User, [science module note](notes/2026-11-14-science-module.md) | User direction; prototype with placeholder tasks, not connected to the planner | [Science module](../science/README.md); Q-035 |
| I-082 | Science as an engineering tech tree: upgrades for the planner's parts (more thrust or Isp, better instruments, more power, higher data rate, better shielding, unlocking new part types). Replaces the knowledge graph. | User, [science module note](notes/2026-11-14-science-module.md) | User direction (D-020) | Branch `science-tech-tree` |
| I-083 | Science's goals come from Procurement: a part beyond research can be bought (tender, dearer, riskier) or developed (a research request to science). Both can run in parallel. | User, [science module note](notes/2026-11-14-science-module.md) | User direction (D-020) | Branch `science-tech-tree` |
| I-084 | Comms can enable or block techs. Some techs need comms approval before research can start (for example nuclear power or export-controlled engines). | User, [science module note](notes/2026-11-14-science-module.md) | User direction (D-020) | Branch `science-tech-tree`; Q-036 |
| I-085 | Tech tree with routes: techs have prerequisites, several techs can lead to the same goal, and techs far from the researched frontier are shown as unknown until the player gets closer. The fog is an assistant proposal. | User ("science must find ways to the goal"), assistant for the fog | Route finding is user direction; fog is a proposal | Q-038 |

Merge alignment on November 14, 2026 — incoming science/comms ideas I-035–I-047 are retained as I-065–I-077. The duplicate incoming station idea I-034 refers to existing I-056 and D-012. Incoming questions Q-031–Q-034 are retained as Q-032–Q-035. References in the incoming modules were aligned.

| I-078 | Explore procurement's proactive investigation of supply options, development versus purchase, testing, fallbacks and whole-mission reserves within iterative cross-role mission design. Players arrange their own voice or in-person conversation. Department allocation remains a proposal. | User gameplay feedback and supplied CML paper; assistant synthesis, November 14, 2026 | Research and gameplay proposals, unselected and untested. External conversation arrangements are user direction. | [Paper review and source locations](reviews/2026-11-14-cml-paper.md); Q-005, Q-008, Q-014, Q-020, Q-023, Q-027–Q-028, Q-030–Q-031 |

### I-079 — Configurable orders and procurement decisions over time

- Captured: 2026-11-14
- Source: [User request and proposed additions](notes/2026-11-14-procurement-order-options.md).
- Status: tentative user idea for order parameters; assistant proposals for the detailed mechanics, unselected and untested.
- Idea: configure delivery and assurance, amend active Contracts, reserve production slots, set Call response deadlines, acquire usable departmental resources, arrange partial deliveries and handle authored recovery choices.
- Intended player experience: procurement weighs cost, timing, risk and flexibility across concurrent needs and discusses consequences with teammates.
- Dependencies and unanswered questions: risk semantics, amendment limits, reservation terms, authored Call eligibility, department use and divided deliveries. Preserve comms' relationships and planning's mission decisions. Related Q-005, Q-007–Q-008, Q-014, Q-023–Q-028 and Q-031.
- Evidence or experiment: inspected current procurement source. Existing signing supports quantity and optional Task allocation with fixed Offer terms. No new mechanics implemented or played.
- Disposition: proposed first experiment combines configurable orders, amendments and department use. Additional mechanics remain candidates.
- User review: [D-017](decisions.md#d-017--procurement-amendments-call-timing-and-direct-department-needs) accepts amendments, visible Call timing effects and direct department needs without Science-created procurement Tasks. Separate orders cover split quantities. Reservations remain optional, recovery events are deferred and assurance remains questioned. [Verbatim feedback and checked sources](notes/2026-11-14-procurement-order-decisions.md).

### I-080 — Order and department-supply approval concept

- Captured: 2026-11-14
- Source: user request for a specific goal state and visual integration covering items 1, 2, 4 and 5, with item 6 enabled orthogonally.
- Status: detailed assistant proposal for approval; D-017's accepted direction remains distinct from these proposed rules.
- Idea: supplier-authored delivery options, explicit amendment fees and cutoffs, visible Call response-window tradeoffs, department destinations and exclusive reusable Science equipment, and ordinary independent orders with shared quantity accounting.
- Intended player experience: discuss needs directly, compare concrete consequences, and respond to changing supply without adding another role's request-management workflow.
- Dependencies and unanswered questions: approve the schedule options, fee rules, Call windows, Science reuse and homogeneous flight-lot reliability aggregation; numbers require balancing and multiplayer engagement requires observation.
- Evidence or experiment: inspected current shared-state, procurement, Science and planner integration. Produced static visual studies; no gameplay implementation or playtest claimed.
- Related decisions and design docs: [D-017](decisions.md#d-017--procurement-amendments-call-timing-and-direct-department-needs), [full concept](../procurement/order-concept.md), [visual walkthrough](../procurement/concepts/orders.html), I-079.
- Disposition: awaiting user review. Production-slot reservations remain optional; additional supplier-recovery events remain deferred.

**November 14 approval update:** [D-018](decisions.md#d-018--procurement-order-and-department-supply-prototype) selects I-080 as the prototype target. The earlier proposed and awaiting-review statements above are retained as historical status. Implementation and multiplayer observations must be recorded separately.

### I-081 — Contract arrival timeline and budget composition

- Captured: 2026-11-15.
- Source: user request for intuitive contract/budget visualization followed by a design process without building.
- Status: assistant design proposal; unselected, unimplemented and not playtested.
- Idea: shared-calendar arrival and need markers, explicit timing margin and destination, selected-row intervention detail, and a separate labeled Spent / Committed / Available bar.
- Intended player experience: quickly identify upcoming supply, affected uses and remaining delivery-change opportunities during spoken coordination.
- Evidence and dependencies: source inspection found standalone needed-by dates are not persisted on Contracts and existing late labels compare all supply to launch. Preserve unknown dates and distinguish research bonuses from mandatory needs.
- Alternatives and rationale: signing-to-arrival Gantt rejected as the default because it can imply production progress; an agenda/table remains a useful companion.
- Related: [timeline design study](../procurement/timeline-design.md), D-017–D-018, Q-007, Q-024–Q-025, Q-031.
- November 15 audit refinement: proposed Upcoming action/milestone lanes, Incoming arrival-versus-use rows, and selected live remedy comparisons. Full inventory and source corrections in the study; excludes hidden events, nonexistent production stages and universal order deadlines. Still unselected and unbuilt.
- November 15 approval update: [D-019](decisions.md#d-019--reduced-contract-timeline-prototype) selects a reduced implementation scope: arrivals against actual needs with identity, recipient and quantity, the existing Table, one selected amendment preview, and concise local delay/cutoff feedback. Upcoming, Call/expiry integration, replacement comparison and a dependency graph are outside this iteration; the budget composition remains unselected. Earlier proposal and status statements above are retained as history. Implementation and observations must be recorded separately.

### I-086 — Contract view consistency and automatic date fitting

- Captured: 2026-11-15.
- Source: user feedback on subtle pill controls, Timeline/Table usage discrepancies and “Fit dates”.
- Status: accepted for implementation by the user's “then build it” instruction following the UI analysis. Tabs, shared wide layout, explicit selection and automatic date fitting implemented as a D-019 refinement.
- Idea: expose incoming versus historical coverage in tab labels, retain a consistent Contracts workspace, reconcile hidden historical selections and add a concise Contract identifier to timeline rows. Derive the date range automatically because the current chart has no pan or zoom controls.
- Evidence and limits: [analysis and implementation observations](reviews/2026-11-15-contract-views.md). No multiplayer validation.
- Related: I-081, D-019.

November 15 needs-context follow-up: the user questioned removal of Mission needs and whether related needs were properly displayed. Source review confirmed timing links, but the overview omitted full need/project names and access to uncovered needs. The assistant implemented those names and an expandable reuse of the existing Mission needs panel in both Contract views. This presentation is an assistant implementation choice. [Observed walkthrough and limits](playtests/2026-11-15-contract-needs-walkthrough.md).

### I-087 — Shared cross-role coordination and actionable task filtering

- Date: 2026-11-15
- Status: accepted user direction under D-021.
- Source: [original request](notes/2026-11-15-task-coordination.md).
- Direction: coordinate relevant role dependencies through Tasks with sufficient detail to act through the interface. Permit explicit player-created tasks and switch between current-role actionable tasks and all tasks. Terra and Luna inspect cross-role coverage.
- Implementation choice: derive live entries for existing game records and keep manual requests in shared replicated state with revision checks. Manual completion records a player decision. Generated completion follows the actual source state.
- Earlier conversation-dependent proposals remain historical. Q-022's guarantee of feasible solutions remains unresolved.

### I-088 — In-app confirmations throughout the game

- Date: 2026-11-15
- Status: accepted user direction under D-022.
- Source: [UI correction](notes/2026-11-15-task-coordination.md#later-ui-correction).
- Direction: use the game interface for confirmations and feedback. The user's prohibition applies to native browser popup dialogs.

Identifier alignment, November 15, 2026: the Science entries retain I-082–I-085. Contract views previously also used I-082 and now use I-086; saved coordination I-083 becomes I-087; saved in-app confirmations I-084 becomes I-088. Historical sources may retain their original branch-local references.

### I-089 — One shared task per need with attached progress

- Date: 2026-11-15
- Status: accepted user direction under D-023.
- Source: [task consolidation approval](notes/2026-11-15-task-consolidation.md).
- Direction: consolidate duplicate part/research/Contract/Call/timing entries around the need they serve. Show general mission context in a shared overview. Retain explicit requests and unresolved obsolete commitments. Group funding work and give contextual requests stable identities.
- Current model: adapt to D-020's engineering tech tree and flight-part tests. Keep research opportunities from the live draft design and keep optional testing visible after delivery.

### I-090 — Explicit request links and consistent role actions

- Date: 2026-11-15
- Status: accepted user direction under D-024, following [approval](notes/2026-11-15-task-unification-approval.md).
- Source: user request to consider remaining simplifications with Terra and Luna; [independent review and synthesis](reviews/2026-11-15-task-unification.md).
- Idea: optional explicit parent-need links for player requests, preservation of role actions across attached work, fewer manual Purpose choices, and minimal typed action destinations instead of routing by display text. Compare conflicting timing requests together without merging their completion states.
- Boundaries: preserve standalone requests, individual identity/history, mission-constraint acknowledgement, obsolete commitments, optional test discovery and distinct underlying procurement/research lifecycles. Compact waiting displays are presentation only. Avoid arbitrary task trees or a general workflow framework.
- Evidence: source review identified paused-project action suppression and partner-Offer visibility risks; neither was reproduced in a fresh gameplay session for this review.
- Related: D-021–D-023, I-089.

### I-091 — Mission families with distinct planning problems

- Date: 2026-11-15.
- Source: user asked, "what general space missions should we cover?"; assistant recommendation below.
- Status: proposal for discussion; no mission roster, implementation or progression accepted.
- Proposed coverage: Earth satellites (weather, imaging, communications); space observatories; planetary flybys; planetary orbiters; robotic landers/rovers; sample return; crewed missions; servicing/resupply/repair missions.
- Design intent: distinguish families by the team's decisions rather than adding destinations with otherwise identical play. Candidate dilemmas include coverage versus payload cost, instrument/power/pointing tradeoffs, brief flyby encounters versus orbit insertion, landing mass versus instruments, return mass versus science yield, crew safety versus ambition, and rendezvous compatibility versus schedule. These are design targets, not claims about existing mechanics.
- Suggested near-term focus: retain Weather satellite and Mars orbiter + lander; add the proposed Lunar ice lander next, then consider a flyby and sample return. Observatory, crewed and servicing scenarios remain later candidates; crew and rendezvous would need their own design work. Outer-planet or icy-moon destinations could vary these families rather than form a separate mission type automatically.
- Every authored scenario should offer meaningful concurrent Planning, Science, Procurement and Communications choices under D-004; the roster alone cannot establish that experience. Scope, order and mechanics remain open. Related: I-019, Q-003, Q-014, Q-018, [existing lunar proposal](../mission-planner/notes/2026-11-15-third-mission-proposal.md).

### I-092 — License the project for publication and remove the reference image

- Date: 2026-11-15.
- Source: user explicitly requested deletion of the reference image and a sensible NASA Space Apps license.
- Status: accepted action, implemented under D-025; Apache 2.0 chosen within the user's authorization.
- Result: Apache 2.0 covers original project material; third-party licenses remain in force. The image is deleted from the working tree, with historical feedback preserved. Earlier Git commits still contain it; no history rewrite was performed. See [implementation and official source](notes/2026-11-15-publication-license.md).

### I-093 — Focus the two existing levels for hackathon release

- Date: 2026-11-15.
- Source: user requested expert subagent audits of the two levels for quality, playability, balance and the shortest path to hackathon release.
- Status: audit completed; user subsequently requested all findings fixed under D-027, using Sol subagents. See [approval](notes/2026-11-15-release-fixes-approval.md) and [implementation observations](playtests/2026-11-15-release-fixes-walkthrough.md).
- Evidence: [five-packet release audit](reviews/2026-11-15-two-level-release-audit.md), including current evaluator/quote calculations, build verification and limited browser opening observations. No full multiplayer completion or enjoyment claim.
- Proposals: fix impossible-goal rescue and prerequisite locks; support retry/level change; give Mars immediate mission-directed Science work; show precise fuel shortfalls; align event prose with effects; add concise role guidance and focused accessibility/recovery safeguards.
- Balance disposition: retain generous budgets and introductory Weather difficulty for now; defer broad economy changes, new levels and cosmetic redesign. Mars objective changes require re-evaluating the concrete feasible route. These are recommendations, not accepted mechanics.
- Related: D-004, D-010, D-014–D-015, D-020–D-024; Q-014, Q-022.

### I-094 — Mission Control custom domain on GitHub Pages

- Date: 2026-11-15.
- Source: user explicitly requested `missioncontrol.dractec.com`, [redacted for publication], with no deployment to any machine.
- Status: accepted direction under D-026.
- Result: DNS-only CNAME to GitHub Pages, Actions publishing and a domain-aware build base path. [redacted for publication] See [setup record](notes/2026-11-15-github-pages-domain.md).

### I-095 — A game title screen with a mission-control identity

- Captured: 2026-11-15.
- Source: user called the start page bland and asked how to create a good first impression.
- Status: user approved implementation of the proposed direction, then rejected the initial procedural artwork. Menu/layout implemented; user-supplied finished artwork integrated. See [implementation and artwork correction](notes/2026-11-15-title-screen.md).
- Idea: frame the opening as an orbital mission-control title screen: large Mission Control lettering, an Earth limb and spacecraft as the main visual, restrained orbital motion, and a compact menu for new game, join and conditional continue. Show the four roles through short action phrases; request the name and explain connection codes within the chosen setup flow. Keep challenge attribution secondary.
- Intended player experience: convey the scale of a space mission and the appeal of four people working together before asking players to configure their connection.
- Evidence: inspected the current local start screen in the browser on November 15 at 1280×720. Its small heading, name field and equally weighted action cards occupy the upper portion; most of the lower viewport is empty. No revised UI or player response has been observed.
- Dependencies and unanswered questions: final visual direction and artwork source remain unselected. Preserve existing hosting, joining and saved-game behavior; reduced-motion support is required if animation is added.
- Related: D-010, D-013–D-015; I-094.

## New entry template

```markdown
### I-### — Title

- Captured: YYYY-MM-DD
- Source: person / conversation note / verified reference
- Status: user direction / tentative user idea / proposal / accepted / deferred / rejected
- Idea:
- Intended player experience:
- Dependencies and unanswered questions:
- Evidence or experiment:
- Related decisions and design docs:
- Disposition and rationale:
```

Keep deferred and rejected ideas. Add a dated explanation instead of deleting them. Do not turn possible effects or illustrative examples into accepted mechanics without a decision record.
