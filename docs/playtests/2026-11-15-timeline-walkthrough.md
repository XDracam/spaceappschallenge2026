# Procurement timeline walkthrough — 2026-11-15

- Status: completed limited implementation check, not multiplayer playtest.
- Facilitator/participants: assistant operating Procurement; Terra implementation/source-review agents.
- Prototype: D-019, ContractTimeline, timing helper and requested-date persistence.
- Question: does one amendment preview correctly compare delivery with use dates and retain explicit confirmation?

## Hypothesis

Arrival/need markers and exact margins support comparison. This walkthrough establishes behavior, not player comprehension or enjoyment.

## Setup

Isolated review save at localhost:5178, paused April 28 2030, viewport 1280×720. Existing incoming reserved research camera and undated shared camera. Original player save/tab at port 5173 was not used. No tests added/run.

## Actual sequence

- Inspected timeline and table; research deadline and undated supply rendered separately. Keyboard Enter selected a Contract. Switching selection cleared old preview.
- Fixed observed overlapping axis labels. Initial selection/inspector mismatch during hot-reloaded hook edits disappeared on fresh load; subsequent selections matched.
- Signed Science Contract 18, requested September 8, standard arrival September 27, 19.5 M. Timeline showed 19 days late.
- Priority preview showed August 28, fee 0.6 M, 11 days early. Before confirmation, arrival and funds stayed unchanged.
- Confirmed: arrival became August 28, commitment stayed 71.5 M and spent increased 15.7→16.3 M.
- Reload/resume preserved requested date and amended arrival. Header correctly stopped treating arrival after launch as automatically late.
- Confirmed zero-fee return to Standard; preview cleared. Left an uncommitted Priority preview visible for comparison.
- Final screenshot `/tmp/nasa-timeline-review.png` shows explicit Order requested and Bonus by labels.

## Committed plan and single resolution

No mission simulation or launch. Review game stays paused. Simulated purchases/amendments occurred only in the review save.

## Observations

Fresh independent source/screenshot review found original requested-date attribution ambiguous after reassignment. The UI now labels original order requests explicitly and distinguishes live Task/research dates. Header and news use the same timing helper; procurement allocation/release refreshes late status immediately.

## Interpretation

This does not establish multiplayer enjoyment. Large lists, multi-allocation Contracts, external delay/cancellation, legacy migration and exact same-day launch behavior were not exercised. Existing migration can infer legacy baselines, so Since signing can be approximate. Science reservation actions while paused may leave global late news/flag stale until next procurement tick; timeline/header derive live state immediately. Existing modal focus behavior was not requalified.

## Follow-up

Further feedback: user asked what the blue line means. Added visible endpoint labels (Arrives, Requested/Needed/Bonus by), interval captions (Time before need / Past need date), and changed spare to early. Checked the rendered overview at 1280×720; labels were readable without selecting rows. Saved `/tmp/nasa-timeline-labeled.png` and restored normal viewport. This checks rendering, not independently observed user comprehension.

User then requested this explanation in the legend. Moved interval explanations to blue/red line samples labeled “Early: time before need” / “Late: time past need”; removed repeated interval captions from rows. Endpoint labels remain. Verified legend fits the 1280×720 overview; screenshot `/tmp/nasa-timeline-legend.png`. Typecheck passed.

User feedback after handoff: “that timeline looks shit, and I really cannot tell anything interesting at a glance. it's just more dense hard to read data”. This rejects the first visual execution. Earlier successful behavior checks are not evidence of successful visual design. Refinement targets chart width, meaningful default date range, prominent missed-need gaps, and moving secondary details out of the overview.

Refinement observed: timeline now hides the Needs rail and opens its inspector only after selection; Close details restores full width. Date range initially fits actual arrivals/needs. Removed repeated row dates, supplier IDs, history/cutoff lines, six range buttons and explanatory footer. Red late intervals and a single margin figure lead; a proposed arrival uses a separate dashed interval and before/after margin. Exact dates/provenance remain in inspector and accessible row names. Fit dates includes a selected proposal without automatic rescaling. Observed overview and preview at actual 2140×1240 and temporary 1280×720 viewport; reset override afterward. Screenshots `/tmp/nasa-timeline-overview.png` and `/tmp/nasa-timeline-simplified.png`. Typecheck/build passed; no tests added/run. User acceptance of this refinement remains unverified.

- D-019 implemented; broader timeline additions remain unselected.
- Final TypeScript and production build passed; existing large-bundle warning remains. Whitespace check passed.
- Human reading/play session still needed to evaluate intuitiveness.
