# XState

Use XState when a concept has meaningful lifecycle rules, not just state-shaped data.

## Source of Truth

The canonical artifact is executable machine code:

```text
src/machines/gameFlow.machine.ts
src/machines/player.machine.ts
src/machines/orderFulfillment.machine.ts
```

Do not hand-maintain equivalent Mermaid, Markdown, SVG, or generated docs. If the user needs a visual view, open the machine in Stately Studio, an XState visualizer, or editor tooling from the code.

Only commit generated views when the user explicitly needs publishable documentation and CI verifies freshness.

## Recommended Shape

```ts
import { setup } from "xstate";

export const gameFlowMachine = setup({
  types: {
    context: {} as {
      retryCount: number;
    },
    events: {} as
      | { type: "start" }
      | { type: "assets.loaded" }
      | { type: "pause" }
      | { type: "resume" }
      | { type: "player.died" }
      | { type: "restart" },
  },
}).createMachine({
  id: "gameFlow",
  initial: "menu",
  context: {
    retryCount: 0,
  },
  states: {
    menu: {
      on: {
        start: "loading",
      },
    },
    loading: {
      on: {
        "assets.loaded": "playing",
      },
    },
    playing: {
      on: {
        pause: "paused",
        "player.died": "gameOver",
      },
    },
    paused: {
      on: {
        resume: "playing",
      },
    },
    gameOver: {
      on: {
        restart: "loading",
      },
    },
  },
});
```

## Naming

- File: `<domainConcept>.machine.ts` (`gameFlow.machine.ts`, `playerDash.machine.ts`)
- Export: `<domainConcept>Machine` (`gameFlowMachine`)
- Events: use domain language and dotted names for external facts (`assets.loaded`, `player.died`)
- States: use domain nouns/adjectives (`loading`, `playing`, `cooldown`)

## Boundary

The machine should own transition legality, not all implementation.

Good:

- Guards check whether a transition is allowed.
- Actions call a domain module or adapter.
- Actors represent async work.
- Framework code sends events and observes snapshots.

Avoid:

- Rendering, database access, animation math, or large gameplay calculations directly inside the machine.
- Repeating the same state transition logic in a React component, Phaser scene, controller, or job handler.
- Building a second diagram by hand to explain the machine.
