# In-game style audit — November 15, 2026

## Recommendation

Bring the stations into the title screen's visual family through typography, surface treatment and control styling. Keep their current information architecture and working geometry. Science needs the most attention; Planner, Procurement and Communications already use Exo 2 and Inter and mainly need a quieter finish.

These are proposals, not approved implementation changes. The pre-game work was committed as `abca70f`, integrated with current remote gameplay in `d43a2ef`, and pushed to `origin/main` before this audit. No station styling was changed during the audit.

## Actual browser coverage

Inspected the running local app at **1920×1080**, using a disposable Weather mission on `localhost:5173`. This was a browser walkthrough, not just a source review or generated mockup. The separate existing save on `127.0.0.1` was not replaced.

- Planner: opening briefing, rocket controls, route continuation, adding launch to the plan, ordering nine parts, Goals/Issues/Δv cards and the shared confirmation.
- Procurement: nine published needs, focused engine catalogue, need-to-offer comparison, selected supplier/delivery quote, order review/confirmation and a populated contract timeline. Purchased one simulated engine to inspect the actual contract view.
- Science: mission-driven research routes, graph states, selected Larger sensor arrays details and starting that research; observed the resulting Lab entry, running node, disabled start action and changed shared budget.
- Communications: opening briefing, quiet inbox, project-selection dialog, then the actual first authored timeline message, its three responses and displayed consequences. Advanced the calendar briefly to receive the message, then paused it again. Did not submit a response.
- Shared shell: station switching, pause control and the populated Tasks drawer with current-role filtering and linked work.

The disposable room was closed afterward. Reference screenshots were captured in `/tmp/nasa-style-audit/` (`planner.jpg`, `procurement.jpg`, `science.jpg`, `comms.jpg`, `tasks.jpg`, `contracts.jpg`).

**Limits:** this pass did not replay Mars, fly a mission, inspect every result/recovery screen or validate four-player usability. Full HD is the audited gameplay size; this is not a mobile gameplay redesign. TypeScript and the production build passed after remote integration. The Vite bundle-size warning remains. Fetching the external Web Interface Guidelines failed at DNS resolution, so this report does not claim a completed check against that remote checklist.

## What to carry over

The title screen's strengths are its confident lettering, clear hierarchy, dark blue field, pale-cyan primary action and generous separation between different jobs. In a working station, translate those strengths into **compact, clear controls**, not title-sized headings or large decorative empty areas.

Suggested common visual values: background `#040a10`, solid working surface around `#0c1722`, text `#f0f5f6`, supporting text `#a4bdcc`, separator `#344955`, primary fill `#b9edff`, primary text `#081b28`. Use 3–4px corners for rectangular controls and roughly 6px for working panels. Keep circular avatars, slider thumbs, timeline points and status dots circular.

Extract these few values into a small shared CSS token file and map the existing station variables onto them. Keep current components and station styles; no component-library rewrite is needed. Preserve semantic green/amber/red and the existing category/stakeholder colors.

## Specific changes, in recommended order

### 1. Unify the primary actions and selection states

**Where:** Planner `ui/styles.css` controls section (`.btn`, `.pill`, `.round-btn`); Procurement `procurement.css` (`.pr-btn`, `.pr-nav`, selected catalogue/offer states); Comms `ui/styles.css` (`.pill`, `.btn`); Science `ui/styles.css` (`.sc-btn`); shell `shell.css` (`.shell-btn`) and `tasks.css`.

**Observed:** ordinary tabs and actions share neon outlines/halos, while Science's Start research is a different saturated blue. Order review, project Start and briefing buttons look like the old opening screen.

**Change:** give genuine primary actions the launch-page pale fill and dark text. Keep secondary actions dark with a fine border. Use a crisp outline/tinted surface for selection and a distinct focus outline for keyboard use. Remove persistent decorative glows. Preserve brief, purposeful arrival attention for new Comms messages.

**Guardrail:** split grouped selectors such as Comms `.pill.primary, .btn.active` and Planner `.pill.primary, ... .btn.active` before changing them. A selected tab is not a commit action. Do not make every project Start, every catalogue selection or every task action a bright filled button. Keep destructive actions visibly destructive, disabled actions clear, and existing button heights/hit areas intact.

### 2. Give Science the same typography and base palette

**Where:** `game/src/stations/science/ui/styles.css`: `.sc-app`, `.sc-head h1`, side-panel `h2/h3`, `.sc-card`, `.sc-btn`, `.sc-node` state rules. Keep geometry in `model/tree.ts` and inline positions in `ui/App.tsx` unchanged.

**Observed:** the station has a 16px system-font heading, 13px/12px sidebar/detail headings, gray-purple cards and a bright blue action. It reads like a separate utility. Long node names already truncate, including Staged combustion upgrade and Lightweight deployable panels.

