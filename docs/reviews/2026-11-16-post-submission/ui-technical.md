# Technical UI audit — 2026-11-16

## Scope and evidence
Read-only source audit of shell/lobby/tasks/result/confirmation, all four stations' UI and CSS, Planner map renderer and heatmap, audio controls, entry HTML and dependency metadata. Project decisions D-013/D-014/D-034 govern the review: preserve the original station style; do not revive the rejected theme. No tests, build, implementation edits, accessibility certification, or live performance measurements were performed by this agent. Findings below are source-confirmed unless otherwise marked. No rendering/keyboard walkthrough was available: parent established browser surfaces unavailable and local server listener denied (EPERM). This report makes no claim that four-player enjoyment, contrast on composited surfaces, zoom/reflow, touch gestures, or screen-reader behavior were observed.

## Integrity verdict
The implementation expresses real, product-specific interactions: route branches, delivery timing, live quote checks, shared task requests and research dependencies. The detector provides no basis for calling this a generic generated dashboard. The stronger professionalism opportunity is completing semantics, focus behavior and feedback across station boundaries. Preserve the accepted visual identity.

### Source-only health indicators
| Dimension | Indicator | Evidence and limit |
|---|---|---|
| Accessibility | 2/4, partial | Native controls and some strong focus handling coexist with pointer-only issue shortcuts, incomplete dialogs and incomplete selected-state semantics. No WCAG conformance claim. |
| Performance | 3/4, source only | Renderer caps/defer animations and cleans up observers; main planner UI schedules RAF even without playback. No frame-time or load measurements. |
| Theming | 2/4, source only | Planner/Comms/Procurement tokenized locally; Science has independent hard-coded palette. This is accepted appearance, not grounds for a re-theme. |
| Responsive design | N/A | Full HD station target. No arbitrary mobile score penalty or unsupported promise of mobile compatibility. Browser zoom and smaller desktop behavior remain unmeasured. |
| Implementation integrity | 3/4, source only | Coherent domain interactions, with duplicated focus/accessibility conventions and small feedback omissions. |

Do not turn these indicators into a release-quality percentage: visual and interaction evidence is missing.

## Confirmed findings

### T-01 [P1] Complete modal focus behavior consistently
- **Evidence:** `game/src/stations/procurement/ui/Dialog.tsx:14`–21 adds Escape handling only; `:73`–74 renders an `aria-modal=true` dialog. Only cancellation's Keep contract button uses `autoFocus` (`:61`); order/replacement/amendment dialogs do not place focus, trap it, restore their trigger, or make the background inert. Comms project picker `game/src/stations/comms/ui/Projects.tsx:174`–190 similarly supplies Escape and role but no focus lifecycle. Shared mission result `game/src/shell/ResultOverlay.tsx:38` supplies dialog role with no focus lifecycle. Comms briefing `Overlays.tsx:25`–37 autofocusses Start but does not contain focus.
- **Impact:** Keyboard users can continue into underlying station controls while an overlay blocks their view; assistive technology is told a modal context exists without the corresponding behavior.
- **Recommendation:** Factor a small dialog focus helper from the working shared ConfirmationPanel pattern: remember trigger, focus safe action or title, contain Tab/Shift+Tab, restore on close, mark blocked sibling content inert as appropriate. Keep nonmodal popovers distinct. Do not make every role=dialog modal automatically.
- **Standards:** WCAG 2.1.1, 2.4.3; WAI-ARIA dialog pattern. **Risk:** Safe gameplay preservation, invisible until keyboard use; confirm no stacked-overlay conflict. Suggested `$impeccable harden`.

