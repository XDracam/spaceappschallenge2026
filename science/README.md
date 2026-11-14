# Science module

All work for the science role lives in this folder. This is a visual prototype ported from the design-canvas mockup of November 14, 2026. It runs on its own and is **not integrated** with the mission planner or any other station yet.

Labels: **user direction** = stated by the user. **Proposal** = suggested by the assistant. Source: [science module note](../docs/notes/2026-11-14-science-module.md).

## What it is

**User direction:** the science player is a senior researcher who starts with a large knowledge base, shown as a research-field graph. Players explore it, read a factual description of each field, and draft projects by combining two or three fields (alchemy-style). Relabeling was dropped. Data analysis is deferred and is not part of this prototype.

**Proposal, placeholder content:** about 126 known fields in seven disciplines plus 8 unknown ones, 12 hand-authored recipes, estimates and station needs. The field descriptions are assistant-written from general knowledge and need a fact check before use. Content is hand-authored, in line with D-005.

## Screens

1. **Field map and combination bench:** pan and zoom the graph, search, filter by discipline, jump to frontier fields, read "About this field" in the details pane, put fields on the bench and combine them. A combination is a project idea (recipe), textbook territory, or a long shot.
2. **Draft a project:** choose scope and method, see a rough estimate and what other stations would need to provide. Starting a project only shows a confirmation; nothing is saved or sent.

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

Written without running a package install, so there is no `package-lock.json` yet and `npm run dev` has not been run on this code. The field data and layout were checked with a script; the types were checked against stub typings. Run `npm install` once and commit the lock file.

Open: Q-031 (graph scale and orientation), Q-032 (combining rules), Q-019 (personnel), Q-012 (how stations connect).
