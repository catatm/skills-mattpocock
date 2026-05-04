# Issue 004: Add Pickups, Score, and Speed Boost

## What to build

Add normal Pickups that use Safe Spawn rules, expire after a Pickup Lifetime, increase Score when collected, and refresh a temporary Speed Boost.

## Acceptance criteria

- [ ] Normal Pickups Spawn every 2.5 seconds while the Round is active.
- [ ] Pickups use the existing Safe Spawn lane and cannot immediately collide with the Player, active Hazards, or available Pickups.
- [ ] A Pickup remains available for 7 seconds.
- [ ] An available Pickup becomes collected when the Player collides with it.
- [ ] A collected Pickup increases Score by 10.
- [ ] A collected Pickup grants or refreshes a 2-second Speed Boost.
- [ ] Boosted Player speed is 340 px/s; normal speed remains 240 px/s.
- [ ] Collected Pickups cannot expire afterward.
- [ ] Expired Pickups cannot be collected afterward.
- [ ] Pickup collision resolves before Hazard Collision Resolution on the same frame.

## Ownership

- **Owner/lane**: Pickup lifecycle, Score calculation, Player Speed Boost condition, and Pickup extension of Safe Spawn.
- **Extends**: Pickup Machine and Player Condition Machine.
- **Must not own**: Shield, Combo Chain, Wave pressure, Best Score persistence, Round terminal lifecycle.
- **Adapter boundary**: Collision adapter reports PLAYER_COLLECTED; scoring and boost transitions happen in domain logic.

## Stateful model

- **Owner machine**: Pickup Machine and Player Condition Machine.
- **Owns**:
  - Pickup Machine owns available, collected, and expired.
  - Player Condition Machine owns normal and boosted movement conditions.
- **Existing states/transitions**:
  - Round Machine active/paused gates timers.
  - Safe Spawn selector exists from Issue 003.
- **This slice adds**:
  - Pickup states: available, collected, expired.
  - Player condition states: normal, boosted.
  - Events: PLAYER_COLLECTED, LIFETIME_EXPIRED, ROUND_ENDED, PICKUP_COLLECTED, BOOST_EXPIRED.
  - Constants: Pickup Spawn interval is 2.5 seconds; Pickup Lifetime is 7 seconds; normal Pickup Score is 10; Speed Boost lasts 2 seconds.
  - Event contract: legal Pickup collection emits PICKUP_COLLECTED with pickup kind `normal`.
  - Safe Spawn extension: available Pickups are included in overlap checks.
- **Out of scope**:
  - Invulnerability overlap if Issue 005 has not been implemented yet; when Hit Recovery exists, Speed Boost must compose with Invulnerability without either timer deleting the other.
  - Shield Pickups.
  - Combo Chain and Score Multiplier.
  - Best Score persistence.
- **Transition tests**:
  - available -> collected on PLAYER_COLLECTED.
  - available -> expired on LIFETIME_EXPIRED.
  - collected ignores LIFETIME_EXPIRED.
  - expired ignores PLAYER_COLLECTED.
  - Player normal -> boosted on PICKUP_COLLECTED.
  - boosted refreshes duration on another PICKUP_COLLECTED.
  - boosted -> normal on BOOST_EXPIRED.
  - If Invulnerability exists, invulnerable + PICKUP_COLLECTED preserves Invulnerability and applies Speed Boost.
  - If Invulnerability exists, boosted + HIT_TAKEN preserves Speed Boost and applies Invulnerability.
- **Adapter wiring**:
  - Renderer draws available Pickups.
  - Movement adapter uses Player Condition snapshot to select speed.
  - Game loop advances Pickup Lifetime and Speed Boost timers only while Round is active.

## Blocked by

- Issue 002: Add Warning Hazards and Hit-Based Loss.
