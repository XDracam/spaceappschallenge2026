# Shared event system

**Status:** project-wide design; used by all four stations. Source: [communications questions](../../communications/notes/2026-11-14-comms-questions.md). Labels: **user direction** / **proposal**.

## Principle

**User direction (2026-11-14):** one event system works the same on every station. Every station can, under some circumstances, trigger events that can affect anything. Players see them like a news feed. It must be clear which events are **external** (for comms only) and which are **internal** (affect the mission or other stations).

## External vs internal

| | External event | Internal event |
| --- | --- | --- |
| Concerns | the agency's outside relationships | the mission or another station's work |
| Effects | trust levels only | budget, contracts, deliveries, research limits/unlocks, mission constraints, goals |
| Who sees it | comms station | every station it affects, plus a line in the shared news feed |
| Example | a journalist asks for an interview | budget cut −50 M; supplier delivery delayed 2 months; new goal "add a spectrometer" |

**Proposal:** an event is external or internal by its effects: if any outcome touches anything other than trust, it is internal. Dialogue options mark internal outcomes so comms knows a choice affects teammates.

## Sources

**User direction:** scripted mission timeline (authored dates), game-state triggers (conditions on the shared state), random picks from an authored pool, and other players' actions. All event content is hand-written (D-005).

**Proposal — examples per station:**

| Triggered by | Example |
| --- | --- |
| Planner | an RTG in the design → public protest (comms); launch date moved → supplier asks for a rush fee (procurement) |
| Procurement | contract cancelled → supplier complains publicly (comms); cheapest bid picked → quality audit (procurement) |
| Science | research project fails → press ridicule "rock from space" (comms); breakthrough → university offers a partnership |
| Comms | gala → sponsor offers money; foreign deal → government demands a domestic supplier (procurement) |
| Timeline | budget review in March; election in 2031 |

## News feed

**Proposal:** every station shows the same compact feed of internal events (headline, affected stations, effect: "Budget −50 M after press scandal"). Events needing a decision appear only on the station that owns the decision; the others see the outcome.

## In-flight events

**User direction:** a few authored in-flight events, resolved automatically from the state at launch — few in number and never very harsh. Comms' are resolved by trust levels; science and procurement may get the same kind.

**Proposal:** at most one per station per mission; outcomes nudge success chances or goal results slightly (e.g. comms: strong Government trust keeps funding for extended science; science: high research level resolves an instrument glitch; procurement: reliable suppliers send a software patch).

## Open questions

See Q-033.
