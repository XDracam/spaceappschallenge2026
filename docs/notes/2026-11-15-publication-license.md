# Publication license and reference image — November 15, 2026

## User direction

> then delete the reference image, and add a license that'd be sensible and applicable to the nasa spaceapps hackathon

## Implementation

Selected Apache 2.0 for original project material and added the license text and README notice. The terms text was copied from the installed TypeScript package's Apache 2.0 license (sections 1–9, through END OF TERMS AND CONDITIONS), without changing its terms. Existing third-party notices remain in place.

Checked the [official 2026 participant terms](https://www.spaceappschallenge.org/legal/), updated August 7, 2026, on November 15, 2026. The intellectual-property section requires unrestricted or OSI open-source original content and uses Apache 2.0 as NASA's default. Third-party materials require license documentation, and all resources used require citation. This is a licensing check, not a complete submission review.

Deleted `mission-planner/notes/reference/ui-style-reference.webp` from the working tree and replaced its link with a historical description. Original quoted user notes are preserved. The image still exists in earlier commits; publishing existing history would expose that copy. No history rewrite, commit, push or visibility change was performed.

## Attribution follow-up

The user subsequently requested: "then do necessary attribution". Added `THIRD_PARTY.md` with submission source credits and all 128 locked package entries, plus `game/public/THIRD_PARTY_NOTICES.txt` containing the runtime Preact MIT notice, font copyrights/OFL terms, existing Lucide notice, tool credits and caniuse-lite attribution/CC-BY-4.0 terms. `game/public/LICENSE.txt` copies the project's Apache terms. Vite copies both public text files into each production build; README links explain their location and preservation. No dependency versions changed. Fonts are served externally; Lucide and IBM Plex Mono belong to the earlier procurement mockup. Portal references and resources used outside this checkout still require the team's review.

## Publication cleanup follow-up — November 15, 2026

The [publication cleanup record](2026-11-15-publication-cleanup.md) documents marked note redactions and a verified isolated history rewrite removing the reference image from both published branches. That initial preparation was local only; the user subsequently authorized replacement of the remote history after verification, recorded in the cleanup follow-up. The earlier implementation record above describes the state at that time.
