# Documentation and public-repository audit packet — 2026-11-16

## Verdict

The most conspicuous problem is editorial ownership: the repository documents successive agent work sessions more clearly than it explains the finished game. This is fixable without changing gameplay, assets, or video-visible screens. The project already has unusually candid provenance and careful distinction between proposals and observations; preserve that honesty while giving players and contributors one short, maintained route through the material.

This packet is read-only. No tests, implementation edits, commits, deployment, external communication, or changes to original notes were performed. Findings below are source observations and editorial judgments; no claim is made that rewritten documentation was user-tested.

## Coverage and method

- Enumerated repository Markdown and mechanically scanned every nonignored Markdown document for missing local file targets. Root's inventory is 137 Markdown files; this packet's independent `rglob` scan counted 136 outside node_modules/.git/dist/video, including the existing hidden Impeccable report. This difference is scope/filter related, not a claim of two identical inventories.
- The independent local-target scan found ten unresolved relative-file links. Root independently confirmed the same ten.
- Follow-up coverage expanded to full semantic archive review: UI reviewer read all 52 documents in batches 0–6; asset/submission reviewer read all 22 in batches 7–12; this reviewer read the remaining 24 documents in batches 13–23 plus the historical mockup source. See coverage appendix and the two supplements. The initial selected-history limitation below describes the initial pass, not the completed team coverage.
- Required context read: AGENTS.md, docs/README.md, docs/concept.md, docs/decisions.md, docs/questions.md. Inspected root README, module entry points, current design/integration documents, challenge reference, setup/prototype, submission text/script, mockup notes, playtest entry/handoffs/changes, selected review/reference/interface documents, and relevant owning source to verify disputed claims. Programmatic heading/status/link searches covered the larger historical collection. **Not every word of all 136 Markdown files received semantic review.** Do not summarize this as a line-by-line reading of the entire archive.
- Compared mission-count claims against game/src/core/mission.ts and Lobby.tsx; Comms disclosure claims against Conversation.tsx and common.tsx; recovery claims against ResultRecoveryActions.tsx; build guidance against package scripts/workflow. These checks establish source contradictions, not runtime behavior.
- Existing historical archives include dated user notes, proposal studies, screenshots, JSON agent package reports, and playtest ledgers. Their existence is not a defect; these should remain traceable and be kept out of the main reader path.

Priority in this packet: P1 = serious credibility or contributor-direction problem; P2 = useful professionalism repair; P3 = low-risk editorial finish. None of these are proven gameplay blockers.

## Detailed findings

### DOC-01 [P1] The public mission inventory disagrees with the application

**Evidence:** README.md:5 calls the integrated game a two-mission prototype. docs/submission-text.md:13 and its detailed description repeat two scenarios. game/src/core/mission.ts:7 imports MOON_LANDER and :11 registers `[WEATHER_GEO, MOON_LANDER, MARS_ORBITER_LANDER]`. game/src/shell/Lobby.tsx:182 has a Moon presentation entry. playtest/NEXT.md:12 and :23 still say the third mission is not built. mission-planner/notes/2026-11-15-third-mission-proposal.md:3 says nothing in that proposal has been built.

**Why it matters:** a visitor can immediately see that the description and product are different, and a contributor can start rebuilding existing work.

**Recommendation:** establish the submitted build reference and write a current mission inventory from that reference. If the current application intentionally has three, update current README/module status; retain submission copy as a dated submitted/draft artifact with a note linking the current inventory. Do not silently change the historical proposal's claim as if it had been written after implementation. Do not remove or add missions to make prose true.

**Scope:** documentation-only safe; deciding whether Moon belongs in the post-submission build is gameplay-sensitive and outside this audit's implementation authority.

### DOC-02 [P1] Project instructions still classify resolved choices as blocked

**Evidence:** AGENTS.md:25 says how stations connect and the project license remain open. D-015 (docs/decisions.md:140 onward), D-025 (:259 onward), and D-027 (:277 onward) resolve these. The same line states an absolute no-switching rule without D-015's exception for unclaimed stations.

