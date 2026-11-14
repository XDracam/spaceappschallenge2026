# Decision log

This log records explicit project direction. Proposed mechanics remain in [ideas](ideas.md) until accepted. All initial decisions are sourced from the [November 14 kickoff](notes/2026-11-14-kickoff.md).

## D-001 — Work in the prototype phase

- Date: 2026-11-14
- Status: accepted user direction
- Decision: treat this as prototype work.
- Rationale: the user explicitly identified the current phase.
- Consequence: keep mechanics and implementation choices proportional to the question being explored. This does not itself choose a paper prototype or technology stack.
- Related: [prototype proposal](prototype.md), I-006, Q-012.

## D-002 — Prepare, then simulate once

- Date: 2026-11-14
- Status: reclassified as brainstorming on 2026-11-14, following the user's clarification; retained for history.
- Originally recorded: the mission is planned and prepared, then simulated once, producing a win or failure; everyone can fail.
- Correction: this was recorded too strongly as an accepted rule. It remains an idea, including the possibility everyone fails. Real-time play and a campaign are also ideas; their relationship to this flow is open.
- Unresolved: timing of the simulation, preparation and live events, cooperative versus competitive outcomes, success thresholds, uncertainty, and reuse of a design.
- Related: I-005, [mission flow](design/mission-flow.md), Q-002, Q-004, Q-008, Q-011.

## D-003 — Persist ideas in structured documentation

- Date: 2026-11-14
- Status: accepted user direction
- Decision: keep structured project documentation that preserves all substantive ideas.
- Rationale: explicit setup request.
- Consequence: keep source notes, an idea register, accepted decisions, unresolved questions, current design, and future experiment evidence linked. Markdown is the initial setup format, not a game technology decision.
- Related: [documentation workflow](README.md).

## D-004 — Keep every role engaged concurrently

- Date: 2026-11-14
- Status: key design requirement stated by the user; implementation remains open.
- Intent: give every role something meaningful to do at the same time; avoid hard dependencies that leave someone idle, waiting for another role.
- Related: [brainstorm notes](notes/2026-11-14-brainstorm.md), I-017, Q-014.

## D-005 — Hand-crafted content baseline

- Date: 2026-11-14
- Status: user-stated baseline.
- Direction: no runtime dynamic generation; hand-craft missions, part lists, possible events, and similar content.
- Source: [personnel and roles notes](notes/2026-11-14-personnel-tasks-roles.md).
- Open boundary: whether and how authored content can be selected, varied, combined, or revealed at runtime, and how player-created tasks relate to this baseline. Do not assume that all randomness or changing state is prohibited. See Q-026.
- Related: I-023, [shared tasks](design/shared-tasks.md), Q-026.

## D-006 — Four players on four separate stations

- Date: 2026-11-14
- Status: accepted user direction
- Decision: the game is multiplayer for four people by default. Each player operates their own station from a separate seat. During game time players do not switch or share stations.
- Source / approval: [player stations note](notes/2026-11-14-player-stations.md).
- Rationale and evidence: user decision. Empty Epsilon is an acceptable reference for this **design** choice: one player per station, each with their own seat.
- Alternatives considered: switching roles at any time (I-013, now superseded for game time) and shared roles (Q-001).
- Consequences and limitations: every station is always occupied, so the unattended-role question no longer applies at the default player count. This is not a technical architecture choice. How stations connect, the platform, and the network stay open in Q-012. Play with fewer players is deferred (I-014); four is the default for now. Which responsibility each station covers follows the role brainstorm in [roles](design/roles.md) and is not fixed by this decision.
- Related ideas, questions, and docs: I-013, I-014, I-034, Q-001 (closed), Q-012 (open), Q-016 (partly closed), [roles](design/roles.md).

## Future decision template

```markdown
## D-### — Title

- Date: YYYY-MM-DD
- Status: proposed / accepted / superseded by D-###
- Decision:
- Source / approval:
- Rationale and evidence:
- Alternatives considered:
- Consequences and limitations:
- Related ideas, questions, and docs:
```
