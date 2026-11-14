# Mission planner UI

Labels: **user direction** = stated by the user (source: [UI and testing notes](notes/2026-11-14-ui-and-testing.md)). **Proposal** = suggested, not yet accepted.

## Layout

**User direction:** the solar system map is always visible. The rocket configurator, procurement tasks, and versions sit in a side panel.

**User direction (2026-11-14, after the first build, [notes](notes/2026-11-14-ui-feedback.md)):** the style follows a reference image (removed for publication; redistribution rights were not documented): dark glowing space visual, glass cards floating over it, pill navigation. The UI must be much simpler: few controls visible at once. The agency calendar is not pausable in the main UI.

**Proposal — layout after the redesign:**

```
 MISSION PLANNER    ( Rocket )( Procurement )( Versions )    [date •][budget][launch][⚙]
┌──────────────────────────────────────────────────────────────┬──────────────────┐
│                                                              │ glass side panel │
│        full-bleed solar system map (glow, orbits,            │ (active pill;    │
│        trajectories, maneuver dots, clickable end states)    │  collapsible)    │
│                                                              │                  │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │                  │
│ │ Δv budget    │ │ Goals        │ │ Issues       │           │                  │
│ └──────────────┘ └──────────────┘ └──────────────┘           └──────────────────┘
```

- **User direction (2026-11-14):** no Procurement panel on the planner station — that is the procurement player's station (D-006). Navigation is Rocket · Versions; each part row in the Rocket panel shows its order status and arrival date versus the launch date.
- Details appear on demand: rocket parts are compact rows that expand one at a time to show their sliders; procurement rows expand for contract details; the version comparison is behind a toggle.
- The calendar date runs on its own (pulsing dot); pause and speed live only in the Dev drawer (gear icon).
- While planning, the map shows positions on the planned launch day ("Launch day" in the map title line); editing a transfer shows its departure day; the playthrough shows its own date.
- The launch chip opens a popover with the launch-date control, the mission's launch deadline, and "Launch now".

**Earlier proposal (first build), kept for history:**

```
┌──────────────────────────────────────────┬─────────────────────┐
│ Agency calendar · launch date · budget   │ [Rocket][Tasks][Ver]│
├──────────────────────────────────────────┤                     │
│                                          │  Side panel         │
│   Solar system map                       │  (active tab)       │
│   orbits, planned trajectory,            │                     │
│   maneuver markers, warnings             │                     │
│                                          │                     │
├──────────────────────────────────────────┤                     │
│ Δv bar: maneuver segments vs stage bands │                     │
│ Goal success chances                     │                     │
└──────────────────────────────────────────┴─────────────────────┘
```

- **Top bar:** agency calendar (today's date), planned launch date, days until launch, budget.
- **Map:** zoom from the whole system to one body. Clicking an orbit opens the maneuver-type menu; clicking a maneuver marker opens its sliders in a popup next to it. Transfers open the delta-v heat map (departure date × travel time).
- **Bottom strip:** the delta-v bar and goal success chances, always visible.
- **Side panel tabs:**
  - **Rocket:** stage stack (rocket stages, payload stages, payload equipment) with each part's sliders, research limits, and lock icons.
  - **Tasks:** the planner's procurement tasks with status (draft, sent, offers received, contracted, delivered) and expected delivery date against the launch date.
  - **Versions:** saved versions for comparison.

## Live testing

**User direction:** the test runs live. Every slider move or maneuver edit re-runs it instantly against the current plan.

**User direction:** results show on the map and the delta-v bar: the trajectory turns red from the step where the plan fails, maneuvers with problems get warning icons, the delta-v bar shows stage bands against maneuver segments, and goal success chances are listed.

**Proposal — warnings checked live:**

| Check | Shown at |
| --- | --- |
| Not enough delta-v | maneuver where fuel runs out; red trajectory after it |
| TWR too low for launch or landing | launch or landing marker |
| Missing equipment (landing legs, heat shield) | landing, aerocapture, or entry marker |
| Hazard exceeds protection (radiation, heat) | trajectory section or surface stay |
| Power or data rate too low for instruments | arrival marker |
| Part beyond research | part in the Rocket tab |
| Delivery after launch date | task in the Tasks tab and the launch date in the top bar |

## Sending tasks

**User direction:** tasks are sent per part. The planner marks individual parts as ready and sends each as its own task, for example sending the engine early while still tuning the payload.

**Proposal:**

- Each part in the Rocket tab has a "Send to procurement" action. The task carries the part's slider values as minimums (see [rocket configurator](rocket-configurator.md#link-to-procurement)).
- Each part shows its state inline: draft, task sent, contracted, delivered (see [part lifecycle](rocket-configurator.md#part-lifecycle)).
- Changing a sent part's sliders marks the task "changed" so procurement sees the new minimums.
- Contracted and delivered parts show a lock; their sliders are fixed to the real part's stats. A "Replace" action creates a new draft for a replacement; the old contract stays in the Tasks tab, with its current cancellation refund shown. Only procurement can cancel it.
