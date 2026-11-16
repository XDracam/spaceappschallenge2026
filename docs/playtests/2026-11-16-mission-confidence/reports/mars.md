# Current Mars action-only feasibility — November 16, 2026

Status: calculated with actual current reducers and rule/evaluation modules; root is separately replaying the recipe through four connected browser roles. No repository edit, direct post-initialization state mutation, artificial funding, unlock, reliability or goal award occurred. Calendar advanced in accelerated whole-day `core/tick` actions while the host clock was paused. No test suite was added or run.

## Exact reference

- Bootstrap only: `createGame(20261116, "mars-orbiter-lander")`.
- Ordered complete recipe: `/tmp/nasa-mars-feasibility-20261116.json`, top-level `actions`, 272 records `{day,type,args,by}`. Every normal action was accepted by current `validAction` before reducer application. `day` is the current agency day before that action; `core/tick` args specify the next day.
- `summary` holds evaluation, actual seeded flight, score, named contracts, effective rocket and final plan. `beforeState` is the day-229 prelaunch comparison state. `commsChoices` identifies every authored dialogue and effect. `validation.saveShape` is true.
- Procurement quote tokens in the recipe belong to the exact preceding state. Regenerate via normal `quoteOrder` if any order/choice/timing changes rather than bypassing stale-quote protection.

## Route

Before publishing orders, set upper-stage tank part-m8 fuelT=23, Orbiter tank part-m11 fuelT=2, descent tank part-m17 fuelT=0.8 and Lander antenna part-m20 dataRateKbps=200. These are requests; real catalogue hardware supplies larger tanks/rates. Keep all other initial parameters.

Launch day 230 (August 19, 2030) into 200 km Earth orbit. Transfer departs day 239 (August 28), travels 258 days to Mars. Insert at 1,000 km without aerocapture. Separate Lander sc-m2 into its own branch and land. All four actual goal events occur on day 497 (May 13, 2031), before the day-1277 deadline (July 1, 2033). Flight playback ends at day 527 because of presentation padding; this is distinct from goal completion.

Research Larger sensor arrays (`large-sensor`) at day 0 for $9M. The normal project has 90% success and endsAt121.76; this seed resolves success on day122 (May3). It raises the existing camera research limit normally. Buy Panorama C4.5 at day122; it arrives day213 (August2). No facility, team hire, optional reliability test, ion thruster or additional research is needed by this route.

## Authored purchases

Every order uses the normal catalogue suggestion and standard delivery. Most are signed day0; camera is signed day122 after successful research. Price includes quantity.

| Hardware | Supplier | Quantity | Actual stats | Price M | Ready day |
|---|---|---:|---|---:|---:|
| Taiga KL-2000 | Swiftworks Orbital | 2 | {"thrustKN":2000,"isp":305} | 76.4 | 122 |
| Silo KT-260 | Tallis Heavy Industries | 1 | {"fuelT":260} | 2.7 | 183 |
| Lumen HL-120 | Helix Precision Works | 1 | {"thrustKN":120,"isp":446} | 34.5 | 183 |
| Cryo HT-80 | Tallis Heavy Industries | 1 | {"fuelT":80} | 2.6 | 152 |
| Pip HT-0.6 | Orbital Commons Co-op | 1 | {"thrustKN":0.6,"isp":316} | 2.6 | 152 |
| Flask PT-4 | Tallis Heavy Industries | 1 | {"fuelT":4} | 0.6 | 152 |
| Vesta HT-35 | Tallis Heavy Industries | 1 | {"thrustKN":35,"isp":314} | 4.1 | 213 |
| Flask PT-1.6 | Helix Precision Works | 1 | {"fuelT":1.6} | 0.8 | 122 |
| Sunleaf SP-2.5 | Meridian Instruments | 1 | {"outputKW":2.5} | 6.5 | 91 |
| Relay HG-600 | Meridian Instruments | 1 | {"dataRateKbps":600} | 4.8 | 91 |
| Fieldkit L3.2 | Meridian Instruments | 1 | {"performance":3.2} | 56.2 | 183 |
| Sunleaf SP-1.2 | Meridian Instruments | 1 | {"outputKW":1.2} | 3.7 | 91 |
| Relay HG-600 | Meridian Instruments | 1 | {"dataRateKbps":600} | 4.8 | 91 |
| Strider LG-2.5 | Helix Precision Works | 1 | {"maxLandingMassT":2.5} | 7.9 | 122 |
| Aegis HS-3 | Helix Precision Works | 1 | {"maxEntryMassT":3} | 16.6 | 152 |
| Panorama C4.5 | Swiftworks Orbital | 1 | {"performance":4.5} | 25.3 | 213 |

All sixteen contracts (17 units because booster engines quantity2) are delivered by day213. Hardware totals $250.1M, research $9M and chosen Communications costs $40M. Authored funding changes net +$60M: final funding $960M, spent $299.1M, committed $0, available $660.9M. No manual budget modification was used.

## Communications choices

