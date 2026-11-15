# Hackathon audio shortlist

Date: 2026-11-15. Status: recommendations, not an accepted implementation decision.

## User direction

The user requested Terra subagents to determine where audio makes sense and what to add. They clarified: “remember that we have limited time and this is just a hackathon so focus on high value audio and not small stuff.” Three Terra reviews inspected Planner/flight, Procurement/Science, and Comms/shared shell. This is source review, not an audible prototype or a multiplayer playtest. No audio was implemented or auditioned.

## Recommended first pass

Use one coherent, restrained space-mission palette: warm electronic tones, sparse music, a brief launch swell. Keep speech intelligible. Aim for **one loop and five short sounds**, reused across roles rather than unique station sound libraries.

| Order | Where | Audio | Value and scope |
| --- | --- | --- | --- |
| 1 | Title/menu; optionally quieter during planning | One sparse instrumental space loop, no vocals or radio chatter | Immediately gives the game atmosphere. Enable after a player gesture; if time is tight, use on the title/menu only. |
| 2 | Comms receives a new open message; Procurement receives Call offers; another player assigns a request to this role | One soft two-note attention tone | Draws attention to new decisions. Reuse the same sound; route only to the relevant station. Start with Comms if implementation time runs short. |
| 3 | Science research/test actually resolves successfully | One brief completion chime | Makes an important unlock or test result noticeable. Optional later reuse for actionable procurement deliveries; skip routine deliveries in the first pass. |
| 4 | Launch actually proceeds | One brief ignition/swell, roughly 2–3 seconds | Gives the mission commitment a memorable payoff. Prefer Planner only for the first pass: other stations immediately show their result. A scrub must not sound like a rocket flying. |
| 5 | Mission result becomes visible | Two short outcome sounds: warm achievement and subdued setback | Achievement for all goals achieved; setback for zero goals or a scrub. Reuse the neutral completion chime for partial success. Reuse setback for an actual failed research roll if cheap. |

If time runs out, ship atmosphere, Comms attention and the launch/result moment first. Expand the reused attention/completion hooks afterward. This ranking is a proposed effort/payoff judgment, not measured enjoyment.

## Verified attachment points

- Title/menu: [TitleScene.tsx](../../game/src/shell/TitleScene.tsx), [Lobby.tsx](../../game/src/shell/Lobby.tsx).
- New Comms inbox instances: [Inbox.tsx](../../game/src/stations/comms/ui/Inbox.tsx). `ArrivalToast` already compares instance IDs and suppresses the initial render, but only shows its banner when another message was already open. Sound should detect new open messages even when the center was empty.
- Call offers: `closeWithOffers` in [procurement/logic.ts](../../game/src/stations/procurement/logic.ts). Use actual closed Calls with offers, not button clicks or every news item.
- Assigned player requests: creation/update in [coordination.ts](../../game/src/core/coordination.ts). Limit to new/reassigned requests for this station from another player. The entire derived task board is not a stream of notifications.
- Research/test resolution: `resolve` and `resolveTest` in [science/logic.ts](../../game/src/stations/science/logic.ts). Cancellation also writes `status = 'failed'`; do not infer an unsuccessful experiment from that status alone.
- Launch: `launch` and calendar-driven launch in [planner/logic.ts](../../game/src/stations/planner/logic.ts). Check `isScrubbed` in [planner/result.ts](../../game/src/stations/planner/result.ts).
- Result: Planner waits for playback completion in [Playthrough.tsx](../../game/src/stations/planner/ui/Playthrough.tsx); the other roles show [ResultOverlay.tsx](../../game/src/shell/ResultOverlay.tsx) immediately after launch, as wired in [App.tsx](../../game/src/shell/App.tsx). Do not impose a synchronized reveal that does not exist, or stack launch and result sounds on the same browser.

## Minimal implementation constraints

- Local playback following replicated state changes; no streamed audio or new network protocol. Keep this to a small shared helper and a few event hooks.
- Start audio after a user gesture; provide mute and music volume. Use reusable static assets with verified permission and record credits in [THIRD_PARTY.md](../../THIRD_PARTY.md). No asset source has been selected or licensed by this review.
- Sound once per new event/attempt. Baseline initial state on load, resume and reconnect; reopening a panel/result must stay silent. Coalesce simultaneous notices and let launch/result take priority.
- Keep existing visual feedback: audio adds awareness, never exclusive information. Listen on the intended four-device setup before calling the mix suitable for conversation.

## Cut list

Defer click/hover sounds, typing, slider/zoom sounds, purchase cash-register effects, continuous machine hums, per-maneuver flybys, countdowns, ticking deadlines, every news/task update, voice acting and fake radio chatter. They add repetition, asset work or conversation interference without the same first-pass value. Flight speed and Skip to end also make per-event sounds prone to bursts.

## Verification needed if implemented

Audition the actual loop and cues; check first-interaction playback and mute, Comms arrivals, one completion/failure, a real launch and scrub, partial/zero/full results, fast-forward/skip, and reload/rejoin. Confirm only the intended station sounds and no cue repeats. These checks have not happened. No tests were added or run for this review.
