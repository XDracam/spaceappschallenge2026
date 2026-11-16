# GitHub Pages HTTPS setup comparison — November 16, 2026

Source: user requested a step back from retries to research the idiomatic setup and compare it with this deployment. Official sources below were checked during the investigation spanning November 15–16 CET.

## Official guidance and actual configuration

| GitHub guidance | Observed deployment |
| --- | --- |
| Register the custom subdomain in repository Pages settings. | `missioncontrol.dractec.com` is configured; API reports `build_type: workflow`. |
| Point a subdomain CNAME directly to `<owner>.github.io`, without a repository path. | All three authoritative nameservers return `missioncontrol.dractec.com CNAME xdracam.github.io`. |
| GitHub checks DNS, requests a Let's Encrypt certificate, and installs it on Pages TLS termination servers. | API still reports `https_certificate.state: authorization_created`; certificate-validating requests fail on hostname mismatch. The internal reason for incomplete issuance is not exposed by these checks. |
| Applicable CAA records must permit `letsencrypt.org`. | Effective CAA records at the CNAME target permit it; GitHub's completed domain health check reported no CAA error. |
| Custom Actions workflows do not require a `CNAME` file; existing files are ignored. | No `CNAME` file is present. This matches the selected workflow and is not a demonstrated defect. |
| Enable Enforce HTTPS to redirect HTTP requests. | `https_enforced: false`; enforcement remains dependent on issuance. It is not a certificate-request mechanism. |

The workflow uses `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, and `actions/deploy-pages@v4`. Vite takes its base path from the Pages configuration. These build details cannot repair the observed TLS hostname mismatch, which occurs before page content is fetched.

GitHub's troubleshooting page says HTTPS availability can take up to an hour after custom-domain configuration. The management page separately allows up to 24 hours before the Enforce HTTPS option becomes available. These are documented allowances, not a promise that this request will succeed within either interval.

Removing and re-adding the custom domain is documented recovery: GitHub explicitly says this cancels and restarts provisioning. The first reset was immediate; a second reset around 23:54–23:55 CET verified removal (`cname: null`) and paused before restoring the domain. Repeated resets are now stopped so the current request can proceed uninterrupted. The pause is an investigation action, not a GitHub-documented requirement or a proven fix.

The `/submission` page requires no separate TLS configuration. Its MP4 and credits references are relative URLs, so they use HTTPS when the page does. Earlier HTTP delivery checks established that the deployed page and MP4 exist, not that HTTPS works.

## Official sources

- [Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Securing Pages with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Troubleshooting custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages)

See the [initial handover and observed checks](2026-11-15-https-handover.md). No alternative hosting, DNS mutation, code change, commit or push was selected in this research.

## Resolution — approximately 00:36 CET

The user supplied the Pages settings screen showing DNS success and step 1 of 3, then a later screen showing step 3 of 3, **Certificate Active**. The monitoring process independently observed `https_certificate.state: approved` at 00:35:59 CET. The certificate API reports expiry on February 13, 2027. No further domain resets were performed after the research comparison.

A certificate-validating request to HTTPS `/submission` then succeeded and redirected to `/submission/`. HTTPS enforcement was enabled successfully; the API now reports `approved` and `https_enforced: true`.

Observed verification:

- HTTPS `/`, `/submission/` and `/submission/T-Minus-Submission.mp4` each return 200 with successful TLS verification.
- HTTPS `/submission` redirects to HTTPS `/submission/`, then returns 200.
- HTTP `/`, `/submission` and `/submission/` all end at the corresponding HTTPS page with 200 responses.
- The live HTTPS submission page opens in the browser without a certificate interstitial. Its video element reports `readyState: 4`, duration 29.5 seconds, an HTTPS MP4 source and no media error. This establishes browser loading/readiness, not a complete listening or playback review.

The deployment HTTPS issue is resolved. The teammate-specific room-opening report remains separate and was not reproduced in the earlier local/live checks.
