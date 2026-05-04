# Arcade Dodging Game

A browser-based 2D arcade game built around short rounds where the player avoids hazards and collects pickups.

## Language

**Round**:
A timed play session with a clear start, active phase, and end.
_Avoid_: Level, match, run

**Player**:
The controllable character that moves around the play area.
_Avoid_: Avatar, hero, unit

**Hazard**:
An object that threatens the Player during a Round.
_Avoid_: Enemy, obstacle, trap

**Pickup**:
An object the Player can collect for benefit during a Round.
_Avoid_: Collectible, item, power-up

**Round Timer**:
The countdown that limits how long a Round can remain active.
_Avoid_: Clock, time limit

**Hit**:
A penalty caused when the Player collides with a Hazard.
_Avoid_: Damage, wound

**Score**:
The numeric measure of how well the Player performed in a Round.
_Avoid_: Points, currency

**Speed Boost**:
A temporary movement benefit granted when the Player collects a Pickup.
_Avoid_: Buff, power-up

**Play Area**:
The bounded space where the Player, Hazards, and Pickups exist during a Round.
_Avoid_: Map, arena, board

**Spawn**:
The appearance of a Hazard or Pickup inside the Play Area.
_Avoid_: Drop, generate, create

**Warning Zone**:
A short-lived marker that shows where a Hazard will Spawn.
_Avoid_: Telegraph, indicator

**Round State**:
The lifecycle phase that determines whether a Round is ready, active, paused, won, or lost.
_Avoid_: Screen, mode

**Best Score**:
The highest Score achieved across completed Rounds on the same browser.
_Avoid_: High score, record

**Invulnerability**:
A brief period after a Hit when the Player cannot take another Hit.
_Avoid_: Immunity, shield

**Round Outcome**:
The final result of a Round after it ends.
_Avoid_: Result, status

**Safe Spawn**:
A Spawn that does not immediately collide with the Player or another active object.
_Avoid_: Fair spawn, valid spawn

**Dash**:
A short burst movement action that helps the Player cross danger.
_Avoid_: Dodge, sprint, blink

**Dash Cooldown**:
The recovery period before the Player can Dash again.
_Avoid_: Recharge, delay

**Shield**:
A temporary protection that prevents the next Hit.
_Avoid_: Armor, barrier

**Combo Chain**:
A streak created by collecting Pickups close together.
_Avoid_: Streak, combo, chain

**Score Multiplier**:
A temporary scoring benefit granted by an active Combo Chain.
_Avoid_: Bonus multiplier, combo bonus

**Pickup Lifetime**:
The limited period during which a Pickup can be collected before it disappears.
_Avoid_: Expiry, timeout

**Wave**:
A pressure phase inside a Round that controls how aggressively Hazards Spawn.
_Avoid_: Stage, phase, difficulty level

**Breather**:
A low-pressure Wave entered after the Player takes a Hit.
_Avoid_: Recovery phase, mercy window

**Final Rush**:
The highest-pressure Wave near the end of a Round.
_Avoid_: Frenzy, endgame

**Collision Resolution**:
The ordered decision that determines what a Player collision causes.
_Avoid_: Collision handling, hit logic

**Shield Pickup**:
A Pickup that grants a Shield instead of a Speed Boost.
_Avoid_: Armor item, shield item

## Relationships

- A **Round** contains exactly one **Player**
- A **Round** contains zero or more **Hazards**
- A **Round** contains zero or more **Pickups**
- A **Round** has one **Score**
- A **Round** has one **Round State**
- A **Round** has one **Round Outcome** after it ends
- A **Round** can update the **Best Score** after it ends
- A **Player** can collide with **Hazards** and **Pickups**
- A **Player** collects a **Pickup** to increase **Score** and gain a **Speed Boost**
- A **Player** receives **Invulnerability** after taking a **Hit**
- A **Player** uses **Collision Resolution** when colliding with a **Hazard**
- A **Hazard** can show a **Warning Zone** before it **Spawns**
- A **Hazard** or **Pickup** must use a **Safe Spawn**
- A **Player** can use a **Dash** when no **Dash Cooldown** is active
- A **Dash** can prevent a **Hit** only while the Dash is active
- A **Dash Cooldown** starts after a **Dash** ends
- A **Shield** prevents the next **Hit** and is then consumed
- A **Shield Pickup** grants a **Shield**
- A **Pickup** has a **Pickup Lifetime**
- A **Pickup** can contribute to a **Combo Chain**
- A **Combo Chain** can grant a **Score Multiplier**
- A **Wave** controls Hazard **Spawn** pressure during an active **Round**
- A **Breather** can follow a **Hit**
- A **Final Rush** can occur near the end of a **Round**
- A **Round** ends when its **Round Timer** reaches zero
- A **Round** ends when the **Player** has taken exactly three **Hits**
- A **Collision Resolution** applies **Invulnerability**, active **Dash**, active **Shield**, and then **Hit** in that order
- A **Round State** can move from ready to active, active to paused, paused to active, active to won, or active to lost

## Example dialogue

> **Dev:** "Does collecting a **Pickup** end the **Round**?"
> **Domain expert:** "No, a **Pickup** increases **Score**, can extend a **Combo Chain**, and grants a **Speed Boost**. The **Round** only ends when the **Round Timer** reaches zero or the **Player** takes three **Hits** from **Hazards**."

## Flagged ambiguities

- "Pickup" now covers multiple effects; resolved by naming **Shield Pickup** when the Pickup grants **Shield** instead of **Speed Boost**.
- Hazard collision priority is resolved by **Collision Resolution**: **Invulnerability** first, active **Dash** second, active **Shield** third, and **Hit** last.
