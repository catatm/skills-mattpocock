# Issue 001: Build the Round Shell and Player Movement

## What to build

Create the first playable tracer bullet: a Canvas 2D Round with a visible Player, bounded Play Area, Round Timer, pause/resume, win by timer, restart, and basic HUD.

This slice establishes the app shell and the Round Machine as the lifecycle owner. It should not implement Hazards, Pickups, Dash, Shield, Combo Chain, or Waves yet.

## Acceptance criteria

- [ ] The game opens to a ready Round State with a start control.
- [ ] Starting the Round transitions to active and begins a 60-second Round Timer.
- [ ] The Player can move with WASD and arrow keys while active.
- [ ] Player movement is clamped inside the Play Area.
- [ ] Pressing Escape while active pauses the Round.
- [ ] Pressing Escape while paused resumes the Round.
- [ ] The Round Timer does not tick while paused.
- [ ] When the Round Timer reaches zero, the Round State becomes won.
- [ ] Restart returns the Round to ready with a reset timer and Player position.
- [ ] The HUD shows real Round Timer, Round State, Score as 0, and remaining Hits as 3.

## Ownership

- **Owner/lane**: Round lifecycle and Play Area movement.
- **Extends**: New Round Machine.
- **Must not own**: Hazard lifecycle, Pickup lifecycle, Dash lifecycle, Shield lifecycle, Combo Chain, Wave pressure, Best Score persistence.
- **Adapter boundary**: Canvas draws snapshots; keyboard input sends movement, START, PAUSE, RESUME, and RESTART intents.

## Stateful model

- **Owner machine**: Round Machine.
- **Owns**: ready, active, paused, and won as the first Round lifecycle states; Round Timer ticking; pause/resume; restart.
- **Existing states/transitions**: None.
- **This slice adds**:
  - States: ready, active, paused, won.
  - Events: START, PAUSE, RESUME, TIME_EXPIRED, RESTART, TICK.
  - Constants: Round length is 60 seconds; Player normal speed is 240 px/s.
  - Pause behavior: pause suspends timer progression and preserves child snapshots; it does not reset child machine state.
- **Out of scope**:
  - lost state transitions from Hits.
  - Collision Resolution.
  - Best Score persistence.
  - Dash disabled/terminal behavior.
- **Transition tests**:
  - ready -> active on START.
  - active -> paused on PAUSE.
  - paused -> active on RESUME.
  - active -> won on TIME_EXPIRED.
  - won -> ready on RESTART.
  - timer ignores TICK while paused.
- **Adapter wiring**:
  - Start/restart controls send machine events.
  - Escape sends PAUSE or RESUME based on the Round snapshot.
  - Animation frame loop sends TICK only when active.

## Blocked by

None - can start immediately.
