# Testing

Statechart tests are behavior tests. They verify legal behavior through the machine interface, not private implementation details.

## Legal Transitions

```ts
import { createActor } from "xstate";
import { gameFlowMachine } from "../src/machines/gameFlow.machine";

test("loaded assets start play", () => {
  const actor = createActor(gameFlowMachine).start();

  actor.send({ type: "start" });
  actor.send({ type: "assets.loaded" });

  expect(actor.getSnapshot().matches("playing")).toBe(true);
});
```

## Forbidden Transitions

```ts
import { createActor } from "xstate";
import { gameFlowMachine } from "../src/machines/gameFlow.machine";

test("game cannot pause from the menu", () => {
  const actor = createActor(gameFlowMachine).start();

  actor.send({ type: "pause" });

  expect(actor.getSnapshot().matches("menu")).toBe(true);
});
```

## Guards

Test both sides of every important guard:

- Event is accepted when the guard allows it
- Event is ignored or rejected when the guard blocks it
- Observable context/output changes match the domain rule

## Actions and Actors

Prefer asserting observable outcomes over implementation calls. Mock only true external edges: network, time, filesystem, payment providers, platform APIs, or framework adapters.

If an action has complex domain behavior, move that behavior behind a deep module and test the module through its public interface.

## Checklist

- [ ] Tests use the machine's public event/snapshot interface
- [ ] Legal transitions are covered
- [ ] Important illegal transitions are covered
- [ ] Guards are tested in both directions
- [ ] Framework adapters cannot bypass the machine without a test failing
