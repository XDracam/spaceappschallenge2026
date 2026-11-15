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
