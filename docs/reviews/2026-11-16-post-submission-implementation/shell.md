# Shell, Science UI and audio implementation — 2026-11-16

## Scope and preservation

Implemented the assigned UI/recovery findings only. No game rules, physics, authored station data, research costs/chances/timing, ownership rules, saved state schema or network messages were changed by this packet. Existing station identity, layouts, map/graph geometry, primary actions, selected audio files and levels remain. No commits, pushes or tests were added/run. Root coordinates build, rendered checks and all other agents' changes.

Read Impeccable craft-floor immediately before editing. Used existing visual language rather than attempting the rejected D-033 restyle. Kept user-selected short mission/helper copy and accepted Task/Call/Offer/Contract/Allocation vocabulary intact.

## Implemented mapping

- UI-01 / technical T-01: new `game/src/shared/useDialog.ts` supplies initial focus, Tab containment, Escape, background inertness and trigger restoration. A stack gives only the top dialog ownership of keyboard/focus. Prior inert values restore when a dialog closes. Nonmodal Planner briefing remains nonmodal alone; a nonmodal surface nested above a modal temporarily inherits containment. No dependency added. API: `useDialog({open,root,modal?,onClose?,initialFocus?})` with Preact RefObject<HTMLElement>. Other UI agent adopted it for station dialogs. This packet uses it for shared confirmations, non-Planner mission result and disconnected-station recovery.
- UI-04: Lobby mission cards preserve their radio appearance; add roving tabindex, wrapping arrow navigation, Home/End and selection/focus synchronization. Existing click/Enter/Space button behavior retained.
- UI-05: Clipboard success depends on Clipboard API success or the actual boolean return of execCommand fallback. Errors show a persistent local status and selectable manual-copy field for room/link buttons; manual-code textarea remains available. Fallback cleanup restores focus. Success status expires after two seconds; cleanup clears timers.
- UI-02: Science Teams says running count of capacity rather than falsely labeling all capacity “at work”. Uses existing running/teamCapacity values only.
- UI-03/UI-08: Science tech buttons expose aria-pressed, complete names/status and full title tooltips; fog labels stay unknown. Named inspector landmark added; geometry preserved.
- UI-06: Science project bars expose progressbar semantics and the latest relevant news has a concise polite status node. Calendar ticks are not live announcements. The meaningless clickable title for part-test projects is now plain strong text; actual tech-project titles remain buttons.
- UI-07/UI-09: Science empty-design research copy now says “No research needed for the current design.” Science budget uses the shared presentation-only money helper with one-decimal precision; part arrivals use explicit mission epoch/short-date formatting rather than slicing a formatted string. Model terms and numbers remain.
- Audio storage: A successful preference write clears a previous storage warning. Playback, cue classification and settings are unchanged.
- Public credits: Existing title challenge-credit text now includes a BASE_URL-aware link to the supplied static credits page. Opens a new tab with an accessible note; no station chrome added.
- Performance: Each station view is a Preact lazy component under Suspense. Reducer registration remains eager and untouched. A bounded station error screen catches failed chunk/component loading with a user-controlled reload action and save/rejoin guidance; no uncaught promise/loading dead end intended. Source-only outcome; root should confirm actual production chunks/build sizes.

## Coordinated reliability feedback

Core agent owns `syncStore.error`, `saveLoadIssue`, `downloadSavedRecord`, validation and persistence behavior. Shell consumes their final exports:

- Unreadable local-save banner preserves the core's message and offers raw-record download plus an in-game confirmed reset. Download feedback says requested, not that disk saving completed. New-game hosting separately confirms before replacing an unreadable save. No native dialogs.
- Connected rejected-action errors appear as a dismissible status. Version-incompatible/disconnected errors remain in the recovery view and are not dismissible into an apparently valid session.
- Join readiness requires an actual connected sync state plus the received snapshot; incompatible clients do not see a misleading perpetual loading/seat picker flow.
- Disconnected station recovery gets a named modal/focus lifecycle. Existing valid-room rejoin/manual recovery and local-save retry paths remain.

## Validation actually performed

- Read and reviewed exact changed source and relevant owning APIs; inspected current core exports before hooking recovery up.
- TypeScript compiler via bundled Node and local TypeScript (`node node_modules/typescript/bin/tsc --noEmit`) passes after final changes. Ordinary npm is unavailable in this child shell; no install/change was attempted.
- Scoped `git diff --check` passes for shell, Science UI, audio and shared hook. Other agents' changes were preserved.
- No tests added or run. No live/browser assertions made by this packet: CUA inventory had no browsers and opening iab failed explicitly. Root has the isolated Vite server and owns rendered verification.

## Required rendered checks / limits

Before final handoff: verify New game radio arrows/Home/End; successful and denied clipboard paths; initial focus/Tab/Shift+Tab/Escape/trigger return for nested dialogs and existing nonmodal Planner briefing; lazy station switch and failed-chunk recovery; unreadable-save download/reset/new-game confirmation; incompatible-version recovery; Science capacity, full-name tooltip/pressed state, one-decimal budget and unchanged node geometry; credits link resolves under deployment base. Assistive technology announcements and human multiplayer enjoyment have not been qualified. Root should record only checks actually performed.
