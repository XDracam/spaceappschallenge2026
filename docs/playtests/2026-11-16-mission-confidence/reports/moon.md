# Moon normal-action feasibility route — November 16, 2026

**Calculated outcome:** seed **20261116**, first attempted seed, all **3/3 main goals achieved**, no scrub, no evaluator issues, launch **day 300**, lunar goals reached **day 304.977821**, result end **day 334.977821** (mission deadline 455). Final funding **250 M** after the ordinary Treasury cut, spent **231.4 M**, committed **0 M**, available **18.6 M**. No launch delay was needed.

This is an actual deterministic run of the current station reducers, tick handlers, physics and result computation bundled to a temporary Node script. It is **not yet the four-browser network observation**; the parent owns that replay. No state mutation, free money, research/unlock/reliability injection, developer event firing, seed search or code/balance patch was used. Initialization is `createGame(20261116, 'moon-lander')`; every subsequent change passes through `applyAction` with its real station. The calendar uses normal host `core/tick` stepped once per day and the run answers actual delivered messages before their deadlines. The script and all evidence live only under `/tmp`.

## Exact source/replay artifacts

- `/tmp/nasa-moon-feasibility.ts`: executable TypeScript recipe, absolute imports of the current owning sources.
- `/tmp/nasa-moon-feasibility.mjs`: bundled calculation entry point.
- `/tmp/nasa-moon-feasibility-actions.json`: exact chronological action stream, including day, role, argument list and whether it changed state.
- `/tmp/nasa-moon-feasibility-result.json`: all actual purchases, answered events, research/test projects, evaluator goals, flight result and periodic state summaries.
- `/tmp/nasa-moon-feasibility-final-state.json`: final calculated shared state, for inspection only; do **not** inject it into the live game.

Rebuild calculation with the installed executable:

```sh
game/node_modules/esbuild/bin/esbuild /tmp/nasa-moon-feasibility.ts --bundle --platform=node --format=esm --outfile=/tmp/nasa-moon-feasibility.mjs
node /tmp/nasa-moon-feasibility.mjs
```

## Planning actions at day 0

1. Start the Moon game with seed 20261116. Planner sets booster engine `part-l3` thrust to **4500 kN**, Isp **320 s**, leaves engine count **1**. Set descent-stage tank `part-l10` to **1.6 t**. All other starting parameters stay unchanged, including the 260 t booster tank, 22 t upper tank, 5 kN/312 s descent engine and 2.5 t landing legs.
2. Append to `branch-root`, in this order:
   - `{id:'moon-launch', type:'launch', body:'earth', altitudeKm:200}`
   - `{id:'moon-transfer', type:'transfer', target:'moon', departDay:300, travelDays:5}`
   - `{id:'moon-insertion', type:'insertion', altitudeKm:100, aerocapture:false}`
   - `{id:'moon-land', type:'land'}`
3. Planner invokes `planner/orderAllParts`. Read the actual task/criterion IDs for each part from the resulting shared state.

The fully procured rocket weighs **309.989 t**, has lift ratio about **1.48** and leaves **371.50 m/s** after the route. The transfer implementation computes its actual travel time as **4.977821 days** for this child-body transfer.

## Procurement

Use standard delivery, quantity 1, destination `{kind:'task',taskId,criterionId}` for each corresponding part. Generate `quoteOrder(state,draft).token` from the current state immediately before `procurement/signOrder`. Do not blindly reuse quote tokens if the live action order/day differs. The fresh-run IDs below are exact for this calculation; connected-seat actions alone do not consume these IDs, but other gameplay actions can.

| Part ID | Task/criterion | Catalogue offer ID | Sign day | Price M | Arrival day |
| --- | --- | --- | ---: | ---: | ---: |
| `part-l3` | `task-1` / `crit-2` | `cat-e-ker-4500-tallis` | 0 | 58.3 | 244 |
| `part-l4` | `task-3` / `crit-4` | `cat-t-ker-260-tallis` | 0 | 2.7 | 183 |
| `part-l6` | `task-5` / `crit-6` | `cat-e-hyd-120-commons` | 0 | 25 | 152 |
| `part-l7` | `task-7` / `crit-8` | `cat-t-hyd-22-commons` | 0 | 1.2 | 91 |
| `part-l10` | `task-11` / `crit-12` | `cat-t-hyp-16-commons` | 0 | 0.6 | 91 |
| `part-l12` | `task-15` / `crit-16` | `cat-p-sol-06-commons` | 0 | 2.2 | 91 |
| `part-l13` | `task-17` / `crit-18` | `cat-a-120-commons` | 0 | 2.5 | 91 |
| `part-l14` | `task-19` / `crit-20` | `cat-l-25-commons` | 0 | 5.8 | 91 |
| `part-l9` | `task-9` / `crit-10` | `cat-e-hyp-5-commons` | 50 | 2.7 | 202 |
| `part-l11` | `task-13` / `crit-14` | `cat-i-lab-45-meridian` | 73 | 63.2 | 256 |

