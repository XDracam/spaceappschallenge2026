# Mission planner: UI feedback after first build — November 14, 2026

Source: user message after trying the first build, with a style reference image (formerly `reference/ui-style-reference.webp`: a dark, glowing space dashboard with a full-bleed planet, glass cards, pill navigation). Publication note, November 15, 2026: the user requested deletion of the image because redistribution permission was undocumented; the original feedback below is preserved.

> why is game time top left pauseable thats weird?
>
> i dont quite get why i cannot launch after a certain date? is this because of the orbital maneuver that was alread set or what?
>
> please make ui style look more like this reference image. ui is wayyyy to complext right now

## Responses

- Pausable calendar: agreed it contradicts the spec (the agency calendar runs with play time). The pause moves to the hidden dev controls; the calendar runs on its own.
- Launch limit: it is the mission's launch deadline (day 1100, 5 Jan 2033), part of the accepted Mars mission content, not caused by maneuvers. Separately, moving the launch after a planned transfer's departure shows a "Departure before arrival in orbit" error.
- Style: the UI is restyled after the reference and simplified (fewer controls visible at once).

## Deadline

> 2 why does mission have launch deadline not completion deadline?

The assistant explained the launch deadline capped preparation time, and proposed a completion deadline instead (still bounds the session; gives the delta-v-versus-travel-time trade-off a purpose). Asked whether one deadline for the mission or one per goal, the user chose:

> One mission deadline

## Starting state

> why do i start with some rocket already in orbit?

The plan started with a built-in launch step, and the map showed today's positions while the launch orbit was drawn at Earth's launch-day position. The assistant proposed starting on the launch pad with an empty plan and showing launch-day positions by default. The user answered:

> Yes, both
