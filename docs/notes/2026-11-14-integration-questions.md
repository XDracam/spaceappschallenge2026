# Integration questions — November 14, 2026

Source: multiple-choice answers in a Claude Code session ("do you have open questions before integrating this all together?"). Each line gives the question and the user's answer; free text is quoted verbatim.

## Round 1

- How do the four stations connect (Q-012)? → "Host browser, peer-to-peer" (one station's browser holds the authoritative game state; the others connect via WebRTC)
- Code organisation? → "One app, 4 station views (Recommended)" (single Vite app with a view per station sharing one game-state module and types; station folders keep their docs)
- Who finishes Science and Procurement to the planner/comms level? → "I do it as part of integration" (the assistant builds both out while integrating; teammates review)
- Where must it run for the hackathon? → "Online for judges"

## Round 2

- Signaling for peer-to-peer? → "Copy-paste connection codes" (host and each player exchange codes manually; no third-party service)
- Deployment? → "GitHub Pages (Recommended)"
- Fewer than four players? →
  > id say everyone can hop to unclaimed stations
- Terminology for the integrated game? → "Show me both first"; after a side-by-side comparison of the planner's Task/Contract and procurement's D-006 terms: "Procurement's D-006 terms (Recommended)" (superset: the planner's "Order part" creates a shared Task whose criteria are the slider minimums; procurement works with Resources, Offers, Calls, Contracts and Allocations; the planner keeps its UI wording)