**Change:** use Inter for ordinary text and Exo 2 for the station title, selected-tech title and section headings. Set the station title around 22px, selected-tech title 20–22px and sidebar sections 15–16px. Match the dark blue surfaces, dividers and pale primary action. Bring its header padding into the same family as the other stations while leaving its essential information visible.

**Guardrail:** graph nodes are explicitly **178×54px**. Do not apply 18px headings, extra padding or larger nodes globally. Keep graph label size and layout initially; show the full selected name in the details pane. Preserve category colors, researched/running/blocked/unknown states, goal markers, selected-node outline and connector visibility. The category stripe is semantic, not decoration to remove blindly. Do not add Earth imagery behind the graph.

### 3. Quiet the three glass-heavy stations

**Where:** Planner `.glass/.popup/.modal/.playback` at `ui/styles.css:78`; Procurement `.pr-panel` at `procurement.css:55` and resource/offer cards; Comms `.glass` at `ui/styles.css:80`, conversation choices and project cards.

**Observed:** broad gradients, 16–18px rounded outer panels, inset highlights and blurred translucent layers dominate the screens. Procurement's header, selected category, selected resource and action can all glow at once.

**Change:** use darker, more opaque working surfaces, 1px separators, smaller corners and much less shadow. Remove the bright panel-top sheen. Give dialogs a solid surface and a restrained backdrop. Keep enough contrast between selected and unselected work.

**Guardrail:** retain controlled translucency where the Planner's map genuinely sits behind a panel; flattening it to complete opacity everywhere could obscure spatial context. Keep card dimensions, scroll containers and pane widths stable. Do not replace working grids with sparse launch-page menus.

### 4. Make station headers feel related

**Where:** Planner `.wordmark` at `ui/styles.css:190` and `TopBar.tsx`; Procurement `.pr-brand` at `procurement.css:70` and its header component; Comms `.wordmark` at `ui/styles.css:141` and `Header.tsx`; Science `.sc-head`.

**Observed:** Planner and Comms use widely tracked 19px labels (`.32em`), Procurement uses `.18em` plus a glowing orbit mark, and Science uses a plain system heading. The launch pages use much tighter, stronger lettering.

**Change:** use one compact Exo 2 station-heading treatment around 22px, 600–700 weight and near-zero tracking; remove text halos. Reuse the existing four role icons with their role colors beside the headings, rather than adding another decorative logo system.

**Guardrail:** retain each station's budget/calendar/launch information and its current position. The Planner's title is also a briefing trigger; preserve that action. Keep large 48–96px lettering on the title/setup pages, not the working dashboards.

### 5. Keep Procurement's useful density

**Where:** `procurement.css`: `.pr-work`, `.pr-panel`, `.pr-nav`, resource cards, `.pr-ctx-*`, `.pr-dialog` and `.pr-timeline-*`.

**Observed:** the three-pane flow supports simultaneous need, catalogue and quote comparison. The timeline clearly distinguishes arrival from need, with a visible 30-day margin for the inspected contract. These are assets to retain.

**Change:** apply the common surface/control treatment; make the active need, selected resource and current quote use the same selection language. Keep price, delivery, reliability and budget-after figures in their current readable positions. Simplify purely decorative borders around nested quote/offer areas where the grouping remains clear.

**Guardrail:** no larger catalogue cards, dramatic whitespace or fewer visible columns just to imitate the opening page. Preserve Priority/Standard comparison, cost consequences, cancellation terms, arrival/needed/proposed markers and late/early colors. The timeline's circles and bars encode data; a blanket radius or color reset would damage it.

### 6. Restyle Comms without flattening its decisions

**Where:** `comms/ui/styles.css`: `.trustbar`, avatar rules, conversation/response rules and `.modal*`; `Conversation.tsx`, `Projects.tsx`, `Overlays.tsx` only if markup changes are necessary.

**Observed:** the message itself has a useful readable measure; responses show both benefits and costs, and the project dialog compares immediate versus delayed effects. Those relationships are more important than decorative consistency. The glowing portrait rings, capsule metadata and repeated glowing Start buttons contribute most of the old look.

**Change:** remove avatar halos; use simpler response surfaces, quieter metadata and the shared action style. Use the same compact heading conventions in briefings/project dialogs. Keep stakeholder colors and the strong difference between a response, its effects and its deadline.

**Guardrail:** preserve the message/inbox/projects layout, visible answer deadline, all effect chips, project costs, duration, slot limits and Now/When done grouping. Do not shorten gameplay consequences just to force one line. Preserve the arrival cue that helps a busy player notice a message.

### 7. Finish shared UI and protect the Planner

**Where:** `shell.css` confirmation, switcher and result rules; `tasks.css`; Planner panel headings, popups and bottom cards.

**Observed:** the Tasks heading already uses Exo 2 at 22px and its separated list rows are relatively close to the new direction. Its buttons, switcher and common confirmations still inherit the older shell controls. Planner's dense Rocket pane and bottom cards serve ongoing work, unlike a launch page.