These are meaningful but not optimized-for-enjoyment operator choices from current authored options. The source policy scores visible actual consequences, penalizes delays and unsupported commitments, and answers each open event after the daily tick. No event is fired manually or removed.

| Day | Event | Choice |
|---:|---|---|
| 15 | Mission press conference (`kickoff-press-conference`) | `inspire` |
| 38 | Treasury wants money back (`treasury-clawback`) | `accept` |
| 60 | Spring budget review (`spring-budget-review`) | `home-suppliers` |
| 83 | Strike at Feldwerk (`machinist-strike`) | `co-fund` |
| 105 | Mars partners summit (`partner-summit`) | `delegation` |
| 122 | Northgate wants in (`university-partnership-offer`) | `joint-lab` |
| 145 | A student leaked your wiring (`schematics-leak`) | `internship` |
| 150 | Students seek mission support (`student-microphone`) | `fly-it` |
| 177 | Is this a race? (`rival-race-claim`) | `race` |
| 178 | A supplemental, with strings (`extra-funding-offer`) | `with-strings` |
| 185 | Election season (`election-season`) | `factory-visit` |
| 208 | Leftover infrastructure money (`infrastructure-leftovers`) | `credit-her` |
| 210 | Launch-readiness hearing (`launch-readiness-hearing`) | `candid` |

## Numerical result and remaining risk

All four goals are physically achievable, with no error-severity issues. One warning remains: booster lift ratio1.08, below advisory1.2. Goal probabilities before in-flight adjustments are orbit90.86%, maps86.81%, landing89.96%, surface science87.28%. Shared components correlate these risks; multiplying them is not a justified all-goals probability. Actual normal seed20261116 resolves **4/4** without a scrub.

Predeclared seed20261117 also gave first-attempt sensor success and4/4. Root then authorized the fixed complete sample20261116–20261125, retaining every outcome; results are below. A preliminary seed1 feasibility run before the fixed-seed instruction also succeeded and was not selected to replace20261116.

## Fixed ten-seed sample and genuine research-failure recovery

All ten predeclared seeds20261116 through20261125 were run with the same current normal-action policy, including per-day authored Communications choices. The policy retries failed sensor research normally and moves launch/transfer to the documented later window when the original date becomes unsuitable. All ten retained recipes are `/tmp/nasa-mars-feasibility-<seed>.json`; batch summary is `/tmp/nasa-mars-feasibility-batch.json`. This is a small deliberate operator sample, not a statistical guarantee or a human completion study.

| Seed | Sensor result | Launch | Physically achievable | Actual goals | Spent M / funding M |
|---:|---|---:|---:|---:|---:|
| 20261116 | success | 230 | 4/4 | 4/4 | 299.1 / 960.0 |
| 20261117 | success | 230 | 4/4 | 4/4 | 299.1 / 960.0 |
| 20261118 | failure, successful retry | 1017 | 4/4 | 4/4 | 315.2 / 1005.0 |
| 20261119 | success | 230 | 4/4 | 4/4 | 299.1 / 980.0 |
| 20261120 | success | 230 | 4/4 | 4/4 | 309.1 / 960.0 |
| 20261121 | success | 230 | 4/4 | 4/4 | 299.1 / 960.0 |
| 20261122 | success | 230 | 4/4 | 3/4 | 299.1 / 960.0 |
| 20261123 | success | 230 | 4/4 | 4/4 | 282.6 / 935.0 |
| 20261124 | success | 230 | 4/4 | 4/4 | 299.1 / 985.0 |
| 20261125 | success | 230 | 4/4 | 4/4 | 309.1 / 935.0 |

All ten routes had no error-severity issues and a nonnegative available budget, with no undelivered contract at launch. Nine seeded resolutions achieved4/4; seed20261122 achieved3/4 because the normally rolled Lander Surface lab failed. Its planned surface-science goal remained physically achievable. This is an honest expected reliability loss, not a structural route or money/deadline blockade.

Seed20261118 supplies a genuine current research-failure recovery case, with complete1072-action recipe. Authored research pace speeds the first project's endsAt to115.16; it fails at the day116 tick. Science restarts `large-sensor` normally at116 for another$9M. Planning moves launch to1017 and the transfer to departure1017/travel252. Retry succeeds at233 (endsAt232.16); Procurement buys Meridian Instruments’ Panorama C4.5 at233 for$27.4M and standard delivery reaches385. All other previously purchased hardware remains. Later normal events, including launch-moved Comms consequences, are retained and answered through normal options. No free research, reliability modification or event suppression is used.

The recovery launches day1017 and achieves all four goals on1269, eight calendar days before deadline1277. Its playback endDay1299 includes30 presentation days; that does not mean goals missed the deadline. Funding is$1005M, spent$315.2M, committed$0, available$689.8M. Actual seeded resolution is4/4 despite an unfavorable in-flight insertion narrative/probability adjustment. No mission-constraint request was left unresolved in the calculation. Root's real connected-browser replay remains a separate evidence requirement.

Root still needs to establish live-network action acceptance, four-role convergence, rendered final results and honest visibility of decisions. This calculation is neither a human enjoyment playtest nor a venue-network qualification.
