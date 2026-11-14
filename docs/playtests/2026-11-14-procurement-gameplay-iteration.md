# Procurement gameplay iteration — 2026-11-14

- Status — completed single-operator interface walkthrough.
- Facilitator — Codex.
- Prototype — existing standalone HTML, JavaScript and planner-theme CSS under `procurement/mockups/`.
- Related — I-062/I-063/I-064, D-004/D-007/D-011/D-013/D-014, Q-007/Q-008/Q-014/Q-016/Q-031.

## Source and question

The delegated user request asked for implementing appropriate improvements from the [high-level gameplay audit](../reviews/2026-11-14-procurement-gameplay-ux.md), combining it with the semantic review. The user then reiterated

> remember that this is a prototype *and* a game, so don't do traditional overengineering

The experiment asks whether the station can expose competing needs, pending consequences and the active decision together while retaining the existing prototype structure.

## Hypothesis

A compact situation summary, contextual decision panel and optional draft should expose tradeoffs before commitment and retain orientation during authored changes. Wrong-subject actions, hidden active controls, silent spending or lost draft intent would count against the implementation.

## Implementation choices

- A fixed left summary shows needs missing supply, the selected Task, draft cost and remaining funds, incoming information and unresolved supply issues. The detailed queue scrolls independently in authored order.
- The right panel follows Resource, Task, Contract, Call, comparison or plan context. Selecting a Task opens its requirements and compatible Resources. Purchasing from a deliberately selected Resource explicitly chooses the Contract destination. Details scroll between a fixed subject and fixed decision actions.
- The optional acquisition draft lists Resources, quantities, destinations, costs, expected dates, need dates and supplied-criteria warnings. Players add/update or remove draft entries and review each proposed Contract individually. Draft edits are planning state. Accepted Contracts use the existing commitment and changed-fact checks.
- Direct card comparison removes the selection/Add-to-compare round trip for each candidate. A Contract alternative comparison uses its accepted snapshot and actual expected delivery, alongside the new Offer's terms and additional cost. Cancellation stays a separately reviewed action.
- Procurement's own actions enter history as read. Incoming outcomes have an unread indication. Reading information preserves current supply exceptions, which are derived from Contract and Task state. Attention links select the affected Contract. The Calls badge explicitly counts returned Offers ready for review.
- Catalogue cards expose delivery and reliability together. Compatibility and draft explanations use neutral text, with strong status colors retained for actual coverage and exceptions.

These are assistant-selected prototype adaptations of the audit proposals. The draft is an optional interface experiment. It establishes no new economic, risk, timing, authority or multiplayer rule.

## Relation to the ludography

The audit's source ledger informed the adaptations. Factorio supports showing fulfillment consequences where the player works. X-COM supports displaying combined proposed cost alongside funds. PULSAR supports connecting component comparison to the relevant replacement action and crew awareness. EmptyEpsilon motivates evaluating meaningful independent station decisions. Those precedents support the questions being explored. The current walkthrough supplies no evidence about four-player pacing or enjoyment. No reference game was played during this pass.

## Setup and actual sequence

Used the existing authored September 2028 scene, starting with 120 available credits and four Contracts. Tuning values and fixture economics are inherited illustrative rules.

