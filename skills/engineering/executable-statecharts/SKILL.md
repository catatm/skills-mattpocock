---
name: executable-statecharts
description: Design and maintain executable XState statecharts as the source of truth for stateful behavior. Use when implementing workflows, UI flows, game lifecycle, entity states, async processes, or any feature with legal/illegal state transitions.
---

# Executable Statecharts

Use executable XState machines for behavior with real states, legal transitions, guards, and effects. The machine code is the model.

This skill is usually applied by `/tdd` while implementing a vertical slice. Invoke it directly only for statechart design, review, diagnosis, or when machine ownership is unclear.

## Core Rules

- **XState machine code is the source of truth.** Prefer `src/machines/<name>.machine.ts` or the nearest existing convention.
- **Do not maintain duplicate diagrams.** Do not create Mermaid, Markdown, SVG, or generated-doc mirrors by default. Use Stately Studio, the XState visualizer, or editor tooling to view the machine from code.
- **Model only meaningful state.** Reach for a statechart when behavior has legal/illegal transitions, nested states, guards, timers, async actors, or event-driven lifecycle rules.
- **Do not model ordinary data.** Simple booleans, static config, plain records, and pure calculations usually do not need XState.
- **Keep implementation behind seams.** The machine owns transition legality. Actions, actors, and guards should call domain modules rather than absorbing all business logic.
- **Adapters send events.** UI components, Phaser scenes, controllers, jobs, and HTTP handlers should not duplicate transition logic outside the machine.
- **Test the model.** Cover legal transitions, illegal transitions, guards, and important actions.
- **Build vertically.** Plan machine ownership broadly, but implement only the states, events, and transitions needed by the current vertical slice.

Class diagrams and model-driven code generation are out of scope for v1. Use this skill for executable statecharts only.

## Anti-Pattern: Horizontal Statechart Pass

Do **not** implement every planned machine or every planned state before user-visible slices need them. That creates the same horizontal-slice problem `/tdd` rejects.

Wrong:

```text
Design the whole app, then implement GameFlowMachine, PlayerMachine, EnemyMachine, and AbilityMachine before features are built.
```

Right:

```text
Identify the owner machines during planning. Then each vertical slice creates or extends only the machine behavior needed for that slice.
```

See [VERTICAL-SLICES.md](VERTICAL-SLICES.md) when machine ownership or slice boundaries are unclear.

## Process

### 1. Identify the slice and owner machine

Read the project's `CONTEXT.md` and ADRs first. Name the machine with the project's domain language, not implementation jargon.

If invoked from `/tdd`, start from the issue's `## Stateful model` section. Do not re-ask questions already answered there.

Good candidates:

- Game flow: menu -> loading -> playing -> paused -> game over
- Entity lifecycle: spawning -> active -> stunned -> dying -> dead
- UI flow: viewing -> editing -> saving -> failed
- Async process: idle -> loading -> success/failure -> retrying

Bad candidates:

- A value object with no lifecycle
- One conditional with no transition rules
- A helper that is already a pure calculation

### 2. Design the smallest machine change

List:

- **Owner machine** - existing or planned machine this slice should extend
- **States** - stable named situations the concept can be in
- **Events** - external facts that cause transitions
- **Forbidden transitions** - events that must be ignored or rejected in some states
- **Guards** - conditions that decide whether a transition is legal
- **Actions/actors** - effects triggered by transitions or state entry
- **Out of scope** - planned states/transitions that must not be implemented in this vertical slice

If the statechart is hard to explain in one screen, split it into smaller actors or nested machines before coding.

### 3. Implement as XState code during TDD

Use XState v5 unless the project already uses v4.

See [XSTATE.md](XSTATE.md) for code shape. The machine should be importable into visual tools from `createMachine()` code, but the repository should not depend on committed diagram artifacts.

### 4. Test the transitions

Write behavior tests before wiring adapters. Implement only the states/events/transitions required by the current slice:

- Legal events reach the expected state
- Illegal events do not reach forbidden states
- Guards permit and block transitions correctly
- Important actions/actors are invoked through observable outcomes

See [TESTING.md](TESTING.md).

### 5. Wire adapters last

Framework code should translate external input into machine events and render/act from the machine snapshot. If adapter code contains its own lifecycle conditionals, challenge it: the statechart may no longer be the source of truth.

See [INTEGRATION.md](INTEGRATION.md) for how this composes with the other engineering skills.
