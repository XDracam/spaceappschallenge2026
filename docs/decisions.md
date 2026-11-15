# Decision log

This log records explicit project direction. Proposed mechanics remain in [ideas](ideas.md) until accepted. Entries link their source notes.

## D-001 — Work in the prototype phase

- Date: 2026-11-14
- Status: accepted user direction
- Decision: treat this as prototype work.
- Rationale: the user explicitly identified the current phase.
- Consequence: keep mechanics and implementation choices proportional to the question being explored. This does not itself choose a paper prototype or technology stack.
- Related: [prototype proposal](prototype.md), I-006, Q-012.

## D-002 — Prepare, then simulate once

- Date: 2026-11-14
- Status: reclassified as brainstorming on 2026-11-14, following the user's clarification; retained for history.
- Originally recorded: the mission is planned and prepared, then simulated once, producing a win or failure; everyone can fail.
- Correction: this was recorded too strongly as an accepted rule. It remains an idea, including the possibility everyone fails. Real-time play and a campaign are also ideas; their relationship to this flow is open.
- Unresolved: timing of the simulation, preparation and live events, cooperative versus competitive outcomes, success thresholds, uncertainty, and reuse of a design.
- Related: I-005, [mission flow](design/mission-flow.md), Q-002, Q-004, Q-008, Q-011.

## D-003 — Persist ideas in structured documentation

- Date: 2026-11-14
- Status: accepted user direction
- Decision: keep structured project documentation that preserves all substantive ideas.
- Rationale: explicit setup request.
- Consequence: keep source notes, an idea register, accepted decisions, unresolved questions, current design, and future experiment evidence linked. Markdown is the initial setup format, not a game technology decision.
- Related: [documentation workflow](README.md).

## D-004 — Keep every role engaged concurrently

- Date: 2026-11-14
- Status: key design requirement stated by the user; implementation remains open.
- Intent: give every role something meaningful to do at the same time; avoid hard dependencies that leave someone idle, waiting for another role.
- Related: [brainstorm notes](notes/2026-11-14-brainstorm.md), I-017, Q-014.

## D-005 — Hand-crafted content baseline

- Date: 2026-11-14
- Status: user-stated baseline.
- Direction: no runtime dynamic generation; hand-craft missions, part lists, possible events, and similar content.
- Source: [personnel and roles notes](notes/2026-11-14-personnel-tasks-roles.md).
- Open boundary: whether and how authored content can be selected, varied, combined, or revealed at runtime, and how player-created tasks relate to this baseline. Do not assume that all randomness or changing state is prohibited. See Q-026.
- Related: I-023, [shared tasks](design/shared-tasks.md), Q-026.

## D-006 — Procurement terminology

Accepted by the user on November 14, 2026. Use these terms consistently across procurement and the current design documents.

| Term | Meaning |
| --- | --- |
| Task | A goal and its completion criteria. |
| Resource | A part, person, or service that can be supplied. |
| Call | An invitation to suppliers to submit Offers addressing a Task. |
| Offer | Supplier terms for providing a Resource. |
| Contract | An accepted Offer and the resulting commitment. |
| Allocation | Contracted quantity reserved for a particular Task criterion. |
| Budget | Funding, spending, commitments, and available funds. |

Players open a Call, receive Offers, sign a Contract, and allocate what it provides to Tasks. Catalogue Offers can also be accepted directly.

Record fields, ownership, state transitions, payment schedules, and detailed mechanics remain under discussion. Related material includes I-036 and the [procurement interfaces](../procurement/interfaces.md). The [terminology discussion](notes/2026-11-14-procurement-terminology.md) records the user's selection and the previous term for Call.

## D-007 — Direct conversation between roles

**Superseded in part on 2026-11-15 by D-021.** Direct conversation remains available. Required cross-role information and requests now belong in shared tasks so play can proceed through the interface.

User direction on November 14, 2026. Players coordinate by talking directly to one another. This communication is an important part of the gameplay.

Tasks are shared problems whose applicable roles may be unclear, as in the original brainstorm. The assistant's support-Task workflow has been withdrawn. The exact distinction between persistent Tasks and conversational requests remains a design question. Information visibility and automated interface assistance also remain open.

See the [source clarification](notes/2026-11-14-tasks-and-conversation.md), the [shared Tasks brainstorm](design/shared-tasks.md), and the proposed [Task boundary](../procurement/tasks-and-conversation.md).

