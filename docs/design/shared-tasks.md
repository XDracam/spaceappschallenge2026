# Shared tasks, problems, and goals — brainstorm

## Current direction, 2026-11-15

[D-021](../decisions.md#d-021--coordinate-required-cross-role-work-through-shared-tasks) requires sufficient task detail for cross-role coordination through the interface. Every station exposes the same shared board, with a switch between open tasks actionable by that station and all tasks. Players can create, edit, resolve, withdraw and reopen explicit requests with desired outcomes and a responsible station. Live game records supply generated task details and status. Research progress, procurement fulfillment and mission feasibility keep their individual meanings.

The earlier brainstorm below is retained. Its conversation-dependent boundary is superseded by D-021. [Implementation coverage](../reviews/2026-11-15-task-coordination.md) records observed gaps and verification separately.

Source: [personnel and roles notes](../notes/2026-11-14-personnel-tasks-roles.md). This is a proposed heart of the game, not a selected data model or implementation.

## Idea

A global list of tasks, problems, or goals begins with one broad task: “get X done.” During play, players uncover further tasks and complete some. A task could have different completion criteria, including AND/OR combinations, and it may not be obvious which role has to address it. Example: the mission needs an engine that satisfies mission parameters.

The user proposes that **every task must have at least one solution**. What counts as a solution and when that guarantee is evaluated are open (Q-022). A theoretical offer requiring more money, time, or risk than the team can afford may or may not satisfy the intended guarantee; do not assume either interpretation.

## How roles could interact

1. Mission planning starts with constraints, including new or changed constraints from events. It explores the design, then creates and can edit a task such as “a part or person with at least X and at most Y.”
2. RP receives requests and constraints, considers the catalogue or a Call (*Ausschreibung*, or request for proposals), compares offers, and manages resulting procurement contracts. The idea is that a Call can in theory address any problem with enough money, time, and risk. This has not been reconciled with practical feasibility.
3. Science projects may unlock options for mission planning, procurement, or communications; projects may themselves need staff, funding, or procurement.
4. Communications can handle outside events; consequences or positive opportunities may change mission constraints, contracts, funding, risks, or research.

This is an illustrative relationship between user ideas, not a mandatory sequence or assignment of every task to a single role. Task ownership, visibility, coordination, and authorization remain open.

## Conversation and persistent goals

Players coordinate by talking directly. Tasks are shared problems, and the role that can contribute a solution may be unclear. An author records provenance. It does not imply an assignee.

The proposed [Task boundary](../../procurement/tasks-and-conversation.md) retains goals with evaluable completion criteria while players discuss help, compromises and priorities. The assistant's earlier automatic support-Task workflow is withdrawn. Details of this boundary and information visibility need exploration.

## Records and timing — open

- **Procurement record:** how to represent existing, discarded, cancelled, and replaced parts or contracts; whether to keep history and what it means to discard a contract (Q-023).
- **Need and assembly timing:** how to record when components are needed, assembly duration, delivery, and schedule changes (Q-024).
- **Updates:** what happens if planning edits a task after procurement has started or constraints change (Q-025).
- **Concurrent play:** shared dependencies must be reconciled with every role having meaningful activity, avoiding hard waits (D-004, Q-014).

## Example, not a rule

A broad destination goal leads planning to discover an engine requirement. The planner explores the configuration, then posts a requirement with limits. RP examines existing offers or seeks Call offers; science may unlock more options and communications may change constraints. Exactly how tasks are discovered, whether alternatives are feasible, how contracts are represented, and when the engine is needed are open.
