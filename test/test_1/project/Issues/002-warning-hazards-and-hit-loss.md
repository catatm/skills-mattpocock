# Issue 002: Add Warning Hazards and Hit-Based Loss

## What to build

Add Hazards that use the first Safe Spawn rule, appear as Warning Zones, become active after the warning period, and cause Hits only while active. The Player loses the Round after exactly three accepted Hits.

## Acceptance criteria

- [ ] Hazards enter the Play Area as Warning Zones.
- [ ] A Hazard Safe Spawn cannot immediately collide with the Player.
- [ ] Warning Zones are visible and cannot cause Hits.
- [ ] A Warning Zone becomes an active Hazard after 500 ms if its Spawn is still safe.
- [ ] Active Hazards cause an accepted Hit when they collide with the Player.
- [ ] A single collision event can produce at most one Hit.
- [ ] The Round reaches lost after exactly three accepted Hits.
- [ ] If the Round Timer reaches zero on the same frame as the third Hit, the Round reaches won.
- [ ] Resolved Hazards cannot become active again.
- [ ] Restart clears all Hazards and resets Hits.

## Ownership

- **Owner/lane**: Hazard lifecycle, first Safe Spawn rule, and Round hit loss.
- **Extends**: Hazard Machine and Round Machine.
- **Must not own**: Dash avoidance, Shield blocking, Invulnerability, Wave pressure, Pickup scoring.
- **Adapter boundary**: Collision detection reports PLAYER_COLLIDED facts; it does not decide Round outcome.

## Stateful model

- **Owner machine**: Hazard Machine and Round Machine.
- **Owns**:
  - Hazard Machine owns warning, active, and resolved Hazard lifecycle.
  - Round Machine owns Hit count and lost Round Outcome.
- **Existing states/transitions**:
  - Round Machine has ready, active, paused, won, and restart behavior from Issue 001.
- **This slice adds**:
  - Hazard states: warning, active, resolved.
  - Hazard events: WARNING_ELAPSED, PLAYER_COLLIDED, LEFT_PLAY_AREA, ROUND_ENDED.
  - Round events: PLAYER_HIT.
  - Constants: Warning Zone duration is 500 ms; Player loses at exactly 3 Hits.
  - Event contract: active Hazard collision emits PLAYER_HIT only if the Hazard is active and the Round is active.
  - Same-frame priority: TIME_EXPIRED is processed before PLAYER_HIT.
- **Out of scope**:
  - Safe Spawn search sophistication beyond rejecting immediate Player overlap.
  - Repeated Hazard Spawn cadence.
  - Invulnerability after Hit.
  - Dash and Shield Collision Resolution.
  - Wave-directed Spawn cadence.
- **Transition tests**:
  - unsafe immediate Player overlap prevents Hazard creation.
  - warning -> active on WARNING_ELAPSED with safe Spawn.
  - warning cannot emit PLAYER_HIT.
  - active -> resolved on PLAYER_COLLIDED.
  - active -> resolved on LEFT_PLAY_AREA.
  - resolved ignores WARNING_ELAPSED and PLAYER_COLLIDED.
  - Round active -> lost after third PLAYER_HIT.
  - Round active -> won when TIME_EXPIRED and third PLAYER_HIT happen in the same tick.
- **Adapter wiring**:
  - Renderer draws Warning Zones differently from active Hazards.
  - Game loop advances Hazard timers only while Round is active.
  - Collision adapter sends PLAYER_COLLIDED to active Hazards.

## Blocked by

- Issue 001: Build the Round Shell and Player Movement.
