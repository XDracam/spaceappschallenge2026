# Archive supplement B — semantic review, November 16, 2026

Read all six complete batches `/tmp/nasa-doc-read-7.txt` through `-12.txt` (1,357 lines; 22 repository documents), re-reading individually after the initial combined tool output exceeded its display budget. No repository changes or tests. These are historical records; old budgets, networking, Science models, typography and checks are not treated as current faults.

## Additional useful findings

### B01 — P2: Evidence is candid but insufficiently durable for outside review
`docs/playtests/2026-11-14-agent-playtest-r001.md:33` points at a local ignored final-state file, `docs/playtests/2026-11-15-agent-playtest-loop.md:56,90` explicitly keeps full evidence in local ignored runs, `docs/playtests/2026-11-15-release-fixes-walkthrough.md:20,54` records temporary calculations/bundles, and the timeline record references `/tmp` screenshots (`docs/playtests/2026-11-15-timeline-walkthrough.md:47`). These are honest limits, not fabricated evidence. Their impermanence means a public reviewer cannot follow many detailed claims to original evidence.
Recommendation: a compact evidence manifest for the submitted version, with public/private/ephemeral labels, retained representative screenshots and an immutable source/build identifier. Preserve historical notes; add an index describing evidence availability rather than replacing old claims or inventing missing screenshots. This is documentation/release hygiene, not a demand to add/run tests.

### B02 — P2: Future observation template lacks required build identity and reproducibility fields
`docs/playtests/TEMPLATE.md:6` asks generically for “Prototype version or files”; it does not explicitly request commit/build hash plus dirty diff fingerprint, seed, save version, browser/viewport, or evidence retention status. Later records repeatedly identify “current working tree” (`release-fixes-walkthrough.md:6`) and one admits its random seed was not recorded (`task-coordination-walkthrough.md:12`). Some records are more precise, proving a lightweight template can support this discipline without more narrative.
Recommendation: extend only the template for future observations with explicit optional-if-applicable fields. Keep historical reports intact; do not retroactively attribute them to a present commit. One concise verification record per submitted build will read more professionally than repeating broad “build passed” statements across task notes.

### B03 — P2: Supersession/correction notices occur after the findings they qualify
`docs/playtests/2026-11-15-task-coordination-walkthrough.md:7` names D-020, while its exact identifier remapping and obsolete graph-Science scope appear only at line 50. `docs/playtests/2026-11-15-release-fixes-walkthrough.md` places the later room-code merge caveat under “Subsequent integration before publication” at its end. The two-level release audit already handles this better with a top “Subsequent implementation” notice and link.
Impact: readers skimming titles/first paragraphs can mistakenly read a manual-code/old-Science walkthrough as evidence for today’s room-code/current-tree release.
Recommendation: preserve content and chronology; add a one-line archival applicability banner linking the existing correction and successor record, or show applicability in a separate archive index. Do not rewrite dated evidence to pretend it exercised later code.

### B04 — P3: Raw agent review scores should remain archived rather than used as quality claims
`mission-planner/notes/2026-11-14-ux-review.md` reports five agents’ intuitiveness/complexity scores and chosen fixes. `docs/playtests/2026-11-15-timeline-walkthrough.md:45-47` demonstrates why successful behavior checks and readable labels did not mean the user liked the first design; it preserves the user’s rejection and says acceptance of refinement is unverified. `docs/playtests/2026-11-15-agent-playtest-loop.md` carefully distinguishes an AI triage verdict from preference evidence.
Recommendation: keep these unusually useful negative records. Public-facing summary should cite observed behavior and actual user feedback, avoid selling aggregate agent scores or number of agents as professionalism, and use a short “what changed and what remains unverified” release note. No new gameplay evaluation is implied.

### B05 — scope guard: Preserve non-linear planning and one mission per attempt
`mission-planner/notes/2026-11-14-weather-mission.md:21-24` explicitly rejects a guided sequential flow because changes happen out of order. `mission-planner/notes/2026-11-14-ux-review.md:33` rejects back-to-plan editing after the final playthrough; `2026-11-14-ui-and-testing.md` says one level is one mission. Later D-029 accepts retry as a fresh attempt, not reopening the flown plan. “More professional onboarding” must therefore improve contextual labels/disclosures/recovery, without forcing Route→Spacecraft→Rocket→Orders or allowing edits to an already resolved attempt. This is a constraint verified from user notes, not a defect or proposal for gameplay change.

## Preserve rather than clean away

- Single-operator, constructed-state, actual WebRTC, build-only and human-play evidence are explicitly distinguished throughout these records.
- Historical fixture budgets/payment rules and UI screenshots intentionally differ from current gameplay. Their date/scope is evidence of iteration, not a current defect.
- The strongest editorial model is the short request→observation→limit→successor structure already used in several walkthroughs. Current-facing entry points can summarize it; do not strip original user notes or unsuccessful paths to reduce apparent AI involvement.
- Earlier slowed-calendar agent idle counts do not establish present human waiting; use them only as historical leads.

## Reviewed files

- `docs/reviews/2026-11-15-two-level-release-audit.md`
- `docs/playtests/2026-11-14-agent-playtest-r001.md`
- `docs/playtests/2026-11-14-procurement-gameplay-iteration.md`
- `docs/playtests/2026-11-14-procurement-interface-walkthrough.md`
- `docs/playtests/2026-11-14-procurement-ui-audit.md`
- `docs/playtests/2026-11-15-agent-playtest-loop.md`
- `docs/playtests/2026-11-15-contract-needs-walkthrough.md`
- `docs/playtests/2026-11-15-order-integration-walkthrough.md`
- `docs/playtests/2026-11-15-release-fixes-walkthrough.md`
- `docs/playtests/2026-11-15-task-consolidation-walkthrough.md`
- `docs/playtests/2026-11-15-task-coordination-merge-walkthrough.md`
- `docs/playtests/2026-11-15-task-coordination-walkthrough.md`
- `docs/playtests/2026-11-15-task-unification-walkthrough.md`
- `docs/playtests/2026-11-15-timeline-walkthrough.md`
- `docs/playtests/TEMPLATE.md`
- `mission-planner/notes/2026-11-14-build-decisions.md`
- `mission-planner/notes/2026-11-14-maneuvers-and-configurator.md`
- `mission-planner/notes/2026-11-14-solar-system-and-maneuvers.md`
- `mission-planner/notes/2026-11-14-ui-and-testing.md`
- `mission-planner/notes/2026-11-14-ui-feedback.md`
- `mission-planner/notes/2026-11-14-ux-review.md`
- `mission-planner/notes/2026-11-14-weather-mission.md`
