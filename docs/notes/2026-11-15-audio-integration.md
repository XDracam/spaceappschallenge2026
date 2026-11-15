# Selected audio integrated into Mission Control

Date: 2026-11-15. User direction: “I pick 5 for cinematic fanfare. work it all in”. The audition browser showed seven chosen categories; the remaining six choices were read from their selected controls without changing them. Accepted under D-035, I-101.

| Use | Selected asset | Terms |
| --- | --- | --- |
| Title and planning music | The Magnificent Cosmos — Adiutorium | CC0 |
| Station attention | Question 4 — Kenney | CC0 |
| Accepted commitments | Select 1 — Kenney | CC0 |
| Project completion / partial mission result | Confirmation 2 — Kenney | CC0 |
| Actual launch | Artemis II pad recording — NASA Kennedy Space Center | NASA public domain |
| All required goals achieved | Cinematic fanfare / Victory Fanfare Short — cynicmusic | CC0 |
| Scrub, zero-goal result, failed research roll | Low Down — Kenney | CC0 |

## Implementation

- Seven runtime files live in `game/public/audio/`. [Selection metadata](../../game/public/audio/selected.json) and [credits](../../game/public/audio/CREDITS.txt) retain authors, source URLs, terms, edits and hashes. The music uses its full 146-second track, with the same preview gain and short edge fades, rather than looping the 75-second audition excerpt. The user-selected 11.84-second fanfare remains complete.
- Browser-local music begins after the first pointer/key interaction, plays on the title/setup and during planning, pauses in hidden tabs/disconnected clients and stops at launch. Mute plus effects/music levels are local preferences, initially 40% effects and 15% music. The speaker/mute button and effects/music sliders are always visible in a reserved bottom footer row on the pre-game and station screens. Station canvases and panels fit in the separate playable row above it; the controls do not float over content. The user explicitly rejected hiding these controls and the device-storage helper sentence.
- A small confirmed-action observer in `core/store.ts` reports accepted host/client actions with their origin and before/after state. Audio does not run in reducers, optimistic updates, initial state loading or snapshot application. No game-state schema, network message or runtime content-generation change was added.
- Short confirmation sounds apply to successful orders/amendments/Calls/allocations, research/test starts, Comms responses/projects, explicit coordination requests, published part needs and saved plan versions. No sound is inferred merely from a click, changed news item or rejected procurement action. Sliders, tabs, zoom and hover remain silent.
- Attention is local to new Comms inbox decisions, Procurement Call responses, or new/reassigned/reopened player requests for another station. Science research/test success, Comms project completion and Procurement deliveries reserved for a need/department reuse the completion sound; unallocated stock deliveries stay quiet. Research cancellation does not use the failed-roll sound.
- The Planner alone plays the NASA cue on an actual launch. Scrubs skip ignition. The other stations receive their immediate result cue; Planner waits for its local playthrough to finish or be skipped. All required goals achieved gets the selected fanfare, partial achievement gets the neutral completion cue, and a scrub/zero-goal result gets setback audio. Optional-goal misses alone do not downgrade a successful required-goal result.
- One highest-priority cue per state update, cooldowns and a single effects channel limit bursts. Results/launch interrupt lesser sounds. Initial/resumed/reconnected results have no live launch eligibility, so panel reopening and resuming do not replay a fanfare. Muted/background events are discarded rather than queued.

## Verification

TypeScript checking and a production build passed. Browser verification uses an isolated local origin (port 5180), preserving the user's existing mission and audition choices on 5178. Observations and limits are appended below after the walkthrough. No automated test suite was added or run.


### Observed walkthrough and independent review

- In a fresh isolated browser origin, all seven runtime media elements loaded. No music played before interaction. Opening Sound started the full selected music track; Mute stopped all playback, and unmuting resumed music.
- Started Larger sensor arrays through the real Science interface: the host-accepted action played Select 1. Its first seeded attempt failed and Low Down reached its end. Retrying succeeded and Confirmation 2 reached its end. These were actual running projects, not manually set research statuses.
- Switched to Communications: entering with an old inbox did not replay arrivals. Used the existing development drawer to fire the authored “Name the satellite” event; Question 4 played for the new open message.
- Reloaded/resumed the same check mission: each effects element remained at time zero. In Planner, deliberately launched without its nine ordered/delivered parts. The actual playthrough reported a scrub; the NASA launch element stayed at time zero, music paused, and Low Down played when playback reached its result. Hiding and reopening that result produced no active audio.
- The automatic approval reviewer initially treated this disposable check game as an important existing save and rejected Launch now. After checking the isolated origin and agent-created mission, the direct retry was allowed. The user subsequently clarified that no relevant saved games in this project are important and they do not care about preserving them. This does not authorize changing unrelated browser/application data.
- A fresh Terra source review found a missing Procurement delivery completion path. Added a coalesced cue only for deliveries reserved to a need/department. The reviewer passed that scoped fix and the in-game settings screenshot. They did not verify live delivery or multiplayer audio.
- Remaining live limits: no full successful mission was completed to qualify the NASA/fanfare result pair; no networked client echo/rejoin, paired request handoff, or delivery/Call batch was walked through in this audio integration. Those paths were source-reviewed; result classification reuses the existing required-goal score. The audit page had already played the selected NASA/fanfare files, and their identical runtime copies decode and have recorded hashes.

The user rejected the intermediate floating audio bar as obstructing game content. Replaced it with a 42px minimum footer in the shell layout; layout/paint containment makes existing station fixed panels resolve inside the playable area above that footer. Mute uses a standard speaker icon, no checkbox, disclosure or storage-helper sentence.

Final footer check: browser DOM measured the Planner app ending at1199px and the reserved footer starting at1199px, with controls in static flow. The footer was42px tall. The station content and controls did not overlap. Removed the checkbox, disclosure and helper sentence as requested.

The user then requested consolidating the shared station/player and Tasks controls into the same footer. Moved both components out of the station viewport into the shared 40px footer; standardized their controls with audio and anchored their existing popovers above the footer. Gameplay content no longer carries those floating triggers.

Final requested footer ordering: station/player control at left; audio toward the right; Tasks last, in the far-right corner. Existing station and Tasks panels open upward from these controls.

Before final publication handoff, the user renamed the game to “T-Minus”. Updated the visible title/setup wordmark, browser title, current submission copy and audition title context. Internal save/network identifiers stay compatible. The merge commit had already been pushed when this instruction arrived, so the rename is a follow-up commit.
