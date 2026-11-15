# Third mission: proposal — 2026-11-15

**Status: PROPOSAL.** Not an accepted decision. Nothing here has been built or played. It was written by an agent on request (design and specification only, no game code changed). Every number below that comes from the game is computed with the game's own rules (`physics/evaluate.ts`, `physics/stack.ts`, `physics/transfers.ts`, `data/parts.ts`, `data/propulsion.ts`, `procurement/data/*`), re-implemented in a scratch script. They are not taken from a running game. The first build has to check them in the planner (see "Checks for the builder").

Working title: **Lunar ice lander** (`id: 'moon-lander'`).

---

## 1. Candidates

| | A. Lunar orbiter (like LRO) | **B. Lunar lander (like Surveyor / CLPS)** | C. High Earth orbit observatory | D. Planetary flyby (like Mariner 2) |
|---|---|---|---|---|
| New ideas beyond the weather mission | Leave Earth (transfer to the Moon), arrive (orbit insertion) | Leave Earth, arrive, **land** (legs, lander-type payload, lift ratio in lunar gravity); **one big engine or several** (cluster risk) | Bigger orbit raise only | Launch windows, long cruise, swing-by |
| Δv in the game's model (m/s) | 9,400 + 3,133 + 822 = **13,355** (weather: 13,335) | 13,355 + 1,870 = **15,225** | 9,400 + 4,017 (to 300,000 km, the model's ceiling) = 13,417 | depends on the window |
| Evaluable today? | Yes (`orbit`, `orbitData` at `moon`) | **Yes** (`orbit`, `land`, `surfaceData` at `moon`) | Partly. No Lagrange points exist (Earth's `maxOrbitAltKm` is 300,000 km, L1 is about 1.5 million km) | **No.** There is no `flyby` goal kind. It needs a new goal kind |
| Play length | About as long as the weather mission | ~10 min to launch | about the same as weather | Long (window-bound) |
| Planner's decision | Weak. The weather rocket's Δv is almost enough, so one tank click fixes it | **Real.** No tank click fixes the starting design. Booster architecture plus lander and legs sizing | Weak | Window choice. Overlaps with Mars |
| Science / Procurement / Comms | Same shape as weather | Two needs from minute one, long-lead parts, a Comms lever on the main decision | Same as weather | Same as weather |
| Distance to Mars | Leaves out landing, so Mars still adds landing, second vehicle, windows and atmosphere all at once | Leaves out **second vehicle, windows and atmosphere** for Mars | Teaches nothing Mars needs | Teaches windows but not arrival or landing |

**Pick: B, the lunar lander.** It adds three of the ideas Mars needs (leave Earth, arrive, land), and the code flies all of them. It leaves out the second vehicle and separation, launch windows, long cruises and atmosphere/heat shields, which Mars then adds. In the game's model a Moon transfer is a Hohmann with no window (`transfers.ts` `rel === 'child'`, ~5 days). A is too close to the weather mission (the same Δv), C teaches nothing new, and D cannot be evaluated without new code.

---

## 2. Mission specification

### 2.1 Identity

| Field | Value |
|---|---|
| `id` | `moon-lander` |
| `name` | `Lunar ice lander` |
| Lobby tag | `Next step` |
| Lobby text | `One lander to the Moon: leave Earth, enter lunar orbit, land and drill for ice. Medium game.` |
| `startDateISO` | `2030-01-01` |
| Planned launch (`initialPlan.launchDay`) | `300` (28 Oct 2030, ~9.9 real minutes at normal speed) |
| `completionDeadlineDay` | `455` (1 Apr 2031) |
| `budgetM` | `260` |
| `researchTimeFactor` | `0.6` |

Briefing (`briefing`):

> Land a lander near the Moon's south pole and drill for water ice, so the crewed programme can choose where its first crew lands. Your rocket has to leave Earth orbit, brake into orbit around the Moon and then land: the Moon has no air, so every metre per second of braking comes from fuel. All goals must be achieved by the mission deadline.

### 2.2 Goals (all kinds the code evaluates today)

| id | name (player text) | kind | body | parameters |
|---|---|---|---|---|
| `goal-moon-orbit` | Reach lunar orbit | `orbit` | `moon` | any altitude |
| `goal-moon-land` | Land on the Moon | `land` | `moon` | — (needs `payloadType: 'lander'` + legs ≥ touchdown mass, `evaluate.ts` `land`) |
| `goal-moon-ice` | Drill for water ice | `surfaceData` | `moon` | `instrument: 'surfaceLab'`, `minPerformance: 4.5`, `stayDays: 12` |

`stayDays: 12` matches one lunar daylight period. It has no effect in the model (the Moon has `radiationPerDay: 0` and no `surfaceHeat`). The model does not represent the south pole, lighting or the lunar night. The name only says "on the Moon", so the player text does not promise a pole that the model cannot check.

The three goals give partial credit. Orbit only scores 1 of 3, a landing without a working lab scores 2 of 3.

### 2.3 Research limits (`research`) and unlocks

Copy of the weather mission's `research` with three changes:

| key | weather | **moon** | why |
|---|---|---|---|
| `instrument.surfaceLab.performance` | 5 | **3.2** | "As flown today" = Fieldkit L3.2. The ice goal needs 4.5 (Fieldkit L4.5, "drill and oven") → Science must research it |
| `engine.hypergolic.isp` | 320 | **310** | The throttleable descent engines (Pip HT-5 312 s, Vesta HT-35 314 s) are beyond research → Science must research them |
| `instrument.camera.performance` | 4 | 6 | not used; Mars value |
| `antenna.standard.dataRateKbps` | 200 | 3000 | not used; Mars value (the 120 kbps antenna is within either) |

All other keys are as in `weatherGeo.ts`. `unlocked` is identical to `weatherGeo.ts`.

### 2.4 Starting design — all part sizes are catalogue sizes

| Owner / stage | Part | Sliders | Catalogue item it buys as |
|---|---|---|---|
| Rocket · Booster | kerolox engine ×**1** | 2000 kN, Isp 305 | Taiga KL-2000 |
| | kerolox tank | 260 t | Silo KT-260 |
| Rocket · Upper stage | hydrolox engine ×1 | 120 kN, Isp 446 | Lumen HL-120 |
| | hydrolox tank | 22 t | Cryo HT-22 |
| Lander (`payloadType: 'lander'`) · Descent stage | hypergolic engine ×1 | 5 kN, Isp 312 | Pip HT-5 (**beyond research**) |
| | hypergolic tank | 0.7 t | Flask PT-0.7 |
| Lander equipment | surface lab | performance 4.5 | Fieldkit L4.5 (**beyond research**) |
| | solar | 0.6 kW | Sunleaf SP-0.6 |
| | antenna | 120 kbps | Relay HG-120 |
| | legs | 1 t | Strider LG-1 |

The flight plan starts empty (`maneuvers: []`), as in the weather mission. The Planner builds four steps from the menu, each the first ("primary") option, checked in `options.ts`: **Launch from Earth** (200 km) → **Transfer to Moon** (departs on launch day, 4.98 days) → **Enter orbit at Moon** (100 km) → **Land on Moon**.

Power and data: the lab needs 0.2 × (0.5 + 0.25 × 4.5) = 0.325 kW and 20 × 4.5 = 90 kbps. The panel gives 0.6 kW at ~1 AU, and the antenna 120 kbps (the Moon is closer than 1 AU, so the full rate applies). Both pass.

### 2.5 Why the starting design is not the answer

Flight of the starting design (game model, every manoeuvre):

| Step | Δv needed (m/s) | Δv left before (m/s) | Paid by | Result |
|---|---|---|---|---|
| Launch to 200 km | 9,400 | 15,270 | Booster, Upper | **error: lift ratio 0.67**, "Too weak to lift off … Add engines to the first stage." |
| Transfer to Moon (TLI) | 3,133 | 5,870 | Upper | (on paper) |
| Enter orbit at Moon, 100 km | 822 | 2,734 | Upper | (on paper) |
| Land | 1,870 | 1,912 | Upper (drops when empty), Descent | (on paper) |

Lift-off mass is 305.0 t against 2,000 kN, so 2000 / (305.0 × 9.81) = 0.67. Δv alone would suffice (42 m/s left), but the rocket cannot leave the pad. The one-click tank fix (`fix.ts`) does not help: it only resizes tanks and rejects new lift-off errors. A tank scan of booster, upper and lander gives no fix ("No tank size fixes this"). The Planner has to change engines.

The two workable answers:

| | **Solution 1: Twin booster** | **Solution 2: One big engine** |
|---|---|---|
| Booster | 2 × 2000 kN / 305 s (2 × KL-2000), 260 t | 1 × 4500 kN / 320 s (KL-4500), 260 t |
| Upper stage | unchanged (HL-120, 22 t) | unchanged |
| Lander | HT-5, tank **1.6 t** (PT-1.6), legs **2.5 t** (LG-2.5) | HT-5, tank 1.6 t, legs 2.5 t (the lean variant: tank 0.7 t, legs 1 t, see below) |
| Lift-off mass | 309.0 t | 310.0 t |
| Lift ratio at launch | 1.32 | 1.48 |
| Lift ratio at landing (1.62 m/s²) | 1.48 | 1.38 |
| Touchdown mass vs legs | 1.13 t / 2.5 t | 1.21 t / 2.5 t |
| Δv left after landing | **154 m/s** | **371 m/s** |
| Booster engine reliability (planner estimate) | 0.98² = **0.960** (two engines, two chances to fail) | **0.980** |
| Goal chances, planner estimate (orbit / land / ice) | 0.928 / 0.903 / 0.858 | 0.947 / 0.921 / 0.876 |
| Booster engine offers (price, delivery, reliability per engine) | Swift 2 × 38.2 = **76.4 M, 4 mo (122 d)**, 0.975 · Tallis 2 × 28.5 = 57.0 M, 8 mo (244 d), 0.985 · Brightline 50.6 M, 10 mo (too late for day 300) | Tallis **58.3 M, 8 mo (244 d)**, 0.985 · Helix 91.4 M, 7 mo (213 d), 0.995 · Comms deal: Feldwerk 55 M, 4 mo after the deal (§2.8) |
| Latest signing day for launch day 300 | Swift: day 178 · Tallis: day 56 | Tallis: **day 56** (~1.8 real minutes) · Helix: day 87 (Helix priority 0.8 ×: day 130, at 1.2 × price) |
| Parts total (typical: Swift / Tallis boosters, others below) | 189.3 M (Swift) / 169.9 M (Tallis) | 171.2 M (Tallis) / 204.3 M (Helix) |
| Goal chances bought (orbit / land / ice) | Swift 0.911 / 0.882 / 0.839 · Tallis 0.930 / 0.900 / 0.856 | Tallis 0.944 / 0.914 / 0.869 · Helix 0.954 / 0.923 / 0.878 |

"Others below" in the parts totals means the same nine parts in every column: KT-260 Tallis 2.7, HL-120 Commons 25.0, HT-22 Commons 1.2, HT-5 Commons 2.7, PT-1.6 Commons 0.6, LG-2.5 Commons 5.8, L4.5 Meridian 70.2, SP-0.6 Commons 2.2, HG-120 Commons 2.5. Their sum is 112.9 M.

The trade in one sentence: **one big engine is safer and cheaper, but must be ordered in the first two minutes or arrives late; two engines can be bought fast at any time, but each engine is one more thing that can fail.** Mass and margin go the same way as risk: the big engine leaves 371 m/s spare, the twin booster 154 m/s.

The way most first-time Planners will get there, traced in the model:

1. Set booster engines to 2. Lift-off is now fine, but the landing is **120 m/s short** (has 1,750 m/s, needs 1,870).
2. Press the tank fix. It sets the lander tank to **0.86 t**: 0 m/s spare, touchdown 0.95 t, legs 1 t → passes.
3. Procurement can buy only Flask PT-1.6 for a 0.86 t tank (the next catalogue size). Once contracted, the tank holds 1.6 t (`derive.ts actualPart`), touchdown becomes 1.12 t, and the planner shows **"Landing legs are too weak: rated for 1 t, touchdown mass is 1.12 t."** Swapping the legs for 2.5 t gives Solution 1.

This mismatch is real. It gives the Planner and Procurement work in minutes 2 to 4. The hint in §2.11 explains it beforehand.

Lean variant of Solution 2 (KL-4500, tank 0.7 t, legs 1 t): it works with **98 m/s** spare and touchdown 0.97 t on 1-t legs. It is the cheapest design, but has no margin: any heavier contracted part breaks it.

Designs that do **not** work (checked): 3 × KL-2000 (Δv short), 2 × KL-2000H at 330 s with 1-t legs (touchdown 1.03 t > 1 t), KL-4500 with the Isp slider left at 305 s (short; the KL-4500 itself is 320 s), Solution 1 with the Vesta HT-35 instead of the HT-5 (short by the extra 0.075 t), any design with the heavy Vesta HT-120 (306 s, no research needed) on a 22-t upper stage.

### 2.6 Science

| Need (shown under "The mission needs" from second one) | Route (`science/data/techs.ts`, unchanged) | Cost | Time at factor 0.6 | Chance | Research by (launch day 300) |
|---|---|---|---|---|---|
| Surface lab performance ≥ 4.5 | `lab-automation` (limit 6) | 14 M | 3.0 mo = 91 d | 0.85 | day 117 (Fieldkit L4.5 from Meridian, 183 d) |
| Storable hypergolic engine Isp ≥ 312 | `hypergolic-tuning` (limit 335) | 8 M | 1.8 mo = 55 d | 0.95 | day 148 for HT-5 (Commons, 152 d). Science's panel shows day 209, because it uses the fastest fitting part (HT-35 from Swift, 91 d), which is too heavy for Solution 1 |

Both succeed together 0.81 of the time (weather: 0.81).

If one fails:

| Failure | Recovery | Cost to the mission |
|---|---|---|
| `lab-automation` fails once (15 %) | Retry, done day ~182. Lab arrives ~day 366 → **slip the launch to ≥ day 366** (deadline 455 leaves room) | +14 M, 66 days of the time score |
| `lab-automation` fails twice (2 %) | Lab would arrive ~day 456: too late. Comms route: **Northgate regolith lab** (§2.8) raises the limit to 5. Otherwise land without the ice goal (2 of 3) | — |
| `hypergolic-tuning` fails (5 %) | Retry (55 d). HT-5 from Commons still arrives by ~day 262 | +8 M |

After minute one, Science **tests delivered parts** (existing feature, 1.2 months at factor 0.6, 20 % of price, halves the failure risk). Which tests fit before launch is a real choice:

| Part | Arrives (signed early) | Test ends | Effect |
|---|---|---|---|
| Booster engines (Swift, Solution 1) | ~day 125 | ~day 162 | cluster 0.951 → 0.975, test 15.3 M |
| Booster engine (Tallis, Solution 2) | ~day 250 | ~day 287 | 0.985 → 0.9925, test 11.7 M |
| Upper engine HL-120 (Commons) | ~day 155 | ~day 192 | 0.970 → 0.985, test 5.0 M |
| Surface lab | ~day 275–285 | ~day 312–322 | **after launch**: only if the launch slips |

Three research teams: two start the needs at minute 0, the third is free for tests from ~minute 4.

### 2.7 Procurement

| Pressure point | Numbers |
|---|---|
| Long-lead booster (Solution 2) | KL-4500: Tallis 244 d → sign by **day 56**. Helix 213 d → day 87. Only Swift sells a booster engine fast (KL-2000, 122 d) |
| Lab window | Order between the end of `lab-automation` (~day 91–101) and **day 117** (Meridian standard 183 d). Helix (213 d) is too late unless priority (170 d, 1.2 ×) |
| Catalogue size jumps | Tank 0.86 t → only the 1.6 t tank (§2.5 step 3). Booster tank 279 t (what the fix proposes for 2 engines on a **120 t** tank) → only Silo KT-600 = launch failure. Use 260 t |
| Lighter is right here | Criteria accept bigger parts: the HT-5 slot also fits the HT-35 (Swift, 3 mo) and the KL-2000 slot also fits the KL-4500. Heavier parts break Solution 1. The ranking (lightest first, `rules.ts rankAssessments`) picks the right ones. Overriding it to "fast" can cost the landing |
| Budget | 260 M. Parts 170–204 M + research 22 M leave 34–68 M for tests, Comms options and one research retry. A tender for the lab beyond research (Nova, 2.1 × 65 = 137 M, 9 mo) is unaffordable and too slow, which is deliberate: the backup routes are Science's retry and the Comms project |

### 2.8 Communications

New character (add to `data/characters.ts`):

```ts
{ id: 'kessler', name: 'Dr. Amara Kessler', role: 'Head of landing-site selection, crewed lunar programme', stakeholder: 'government', initials: 'AK' },
```

`MOON_CAST = byId(['duarte', 'feld', 'okafor', 'moreau', 'salo', 'kessler'])`.

**Reused events.** Copy the definition verbatim, change only the `id` (prefix `mo-`) and what the table says.

| Source | Event ids | Changes |
|---|---|---|
| `mars/eventsTriggered.ts` PLAYER_EVENTS | `ion-export-review`, `rtg-plutonium-story`, `ion-engine-doubts`, `late-delivery-excuse`, `cancelled-contract-backlash`, `cheapest-bid-whistleblower`, `rock-from-space`, `university-partnership-offer`, `launch-moved-rush-fee` | none |
| `mars/eventsTriggered.ts` TRIGGER_EVENTS | `nuclear-research-hold`, `public-protest` | none |
| | `budget-audit` | `when: budgetBelow(80)`; message: `You have less than a third of your budget left and a lander still to buy. The committee is sending auditors. Please make them feel welcome.` |
| | `extra-funding-offer` | `60 M` → `30 M` in message, option text and outcome (`budget(30)`); `no-strings`: `Ask for 15 M with no strings attached.` / `budget(15)` / outcome `… Every station gets 15 M more.`; ignored outcome `… Duarte's 30 M goes to a bridge.` |
| `mars/eventsPool.ts` | `district-supplier`, `treasury-clawback`, `infrastructure-leftovers`, `machinist-strike`, `titanium-price-spike`, `leaked-cost-memo`, `weapon-conspiracy`, `export-licence-freeze`, `schematics-leak` | none |
| | `surplus-upper-stage-engine` | offer `stats: { thrustKN: 120, isp: 450 }` (110 kN would not fit the 120 kN slot) |
| `weather/eventsTimeline.ts` | `wx-launch-readiness` → `mo-launch-readiness` | `at: 270` |
| `weather/projects.ts` | `wx-plutonium-licence`, `wx-laser-licence`, `wx-export-licence`, `wx-nuclear-hearing` | none |
| `mars/projects.ts` | `capitol-lobbying`, `supplier-roundtable` | none |

Left out on purpose: `vacuum-chamber-slot`. Its `service` effect is not read by the planner (no code consumes `service`), so it would be money for nothing. The same goes for the weather ground-station "halves the data rate" text.

**New events** (`data/moon/eventsTimeline.ts`):

```ts
{
  id: 'mo-why-the-moon',
  source: 'timeline', at: 15, deadlineDays: 20,
  characterId: 'okafor',
  title: 'Why the Moon, again?',
  message: 'People walked on the Moon sixty years ago. My readers ask why we are sending a robot there now, and what it could find that astronauts missed. What should I tell them?',
  options: [
    option('ice', 'Explain: ice in dark polar craters could be water for crews.',
      [trust('public', 10)],
      'Her piece "Water on the Moon?" is the most-read story of the week. Readers start asking where exactly.'),
    option('crew', 'Say it scouts the landing site for the next crew.',
      [trust('government', 5), trust('public', 5)],
      'Duarte forwards the article to the whole committee. Okafor asks to fly with the next crew, half joking.'),
    option('tour', 'Show her the lander in the clean room (science hosts).',
      [trust('public', 5), trust('partners', 5), pace(-10, 1)],
      'Her photos of the drill go everywhere. Science loses a few days to hairnets and questions.'),
  ],
  ignored: { effects: [trust('public', -5)], outcome: "The story runs as 'Agency silent on Moon plans' next to a photo of an empty launch pad." },
  tags: ['public', 'press'],
},
{
  id: 'mo-site-team-needs-data',
  source: 'timeline', at: 45, deadlineDays: 25,
  characterId: 'kessler',
  title: 'The crew needs your ice map',
  message: 'My team picks the landing site for the first crew next spring. If your lander finds ice before then, we land next to it; if not, we guess. Can you promise me the data by 1 April 2031?',
  options: [
    option('promise', 'Promise the ice data by 1 April (planner keeps the date).',
      [trust('government', 10), constraint('The crewed landing-site team expects the ice data by 1 April 2031: keep the announced launch date.')],
      'Kessler pins the date to her wall. The planner now has a launch date with a crew attached to it.'),
    option('share-early', 'Promise to share every reading the day it arrives.',
      [trust('government', 5), trust('partners', 5)],
      'Kessler is pleased, and so is Meridian, who will see the same files. Openness costs nothing until someone leaks it.'),
    option('no-promise', 'Promise nothing: the Moon has wrecked faster schedules than ours.',
      [trust('government', -5), trust('public', 5)],
      'Engineers nod. Kessler says she will plan around a guess, and makes it sound like your fault.'),
  ],
  ignored: { effects: [trust('government', -10)], outcome: "Kessler tells the committee that the robotic programme 'does not answer the phone'." },
  tags: ['government'],
},
{
  id: 'mo-budget-review',
  source: 'timeline', at: 75, deadlineDays: 25,
  characterId: 'duarte',
  title: 'Budget review',
  message: 'The committee reviews your budget next week. One colleague says we already have Moon rocks in a museum, so why buy more. Give me an answer I can say out loud.',
  options: [
    option('trim', 'Offer a 10 M trim to show discipline.',
      [budget(-10), trust('government', 10)],
      'The committee praises your restraint. Every station now has 10 M less to be restrained with.'),
    option('home-suppliers', 'Pledge contracts to home suppliers (procurement pays more).',
      [trust('government', 10), trust('industry', 5), price(10, 3)],
      'Duarte gets her line about local jobs. Procurement gets a memo explaining why parts cost more.'),
    option('water', 'Explain: water found on the Moon need not be launched.',
      [trust('government', -5), trust('public', 5)],
      'The explainer about rocket fuel from ice goes viral. The colleague does not enjoy being the example.'),
  ],
  ignored: { effects: [budget(-20), trust('government', -5)], outcome: "Without a champion, the committee trims 20 M 'to encourage efficiency'." },
  tags: ['government', 'funding'],
},
{
  id: 'mo-meridian-tracking',
  source: 'timeline', at: 120, deadlineDays: 25,
  characterId: 'moreau',
  title: 'Our dish for your landing',
  message: 'Our deep-space dish can follow your lander during the descent, when every second of data counts. In return, our scientists would like the ice data on the same day as yours. Shall we sign?',
  options: [
    option('sign', 'Sign: Meridian tracks the landing and shares the data.',
      [trust('partners', 10), trust('government', -5), setFlag(FLAG_GROUND_STATION)],
      "Meridian's dish is booked for landing day. A senator asks why foreigners see the data first."),
    option('rent', 'Rent the dish for landing day only.',
      [trust('partners', 5), setFlag(FLAG_GROUND_STATION)],
      "A clean deal: money for antenna time. Moreau calls it 'efficient', which is not a compliment.", 5),
    option('own-dishes', 'Decline: our own dishes are enough.',
      [trust('partners', -5), trust('government', 5)],
      "Duarte likes the sound of 'our own dishes'. Moreau offers the slot to a rival agency."),
  ],
  ignored: { effects: [trust('partners', -10)], outcome: "Meridian takes the silence as a no and books the dish for a rival's lander." },
  tags: ['partners'],
},
{
  id: 'mo-still-on-the-ground',
  source: 'timeline', at: 330, deadlineDays: 20,   // arrives only if the launch slipped (comms stops at launch)
  characterId: 'kessler',
  title: 'Still on the ground',
  message: 'Your launch date has passed and the lander is still on the ground. My team chooses the crew landing site in April, with or without your data. What do I plan on?',
  options: [
    option('new-date', 'Give her a firm new date, and keep it.',
      [trust('government', 5)],
      'Kessler writes the new date in pen. The planner now has no slack at all.'),
    option('orbital-maps', "Buy Meridian's orbital ice maps as a stopgap.",
      [trust('government', 5), trust('partners', 5)],
      "Meridian's maps narrow the choice to three craters. Kessler still wants yours for the final pick.", 6),
    option('blame-suppliers', 'Blame the delay on late suppliers.',
      [trust('public', 5), trust('industry', -10)],
      'The public gets a villain. Feld gets a phone call from his board, then makes one to you.'),
  ],
  ignored: { effects: [trust('government', -10), trust('public', -5)], outcome: "Kessler tells a press briefing the crew 'may have to land on a guess'. Okafor quotes it." },
  tags: ['government', 'bad'],
},
```

New pool event (`data/moon/eventsPool.ts`, next to the reused ones):

```ts
{
  id: 'mo-rival-lander-crash',
  source: 'pool', weight: 2, deadlineDays: 21,
  characterId: 'okafor',
  title: 'Another lander crashed',
  message: "A rival company's lander hit the Moon last night instead of landing on it. My readers want to know why yours would be different. Is it?",
  options: [
    option('tests', 'Explain how science tests every critical part.',
      [trust('public', 10)],
      "Readers learn what a vacuum chamber is. Science gets fan mail addressed to 'the people who shake things'."),
    option('humble', 'Admit it: landing is hard, the odds are good, never certain.',
      [trust('public', 5), trust('government', -5)],
      "Engineers love the honesty. Duarte would have preferred the word 'certain'."),
    option('no-comment', 'No comment.',
      [trust('public', -10)],
      "'AGENCY SILENT ON CRASH RISK' runs above a photo of the debris field."),
  ],
  ignored: { effects: [trust('public', -10)], outcome: "'AGENCY SILENT ON CRASH RISK' runs above a photo of the debris field." },
  tags: ['public', 'press', 'bad'],
},
```

New projects (`data/moon/projects.ts`, next to the reused ones):

```ts
{
  id: 'mo-moon-night-gala',
  name: 'Moon Night gala',
  kind: 'gala',
  description: 'An evening at the planetarium for legislators and suppliers, with a lunar drill everyone can try on a bucket of fake regolith.',
  costM: 5, months: 1,
  startTrust: [],
  effects: [trust('government', 10), trust('industry', 5)],
  result: 'Moon Night: a senator drilled through the bucket and the table. Suppliers networked aggressively.',
},
{
  id: 'mo-water-campaign',
  name: '"Water on the Moon" campaign',
  kind: 'campaign',
  description: 'A month of explainers on why ice at the lunar poles matters for every future crew. Raises public trust and calms protests.',
  costM: 4, months: 1,
  startTrust: [],
  effects: [trust('public', 10), odds('protest', 0.5, 3)],
  result: '"Water on the Moon" wraps up: schoolchildren now ask for ice maps for their birthdays.',
},
{
  id: 'mo-feldwerk-booster',
  name: 'Booster engine from Feldwerk',
  kind: 'negotiation',
  description: 'Feldwerk has a 4,500 kN kerosene engine from a cancelled order. Negotiate it for procurement: it ships in 4 months instead of 8.',
  costM: 3, months: 1,
  startTrust: [],
  requires: { stakeholder: 'industry', min: 55 },
  effects: [
    trust('industry', 5),
    offer({
      partKind: 'engine', variant: 'kerolox', supplier: 'Feldwerk Launch Systems',
      priceM: 55, deliveryMonths: 4, reliability: 0.985,
      note: 'Single 4,500 kN booster engine from a cancelled order.',
      stats: { thrustKN: 4500, isp: 320 }, massT: 6.95,
    }),
  ],
  result: "Feldwerk's 4,500 kN engine is now an offer in procurement's list: four months to deliver.",
  partnerCharacterId: 'feld',
},
{
  id: 'mo-northgate-regolith-lab',
  name: 'Northgate regolith lab',
  kind: 'negotiation',
  description: "Fund Northgate's regolith lab to share its drill-and-oven results. Raises the surface-lab limit to 5: a second route if Science's lab research fails.",
  costM: 6, months: 3,
  startTrust: [],
  requires: { stakeholder: 'partners', min: 55 },
  effects: [trust('partners', 5), limit('instrument.surfaceLab.performance', 5)],
  result: 'Northgate shares its drill-and-oven results: surface labs can now reach performance 5.',
  partnerCharacterId: 'salo',
},
```

`mo-feldwerk-booster` is Comms' lever on the Planner's main decision: with it, the safer single engine stays possible after day 56. `mo-northgate-regolith-lab` is the second route for Science's riskier need. Both need trust above the starting 50, so Comms has to earn them first.

In-flight events (`data/moon/inFlight.ts`):

```ts
export const IN_FLIGHT: InFlightEventDef[] = [
  { id: 'mo-ops-funding', station: 'comms', title: 'Surface operations funding',
    goodIf: trustAbove('government', 60),
    good: { text: 'The committee funds every day of surface operations. The drill gets its full schedule.', goalChanceDelta: 0.02 },
    bad: { text: 'Surface operations are funded week by week. The drill team rations its runs.', goalChanceDelta: -0.02 } },
  { id: 'mo-descent-tracking', station: 'comms', title: 'Tracking the descent',
    goodIf: anyOf(hasFlag(FLAG_GROUND_STATION), trustAbove('partners', 60)),
    good: { text: "A partner dish follows the whole descent. The flight team sees every second of it.", goalChanceDelta: 0.03 },
    bad: { text: 'The lander drops out of contact for forty seconds during the descent. Nobody breathes.', goalChanceDelta: -0.02 } },
  { id: 'mo-engine-patch', station: 'procurement', title: 'Descent engine software patch',
    goodIf: allOf(trustAbove('industry', 45), lacksFlag('contract.cheapest')),
    good: { text: "The engine supplier sends a throttle patch a day before landing. It works first time.", goalChanceDelta: 0.03 },
    bad: { text: "The supplier's support line is closed for the weekend. The landing flies on the old throttle table.", goalChanceDelta: -0.03 } },
  { id: 'mo-rehearsed-landing', station: 'planner', title: 'Rehearsed landing',
    goodIf: lacksFlag('plan.launchMoved'),
    good: { text: 'The flight team rehearsed this descent for months. The lander touches down by the book.', goalChanceDelta: 0.02 },
    bad: { text: 'The moved launch cut the rehearsals short. The descent uses more fuel hovering than planned.', goalChanceDelta: -0.02 } },
];
```

### 2.9 Play length and who is busy (normal speed: 1 real minute = 1 month)

| Real time | Planner | Science | Procurement | Comms |
|---|---|---|---|---|
| 0:00–1:00 | Builds the 4-step flight plan; sees "too weak to lift off" | Starts both needs (2 of 3 teams) | Waits for the order, then reads booster lead times | Kessler / Okafor events |
| 1:00–2:00 | **Chooses twin or single booster**; sizes lander tank and legs | — | **Signs the booster by day 56** (Solution 2 Tallis); long-lead tank and upper engine | Budget review; earns industry trust for the Feldwerk deal |
| 1:50 | | `hypergolic-tuning` ends (95 %) | HT-5 becomes buyable: sign by day 148 | |
| 3:00 | | `lab-automation` ends (85 %) | **Lab window: days ~91–117** | |
| 3–5 | Legs too weak after the 1.6-t tank (Solution 1 path); fixes it | Tests the first parts (upper engine, Swift boosters) | Re-buys legs and cancels the old ones; small parts | Meridian tracking deal (day 120); Northgate lab if research failed |
| 5–9 | Watches margins as contracts replace estimates; may move the launch | Tests the booster engine (Solution 2, ~day 250–287) | Late deliveries, pool events (strike, price spike) | Pool events, readiness hearing (day 270) |
| 9:52 | Launch, day 300 (~5 days of flight on the map) | | | In-flight events |

Total ≈ 10 minutes of calendar plus the result. That is about 1.7 × the weather mission (launch day 180). A failed lab research slips the launch to day ≥ 366 (~12 min).

### 2.10 Difficulty: what goes wrong, how it shows, recovery

| What goes wrong | First sign (where) | Recovery |
|---|---|---|
| Rocket cannot lift off | Planner error from the first launch step: "Too weak to lift off (lift ratio 0.67) … Add engines to the first stage." | Twin or single booster (§2.5) |
| Landing short of fuel | "Out of fuel: needs 1.87 km/s, has 1.75 km/s" on **Land** | Tank fix (lander tank). Then mind legs |
| Legs too weak after a bigger tank arrives | Planner error on Land: "Landing legs are too weak …" | 2.5-t legs (Strider LG-2.5, 61–122 d) |
| Single booster engine ordered too late | Procurement: offer marked late; Planner: delivery error | Helix priority, the Comms Feldwerk deal, switch to twin booster (Swift), or move the launch |
| Lab research fails | Science news; the need stays open; Procurement "beyond research" | Retry + slip the launch; Comms Northgate project |
| Wrong (heavier) part bought for a slot | Planner Δv margin drops / error after contract | Cancel (partial refund) and rebuy the light part |
| Budget runs low | Comms `mo-budget-audit` (below 80 M) | Skip tests, decline costly Comms options |
| A part fails in flight | Result screen | Restart (core `restart`, af11ed7); test that part next time |

### 2.11 New ideas and how the screen introduces them

The planner does not show `briefing` today (it is read only as a lobby fallback, `Lobby.tsx:180`). These sentences need the small addition in §3 (planner "Mission" card). One sentence each:

| Idea | Sentence for a beginner |
|---|---|
| Leaving Earth | "To reach the Moon, burn once more from low orbit: the transfer takes about five days." |
| Arriving | "At the Moon you are going too fast to stay: brake into lunar orbit before you can land." |
| Landing without air | "The Moon has no air to slow you down: the landing is a 1.9 km/s braking burn, all from fuel." |
| Lift ratio in lunar gravity | "The descent engine must push harder than the lander weighs in lunar gravity (1.6 m/s²)." |
| Legs | "Landing legs must carry what is left when you touch down, including unburned fuel." |
| One engine or several | "Every engine can fail: two engines are two chances to fail, one big engine is one." |
| Catalogue sizes | "Parts come in fixed sizes: a 0.86 t tank arrives as the 1.6 t tank, and it is full." |

The game's own messages already cover the lift-off, fuel and legs errors (`evaluate.ts`). The menu labels ("Transfer to Moon", "Enter orbit at Moon", "Land on Moon") already guide the four steps.

---

## 3. Implementation plan

| Owner | File | Change | Buildable today? |
|---|---|---|---|
| Planner mission data | **add** `game/src/stations/planner/data/missions/moonLander.ts` | `MOON_LANDER: MissionDef` as below | yes |
| Core registration | `game/src/core/mission.ts` | import; `MISSIONS = [WEATHER_GEO, MOON_LANDER, MARS_ORBITER_LANDER]` | yes. **Another builder is editing `core/` now: coordinate** |
| Lobby card | `game/src/shell/Lobby.tsx` `MISSION_CARD` | `'moon-lander': { tag: 'Next step', text: 'One lander to the Moon: leave Earth, enter lunar orbit, land and drill for ice. Medium game.' }` | yes |
| Comms | `comms/data/characters.ts` | add `kessler`, `MOON_CAST` (§2.8) | yes |
| Comms | **add** `comms/data/moon/{index,eventsTimeline,eventsTriggered,eventsPool,projects,inFlight}.ts` | §2.8 (reused copies + new). Imports as in `weather/` (+ `FLAG_GROUND_STATION`, `setFlag`, `offer`, `limit`, `odds`, `budgetBelow`, `trustAbove`, `constraint`) | yes |
| Comms | `comms/data/content.ts` | `MOON_CONTENT` (`missionId: 'moon-lander'`), add to `CONTENT_BY_MISSION`, update header comment. **Without it `contentFor` falls back to Mars content** | yes |
| Science | none (`lab-automation`, `hypergolic-tuning` exist). `science/README.md`: list the third mission | yes |
| Procurement | none (every part is in `catalogue.ts`) | yes |
| Planner UI | show `mission.briefing` + the §2.11 sentences on the planner (e.g. a "Mission" card above Goals). Optional field `MissionDef.ideas?: string[]` | **not buildable as data alone**: a small UI addition (types.ts field + one component) |
| Optional | `fix.ts`: snap the proposed tank size up to the next catalogue size and re-check legs | not needed. It would remove the §2.5 step-3 surprise |

`moonLander.ts` (same helpers as `weatherGeo.ts`):

```ts
let n = 0;
const id = (prefix: string) => `${prefix}-l${++n}`;
// part(), stage() exactly as in weatherGeo.ts
const landerId = id('sc');

export const MOON_LANDER: MissionDef = {
  id: 'moon-lander',
  name: 'Lunar ice lander',
  briefing: '…§2.1…',
  startDateISO: '2030-01-01',
  completionDeadlineDay: 455,
  budgetM: 260,
  goals: [
    { id: 'goal-moon-orbit', name: 'Reach lunar orbit', kind: 'orbit', body: 'moon' },
    { id: 'goal-moon-land', name: 'Land on the Moon', kind: 'land', body: 'moon' },
    { id: 'goal-moon-ice', name: 'Drill for water ice', kind: 'surfaceData', body: 'moon', instrument: 'surfaceLab', minPerformance: 4.5, stayDays: 12 },
  ],
  researchTimeFactor: 0.6,
  research: { /* weatherGeo.research with: surfaceLab 3.2, hypergolic.isp 310, camera 6, antenna 3000 */ },
  unlocked: [ /* as weatherGeo */ ],
  initialRocket: {
    stages: [
      stage('Booster', 'kerolox', 1, { thrustKN: 2000, isp: 305 }, [260]),
      stage('Upper stage', 'hydrolox', 1, { thrustKN: 120, isp: 446 }, [22]),
    ],
    spacecraft: [{
      id: landerId, name: 'Lunar lander', payloadType: 'lander',
      stages: [stage('Descent stage', 'hypergolic', 1, { thrustKN: 5, isp: 312 }, [0.7])],
      equipment: [
        part('instrument', 'surfaceLab', { performance: 4.5 }),
        part('power', 'solar', { outputKW: 0.6 }),
        part('antenna', 'standard', { dataRateKbps: 120 }),
        part('legs', 'standard', { maxLandingMassT: 1 }),
      ],
    }],
  },
  initialPlan: { launchDay: 300, branches: [{ id: 'branch-root', name: 'Main', spacecraftIds: [landerId], carriesRocketStages: true, maneuvers: [] }] },
};
```

Nothing needs new physics. Bodies, the Moon transfer, insertion, landing, legs and lunar-gravity lift ratio, and all three goal kinds exist.

### Checks for the builder (in the running planner)

1. Starting design: launch error lift ratio **0.67**, mass **305.0 t**, the fix says "No tank size fixes this".
2. Booster ×2 → Land short **120 m/s**. Fix → lander tank **0.86 t**.
3. Solution 1 (§2.5): margin **154 m/s**, touchdown **1.13 t**. Solution 2: **371 m/s**, **1.21 t**. Lean Solution 2: **98 m/s**, **0.97 t**.
4. Transfer 3,133 m/s, 4.98 d; insertion 822 m/s at 100 km.
5. Science "The mission needs" shows exactly the two needs of §2.6.

---

## 4. Realism

| Game figure | Real reference | Source |
|---|---|---|
| Transfer ~5 days (model 4.98 d) | LRO launched 18 Jun 2009, entered lunar orbit 23 Jun 2009 (~4.5 days, direct trajectory on an Atlas V) | [NASA LRO](https://science.nasa.gov/mission/lro/), [NASA SVS LRO orbit insertion](https://svs.gsfc.nasa.gov/10445) |
| TLI 3.13 km/s, LOI 0.82 km/s | The game's patched-conic Hohmann from 200 km to the Moon's orbit (`transfers.ts`). Close to the usual textbook value of ~3.1 km/s for TLI | Model computation; textbook value not checked against a NASA page this session |
| Lunar descent 1.87 km/s | `bodies.ts` `moon.landDvMs` (existing data) | existing game data, not re-checked |
| Water ice at the south pole | LCROSS impacted Cabeus crater on 9 Oct 2009; NASA confirmed water on 13 Nov 2009 | [NASA LCROSS](https://science.nasa.gov/mission/lcross/) |
| "Surface lab with drill and oven" | NASA PRIME-1 (TRIDENT drill + MSolo mass spectrometer) on IM-2, landed 6 Mar 2025 near Mons Mouton. It was planned for ~10 days but worked ~10 hours; no ice was reported | [NASA: drill passes tests on the Moon](https://www.nasa.gov/missions/artemis/clps/nasas-lunar-drill-technology-passes-tests-on-the-moon/) |
| Upper stage drops away during the landing burn (model behaviour) | Surveyor 1 (landed 2 Jun 1966): a solid retro-motor did the main braking and was jettisoned at ~31,000 ft, then vernier engines landed | [NASA Surveyor 1](https://science.nasa.gov/mission/surveyor-1), [JPL: Surveyor I lands](https://www.jpl.nasa.gov/news/surveyor-i-lands-on-the-moon/) |
| Landers crash (`mo-rival-lander-crash`) | Several commercial and national landers have failed since 2019 | general knowledge; not cited, the event names no mission |
| `stayDays: 12` | One lunar daylight period is ~14 Earth days | general knowledge |

Not modelled and deliberately not claimed: the landing site latitude, lighting, the lunar night, monthly launch opportunities, orbit inclination.

---

## 5. Open points

- Budget 260 M and launch day 300 are balancing choices. They have not been played.
- Solution 2 dominates Solution 1 if it is signed in time. Solution 1 matters when the order is late, a contract slips, or the Feldwerk deal fails. If playtests show nobody needs it, raise Tallis's KL-4500 price or lower its reliability in the catalogue.
- Whether Mars should also move its `hypergolic.isp` limit to 310 (consistency of the "agency today") is not decided here.
