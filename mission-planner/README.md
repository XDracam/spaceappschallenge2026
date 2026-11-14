# Mission planner module

All work for the mission planning role lives in this folder: specification, notes, and later implementation. This document specifies the final system; it does not describe staged versions.

Labels: **user direction** = stated by the user. **Proposal** = suggested, not yet accepted. Source notes are in [notes/](notes/).

Related project docs: [roles](../docs/design/roles.md#mission-planning--i-004), [shared tasks](../docs/design/shared-tasks.md), ideas I-004, I-030, I-031, questions Q-007, Q-009, Q-029.

## Solar system and maneuvers

**User direction:** a simplified 2D model of the inner solar system, asteroid belt (Vesta, Ceres), and Jupiter with its four Galilean moons; circular orbits in one plane. The player steers by clicking orbits and picking a maneuver type with a few sliders; each maneuver's delta-v is calculated. Maneuver types include transfers (departure date and travel time traded against delta-v), orbit insertion, landing, gravity-assist flybys, separation into several spacecraft, and return trips. Moon-to-moon transfers and moon flybys work in the Jupiter system. Radiation, Venus heat, and solar distance create part requirements.

**Time — user direction:** all roles play in real time. Editing the mission plan is instant: a new or changed maneuver immediately shows its result, and the spacecraft does not fly during play. At the very end of the game, the finished plan is played once in fast-forward; only then does the mission actually fly. An agency calendar advances at 1 real minute = 1 calendar month; research, deliveries, and events count on it, the planner sets the launch date on it, and play ends when it reaches that date. The playthrough scores each mission goal separately, and parts can fail based on their reliability. See [Time](solar-system-and-maneuvers.md#time).

Full specification: [Solar system and maneuvers](solar-system-and-maneuvers.md).

## Rocket configurator

**User direction:** expendable stacked stages plus a multi-component payload spacecraft that can have its own stages. Sliders set exact part stats for a rocket version, tested in simulation. Slider values become minimums on procurement tasks. Planning beyond current research is allowed, including better-than-state-of-the-art instruments; such parts become one "get that part" task solvable through research, expensive purchase, or diplomacy. The planner alone owns the payload design. Ion propulsion is in scope, simplified.

Full specification: [Rocket configurator](rocket-configurator.md).
