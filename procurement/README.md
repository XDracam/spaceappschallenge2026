# Procurement prototype — working sketch

**Status:** brainstorming and assistant proposal, November 14, 2026. The vocabulary is selected in [D-006](../docs/decisions.md#d-006--procurement-terminology). Gameplay and implementation details remain proposals. The user's direction is to explore their procurement role in this separate directory, with no shared base yet and integration later. See the [source note](../docs/notes/2026-11-14-procurement-prototype.md).

The proposed entity vocabulary and message payloads are recorded in the [interface draft](interfaces.md).

Concrete [gameplay scenarios](scenarios.md) provide examples for walking through the proposed model.

The proposed [role actions](role-actions.md) map player choices to procurement-facing changes.

The proposed [Task and conversation boundary](tasks-and-conversation.md) distinguishes persistent goals from the coordination players do by talking.

## The pitch

You are the space agency's procurement lead. Other departments tell you what they need and when; your job is to assemble a workable set of commitments before the mission's preparation deadline. You compare imperfect offers, manage contracts when circumstances change, and negotiate tradeoffs with the rest of the team.

**Question to explore:** Is it fun to turn changing mission needs into a portfolio of procurement commitments under pressure, and to explain the tradeoffs to other players?

The emphasis is on decisions and communication: buying the cheapest item is not always best, and spending more on one need can constrain another. This is a proposed experience, not yet supported by a playtest.

## Boundaries

- **User direction:** develop the procurement slice separately in `procurement/`, with no shared base yet; integrate eventually. Begin with an idea, boundaries, gameplay, and requirements.
- **Existing project direction:** initial multiplayer focus; meaningful concurrent work for every role; hand-crafted missions, lists, events and similar content, with no runtime dynamic generation. See [D-004 and D-005](../docs/decisions.md).
- **Prototype proposal:** one procurement player, a small authored scenario, and simulated inputs representing other roles. These inputs are stand-ins, not proof that multiplayer communication works.
- **Out of the first experiment:** real multiplayer networking, the other roles' interfaces, realistic orbital simulation, campaign progression, and a complete personnel system. These are scope proposals, not project-wide exclusions.
- **Still open:** prototype format and technology, actual player count, timing, how Calls work, personnel, and how the future shared system integrates. No implementation is implied by this sketch.

## Proposed loop

1. **Understand needs.** Review several requests with a purpose, constraints, need-by date and priority. Ask what can change if no offer fits. A request is a proposed local stand-in for the wider game's shared tasks.
2. **Explore options.** Compare authored catalogue offers for capability, price, delivery, reliability and cancellation terms. Where no offer fits, explore an authored Call and compare its offers; whether and when they become available remains a design question.
3. **Commit.** Choose an offer, check the impact on the remaining budget and schedule, and create a contract linked to the request. A commitment should expose what it promises and what it costs to change.
4. **Manage change.** A request or an outside condition changes. Inspect affected commitments, then keep, replace or cancel them, and communicate the consequences. Other requests and available work remain accessible while a delivery or Call is pending.
5. **Review.** At the end of the exercise, show what each request received, late or unmet needs, spending, risk exposure and contract history. This is a procurement debrief, not a claim that mission success is already defined.

A real-time clock is worth exploring, but its speed, pausing and the way an authored event is triggered are open. A scripted exercise can stand in for real time until that question is answered.

## Illustrative scenario

The following fictional numbers are only a conversation starter; they are not balanced or researched mission specifications. Currency is in arbitrary budget units, and all dates are preparation days.

- Starting budget: **100**. Two independent needs exist at the start.
- Planning needs an engine with thrust of at least **10 units**, delivered by day **8**. Science needs a sensor delivered by day **10**.
- Engine A: thrust 10, cost 45, delivery day 6, reliability 90%, cancellation cost 10. Engine B: thrust 12, cost 30, delivery day 8, reliability 70%, cancellation cost 5.
- Sensor A: cost 45, delivery day 8, reliability 90%, cancellation cost 10. Sensor B: cost 25, delivery day 7, reliability 70%, cancellation cost 5.
- The two reliable offers total 90; choosing cheaper options leaves more budget but adds risk. Reliability percentages are illustrative communicated attributes; how risk resolves is open.
- After an engine contract is signed, an authored planning update raises the thrust requirement to **12**, retaining the same date. If Engine A was selected, the player can assess cancellation and Engine B or ask planning to revisit the requirement. If Engine B was selected, it already meets the revised thrust. An alternative or Call might be possible, but its terms must be authored; this scenario does not guarantee a feasible replacement after every previous choice.
- An authored communications update could offer more funding or affect a supplier, but its exact effect and trigger are open. Discuss its consequences with the team rather than assume a response.

In an initial solo exercise, a facilitator or authored prompts can represent planning and science. To investigate the multiplayer goal later, have other people make the requests and negotiate changes while each has their own meaningful work. A single-role exercise cannot establish that all roles stay active.

## Candidate requirements for a first experiment

These describe what the proposed experiment would need, not accepted product requirements:

- Show multiple requests, their constraints and deadlines, and any changes with a clear origin.
- Show available authored offers side by side, including fit, cost, delivery, reliability and cancellation terms. Explain why an offer fails a constraint.
- Track available budget, commitments, expected delivery, and the request each contract addresses. Make the accounting rules explicit, including whether cancellation fees add to prior spending or replace it.
- Preserve a visible record of active, fulfilled, cancelled and replaced contracts, and distinguish a contract from the item or service it concerns. Exact semantics remain open.
- Make changing a request or contract reveal the consequences and which needs are affected; allow the player to communicate a proposed tradeoff to the requester.
- Keep another actionable need or useful contract review available during a pending delivery or offer, to explore D-004 rather than promise it is solved.
- Use authored content for the scenario and offers. Do not infer that selection, authored state changes, or player-created requests are forbidden; their boundary remains open under Q-026.
- End with a readable summary of choices and consequences. Do not conflate this with the game's still-undecided final mission simulation.

## What to observe

- Can the player explain why they chose an offer and what they gave up?
- Do changes create interesting recovery decisions or just repetitive rework?
- Can the player tell what is committed, cancelled, due, late, and affected by a changed request?
- Is there useful work while something is pending, and does communicating with another player lead to meaningful decisions?
- Do the catalogue and Call feel different enough to justify both? Can the exercise distinguish an unavailable solution from one the team cannot afford or receive in time?

Capture actual observations using the [playtest template](../docs/playtests/TEMPLATE.md). No exercise has been run.

## Questions before building

1. What format and technology should this standalone prototype use, and who will play it? ([Q-012](../docs/questions.md#q-012--platform-and-technology))
2. Should the first exercise be real time, paused, or facilitated; how are stand-in inputs presented? ([Q-016](../docs/questions.md#q-016--real-time-difficulty-and-switching))
3. What decisions make Calls distinct from catalogue purchases without generated content? ([Q-026](../docs/questions.md#q-026--authored-content-boundary), [Q-028](../docs/questions.md#q-028--catalogue-calls-and-contracts))
4. How do contracts, payments, cancellation, discarded items, and need-by dates actually work? ([Q-023](../docs/questions.md#q-023--contract-inventory-and-discarded-things), [Q-024](../docs/questions.md#q-024--need-dates-and-assembly))
5. How much personnel procurement belongs in this first slice, before a shared personnel model exists? ([Q-019](../docs/questions.md#q-019--personnel-model), [Q-020](../docs/questions.md#q-020--personnel-management-across-roles))
6. What guarantee of a solution is intended after funds, deadlines, and constraints change? ([Q-022](../docs/questions.md#q-022--guaranteeing-task-solutions))
