# Current prototype

Maintained implementation overview, November 16, 2026. This describes the current source, not a claim that every path has been observed in multiplayer. [Decisions](decisions.md) record accepted direction; [history](history/README.md) preserves earlier proposals and observations. The [submission reference](submission-reference.md) distinguishes current files from externally submitted material.

## Game and missions

T-Minus is one web application with four station views and a host-authoritative shared mission. Missions, technology, suppliers, dialogue and possible events are authored. There is no runtime generative AI.

The host's current mission list is registered in [`core/mission.ts`](../game/src/core/mission.ts):

| Mission | Main planning problem |
| --- | --- |
| Weather satellite | Reach geostationary orbit and return weather imagery; optional instrument goals offer more scope. |
| Lunar ice lander | Reach lunar orbit, land and drill for water ice. |
| Mars orbiter + lander | Transfer to Mars, separate spacecraft, map from orbit and conduct surface science. |

The earlier submission-text draft names only Weather and Mars. That draft is preserved; the source now registers all three. No mission was added or removed by this documentation pass, and this overview does not establish which source revision was submitted.

## Four stations

| Station | Current work and cross-role contribution |
| --- | --- |
| Mission Planning | Configure rocket and spacecraft, build/edit the maneuver route in any order, publish part needs, inspect feasibility and choose launch timing. Contracted hardware changes the live design. |
| Procurement | Compare catalogue and Call offers; sign, allocate, amend and cancel contracts; manage the shared budget, facilities and research-team purchases. Contracts remain the inventory records. |
| Science | Follow the engineering tech tree to meet the design's needs, request facilities/teams and test delivered flight hardware. Research progress and access depend on time, supply and Comms effects. |
| Communications | Answer authored stakeholder messages and run projects that affect trust, funding, offers, research or other shared state. Grounded light satire is intentional. |

Shared Tasks carry generated needs/progress and explicit player requests under D-021–D-024. Manual completion changes a coordination record; generated completion follows its underlying game records. Direct conversation remains available. Each player holds one station; D-015 permits switching to an unclaimed station when fewer than four people play.

## Session flow

The host creates or resumes a game, shares a room code/link and starts after the crew claims stations. The agency calendar advances during preparation. Planning can edit non-linearly while the other stations research, buy and negotiate. At the planned launch date, preparation ends and the mission resolves once with goal-specific outcomes. A retry is a fresh attempt, not editing an already flown plan. Host recovery can preserve the connected group and bounded attempt history (D-029).

Connections use PeerJS room setup and WebRTC; manual invite/reply codes remain the fallback (D-015/D-027). Host local saves support continuation when they succeed. Network infrastructure and local storage can fail; the source and recorded walkthroughs do not guarantee a particular venue network.

## Accepted boundaries and open design work

D-004's concurrent meaningful work is the design goal, not a measured guarantee. D-020 selected the engineering tree; the former field-combination graph is historical. D-032 selected facilities and extra teams without per-project assignment or idle charges. D-034 rejected broad station restyling and retained only smaller corners; preserve the accepted title/pre-game design and station identity.

Campaign structure, deeper personnel alternatives, balance, learning outcomes, session pacing and reliable human engagement remain design/research questions. A provisional implementation does not settle every long-term question in the [question register](questions.md). No professionalization change should silently alter goals, score, costs, timings, research grants, reliability, event effects or physics.

## Working on the game

Read [AGENTS.md](../AGENTS.md), this overview, the [decision log](decisions.md), [concept and original brainstorm](concept.md), and [open questions](questions.md). Preserve historical user notes; new input/corrections receive dated records. Keep [ideas](ideas.md), decisions and affected current documents aligned when direction is accepted.

| Location | Ownership |
| --- | --- |
| [`game/src/core/`](../game/src/core/) | Shared model/state, deterministic actions, clock, persistence, coordination and scoring |
| [`game/src/net/`](../game/src/net/) | PeerJS and manual WebRTC transports |
| [`game/src/shared/`](../game/src/shared/) | Shared event engine and UI utilities |
| [`game/src/shell/`](../game/src/shell/) | Title/lobby, station shell, Tasks, confirmations and results |
| [`game/src/stations/`](../game/src/stations/) | Planner, Procurement, Science and Comms logic, authored data and views |
| Root module directories | Specifications, notes and historical mockups; current code lives in `game/` |

Reducers must remain deterministic. UI-only state stays local; shared changes pass through actions. See [integration architecture](design/integration.md). Use the existing `typecheck` and `build` scripts and inspect relevant behavior; project instructions prohibit adding/running tests unless requested. A source diff alone cannot establish visual or multiplayer equivalence. Record what was actually checked using the [observation template](playtests/TEMPLATE.md), including build identity and limitations. Do not commit, push or deploy without authorization.
