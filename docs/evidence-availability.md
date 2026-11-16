# Evidence availability

Recorded November 16, 2026. This index describes evidence retained in the checkout and the availability stated by historical reports. It does not rerun their checks, recover missing files or attach old observations to the current source revision.

| Evidence | Availability and interpretation |
| --- | --- |
| [Submission artifact reference](submission-reference.md) | Identifies the retained local delivery file, metadata/hash and captures. The external receipt/upload and original submitted source commit remain unverified unless the manifest supplies direct evidence. |
| [Dated walkthroughs and reviews](history/README.md) | Tracked Markdown records preserve methods, actual observations, limitations and rejected iterations. Their stated dates/build stages matter; later source changes are not covered automatically. |
| Agent round final state, logs and screenshots | `playtest/runs/` is ignored by `playtest/.gitignore`. The [first-round record](playtests/2026-11-14-agent-playtest-r001.md) explicitly labels `playtest/runs/r001/final-state.json` local/not in Git; the [overnight record](playtests/2026-11-15-agent-playtest-loop.md) likewise leaves full run evidence local. Public documentation preserves the report, not an independently downloadable complete run. |
| Temporary calculations/builds and UI screenshots | [Release walkthrough](playtests/2026-11-15-release-fixes-walkthrough.md) and [timeline walkthrough](playtests/2026-11-15-timeline-walkthrough.md) cite temporary files. `/tmp` references are ephemeral provenance; continued availability is not promised and was not verified by this documentation pass. |
| Historical standalone mockups and adjacent images | Preserved under `communications/mockups/` and `procurement/mockups/`/`concepts/`. These are illustrative development artifacts; their fixture rules differ from current gameplay. They were source-inspected during the audit, not newly exercised. |
| [Post-submission audit](reviews/2026-11-16-post-submission-audit.md) and appendices | Retained preimplementation source, inventory, media metadata and limited static-capture evidence. The report explicitly states that a live browser was unavailable. It is not evidence of fixes subsequently working. |

## Reading observations accurately

A compiler/build pass establishes compilation/bundling for the recorded tree. A source review can establish an implementation path, but does not prove successful UI interaction or network behavior. Constructed state, a single operator controlling multiple stations, agents at four stations, and four human players answer different questions. Agent scores, action counts or the absence of reported problems do not establish enjoyment or educational outcomes.

For future authorized checks use the [observation template](playtests/TEMPLATE.md). Retain a small representative evidence set alongside its build identity where appropriate; label anything private/local/ephemeral. Record unknown seeds or dirty-state identities as unknown rather than reconstructing them from memory. Do not revise historical records to suggest they tested a later release.
