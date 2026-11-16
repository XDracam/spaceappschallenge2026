# T-Minus — 29-second submission video

> **Historical recording plan.** The script's “not yet validated” statements describe its drafting stage. A later local T-Minus export and production captures are retained; [submission reference](submission-reference.md) identifies the actual local video, credits and verification limits. This script is not the final export's validation record.

Prepared November 15, 2026 for the NASA Space Apps “Space Mission Design Game” challenge. This is a recording script, reviewed by an independent sceptical subagent. Footage and the exported video have not been validated.

## Voiceover — copy and record

Your mission: send weather images home from orbit.

Meet the camera requirement. More capability adds weight and cost.

In T-Minus, four players coordinate design, research, procurement, and partnerships within one budget and schedule.

Launch your mission and inspect which objectives succeed.

Discover how engineering choices shape the whole mission.

## Shot list

| Time | Picture |
| --- | --- |
| 0–4 seconds | Weather-imagery objective and Earth/orbit view. Overlay “T-Minus”, the actual team name, and “Space Mission Design Game”. Begin with gameplay, without a separate title-screen introduction. |
| 4–10 seconds | Prepared camera-performance comparison. Show its readable mass and estimated-cost tooltip before and after the change. Editorial callouts: “More mass” and “Higher estimated cost”. |
| 10–19 seconds | Three clearly labelled shots: Science selects camera research; Procurement compares supplier price and delivery; Communications selects a partnership such as Northgate test technicians. Keep the shared budget/calendar visible. These illustrate the roles working toward one mission; they are not an instant or mandatory chain of actions. |
| 19–25 seconds | Actual trajectory playback followed by the actual mission result. Give the goal results enough screen time to distinguish reaching geostationary orbit from returning weather imagery. |
| 25–29 seconds | Hold the result behind “See how choices shape mission success” and “missioncontrol.dractec.com”. |

## Recording notes

- Use the Weather Satellite mission throughout. Capture clips from a coherent mission attempt, cutting out waiting time. Do not imply that a camera upgrade alone resolves every mission constraint.
- The camera comparison is a deliberately prepared design example, not the default opening. In the current source formulas, performance 3 → 4.5 raises camera mass from 90 → 120 kg and estimated part cost from $15M → $19.5M. The money is an estimate, not a signed supplier price. Record the actual UI before including numerical overlays.
- The part-name tooltip exposes mass and estimated cost. Do not promise a simultaneous camera data-demand readout that the normal slider view does not provide. Keep the camera editable, before it is contracted.
- The Communications test-technician project accelerates research/testing after completion; it does not instantly produce a camera. Show it as a partnership decision, not a completed instant effect.
- Use a real result, including any failure. A planning prediction must be labelled “Plan evaluation”; it must not be presented as a completed flight. If only planning footage is available, revise the launch/result narration accordingly.
- Use English captions, readable crops and restrained transitions. Target a 29-second export and verify it is no longer than 30 seconds. Word count is only a pacing estimate; time the recorded voiceover.
- Retain visible AI-generation watermarks on generated artwork. The full disclosure is: human concept and gameplay; code by Codex and Claude; all images generated with ChatGPT Images. Include the full disclosure in the submission and video description. If using generated voice/audio, acknowledge it in descriptive text and metadata too. Retain source/license credits for any third-party audio.
- A readable “Design reference: JPL Concept Maturity Levels” caption may appear during the collaboration sequence if space permits. Put the full citation in the submission/video description. This is conceptual design reference use, not a claim of NASA observational data integration or JPL validation of the simulation.

## Independent sceptical review and revisions

The reviewer judged the challenge fit strong because the sequence demonstrates objective → configuration → constrained management → simulation → feedback. It makes the brief’s instrument/resource trade-off concrete while using four-role cooperation as a supporting distinction.

The reviewer required a shorter opening, evidence the UI can actually show, no fabricated single-step success, an authentic final result, and removal of the absolute claim “Every choice changes the mission”. Those changes are incorporated above.

Verdict: suitable to record after script review. This review does not establish the readability, actual duration, mission outcome or quality of a finished video. Inspect the exported video before submission.

## Local production plan — verified November 15, 2026

User direction: build the eventual video with tools available on this machine, suitable for Codex/Sol 6.1 execution. Prefer the actual game music and sound effects.

- Editing/export: `/usr/bin/ffmpeg` and `/usr/bin/ffprobe` are installed. FFmpeg lists H.264 (`libx264`) and AAC encoders. Target a 1920×1080, 30 fps, 29-second MP4; use scripted cuts, crops, text overlays, subtitles, audio fades and mixing.
- Narration: `/home/dracam/.local/lib/voicebox/voicebox speak` supports `--language en --voice F1 --speed 1 --write <file.wav>`. The local Supertonic 3 model files are present. A real export of the opening sentence succeeded, producing about three seconds of speech at `/tmp/mission-control-voice-check.wav`. This proves synthesis/export, not voice quality; audition voices before choosing the final narrator. Generate narration in five segments and fit the edit around measured durations rather than forcing uniform speech speed.
- Music: use `game/public/audio/music.mp3`, the actual lobby/planning music. FFprobe confirms stereo MP3, 44.1 kHz, about 146.26 seconds. The game credits identify it as “The Magnificent Cosmos” by Adiutorium, CC0. Choose a suitable excerpt after listening, fade in/out, and lower it beneath narration. Treat the game’s 15% music default as a gameplay preference, not a final-video loudness specification.
- Effects: prefer the existing `confirmation.mp3`, `completion.mp3`, `launch.mp3`, `achievement.mp3` and `setback.mp3` when the corresponding recorded action/outcome warrants them. Use sparse effects; do not add a victory cue over a failed mission. Keep the launch effect short enough for this edit and preserve the existing audio credits from `game/public/audio/CREDITS.txt`.
- Capture: OBS is installed, and the repository contains a Playwright-based four-station harness. Neither recording route has been exercised for this video. First prove capture of a short actual gameplay clip; then record the planned interactions. The user authorizes using locally available software for the eventual production. Respect the active browser-tool instructions when selecting automation/capture methods.
- Separate the source music, narration and effects into editable tracks. Avoid capturing desktop notification audio. Keep clips, captions, narration segments and a reproducible render command alongside the final MP4.
- Review the final export for intelligible speech, UI readability, authentic game outcomes, required AI labels/credits, and duration below 30 seconds. No finished-video validation has happened yet.

## Sources

- Official challenge: https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/
- Submission requirements: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging criteria: https://www.spaceappschallenge.org/resources/judging-awards-guide/
- JPL reference: https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299
- Local implementation evidence: `game/src/stations/planner/data/parts.ts`, `game/src/stations/planner/ui/RocketTab.tsx`, `game/src/stations/planner/physics/playthrough.ts`, `game/src/stations/comms/data/weather/projects.ts`.
