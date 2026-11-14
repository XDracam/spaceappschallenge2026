# Solar system and maneuvers

Labels: **user direction** = stated by the user (sources: [maneuvers and configurator notes](notes/2026-11-14-maneuvers-and-configurator.md), [solar system and maneuvers notes](notes/2026-11-14-solar-system-and-maneuvers.md)). **Proposal** = suggested, not yet accepted.

## Solar system

**User direction:**

- A simplified model of the inner solar system, plus the asteroid belt and the Jupiter system.
- Bodies: Sun, Mercury, Venus, Earth, Moon, Mars, Phobos, Deimos, Vesta, Ceres, Jupiter, Io, Europa, Ganymede, Callisto.
- All orbits are circular and lie in one plane (2D).

**Proposal — hand-crafted body data (D-005), rounded real values:**

| Body | Orbits | Orbit radius | Surface gravity (m/s²) | Atmosphere | Landable |
| --- | --- | --- | --- | --- | --- |
| Mercury | Sun | 0.39 AU | 3.7 | none | yes |
| Venus | Sun | 0.72 AU | 8.9 | very thick, hot | yes |
| Earth | Sun | 1.00 AU | 9.81 | yes | yes |
| Moon | Earth | 384,000 km | 1.62 | none | yes |
| Mars | Sun | 1.52 AU | 3.7 | thin | yes |
| Phobos | Mars | 9,400 km | 0.006 | none | yes |
| Deimos | Mars | 23,500 km | 0.003 | none | yes |
| Vesta | Sun | 2.36 AU | 0.25 | none | yes |
| Ceres | Sun | 2.77 AU | 0.28 | none | yes |
| Jupiter | Sun | 5.20 AU | 24.8 | gas giant | no |
| Io | Jupiter | 422,000 km | 1.80 | none | yes |
| Europa | Jupiter | 671,000 km | 1.31 | none | yes |
| Ganymede | Jupiter | 1,070,000 km | 1.43 | none | yes |
| Callisto | Jupiter | 1,883,000 km | 1.24 | none | yes |

