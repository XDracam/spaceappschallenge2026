# Science station — engineering tech tree (D-020, merged to main)

Science researches **engineering upgrades** for the planner (higher engine Isp/thrust, better cameras, more power,
new part types). It is a tech tree: techs have prerequisites, and several routes can reach the same result.

- **Resource planning decides buy or develop.** Procurement's inspector for a need beyond research has
  "Ask science to develop it" (creates `research.requests`) next to "Open a Call" (buy a tender at 1.5–3×).
- **Science finds the route.** Requested goals are marked ★. Fog hides techs more than 2 steps beyond the researched ones.
- **Comms enables or blocks.** `techAccess` effects (comms events/projects) block a tech (running projects pause)
  or enable a gated one (`Tech.gate`: nuclear, laser link). See `comms/data/projects.ts` and `eventsTriggered.ts`.
- A project spends its cost at once, runs months, and rolls success with the shared rng. Success raises
  `research.limits` / `research.unlocked`; requests close when their goal is met.

Files: `data/techs.ts` (authored placeholder content, D-005), `model/tree.ts` (layout, fog, start rules),
`model/research.ts` (labels, request coverage), `logic.ts` (actions + tick), `ui/App.tsx`, `slice.ts`.
Not modelled: mass/cost reductions (Q-037). Removed from main's version: knowledge graph, bench, recipes, field findings.

Missions: the tree uses the same research keys as both missions (Mars, weather satellite), so it works unchanged.
Comms approval projects exist in both comms content sets (`mars/`, `weather/`); the block events exist for Mars only.
Saves: state version 3 resets the science slice and drops old projects (persist.ts `migrateV2`).
