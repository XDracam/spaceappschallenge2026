# Assets, identity, attribution and submission audit — 2026-11-16

Read-only audit. No media, implementation or historical notes edited. No tests run. Inspected required project guidance/current decisions, public asset tree, credit/license records, selected audio metadata/hashes, both video-production packages, final MP4 properties, actual final-video title/result frames, existing final contact sheet, portraits montage, and audition artwork. No live external licensing revalidation or listening session; license conclusions below concern recorded evidence and consistency, not new legal clearance.

## Main conclusion

The strongest professional improvement is editorial and release discipline, not replacing the art. Runtime assets are already small, consistent and attributed; the release still carries development material, divergent branding/provenance records, and nonportable media tooling. Preserve the accepted title composition, portraits, station geometry, hardware drawings and selected sounds. D-034 explicitly restored the original station identity after rejecting a broad visual theme.

## Submission visual baseline (verified)

- `game/public/submission/T-Minus-Submission.mp4` and `video/t-minus/T-Minus-Submission.mp4` have identical SHA-256 hashes. This establishes which local delivery file the hosted page points to, not independent confirmation of the upload the user submitted.
- ffprobe: 29.500 seconds, 1920×1080, 30 fps, H.264/AAC, 16,777,426 bytes (16.00 MiB).
- `video/t-minus/README.md:3-11` explicitly supersedes the 29-second Mission Control version. The latter remains in untracked `video/submission/` as historical production material.
- Actual MP4 frame at 6.0s shows the accepted Earth/satellite art, T-MINUS, four-player premise, event text, visible image watermark plus persistent AI artwork/narration label. Frame at 24.8s shows 2/2 main goals and 0/2 optional. Contact sheet confirms Planner map/configurator, Science tree, Procurement catalogue/engine inspector, Comms projects, flight playback and result.
- Consequently, avoid changing those broad compositions, station visual language, role/goal names and gameplay. Connection recovery, credits, build packaging, accessibility metadata and public documentation offer substantial safe work outside those shots. Screenshot overlap still needs per-change checking.

## Findings

### A01 — P1: Release publishes an unlabelled copy of the generated title image
Evidence: `game/public/audio-audit/earth.webp`; used by `game/public/audio-audit/audit.js:40`. It is 1672×941 and visually matches the title Earth/satellite composition. Direct inspection finds no visible AI-generation label; byte inspection finds neither `AI-generated` nor `trainedAlgorithmicMedia`, and ImageMagick finds no EXIF ImageDescription. In contrast all 15 runtime portraits and `game/src/shell/assets/title-earth.webp` contain the expected description/XMP markers. `THIRD_PARTY.md:22-25` claims each image is labelled and future images follow the policy.
Impact: the publicly deployed development page breaks the project’s own provenance/disclosure promise even though the actual title image and final video are labelled. This is not evidence that the submitted trailer lacks labels.
Recommendation: exclude the audition sandbox from the public release, retaining the development archive. If intentionally publishing the sandbox, use the already-labelled title source with metadata retained and explicitly credit its provenance. Do not remove labels to make the project appear less AI-produced.
Risk: safe; main game/video unchanged.

### A02 — P2: Ship the game rather than its audio-selection workbench
Evidence: `game/public/audio-audit/` contains 62 files / 7.59 MiB including 38 previews, rejected-selection metadata and plain-HTML source snapshots. `game/vite.config.ts:6-10` has no public-directory exclusion. Vite’s public directory is therefore the release source; parent should verify exact built output. Runtime uses only `audio/*.mp3` through `game/src/audio/gameAudio.ts:22`, not this sandbox.
Impact: deployment and source downloads carry an internal, unfinished-feeling side product, duplicate art, alternative licensing obligations and selection copy. This does not mean every player downloads all 7.59 MiB at startup; files are separate requests.
Recommendation: move development audition materials outside the deployed public tree and keep an explicit dev command/link. Preserve candidate source/license evidence and rejected history rather than deleting them.
Risk: safe to gameplay and trailer; update archive links together.

### A03 — P2: Submission hosting page can overflow in portrait/tablet layouts
Evidence: `game/public/submission/index.html:21-23` replaces `width:100%` with `calc(177.7778vh - 263px)` whenever viewport width is at least 640px; only `max-width:1120px` limits it. At 800×1000 the CSS resolves to 1120px inside a 752px body. At 640×900 it resolves to 1120px inside 592px. This is direct CSS arithmetic; no live screenshot performed by this packet.
Impact: trailer/player and links extend beyond the viewport on a shareable public page, even though the game targets desktop.
Recommendation: retain the video and its poster exactly; bound the wrapper by available width as well as height, e.g. `width:min(100%, calc(177.7778vh - 263px))` plus sensible positive minimum behavior. Verify narrow portrait, desktop and low-height windows.
Risk: safe; affects wrapper, not submitted visuals inside video.

