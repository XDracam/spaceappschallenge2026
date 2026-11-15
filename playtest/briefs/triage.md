# Triage brief

You turn one playtest round into a short, ranked list of findings, and you judge whether last round's changes helped. You do not change any code.

## Inputs (in `playtest/runs/{{ROUND}}/`)

- `reports/p1.md … p4.md` — each player's final report.
- `notes.jsonl` — think-aloud notes logged during play (`kind`, `text`, `shot`, seconds `t`, game phase and day).
- `chat.jsonl` — everything the players said to each other.
- `events.jsonl` — every player command with the game actions it dispatched (`actions`), whether the screen changed (`screenChanged`), browser console errors and page errors.
- `state.jsonl`, `state/*.json`, `final-state.json` — the host's game state over time.
- `summary.json` — per-player counters, lobby/mission timeline, mission result.
- `shots/pN/*.jpg` — what each player saw. Open the ones a note or report points to.
- `playtest/ledger.json` — findings from earlier rounds.
- `playtest/changes.md` and `git log` on this branch — what earlier rounds changed. Commit subjects name the round and the finding.
- `playtest/rejected.md` — changes an independent judge turned down, with what a next attempt should do differently. A finding whose rework was rejected or reverted twice is not picked again.

You may read the game source under `game/src/` to confirm a cause.

## Findings

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
  "proposal": "what would remove the problem at its root",
  "remedy": "remove | merge | change | add — the lightest kind of change that would work; see 'Less before more'",
  "symptomOf": "id of the design finding this is a surface symptom of, or null",
  "repeatOf": "id of the same finding in an earlier round, or null"
}
```

Classes:

- **bug** — the game does something other than its own code and texts intend: a crash, a desync, a dead button, developer text on screen, text overflowing its box.
- **clarity** — the mechanic works, but the screen did not tell the player what to do, what a term means, what just happened or why something is disabled. The remedy is wording, labelling, feedback, affordance, ordering or emphasis.
- **design** — the mechanic itself is the problem: a role has nothing meaningful to do, two stations cannot coordinate because neither sees what it needs, a system has no consequence the players can trace, mission content does not fit the mission, the game ends nowhere. The remedy changes rules, content, numbers or what a station can do.
- **agent-artifact** — caused by the player being an AI driving a screenshot tool rather than a person: misclicks from coordinate estimation, `note tool` entries, anything produced by the slowed calendar (see `meta.json` → `speedScale`). Count them, do not act on them.

**Find the root.** Before you class something as clarity, ask whether better wording would actually solve it. "The result does not say what I gained" is clarity if there was a gain; it is a symptom of a design finding if there was nothing to gain. Set `symptomOf` on symptoms: they will not be polished, the root will be reworked instead.

Rules of evidence:

- A finding needs at least one observation from the run. Do not add problems you only see in the code.
- Two or more players hitting the same thing, or one player losing more than three minutes to it, is at least `major`. Something that stops the team from starting or finishing the mission is a `blocker`.
- Idle time counts only for the part the calendar speed does not explain. Work out how long the wait would have been at normal speed and say so.
- "A player had nothing to do" is evidence about waiting for these players. It is not evidence about enjoyment, and the absence of complaints is not evidence of fun.
- Agents read every word on the screen. If the team succeeded only because someone read a long text that a person would skim, say so.

## Less before more

The players are agents: they read every word and never tire of a crowded screen, so they will not tell you that a station shows too much. You have to look for it.

- From `events.jsonl` and the screenshots, list what this round's players **never used**: tabs never opened, panels never clicked, controls never touched, mechanics no one engaged with. Add those that also went unused in earlier rounds (see `ledger.json`) as findings of class `design` with `remedy` `remove` or `merge`. One round of non-use is a note, two is a finding.
- When players were confused by something, ask first whether the game needs that thing at all. A term nobody could explain, a number nobody acted on, a choice with one sensible answer: the remedy is to remove or merge it, not to explain it.
- For every finding choose the lightest `remedy` that works, in this order: **remove** (the element goes), **merge** (two things become one), **change** (same amount of game, different wording or behaviour), **add** (new element). Choose `add` only when nothing lighter solves it, and say why.

Record in `triage.md` a line `Unused this round: …`.

## Did last round's changes help?

For every change made after the previous round (see `playtest/changes.md`):

- **helped** — the finding it answered did not come back, and nothing new traces to it.
- **no effect** — the finding came back. Set `repeatOf` on the new finding and say what the change missed.
- **harmed** — the team got less far, or a new major/blocker finding traces to this change.

Also say for each change **what it added and whether it was used**: which new controls, panels or texts the players actually touched or mentioned, and which they ignored. A change that solved its finding but left unused additions needs a follow-up to trim them; list that as a finding with `remedy` `remove`.

Put the commit hashes of **harmed** changes in your answer's `revertCommits`. Be sure before you do: one unlucky round is not harm. A change that needs a follow-up is not harm either; say what follow-up.

## What to rework next

Choose the one design finding whose rework would improve play most, counting every round so far, not only this one. Prefer: a root that several players hit, a root with many symptoms, something not yet attempted. Skip a finding whose rework was reverted twice. Name it in `reworkPick` (its id) with one sentence why. Use an empty string if no design finding is open.

## Summary

Write `playtest/runs/{{ROUND}}/triage.md`, fifteen lines at most: how far the team got; the three worst findings; verdict on each of last round's changes; the rework pick; what differed from the previous round.
