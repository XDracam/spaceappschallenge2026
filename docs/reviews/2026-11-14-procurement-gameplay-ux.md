# Procurement station: high-level gameplay UX audit

**Date:** November 14, 2026. **Target:** `procurement/mockups/catalogue-full-hd.html`, adjacent JavaScript and `planner-theme.css`, including the latest other-chat refinements present during inspection. **Status:** observed interface structure plus proposed design requirements. No UI changes, game playthrough, multiplayer session or enjoyment measurements.

## Verdict

Keep the persistent station concept: shared needs, acquisition workspace, and Budget together are appropriate to the accepted catalogue direction. The main design risk is that the player manages isolated records while losing sight of the acquisition plan and live team situation. More polish will not resolve that.

The station should let a player answer three questions without reconstructing several screens: **What needs attention? What can I do about it? What will my choice prevent or enable elsewhere?** This is a proposed design criterion derived from D-004, D-007 and D-010–D-012, not an additional accepted rule.

Priorities below mean *before the next gameplay iteration*, not release compliance. The exact clock, urgency thresholds, risk model and mission outcomes remain open.

## 1. P1 — The mission overview is a scrolling document

**Observed:** at a 1920 × 1080 content viewport, the initial six-Task needs panel had 931 px of content in 912 px of usable height. The authored computer-needs event increased that to 1213 px; the two new Tasks began at approximately y=1026 and y=1167, beyond the panel's visible area. The inspector also overflowed: 992 px of content in 912 px. The initial purchase button was visible; this inspection does not establish that it was hidden in the initial state.

**Gameplay consequence:** the list's presence on screen does not mean the team situation is visible. A player discussing an engine can miss an offscreen new need or impending shortfall. Scrolling repeatedly to check whether anything important changed is maintenance work.

**Proposed requirement:** separate a compact, persistent overview from a browsable detailed queue. Keep the selected Task, current money/time limits, actionable exceptions and a durable indication of offscreen changes available regardless of list position. Do not require every historical Task to fit at once, and do not make incoming events reorder the item under the pointer.

**Reference:** Factorio's character GUI work moved fulfillment status onto the logistics slots instead of requiring a hover to recover it [S1]. This supports placing actionable state at the point of work; it does not prescribe our layout or justify using color alone.

## 2. P1 — The station keeps the wrong context visible

**Observed:** opening Contract inventory replaced the center, while the entire right inspector still displayed Thermal-vacuum bench, its allocation and the prominent Procure button. Calls and Changes similarly use a center overlay while retaining the catalogue inspector. `renderInspector()` follows `state.selected`, independently of the active view. Clicking a need explicitly returns to Catalogue. New views therefore do not consistently mean a new active subject.

**Gameplay consequence:** the right side promises to be the station's action area but can refer to an unrelated object. Space is consumed by stale shopping context while the player works on a Contract. Conversation becomes harder when “this one” can refer to different subjects in adjacent panels.

**Proposed requirement:** establish one clear active subject. The inspector should follow the selected Resource, Contract, Call or affected need, or explicitly preserve a player-pinned comparison. Ordinary selection should have a consistent effect. Keep related actions beside their consequences, and restore a suspended shopping context when the player returns.

**Reference:** PULSAR's historical Compare/swap flow connects comparing a component with installing the replacement [S2]. Factorio combined related minimum/maximum requests after documenting the problems caused by splitting them [S1]. Neither source proves our specific inspector design, but both support organizing around a decision rather than independently persistent panels.

## 3. P1 — Single purchases are legible; the competing acquisition plan is not

**Observed:** the inspector previews money after one purchase. Comparison shows money after one of each candidate. There is no editable, uncommitted multi-need plan showing combined coverage and cost. As an illustrative source check, the six initially featured purchases total **146 credits** against **120 available**: bench 22, researcher 18, Atlas engine 44, spectrometer 29, engineer 24, venue 9. This is one possible bundle, not the cheapest solution, a required purchase list or a balance finding.

