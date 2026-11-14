# Communications: first questions — November 14, 2026

Source: multiple-choice answers in a Claude Code session ("lets look into the communications player… ask me relevant questions"). Each line gives the question and the user's answer; free-text answers are quoted verbatim.

## Round 1

- Which outside parties (stakeholders) does comms deal with? → all four offered: "Government / politicians", "Industry / suppliers", "Public / media", "Foreign agencies + universities"
- Core resource? → "Relationship per stakeholder (Recommended)" (one trust meter per stakeholder)
- Balance of play? → "Both, events + projects (Recommended)" (inbox of incoming events plus proactive projects in parallel)
- Can other players send requests to comms in the game? → "No, only via talking"

## Round 2

- How do events get into the game? → all four offered: "Scripted mission timeline", "Triggered by game state (Recommended)", "Random pick from authored pool", "Caused by other players"
- Foresight on dialogue choices? → "Hints, not numbers (Recommended)" (options show which stakeholders they affect, exact amounts revealed after)
- Unanswered events? → "Expires with default outcome (Recommended)"
- Project costs? → "Money (mission budget)", "Calendar time", "Relationship with others"

## Round 3

- How do other players learn about consequences? →
  > there should be an event system which works the same on each station? every station can under some circumstances trigger events which can effect random stuff. this ofc could look like a news feed ig
- What do trust levels do? → "Unlock project options", "Change event odds", "Passive modifiers"
- What does a successful negotiation deliver? → all four: "A part (contract) (Recommended)", "Research", "Money", "Services"
- Comms events during the flight? → "Yes, resolved by trust (Recommended)" (authored in-flight events decided automatically by relationship levels at launch), plus:
  > i like this but it shouldnt be too many and the impact shouldnt be super bad. also maybe we could have the same thing happen for sciene and procurement

## Round 4

- Presentation? → "Recurring characters (Recommended)" (each stakeholder has a named face; events come as messages with portrait and dialogue options)
- Pacing? → "About 1 per real minute (Recommended)"
- Concurrent projects? → "2–3 slots (Recommended)"
- Where is the shared event system specified? → "Project-wide doc (Recommended)", plus:
  > this and we should make sure that we can tell apart what is an external event for comms only and what is an internal event that effects the mission/other stations

## Round 5

The first layout question used ASCII-art previews; the user answered "um that aski mockup turned out glitched. pls dont use ascii" and skipped the other three questions: "i skipped them because i want to see proppermockup first". Two rendered HTML mockups were then shown ([mockups/layouts.html](../mockups/layouts.html)).

- Station layout? → "A · Inbox-centred"
- How does a negotiated part reach the planner's rocket? → "Offer to procurement" (the deal becomes a cheap offer in procurement's list; procurement still decides and signs)
- Comms staff? → "No staff, slots only"
- Do final trust levels count in the result? →
  > goals only and we had the idea for those auto resolved events during the final mission simulation at the very end?

## Before implementation

- Build approach? → "Standalone app + stand-ins (Recommended)" (communications/app with the planner's stack; a dev drawer fakes the other stations; shared event-system code in a new top-level shared/ folder)
- Who writes the content? → "Claude drafts, proposals = baseline (Recommended)" (Claude authors the events, project catalogue and trust numbers; the user reviews and changes later)
- Tone? → "Light satire, grounded (Recommended)"
- Portraits? → "Stylised initials (Recommended)"
