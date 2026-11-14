# Mission planner: solar system and maneuvers — November 14, 2026

Source: multiple-choice answers in a Claude Code session. Each line gives the question and the user's chosen option.

- Which bodies exist? → "Inner + belt + Jupiter system" (Sun, Mercury, Venus, Earth, Moon, Mars, Phobos, Deimos, Ceres, Vesta, Jupiter, and Jupiter moons)
- Orbit shape? → "Circular, flat (Recommended)"
- How does clicking an orbit create a maneuver? → "Pick type + tweak (Recommended)" (menu of maneuver types, each with a few sliders)
- Can a transfer leave outside the ideal window? → "Yes, trade Δv vs time (Recommended)" (pick departure date and travel time; off-window or faster transfers cost more Δv)
- Which Jupiter moons? → "All 4 Galilean (Recommended)" (Io, Europa, Ganymede, Callisto)
- Gravity assists? → "Yes, as flyby type (Recommended)"
- Can the payload split into several spacecraft with separate plans? → "Yes, separation maneuver (Recommended)"
- Return trips (ascent, transfer back, Earth entry)? → "Yes (Recommended)"

## Follow-up answers

- Do body environments (Jupiter radiation, Venus surface heat, weak sunlight far from the Sun) create part requirements? → "Yes, as requirements (Recommended)"
- How does flight time relate to real-time play? → chose "Planning separate from flight" (planning/procurement in real time; flight simulated at the end in fast-forward) and added: "and also planning is basically instant. as soon as you give command for maneuver it is executed completly you dont have to wait. only at the very end of the game you get one dramatic fast forward playthrough of the entire mission where you see if everything has worked out in the end"
- Jupiter moon-to-moon transfers and moon flybys? → "Same type + moon flybys (Recommended)"

## Agency calendar

The assistant rewrote the time model as play time, mission time, and the final playthrough, and proposed an agency calendar advancing with play time (research, deliveries, and events count on it; the planner sets the launch date on it; play ends when it reaches the launch date). Asked whether that calendar runs during play, the user answered:

> Yes, calendar runs

## Final playthrough and calendar rate

- All-or-nothing or partial success? → "Partial, per goal (Recommended)" (several goals such as reach orbit, land, return sample, instrument data; each scored separately)
- Chance in the playthrough? → "Yes, reliability rolls (Recommended)" (each part can fail based on its reliability; plan shows a risk estimate beforehand)
- Calendar rate? → "1 min = 1 month (Recommended)"
