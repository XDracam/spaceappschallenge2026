# UI design and editorial audit — independent Assessment A

Date: 2026-11-16. Scope: current shell, four stations, shared task board, station CSS, confirmations, first-run and result screens. Read project AGENTS.md and required design index/concept/decisions/questions; relevant decisions D-013, D-021, D-022, D-028, D-031, D-034, D-035 apply. No implementation edits, builds or tests performed. Recommendations are proposals, not accepted changes.

## Evidence and boundaries

CUA inventory returned no browsers and `createBrowserTab('iab', ...)` failed explicitly with “Browser is not available: iab”. Consequently this is source review plus direct viewing of seven existing Full HD video capture assets: `video/t-minus/assets/{title,science,procurement,comms,ready,result,contract}.png`. These prove the appearance of those captures, not current runtime behavior, viewport coverage, keyboard success, human enjoyment or multiplayer concurrency. Source was checked against the captures; debug buttons visible in captures are gated by `import.meta.env.DEV` in current source and are **not** release defects. No detector output was viewed; Assessment A remains independent from Assessment B.

The accepted visual authority is the actual implementation and D-034. The user previously rejected a broad station style pass and retained only smaller corners. Do not silently reinstate it. The title composition, imagery, station layouts, graph geometry, gradients and cyan glows are submission-visible; freeze them for this work. A future audit must not confuse “AI slop” with “uses gradients”, “uses Inter”, or “has many cards”. Those are stylistic signals, not defects by themselves.

## Verdict and strengths

The game has recognizable product-specific substance: an orbital planning map, a real hardware catalogue, an engineering dependency tree and consequential stakeholder conversations. It does not need a new visual identity to look more professional. Its most defensible improvements are correctness of labels, consistency of feedback, keyboard/dialog completion, reliable recovery and eliminating public/internal terminology leakage.

Preserve three strengths:

1. Procurement offers connect cost, delivery, reliability, research, the focused mission need and time for testing. The confirmation reviews show real tradeoffs and stale terms, rather than generic shopping UI (`procurement/ui/Dialog.tsx:98–140`).
2. Planner has explicit DOM alternatives for much route work: Next step and Edit route, contextual issue fixes, editable numeric fields, selectable goal detail rows (`planner/ui/NextStep.tsx:108–139`, `BottomStrip.tsx:214–223`). The map is not the sole planning path.
3. Shared task links focus actual station work, and the common confirmation panel traps focus, restores it and supports Escape (`shell/TaskBoard.tsx:53–116`; `ConfirmationPanel.tsx:10–38`). These are good reusable patterns.

## Priority findings

### UI-01 [P1] Finish modal behavior across stations using the already competent confirmation pattern

Evidence: Procurement declares `aria-modal="true"` but its effect only registers Escape; no initial focus, background inertness, tab containment or focus restoration (`game/src/stations/procurement/ui/Dialog.tsx:13–21,73–75`). Only cancellation autofocuses its safe choice. Communications project picker similarly declares dialog but only handles Escape (`comms/ui/Projects.tsx:173–184`); communications briefing and launched card have autofocus/close buttons but no containment or restoration (`comms/ui/Overlays.tsx:30–49,67–94`). Planner result card has no dialog role or accessible heading association (`planner/ui/Playthrough.tsx:134–143`); shared result overlay declares dialog but has no modal focus lifecycle (`shell/ResultOverlay.tsx:50`).

Impact: keyboard focus can remain behind the overlay; screen readers lack consistent entry/exit and users may trigger hidden station controls. This is behavioral polish, not a gameplay change. Reuse a small shared focus lifecycle while retaining each screen's layout, labels and controls. Do not make the shared task board modal unless its intended interaction requires it. Video risk: low, because behavior can change with no static visual change. Verify with keyboard and assistive technology before claiming accessibility.

### UI-02 [P2] Fix a demonstrably misleading team-capacity label

`science/ui/App.tsx:254` renders `{teamCapacity(g)} at work`; `science/model/research.ts:83` calculates capacity, not the number currently running. The header separately uses `{runs.length}/{teamCapacity(g)}` at line 67. Even with no running project, Teams says “2 at work”. Use “2 teams available” or “0 of 2 teams working” from existing values. No changes to capacity or research timing. Video risk: visible copy, so compare the captured Science shot before scheduling.

### UI-03 [P2] Make selection state available beyond color and outlines