### T-02 [P1] Make Planner issue shortcuts keyboard accessible
- **Evidence:** `game/src/stations/planner/ui/BottomStrip.tsx:280`–284 attaches click to readiness `<li>`; `:305`–308 does the same for issues linked to parts/maneuvers. Neither is tab-focusable nor has Enter/Space handling. The same file correctly gives goal rows role, tabIndex and keyboard handlers (`:214`, `:223`), so the omission is inconsistent within one component.
- **Impact:** Mouse users can jump directly from a reported problem to its control; keyboard users cannot activate that shortcut.
- **Recommendation:** Put a native button inside only actionable list items, retaining current appearance/labels/layout. Preserve plain text items when no target exists. Do not convert the whole list to buttons indiscriminately.
- **Standard:** WCAG 2.1.1, 4.1.2. **Risk:** No gameplay change; focus outline visible only in keyboard operation. Suggested `$impeccable harden`.

### T-03 [P2] Announce procurement action status without reading the footer again
- **Evidence:** `game/src/stations/procurement/ui/NewsStrip.tsx:18` renders status as a plain span. Dialog completion writes Order submitted, Delivery change submitted, Switch submitted and Cancellation submitted in `Dialog.tsx:39`, `:64`, `:141`, `:163` (verify final lines if source changes). The expandable news history has `role=log` (`NewsStrip.tsx:25`), but that log is not mounted while closed and does not supply semantics for the separate status span.
- **Impact:** A screen reader user receives little feedback after a commitment closes its dialog. The sound setting is optional, and sound cannot replace textual status semantics.
- **Recommendation:** Give the persistent status container `role=status`/polite atomic announcement. Announce accepted/rejected action outcome from existing host result, not every calendar/news update and not optimistic success before acceptance. Keep existing visible copy and audio timing.
- **Standard:** WCAG 4.1.3. **Risk:** No visual/gameplay change; avoid repeated announcements on ticks. Suggested `$impeccable harden`.

### T-04 [P2] Expose selected state in Science and Planner controls
- **Evidence:** `game/src/stations/science/ui/App.tsx:141`–148 uses `.sel` class only for the selected tech button; there is no aria-pressed/selected or relationship to Inspector. `game/src/stations/planner/ui/TopBar.tsx:52`–53 styles active navigation using a class/title only, without expanded/controls/pressed state. Procurement already uses aria-pressed on its catalogue/offer/category controls.
- **Impact:** Visual selection is available but its equivalent is inconsistent for assistive technology.
- **Recommendation:** Use `aria-pressed` for the single selected tech inspection toggle if that matches interaction, or a suitable documented selection pattern; add expanded/controls to Planner panel toggles. Label the inspector region using its existing heading. Do not add tab roles without the full keyboard pattern.
- **Standard:** WCAG 4.1.2, 1.3.1. **Risk:** No visible/gameplay change. Suggested `$impeccable harden`.

### T-05 [P2] Finish the mission radio-group keyboard pattern
- **Evidence:** `game/src/shell/Lobby.tsx:198`–203 assigns radiogroup/radio/checked roles to regular buttons but leaves every card in normal tab order and implements only click.
- **Impact:** Screen-reader users hear radio semantics while arrow-key navigation and one-tab-stop behavior associated with radio groups are absent. Selection remains possible with Tab/Space, so this is not a complete blocker.
- **Recommendation:** Prefer real radio inputs styled through their labels; alternatively add roving tabIndex and Left/Right/Up/Down navigation with selection. Keep cards and mission choice unchanged.
- **Standard:** WAI-ARIA radio pattern; WCAG 4.1.2 behavior expectations. **Risk:** No gameplay change. Suggested `$impeccable harden`.

### T-06 [P2] Give heatmap data an equivalent inspectable path
- **Evidence:** `game/src/stations/planner/ui/Heatmap.tsx:314`–319 renders an unlabeled, unfocusable canvas with mouse hover and click only. Cursor readout at `:365`–375 exists only after pointer hover. There ARE useful alternatives: Cheapest before deadline and Earliest good buttons (`:350`–362), plus normal maneuver editors. Therefore a blanket claim that mission planning requires a mouse is unsupported.
- **Impact:** Keyboard users cannot explore the heatmap's arbitrary candidate cells or obtain hover readouts, even though they can select the recommendations/edit numbers elsewhere.
- **Recommendation:** Add a meaningful chart label/description and a keyboard candidate cursor with arrow keys and Enter to use the same `set` function, or an equivalent compact data inspector. Reuse exact grid values; do not change transfer calculations, recommended points, range, costs or outcomes. Describe the map canvas as an overview and explicitly reference the existing DOM route controls in its accessible fallback.
- **Standards:** WCAG 1.1.1, 2.1.1. **Risk:** Adding a visible inspector needs a video-layout check; semantic descriptions and keyboard behavior can be invisible. Suggested `$impeccable harden`.

