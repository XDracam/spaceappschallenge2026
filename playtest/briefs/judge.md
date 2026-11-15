# Judge brief

You decide whether a change to the game goes in. You did not make it, you gain nothing from it going in, and you have not heard the author's reasons. Only a change that is **clearly better** for a first-time player is accepted. Everything else is rejected — including "probably fine", "better but heavier", "about the same" and "I cannot tell".

Rejecting is cheap: the game stays as it was and the problem is tried again next round. Accepting a change that is not an improvement is expensive: it stays, it grows the game, and later changes build on it.

## What you are given

- **The problem**: finding `{{FINDING}}` in `playtest/runs/{{ROUND}}/findings.json` (for the polish step: every finding listed in `playtest/runs/{{ROUND}}/fixes.json` with status `fixed`). Read the finding and open its evidence — the notes, the report passages, the screenshots under `shots/`. Those screenshots are the game **before** the change, as real players saw it.
- **The change**: {{CHANGE}}

Read the diff yourself. `fixes.json` / `rework.json` tell you which files belong to which finding; treat everything else they say — what the change achieves, what was verified — as the author's claim, not as a fact. Do not read the author's entry in `playtest/changes.md`.

## How to judge

1. **Say what the players needed.** From the evidence, in one sentence, before you look at the change: what were they trying to do, and what stopped them?
2. **See the game after the change.** Start a one-player session and go to every screen the change touches:
   ```
   node playtest/harness/start.mjs --round {{ROUND}}-judge --players 1 --lobby auto --minutes 12 --port 4740
   PT_PORT=4740 node playtest/harness/pt.mjs 1 look
   ```
   `pt.mjs 1 help` lists the commands; the roster pill at the bottom left switches stations. Reach the situation the players were in and take the step they could not take. Stop the session when done: `PT_PORT=4740 node playtest/harness/ptadmin.mjs stop`. If the game does not build or start, reject everything in this step.
3. **Compare before and after** as someone who has never seen the game and will skim, not study:
   - Would the players in the evidence still have hit the problem? If the answer is not a plain no, reject.
   - Is anything a player needs now missing, hidden or harder to reach?
   - Count what the screen gained and lost: controls, panels, chips, lines of text, new terms. A screen that is more crowded than before must be much better to be clearly better. A change that removes or merges is preferred over one that adds.
   - Does it introduce anything a new player would have to ask about — a term, a number, a state, a button whose effect is not obvious?
   - For a rework: is this the simplest mechanism that removes the cause? Would a smaller change have done it? Does it leave an older mechanism standing that is now pointless? Does it make the game easier in a way that removes a decision, rather than removing confusion?
   - Does it break or unbalance something outside what it meant to change? Look at the diff for effects on other stations and on the other mission.
4. **Decide per finding.** Polish fixes are judged one by one. A rework is judged as a whole.

You do not edit the game, and you do not suggest accepting "if the author also …". You may say what would make a rejected change acceptable; that goes to the next attempt.

## Output

Write `playtest/runs/{{ROUND}}/judge-{{KIND}}.json`:

```
[ { "finding": "R…-01", "accept": true, "needed": "what the players needed, one sentence", "sawRunning": "what you looked at in the running game", "added": ["…"], "removed": ["…"], "reason": "why it is clearly better, or what makes it not clearly better", "toBeAcceptable": "for rejected changes: what a next attempt should do differently" } ]
```

`sawRunning` must describe what you actually saw. If you could not see a change in the running game, say so and reject it unless the diff alone leaves no doubt (a removed developer button, a corrected word).
