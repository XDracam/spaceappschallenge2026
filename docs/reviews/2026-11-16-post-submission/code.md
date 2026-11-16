# Code, synchronization and release engineering audit — 2026-11-16

## Evidence and scope

Read-only source audit, followed by actual compiler and production build. No tests were added or run. No implementation files were edited. Required project documents and AGENTS.md read. Reviewed core/actions, coreActions, store/createStore, state/model/protocol/persist/clock/coordination/facilities/mission/registerStations/playtestHook; both network transports and code codec; station logic in Planner, Procurement, Science and Comms, relevant derive/result/evaluate/goals/research/tree/test/facility/market/world rules; session wiring and host controls; package/TypeScript/Vite configuration and Pages workflow. Renderer/physics internals outside the goal explanation and contract propagation paths were not numerically qualified. This is source evidence, not a live network or browser test and not a security penetration test.

Actual commands in game/: `node node_modules/typescript/bin/tsc --noEmit` passed (exit 0). `node node_modules/vite/bin/vite.js build` passed (202 transformed modules, 1.18s). Output: JS 768.07 kB minified, 239.40 kB gzip; CSS 168.47 kB, 31.52 kB gzip; title artwork 104.84 kB. Vite issued its >500 kB chunk warning. npm is unavailable in this shell; direct installed executables supplied equivalent compiler/build evidence. No dependency advisory service was queried; do not claim dependencies are vulnerable based on age.

## Findings

### C01 [P1] Optional-goal failure explanation contradicts the successful orbit
- Evidence: `game/src/stations/planner/physics/evaluate.ts:555–557` remembers the first wrong-altitude step. A later valid GEO step can set `reachedNoInstrument` at line 604. When no successful goal pick exists, line 621 selects the remembered altitude failure before lines 622–624 consider the missing instrument. `physics/goals.ts:44–46` renders that as “The plan does not reach geostationary orbit: orbit at 200 km…”.
- Impact: a mission that demonstrably reaches GEO can explain absent optional payloads as an orbital failure. This undermines confidence in the result and simulator even though `achievable` and success probabilities are unchanged. Parent/asset reviewer reports the symptom in the submitted video; this source trace explains it.
- Recommendation: track whether any suitable-altitude step was reached and report instrument/performance absence before irrelevant earlier altitude misses; preserve the goal pick, probability and scoring rules.
- Boundary: explanation-only fix is gameplay-preserving, but the exact failure text appears in video: record the correction and do not replace the video.

### C02 [P1] Host accepts the peer's claimed authority
- Evidence: `game/src/core/store.ts:167–170` passes `{...msg.action}` directly to applyAsHost; no derivation of `by` from authenticated transport peer/seats. `core/actions.ts:81–89` invokes registered reducer/args directly. `core/coreActions.ts:87–161` does not enforce host-only tick/start/restart/mission selection/seat release. `shell/StationSwitcher.tsx:100–103` restricts pause only in the UI, and `shell/session.ts:355–367` restricts recovery only in shell functions.
- Impact: the host is authoritative about action order but does not enforce the ownership shown by the interface. A custom connected peer can submit host-control or another station's actions; role-based coordination checks trust a forged `by`. Access requires a connection to this room; this is not evidence of arbitrary public website visitors modifying games, and no exploit was run.
- Recommendation: authorize at host ingress from peer-to-seat mapping; derive actor identity; allow explicit lobby seat operations and supported host controls; reject debug actions in production. Keep current legitimate workflows.
- Boundary: internal hardening, no visual/gameplay rule redesign. Do not add accounts or a production backend to solve this prototype issue.

### C03 [P1/P2] Wire types are assertions, not runtime validation
- Evidence: `net/peerjs.ts:124–150`, `net/webrtc.ts:105–132` JSON-parse untrusted data; transport callbacks cast to ClientToHost/HostToClient (`peerjs.ts:288`, `395–397`). `core/store.ts:167–170,186–210` reads messages and state directly. `core/actions.ts:88` spreads unvalidated args. Example `core/coreActions.ts:113–115` dereferences an arbitrary station; `setSpeed:103–104` accepts Infinity or NaN, `tick:87–98` has no finite upper bound. Coordination reducers already demonstrate local validation, but most action namespaces do not.
- Impact: malformed or incompatible clients can throw in reducers, leave optimistic actions unacknowledged, or inject nonsensical numbers; an extreme valid numeric tick can monopolize the browser. Listener catch/logging does not supply recovery.
- Recommendation: small allowlisted envelope/action validators, finite numeric/range checks, bounded strings/collections; send explicit rejection and let clients remove rejected pending work. Avoid a general schema framework unless it actually simplifies these few boundaries.
- Boundary: behavior-preserving input hardening. P1 for exposed host-control actions together with C02; P2 for general malformed-data resilience. No live malformed packet was sent.

