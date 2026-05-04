# Issue 003: Add Recurring Fair Hazard Pressure

## What to build

Make the Round feel like a real dodging game by spawning Hazards repeatedly while preserving fair play. The Player should see recurring Warning Zones and active Hazards appear at a steady cadence, with unsafe Spawn attempts skipped instead of forced.

## Acceptance criteria

- [ ] Hazard Spawn attempts use Safe Spawn rules.
- [ ] A Safe Spawn cannot immediately collide with the Player.
- [ ] A Safe Spawn cannot immediately collide with an active Hazard.
- [ ] Unsafe Spawn attempts are skipped rather than forced.
- [ ] Hazards Spawn every 1.2 seconds while the Round is active.
- [ ] Recurring Hazards are visible in the browser as Warning Zones before they become active.
- [ ] The Player can dodge recurring active Hazards until the Round ends.
- [ ] Hazard Spawn timers do not tick while paused, won, or lost.
- [ ] Restart resets the Spawn timer and clears active Spawn attempts.
- [ ] Browser verification confirms recurring Hazards appear, pause freezes Spawn cadence, and restart clears Hazards.

## Ownership

- **Owner/lane**: Fair recurring Hazard pressure through the existing Safe Spawn lane and Spawn timing.
- **Extends**: Hazard Machine only through valid Hazard creation.
- **Must not own**: Wave pressure policy, Collision Resolution, Pickup scoring, Pickup lifecycle, Round lifecycle.
- **Adapter boundary**: The game loop asks for Spawn attempts; Safe Spawn decides whether an object may enter the Play Area.

## Stateful model

- **Owner machine**: Hazard Machine.
- **Owns**: Hazard lifecycle after a Safe Spawn is accepted.
- **Existing states/transitions**:
  - Hazard Machine has warning, active, resolved.
  - Round Machine has active and paused lifecycle.
- **This slice adds**:
  - No new Hazard states.
  - Spawn cadence as visible Round-active behavior.
  - Safe Spawn checks against active Hazards in addition to the Player check from Issue 002.
  - Constants: hazard Spawn interval starts at 1.2 seconds.
  - Event contract: accepted Safe Spawn creates a Hazard in warning; rejected Safe Spawn emits no Hazard event.
- **Out of scope**:
  - Wave Machine.
  - Final Rush.
  - Breather.
  - Pickup Safe Spawn variants.
- **Transition tests**:
  - accepted Safe Spawn creates warning Hazard.
  - rejected Safe Spawn creates no Hazard.
  - Spawn timer does not advance while Round is paused.
  - restarting clears pending Spawn state.
  - recurring Spawn attempts create multiple independent Hazard lifecycles over time.
- **Adapter wiring**:
  - The animation frame loop advances Spawn cadence only from active Round snapshots.
  - Renderer does not decide if a Spawn is safe.
  - Browser view shows recurring Hazards as visible game pressure, not just tested internals.

## Blocked by

- Issue 002: Add Warning Hazards and Hit-Based Loss.
