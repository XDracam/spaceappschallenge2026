# Shared task coordination walkthrough

- Status — completed implementation walkthrough.
- Date — 2026-11-15.
- Facilitator and participants — one operator controlling a host browser and a second browser acting as a WebRTC client.
- Prototype — integrated `game/` working tree, Weather satellite mission.
- Related direction — D-020 and the [dependency audit](../reviews/2026-11-15-task-coordination.md).
- Question — can the interface carry a cross-role request, its details and its resolution between stations without conversational messages?

## Setup

The preview ran on localhost port 5174 with separate storage from the existing port-5173 saved game. The host began at Mission Planning and the client joined Procurement through the ordinary invite/reply-code flow. The calendar was paused around agency day 5 for request and purchasing checks, then resumed for a Communications event. The mission used its normal authored content and tuning. The randomly selected seed was not recorded.

## Actual sequence

1. Mission Planning created a request for Procurement to review one spare Relay HG-600 antenna, including quantity, data rate, recipient context and need date. Procurement received the exact description over WebRTC. The request appeared in Procurement's actionable filter and was absent from the Planner's actionable filter.
2. Procurement edited the description and reassigned the request to Mission Planning. The updated text and responsibility appeared in the host's actionable list.
3. Mission Planning marked the request complete. The client saw Completed through All tasks with Include history. Mission Planning reopened it, and the client saw the open request again.
4. Mission Planning ordered all nine draft parts. Procurement's shared board showed nine supply entries, with current minimum specifications, quantities and dates.
5. Procurement opened the engine supply task and reached the exact need inspector. Through the ordinary offer-review and order-confirmation UI, the client ordered one Taiga KL-2000 from Swiftworks Orbital for 38.2 M. The on-time fully contracted need left Procurement's actionable filter. The host's All tasks still showed one allocated unit, no missing quantity, the supplier and expected May 8 arrival.
6. The host switched to Science, combined Detector noise & cooling with Stereo imaging and drafted Low-noise stereo camera. Create equipment task opened an editable request containing the Science destination, one Camera test unit, minimum performance 3, estimated result date, optional bonus and reservation instructions. Saving it made the request appear at Procurement. Science then started the project, and All tasks showed its expected result date, base odds and potential research effect.
7. The host switched to Communications and started Meridian's ground station through the project picker. The shared board showed its expected date and authored effects. The calendar produced The old satellite is blinking. Its task showed the message, response deadline, choices, concrete effects and ignored outcome. Open work selected that inbox event. Choosing the Science tour completed its task and exposed the active research-pace modifier in All tasks.
8. Reloading the host and using Resume hosted game preserved the equipment request, procurement state, Science project and Communications project. A host reload ends the current peer connection, as expected from the existing architecture.
9. After the user's correction about native popups, the launch action displayed the shared in-app confirmation. Browser inspection found no native JavaScript dialog. Cancel closed the panel and left the game in planning.
10. Communications answered Before storm season, please with the launch commitment. The game created a Planner-assigned constraint request containing its source event and exact authored text. Editing its working description retained a separate original requirement. The request appeared in the Planner's actionable filter. The Planner completed it after reviewing the retained launch date, and history showed Completed without restoring a duplicate constraint notice.
11. The final in-app launch confirmation had an inert background. Tab moved focus from Cancel to the named action, and Escape closed the confirmation. Browser inspection again found no native dialog.

## Additional model checks

Terra reported isolated reducer/state walkthroughs for stale request revisions, create/edit/complete/reopen, supply completion/reopening after allocation release, and manually completed mission-constraint requests. Its constructed weather-orbit example used a 150 kbps antenna against a 225 kbps requirement. Enabling the authored ground station removed the data issue because the modeled demand became 112.5 kbps. Those checks used constructed state and do not establish full gameplay flows.

## Visual observations

The shared board rendered at 1280×720 and the project's Full HD 1920×1080 station size. The switch, list, long requirement text, role actions and scroll area were visible. A screenshot was saved at `/tmp/nasa-shared-tasks.jpg`. The in-app confirmation supplied Cancel, a named action, keyboard focus management and an inert background.

## Verification and limits

- Final TypeScript checking and the production build passed. Vite reported a bundle-size warning for the roughly 594 kB main JavaScript chunk before gzip. `git diff --check` passed.
- Impeccable's detector reported no findings for the changed UI targets checked. Web Design Guidelines were fetched and applied to the shared controls.
- This was a two-browser local WebRTC implementation walkthrough. Four independent players, internet connectivity, role engagement and waiting time were not evaluated.
- Authored free-text mission constraints use explicit player review. `launchSlot` and `testFacility` services currently retain their documented simulation limitations. Plan-feasibility entries remain estimates, with the board read-only after planning closes.
- No test suite was added or run. No commit or push was made.

## Follow-up

The broader solution guarantee and multiplayer experience remain open. The implementation preserves those questions and the pre-existing Contract timeline work.

## Later integration note

This record describes the earlier graph-based Science implementation. Its branch-local coordination D-020 and confirmation D-021 references now correspond to D-021 and D-022. The published Science tech-tree decision retains D-020. See the [merge walkthrough](2026-11-15-task-coordination-merge-walkthrough.md) for observations on the integrated version.
