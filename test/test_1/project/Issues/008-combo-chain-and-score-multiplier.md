# Issue 008: Add Combo Chain and Score Multiplier

## What to build

Add Combo Chain behavior so collecting Pickups close together increases reward through a Score Multiplier.

## Acceptance criteria

- [ ] Collecting any normal Pickup starts or extends a Combo Chain.
- [ ] The Combo Chain expires after 3 seconds without another Pickup collection.
- [ ] The Score Multiplier activates after 3 Pickups in one Combo Chain.
- [ ] The Score Multiplier is 2x while active.
- [ ] Future Pickup kinds can contribute by emitting the same PICKUP_COLLECTED event contract.
- [ ] Score for the Pickup that reaches the threshold uses the multiplier.
- [ ] Score Multiplier ends when Combo Chain expires.
- [ ] Combo Chain timers do not tick while paused.
- [ ] Combo Chain state and multiplier are visible in the HUD.

## Ownership

- **Owner/lane**: Combo Chain lifecycle and Score calculation.
- **Extends**: Combo Chain Machine and Score calculation module.
- **Must not own**: Pickup lifecycle, Shield lifecycle, Speed Boost lifecycle, Round lifecycle.
- **Adapter boundary**: Pickup Machine emits collection facts; Combo Chain and Score calculation decide chain state and score value.

## Stateful model

- **Owner machine**: Combo Chain Machine.
- **Owns**: inactive, active, multiplier.
- **Existing states/transitions**:
  - Pickup Machine emits PICKUP_COLLECTED for normal Pickups.
  - Round Machine gates active/paused timers.
- **This slice adds**:
  - States: inactive, active, multiplier.
  - Events: PICKUP_COLLECTED, COMBO_EXPIRED, ROUND_ENDED.
  - Constants: Combo Chain window is 3 seconds; Score Multiplier threshold is 3 Pickups; multiplier value is 2x.
  - Event contract: PICKUP_COLLECTED includes base score and pickup kind; Score calculation returns awarded score.
- **Out of scope**:
  - New Pickup kinds.
  - Shield Pickup implementation; when Shield Pickups exist, they must send the same PICKUP_COLLECTED event contract to join Combo Chain behavior.
  - Best Score persistence.
  - Visual combo animations beyond readable HUD state.
- **Transition tests**:
  - inactive -> active on PICKUP_COLLECTED.
  - active extends on PICKUP_COLLECTED within 3 seconds.
  - active -> multiplier when threshold is reached.
  - multiplier remains multiplier on further PICKUP_COLLECTED.
  - active and multiplier -> inactive on COMBO_EXPIRED.
  - Score calculation applies 2x after threshold.
- **Adapter wiring**:
  - HUD renders Combo Chain count/window and active multiplier.
  - Game loop advances Combo Chain timer only while Round is active.

## Blocked by

- Issue 004: Add Pickups, Score, and Speed Boost.
