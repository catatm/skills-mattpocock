# Integration

Executable statecharts compose with the other engineering skills. They do not replace domain language, deep modules, or TDD.

## `/grill-with-docs`

During grilling, look for stateful concepts:

- What named states can this concept be in?
- Which events cause transitions?
- Which transitions are forbidden?
- Which guards decide whether a transition is legal?
- Which effects happen on entry, exit, or transition?

Only add domain terms to `CONTEXT.md`. Do not add implementation details like XState event names unless domain experts use those names.

## `/to-prd`

When executable statecharts are relevant, include them in **Implementation Decisions** under `Stateful Models`.

Example:

```md
- **Stateful Models**: The Game Flow lifecycle will be represented by an executable XState machine. Machine code is the source of truth; no generated diagram artifacts will be committed.
```

## `/to-issues`

Vertical slices that touch stateful behavior should update the model, tests, and adapter wiring together.

Example:

```md
## What to build

Allow the Player to dash from Idle or Moving, enter Cooldown after the dash duration, and reject dash input during Cooldown.

## Acceptance criteria

- [ ] The Player state machine includes the legal dash and cooldown transitions
- [ ] Tests cover dash from Idle/Moving and rejected dash during Cooldown
- [ ] The input adapter sends dash events instead of duplicating transition logic
```

## `/tdd`

Use the statechart as a public behavior interface. Write the first failing transition test, make it pass, then wire the adapter.

## `/diagnose`

For state bugs, check:

- Missing transition
- Invalid transition allowed
- Guard too broad or too narrow
- Action firing in the wrong state
- Adapter bypassing the machine
- A second source of truth duplicating the machine

## `/improve-codebase-architecture`

Statechart drift is architectural friction. Surface candidates when:

- Stateful conditionals are scattered across callers
- Multiple modules store the same lifecycle state
- Framework adapters own domain transitions
- Machine actions contain too much implementation
- A hand-written diagram/doc duplicates executable machine code

The fix is usually to move transition legality into an executable machine and keep domain behavior behind deep modules.