1. Selected Flight propulsion while a bench was selected. The right panel showed the Task and its criteria with the catalogue Buy action hidden. Selected laboratory-computer Contract C-001 and observed its own quantity, reservations and allocation action.
2. Added bench 22, Leila 18, Atlas 44, spectrometer 29, Ravi 24 and venue 9 to the draft. The plan showed 146 proposed cost and a 26-credit gap against 120 available. The four real Contracts and available Budget were retained during draft editing.
3. Opened the bench's planned Contract and applied a 70-credit funding cut. The first confirmation reviewed new facts while retaining the dialog. The next confirmation accepted the 22-credit Contract. Available funds became 28, the draft retained five entries and the incoming badge counted the funding change. The procurement record entered history.
4. Applied 30 funding, accepted the planned engine and delayed it beyond the supplied need date. Its attention control opened the exact Contract. Marked information read and observed the supply issue still present.
5. In a fresh six-entry draft, accepted Atlas for 44, leaving 76 available and 102 in proposed spending. Delayed it to May 2029. Compared its accepted terms to Pioneer. Atlas showed May 2029 promised, 97% reliability and zero additional commitment. Pioneer showed November 2028 if signed now, 84% reliability, a new 30-credit commitment and 46 available afterward. Cancellation was presented separately.
6. Published the two computer Tasks during comparison. The view stayed on comparison. Eight Tasks and a new-information indication appeared in the fixed summary while the detailed queue scrolled independently. Allocated the existing C-001 computer to T-031. Available funds stayed 76 and all five draft entries were retained.
7. Advanced two months and opened Calls. The returned Offer appeared with a `1 ready` badge and its own Call context. The catalogue Buy action was hidden in that view.
8. Selected Atlas and Pioneer directly for comparison in two card actions while the inspected Resource remained the bench. Opened comparison and returned. Expanded Contract terms and measured the fixed purchase action at approximately y=907, inside the Full HD station. The action area ended at y=1025 with a 1080px content viewport.

## Committed plan and single resolution

The sequences used manual fixture resets and month advancement. Accepted individual Contracts and Allocations are recorded above. Mission launch and final simulation remain outside this artifact. The browser was left showing the illustrative six-entry, 146-credit draft with its 26-credit shortfall.

## Observations

At 1920 × 1080 and 2560 × 1440, the page matched the content viewport and the panels had no horizontal overflow. Supporting details and the Task queue can scroll. At 2560 × 1440 the Buy action remained inside the viewport at approximately y=1267. With eight Tasks and a selected Task, the fixed overview ended around y=344 in Full HD. The browser error log was empty. JavaScript syntax and Git whitespace checks passed. No automated test suite ran.

Saved `procurement/mockups/catalogue-station.jpg` and `procurement/mockups/acquisition-plan.jpg`.

## Interpretation and follow-up

The observed interface paths support discussing a package, reusing existing supply and revisiting a delayed Contract without discarding draft intent. The walkthrough establishes interface effects. Multiplayer enjoyment, meaningful concurrent activity, reliability outcomes and pacing remain unverified. Supported station dimensions remain Full HD content area and larger. The economic and authored-event fixtures retain their provisional status.

Atomic reallocation, shared networking, an automatic optimizer, new supplier minigames and clock/urgency rules remain outside this iteration. The next useful validation is players negotiating a concrete acquisition package and responding to a funding or delivery change.

## Follow-up cleanup sweep

The user requested correcting the independent audit's semantic ambiguities and repetition, and added “and feel free to use expressive icons instead of repetitive text”.

- Cards now name the contribution and matching Task code, such as Laboratory equipment for T-017. Unmatched cards omit the generic line, while inspection explicitly reports an absent current match. Partial matching is also explicit in comparison, plan and Call wording.
- General delivery information is available in Contracts & deliveries. Resource inspection contains its own contribution, contracted supply and decision terms.
- Comparison selection uses a shared two-column SVG control with a selection check, exact Select/Remove tooltips, accessible names and pressed state. Compare selected opens the actual comparison.
- Calls label returned results as Offers to review and Offer received. Ready describes available supply. Zero notification badges are hidden.
- Filtered cards omit redundant categories, supply summaries omit zero counts, and plan arithmetic has one dedicated summary in Plan. Selected Task identity and decision-critical price, expected dates, reliability and shortfalls remain visible.
- Static engine descriptions describe the package instead of asserting a changing Task match. Cancelled Contract details use the former delivery date and retained reservation history.

Verified in the Full HD browser that purchasing the bench leaves T-017 with one missing contribution and one promised contribution. Contracts & deliveries displayed the records and dates. Two months of fixture advancement produced one Offer to review, with price, expected availability and reliability in its Call context. A five-entry draft after the bench purchase showed 124 proposed cost and a 26-credit gap against 98 available. Duplicate center/sidebar plan totals were absent in Plan, and empty plans omitted zero arithmetic. Selecting comparison icons retained keyboard operation and selected two candidates while leaving comparison closed. Filtered Personnel showed four cards and zero category labels. The unmatched antenna reported its actual unmatched state in inspection.

