# Core contract: attempts, restart, score, back to lobby

What `game/src/core/` provides for the parallel packages (A, B, C, D1, D2). Core and shared are frozen during the build: code against this; ask under `coreRequests`.

## State (GameState, `core/model.ts`, `core/state.ts`)

`STATE_VERSION = 6`. New fields on `s.meta`:

| field | type | meaning |
|---|---|---|
| `meta.attempt` | `number` | 1 for a new game; +1 on every `restart`, `returnToLobby`, `setMission`. |
| `meta.attempts` | `AttemptRecord[]` | Finished attempts, oldest first, at most `MAX_ATTEMPT_RECORDS` (12). Kept across restart, return to lobby and mission change. |

New types (`core/model.ts`):

```ts
interface AttemptOutcome { achieved: number; total: number; scrubbed: boolean }   // = missionScore(computeMissionResult(s))
type ScorePartId = 'goals' | 'budget' | 'time' | 'deliveries' | 'research' | 'trust';
interface AttemptScore { total: number; parts: Record<ScorePartId, number> }        // integer points
interface AttemptRecord {
  attempt: number; missionId: string;
  achieved: number; total: number; scrubbed: boolean;
  score: AttemptScore;
  spentM: number;          // spent + committed at the end, 0.1 M precision
  fundingTotalM: number;
  launchDay: number | null; // s.planner.plan.launchDay at record time
}
```

"The mission ended" means `meta.phase === 'launched' || 'finished'` (phase `finished` is still never set; launch sets `launched`).

## Actions (`coreActions` in `core/coreActions.ts`)

All are ordinary replicated core actions: any station, host or client, may dispatch them.

| call | does |
|---|---|
| `coreActions.recordAttempt(outcome: AttemptOutcome)` | Appends `AttemptRecord` for `meta.attempt` with `score = scoreAttempt(s, outcome)`. No-op unless the mission ended; no-op if this attempt is already recorded; invalid outcomes ignored. Safe for all four browsers to dispatch: the first one wins. |
| `coreActions.restart(outcome?: AttemptOutcome)` | "Try again". Records the ended attempt first if `outcome` is given (same rules as `recordAttempt`), then replaces the state with a fresh game of the same mission: `phase = 'planning'`, `clock.running = true`, day 0. No-op in the lobby. Allowed during planning too (abandons without recording). |
| `coreActions.returnToLobby(outcome?: AttemptOutcome)` | "Back to mission choice". Records like `restart`, then a fresh game of the same mission in `phase = 'lobby'`, calendar stopped. No-op in the lobby. |
| `coreActions.setMission(missionId: string)` | Lobby only. Fresh game of another mission (`MISSIONS` id; unknown ids and the current mission are ignored). |

