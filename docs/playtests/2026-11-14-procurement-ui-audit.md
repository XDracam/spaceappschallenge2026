# Procurement UI audit and interface walkthrough — 2026-11-14

- Status — completed source review and single-operator browser walkthrough.
- Facilitator — Codex using Impeccable and Web Design Guidelines.
- Participants — agent-operated procurement station.
- Prototype — `procurement/mockups/catalogue-full-hd.html`, adjacent JavaScript and `planner-theme.css`.
- Related — D-004, D-007, D-011, D-013, D-014, I-060.

## Request and scope

The user requested applying the newly installed skills to audit and improve the current game prototype, preserving the planner visual language, direct player conversation and existing work. Apply web guidance pragmatically to the Full HD game station. Keep accessibility work proportional to the prototype.

## Hypothesis

Larger need metadata, distinct blocking feedback, recoverable empty results and persistent keyboard focus should make procurement easier to operate. A failed purchase path, lost focus, hidden warnings or overflowing panels would count against the implementation.

## Setup

Used the existing authored scene and its fixture controls. Initial available Budget is 120 credits. Existing payment, cancellation, personnel and timing rules remain illustrative. Reviewed the current Impeccable context, audit, polish and craft-floor instructions. Retrieved the current [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) on November 14, 2026. Applied their focus, feedback, forms, scrolling, font-loading and numerical-alignment guidance.

## Findings and changes

| Priority | Location | Finding and implemented improvement |
| --- | --- | --- |
| P2 | `procurement/mockups/catalogue-full-hd.js:155` | Need status and dates competed in a tiny row. Separate the need date, increase metadata and status to 12px, retain the date alongside textual review warnings. |
| P2 | `procurement/mockups/catalogue-full-hd.js:245` | Purchase blockers were repeated in two places, including green context text. Show the blocker once under the action, in amber, with a recovery suggestion for insufficient funds and an existing personnel Contract. |
| P2 | `procurement/mockups/catalogue-full-hd.js:183` | Empty search results provided instructions without a recovery control. Add Reset search & filters, restore all Resources and move focus to search. Add comparison-selection guidance through the existing button title. |
| P2 | `procurement/mockups/catalogue-full-hd.js:183` | Rebuilding category, Resource and need buttons discarded keyboard focus. Restore the matching rendered control. |
| P2 | `procurement/mockups/catalogue-full-hd.js:378` | All confirmations returned focus to Buy, including Contract operations. Restore the opening control or the current view button when the opener has disappeared or become disabled. Preserve active controls through dialog redraws. |
| P2 | `procurement/mockups/catalogue-full-hd.js:664` | Quantity edits could leave confirmation enabled until a later interaction. Read input changes immediately and update validation in place, retaining the input node. Invalid zero quantity now names the required whole-number minimum. |
| P3 | `procurement/mockups/planner-theme.css:129` | Static Contract terms consumed inspector space. Put the fixture terms in a native disclosure and reduce the illustration height to bring arrivals closer to the purchase controls. |
| P3 | `procurement/mockups/planner-theme.css:163` | Search removed its inner outline. Add compound-control focus styling, contained scrolling, tabular amounts, themed caret/selection and reduced-motion treatment for existing button transitions. |

Raised muted text luminance and catalogue category labels. Removed redundant heading kickers. Added a dark theme browser color and font-domain preconnects, and removed unused Barlow/DM Sans font requests. Fixed an unclosed Resource content span. A dark backing behind the inspector category keeps its text readable over the illustration.

## Actual sequence

1. Entered a search with no matching Resource. Reset returned all 15 Resources and focused search.
2. Used Enter on Personnel and a Resource. The category retained focus with four results, and selecting Leila retained focus on her Resource button. Enter on a shared propulsion need retained need focus.
3. Opened a purchase and pressed Escape. Focus returned to Buy. Confirmed Leila's 18-credit Contract. Available Budget became 102 and her need gained one promised unit. The already-contracted blocker appeared in amber.
4. Applied the 70-credit funding cut and inspected Atlas. With 32 available, the 44-credit purchase was blocked by a 12-credit gap. The criteria context remained separate from the Budget warning.
5. Published computer needs and opened allocation of existing laboratory computers. Invalid zero quantity immediately disabled confirmation and retained input focus. Restoring one allowed allocation. Available Budget stayed 120 in the fresh fixture used for this sequence.
6. Cancelled the 24-credit flight-tank Contract in the earlier reduced-funding scene. Available Budget rose from 32 to 44 and focus returned to Contracts. Escape from allocation returned to its opening Allocate button.
7. Changed funding while purchase confirmation was open. The first confirmation reviewed the changed facts and kept the dialog open with Confirm Contract ready for a subsequent deliberate action.
8. Opened a two-Resource comparison and returned to catalogue. Inspected initial layouts at 1920 × 1080 and 2560 × 1440. Neither had horizontal panel/page overflow. Read-only DOM checks found no internally clipped cards among the 15 Resources at Full HD. Vertical lists retain scrolling.

## Committed plan and single resolution

These were independent interface sequences with fixture resets. No mission launch or final simulation took place. Restored the initial catalogue scene and saved `procurement/mockups/catalogue-audited.jpg`.

## Observations

The browser error log was empty. JavaScript syntax and Git whitespace checks passed. No automated test suite ran. The mechanical Impeccable detector ran once, reporting planner glow/Inter aesthetic warnings and undersized text. The glow and font match D-013. Functional labels were raised to at least 11px in the theme after that scan. The detector was not rerun, so this is not a clean-detector claim.

