# Audio candidates and contextual audition

## User direction

Date: 2026-11-15. Following the Terra audio shortlist and a discussion of subtle confirmation sounds, the user requested: “go ahead and find good sounds that are free to use with appropriate licensing for each. at least 5 candidates for each sound. Then build me a page to audit the sounds *in context* and pick my fave”. The limited-time hackathon constraint remains in force.

This authorizes candidate research and the audition tool. It does not select final sounds or claim the candidate mix suits multiplayer conversation.

## Direction contract

- Thesis: compare audio through representative player actions and save a small sound set.
- Own world: inherit Mission Control’s dark blue station surfaces, cyan actions, green accepted state, existing Earth artwork and system typography. No new game visual identity.
- Story: choose a sound category, try candidates in its game scene, choose a favorite or silence, then mix and export the selection with licensing.
- First viewport: category navigation at left; candidate rows beside a station preview; effects/music levels and stop above; notes and set playback below. Narrow screens put the scene first.
- Form: a focused local audition extension of the game. Seed: none (pinned by the requested contextual audit task and inherited game interface).
- Finish: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, inherited visual-system comparison, and artwork provenance.

## Delivered material

- Local page: `game/public/audio-audit/index.html`, served by the game’s existing Vite setup at `/audio-audit/index.html` (include `index.html` in the development URL).
- 37 distinct previews: 6 music, 6 launch, and 5 each attention, confirmation, completion, achievement and setback. Candidate files total approximately 6.8 MB.
- [Per-file metadata](../../game/public/audio-audit/candidates.json) records authors, source/download URLs, licenses, edits and original/preview SHA-256 hashes. [Credits](../../game/public/audio-audit/CREDITS.md) and retained source/license evidence accompany the files.
- Music: five CC0 works from OpenGameArt plus Osmic’s CC BY 3.0 work. Short effects: Kenney CC0 packs. Launch: Kenney digital alternatives, an explicitly labeled Antti Luode musical excerpt (CC BY 3.0), and a NASA-authored public-domain pad-camera recording. No claim that the musical work is a real rocket recording.
- Previews are MP3 conversions with documented level adjustment. Music is capped at 75 seconds with edge fades, Antti Luode at 6 seconds, and NASA pad audio uses seconds 9–17. Audition repeats are not evidence of a seamless full-track loop.
- Scenes are illustrative and isolated from game state. They show a title screen, new Comms message, accepted order, research completion, launch and successful/scrubbed results. This tool does not install audio hooks in the actual game.
- Picks, levels and notes use browser-local storage. Export downloads JSON including selected asset metadata and credits. No source assets or final picks are sent to a service.
- Existing Earth artwork was copied unchanged from `game/src/shell/assets/title-earth.webp`; provenance remains the [user-supplied title-art record](2026-11-15-title-screen.md).

## Verification record

All source files were decoded while generating previews; category counts and metadata were checked. JavaScript syntax, TypeScript checking and the game production build passed during implementation. Browser observations and the independent finish verdict follow. No automated test suite was added or run. Subjective sound quality and fit under four players’ live conversation remain for the user’s audition.

- Browser: observed successful music playback, an effect playing alongside music, and successful cue playback for attention, confirmation, completion, NASA launch, achievement and setback. Verified stop, selection persistence through reload, music deselection stopping playback/clearing the mix toggle, and a two-effect chosen-set sequence finishing.
- Export: downloaded and parsed the JSON; it included all seven category decisions and the chosen candidate’s license/source metadata. Removed all temporary QA selections afterward; final page showed `0 of 7 chosen` and no audio elements playing.
- Layout: inspected full-page captures at the browser’s desktop width and 390px mobile width. Corrected a clipped attention result by allowing scene content to determine height. Desktop DOM measurements placed the result bottom inside the scene. The final mobile screenshot also showed the complete result.
- Independent Terra finish review: initially requested fixes for scene clipping and stale background playback on music deselection. The reviewer scored both fixes resolved from final desktop/mobile captures and the supplied browser observation; no material mobile obstruction was evident. This verdict covers those findings, not sound quality or independent license research.
- UI review: applied Web Interface Guidelines to the isolated tool. Impeccable’s mechanical pass flagged small supporting text (raised to 12px) and use of Inter (retained as the existing game convention). No new design system or game-flow redesign was introduced.
- The main game has no new runtime audio hooks. The local Vite preview is retained on port 5178 for the user’s audition; another pre-existing preview on 5173 was left alone.


## Achievement correction after user audition

The user rejected the entire initial achievement pool: five variants from one Kenney family provided little meaningful choice and did not fit. Their on-page note explicitly requested excluding the Kenney sounds. This was a curation failure; the earlier decoding and playback checks did not establish suitability.

Replaced those five candidates with six independent creators/sources: Fupi’s fretless Win Jingle, Brandon75689’s Point bell, qubodup’s Ethereal Dialpad gesture, Listener’s dedicated Win sound, cynicmusic’s cinematic-tagged Victory Fanfare Short, and Jon K. Fite’s brass/percussion Fanfare for the King. Five are CC0; Fite is CC BY 3.0. Full musical phrases and endings are preserved, including the longer fanfares, so the user can judge the full resolution. Source descriptions support the instrumentation labels; subjective fit still requires their audition.

The page now offers 38 active candidates. The old achievement audio files were removed from the shortlist and served assets, while their metadata and rejection reason are retained under `licenses/rejected-achievement-powerups.json`. Other candidate records are unchanged. The browser showed six chosen categories, no achievement pick, and the user’s achievement note before the change; the storage key and persistence code were left untouched.