**Fresh game = `createGame(newSeed, missionId)`, then kept from before:** `meta.seats` (peer ids and player names), `meta.attempts`, `meta.nextId` (ids keep counting, so ids a station's UI still holds never point at new objects), `clock.daysPerSecond`. `meta.attempt` +1. New seed = deterministic hash of the previous seed and the new attempt number (no `Math.random`).

**Reset by it (everything else):** phase, clock day/running, budget (back to the mission's funding), market (tasks, offers, calls, contracts, allocations, modifiers), research (limits, unlocked, projects, modifiers, access), events (flags, news), planner slice (rocket, plan, versions, playthroughSeed), procurement, science and comms slices, `meta.rngCounter`.

Helpers (`core/coreActions.ts`): `missionEnded(s): boolean`, `attemptRecorded(s): boolean`, `MAX_ATTEMPT_RECORDS`.

## Score (`core/score.ts`, pure, deterministic)

```ts
scoreAttempt(s: GameState, outcome: AttemptOutcome): AttemptScore
scoreFractions(s: GameState, outcome: AttemptOutcome): Record<ScorePartId, number>  // 0..1 per part, before weights
SCORE_WEIGHTS: Record<ScorePartId, number>   // goals 600, budget 150, time 100, deliveries 50, research 50, trust 50
SCORE_MAX = 1000
SCORE_PARTS: ScorePartId[]                   // display order
SCORE_PART_STATION: { deliveries: 'procurement', research: 'science', trust: 'comms' }
```

| part | 0..1 fraction | note |
|---|---|---|
| goals | achieved / total; 0 if scrubbed | dominant |
| budget | (1 − (spent + committed) / fundingTotal) × goal share | unused money only counts for a mission that achieved something |
| time | ((deadline − launchDay) / deadline) × goal share | deadline = mission `completionDeadlineDay`. For Mars the launch window, not the team, limits this; it is the same for every attempt of a mission, so attempts stay comparable. |
| deliveries | contracts allocated to planner Tasks (not cancelled) that are `delivered` with `deliveredAt ≤ launchDay` / all such contracts; 0 if none | Procurement |
| research | succeeded / ended research projects and part tests; 0 if none ended | Science |
| trust | mean of `s.comms.trust` / 100 | Comms. Trust starts at 50, so a team that does nothing in Comms gets about 25. |

Left out, because the state has no data for it: scientific value per goal (goals carry no value; all count equally), and the Planner's own contribution beyond the goals.

Score the live state: `scoreAttempt(getState(), missionScore(computeMissionResult(getState())))`. The record stores the same numbers, frozen.

## Local (non-shared) hook (`core/store.ts`)

```ts
onGameReset(cb: (s: GameState) => void): () => void
```

Fires in this browser after the shown game changes identity (mission, seed or attempt): `restart`, `returnToLobby`, `setMission`, a new hosted game, a resumed save, a client's first snapshot. Stations reset their UI-only stores here. Register once at module load of a UI file (not in a logic.ts).

Also in `core/store.ts`, automatic: the live `MISSION` binding follows `meta.missionId` after every state change, and **when the phase goes from not-lobby to `lobby` (returnToLobby), every browser that sits at a station is set back to no station (`setLocalStation(null)`)**, so the shell shows the lobby. The host lands on its host screen (invites intact), players on their join screen (seated; they enter the mission again when the host starts it).

## A — end of mission (`shell/ResultOverlay.tsx`, `stations/planner/result.ts`, `stations/planner/ui/Playthrough.tsx`)

- When the result first shows (phase launched): `coreActions.recordAttempt(missionScore(computeMissionResult(getState())))`. Every browser may do it.
- Render the score of the current attempt from `s.meta.attempts.find(a => a.attempt === s.meta.attempt)?.score` (or `scoreAttempt` live before the record arrives); parts in `SCORE_PARTS` order with `SCORE_WEIGHTS[part]` as maximum; previous attempts from `s.meta.attempts` (filter by `missionId` to compare like with like).
- "Try again": `coreActions.restart(outcome)`. "Back to mission choice": `coreActions.returnToLobby(outcome)`. Pass the outcome so the record exists even if `recordAttempt` was never sent.
- The ResultOverlay's `hidden` useState survives a restart (the component stays mounted at the non-planner stations): reset it on `meta.attempt` change, or the next launch opens as a chip.
- `computeMissionResult` memo (`last` in result.ts) is keyed on the planner view and `comms.inFlight`, so a restart recomputes; nothing to do.
- Known: after "Launch now" (`planner/launchNow`) the comms tick handler never runs again, so `comms.inFlight` stays empty and no in-flight events apply. Pre-existing; A may want it fixed (comms/D2 or planner/B).

## Per station: what to do on restart (UI-only stores; shared state is already fresh)

Use `onGameReset`. Nothing here is required for correctness of the shared state; it prevents stale UI.

- **Planner (B)** — `stations/planner/state/store.ts` `uiStore`: set `selectedBranchId: 'branch-root'`, `selectedManeuverId: null`, `hoverManeuverId: null`, `popup: null`, `mapDay: null`, `playthrough: null` (App.tsx `syncPlaythrough` already clears `playthrough` when the phase leaves launched). `stations/planner/ui/common.tsx` `localUi`: clear `highlightPartId`, `openStageId`, `openPartId`, `openSpacecraftId`. Caches `cachedPlannerGame` (derive.ts), `evaluationOf`, `fixCache` are content-keyed or WeakMaps: nothing to do. Briefing (`ui/Briefing.tsx`) is keyed on mission id: nothing to do.
- **Procurement (D1)** — `stations/procurement/ui/uiState.ts` `ui`: reset to its initial value (at least `focus`, `offerId`, `contractId`, `callId`, `compare`, `amendmentPreview`, `callSnapshot`, `dialog`, `status`, `neededAt`). Note `resourceId: 'e-ker-2000'` is a fixed default that may not exist in every mission.
- **Science** (no owner in this build) — `stations/science/ui/App.tsx` keeps the selected tech in a component `useState`; a dangling id is harmless.
- **Comms (D2)** — `stations/comms/ui/store.ts` `uiStore`: reset to `initialUi()` (`launchCardClosed`, `selectedInstanceId`, `lastOutcome`, `projectPickerOpen`).
- **Shell** — `session.resumePaused` only matters before the host enters; a restart sets `clock.running = true` itself. The host clock (`core/clock.ts`) and persistence (`core/persist.ts`) need nothing: the clock ticks whenever the phase is planning and the save follows the host state.

Race to know about: an action a client sent just before a restart arrives after it and applies to the new attempt. Reducers that look up ids from the old attempt find nothing (ids keep counting); actions with fresh UI-made ids (planner `uiId`) would apply.

## C — back to mission choice (`shell/Lobby.tsx`, `shell/session.ts`)

Mechanism: `coreActions.returnToLobby(outcome)` (A's button) → phase `lobby`, seats kept, every browser returns to its lobby screen (core does this). What the shell still has to do:

- Host screen (`HostScreen` in `shell/Lobby.tsx`): while `phase === 'lobby'`, offer the mission choice and call `coreActions.setMission(id)` (the existing `MissionPicker` calls `hostNewGame`, which throws away the network session; do not use that here). `MissionLine` already shows the current mission. "Start mission" (`hostEnterMission`) already calls `coreActions.startGame()`.
- Join screen: nothing required; `JoinScreen` already sends a seated player into the station when the phase leaves lobby.
- Optional: show `meta.attempts` in the lobby.

## Persistence (`core/persist.ts`)

Saves of versions 1 to 5 migrate to 6 (`attempt = 1`, `attempts = []`). A version-6 save missing those fields is repaired the same way. A save without `meta`, of an unknown version, or not JSON is ignored (start screen offers no resume).
