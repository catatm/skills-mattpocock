# Issue 010: Add Best Score Persistence

## What to build

Persist Best Score locally as an end-to-end scoring slice. Won and lost Rounds should compare final Score against stored Best Score, update storage only when appropriate, and show the result in the HUD and terminal Round overlay.

## Acceptance criteria

- [ ] Best Score loads from localStorage on app start.
- [ ] Best Score updates only after won or lost Rounds.
- [ ] A lower final Score does not replace Best Score.
- [ ] Restart preserves Best Score and resets Round-local state.
- [ ] Won and lost overlays show Round Outcome, final Score, Best Score, and restart control.
- [ ] HUD shows Best Score during active play.
- [ ] Browser verification confirms Best Score survives restart and page reload.
- [ ] Build succeeds.

## Ownership

- **Owner/lane**: Best Score persistence and terminal Round scoring.
- **Extends**: Round Machine terminal actions.
- **Must not own**: Score calculation rules, gameplay collision rules, Wave policy, individual entity lifecycles, final responsive polish.
- **Adapter boundary**: localStorage persists Best Score; Round Machine decides when persistence is allowed.

## Stateful model

- **Owner machine**: Round Machine.
- **Owns**: Best Score update timing after terminal Round Outcome.
- **Existing states/transitions**:
  - Round Machine has won and lost terminal states.
  - Score calculation exists from Combo Chain slice.
- **This slice adds**:
  - Terminal action for Best Score comparison and persistence.
  - Event contract: ROUND_COMPLETED includes Round Outcome and final Score.
  - Storage contract: missing or invalid localStorage Best Score is treated as 0.
- **Out of scope**:
  - Online leaderboard.
  - Score history.
  - Accounts.
  - Final full-game HUD polish.
  - Responsive layout hardening.
- **Transition tests**:
  - active -> won triggers Best Score comparison.
  - active -> lost triggers Best Score comparison.
  - active and paused do not update Best Score.
  - lower final Score does not replace existing Best Score.
  - RESTART preserves Best Score while resetting Round-local state.
- **Adapter wiring**:
  - Storage adapter reads/writes localStorage.
  - UI renders Best Score in the HUD and terminal overlays.
  - Browser verification covers local persistence across restart and reload.

## Blocked by

- Issue 002: Add Warning Hazards and Hit-Based Loss.
- Issue 004: Add Pickups, Score, and Speed Boost.
