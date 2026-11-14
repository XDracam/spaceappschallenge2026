# Mission planner module

All work for the mission planning role lives in this folder: specification, notes, and later implementation. This document specifies the final system; it does not describe staged versions.

Labels: **user direction** = stated by the user. **Proposal** = suggested by the assistant. Source notes are in [notes/](notes/).

**Baseline (user direction, 2026-11-14):** all proposals in this module's documents dated up to 2026-11-14 are accepted as the baseline. They change as building reveals problems. Numbers marked as placeholders remain balancing values.

Related project docs: [roles](../docs/design/roles.md#mission-planning--i-004), [shared tasks](../docs/design/shared-tasks.md), ideas I-004, I-030, I-031, questions Q-007, Q-009, Q-029.

## Solar system and maneuvers

**User direction:** a simplified 2D model of the inner solar system, asteroid belt (Vesta, Ceres), and Jupiter with its four Galilean moons; circular orbits in one plane. The player steers by clicking orbits and picking a maneuver type with a few sliders; each maneuver's delta-v is calculated. Maneuver types include transfers (departure date and travel time traded against delta-v), orbit insertion, landing, gravity-assist flybys, separation into several spacecraft, and return trips. Moon-to-moon transfers and moon flybys work in the Jupiter system. Radiation, Venus heat, and solar distance create part requirements.

**Time — user direction:** all roles play in real time. Editing the mission plan is instant: a new or changed maneuver immediately shows its result, and the spacecraft does not fly during play. At the very end of the game, the finished plan is played once in fast-forward; only then does the mission actually fly. An agency calendar advances at 1 real minute = 1 calendar month; research, deliveries, and events count on it, the planner sets the launch date on it, and play ends when it reaches that date. The playthrough scores each mission goal separately, and parts can fail based on their reliability. See [Time](solar-system-and-maneuvers.md#time).

Full specification: [Solar system and maneuvers](solar-system-and-maneuvers.md).

## Rocket configurator

**User direction:** expendable stacked stages plus a multi-component payload spacecraft that can have its own stages. Sliders set exact part stats for a rocket version, tested in simulation. Slider values become minimums on procurement tasks. Planning beyond current research is allowed, including better-than-state-of-the-art instruments; such parts become one "get that part" task solvable through research, expensive purchase, or diplomacy. The planner alone owns the payload design. Ion propulsion is in scope, simplified.

Full specification: [Rocket configurator](rocket-configurator.md).

## UI

**User direction:** the map is always visible with a docked side panel for rocket, tasks, and versions. The test runs live on every edit; results show on the map (red trajectory, warning icons) and on the delta-v bar with goal success chances. Parts are sent to procurement one at a time.

Full specification: [Mission planner UI](ui.md).

## Build

**User direction (2026-11-14, [notes](notes/2026-11-14-build-decisions.md)):**

- **Stack:** web, TypeScript, rendering on HTML canvas. Applies to this module.
- **Other roles:** until procurement, science, and communications exist, a dev-controls panel stands in for them: contract a task, deliver a part, raise a research limit, advance the calendar.
- **First authored mission:** Mars orbiter + lander.

**Proposal — Mars orbiter + lander mission content:**

- Start: Earth, agency calendar at the start date; launch must happen before a fixed deadline that includes two Mars windows (about 26 months apart).
- Goals: reach Mars orbit (orbiter); deliver orbital instrument data; land on Mars (lander); deliver surface instrument data.
- Requires: transfer, orbit insertion (or aerocapture), separation, atmospheric landing with heat shield.
- Budget, research limits, and slider ranges per propulsion type: authored with the mission data; values are balancing placeholders.

**User direction (2026-11-14, before building):**

- **Map scale:** a Sun-centred system view plus nested views for Earth, Mars, and Jupiter, opened by clicking the planet.
- **Side panel UI:** Preact; the map is plain canvas.
- **Procurement data format:** defined by the planner and documented in [procurement-interface.md](procurement-interface.md); the procurement module adopts or changes it later.

## Running the app

The implementation lives in [`app/`](app/).

```bash
cd mission-planner/app
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` type-checks and builds to `app/dist/`.

Code layout:

| Folder | Contents |
| --- | --- |
| `app/src/model/` | Shared types, units and formatting, rocket lookup helpers |
| `app/src/data/` | Hand-crafted content: bodies, propulsion types, part rules, missions |
| `app/src/physics/` | Ephemeris, Lambert transfers, maneuver costs, staging, live evaluation, playthrough |
| `app/src/state/` | Stores (game, UI, agency calendar) and all actions, incl. dev controls |
| `app/src/map/` | Canvas solar-system map |
| `app/src/ui/` | Preact UI: top bar, side panel tabs, Δv bar, popups, heat map, playthrough |

Implementation notes (choices made while building, within the baseline):

- After a branch runs out of delta-v, later maneuvers are still computed "on paper" (states, costs, red trajectory) so the planner can keep planning; the first failing maneuver is marked.
- A maneuver fails the branch only for flight errors (delta-v, TWR, missing equipment, invalid timing, ion power). Destination problems (instrument power, data rate, radiation, Venus heat) block the related data goal but not the flight.
- A default transfer picks the earliest window within 5 % of the cheapest delta-v in the searched range.
- Transfers to a moon or from a moon to its planet use Hohmann timing; their travel-time slider has no effect.
- Radiation is counted at the destination only, not while flying through the Jupiter system.
- The game saves to the browser's local storage; Dev → Reset game starts over.
