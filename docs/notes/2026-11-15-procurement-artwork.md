# Procurement part geometry — November 15, 2026

User direction: “the parts in the procurement UI - they often look geometrically poorly. Launch a set of subagents to in parallel check and improve all of these for consistency and believability. no obvious logical flaws. be efficient and fast”.

Three parallel implementation agents covered propulsion/tanks, instruments/antennas, and power/structures/protection. The parent integrated and reviewed their output. Existing unrelated audio and station styling work was preserved.

## Implemented

- All 21 hardware-family drawings revised, covering all 77 catalogue resources. Engine/tank propellant variants now have separate symbols; spectrometer, sounding radar and thermal protection no longer reuse unrelated components.
- Joined enclosure faces, aligned optical apertures, contained solar grid, braced gear, dish/feed supports, sealed tank contours and RTG fins. Render review caught and corrected protruding nozzle ribs and disconnected plumbing.
- Inspector artwork frame now fits the full drawing instead of cropping its top. Palette and procurement behavior retained.

## Observed checks and limits

- All 21 exact-source SVG symbols rendered as contact sheets and visually inspected. Representative instruments inspected in the running catalogue and inspector.
- Browser DOM check: 77 catalogue cards, 21 distinct artwork references, zero missing symbol references. Inspector frame measured 96 px high, drawing 160 × 96 px.
- TypeScript check and Vite production build passed. Vite reports its existing large-bundle advisory. No tests added or run.
- Impeccable detector returned only an existing timeline date-marker border warning, unrelated to the artwork. Fresh Web Interface Guidelines retrieval failed because the source hostname could not resolve; no completed guidelines audit is claimed.
- These are simplified hardware-family illustrations, not dimensioned engineering drawings or bespoke artwork for every performance tier. No multiplayer playtest was performed.

## Solar-panel correction after user review

The user found the first panel awkward. Replaced its single skewed panel and ground-like pedestal with two equal spacecraft array wings, a central hinge/yoke and a compact attachment flange. Both wings and all cell dividers share the same affine projection. Rendered and inspected the result enlarged and at the actual 140 × 84 catalogue and 160 × 96 inspector sizes. TypeScript and diff whitespace checks passed; no tests run.

## Depth and consistency correction

The user rejected the flat second panel and required a believable result consistent with the other icons. Rebuilt the array as a projected assembly: front cell beds, five-unit-thick frame edge faces, paired root hinges, pivot housing and an underlying mounting arm/flange. All vertices derive from the same oblique projection; cell highlights use the existing blue palette and metal uses the shared gradient. Reviewed enlarged and at 140 × 84 beside the actual camera, antenna and RTG SVGs in one rendered comparison, checking material, edge weight, readable depth and connected geometry. These are schematic catalogue family illustrations, not scale engineering models.
