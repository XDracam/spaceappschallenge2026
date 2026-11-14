# Rocket configurator

Labels: **user direction** = stated by the user (sources in [notes](notes/2026-11-14-maneuvers-and-configurator.md)). **Proposal** = suggested, not yet accepted.

Cross-module clarification in [D-008](../docs/decisions.md#d-008--procurement-alignment-after-incoming-mission-planner-work) selects shared role-neutral Tasks and contract-only inventory. The current lifecycle below reflects that clarification.

## Structure

**User direction:**

- The rocket is a stack of **stages**. A stage is dropped when its tanks are empty and its dry mass no longer counts.
- All stages are **expendable**. Each mission procures fresh parts.
- The **payload** is a spacecraft built from multiple components, like the rocket. It can have **its own propulsion stages**, for example a descent stage that performs the landing burn after the rocket stages are gone.
- The payload is procured like other parts.
- The **planner alone** owns the payload design: equipment, instruments, and payload stages. Science contributes goals and research, not edits to the design.

**Proposal:** one shared stage model for rocket and payload. A stage = one engine type (one or more units) + one tank. The payload adds equipment components on top of its stages.

**User direction (2026-11-14):** one tank per stage; there is no "add tank". More fuel means a bigger tank (its slider). Two tanks behaved exactly like one bigger tank, so the option only added clutter.

```
Payload spacecraft
  ├─ equipment: instruments, power, antenna, landing legs, heat shield
  └─ payload stages (e.g. descent stage)
Rocket stage N (upper)
…
Rocket stage 1 (booster)
```

## Parts

**User direction:** parts include engines, tanks, payload components, power (solar, RTG), antenna, landing legs, and heat shield. Power, antenna, landing legs, and heat shield mostly belong to the payload.

**Proposal — sliders and fixed properties:**

| Part | Where | Slider stats | Fixed by type |
| --- | --- | --- | --- |
| Engine | rocket and payload stages | thrust (kN), Isp (s) | propulsion type; mass derived from thrust and Isp |
| Tank | rocket and payload stages | fuel capacity (t) | fuel type; dry mass = fixed fraction of capacity |
| Instrument | payload | performance (e.g. resolution, sensitivity) | mass, power draw, data rate |
| Power | payload | output (kW) | solar: output falls with distance from the Sun; RTG: constant, heavy, costly |
| Antenna | payload | data rate | mass grows with data rate and distance |
| Landing legs | payload | max landing mass (t) | required to land on airless bodies |
| Heat shield | payload | max entry mass (t) | required for aerocapture and atmospheric landing |
| Radiation shielding | payload | protection level | mass grows with level; needed in the Jupiter system ([hazards](solar-system-and-maneuvers.md#environmental-hazards)) |
| Heat protection | payload | protection level | mass grows with level; extends lander lifetime on the Venus surface |

Propulsion types (hand-crafted): solid, kerosene/oxygen, hydrogen/oxygen, storable hypergolic, ion. Each type sets the Isp range and whether fuel boils off on long transfers (hydrogen does; hypergolic does not).

Payload equipment gates maneuvers: landing on an airless body needs landing legs; entry into an atmosphere needs a heat shield; instruments need enough power and data rate at the destination.

## Ion propulsion

**User direction:** in scope, simplified.

**Proposal:** ion engines have very high Isp and very low thrust, so their burns are not instant.

- Delta-v of an ion transfer = difference of the two circular orbit speeds (low-thrust spiral), higher than the Hohmann cost; the high Isp still makes the fuel mass much lower.
- Burn duration = delta-v × spacecraft mass ÷ thrust. Travel time is at least the burn duration.
- Ion engines cannot launch from or land on a body (TWR far below 1).

## Derived values shown live

- Delta-v per stage: `Δv = Isp · g0 · ln(m_full / m_empty)`, g0 = 9.81 m/s².
- One delta-v bar for the whole plan: each maneuver a segment, each stage (rocket and payload) a band, so the player sees which stage pays for which leg.
- Thrust-to-weight ratio (TWR) at ignition of each stage, against local gravity where it fires. Launch from Earth needs TWR above 1.
- Power and data rate at the destination versus instrument needs.
- Total mass and estimated cost.

## Rocket versions and simulation

**User direction:** sliders set the exact stats of each part for a rocket version. That version can be tested in simulation.

**User direction:** the test runs live on every slider move or maneuver edit, and parts are sent to procurement one at a time (see [UI](ui.md)).

**Proposal:**

- The design being edited is the working version and is always tested live. The planner saves snapshots as numbered versions (Rocket A v1, v2, …) to compare alternatives; sending a part to procurement also saves one.
- The test flies the working version through the current maneuver plan and reports per maneuver: delta-v available versus required, TWR, power and data, hazards, and where the plan fails (for example "out of fuel during Mars insertion").
- Versions need no other role, which keeps the planner busy concurrently (D-004).

## Research limits

**User direction:** each slider shows the current research limit, but the planner can test versions beyond it to plan ahead. The planner can also plan with parts that are not unlocked yet. This includes instruments: the planner can plan with instruments better than the state of the art.

**Proposal:**

- A slider marks the research limit; the range beyond it is shaded. Locked parts appear in the parts list with a lock icon and can still be placed.
- A version exceeding a research limit or using a locked part is flagged "beyond research" and lists which limits and unlocks it needs.
- Instrument performance (for example camera resolution) is a slider with a research limit, like engine Isp. Higher performance costs mass, power, and data rate. (Assistant interpretation of "instruments better than state of the art".)

## Link to procurement

**User direction:** the planner does not shop (I-031). When the planner publishes tested part needs as shared Tasks, each slider value becomes the task's minimum, for example "engine, hydrogen/oxygen, Isp at least 340 s, thrust at least 900 kN". This applies to payload components too.

**Proposal:**

- When procurement contracts a real part, its actual stats replace the slider values in the design, and the live test reflects them.
- Mass is derived, not a slider, so it has no minimum. A contracted part can meet every minimum and still be heavier; the live test shows whether the plan still works.

## Part lifecycle

**User direction:**

- A contract can be cancelled, but cancelling does not refund the full cost.
- A delivered Contract records that its resource is available for use and Allocation at no further procurement cost.
- A contracted or delivered part cannot be changed. If the planner needs something different, that requires an entirely new contract.
- Only procurement can cancel a contract. (Assistant reading: the game has no planner-side cancel request; the planner asks procurement by talking to them.)
- One level is one mission. Parts and contracts exist only within that level; nothing carries over to another mission. Within the level, a delivered part stays available to the design until launch.

**Proposal — states of a part in the design:**

| State | Meaning | Planner can edit sliders? | Cost |
| --- | --- | --- | --- |
| Draft | in the design, need unpublished | yes, freely | none |
| Task published | shared need can be addressed through several roles | yes; the task's minimums update | none |
| Contracted | contract signed; part on its way, arriving on the delivery date | no, stats fixed to the contracted part | price committed at signing |
| Delivered | Contract records available resource quantity | no | none further |

Changing a contracted or delivered part:

1. The planner unlocks the part in the design; this creates a new draft for a replacement part, retaining the old Contract in the design status view.
2. The replacement follows the shared Task and procurement flow and requires a new Contract. Task identity is handled by the planner/shared Task design.
3. The old Contract keeps running unless procurement cancels it. A delivered Contract remains in the Contract list, which acts as inventory.

Cancellation refund: the refund is a share of the price that shrinks as the delivery date approaches, from 50% right after signing to 0% on delivery. Values are placeholders for balancing.

D-008 confirms contract-only inventory. A delivered Contract represents the continuing availability of the supplied resource. Allocation connects that availability to shared Tasks.

## Beyond-research parts

**User direction:** a part beyond current research becomes one task, "get that part", with multiple ways to solve it:

- **Research first:** science researches the missing limit or unlock; procurement then buys the part cheaper.
- **Buy without research:** procurement buys it expensively from someone else.
- **Diplomacy:** communications negotiates with another country for the research or the part.

This matches the shared-task idea that a task can have several solutions ([shared tasks](../docs/design/shared-tasks.md)).

## Open questions — beyond-research parts

1. Who picks the solution path for a beyond-research task, and can several paths run in parallel (for example research started while comms negotiates)?
2. What does each path cost the team in time, money, and risk, and how does the planner see that before submitting?
