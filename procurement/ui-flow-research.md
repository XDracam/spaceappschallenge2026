# Procurement UI flows and reference analysis

**Date:** November 14, 2026. **Status:** UI research and design alternatives. These suggestions are not accepted rules or claims of proven usability. Scope: what procurement sees and does while shopping, managing Budget, using Calls and recovering from changed circumstances. This builds on [gameplay](gameplay.md), the [research alternatives](research-design-alternatives.md), and the [existing Full HD mockup](mockups/README.md).

## Evidence and limits

- **PC Building Simulator:** the developers' 2018 notes say the shop showed owned quantities and a relevant compatibility property, incoming jobs could expose specifications, and job screens showed component costs. In an earlier update in the same archive, they changed the inventory's “Fits this PC” filter to default off so players could learn why something did not fit rather than assume it was absent. These are historical UI changes, not a current-version screen-by-screen study. [Developer updates](https://store.steampowered.com/news/posts/?appids=621060&enddate=1544009932).
- **X-COM: UFO Defense (1994):** its Purchase/Recruit screen places current funds and selected purchase cost alongside a list of items, per-unit costs and quantities; purchases have delivery time and in-transit details. [Manual, sections 4.2.7–4.2.9](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/7760/manuals/x-com%20ufo%20defense%20manual.pdf?t=1571243544). This describes the manual's interface, not a modern usability standard.
- **The Sourcing Lab:** we inspected its Quick mode through the supplier selection screen on November 14. It moves from sourcing strategy to demand consolidation, supplier screening, a quote table with dimensions and adjustable weights, then supplier selection. Its staged flow deliberately teaches procurement and offers a contrast to a persistent, multi-need workspace. Negotiation and later stages were not inspected directly. [Game and methodology](https://www.siliconandsteel.co/games/sourcing/).
- **Factorio:** its developers' 2019 character GUI mockup discusses grouping inventory and tools, compact panel tabs and clear states. Their 2023 post explains why changing duplicated requests across multiple entities became repetitive and why reusable groups were introduced. These are design notes, including a mockup, not a controlled usability result. [2019 UI post](https://www.factorio.com/blog/post/fff-289); [2023 logistics post](https://www.factorio.com/blog/post/fff-382).
- **Mars Horizon:** its 2021 update describes highlighting in-progress missions in the mission list. The concrete lesson is to put current status where the player is already looking. [Developer update](https://www.aurochdigital.com/blog/2021/5/20/mars-horizon-free-update).
- **Accessibility:** Game Accessibility Guidelines recommends that color reinforce another indicator and cautions against placing essential temporary information far from the player's eye-line. [Color guidance](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/); [temporary information guidance](https://gameaccessibilityguidelines.com/avoid-placing-essential-temporary-information-outside-the-players-eye-line/).

The mockup screenshot and source were inspected for this analysis; the existing README records earlier interface checks. We did not perform a new playtest or establish that any proposed flow is enjoyable. Screen diagrams below are conceptual.

## What the existing mockup already provides

The screenshot shows a **left shared-needs list**, **central catalogue**, **right selected-resource inspector** and a top bar with mission, date and Budget. The source and README describe search, categories, price/arrival sorting, a need filter, a purchase confirmation, Contract and Call views, and a scripted test calendar. The fixture uses illustrative payment and cancellation rules; those do not settle the actual game economy.

This is a useful starting point for a full-screen procurement station: the catalogue is visually dominant and several needs remain visible. The following are *design observations*, not player findings:

1. A selected need currently filters catalogue results. This is useful for a focused search but can conceal discoveries for other needs. The active filter needs to remain obvious and easy to clear; an alternative is to highlight matches without hiding other items.
2. The inspector contains the currently selected resource and purchase controls. The mockup does not have a dedicated side-by-side comparison flow; comparing by repeated selection puts more burden on memory.
3. Contract and Call views replace the central catalogue area. Their broader roles in sustained play—especially returning to a previous browsing context after a Call response—need design work.
4. The needs list shows a fraction supplied, but the player may need to distinguish *already usable* from *promised for later*. Any new states must follow the eventual Contract and delivery rules.
5. The screenshot's cards dedicate substantial height to art. This gives resources identity, but reduces the number visible; compare the present visual cards with a more compact view before choosing density.

## What should stay visible?

**Proposed persistent layer** while the player browses, compares, reviews Contracts or handles a Call:

| Area | Always-visible information | Why it matters |
| --- | --- | --- |
| Top bar | Current agency date; available Budget; a compact indication of commitments; navigation for catalogue, Contracts and Calls | Establishes the limits and allows returning to another activity. Exact accounting follows unresolved Budget rules. |
| Shared needs | Name, requesting role/source if known, need-by date, and concise coverage/status | Keeps work from several roles in view. A Task remains shared, not owned by procurement. |
| Main workspace | Catalogue by default; context-specific comparison or Contract/Call content when requested | Gives the shopping activity most of the Full HD area. |
| Inspector | Details and actions for the selected item, need, Contract or Call | Shows immediate context without navigating away for every selection. |
| Changes | Small persistent notice/count for meaningful updates, with a route to details | Lets the player finish the current thought and return to developments. Do not rely on a transient toast. |

The exact layout, the meaning of available funds and whether a panel changes context are unselected UI proposals. Show the current source of a change rather than implying that conversation itself changed game state. Color can reinforce status but never carry the status alone.

## Interaction sequence

### 1. Arrive and orient

**Focus:** “What can I help with, what is time-sensitive, and what money is available?”

Show the broad catalogue by default and several shared needs with understandable labels such as **Needs equipment**, **Contracted, arrives later**, **Available**, or **Needs review**, where the underlying facts support those labels. Avoid auto-sorting everything by urgency without explaining why; whether to sort by date or retain a stable order is open. An unopened Call response or change should remain discoverable.

The player can begin from a need or browse freely. Selecting a need should reveal its current criteria and coverage, with actions to browse relevant resources, check existing supply or open a Call. It should not require procurement to create or edit that Task.

### 2. Browse, search and discover

**Focus:** “What exists that could help?”

Keep category, search and sort controls close to the resource list. A card could show item name, category, distinguishing capability, price, availability/arrival and a small existing-supply indicator; detailed specifications and terms belong in the inspector. Show *why* an item might help a selected need, and clearly label a mismatch. The planner, not procurement, owns the wider mission-feasibility judgment.

Compare two proposals:

- **Filter:** show matching items only, with a prominent clear-filter control. Fast when a criterion is precise; may hide discoveries for other needs.
- **Highlight:** retain the catalogue but highlight matches; provide an explicit “show matches only” control. Better for discovery; unrelated items consume attention.

The PC Building Simulator team explicitly moved its “Fits this PC” inventory filter to default off so players could learn why items failed compatibility instead of thinking they did not exist. That is a relevant precedent for testing both approaches, though their inventory and our catalogue are not the same interface.

Search should support ordinary names and authored capability descriptions, not require the player to know internal IDs. No algorithm or fuzzy-search behavior is selected.

### 3. Inspect and compare

**Focus:** “Does this fit, and what am I giving up?”

Selecting a candidate opens the inspector without leaving the list. Show short purpose/qualification, the properties relevant to the selected need, price, arrival, relevant Contract terms and what is already contracted. A player can inspect an item without selecting a need.

When the player deliberately chooses **Compare**, show two or three selected items side by side in the main workspace. Rows are common facts: capability, price, delivery, relevant risk/terms and differences against the chosen criteria. For unrelated categories, show only meaningful common fields and preserve category-specific details; do not imply an engine and researcher are interchangeable.

Alternative: a compact comparison tray below the catalogue that expands only when requested. This preserves browsing context, but gives less room for detailed comparisons. An automatic weighted score is another alternative; it can help sorting but can obscure why a candidate is useful. No ranking scheme is selected.

### 4. Commit and allocate

**Focus:** “What am I committing, when will it be useful, and what remains?”

Clicking **Procure** opens a small confirmation showing resource, quantity, proposed Allocation or “unallocated,” price/commitment, expected arrival, the effect on Budget, and material terms known under the eventual rules. Show any need-by mismatch explicitly, with a reason. The player can go back without losing category, search or selection.

After confirmation, return to the previous browsing position, update the Contract and related need, and provide a brief result linked to the new Contract. The result should distinguish *Contract signed* from *resource available*. The existing mockup combines Contract and Allocation in a single confirmation; that is a proposed shortcut, not a new definition of either entity.

**Live changes:** if funds, quantity, terms or need criteria change while the confirmation is open, the display should identify the change and refresh or ask the player to review before signing. Do not imply that opening a dialog pauses shared time; pause and timing remain unresolved.

### 5. Open a Call while retaining other work

**Focus:** “What additional options can I seek, and when will I know?”

From a need or the Call view, show the Task criteria as currently supplied, earliest expected response and any known cost or uncertainty. If targeted Calls are explored, show the possible priorities and their stated tradeoffs. Do not promise a suitable response unless the eventual design selects a guarantee.

On opening, return to the prior workspace with a persistent **Call pending** entry and response date. The player continues shopping. On response, a nonblocking notice identifies the need and offers **Review** or **Later**; the response remains accessible. Review shows the returned authored Offers alongside the relevant Task and a route back to the catalogue. The Call may arrive after a need changes; mark that fact, preserve the response and display any known mismatch rather than assuming it is still suitable.

### 6. Manage changing needs and Contracts

**Focus:** “What changed, what does it affect, and what can I do now?”

An update entry should state cause, previous and new facts, affected need or Contract, and next relevant date when known. Selecting it opens a review with the current Contract and choices supported by actual rules: **keep**, **reallocate**, **compare replacement**, **cancel**, or **discuss**. A before/after preview should show Budget and Allocation consequences only where the model can calculate them; mark missing information as unknown.

An already delivered item must remain represented by its Contract under D-008. Do not silently discard historical commitments or assume a delivered resource can be returned. Direct conversation does not itself authorize an automated change.

## Worked flow: lab equipment, staff and flight hardware

Illustrative only; amounts and dates are not game balance. Science needs one lab bench and one qualified researcher; planning needs an engine and power system. Available Budget is 100.

1. **Overview:** show all four needs; lab and researcher are visibly independent outstanding criteria. Budget is 100.
2. **Explore:** choose the laboratory category. A bench card shows “22 · arrives month 2”; the inspector explains what it does and whether it addresses the current need. Other categories remain reachable.
3. **Commit:** choose the bench and confirm an illustrative 22 commitment. If fixture accounting reduces available funds by the entire commitment, show “100 → 78”; actual accounting remains open. The need displays “bench contracted, arrives month 2,” not “lab complete.”
4. **Find staff:** select Personnel and inspect a qualified researcher; display qualifications and availability in the inspector. A second person could be compared side by side. The player discusses a qualification tradeoff with science if one exists.
5. **Switch to planning:** return to the engine need without losing the broad catalogue as the primary workspace. Compare an on-time engine with a cheaper, late one. Tell planning the difference; planning decides how to respond in its own system.
6. **Investigate:** open a Call for engine options. The Call's response date appears; the player continues investigating power and staff.
7. **Change:** communications changes funding or science changes a criterion. A persistent notice states what changed and what it affects. The player chooses when to review, unless a separately selected rule requires an urgent interrupt.
8. **Review response:** new engine Offers appear; show the *current* need alongside them, not only the criteria at Call opening. Procurement can compare, buy or leave the response pending.

This flow describes proposed UI behavior, not observed player behavior or selected economic rules.

## Alternatives for attention and navigation

### A. Persistent workspace — recommended starting point

Needs, catalogue and inspector are visible together. Contracts and Calls occupy the main area when opened; top-level context persists. Comparison is an on-demand overlay or tray.

- Supports ongoing discovery and rapid shifts across needs.
- Risk: too many simultaneous panels or small type; requires careful Full HD density.
- Open choice: whether comparison should replace the main catalogue, sit in a bottom tray, or open a separate screen.

### B. Task-centered workflow

Choose one shared need first, then proceed through criteria → candidate list → compare → commit.

- Strong focus and potentially easier first purchase.
- Risks turning procurement into a series of narrow offers and hiding cross-need discoveries, contrary to the current catalogue direction. Could instead be an optional entry path within A.

### C. Staged sourcing workflow

For an exceptional Call, use explicit steps similar to Sourcing Lab: define → invite → compare → award.

- Can teach a complicated acquisition and explain progress.
- Risks serializing all work and encouraging the player to wait. If explored, allow leaving the flow at safe points and returning to other catalogue needs; no global turn barrier.

### D. Portfolio dashboard

Emphasize needs, expected dates, spending and commitments; catalogue is opened when the player chooses a need or a category.

- Strong picture of competing priorities and upcoming shortfalls.
- Risks demoting browsing and making the station feel administrative. Could be a secondary review view rather than the default screen.

## What should demand attention?

These are proposed interface tiers; actual trigger and urgency rules remain open.

1. **Normal state:** current needs, available Budget and date are quietly visible.
2. **Relevant change:** a Call response, delivery or changed Task produces a persistent entry; the player can inspect it when ready. A small optional toast may supplement the entry.
3. **Decision at risk:** show a clear warning when a known deadline or obligation is affected, with an explanation and link to inspect. Avoid assuming a notification can pause time or decide an action.
4. **Confirmation conflict:** if live facts changed since opening a purchase or cancellation confirmation, stop that stale action and present the updated facts for renewed review.

Avoid an alarm for every ordinary event; do not bury a material change solely in a fading toast, rely solely on color, or represent a forecast as a confirmed commitment. A player may be browsing far from the edge of the display, so place any essential transient cue near attention and retain its details in a durable place.

## Questions for a future observation

- Can a player start from a shared need *or* discover a useful item while browsing broadly?
- Without remembering another screen, can they compare two candidates, identify the need-by date and explain a mismatch?
- Can they tell **available**, **promised** and **unallocated** apart without relying on color?
- When a Call returns during another purchase, can they notice it, finish their current action and return to the exact browsing context?
- When a Task or Budget changes while confirmation is open, can they understand the change before committing?
- Does a persistent panel layout remain readable at Full HD? Are card art and status text worth the space they occupy?
- Can one player converse about an option while other roles continue meaningful work? A solo interface inspection cannot answer this.

No user testing has been performed for these proposals. See the [playtest template](../docs/playtests/TEMPLATE.md) if an exercise is later run.
