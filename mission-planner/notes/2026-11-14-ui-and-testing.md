# Mission planner: UI and testing — November 14, 2026

Source: multiple-choice answers in a Claude Code session. Each line gives the question and the user's chosen option.

- How are the map and rocket configurator arranged? → "Map + side panel (Recommended)" (map always visible; configurator, tasks, and versions in a docked side panel)
- When is a rocket version tested against the plan? → "Live, always (Recommended)" (every slider move or maneuver edit re-runs the test instantly)
- How are test results shown? → "On map + Δv bar (Recommended)" (trajectory turns red where the plan fails, warning icons on maneuvers, Δv bar with stage bands versus maneuver segments, goal success chances listed)
- How does a version become procurement tasks? → "Per part (Recommended)" (planner marks individual parts as ready and sends each as its own task; can send the engine early while still tuning the payload)

## Changing contracted parts

Asked what happens when the planner changes an already-contracted part (options: contract stays and the design shows a mismatch, or the change creates a new task), the user wrote:

> this needs to be more specific
> Id say once a part is contracted contract can be canceled but doesnt refund full cost probably
> once contract has run through we have that part and can basicall use it for free now
> if we realized that we need something else we need an entirely new contract

- Who can cancel a contract: only procurement, or can the planner request it? → "Procurement only"
- Can a delivered but unused part be reused in a later design or a later mission? → "one level one mission"