Bodies move along their orbits at constant speed over the mission calendar (see [Time](#time)), so relative positions change and launch windows emerge. One body's gravity acts on the spacecraft at a time (patched conics). All maneuver costs come from closed-form formulas; there is no step-by-step physics integration.

## Environmental hazards

**User direction:** body environments create part requirements.

**Proposal:**

| Hazard | Where | Requirement |
| --- | --- | --- |
| Radiation | Jupiter system, strongest near Io and falling off outward to Callisto | radiation shielding on the payload (mass); without enough shielding, electronics fail after a limited time |
| Heat and pressure | Venus surface | heat protection on the lander (mass); without it, surface lifetime is minutes |
| Sunlight | falls with the square of distance from the Sun | solar power output scales with it; at Jupiter, about 1/27 of Earth's, so RTG power is the practical choice |

Radiation shielding and heat protection are payload parts with a slider (protection level), like other parts in the [rocket configurator](rocket-configurator.md#parts). The simulation test reports each hazard against the payload's protection and the time spent there.

## Time

The game has two separate kinds of time.

**Play time — user direction.** The real time of the session. All roles act concurrently in real time: the planner edits the plan, procurement handles contracts, science runs research, communications handles events.

**Mission time — user direction.** The dates inside the mission plan: launch, each burn, each arrival. Planning is instant. When the planner adds or edits a maneuver, the plan immediately shows its result: the new orbit, the arrival date, the delta-v cost. Nobody waits during play for the spacecraft to fly anything. The flight does not happen during play at all.

**Final playthrough — user direction.** At the very end of the game, the finished plan is played once, in fast-forward, from launch to the last maneuver. This is the only time the mission actually flies, and it shows whether everything works out.

**Agency calendar — user direction (accepted proposal):** links play time and mission time.

- An agency calendar advances with play time at **1 real minute = 1 calendar month**. A one-hour session covers about five years; a Mars window recurs about every 26 minutes. Research durations, procurement delivery times, and communications events count in this calendar.
- The planner sets the launch date on the agency calendar. Every later mission date follows from the plan.
- Every part must be delivered before the launch date. Launch windows are fixed by planet positions, so a late delivery can force a costlier transfer or a later window.
- When the agency calendar reaches the launch date, play ends and the final playthrough starts. It uses the contracted parts' actual stats.

**Mission deadline — user direction (2026-11-14):** each mission has one completion deadline (not a launch deadline). Goals achieved after it do not count; the live test flags them. Launching later therefore needs faster, costlier transfers, which gives the delta-v-versus-travel-time trade-off its purpose.

## Final playthrough outcome

**User direction:**

- Success is partial and scored per goal. A mission has several goals (for example reach orbit, land, return a sample, deliver instrument data); each succeeds or fails separately.
- Chance plays a role: each part can fail during the playthrough based on its reliability.

**Proposal:**

- Goals are defined per hand-crafted mission (D-005); each goal names the plan step that achieves it.
- Reliability is a stat of each contracted part, set by procurement's choice (supplier, price, rushed delivery).
- A part fails at most once, when it is used. A failure ends its branch of the plan from that step on; separated spacecraft are independent after separation, so an orbiter can succeed while its lander crashes.
- Before launch, the simulation test shows each goal's success chance: the product of the reliabilities of every part used up to that goal.

## Building a plan

**User direction:** the player steers the spacecraft by setting waypoints on orbits. Example: launch into Earth orbit → click the orbit to plan a transfer → at the target, click to plan orbit insertion → click that orbit to plan a landing. The game calculates the delta-v cost of each maneuver.

**User direction:** clicking an orbit opens a menu of maneuver types; each type has a few sliders.

## Maneuver types

**User direction:** transfers, orbit insertion, landing, gravity-assist flybys, separation into several spacecraft, and return trips (ascent from a surface, transfer back, Earth entry).

**Proposal — types, sliders, and cost:**

| Type | Where | Sliders | Delta-v |
| --- | --- | --- | --- |
| Launch | surface | target orbit altitude | per-body table (includes gravity and drag losses); Earth ≈ 9.4 km/s to low orbit |
| Change orbit | orbit | new altitude | Hohmann transfer between two circular orbits |
| Transfer | orbit | target body, departure date, travel time | escape burn from parking orbit to the transfer's required excess speed |
| Flyby | on a transfer | flyby body, closest-approach altitude | none; bends the trajectory, changing speed relative to the Sun |
| Orbit insertion | arriving transfer | target orbit altitude | capture burn from arrival excess speed to circular orbit; near zero with aerocapture |
| Land | orbit | landing site (cosmetic) | per-body table; reduced on bodies with atmosphere when carrying a heat shield |
| Separate | orbit or transfer | which components go to each spacecraft | none; each spacecraft gets its own plan branch |
| Earth entry | arriving transfer | — | none with a heat shield; otherwise a braking burn |

Capture and escape burns use the parking-orbit shortcut: `Δv = sqrt(v_inf² + 2μ/r) − sqrt(μ/r)`, where `v_inf` is the excess speed, `μ` the body's gravity parameter, and `r` the orbit radius.

Aerocapture and atmospheric entry need a heat shield (see [rocket configurator](rocket-configurator.md#parts)); landing on an airless body needs landing legs. Jupiter cannot be landed on.

## Launch windows and transfer timing

**User direction:** a transfer can leave outside the ideal window. The player trades delta-v against time.

**Proposal:**

- A transfer's sliders set departure date and travel time. The cost is computed by solving the two-point orbit problem between the departure and arrival positions (Lambert's problem); in circular, coplanar orbits this is cheap.
- The ideal window gives the lowest delta-v (close to a Hohmann transfer). Leaving earlier or later, or arriving faster, costs more.
- The transfer panel shows a heat map of delta-v over departure date and travel time, so the player sees windows and trade-offs at a glance. Clicking a cell sets both sliders.
- Ion stages use the low-thrust rules in the [rocket configurator](rocket-configurator.md#ion-propulsion) instead.

## Gravity assists

**User direction:** a flyby is a maneuver type.

**Proposal:** a flyby is added to a transfer and splits it into two legs. A closer approach bends the path more; a heavier body bends it more. It saves delta-v and usually costs travel time, and only works when the bodies are aligned, so good flyby opportunities are rarer than direct windows. Example routes: Venus flyby toward Mercury; Earth or Mars flyby toward Jupiter.

## Jupiter system

**User direction:** transfers between Jupiter's moons are the same transfer type, centered on Jupiter, and can use flybys of other moons.

**Proposal:** transfer and flyby work around any center body (Sun, Earth, Mars, Jupiter). Moon flybys after arriving at Jupiter lower the capture and moon-to-moon costs at the price of time — and time spent near Io or Europa adds radiation exposure.

## Separation and plan branches

**User direction:** the payload can split into several spacecraft with separate plans, for example an orbiter staying in Mars orbit while a lander descends.

**Proposal:** a separation maneuver splits the plan into branches, one per spacecraft. Each branch uses the payload stages and equipment assigned to it; the delta-v bar in the configurator shows one band per branch.

## Return trips

**User direction:** missions can include return trips.

**Proposal:** a return is built from existing types: launch from the target surface, transfer back to Earth, then Earth entry or orbit insertion. The returning spacecraft (sample return or crew capsule) must carry its own ascent and return stages.

## Open questions

1. One level is one mission (user direction); parts do not carry over. Does anything else carry over between levels, such as goal results, research, or reputation (project question Q-018)?
