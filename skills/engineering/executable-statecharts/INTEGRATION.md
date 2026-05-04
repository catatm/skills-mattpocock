# Integration

Executable statecharts compose with the other engineering skills. They do not replace domain language, deep modules, or TDD.

## `/grill-with-docs`

During grilling, look for stateful concepts and machine ownership:

- What named states can this concept be in?
- Which events cause transitions?
- Which transitions are forbidden?
- Which guards decide whether a transition is legal?
- Which effects happen on entry, exit, or transition?
- Which existing/planned owner machine should this concept belong to?

Only add domain terms to `CONTEXT.md`. Do not add implementation details like XState event names unless domain experts use those names. Do not interrupt the grilling session to invoke this skill; apply the discovery questions inline and hand off after the current branch is resolved.

## `/to-prd`

When executable statecharts are relevant, include them in **Implementation Decisions** under `Stateful Models`. This is an ownership inventory, not a commitment to implement every machine up front.

Example:

```md
- **Stateful Models**: The Game Flow lifecycle will be represented by an executable XState machine. Machine code is the source of truth; no generated diagram artifacts will be committed.
```

## `/to-issues`

Vertical slices that touch stateful behavior should include a `## Stateful model` section. `/to-issues` owns writing the stateful issue details so `/tdd` has enough context to apply this skill without a separate manual invocation.

Example:

```md
## What to build

Allow the Player to dash from Idle or Moving, enter Cooldown after the dash duration, and reject dash input during Cooldown.

## Stateful model

- **Owner machine**: PlayerMachine
- **Owns**: Player control lifecycle
- **Existing states/transitions**: Idle and Moving already exist
- **This slice adds**: Dashing, Cooldown, dash pressed, dash duration elapsed, cooldown elapsed
- **Out of scope**: Stunned and Dead
- **Transition tests**: Idle/Moving -> Dashing, Dashing -> Cooldown, Cooldown rejects dash
- **Adapter wiring**: Input adapter sends dash events; it does not own dash legality

## Acceptance criteria

- [ ] The Player state machine includes the legal dash and cooldown transitions
- [ ] Tests cover dash from Idle/Moving and rejected dash during Cooldown
- [ ] The input adapter sends dash events instead of duplicating transition logic
```

## `/tdd`

`/tdd` owns implementation. If an issue has a `## Stateful model` section or obvious transition-heavy behavior, apply this skill inline:

1. Read the issue's stateful model section.
2. Read [SKILL.md](SKILL.md).
3. Read [VERTICAL-SLICES.md](VERTICAL-SLICES.md) only if machine ownership or slice boundaries are unclear.
4. Write the first failing transition test.
5. Implement the smallest machine change for the slice.
6. Wire adapters after transition tests pass.

Users should not need to manually invoke `/executable-statecharts` before every stateful `/tdd` issue.

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
