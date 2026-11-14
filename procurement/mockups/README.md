# Procurement desktop mockup

Open [catalogue-full-hd.html](catalogue-full-hd.html) in a desktop browser. The station targets a 1920 × 1080 content area and expands on larger displays. Smaller windows can scroll the full-size design. Use the Full screen button or the browser's full-screen command.

The catalogue includes authored equipment, personnel, mission hardware and services. Shared needs stay visible alongside a selectable resource inspector and the current Budget.

## Interactions

- Browse categories, search by name or qualification, sort by price or availability, and select catalogue resources.
- Click a shared need to highlight fitting Resources and inspect ready, promised, missing and affected supply. Matches only is an explicit optional filter.
- Choose a compatible need or keep supply unallocated, then confirm procurement. The Contract, Allocation and Budget update together.
- Add up to three candidates to an optional side-by-side comparison, retaining the original browse context.
- Inspect Contracts, split quantities across Tasks, cancel active commitments, and release or reassign promised and delivered Allocations.
- Open or withdraw Calls. The mockup's calendar control reveals predefined supplier responses and delivers due Contracts.
- Persistent Changes retain funding, Task, supplier, research and delivery outcomes. Purchase and cancellation confirmation rechecks changed facts.
- The labeled fixture controls apply authored funding, engine-criteria, delay, research, bulk-need and withdrawal inputs, or advance one month. They remain usable while a confirmation is open. Refreshing restores the initial scene.

## Design status

This is a standalone interactive HTML design artifact. Prices, personnel examples, timing, reliability, procurement terms and detailed interactions are illustrative proposals. The scene uses payment on delivery and a 50% cancellation cost for active Contracts. Named personnel can be acquired once at a time in this mockup. Those fixture rules do not settle the wider personnel and economic models.

All resource and Call-response content is authored in the adjacent JavaScript file. The HTML loads it directly without a build step. The artwork is embedded SVG. The page requests Google Fonts and has local font fallbacks.

The prototype's selected technology baseline remains documented in D-009. The current gameplay scope is [catalogue acquisition and Budget management](../gameplay.md). The source request is preserved in the [Full HD handoff note](../../docs/notes/2026-11-14-full-hd-mockup.md).

## Observed UI checks

Inspected the station in a browser with a 1920 × 1080 viewport. Browsed personnel, purchased the laboratory bench and a materials researcher, and observed available Budget change from 120 to 98 to 80 credits. A simulated comms funding outcome raised it to 110. Advancing two months delivered both Contracts and exposed the predefined Call response. The browser reported no console errors during this walkthrough.

This was an interface walkthrough. Gameplay enjoyment and economic balance await player experience. The reference screenshot is saved as `catalogue-full-hd.jpg` beside the HTML file.

## Research improvement pass

The current [prototype review](../prototype-review.md) records which research proposals were adapted, deferred or omitted. The [manual interface walkthrough](../../docs/playtests/2026-11-14-procurement-interface-walkthrough.md) records checked scenarios and limits. The previous observations above describe the earlier interface. No multiplayer validation has taken place.

The updated screenshot is `catalogue-improved.jpg`. The earlier screenshot is retained as `catalogue-full-hd.jpg`.

## Planner styling pass

The current mockup uses the planner's dark glass, cyan glow, pill controls and Exo 2/Inter typography through `planner-theme.css`. The latest screenshot is `catalogue-planner-style.jpg`. The [source note and observed checks](../../docs/notes/2026-11-14-procurement-planner-style.md) record the adaptation and Full HD browser verification.

## UI audit refinement

The latest screenshot is `catalogue-audited.jpg`. The [skill-guided audit and walkthrough](../../docs/playtests/2026-11-14-procurement-ui-audit.md) records readable need dates, clearer purchase blockers, empty-search recovery, keyboard focus and quantity validation changes, with observed checks at Full HD and 2560 × 1440.

## Gameplay structure iteration

The [gameplay walkthrough](../../docs/playtests/2026-11-14-procurement-gameplay-iteration.md) records the current experiment. The fixed mission summary stays available while the Task queue scrolls. The right panel follows the active Task, Resource, Contract, Call or plan, with decision actions kept in reach.

Use Add to plan on a Resource to explore a package across needs, then review proposed Contracts individually from Plan. Draft totals expose the combined Budget consequence. Card-level Compare controls select candidates directly. Contract comparisons show accepted delivery terms alongside the alternative Offer. Incoming information and unresolved supply issues have separate attention signals.

Latest previews are `catalogue-station.jpg` and `acquisition-plan.jpg`. The plan and attention choices are prototype proposals. Player pacing and multiplayer enjoyment still need observation.

## Focused-label cleanup

The latest catalogue preview is `catalogue-focused.jpg`. The [follow-up walkthrough](../../docs/playtests/2026-11-14-procurement-gameplay-iteration.md#follow-up-cleanup-sweep) records contribution-specific matches, comparison-selection icons, Offer review wording, delivery context and consolidated plan/supply information.

## Gameplay-first default view

Latest preview — `catalogue-clean.jpg`. Open Available Budget for its accounting breakdown, Details & Contract terms for supporting Resource information, and Scenario controls in the footer for authored test events and month advancement. The default view emphasizes the current decision and mission needs.

Latest icon-based preview — `catalogue-icons.jpg`. Hover the calendar, flag, shield, coin and supply-state icons for their meanings. Critical warnings and contribution names retain text.

Latest corrected preview — `catalogue-dollars.jpg`. Procurement uses dollar amounts, the vendored [Lucide icons](icons/README.md), and explicit shortage descriptions. See D-015 and the [verified correction pass](../../docs/playtests/2026-11-14-procurement-gameplay-iteration.md#standard-icon-pack-dollars-and-named-shortages).