**Gameplay consequence:** a player can understand each purchase and still discover too late that the whole plan is unaffordable. Remembering the other proposed purchases and doing arithmetic competes with spoken negotiation. Conversely, an automatic best-option score could remove the very tradeoffs the role should discuss.

**Proposed requirement:** make prospective commitments comparable across needs before signing. A lightweight scratch plan or shortlist could show combined cost, remaining funds, coverage, arrival gaps and alternatives. It should not reserve funds, award Contracts, auto-select a solution or impose a compulsory checkout sequence unless those mechanics are separately selected. Procurement should expose a compromise; planning and science assess their own consequences.

**References:** X-COM's Purchase/Recruit screen shows current funds beside the total proposed purchase cost [S3]. Megaquarium explicitly frames an acquisition in terms of supporting staff, equipment and ongoing costs [S4]. Space Program Manager exposes financial projections [S5]. Borrow the ability to judge a package, not their single-agency authority or economic rules.

## 4. P1 — A Changes inbox is not yet an attention system

**Observed:** the prototype retains a useful durable Changes list and links to needs, Contracts and Calls. Its unread count mixes world changes with procurement's own recorded actions. Funding changes carry no affected-object link; Contract links open the general inventory rather than selecting the relevant Contract. New computer Tasks appeared below the needs viewport. The code provides no separate attention tier for an urgent shortfall versus ordinary history.

**Gameplay consequence:** players may learn to ignore a badge inflated by their own actions, then have to read the inbox to discover what matters. A durable history is valuable, but making history review the routine way to detect danger creates clerical work.

**Proposed requirement:** distinguish **history**, **new information**, and **an unresolved decision with consequences**. Show the relevant impact near the current work and preserve a route to the affected object. Reading a message must not imply solving the issue. Normal updates should not steal focus; any interrupt must be justified by selected timing and consequence rules. No urgency schedule can be finalized until Q-007/Q-016 are resolved.

**Reference:** PULSAR documents notifying the captain about crew component purchases; Barotrauma's money update put wallet and shared-bank balances directly on campaign interfaces [S2, S6]. These are precedents for shared awareness, not evidence that every event deserves an alarm or another player's approval.

## 5. P2 — Repeated interaction can become the role's workload

**Observed:** comparing two candidates uses a selection and Add to compare for each, then a separate Compare action; procurement then returns through Inspect and procure. Buying and allocating use blocking confirmations. Checking supply opens the inventory as a separate mode. These affordances exist, but a player repeatedly moves between discovery, comparison, inventory and commitment.

**Gameplay consequence:** if every ordinary acquisition needs the same review ceremony, the role can feel busy without making new decisions. Long pointer travel between the middle catalogue, lower-right actions and top navigation is most concerning when repeated for every candidate; a screen-wide motion is not automatically a defect.

**Proposed requirement:** organize the common loop so selection, comparison and a relevant action are directly reachable without navigating unrelated records. Preserve candidate sets, filters, list position and unfinished intent through interruptions. Use confirmations where they expose a material commitment or changed facts; do not remove stale-fact protection merely to reduce clicks. Prefer an atomic reallocation preview over releasing and rebuilding reservations piecemeal when a player intends a single move. Reallocation itself remains a player choice.

**References:** Factorio introduced logistic groups to remove repeated edits that its developers called a chore [S7]. It also explains why an extra confirmation was needed to prevent robots acting before a request was finished [S8]. The lesson is to remove repeated bookkeeping while retaining safeguards that serve a real gameplay consequence. The Sourcing Lab's explicit nine-stage teaching flow is a useful limit case, not a template for routine real-time purchases [S9].

## 6. P1 design gate — Browsing more things does not establish concurrent gameplay

**Observed:** this standalone fixture substitutes authored events and manual month advancement for other stations. Calls can remain pending while the catalogue is accessible. That establishes an available interface, not meaningful independent work. No four-player session was observed.

