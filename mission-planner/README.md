# Mission planner module

All work for the mission planning role lives in this folder: specification, notes, and later implementation. This document specifies the final system; it does not describe staged versions.

Labels: **user direction** = stated by the user. **Proposal** = suggested by the assistant. Source notes are in [notes/](notes/).

**Baseline (user direction, 2026-11-14):** all proposals in this module's documents dated up to 2026-11-14 are accepted as the baseline. They change as building reveals problems. Numbers marked as placeholders remain balancing values.

Later cross-module clarification in [D-008](../docs/decisions.md#d-008--procurement-alignment-after-incoming-mission-planner-work) selects shared role-neutral Tasks and contract-only inventory. These supersede the original routed-task and separate-inventory wording. Procurement consumes Tasks.

Related project docs: [roles](../docs/design/roles.md#mission-planning--i-004), [shared tasks](../docs/design/shared-tasks.md), ideas I-004, I-030, I-031, questions Q-007, Q-009, Q-029.

## Missions

**User direction (2026-11-14):** after a playtest found mission planning too complex, the default first mission is a simple **weather satellite in geostationary orbit** (launch to low Earth orbit, then one orbit raise). The **Mars orbiter + lander** mission stays as a second, harder mission. The host picks the mission in the lobby; weather is the default. The planner UI stays non-linear (no guided checklist): players must be able to change any part of the plan in any order. Source: [notes/2026-11-14-weather-mission.md](notes/2026-11-14-weather-mission.md).

Implementation: hand-authored missions (D-005) in `game/src/stations/planner/data/missions/` (`weatherGeo.ts`, `marsOrbiterLander.ts`), registered in `game/src/core/mission.ts`. Orbit and orbit-data goals can require an altitude window (`altitudeKm`, `altitudeToleranceKm`); the weather goals need 35,786 ± 2,000 km. Each starting design deliberately falls short (weather: about 0.24 km/s short of geostationary orbit; Mars: no delta-v for Mars orbit insertion) so the planner has a first problem to fix. Numbers are placeholders.

## Solar system and maneuvers

**User direction:** a simplified 2D model of the inner solar system, asteroid belt (Vesta, Ceres), and Jupiter with its four Galilean moons; circular orbits in one plane. The player steers by clicking orbits and picking a maneuver type with a few sliders; each maneuver's delta-v is calculated. Maneuver types include transfers (departure date and travel time traded against delta-v), orbit insertion, landing, gravity-assist flybys, separation into several spacecraft, and return trips. Moon-to-moon transfers and moon flybys work in the Jupiter system. Radiation, Venus heat, and solar distance create part requirements.

**Time — user direction:** all roles play in real time. Editing the mission plan is instant: a new or changed maneuver immediately shows its result, and the spacecraft does not fly during play. At the very end of the game, the finished plan is played once in fast-forward; only then does the mission actually fly. An agency calendar advances at 1 real minute = 1 calendar month; research, deliveries, and events count on it, the planner sets the launch date on it, and play ends when it reaches that date. The playthrough scores each mission goal separately, and parts can fail based on their reliability. See [Time](solar-system-and-maneuvers.md#time).

Full specification: [Solar system and maneuvers](solar-system-and-maneuvers.md).

## Rocket configurator

**User direction:** expendable stacked stages plus a multi-component payload spacecraft that can have its own stages. Sliders set exact part stats for a rocket version, tested in simulation. Slider values become minimums on shared Tasks. Planning beyond current research is allowed, including better-than-state-of-the-art instruments; such parts become one "get that part" task solvable through research, expensive purchase, or diplomacy. The planner alone owns the payload design. Ion propulsion is in scope, simplified.

Full specification: [Rocket configurator](rocket-configurator.md).

## UI

**User direction:** the map is always visible with a docked side panel for rocket, tasks, and versions. The test runs live on every edit; results show on the map (red trajectory, warning icons) and on the delta-v bar with goal success chances. Part needs are published as shared Tasks one at a time.

Full specification: [Mission planner UI](ui.md).

## Build

**User direction (2026-11-14, [notes](notes/2026-11-14-build-decisions.md)):**

- **Stack:** web, TypeScript, rendering on HTML canvas. Applies to this module.
- **Other roles:** until procurement, science, and communications exist, a dev-controls panel stands in for them: contract a task, deliver a part, raise a research limit, advance the calendar.
- **First authored mission:** Mars orbiter + lander.

**Proposal — Mars orbiter + lander mission content:**

- Start: Earth, agency calendar at the start date (1 Jan 2030).
- **Mission deadline (user direction, 2026-11-14):** one completion deadline per mission instead of a launch deadline; goals achieved after it do not count. Mars: 1 Jul 2033 (proposal) — the first window arrives with margin, the second only with a faster transfer.
- Goals: reach Mars orbit (orbiter); deliver orbital instrument data; land on Mars (lander); deliver surface instrument data.
- Requires: transfer, orbit insertion (or aerocapture), separation, atmospheric landing with heat shield.
- Budget, research limits, and slider ranges per propulsion type: authored with the mission data; values are balancing placeholders.

**User direction (2026-11-14, before building):**

- **Map scale:** a Sun-centred system view plus nested views for Earth, Mars, and Jupiter, opened by clicking the planet.
- **Side panel UI:** Preact; the map is plain canvas.
- **Procurement data format:** defined by the planner and documented in [procurement-interface.md](procurement-interface.md); the procurement module adopts or changes it later.

## Running the app

Since the integration (D-015) the planner is one station view of the integrated game in [`game/`](../game/); its code is in [`game/src/stations/planner/`](../game/src/stations/planner/). How the stations share state: [integration design](../docs/design/integration.md).

```bash
cd game
npm install
npm run dev
```

Open http://localhost:5173 and pick the planner station.

Code layout (under `game/src/stations/planner/`):

| Folder | Contents |
| --- | --- |
| `model/` | Planner types, units and formatting, rocket lookup helpers |
| `data/` | Hand-crafted content: bodies, propulsion types, part rules, missions |
| `physics/` | Ephemeris, Lambert transfers, maneuver costs, staging, live evaluation, playthrough |
| `logic.ts`, `slice.ts` | Planner reducers and its part of the shared game state |
| `map/` | Canvas solar-system map |
| `ui/` | Preact UI: top bar, side panel, Δv bar, popups, heat map, playthrough |

Implementation notes (choices made while building, within the baseline):

- After a branch runs out of delta-v, later maneuvers are still computed "on paper" (states, costs, red trajectory) so the planner can keep planning; the first failing maneuver is marked.
- A maneuver fails the branch only for flight errors (delta-v, TWR, missing equipment, invalid timing, ion power). Destination problems (instrument power, data rate, radiation, Venus heat) block the related data goal but not the flight.
- A default transfer picks the earliest window within 5 % of the cheapest delta-v in the searched range.
- Transfers to a moon or from a moon to its planet use Hohmann timing; their travel-time slider has no effect.
- Radiation is counted at the destination only, not while flying through the Jupiter system.
- The game saves to the browser's local storage; Dev → Reset game starts over.