### C04 [P2] Chunk framing has no limits or expiry
- Evidence: `net/peerjs.ts:132–143` and `net/webrtc.ts:114–125` allocate `new Array(n)` based on the message, write arbitrary `i`, accept arbitrary `d`, and retain incomplete IDs forever. There are no checks for positive bounded counts, in-range integer indexes, consistent count, aggregate bytes, number of pending messages, or expiry. The first allocation/write lies outside the parse catch.
- Impact: a buggy or custom connected peer can consume memory or throw before emitting a protocol message. Normal incomplete chunks can persist for the life of the connection.
- Recommendation: one bounded framing helper shared by both transports, with validation, byte/count limits and expiry/close cleanup. Retain identical normal wire representation.
- Boundary: internal, visually invisible. No adversarial traffic or memory exhaustion was exercised.

### C05 [P2] Save loading accepts structurally invalid current-version data
- Evidence: `core/persist.ts:48–87` checks version and meta after migrations but not the GameState shape, mission ID, seats or numeric fields; it casts parsed JSON to GameState. `{version:8,meta:{}}` passes the version/meta gate and receives default mission/attempt fields, then `shell/session.ts:197–199` dereferences missing `clock.day` while deciding whether to show Continue. `shell/App.tsx:31` has no recovery boundary.
- Impact: an invalid saved record can prevent the start screen from rendering instead of offering a recoverable “save could not be read” state. Browser quota failures are surfaced already; corruption/format mismatch is not.
- Recommendation: validate/migrate into a normalized fresh structure before adoption, retain the bad raw record for recovery/export if useful, offer a deliberate reset. Do not silently overwrite historical saves.
- Boundary: recovery robustness; no balance or mission changes. Source-traced counterexample, not executed as a test.

### C06 [P2] No build/protocol compatibility handshake during live updates
- Evidence: `core/protocol.ts:6–19` welcome has only peerId and snapshot carries seq/state; `core/store.ts:185–209` never compares state version, reducer/content build or protocol compatibility. All clients re-execute locally registered reducers.
- Impact: a host left open across a deployment can connect a newer client with different reducer/content behavior, which sequence checks cannot detect. A sequence-consistent client need not be semantically synchronized.
- Recommendation: introduce a small build/protocol identifier in handshake, detect incompatible versions before seating, and give an in-app reload/rejoin explanation. A state-version number alone does not describe content/rules changes.
- Boundary: internal connection integrity. Old/new mixed-version behavior was not run.

### C07 [P2] Reconnection can remain on an endless spinner
- Evidence: `net/peerjs.ts:228–236` sets reconnecting and attempts reconnect after two seconds. Error handling at 252–254 only calls fail when opening; a network error in reconnecting returns without a terminal state or deadline. `shell/Lobby.tsx:401–407` renders a spinner for reconnecting and Try again only for error.
- Impact: the host can lose discoverability for new players while existing peer links continue, with no bounded recovery path in the shown state.
- Recommendation: bounded retries/deadline with a specific signalling-unavailable state and retry/manual fallback; keep established WebRTC channels running.
- Boundary: no new network service. Source-verified missing branch; actual outage timing was not exercised.

### C08 [P2] Production registers debug-only mutations
- Evidence: `stations/comms/logic.ts:22–27` unconditionally registers devFireEvent; `stations/procurement/logic.ts:319–336` registers devAddSampleTasks. UI controls are correctly gated with import.meta.env.DEV (`comms/ui/App.tsx:39`, Header:21, procurement/ui/Needs.tsx:129), but the reducers remain accepted through the registry in production.
- Impact: hides the button but leaves a debug mutation in the network action vocabulary; compounds C02/C03. This is not a visible dev drawer leak in the shipped app.
- Recommendation: production action allowlist or DEV-gated registration with explicit handling of unknown action rejection. Preserve harness functionality in development.
- Boundary: internal, no normal gameplay effect.

### C09 [P2] Each tick deeply clones and repeatedly serializes the full growing state
- Evidence: `core/clock.ts:6,13–20` ticks four times a second. `core/actions.ts:87,97–109` structuredClone followed by JSON comparison at each recursion level (depth 3); `core/persist.ts:24–30,39` serializes latest state every second; `stations/planner/derive.ts:163–186` builds a serialized planner cache key after state changes. Saved versions and historical market records remain in shared state.
- Impact: redundant main-thread work grows with session history and saved designs. Build success does not prove an actual frame-rate problem; no benchmark was run.
- Recommendation: profile a realistic long four-station session first, then replace the hottest whole-state equality paths with precise structural updates/revision keys; avoid rewriting the store speculatively. Preserve deterministic ordering.
- Boundary: invisible performance work; measured priority after profiling, not a release blocker.

