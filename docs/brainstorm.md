# Organized brainstorm

**Status:** brainstorming, not a selected feature list. Sources: [kickoff](notes/2026-11-14-kickoff.md), [follow-up notes](notes/2026-11-14-brainstorm.md), and [personnel and roles notes](notes/2026-11-14-personnel-tasks-roles.md). IDs link ideas to the [register](ideas.md). Examples illustrate possibilities, not final mechanics.

## Core experience — I-017, I-018

Mission planning involves a lot of communication; the central design aim is to make that communication fun. The user highlighted a key requirement: every role should have meaningful things to do concurrently. Avoid a hard dependency that makes one player sleep and wait for another. Roles can affect one another while retaining active work; how to achieve that is open (Q-014).

## People and play — I-013, I-014

- **Decided (D-012):** four players by default, each on their own station from a separate seat, with no switching or sharing of stations during game time. Empty Epsilon is a reference for this design choice only, not for technical architecture.
- Focus on multiplayer first; decide later how fewer people play. Four is the default for now.
- Consider real-time play and difficulty sliders (Q-016).
- Superseded: the earlier idea of switching between roles at any time (I-013) no longer applies during game time.
- Open: how the stations connect (Q-012).

## Personnel across roles — I-022

Should each role manage named individuals with evolving skills, allocate skilled pools, or simply hire headcount per department? RP could find new people. The user is concerned that abstract people might reduce play to money sliders, and wants the system to communicate the complexity of training qualified personnel. See [personnel](design/personnel.md); no model is selected.

## Shared tasks and authored content — I-023–I-026

A global list of tasks, problems, and goals may be the heart of the game: start from one broad task, uncover more, and solve them with AND/OR completion criteria. Ownership need not be obvious. The proposed principle that every task has at least one solution needs clarification when resources and time are scarce. How to track contracts and discarded items, and when parts are needed for assembly, are open questions. See [shared tasks](design/shared-tasks.md).

The stated baseline is no runtime dynamic generation: hand-craft missions, part lists, and possible events. How authored content can be selected or revealed during play is open (D-005, Q-026).

## External communications — I-001, I-002, I-010–I-012, I-032–I-033

- External relations could be split into political relations, industry relations, public relations, and potentially other roles.
- Receive messages, respond using dialogue options, see the result, and affect other roles.
- Events can come from outside or from other players. One example is [redacted for publication].
- Communications can fail or create trouble: politicians demand extra things; a route changes; funding stops during the mission; extra payloads or objectives appear. The causal links, agency, timing, and whether these examples occur together are open.
- Communications can affect procurement. What choices, stakeholder reactions, and consequences make that connection clear and fair? See Q-006 and Q-015.

Comms might use visual-novel-style interactions, and unhandled events could change constraints, contracts, risks, research, or funding, including positive opportunities. Proactive galas or relationship projects might unlock options or funding and trigger more events. Spacecraft data transmission is a separate possible engineering topic.

## Procurement and people — I-001, I-015

Start from “I need this, how do I get it?” Compare cost, reliability, and delivery time within a budget. RP could handle constrained requests using a catalogue and Calls with competing offers. An idea is that everything is represented by contracts, with cancellation costs, risk, delays, and minimum time until arrival. Crew could be procured similarly to parts. Feasibility, contract history, and staffing are open (Q-005, Q-023, Q-028).

## Science and mission planning — I-003, I-004, I-016, I-019

Science should be fun: choose sensors, decide what to investigate, and influence the mission. It could allocate researchers to timed projects with rough uncertain rewards, some failures, funding or procurement needs, and unlocks for science and other roles. Planning could use a simplified 2D configurator to explore payloads, orbits, parameters, and windows; turn constraints into editable tasks rather than directly shop. A mission could start with a broad destination. Scope, research, and the amount of freedom remain open (Q-003, Q-017, Q-027, Q-029).

## Mission lifecycle — I-005

Earlier idea: plan and prepare, simulate the mission once, and either win or fail; everyone can fail. The newer real-time and in-mission event ideas raise questions about when players act, when a plan is committed, and what “simulate once” means. Preserve all of these ideas until the relationship is worked out (Q-008). A planning revision, a live intervention, a simulation preview, and a new mission may each have different meanings; none has selected rules yet.

## Overarching structure — I-020, I-021

- **Roguelite idea:** run a space agency [redacted for publication], start with easier missions, progress and build up, and end a run after one or a set number of failed missions.
- **Campaign alternative:** perhaps use a campaign instead, retaining some overarching progress.

What carries over, how failure affects the campaign or a run, and whether either structure is appropriate are open (Q-018). These are alternatives to explore, not a choice already made.
