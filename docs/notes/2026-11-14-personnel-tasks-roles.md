# Personnel, shared tasks, and roles — November 14, 2026

Source: user message following the earlier brainstorming. Original wording is preserved below. Ideas remain brainstorming except the explicitly stated authored-content baseline.

> do we want a personalsystem for every role? specific people, stats, they get smarter, better. everyone can manage their people. RP can shop for new people.
>
> open question: do we have fun individuals with name and skills that evolve? or do we have an abstraction of just "X people in area Y" to allocate like power to ship parts in starfield? or simplest: you just have X people in department, you need Y, buy more.
>
> but without individuals, it's all just money allocation sliders, meh. but we'd like to communciate the complexity of training qualified personnell, and it should be a consistent system for all
>
> basics: no runtime dynamic generation
>
> we hand-craft the missions, part lists, possible events etc
>
> OPEN QUESTIONS:
>
> 1. how do we keep track of what things we have procured? (parts, contracts?? especially stuff that we discarded)
> 2. how do we keep track of when we need what parts? (assembly times)
>
> global lists of tasks/problems/goals
>
> - different completion criteria, could be and/or
> - not obvious what role necessarily has to complete it
> - e.g. need an engine for mission params
> - every task must have at least 1 solution
> - this is the heart. we start with one task "get X done"
> - and you uncover new tasks while you go, and complete some
>
> The roles for players, interactions, different minigames
>
> - science says what we do, in details. also tech tree or research to make things easier, including resources, comms. the idea: allocate research projects, progress different disciplines, enable new stuff like resources for procurement
>   - core mechanics: research projects. allocates researcher onto projects, projects have duration
>   - projects have rough idea of rewards, but never precisely
>   - some just straight up fail "yay we found a rock from space"
>   - some may unlock new research projects or EVENTS, or maybe
>   - projects also need budget, maybe procurement
> - resource procurement (RP):
>   - manages money, gets requests with constraints from others
>   - they basically have a huge catalogue of existing things to procure
>   - AND ausschreibungen: can in theory solve every single problem in the list with enough money, time, risk
>     - get different offers, decide whether to do that
>   - has a list of procurement contracts (inventory) and manages it
>     - we never own things, only contracts
>     - cost for cancellation, risks, delays, minimum duration until there
> - mission planning - design mission from launch, payload & target
>   - solves physical problems by simulating the missions (2D simplified)
>   - configures payloads, sends them onto orbits, sees key parameters, launch windows
>   - impacts/steers/adjusts the goals, also on demand while things run
>   - science can e.g. unlock new mission planning options
>   - does NOT shop for individual tasks
>   - has a set of mission constraints (from start AND from events that happen during play)
>     - has to turn them into a list of tasks, e.g. "I need part or human with at least X and at most Y"
>     - when sure enough in configurator UI, create a task
>     - can also edit their tasks afterwards
> - comms
>   - visual novel gameplay
>   - inputs: tons of outside events. those that cannot be handled get turned into consequences
>     - consequences might be e.g. new mission constraints, changed mission constraints
>     - or delayed contracts, cancelled contracts, higher risks, research blockers
>     - more funding, less funding
>     - possibly positive opportunities!
>   - proactively organize galas or build relations or whatever
>     - mechanically similar to research projects, maybe different UI/details
>     - with the goal of unlocking more options for science and procurement
>     - can also increase funding or cause outside events that need to be handled
