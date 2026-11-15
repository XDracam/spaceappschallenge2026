# Tasks and player conversation

## Current direction, 2026-11-15

[D-021](../docs/decisions.md#d-021--coordinate-required-cross-role-work-through-shared-tasks) supersedes the conversation-dependent proposal below. Relevant requirements, deadlines, supply status, research progress and cross-role effects must be inspectable through the shared task board. Players may explicitly publish a request with a desired outcome and responsible station. The current-role filter shows open entries with a next action for that role. All tasks shows shared work and progress, with completed/withdrawn history available separately.

Department equipment requests are explicit player coordination records. Procurement still buys department supply through Contracts and Allocations, and Science still reserves compatible equipment through its project controls. Creating or completing a manual request alone changes its coordination record. Generated entries follow the underlying game records. Direct conversation remains available during play.

The November 14 proposal below is retained for history.

Working design proposal, November 14, 2026, following the user's clarification that players coordinate by talking to each other. The earlier assistant support-Task workflow is withdrawn. The exact Task boundary and information visibility remain under discussion.

## Task boundary to explore

A Task records a persistent shared goal or problem with completion criteria the game can evaluate. Players discuss how to solve it and who will act. Its author is provenance. Participation and solutions can span several roles.

Creating a Task requires an explicit design reason to retain and evaluate that goal. A temporary question, recommendation or negotiation belongs in conversation. Existing Budget, Offer, Contract and Allocation records already describe their own state.

| Gameplay situation | Persistent game record | What players say |
| --- | --- | --- |
| Planning discovers an engine requirement | Shared Task with capability, quantity and need-by criteria. | “Can we get something meeting these limits?” |
| The matching engine exceeds available funds | Offer price, Budget and current Task assessment. | “We're 20 short. Can comms find funding, or can we simplify the mission?” |
| A cheaper alternative misses the requested date | Offer terms and Task deadline. | “Can assembly move by five days?” |
| Procurement sees two viable compromises | Offers and the shared goal's criteria. | “We can afford reliable and late, or fast and risky. Which works?” |
| A supplier is delayed | Revised Contract delivery expectation and affected Allocations. | “The engine is late. Can we change the launch or should I replace it?” |
| Science could unlock a useful alternative | Research options and their actual outcomes. | “Would researching this help enough to justify the time?” |
| Players agree to relax a requirement | An explicit revision to the shared Task or mission configuration. | “Let's accept the heavier engine and drop that payload.” |
| An authored scenario makes securing funding an objective | A shared Task with meaningful authored completion criteria, if the scenario calls for it. | Players choose between stakeholder negotiations, scope changes, or other routes. |

The engine example is inherited from the user's brainstorming. The other rows illustrate the proposed boundary. A funding shortfall does not automatically create another Task. An explicit scenario goal involving funding could still be a Task. Whether that adds interesting gameplay needs examination.

## Information and interfaces

System messages apply state changes and maintain consistency. They implement inputs and outputs between systems. Players use speech to explain options, request help, negotiate priorities, and agree on a response.

The shared Task list communicates the persistent goal. Procurement's comparison of Offers can remain in procurement's view. Which Budget, Contract, Allocation and risk details other roles can inspect is still open. Automatic comparison summaries or suggested solutions being shown to every role was an earlier assistant assumption and requires design review.

The interface should help a player reference a concrete Task, Offer or Contract while talking. Examples include stable names and IDs and the exact changed value. Interface support for referencing is a proposal. A role-addressed help inbox and an automatic chain of support Tasks have been removed from the current draft.

## What to validate

- Can players find the enduring goal and tell whether it has been achieved?
- Does obtaining a solution require useful conversation about capabilities, cost, timing, or risk?
- Does shared information let players understand one another without making all roles' discoveries and comparisons automatically visible?
- Do players create additional Tasks because there is a meaningful new goal to track, or merely to repeat something they already said?
- Can several roles address the same problem through different systems without an implied assignee?

This boundary needs a multiplayer walkthrough. A solo procurement prototype can represent the record changes but cannot establish whether the conversation is fun.
