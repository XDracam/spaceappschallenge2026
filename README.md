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

- **Online:** https://xdracam.github.io/spaceappschallenge2026/ (once GitHub Pages is enabled; deployed by `.github/workflows/pages.yml` on every push to `main` that touches `game/`).
- **Locally:** `cd game && npm install && npm run dev`, then open the printed address.

**Playing together.** There is no game server: one player's browser hosts the game and the others connect to it directly (WebRTC). Connecting takes one exchange of codes per player, through any chat:

1. The host clicks **Host a new game**, picks a station and clicks **Invite a player**. They send the **invite code** to the player.
2. The player clicks **Join a game**, pastes the invite code and sends back the **reply code** shown.
3. The host pastes the reply code into that invite. The player is connected and picks a free station. The host clicks **Start mission** (fewer than four players is fine; anyone can switch to a free station during the game).

The game is saved in the host's browser. If the host reloads, **Resume hosted game** continues it and players join again with new codes. Some networks (company or school Wi-Fi, VPNs) block direct browser connections; try another network or play on one computer by opening the game in several tabs or windows.

## Repository

[XDracam/spaceappschallenge2026](https://github.com/XDracam/spaceappschallenge2026)

This checkout is connected through `origin`. Initial setup adds local documentation only; it does not publish commits or select a license.

## Working on the prototype

1. Read the concept, decision log, and open questions.
2. Capture new ideas in the [idea register](docs/ideas.md), with their source and status.
3. Explore mechanics in the design docs. Label proposals explicitly.
4. Record accepted choices in the [decision log](docs/decisions.md), linking the affected docs.
5. Record observations using the [playtest template](docs/playtests/TEMPLATE.md). A planned experiment is not evidence.

The [prototype plan](docs/prototype.md) suggests ways to explore the ideas; no experiment has been selected or run. Runtime setup instructions belong here once an implementation exists.