### A04 — P2: Credits are comprehensive but not discoverable inside the actual game
Evidence: title footer `game/src/shell/Lobby.tsx:287` contains event/premise spans only. Repository-wide `rg` for `THIRD_PARTY|CREDITS|LICENSE` under `game/src` returns no matches. The separate submission page provides credits, but gameplay itself exposes neither those notices nor its selected-audio list.
Impact: reviewers see AI-labelled portraits but cannot discover attribution or authorship through game UI; the work appears less owned and curated than the underlying credit records warrant.
Recommendation: add a compact Credits/About link outside the recorded station compositions (setup footer or settings). Present concise team/concept, code/tool disclosure, audio and source links; link full notices instead of dumping dependency inventory into play. Keep required disclosures visible.
Risk: safe mechanics; minor title/setup visual change requires shot comparison.

### A05 — P2: Stable typography still depends on Google Fonts availability
Evidence: `game/index.html:7-9` requests Exo 2/Inter from Google Fonts. `THIRD_PARTY.md:13-16` confirms no font files are bundled. All 15 portraits are local 384×384 WebP (16–29 KB each) and title art is only 104,844 bytes, so image weight is already disciplined.
Impact: first load on restricted/offline venue networks may use fallback typography and alter wrapping/visual identity despite an unchanged app. This audit does not establish an observed outage.
Recommendation: self-host precisely the used font families/weights with existing OFL notices. Preserve the current fonts, metrics, CSS and visual identity; confirm before/after screenshots and loading requests. Do not introduce a new font as a professionalization exercise.
Risk: behavior-preserving; visible appearance should remain identical after fonts load.

### A06 — P2: Video reproduction claims exceed portable tooling
Evidence: `video/t-minus/README.md:5` says scripts reproduce capture/edit with installed tools. Both `capture.mjs:1` imports hard-code the author’s `/home/dracam/.cache/.../playwright-core/index.mjs`; final capture uses fixed localhost port 5199 at line 7. `video/t-minus/assets/capture.json:2` stores an absolute workstation source recording path. `video/t-minus/render.py:4` consumes it directly. Render dependencies also assume ffmpeg/ffprobe, libass and Noto Sans without a portable dependency recipe. Narration-generation tooling/model version beyond the prose name is not included.
Impact: a fresh contributor cannot reproduce the advertised artifact with repo-relative commands; machine leftovers undermine public technical credibility.
Recommendation: document exact media tool versions and optional requirements; resolve source recordings relative to the package, parameterize URL, and use a declared local Playwright dependency/import. State separately that retained WAVs reproduce the edit while recreating narration needs the original model/settings. Preserve exports unchanged.
Risk: safe tooling/documentation; no gameplay change.

### A07 — P2: Renderer silently reuses stale scene cuts
Evidence: `video/t-minus/render.py:11` returns immediately when `raw/scene-{i}.mp4` exists. It does not compare source, crop, timing or code hashes.
Impact: changing the capture or edit instructions can produce an apparently successful export containing old scenes. This is a concrete cache-invalidation issue, not a claim that the current final file is stale.
Recommendation: make clean rebuild explicit/default or key scene caches on source and edit parameters. Add a source/export manifest and hashes. Keep the submitted final export frozen.
Risk: safe tooling; do not rerender or replace delivery video as a side effect.

### A08 — P2: Current result evidence contains a credibility-damaging contradiction
Evidence: actual final-video frame at 24.8s says “Reach geostationary orbit” succeeded while both optional goal explanations say “The plan does not reach geostationary orbit: orbit at 200 km, needs 35,786 ± 2,000 km”. It also records 3 part failures. Exact frame retained for parent at `/tmp/nasa-submission-result.png`.
Impact: a careful viewer cannot tell whether the world state, rescue mechanism or explanation is authoritative. This makes a real simulation look like a prepared mock result even though the capture uses game actions.
Recommendation: have code audit trace goal-result reasoning and explain actual outcome facts consistently. Fix only explanatory text if that is the defect; altering result mechanics is outside this audit’s accepted scope. Do not edit the submitted video or hide the unsuccessful optional goals.
Risk: medium; code investigation needed to establish whether fix is copy-only versus gameplay-changing. Parent/code reviewer notified.

