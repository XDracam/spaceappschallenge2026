# Communications module

All work for the communications station lives in this folder: specification, notes, and later implementation. This document specifies the final system; it does not describe staged versions.

Labels: **user direction** = stated by the user ([notes](notes/2026-11-14-comms-questions.md)). **Proposal** = suggested by the assistant, not yet accepted.

Related: [shared event system](../docs/design/events.md), [roles](../docs/design/roles.md#communications-and-public-relations--i-002), ideas I-002, I-009–I-012, I-032, I-033, I-072–I-074, questions Q-006, Q-015, Q-030, Q-034. One of four stations, one player each (D-012).

## Role

**User direction:** the comms player manages the agency's relationships with outside parties. Play is both reactive (answering incoming events) and proactive (running projects such as galas, campaigns, and negotiations). Other players do not send requests to comms through the game; they talk to the comms player.

## Stakeholders and trust

**User direction:** four stakeholders, each with its own relationship (trust) level:

| Stakeholder | Covers |
| --- | --- |
| Government / politicians | funding, budget cuts, political demands |
| Industry / suppliers | supplier relations, prices, delivery |
| Public / media | public opinion, press, scandals, protests |
| Foreign agencies + universities | partners for research, parts, instruments, services |

**User direction:** trust levels unlock project options, change the odds of events, and give passive modifiers.

**Proposal:**

- Trust 0–100 per stakeholder, starting at 50. Thresholds: below 30 = strained, above 70 = strong.
- Passive modifiers (examples): strong Industry → procurement prices and delivery times −10 %, strained → +10 %; strong Public → budget cuts smaller; strong Government → budget review more likely to add funding; strong Foreign/universities → more partner deals offered.
- Event odds: strained trust makes that stakeholder's bad events likelier (audit, protest, supplier dispute); strong trust makes opportunities likelier.

## Characters and presentation

**User direction:** recurring characters, one named face per stakeholder; events arrive as messages from them with a portrait and dialogue options (visual-novel feel).

**Proposal — cast (fictional, hand-crafted):** Senator Ana Duarte (Government), Marco Feld, CEO of a launcher supplier (Industry), Lina Okafor, science journalist (Public/media), Dr. Kenji Moreau, director of a partner agency, plus a university dean who appears in academic deals (Foreign + universities).

## Events (comms side)

**User direction:**

- Events come from a scripted mission timeline, from game-state triggers, from random picks out of a hand-authored pool, and from other players' actions. (All events are hand-written, D-005; picking among them at runtime is allowed.)
- About one event per real minute needs the comms player's attention.
- Dialogue options show hints, not numbers: which stakeholders an option affects (↑/↓); exact effects are revealed afterwards.
- Every event has a deadline on the agency calendar; unanswered, it expires with its authored default outcome.
- Comms must be able to tell **external** events (affect only comms: trust) from **internal** events (affect the mission or other stations). See the [shared event system](../docs/design/events.md).

**Proposal — event shape:** character, short message, 2–3 response options (each with stakeholder ↑/↓ hints and an internal/external marker), calendar deadline, and the "ignored" outcome. Example: Lina Okafor: "Sources say your lander uses a plutonium battery. Comment?" → "Explain the safety record" (Public ↑) / "No comment" (Public ↓) / "Invite her to the lab" (Public ↑↑, costs 2 M, internal: science loses a week).

## Projects (proactive)

**User direction:**

- 2–3 projects at the same time.
- Projects cost money from the shared mission budget, calendar time, and sometimes trust with other stakeholders.
- Negotiations can deliver: a part (as an offer to procurement for the planner's task, see [Negotiated parts](#negotiated-parts)), research (raises a research limit or unlocks a variant), money (grants, sponsorship), or services (e.g. a partner's ground station, a launch slot, a test facility).

**Proposal — project types:**

| Project | Typical cost | Result |
| --- | --- | --- |
| Gala / outreach event | money, 1–2 months | trust ↑ with one or two stakeholders |
| Press campaign | money, 1 month | Public ↑, can defuse a pending protest |
| Lobbying | time, Industry or Public ↓ | Government ↑, budget review more favourable |
| Negotiation with a partner | months, often trust ↓ with Government ("foreign dependence") | part, research, money, or service |

Three slots; the third opens at strong trust with any stakeholder (proposal within the user's 2–3 range).

## During the flight

**User direction:** a few authored in-flight comms events, decided automatically by trust levels at launch (e.g. strong Government trust → funding continues). Not too many, and their impact must not be very bad. Science and procurement could get the same kind of in-flight events (see [shared event system](../docs/design/events.md#in-flight-events)).

## Station screen

**User direction:** layout A, inbox-centred ([mockup](mockups/layouts.html), same glass sci-fi style as the planner):

- Top: the four trust meters.
- Left: inbox of events, each with its character and calendar deadline.
- Centre: the open conversation: portrait, message, response options with stakeholder ↑/↓ hints and a marker when an option affects another station.
- Right: project slots (2–3) with progress and an empty slot to start a project.
- Bottom: the shared news feed.
- Header like every station: agency date, budget, launch.

## Negotiated parts

**User direction:** a successful negotiation for a part becomes an **offer to procurement**: a cheap (often free) offer in procurement's list for the planner's task. Procurement still decides and signs.

## Staff and scoring

**User direction:**

- No staff: the 2–3 project slots are the only limit (revisit if a shared personnel system is decided).
- The mission result counts goals only. Trust levels matter through their effects during play and through the auto-resolved in-flight events in the final playthrough (see [During the flight](#during-the-flight)).

## Build

**User direction (2026-11-14):** a standalone app in `app/` with the planner's stack (Preact, TypeScript, Vite); a dev drawer stands in for the other stations until they connect (Q-012); shared event-system code lives in the top-level [`shared/`](../shared/) folder. Claude drafts the content (events, characters, projects, trust numbers) as the baseline; tone is light satire, grounded; portraits are stylised initials.

```bash
cd communications/app
npm install
npm run dev
```

Open http://localhost:5175 (the planner uses 5173, science 5174).

**Status (2026-11-14):** built and checked in the browser at 1440×900: briefing (calendar waits), events arriving and expiring with their default outcome, answering with revealed outcomes, projects, flag-triggered event chains (RTG flag → plutonium story → protest), news feed, and the dev drawer's outbox of effects for the other stations. Content: 5 characters, 34 events (8 timeline, 11 triggered, 15 pool), 10 projects, 5 in-flight events — Claude-drafted baseline, tone light satire. Not integrated with the other stations (Q-012); not playtested.

| Folder | Contents |
| --- | --- |
| `app/src/data/` | Hand-authored content: characters, events, projects, in-flight events; mission constants |
| `app/src/model/` | Comms types |
| `app/src/state/` | Game state, calendar, actions, dev stand-ins |
| `app/src/ui/` | Preact UI (layout A) |
| `../shared/events/` | Shared event types and engine for all stations |

## Open questions

1. Event content for the Mars mission: the authored timeline, triggers, and pool (how many events, which characters).
2. Exact trust numbers, thresholds, and modifier sizes (proposals above).
3. Project catalogue: which projects exist, their costs and durations.