The **eight initially available parts** are signed day 0. The descent engine and lab are deliberately deferred until their research succeeds. Total contracted flight hardware is **164.2 M**, including the ordinary Supplier roundtable discount on the lab. No Calls, facilities, hired teams or replacement hardware are needed on this successful route.

## Science and Comms projects

After initial orders, Science starts:

- `science/startTech('moon-hypergolic-1','hypergolic-tuning')` — 8 M; succeeds on day 50 (fractional endpoint 49.092).
- `science/startTech('moon-lab-1','lab-automation')` — 14 M; succeeds on day 73 (endpoint 72.97).

Both are tier-1 technology projects and need **no facilities**. The existing two teams suffice. The script checks for an ordinary retry opportunity if one fails; this seed had no research failure, so this route does not establish recovery from an actual failure.

Comms starts **Moon Night gala** (`mo-moon-night-gala`, 5 M) and **Northgate test technicians** (`mo-northgate-test-crew`, 3 M) on day 0. After slots free on day 31, start **Supplier roundtable** (`mo-supplier-roundtable`, 3 M). These normal projects support trust/research pace and the lab quote. No developer events are fired.

## Messages actually received and answered

Answer immediately on the indicated game day, before advancing the next day. Look up each actual inbox `instanceId` by `eventId`, then dispatch `comms/answer(instanceId, optionId)`. This preserves exact RNG/timing relative to the calculation.

| Day | Event ID | Option ID |
| ---: | --- | --- |
| 15 | `mo-why-the-moon` | `ice` |
| 38 | `mo-machinist-strike` | `co-fund` |
| 45 | `mo-site-team-needs-data` | `share-early` |
| 50 | `mo-northgate-drill-team` | `joint-lab` |
| 73 | `mo-titanium-price-spike` | `fixed-price` |
| 74 | `mo-budget-audit` | `accountants` |
| 75 | `mo-budget-review` | `water` |
| 109 | `mo-leaked-cost-memo` | `confirm` |
| 120 | `mo-meridian-tracking` | `sign` |
| 143 | `mo-treasury-clawback` | `accept` |
| 170 | `mo-vacuum-chamber-slot` | `book` |
| 207 | `mo-district-supplier` | `decline` |
| 240 | `mo-weapon-conspiracy` | `livestream` |
| 269 | `mo-rival-lander-crash` | `tests` |
| 270 | `mo-launch-readiness` | `candid` |

All **15** actual messages were answered successfully. No messages were left to expire. Research-breakthrough support (`joint-lab`, day 50) accelerates the other ongoing project. The Treasury cut is accepted honestly at day 143; it reduces funding to 250 M. The day-170 vacuum chamber **event** is a normal pace boost, not a facility grant or automatic test.

## Tests actually started and completed

These tests were paid for and ran through the existing two-team research system. The script reserves 10 M rather than spending the entire remaining balance and only starts a test with enough time before launch.

| Start day | Project ID | Part | Cost M | Fractional endpoint | Status |
| ---: | --- | --- | ---: | ---: | --- |
| 91 | `moon-test-1` | `part-l14` | 1.2 | 122.228 | succeeded |
| 91 | `moon-test-2` | `part-l12` | 1 | 122.228 | succeeded |
| 123 | `moon-test-3` | `part-l13` | 1 | 159.528 | succeeded |
| 123 | `moon-test-4` | `part-l7` | 1 | 159.528 | succeeded |
| 160 | `moon-test-5` | `part-l6` | 5 | 191.928 | succeeded |
| 160 | `moon-test-6` | `part-l10` | 1 | 191.928 | succeeded |
| 193 | `moon-test-7` | `part-l4` | 1 | 223.328 | succeeded |
| 202 | `moon-test-8` | `part-l9` | 1 | 232.728 | succeeded |

The booster engine and lab are **not tested** on this route; the budget reserve rule declines those optional spends. All ten flight parts are delivered before day 300. The eight completed tests cost **12.2 M**. Do not label this as “all hardware tested.”

## Final outcomes and limitations

Evaluator pre-roll chances after actual contracts/tests: lunar orbit **95.8634%**, landing **94.9048%**, ice science **91.6168%**. On this actual seed all three succeeded; those percentages remain probabilities, not guarantees for arbitrary attempts. The result includes ordinary in-flight modifiers: weaker government operations support, positive partner descent tracking, positive supplier support and the unchanged-date rehearsal benefit. Final trust: Government **60**, Industry **60**, Public **90**, Partners **85**.

Budget accounting: hardware 164.2 M + research 22 M + tests 12.2 M + Comms projects 11 M + paid event choices 22 M = **231.4 M spent**; funding 260 M minus Treasury cut 10 M = **250 M**. The result has no flight/equipment/delivery/research/budget issues in the evaluator. A negative-support in-flight news item still appears as a failure event; it did not prevent any goal.

For four-browser replay, pause the wall-clock calendar and advance the host one whole game day at a time through the same normal tick action. Dispatch Planner, Procurement, Science and Comms actions from their actual connected station owners. Replication/state agreement must be observed separately. If extra actions change IDs or random-consuming behavior, read live IDs and consequences, follow normal recovery and record the divergence instead of pretending it was this exact route.
