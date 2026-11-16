# Post-submission professionalism audit

**Date:** November 16, 2026. **Source reference:** checkout at `6fed21a`, including the pre-existing working files listed in Coverage. **Status:** audit and proposed work only; no fixes accepted or implemented by this report.

## Main finding

T-Minus needs an editorial and reliability finishing pass more than a new visual direction. The orbital planner, procurement choices, engineering tree, stakeholder conversations and shared coordination are specific to this game. The strongest signs of unfinished generated work are **claims that disagree with the application, formulaic or mechanically misleading copy, conflicting current/historical documentation, incomplete interaction details, and development material inside the release**.

Keep the accepted art, station compositions, density, fonts and visual identity. D-034 explicitly rejected the previous broad station restyle. Keep the selected grounded satire: the answer is to edit repeated jokes and incorrect implications, not turn every character into a sterile technical manual. Retain candid AI disclosure and asset labels; “less AI slop” means more deliberate, accurate authorship, not concealing development tools.

The initial six specialist reviews and coordinating pass produced 88 finding entries before overlap consolidation; subsequent full archive reading added documented corrections and scope guards. That is **not 88 independent bugs**: dialog, selection, result-explanation and documentation issues recur across reviews. The prioritized register below consolidates related work; the appendices retain detailed evidence, examples and counterarguments.

## Reading this audit

| Document | Coverage |
| --- | --- |
| [UI design and editorial review](2026-11-16-post-submission/ui-design.md) | Independent source/static design assessment, personas, hierarchy, vocabulary, first-run and outcome experience |
| [Technical UI review](2026-11-16-post-submission/ui-technical.md) | Keyboard, dialogs, semantics, canvas, motion, rendering, raw detector interpretation |
| [Code and synchronization review](2026-11-16-post-submission/code.md) | Host authority, validation, save/reconnect integrity, performance and release checks |
| [Authored content review](2026-11-16-post-submission/content.md) | Every authored-data file; specific dialogue, technology, catalogue and outcome edits |
| [Documentation review](2026-11-16-post-submission/documentation.md) | Public entry points, governing instructions, current design versus preserved history, broken links |
| [Assets and submission review](2026-11-16-post-submission/assets.md) | Media/provenance, licenses evidence, title/portrait/audio assets, final video and public wrapper |
| [Tooling and evidence review](2026-11-16-post-submission/tooling.md) | Harness, old autonomous workflow, reproducibility and submission reference |
| [Archive review A](2026-11-16-post-submission/archive-a.md) | Full-reading coverage and corrections from 52 original notes/reviews |
| [Archive review B](2026-11-16-post-submission/archive-b.md) | Full-reading coverage of 22 playtest/planner records and additional scope guards |
| [File inventory](2026-11-16-post-submission/inventory.json) | Complete initial nonignored tracked/untracked file inventory, byte size and file kind |
| [Raw design detector output](2026-11-16-post-submission/detector.json) | Three source warnings, independently interpreted in the technical review |

Appendix-local IDs are retained for traceability. `UI-` means design review; technical review `T-` differs from tooling review `T-`; code `C01` differs from content `C-01`. Use the appendix name with its ID when assigning work. Master IDs below use `R-` to avoid ambiguity.

## Scope that preserves the submitted game

| Class | Meaning | Examples |
| --- | --- | --- |
| **S — invisible/supporting** | Changes outside recorded composition, or implementation details preserving normal gameplay and appearance | Documentation, packaging, validation, focus/ARIA, build checks, metadata |
| **V — visible refinement** | Same mechanics, but changed words/affordances may differ from recorded shots | Truthful result reasons, team label, dialogue, credits link, error message |
| **G — gameplay-sensitive** | Alters numerical behavior, available routes/content, timing, effects, conditions or balance | Ion thrust correction, mission availability, research grants, event eligibility |

S is a compatibility judgment, not a substitute for verifying a future patch. A focus fix can break a stacked overlay; a network validator can accidentally reject a legitimate action. V needs deliberate comparison with the local final trailer; the user’s video constraint is provisional, so no universal “all copy is safe” assumption is made. G is recorded for completeness and **excluded from the recommended professionalization work**.

