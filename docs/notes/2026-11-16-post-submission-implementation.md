# Post-submission implementation — November 16, 2026

## Direction and scope

Source: user in this conversation, after receiving the repository audit:

> coordinate subagents to work all of the audit in, cleanly improve all of the audit feedback, properly in context, no hacky patching, without causing new problems, in an idiomatic manner.

D-036 records the accepted scope. The implementation addresses the audit's 36 consolidated recommendations through six specialist work packets, integration and independent source review. Submitted gameplay, accepted visual identity, selected grounded satire and procurement vocabulary remain the boundary. The ion-thrust anomaly and all other numerical/mechanical proposals remain deferred. No commit, push, tag, deployment or final-video replacement occurred.

## Result

The game now has current public/developer documentation; more precise authored copy; consistent modal focus, keyboard and status behavior; recovery for invalid saves, rejected actions and incompatible builds; bounded shared network framing; host-enforced remote station ownership; local fonts/credits/sharing pages; and more reproducible, safer release/media/harness tooling. The audition archive remains retained outside the production public directory.

This is a prototype finishing pass. It does not establish human enjoyment, learning outcomes, absence of waiting, full accessibility conformance, universal network connectivity or immunity from defects. The walkthroughs below exercise concrete paths; they are not a certification of every possible state.

## Audit disposition

| ID | Disposition / owning change |
| --- | --- |
| R-01 | Current three-mission inventory and honest unknown submitted-source revision in README/current overview/submission reference; no mission added or removed. |
| R-02 | Current AGENTS/concept/roles/prototype/question statuses linked to accepted decisions; historical brainstorm preserved. |
| R-03 | NEXT and old autonomous workflow explicitly historical; no obsolete merge/revert instructions executed. |
| R-04 | Reader-first README: Play/Watch, concrete premise, first session and local commands; full disclosure retained separately. Original trailer capture copied unchanged to `docs/assets/submitted-planner.png`, so README does not depend on publishing the raw video-production tree. |
| R-05 | Maintained current/history/evidence navigation with full original index retained in history. |
| R-06 | Ten original broken relative targets repaired or explicitly mapped. Two newly historical audition links remain untouched in original notes and have dated relocation mappings; no broken current destination claimed. |
| R-07 | Product blurbs no longer assert stale research state; dynamic status remains authoritative. |
| R-08 | Moon audit and generic research-failure prose match actual effects; no invented repair/supplier behavior. |
| R-09 | Thermal/optical research descriptions match existing grants/gates; tech IDs and mechanics unchanged. |
| R-10 | Repeated punchlines edited with distinct professional concerns; grounded satire retained. |
| R-11 | Shared-budget, overrun, payload and in-flight prose states existing effects accurately; no event eligibility/effect changes. |
| R-12 | Team capacity, failure-category labels, status wording and money/date presentation corrected; accepted entity names and Planner Order wording retained. |
| R-13 | Small shared stacked-dialog focus/inert helper reused by existing overlays; browser nested-modal checks completed. |
| R-14 | Actionable Planner issue items use native keyboard-operable buttons. |
| R-15 | Selected/expanded state and full mission-radio keyboard navigation added without layout changes. |
| R-16 | Deliberate polite status/progress semantics for meaningful transitions; no live announcement of every calendar tick. |
| R-17 | Clipboard fallback boolean respected, truthful failure and selectable manual-copy recovery; forced-denial path observed. |
| R-18 | Map overview labelled and heatmap keyboard candidates/readout use the same grid/set function; existing DOM route controls retained. |
| R-19 | Canvas reduced-motion preference freezes decorative pulses; invalid numeric edits retain draft/error, Escape restores value. |
| R-20 | Comms briefing reopens and is remembered per mission; paused Planner help is truthful; full technology labels exposed. Unselected Moon card is concise; explicitly selected Weather/Mars/helper text retained. |
| R-21 | Optional-goal reason precedence fixed; actual before/after prepared route preserves outcomes, numeric evaluation and score. |
| R-22 | Host derives remote actor from peer/seat, enforces station namespace/host control, validates own seat claims; guest host-control attempt rejected in real WebRTC session. |
| R-23 | Runtime message/action/state guards and bounded shared expiring chunk framing; optional JSON null array slots normalized to omitted argument semantics. Production debug actions excluded, validated DEV functionality retained. |
| R-24 | Invalid save kept for download/reset; opening screen and explicit in-app confirmation remain usable. Populated save roundtrip observed. |
| R-25 | Protocol/source-content compatibility handshake and adopted-snapshot guard before action replay; bounded broker reconnection; incompatible production/dev pairing observed and rejected with guidance. |
| R-26 | Lazy station JavaScript, idle playback RAF guard, explicit state-derived planner mission/cache key and equivalent Science-local palette tokens. Larger-state tick profile: 30 saved designs / 61,271 JSON characters, 100 samples, median ~0.8 ms and p95 ~2.1 ms in this browser. No evidence justified a broad store rewrite, so that conditional proposal was deliberately not performed. |
| R-27 | Read-only PR compiler/build workflow added; deployment permissions remain separate; workflow not run remotely. |
| R-28 | All audition candidates/source notices retained under `dev/audio-audit`; production build excludes sandbox. Displayed duplicate artwork reuses labelled original, unlabelled historical bytes retained in the archive. |
| R-29 | Submission wrapper bounded by available width and height; 800×1000 rendered pages have no horizontal document overflow. |
| R-30 | Discoverable credits link/page, current public naming, neutral favicon and accurate share metadata; stable storage/network identifiers unchanged. |
| R-31 | Exact existing Exo 2/Inter weights self-hosted with source hashes/OFL; production browser requested all fonts locally and no Google Fonts URLs. |
| R-32 | Portable media scripts, fresh preview intermediates, frozen/export overwrite refusal, source/hash manifest and retained narration/model terms; final media not regenerated. Historical synthesis revision/settings remain explicitly unknown. |
| R-33 | Unique fresh run IDs/log/PID readiness; compiler failure gates startup; explicit browser selection; API/game bind promises resolve before READY. Independent reviewer caught and author repaired a remaining bind race. |
| R-34 | Activity summary has initial/between/terminal windows and limited meaning; old autonomous mechanics/commit/publication workflow requires a fresh explicit scope. It was not run. |
| R-35 | Archive applicability/index pointers surface rejection/resolution; dated correction records assistant's reversed team-fee interpretation without rewriting original user notes. |
| R-36 | Evidence availability index, submission/build reference and improved future observation template; old ephemeral evidence not invented. |

