# Science module direction — November 14, 2026

Source: user message in the project conversation (the user owns the science station). The original wording, including typos, is preserved below.

## Original note

> Lets work on the science module then, thats my part. Currently the concept gives a very idlegame vibe, we dont want that. We'd like some actual data analysis / science work in that as well. One idea for the UI and gameplay loop is to have a research-field overview UI like a knowledge graph, in which they should navigate and explore future research directions, and draft projects from the nodes, by their description. Please draft a visual mockup for that.

## Interpretation boundaries

- "Not an idle game" and "actual data analysis" are user direction for the science station. The concrete analysis mechanic is open.
- The knowledge-graph overview with projects drafted from nodes is a user idea for the UI and loop, not yet an accepted decision.
- The assistant mockup (field map → draft project → analysis workbench → publish finding with a chosen confidence) is a proposal: [redacted for publication]. Mock content and numbers are placeholders.

## Follow-up — November 14, 2026 (second message)

Source: user message in the project conversation. The original wording is preserved below.

> Assume we're already starting from a large knowledge base and assume the role of a senior research engineer, more like a professor. The graph should be A LOT larger and part of the player task might be to orient themselves in the graph, e.g. via re-labeling . Drafts might be created by selecting specific nodes and combining them (concept: phone game alchemy). The idea of including concrete data analysis is interesting, but lets keep that in mind for later.

### Interpretation boundaries

- The science player is a senior researcher (a professor) who starts with a large knowledge base, not a beginner who unlocks a small tree.
- Orienting in a large graph, for example by relabeling nodes, may be part of the player task. How relabeling works is open.
- Drafting a project by selecting and combining nodes, like an alchemy phone game, is a user idea. The exact rules are open.
- Concrete data analysis is deferred, not dropped. The first mockup's analysis screen is kept as a parked reference.
- The v2 mockup (about 130 nodes, relabel task, combination bench with hand-authored recipes) is an assistant proposal. All names, recipes and numbers in it are placeholders.

## Follow-up — November 14, 2026 (third message)

Source: user message in the project conversation. The original wording is preserved below.

> We do not want relabeling actually. Please add an actual factual description of the field in the "details" pane. Build a new mockup or change the other one. Please then pull and test the Workflow for resolving one of Mission Plannings Tasks. Esp also generate tasks which can be solved by resource planning.

### Interpretation boundaries

- Relabeling is withdrawn (I-068). Each node shows a factual "About this field" description. The text in the mockup is assistant-written and should be fact-checked before use.
- "Pull and test" was read as: pull the teammates' latest commits and exercise the mission planner's procurement-task workflow headlessly. Tests were kept outside the repo.
- "Resource planning" was read as the procurement role solving generated tasks under budget, time and risk. Offer prices, times and reliabilities in the test are invented placeholders.
- Findings: cancelling a contract keeps the boosted part stats (suggested fix: restore the task minimums); parts beyond research have a hard floor of about 213 days under the invented offers; contracting has no budget gate.

## Follow-up — November 14, 2026 (fourth message, German)

Source: user message in the project conversation. The original wording is preserved below.

> bitte setz den visuellen prototyp so um, modul 1&2, nicht den DA teil in einem neuen folder science, commit push. use tech stack from mission planner module. Dont integrate yet

### Interpretation boundaries

- "Modul 1&2" was read as boards 1 and 2 of the mockup (field map with combination bench, draft a project). "DA" was read as data analysis, which stays out.
- The new `science/` folder uses the mission planner's stack (Preact, TypeScript, Vite). This is a stack choice for the science module only; no network architecture is chosen (Q-012).
- No integration: the prototype shares no state or code with the mission planner.

## Follow-up — November 14, 2026 (fifth message)

Source: user message in the project conversation. The original wording is preserved below.

> Note some more ideas, but do not code them:
> 1) A lot more nodes, with flexible cluster naming as we zoom in and zoom out
> 2) Level Design: Split into Datasets, Oberservation Methods, related Papers / Analyses with Tab-Like switching;

### Interpretation boundaries