Freeze mission goals, optional-goal scoring, costs, budgets, supplier numbers, research times/grants/prerequisites, event schedules/effects, reliability/randomness, trajectories, physics and station ownership rules. Do not add a campaign, onboarding game, backend, accounts, new missions or content-generation system. Do not re-edit the submitted video.

## Verified baseline and limitations

- The user confirms submission. An external submission receipt, judging acceptance and the exact uploaded file were not independently inspected.
- The local final trailer is `video/t-minus/T-Minus-Submission.mp4`; it supersedes the older Mission Control walkthrough. It is byte-identical to `game/public/submission/T-Minus-Submission.mp4`, which the public wrapper references. Verified properties: 29.500 seconds, 1920×1080, 30 fps, H.264/AAC, 16,777,426 bytes. Actual title/result frames and the contact sheet were inspected, plus seven retained station captures. This establishes the local visual reference, not an immutable historical source commit.
- Initial inventory: **445 tracked + 91 pre-existing untracked = 536 nonignored files**; 161 TypeScript/TSX, 137 Markdown. Existing changes were modified `docs/README.md`, untracked HTTPS notes dated November 15/16 and the untracked `video/` tree. Those were preserved.
- Historical-document coverage: the team semantically read all 98 archive/design/procurement documents in 24 batches, in addition to current entry points and six historical mockup source artifacts. Detailed manifests and methods are in the documentation/archive appendices; historical fixtures were inspected, not rerun.
- Authored-content coverage: all **35 data files / 4,404 lines**, comprising 91 Comms events, 28 projects, 13 in-flight modifiers, 16 character records, 46 Science tech/start nodes and 77 catalogue resources. Counts describe source definitions, not demonstrated mission coverage.
- **TypeScript passed:** `node node_modules/typescript/bin/tsc --noEmit`. **Production build passed:** `node node_modules/vite/bin/vite.js build`, 202 transformed modules. JS 768.07 kB / 239.40 kB gzip; CSS 168.47 kB / 31.52 kB gzip. Vite warned about the large JS chunk. These used existing installed dependencies; no clean npm install was performed because npm was absent from this shell.
- **No tests were added or run**, following project instructions. Static inspection, link scans, asset metadata/hashes, the design detector and compiler/build checks are identified separately; none constitutes a new playtest.
- Current live browser inspection was unavailable: CUA reported no browser and local Vite listen failed with EPERM. No keyboard, screen-reader, touch, zoom, contrast, live playback, frame-time or four-player network claims are made. Source-confirmed defects and static captured observations are labelled as such in each appendix.
- The Web Interface Guidelines source fetch failed DNS. The technical reviewer applied directly inspectable semantics and established accessibility patterns but did not claim a fresh guidelines-compliance pass. No fresh upstream license or dependency-advisory verification occurred.

## Recommended first batch

These are the best returns for a constrained post-submission pass. They are recommendations, not edits made by the audit.

| Order | Work | Reason | Class |
| --- | --- | --- | --- |
| 1 | Record the submitted artifact reference and current mission inventory | Prevent later cleanup from quietly changing what was judged | S; do not alter missions |
| 2 | Put Play/Watch, a concrete description and first-session instructions at the top of README | Visitors should understand and start the game before reading development-process detail | S |
| 3 | Refresh current-state docs and mark historical handoffs clearly | Existing instructions can send contributors toward obsolete architecture or completed work | S |
| 4 | Exclude the audition sandbox from release while retaining the archive | Removes internal workbench material and its unlabelled duplicate artwork | S |
| 5 | Repair the public video wrapper's width calculation and sharing metadata | Improves how submitted work is reached without changing the video | S |
| 6 | Complete dialog focus, issue-link keyboard access and selected/status semantics | Makes the existing interactions behave as deliberately as they look | S |
| 7 | Make clipboard success/failure truthful | Connection recovery should not say “Copied” when both copy methods fail | S/error-state V |
| 8 | Correct misleading research, team, funding and outcome prose in reviewed small patches | Most direct way to remove the impression of unedited generated content | V |
| 9 | Correct the optional-goal explanation precedence, preserving scores/chances | The submitted video visibly contradicts its own achieved orbit | V |
| 10 | Bound/validate host action input, save loading and network recovery | Hardens the same co-op experience without adding infrastructure | S |

