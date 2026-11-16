# Moon — fixed ten-seed normal-action calculation

Declared sequence before execution: **20261116 through 20261125 inclusive**. Every run retained; no lucky-seed search, discarded results, state patches, free resources, developer events or source changes. Same recipe as the frozen 20261116 network replay, with its already-declared ordinary research retry and launch-recovery policy. The pure reducers receive role-owned actions and a host tick once per day; actual Comms messages are answered before advancing. This is calculation evidence, not browser/network evidence or human play.

## Original policy results (all ten retained)

| Seed | Launch | Lunar arrival/goal day | Spend / funding M | Left M | Main goals | Preparation | Research failures |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| 20261116 | 300 | 304.978 | 231.4 / 250 | 18.6 | 3/3 | all delivered; no evaluator issues | none |
| 20261117 | 300 | 304.978 | 243.1 / 255 | 11.9 | 0/3 | all delivered; no evaluator issues | none |
| 20261118 | 340 | 344.978 | 250.8 / 282 | 31.2 | 3/3 | all delivered; no evaluator issues | hypergolic-tuning |
| 20261119 | 300 | 304.978 | 247.7 / 267 | 19.3 | 3/3 | all delivered; no evaluator issues | none |
| 20261120 | 430 | 434.978 | 235.9 / 255 | 19.1 | 0/3 | lab not procured; scrub | lab-automation,lab-automation,lab-automation,lab-automation |
| 20261121 | 300 | 304.978 | 255.7 / 260 | 4.3 | 1/3 | all delivered; no evaluator issues | none |
| 20261122 | 300 | 304.978 | 235.1 / 255 | 19.9 | 3/3 | all delivered; no evaluator issues | none |
| 20261123 | 300 | 304.978 | 243.1 / 255 | 11.9 | 3/3 | all delivered; no evaluator issues | none |
| 20261124 | 341 | 345.978 | 250.8 / 255 | 4.2 | 3/3 | all delivered; no evaluator issues | hypergolic-tuning |
| 20261125 | 341 | 345.978 | 250.8 / 272 | 21.2 | 3/3 | all delivered; no evaluator issues | hypergolic-tuning |

- **7/10** reached all three main goals. All ten geometric designs were feasible and predicted arrival before deadline 455, but this alone does not establish procurable launch readiness.
- **9/10** had all required parts delivered with no evaluator issues and a nonnegative budget. Seed 20261120 retained its unprocured lab and insufficient-budget warning; the result correctly scrubbed.
- Seed **20261117** lost its upper-stage engine during launch: **0/3**, not scrubbed. Seed **20261121** lost its landing legs on lunar descent: **1/3**. Those are ordinary seeded reliability failures; the calculation did not overwrite them or retry the seed.
- Seeds **20261118, 20261124 and 20261125** recovered from an initial hypergolic-research failure through the ordinary retry action and launch moves to 340/341. Each achieved **3/3**.
- All actual messages were answered successfully, with no rejected answers in the recorded runs.
- This small adjacent-seed batch is not a statistical certification of game balance, win rate, random independence or enjoyment.

## Original policy weakness: repeated lab retries

Seed **20261120** failed Lab automation four times (attempts 0–73, 73–150, 150–231, 231–319). The fifth succeeded at day 402, leaving neither time nor budget to buy and deliver the Fieldkit lab before launch 430. It scrubbed, as it should. Repeating the same 14 M research is a poor recovery policy; this result is **not proof that the mission has no lawful solution**.

The source already provides a second path: Communications' **Northgate regolith lab** (`mo-northgate-regolith-lab`) costs **6 M**, runs **3 months**, requires partner trust **55**, and raises `instrument.surfaceLab.performance` to **5**. This is an authored alternative under existing rules.

## Explicitly labelled targeted recovery follow-up (not substituted into the ten-seed results)

After reporting the original batch, ran seed **20261120** once more with one predeclared policy change: **after the first Lab automation failure, start the existing Northgate regolith-lab partnership and stop repeating that failed research**. All other action policies remain the same. Original ten-seed failures remain retained above.

Observed normal-action recovery:

1. Initial Lab automation fails on day **73**. Communications starts `mo-northgate-regolith-lab` that day, meeting its existing partner-trust requirement.
2. Partnership completes on day **165**, raising the lab limit to 5. Procurement signs the existing Fieldkit L4.5/Meridian catalogue offer for **70.2 M**, initial arrival **348**.
3. The naturally triggered late-delivery message on day **166** is answered with the paid expediting bonus; arrival becomes **317.56**, with no direct date injection.
4. Planner's ordinary `setLaunchDay` action on day **200** moves launch to **398**. The script continues answering all actual messages, including the moved-date response and later promise.
5. All flight parts are delivered; normal paid tests run. Final evaluator has **no issues**, and all three main goals succeed at **day 402.977821**, ahead of deadline **455**. Result ends **432.977821**.
6. Final funding **272 M**, spend **250.4 M**, available **21.6 M**, committed **0 M**. The added money comes from actual answered funding events, not injection.

Evidence: `/tmp/nasa-moon-recovery-20261120.ts`, bundled `.mjs`, `-actions.json`, `-result.json`, `-final-state.json`, `-stdout.txt`. This is a separate recovery calculation; it changes subsequent event/RNG history through normal actions and therefore is not presented as identical to the original seed20 path.

## Replay format and retained evidence

Each action log is an array of objects with keys:

```json
{"day":0,"by":"planner","type":"planner/setPartStat","args":["part-l3","thrustKN",4500],"changed":true,"budgetAvailableM":260}
```

Only `by`, `type` and `args` form the game action; `day`, `changed` and budget are observation fields. Preserve chronological order; each `core/tick` action comes from `host`. Procurement `signOrder` contains a valid quote token from the exact current state; if the network session differs in IDs or calendar, recompute that token and resolve the actual task/criterion IDs instead of blindly copying it.

For every original seed the retained prefix is `/tmp/nasa-moon-feasibility-SEED`: `-actions.json`, `-result.json`, `-final-state.json`, `-stdout.txt`. Full summary `/tmp/nasa-moon-feasibility-10seeds.json`; frozen main recipe and its first-success artifacts retain their unsuffixed `/tmp/nasa-moon-feasibility*` names. No repository source was changed by either calculation.