**Change:** update shared surface/button tokens first so these pieces stop changing style between lobby and station. Match the dialogs' padding and heading treatment. Leave the Tasks structure and current 660px maximum drawer width alone for the initial pass. In Planner, tighten heading tracking and quiet the panel chrome around the existing map and sliders.

**Guardrail:** retain Tasks' role filter, Schedule/Mission overview views, linked navigation, scroll position and keyboard close/focus behavior. Keep Planner's 340px rocket pane, canvas coordinates, route hit areas, research-limit ticks, units and bottom-card geometry. Weather now has four goals; the Goals list already scrolls (`.goal-list`, `ui/styles.css:575`). Do not spend that limited height on larger headings or decorative spacing. Treat any canvas restyling as a separate follow-up requiring visual and interaction checks.

## Smallest useful implementation packet

1. Common palette/surface/control tokens and shared shell treatment.
2. Science header, sidebar/details typography, surfaces and primary button, with graph geometry held fixed.
3. Planner/Procurement/Comms header lettering and panel finish; selected states remain separate from primary actions.

Stop there and compare the same working states at Full HD before considering layout changes. The initial pass should change **no simulation, balance, navigation model, column widths, graph layout, timeline scale or canvas behavior**.

For verification, revisit the populated Procurement need/quote/contract sequence, all four Science node states plus selected/in-progress goal nodes, Comms message effects and project choices, shared Tasks navigation, and Planner sliders/route popups with all four Weather goals. Check 1920×1080 first, then 1440×900 for wrapping and lost visible rows. A single operator audit cannot establish multiplayer enjoyment or concurrent workload quality.

## CSS-only implementation follow-up

The user approved the restrained pass and explicitly required styling only, with no added product text. Implemented under D-033 in `game/src/shell/station-theme.css`, imported by `shell.css`. This pass edits only those two game CSS files: no markup, labels, behavior, station geometry or authored content was changed. The shared theme keeps semantic state colors and circular data marks while matching the title pages' typography, dark blue surfaces and pale-cyan primary actions.

Observed in the running browser:

- All four stations inspected at 1920×1080 and 1440×900. Planner's route popup, sliders, bottom cards and scrollable four-goal list remained present; the Goals list retained `overflow-y: auto`.
- Science nodes remained 178×54px at both sizes. Sidebar widths remained 250px and 290px. Exo 2 node labels fit Staged combustion upgrade and High-pressure turbopumps without the additional truncation first seen with Inter. Selected, researched, running, unknown and unavailable node states remained distinguishable. Selected-tech details and Start research retained the original content.
- Procurement's side panes remained 272px and 336px. The catalogue retained five columns at Full HD and three at 1440px. Existing offers, delivery figures and the populated contract timeline were inspected.
- Comms' actual message, deadline, all three choices, effect chips and project picker remained readable. Repeated project Start controls use a quiet outline rather than filling the entire dialog with bright primary buttons. Briefing/commit actions retain the pale primary treatment.
- Shared Tasks' active tab was explicitly checked: selected background `rgb(25, 51, 66)` and pale border, versus the secondary background `rgb(16, 32, 45)` and muted border. The shared cancellation confirmation was inspected and dismissed without cancelling the project.
- TypeScript, production build and Impeccable's mechanical detector passed (zero findings on the new theme). No automated tests added or run. This verifies the observed UI states, not complete mission outcomes, multiplayer enjoyment or every result/recovery variant.

Screenshots from this styling pass are in `/tmp/nasa-station-style/`. Concurrent artwork/audio work was left separate; those changes are not part of this CSS-only implementation.

## User rejection and corner-only replacement

The user reported that the team found the overall style worse and liked only the less-rounded corners. D-034 supersedes the implemented theme: `station-theme.css` was removed and replaced by `station-corners.css`. Its only declarations are `border-radius: 6px`, `3px` and `4px` for panels, controls and graph nodes respectively. Original fonts, colors, gradients, glows, backgrounds, animations and state styling now come from the unchanged station stylesheets. The accepted initial/pre-game pages are retained.

No audio source, integration or asset was edited during this reversal. A hash snapshot covered the audio sources/assets and their integration files; integration files remained unchanged, while `gameAudio.ts` advanced independently during the parallel work. No reset, checkout, stash or broad revert was used.

Verification: TypeScript and production build passed. Live Science measurements were restored to `system-ui, sans-serif`, 16px heading, background `rgb(18,21,28)` and action `rgb(47,111,237)`, with 3px button corners and unchanged 178×54 nodes (4px corners). Planner/Comms headings returned to their original 19px type and 6.08px tracking; panel gradients and portrait glows were present, with panels/responses now 6px. Screenshot: `/tmp/mission-control-restored-corners.jpg`. No automated tests added or run.