## Consolidated improvement register

Priorities are relative to this prototype: **P1** means substantial trust/access/contributor-direction issue; **P2** means worthwhile finish; **P3** means optional maintenance. No reviewer demonstrated a new P0 blocker. Security findings assume a connected custom/buggy peer, not an arbitrary unauthenticated website visitor.

### Public repository and current truth

**R-01 · P1 · Reconcile mission inventory, without changing mission availability [S/G boundary].** The README/submission draft says two missions; `game/src/core/mission.ts:11` registers three, and Lobby includes Moon. Record the actual current inventory, distinguish the submitted description, and identify the submitted source revision if recoverable. Do not remove Moon to match old prose or claim its presence in the external submitted build without evidence. Evidence: documentation DOC-01/13, assets A09, tooling T-06.

**R-02 · P1 · Repair governing/current-state contradictions [S].** AGENTS still calls networking/license open; concept/roles/prototype say major implemented systems are undecided or unrun. Update current summaries against accepted decisions and source; preserve original brainstorm material with dates/status. Open long-term design questions remain open even if a provisional implementation exists. Evidence: DOC-02/03/10.

**R-03 · P1 · Retire executable-looking historical handoffs [S].** `playtest/NEXT.md` still points toward unimplemented recovery/joining/third-mission work that now exists. Add an unmistakable superseded banner and current destination. Preserve old package verdicts, not their authority over new work. Evidence: DOC-04, tooling T-05.

**R-04 · P2 · Reorder the README around the playable game [S].** Play is beneath roughly 743 words of process/disclosure material. Lead with one factual paragraph, Play/Watch, desktop/four-role context, one representative screenshot and concise first session. Move complete model inventory and preparation checklist behind links while retaining necessary disclosure/limitations. Say submitted per the user; do not claim acceptance or completed compliance. Evidence: DOC-05/06/14/15.

**R-05 · P2 · Give documentation a maintained information hierarchy [S].** Separate current implementation, decisions/open questions, research/history and verification. Surface rejected/superseded style/audio states so readers do not mistake old proposals for the next task. Maintain relative links and original records. Evidence: DOC-07/08/09/12.

**R-06 · P2 · Repair broken current links and annotate historical paths [S].** Ten missing relative targets were found; eight belong to a dated old-source review. Repair current source-of-truth links; annotate old paths with current mappings/permalinks rather than pretending today's source proved yesterday's review. Evidence: DOC-11.

### Product voice and authored content

**R-07 · P1 · Remove false static research-state claims [V].** Catalogue blurbs keep saying “not yet unlocked” or “beyond current research” after Science changes. Keep product descriptions stable and let existing dynamic status report availability. Preserve search implications and every resource/stat/unlock identifier. Evidence: content C-01.

**R-08 · P1 · Make narrative consequences agree with implemented effects [V].** Moon's audit says hardware was repaired although it changes trust/delivery; generic research failures invent supplier delays or restarts. Match the accurate Weather/Mars wording and use failure lines universally true of the failed research attempt. Do not add reliability/test behavior to justify the text. Evidence: content C-02/03.

**R-09 · P2 · Correct Science terminology without changing grants [V].** Thermal research describes entry ablators while granting Venus surface thermal protection; an optical link asks for a “landing licence” instead of partner ground access. Names/descriptions should explain existing effects. Do not move grants or prerequisites as an editorial fix. Evidence: content C-04/05.

**R-10 · P2 · Preserve satire but edit repeated templates [V].** Repeated ribbons, fruit baskets, “laptops and opinions” and “networked aggressively” recur with mission nouns swapped. Keep the strongest jokes, give contacts distinct professional concerns, and lead outcomes with their actual consequence. The detailed appendix provides examples; wholesale sterile rewrites would violate the selected grounded satire. Evidence: content C-06/07; UI-14.