### T-07 [P2] Honor reduced-motion preference inside canvas animations
- **Evidence:** Planner CSS has reduced-motion overrides (`game/src/stations/planner/ui/styles.css:798`–801), but renderer canvas end-state pulse (`game/src/stations/planner/map/renderer.ts:1175`–1207), glowing marker pulse (`:1347`–1366) and animation scheduling (`:638`–644) do not query reduced motion. The map canvas has no equivalent opt-out in its component.
- **Impact:** A user who explicitly requests reduced motion still gets canvas breathing/pulse animation; CSS cannot suppress JavaScript canvas draws.
- **Recommendation:** Subscribe to matchMedia('(prefers-reduced-motion: reduce)') inside renderer lifecycle; freeze decorative pulse at a legible static value and preserve state contrast. Continue actual mission playback as an intentional controllable sequence. Retain ordinary rendering unchanged.
- **Standard:** Reduced-motion accessibility preference; do not assert the gentle pulse is a WCAG flashing failure. **Risk:** No gameplay change; visual variation only for opted-in preference. Suggested `$impeccable harden`.

### T-08 [P2] Explain invalid numeric edits instead of silently discarding them
- **Evidence:** `game/src/stations/planner/ui/Slider.tsx:97`–106 returns silently for nonnumeric/blank text and resets draft on blur. Valid out-of-range values are clamped by the caller (`:144`) without a message. Keyboard nudges and Escape are already implemented.
- **Impact:** Mistyped pasted units or decimal conventions appear to revert inexplicably; players can mistake that for an unresponsive field.
- **Recommendation:** Retain invalid draft and expose aria-invalid plus a concise inline/status explanation on commit, including allowable range/units. Keep the same numerical bounds and rounding. Revert on explicit Escape. A purely invisible live error can avoid layout changes, but a visible message would improve all users and needs a video check.
- **Standard:** WCAG 3.3.1/3.3.2 when an input error is detected. **Risk:** No gameplay change, possible small UI change. Suggested `$impeccable harden`.

### T-09 [P3] Stop the idle planner playback RAF loop
- **Evidence:** `game/src/stations/planner/ui/App.tsx:51`–62 calls stepPlaythrough and reschedules requestAnimationFrame for the whole lifetime of the station, including preparation with no playback. Renderer separately already requests drawing on state changes and caps decorative animation, so this is not evidence of a continuously redrawn 60 FPS map.
- **Impact:** Avoidable per-frame work and scheduling on a station that may remain open for the session. No measured frame drop, CPU or battery cost is claimed.
- **Recommendation:** Start the playback RAF loop only while a playback is actively advancing; stop on pause/end/unmount and resume with the same time-step behavior. Profile before undertaking larger rendering rewrites.
- **Risk:** Behavior-preserving if pause/resume clock reset is correct; verify existing playback controls. Suggested `$impeccable optimize`.

### T-10 [P3] Consolidate palette values internally without redesign
- **Evidence:** Science stylesheet (`game/src/stations/science/ui/styles.css:1`–35) embeds its background, text, action, border and status colors directly. Other stations define local tokens. Global corner-only overrides deliberately preserve differing visuals (`game/src/shell/station-corners.css`).
- **Impact:** Maintenance fixes such as focus/contrast adjustments are easy to apply inconsistently. Different fonts/colors alone are not a defect after D-034.
- **Recommendation:** Extract repeated values into Science-local tokens with byte-for-byte equivalent computed colors. Document current shared corner rules. Do not homogenize the stations, replace the system font, remove glow or adopt a new universal theme.
- **Risk:** Invisible refactor; compare computed styles/screenshots before/after. Suggested `$impeccable document`, followed only by targeted `$impeccable polish` when approved.