**Gameplay risk:** after obvious purchases are settled, pending funding, research or delivery may leave procurement with nothing consequential to decide. Increasing clicks, notifications or mandatory negotiation would conceal the gap rather than satisfy D-004. “Fits” indicators and reliability percentages likewise cannot establish interesting tradeoffs without selected consequences.

**Proposed requirement:** trace each authored phase with a concrete independent decision for every role, including when preferred routes are blocked. The opportunity must matter to the mission and leave room for conversation. If no such decision exists, revise scenario pacing, role responsibilities or available options before adding interface chores. Do not silently select a new supplier minigame, risk model or guaranteed solution.

**Reference:** EmptyEpsilon's developers explicitly cite limited, boring comms work as a motivation for their game. Its Relay role has probes, waypoints and ship/station communication, with effects on other stations [S10]. That is a stronger concurrency precedent than a management game's shopping screen. Barotrauma and PULSAR distribute spending within a crew [S2, S6]; they do not validate a permanently dedicated buyer.

## Proposed screen contract

These requirements describe information roles, not a mandated arrangement or accepted new rules.

| Surface | May scroll or be temporarily hidden? | Requirement |
| --- | --- | --- |
| Station frame, navigation, money/time constraints | No scrolling out during ordinary station work | Fixed orientation; no whole-page hunt for game controls at the supported station viewport. |
| Active decision summary | No | Keep subject, relevant Task, price/commitment effect, arrival versus need date and actionable blocker together. A compact summary can stay fixed while details scroll. |
| Primary action and escape/back | No during that decision | Predictable location associated with the active subject; no unrelated catalogue purchase action masquerading as context. |
| Mission attention summary | No | Selected need and unresolved consequential changes survive switching views and scrolling. A summary is sufficient; every Task need not remain expanded. |
| Catalogue and detailed Task queue | Yes | Preserve orientation, selection and return position; expose important offscreen changes outside the list. Do not require endless scrolling to rediscover a remembered candidate. |
| Descriptions, specifications and detailed Contract terms | Yes | Keep decision-critical terms in the fixed summary; reveal supporting detail on demand. |
| Contract archive and change history | Yes | Current work and unresolved issues must remain discoverable without reading the archive. |
| Mission map in the planner | Pan/zoom is appropriate | This audit did not inspect planner behavior; map movement is different from scrolling the station's controls away. |

Full HD is currently implemented as a **1920 × 1080 content area**, not merely a monitor of that resolution. The HTML enforces that minimum and permits page scrolling in smaller windows. Decide which actual window/full-screen arrangements are supported before declaring the no-page-scroll requirement satisfied. Shrinking all text is not a sufficient fallback.

## Keep these parts

- Persistent Budget and mission/date context, a broad catalogue and shared needs: a useful foundation for D-011.
- Optional matching rather than a compulsory narrow shopping funnel. PC Building Simulator's developers turned its inventory compatibility filter off by default so players could understand mismatches rather than assume parts did not exist [S11].
- Distinct promised/ready supply, durable change history and current-fact checks at commitment. These support informed choices; streamline the surrounding loop rather than removing the distinctions.

## Next design work, in order

1. Define the persistent overview and one active subject across station modes.
2. Trace one multi-need acquisition plan, including an existing Contract, a cheaper/riskier alternative and a competing deadline. Expose consequences together without adding a compulsory workflow.
3. Define attention behavior for a new offscreen Task, a funding cut and a late delivery while another decision is in progress.
4. Review repeated action paths and preservation of interrupted work against those traces.
5. Resolve clock/consequence rules, then observe a four-player scenario. Record whether players wait, repeat facts because context was lost, stop listening while operating the station, or spend time maintaining records. No such observation is claimed here.

The first four are design work. The fifth is needed to establish pacing and enjoyment. No numerical click budget, activity quota or no-wait guarantee has been invented.

## Evidence and source ledger

