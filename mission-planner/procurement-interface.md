# Procurement interface

**User direction (2026-11-14):** the planner defines the task, contract, and related data formats and documents them here; the procurement module adopts or changes them later. Historical source path: `app/src/model/types.ts` (`ProcurementTask`, `Contract`). That standalone schema is preserved below; current shared runtime records are in [`game/src/core/model.ts`](../game/src/core/model.ts), with planner types in [`game/src/stations/planner/model/types.ts`](../game/src/stations/planner/model/types.ts).

Units: mass t, thrust kN, Isp s, power kW, data rate kbps, money M (millions), time = agency calendar day (day 0 = mission start).

Integration note from the second pull review — [D-008](../docs/decisions.md#d-008--procurement-alignment-after-incoming-mission-planner-work) selects shared role-neutral Tasks and contract-only inventory. The shapes below document the planner-local runtime at the time of the November 14 review. Its routed-task, cancellation and ownership wording needs reconciliation before becoming a shared interface. See the [review](../docs/reviews/2026-11-14-second-planner-pull.md#gaps-to-preserve-for-integration).

## Task — planner → procurement

Created when the planner sends one part ("Send to procurement"). One task per part.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Task id |
| `partId` | string | Part in the planner's design |
| `partKind` | `engine` · `tank` · `instrument` · `power` · `antenna` · `legs` · `heatShield` · `radShield` · `heatProtection` | Part category |
| `variant` | string | Engine/tank: propulsion (`solid`, `kerolox`, `hydrolox`, `hypergolic`, `ion`); instrument: `camera`, `spectrometer`, `radar`, `surfaceLab`; power: `solar`, `rtg`; others: `standard` |
| `partName` | string | Display name |
| `minimums` | `{ statKey: number }` | Slider values at sending time; the procured part must meet or exceed each |
| `beyondResearch` | string[] | Research keys (`kind.variant.stat`) or unlock keys (`kind.variant`) the part exceeds; empty if within research |
| `status` | `open` · `changed` · `contracted` · `delivered` · `cancelled` | See below |
| `neededByDay` | number | Planned launch day; the store currently refreshes it for open/changed Tasks when launch changes |
| `createdDay`, `updatedDay` | number | Calendar days |

Stat keys per kind: engine `thrustKN`, `isp`; tank `fuelT`; instrument `performance`; power `outputKW`; antenna `dataRateKbps`; legs `maxLandingMassT`; heatShield `maxEntryMassT`; radShield and heatProtection `level`.

Status flow:

- `open` → the planner sent the part.
- `changed` → the planner moved a slider after sending; `minimums` hold the new values.
- `contracted` → procurement signed a contract for it.
- `delivered` → the contract ran through.
- `cancelled` → the part left the design before contracting, or procurement cancelled the contract.

A task whose `beyondResearch` is non-empty is one task, "get that part", with several ways to solve it: research first then buy cheaper; buy expensively without research; or communications negotiates research or the part from another country.

## Contract — procurement → planner

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Contract id |
| `taskId`, `partId` | string | What it fulfils |
| `supplier` | string | Supplier name |
| `priceM` | number | Price, committed at signing |
| `signedDay`, `deliveryDay` | number | Calendar days |
| `reliability` | 0..1 | Chance the part works when used in the final playthrough |
| `actualStats` | `{ statKey: number }` | Real stats; replace the slider values in the design |
| `actualMassT` | number | Real mass; replaces the derived mass |
| `status` | `running` · `delivered` · `cancelled` | |
| `refundM` | number? | Set when cancelled |
| `partSnapshot` | Part | The part as contracted, kept if the design part is replaced |

Rules (user direction):

- Contracted and delivered parts cannot be changed. A different part needs a new task and a new contract ("Replace" in the planner).
- Only procurement can cancel a contract. Refund: share of the price falling linearly from 50 % at signing to 0 % at delivery (placeholder).
- A delivered part belongs to the agency for this level at no further cost. One level is one mission; nothing carries over.
- Every part must be delivered before the planned launch date.

## Research — science → planner

- `research`: `{ "kind.variant.stat": maxValue }` — current research limits shown as ticks on the planner's sliders. The planner may plan beyond them.
- `unlocked`: list of `kind.variant` keys. Locked variants can still be placed in the design.

Until the procurement and science modules exist, the planner's **Dev** tab stands in for them: contract a task, deliver, cancel, change research limits and unlocks, and advance the calendar.
