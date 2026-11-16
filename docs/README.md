# Documentation index

Start with the [current prototype](current-prototype.md) for implemented missions, station responsibilities, session flow and code ownership. The root [README](../README.md) explains how to play and run locally.

## Current design

| Reference | Purpose |
| --- | --- |
| [Current prototype](current-prototype.md) | Current three-mission implementation and boundaries |
| [Integration architecture](design/integration.md) | Shared state, deterministic actions, task coordination and networking |
| [Science implementation](../game/src/stations/science/README.md) | Engineering tree, hardware tests, facilities and teams |
| [Shared Tasks](design/shared-tasks.md) and [mission flow](design/mission-flow.md) | Current D-021–D-024 board and D-029 attempt flow, with older brainstorm preserved below |
| [Selected audio](notes/2026-11-15-audio-integration.md) | Seven chosen sounds and scoped integration observations |
| [Procurement geometry](notes/2026-11-15-procurement-artwork.md) | Artwork corrections and the checks actually performed |
| [Decision log](decisions.md), [idea register](ideas.md), [question register](questions.md) | Accepted direction, proposals and unresolved research; identifiers remain stable |

## Submission and project evidence

| Reference | Purpose |
| --- | --- |
| [Mission feasibility and four-station verification](playtests/2026-11-16-mission-feasibility.md) | All three missions and research-failure recovery completed; fixed-seed outcomes, budgets and actual network evidence |
| [Finishing-pass implementation](notes/2026-11-16-post-submission-implementation.md) · [verification](playtests/2026-11-16-post-submission-verification.md) | All 36 audit dispositions, concrete browser/build evidence and preserved gameplay/media |
| [Trailer-safe anti-slop pass](notes/2026-11-16-anti-slop-pass.md) · [verification](playtests/2026-11-16-anti-slop-verification.md) | Interaction, copy and internal cleanup while retaining the submitted trailer's station compositions |
| [Submission reference](submission-reference.md) | Current/local delivery artifacts and unknown historical source revision |
| [AI acknowledgement](ai-and-submission.md) | Human contribution, model/tool inventory and historical preparation checklist |
| [Third-party credits](../THIRD_PARTY.md) | Dependencies, fonts, icons, media and source references |
| [Challenge reference](challenge.md) | Official brief and dated resource-review status |
| [Evidence availability](evidence-availability.md) | Retained versus local/ephemeral observation records |
| [Observation template](playtests/TEMPLATE.md) | Future records with build, environment, seed and retention fields |
| [Post-submission audit](reviews/2026-11-16-post-submission-audit.md) | Immutable preimplementation findings and detailed specialist appendices |

The user confirmed submission on November 16, 2026. The [submission-text draft](submission-text.md) and [video script](submission-video-script.md) remain dated preparation artifacts; they do not identify the exact external form or uploaded source revision.

## Persistent project memory

[History and verification archive](history/README.md) links every record from the previous index and surfaces its final disposition. It separates current implementation from original brainstorm, superseded specs, failed iterations and dated walkthroughs. In particular, the broad station restyle was rejected under D-034, audio was subsequently integrated, and HTTPS research includes its later resolution.

Root module directories contain specifications and mockups: [Mission Planning](../mission-planner/README.md), [Procurement](../procurement/README.md), [Science](../science/README.md), and [Communications](../communications/README.md). Their current code lives in `game/src/stations/`.

## How to keep ideas usable

Preserve original notes in `notes/`. Add later input or corrections as dated records; do not silently rewrite history. Capture substantive proposals in the idea register, use stable I/D/Q identifiers, and update the decision log plus affected current documents when a choice is accepted. A provisional implementation, agent critique or planned check is not evidence of human enjoyment or acceptance.

For observed checks, record the exact scope and limitations using the template. Do not add/run tests or commit/push unless authorized by the user and project instructions.
