# Authored content and copy audit — 2026-11-16

## Scope, method and boundaries

Read-only source audit of all authored content families: 22 Communications data modules (2,995 lines: shared cast/helpers/configuration plus Weather, Mars and Moon timeline/trigger/pool/project/in-flight sets); Science tech tree, facility needs and failure lines; Procurement catalogue, suppliers, Call templates and pricing; Planner mission definitions, bodies, parts and propulsion. Required project instructions and design documents were consulted. No test suites, builds, game actions or implementation edits were performed by this reviewer. Mechanical string-duplication inspection was a source audit, not a test suite. Findings below are source-confirmed; this packet does not establish rendered layout, current video visibility, scientific accuracy against external literature, or player enjoyment.

**Tone is accepted direction, not a defect:** the user selected “Light satire, grounded” (`communications/notes/2026-11-14-comms-questions.md:50`; carried into `communications/README.md:97`). Recommendations C-06–07 target repeated stock phrasing and uneven grounding, not removal of satire.

The content already has a product-specific identity: short mission-specific letters, named recurring contacts, clear procurement trade-offs, and tangible settings such as storm season and a crew landing-site decision. Those are worth keeping. The problem is inconsistent editing and claims that drift beyond the implemented consequences, rather than the mere existence of humor or generated text. Do not replace everything with sterile aerospace jargon.

**Priority:** P1 = materially misleads player decisions; P2 = credibility/editorial consistency; P3 = optional polish. No P0 demonstrated. **Compatibility:** C = copy-only with identifiers, effects, timing and hints preserved; G = gameplay-sensitive, outside this requested polish scope. Every C edit is still potentially visible in game: compare the exact text against the submitted video before approving it; this source-only reviewer does not call any on-screen string video-safe.

## Findings

### C-01 [P1, C] Static catalogue descriptions falsely report current research state

Evidence: `game/src/stations/procurement/data/catalogue.ts:25,31,37,43–45,63–64,70,73–74,77,84–86,92,109,115`. Examples include “Ion propulsion is not yet unlocked,” “RTGs are not yet unlocked,” and “beyond current optics research.” These are immutable authored descriptions in ROWS, copied directly into resources and shown unconditionally by `ui/Inspector.tsx:167`; they do not change when Science or Communications raises limits/unlocks. The catalogue's actual availability can therefore disagree with the product description.

Refinement: remove state assertions from product blurbs and let existing dynamic status communicate availability. Examples: “Gridded xenon thruster for efficient, low-thrust transfers”; “Radioisotope generator”; “Telescope-class orbital camera”; “High-pressure hypergolic chamber.” Preserve all stats, unlock checks and resource IDs. Review each search term affected because Catalogue search includes blurb text (`Catalogue.tsx:57`).

### C-02 [P1, C] Moon audit outcomes still imply hardware repair without a reliability effect

Evidence: `game/src/stations/comms/data/moon/eventsTriggered.ts:90–96`: the audit says “The auditors find shortcuts and fix them. The part arrives late but shakes properly”; its effects are public trust +5, industry trust −5 and one-month next-delivery delay. “Have procurement add test clauses” similarly increases prices but does not test delivered parts. Weather (`weather/eventsTriggered.ts:88,91`) and Mars (`mars/eventsTriggered.ts:131,134`) already state that hardware reliability is unchanged and that Science must test it. The Moon branch missed that correction.

Refinement: use a concise version of the accurate Weather/Mars explanation, preserving cost, trust and delay effects. Example: “The audit reassures the public; the next delivery slips a month. Science still needs to test the part to reduce its failure risk.” Do not add reliability rewards to make the old prose true: that changes gameplay.

### C-03 [P1, C] Failure flavor invents mechanical causes that never happened

Evidence: `game/src/stations/science/data/flavour.ts:3–7` includes “A supplier could not deliver the test material” and “The team found a flaw late and had to start over.” `science/logic.ts:85` selects a random line whenever a project fails; selection is not conditioned on suppliers, actual delivery or a restarted project. The same generic pool can accompany every tech. This makes a factual-looking news item blame Procurement or imply extra lost work without such state.

Refinement: retain the brief authored pool, but make every line true of a failed research attempt: “The prototype did not meet the target,” “The measurements did not support the design,” “The result could not be repeated.” Keep “It can be tried again” as the mechanical consequence. No new failure model or branching is necessary.

### C-04 [P2, C] Science thermal research describes the wrong equipment family

