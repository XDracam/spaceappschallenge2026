# Mission planner: build decisions — November 14, 2026

Source: multiple-choice answers in a Claude Code session, asked as the open questions blocking implementation. Each line gives the question and the user's chosen option.

- Which tech stack? → "Web: TypeScript + canvas (Recommended)" (runs in browser, easy to share for hackathon judging, easy multiplayer later via websockets)
- The other roles don't exist yet; how does the planner get contracts, deliveries, research limits? → "Dev controls (Recommended)" (debug panel: contract a task, deliver a part, raise a research limit, skip calendar)
- How to treat the details marked as Claude's proposals (body table, maneuver types, Δv formulas, warnings, ion rules, refund curve, UI layout)? → "Accept all as baseline (Recommended)" (mark them accepted; change them as building reveals problems)
- Which hand-crafted mission gets authored first? → "Mars orbiter + lander (Recommended)" (transfer, insertion, separation, atmospheric landing with heat shield; frequent windows)

## Before building

- Map scale? → "System view + nested views (Recommended)" (Sun-centered overview; click a planet to open its own view; back button returns)
- Side panel UI library? → "Preact (Recommended)" (map stays plain canvas)
- Procurement task data format? → "Planner defines, documented (Recommended)" (planner defines task/offer/contract types in one shared file and documents them; procurement module adopts or changes it later)
- After the build is verified in the browser? → "Commit + push to main"
