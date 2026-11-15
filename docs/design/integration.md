# Integration design

**Status:** implementation design for D-015 (one app, four station views, host-browser peer-to-peer). Labels: decisions come from D-012, D-015, D-006, D-008; the rest is the assistant's design (proposal = baseline while building).

## Layout

```
game/                      one Vite app (Preact, TypeScript); GitHub Pages build
  src/core/                shared state, actions, sync, clock, persistence (read-only for stations)
  src/shared/events/       shared event types + engine (docs/design/events.md)
  src/shell/               lobby, connection codes, seat picker, station switcher, mission result
  src/stations/<id>/       planner | procurement | science | comms
    slice.ts               the station's part of GameState + initial value
    logic.ts               reducers (defineActions('<id>', …)) + tick handlers (onTick) — no UI imports
    Station.tsx            root view, rendered inside <div class="st-<id>">
```

Station folders at the repo root (`mission-planner/`, `communications/`, `science/`, `procurement/`) keep specs, notes and mockups; code lives in `game/`.

## One shared state

`GameState` (`core/state.ts`) holds everything any station needs: `meta` (phase, seed, seats), `clock`, `budget`, `market` (D-006: tasks, offers, calls, contracts, allocations), `research` (limits, unlocked, projects), `events` (flags, news), and one slice per station. Types for the shared parts are in `core/model.ts`.

UI-only state (selection, open panels, popups, hover) stays in each station's local stores and is never shared.

## Shared coordination board

D-023 consolidates `coordinationBoard(state)` into `tasks` and `overview`. Existing game records remain authoritative. Task entries own related research, Offers, Calls, Contracts and test progress, and per-role links select the appropriate station action. Independent records remain visible in Mission overview. A funding entry groups explicit funding requests and affected needs while retaining individual request controls. Contextual request keys and expected revisions make repeated shortcut saves update the same record and reject stale overwrites.

D-021 adds `GameState.coordination` for explicit player-created requests. `core/coordination.ts` registers deterministic create/edit/status actions with revision checks and derives current board entries from procurement, research, planning and communications state. Required cross-role details are available to all stations in `shell/TaskBoard.tsx`. The filtered view uses each entry's current role actions. The all-tasks view includes waiting progress and optional history. Stored requests are included in snapshots, replication and save migration. Older saves initialize an empty request list while retaining procurement records.

Player requests describe their desired outcome and responsible station. Their author or responsible station may update them. Generated work derives completion from source state and changes when requirements or supply change. Science derives research requirements from the live rocket, including unordered parts. The board exposes relevant research routes, prerequisites, approval blockers and delivered-part tests. Contextual funding and launch-timing actions open editable player requests before publication. Department procurement remains available. The earlier graph-based equipment bonus is retired under D-020.

D-022 replaces browser-native confirmations with the UI-local `shared/confirmation.ts` request store and the shell's in-app `ConfirmationPanel`. Confirmations preserve focus, constrain keyboard navigation to their controls and make the game background inert while open. Planning actions continue to use their existing authoritative reducers.

## Actions and replication

Every change to `GameState` is an action: `{ type: 'ns/name', args, by }`, applied by a reducer registered with `defineActions(ns, { name(s, ctx, ...args) {} })`. Reducers:

- mutate only the draft `s`; no stores, DOM, network or timers;
- use `ctx.rng()` and `ctx.newId(prefix)` — never `Math.random()` or `Date.now()`;
- take all inputs from `args`. When the UI needs to refer to a new object right away (e.g. select a new maneuver), the UI creates the id and passes it in `args`.

