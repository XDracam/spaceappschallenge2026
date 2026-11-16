# Mission Control submission video

Final export: `Mission-Control-Submission.mp4` — 29.000 seconds, 1920×1080, 30 fps, H.264/AAC, approximately 4.2 MB.

The video uses recorded screens from the current local game, a prepared camera comparison, and an actual live planning prediction. It does not depict a completed flight or a human multiplayer playtest. The narration and on-screen labels reflect that distinction.

Narration: local Voicebox Supertonic 3, English F1. Music: the actual game music, `game/public/audio/music.mp3` (“The Magnificent Cosmos”, Adiutorium, CC0), reduced below narration and faded. AI artwork/narration labels are burned in. Copy the accompanying `VIDEO-DESCRIPTION.txt` when hosting the video.

Production scripts: `capture.mjs` captures local game screens into `raw/`, using the installed Playwright runtime and Vite at port 5199. `render.py` cuts the capture, adds captions and overlays, mixes narration/music and exports MP4. `assets/` retains narration and captions. No public deployment or upload was performed.

Verification: ffprobe confirms 29.000-second duration, 1920×1080, 30 fps and H.264/AAC. A six-frame contact sheet was visually inspected for the opening, camera comparison, three stations and planning evaluation. No extended test suite was run.

## Portable tooling update — November 16, 2026

Use the [media tooling instructions](../README.md). Capture creates a fresh directory; rendering rebuilds every cut in a fresh temporary work directory and writes a new preview, refusing frozen submission filenames or existing outputs. Existing final media, source WAVs and screenshots are unchanged. The historical production observations above remain dated evidence, not new execution results.
