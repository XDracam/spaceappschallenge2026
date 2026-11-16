# Independent integration review — November 16, 2026

## Scope and method

Fresh reviewer, separate from the implementing agents. Read current AGENTS.md and required project context, the master audit, current diff and owning source. Focused review: host/client ingress and pending actions; protocol and compatibility handshake; both transports and bounded framing; save migration/validation/recovery; shared modal focus lifecycle and call sites; lazy station loading/error handling; numeric editing and heatmap equivalents; result explanation; authored-content mechanical boundaries. No source changes, tests, compiler/build execution, live browser observations, network probes or external claims performed by this reviewer. Parent owns actual integration walkthrough/build verification. Review conducted while small implementation batches were finishing; later changes require final parent diff inspection.

## Findings

### IR-01 · P2 · Remaining Comms in-flight preview overclaims recovery — corrected by owner

Source reviewed: `game/src/stations/comms/ui/Projects.tsx`, FlightOutlook. The positive preview still said each failed goal received a recovery chance; `planner/result.ts` requires a surviving flight, physically achievable goal and fallible part factors. This was an existing misleading statement within the audit's truthful-feedback scope, rather than a newly introduced numerical bug. Reported to parent and station owner. Owner verified the exact conditions and updated the copy to say surviving flight and physically achievable goals lost to part reliability. Negative preview likewise now conditions on surviving flight. No numerical effect changed. Parent should include the final rendered line in its copy/wrapping check.

## Reviewed invariants and rejected false positives

- Host derives actor from the transport peer's claimed station, rather than trusting `action.by`. A remote peer may claim only itself; core host controls and cross-station namespaces are rejected. The supported unclaimed-station hop still passes through `core/claimSeat`, whose reducer frees the prior seat. Explicit coordination requests remain available from occupied roles.
- Both client transports automatically attach the compatibility ID to hello. Host sends a snapshot only after compatible hello; welcome is sent first on the ordered channel. The shell installs the core client handler before sending hello, and transport early-message queues preserve the initial welcome race. Manual codes retain the fallback wire format.
- Reviewed action signatures against the runtime allowlist, including planner maneuvers, procurement orders/destinations, research/team requests, shared-request options and host controls. Null optional-array slots are normalized to undefined before reducer application, preserving local default-argument behavior after JSON transport. Top-level required arguments are guarded separately.
- Bounded framing limits incoming frame length, chunk index/count, aggregate message size and simultaneous assemblies; duplicate/inconsistent chunks fail; expired/closed assemblies release timers. Both transports share the same helper. This is source review, not a memory-exhaustion experiment.
- Save loading keeps migrations, validates current shape before adoption and retains bad raw storage until explicit reset. The guard covers populated market records, authored effect variants, research projects/facilities/teams, attempt histories, planner versions and branches, Comms events/modifiers and Science project info. Optional null launch history and bought/permanent until omission are allowed. Parent still needs populated live-save continuation, not only fresh-state validation.
- Preact 10.24.3's installed `compat/src/suspense.js:241` explicitly accepts `exports.default || exports`; the lazy loader returning the named Component directly is supported. It is not a React-only API error. Suspense and the error boundary provide meaningful loading/error states without changing eager reducer registration.
- Shared useDialog isolates the top modal's DOM branch, stores/restores prior inert values, filters disabled/inert/hidden focus targets, handles only top-of-stack Escape/Tab and restores trigger focus. ConfirmationPanel delegates to this lifecycle rather than competing with the former shell inert mechanism. Root should verify actual nested modal focus order because layout/source inspection cannot prove browser event behavior.
- Heatmap keyboard navigation invokes the same candidate set function and existing grid. Numeric error feedback preserves bounds/clamping and does not change values for invalid input. Playback RAF is gated by active playback rather than rewriting simulation timing.
- Goal explanation change only suppresses an irrelevant earlier altitude miss after a correct-altitude state exists. Existing blocked/missing-instrument reasons and achieved/chance selection remain intact. Parent should compare deterministic result/score values before claiming equivalence.
- Current procurement arrival helper preserves the committed floor-day/rounded-lead rule and applies it to previews; no new commitment timing rule was introduced.
- Deferred ion-thrust number remains outside the implementation. Accepted visual identity, mission set, research grants, event effects and non-linear planning are retained by the reviewed source changes.

## Disposition

No other high-confidence source blocker identified in this focused pass. This is not a claim of zero defects, security certification, accessibility conformance or four-player enjoyment. Required integration evidence remains the parent's compiler/build, actual four-station/manual WebRTC flows, populated save recovery, keyboard/focus/reduced-motion checks, video/asset hashes and before/after numerical comparison.

## Frozen-source follow-up: lazy station CSS cascade

Parent's actual browser comparison found Science node radius changed from accepted 4px to 6px because lazy station CSS arrived after shell corner overrides. Reviewed the parent's fix: load established station styles eagerly in main.tsx, in the original planner→procurement→science→comms order, before shell.css; remove Station component CSS imports while keeping view JavaScript lazy. This is a proportionate cascade fix, not a new theme or specificity hack.

Follow-up identified two remaining Planner component CSS imports (`RocketTab.tsx:1` panels.css and `Popups.tsx:20` popups.css). Reported that those should also be loaded before shell to make the preserved cascade complete. The parent owns the final edit and rendered confirmation. No source edits or tests performed by reviewer. Parent reports actual two-browser manual WebRTC connection, accepted Science/request/Procurement work, host-control rejection and save roundtrip; those are parent's observations, not independently rerun by this reviewer.

## Final closure after integration freeze

Confirmed in current source that all six station stylesheets, including Planner panels.css and popups.css, are imported in main.tsx before shell.css. A source search finds no remaining station-component CSS import. This closes the lazy-cascade review finding without !important overrides or changing accepted style values.

Reviewed the final Science-local token extraction: repeated declarations resolve to the same literal palette values and selectors/geometry remain unchanged; the parent's reverse-expansion equivalence and production measurements provide the actual verification evidence. The final Moon-card/setup edits retain the expressly selected Weather/Mars helper lines and solo-play statement. No further source blocker identified.

Parent reports final production typecheck/build success; baseline/current Planner numeric/panel corners remain 6px and Science nodes remain 4px, confirmed again in production. Parent also reports actual WebRTC/save/outcome/keyboard/modal/heatmap/reduced-motion/playback/compatibility checks passing. These observations close the previously listed integration prerequisites within their recorded scope; they are not an independent second runtime execution by this reviewer. This review remains source-only, with no added/run tests and no source edits.