Browser inspection covered the initial catalogue, Contract mode, the authored bulk-needs event, Changes and pending Calls at 1920 × 1080. Measurements above came from rendered DOM geometry; the unrelated inspector was also visually observed. Source review covered rendering, selection, comparison, confirmation and authored event behavior. No automated tests were added or run. The local audit preview was closed after inspection.

References below were checked November 14, 2026. Historical developer posts/manuals establish the described designs, not every current release. Game design claims are distinguished above from proposed adaptations. No reference game was played in this audit. Marketing descriptions establish stated mechanics, not measured usability. Impeccable informed hierarchy and context review; Web Design Guidelines were fetched, but micro-level compliance scoring was excluded to honor the user's high-level scope.

| ID | Verified primary source | What it establishes / limit |
| --- | --- | --- |
| S1 | [Factorio FFF-289, April 5, 2019](https://www.factorio.com/blog/post/fff-289) | Design mockup: compact panels, merging request/trash limits, fulfillment status at slots. A proposal at that date, not proof of final UI. |
| S2 | [PULSAR developer archive, Beta 27](https://store.steampowered.com/news/posts/?appgroupname=PULSAR%3A+Lost+Colony&appids=252870&enddate=1589064317&feed=steam_community_announcements) | Crew purchase limits, Compare/swap installation and captain purchase/sale notifications. Historical January 2020 behavior. |
| S3 | [X-COM: UFO Defense official manual, section 4.2.8, printed p. 120](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/7760/manuals/x-com%20ufo%20defense%20manual.pdf?t=1571243544) | Current funds and purchase total together; list quantities; delivery is later. Does not justify copying its navigation into live multiplayer. |
| S4 | [Megaquarium developer overview, base-game finance/staff sections](https://www.twicecircled.com/megaquarium/) | Supporting costs, hiring tradeoffs and interdependent acquisitions; no direct verification of its screen layout. |
| S5 | [Space Program Manager official manual, Funds / Public Affairs Office](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/308270/manuals/SPM_manual_EBOOK.pdf?t=1718872658) | Present funds, expenses, recurring obligations and next-cycle projection. Agency management, not concurrent crew roles. |
| S6 | [Barotrauma developer archive, April 2022 Urban Expanses and follow-up](https://store.steampowered.com/news/posts/?appids=602960&enddate=1664550482&feed=steam_community_announcements) | Crew wallets, shared-bank access and balances on campaign interfaces. Does not establish a dedicated procurement player. |
| S7 | [Factorio FFF-382, October 27, 2023](https://www.factorio.com/blog/post/fff-382) | Developer-observed repeated request-editing problem and logistic groups solution. Do not copy automatic purchasing authority. |
| S8 | [Factorio FFF-338, March 13, 2020](https://www.factorio.com/blog/post/fff-338) | Actual GUI recap; extra confirmation prevents premature robot fulfillment. Specific rationale, not a blanket endorsement of confirmations. |
| S9 | [The Sourcing Lab creator's methodology](https://www.siliconandsteel.co/games/sourcing/) | Explicit nine-stage procurement teaching flow. Rechecked description; not a new playthrough. |
| S10 | [EmptyEpsilon official documentation, introduction and Relay](https://daid.github.io/EmptyEpsilon/) | Specialized stations and multiple independent Relay activities; developers' motivation concerning comms boredom. Does not prove universal absence of waiting. |
| S11 | [PC Building Simulator developer updates, 2018 archive](https://store.steampowered.com/news/posts/?appids=621060&enddate=1544009932) | Compatibility inventory filter default changed to off, with explicit learning/discoverability rationale. Inventory, not our catalogue. |

Dealer's Life 2 and the remaining economic/training references were not used to infer station layout: their negotiation or supply-chain mechanics do not establish what must stay visible during this game's concurrent play. No additional screen behavior was assumed from earlier research summaries.

Related: [source request](../notes/2026-11-14-gameplay-ux-audit-request.md), I-061/I-062, existing I-047/I-050/I-052/I-053 and Q-010/Q-014/Q-016/Q-031. These findings refine existing proposals; they do not change the decision log.