**R-11 · P2 · Remove invented state and unsupported absolutes [V].** Ungated pool events assert a 20% budget overrun; funding prose implies separate grants to every station; outreach payload prose implies equipment mutations; in-flight descriptions imply fuel/orbit/date changes when only probabilities change. Rephrase as disputed risks, shared-budget changes or contribution to chances. Preserve event occurrence and numerical effects. Evidence: content C-08/09/10/11/12.

**R-12 · P2 · Correct capacity, failure and request vocabulary [V].** Science calls capacity “at work”; Planner calls all failure events “Part failures”; “within research” obscures a simple status. Use a short vocabulary map, exact count definitions and shared money/date display conventions. Preserve the explicitly selected Call/Offer/Contract/Allocation terms and Planner “Order part” wording; explain their effect in supporting guidance rather than renaming them. Do not collapse distinct Tasks/needs/requests or alter budget precision. Evidence: UI-02/07/09/11/15; content C-13/14.

### Interaction and accessibility finish

**R-13 · P1 · Complete modal focus lifecycle [S].** Procurement/project/result overlays use incomplete entry, containment and trigger return despite dialog semantics. Reuse the competent shared confirmation precedent. Keep nonmodal panels nonmodal; exercise stacked overlays before handoff. Evidence: UI-01; technical T-01.

**R-14 · P1 · Make actionable Planner issue rows keyboard-operable [S].** Clickable list items lack keyboard activation although neighboring goal rows have it. Native buttons can retain the current appearance. Evidence: technical T-02.

**R-15 · P2 · Expose selected/expanded state and finish radio navigation [S].** Science tech/inbox selection and Planner toggles are primarily visual; mission cards announce radio semantics without radio-keyboard behavior. Preserve layout, add appropriate native/state behavior, and avoid incomplete new ARIA widgets. Evidence: UI-03/04; technical T-04/05.

**R-16 · P2 · Announce meaningful accepted actions and urgent arrivals [S].** Plain status spans and changing bars are not a deliberate screen-reader announcement policy. Use concise polite status on transitions; do not announce the ticking calendar or entire growing news history. Evidence: UI-06; technical T-03.

**R-17 · P2 · Report clipboard failure honestly [S/V].** Fallback `execCommand('copy')` return is ignored and callers show success unconditionally. Select the code and give manual-copy guidance if copying fails. Evidence: UI-05.

**R-18 · P2 · Complete canvas alternatives selectively [S/V].** Existing DOM route controls already cover much planning. Heatmap arbitrary-cell/readout access remains pointer-only. Add meaningful summaries and a keyboard route to the same grid values; do not invent auto-planning. Avoid claiming complete map accessibility from a DOM scan. Evidence: UI-10; technical T-06.

**R-19 · P2 · Respect reduced motion in canvas and explain invalid numeric edits [S/V].** CSS overrides do not freeze JS-drawn decorative pulses. Slider text silently resets invalid drafts. Preserve intentional flight playback and exact numerical constraints while making preference/error behavior explicit. Evidence: technical T-07/08.

**R-20 · P2 · Improve existing help and truncated-name access [S/V].** Comms briefing cannot readily be reopened and uses a global seen key; Planner briefing can describe a paused clock as running. Full Science names require selection when nodes ellipsize. Use existing menus/tooltips/accessibility labels and actual clock state. Do not add a new forced tutorial or resize the tech tree. Evidence: UI-08/12/13.

**R-35 · P2 · Surface final disposition and correct the reversed fee interpretation [S].** The rejected style audit initially recommends the very theme the user later rejected; resolved HTTPS research initially reads like a live failure. Add a top status pointer or archive-index applicability field, preserving dated content. A Science note's assistant-written introduction says team contracts use monthly fees, contradicting the same note's quote/interpretation and D-032 one-off costs. Append a correction without altering the user quotation. Evidence: archive A AR-A1/2/3.

**R-36 · P2 · Make evidence retention/build identity explicit in future records [S].** Several candid walkthroughs link local ignored evidence or temporary bundles/screenshots. Preserve them as historical observations; do not imply the evidence is publicly reproducible now. Add an availability manifest and improve the future observation template with build/dirty-state reference, seed where relevant, viewport/browser and retention status. Do not use raw agent scores as public quality claims. Evidence: archive B B01/02/03/04.

### Result correctness and code reliability

