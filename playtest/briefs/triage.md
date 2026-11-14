# Triage brief

You turn one playtest round into a short, ranked list of findings. You do not change any code.

## Inputs (in `playtest/runs/{{ROUND}}/`)

- `reports/p1.md … p4.md` — each player's final report.
- `notes.jsonl` — think-aloud notes logged during play (`kind`, `text`, `shot`, seconds `t`, game phase and day).
- `chat.jsonl` — everything the players said to each other.
- `events.jsonl` — every player command with the game actions it dispatched (`actions`), whether the screen changed (`screenChanged`), browser console errors and page errors.
- `state.jsonl`, `state/*.json`, `final-state.json` — the host's game state over time.
- `summary.json` — per-player counters, lobby/mission timeline, mission result.
- `shots/pN/*.jpg` — what each player saw. Open the ones a note or report points to.
- `playtest/ledger.json` — findings from earlier rounds and what was done about them.

You may read the game source under `game/src/` to confirm a cause. Read the project rules in `AGENTS.md` first.

## What to produce

Write `playtest/runs/{{ROUND}}/findings.json`: an array, worst first, of

```
{
  "id": "R{{ROUND}}-01",
  "title": "one line, what the player could not do",
  "class": "bug | clarity | design | agent-artifact",
  "severity": "blocker | major | minor",
  "players": [1, 3],
  "evidence": ["notes.jsonl t=412 p3", "shots/p3/0041.jpg", "events.jsonl: 6 clicks without a dispatched action"],
  "cause": "what in the game produces this, with file:line if confirmed; say 'unconfirmed' otherwise",
  "proposal": "smallest change that would remove the problem",
  "repeatOf": "id of the same finding in an earlier round, or null"
}
```

## Classes — this decides what may be changed overnight

- **bug** — the game does something other than its own code and texts intend: a crash, a desync, a dead button, a wrong mission loaded, text overflowing its box. Fixable overnight.
- **clarity** — the mechanic works as designed, but the screen did not tell the player what to do, what a term means, what just happened or why something is disabled. The fix is wording, labelling, feedback, affordance, ordering or emphasis. Fixable overnight, small diffs only.
- **design** — the remedy would change a rule, a number that affects balance, the amount of work a role has, what a station can do, or anything `docs/decisions.md` records as decided or `docs/questions.md` records as open. **Never fixed overnight.** These go to the morning list.
- **agent-artifact** — caused by the player being an AI driving a screenshot tool rather than a person: misclicks from coordinate estimation, slow reaction to the calendar, not noticing an animation, `note tool` entries. Count them, do not act on them.

Rules of evidence:

- A finding needs at least one observation from the run. Do not add problems you only see in the code.
- Two or more players hitting the same thing, or one player losing more than three minutes to it, is at least `major`. Something that stops the team from starting or finishing the mission is a `blocker`.
- "A player had nothing to do" is real evidence about waiting for *these* players. It is not evidence about enjoyment, and the absence of complaints is not evidence of fun (`AGENTS.md`, D-014). Say so if you report it.
- If a problem was "fixed" in an earlier round and shows up again, set `repeatOf` and say that the earlier fix did not work.
- When unsure between `clarity` and `design`, choose `design`.

Also write `playtest/runs/{{ROUND}}/triage.md`: ten lines at most — how far the team got, the three worst findings, and what was different from the previous round.
