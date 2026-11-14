# Concept brief

**Stage:** prototype and brainstorming. Sources: [kickoff](notes/2026-11-14-kickoff.md), [follow-up](notes/2026-11-14-brainstorm.md), and [personnel and roles notes](notes/2026-11-14-personnel-tasks-roles.md). Game mechanics below are ideas to explore, not settled rules; the authored-content baseline is recorded separately.

## Core design focus

Make the extensive communication and coordination involved in mission planning fun. Focus first on multiplayer; work out fewer-player gameplay later. The user highlighted one key design requirement: **every role should have meaningful activity at the same time, without a hard dependency that leaves someone waiting**. See [D-004](decisions.md#d-004--keep-every-role-engaged-concurrently).

## Shared problems and personnel

A global set of tasks, problems, and goals may be the heart of play: begin with one broad objective, uncover more tasks, and solve them through roles working together. Criteria may combine AND and OR; the user suggests every task has at least one solution. How that guarantee works under time, budget, and changing constraints remains open. See [shared tasks](design/shared-tasks.md).

A common [personnel system](design/personnel.md) could be shared across roles, ranging from named people with developing skills to skill pools or simple department headcounts. The user wants to communicate the complexity of training qualified people and is concerned that abstraction could become mere money sliders. No model is selected.

## Content baseline

No runtime dynamic generation; missions, part lists, possible events, and similar content are hand-crafted. See [D-005](decisions.md#d-005--hand-crafted-content-baseline). Runtime selection and the exact boundary of generation remain open.

## Areas to explore

- **Resource management and procurement:** manage budget and constrained requests through a catalogue, Calls, and a contract inventory; weigh cost, reliability, delivery time, and communications. Astronauts could also be expensive and difficult to replace.
- **Science:** choose sensors and scientific details, influence mission planning, and perhaps use minigames or staff research projects with uncertain outcomes and cross-role unlocks.
- **Mission planning:** explore a simplified 2D mission and payload configuration, parameters, and launch windows; convert constraints into editable tasks rather than shopping for individual tasks. Planning simulations are distinct from the earlier final-mission idea; their relationship remains open.
- **External communications:** respond to events in a visual-novel style and proactively build relationships; consequences and opportunities could affect all roles. Political, industry, and public relations might be separate roles.
- **Play structure:** real-time play, difficulty sliders, and switching between roles at any time are ideas, with Empty Epsilon mentioned as an inspiration for switching.
- **Mission premise:** begin with a broad destination goal, such as an icy moon or the Moon, then work out the details.

The earlier idea of preparing a mission, simulating it once, and winning or failing remains part of the brainstorm. How it fits with real-time events during a mission is open. Everyone being able to fail remains an idea; no scoring model is selected.

## Beyond a single mission

One idea is a space agency roguelite [redacted for publication] with increasingly difficult missions, accumulated progress, and a run ending after one or a set number of failures. A follow-up suggests a campaign instead, keeping some overarching progress. Neither structure is selected; see [I-020 and I-021](ideas.md) and [Q-018](questions.md#q-018--campaign-and-roguelite-structure).

## Still open

Role assignments, player count, mission phases, timing, event and dialogue rules, success conditions, progression, platform, and technology stack. See [questions](questions.md) and the organized [brainstorm](brainstorm.md). The [challenge brief](challenge.md) provides external context; optional challenge suggestions are not automatically project requirements.
