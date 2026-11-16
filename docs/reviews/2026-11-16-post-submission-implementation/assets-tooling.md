# Assets, release and tooling implementation — November 16, 2026

## Changes completed

- Moved the complete 62-file audition sandbox from `game/public/audio-audit/` to `dev/audio-audit/`, retaining every candidate/license/source record. The old unlabelled Earth bytes are preserved in `source/earth-unlabelled.webp`; the displayed Earth is now a byte-for-byte copy of the existing labelled title artwork. Added local-only serving instructions and corrected active credits/back links and image dimensions.
- Self-hosted exactly Exo 2 600/700 and Inter 400/500/600 from the previously used Google Fonts API request. Network retrieval succeeded after escalation. Five unmodified TTF responses (~1.21 MiB), source URLs/SHA-256 manifest and original SIL OFL notices retained under `game/public/fonts/`. `fc-scan` confirms family/weights. No font substitutions, drawing edits or CSS font/weight changes.
- Added concise `/credits/` page, accurate metadata, neutral orbit SVG favicon with AI-assistance description, and social art that exactly reuses the labelled original. Coordinated in-game link with ui_design.
- Repaired the submission page wrapper width to be bounded by both available width and viewport height; MP4/poster remain unchanged. Added share metadata to both public entry pages.
- Current credit headings consistently use T-Minus. Runtime/storage/network identifiers and historical names remain untouched. Updated THIRD_PARTY and font notices for self-hosting/development archive.
- Created `docs/submission-reference.md`: project/trailer URLs, exact local final export SHA-256/size/format, superseded draft, unknown historical submission timestamp/source commit. It does not invent an uploaded-file verification or identify present HEAD as the judged source.
- Added optional `video/production.mjs` and portable capture scripts using playtest’s declared Playwright package, configurable URL/browser and new capture directories. Metadata for future captures uses relative recording paths; original production metadata is preserved.
- Both renderers now resolve old absolute recording metadata portably by package/raw basename fallback, use fresh temporary intermediate/caption/mix directories, rebuild every scene and write only new previews. They refuse either frozen delivery filename and any existing output. No capture/render was executed. Added media/archive instructions.
- Recorded narration provenance from local installed model README: Supertonic 3 int8 package identity, M2/F1 distinctions, upstream source, sample MIT vs model OpenRAIL-M. Retained the actual model license retrieved from its linked Hugging Face source and local sample-code MIT notice. Exact historical Voicebox build/model download revision/synthesis settings remain explicitly unknown, not fabricated. Added public credit pointer.
- Added a separate pull-request typecheck/build workflow (`.github/workflows/build.yml`), no deployment permissions and no tests.
- Harness start/server refuse existing round directories and invalid/traversing IDs; unique exclusive startup log plus child-PID marker prevents stale READY. Startup runs local TypeScript/Vite entrypoints without npx shell interpolation and stops on typecheck failure with durable diagnostics. Browser selection supports explicit executable/channel and otherwise precise Playwright Chromium guidance, no assumed Windows/Edge fallback.
- Harness activity summary now includes ready-to-finish observation window, initial/between/terminal/no-action gaps, and explicit dispatched-action definition including coordination; it makes no boredom/enjoyment inference.
- Historical overnight workflow defaults to refusal unless a new recorded user authorization explicitly permits gameplay changes and autonomous commits; optional publishing requires its own flag as well as pushToMain. Corrected public scope comments, propagated authorization note into agent instructions, removed the hard-reset recovery instruction and documented that this tool is unsuitable for frozen post-submission polish. It was not executed.

## Actual verification

- All seven selected runtime audio files match their pre-existing selected.json SHA-256 values.
- Both final MP4 copies still match `c297c588f2a5dc876396943788cb272d7f3e5d55932e2395fc03e9e6ae3fcf35` and the new frozen-reference record.
- Social art and displayed archive Earth match `game/src/shell/assets/title-earth.webp` byte for byte. Original unlabelled archive source remains retained; source title, portraits, audio, poster and video were not edited.
- Five downloaded font binaries match retained manifest hashes; fc-scan identifies the required families/styles. Original OFL license contents inspected.
- Node syntax checks passed for harness start/server, shared media module and both capture scripts. Python compile checks passed for helper and both renderers. Both render CLI help commands work. Both frozen-output refusal paths were exercised and stopped before ffmpeg/work-directory creation.
- Overnight workflow compiles inside its actual async-function host wrapper. Plain `node --check` is inapplicable to this historical custom-host format because its pre-existing top-level returns are intentional; no workflow steps were run.
- `git diff --check` passed after changes. No test suite was added/run. No commit, push, workflow run, upload, media rendering or deployment.

## Verification still owned by parent / limits

Parent handles the full production build, deployment-source exclusion, consolidated detector and rendered browser pass (/credits/, /submission/ portrait/tablet/low height, local font requests). No independent UI visual verification is claimed here. Existing-round CLI walkthrough was not performed because this checkout has no existing run directories; refusal control flow was source-reviewed. A new harness session, induced typecheck-failure session, browser discovery on every platform and remote GitHub Actions execution were not run. The historical submission source/timestamp and exact narration-generation settings remain unknowable from retained evidence; documents label them unknown.

## Files / coordination

Owned `game/public/**`, `game/index.html`, THIRD_PARTY, new `.github/workflows/build.yml`, dev/audio-audit archive, video production scripts/docs/licenses, harness start/server/OPERATIONS, historical loop/README, docs/submission-reference. Root owns Vite/build identity and global checks; ui_design owns in-game credits link; docs_public owns root/documentation entry points. Existing untracked video media were preserved.

## Independent review follow-up: readiness binding race

The reviewer identified that API listen was asynchronous while READY was synchronous. `startApi()` now returns a Promise that resolves only in the listen callback and rejects on bind error; main awaits it before the observation clock/READY and records `startup-error.txt`, closes the browser/game listener, and exits on failure. Game listener startup also rejects bind errors instead of hanging. `start.mjs` checks both the exit event and child exit/signal properties before inspecting READY. This is source/syntax verified; no harness session or test suite was run.
