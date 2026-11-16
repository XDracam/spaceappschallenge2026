# Release tooling and evidence audit

Date: 2026-11-16. Read-only source inspection by the coordinating reviewer. These are development/release workflow findings, not proposed gameplay changes. No harness, overnight job or tests were run.

## T-01 · P2 · Reused round IDs can report stale readiness

**Evidence:** `playtest/harness/start.mjs:22` reuses an existing run directory, `:31–32` opens its log in append mode, and `:41–45` accepts the first READY line anywhere in the log. `server.mjs:53–55` also reuses directories and appends evidence streams. A prior run with the same ID can therefore supply the readiness marker for a new child before that child finishes startup; evidence can mix across runs. This is a source-confirmed control-flow problem, not a reproduced session failure.

**Improve:** reject an existing round directory, or allocate a fresh run identity and only accept a readiness marker from the current PID/run. Preserve old evidence. **Acceptance:** reusing a round ID must stop with an actionable message or create a separate run; never claim readiness from an older log. Invisible to the game/video.

## T-02 · P2 · The harness records typecheck failure without gating the run

**Evidence:** `playtest/harness/server.mjs:75–83` captures the TypeScript result but only exits on the Vite build result. Vite transpilation can succeed despite a failed typecheck, so a round may start against a build that fails the advertised normal build gate. The main `game/package.json` build and the later overnight gate do enforce typechecking; this finding is confined to harness startup.

**Improve:** stop on nonzero typecheck, write its diagnostics beside the build diagnostics, and report the actual failed stage. **Acceptance:** a failed typecheck cannot yield READY. No tests were run for this audit.

## T-03 · P2 · Browser discovery is tied to a different developer environment

**Evidence:** `playtest/harness/server.mjs:103–116` checks Playwright’s expected executable, then Windows LOCALAPPDATA directories and `chrome.exe`, then falls back to the Microsoft Edge channel. There is no documented configurable executable in this function. On this Linux workspace, if the expected Playwright browser is missing, neither Windows search nor an assumed Edge installation establishes a usable browser. This does not prove the harness fails on every Linux machine.

**Improve:** accept an explicit browser executable/channel, use the supported Playwright installation as the primary documented path, and print the searched paths on failure. Keep platform-specific fallback optional. **Acceptance:** document one reproducible supported environment and provide a precise error for a missing browser. No game/video effect.

## T-04 · P2 · Activity telemetry needs a precise definition before reuse

**Evidence:** `playtest/harness/server.mjs:271–278` counts non-core actions and calculates `longestGapS` only when another counted action arrives. It omits the initial interval before the first action and the final interval after the last action through session end. A player who stops acting early can therefore receive a deceptively small longest-gap metric. Shared coordination uses its own namespace and IS counted; do not claim the metric excludes it.

**Improve:** report initial, between-action and terminal gaps separately, and label counts as dispatched actions rather than engagement. Reading a catalogue, comparing a trajectory and talking are not captured adequately by dispatch counts. **Acceptance:** the summary reports its exact observation window and does not interpret a low action count as boredom or a short action gap as enjoyment. Invisible to game/video.

## T-05 · P2 · The old overnight workflow can alter exactly what is now frozen

**Evidence:** `playtest/loop/overnight.workflow.js:7–12` explicitly includes systems/rules/content rework; `:55–56` supports `pushToMain`; `:107–124` commits or restores broad source paths; `:324` contains a hard reset recovery instruction. The clean dedicated-worktree preflight is a useful safeguard, and push is opt-in. Nevertheless, the workflow’s old authorization model is incompatible with casually reusing it for a post-submission presentation-only pass. The comment at `:20` saying never pushes also omits the opt-in push behavior.

**Improve:** label the old workflow as historical/advanced tooling, document the opt-in publication path accurately, and require an explicit new scope if it is ever reused. A future presentation-only mode should prohibit numerical/content-effect changes and publishing. Do not run or remove the existing workflow as a side effect of this audit. **Acceptance:** contributor instructions cannot be read as permission to run autonomous mechanics rework after submission.

## T-06 · P3 · Repository and release evidence need a frozen reference

**Evidence:** audit started at commit `6fed21a` with existing modified `docs/README.md`, two untracked dated HTTPS notes and an untracked `video/` tree. The final trailer is served from `game/public/submission/`; production source, production build output, historical scripts and submission media are separate artifacts. A mutable branch alone does not identify the judged build.

**Improve:** record the submitted URL, submission date, source commit if known, release artifact hash and which video file was supplied. Acknowledge any unknown provenance instead of reconstructing it from timestamps. Keep the submitted MP4 unchanged. Tagging, committing, pushing or changing repository settings requires the corresponding user request; this audit does none of those.

## Root checks and limits

- Enumerated 445 tracked and 91 pre-existing untracked nonignored files at audit start: 536 total; 161 TypeScript/TSX and 137 Markdown files. Inventory excludes `.git` internals, ignored dependencies and ignored generated outputs; installed dependency versions and production output were checked separately by other packets.
- Checked local Markdown path existence mechanically: 10 missing-path candidates. Eight are paths in a historical merge review and should be annotated, not rewritten as if the historical source never existed. Two are in module interface/readme entry points. Findings forwarded to the documentation reviewer.
- Read root configuration, deployment workflow, package metadata, submission HTML, harness source and overnight workflow. Existing GitHub Actions deployment builds with `npm ci` and `npm run build`, uses Pages configuration for base paths and serializes publication through a concurrency group; retain these useful choices.
- Shell has Node and installed project dependencies but no npm command on PATH. Direct Vite startup failed `listen EPERM 127.0.0.1:5173`; CUA has no browser surface. No live browser observations, multiplayer validation, fresh dependency vulnerability database check, public hosting health check or new tests are claimed.
