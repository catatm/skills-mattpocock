# Issue 006: Add Dash Ability

## What to build

Add Dash as an active Player ability with a short active window and cooldown. Dash should avoid Hazard Hits while active without consuming Shield when Shield is added later.

## Acceptance criteria

- [ ] Pressing Space while Dash is ready starts Dash.
- [ ] Dash remains active for 180 ms.
- [ ] Dash enters Dash Cooldown after the active window ends.
- [ ] Dash Cooldown lasts 1.2 seconds.
- [ ] Dash cannot start while cooling down.
- [ ] Active Dash avoids Hazard Hits after Invulnerability is checked.
- [ ] Dash timers pause and resume with the Round snapshot.
- [ ] Dash input is ignored while the Round is ready, paused, won, or lost.
- [ ] Dash state is visible in the HUD.

## Ownership

- **Owner/lane**: Dash lifecycle and Collision Resolution dash branch.
- **Extends**: Dash Machine and Collision Resolution.
- **Must not own**: Round pause lifecycle, Shield blocking, Invulnerability, Hazard lifecycle.
- **Adapter boundary**: Keyboard sends DASH_PRESSED; Dash Machine decides whether the event is legal.

## Stateful model

- **Owner machine**: Dash Machine.
- **Owns**: ready, dashing, cooldown, suspended, disabled.
- **Existing states/transitions**:
  - Round Machine has active/paused/terminal snapshots.
  - Collision Resolution handles Invulnerability from Issue 005.
- **This slice adds**:
  - States: ready, dashing, cooldown, suspended, disabled.
  - Events: DASH_PRESSED, DASH_ENDED, COOLDOWN_ENDED, ROUND_PAUSED, ROUND_RESUMED, ROUND_ENDED, ROUND_STARTED.
  - Constants: Dash duration is 180 ms; Dash Cooldown is 1.2 seconds.
  - Pause clarification: pause moves Dash into suspended with prior state metadata; resume restores the prior ready/dashing/cooldown state and remaining timers.
  - Event contract: active Dash causes Collision Resolution to emit HIT_AVOIDED_DASH.
- **Out of scope**:
  - Shield collision branch.
  - Dash upgrades.
  - Multiple Dash charges.
- **Transition tests**:
  - ready -> dashing on DASH_PRESSED.
  - dashing -> cooldown on DASH_ENDED.
  - cooldown -> ready on COOLDOWN_ENDED.
  - cooldown ignores DASH_PRESSED.
  - active Round pause suspends Dash without losing remaining timer.
  - Round end disables Dash.
  - Collision Resolution checks Invulnerability before active Dash.
- **Adapter wiring**:
  - Space key sends DASH_PRESSED.
  - Movement renderer shows Dash state.
  - Game loop advances Dash timers only from active Round snapshots.

## Blocked by

- Issue 005: Add Visible Hit Recovery.
