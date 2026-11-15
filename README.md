# Space Mission Design Game

Prototype workspace for the [2026 NASA Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/).

**Stage:** playable multiplayer prototype. The integrated game has four connected stations and two authored missions: **Weather satellite** and **Mars orbiter + lander**. The earlier [mission-planner app](mission-planner/README.md#running-the-app) and [procurement interaction prototype](procurement/mockups/README.md) remain as development references.

A multiplayer game about making mission planning and communication fun. Four players operate Mission Planning, Procurement, Science and Communications from separate seats. The key design goal is meaningful concurrent activity for every role. This remains a prototype: broader mechanics and campaign structure are open, and implemented actions alone do not establish multiplayer enjoyment.

## Start here

- [Documentation index](docs/README.md) — where ideas, decisions, and evidence live.
- [Concept brief](docs/concept.md) — current direction and boundaries.
- [Roles and interactions](docs/design/roles.md) — procurement, communications, science, and planning.
- [Prototype plan](docs/prototype.md) — proposed first experiment and evidence to collect.
- [Open questions](docs/questions.md) — unresolved design choices.
- [Brainstorm](docs/brainstorm.md) — organized ideas, alternatives, and open tensions.
- [Original notes](docs/notes/2026-11-14-kickoff.md) and [follow-up](docs/notes/2026-11-14-brainstorm.md) — source material preserved verbatim.

## Running the game

The integrated game lives in [`game/`](game/) (one web app, four station views; see [D-015](docs/decisions.md#d-015--integration-architecture) and the [integration design](docs/design/integration.md)).

- **Online:** https://missioncontrol.dractec.com/ (GitHub Pages; deployed by `.github/workflows/pages.yml` on every push to `main` that touches `game/`). The workflow reads the site's base path from GitHub Pages configuration.
- **Locally:** `cd game && npm install && npm run dev`, then open the printed address.

**Playing together.** There is no game server: one player's browser hosts the game and the others connect to it directly (WebRTC). Connecting takes one exchange of codes per player, through any chat:

1. The host clicks **New game**, chooses a mission to host, picks a station and clicks **Invite a player**. They send the **invite code** to the player.
2. The player clicks **Join game**, pastes the invite code and sends back the **reply code** shown.
3. The host pastes the reply code into that invite. The player is connected and picks a free station. The host clicks **Start mission** (fewer than four players is fine; anyone can switch to a free station during the game).

The host's browser attempts to save locally; watch for a save warning if storage is unavailable or full. After a successful save, **Continue** restores it following a reload, and players join again with new codes. Some networks (company or school Wi-Fi, VPNs) block direct browser connections; try another network or play on one computer by opening the game in several tabs or windows. Check the actual demonstration network beforehand. Keep the host tab visible: background browser throttling can slow the agency calendar.

### First session

1. Start with **Weather satellite**. Connect and claim all four stations before starting the calendar. Use the station menu to pause while explaining the controls.
2. Planning adds maneuvers and publishes part needs. Procurement compares offers and orders against the launch date. Science researches the design's missing capabilities, then prioritizes tests of delivered parts. Communications chooses projects and handles messages that affect the whole team.
3. Read shared **Tasks** and use **Open work** to reach the relevant station action. Direct conversation remains useful, but required coordination is also available in the interface.
4. Watch research, delivery and test dates. The planned launch is automatic; move it when recovery needs more time, while respecting the mission deadline.
5. Review the goal-by-goal result. The host can retry or choose another mission inside the session; a host reload still requires new invitation codes.

The [release audit](docs/reviews/2026-11-15-two-level-release-audit.md) contains facilitator reference routes and distinguishes numerical feasibility from observed play. Use Mars after the group understands the station loops.

## Repository

[XDracam/spaceappschallenge2026](https://github.com/XDracam/spaceappschallenge2026)

This checkout is connected through `origin`.

## License

Copyright 2026 Space Mission Design Game contributors.

Original project code, documentation and assets are licensed under the [Apache License 2.0](LICENSE), except where a separate notice states otherwise. Third-party materials retain their own licenses, including the [Lucide icon license](procurement/mockups/icons/LICENSE). Dependencies retain their upstream licenses. The game loads Exo 2 and Inter through Google Fonts; those fonts retain their upstream SIL Open Font License 1.1 terms.

Apache 2.0 is an OSI-approved license and the default specified by the [2026 NASA Space Apps participant terms](https://www.spaceappschallenge.org/legal/) (checked November 15, 2026). This license grants no rights to NASA branding and does not imply NASA endorsement. Submission references must still credit resources used; this license does not replace those credits.

[Third-party credits and submission references](THIRD_PARTY.md) list the libraries, fonts, prototype icons, research sources and locked dependencies. [Full third-party notices](game/public/THIRD_PARTY_NOTICES.txt) ship with every game build at `THIRD_PARTY_NOTICES.txt`; the project license ships at `LICENSE.txt`. Preserve these files when distributing the built game.

## Working on the prototype

1. Read the concept, decision log, and open questions.
2. Capture new ideas in the [idea register](docs/ideas.md), with their source and status.
3. Explore mechanics in the design docs. Label proposals explicitly.
4. Record accepted choices in the [decision log](docs/decisions.md), linking the affected docs.
5. Record observations using the [playtest template](docs/playtests/TEMPLATE.md). A planned experiment is not evidence.

The [prototype plan](docs/prototype.md) retains the original experiment proposals. [Recorded walkthroughs and agent playtests](docs/README.md) document what has actually been observed and their limitations; they do not certify player enjoyment or connectivity on a different network.
