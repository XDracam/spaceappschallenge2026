# Implementation walkthrough — 2026-11-15 — explicit request links and Schedule

- Status: completed implementation verification; multiplayer playtest not performed.
- Facilitator: Codex; Terra implemented coordination changes and Luna independently reviewed the resulting source.
- Participants / roles: one operator in Communications, using the isolated Weather satellite save on port 5176. Reducer walkthroughs additionally used Planner, Science, Procurement and Communications actions.
- Prototype: D-020 engineering tree, D-021–D-024 shared coordination.
- Question: can request grouping and common navigation become simpler without losing independent requests or role actions?

## Hypothesis

Explicit parent selection and one date-sorted schedule should support shared context while preserving separate request ownership, state and history. Grouped work must retain any required role contribution.

## Setup

Resumed the earlier isolated Weather satellite scenario at paused day 5, available budget 6.2 M, with nine published needs and the earlier independent engine purchase. No launch occurred. This deliberately constrained verification state is not evidence of mission balance.

## Actual browser sequence

1. Created “Review camera delivery date,” selected Orbital camera as Related need and entered 2030-03-31. It appeared inside the camera need with independent controls and an explicit From/For display.
2. Schedule displayed the request alongside camera research, antenna research, delivery and supply dates, with the current launch date above the list.
3. Completed the request. It disappeared from open Schedule; Include history exposed its Completed state and Reopen control. Reopened the same request.
4. Edited its parent to Standalone. An invalid date, 2030-02-31, produced in-app validation and disabled Save. Corrected the date and saved. The request remained independently visible after resume with no parent association.
5. Relinked that request to Orbital camera. Created a separate, unlinked “Review agency launch commitment” dated 2030-04-15. Both appeared independently in date order.
6. Completed the camera request again and enabled history. The camera request was Completed while the agency commitment still showed Action needed and its own complete/edit/withdraw controls.
7. Inspected the default-size rendered Schedule. Requested Full HD layout bounds were also checked (panel right 1902 within a 1920-wide document, no document horizontal overflow); the browser screenshot surface clipped that overridden viewport, so the saved visual preview uses the default viewport. Reset the override before finishing.

The generic form showed only Shared request and Funding. Contextual/legacy purposes remain available only when those existing values are being edited. Date entry uses a text field and in-app validation, without invoking a native date picker or native confirmation dialogs.

## Additional state walkthrough

A temporary script outside the repository exercised actual reducer actions and printed the resulting projections. It did not add a repository test or run a test suite.

- Explicit selection nested `coord-linked`; a separately authored request mentioning camera wording remained standalone. The dated linked request appeared in Schedule.
- Completion retained the linked request in parent history. Reopening incremented its revision; an edit using stale revision 1 did not overwrite revision 3.
- Replacing the associated part withdrew its original need. The open request remained standalone with its original parent ID and unchanged description. Unlinking retained its request ID and cleared the association/date.
- Started actual Larger sensor arrays research, then constructed its paused-info state. The parent camera need retained Communications' “Review the blocked technology” action and a typed `commsProjects` destination.
- Signed a fitting engine Contract, then constructed a delivered-allocation fixture and an available matching partner Offer. The supply need was Completed; the Offer still appeared as an actionable Procurement task, and optional testing remained in overview.
- Started the delivered part's test through the actual action and moved launch earlier. The parent Planner action's destination was `launch`.

Constructed paused/delivered/Offer fixtures establish derivation behavior, not real-time event delivery or a full multiplayer scenario.

## Committed plan and resolution

No mission resolution was attempted. Request completion was manual and independent of mission success. No gameplay result or multiplayer-enjoyment claim follows from these checks.

## Source review and checks

- Luna found the requested association, unlinking, history, orphan visibility, Schedule, purpose compatibility, waiting summary and role-action preservation in the implementation. Parent rows offer one primary destination per role; each related record retains its own navigation and role-action display for additional work.
- TypeScript typecheck and Vite production build passed. Vite retains its over-500-kB JavaScript warning (about 565 kB before gzip).
- Impeccable's static detector scanned the changed board, CSS and Science UI without reported findings. Its parsed-page contrast/text-size checks did not run. A fresh Web Interface Guidelines fetch failed DNS; no successful fresh fetch is claimed.
- `git diff --check` passed. Source scans found no native `alert`, `confirm` or `prompt` calls and no action-copy-based navigation/grouping checks. Legacy request/effect text recognition remains for older saved records.
- No tests were added or test suite run. No commit or push was made.

## Follow-up

Observe concurrent request editing and network handoffs in a future multiplayer session. Keep the explicit-parent rule, independent statuses, authored mission-constraint acknowledgements, obsolete-commitment reconciliation and optional-test visibility. D-024 records the accepted direction; I-090 preserves its review rationale.
