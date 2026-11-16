# Anti-slop pass — 2026-11-16

The user requested a full pass over telltale generated-software patterns, then clarified that the submitted trailer must remain the visual contract. The reference is `game/public/submission/T-Minus-Submission.mp4`.

## Direction applied

- Preserve the trailer-visible Planner map, rocket panel, bottom strip, launch/result presentation, Procurement needs/catalogue/inspector composition, Science three-column tree, and Communications trust/inbox/conversation/projects layout.
- Retain the accepted glass, glow, pill and colored-edge vocabulary where it is part of that identity. Detector heuristics alone do not override the submitted visual reference.
- Concentrate on misleading feedback, invented selection, dead or duplicate controls, hidden blockers, weak keyboard/focus behavior, repetitive authored prose, inconsistent terminology, duplicate network primitives and oversized coordination modules.
- Defer broad restyling, a replacement Science default view, a reorganized Communications project gallery and global type-scale changes because they would make the running game diverge from the trailer.

## Implemented scope

The pass covers the shell and task board, Planner result/briefing interactions, Procurement actions and catalogue state, Science tree navigation, Communications commitments and authored mission prose, and shared coordination/network internals. Host-confirmed outcomes now replace optimistic success claims where authority is remote. Disabled actions expose reasons, destructive session actions use in-game confirmation, results retain their full log, and keyboard focus/navigation is explicit in the affected interfaces.

The coordination implementation was split into typed derivation and normalization modules without changing its exported surface. A shared listener primitive replaces duplicated PeerJS/manual-WebRTC listener code. Communications edits change display prose only; mission identifiers, conditions, effects, costs and timing were retained.

Verification and its limits are recorded in [the accompanying implementation check](../playtests/2026-11-16-anti-slop-verification.md). This work is not evidence of human multiplayer enjoyment or venue-network resilience. No commit or push was requested.
