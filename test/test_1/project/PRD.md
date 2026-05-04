# PRD: Arcade Dodging Game

## Problem Statement

The user wants a browser-based 2D TypeScript game with enough meaningful stateful behavior to validate whether future vertical slices preserve their statechart domain boundaries. The current project is a Vite TypeScript browser scaffold with XState available, but it does not yet contain the game domain, gameplay loop, or executable statecharts.

The product problem is not only to make a playable arcade game. It is also to make the domain clear enough that future agents can split work into vertical slices without smearing lifecycle rules across rendering, input, storage, and entity update code.

## Solution

Build a clean neon arcade dodging game where the Player survives a timed Round, avoids Hazards, collects Pickups, uses Dash and Shield protections, builds Combo Chains, and improves Best Score in the local browser.

The gameplay should be implemented around explicit domain ownership. Stateful behavior should live in executable XState machines where it has real lifecycle rules, legal transitions, guards, timers, or forbidden transitions. Rendering, keyboard input, animation frames, and persistence should act as adapters that send events and render snapshots rather than owning domain transitions.

## User Stories

1. As a Player, I want to start a Round, so that I can begin playing from a clear ready state.
2. As a Player, I want to move with WASD and arrow keys, so that I can control the Player comfortably on desktop.
3. As a Player, I want the Player to stay inside the Play Area, so that movement remains fair and readable.
4. As a Player, I want to see the Round Timer, so that I understand how long I need to survive.
5. As a Player, I want to win when the Round Timer reaches zero, so that survival is the core goal.
6. As a Player, I want to lose only after exactly three Hits, so that I have room to recover from mistakes.
7. As a Player, I want timer expiry to win over a same-frame losing Hit, so that surviving to zero is honored consistently.
8. As a Player, I want to pause and resume a Round, so that I can temporarily stop play without losing progress.
9. As a Player, I want all Round timers to stop while paused, so that pausing is mechanically fair.
10. As a Player, I want to restart after winning or losing, so that I can immediately try again.
11. As a Player, I want Hazards to show Warning Zones before becoming dangerous, so that I can react instead of being surprised.
12. As a Player, I want Warning Zones to be non-damaging, so that the warning period is trustworthy.
13. As a Player, I want active Hazards to cause Hits, so that avoiding them matters.
14. As a Player, I want Hazards and Pickups to use Safe Spawns, so that objects do not appear unfairly on top of me or each other.
15. As a Player, I want unsafe Spawn attempts to be skipped, so that Wave pressure never bypasses fairness rules.
16. As a Player, I want Pickups to increase Score, so that collecting them has an immediate reward.
17. As a Player, I want normal Pickups to grant Speed Boost, so that collecting them changes the feel of movement.
18. As a Player, I want Speed Boost to refresh instead of stack, so that movement remains controllable.
19. As a Player, I want Pickups to expire after their Pickup Lifetime, so that I must make active collection decisions.
20. As a Player, I want collected Pickups to stop existing, so that collection has a clear lifecycle.
21. As a Player, I want expired Pickups to be impossible to collect, so that the rules are consistent.
22. As a Player, I want Shield Pickups to grant a Shield, so that there is a defensive pickup type.
23. As a Player, I want Shield to block the next Hit and then be consumed, so that it is useful but limited.
24. As a Player, I want Shield duration to refresh instead of stack, so that defensive state remains simple.
25. As a Player, I want Invulnerability after a Hit, so that multiple Hazards cannot drain all Hits instantly.
26. As a Player, I want Invulnerability to ignore collisions before Dash or Shield is considered, so that Collision Resolution is predictable.
27. As a Player, I want active Dash to avoid Hazard Hits without consuming Shield, so that Dash and Shield have distinct roles.
28. As a Player, I want Shield to block Hits only after Invulnerability and Dash fail, so that protections resolve in a clear order.
29. As a Player, I want at most one Hit from same-frame Hazard collisions, so that a single moment cannot cause multiple penalties.
30. As a Player, I want Pickups to resolve before Hazard collisions on the same frame, so that collection feels responsive.
31. As a Player, I want to Dash through danger, so that I have an active skill option.
32. As a Player, I want Dash to have a short active window, so that timing matters.
33. As a Player, I want Dash Cooldown to prevent repeated Dash use, so that the ability remains balanced.
34. As a Player, I want Dash to be disabled when paused, won, or lost, so that ability state follows the Round lifecycle.
35. As a Player, I want consecutive Pickups to form a Combo Chain, so that aggressive collection is rewarded.
36. As a Player, I want Combo Chain timing to expire when I wait too long, so that maintaining the chain is a meaningful challenge.
37. As a Player, I want a Score Multiplier after enough Combo Chain progress, so that skilled collection increases Score faster.
38. As a Player, I want Score Multiplier to end when the Combo Chain expires, so that the benefit has clear boundaries.
39. As a Player, I want Waves to increase Hazard pressure over the Round, so that the Round becomes more exciting over time.
40. As a Player, I want a Breather after an accepted Hit, so that I can recover instead of immediately being punished again.
41. As a Player, I want Shield-blocked collisions not to trigger Breather, so that Breather follows actual Hits only.
42. As a Player, I want a Final Rush near the end of the Round, so that the last seconds feel tense.
43. As a Player, I want Wave pressure to stop when the Round ends, so that no new Hazards appear after completion.
44. As a Player, I want Best Score to persist locally, so that repeated Rounds have a long-term goal.
45. As a Player, I want Best Score to update only after won or lost Rounds, so that partial active state does not persist incorrectly.
46. As a Player, I want the HUD to show Round Timer, Score, remaining Hits, Best Score, Dash state, Shield state, and Combo Chain state, so that I can make informed decisions.
47. As a developer, I want Round lifecycle behavior in a Round Machine, so that UI and loop code cannot invent illegal transitions.
48. As a developer, I want Player condition behavior separated from Round outcome behavior, so that temporary Player states do not bloat Round lifecycle rules.
49. As a developer, I want each Hazard and Pickup to have a lifecycle, so that entity behavior is testable without rendering.
50. As a developer, I want Wave pressure to be its own stateful model, so that difficulty changes can be extended without rewriting Spawn fairness.
51. As a developer, I want future vertical slices to extend existing owner machines, so that statechart ownership remains stable.

