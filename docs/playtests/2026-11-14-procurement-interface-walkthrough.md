# Interface walkthrough — 2026-11-14 — procurement research improvements

- Status — completed manual browser walkthroughs, with independent resets between the cases below.
- Facilitator — assistant.
- Participants and roles — assistant operating procurement. Other stations were represented by explicit fixture controls. No human multiplayer session took place.
- Files — `procurement/mockups/catalogue-full-hd.html` and `catalogue-full-hd.js`.
- Rules — authored Resources, Contracts as inventory, one shared Budget, payment on delivery, 50% active cancellation cost, manual agency-calendar advancement. All numerical values are fixture choices.
- Related material — D-004–D-011, I-052–I-054, Q-014, Q-019–Q-028, Q-031.
- Question — do the revised flows preserve discovery, accurate commitments and coverage, and useful procurement activity during change?

## Hypothesis

A player can inspect a need without losing the wider catalogue, distinguish promised from ready supply, and review changed facts without silently signing stale terms. A discrepancy in the rendered Budget, quantity accounting, criteria or Contract state would count against the implementation.

## Setup

A 1920 × 1080 browser viewport. Initial funding 180, spent 24, committed 36 and available 120 credits. Fifteen original catalogue Resources cover research, personnel, flight hardware and services. Six original shared Tasks have supplied criteria and dates. The authored calendar starts September 2028.

No random outcomes were used. Each case reloaded the authored initial state unless its sequence says otherwise.

## Actual sequences and observations

| Case | Actions and observed result |
| --- | --- |
| Broad discovery | Focused propulsion. All 15 original Resources remained browsable. Explicit Matches only reduced the view to two catalogue engines. Clearing focus restored the broad view. |
| Funding during confirmation | Opened a 22-credit bench confirmation, then applied the −70 funding outcome. Funding became 110 and available Budget 50. The dialog showed changed facts and Budget 50 → 28. Its first confirmation click reviewed the update and left the Contract count at four. The next click created the Contract. |
| Promise versus delivery | After the bench purchase, the materials Task showed 0 ready, 1 promised, 1 missing. Hired Leila for 18. After one month both arrived, and it showed 2 ready, 0 promised, 0 missing. Available Budget stayed 10 after moving the two payments from committed to spent in the funding-cut fixture. |
| Persistent changes | The Changes view retained the funding cut, both signing outcomes and both deliveries, with dates, causes and review routes. |
| Independent work during a Call | With Personnel selected and search set to Ravi, opened a propulsion Call. Returned to the same one-item Ravi result and search. Procured Ravi while the Call was pending. |
| Revised criteria and Call response | Raised the engine requirement to 940 kN while its Call was pending. After two months, the Call showed opening revision 1 and current revision 2. Its Pioneer Offer still met the criteria. Comparison with Atlas explicitly showed Atlas 20 kN below the current requirement. |
| Bulk allocation | Published the two authored computer Tasks. Bought three workstations unallocated for 24. Allocated two units to T-031 and one to T-032. The Contract showed 3 total, 0 free, and no further Allocate action. Available Budget was 96. Releasing T-032 left 1 free while retaining T-031 ×2 and the same Budget. |
| Supplier delay | Procured Atlas for 44. Its authored delay moved delivery to May 2029. The Contract explicitly warned that T-014 needed it by April. |
| Changed need after commitment | Applied the 940 kN revision after the Atlas purchase. The 44-credit Contract stayed recorded and showed the 20 kN shortfall. Cancelling it cost 22, retained its history, and left 98 available in that independent fixture. |
| Delivery during cancellation review | Opened cancellation for Atlas, then advanced three months. It delivered before cancellation was confirmed. The dialog stated Delivered, retained 76 available, and disabled the active cancellation action. |
| Existing delivered supply | Published the computer needs and allocated the existing C-001 laboratory computer to T-031. It became one ready unit with zero free units on that Contract. Available Budget stayed 120. |
| Withdrawn Task | Bought and delivered the bench, then applied science's Task withdrawal. The Task requested reservation review. Releasing C-005 retained it as Ready with one free unit and kept available Budget at 98. |
| Research alternatives | Applied the authored research outcome. Comparison showed external instrument at 29 credits and 94% reliability against domestic instrument at 21 credits and 90%, with the same arrival in that case. Both routes remained accessible. |

The final layout inspection confirmed a 1920 × 1080 viewport and no price rows overflowing their Resource cards. Selecting a new Resource reset the inspector scroll position. The browser console reported no errors during the inspected sequences. JavaScript syntax was checked with `node --check`. No software test suite was added or run.

## Committed plan and resolution

No complete mission was committed or simulated. Each sequence exercised local procurement state. These were separate resets, not one campaign or playthrough.

## Interpretation

The observations support the listed interface transitions, accounting examples and useful independent procurement work during a Call. They provide no observations of enjoyment, human comprehension, actual spoken negotiation or concurrent activity across human-operated roles. Other interpretations of the proposed economy and personnel system remain open.

## Follow-up

- Experience the catalogue and Budget loop with people occupying the other roles before judging fun or all-role concurrency.
- Check whether highlighting and comparison help discovery or add distraction.
- Decide economic, staffing and timed-service rules when those prototype questions become relevant.
- No new gameplay rule was accepted through this walkthrough.
