# Authored-content implementation — November 16, 2026

Implemented the parent's approved copy/content pass for C-01–14 (master R-07–12) strictly within `game/src/stations/*/data/**`. No tests, commits, deployment, artwork, audio, component structure, station layout or gameplay code changes. Read archive supplements A/B and retained the selected grounded light satire, named contacts, Call/Offer/Contract vocabulary and accepted Weather/Mars title helpers (the latter live outside this work's scope).

## Coverage

| Finding | What changed | Mechanics preserved |
|---|---|---|
| C-01 / R-07 | Replaced 18 immutable catalogue descriptions that claimed a part was currently locked/beyond research with stable product descriptions. Existing dynamic availability remains authoritative. | Every resource name/id, supplier list, part variant, stat and unlock gate unchanged. Blurb search terms naturally reflect corrected copy. |
| C-02 / R-08 | Moon audit/test-clause outcomes now explicitly require Science to test delivered parts; no longer imply that an audit repaired hardware. | Identical costs, trust, delay and price modifiers. |
| C-03 / R-08 | Five research-failure lines now describe unqualified results instead of inventing supplier problems, special test causes or restarts. | Same number/order of authored failure lines and same random selection behavior. |
| C-04 / R-09 | Thermal research names/descriptions now refer to insulation, layered barriers and surface thermal protection. Base branch description covers shielding and thermal control. | Tech ids (`better-ablator`, `dual-layer`, `reusable-tps`) deliberately remain stable, as do all grants, costs, prerequisites and timings. |
| C-05 / R-09 | Corrected optical ground-station approval, phased-array description and critical spacecraft electronics terminology. | Gate target/why text and all research grants unchanged. |
| C-06 / R-10 | Edited the repeated district-funding ribbons, fruit baskets, researcher arrivals and two repeated gala endings; kept selected local jokes. Outcomes lead with actual consequences. | No new offers, prices or staff; numeric amounts/durations in prose match existing effect arrays. |
| C-07 / R-10 | Moreau's spare-imager offer now states its useful condition; the sad/happy label joke is removed. Duarte's refusals have varied professional reactions. | Same character ids, options, cost and offer hardware. Satire retained elsewhere. |
| C-08 / R-11 | Ungated cost-memo stories now warn of a possible overrun instead of asserting an actual 20% overrun. Confirmation label explains cost risks. | Same pool eligibility, weighting, schedule, deadlines, ids and trust effects. |
| C-09 / R-11 | Funding/cut outcomes name the shared budget instead of implying four departmental grants/cuts. | Exactly the same budget deltas. |
| C-10 / R-11 | Removed “best cells known”, time-dependent “today” baseline claims and the unsupported first buried-ice-map promise. | Same research outcomes and required camera-mapping goal. No external scientific claims were added. |
| C-11 / R-11 | Student-microphone and spectrometer stories now describe outreach/research partnerships, explicitly leaving the flight payload unchanged. Connected titles/options were aligned. Moon vacuum-chamber result now says tests still need to be started. | Same event/option ids, option order, trust/budget/pace effects; no new payload, capacity reserve, equipment or automatic test. |
| C-12 / R-11 | All 26 good/bad in-flight descriptions explain operational support/readiness or uncertainty rather than guarantee orbit/landing/data outcomes or assert unmodeled fuel/date changes. Weather ground-station project no longer guarantees first-try downlink. | All 13 modifier ids/titles, thresholds, flags and numerical goalChanceDelta values unchanged. |
| C-13 / R-12 data portion | Normalized current programme spelling and percent spacing; expanded specific impulse (Isp) in two relevant catalogue blurbs; improved the two “land a lander” mission briefings. | Display strings only. Station capacity/request labels and shared formatting remain other agents' component scope. |
| C-14 / R-12 | Corrected present-tense comments for Weather budget/launch, short-copy guidance and the shared tree scope. | Comments only; no historical notes rewritten. |

**Excluded C-15:** Mars's ion offer remains `thrustKN: 0.25`, `isp: 3000`, `massT: 0.05` exactly as supplied. Its potential unit defect remains separately recorded and outside this pass.

## Static proof

Before editing, captured all 35 authored-data source files in `/tmp/nasa-content-baseline.json`. Every textual edit was made through TypeScript string-literal AST nodes or explicit comment replacements; an exact old/new display-string manifest is retained in `/tmp/nasa-content-string-changes.json`.

`/tmp/nasa-content-verify.cjs` parses baseline and final sources with the installed TypeScript compiler and walks their syntax leaves in order. It checks identical node kinds and leaf counts; any changed non-string token fails. Changed string leaves must match an exact approved old/new pair in the manifest. This preserves **all identifiers, numeric literals, operators, imports, conditions, arrays/order, grants, effect expressions, deadlines and non-display string values**. Comments are excluded by the parser, as intended. A separate check confirms the disputed ion offer's source values unchanged.

Final result, also retained in `/tmp/nasa-content-static-proof.json`:

- 35 baseline/final source files compared.
- 31,042 AST leaf tokens compared.
- 20 files changed; one is comment-only.
- 113 explicitly recorded display-string replacements.
- Zero syntax parse diagnostics.
- Zero non-display code changes.
- Ion offer unchanged.

`git diff --check -- game/src/stations/*/data` passed. Reviewed the actual data diff after implementation, including connected story options and outcomes. The final pass also retained existing quote styles to keep the diff readable.

This is static equivalence inspection, not a test suite or a gameplay playtest. It proves code/data mechanics were preserved within this owned scope; it does not prove that every new string wraps correctly, is preferred by human players or is absent from the submitted video. Full HD rendered copy review, final-video comparison and the coordinated typecheck/build belong to the parent's integration pass. Future saved news/history keeps its old text; ids remain compatible, and subsequent occurrences use the revised text.

## Files changed

- `game/src/stations/comms/data/content.ts`
- `game/src/stations/comms/data/mars/eventsPool.ts`
- `game/src/stations/comms/data/mars/eventsTimeline.ts`
- `game/src/stations/comms/data/mars/eventsTriggered.ts`
- `game/src/stations/comms/data/mars/inFlight.ts`
- `game/src/stations/comms/data/moon/eventsPool.ts`
- `game/src/stations/comms/data/moon/eventsTimeline.ts`
- `game/src/stations/comms/data/moon/eventsTriggered.ts`
- `game/src/stations/comms/data/moon/inFlight.ts`
- `game/src/stations/comms/data/moon/projects.ts`
- `game/src/stations/comms/data/weather/eventsPool.ts`
- `game/src/stations/comms/data/weather/eventsTimeline.ts`
- `game/src/stations/comms/data/weather/eventsTriggered.ts`
- `game/src/stations/comms/data/weather/inFlight.ts`
- `game/src/stations/comms/data/weather/projects.ts`
- `game/src/stations/planner/data/missions/marsOrbiterLander.ts`
- `game/src/stations/planner/data/missions/moonLander.ts`
- `game/src/stations/procurement/data/catalogue.ts`
- `game/src/stations/science/data/flavour.ts`
- `game/src/stations/science/data/techs.ts`