Science technology buttons style selected state through `.sel` but expose no `aria-pressed`/selection semantics (`science/ui/App.tsx:139–146`). Communications inbox likewise styles `.sel` without programmatic selected state (`comms/ui/Inbox.tsx:80`). Use appropriate state semantics that preserve native buttons and avoid inventing a complex ARIA tree unless full tree keyboard behavior is implemented. Video risk: none for semantic changes. This is a direct contrast with procurement cards, which already expose `aria-pressed` (`procurement/ui/Catalogue.tsx:128–130`).

### UI-04 [P2] Complete the mission picker’s radio keyboard contract

Mission cards declare `radiogroup`/`radio`/`aria-checked` but are ordinary tab stops with click handlers and no arrow-key selection or roving tabindex (`shell/Lobby.tsx:198–203`). Either implement conventional radio-group keyboard behavior or use native radios styled with the existing cards. Keep mission order, defaults and availability unchanged. Video risk: none if card appearance stays identical.

### UI-05 [P2] “Copied” currently means “attempted”, even when clipboard fallback fails

`Lobby.tsx:60–72` awaits clipboard API then uses `document.execCommand('copy')` without checking its boolean result. Callers always show “Copied ✓” at lines 79 and 90. Return success/failure and show the result truthfully; on failure leave/select the code and explain manual copy. This is a particularly visible professionalism issue because connection setup depends on copying codes. No network changes required. Video risk: error-only UI, low.

### UI-06 [P2] Give important dynamic feedback a deliberate announcement policy

Procurement status is a plain span, not a live region (`procurement/ui/NewsStrip.tsx:18`). Science running bars and news are plain div/span content (`science/ui/App.tsx:106,155–157`); Comms ArrivalToast changes visual content without a status announcement (`comms/ui/Inbox.tsx:140–149`). Add concise `role=status`/polite updates to action results and new urgent messages, preserving the existing visuals and avoiding announcement of every clock tick or entire news list. The sound controls already use a local `role=status` for failures (`audio/SoundSettings.tsx:16`). Video risk: none; announce transitions, not continuous numbers.

### UI-07 [P2] Distinguish capacity, approval, delivery and completion vocabulary consistently

Current player-facing copy includes “Beyond research”, “within research”, “Not covered”, “Ready to start”, “Order parts”, “source each need”, “Resources”, “Tasks”, “requests” and “needs” in nearby systems. Concrete examples: `science/ui/App.tsx:75` says “Every part ... is within research”; `procurement/ui/Catalogue.tsx:88,137,146` capitalizes “Resources” and says “Beyond research”; `procurement/ui/Needs.tsx:29,63` uses “Not covered” and “Beyond research · Science not started”. These are internal model terms leaking into the game, not a request to change the underlying entities.

Make a short copy map before editing. Examples: “No research needed for the current design”; “Research required”; “Not yet ordered”; “Request parts” if that action publishes requirements rather than signs a purchase. Preserve distinctions that matter; do not rename all requests/tasks/needs to one word. Verify the actual action before selecting each replacement. Video risk: medium; ship noncaptured labels first and maintain screenshot comparison for captured text.

### UI-08 [P2] Provide a full-name affordance for truncated technology nodes

Science labels are deliberately ellipsized (`science/ui/styles.css:26`), and the captured Science shot shows “Staged combustion upgr...” and “Lightweight deployable p...”. The node markup has no `title` or other full-name disclosure (`science/ui/App.tsx:139–146`). Full name is available after selection in inspector, so this is not a blocker. Add a full accessible label and a keyboard-focus/hover tooltip without resizing the graph. Do not replace carefully authored names merely to fit. Video risk: none at rest; tooltip appears only during interaction.

### UI-09 [P2] Make date and money presentation consistent while preserving units and precision

Science header rounds budget to whole M (`science/ui/App.tsx:67`); funding task details print two decimals at line 296. Procurement presents calculated money through `fmtM`; planner and Comms use separate formatters. Dates are also shortened by string slicing in Science part arrival rows and procurement need dates (`science/ui/App.tsx:205`; `procurement/ui/Needs.tsx:99`). A single formatting policy would prevent players interpreting rounding as disagreement between stations. Keep exact underlying values; use a consistent short format and expose detail when a commitment needs it. Video risk: visible text; prioritize consistency inside confirmation/recovery states first.

