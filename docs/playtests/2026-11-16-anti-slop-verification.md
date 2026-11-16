# Verification — 2026-11-16 — trailer-safe anti-slop pass

- Status: completed implementation and two-browser network check; not a human playtest.
- Facilitator: Codex with six Sol implementation specialists and independent review packets.
- Participants / roles: agent-operated host/Planner and remote Procurement browser, plus deterministic station/runtime checks.
- Source commit / build identifier: working tree based on `fe641b9` on `main`; changes uncommitted.
- Prototype files / save schema version: current `game/` source; current-save reload exercised, older-schema migration not exercised.
- Browser / operating system / viewport: two isolated production builds in in-app Chromium tabs on Linux; existing desktop station viewport.
- Evidence files and retention: source diff and this record; browser state was ephemeral. Targeted runtime evidence is local under `/tmp/nasa-shell-planner-runtime.json`, `/tmp/nasa-science-mars-reducer-verification.mjs` and `/tmp/nasa-comms-runtime-observation.json` and is not retained as repository evidence.
- Scenario and rules: preserve the visual compositions shown in `game/public/submission/T-Minus-Submission.mp4`; improve correctness and usability without changing authored mechanics.
- Question: do the affected default screens and interaction paths retain the trailer identity while removing the audited generated-software patterns?

## Observations

- The title, Planner map/result treatment, Procurement resource grid and inspector, Science full tree, and Communications three-column composition remained recognizable against the trailer reference.
- Science arrow navigation moved focus and selection between connected nodes and updated the inspector. Procurement began with no invented first-resource selection and exposed research blockers. The station switcher moved focus into its panel. The task board opened on its action queue. The result overlay exposed the complete flight log.
- A fresh guest joined a fresh host through a real PeerJS room code, claimed Procurement and adopted the Weather mission. Planner published nine needs; Procurement reviewed and confirmed a 38.2 M engine contract. The host received the changed budget, fixed part values and delivery. A player-authored request propagated to Procurement, was completed there and appeared in the host's history.
- Reloading the host exposed Continue, restored the 38.2 M contract and completed request, and gave the guest specific reconnection guidance. The guest rejoined the same room, reclaimed Procurement and received the restored contract and budget.
- Current Weather recipe replay reached 2/2 required and 2/2 optional goals with 11 deliveries and ten full-log events. Mars Science assertions covered rejected prerequisites, start, duplicate protection, exact completion boundary and unlock. Lunar Communications assertions covered delayed host confirmation, rejection/disconnection and project completion effects.
- The Communications assertions exposed one real defect: a same-attempt resync could leave a dropped reply/project permanently pending. The store now reconciles pending actions against confirmed snapshots; accepted and rejected resync cases passed after the fix.
- TypeScript `--noEmit`, the Vite production build and `git diff --check` completed successfully after integration. Vite retained its existing warning for the main chunk above 500 kB.
- The final Impeccable detector reported three side-border warnings. Communications and Science edges are part of the trailer-visible identity; the Procurement match is a timeline/selection treatment rather than an added generic card accent. No detector error was reported.

## Interpretation and limits

The exercised screens, real two-browser connection and deterministic station checks provide materially stronger evidence that the game remains playable. They still do not prove four-human coordination, every possible mission state, older-save migrations, venue/TURN behavior, screen-reader output or human enjoyment. No test suite/files were added; targeted temporary assertions were run after the user explicitly requested stronger verification. No trailer asset was edited or regenerated.

## Follow-up

Keep broad visual redesigns separate from this pass and compare them explicitly with the submission trailer before acceptance. Repeat the paired-browser and recipe checks after future protocol, state-schema or mission-rule changes.
