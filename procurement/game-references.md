# Procurement game references

Researched November 14, 2026, in response to the user's request for comparable games. These are documented mechanics and proposed design lessons, not accepted rules or playtest results. No games were played for this research. Historical manuals and patch notes establish the described designs; they do not establish the exact behavior of every current release or mod.

**Follow-up:** Subsequent research found a much closer Call comparison and inspected part of a playable sourcing game. See the [research and design alternatives](research-design-alternatives.md); the original conclusions below are retained as the first pass.

## What the comparison needs to explain

The current [gameplay direction](gameplay.md) makes ongoing catalogue acquisition and Budget management across the team's needs central. The [actions](role-actions.md) and [scenarios](scenarios.md) add Calls, commitments, quantity Allocation, changing requirements, delivery, personnel, and spoken negotiation. A useful reference should illuminate one of those activities. A space setting alone is insufficient.

## Recommended study order

| Reference | Most useful question | Matching existing situations |
| --- | --- | --- |
| PC Building Simulator | How does choosing parts for requirements become sustained shopping gameplay? | Catalogue discovery; constrained purchases; several outstanding needs |
| X-COM: UFO Defense (1994) | How do equipment, personnel, delivery and future expenditure share one Budget? | Staff alongside hardware; delivery gaps; reuse and redistribution |
| Megaquarium | How do understandable needs create interesting combinations of purchases? | Research equipment plus personnel; alternative solutions; research unlocks |
| Barotrauma campaign | How do specialist needs become a shared shopping and money discussion? | Competing departments; funding and spending visibility |
| Buzz Aldrin's Space Program Manager | How do reliability investment, staffing and recurring costs affect mission preparation? | Training; hardware risk; research and replacement decisions |
| PULSAR: Lost Colony | What information supports a crew discussing a component replacement? | Useful alternatives; changes after commitment; purchase visibility |
| Dealer's Life 2, optional | Would supplier bargaining deserve a separate activity? | Supplier interaction and deal assessment; only a partial analogy for Calls |

The ordering is an assessment of fit to this prototype, not an empirical ranking of enjoyment.

## 1. PC Building Simulator — shopping to satisfy specifications

**Documented mechanics.** Career mode supplies repair, upgrade and complete-build jobs while the player balances the business's books. The developer's v0.9.2.5 notes document component costs on job PCs, previews of incoming PC specifications, owned quantities in the shop, and maximum supported RAM speed in both inventory and shop. They also describe a used market with prebuilt systems and fluctuating prices.

