# Procurement order feedback and source checks

## User feedback

> 1 can I even chose assurance? what are realistic, real-world parameters that procurists actually have control over?
> 2 this I like, and allows to compensate for external events that can occur that cause delays or cancellations of contracts at inconvenient times...
> 3 ah, like futures trading? I'd leave this optional
> 4 yes, this is a good way to parametrize, but make impacts visible since the player won't have the degrees to estimate themselves
> 5 yes this is what I wanted a while ago, science shouldn't create tasks, people just need to communicate if they need something that is not a part of the final launch
> 6 I'd not make this extra, just multiple orders with different params
> 7 we can try this, just later

Recorded November 14, 2026. Refines I-079 and the [initial proposals](2026-11-14-procurement-order-options.md). Accepted directions are recorded in D-017. Order parameters and their economic effects still need selection.

## Verified external scope

The user's question asks about actual procurement controls beyond the CML matrix. The following US federal acquisition sources were read on November 14, 2026. They establish concrete contract activities. They do not establish game balance or numerical probability curves.

- [FAR 46.201](https://www.acquisition.gov/far/46.201) requires appropriate quality requirements in solicitations and contracts. These range from acceptance inspection to comprehensive quality control. Alternative inspection methods require appropriate technical approval.
- [FAR 9.302](https://www.acquisition.gov/far/9.302) explicitly calls for considering first-article testing's effect on cost and delivery, the risk of foregoing testing, and less costly ways of ensuring quality. This supports concrete testing requirements. A freely selectable assurance percentage was an overly broad assistant abstraction.
- [FAR 11.402](https://www.acquisition.gov/far/11.402) describes establishing delivery schedules with regard to urgency, industry practices, market conditions, transport and production time, and acquisition lead time.
- [FAR 5.203](https://www.acquisition.gov/far/5.203) assigns solicitation response periods to the contracting officer within applicable minimum periods and exceptions, considering complexity, availability and urgency.
- [FAR 15.304](https://www.acquisition.gov/far/15.304) supports source-selection criteria including cost, quality, past performance and technical factors. The acquisition team evaluates these together.
- [FAR 46.706](https://www.acquisition.gov/far/46.706) specifies warranty coverage, duration, obligations and remedies such as repair, replacement and price adjustments.
- [FAR 43.103](https://www.acquisition.gov/far/43.103) describes bilateral modifications agreed by the contractor and contracting officer, alongside authorized unilateral modifications. It supports amendments without establishing that acceleration or a discount is always available.

Concrete testing requirements are a candidate parameter subject to technical needs. Operational reliability and timely delivery probabilities would be modeled consequences with a clearly named outcome. The sources provide no universal rule that additional calendar time automatically lowers price or raises reliability.

## Resulting direction

Contract amendments and Call response deadlines are accepted. Deadline consequences must be visible and understandable. Science's resource needs use conversation and direct purchases usable by the department, without Science-created procurement Tasks. Multiple differently parameterized orders cover different delivery quantities and dates. Production-slot reservations remain optional, and bespoke supplier recovery events are for later exploration.

The earlier reservation proposal means paying to hold production capacity with a later confirmation deadline. It introduced no tradable contract or resale mechanism. Exact reservation terms remain optional and unspecified.

The current integrated Science implementation still creates a test-unit Task and derives its bonus from that Task's delivered Allocation. That implementation needs revision to meet D-017. This discussion records direction only and does not change executable code.