**Why it matters:** this file governs future agent work, so stale wording causes avoidable clarifications, wrong dependency plans, or regression toward an obsolete architecture.

**Recommendation:** refresh the current-state clause with links to the existing decisions; preserve actual unresolved questions such as host handover and strict-network reliability. State the unclaimed-station exception explicitly. This is instruction maintenance, not a new design choice.

**Scope:** safe documentation correction grounded in accepted decisions.

### DOC-03 [P1] Documents advertised as current still describe preimplementation brainstorming

**Evidence:** docs/concept.md:7 says station connections are open; :28 says no scoring model is selected; :36 lists platform, stack, phases, event rules and success as open. docs/design/roles.md:47 says the tech tree is unchosen despite D-020. docs/prototype.md:3 says no playable software has been selected or run; :35 says no observations exist, despite the populated docs/playtests/ directory. Root README.md:45-48 routes readers directly to these as the concept/current direction/prototype.

**Why it matters:** a diligent newcomer is rewarded with contradictory guidance. This looks assembled rather than maintained.

**Recommendation:** add a concise maintained `Current prototype` section, linking implementation and decisions, above preserved brainstorm material; label the original proposals with an explicit as-of date. Alternatively link the root README to a new current overview and label these historical exploration. Never infer that all brainstorm ideas became approved merely because code exists.

**Scope:** safe editorial repair; do not revise historical notes or resolve remaining balance questions.

### DOC-04 [P1] The contribution/handoff file can send a maintainer back to completed work

**Evidence:** playtest/NEXT.md:9 says no screen uses the recovery API; :20 says the result-card package is unfinished/not on main; :22 says faster joining is not started; :29-34 directs implementation/merging. Current game/src/shell/ResultRecoveryActions.tsx:7-9 exposes retry/choose; Lobby.tsx uses room-code joining and :328 mission choice. The handoff is explicitly dated, which helps, but its title/path implies next actions.

**Recommendation:** prepend `Historical handoff — superseded; do not execute these merge instructions` with a link to the actual current task list. Keep the dated package verdicts, branch references, rejection rationale and the original instructions intact below. Mark which entries were superseded through owning commits if easily available during implementation.

**Scope:** safe documentation; never run historical merges/reverts as part of cleanup.

### DOC-05 [P2] Play is buried beneath 743 words of process/provenance caveats

**Evidence:** README.md:9-41 places extensive AI authorship, model/tool inventory, submission-compliance caveats and scientific-scope discussion before `Running the game` at :53. The first direct game link appears at :59. README has no embedded gameplay screenshot.

**Why it matters:** a judge/player sees the production process before the product. Repeated caution makes a playable game feel unfinished even where evidence is good.

**Recommendation:** opening order: one concrete game paragraph; Play and Watch links; supported desktop/four-role context; one current gameplay screenshot; 5-step first session; local development; short scientific/AI acknowledgement with full-detail links; license. Keep every required acknowledgement and all factual limitations accessible. Transparency is a strength, not something to hide.

**Possible opening:** `T-Minus is a cooperative browser game about delivering a space mission. Plan a trajectory, buy equipment, develop and test hardware, and manage partnerships while sharing one budget and launch schedule.` Then direct Play/Watch actions. Mission count must be resolved through DOC-01 first.

**Scope:** safe repo presentation; use a screenshot from the submitted build so it accurately represents constrained visuals.

### DOC-06 [P2] The README still talks to a team that has not submitted

**Evidence:** README.md:24 `Submission disclosures still to complete or verify`; :28 `Before submission`; :35 says completion of submission has not been established. The user now explicitly confirms submission. docs/submission-text.md ends with a live-sounding internal predeadline checklist.