### UI-10 [P2] Do not overclaim that the Planner map is keyboard accessible

`planner/map/MapCanvas.tsx:46` has no label/fallback content/tabindex; renderer binds pointer/wheel/double-click/context menu only (`renderer.ts:332–339`). DOM Next step/Edit route is a real mitigation and must be preserved. The transfer heatmap is mouse-only for arbitrary cell selection (`planner/ui/Heatmap.tsx:314–321`), though recommended choices exist as buttons at lines 352 and 360. Add a concise semantic map summary and an equivalent date/time selection path for heatmap values if complete keyboard access is in scope. Do not create new maneuver options or auto-plan routes. Video risk: low if summaries are visually hidden and existing numerical fields are reused; moderate if a new visible panel is proposed. Source audit alone cannot certify screen-reader usability.

### UI-11 [P2] Avoid labeling all failure events as “Part failures”

Planner result counts every `kind==='failure'` and labels the count “Part failures” (`planner/ui/Playthrough.tsx:129,175`). Failure events also include invalid maneuver failures (`planner/physics/playthrough.ts:104`) and scrub events (line 80), in addition to individual part failures (lines 110 and 122). Scrub display is excluded, but invalid maneuver failures still affect the count. Rename to an accurate existing-event category, or count actual part failures separately without changing outcomes. Video risk: result screen is captured; change text only after checking the final submitted frame.

### UI-12 [P2] Make briefings available when needed and accurate for the current clock state

Planner can reopen via its brand (`planner/ui/TopBar.tsx:28`) and stores briefing per mission (`Briefing.tsx:11–16`). Communications uses one global seen key and has no reopening control in Header (`comms/ui/Overlays.tsx:8–15`; `Header.tsx:6–30`). Its project picker may need a refresher even for a returning player on a different mission. Add a discreet existing-menu Help action to reopen the same content, not a new forced tutorial. Planner briefing claims the clock “runs in real time” and displays approximately minutes from now even if the shared calendar is paused (`planner/ui/Briefing.tsx:93–96`); condition the wording on existing running state. Keep calendar behavior unchanged. Video risk: low for menu action, medium for captured briefing copy.

### UI-13 [P2] Preserve Full HD density; offer honest screen guidance before attempting responsive redesign

The project targets a dense station. Comms fixes `min-width:1100px; overflow:clip` (`comms/ui/styles.css:65–68`), Science fixes sidebars at 250/290 px (`science/ui/styles.css:4`) and shell hides page overflow (`shell/shell.css:5–6`). These are constraints, not evidence the game should become a mobile app. Document the supported desktop viewport and browser zoom behavior in player guidance; visually check 1440×900 and Full HD plus text zoom before promising support. A small-window notice or alternate access to clipped controls is potentially appropriate; a station redesign is outside this audit’s safe scope. Current audit did not execute viewport or zoom checks.

### UI-14 [P3] Remove duplicate low-value exhortations before rewriting the game’s voice

The title already has a clear line (“Four stations. One mission. Make it fly.”), a concrete subtitle, and role descriptions; footer adds “Plan together. Launch together.” (`Lobby.tsx:265,278,281–287`). New game adds “Bring a crew. Make it fly.” and immediately repeats “Bring a crew, or play solo.” (`Lobby.tsx:252–254`). This repetition makes the copy feel generated despite a good core slogan. Preserve the title and video-visible tagline; consider removing one redundant setup sentence or replacing it with a useful connection requirement. Do not blanket-delete short rhythmic sentences: they are appropriate game-title copy. Video risk: high for title text, lower for uncaptured setup text.

### UI-15 [P3] Match mission-card copy style and distinguish asserted duration from difficulty

Weather/Mars cards have short factual objectives, while Moon has a long procedural paragraph ending “Medium game.” (`Lobby.tsx:178–189`). “Medium” could mean difficulty or length; neither is established in that label. Use one concise objective per card and a separate accurate difficulty/estimated-duration field only if supported by evidence. Do not change mission options or gameplay. Video risk: setup visible if shown; compare final video first.

### UI-16 [P2, verification follow-up] Investigate the captured result’s contradictory explanation before polishing it

