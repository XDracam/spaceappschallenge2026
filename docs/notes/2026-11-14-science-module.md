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

- Relabeling is withdrawn (I-038). Each node shows a factual "About this field" description. The text in the mockup is assistant-written and should be fact-checked before use.
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