Evidence: `science/data/techs.ts:158–167` calls projects “Improved ablator,” “Dual-layer ablator” and “Reusable thermal protection,” describing entry capsule heat shields. All grant `heatProtection.standard.level`. Planner distinguishes `heatShield.maxEntryMassT` from `heatProtection.level` (`planner/data/parts.ts:90–95`); evaluator uses the latter for Venus surface lifetime (`physics/evaluate.ts:106`) and the former for atmospheric entry (`:327,360`). Procurement's corresponding `heatProtection` products are heaters/control loops/hot-surface protection (`catalogue.ts:112–115`). This is an internal semantic mismatch, not a demand for a more realistic simulation.

Refinement: change the research names/descriptions to the existing hot-surface/thermal-control purpose, e.g. “High-temperature insulation,” “Layered thermal barriers,” “Advanced surface thermal protection,” with matching one-sentence explanations. Preserve tech IDs, grants, layout and prerequisites. Because names appear in tree nodes and saved history, video comparison is necessary before changing visible names. Do not move grants to heatShield as a polish fix.

### C-05 [P2, C] Two Science descriptions contain obvious terminology/context mistakes

Evidence: `science/data/techs.ts:139` says an optical link “needs a frequency and landing licence from partners,” while the matching project (`comms/data/mars/projects.ts:39–47`) negotiates frequencies and **ground sites**, not landing. `science/data/techs.ts:152` says “crew-critical electronics” in a tech tree shared by three uncrewed missions.

Refinement: “An optical data link. Partner approval is needed for ground-station access.” For the shield: “Layers of water and polymer protect critical spacecraft electronics.” These retain the existing gate and benefit. At `techs.ts:143`, avoid implying a phased-array antenna literally combines with the laser: “Electronic beam steering and improved link control increase data throughput.” Whether the radio/optical prerequisite relationship is scientifically ideal is outside this polish pass; do not change it.

### C-06 [P2, C] Omniscient outcome prose makes recurring contacts sound interchangeable

Evidence: exact or lightly reskinned punchlines recur across missions: “Suppliers networked aggressively” (`mars/projects.ts:17`, `weather/projects.ts:24`, `moon/projects.ts:25`); “The money arrives with a ribbon on it. Procurement discovers the ribbon is made of price increases” (`mars/eventsTriggered.ts:315`, `weather/eventsPool.ts:65`, `moon/eventsTriggered.ts:256`); “laptops and opinions” (`mars/eventsTriggered.ts:177`, `weather/eventsTriggered.ts:134`, `moon/eventsTriggered.ts:138`); “with the warmth of a [tax form/cold front/lunar night]” followed by the same fruit basket (`mars/eventsTriggered.ts:91`, `weather/eventsTriggered.ts:48`, `moon/eventsTriggered.ts:52`).

This is not evidence of authorship by itself, but it is visible template reuse: swapping the mission noun leaves the same narrator, joke rhythm and reaction. It weakens replay and the impression of a deliberately edited world.

Refinement: keep a few strongest jokes, remove repeated endings, and make outcomes lead with the actual consequence. Example for district funding: “The committee adds 25 M. Procurement quotes rise for three months under the district-sourcing agreement.” Keep the existing value/duration per event; do not apply 25 M globally. Give Duarte short commitments/asks, Moreau specific reciprocal terms, Salo specific lab needs, Okafor questions about evidence, and Lindqvist forecast deadlines. This is an editorial guide, not an instruction to expand dialogue or alter choices.

### C-07 [P2, C] Characters sometimes sound like caricatures before they sound competent

Evidence: `weather/eventsPool.ts:206,215` makes Moreau's spare imager sit in a crate with a “very sad label,” then says the label now says “happy.” Duarte repeatedly cannot handle refusal (`weather/eventsPool.ts:71`, equivalent Mars/Moon funding outcomes). The Mars gala and several public stories end in a stock joke irrespective of the stakes. Humor is a strength when tied to the decision, but relentless teasing of scientists, politicians and journalists makes the mission feel inconsequential.

Refinement: change the spare-imager offer to “Our spare imager is still in storage, fully tested and never flown. Would Procurement like it at cost?” Outcome: “Meridian releases the spare imager; Procurement can review the offer.” Keep occasional sharp lines such as storm season not moving, and let technical partners be precise and useful. This is P2 editorial judgment, not a factual bug and not a request to remove the game's comic tone.

### C-08 [P2, C] A pool story asserts a budget overrun without checking the budget

