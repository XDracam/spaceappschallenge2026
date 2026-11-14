# Science module

Specs and notes for the science role live in this folder. The code now lives in the integrated game app: [`game/src/stations/science/`](../game/src/stations/science/) (D-015, see [integration design](../docs/design/integration.md)). The standalone prototype that used to live in `science/app` was moved there.

Labels: **user direction** = stated by the user. **Proposal** = suggested by the assistant. Source: [science module note](../docs/notes/2026-11-14-science-module.md).

## What it is

**User direction:** the science player is a senior researcher who starts with a large knowledge base, shown as a research-field graph. Players explore it, read a factual description of each field, and draft projects by combining two or three fields (alchemy-style). Relabeling was dropped. Data analysis is deferred. Science must not feel like an idle game.

**Proposal, placeholder content:** about 126 known fields in seven disciplines plus 8 unknown ones; 33 hand-authored recipes (D-005): 26 engineering recipes that raise the planner's research limits or unlock parts, and 7 pure-science recipes that raise flags and news. All costs, durations, odds and gains are balancing placeholders. Field descriptions are assistant-written and need a fact check.

## How it works now (integrated)

1. **Field map and bench** (local UI state): select fields, add two or three to the bench, Combine. A hit is a project idea (recipe) and goes into the shared idea notebook (`science.discovered`). Two established fields are textbook territory; anything else can be drafted as a cheap long shot.
2. **Requests from Mission Planning** (left rail): the planner's shared Tasks (`authorRole 'planner'`, open, with `beyondResearch` keys). Each key shows the current limit vs. what the order needs, whether it is covered, and the ideas that can answer it: found ideas get a Draft button, unfound ones are counted. Opening a request marks those ideas' fields on the map, but the player still has to find the combination.
3. **Draft a project**: scope (Safe: half the gain, better odds, cannot unlock; Balanced; Bold: double gain, worse odds, slower, dearer) and method (archive, new measurements, model only) change cost, duration and odds. The side panel shows the effects (limit from → to), which requests it answers and whether it meets them, and the needs. With new measurements, some ideas can post a test-unit Task to Procurement (`authorRole 'science'`); if it is delivered in time, the odds rise by 10 points.
4. **Start** (`science/startProject`): the cost is spent from the shared budget at once; the project goes into `research.projects` with `endsAt = today + months × 30.44`. Up to 3 projects run at the same time (`science.slots`, "teams"). The map, bench and drafting stay usable while projects run.
5. **Calendar** (`onTick('science')`): comms `researchPace` modifiers move `endsAt` while active and expire at `untilDay`. At `endsAt` the project is rolled with the shared seeded rng: success applies its effects (`research.limits[key] = max(old, value)`, `research.unlocked`, flags) and posts news; a success that answers a planner request sets `research.breakthrough` and tells the planner whether the order is now within research. Failure sets `research.failed` and posts a "we found a rock"-style news line. `science/cancelProject` stops a project and refunds half of the unspent share.
6. **UI**: top bar with date, budget available of total, launch countdown and teams busy (no pause); research calendar with running projects as bars (today and launch marked) and a results list; small shared news feed in the left rail.

Coverage: every research limit and every locked variant of the Mars mission (`engine.*.isp`, `engine.kerolox/hydrolox.thrustKN`, the four instruments, `power.solar/rtg.outputKW`, `antenna.standard.dataRateKbps`, `radShield/heatProtection.standard.level`; unlocks `engine.ion`, `tank.ion`, `instrument.radar`, `power.rtg`) has at least one recipe. Gains are capped at the planner's slider maximum.

## Layout

- `slice.ts` science part of the shared state (slots, idea notebook, per-project scope/method/test task)
- `logic.ts` reducers (`discover`, `startProject`, `cancelProject`) and the tick handler
- `model/research.ts` pure rules shared by reducers and UI (project plans, key labels, request coverage)
- `data/` fields, descriptions, recipes, flavour lines (content)
- `ui/` components and `styles.css` (scoped under `.st-science`)

## Run it

```
cd game
npm install
npm run dev
npx tsc --noEmit
```

## Status

November 14, 2026: integrated into the game app. Typecheck clean for the science files. Checked in the browser at 1440 x 900 in a solo game: combine → draft → start, projects running on the calendar (pace modifier and expiry), success raising `research.limits` (e.g. hydrolox Isp 450 → 460, antenna 3000 → 5000 kbps), failure news and flags, test-unit Task created and withdrawn, safe-scope unlock blocked, team limit enforced, cancel refund, and a fake planner Task shown as a request with its marked fields. Not playtested; balance numbers untested.

Open: Q-032 (graph scale and orientation), Q-033 (combining rules), Q-019 (personnel: teams are a stand-in), how more teams are earned, whether research after launch should matter for a campaign, and revealing unknown fields (`science.revealed` is unused).
