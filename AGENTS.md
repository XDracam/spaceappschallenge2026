# Project instructions

## Scope and evidence

- This project is in the prototype phase. Read `docs/README.md`, `docs/concept.md`, `docs/decisions.md`, and `docs/questions.md` before design or implementation work.
- Preserve the user's original notes in `docs/notes/`. Add dated notes for later input; do not silently rewrite historical notes.
- Distinguish user direction, official challenge guidance, proposed mechanics, accepted decisions, and observed results. Verify external claims against their source and record the date.
- Do not present an unselected proposal as an agreed rule. If information is missing, record the specific uncertainty and resolve it before dependent implementation.
- The mission flow, including the earlier one-shot simulation idea, is brainstorming rather than a hard rule. Preserve it and investigate how it might fit real-time play and a campaign.
- The user emphasized a key design requirement: give all roles meaningful things to do concurrently, without a role simply waiting on another. Focus initial design thinking on multiplayer; fewer-player play is for later exploration.
- External communications may include political, industry, and public relations. These role splits are ideas. Distinguish them from spacecraft telemetry and data transmission.
- The user set an authored-content baseline: no runtime dynamic generation; hand-craft missions, part lists, possible events, and similar content. The boundary between authored content and runtime selection or state changes remains open. See D-005.
- Treat global tasks, guaranteed solutions, contract-only procurement, personnel alternatives, and the role mechanics as brainstorming; retain unresolved tensions instead of silently choosing rules.

## Persistent documentation

- Capture all substantive ideas in `docs/ideas.md`; keep rejected and deferred ideas with their rationale.
- Use stable `I-###`, `D-###`, and `Q-###` identifiers. Never reuse them.
- Update the decision log and affected design documents together when a choice is accepted. Preserve superseded decisions and link replacements.
- Keep `docs/README.md` navigable when adding documents. Use relative links within the repository.
- Log prototype observations in dated files under `docs/playtests/`, using the template. Do not claim a playtest or implementation check happened unless it did.

## Implementation

- Mission planning and the separate procurement prototype select web, TypeScript and HTML canvas. The planner uses Preact for panels. See D-009 for procurement. D-012 sets four separate player stations with no switching or sharing during game time. How stations connect and the project license remain open. Establish relevant unresolved choices before scaffolding their dependencies.
- Keep implementation proportional to the prototype question in `docs/prototype.md`.
- Preserve existing work. Do not commit or push unless requested.
- Check the actual changes and relevant behavior before handoff; report what was verified and any remaining limitations. Do not add or run tests unless the user asks.

## UI design workflow

- For game UI design and refinement, use the installed `impeccable` skill when applicable. Preserve the existing planner visual language for procurement under D-013. Ground work in the project documents, the actual station and the requested player flow.
- For UI implementation review, use `web-design-guidelines` when applicable. Apply its web rules to the game context rather than assuming every navigation or mobile convention fits a Full HD station. Inspect canvas interactions separately; a DOM review cannot establish canvas accessibility.
- Keep direct player conversation and meaningful concurrent activity central. Do not treat an agent critique as evidence of multiplayer enjoyment or the absence of waiting. See [UI agent skills research](docs/ui-agent-skills-research.md) and D-014.
