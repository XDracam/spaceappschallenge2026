# Agent UI design skills — 2026-11-14

## Scope and evidence

User request: research common, state-of-the-art UI design skills that help agents and recommend which to use for this game's UI.

This is a source-reviewed shortlist, not a controlled comparison of generated UIs. Repository popularity and authors' examples do not prove better outcomes. At the time of the research no skills were installed, executed, or benchmarked. The user subsequently accepted the two primary recommendations in [D-014](decisions.md#d-014--ui-design-and-review-skills); the other recommendations remain optional.

Reviewed upstream skill instructions and repository documentation on November 14, 2026. Sources track their current default branches and may change.

## Recommendation

Use **Impeccable as the main design iteration toolkit**, with **Vercel Web Design Guidelines as a separate implementation review** (D-014). Keep **Anthropic frontend-design** as an alternative for exploring a replacement visual identity. Use **UI UX Pro Max** selectively for reference searches rather than letting its defaults determine the game's layout. The latter two remain optional, not installed as part of D-014.

| Candidate | Verified capability | Proposed use here | Limitation |
| --- | --- | --- | --- |
| Impeccable | Named playbooks for UX planning, critique, audit, clarity, onboarding, typography, layout, hardening and polish; distinguishes task operation from presentation. | Iterate on one station or flow at a time; prioritize hierarchy, readable choices, consequence feedback and first-use understanding. | Broad web/native toolkit, not a multiplayer game design method. Its checks cannot establish enjoyable coordination or meaningful concurrent activity. |
| Anthropic frontend-design | Guidance for deliberate subject-specific visual identity, typography, layout, restrained motion and critique against the brief. | Explore visibly different art directions with real catalogue content and actual mission-planning controls. | Contains web-page and hero guidance that needs filtering for a persistent game workspace. Consider it an alternative creative lead rather than loading two competing visual leads for the same task. |
| Vercel web-design-guidelines | Code review against fetched Web Interface Guidelines, including semantics, focus, forms, motion, content overflow and interaction alternatives. | Review HTML/Preact panels, catalogue browsing, confirmations and editable values. | DOM code review does not establish accessibility of canvas interactions. URL synchronization and web navigation recommendations require case-by-case applicability to a station. |
| UI UX Pro Max | Searchable design references for styles, palettes, typography, UX, charts and implementation stacks; design-system persistence. | Look up specific concerns such as compact comparisons, readable numerical data, focus management and motion. | The inspected skill defaults include mobile-first layout, and its stack list does not include Preact. Adapt general web guidance; do not treat React/Next instructions as a verified Preact match. |

## Application to this game

Ground each design request in D-004, D-007, D-009–D-013 and the visual exploration notes:

- Four separate occupied stations; a player remains at their station during game time.
- Meaningful independent work while teammates are acting; preserve direct spoken coordination.
- A game understandable without training, with catalogue procurement and Budget trade-offs across competing needs.
- Full HD or larger procurement workspace; Preact panels and canvas map in the planner, with web/TypeScript/canvas procurement baseline.
- D-013 now selects applying the mission planner visual language to procurement. Preserve that direction for refinement: dark glass, cyan accents and planner typography. The earlier restrained 1970s mission-control mockup was rejected; the vibrant illustrated alternative remains unselected. This newer direction appeared in the shared checkout during this research; see the [source note](notes/2026-11-14-procurement-planner-style.md).

Proposed workflow:

1. Give the design agent a short project brief linked to the owning design documents. Include the current screenshot, real content, the target flow and viewport. Avoid duplicated context files becoming a conflicting source of rules.
2. Use Impeccable's UX planning and critique for a concrete flow: e.g. inspect two catalogue candidates, understand competing needs, commit an acquisition and recognize the Budget consequence. Examine preserved context and available work when another role is busy. Do not invent unresolved game rules to make the flow easier to draw.
3. Refine the planner-derived visual identity under D-013. If the user later requests a new identity, compare alternatives using the same populated screen and content. Use either Impeccable or Anthropic frontend-design as the creative lead for that pass.
4. Record selected tokens and shared component states for consistency across stations. A proposed minimum is typography, spacing, surface hierarchy, role accents, semantic status colors, buttons, selection, focus, warnings and change notices. Role color and urgency color should have distinct jobs; text or shape should also communicate status.
5. Review HTML/Preact with Vercel's guidelines. Separately inspect canvas controls for operability, focus and alternatives; passing a DOM review is insufficient evidence for the map.
6. When implementation review is requested, inspect the rendered screen at the intended viewport and walk through concrete state changes. Record observed behavior and limitations. Agent critique alone cannot demonstrate multiplayer enjoyment or the absence of idle time.

Start with `shape`, `critique`, `clarify`, `typeset`, `layout`, `harden`, and `polish`. Use motion to communicate selection, arrival, changed constraints and commitment consequences. Treat decorative effects as a later choice.

## Sources inspected

- [Impeccable skill](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md) and [README](https://github.com/pbakaus/impeccable/blob/main/README.md).
- [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md).
- [Vercel web-design-guidelines skill](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md) and [underlying review rules](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md).
- [UI UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md).

Related: I-059, [visual exploration](notes/2026-11-14-visual-aesthetic.md), [decisions](decisions.md), [procurement UI flow research](../procurement/ui-flow-research.md).
