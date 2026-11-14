# Mission planner: maneuvers and rocket configurator — November 14, 2026

Source: user messages in a Claude Code session. Original wording preserved below.

## Maneuver planning

> ok so basically we configure a rocket we can steer it though a simplified solar system by setting waypoints.
>
> e.g. first rocket launches is in orbit around earth
>
> we click that orbit to create a maneuver can e.g. raise it to get to the orbit of another planet
>
> click it there again make inseration into that planets orbit
>
> click that again plan landing maneuver there
>
> we calculate delta v cost of each maneuver

## Scope, solar system, and configurator

> all work for this module goes into a respective subfolder!
>
> lets have a simplified model of the inner solar system ig
>
> please no talk about v1 or stuff like this we specify the final system
>
> lets talk about rocket configurator
>
> ig we have different rocket parts?
>
> like engines and tanks and stuff
>
> maybe also different payloads
>
> sliders to configure some simple stats on each part?

## Slider meaning

> slider sets the stats for that version of the rocket which can then be tested in simulation

## Version to procurement tasks

Asked how a tested version becomes procurement tasks (options offered: slider values become minimums, or the planner sets bounds by hand). User chose:

> Slider values = minimums

## Configurator open questions — answers

Questions asked as multiple choice. Chosen option or free-text answer quoted.

- Stacked stages or single body? → "Stacked stages (Recommended)"
- Extra part categories (power solar/RTG, antenna, landing legs)? → "i like all of these! but ig they mostly apply to the payload, right?"
- Ion/electric engines in scope? → "Yes, simplified"
- Does the payload become a procurement task? → "yes and payload probably has multiple components like rocket"
- Can the payload carry its own engine and tanks (e.g. descent stage)? → "Yes, own stages (Recommended)"
- Expendable or reusable stages? → "All expendable (Recommended)"
- Do slider limits depend on science unlocks? → "you see current research limits on slider but can chooce to test rockets which are beyond current research level to plan ahead. same for unlocks you can plan with parts that are not unlocked yet"

## Follow-up answers

- What happens to a procurement task from a "beyond research" version? → "multiple options to get parts. research yourself and then procure cheaper. dont research and procure expensive from someone else. or maybe even have comms talk to some other country to get research or part. one task which is simply get that part and multiple ways to solve it"
- How do instruments get into the payload design? → "again mission planner can plan with instruments that are better than state of the art"
- Who owns the payload design? → "Planner alone (Recommended)"