## D-008 — Procurement alignment after incoming mission-planner work

User clarification on November 14, 2026, following the integration review.

- Tasks are shared problems. Replace the incoming role-addressed “Send to procurement” workflow with publication to the shared Task list.
- Inventory is contract-only. A delivered Contract continues to represent what is available for use and Allocation.
- Procurement consumes Tasks and publishes assessments and its own procurement records. Task creation and replacement Task identity belong to the planner/shared Task design.
- Domestic research limits are distinct from acquisition routes. Expensive external purchase and diplomacy can remain possible before domestic research unlocks a part.
- Detailed mission feasibility and the mass consequences of slider minimums remain within the planner's scope. Procurement checks the supplied Task criteria.
- Planner displays for Budget, delivery status and goal risk require ordinary state integration. They do not create a concept conflict with direct player conversation. Broader visibility details can be considered during interface design.

See the [user response](notes/2026-11-14-procurement-alignment.md) and the [review resolution](reviews/2026-11-14-mission-planner-integration.md#resolution-after-user-review).

## D-009 — Standalone procurement technology

Accepted user direction on November 14, 2026. Use the documented web, TypeScript and HTML canvas stack for the procurement prototype. Keep it in the separate `procurement/` directory, without a shared base yet. Integration comes later.

The reference is the [mission-planner build choice](../mission-planner/README.md#build). The [source note](notes/2026-11-14-procurement-stack-and-gameplay.md) records this selection. Gameplay layout and interaction details remain proposals.

## D-010 — Accessible mission-planning gameplay

User direction on November 14, 2026. This is a game highlighting the complexities of planning a space mission. Its scenarios should communicate that complexity, remain fun, and be playable without prior training.

Procurement designs and walkthroughs must serve that player experience. The [revised gameplay walkthroughs](../procurement/workflows.md) explore understandable dilemmas and spoken coordination. Their specific mechanics and pacing remain proposals awaiting experience with players.

See the [source clarification](notes/2026-11-14-accessible-gameplay.md).

## D-011 — Catalogue procurement across competing needs

User clarification on November 14, 2026. Procurement gameplay centers on acquiring things other roles need from a catalogue and managing the available Budget across needs arising throughout preparation. Research requisites and personnel are explicit examples. Purchasing decisions implicitly distribute the Budget. Other stations, including comms, can change overall funding.

The role fulfills needs and contributes to shared Tasks. The previous isolated Offer-comparison mockups were too narrow. The interface should use the space of a Full HD or larger game screen. Specific layout and interaction designs remain proposals.

See the [verbatim clarification](notes/2026-11-14-catalogue-gameplay.md) and the current [catalogue gameplay direction](../procurement/gameplay.md).
## D-012 — Four players on four separate stations

- Date: 2026-11-14
- Status: accepted user direction
- Decision: the game is multiplayer for four people by default. Each player operates their own station from a separate seat. During game time players do not switch or share stations.
- Source / approval: [player stations note](notes/2026-11-14-player-stations.md).
- Rationale and evidence: user decision. Empty Epsilon is an acceptable reference for this **design** choice: one player per station, each with their own seat.
- Alternatives considered: switching roles at any time (I-013, now superseded for game time) and shared roles (Q-001).
- Consequences and limitations: every station is always occupied, so the unattended-role question no longer applies at the default player count. This is not a technical architecture choice. How stations connect, the platform, and the network stay open in Q-012. Play with fewer players is deferred (I-014); four is the default for now. Which responsibility each station covers follows the role brainstorm in [roles](design/roles.md) and is not fixed by this decision.
- Related ideas, questions, and docs: I-013, I-014, I-056, Q-001 (closed), Q-012 (open), Q-016 (partly closed), [roles](design/roles.md).
Merge provenance — the incoming branch used D-006 for this decision. D-006 already identified procurement terminology here. The station decision is retained as D-012, and its incoming idea I-034 is retained as I-056. Original user wording is preserved in the source note.


## D-013 — Align procurement with the planner visual language

- Date: 2026-11-14
- Status: accepted user direction
- Direction: apply the mission planner UI design language to the procurement prototype.
- Implementation: local visual tokens and styling in the existing standalone mockup, including dark glass, cyan glow, rounded panels, pills and planner typography. Detailed layout choices remain prototype adaptations.
- Source and observations: [user request and interface checks](notes/2026-11-14-procurement-planner-style.md), I-058.

## D-014 — UI design and review skills

- Date: 2026-11-14
- Status: accepted user direction.
- Decision: integrate Impeccable for game UI design and refinement and Vercel Web Design Guidelines for implementation review, as applicable to the work.
- Source: [integration request](notes/2026-11-14-ui-skills-integration.md), following the [research](ui-agent-skills-research.md).
- Consequences: retain D-013's planner-derived procurement style; apply web-oriented recommendations in the context of desktop game stations. Review canvas interactions separately. Player coordination and enjoyment still require actual multiplayer observation.
- Related: I-059, D-004, D-007, D-010–D-013.

## D-015 — Integration architecture

- Date: 2026-11-14
- Status: accepted user direction ([integration questions](notes/2026-11-14-integration-questions.md)); copy-paste signalling superseded by D-027 (room codes), kept as fallback
- Decision:
  - Connection (resolves the connection part of Q-012): peer-to-peer. One player's browser hosts the authoritative game state; the other stations connect via WebRTC. Signaling by copy-paste connection codes, no third-party matchmaking.
  - Code: one web app with four station views sharing one game-state module and types. Station folders keep their specs and notes.
  - Hosting: online for judges, as a static site on GitHub Pages.
  - Fewer than four players: anyone may hop to an unclaimed station. This relaxes D-012's no-switching rule only for stations nobody has claimed.
  - Shared model uses procurement's D-006 terms (Task, Resource, Call, Offer, Contract, Allocation, Budget). The planner's "Order part" creates a shared Task whose criteria are the slider minimums; the planner keeps its own UI wording.
  - The assistant builds Science and Procurement out to the planner/comms level as part of integration; teammates review.
- Consequences and limitations: WebRTC over the internet needs a STUN server and can fail on strict networks without a TURN relay; copy-paste signaling is clunky but self-contained. If the host closes the tab, the game ends unless state is saved and handed over. Deploying to GitHub Pages needs the repository owner's agreement.
- Related: D-006, D-008, D-012, Q-012, [event system](design/events.md).

## D-016 — Dollars and standard icons in procurement

- Date: 2026-11-14
- Status: accepted user direction
- Direction: use dollar amounts throughout the procurement prototype, a standard icon pack, and explicit names for missing items.
- Implementation: dollar notation such as $22 and $4.50, Lucide Static 0.468.0, and shortage labels drawn from authored Task descriptions.
- Source and observed checks: [user corrections and walkthrough](playtests/2026-11-14-procurement-gameplay-iteration.md#standard-icon-pack-dollars-and-named-shortages).

Identifier alignment — incoming integration architecture keeps D-015. The procurement display decision is retained as D-016 after parallel commits used the same number.

## D-017 — Procurement amendments, Call timing and direct department needs

- Date: 2026-11-14
- Status: accepted user direction for the listed scope, detailed mechanics remain open.
- Source: [User feedback](notes/2026-11-14-procurement-order-decisions.md).
- Accept contract amendments, including responding to inconvenient external delays or cancellations through feasible adjustments or replacement orders.
- Parameterize Call response deadlines and make their consequences visible to players without specialist knowledge.
- Science should not create procurement Tasks. Players communicate needs for resources outside the final launch, and procurement purchases those resources for department use. Final-launch part Tasks remain the existing planning route.
- Use multiple orders with different parameters for different quantities and delivery times.
- Keep production-slot reservations optional. Explore bespoke supplier recovery events later.
- The proposed assurance control is questioned and unselected. Investigate concrete purchasable or contractual terms. No price, duration or probability curve is selected.
- Implementation gap: the integrated Science test-unit request and bonus currently depend on a generated Task and need revision. Department resource use and reservation semantics remain open.
- Related: I-079, D-007, D-011, Q-005, Q-023–Q-025, Q-027–Q-028, Q-031.

## D-018 — Procurement order and department-supply prototype

- Date: 2026-11-14
- Status: accepted prototype target; implementation and playtesting require independent verification.
- Decision: build the detailed [order and department-supply concept](../procurement/order-concept.md) and its [visual walkthrough](../procurement/concepts/orders.html): supplier delivery options, amendments, 7/14/30-day Calls, direct department supply and reusable exclusive Science test units, independent orders with finite quantities, and homogeneous flight supply aggregated with the stated weighted geometric mean. The concept's shared-state, migration, stale-action and accounting safeguards are part of the target.
- Source: [user approval](notes/2026-11-14-procurement-order-approval.md). This refines D-017 for this prototype; it does not close the broader design questions.
- Evidence and limits: the cited acquisition sources support delivery schedules, solicitation deadlines and modifications; numerical curves, research reuse and reliability aggregation are game choices. Fixtures require balancing. Approval is not evidence of implemented behavior or multiplayer enjoyment. Optional slot reservations and deferred supplier events remain outside this selection.
- Related: I-079, I-080, D-004, D-005, D-017, Q-005, Q-008, Q-014, Q-023–Q-028, Q-031.

## D-019 — Reduced Contract timeline prototype

- Date: 2026-11-15
- Status: accepted user direction for implementation; implementation and playtesting require independent verification.
- Decision: add a Contract timeline showing arrivals against actual needs, with enough identity, recipient and quantity information to distinguish orders and their uses. Retain the Table. On a selected Contract, preview one selected amendment as current versus proposed arrival and fee, and provide concise local delay and cutoff feedback.
- Scope: no Upcoming area, Call or Offer-expiry integration, replacement comparison, or dependency graph in this iteration. The broader [timeline design study](../procurement/timeline-design.md) remains historical exploration, not an approved specification. The separate budget composition proposal is not selected by this decision.
- Source: user approval of the reduced implementation scope in the November 15 conversation, following the timeline study.
- November 15 refinement approval: user instructed “then build it” after the [Contract view analysis](reviews/2026-11-15-contract-views.md). Use Incoming timeline / All contracts tabs, a shared wide workspace with explicit selection and Close details in both views, compact timeline Contract IDs, and cancellation in details. Preserve active selection across tabs and clear historical selection when entering Incoming timeline. Date fitting expands only for offscreen proposals and holds the comparison range until the preview clears.
- Limitations: approval is not evidence of runtime behavior or multiplayer enjoyment. Preserve unknown need dates rather than inventing them; distinguish research bonuses from mandatory needs.
- Related: I-081, D-017–D-018, Q-007, Q-024–Q-025, Q-031.

## D-020 — Science is an engineering tech tree

- Date: 2026-11-14
- Status: accepted user direction; implemented and merged to `main` November 15, 2026
- Decision:
  - Science researches engineering upgrades for Mission Planning (propulsion, instruments, power, antenna, protection), shown as a tech tree with prerequisites. It replaces the knowledge graph, combination bench and recipes of the earlier science design.
  - Science's goals are requests from Procurement. Science must find a route through the tree to a tech that delivers the requested limit or unlock. Several routes can lead to the same goal.
  - Procurement (resource planning) chooses per beyond-research part whether to buy it or to develop it. Developing posts a research request to science.
  - Comms effects can block or enable techs. Some techs need an approval from comms before they can start.
  - Results reach the planner as before, through the shared research limits and unlocks.
- Source / approval: [science module note, eighth message](notes/2026-11-14-science-module.md)
- Rationale and evidence: user direction. The tree gives science its own goal-driven puzzle and ties it to Procurement and Comms.
- Alternatives considered: keep the knowledge graph with the tree as a second layer (not chosen by the user).
- Consequences and limitations: the old graph content (fields, descriptions, recipes) is dropped on the branch and kept on `main`. The pure-science findings that fed comms news are gone unless re-added. Tech content is placeholders (D-005).
- Related: D-005, D-015, I-082 to I-085, Q-036 to Q-038, [science module](../science/README.md).

## D-021 — Coordinate required cross-role work through shared tasks

- Date: 2026-11-15
- Status: accepted user direction.
- Decision: inspect the entire codebase with Terra and Luna and coordinate relevant details between roles through Tasks. Players must have the information needed to act without implicit conversation or chat messages. Allow player-created tasks where useful. Provide a switch between tasks the current role can solve and all tasks.
- Source: [task coordination request](notes/2026-11-15-task-coordination.md).
- Relationship to earlier direction: updates D-007 and Q-031. D-017's department supply continues to use Contracts and department Allocations. Players can explicitly create coordination requests for department equipment. The integrated D-020 Science implementation derives research needs from the live design and tests delivered parts. The earlier optional research-equipment bonus belonged to the retired knowledge graph.
- Implementation choices: retain procurement criteria in the existing market records, derive shared board entries from actual game state, and store player-authored requests separately in replicated state. A player request names a responsible station and describes its desired outcome. Its author or responsible station can edit, resolve, withdraw and reopen it. Generated entries follow their underlying state. The default filtered view includes open entries with a current action for this station. All tasks includes in-progress entries and offers an additional completed/withdrawn history control.
- Verification and limits: implementation evidence belongs in the [audit](reviews/2026-11-15-task-coordination.md) and dated walkthrough. Acceptance does not establish multiplayer enjoyment or guarantee a feasible solution to every request.
- Related: I-087, D-004–D-008, D-015, D-017–D-018, Q-021–Q-022, Q-026, Q-031.

## D-022 — Use in-app confirmations

- Date: 2026-11-15
- Status: accepted user direction.
- Decision: keep confirmations, choices and feedback inside the game interface. Native browser popup dialogs are prohibited.
- Source: [later UI correction](notes/2026-11-15-task-coordination.md#later-ui-correction).
- Implementation: replace existing native confirmations in the Planner and shell with the shared in-app confirmation panel. Preserve the existing decisions and their consequences.
- Related: I-088, D-014, D-021.

Identifier alignment, November 15, 2026: the published Science decision keeps D-020. The saved coordination decision previously also used D-020 and is now D-021. Its in-app confirmation decision moves from D-021 to D-022. This resolves a branch collision without changing either direction.

## D-023 — Consolidate tasks around shared needs

- Date: 2026-11-15
- Status: accepted user direction.
- Decision: implement the approved [task consolidation](notes/2026-11-15-task-consolidation.md). A shared requirement owns its supply, research, Offers, Calls, Contract progress and timing context. Keep explicit requests and authored commitment follow-ups. Keep a reconciliation task for unresolved obsolete commitments. Combine related funding requests and their affected needs.
- Shared visibility: Mission overview exposes goal feasibility, plan issues, inbox decisions, independent projects, optional tests, independent supply, services, modifiers and news. The current-role/all switch applies to tasks. Optional tests remain available through Science and the overview after delivery fulfills their parent need.
- Request lifecycle: contextual Science funding and timing shortcuts use stable identities and revision checks. Repeating a shortcut updates or reopens the existing request when saved. Explicit request purposes support funding aggregation while preserving individual request descriptions and completion controls. Recognize the exact earlier Science funding-shortcut format for existing saves.
- Integration: D-020's live design research remains available before a part order. Publishing the part order folds the corresponding research into that need. Standalone blocked research retains an actionable approval follow-up. Free-text mission commitments retain their original requirement and manual acknowledgement.
- Evidence: [consolidation walkthrough](playtests/2026-11-15-task-consolidation-walkthrough.md). Broader multiplayer experience remains unverified.
- Related: D-020–D-022, I-089.

## D-024 — Explicit request links and consistent role actions

- Date: 2026-11-15
- Status: accepted user direction.
- Source: [task unification approval](notes/2026-11-15-task-unification-approval.md), following the [Terra/Luna review](reviews/2026-11-15-task-unification.md).
- Decision: requests may explicitly name a related published need, selected by the player or supplied by a contextual shortcut. Never infer parentage from wording. Keep each request's identity, author, responsible station, revision and independent status. Unlinked requests remain standalone; requests whose parent closes or disappears remain independently discoverable. Funding requests keep their shared group and show any explicit need association.
- Timing: a shared Schedule view compares dated supply, research, tests, Contracts and player requests with the current launch date. It does not merge request completion. Contextual test-timing requests retain their stable key, affected need when available, and proposed timing context. Players may add an optional date to general requests.
- Interface: generic Purpose offers Shared request and Funding. Preserve older Equipment/Timing values and contextual timing requests. Compact work with no current role action in All tasks; retain full detail and exceptions. Related work displays role actions and its own navigation.
- Action representation: use typed funding/approval semantics and per-role destinations rather than display-word matching. Attaching paused research must preserve its Communications action. An available partner Offer remains actionable even if a fitting need is fulfilled; optional tests alone do not reopen completed supply.
- Verification: [unification walkthrough](playtests/2026-11-15-task-unification-walkthrough.md). Browser observations and constructed state fixtures are distinguished there; multiplayer concurrency remains unverified this turn.
- Related: D-021–D-023, I-090.

## D-025 — Apache 2.0 and removal of the unlicensed reference image

- Date: 2026-11-15.
- Status: accepted user direction to remove the reference image and add a sensible Space Apps license; Apache 2.0 selected by the assistant within that authorization.
- Decision: license original project code, documentation and assets under Apache 2.0, preserving separate third-party terms. Remove `mission-planner/notes/reference/ui-style-reference.webp` from the working tree and replace its Markdown link with a historical description, preserving the user's original feedback.
- Rationale: the [official 2026 participant terms](https://www.spaceappschallenge.org/legal/), checked November 15, require OSI open source or unrestricted original content and specify Apache 2.0 as the default. Image redistribution permission was undocumented.
- Source: [user request and implementation record](notes/2026-11-15-publication-license.md), I-092, Q-013.
- Limits: deletion does not remove the image from existing Git history. No history rewrite, commit, push or repository visibility change is authorized by this implementation. Licensing does not establish complete submission compliance or replace resource citations.

## D-026 — Host Mission Control on GitHub Pages with a custom subdomain

- Date: 2026-11-15.
- Status: accepted user direction.
- Decision: use `missioncontrol.dractec.com` for the existing GitHub Pages deployment. Configure a DNS CNAME to `xdracam.github.io`, Actions publishing and the Pages-provided build base path. Do not deploy to any machine [redacted for publication].
- Source and implementation record: [domain setup](notes/2026-11-15-github-pages-domain.md), I-094.
- Ownership: [redacted for publication].
- Evidence: configuration, workflow deployment and public availability are verified separately in the setup record. This decision does not establish multiplayer playtest success.

## D-027 — Room codes for connecting

- Date: 2026-11-15
- Status: accepted user direction; supersedes the signalling part of D-015 ("copy-paste connection codes, no third-party matchmaking"). The rest of D-015 stands.
- Decision: the host opens a room under a short code (six characters from an unambiguous alphabet, shown as `K7Q-4XM`); players type the code or open a `#join=` link and connect. The public PeerJS broker (`0.peerjs.com`, library `peerjs` 1.5.5) brokers connection setup only. Game traffic stays peer-to-peer on a WebRTC data channel, falling back to PeerJS's public TURN relay when a direct path fails. The D-015 copy-paste invite and reply codes remain available as a fallback under the room code. A resumed game reopens under the same room code when it is free, so players rejoin with the code they have.
- Source / approval: user, November 15 conversation, after the assistant compared PeerJS, Trystero, an own relay (Cloudflare Worker / PartyKit) and polished manual codes; the user chose PeerJS.
- Rationale: manual signalling needed two long code swaps per player (six for a full table). One short, speakable code removes the reply step. PeerJS fits the host-star topology; the app stays a static GitHub Pages site.
- Alternatives considered: Trystero (serverless signalling over public relays; mesh-first, slower relays), own WebSocket relay (most robust on strict networks; needs an account and a deploy), QR or link versions of the manual codes (still two-way).
- Consequences and limitations: depends on free public PeerJS infrastructure with no uptime guarantee; check it before a demo, and use manual codes if it is down. The broker sees peer ids and connection metadata (IP candidates), not game messages. Peers relayed through TURN pass through PeerJS's relay (DTLS-encrypted). Room ids share the public server's namespace (prefix `nasa-mission-control-26-`). Strict-network behaviour is not yet verified.
- Related: D-015, D-026, Q-012, [integration design](design/integration.md#network-d-015-d-027), [third-party notices](../THIRD_PARTY.md).

## D-029 — Fix the two-level hackathon audit findings

- Date: 2026-11-15.
- Status: accepted user direction for implementation; observed checks and remaining release limitations are separate.
- Source: [approval](notes/2026-11-15-release-fixes-approval.md), following the [audit](reviews/2026-11-15-two-level-release-audit.md), I-093.
- Decision: keep Weather introductory and budgets generous. Restrict positive in-flight goal rescue to physically achievable goals with fallible reliability factors; preserve exact Science prerequisite identities even when their grants are covered. Give Mars immediate camera research work by lowering its initial camera limit from 6 to 3 while retaining the design requirement of 4 and existing authored tech routes.
- Recovery and guidance: host-only Retry and Choose mission preserve the connected group; record outcomes once, reset planner local state, and expose local save failures. Add DOM route continuation/editing, named sliders, focused popup navigation, readable Science statuses, reduced-motion alternatives, research cancellation confirmation with refund, concise role/route guidance, truthful Comms outcomes and project timing warnings.
- Scope: no new tech/content systems, budget cuts, TURN service, commit, push or deployment. Existing historical notes and audit observations are retained. The Mars change adds research cost/time and requires a new feasible-route calculation; see [walkthrough](playtests/2026-11-15-release-fixes-walkthrough.md).
- Limits: verified mechanics and agent walkthroughs do not establish human enjoyment, zero idle time or venue-network connectivity. Related: D-004, D-010, D-014–D-015, D-020–D-024.

## D-028 — Open with a game title screen

- Date: 2026-11-15.
- Status: accepted user direction; initial artwork rejected and subsequently replaced with user-supplied finished artwork.
- Decision: implement I-095's large title, compact New/Join/Continue menu, four-role introduction and setup fields after choosing an action. Preserve existing session behavior.
- Correction: the user rejected the procedural planet treatment and decorative orbit lines. Removed them; the user subsequently supplied Earth-and-satellite artwork, now integrated in place of the atmospheric placeholder.
- Source and observations: [title-screen record](notes/2026-11-15-title-screen.md), including the requested ChatGPT image prompt and browser/build verification limits.
- Related: D-010, D-013–D-015, I-095.

Identifier alignment: the unpublished audit-fix entry was assigned D-027 locally while room-code work independently used D-027 upstream. Room codes retain D-027; audit fixes are D-029. The local title-screen entry retains D-028.

## D-030 — Optional goals with bonus points; weather mission reworked

- Date: 2026-11-15
- Status: accepted user direction; implemented, weather mission only
- Decision:
  - A mission goal can be optional (`Goal.optional`, weight `Goal.bonusPoints`). Optional goals never block the launch (their plan problems are warnings), do not count in "goals achieved", and do not lower the goal share of the score.
  - The score gets a seventh part, **bonus** (up to 100): the weight of the optional goals achieved divided by the weight of all of them. Missions without optional goals cannot earn it (`scoreMax(missionId)`: 1000 without, 1100 with).
  - The weather satellite keeps its two main goals (geostationary orbit, weather images) and gets two optional ones: "Measure ozone and aerosols" (spectrometer performance 5, weight 40) and "Sound rain and cloud layers with radar" (radar performance 3, weight 60). The radar is not unlocked, so it also needs Science (radar electronics) and Comms-independent buying.
  - The weather budget drops from 350 M to 210 M. The cheapest plan for all four goals costs about 175 M and a typical one about 205 M, so completing everything is possible but only with careful buying. The two main goals alone cost 105 to 140 M.
- Source / approval: [weather mission note, November 15 follow-up](../mission-planner/notes/2026-11-14-weather-mission.md)
- Rationale and evidence: user direction. The playtest of the first version left most of the 350 M unspent (playtest changes, finding 04), so money was no decision. The optional goals give the money a use and tie Science (radar unlock), Procurement (cheapest instruments, extra tank mass) and the Planner (more fuel for a heavier satellite) together.
- Alternatives considered: a second satellite in a low orbit (more expensive and needs a second branch, left for later); a costlier camera for sharper pictures (only about 8 M more than the base camera, so no real decision).
- Consequences and limitations: costs are estimates from the catalogue and the tech tree, not a playtest. Comms numbers for the weather set were written for 350 M (a +25 M gift, price events) and may need a second look. Mars has no optional goals.
- Related: D-005, D-020, I-096, Q-039.

## D-031 — Carry the title-screen design through pre-game

- Date: 2026-11-15.
- Status: accepted user direction.
- Decision: extend D-028's typography, spacing, pale-cyan actions and supplied artwork to New game, host/crew setup, joining and connection recovery. Keep the initial title screen as the visual reference. Retain networking behavior, manual connection controls and station ownership feedback.
- Layout: separate the New game introduction/name field from mission selection; move the host's repeated mission picker into an explicit Change mission disclosure. Give station selection the same role icons. Use concise single-line mission descriptions and helper copy instead of forced wrapping or width tricks.
- Source and evidence: [pre-game design and walkthrough](notes/2026-11-15-title-screen.md#pre-game-design-extension). Related: I-097, D-027–D-029.

## Future decision template

```markdown
## D-### — Title

- Date: YYYY-MM-DD
- Status: proposed / accepted / superseded by D-###
- Decision:
- Source / approval:
- Rationale and evidence:
- Alternatives considered:
- Consequences and limitations:
- Related ideas, questions, and docs:
```