The host applies actions in arrival order and broadcasts each with a sequence number. Clients apply their own actions optimistically, then rebuild from the host's confirmed state plus still-pending actions when the host's ordered echo arrives (`core/store.ts`). All browsers register the same reducers in the same order (`core/registerStations.ts` imports every station's `logic.ts` eagerly).

Calendar: only the host runs the clock (`core/clock.ts`), dispatching `core/tick` four times a second; `tick` steps day by day and calls every station's `onTick` handler in registration order (planner, procurement, science, comms). The host saves the state to localStorage (`core/persist.ts`).

## Cross-station contracts

**Planner → procurement (D-006 terms; planner keeps its UI words):**

- "Order part" dispatches a planner action that creates a shared `Task` (`authorRole: 'planner'`, `partId`, one `Criterion` with `partKind`, `variant`, `minimums` = slider values, `quantity` = engine count or 1, `neededAt` = planned launch day, `beyondResearch` keys). Editing an ordered part's sliders bumps `revision` and updates `minimums`. "Order a replacement" creates a new Task for the new part.
- Procurement fulfils a Task criterion by signing a `Contract` from an `Offer` and creating an `Allocation` (`contractId`, `taskId`, `criterionId`).
- The planner derives each part's state from the shared market: Task open → *Ordered*; allocation with an `active` contract → *Contracted*; `delivered` → *Delivered*; `expectedAt` > launch day → *Late*. Contracted parts use the contract's real stats (`offerSnapshot.resource.stats`, `massT`, `reliability`). Only procurement cancels contracts.
- `neededAt` follows the planned launch day while the task is open.

**Science → planner/procurement:** a successful research project applies `researchLimit` / `unlock` effects to `research.limits` / `research.unlocked` (keys `kind.variant.stat` and `kind.variant`, as the planner uses). The planner's sliders show the new limits; procurement's catalogue and tenders treat parts within research as normal (cheaper, reliable) and beyond research as tender-only (costlier, less reliable).

**Comms → everyone:** comms effects act on the shared state: `budget` → `budget.fundingTotalM`; `deliveryDelay` → active contracts' `expectedAt`; `priceModifier` → `market.modifiers`; `offer` → a new `Offer` (`source: 'comms'`) in `market.offers`; `researchPace` → `research.modifiers`; `researchLimit` / `unlock` → `research`; `flag` → `events.flags`; `service` / `missionConstraint` → news + a flag (e.g. `service.groundStation`). News items go to `events.news`, shown on every station.

**Shared flags** (read by comms events): `design.rtg`, `design.ion` (derived from the planner's rocket), `contract.late` (an active contract arrives after launch), `contract.cancelled`, `contract.cheapest` (set by procurement), `research.failed`, `research.breakthrough` (set by science), `plan.launchMoved` (set by the planner).

**Budget:** `available = fundingTotal − spent − committed`. Signing a contract commits its price; delivery moves it to spent; cancelling moves the non-refunded share to spent. Research and comms projects spend directly.

**Launch:** the planner's tick handler launches when the calendar reaches `planner.plan.launchDay`: `meta.phase = 'launched'`. Comms resolves its in-flight events in the same tick (its handler runs later). The mission result is computed deterministically from the state at launch (planner physics + reliability rolls seeded by `meta.seed`) and shown on every station.

## Seats

D-012 + D-015: four stations, one per player. Players claim a seat in the lobby; anyone may hop to an unclaimed station (`core/claimSeat` frees their previous seat). The host's browser is a station too.

## Network (D-015, D-027)

WebRTC data channels, one per joining player, host in the middle. Two ways in, both feeding one `HostTransport` (`combineHosts` in `net/peerjs.ts`):

- **Room code (default, D-027)** — `net/peerjs.ts`. The host's PeerJS peer id is `nasa-mission-control-26-<CODE>`; players connect to it with `serialization: 'raw'` and the same JSON/chunk/bye framing as the manual transport. The public PeerJS broker brokers setup only; ICE uses PeerJS defaults (Google STUN + `turn.peerjs.com` TURN). The room code is kept in localStorage (`mission-control.room`); a resumed game reclaims it (a few retries while the broker frees the old id), otherwise it gets a new one. If the host loses the broker, open data channels keep running and the host reconnects in the background. A `#join=CODE` link pre-fills the join screen.
- **Manual codes (fallback, D-015)** — `net/webrtc.ts`. The host creates an invite code per player, the player pastes it into the same join box and returns a reply code. STUN only, so strict networks may fail.

If the host closes the tab, the game is saved in the host's browser and can be hosted again; room players rejoin with the same code (a "Rejoin" button on the host-left screen), manual players need new codes.

## Styling

Stations share the glass sci-fi look (planner `styles.css` tokens). Each station's CSS must be scoped under `.st-<id>`; only `shell/shell.css` styles `html`, `body` and the shell.
## Request association and navigation under D-024

Shared requests optionally store `parentNeedId` (a market Task ID) and `neededAt`. These optional fields preserve older saves without a schema-version change. Creation and editing validate new parent references; retained orphan references remain editable, and an empty options object removes the association/date. Author/assignee authorization and revision checks remain in the reducer. The board derives parent grouping and Schedule without persisting another task lifecycle. Typed `actionKinds` and per-role `links` replace action-copy-based routing. Attached entries keep their own navigation; the parent offers one primary destination per role.