**Recommendation:** add a dated status note: `Submitted, per the team, November 16, 2026. The materials below record preparation and verification at the time.` This confirms only what the user said; do not turn it into a claim of judging acceptance or completed compliance. Move the unresolved preparation checklist into a clearly historical submission record and list any still-material unresolved verification separately.

**Scope:** safe documentation; user confirmation supports submitted status, not external acceptance.

### DOC-07 [P2] The documentation index is a session transcript index rather than an information hierarchy

**Evidence:** docs/README.md:9-23 begins with seven successive release/audio/style notes; its large tables intermingle brainstorm, approvals, audits and walkthroughs. :15 says audio is unimplemented immediately below the selected/integrated audio link at :9. :19 says finished artwork is outstanding although D-028 records its replacement at docs/decisions.md:303. :13 describes the broad style proposal without surfacing its later rejection in D-034.

**Recommendation:** top-level sections `Play / Build`, `Current implementation`, `Decisions and open questions`, `Research and design history`, `Verification records`. Group the many chronology links into subordinate dated indexes. Label historical audio/style entries as superseded/implemented/rejected with direct replacement links; preserve their original findings.

**Scope:** safe docs-only information architecture; retain stable existing links.

### DOC-08 [P2] Communications README contradicts current behavior and itself

**Evidence:** communications/README.md:3 claims this folder contains later implementation and the document specifies the final system; :11 says other roles do not send in-game requests to Comms, contradicting D-021's board. :44 says choices show hints rather than numbers; game/src/stations/comms/ui/Conversation.tsx:129 renders numerical `previewLines`, defined at common.tsx:135. :97 describes standalone app/shared folder/initials portraits; :99 describes integration; :109 then says not integrated. :123-125 lists content as open immediately after describing the built per-mission content.

**Recommendation:** begin with current code location, actual workflow, and a small current rules summary. Relegate dated original spec and standalone validation to history. Replace `final system` with a factual status. Document numeric previews as implemented; do not remove them to match the old spec. Avoid reproducing content counts unless maintained from actual definitions.

**Scope:** safe docs-only. The satire tone was explicitly directed; do not purge it merely because generated prose is being audited.

### DOC-09 [P2] Module documents offer conflicting sources of truth

**Evidence:** procurement/README.md:3 says standalone/no shared base/integration later, then :15-34 labels an earlier integrated implementation with old 30-day Call description. mission-planner/procurement-interface.md:3 links missing `app/src/model/types.ts` as source of truth and :7 describes a current planner-local runtime, while shared authoritative types live in game/src/core/model.ts. mission-planner/README.md:3 says later implementation, then :63 onward explains the integrated app.

**Recommendation:** use the science/README.md:3 historical banner pattern consistently: `Historical design/specification; current implementation is ...`. Add a small current procurement module map rather than making a reader infer present semantics from historical clauses. Make source-of-truth links point to current owning files and explicitly label older schemas as historical.

**Scope:** safe docs correction; do not change payment or task semantics to satisfy old descriptions.

### DOC-10 [P2] Open questions mix broad design uncertainty with resolved prototype implementation

**Evidence:** docs/questions.md:13 asks if outcomes are shared; :17 says the first scenario blocks a catalog; :21 says goal/outcome rules are blocked; :39 says all resolution/randomness questions are open. Current source and D-029 document shared outcomes, concrete scenarios and seeded resolution. Q-032/033/035 concern the superseded science knowledge graph, while D-020 selected the engineering tech tree.

**Recommendation:** retain every Q-ID and original question, add status fields `answered for current prototype`, `partly answered`, `deferred design research`, or `superseded by ...`. Link to D-020/D-029/current implementation. Distinguish implemented provisional choices from accepted long-term rules. Do not delete research uncertainty or claim balance/learning outcomes validated.

**Scope:** safe documentation; historical question IDs stay stable.

### DOC-11 [P2] Ten local Markdown targets are broken

