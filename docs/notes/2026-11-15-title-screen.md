# Title screen — November 15, 2026

The user approved building I-095, asking for a ChatGPT image-generation prompt if artwork was needed. The user then rejected the procedural artwork, especially its orbit lines. Those lines, the spacecraft and the cloud texture were removed. The user subsequently supplied the finished Earth-and-satellite image. It now replaces the placeholder, bundled as a 116,862-byte WebP in `game/src/shell/assets/title-earth.webp`.

## Direction contract

- Thesis: a game title screen that establishes the shared mission before connection setup.
- Own world: preserve Exo 2, dark blue space and the four station colors. Pale cyan marks the primary action.
- Story: understand the four roles, then start, join or resume a mission.
- First viewport: large title and compact menu at left; artwork at right; role descriptions and challenge credit below. Compact-height desktop layouts fit at 1280×720; narrow screens use two role columns.
- Form: the user approved the directly proposed composition; no random concept selection or generated comp.
- Behavior: New game opens name and mission selection; Join opens name and invitation entry; Continue uses the existing resume action. Preserve saved-game details. No native popup dialogs.

## Observations and limits

- Browser walkthrough: New game opens both authored missions; Back restores keyboard focus to New game. Join exposes name and invite fields, with Next disabled when no code is supplied; Back returns to the title.
- Observed 1280×720 title bounds: 1280px wide and 720px scroll height. At 390×844, scroll width was 390px and roles used two 161px columns. Also inspected Full HD artwork/layout.
- TypeScript and Vite production build passed. No automated tests added or run. Actual network connection, starting a new mission and resume were not exercised in this pass; their existing callbacks are retained. Existing saved game was preserved.
- Impeccable detector reported only the existing seat-picker accent stripe. Fetching current Web Interface Guidelines failed because network DNS was unavailable; no claim of a completed external-guidelines audit.
- Finished artwork supplied by the user is integrated. Browser checks confirmed image loading and desktop/narrow-screen readability; the 390px viewport had a 390px scroll width. The original procedural canvas and synthetic star field were removed. TypeScript and production build passed after integration. The artwork is imported through Vite so asset URLs follow the configured deployment base. No external image service is used at runtime.

## ChatGPT image prompt

Create a cinematic background for a cooperative space mission design game's title screen. Landscape 16:9, ideally 2560×1440. The left 45% must be nearly black deep-space negative space for a title and menu, with very sparse tiny stars. On the right, a beautifully realistic Earth viewed from low orbit: curved horizon, recognizable blue oceans and continents, delicate white cloud systems, thin blue atmosphere, sunlight grazing its upper-right edge and a deep natural night-side shadow. A small, physically plausible uncrewed scientific satellite with two solar arrays is fully visible in the upper-right quadrant, well inside the frame. Restrained, credible aerospace photography with cinematic scale and rich detail. The lower 15% fades to dark space so interface text remains readable. No text, lettering, logos, borders, interface elements, diagrams, orbit lines, orbital rings, neon effects, lens flares or extra planets. The image must work behind a pale cyan and white interface without competing with it.

## Role and mission icons; menu alignment follow-up

The user requested role icons on the title screen, mission icons in New game, and corrected start-menu alignment. Added original SVG icons with a shared 24-unit viewbox and stroke: rocket, package, flask and broadcast antenna for roles; weather and Mars symbols for missions. Icons are decorative and hidden from assistive technology; visible text remains the accessible name. Mission headers keep their title, tag and selection indicator in explicit columns.

The primary action previously used a 21px inset while the other actions used 5px. All actions now use the same 21px horizontal padding, font size and fixed arrow column. At the observed desktop viewport, all three labels began at x=110.59375 and all arrow right edges were x=418.59375. Browser checks covered role icons, mission icons, switching the selected mission, return focus, and 390×844 layouts with no horizontal overflow. TypeScript and production build passed; no automated tests added or run. Impeccable reported only the pre-existing seat-picker stripe. This follow-up does not change hosting or connection behavior.

## Pre-game design extension

The user explicitly praised the initial title screen and requested consistent design quality across pre-game. D-031 accepts this extension; the original title layout is retained.

### Direction contract

- Thesis: setup remains inside the game's visual world rather than reverting to the earlier glowing-panel form.
- Own world: Exo 2 headlines, pale-cyan rectangular actions, dark blue surfaces, fine separators, original station colors and the supplied Earth image dimmed for legibility.
- Story: choose a destination, assemble a crew, connect and take a station. Keep connection feedback and recovery visible.
- First viewport: New game pairs a large introduction/name field at left with mission selection at right; host/join use a shared compact wordmark and large page heading. Host station choices and invitation controls sit in adjacent columns where space permits.
- Form: direct extension of the user-approved title screen; no replacement identity or new artwork. Narrow layouts stack naturally and remain scrollable.
- Behavior: retain session callbacks and saved-game behavior. Change mission becomes a disclosure. Completed guest connection steps compact on desktop. Mars title phrases remain intact as “Mars orbiter” and “+ lander”.

### Observed verification

- TypeScript and Vite production build passed; no automated tests added or run.
- Browser inspected New game and idle Join at 1280×720, then mission/connected layouts at the larger desktop viewport. Inspected host and New game at 390×844: content scroll width was 380px within the 390px viewport (vertical scrollbar), with no horizontal overflow.
- At narrow width, Mars displayed two intact phrases at different vertical positions: “Mars orbiter” (128.16px wide) and “+ lander” (83.30px wide).
- Created a disposable host on the separate localhost origin, leaving the existing saved game on 127.0.0.1 intact. Room-code joining from the other browser tab succeeded. Science chosen by the host was unavailable to the guest; guest selected Procurement, saw the waiting-for-host feedback, and left. Host's Start mission changed from disabled to enabled after choosing a station. No mission launch was performed.
- Opened/closed Change mission and manual-code disclosures. Existing invite/reply functions are retained; a new manual-code exchange and recovery/reconnection were not exercised in this pass. Closed the disposable room afterward.
- The Impeccable detector reported the old base seat-picker stripe rule; the new lobby styling explicitly hides that pseudo-element. External Web Interface Guidelines were not re-fetched; this is not an external-guidelines compliance claim.

### Description-wrap correction

The user's screenshot clarified that the orphan was “game.” in the mission description, not the mission title. Kept “Long game.” and “Short game.” together with non-breaking spaces and added `text-wrap: pretty` to mission descriptions. Browser ranges confirmed “Long” and “game.” shared the same top coordinate (477.734375px) in the rendered Mars card. TypeScript and whitespace checks passed.

The user also flagged the name-field helper's narrow wrapping. Its independent 30ch cap was shorter than the 340px input. Matched the helper to the input's 340px maximum, removed the separate narrow-screen cap, and enabled pretty wrapping. Browser measurements confirmed both widths at 340px and the same left edge (410.5px).

### Superseding copy simplification

The user rejected the wrapping workarounds and explicitly requested concise single-line text. Replaced mission descriptions with “Reach geostationary orbit.” and “Orbit Mars. Land a probe.”; replaced the name helper with “Bring a crew, or play solo.” Removed non-breaking spaces, forced mission-title phrase spans, description width caps and pretty/balanced wrapping overrides added during those corrections. Browser Range rectangles at 390px confirmed one line for each of the two descriptions and the helper. TypeScript passed. This supersedes the preceding wrap/width corrections.
