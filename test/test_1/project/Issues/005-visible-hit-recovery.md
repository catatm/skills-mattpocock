# Issue 005: Add Visible Hit Recovery

## What to build

Add visible Hit recovery after Hazard collisions. When the Player takes an accepted Hit, the HUD updates, the Player becomes briefly invulnerable, repeated Hazard overlaps are ignored, and Collision Resolution becomes the single place that turns raw overlaps into accepted or ignored Hit facts.

## Acceptance criteria

- [ ] Accepted Hits grant 1 second of Invulnerability.
- [ ] Hazard collisions are ignored while Invulnerability is active.
- [ ] Several Hazard collisions in the same frame can cause at most one accepted Hit.
- [ ] Collision Resolution applies Invulnerability first.
- [ ] Round Hit count increments only when Collision Resolution returns an accepted Hit.
- [ ] The HUD shows remaining Hits decreasing after accepted Hits.
- [ ] The Player visibly indicates Invulnerability while it is active.
- [ ] Browser verification confirms standing in a Hazard causes one Hit, then temporary ignored collisions.
- [ ] Breather is not added yet, but accepted Hit facts are exposed for future Wave behavior.
- [ ] Invulnerability timers do not tick while paused.
- [ ] Invulnerability clears when the Round ends or restarts.

## Ownership

- **Owner/lane**: Collision Resolution and Player Condition Machine.
- **Extends**: Player Condition Machine and Round Machine.
- **Must not own**: Dash avoidance, Shield blocking, Wave Breather, Hazard lifecycle.
- **Adapter boundary**: Collision adapter reports raw overlaps; Collision Resolution decides accepted Hit versus ignored collision.

## Stateful model

- **Owner machine**: Player Condition Machine.
- **Owns**: normal and invulnerable recovery conditions for accepted Hits.
- **Existing states/transitions**:
  - Round Machine accepts PLAYER_HIT from Issue 002.
- **This slice adds**:
  - Player condition states: normal, invulnerable.
  - Events: HIT_TAKEN, INVULNERABILITY_EXPIRED, ROUND_ENDED.
  - Constants: Invulnerability lasts 1 second.
  - Event contract: Collision Resolution can emit HIT_ACCEPTED or HIT_IGNORED_INVULNERABLE; Round Machine consumes only HIT_ACCEPTED to decrement remaining Hits.
- **Out of scope**:
  - Speed Boost and Invulnerability overlap.
  - Dash avoidance.
  - Shield blocking.
  - Breather Wave.
- **Transition tests**:
  - normal -> invulnerable on HIT_TAKEN.
  - invulnerable ignores HIT_TAKEN.
  - invulnerable -> normal on INVULNERABILITY_EXPIRED.
  - Round Hit count changes only for HIT_ACCEPTED.
  - repeated same-frame Hazard overlaps produce one HIT_ACCEPTED followed by ignored overlaps.
- **Adapter wiring**:
  - Collision adapter passes Hazard overlaps to Collision Resolution.
  - Game loop advances Invulnerability timer only while Round is active.
  - Renderer makes Invulnerability visible.
  - HUD renders remaining Hits from Round Machine context.

## Blocked by

- Issue 002: Add Warning Hazards and Hit-Based Loss.