**Verified full missing-target inventory:**
- communications/README.md:97 → `../shared/` (obsolete standalone folder).
- mission-planner/procurement-interface.md:3 → `app/src/model/types.ts` (obsolete source-of-truth link).
- docs/reviews/2026-11-14-second-planner-pull.md:13 → old RocketTab.
- same file :21 → old Mars mission and store (two links).
- same file :29 → old partInfo, RocketTab and NextStep (three links).
- same file :45 → old types and store (two links).

**Recommendation:** current module links should resolve to current code. For the eight links inside the dated review, annotate `path at time of review` and provide mapped current locations or commit permalinks; do not silently substitute current lines as if they were evidence of the old review. Anchor scan of current nonhistorical entry docs did not identify a missing heading; this was a simple heading-slug scan, not a complete GitHub renderer validation.

**Scope:** safe link maintenance; no network link availability claim.

### DOC-12 [P2] External-resource status has fallen behind the repository's own review history

**Evidence:** docs/challenge.md:21 says underlying resource contents have not been reviewed; the CML paper was reviewed in docs/reviews/2026-11-14-cml-paper.md and described as used in README.md:41. docs/challenge.md:37 says judging criteria/submission deliverables/deadlines remain unchecked; docs/submission-text.md and docs/submission-video-script.md cite reviewed submission/judging guidance.

**Recommendation:** preserve the original setup date but add per-resource status/date and link to the actual review. Split `listed research leads` from `resources actually used`. Add a dated later-verification note linking the submission preparation; do not declare external rules current without rechecking owning sources.

**Scope:** safe reference-status correction using existing evidence. This packet did not reverify the external websites.

### DOC-13 [P2] The submitted artifact lacks a single durable baseline reference

**Evidence:** README/docs show a live Pages URL that deploys on main changes; docs/submission-video-script.md:3 says exported footage unvalidated; current published trailer is linked from README.md:55 and video assets exist separately. The docs reviewed do not establish a unique immutable submitted commit/build plus final trailer checksum.

**Recommendation:** create a dated submission manifest recording exact submitted project/demo URLs, final source commit when known, final trailer filename/duration/hash, mission inventory, and screenshots identifying constrained visuals. Link it from root README and docs index. If historical submitted commit is not recoverable, explicitly say unknown; never guess from timestamp. Keep submission draft and production notes as history.

**Scope:** safe artifact bookkeeping. Creating a tag/commit/pushing requires separate authorization; not necessary merely to record known evidence.

### DOC-14 [P2] Current contributor guidance does not state reproducible prerequisites or a short verification path

**Evidence:** README.md:60 uses `npm install && npm run dev`; game/package.json exposes `typecheck`, `build`, `preview`; .github/workflows/pages.yml selects Node 20 and uses `npm ci`. README's contributor section :98-106 covers design-document process but not app structure or how to validate a behavior-preserving fix.

**Recommendation:** document Node/npm compatibility using the actual supported environment, `npm ci` for lockfile reproduction, `npm run typecheck`, `npm run build`, and `npm run preview` for release inspection. Link a compact architecture map and manual verification checklist. Note the existing project rule that tests are not added/run unless asked; do not invent a test suite or advertise checks this audit did not run.

**Scope:** safe developer docs; verify exact prerequisites before claiming support.

### DOC-15 [P3] Repeated generation-process caveats should be consolidated by audience

**Evidence:** README.md:7,13,35,39,41,94,106 repeatedly explains nonvalidation/noncompliance; docs index and most research/walkthrough documents repeat similar limits. These are individually defensible but dominate current reader paths.

**Recommendation:** keep a short, concrete limitations paragraph in the README and full method/evidence scope in verification records; link rather than duplicating long qualifications. Replace procedural narrative such as `three Terra source reviews` in navigation labels with what a reader will learn (`Audio choices and licenses`), leaving model provenance inside the dated record. Do not remove AI acknowledgements, actual limitations, original notes, rejection records, or evidence that agent checks are not human playtesting.