The existing `video/t-minus/assets/result.png` simultaneously shows both required GEO goals achieved and optional goals failing because “orbit at 200 km, needs 35,786 ± 2,000 km”. The source renders `failReasons(game, ev, pt.result)` (`planner/ui/Playthrough.tsx:131,159–164`). This is a **captured symptom**, not proof of a current reproducible simulation bug. Verify whether the reason uses a different craft/branch or prelaunch evaluation than actual successful outcomes. Improve attribution to the relevant instrument/craft and label forecast-vs-observed reasons if that explains it. Do not alter physics, success conditions or randomness as a cosmetic fix. Video risk: captured; accuracy correction may be warranted, but preserve the submitted outcome rules.

## Heuristic scores (provisional source/static assessment, not measured usability)

| Heuristic | Score / 4 | Reason |
|---|---:|---|
| Visibility of system status | 3 | Dates, budget, task badges and forecasts; misleading team label and uneven announcements. |
| Match with real world | 3 | Strong space agency vocabulary; internal terms remain. |
| User control/freedom | 3 | In-app confirmations, route editing, result dismissal/retry; inconsistent dialog focus and help reopening. |
| Consistency/standards | 2 | Different semantic and dialog conventions; intentional visual difference between Science and other stations is not itself a defect. |
| Error prevention | 3 | Stale-term checks and explicit costs; no evidence to award 4. |
| Recognition over recall | 3 | Contextual needs/offers, route hints, task links; truncated technology names and jargon. |
| Flexibility/efficiency | 2 | Alternate route controls, search/filters; keyboard incomplete on heatmap and custom radio group. |
| Aesthetic/minimalist design | 3 | Dense but purposeful operations UI; repeated slogans and verbose secondary guidance. |
| Error diagnosis/recovery | 2 | Strong confirmations and save failure notice; clipboard reports false success and result reasons need follow-up. |
| Help/documentation | 2 | Useful context, planner briefing and procurement guide; Comms briefing not reopenable. |
| Total | 26/40 | 65%, acceptable by rubric; provisional, not a compliance or playtest score. |

## Cognitive load and emotional journey

Relevant personas: Jordan (first-time crew member), Alex (returning player), Sam (keyboard/screen-reader user). No PRODUCT.md audience was invented. Jordan benefits from the clear four-role title, contextual procurement and Next step; the “order” vs “request” vocabulary and absence of Comms briefing reopening impose recall. Alex gets search, focus filters, route controls and skip-to-end, but arbitrary heatmap picking remains pointer-only. Sam is most exposed to uncontained dialogs, unannounced updates and absent selected-state semantics.

Static checklist: related-information grouping passes; progressive disclosure passes (details, inspector, advanced controls); working-memory support mostly passes (needs and offer tradeoffs co-located). Single focus and hierarchy are mixed in the all-catalogue capture; chunking/minimal-choice checks exceed rubric thresholds (8 category buttons, 20+ visible catalogue cards; many science nodes). These counts are factual observations of captures, not proof of overload. A catalogue and tech graph intentionally require comparison. Prefer existing Matches only/focus/category paths and clearer current selection over hiding content or redesigning the stations. Concurrent timed messages are gameplay; do not remove them to satisfy a generic “one thing at a time” rubric.

Emotional journey: title gives confidence, first mission introduces real decisions, commitment reviews are reassuring, outcomes create a concrete finish. False-positive copy/clipboard feedback and inconsistent explanations at the end damage trust disproportionately. Fix those before adding decorative delight or more cinematic effects. Human enjoyment and zero idle time remain unverified.

## Safe order of work

1. Invisible semantics, focus, announcements and truthful clipboard feedback; retain screenshots and gameplay values.
2. Correct team/failure labels and reconcile outcome explanation attribution; assess video-visible text before merging.
3. Establish the smallest editorial vocabulary/formatting sheet, edit uncaptured helper/error text first.
4. Preserve title/stations and D-034. Defer broad typography/color/graph/layout changes and any gameplay changes.

No P0 found in this packet. No current-runtime success claims. The highest impact is polish that makes the existing game dependable, precise and finished.


## Source-direction amendment after complete archive review

Preserve the user-selected Task/Call/Offer/Contract/Allocation vocabulary and planner Order part wording; UI-07 means explain/reconcile terms, not blanket rename them. Preserve the expressly selected short Weather/Mars descriptions and “Bring a crew, or play solo.” (title-screen note:60–62). UI-14 must not rewrite that selected helper merely to reduce repetition. Moon copy is the inconsistent later addition. See `archive-a.md` for evidence and archive status/correction findings.
