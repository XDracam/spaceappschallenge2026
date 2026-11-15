# Science station — engineering tech tree (D-020, merged to main)

Science researches **engineering upgrades** for the planner (higher engine Isp/thrust, better cameras, more power,
new part types). It is a tech tree: techs have prerequisites, and several routes can reach the same result.

- **Science sees what the design needs.** Every part of the planner's rocket that is beyond research and not under
  contract yet is listed under "The mission needs" (`model/research.ts` `designNeeds`, derived, never stored), with the
  day research has to finish for the part to arrive before launch. Changed by playtest 1115m-r01 (see
  `playtest/changes.md`): before, Procurement had to press "Ask science to develop it" (`research.requests`, removed).
- **Resource planning still decides buy or develop**: wait for Science, or "Open a Call" (a tender at 1.5–3×). The need
  in Procurement shows how far Science is.
- **Science finds the route.** The shortest routes to a need are marked ★. Fog hides techs more than 2 steps beyond the researched ones.
- **Comms enables or blocks.** `techAccess` effects (comms events/projects) block a tech (running projects pause)
  or enable a gated one (`Tech.gate`: nuclear, laser link). See `comms/data/projects.ts` and `eventsTriggered.ts`.
- A project spends its cost at once, runs months (times the mission's `researchTimeFactor`: 0.5 for the weather
  satellite), and rolls success with the shared rng. Success raises `research.limits` / `research.unlocked`.

Files: `data/techs.ts` (authored placeholder content, D-005), `model/tree.ts` (layout, fog, start rules),
`model/research.ts` (labels, request coverage), `logic.ts` (actions + tick), `ui/App.tsx`, `slice.ts`.
Not modelled: mass/cost reductions (Q-037). Removed from main's version: knowledge graph, bench, recipes, field findings.

Missions: the tree uses the same research keys as both missions (Mars, weather satellite), so it works unchanged.
Comms approval projects exist in both comms content sets (`mars/`, `weather/`); the block events exist for Mars only.
Saves: state version 3 resets the science slice and drops old projects (persist.ts `migrateV2`); version 4 drops `research.requests`.