JavaScript syntax and Git whitespace checks passed. The browser error log was empty. Full HD had no horizontal overflow or internally clipped Resource cards. Saved `procurement/mockups/catalogue-focused.jpg`. These observations establish presentation and interface behavior. Player interpretation and multiplayer experience still require observation.

## Gameplay-first decluttering after synchronization

The user requested committing, pulling and pushing the existing work, then completing the cleanup of information that distracts during play. Synchronization imported the science and communications stations. Documentation conflicts were resolved by preserving both sets of notes and aligning incoming idea/question IDs.

Removed the redundant catalogue heading, category captions and image annotations, catalogue/Task/Contract record counters, idle status message and catalogue help footer. Budget accounting, supplier/narrative information, Contract terms and scenario controls now open on demand. The selected Resource's capability summary stays beside its name. Available funds, Task identity and shortages, quantity, contribution, price, delivery/need dates, reliability and commitment feedback stay on the gameplay surface. Comparison selection uses the same labelled icon in the inspector and cards.

At Full HD, opened Budget breakdown and Resource details and read their retained values. Opened scenario controls while purchase confirmation was held, applied a funding cut, reviewed the new facts and confirmed the bench. Funds changed from 120 to 50 to 28, with one materials contribution still missing. Compared Atlas and Pioneer and observed their reliability figures. Added a bench to a draft and observed 22 proposed cost and 98 available afterward. The page measured 1920 × 1080 and the Buy action ended around y=934. No card was internally clipped and the browser error log was empty. JavaScript syntax and Git whitespace checks passed. The localhost server was restarted after it stopped responding, and verification continued in a fresh preview tab.

Saved `procurement/mockups/catalogue-clean.jpg`. The information disclosure choices are prototype refinements and still need feedback from players.

## Repeated labels replaced by icons

Following the user's further cleanup request, recurring availability, need-by date, reliability, currency and supply-state labels now use shared SVG icons with values, tooltips and accessible group names. Calendar marks expected availability, flag marks the need-by date, shield marks reliability, and coin marks cost. Missing, promised and ready counts use triangle, hourglass and check-circle respectively. Late warnings retain explicit text. Contribution names and Task codes remain specific. Generic guidance in Plan, Compare and Changes was trimmed, and Contract quantities use one Total / unallocated column heading.

Verified Full HD rendering and icon names/values, purchased the bench and observed one missing and one promised contribution, inspected the resulting Contract quantity of 1 / 0, and staged the 44-credit engine with 54 remaining after the draft. The browser error log was empty, the page measured 1920 × 1080 and Resource cards had no internal clipping. Syntax and whitespace checks passed. Saved `procurement/mockups/catalogue-icons.jpg`. Icon comprehension remains a prototype design judgment pending player feedback.

## Standard icon pack, dollars and named shortages

User corrections requested a real icon pack, consistent currency and explicit missing items, followed by “actually just use dollars instead of credits, make it simpler”.

The prototype now uses a local subset of Lucide Static 0.468.0 with its ISC license. Comparison, selection, calendar, deadline, reliability, search and budget-chevron symbols come from that pack. Dollar amounts share one formatter across cards, Budget, plans, Contracts, confirmations, history and scenario messages. Whole amounts display as $22 and fractional amounts as $4.50.

Task shortages use the authored Task wording. Initially T-017 shows “Missing test bench, materials researcher”. After buying the bench it shows “Missing materials researcher” and “test bench incoming”. The bulk computer Task shows “Missing 2 × Workstation”.

Verified the bench confirmation at $22 and Budget $120 → $98, a venue cancellation fee of $4.50 and resulting $93.50 Budget, funding increasing that to $123.50, and a $44 draft leaving $79.50. Comparison showed $44/$30 options and $76/$90 remaining. Rendered text contained neither old currency abbreviations nor NaN. Full HD had no internally clipped cards and the browser error log was empty. Syntax and whitespace checks passed. Saved `procurement/mockups/catalogue-dollars.jpg`.
