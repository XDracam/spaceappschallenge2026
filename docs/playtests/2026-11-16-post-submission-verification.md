# Verification — 2026-11-16 — post-submission finishing pass

- Status: completed, within the explicit limits below.
- Facilitator: Codex coordinating specialist implementation and independent source reviews.
- Participants / roles: agent-operated isolated Chromium contexts; one real manual-code WebRTC host/guest pair. Not a human four-player playtest.
- Source reference: preserved tracked game source at `6fed21a` compared with the working candidate. Historical externally submitted source revision remains unknown.
- Working candidate: [source fingerprint](../reviews/2026-11-16-post-submission-implementation/source-fingerprint.json), SHA-256 `cd2bb5e9464918e54666be2d271a542cd4c36c8a607b5255d12b4cbced85ce07` over the recorded game inputs. Unrelated working files are excluded and preserved.
- Build: [production manifest](../reviews/2026-11-16-post-submission-implementation/build-manifest.json); final compatibility ID `2:a1e762555707304af29b`. Final build includes the snapshot-initialization guard; the actual paired-browser session was rechecked after that fix.
- Save schema: version 8. Browser: Chromium 151.0.7922.34 via installed Playwright, headless Linux; Full HD 1920×1080 for stations, 800×1000 for public pages; reduced-motion emulation explicitly enabled for the motion check.
- Seeds: 20261116 for initial mission/session inspection; 20261115 for the existing prepared trailer route. Calendar paused for interaction checks; prepared-route advancement uses existing game actions/day boundaries.
- Retention: structured observations, source/build manifests, copy proof and selected screenshots are retained in [the implementation evidence directory](../reviews/2026-11-16-post-submission-implementation/). Browser-driving scratch scripts and comparison checkout were temporary local tooling, not a new test suite.
- Scenario/rules: unchanged authored Weather/Moon/Mars missions and submitted gameplay. D-036 authorizes the finishing pass; D-034 and the supplied video/art remain the visual authority.
- Question: do the proposed finish/recovery changes operate through existing actions and preserve the submitted numerical behavior and visual identity on the exercised paths?

## Hypothesis

Precise copy, shared interaction patterns and boundary/release checks can improve trust and usability without changing gameplay. Differing goals, prices, probabilities, outcomes or accepted station styling would count against that claim and require correction.

## Setup

Preserved the original tracked game source separately with the existing dependencies. Inspected current docs, all specialist diffs and independent reviews. Started separate local servers for original source, integrated source and the production build. The existing unrelated port-5173 service was left alone. Browser contexts used isolated local storage and review aliases; they did not operate the user's personal browser session or any public game.

## Actual sequence and observations

| Exercise | Observed result | Retained evidence |
| --- | --- | --- |
| All four stations, original/current | Views loaded; no recorded page exceptions. Fresh Weather/Moon/Mars evaluation objects matched exactly. Early screenshot attempts waited only for the outer station wrapper; these were corrected to wait for the actual loaded view rather than treating a loading fallback as a completed screen. | [Station observations](../reviews/2026-11-16-post-submission-implementation/station-evidence.json) |
| Mission radio keys | ArrowRight selected/focused Moon and changed roving tabindex; Weather was then explicitly selected for session verification. Accepted short Weather/Mars copy remained. | [Session observations](../reviews/2026-11-16-post-submission-implementation/session-evidence.json) |
| Clipboard denied | Both Clipboard API and legacy fallback were deliberately denied in an isolated context; interface said copying failed and retained selectable manual code. | Session observations |
| Actual WebRTC fallback | Host/guest exchanged real invite/reply codes, connected, claimed Planning/Science and started the same mission. Guest started research and created a request with omitted optional arguments. Host received nine needs, one research project, one request and one saved design version. | Session observations |
| Host authority | Connected guest attempted calendar control. Host remained paused; guest saw rejection, discarded the optimistic change and could dismiss the status. Subsequent legitimate station switching/order still worked. | Session observations |
| Procurement modal/order | Initial focus Back; Shift+Tab wrapped to Confirm order inside dialog. Confirmed a 38.2M order; host received one contract. | Session observations |
| Populated save and Continue | Saved state with one contract, research project, request and version loaded identically by JSON comparison. Reload showed Continue and resumed Mission in progress; the guest correctly reported host reload/disconnection. | Session observations |
| Invalid save | `{version:8,meta:{}}` in isolated storage did not prevent title screen. Raw string remained intact; Reset opened in-app confirmation with Cancel focused, wrapped focus, Escape closed and returned to trigger. | Session observations |
| Numeric edit | “not a number” remained as draft, field was invalid, range/error text appeared; Escape restored 4.5. | [Remaining observations](../reviews/2026-11-16-post-submission-implementation/outcome-evidence.json) |
| Heatmap | Arrow keys changed the candidate from 21 Oct 2030 / 8 mo to 6 Nov 2030 / 9 mo; Enter applied departure day 309/travel 263 using existing setter. | [Interaction observations](../reviews/2026-11-16-post-submission-implementation/interaction-evidence.json) |
| Nested modal | Shared confirmation above order made underlying order inert; Escape restored focus to Back in the order and removed its inherited inert state. | Interaction observations |
| Reduced motion | Paused map-canvas screenshot bytes stayed identical across a 350ms sample with reduced-motion preference; intentional playback remains controllable. | Interaction observations |
| Playback | Day advanced to ~190; pause held day 195 across 250ms; resume advanced to ~208. | Interaction observations |
| Comms help | Brand control reopened the current mission briefing; Escape closed it. Project picker received focus inside dialog. | Remaining observations |
| Incompatible builds | Production host and development guest connected via actual manual WebRTC; compatibility failure prevented seat/snapshot adoption and showed reload/rejoin guidance. Guest remained disconnected at no station. | Interaction observations |
| Production release | Planner and Science loaded from final split view code; no observed dev sample control; all five font requests were local, no Google Fonts requests. Credits/submission at 800×1000 had document scrollWidth 800. | Remaining/session observations and [screenshots](../reviews/2026-11-16-post-submission-implementation/images/production-planner.png) |

