# Contract timeline design study

Date: 2026-11-15. I-081.

## Selected implementation scope — 2026-11-15

[D-019](../docs/decisions.md#d-019--reduced-contract-timeline-prototype) records the user's approval of a reduced timeline: show arrivals against actual needs with order identity, recipient and quantity; retain the Table; preview one selected amendment with current and proposed arrival and fee; and show concise local delay and cutoff feedback. No Upcoming area, Call or Offer-expiry integration, replacement comparison, or dependency graph is selected for this iteration. The separate budget composition remains a proposal. Approval does not establish implementation or playtest results.

The study below preserves the earlier, broader proposal and its evidence. Its recommendations, prerequisites and requests for approval are historical and apply only where consistent with D-019; they do not expand the selected scope.

## Audited concept revision — 2026-11-15

This revision supersedes the earlier composition below where they differ. User requested a comprehensive timing audit and a recommendation, without implementation. Two Terra agents independently read procurement and connected-role timing; the parent checked disputed findings against source. These are code observations, not runtime tests.

### Selection rule

Show a dated fact when it changes a procurement action or explains supply meeting a known use. Separate an opportunity ending, an expected milestone and a hypothetical outcome. Do not expose hidden authored events or make another station's entire schedule procurement's responsibility.

### Inventory and disposition

| Timing item | Placement and justification |
| --- | --- |
| Expected arrival and live use deadline | Main Contract rows; compare delivery with the actual allocated need and quantity |
| Standalone requested date | Main rows after persistence is added; never recover it by guessing from launch or an old Call snapshot |
| Actual delivery | Brief completion feedback, then Inventory/history; no perpetual completed rows |
| Amendment cutoff | Upcoming decisions strip and selected row; this removes a real action, but is not a cancellation deadline |
| Available Offer expiry | Decisions strip, grouped by Call when identical; only available remaining quantities. Catalogue offers have no expiry |
| Call closing | Distinct response milestone in the strip: “Offers arrive”; all responses appear then, not progressively |
| Call opening / response-window duration | Selected Call detail; useful when choosing 7/14/30 days, not permanent timeline bars |
| Call estimated subsequent delivery | Selected Call preview only; label estimate, because signing date and closing-day market affect the result |
| Delay / cancellation / changed need | Persistent changed-item feedback until inspected; revised dates on affected rows. A cancellation must not disappear silently |
| Feasible amendment alternatives | Expanded selected Contract rows, one dated outcome per distinct quoted option |
| Replacement Offer delivery and expiry | Selected comparison only; resource fit, quantity, budget and expiry must be checked |
| Planned launch | Quiet shared reference; real flight-supply consequence, not a deadline for every department |
| Reserved research equipment use | Need marker on that Contract, labeled research bonus; use the linked project's current end estimate |
| Other research completion / equipment release | Selected context only when explicitly linked to a purchase/use; completion can shift and research success is uncertain |
| Known temporary price modifier ending | Compact market notice; show on calendar only while comparing an affected purchase. Expiry changes future quotes, not signed prices |
| Industry trust effects | Quote context, no calendar marker: no guaranteed timed expiry |
| Cancellation refund decay | Selected cancellation comparison: current refund, lost amount and zero-refund baseline if useful. Continuous decay is not a new deadline |
| Signing date, original promised arrival, amendment history | Selected context/history; no default duration bars |
| Comms project finish or event response deadline | Keep at Comms unless a concrete procurement consequence is established; no wholesale inbox duplication |
| Future scripted/random/triggered events | Exclude: implementation knowledge is not player foreknowledge |
| Research unlock estimates | No guaranteed future Offer. Selected contextual note at most; outcomes are uncertain |
| Mission arrival windows, flight duration and mission goal deadline | Planner owns them; procurement sees the resulting part need dates |
| Clock speed/pause | Existing global clock, no timeline row; the calendar must stay anchored while browsing |
| Budget settlement on delivery | Inspector/accounting; delivery converts committed to spent, not newly available funds. No duplicate cash-flow track |
| Production progress, shipping stages, assembly/test chain, reservation slots | Exclude: no corresponding implemented stages or dependency scheduler |
| Latest possible order date | Defer. Would require a specific live Offer, delivery option and explicit current-conditions assumptions; no universal guaranteed deadline |

### Recommended screen

Use a procurement Timeline view alongside the existing detailed lists, since Calls and Offers extend beyond Contracts. Preserve station shell and inspector. One shared calendar, three levels of detail:

1. A small **Upcoming** strip contains labeled amendment cutoffs, Offer expiries and Call response milestones. Separate “Act before” and “Expected” lanes. Identical Offer expiries group by Call and show a count. Overflow expands into a dated list, never stacked illegible icons. Clicking reveals the owning object and action. Count only currently usable opportunities; affordability is shown explicitly, and deadlines with no supported action are not advertised as actionable.
2. **Incoming** rows show resource/quantity, recipient, expected arrival and applicable need. Exact date and margin text stay in the frozen row information. Default sort arrival; filters for missed needs and destination. Changes do not reorder the selected row under the player. Multiple allocations show earliest need plus count; selection names each affected quantity and date. Undated stock receives no safe/late judgment.
3. **Selected comparison** expands beneath one Contract on the same scale. Keep current arrival as the reference; show distinct amendment outcomes with fee and early/late margin. A chosen replacement comparison uses a real available Offer and displays purchase amount and original cancellation/refund separately. Show at most three candidates at once, with additional options in the inspector. All previews are visually outlined, never mistaken for signed commitments. Confirm in the inspector; no dragging dates to transact.

The intervention sequence is: notice changed item → see affected uses → compare alternatives → discuss need changes externally if necessary → confirm. “Keep current delivery” is always understandable. Moving another role's need is not a procurement shortcut. If no viable remedy exists, say so; do not imply an expired amendment can be bought.

Colors retain the existing cyan language; amber indicates an action expiring, red plus text a missed need, neutral milestones need no warning color. Labels, marker shapes and dates carry meaning without color. Today and Planned launch are visually distinct. Month/Quarter/All controls use a uniform linear axis, frozen labels and explicit offscreen indicators. No automatic zoom on selection or new events. Exact action availability must use fractional clock boundaries; a displayed date alone is not proof of remaining time.

### Source evidence and corrections

- `game/src/stations/procurement/logic.ts:52–85,110–117,149–169,199–208,272–287`: delivery accounting, response generation, stored contract fields, amendments, Calls, cancellation and expiry. `rules.ts:301–311,345–412`: refund baseline, quotes, cutoff and Call estimates.
- `game/src/stations/comms/state/world.ts:245–257`: delivery-delay events directly change active Contracts (all or next). They are not scheduled temporary delays that disappear on an expiry date. Temporary price modifiers do expire. This corrects the earlier broad suggestion of expiring delivery conditions.
- `game/src/stations/science/model/research.ts:291–298`: incoming and delivered Science allocations can be reserved; “available” here means not reserved elsewhere. `science/logic.ts:69–75,208–218`: bonus requires actual delivery by the actual finish time; end estimates can move. Do not infer that every departmental purchase automatically has a project dependency.
- `game/src/stations/planner/logic.ts:93–111,410–422`: open planner Tasks follow launch; automatic launch does not wait for procurement readiness. `planner/result.ts:1–25` computes the outcome afterward. Core tick runs all station handlers in a substep (`core/coreActions.ts:19–29`). Day-equality/manual-launch behavior needs targeted verification before promising that “same day” means ready. This audit does not establish a universal same-day failure.
- `game/src/stations/comms/state/world.ts:417–445` and `game/src/shared/events/engine.ts:46–52`: events arrive/expire and projects finish; future authored triggers are not a schedule to reveal to procurement.

### Implementation prerequisites, not approved changes

Persist standalone requested dates and their provenance. Derive needs from current allocations, not global late flags. Preserve dated before/after change records if the UI promises “changed since you looked”; baseline history cannot supply this. Define inspection/acknowledgment per procurement player. Reuse authoritative live quotes and stale-confirmation safeguards. Verify same-day and fractional cutoff semantics. No model changes, runtime checks or tests were made in this design pass.

### Design acceptance scenarios

Use static scenarios before implementation: one delayed camera with a rescue and a cheaper option that remains late; two uses on one Contract; five Offers expiring together; a Call closing with no purchase yet; a cutoff passed while inspecting; an unavailable or unaffordable remedy; undated stock after launch; a research finish moved earlier; a cancellation leaving a missing need; and 30 Contracts with dates outside the viewport. The reader must identify affected use, next action boundary and outcome without opening unrelated objects. No result of such a reader exercise is claimed here.

## Purpose

Operate mode, within the existing procurement visual language. Help a player returning from conversation answer: what arrives next, which need is threatened, and can I still change the delivery? Success means they can state the affected item, destination, date and consequence without opening every Contract.

## Evidence and gaps

Source inspection: `game/src/core/model.ts`, procurement `ui/ContractsView.tsx`, `logic.ts`, `rules.ts`, and science `logic.ts`.

- Contracts store signing, expected delivery, optional actual delivery, baseline delivery, amendment cutoff and amendments. They do not store production progress or a delivery probability distribution.
- The current Contracts view compares every active delivery against launch, including departmental supply. This is unsuitable as a general late indicator.
- Order drafts have a neededAt field, but signed Contracts do not retain it. Tasks retain neededAt; Calls retain neededAt. A timeline cannot reliably recover a standalone order's requested date today.
- Allocations may identify a Task, department or reserved research project. A Contract can serve multiple allocations; there is no universal single deadline for every Contract.
- Research has a live endsAt, which can change. Equipment is optional; missing its useful date must not be represented as blocking research.
- Baseline-versus-current delivery can be shown. Full event-by-event delivery history cannot be assumed from the amendment array alone.

## Alternatives considered

1. Signing-to-arrival Gantt bars: useful for duration comparison, but emphasize elapsed time and invite a false reading of production completion. Reject for the default.
2. Upcoming deliveries agenda: easiest for exact dates and action lists, but weak at comparing multiple arrivals with distinct need dates. Retain the existing table as a companion.
3. Aligned arrival and need markers: recommended. Makes timing margin visible while keeping the same calendar for every row. The interval shown is the margin between arrival and need, never a progress bar.

## Proposed composition

Keep the existing station shell and inspector. Add Timeline / Table inside Contracts. Timeline is the proposed initial view, subject to user review.

- Frozen left column: resource name and quantity; destination, supplier and short Contract ID below. Independent orders remain independent rows, even for identical hardware.
- Middle: shared horizontal calendar, explicit Today line, quiet weekly ticks and month labels. One filled circle for expected arrival, one vertical tick for the relevant need. Connect them with a thin line. Tiny legend: circle Expected, tick Needed.
- Right: exact arrival date and plain timing result, such as “12 days early”, “4 days late”, “Same day” or “No need date”. These remain readable when markers overlap or are outside the visible interval.
- Neutral/cyan for ordinary arrivals; red plus text for a missed known need. Amber is reserved for actionable change deadlines. Do not paint every safe Contract green or color-code departments.
- No cost, reliability, cancellation button, contract age or amendment history repeated on every timeline row. They remain in the inspector.

## Meaning of need

Use a live Task deadline for an active Task allocation. For department orders, propose saving the player-entered requested date and showing its origin. A reservation for a running research project can supply its equipment-use deadline, labeled “Research bonus” rather than “Research blocked”. Exact research equality semantics must follow the resolver in any later implementation.

For multiple live uses, default to the earliest relevant date and show “+2 needs”; selecting the row exposes the separate dates and quantities. Do not imply the whole quantity is late when only one allocation misses its need. An earlier recorded request remains accessible separately if the actual use changes. Shared stock with no known use has no invented deadline and no safe/late verdict.

Launch is an optional contextual vertical line, labeled Planned launch. It is not the automatic deadline for department supply. Task need dates remain authoritative for their rows.

## Interaction

- Default order is expected arrival ascending with stable ID tie-breaks. No live resorting under the pointer or keyboard focus; indicate an available reorder after dates change.
- Select a row to open the existing inspector. Selection does not change scale or scroll position. Keyboard selection provides the same information as clicking; essential facts never require hover.
- Scope controls: All incoming / Misses need / Change deadline, plus destination filter. Change deadline explicitly sorts actionable amendment cutoffs, rather than inventing a generic urgency score.
- Selected row shows a labeled amendment cutoff and original signed arrival, if different. A baseline-to-current displacement is labeled “Since signing”, never “Last delay”. Keep historical markers off unselected rows.
- An amendment preview adds one outlined arrival marker on the selected row with the new margin and fee in the inspector. Signing remains an explicit confirmation; no dragging dates to amend.
- Month / Quarter / All range controls and Today navigation; consistent linear scale across rows. Default Quarter begins at the current week. Manual browsing freezes the chosen window. Offscreen arrival/need markers get edge indicators and retain their exact date text; never clamp them into apparently valid positions.
- Delivered goods leave Incoming and remain in Inventory/Table. Cancelled and failed Contracts remain available in History. An in-view cancellation retains a visible status row until the player leaves or refreshes, so the item does not silently disappear.

## Paper walkthrough and remaining validation

These are illustrative reasoning cases, not observed playtests.

| Situation | Required reading and action |
| --- | --- |
| Camera expected June 8, needed June 20 | Circle before tick, “12 days early”; no warning |
| Camera shifts to June 24 | “4 days late”; select to see change options and identify affected use |
| Engine arrives after launch; department spare also arrives after launch | Flight Task can be late; undated spare receives no late verdict |
| One Contract serves two different dates | Earliest need plus additional-needs count; selection explains which quantity is affected |
| Arrival and need fall on the same day | Distinct stacked markers and “Same day”; no fabricated buffer |
| Research equipment arrives too late | Identify lost equipment bonus, not a blocked research project |
| Several similar orders arrive on different dates | Separate rows, supplier/ID and quantity distinguish them |
| Deadline or arrival lies outside the viewport | Exact date remains visible and an edge indicator reveals clipping |
| No orders, one order, 30 orders | Empty state links to catalogue; one row uses the same scale; large lists scroll with frozen labels/header |

Before building, confirm the primary purpose and proposed arrangement with the user. A subsequent static design should be checked with several unseen scenarios: can the reader identify the affected use, quote the margin and find an intervention without explanation? Also ask what the connecting line means; interpreting it as production progress is a design failure. Multiplayer enjoyment remains unverified.

## Budget companion

Keep budget independent of the time axis. Optional persistent stacked bar: Spent / Committed / Available, each labeled with amount, available most prominent. Segment color indicates accounting category, not an invented financial-health threshold. Purchase preview outlines the prospective committed increment; fees increase spent. Never imply commitments are already paid or that the unspent balance is all available. This companion remains a separate proposal.

## Boundaries

No app changes, new request system, new Tasks, tests or gameplay claims. Need-date persistence, deadline provenance and changed-contract awareness are explicit later implementation dependencies. This study does not approve them or silently repair current behavior.
