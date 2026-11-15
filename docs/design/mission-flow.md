# Mission flow ideas

**Status:** brainstorming. The relationship between preparation, real-time play, in-mission events, and the earlier one-shot simulation idea has not been decided.

## Current two-level prototype under D-029

The implementation currently prepares in real time, launches automatically at the planned date, and shows one seeded goal-by-goal playthrough. This observed implementation does not settle the broader campaign brainstorm below. Positive Comms rescue applies only to physically achievable goals with a fallible reliability factor; it cannot supply a missing route, instrument, data capacity or missed deadline. `stayDays` remains the hazard-assessment horizon, not mandatory elapsed science collection.

The host can retry or return the connected group to mission selection after a result. Seats, connections and bounded attempt history survive; the new attempt resets gameplay, starts a new seed, and clears planner UI state. Choosing a mission returns the group through the lobby before starting. See [release audit](../reviews/2026-11-15-two-level-release-audit.md) and [implementation observations](../playtests/2026-11-15-release-fixes-walkthrough.md).

## Earlier mission idea — I-005

Plan and prepare a mission, then simulate it once and either win or fail. Everyone can fail. This is an idea, not an established rule; see the correction to [D-002](../decisions.md#d-002--prepare-then-simulate-once).

## Related ideas

- Begin with a broad destination goal, such as an icy moon or the Moon (I-019).
- Let science, procurement, external communications, and mission planning influence one another (I-001–I-004, I-010–I-012, I-016).
- Planning may use simplified 2D simulations to explore and adjust a mission while planning is ongoing (I-030); these are a separate idea from final mission resolution. Their relationship is open (Q-008).
- Play in real time, switch roles, and respond to events, including possible funding changes during a mission (I-010, I-012, I-013).
- Give every role meaningful activity concurrently, avoiding hard waits on other roles (I-017, D-004).
- Explain an outcome in a debrief (I-007, assistant proposal).
- Connect missions through a roguelite or campaign with overarching progress (I-020, I-021).

## Open design tensions

When does preparation end, what runs in real time, and can players intervene during the simulation? What does one simulation mean if events occur during the mission? Can a mission be revisited, and how does that relate to a campaign? What information and risk do players see before acting? These are questions to explore rather than contradictions to resolve by assumption; see Q-008, Q-010, Q-011, Q-016, and Q-018.