## Prepared plan and single resolution

Replayed the original trailer-production action sequence independently in the preserved source and updated source, using seed 20261115. It published/supplied nine needs, used existing research/project actions, moved launch after delivery, and resolved each attempt once.

Both runs achieved `goal-geo` and `goal-imagery`, missed `goal-ozone` and `goal-rain`, and returned the same 2/2 required, 0/2 optional, zero bonus result. Exact comparison of the retained evaluation/result/score objects found **six changed string leaves only**: two corrected optional-instrument reasons and four edited in-flight descriptions. All numeric/boolean values, identities, event ordering, goal outcomes and score fields matched.

The old optional reasons denied reaching GEO; the updated ones correctly name the absent spectrometer/radar. [Exact comparison](../reviews/2026-11-16-post-submission-implementation/outcome-comparison.json). This proves equivalence for this concrete prepared route, not all theoretical plans.

## Integration corrections

The walkthrough found lazy-loaded station CSS overriding the accepted Science node corners (6px instead of 4px). Moved all original station CSS, including Planner panels/popups, into the established eager import order before shell overrides; retained lazy JavaScript. Final production Science nodes are 4px, matching the preserved source. Planner numeric field and panel computed radii remain 6px in both original and updated source; font family also matches. Science palette-token expansion exactly reproduces its original stylesheet values.

Independent reviewers also caught a truthful-Comms-preview omission and a fresh READY/bind race in the harness. Authors corrected both; reviewers reread the repair. The production build has one CSS file, avoiding station-load-order dependence.

A final initialization review found that welcome established compatibility before the first snapshot. The client now requires a valid adopted snapshot before replaying broadcasts. A constructed message-order inspection observed lobby state, zero confirmed-action notifications and zero resyncs for a pre-snapshot start action; the same action after snapshot adoption entered planning and emitted one confirmation. The real paired-browser request/research/order/save walkthrough was then repeated successfully. This is a protocol-phase fixture, distinct from actual WebRTC. [Phase evidence](../reviews/2026-11-16-post-submission-implementation/snapshot-phase-evidence.json).

## Compiler, packaging and static checks

- Final TypeScript and Vite production build succeeded, 210 modules. Main JS ~539.86kB / 168.55kB gzip, versus 768.07kB / 239.40kB previously. Vite's >500kB warning remains; shared deterministic rules are intentionally eager.
- 35 authored-data files / 31,042 AST leaves compared; 113 approved display-string changes, zero non-display token differences. Source ID/order/effects preserved. Numerical ion anomaly deliberately untouched.
- Build contains 55 files / 23,093,564 bytes; no `audio-audit/`. Runtime credits, license/notices and local fonts are present. Candidate archive and source terms remain outside the deployed public tree.
- Seven audio hashes and all portraits remain equal to original source. Both frozen trailer copies remain SHA-256 `c297c588f2a5dc876396943788cb272d7f3e5d55932e2395fc03e9e6ae3fcf35`; no capture/rerender performed.
- Direct guard/framing/codec inspections accepted fresh and populated saves, optional argument wire semantics and normal chunk/code roundtrips, and rejected selected malformed inputs. Details in the [code packet](../reviews/2026-11-16-post-submission-implementation/code.md); no test files/suite added.
- New media/harness syntax checks passed; frozen-output refusals observed. Fresh harness session/remote CI were not run. Separate tooling source review verified readiness binding/error flow.
- Performance sample with 30 saved designs (~61k JSON characters), 100 normal ticks: median ~0.8ms, p95 ~2.1ms. This did not justify an invasive store rewrite. [Measurement](../reviews/2026-11-16-post-submission-implementation/profile-evidence.json).
- Final Impeccable scan: five warnings, zero errors; intentional borders/retained fonts reviewed in context. [Raw output](../reviews/2026-11-16-post-submission-implementation/detector.json). Current Web Interface Guidelines fetched November 16 and applied to the actual desktop-game scope, rather than adding URL-synced game state or mobile redesign requirements.

## Interpretation and limits

The exercised paths support the intended gameplay-preserving finish and caught a real integration regression before handoff. They do not prove every save migration, malformed packet, long-session size, network failure or screen-reader workflow. Browser calculations/fixtures, actual local WebRTC and static source checks are distinct evidence. Human multiplayer enjoyment, venue/TURN resilience, physical touch devices and complete WCAG conformance remain unqualified. Historical submitted source/timestamp and exact original narration synthesis settings remain unknown.

## Follow-up

D-036's implementation is complete within the audit's explicit constraints. Keep the gameplay-sensitive ion investigation, rebalance/physics changes, broad redesign and new mechanics deferred. If later work changes state or protocols, use the retained manifests and fresh paired-browser checks. Commit/push/deploy only when requested; none occurred here.