**Scope:** safe editorial compression; judge clarity by whether a reader can identify what is playable, how to start, and what is unverified within one screen.

## Recommended implementation order

1. Establish the submitted baseline and current mission inventory (DOC-01/13); no gameplay changes.
2. Rewrite root README reader order and update submitted status (DOC-05/06), keeping accurate credits/disclosure.
3. Repair authoritative instruction/current-state conflicts and module status banners (DOC-02/03/08/09/10).
4. Mark stale handoffs historical, restructure index, correct link/resource status (DOC-04/07/11/12).
5. Add reproducible contributor instructions and compress duplicated process caveats (DOC-14/15).

## Strengths worth preserving

- Honest, explicit AI authorship and human contribution, plus separation between development-time AI and authored runtime content.
- Dated approval/decision/idea/question identifiers and refusal to present unselected proposals as settled rules.
- Original notes retained with publication redactions rather than quietly rewritten.
- Third-party credits, research citations, local delivery/build guidance and known networking limits already exist.
- Many observed walkthroughs name what was actually exercised and what was not; keep those limits when creating a friendlier public-facing narrative.
- Rejected style pass remains visible in D-033/D-034. This is valuable design provenance and a clear warning against repeating a broad station redesign.


## Full archive follow-up — additional findings and safeguards

### DOC-16 [P2] Put final disposition before historical recommendations, especially rejected ones

The archive reviewers fully read all dated notes/reviews/playtests and found that important outcomes are sometimes buried beneath now-obsolete recommendations. `docs/reviews/2026-11-15-in-game-style-audit.md:3-5` opens with the broad station-style proposal, while user rejection and D-034 reversal are at :128-130. `docs/notes/2026-11-16-pages-https-research.md:11,14` presents failed provisioning/HTTPS disabled before :32-45 records resolution. The older saved `.impeccable/audit/2026-11-15T20-25-02Z__game-src.md` retains original audit recommendations without the public review's later implementation notice. Direct links or automated report retrieval can revive rejected/completed work.

**Recommendation:** one-line dated applicability/status/successor pointer at archive entry, keeping original findings and chronology intact. This extends DOC-07's navigation repair; it is not permission to apply the original restyle.

### DOC-17 [P2] An assistant narrative reverses the user's direction on team fees

`docs/notes/2026-11-14-science-module.md:117` says the user replaced earlier research-team contracts “with monthly fees”. The direct German quote at :119 does not request monthly fees; the interpretation at :124 and D-032 describe one-off signing/no idle charges. Add an explicitly dated correction of the assistant narrative or append a correction note; preserve the original quotation. No hiring mechanics should change. Verified independently by archive reviewer A.

### DOC-18 [P2] Make verification evidence durable and identifiable without expanding the test regime

Dated records honestly point to ignored local run state and ephemeral screenshots/scripts: `docs/playtests/2026-11-14-agent-playtest-r001.md:33`, `2026-11-15-agent-playtest-loop.md:56,90`, `2026-11-15-release-fixes-walkthrough.md:20,54`, and `2026-11-15-timeline-walkthrough.md:47`. Public readers cannot follow all these claims to their original evidence. The future `docs/playtests/TEMPLATE.md:6` asks only “Prototype version or files”; exact build/commit, dirty-state fingerprint, seed/save version and evidence-retention status are not explicit. At least one record says the seed was not recorded.

**Recommendation:** extend future observation template with concise applicable build/environment/seed/evidence-availability fields, and retain a compact representative evidence manifest for the submitted version. Label public/private/ephemeral evidence; do not invent lost evidence or retroactively attach old checks to today's commit. This complements DOC-13. No added/run tests are necessary to improve documentation of checks actually authorized later.

### DOC-19 [P3] Historical standalone previews need a current-product pointer, not a repair campaign