### C10 [P2] One large startup chunk eagerly includes every station
- Evidence: actual build reports 768.07 kB JS (239.40 kB gzip) and Vite warning. `core/registerStations.ts:4–9` must eagerly register reducers; `shell/App.tsx:11–14` also eagerly imports all four station views.
- Impact: a player initially viewing the title screen downloads all stations and physics/UI dependencies. The reducer-registration requirement does not require eagerly loading station view code.
- Recommendation: keep shared rule registration deterministic and eager, lazily load station view components with a compact in-app loading/error state. Measure first-load requests before deciding whether this is worth the complexity.
- Boundary: normal station UI unchanged; no arbitrary chunk-size-warning suppression.

### C11 [P2] Pull requests have no automatic compiler/build gate
- Evidence: `.github/workflows/pages.yml:5–11` triggers deployment only on main pushes/manual dispatch; no pull_request event or separate CI workflow was present in inspected .github inventory. Build itself correctly includes typecheck (`game/package.json:8`).
- Impact: build failures are caught after merge/push to main, inside publishing, rather than when a change is reviewed.
- Recommendation: small read-only PR typecheck/build job, retaining current Pages permissions only for deployment. Do not add a giant framework or tests without the user's authorization.
- Boundary: release engineering only.

### C12 [P2] Mutable active mission weakens the claimed pure-state boundary
- Evidence: `core/state.ts:33–35` createGame changes global MISSION; `core/mission.ts:19–23` mutable export; `stations/planner/derive.ts:145–148` plannerGame(state) uses global MISSION instead of missionById(state.meta.missionId); research durations and date formatting also read it. `core/store.ts:60–63` restores it when rendering state changes.
- Impact: ordinary current-game flows synchronize the global deliberately and are not proven broken. However, comparing an old state, preparing a second mission, or replaying a draft can change the context used by functions advertised as pure. This makes future maintenance and audits fragile.
- Recommendation: gradually pass mission data from the supplied state into rule/derive helpers; avoid a wholesale architecture rewrite immediately after submission.
- Boundary: invisible refactor, requires numerical/replay equivalence verification when authorized.

### C13 [P2, deferred because gameplay-sensitive] Meridian ion offer has inconsistent thrust units
- Evidence: `stations/comms/data/mars/projects.ts:156` authors thrustKN:0.25, isp3000, mass .05t. `planner/data/propulsion.ts:26` normal ion range is .0001–.002kN. `planner/derive.ts:87` copies offer stats directly; `parts.ts:217,226` consumes raw kN; `propulsion.ts:41–43` converts kN to N for electric power; `physics/evaluate.ts:397` uses thrust for burn duration.
- Impact: .25kN means 250N, 125 times the top of the normal slider range; at isp3000 the power formula yields about 6,129kW instead of 6.129kW for .00025kN. The offer therefore changes the physical plan rather than merely displaying a typo. Whether .25N was intended is unverified.
- Recommendation: trace authored intent and all corresponding offer unit conventions; keep out of a copy-only professionalization pass. Report separately for explicit gameplay review.
- Boundary: do not silently correct to .00025 or rebalance; no in-game route tested.

### C14 [P3] Preview arrival and committed arrival use different rounding
- Evidence: `procurement/rules.ts:169–170` expectedArrival uses fractional clock day; committed quote at `rules.ts:433` floors clock day before adding integer lead time.
- Impact: some previews can differ from actual commitment by part of a calendar day. Current date display may mask it, so this is a consistency cleanup, not a proven player-visible defect.
- Recommendation: use the same shared arrival helper throughout preview/quote paths, preserving the currently committed date rule.
- Boundary: date presentation/implementation consistency; verify deadline comparisons when changed.

## Strengths to preserve

- A small dependency set (Preact and PeerJS), strict TypeScript, unused symbol checks, and a working compiler/build are proportionate to a hackathon prototype.
- Host-ordered actions, deterministic seeded RNG and isolated station reducer registration are a coherent architecture, not a pile of unrelated generated demos.
- Procurement quote tokens re-check current terms before spending; replacement validates the post-cancellation quote before the transaction; requests use revisions and bounded text. Extend these existing patterns.
- Browser save failures already have in-app feedback/retry. Local save migrations preserve earlier user work.
- Production UI gates dev drawers and sample-task buttons. It would be inaccurate to claim the submitted production UI visibly exposes them.
- Sound feedback is sourced from confirmed actions rather than simply optimistic clicks. The attempted/confirmed distinction is a useful quality foundation.
- No native browser popup recommendation; existing in-app confirmation approach should remain.

## Suggested order within the submitted-gameplay constraint

1. Correct misleading optional-goal explanations with preserved probabilities and scores; classify its video-text mismatch explicitly.
2. Narrow host ingress authorization/validation and production debug action acceptance, keeping legitimate current actions.
3. Save-shape recovery and bounded network reconnection/chunk handling.
4. Build-compatibility handshake and PR build gate.
5. Profile before structural-sharing or lazy-loading changes; refactor mission context only if justified.
6. Keep ion thrust numbers and all other balance/physics changes in a separately deferred gameplay review.

No claims of multiplayer enjoyment, lack of idle roles, strict venue-network connectivity, accessibility conformance, or exploit-free operation follow from these checks.