### A09 — P3: Final deliverable, raw media and historical draft lack a release manifest
Evidence: `video/` has 89 files / 96.94 MiB, currently untracked in the shared checkout; both old/new exports, raw assembled/scene files, WAV intermediates and source WebMs coexist. The final video is duplicated in `game/public/submission/` and `video/t-minus/`. No current byte hash manifest identifies frozen submission artifacts.
Impact: easily selecting or publishing the wrong draft, bloated future commits, and inability to distinguish submitted version from later polish. The duplication is currently byte-identical, so it is not a current mismatch.
Recommendation: add a small manifest recording authoritative submission version, SHA-256, date, size, source revision and delivery location. Separate source recordings/intermediates, archive the superseded draft, and document what belongs in Git versus a release/media archive. Do not delete the user’s untracked files or rewrite history.
Risk: safe organization if authorized later; preserve all source work.

### A10 — P3: Technical and public names are mixed without a clear naming boundary
Evidence: public app/video use T-Minus (`game/index.html:6`, `video/t-minus/README.md:1`); `game/public/audio/CREDITS.txt:1` and several notice headings still say Mission Control/Space Mission Design Game. Browser storage keys use `mission-control-*` and package is `mission-control-game`, which are internal stable identities rather than user-facing defects.
Impact: multiple public-facing titles feel like an unfinished rename and complicate attribution searches.
Recommendation: standardize current public-facing headings to “T-Minus” with “formerly Mission Control” only where historically useful. Preserve historical notes and stable storage/network/package identifiers unless there is a real migration reason. Never global-replace old names through history or saved-game keys.
Risk: safe editorial; no video rewrite.

### A11 — P3: Sharing metadata is thinner than the presentation itself
Evidence: `game/index.html:4-9` contains title/viewport/fonts but no description, favicon, social preview metadata or theme-color. Submission page has description but no social image/Open Graph tags (`game/public/submission/index.html:4-7`).
Impact: shared links do not communicate the specific cooperative game or show its art; generic browser tab icon makes the project look unfinished outside the recorded footage.
Recommendation: add accurate concise description, favicon based on existing neutral project art, theme color and social card metadata. Reuse labelled approved artwork, retain AI provenance, and avoid NASA logos/endorsement claims. Verify URLs against the actual custom-domain base and deployed image.
Risk: safe mechanics and recorded game composition.

### A12 — P2: Narration provenance is identified, but model terms are not retained with other media evidence
Evidence: `game/public/submission/credits.txt:11` and `video/t-minus/README.md:9` identify local Voicebox Supertonic 3 M2. Existing third-party records meticulously retain sound-source terms and edits, but these video documents do not link the exact synthesis model/tool source, version/license or voice source terms. No claim of a license violation follows from this absence.
Impact: another person can audit game-sound sources more easily than the AI narration used in the public final video.
Recommendation: retain the precise model/tool source and applicable terms, version/settings where available, and a clear synthesized-voice disclosure. Do not fabricate a model version or claim fresh clearance without checking the actual local generation source. Current WAVs and final video stay unchanged.
Risk: safe evidence/documentation; external verification needed before asserting rights.

## Positive findings to preserve

- Every selected runtime audio file’s SHA-256 matches `selected.json`’s previewSHA256; all seven files match, with sources, authors, license URLs, exact edits and dates recorded. Existing NASA source JSON marks the pad recording public domain, and CC0/CC-BY candidate obligations are distinguished. No fresh upstream verification was performed.
- All 15 runtime portraits and the title WebP carry EXIF description and trainedAlgorithmicMedia XMP. The actual inspected final video frames visibly disclose generated art and narration. Portraits consistently use a cohesive rim-lit style, circular dark framing and visible label; replacing them en masse would disrupt existing identity without addressing release discipline.
- Title art is compact WebP (~102 KiB), portraits together roughly 322 KiB. No blanket “optimize all images” initiative is justified by these sizes.
- Submission video is H.264/AAC, includes a poster, native controls, playsinline, metadata-only preload, a direct download and a linked credit file. Native controls are a professional baseline worth preserving.
- Media documentation explicitly distinguishes prepared single-browser capture from human multiplayer validation, and actual main-goal success from unsuccessful optional goals. Keep that candor while tightening stale handoff prose.
- A full hardware-family illustration correction was already recorded under `docs/notes/2026-11-15-procurement-artwork.md`; video shows those catalogue drawings. Do not restart a broad art makeover or generic “flat icon” replacement.

## Verification limits

No full video listening pass, full frame-by-frame review, live device playback/streaming measurement, upstream source/license revalidation, fresh build or browser responsive check in this packet. The page overflow is source arithmetic. Video-visible scope follows local final export/contact sheet and actual sampled frames; the user’s statement confirms submission, but this audit cannot independently identify an external uploaded file. The remaining external publication-cleanup follow-up recorded in `docs/notes/2026-11-15-publication-cleanup.md` is historical and should not be silently treated as resolved.