- Recorded only. Nothing was built.
- Point 1 was read as a larger graph whose cluster names change with the zoom level.
- Point 2 ("Level Design") was read as the structure of the details pane, with three tab-like views per field. This reading is uncertain: it could also mean levels or screens of the game. Confirm before design work.

## Follow-up — November 14, 2026 (sixth message)

Source: user message in the project conversation. The original wording is preserved below.

> Allright. Let's adapt this a bit further. Please insert the UI for handling Tasks spawned from Mission Planning Module. Scrap the Search Module on the left instead. Scrap the inspect/ combine tabs, just keep the inspect one. Deselect item when clicking on an empty map point. Only Add to workbench when user explicitly clicks on the "add to bench" button. Scrap the "tried so far" module.

### Interpretation boundaries

- The task UI takes the place of the search module in the left rail. The frontier list, discipline filter, and legend stay. This reading is an assumption.
- "Tasks spawned from Mission Planning" was read as the planner's beyond-research "get that part" tasks, shown as research and unlock requests. The four tasks in the prototype are placeholders modelled on the planner's current example mission. How a task is answered (a project, several fields combined, a direct start) is open.
- "Workbench" was read as the existing combination bench. Combine itself stays; only the interaction modes, search, and the log were removed.
- Starting and finishing research in the prototype are stand-ins. No integration with the planner exists.

## Follow-up — November 14, 2026 (seventh message)

Source: user message in the project conversation. The original wording is preserved below.

> Sieht schonmal gut aus. Wir werfen auch die Frontier Pbersicht raus. die Discipline - Übersicht bitte in die Map mit rein, solange wir im "Overview" sind.

### Interpretation boundaries

- The frontier list in the left rail is removed. Frontier fields stay visible on the map and in the top bar count.
- The discipline list (it also works as the show/hide filter) is now an overlay on the map, shown only in Overview zoom. The overlay covers part of the map in the top left; its placement is a first guess.

## Follow-up — November 14, 2026 (eighth message, rebuild as a tech tree)

Source: user messages in the project conversation (the first was interrupted and resent). The original wording is preserved below.

> Okay, the requirements for Science Module are updated:
>
> * We research upgrades for Tech for Mission Planning, such as e.g. more propulsion or better camera modules for less weight, more like engineering tech
> * resource planning selects whether we buy that part or develop it
> * comms may enable or block certain upgrades
>
> The thing is tech tree like - science must find ways to the goal
>
> Rebuild the science module please, on a different branch

### Interpretation boundaries

- "Rebuild" was read as replacing the knowledge-graph, bench and recipe design in the integrated game with an engineering tech tree. The old design stays on `main` until a merge is agreed. The rebuild lives on branch `science-tech-tree`.
- "Resource planning" was read as the Procurement station. Procurement decides, per part that exceeds current research, between buying it (a tender, dearer and less reliable) and developing it (a request to science). Both may run together.
- "The goal" was read as a part stat or part unlock that Procurement asks science for. Science must find a route through the tree to a tech that delivers it. Several routes can lead to the same goal.
- "Comms may enable or block" was read as new comms effects that block a tech (it cannot be researched while blocked) or enable one. Some techs start blocked and need comms to approve them.
- "Better camera modules for less weight": the planner derives mass from stats, so the first version expresses better modules as higher performance limits. Lower mass for the same stats is not modelled. See Q-037.
- All tech names, costs, durations, odds and prerequisites are authored placeholders (D-005).

## 2026-11-15 follow-up: facilities and hired teams

The user replaced the earlier proposal of research-team contracts with monthly fees:

> Science braucht einige Teile / Labs / gemietete Maschienenzeit von Procurement als Vorraussetzung zum Forschen (für höhere Stufen, vmtl ab 2) Denk dir aus welche. Ebenso soll Science mehr Research-Teams anfragen, die Procurement dann auf Zeit oder dauerhaft anstellen kann. Aber assignment und leerlauf komplizierter zu machen möchte ich nicht.

### Interpretation boundaries

- "Higher levels, probably from 2" was read as every tech with tree depth 2 or more. Facility choices per tech are invented placeholders (D-005, D-032).
- "No assignment and no idle" was read as: teams are plain extra slots, costs are one-off at signing, and nothing is charged while a team or facility waits unused.