**R-21 · P1 · Explain optional goal failure from the relevant achieved state [V].** The evaluator remembers the first 200 km altitude miss, later records GEO without the needed instrument, then chooses the old altitude reason first. Actual final-video result shows required GEO success next to optional explanations denying GEO. Correct explanation precedence only; do not alter achievable flags, probabilities, rolls or score. Evidence: code C01; assets A08; UI-16.

**R-22 · P1 · Enforce actor/host authority at host ingress [S].** The host receives a peer's action and trusts its supplied `by`; UI restrictions do not enforce ownership. Derive actor from connected peer/seat and allow only existing legitimate host/lobby/station actions. Avoid accounts/backend scope expansion. Evidence: code C02/C08.

**R-23 · P1/P2 · Validate and bound wire/action input [S].** Typed casts do not validate parsed packets. Finite numeric values, action argument shapes, bounded strings/collections and explicit rejection are needed at the trust boundary. Share bounded chunk framing across transports, with limits/expiry. Do not build an elaborate schema platform. Evidence: code C03/C04.

**R-24 · P2 · Recover safely from malformed local saves [S/V].** Current-version JSON can pass shallow gates then crash shell access to missing clock/state. Normalize/validate before adoption and offer recoverable reset/export rather than losing the opening screen or silently overwriting the record. Evidence: code C05.

**R-25 · P2 · Identify incompatible builds and bound reconnect states [S/V].** Reducer-replaying clients have no compatibility handshake; an open host and freshly deployed client can differ. Signalling reconnect can remain in a spinner without timeout/retry. Add a small compatibility identifier and bounded in-app recovery while retaining healthy channels/manual fallback. Evidence: code C06/C07.

**R-26 · P2/P3 · Measure before deeper performance/refactor work [S].** Full-state cloning/comparison/serialization happens frequently, all station views load eagerly, and idle Planner playback schedules RAF. The build's large chunk is observed; a runtime slowdown is not. Profile realistic long sessions before store rewrites; lazy-load only view code while preserving eager deterministic rule registration. Extract local color tokens only if computed values stay identical. Evidence: code C09/C10/C12; technical T-09/10.

**R-27 · P2 · Put compiler/build checks before merge [S].** Pages deploy currently catches build errors after main changes. A small PR check can run the existing typecheck/build with read-only permissions, retaining deployment separately. No new test suite is proposed. Evidence: code C11; DOC-14.

### Assets, sharing and production tools

**R-28 · P1/P2 · Keep the audition sandbox out of the shipped game [S].** `public/audio-audit` holds 62 files / 7.59 MiB of previews, rejected material and source snapshots. Its duplicate generated Earth image lacks the label/metadata present on the actual title art. A fresh build was observed to copy the sandbox into dist. Retain the archive and license evidence outside the public release; do not remove labels from the approved assets. This is deployment bulk, not a claim every player downloads all files. Evidence: assets A01/A02.

**R-29 · P2 · Bound the trailer page to available width [S].** The viewport-height width formula exceeds tablet portrait width despite max-width. Correct the wrapper, preserve the MP4/poster, then inspect narrow/short viewports. Unlike desktop station density, a public trailer page should be easily viewable on ordinary sharing devices. Evidence: assets A03.

**R-30 · P2/P3 · Make existing authorship and identity discoverable [S/V].** Add a compact Credits/About destination using retained records; standardize current public headings on T-Minus; add accurate description/favicon/social metadata. Keep stable storage/package/room IDs and historical names. The title appears in the video, so a new visible footer/link still needs comparison. Evidence: assets A04/A10/A11.

**R-31 · P2 · Stabilize font delivery without changing typography [S].** Self-host the exact used Exo 2/Inter families/weights with their license evidence if eliminating third-party availability is worthwhile. Preserve font metrics/appearance and verify loading; image files are already compact and do not justify blanket optimization. Evidence: assets A05.

**R-32 · P2 · Make media tooling reproducible and cache-correct [S].** Hardcoded workstation imports/source paths and fixed ports frustrate reproduction; scene-cut reuse ignores changed inputs. Declare tool dependencies, use package-relative paths/parameters, retain narration WAVs and document synthesis terms/version separately. Hash inputs/edits or make clean rebuild explicit. Never rerender the submitted delivery file as a side effect. Evidence: assets A06/A07/A09/A12.

