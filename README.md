# Space Mission Design Game

Prototype workspace for the [2026 NASA Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/).

**Stage:** prototype. The [mission-planner app](mission-planner/README.md#running-the-app) and separate [procurement interaction prototype](procurement/mockups/README.md) are available. Shared integration remains open.

A multiplayer-focused brainstorming project about making mission planning and communication fun. By default, four players each operate their own station from a separate seat (see [D-012](docs/decisions.md#d-012--four-players-on-four-separate-stations)). Players could work in real time across science, procurement, planning, and external relations. A key design goal is to give every role meaningful activity at the same time, without leaving someone waiting on another role. The mechanics and overall structure remain open.

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

1. The host clicks **Host a new game**, picks a station and clicks **Invite a player**. They send the **invite code** to the player.
2. The player clicks **Join a game**, pastes the invite code and sends back the **reply code** shown.
3. The host pastes the reply code into that invite. The player is connected and picks a free station. The host clicks **Start mission** (fewer than four players is fine; anyone can switch to a free station during the game).

The game is saved in the host's browser. If the host reloads, **Resume hosted game** continues it and players join again with new codes. Some networks (company or school Wi-Fi, VPNs) block direct browser connections; try another network or play on one computer by opening the game in several tabs or windows.

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

The [prototype plan](docs/prototype.md) suggests ways to explore the ideas; no experiment has been selected or run. Runtime setup instructions belong here once an implementation exists.
