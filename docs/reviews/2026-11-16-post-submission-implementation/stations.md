# Station UI implementation — 2026-11-16

## Ownership and boundaries
Edited Planner UI/map, Comms UI, Procurement UI and procurement rules only for C14 and approved formatting wrappers, plus new `game/src/shared/format.ts`. Shared dialog lifecycle hook is owned by ui_design agent. No gameplay content/data, actions/reducers, physics, mission IDs, tech numbers, prices, probabilities, outcomes or event selection changed by this agent. No commits or tests. D-034 accepted station appearance retained; no theme, font, palette, panels or graph geometry replacement.

## Audit mapping and actual changes
| Finding | Implemented |
|---|---|
| T-01/UI-03 dialog focus | `useDialog` used for procurement confirmation; Comms project picker, briefing and launched card; Planner goal dialog, result and heatmap. Proper role/aria-modal/ref targets. Planner partial-screen briefing deliberately remains nonmodal (existing station interaction preserved), receives entry/restore/Escape only. Existing native autofocus safe actions retained. |
| T-02/UI-04 issue keyboard actions | Planner readiness and targeted issue rows now contain native buttons with inherited font/spacing/hover appearance and focus outline; non-actionable issues stay text. Uses existing openTab/highlightPart/openManeuverEdit functions. |
| T-03/UI-06 action/news status | Procurement persistent status span role=status, atomic. Comms arrival toast has persistent visually hidden polite status for newly displayed message, preserving visible toast lifecycle and avoiding every clock tick announcement. |
| T-04/UI-05 selected states | Planner panel toggles expose expanded/controls, branch and maneuver buttons pressed state, playback speed pressed state and play/pause accessible name; Rocket add/menu toggles expanded, Versions comparison pressed. Comms Inbox pressed state and controlled conversation region, chosen answer pressed state. Science assigned to ui_design agent. |
| T-06/UI-10 chart and canvas | Planner map labelled overview with mission name/route counts and reference to existing DOM route editing controls; no new map actions. Heatmap gains focusable interactive group, arrows to inspect the existing 60×40 candidate grid (Up increases travel time), Home/End departure extremes, Enter/Space calls same set function as pointer click. Focus initializes to nearest existing maneuver values. Existing visible readout becomes Candidate with status semantics. Existing recommended choice buttons/calculations untouched. |
| T-07 reduced motion | Renderer subscribes to prefers-reduced-motion, freezes decorative animation time/pulses and stops decorative timeout scheduling; cleans up listener. Real playback still advances via existing controls/state. Normal preference behavior unchanged. |
| T-08 numeric errors | Invalid nonnumeric/empty input retains draft and shows associated accessible alert plus allowed range and units. Escape discards. Arrow nudging unchanged. Existing finite input conversion, rounding and clamping retained; out-of-range valid commit now explains its adjustment. Error/notice is small anchored feedback visible only for unusual edits. |
| T-09 idle RAF | Playback RAF effect starts only when playthrough playing and unfinished; pause/end/unmount cancel it, resume resets frame timestamp. Existing stepPlaythrough math untouched. |
| UI-09 formatting | Shared pure formatter for money stored in M, explicit precision/unit policy and UTC dates with explicit epoch. Comms UI and Procurement money retain tenths rather than silently dropping them above 10M/100M; exact underlying money untouched. Planner compact chip remains whole M, tooltip details now retain tenths. Planner result existing one-decimal details retained. Compact procurement dates now render from UTC Date with explicit short-date option instead of slicing strings; text remains same day+month. Science helper adoption assigned ui_design. |
| Content supporting accuracy | FlightOutlook now restricts positive recovery wording to physically achievable goals lost to part reliability, when the flight survives; matches result.ts rescueEligible/flying. No probability changed. |
| UI-11 result label | All `failure` events counted exactly as before, now correctly labelled Failure events instead of Part failures. |
| UI-12 help/briefing | Comms existing brand becomes visually identical accessible button to reopen briefing; seen key mission-specific. Old global seen record preserved and not deleted. Planner briefing accurately distinguishes paused calendar and actual running speed; no auto-pause/time rule change. |
| C14 arrival preview | One `orderArrival` helper expresses existing commitment rule `floor(clock.day)+round(leadTimeDays*daysFactor)+deliveryShiftDays`; expectedArrival, priority assessment and quoteOrder share it. QuoteOrder produces the same committed dates and token leadDays as before. Assessment preview stops carrying fractional clock day. Call preview unchanged because it has distinct future closure calculation. |

## Shared formatter API
- `formatMoneyM(value, {decimals=1,minimumDecimals=0,billions=false})`. Amount stored/received in millions; optional B display, real minus, trailing decimals trimmed to requested precision. No mutation or gameplay rounding.
- `formatMissionDate(day,startISO,{year=true})` for explicit mission epoch, UTC whole-day convention.
- `formatCalendarDate(date,{year=true})` for callers that already resolve epoch. Procurement retains existing owner dayToDate rather than introducing another mutable global in components.

## Actual checks by this agent
Read required project documents, accepted/rejected archive findings, audit packets, craft floor and actual source before editing. Inspected each changed path and related owners; reviewed diff for preservation of behavior. Ran `git diff --check` successfully. No tests added/run. No compiler/build run in parallel: parent owns final combined compiler/build and browser verification. No claims of keyboard/screen-reader usability, precise visual preservation, playback or multiplayer runtime success before parent's checks.

## Parent runtime verification checklist
1. Procurement order confirmation focus begins on Back, Tab/Shift+Tab remain inside, Escape returns trigger and clears amendment preview; opening nested shared confirmation doesn't unfreeze underlying content early.
2. Comms header brand preserves styling and reopens current mission briefing; first mission-specific visit opens once, close/reopen and mission switch use correct title; project picker and launch card focus/close correctly.
3. Planner issue button activates existing target with keyboard; issue row look remains same. Numeric invalid draft stays, correction clears message, Escape resets, out-of-range clamp remains existing value with notice, usual field width unchanged.
4. Planner paused briefing reads paused; running rate follows clock speed. Goal dialog and result wrap/restore focus; result label says Failure events and counts unchanged.
5. Mars transfer heatmap arrow navigation changes candidate readout; Enter applies same grid departure/travel choice as click. Other automatic choice points unchanged.
6. Playback pause/resume/end remains correct after idle RAF guard. Reduced-motion preference still renders state/route legibly; normal mode animations retain accepted appearance.
7. Fractional calendar-day procurement assessment arrival equals quoteOrder committed arrival for same option; assess late/on-time boundaries vs actual quote use whole-day rule.
8. Headers/details agree in units and enough money precision; verify a 100.1M confirmation and sub-10M amount. Compact dates keep same visible day/month, full commitment retains year.

## Remaining constraints
No re-theme or asset replacement. Source semantics are improved, but an accessibility certificate would require assistive technology and complete keyboard walkthrough. Touch gestures, browser zoom and smaller desktop viewport support are not certified. Map remains a pointer-driven visualization with DOM alternatives rather than being turned into an entirely separate keyboard map editor. No new gameplay decisions or compulsory tutorial order added.