## Implementation and review packets

- [Core/network/result](../reviews/2026-11-16-post-submission-implementation/code.md)
- [Authored content](../reviews/2026-11-16-post-submission-implementation/content.md)
- [Public/current documentation](../reviews/2026-11-16-post-submission-implementation/documentation.md)
- [Shell, Science and recovery](../reviews/2026-11-16-post-submission-implementation/shell.md)
- [Station interactions](../reviews/2026-11-16-post-submission-implementation/stations.md)
- [Assets, release and tooling](../reviews/2026-11-16-post-submission-implementation/assets-tooling.md)
- [Independent integration review](../reviews/2026-11-16-post-submission-implementation/independent-review.md)
- [Independent tooling review](../reviews/2026-11-16-post-submission-implementation/tooling-review.md)

Packets retain their authors' check scope at handoff. The coordinating [browser verification record](../playtests/2026-11-16-post-submission-verification.md) supersedes earlier runtime-check TODOs; it does not retroactively turn source-only reviews into browser observations. Some packets name original temporary calculation files; the durable structured evidence is linked below and in the verification record.

## Verification and preservation

- TypeScript and production build passed. Main JS became ~539.86 kB / 168.55 kB gzip, down from 768.07 / 239.40 kB. The >500 kB Vite warning remains visible; no arbitrary warning suppression or speculative reducer split.
- Authored-data AST comparison covers 35 files / 31,042 leaves: 113 approved display-string changes, zero non-display token changes. [Proof](../reviews/2026-11-16-post-submission-implementation/content-proof.json) and [exact string manifest](../reviews/2026-11-16-post-submission-implementation/content-string-changes.json).
- Preserved source reference for comparisons is tracked game source at `6fed21a`, with no pre-existing local game modifications. Three fresh mission evaluations matched exactly. The prepared trailer route produced identical 2/2 required, 0/2 optional outcomes and score; complete comparison found only six explanatory/event-description string differences. [Comparison](../reviews/2026-11-16-post-submission-implementation/outcome-comparison.json).
- Actual manual-code WebRTC connection between isolated host/guest browser contexts: accepted research, optional-argument shared request, station switching and signed order; guest host-only control rejected; populated save reloaded identically. Local venue/network behavior only.
- Browser checks cover final production view loading/local fonts, numeric error/Escape, radio keys, selection state, procurement focus wrap, nested confirmation containment/return, raw corrupt-save preservation, Continue, Comms help, heatmap arrows/Enter, reduced-motion canvas stability, playback pause/resume and incompatible build recovery.
- The integration walkthrough caught a real lazy-CSS cascade regression (Science corners became 6px instead of accepted 4px). Existing station/panel/popup styles now load eagerly before shell overrides while JavaScript stays lazy. Final computed Science node 4px and Planner field/panel 6px match the preserved source. Science token expansion is byte-identical to the original stylesheet after substituting the original palette values.
- Final detector: five warnings, zero errors. Three are the already reviewed domain/category/date borders; two concern retained font choices on public pages. Accepted fonts and useful data encoding were preserved. Fresh Web Interface Guidelines retrieved November 16 and applied in the desktop-game context; no universal WCAG compliance claim.
- All seven runtime audio hashes, portraits, title art, poster and both final MP4 copies preserved. Final trailer SHA-256: `c297c588f2a5dc876396943788cb272d7f3e5d55932e2395fc03e9e6ae3fcf35`. Original `docs/notes/` files and the pre-existing untracked video media remain intact.

No test suite was added or run. The static inspections, compiler/build, measured calculations, manual CLI checks and scripted browser walkthroughs above are separately identified. Remote CI, fresh clean-install reproduction, strict-network/TURN outages, every old save migration, assistive technology, physical touch devices and human multiplayer enjoyment were not verified. No running browser contexts or verification servers are intended to remain after handoff.
