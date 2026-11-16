# HTTPS handover — November 15, 2026

**Resolved November 16 around 00:36 CET:** certificate approved, HTTPS enforcement enabled, game/submission/video TLS and HTTP redirects verified. See the [resolution and browser checks](2026-11-16-pages-https-research.md#resolution--approximately-0036-cet). Earlier observations below are retained as history.

## User report

The user reported a certificate-name error at `https://missioncontrol.dractec.com`, with GitHub Pages stuck at `authorization_created` and HTTPS enforcement off. They requested removal and re-registration of the Pages custom domain, followed by enforcement once a certificate is issued. They also requested verification of the live `/submission` URL.

The reported room-opening hang occurred in a teammate's browser, not the user's browser (clarification during this investigation). Its browser/version and console errors are not known.

## Observed checks, approximately 23:46–23:50 CET

- The authenticated GitHub account has repository admin permission. The Pages custom domain was removed and immediately re-added successfully through the Pages API. Subsequent reads still reported `authorization_created` and `https_enforced: false`; certificate issuance is not established.
- Public DNS resolves through `xdracam.github.io` to GitHub Pages addresses. Effective CAA records include `issue "letsencrypt.org"`.
- GitHub's Pages health result reports `is_valid: true`, `is_https_eligible: true`, `is_proxied: false`, `caa_error: null`, and `https_error: "peer_failed_verification"`.
- Certificate-validating requests to both the HTTPS root and `/submission` fail with a hostname mismatch. No certificate checks were bypassed.
- HTTP `/submission` returns 301 to `/submission/`. That page returns 200 and the expected trailer HTML; `/submission/T-Minus-Submission.mp4` returns 200 with `Content-Type: video/mp4` and a length of 16,777,426 bytes. This establishes delivery, not video playback.
- A browser walkthrough opened a room on localhost (`AUP-7JJ`) and connected a second local tab to it. The deployed HTTP build also opened a room (`VX6-CX3`). The teammate's hang was not reproduced, and no networking code was changed.
- Local HEAD and remote `main` both resolve to `591749b6c9b1e65a738de7bffdf798bcc1103275`.

Follow-up: GitHub still reported `authorization_created` after repeated checks. An attempt to enable enforcement was rejected by automatic approval review before execution because issuance had not completed. Enforcement remains off; it must only be enabled after certificate issuance.

No automated tests, commits, pushes or code deployments were performed. The pre-existing untracked `video/` directory was preserved.

## Remaining verification

Wait for GitHub certificate issuance, enable HTTPS enforcement, then verify certificate-validating requests to the root, `/submission`, `/submission/` and the MP4, as well as HTTP-to-HTTPS redirects. A working local room does not resolve the teammate-specific report.
