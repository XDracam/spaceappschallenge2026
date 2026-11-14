# Shared code

Code used by more than one station. Framework-free TypeScript that each station's app imports directly (relative path).

| Folder | Contents |
| --- | --- |
| [`events/`](events/) | Shared event system: types (`types.ts`: effects, conditions, events, news, in-flight events, external vs internal) and the pure engine (`engine.ts`). Design: [docs/design/events.md](../docs/design/events.md). |

First user: the [communications station](../communications/README.md). The mission planner and science apps can adopt it once stations connect (Q-012).

A Vite app importing from here needs `server.fs.allow` to include this folder (see `communications/app/vite.config.ts`).