Evidence: `comms/data/mars/eventsPool.ts:226–249` and `moon/eventsPool.ts:182–205` tell the player an internal memo says the lander is “twenty percent over budget.” These pool events have no `eligible` condition checking cost, lander budget or total spending; the confirmation option validates the allegation. A player who is within budget gets a factual-sounding contradiction.

Refinement: retain the same event, choices and effects but frame the claim as a forecast or disputed report: “A leaked memo warns your lander could overrun its allocation. I would like your response before publication.” Change the confirmation option to “Explain the cost risks and current estimates.” Do not add a new budget eligibility gate under this request, because that changes when players encounter it.

### C-09 [P2, C] “Every station gets” funding language implies separate departmental balances

Evidence: `weather/eventsPool.ts:68`, `moon/eventsTriggered.ts:259`, `mars/eventsTriggered.ts:318` say “Every station gets 15/30 M more.” Cut stories say “Every station has 10/25 M less” (`weather/eventsPool.ts:44`, `moon/eventsPool.ts:46`, `mars/eventsPool.ts:67`); the actual effect is a single shared `budget(delta)`. This can be read as four grants/cuts rather than one shared pot.

Refinement: “The shared mission budget increases by 15 M” or “The agency now has 10 M less.” Preserve each event's amount and retain the sentence that names the stakeholder reaction if useful. Apply consistently to timeline cuts as well.

### C-10 [P2, C] Future or fictional promises read as established technical facts

Evidence: `science/data/techs.ts:76` calls metamorphic cells “The best cells known”; baseline descriptions use “today/as flown today” (`:29,62,89`) even though scenarios are set in 2030. `mars/eventsTimeline.ts:15` promises “the first detailed maps of Mars' buried ice,” despite the mission's required observation goal being camera mapping (`planner/data/missions/marsOrbiterLander.ts:42`), not radar. These claims extend beyond what the code or researched sources establish.

Refinement: use in-world, bounded language: “Lightweight, efficient cells that are difficult to manufacture”; “The agency's established chemical propulsion systems”; “Promise detailed new maps to help identify future landing sites.” Keeping a character's boast can be legitimate fiction, but do not use an unsupported scientific “first” as neutral product information. No external scientific fact-check was performed here; the finding is about unsupported absolutes and internal instrument/goal scope.

### C-11 [P2, C] Narrative outcomes imply extra equipment or automatic tests

Evidence: `mars/eventsTimeline.ts:84–86` says the microphone rides in spare-mass margin, with only trust effects; `mars/eventsPool.ts:280–282` says the agency flies a partner spectrometer, with budget/trust effects only. Neither creates a part, offer or equipment change. `moon/eventsPool.ts:284–286` describes a “cold, airless spa week” for lander parts, while its effect is a temporary research/test pace boost; Mars's equivalent explicitly says Science must start tests (`mars/eventsPool.ts:353`).

Refinement: avoid promising an equipment mutation in the main simulator. Present the first two as ancillary outreach payload commitments handled within the fictional mission reserve, and state the playable effect clearly. For the chamber, mirror the accurate Mars description: “Science's research and part tests run 20% faster for two months. Science still needs to start each part test.” Do not add hardware, mass, goals or automatic tests to satisfy the old story.

### C-12 [P2, C] In-flight prose states physical outcomes while the system applies a probability modifier

Evidence: `weather/inFlight.ts:28` says “The orbit raise finishes on schedule,” and `:37` says a trim burn consumes station-keeping fuel; their only authored effects are goalChanceDelta +0.03/−0.02. Mars equivalents describe losing data/weeks, while `planner/result.ts:43–45` sums modifiers. They do not change the maneuver plan, fuel or physical dates. Text can read as contradictory if the base plan fails or different flight issues dominate.

Refinement: use contribution language: “Supplier support improves the orbit-raise team's chances” or “Reduced rehearsal leaves less confidence in the final trim burn.” Keep event titles, thresholds and goalChanceDelta unchanged. A report layout that clarifies “operational modifiers” would help, but defer visible structural UI changes until video comparison.

### C-13 [P3, C] Minor editorial conventions vary across authored sets

Evidence: repeated “program” (`mars/eventsPool.ts:63`, `moon/eventsPool.ts:42`) alongside “programme” (`moonLander.ts:56`, `characters.ts:17`); pace results use both “30 %” (`weather/projects.ts:120`) and “20%” (`mars/eventsPool.ts:353`); catalogue uses Isp while briefs target newcomers; “land a lander” opens both Mars and Moon briefings (`marsOrbiterLander.ts:33`, `moonLander.ts:56`). These are not serious defects individually, but a small style sheet would make future edits consistent.

