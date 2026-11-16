# Archive semantic supplement A — 2026-11-16

Read all seven complete archive batches `/tmp/nasa-doc-read-0.txt` through `/tmp/nasa-doc-read-6.txt`, covering the files listed below. This was semantic document review, not a rerun of historical checks, external-source verification, a test or an implementation pass. No repository files changed. Historical quotations, typos and dated observations must be preserved.

## Additional useful findings

### AR-A1 [P2] Put final disposition before a rejected recommendation

`docs/reviews/2026-11-15-in-game-style-audit.md:3–5` opens with a broad station-style recommendation. Its rejection and reversal occur at lines 128–130. A person or agent following a direct link encounters an apparently current recommendation long before learning that the team rejected it. Add a dated opening status pointer to D-034 and the rejection section, leaving the complete historical recommendation intact. The docs index's current description should also make this final disposition explicit. This directly prevents a repeat of unwanted AI-driven restyling and has no gameplay/video impact.

Same principle applies to `docs/notes/2026-11-16-pages-https-research.md`: lines 11 and 14 still present `authorization_created` and `https_enforced:false` under “actual configuration”; lines 32–45 record approval and resolution. Add an opening “resolved” pointer like the existing `2026-11-15-https-handover.md` already has. Do not replace timestamped observations with invented current-state claims.

### AR-A2 [P2] Correct an assistant-written interpretation that reverses the fee direction

`docs/notes/2026-11-14-science-module.md:117` says “The user replaced the earlier proposal of research-team contracts with monthly fees”. The quoted German request at line 119 does not ask for monthly fees, and the interpretation at line 124 says one-off signing costs/no idle charges. D-032 independently confirms the simple one-off model. The introduction appears to invert which idea was rejected. Append a small dated clarification or explicitly correct the assistant narrative with a correction note; preserve the original user quotation. This is documentation accuracy, not authorization to change hiring costs.

### AR-A3 [P2] Treat completed investigations as history, not maintained operating instructions

`docs/notes/2026-11-15-audio-audition.md:38` says no main-game hooks exist and a local preview is retained on port 5178. The next day's implementation chronology already includes integrated audio (`2026-11-15-audio-integration.md`). These were true scoped observations at the time; they should not be silently rewritten. Introduce a compact status/date/superseded-by strip at archive entry points, with links to current run instructions. In the persistent docs index, distinguish “historical experiment” from “current operating guide”. Avoid stripping all chronology: the rejected achievement candidates and explicit limits demonstrate honest curation and are useful evidence.

### AR-A4 [P2] Correct the initial UI packet's editorial scope using source direction

The full notes establish that “Call” and the Task → Call → Offers → Contract → Allocation chain were explicitly selected by the user (`2026-11-14-procurement-terminology.md:3,13`); `2026-11-14-integration-questions.md` explicitly retains planner “Order part” wording. Therefore UI-07's vocabulary work must **preserve these accepted terms and explain them where needed**, not blanket-rename them for generic plain language. “Beyond research”/“within research” can still be clarified precisely without changing entity names or ownership.

Likewise `2026-11-15-title-screen.md:60–62` records the user's rejection of wrapping workarounds and explicit choice of “Reach geostationary orbit.”, “Orbit Mars. Land a probe.” and “Bring a crew, or play solo.” UI-14 should not propose rewriting/removing that selected helper; the genuine safe target is accidental duplicate adjacent exhortation, evaluated against current user preference and video preservation. UI-15's Moon sentence is the inconsistent newcomer; retain the accepted Weather/Mars short lines. This is a correction to the audit proposal, not a new defect in those accepted strings.

## Preserve as positive evidence

- Archived review language consistently distinguishes game proposals from selected rules, engineering sources from game balance, and single-operator/agent observations from human enjoyment.
- The CML and procurement research explicitly respect station boundaries and warn against turning the game into enterprise procurement software. These are useful safeguards for professionalization.
- Historical publication-cleanup records are candid that rewritten branch history does not guarantee old GitHub objects/caches disappear. Do not replace them with a false “fully removed” claim.
- Dated user quotes include typos, blunt feedback and German language. These are provenance, not editorial sloppiness to sanitize; improve the public reading route around them.

## Files reviewed

- `docs/notes/2026-11-14-accessible-gameplay.md`
- `docs/notes/2026-11-14-brainstorm.md`
- `docs/notes/2026-11-14-catalogue-gameplay.md`
- `docs/notes/2026-11-14-full-hd-mockup.md`
- `docs/notes/2026-11-14-gameplay-ux-audit-request.md`
- `docs/notes/2026-11-14-integration-questions.md`
- `docs/notes/2026-11-14-kickoff.md`
- `docs/notes/2026-11-14-personnel-tasks-roles.md`
- `docs/notes/2026-11-14-player-stations.md`
- `docs/notes/2026-11-14-procurement-alignment.md`
- `docs/notes/2026-11-14-procurement-interfaces.md`
- `docs/notes/2026-11-14-procurement-order-approval.md`
- `docs/notes/2026-11-14-procurement-order-decisions.md`
- `docs/notes/2026-11-14-procurement-order-options.md`
- `docs/notes/2026-11-14-procurement-planner-style.md`
- `docs/notes/2026-11-14-procurement-prototype.md`
- `docs/notes/2026-11-14-procurement-research-clarification.md`
- `docs/notes/2026-11-14-procurement-scenarios.md`
- `docs/notes/2026-11-14-procurement-stack-and-gameplay.md`
- `docs/notes/2026-11-14-procurement-terminology.md`
- `docs/notes/2026-11-14-procurement-ui-flow-request.md`
- `docs/notes/2026-11-14-procurement-workflows.md`
- `docs/notes/2026-11-14-role-actions.md`
- `docs/notes/2026-11-14-science-module.md`
- `docs/notes/2026-11-14-tasks-and-conversation.md`
- `docs/notes/2026-11-14-taxonomy.md`
- `docs/notes/2026-11-14-ui-agent-skills.md`
- `docs/notes/2026-11-14-ui-skills-integration.md`
- `docs/notes/2026-11-14-visual-aesthetic.md`
- `docs/notes/2026-11-15-audio-audition.md`
- `docs/notes/2026-11-15-audio-integration.md`
- `docs/notes/2026-11-15-github-pages-domain.md`
- `docs/notes/2026-11-15-https-handover.md`
- `docs/notes/2026-11-15-overnight-playtest-autonomy.md`
- `docs/notes/2026-11-15-procurement-artwork.md`
- `docs/notes/2026-11-15-publication-cleanup.md`
- `docs/notes/2026-11-15-publication-license.md`
- `docs/notes/2026-11-15-release-fixes-approval.md`
- `docs/notes/2026-11-15-task-consolidation.md`
- `docs/notes/2026-11-15-task-coordination.md`
- `docs/notes/2026-11-15-task-unification-approval.md`
- `docs/notes/2026-11-15-title-screen.md`
- `docs/notes/2026-11-16-pages-https-research.md`
- `docs/reviews/2026-11-14-cml-paper.md`
- `docs/reviews/2026-11-14-mission-planner-integration.md`
- `docs/reviews/2026-11-14-procurement-gameplay-ux.md`
- `docs/reviews/2026-11-14-second-planner-pull.md`
- `docs/reviews/2026-11-15-audio-plan.md`
- `docs/reviews/2026-11-15-contract-views.md`
- `docs/reviews/2026-11-15-in-game-style-audit.md`
- `docs/reviews/2026-11-15-task-coordination.md`
- `docs/reviews/2026-11-15-task-unification.md`