Read historical `communications/mockups/layouts.html`, `procurement/mockups/catalogue-full-hd.html`, its 889-line JS, 291-line planner theme and icon subset, and `procurement/concepts/orders.html`. They are intentionally separate artifacts with fixture economics, personnel, local calendar controls, noncurrent layouts and now-retired Science concepts. The orders study already clearly says static illustrative target; Comms layout and catalogue preview rely mainly on their page titles and adjacent READMEs for that distinction.

**Recommendation:** in an archive index, identify each preview's date, illustrative status and relationship to the current game; a small development-mockup/current-game link on direct preview pages is optional. Do not port mockup mechanics or spend release effort making all historical controls meet the current game's rules. These assets are not the Vite game's current UI. Browser execution of the historical previews was not performed in this audit.

### Source-direction guardrails established by full archive reading

- Preserve the explicitly selected Task/Resource/Call/Offer/Contract/Allocation/Budget vocabulary, and planner “Order part” wording. Explain terms where needed; do not rename the entire model as generic parts/orders to sound less generated.
- Preserve grounded light satire in Communications: the user explicitly selected it in `communications/notes/2026-11-14-comms-questions.md:50`. Improve repetitive/overclaiming prose without flattening all authored character voice.
- User rejected ASCII mockup presentation (`communications/notes/2026-11-14-comms-questions.md:38`) and forced sequential planning (`mission-planner/notes/2026-11-14-weather-mission.md:21-24`). Professional onboarding should remain contextual and non-linear.
- The final flown attempt stays one-shot; fresh retry is a new attempt. Do not add back-to-plan editing after the result under the label of professional recovery.
- User-selected title-helper lines and short Weather/Mars descriptions are intentional. Preserve accepted concise wording instead of adding explanatory paragraphs to every screen.
- Preserve failed agent rounds, rejected polish and user-rejected style proposals as evidence. Agent review scores and number of reviewers should not become marketing quality claims.
- Historical budgets, no-network status and retired Science recipes are not current defects merely because they differ from today's source.

## Full archive coverage appendix

The following semantic groups were read completely across the team, beyond the initial entry-point review:

| Group | Files | Reviewer / record |
|---|---:|---|
| `docs/notes/*.md` | 43 | UI reviewer, `/tmp/nasa-archive-supplement-a.md` lists every path |
| `docs/reviews/*.md` | 10 | UI reviewer (9) + asset reviewer (two-level release audit), supplements A/B |
| `docs/playtests/*.md` | 14 | Asset reviewer, supplement B |
| `mission-planner/notes/*.md` | 8 | Asset reviewer (7) + docs reviewer (third-mission proposal) |
| `docs/brainstorm.md`, `docs/taxonomy.md`, `docs/ui-agent-skills-research.md`, `docs/design/personnel.md` | 4 | Docs reviewer, batch14 |
| Procurement research/scenarios/order/timing/workflow design documents | 11 | Docs reviewer, batches15–20 |
| `mission-planner/rocket-configurator.md`, `solar-system-and-maneuvers.md`, `ui.md` | 3 | Docs reviewer, batches21–22 |
| `playtest/briefs/fixer.md`, `judge.md`, `player.md`, `triage.md`, `rework.md` | 5 | Docs reviewer, batches22–23 |
| Historical HTML/JS/CSS preview sources + icon source and README | 6 source artifacts plus icon README | Docs reviewer, source inspection only |

The 98 Markdown files in batches0–23 are distinct and their full paths can be reconstructed from the `FILE ...` headers in `/tmp/nasa-doc-read-0.txt` through `-23.txt`. Supplement A lists 52 paths and supplement B lists 22. The remaining 24 are the group rows above beginning with the third-mission proposal. The initial pass additionally read the root/module/remaining shared-design entrypoints, instructions, questions/decisions/ideas, submission docs and playtest handoff/contract docs, along with hidden saved audit. License/audio-credit documents are covered by the separate asset reviewer. JSON/harness/code/media coverage belongs to the other audit packets. This is a documentation content audit, not external verification of every historical citation or a reproduction of historical playtests.