Refinement: pick one English convention, retain unit spacing in data tables, define Isp as specific impulse in existing supporting help, and write “Land a robotic spacecraft…” or “Deliver an orbiter and a surface lander…” where it preserves the briefing. Do not stuff definitions into every compact label or normalize historical notes.

### C-14 [P2, comment-only] Stale authored-content comments undermine maintainability

Evidence: `comms/data/moon/eventsPool.ts:4` still calls Weather's budget 350 M, while the mission definition is 210 M (`planner/data/missions/weatherGeo.ts:64`). `comms/data/content.ts:22` calls Weather's launch approximately day 150, while actual `initialPlan.launchDay` is 180 (`weatherGeo.ts:139`). Its stated message/outcome length limits (`content.ts:26`) are exceeded by the accurate three-sentence audit outcomes. The tech tree file still labels itself “for the Mars orbiter + lander mission,” although used across missions.

Refinement: correct present-tense comments or replace unstable duplicated constants with references to the owning data. Keep historical rationale that explains an earlier state explicitly dated; do not erase provenance. A comments-only cleanup is the safest possible first patch.

### C-15 [P1, G — outside polish scope] Mars negotiated ion offer is numerically inconsistent by 1,000×

Evidence: `comms/data/mars/projects.ts:156` sets thrustKN 0.25; Procurement's Whisper XI-25 is 0.00025 kN (`catalogue.ts:44`), and the authored ion range is 0.0001–0.002 kN (`planner/data/propulsion.ts:30`). Code reviewer independently confirmed the contracted stats flow unchanged into actualPart, stage thrust and ion power. 0.25 kN is 250 N and demands approximately 6,129 kW at Isp 3000 and the model's 60% efficiency; 0.00025 kN would be 0.25 N and approximately 6.129 kW. The intended value is not recorded in this packet and must not be assumed.

Recommendation: retain as a separately approved numerical defect investigation. Do not silently change 0.25 to 0.00025 during copy cleanup; it changes thrust, power, burn durations and outcomes, violating the user's gameplay freeze.

## Practical editing plan

1. Comment-only corrections (C-14), requiring no screen or gameplay change.
2. Correct player-misleading claims (C-01–03,08–09,11–12) in small patches after matching video text; preserve every ID/number/effect/condition/cost/timing/hint.
3. Correct Science terminology (C-04–05) without changing grants or prerequisites; tree names need closer video scrutiny than tooltips.
4. Edit only the repeated weakest jokes and unsupported absolutes (C-06–07,10), keeping the existing humorous identity.
5. Apply one compact editorial style sheet to current product copy (C-13); don't rewrite the archive.
6. Keep C-15, scientific realism, balance, mission goals and story eligibility changes outside the authorized refinement scope.

## Verification required before implementation handoff

This report did not implement fixes. For any later copy patch: inspect the diff for unmodified effect arrays, IDs, costs, durations and probabilities; review every changed string with its visible hint and resulting outcome; inspect rendered wrap/clipping at Full HD; compare text and geometry to the submission frames; check existing save/history labels are not broken by ID changes (there should be none). No test suite is prescribed because project instructions prohibit adding/running tests without a user request.

## Exact source coverage inventory

- Communications: all 22 `.ts` files under `game/src/stations/comms/data/`, 2,995 lines. Weather/Moon/Mars `eventsPool`, `eventsTimeline`, `eventsTriggered`, `projects`, `inFlight`, `index`; shared `characters`, `content`, `helpers`, `mission`.
- Science: all 3 data files, 212 lines: `techs.ts`, `needs.ts`, `flavour.ts`.
- Procurement: all 4 data files, 363 lines: `catalogue.ts`, `suppliers.ts`, `calls.ts`, `pricing.ts`.
- Planner: all 6 data files, 834 lines: `bodies.ts`, `parts.ts`, `propulsion.ts`, and all three mission definitions.
- Total authored-data source scope: 35 files, 4,404 lines, plus targeted owning UI/logic/evaluator reads to verify how claims are displayed/applied. No external NASA/scientific accuracy certification is claimed.

Definition counts (counted top-level data records): 91 Communications events (Weather 25, Moon 29, Mars 37), 28 projects (8/6/14), 13 in-flight modifiers (4/4/5), 16 shared characters; 46 Science starting/research nodes; 77 catalogue resources. These are source definitions, not a claim that every item is available or encountered in every playthrough.
