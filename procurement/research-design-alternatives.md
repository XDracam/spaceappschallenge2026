# Procurement: research, principles and design alternatives

**Date:** November 14, 2026. **Status:** research and unselected design proposals. This responds to the [user's request for deeper research](../docs/notes/2026-11-14-procurement-research-clarification.md). Nothing here changes accepted decisions.

## Scope and method

We need a station that shops an authored catalogue and manages a shared Budget across multiple needs, including hardware, people and research support. Procurement discovers options, commits through Contracts and discusses tradeoffs with other players. All roles need meaningful work concurrently. Tasks are shared; Contracts remain inventory. Calls and catalogue purchases both remain routes. See D-004–D-011, [current gameplay](gameplay.md), and [scenarios](scenarios.md).

The first pass gave a list of games with brief analogies. It missed a closer Call reference. This follow-up examines underlying decisions, derives design principles, proposes alternatives and traces them through a common situation. Sources were checked November 14, 2026. Published rules and developer statements support claims about games; derived principles and all designs are our analysis, not established findings that they are fun. We inspected the start of **The Sourcing Lab** through its quote comparison in a browser; that was not a complete playthrough. Other games were not played for this research. Serious games, commercial games and an automated-agent competition have different audiences and are identified accordingly.

## Reference studies

### The Sourcing Lab: a complete buying process with real choices

**What it is.** A browser-based procurement training game. Its stated sequence covers defining a category, consolidating demand, screening suppliers, requesting quotations, evaluating, negotiating, awarding and observing performance. A quick learning mode presents one category; longer modes revisit suppliers. [Creator's description and methodology](https://www.siliconandsteel.co/games/sourcing/).

**What we observed.** In Quick mode we chose custom controller chips. The first screen asks for a single or dual supplier strategy, explaining the cost-versus-backup tradeoff. The next screen offers to consolidate four plants' demand: 46,000 units become 120,000, with the stated effect of a better volume price and more negotiating leverage. A supplier screen compares capability, capacity, certification, financial health and risk. At the RFQ stage three candidates appear with unit quote, lead time, quality, capacity and financial/risk indicators. Five weighting sliders adjust the score and ranking. We stopped at the selection screen; negotiation, performance, scoring and their consequences were not independently played.

**Mechanism and implication.** Combining needs is an action that can change the available deal, while committing to a supplier concentrates or spreads exposure. The scorecard helps compare dimensions but a single number can conceal what a mission actually needs. The source's risk/price model and numerical outcomes are designed for training, not evidence of balance in our game.

**Adaptation.** A bulk Offer could serve two existing Tasks and save money, with each unit separately allocated. A supplier's critical dependency could be visible in plain language. Compare sorting or filtering on actual criteria with a weighted score; automatic ranking is an unselected alternative. Avoid making every small purchase pass through a nine-stage procurement lesson.

### TAC Supply Chain Management: Call, response and commitment

**What it is.** A research competition where software agents manage PC assembly, not a commercial game for human players. Six agents seek components and customer orders. A buyer sends one or more requests for quotation, sellers return offers, and accepting one creates an order. Supplier offers depend on capacity and timing; the agents receive offers and delivery notices while simultaneously deciding about other orders and production. The authors describe a strong incentive for very early procurement under the competition's specific rules. [University-hosted paper, sections 2–4](https://web.eecs.umich.edu/~baveja/Papers/dm03evwsks.pdf).

**Mechanism and implication.** The request is an investment in information: it can create several options without immediately buying one. A delayed response can coexist with other work. But when early orders dominate under the price rules, later strategic decisions can disappear. A choice is only interesting if its price, timing and outcome fit the rest of the system.

**Adaptation.** A Call could promise a known response date and a stated kind of potential improvement while the player continues shopping. Hand-author every possible response and trigger; do not assume the competition's generated demand, supplier algorithms, randomness or agent competition are suitable. Show when a Call can no longer return in time. Avoid making it automatically superior to the catalogue.

### Interactive Supply Chain Game: commitments versus forecasts

**What it is.** A Georgia Tech/Intel training simulation. Customers send orders plus changeable forecasts; suppliers have production lead times. The game distinguishes forecasts from real orders and shows each side the forecasts and orders exchanged. A period waits until everyone has acted. [Developers' description in OR/MS Today](https://pubsonline.informs.org/do/10.1287/orms.2011.05.11/full/).

**Mechanism and implication.** The useful choice is when uncertain future demand is worth preparing for. But the turn barrier directly conflicts with our concurrency goal if copied wholesale.

**Adaptation.** A planner could mark a future power need as *possible*, while a Contract is a commitment. Procurement can explore options before the team settles a Task. Whether a forecast should be persisted and which role can edit it remain open: the existing shared-Task and conversation boundary must be respected. Do not introduce supplier-facing forecasts as an assumed rule.

### PC Building Simulator: shopping as problem solving

**What it is.** A computer workshop game with customer jobs and a shop. Developer notes describe seeing a job PC's specifications before arrival, seeing owned quantities while shopping, and viewing component properties such as supported RAM speed. A used market tracks changing prices. [Official game page](https://store.steampowered.com/app/621060/PC_Building_Simulator/); [developer career update](https://store.steampowered.com/news/posts/?appids=621060&enddate=1544009932).

**Mechanism and implication.** Shopping creates a problem of interpretation and compatibility, not just a yes/no purchase. Previous inventory and newly available components change what one might buy. The game also has hands-on work, so this is not evidence that a shopping interface alone will support a complete role.

**Adaptation.** Let the player browse by capability or category, see current supply alongside offers and identify why an item does or does not fit a Task. A recommendation can explain a fit but should not hide other potentially useful items or substitute for the player's discovery.

### Megaquarium: one need leads to a web of connected costs

**What it is.** A management game in which different animals have different care requirements; players hire for skills, research equipment and animals, and pay for the facilities and staff necessary to support them. Its campaign teaches mechanics through levels. [Developer overview](https://www.twicecircled.com/megaquarium/).

**Mechanism and implication.** An appealing new capability is part of a larger package: the player considers what support it needs and whether it fits the existing setup. That yields discovery, but too many obligatory follow-on purchases could become a repetitive checklist.

**Adaptation.** Compare complete ways to start a research project: a laboratory service plus a less-qualified researcher, versus specialist equipment plus a qualified researcher, if those dependencies are authored and other roles own their respective rules. Make indirect costs visible without letting procurement decide science's objectives or planning's feasibility.

### Factorio: automation can remove clerical work while preserving decisions

**What it is.** The developers describe a logistics problem: updating identical requests across many entities required repetitive copy-and-paste, so they introduced reusable logistic groups. Their earlier interface notes discuss communicating request fulfillment and deliveries in progress. [Developer diary on groups](https://www.factorio.com/blog/post/fff-382); [developer interface diary](https://direct.factorio.com/blog/post/fff-289).

**Mechanism and implication.** Re-entering the same information can be work without creating a decision. The meaningful judgment can instead be about what a group needs and how to respond to a shortfall. This is an interface analogy; Factorio's factory logistics and automatic production are not the proposed procurement game.

**Adaptation.** Show a single current need and its covered/promised/missing quantities. If a need changes, highlight which existing Contracts and Allocations are affected. Automate arithmetic and routine record propagation; the player decides whether to keep, repurpose, replace or cancel a commitment. Avoid requiring a player to repair multiple duplicate records manually.

### Mars Horizon and Space Program Manager: agency context

**What they are.** Mars Horizon combines mission planning, hiring contractors with distinct benefits, building rockets and training crew. Its 2021 update describes a recovery mechanic making previously used parts cheaper and faster after a failed mission. [Developer overview](https://www.aurochdigital.com/marshorizonvideogame/); [2021 update](https://www.aurochdigital.com/blog/2021/5/20/mars-horizon-free-update). Buzz Aldrin's Space Program Manager tracks salaries, maintenance, active programs, research staff and reliability; it shows present and projected budget. [Official manual, pp. 27–29 and 40](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/308270/manuals/SPM_manual_EBOOK.pdf?t=1718872658).

**Mechanism and implication.** Contractor identity, prior experience and recurring commitments can make purchasing a strategic agency decision. Mars Horizon's recovery rule is a specific game rule, not proof of a realistic cost model. Its full ownership model is single-player, so it cannot validate our role split.

**Adaptation.** A supplier might offer an authored benefit, like a shorter lead time for a previously used part; or existing Contract quantities might be reusable for a different Task. Consider this only alongside the current authored-content boundary and mission structure. Budget projections may reveal future costs if payment rules are eventually defined.

### C-Negotiation and FloraPark: a warning about depth and pacing

**What they are.** C-Negotiation is an educational construction procurement game whose published abstract describes selecting negotiating parties, scheduling, parallel negotiations, project allocation and cash flow. [Research paper abstract](https://www.sciencedirect.com/science/article/abs/pii/S0926580516304058). FloraPark is a multiplayer educational contract simulation; the published teaching format, with instruction and debriefing, takes 6–9 hours and negotiation consumes much of that time. [2023 paper](https://pubsonline.informs.org/doi/10.1287/ited.2022.0035).

**Mechanism and implication.** Negotiation and allocations can sustain substantial strategic depth; they also can consume the whole session. FloraPark's duration applies to its teaching format, not a measured duration for our game. Our role has other acquisition work and teammates acting in parallel.

**Adaptation.** Treat elaborate negotiation as one optional high-value activity, if selected at all. Routine purchases should have a much shorter interaction. A Call response should not require other roles to stop working.

## Principles for this game

Each principle below is an interpretation to evaluate, not a tested fact or approved rule.

1. **The unit of play is the portfolio.** A good purchase is judged against several present and upcoming needs, not just whether it is cheapest for one Task. A resourceful plan can combine individually unremarkable purchases in a useful way. Sources: PC Building Simulator, Megaquarium, SPM.
2. **Make options actionable and legible.** At decision time show relevant price, fit, need-by date, arrival and known obligations; make uncertainty recognizable. Do not turn a weighted recommendation into an unexplained objective score. Source: Sourcing Lab's scorecard.
3. **Give time a purpose.** Waiting for a Call, delivery or further information should potentially improve a decision or preserve funds, but it can also consume schedule slack. At least one other useful action should remain available; this is a requirement to investigate, not an automatic guarantee. Source: TAC/SCM, contrasted with the Interactive Supply Chain Game's turn barrier.
4. **Make the player's knowledge useful.** Cross-category browsing, finding a compatible alternative, spotting a bulk deal and remembering an available Contract should reveal something that a narrow Task-only shopping list might not. Sources: PC Building Simulator, Sourcing Lab.
5. **Signal commitment and change.** Show the cost and timing of keeping, reallocating, replacing or cancelling before the player chooses. Automatically propagate changed facts; preserve the history needed to understand them. Sources: X-COM's in-transit orders, Factorio's duplicate-request problem. The exact payment and cancellation rules remain open.
6. **Create reasons to talk without forcing permission gates.** Procurement knows price and availability; planning and science can explain what a compromise means in their domains. Other players need enough visible context to make that discussion useful while continuing their own work. Specific visibility and authority rules remain open under Q-031.
7. **Reserve detail for consequential choices.** An ordinary purchase might be a short catalogue action. A costly, uncertain or unusual procurement might justify a Call or richer supplier interaction. Avoid adding friction to every purchase just to keep the station busy. Sources: Sourcing Lab and FloraPark, interpreted in light of the user's accessibility and concurrency requirements.
8. **Present real alternatives without prescribing one answer.** Each option should expose what it does well, what it sacrifices and what is uncertain. A player can reasonably choose a fast expensive route in one situation and a slower inexpensive route in another. Authored options should not contain a universally dominant choice unless it teaches something deliberately.

## Four alternatives for the station

All four retain catalogue purchasing, shared Budget, Calls, contract-only inventory and direct conversation. They are emphasis models that can overlap, not mutually exclusive product packages. No one has selected them or demonstrated they are enjoyable.

### A. Catalogue explorer

**Player fantasy:** “I know what is available and can find a clever fit.”

- **Repeatable actions:** browse categories, inspect properties and in-stock Contracts, compare a candidate against multiple needs, buy or allocate, and pass discoveries to another role.
- **Interesting decisions:** buy a tailored item now; use a versatile item for several needs; wait for a research unlock; substitute an available item if the relevant role accepts the compromise.
- **Information:** broad visible catalogue, capability search, Task criteria, owned/promised quantities and a clear Budget. Allow browsing without preselecting a Task.
- **Conversation:** “This shared lab computer might cover both projects; do its limits work for you?”
- **While waiting:** explore other categories, prepare alternatives, check existing Contracts or serve a different need.
- **Strength:** emphasizes discovery and works naturally with the accepted catalogue direction. **Risk:** a large flat catalogue becomes a spreadsheet; filters may remove discovery, while too little filtering overwhelms. **Open:** how much fit calculation the interface should perform.

### B. Budget and timing portfolio

**Player fantasy:** “I keep the whole program funded and supplied.”

- **Repeatable actions:** build an editable acquisition plan; compare a small set of potential purchases with available funds and known obligations; choose what to sign now; revisit when dates or funding change.
- **Interesting decisions:** lock in the early engine or preserve cash for research; fund two modest needs versus one ambitious one; buy a backup versus hold a reserve.
- **Information:** current Budget and commitments, several simultaneous needs, a timeline with arrival and need-by dates, and explicit estimates for an unsaved plan.
- **Conversation:** “The early engine leaves 14 for surprises; the Call result could leave 21, but we cannot know its offer until next month.”
- **While waiting:** adjust a plan, buy independent supplies, or search a fallback; a draft carries no financial commitment unless the chosen rules say otherwise.
- **Strength:** makes opportunity cost visible across roles. **Risk:** repeated financial bookkeeping or one obvious optimal bundle. **Open:** budgets, payment schedules and forecasts are not selected rules.

### C. Supplier relationships and negotiated opportunities

**Player fantasy:** “I know who can solve the hard problem, and what their terms mean.”

- **Repeatable actions:** browse authored supplier capabilities, choose whether to open a Call, inspect returned Offers and selectively pursue an authored counteroffer or relationship opportunity.
- **Interesting decisions:** pay for a known catalogue option, wait for a focused Call, or accept an alternative with a clear condition. Repeated supplier effects could matter if a campaign and relationship rules are selected.
- **Information:** available suppliers and evidence behind relevant claims, response dates, Offer terms, and any visible conditions or open questions.
- **Conversation:** “A supplier can deliver on time if planning accepts a heavier component; is that viable?”
- **While waiting:** buy other needs or investigate a different supplier, without waiting on a dialogue tree.
- **Strength:** Calls feel distinct from shopping and can yield stories. **Risk:** it steals attention from catalogue play, blurs ownership with external communications, and may become repetitive negotiation. **Open:** who interacts with suppliers, which relationships carry over, and how authored outcomes are selected.

### D. Contract recovery and flexible supply

**Player fantasy:** “When the plan changes, I find a way to keep the mission moving.”

- **Repeatable actions:** review affected Contracts when a need changes, identify unallocated or reusable quantities, compare keeping versus replacing, change Allocations, and cancel where allowed.
- **Interesting decisions:** retain an old component for a second Task, pay a cancellation fee, accept a delay, or use a less ideal delivered resource. A recovered resource can free Budget for something else.
- **Information:** original and current criteria, available quantities, deadlines, Contract terms and a readable before/after preview.
- **Conversation:** “We already have one of these; can your project use it, or does it need the higher specification?”
- **While waiting:** review other Contracts, investigate replacements and continue open needs. Do not invent changes merely to occupy the player.
- **Strength:** makes commitments matter after purchase and matches the revised-need scenarios. **Risk:** constant breakage feels punitive and turns gameplay into cleanup. **Open:** settlement, reallocation, service capacity and reuse rules.

## Common worked situation

This is an invented design fixture, not a proposed mission or balanced content. Month marks are scenario-relative. For arithmetic here only: each purchase commits its full cost immediately; a Call has no fee; assume no cancellation and all named offers are usable if purchased by their delivery date. Actual payment and cancellation rules remain open.

At month 0 the agency has **100** Budget. Planning needs one engine by month 6 with thrust at least 10. Science wants a laboratory unit (**14**, delivers month 2) and a qualified researcher (**12**, available month 1). Planning also needs a power system (**18**, delivers month 3). These are independent catalogue items in this fixture. Planning can decide whether a month-7 engine remains useful; its effect on mission planning is not predetermined here.

| Engine route | Cost | Delivered | What is known at month 0 |
| --- | ---: | --- | --- |
| Catalogue A | 42 | Month 4 | Thrust 10; meets the current need-by date |
| Catalogue B | 30 | Month 7 | Thrust 10; misses the current need-by date |
| Call, authored fixture | Unknown until month 1 | Response in month 1 | The Call tells the player it will return alternatives; actual contents are unknown until then |

If the player buys A, lab, researcher and power, total commitment is **86**, leaving **14**. If planning agrees to the month-7 engine and the player buys B plus the same other items, the total is **74**, leaving **26**. Suppose this fixture's authored Call returns an engine C at month 1 costing **35**, delivering month 6 with thrust 10; buying it plus the other items costs **79**, leaving **21**. The player cannot know C's exact terms before the response, and a real Call need not have this result.

**Trace through the alternatives:**

- **A / explorer:** Buy the researcher and lab. Browse the power category, then discover B and ask planning whether its date is acceptable. The skill is finding and explaining a candidate, not calculating the one best answer.
- **B / portfolio:** Compare the 14 remaining after A to the 26 after B, while planning considers the missed need-by date. Open the Call at month 0 and procure the three independent needs while it is pending. At month 1 compare the now-known C with A and B.
- **C / suppliers:** The player chooses between immediate catalogue security and a Call whose precise response is unknown. On return, they bring any relevant compromise to planning. In this specific fixture C is both cheaper than A and on time; if nothing else distinguishes them after month 1, C dominates A. That is an intentional demonstration of why a plausible Call result can eliminate a choice. It may still have made the *earlier* wait decision meaningful, but the final comparison needs another real, understandable consequence if both options are to remain interesting.
- **D / recovery:** If A was bought at month 0 and planning later changes its requirement, use a separate authored event and defined settlement terms to assess the existing Contract. This fixture deliberately supplies neither new requirement nor fee, so no numerical replacement outcome can be claimed. Explore keeping A for another Task, cancellation or replacement after those facts are specified.

This example shows that even three individually affordable needs can interact with a major purchase. It does not prove every role has work throughout the preparation period or that a Call always yields a feasible or better solution.

## Calls: three alternatives

The vocabulary and basic Call → Offer → Contract relationship are accepted (D-006); these differences are proposed.

| Alternative | Player chooses | Why call instead of immediate catalogue? | Cost / danger | Authoring and concurrency |
| --- | --- | --- | --- | --- |
| **Quick Call** | Select an existing Task and open the Call. | Access an authored response set not currently purchasable. | Wait and possible unsuitable offers. Catalogue remains immediate. | Each relevant Task needs authored eligible responses and a response condition. Player works other needs during the wait. |
| **Targeted Call** | Choose one of a few authored priorities, such as faster delivery or lower cost. | Seek a specific kind of compromise. | Focusing one dimension may worsen another; no guarantee of a better result. | Author responses for each supported priority and eligible situation; unsupported combinations need a clear explanation, not generated results. |
| **Call plus negotiation** | After receiving an Offer, select an authored counteroffer on a consequential term. | Change the final terms or access a distinctive opportunity. | Another delay or rejection; may need a fallback. | Author branches and visible response conditions. Interaction must not suspend the whole station or override communications ownership. |

For all three: show the earliest response date and relevant uncertainty; do not promise a solution when existing constraints make one impossible unless Q-022 chooses such a guarantee. A supplier's responses and timing are authored; how selection or variation among authored responses works remains Q-026. Calls should not be required for every ordinary need.

## Uncertainty and change

These are alternatives to examine under Q-008 and Q-026, not claims that randomness is prohibited or accepted:

1. **Known authored outcome:** the player sees an on-time commitment; an authored event later changes the delivery date. Easy to explain and reproduce; risks feeling scripted if players cannot respond or anticipate vulnerabilities.
2. **Communicated probabilities:** an offer displays a defined chance and consequence, with resolution rules disclosed. Can create risk tradeoffs; demands an agreed meaning for percentages and whether authored outcome selection is allowed.
3. **Bounded unknown:** an offer states a specific range or known risk without a precise probability. Can encourage contingency planning; risks becoming a blind choice if the player cannot understand or influence exposure.

For each, define what the player knows before signing, when they learn of change, what actions remain, and how the history explains the outcome. Do not infer guaranteed recovery or a universal solution from an authored event.

## Proposed evaluation and recommendation

**Recommendation for discussion:** start by comparing A and B as the primary emphasis: A supports the user's catalogue-discovery direction; B makes the team-wide Budget consequences visible. Add selected pieces of D when plans change. Treat C and the choice of Call interaction depth as separate comparisons, not an assumption that every purchase needs negotiation.

Use the same authored fixture for each approach, plus the existing research-and-hardware, funding-change, research-unlock, bulk-allocation and delivery-delay scenarios. A future facilitated exercise should record:

- What did procurement choose or discover, and could the player explain why?
- Could procurement act on an independent need during a Call or delivery wait? Did other roles also have meaningful actions, or did they wait for procurement?
- What actual information prompted conversation, and did the conversation change a decision?
- Could the player distinguish available supply, commitments and uncommitted ideas?
- Were choices meaningfully different after constraints changed, or did a dominant strategy emerge?
- Did the interaction create discovery or repetitive administration? Did anyone need specialist training?
- Did authored Calls cover the supported situations, and what happens when no response fits?

These are proposed observations, not results. A standalone procurement exercise can assess shopping and Budget clarity but cannot prove multiplayer concurrency; that requires players occupying multiple roles at once. Record any actual session using the [playtest template](../docs/playtests/TEMPLATE.md).

## Remaining choices and evidence gaps

- Q-014/Q-031: authority, visibility, direct conversation and independent work across roles.
- Q-023/Q-024/Q-025: Contract life cycle, settlement, availability dates and changing needs.
- Q-026/Q-028: authored Call coverage, response timing and selection; how it differs from shopping.
- Q-008/Q-022: risk semantics, recoverability and whether any solution is guaranteed under budget and time pressure.
- Q-019/Q-020: personnel qualification, assignment and training; no staffing model is selected.
- This is source research and one partial browser inspection. It does not establish sustained fun, appropriate balance or an acceptable session duration.
