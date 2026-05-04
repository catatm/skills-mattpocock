# Issue 009: Add Wave Pressure, Breather, and Final Rush

## What to build

Add Wave pressure so Hazard Spawn cadence changes during the Round, including a Breather after accepted Hits and a Final Rush in the last 15 seconds.

## Acceptance criteria

- [ ] Wave pressure starts when the Round starts.
- [ ] Opening pressure uses the existing 1.2-second Hazard Spawn interval.
- [ ] Rising pressure gradually reduces Hazard Spawn interval.
- [ ] Hazard Spawn interval never goes below 450 ms.
- [ ] An accepted Hit enters Breather for 2 seconds.
- [ ] Breather reduces Hazard pressure and does not Spawn new Hazards during the first 1 second.
- [ ] Shield-blocked and Dash-avoided collisions do not enter Breather.
- [ ] Final Rush begins only in the last 15 seconds of an active Round.
- [ ] Wave pressure stops when the Round is paused, won, lost, or restarted.
- [ ] Wave pressure never bypasses Safe Spawn rules.
- [ ] HUD communicates Final Rush and Breather states.

## Ownership

- **Owner/lane**: Wave pressure policy.
- **Extends**: Wave Machine and Hazard Spawn cadence.
- **Must not own**: Safe Spawn selection, Hazard lifecycle, Collision Resolution, Round lifecycle.
- **Adapter boundary**: Wave Machine emits Spawn pressure intent; Safe Spawn and Hazard Machine still decide whether Hazards appear.

## Stateful model

- **Owner machine**: Wave Machine.
- **Owns**: opening, rising, pressure, breather, finalRush, stopped.
- **Existing states/transitions**:
  - Round Machine emits ROUND_STARTED, ROUND_PAUSED, ROUND_RESUMED, ROUND_ENDED.
  - Collision Resolution emits HIT_ACCEPTED, HIT_BLOCKED_SHIELD, HIT_AVOIDED_DASH, HIT_IGNORED_INVULNERABLE.
  - Safe Spawn selector can reject Spawn attempts.
- **This slice adds**:
  - States: stopped, opening, rising, pressure, breather, finalRush.
  - Events: ROUND_STARTED, ROUND_PAUSED, ROUND_RESUMED, ROUND_ENDED, WAVE_TIMER_ELAPSED, HIT_ACCEPTED, FINAL_RUSH_READY.
  - Constants: minimum Hazard Spawn interval is 450 ms; Breather lasts 2 seconds; Final Rush starts with 15 seconds remaining.
  - Event contract: only HIT_ACCEPTED enters Breather.
- **Out of scope**:
  - Multiple maps.
  - Boss Hazards.
  - New Hazard types.
- **Transition tests**:
  - stopped -> opening on ROUND_STARTED.
  - opening -> rising on WAVE_TIMER_ELAPSED.
  - rising -> pressure on WAVE_TIMER_ELAPSED.
  - pressure -> breather on HIT_ACCEPTED.
  - breather -> pressure on BREATHER_ENDED unless Final Rush is ready.
  - pressure -> finalRush only when 15 seconds or less remain.
  - any active Wave state -> stopped on ROUND_ENDED.
  - stopped cannot emit Spawn pressure.
  - shield-blocked and dash-avoided events do not enter Breather.
- **Adapter wiring**:
  - Hazard Spawn cadence reads Wave pressure output.
  - Safe Spawn remains the final gate before creating Hazards.
  - HUD renders Breather and Final Rush status.

## Blocked by

- Issue 003: Add Recurring Fair Hazard Pressure.
- Issue 005: Add Visible Hit Recovery.
- Issue 006: Add Dash Ability.
- Issue 007: Add Shield Pickups and Shield Blocking.