**R-33 · P2 · Make harness readiness and build gates truthful [S].** Reusing a round appends logs and can accept old READY; startup records failed typecheck but only gates Vite; browser fallback is Windows/Edge-biased. Use fresh run identity, require compiler success, and document configurable browser discovery. Evidence: tooling T-01/02/03.

**R-34 · P2 · Keep agent telemetry and autonomous workflows in their proper scope [S].** The gap metric omits initial/final inactivity; dispatches cannot establish enjoyment. Old workflow explicitly allows systems/content rework, optional publication and broad recovery. Mark historical scope and prevent casual reuse as a “presentation-only” job. Do not run it in this pass. Evidence: tooling T-04/05.

## Deferred: changes that would violate the gameplay constraint

1. **Mars ion-offer thrust anomaly.** Negotiated offer uses `0.25 kN`, catalogue comparison uses `0.00025 kN`; model power/burn behavior consumes it. This may be a units defect, but intended value is unverified and changing it changes play. Record it separately; do not silently fix. Code C13 and content C-15 independently agree.
2. **Mission count/content changes.** Correct documentation to the verified current reference. Removing/adding Moon is a gameplay decision, not professional polish.
3. **Thermal-tech grant changes or new event gates.** Repair words to explain present grants/effects. Moving grants or suppressing a pool event when budget is low changes available decisions.
4. **Balance, realism and pacing.** Budget/research/facility numbers are provisional, but the audit's remit does not authorize rebalancing, physics upgrades, auto-planning or reducing concurrent interruptions.
5. **Forced sequential onboarding or reopening a resolved plan.** Original user notes reject a mandatory Route→Spacecraft→Rocket→Orders sequence. Improve context and recovery while preserving out-of-order planning and fresh-attempt retry semantics. Evidence: archive B B05.
6. **Broad visual redesign.** A new global palette/font/card system, changing graph geometry, replacing portraits/art and stripping glows would contradict D-034 and the recorded visual reference. Detector pattern warnings do not justify this.

## What the design detector actually found

Three warnings, all `side-tab`: Comms stakeholder project stripe, Procurement timeline need mark, Science research-branch border. The timeline match is a false positive; the others encode actual domain categories and require contextual judgment. Zero detector errors. These findings do **not** establish generic AI design or justify removing useful encoding. The independent design review identified more meaningful weaknesses without seeing detector output first.

## Verification plan for future fixes

Keep patches small enough to prove their boundary. This audit has not performed these future checks:

- **Editorial/docs:** verify every present-tense assertion against owning source/accepted decision; check links; retain all disclosures and historical IDs. Review exact changed dialogue against its effect array and keep every numeric value/condition untouched.
- **Visual compatibility:** compare actual affected screens at Full HD against final trailer frames and approved station appearance. Check wrapping, clipping, focus overlays and error states; metadata-only changes still need semantic inspection. Do not claim preservation from source diff alone.
- **Interaction:** Tab/Shift+Tab/Escape/trigger return for each affected overlay, activation of issue shortcuts, radio keys, selected state and single meaningful status announcement. Exercise heatmap alternatives and reduced-motion preference if changed.
- **Reliability:** verify legitimate four-seat actions plus rejected invalid/forged input, save recovery, timeout/manual fallback, and mixed-version explanation. Check with connected browsers when a browser/network surface is available. No penetration-test certification is implied.
- **Equivalence:** for explanation fixes compare old/new achieved goals, scores and probabilities; for refactors compare deterministic outcomes. Run compiler/build. Add/run tests only if the user requests them under project rules.
- **Release:** inspect built file list, asset request paths/font fallback, notices and final-video hash. Preserve the submitted export and record changes separately. No commit, push, tag or deployment is part of this audit.

## Delivery

Only audit documentation and its navigation/idea record were added. No game code, artwork, audio, video, gameplay data or historical note was changed. Ignored production output was rebuilt for verification. All proposed improvements remain reviewable choices; no finding itself selects a new mechanic.
