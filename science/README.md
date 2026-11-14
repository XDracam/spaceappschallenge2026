# Science module

All work for the science role lives in this folder. This is a visual prototype ported from the design-canvas mockup of November 14, 2026. It runs on its own and is **not integrated** with the mission planner or any other station yet.

Labels: **user direction** = stated by the user. **Proposal** = suggested by the assistant. Source: [science module note](../docs/notes/2026-11-14-science-module.md).

## What it is

**User direction:** the science player is a senior researcher who starts with a large knowledge base, shown as a research-field graph. Players explore it, read a factual description of each field, and draft projects by combining two or three fields (alchemy-style). Relabeling was dropped. Data analysis is deferred and is not part of this prototype.

**Proposal, placeholder content:** about 126 known fields in seven disciplines plus 8 unknown ones, 12 hand-authored recipes, estimates and station needs. The field descriptions are assistant-written from general knowledge and need a fact check before use. Content is hand-authored, in line with D-005.

## Screens

1. **Field map and combination bench:** pan and zoom the graph, read "About this field" in the details pane. In Overview zoom a discipline list floats on the map and hides or shows each discipline. Selecting a field never changes the bench: a field goes on the bench only with the "Add to bench" button. Clicking empty map space deselects. Combine shows a project idea (recipe), textbook territory, or a long shot.
2. **Tasks from Mission Planning** (left rail): research and unlock requests, modelled on the planner's "get that part" tasks (see [rocket configurator](../mission-planner/rocket-configurator.md#beyond-research-parts)). Opening a task marks its related fields on the map. "Start research" and "finish research now" are stand-ins: nothing is sent to the planner yet, and the four tasks are placeholders.
3. **Draft a project:** choose scope and method, see a rough estimate and what other stations would need to provide. Starting a project only shows a confirmation; nothing is saved or sent.

## Run it

Same stack as the [mission planner](../mission-planner/README.md): Preact, TypeScript, Vite.

```
cd science/app
npm install
npm run dev        # http://localhost:5174
npm run typecheck
```

## Layout

- `app/src/data/` fields, descriptions and recipes (content)
- `app/src/model/` types, graph layout, combine rules
- `app/src/state/` UI state
- `app/src/ui/` components and styles

## Status

Installed, built (`npm run build`, real typecheck) and smoke-tested in headless Chrome on November 14, 2026: render, frontier jump, search, bench, combine, draft screen, no console errors. Layout is tuned for about 1440 x 900; below that the page scrolls. Not playtested.

Open: Q-032 (graph scale and orientation), Q-033 (combining rules), Q-019 (personnel), Q-012 (how stations connect).
