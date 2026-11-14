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
| I-013 | Real-time play, difficulty sliders, and switching roles at any time, inspired by Empty Epsilon. | User brainstorm | Brainstorm; switching superseded by D-006 | Switching during game time rejected by D-006; real time and difficulty remain open in Q-016 |
| I-014 | Focus on multiplayer first; explore fewer-player gameplay later. | User brainstorm | Working focus; default of four set by D-006 | Fewer-player play deferred; four is the default |
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
| I-028 | RP handles constrained requests through a large catalogue and tenders; multiple offers trade money, time, and risk; tenders might theoretically solve any problem. | User personnel notes | Brainstorm | Q-022 and Q-028 |
| I-029 | Procurement inventory consists of contracts rather than owned things, with cancellation costs, risks, delays, and minimum time until arrival. | User personnel notes | Brainstorm | Q-023 and Q-028; timing interpretation open |
| I-030 | Mission planning uses a simplified 2D configurator and simulation for payloads, orbits, parameters, and launch windows, steering goals as things run. | User personnel notes | Brainstorm | Q-008 and Q-029; planning simulation versus final mission |
| I-031 | Planning converts initial and event-driven mission constraints into editable tasks for a part or person with bounds, rather than shopping for each task. | User personnel notes | Brainstorm | [Shared tasks](design/shared-tasks.md); Q-025 |
| I-032 | Communications uses visual-novel-style outside events; unhandled issues create positive or negative consequences for constraints, contracts, risk, research, and funding. | User personnel notes | Brainstorm | Q-015 and Q-030 |
| I-033 | Communications proactively runs galas or relationship-building activities, perhaps like research projects, to unlock options, funding, or further events. | User personnel notes | Brainstorm | Q-030 |
| I-034 | Four players by default, each on their own station from a separate seat; no switching or sharing of stations during game time. Empty Epsilon is a design reference only. | User decision, [player stations note](notes/2026-11-14-player-stations.md) | Accepted, D-006 | How stations connect stays open in Q-012; fewer players deferred |
| I-035 | Science must not feel like an idle game; players do actual data analysis and science work. | User, [science module note](notes/2026-11-14-science-module.md) | User direction | Q-017, Q-027; concrete mechanic open |
| I-036 | Research-field overview as a knowledge graph: navigate and explore future research directions, and draft projects from nodes. Refined: the graph is very large and starts mostly known (player is a senior researcher or professor). | User, [science module note](notes/2026-11-14-science-module.md) | User idea | Mockup in I-037; node content stays hand-crafted (D-005); Q-031 |
| I-037 | Mockup v2: about 130 mostly-known nodes in seven disciplines; each node has a factual description in the details pane (v3); pick two or three nodes on a bench and combine them; a hand-authored recipe gives a project idea, otherwise textbook or long shot. The first draft (single-node questions, hypothesis and analysis screen) is superseded. | Assistant proposal | Proposal | [redacted for publication]; not playtested |
| I-038 | Orientation as a player task by relabeling nodes. | User, [science module note](notes/2026-11-14-science-module.md) | Withdrawn by the user on Nov 14 (third message); orientation now comes from factual node descriptions | Q-031 |
| I-039 | Create project drafts by selecting and combining specific nodes, like an alchemy phone game. | User, [science module note](notes/2026-11-14-science-module.md) | User idea | Q-032, Q-026 |
| I-040 | Concrete data analysis (choose data, clean it, fit models, claim with confidence) as science gameplay. | User, [science module note](notes/2026-11-14-science-module.md) | Deferred; kept in mind for later | Parked screen in the design canvas; Q-017 |
| I-041 | Science visual prototype (boards 1 and 2 of the mockup, without data analysis) built in `science/` with the mission planner's stack (Preact, TypeScript, Vite). Not integrated with other stations yet. | User, [science module note](notes/2026-11-14-science-module.md) | User direction (build, stack); content is a proposal | [Science module](../science/README.md); not run in a browser yet |
| I-042 | One shared event system on every station: any station can trigger events that can affect anything, shown like a news feed; external (comms-only) and internal (mission/other stations) events must be distinguishable. | User, [comms questions](../communications/notes/2026-11-14-comms-questions.md) | User direction | [Event system](design/events.md); Q-033 |
| I-043 | Communications: four stakeholders (government, industry, public/media, foreign agencies + universities) with one trust level each; events (about one per real minute, hints not numbers, expire with default outcome) plus 2–3 proactive projects costing money, time, and trust; negotiations deliver parts (as offers to procurement), research, money, or services; recurring characters; inbox-centred station layout; no staff; result counts goals only. | User, [comms questions](../communications/notes/2026-11-14-comms-questions.md) | User direction | [Communications module](../communications/README.md); refines I-002, I-011, I-012, I-032, I-033 |
| I-044 | A few mild in-flight events per mission, resolved automatically from the state at launch (comms: trust levels; possibly science and procurement too). | User, [comms questions](../communications/notes/2026-11-14-comms-questions.md) | User direction | [Event system](design/events.md#in-flight-events) |
| I-045 | Much larger graph (many more nodes) with flexible cluster naming: cluster labels change with zoom level, coarser when zoomed out and finer when zoomed in. | User, [science module note](notes/2026-11-14-science-module.md) | Tentative user idea; not built | Q-034; extends I-036 and Q-031 |
| I-046 | "Level design" of the details pane: split a field's information into tab-like views for datasets, observation methods, and related papers or analyses. | User, [science module note](notes/2026-11-14-science-module.md) | Tentative user idea; not built; wording interpreted, see note | Q-034; relates to the deferred data analysis (I-040) |
| I-047 | Science task inbox: tasks posted by Mission Planning (raise a research limit, unlock a part) shown in the science UI; opening one marks its related fields. The search module, the inspect/combine mode switch, and the "tried so far" log were removed, and the bench changes only through an explicit button. | User, [science module note](notes/2026-11-14-science-module.md) | User direction; prototype with placeholder tasks, not connected to the planner | [Science module](../science/README.md); Q-034 |

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