## Implementation Decisions

- **Primary app shape**: Build a TypeScript Canvas 2D game inside the existing browser scaffold.
- **Statechart ownership**: Use XState for behavior with legal and illegal transitions, guards, timers, and lifecycle rules. Machine code is the source of truth once implemented.
- **Lightweight Ownership**: The game domain owns Round rules, Collision Resolution, Safe Spawn, scoring, Wave pressure, and entity lifecycles. Rendering, keyboard input, animation frames, and local storage are adapters.
- **Round Machine**: Owns Round State, Round Timer, Round Outcome, pause/resume, win/loss, restart, terminal behavior, and Best Score update timing.
- **Player Condition Machine**: Owns normal, Speed Boost, Invulnerability, and overlapping temporary Player conditions.
- **Dash Machine**: Owns Dash readiness, active Dash, Dash Cooldown, and disabled behavior while the Round is not active.
- **Shield Machine**: Owns inactive, active, consumed, and expired Shield behavior.
- **Hazard Machine**: Owns Warning Zone, active Hazard, resolved Hazard, and the rule that Warning Zones cannot cause Hits.
- **Pickup Machine**: Owns available, collected, and expired Pickup behavior.
- **Combo Chain Machine**: Owns inactive, active, Score Multiplier, chain extension, and chain expiry.
- **Wave Machine**: Owns opening pressure, rising pressure, Breather, Final Rush, and stopped pressure.
- **Collision Resolution**: Hazard collisions resolve in this order: Invulnerability, active Dash, active Shield, then Hit.
- **Same-frame event priority**: Round Timer expiry wins over a third Hit on the same frame.
- **Pickup and Hazard same-frame priority**: Pickup collection resolves before Hazard Collision Resolution.
- **Timer pause behavior**: Round Timer, Pickup Lifetime, Dash, Shield, Combo Chain, Invulnerability, and Wave timers do not tick while paused.
- **Deep modules to extract**: Collision Resolution, Safe Spawn selection, Wave pressure policy, Score calculation, and Best Score persistence should be independently testable behind small interfaces.
- **Adapter boundaries**: Canvas rendering draws snapshots. Keyboard input emits movement and ability intents. Storage persists Best Score. None of these adapters should own lifecycle transition rules.

## Testing Decisions

- Tests should cover externally observable behavior, legal transitions, forbidden transitions, guard behavior, and important state effects. Tests should avoid asserting private implementation details.
- Round Machine tests should cover start, pause, resume, timer win, third-Hit loss, restart, terminal states, ignored collision events outside active state, and same-frame timer priority.
- Player Condition Machine tests should cover Speed Boost refresh, Invulnerability after Hit, ignored Hits while invulnerable, and overlapping Speed Boost plus Invulnerability.
- Dash Machine tests should cover Dash from ready, Dash ending into cooldown, cooldown blocking repeated Dash, and disabling when the Round pauses or ends.
- Shield Machine tests should cover Shield grant, Shield refresh, Shield blocking one Hit, Shield consumption, and Shield expiry.
- Hazard Machine tests should cover warning to active, warning not causing Hits, Safe Spawn guard, resolving after collision, resolving after leaving the Play Area, and no reactivation from resolved.
- Pickup Machine tests should cover available to collected, available to expired, collected not expiring afterward, expired not collecting afterward, and Round end cleanup.
- Combo Chain Machine tests should cover chain start, chain extension, threshold into Score Multiplier, chain expiry, and multiplier scoring boundaries.
- Wave Machine tests should cover opening pressure, rising pressure, Breather after accepted Hit, no Breather after Shield block, Final Rush only in the final 15 seconds, and stopped Waves not spawning Hazards.
- Pure module tests should cover Collision Resolution priority, Safe Spawn rejection, Score calculation with Score Multiplier, and Best Score persistence rules.
- Browser-level verification should confirm the game renders, keyboard controls move the Player, pause visibly freezes gameplay, restart resets Round state while preserving Best Score, and HUD text does not overlap at desktop and narrow viewports.

## Out of Scope

- Touch controls.
- Audio.
- Online leaderboard or account system.
- Multiple maps.
- Procedural level editor.
- Asset-heavy character art.
- Multiplayer.
- Save files beyond browser-local Best Score.
- Implementing every planned state machine in a single horizontal pass.
- Committing generated diagrams as a duplicate source of truth.

## Further Notes

The current domain context is intentionally rich enough to test vertical-slice discipline later. Future implementation work should plan broadly around owner machines, but implement narrowly: each vertical slice should add only the machine states, events, guards, and adapter behavior needed for that slice.

If multiple planned slices touch the same owner machine, they should be serialized or coordinated. Parallel work is safer when slices touch different owner machines, such as Dash, Pickup, and Best Score persistence.