## Interpretation and remaining scope

The fixes have direct observed interface effects. Readability and enjoyment still need player experience. Checks covered one browser backend and selected keyboard flows. Full screen-reader behavior, touch, alternate browsers, text zoom, comprehensive pixel contrast and performance profiling remain unverified. This station targets Full HD and larger under D-011. Cross-station multiplayer behavior, negotiation and concurrent activity require multiplayer observation. The planner canvas was outside this procurement review.

The existing catalogue, shared needs, Budget and Contract inventory remain the coherent product-specific structure. Persistent stateful controls, labeled fixtures and authored content are appropriate to the prototype. Broad mobile adaptation, URL-synchronized game state and a second visual identity were outside this pass.

## Follow-up

- I-060 records these implementation proposals and observations.
- Q-014 and Q-031 still require observation with players communicating directly.
- D-013 and D-014 provide the accepted visual and skill direction. These changes select no new economic or multiplayer rule.

## Semantic information hierarchy review

Follow-up user request on November 14, 2026

> I need you to audit in general how information is presented relative to its semantiv meaning. Is the information hierarchy good, correct, do we display the right things in the right size, unnecessary stuff?

Reviewed the current rendered catalogue, Contract inventory, Calls and Changes, with their owning JavaScript. These are design findings and proposals, retained as I-063 after the parallel-documentation identifier collision.

### Priority findings

1. **Context disagreement is the highest-risk presentation issue.** Selecting Flight propulsion changed the browse highlight to T-014 while the inspector continued to show Thermal-vacuum bench allocated to T-017. The same Buy panel remains visible on Contracts and Calls. Its dominant action can address an unrelated need. Preserve deliberate inspection where appropriate, while explicitly labeling the inspected Resource and purchase destination together. A focused need should have a clear relationship to that purchase context.
2. **The tradeoff hierarchy is incomplete.** Price and Resource name dominate catalogue cards. Delivery is tiny, and reliability requires selecting each Resource or opening comparison. Present price, expected availability and reliability together as the initial tradeoff information. Keep detailed specifications and supplier background in inspection.
3. **Need importance has little visual expression.** Every need receives similar emphasis and repeated zero-count text. The player must scan dates and counts to discover shortages and timing problems. Emphasize actual missing quantities and late/changed coverage, then the relevant need-by date. A compact textual all-covered state can replace zero-filled summaries. Determining priority automatically remains a proposal.
4. **Positive color has several meanings.** Fits, Available for other needs, existing supply and allocation explanations share green styling. Compatibility, a draft purchase and delivered coverage are distinct facts. Reserve strong success styling for actual satisfied coverage and use neutral informational treatment for compatibility and draft context. Use text to express each state.
5. **Money and supply labels lose their qualifiers.** Cancel · 12 cr leaves the amount's meaning implicit until confirmation. Label the cancellation fee. Free in a Contract row means unallocated quantity and can be read as zero cost. Prefer unallocated. The inspector combines ready free supply with a total promised count that can already be reserved. Keep availability and reservation separate in wording. Catalogue dates are expected availability when ordering now. Express that forecast explicitly.
6. **Badges favor record counts over attention.** Contracts includes historical records. Calls counts Open entries, so a returned Offer makes the badge decrease. A badge should communicate its meaning, with actionable returned Offers and affected Contracts being stronger candidates for foreground attention. These badge changes remain proposals.
7. **Secondary material consumes player attention.** Large section headings, repeated categories and illustrations compete with decision data. Repeated identifiers/revisions and fixture-language explanations can be quieter or disclosed when unchanged. Preserve short Task identifiers for spoken coordination. Keep authored/fixture explanations with the labeled prototype controls. The two equal revision values on a Call add little until a revision actually changes.

### Proposed emphasis order

- Highest — current need and purchase destination, available Budget, blocking change or shortfall.
- Next — Resource identity and acquisition tradeoff, expected availability versus need date, reliability and Budget remaining after commitment.
- Supporting — supplier, identifiers, detailed capabilities, Contract history and unchanged revision metadata.

For the existing Full HD theme, a proposed scale is 20–24px for the active decision heading, 18–22px for price and Budget consequence, 14–16px for meaningful timing/risk/status, and 12px for supporting metadata. These are layout starting points for another rendered pass.

The three-column arrangement, persistent available Budget, visible Resources, shared needs and separate confirmation of commitment already support the role. These findings concern emphasis and semantic precision. No multiplayer comprehension claim follows from this single-operator review.

### Independent verification

At the user's request, two separate subagents reviewed the recommendations against the implementation and supplied screenshot, without sharing their findings. Both confirmed competing browse/purchase contexts, mixed badge-count meanings and overloaded green styling. Both qualified the visual conclusions.

- Preserve intentional Resource inspection while clarifying its purchase destination. Automatic switching is an unselected proposal.
- Free means unallocated. Cancellation fees are already explained in terms and confirmation. Prospective dates follow the fixture's lead-time arithmetic, with uncertainty rules open.
- Returned Offers remain available and generate a Changes entry. The Calls badge excludes them.
- Reliability is absent from cards and available in inspection/comparison. Its relative prominence depends on the acquisition.
- Late and mismatched coverage already has exception styling. Category counts become useful when filtering.
- Exact type sizes, a universal ordering of tradeoffs and describing the heading as oversized remain design judgments requiring iteration. No player-comprehension result was established.
