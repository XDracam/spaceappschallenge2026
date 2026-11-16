# Independent assets/tooling implementation review — November 16, 2026

Read-only review, independent of the asset/tooling author. No implementation edits, tests, builds, browser session, media rendering, workflow execution or external calls were performed. Findings are source-confirmed control-flow observations; acceptance of visual equivalence remains conditional on the parent's rendered inspection.

## Finding raised and repaired during review

### TIR-01 [P2] READY preceded successful API binding — repaired

**Location:** `playtest/harness/server.mjs:589-627` (`startApi`), main `:663-667`; `playtest/harness/start.mjs:53-61`.

`startApi()` calls `srv.listen(PORT, '127.0.0.1')` and immediately returns. Main then logs the fresh round/PID READY marker without awaiting the listen callback or handling the server error event. If another service holds the port but returns a non-OK `/admin` response, the start wrapper's preflight does not classify it as a running harness. The same problem occurs if a service takes the port between preflight and listening. Node schedules the listen error after the READY line has been written. The wrapper searches READY before checking `exited`, so it can return success even after that fresh child has failed with EADDRINUSE.

This is not the original stale-log bug; the unique log/PID fix correctly addresses that. It is a remaining false-ready path under R-33's requirement to make readiness truthful.

**Minimal recommendation:** make `startApi()` return a promise resolving from the successful listen callback and rejecting on the server error event; await it before poll/READY. Await the same error-aware binding for the static game server for a clear failure path. The wrapper can also require the child not to have exited before accepting its marker, but that alone cannot replace awaiting the actual listener. Keep evidence/failure diagnostics and fresh-run refusal. No change to game behavior is required.

**Evidence limitation:** not runtime-reproduced because this review was explicitly asked not to run tests/browser/builds. The asynchronous listen ordering and marker-before-exit check are directly visible in source.

## Reviewed changes and positive findings

- `.github/workflows/build.yml`: PR-path-filtered existing npm build (which includes TypeScript) with read-only content permission and no deployment permissions; separate Pages publication retained. No executable review defect identified.
- Harness start/server: exclusive new round directory, round-ID validation, unique startup log, child-PID marker, local compiler/Vite entrypoints without shell interpolation, hard typecheck gate and durable output; configurable executable/channel discovery. These repair the reported stale reuse/build/browser assumptions. Activity summaries now name ready-to-finish windows and include initial/terminal/no-action gaps; they explicitly avoid treating dispatched actions as enjoyment. No new-session/cross-platform runtime claims are made by this review.
- Historical workflow: disabled by default; separate explicit new gameplay/autocommit/publication opt-ins and authorization note propagated. Removed hard-reset recovery instruction. Night-specific authorization does not become standing permission in the docs. No workflow steps run.
- `game/index.html`, public font CSS/source manifest/notices: local paths are consistent with Vite BASE_URL; exact declared families/weights retained without editing CSS font usage. Five TTFs and OFL/source records are represented. Font family/style identity alone does not establish identical rendered metrics to the externally served prechange font; the parent's visual/network check remains necessary.
- Audition archive moved outside Vite public root. Candidate/audio/license relative URLs continue to resolve inside `dev/audio-audit`; README's local root server matches `/dev/audio-audit/`; back link is explicit published game. Labelled display art and original unlabelled provenance are separated. Current source does not import the archive.
- Trailer wrapper's new min/max expression bounds it by available parent width. MP4/poster paths remain unchanged. Share metadata/favicon/social source are consistent with the selected custom domain. Actual narrow/short layout remains a browser verification obligation.
- Portable media modules and both capture scripts: resolve repository-declared Playwright, configurable URL/browser and fresh output directories; new capture metadata stores relative raw paths. Both render scripts use package-derived paths and fresh temporary intermediates, eliminating stale-cut reuse. Shared output preparation rejects existing outputs and both frozen final filenames before rendering. Retained narration WAVs remain authoritative; new captures intentionally reuse them for optional preview edits.
- Narration provenance explicitly separates sample-code MIT from model OpenRAIL-M, retains notices, and labels unknown historical settings/source revision. Submission-reference manifest labels unknown submitted source/timestamp and distinguishes local hash from external upload proof. This review did not freshly verify upstream licensing or hashes; author reports and parent independent checks remain separate.

## Scope/remaining acceptance obligations

The author report at `/tmp/nasa-assets-implementation.md` identifies syntax/CLI-refusal/hash checks actually performed and leaves production build, dist exclusions, actual credits/submission layouts and local-font requests to the parent. Do not turn this independent source review into evidence those runtime checks passed. No additional high-confidence implementation regression was identified in the reviewed assets/tooling files beyond TIR-01.

## Repair rereview

The author repaired TIR-01 after the root's approval. Source reread confirms `startApi()` returns an error-aware listen promise and main awaits it before clock/poll/READY (`server.mjs:626-628,664-680`). Bind failure writes `startup-error.txt`, closes browser and game listener, and exits without READY. The static game listener also rejects binding errors. `start.mjs:55-61` now checks known child exit/code/signal before accepting the marker. This closes the reported control-flow defect. No session/occupied-port runtime check was performed by this reviewer; no unresolved high-confidence finding remains in this reviewed packet.
