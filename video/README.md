# Submission media sources

The final submitted-local trailer is identified by [the frozen reference](../docs/submission-reference.md). `t-minus/` is the final production package; `submission/` is the superseded Mission Control draft. Keep source recordings, stills and WAVs intact. Intermediates are retained historical evidence, not deployable game assets. The game build serves only the existing final MP4/poster/credits under `game/public/submission/`.

## Optional reproduction environment

Install Node 20+; from `playtest/`, run `npm ci` then `npx playwright-core install chromium`. Both capture scripts resolve that declared dependency, not a developer cache path. Install ffmpeg/ffprobe with libx264, AAC and libass support and Noto Sans for the editorial captions. The original tool versions were not recorded, so frame-identical regeneration is not promised. Retained WAVs reproduce the existing mix inputs; [narration provenance](NARRATION.md) records what is known about their generation.

Serve the game development server separately on localhost (default capture URL `http://127.0.0.1:5199/`; override with `GAME_URL`). Capture commands from the repository root:

```sh
node video/t-minus/capture.mjs
# Or the superseded draft:
node video/submission/capture.mjs
```

A new temporary capture directory is printed. `CAPTURE_OUTPUT` can name a new directory instead; an existing directory is rejected. `VIDEO_BROWSER_EXECUTABLE` can select an installed Chromium-family browser. Capture scripts create prepared demonstration sessions using the existing normal actions and accelerated calendar; they are not independent human playtests. Do not point them at a live player session.

Render an optional new preview without changing the delivery artifact:

```sh
python3 video/t-minus/render.py --capture /path/to/new-capture/assets/capture.json --output /tmp/T-Minus-review.mp4
```

Without `--capture`, the renderer uses retained production recordings. All scene cuts, assembled files, captions and mixed audio go to a new temporary render directory; no stale cut cache is reused. Existing outputs and the two frozen submission filenames are rejected. The default output is a new `*-preview.mp4`; no script copies it into the game release. Rendering was not run for the post-submission tooling fix.

Archive policy: keep final deliverables and source metadata identifiable; retain raw sources outside deployments, and store large future recordings in an explicit media/release archive when the team chooses one. Do not delete untracked source media or rewrite Git history as cleanup.
