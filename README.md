# T-Minus

Prototype workspace for the [2026 NASA Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/).

**Stage:** playable multiplayer prototype. The integrated game has four connected stations and two authored missions: **Weather satellite** and **Mars orbiter + lander**. The earlier [mission-planner app](mission-planner/README.md#running-the-app) and [procurement interaction prototype](procurement/mockups/README.md) remain as development references.

A multiplayer game about making mission planning and communication fun. Four players operate Mission Planning, Procurement, Science and Communications from separate seats. The key design goal is meaningful concurrent activity for every role. This remains a prototype: broader mechanics and campaign structure are open, and implemented actions alone do not establish multiplayer enjoyment.

## AI generation and human contribution

**The human team created the concept and designed the gameplay. All original project code was AI-generated.** The team supplied the cooperative premise, role responsibilities, intended decisions, requirements and feedback, and chose which proposed changes to accept.

All original project code was written by OpenAI Codex and Anthropic Claude under the human team’s direction. All project images, including the title-screen artwork, were generated with ChatGPT Images. Supporting project content, documentation and submission copy were also AI-generated. AI assistance also included implementation suggestions and agent-operated reviews and walkthroughs. Those checks are not independent human validation. Original human notes are preserved in `docs/notes/`, with explicit publication redactions; third-party libraries, fonts, research sources and audio candidates retain their own authorship and licenses.

AI generation happened during development. Missions, dialogue and other game content are prepared in advance; the game does not use generative AI to create content during play.

### Models and tools used

- **Anthropic Claude:** Opus 5.5, Fable 5.2 and Sonnet 5.5 for code, docs and design (see `Co-Authored-By` commit trailers); Sonnet and Haiku as agent players and helpers in the [playtest loop](playtest/README.md).
- **OpenAI Codex**, including GPT-6 Astra, Terra and Luna and GPT-6.1 Sol: concept work, documentation, implementation, SVG icon generation, source review and walkthroughs recorded in [`docs/playtests/`](docs/playtests/).
- **ChatGPT Images (OpenAI):** Communications character portraits and title-screen artwork, watermarked "AI-generated" (see [third-party credits](THIRD_PARTY.md)).

### Submission disclosures still to complete or verify

The [official 2026 Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) was checked November 15, 2026. It requires disclosure of where and how AI was used, visible watermarks on AI-generated images/video, and acknowledgement in descriptive text and metadata for AI-generated code/data/audio. Generated content must not use, contain or modify NASA branding or design elements.

This README supplies a public descriptive acknowledgement. **It does not establish that asset watermarks, metadata, the deployed game, demo or submission form meet every requirement.** Before submission:

- Identify AI use in the submission's AI disclosure field and retain a public acknowledgement with the final project.
- Check all generated images/video, including the title artwork and demo materials, for visible AI-generation watermarks; add any missing labels.
- Include AI-generation acknowledgements in the applicable code/data/audio descriptions and metadata. Review any added audio by provenance: third-party recordings need their own credits and license notices.
- Complete the submission's References field for all resources actually used, including tools and third-party assets. A repository license or credits link alone does not replace that field.

[Copy-ready submission text](docs/submission-text.md) contains the project description, AI disclosure and an internal submission checklist. Completion of the submission and acceptance for judging have not been established by this README.

## Scientific scope and validation

This is a game with simplified orbital mechanics and fictional suppliers, prices, research progression and events. Its numerical models are not validated for operational mission planning. Human learning outcomes, multiplayer enjoyment and sustained engagement across all roles have not been established by the recorded agent walkthroughs.

The team reviewed the JPL paper [*Space Mission Concept Development Using Concept Maturity Levels*](https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299) as a conceptual design reference for iterative mission development, parallel specialties, acquisition timing and cost/risk trade-offs; see the [review and its limitations](docs/reviews/2026-11-14-cml-paper.md). This is conceptual resource use, not ingestion of a NASA observational dataset or implementation of a formal NASA maturity assessment. The challenge's other listed resources are research leads unless a documented review establishes their use.

## Start here

- [Documentation index](docs/README.md) — where ideas, decisions, and evidence live.
- [Concept brief](docs/concept.md) — current direction and boundaries.
- [Roles and interactions](docs/design/roles.md) — procurement, communications, science, and planning.
- [Prototype plan](docs/prototype.md) — proposed first experiment and evidence to collect.
- [Open questions](docs/questions.md) — unresolved design choices.
- [Brainstorm](docs/brainstorm.md) — organized ideas, alternatives, and open tensions.
- [Original notes](docs/notes/2026-11-14-kickoff.md) and [follow-up](docs/notes/2026-11-14-brainstorm.md) — source material preserved with explicit publication redactions.

## Running the game

The integrated game lives in [`game/`](game/) (one web app, four station views; see [D-015](docs/decisions.md#d-015--integration-architecture) and the [integration design](docs/design/integration.md)).

- **Online:** https://missioncontrol.dractec.com/ (GitHub Pages; deployed by `.github/workflows/pages.yml` on every push to `main` that touches `game/`). The workflow reads the site's base path from GitHub Pages configuration.
- **Locally:** `cd game && npm install && npm run dev`, then open the printed address.

**Playing together.** One browser hosts the shared mission; the others connect through WebRTC.

1. The host clicks **New game**, chooses a mission and station, and shares the short **room code** or join link.
2. Players click **Join game**, enter their names and the room code, then choose free stations. Opening a join link pre-fills the code.
3. The host starts the mission. Fewer than four players is supported; anyone can switch to a free station.

The public PeerJS broker handles room setup, with a public TURN relay available for connections that cannot be direct. Check the actual demonstration network beforehand. If room codes are unavailable, expand the host's **Manual codes** fallback: exchange an invite and reply code once per player. A long MC1- invite can be pasted into the same join field.

The host's browser attempts to save locally; watch for a save warning if storage is unavailable or full. After a successful save, **Continue** restores it following a reload. Room players can rejoin using the room code when the host reclaims it; manual-code players need fresh codes. Keep the host tab visible: background browser throttling can slow the agency calendar.

### First session

1. Start with **Weather satellite**. Connect and claim all four stations before starting the calendar. Use the station menu to pause while explaining the controls.
2. Planning adds maneuvers and publishes part needs. Procurement compares offers and orders against the launch date. Science researches the design's missing capabilities, then prioritizes tests of delivered parts. Communications chooses projects and handles messages that affect the whole team.
3. Read shared **Tasks** and use **Open work** to reach the relevant station action. Direct conversation remains useful, but required coordination is also available in the interface.
4. Watch research, delivery and test dates. The planned launch is automatic; move it when recovery needs more time, while respecting the mission deadline.
5. Review the goal-by-goal result. The host can retry or choose another mission inside the session; a host reload requires players to rejoin (fresh codes for the manual fallback).

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
