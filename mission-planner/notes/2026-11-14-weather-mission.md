# Simpler example mission — November 14, 2026

Source: user messages in a Claude Code session after a short playtest of the integrated game.

> comms is great so far.
>
> mission planning is too complicated still
> short playtest showed that it doesnt make much sense as is right now
> how could we simplify it visually or substantiually?

After the assistant listed sources of complexity and three simplification levels (visual only; templates + tiers; planner as architect only), the user answered:

> 1. the ui mainly id say. also our example mission is quite complex.
>
> lets change the example to smthn super simple: just getting a weather satellite into orbit

Follow-up questions (multiple choice):

- Which orbit? → "Geostationary (Recommended)" (launch to low orbit, then one orbit raise)
- What happens to the Mars orbiter + lander mission? → "Keep as 2nd, harder mission (Recommended)" (host picks the mission in the lobby; weather is the default; Mars keeps its comms events, weather gets its own smaller set)
- Do the planner UI simplification now as a guided flow (checklist: Route → Spacecraft → Rocket → Order parts)? →
  > guided flow is a bad idea since adjustments will probably be necessary out of order during gameplay

Decision recorded: a non-linear UI is required — players must be able to change any part of the plan in any order.

## Rocket panel feedback

> i think the main issue is that the right bar has so much more stuff than the sliders
> like theres so many things there which cannot be interacted with and dont help in any way

The assistant proposed a sliders-first panel (all sliders visible, one Δv line, one problem line with a fix button, status dots, short group names, an Advanced switch for expert controls). The user answered: "Build it".

## Follow-up — November 15, 2026 (optional objectives)

User message, verbatim: "can you rework the first mission, the space satellite to include optional objectives, which give bonus points and where full completion can be solved "just so" by the budget?"

Interpretation (assistant): "the first mission, the space satellite" is the weather satellite (the first mission in this note). An optional objective is a goal that is not needed for the mission to count as complete, never blocks the launch, and earns bonus points. "Just so by the budget" means the budget is sized so that a careful plan can afford all four goals, while the two main goals alone leave most of the budget unspent. All content is hand-authored placeholder (D-005). Implemented as D-030.

