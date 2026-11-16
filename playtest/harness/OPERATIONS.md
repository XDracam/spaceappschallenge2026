# Harness operations

This tool observes agent-operated browser sessions, not human enjoyment. No round is authorized merely by this document. Gameplay and the submitted video remain frozen during post-submission presentation work. Do not run the historical overnight mechanics-editing workflow for that work.

Install the declared packages from `playtest/` with `npm ci`, then install Chromium with `npx playwright-core install chromium`. The game dependencies must also be installed in `game/`. Node 20+ and a supported Playwright Chromium environment are required. Use a fresh `--round ID` for every session; existing evidence is never reused. IDs permit letters, numbers, dots, underscores and hyphens.

`--browser-executable /absolute/path` (or `PT_BROWSER_EXECUTABLE`) selects an existing Chromium-family executable. `--browser-channel chrome` or `msedge` (`PT_BROWSER_CHANNEL`) opts into an installed vendor browser. Without either, only Playwright's expected Chromium is used; missing browsers produce a precise diagnostic. No Windows-only fallback is assumed.

The harness gates startup on TypeScript and Vite, writing `typecheck.txt` and `build.txt` in the run folder. `--dist PATH` explicitly skips these checks for a prebuilt artifact; meta.json records that skip. The server waits for both the game server and API port to bind before emitting READY; API bind errors produce `startup-error.txt` and stop startup. The launcher rejects existing run directories and checks child exit status before accepting readiness from the current child PID's unique startup log. Failed startup logs remain beside the run folders for diagnosis; ready logs become `harness.log` inside the new run.

Activity summary fields count dispatched non-core actions, including coordination. The observation window begins at READY and ends at each player's finish/session end. Initial, between-action and terminal gaps are separate; no-action sessions retain their full gap. Reading, thinking and spoken conversation are not action dispatches. Never interpret these numbers as boredom, engagement or enjoyment.
