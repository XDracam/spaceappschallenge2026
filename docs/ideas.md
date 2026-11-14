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
