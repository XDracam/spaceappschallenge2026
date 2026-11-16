# Submitted project reference

Recorded November 16, 2026, after the user confirmed that the project had been submitted. The precise submission timestamp and source commit used at submission were not supplied; both remain **unknown**. The current checkout is not asserted to be the judged source revision.

- Project URL recorded by this repository: https://missioncontrol.dractec.com/
- Trailer URL recorded by this repository: https://missioncontrol.dractec.com/submission/
## Earlier local export recorded during the audit

- Local final delivery: `game/public/submission/T-Minus-Submission.mp4`
- Production copy: `video/t-minus/T-Minus-Submission.mp4` (byte-identical when recorded)
- SHA-256: `c297c588f2a5dc876396943788cb272d7f3e5d55932e2395fc03e9e6ae3fcf35`
- Size: 16,777,426 bytes
- Container: MP4, H.264/AAC, 1920×1080, 30 fps, 29.500 seconds (ffprobe)
- Superseded draft: `video/submission/Mission-Control-Submission.mp4` (not the final local delivery)

This identifies the local final trailer referenced by the hosting page. It does not independently verify which file was uploaded to an external submission portal. The source recordings, narration and intermediate edits remain preserved in `video/`; they are development sources rather than additional game-release assets.

The submitted trailer and gameplay are frozen for this pass. Subsequent code/documentation polish must not silently replace this MP4 or claim a new build was the submitted build. Record a future release's source/build identity separately. No tag, commit, upload or publication was performed to create this reference.

## Upstream trailer integration — November 16, 2026

Before publishing this audit work, remote commit `906a7f9` replaced the public trailer and poster and introduced Git LFS storage. That update is preserved. The earlier local export above remains archived in `video/t-minus/`; the audit and walkthrough records describe the files present when those checks ran.

Current public file: `game/public/submission/T-Minus-Submission.mp4`. Downloaded LFS payload verified locally with SHA-256 `9cc0791f67c9d2ac09bbc5f68965ab7c547f08b421aa0314965d985594512e2c`; ffprobe reports 19,302,430 bytes and 29.500 seconds. Its [credits](../game/public/submission/credits.txt) identify Microsoft neural text-to-speech (`en-US-ChristopherNeural`, via `edge-tts`). Both build workflows check out LFS payloads. This integration does not establish which export was uploaded to the external submission portal and does not repeat the earlier visual inspection for the replacement.