## Detector evidence — not a defect list
Command, run exactly once: `/home/dracam/.codex/skills/impeccable/scripts/impeccable detect --json game/src`. Exit 2 means findings. Raw JSON: `/tmp/nasa-detector.json`. **3 findings, all warning, all rule `side-tab`, all category `slop`; 0 error findings.**

| File:line | Matched declaration | Context and disposition |
|---|---|---|
| `game/src/stations/comms/ui/styles.css:399` | `border-left: 3px solid var(--c)` | Project-picker row encodes the stakeholder helped by the project; `Projects.tsx` derives `--c` from a trust effect. Contextual status coding. Do not classify as AI slop purely from this declaration or remove without visual evidence. |
| `game/src/stations/procurement/procurement.css:384` | `border-left-width: 3px` | Timeline `.pr-time-need` date marker. **False positive:** it is a data mark, not an accent stripe on a generic card. Preserve it. |
| `game/src/stations/science/ui/styles.css:25` | `border-left-width:4px` | Tech node uses branch colors to identify research lane. Useful domain encoding. Not an independently demonstrated defect; changing it would alter video-visible styling and possibly reduce legibility. |

A detector warning is not evidence of poor authorship, visual mismatch, or a user-facing bug. Two rules require design context; one is clearly a wrong structural interpretation.

## Strengths to retain
- `ConfirmationPanel.tsx:10`–29 already records/restores focus and loops Tab between safe/action choices, uses accessible title/description, and handles Escape. Use as local precedent rather than adding a heavy modal framework.
- Planner route continuation/editor in `NextStep.tsx:108` onward mirrors canvas actions in native DOM controls, including each branch. Canvas audit must acknowledge this.
- Renderer cleans up listeners/ResizeObserver/subscriptions, throttles drawing scheduling, handles pointercancel and touch-action:none. Do not invent broken touch drag solely because map uses a canvas.
- Procurement stale-quote rechecks and explicit confirmation facts preserve player agency; improve semantics while retaining all numbers and choices.
- Audio controls have named ranges, pressed mute state, keyboard focus styles, and status for storage errors. Do not add redundant mandatory audio.
- Shared Tasks has focus restoration, labeled fields, alerts for stale/invalid edits and host-confirmation status; use those patterns across remaining station UI.
- HTML declares English; user inputs generally use native forms/labels. No RTL requirement or second theme is established.

## Verification to perform before implementing/handoff
No tests were added or run. These are targeted manual checks, not claims of completed verification: Tab/Shift+Tab through each overlay, Escape and trigger return, activate Planner issue links with keyboard, hear one polite procurement acceptance/failure status, operate mission choices by arrow keys, compare Science/Planner selected state with accessibility tree, inspect heatmap without pointer, enable reduced motion and observe canvas, and compare exact video frames/screens after any visible adjustment. Full HD is the declared station baseline; separately check 125%/150% zoom and supported smaller desktop sizes before making responsive claims.

## Run notes
- Target slug: `game/src` (technical whole-app source audit). Ignore list: no custom detector ignore list; no dependency/dist/history scan passed to detector.
- Assessment independence: this agent ran technical/detector review without receiving Assessment A aesthetic conclusions; parent will synthesize.
- CLI detector: completed once, JSON/counts/locations preserved as above.
- Browser visibility: not available; no live page observed by this agent.
- Overlay injection: skipped, no browser mutation surface; no live server started by this agent and no injection cleanup needed.
- Guideline freshness: attempted `curl -fsSL https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`; failed DNS (`Could not resolve host`). No claim of a fresh Web Interface Guidelines compliance pass. Source audit used directly visible semantics and relevant accessibility patterns.
- Temp artifacts intentionally retained for parent synthesis: this packet and raw detector JSON. No repo source/config edits. No screenshot or interaction pass fabricated.