Sources: [official game description](https://store.steampowered.com/app/621060/PC_Building_Simulator/), [developer career update](https://store.steampowered.com/news/posts/?appids=621060&enddate=1544009932).

**Why study it.** It is a close reference for interpreting a need, finding compatible catalogue entries, assessing a purchase and seeing the completed result. The owned-quantity display is particularly relevant to avoiding a redundant purchase when a delivered Contract could already supply a need.

**Candidate lesson.** Keep requirements, candidate properties, already available quantities and the cost of the proposed purchase within easy reach. Let useful knowledge of the catalogue accumulate across several needs. Review whether browsing still permits discoveries when filters are active.

**Limits.** Its hands-on diagnosis and assembly provide work beyond shopping. This research does not establish that shopping alone sustains an entire multiplayer role. Hardware compatibility depth also needs adaptation for an audience without specialist training.

## 2. X-COM: UFO Defense — a combined equipment and personnel purchasing desk

**Documented mechanics.** The original 1994 game's Purchase/Recruit screen recruits personnel, leases craft and buys items. It shows current funds beside the total proposed purchase cost, with unit prices and quantities. Purchases have delivery times and can be inspected in transit. Transfers move craft, personnel and items between bases for a displayed cost. Recruiting is constrained by living space. See manual sections 4.2.7–4.2.9 and the purchasing tutorial.

Source: [original official manual distributed through Steam](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/7760/manuals/x-com%20ufo%20defense%20manual.pdf?t=1571243544).

**Why study it.** This directly connects the user's hardware-and-personnel catalogue to money, availability and delivery. The distinction between an order and something actually present is useful for the assembly-deadline scenario. Transfers provide an analogy for inspecting existing supply before acquiring more.

**Candidate lesson.** Show a purchase basket's total effect on Budget, and clearly distinguish promised, in transit and usable supply. A staffing purchase should communicate any additional prerequisite that makes the person useful.

**Limits.** Base transfers are not this project's Task Allocations. Its inventory is not a model of contract-only inventory, supplier competition or cancellation terms. This entry refers to the 1994 game, rather than the differently structured 2012 XCOM.

## 3. Megaquarium — buying a capability includes its supporting needs

**Documented mechanics.** Animals have different care requirements. The developer describes hiring for skills and future potential, choosing specialists or generalists, researching livestock and equipment, and considering extra staff, food and tank expenditure before acquiring an attractive animal. The campaign introduces features across levels with distinct conditions and objectives.

Source: [Twice Circled's official description, base-game sections](https://www.twicecircled.com/megaquarium/).

**Why study it.** This fits the research-equipment-and-staff scenario and the requirement for accessible complexity. A purchase can be appealing while making other purchases or staffing commitments necessary. It also provides a reference for research changing the available options.

**Candidate lesson.** Let a resource communicate its supporting needs in ordinary language: a useful instrument might also require a testing service or qualified staff, if those dependencies are authored for the scenario. Present the combined cost so catalogue exploration can reveal an alternative package.

**Limits.** The player also controls layout and operations. In this prototype, procurement should discuss consequences with the role that owns them; the comparison does not move mission feasibility or research management into procurement. Optional sandbox randomization is not a proposal for this project's authored-content baseline.

## 4. Barotrauma — specialist supplies and shared spending

**Documented mechanics.** The developer's April 2022 Urban Expanses changes split stores into vendors and added categories including medical, diving, weapons and fuel. Crew received personal wallets funded from mission rewards or shared funds. The April 28 patch documented visible wallet/bank balances and permission-controlled spending directly from the bank.

Source: [official update archive, April 20 and April 28, 2022 entries](https://store.steampowered.com/news/posts/?appids=602960&enddate=1664550482&feed=steam_community_announcements).

**Why study it.** Categorized supplies provide a concrete comparison for multiple specialists wanting different things from a common pool of money. Its distinction between personal and shared funds is a useful question about spending authority, rather than a model already chosen here.

**Candidate lesson.** Inspect how a shopping discussion makes different needs comparable and how the interface exposes whose money a purchase consumes. For our prototype, explore whether teammates can point out an option while procurement retains its intended acquisition work.

**Limits.** The cited design distributes buying to the crew. It does not establish a dedicated procurement station or prove that buying can keep that station continuously active. Copying its distribution of buying authority could change the role being designed.

## 5. Buzz Aldrin's Space Program Manager — commitment beyond the purchase price

**Documented mechanics.** Funding pays for salaries, programs, buildings, maintenance and training. Fixed costs recur each season. Skilled science/engineering personnel can improve component reliability through R&D; improvement beyond the R&D ceiling requires successful mission use. The Public Affairs Office displays funds, expenses and a projection for the next cycle. See manual sections Funds, Fixed Costs, Reliability and R&D, and Public Affairs Office.

Source: [official game manual](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/308270/manuals/SPM_manual_EBOOK.pdf?t=1718872658).

**Why study it.** This is the strongest thematic comparison here for deciding how much preparation to fund before committing to a mission. It links staffing, time, reliability and ongoing expenditure.

**Candidate lesson.** Compare the affordability of signing now with the remaining funds after known obligations. Discuss whether buying a more mature component or supporting further research creates a better path for the team. Reliability and payment rules remain open in this project.

**Limits.** Its player manages the agency as a whole. Research work, program selection and launch decisions need separate owners in our multiplayer design. Seasonal turns and its event system are not selected for this prototype.

## 6. PULSAR: Lost Colony — discussing component replacements

**Documented mechanics.** Beta 27's developer notes describe captain-controlled crew purchase limits, ship-component installation through the store's Compare/swap option, and captain notifications when crew buy or sell components. These are historical documented features from January 2020.

Source: [official developer patch archive, Beta 27 entry](https://store.steampowered.com/news/posts/?appgroupname=PULSAR%3A+Lost+Colony&appids=252870&enddate=1589064317&feed=steam_community_announcements).

**Why study it.** The comparison-and-swap interaction is relevant when research reveals an alternative or a new need makes an old acquisition unsuitable. Notifications offer a concrete reference for keeping the rest of the team aware of a spending decision.

**Candidate lesson.** A replacement preview could put the current commitment beside the alternative and expose effects on cost, timing and supplied needs. Procurement and planning could then discuss the actual change.

**Limits.** The sources do not establish contract cancellation settlements or a dedicated procurement role. Our replacement preview would need to include contractual obligations beyond the component comparison documented here.

## 7. Dealer's Life 2 — a narrow reference for negotiation

**Documented mechanics.** The developer describes buying and selling through negotiation, reading customers, counterfeit risk, hiring employees and auctions.

Source: [official game description](https://store.steampowered.com/app/1343670/Dealers_Life_2/).

**Why study it.** It offers an example of making the exchange with a seller an activity. It could inform a discussion of whether supplier personalities or authored negotiation choices add anything beyond selecting an Offer.

**Candidate lesson.** If supplier negotiation is explored, give it readable consequences and a reason to stop or walk away. It would need to leave time for catalogue and Budget work across the team.

**Limits.** Haggling and auctions are not the same as a Call inviting Offers against criteria. This research found no verified close equivalent for the complete Call → Offers → Contract loop. Negotiation is an optional proposal, with ownership relative to communications unresolved; it is not added to the current action set.

## Questions to take into a focused observation

These are proposed observation prompts; no observation has happened yet.

1. **PC Building Simulator:** Can we understand why a part fits, compare alternatives and notice existing stock without remembering several screens?
2. **X-COM:** Can we distinguish something affordable now from something available in time, including personnel?
3. **Megaquarium:** When does buying one thing reveal an interesting combination of supporting purchases, and when does that become repetitive upkeep?
4. **Barotrauma/PULSAR:** What facts must be visible for a useful spoken shopping discussion, and who actually has work while that discussion happens?
5. **Space Program Manager:** Can we explain future financial obligations and the value of additional preparation before committing?

The first three are the recommended starting set for acquisition gameplay. The multiplayer references should be studied separately for communication and visibility. None establishes that this prototype's concurrency requirement has been satisfied.

Related: I-046 in the [idea register](../docs/ideas.md). No accepted decision was changed by this research.
