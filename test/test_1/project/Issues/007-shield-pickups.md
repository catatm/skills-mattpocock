# Issue 007: Add Shield Pickups and Shield Blocking

## What to build

Add Shield Pickups that grant Shield, refresh Shield duration, and block one Hazard Hit after Invulnerability and active Dash fail.

## Acceptance criteria

- [ ] Shield Pickups appear as a distinct Pickup kind.
- [ ] Shield Pickups use the same 7-second Pickup Lifetime as normal Pickups.
- [ ] Shield Pickups grant 10 Score when collected.
- [ ] Shield Pickups grant Shield instead of Speed Boost.
- [ ] Shield lasts 8 seconds or until it blocks one Hit.
- [ ] Collecting another Shield Pickup refreshes Shield duration rather than stacking Shields.
- [ ] Collision Resolution checks active Shield after Invulnerability and active Dash.
- [ ] A Shield-blocked collision consumes Shield and does not increment Hits.
- [ ] Shield-blocked collisions do not trigger Breather behavior later.
- [ ] Shield state is visible in the HUD.

## Ownership

- **Owner/lane**: Shield lifecycle, Shield Pickup behavior, and Collision Resolution shield branch.
- **Extends**: Shield Machine, Pickup Machine, and Collision Resolution.
- **Must not own**: Dash lifecycle, Invulnerability lifecycle, Wave Breather, Combo Chain.
- **Adapter boundary**: Pickup collision reports collected kind; Shield Machine decides Shield state.

## Stateful model

- **Owner machine**: Shield Machine and Pickup Machine.
- **Owns**:
  - Shield Machine owns inactive, active, consumed, expired.
  - Pickup Machine owns Shield Pickup available, collected, expired.
- **Existing states/transitions**:
  - Pickup Machine has available, collected, expired from Issue 004.
  - Collision Resolution has Invulnerability and Dash branches from Issue 006.
- **This slice adds**:
  - Shield states: inactive, active, consumed, expired.
  - Events: SHIELD_GRANTED, HIT_BLOCKED, SHIELD_EXPIRED, ROUND_ENDED.
  - Pickup kind: `shield`.
  - Constants: Shield duration is 8 seconds; Shield Pickup score is 10; normal Pickup to Shield Pickup Spawn ratio starts at 4:1.
  - Event contract: legal Shield Pickup collection emits PICKUP_COLLECTED with pickup kind `shield`; Shield block emits HIT_BLOCKED_SHIELD.
- **Out of scope**:
  - Combo Chain contribution from Shield Pickups.
  - Wave Breather.
- **Transition tests**:
  - inactive -> active on SHIELD_GRANTED.
  - active refreshes duration on SHIELD_GRANTED.
  - active -> consumed on HIT_BLOCKED.
  - active -> expired on SHIELD_EXPIRED.
  - consumed and expired do not block Hits.
  - Collision Resolution order is Invulnerability, Dash, Shield, Hit.
- **Adapter wiring**:
  - Renderer distinguishes Shield Pickups from normal Pickups.
  - HUD displays Shield active/cooldown-like duration.
  - Game loop advances Shield timer only while Round is active.

## Blocked by

- Issue 004: Add Pickups, Score, and Speed Boost.
- Issue 005: Add Visible Hit Recovery.
- Issue 006: Add Dash Ability.
