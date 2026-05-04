# Vertical Slices

Executable statecharts need a bigger map without becoming a horizontal implementation phase.

## Machine Inventory vs Machine Implementation

During planning, identify **machine ownership**:

```text
GameFlowMachine owns game lifecycle.
PlayerMachine owns player control lifecycle.
EnemyMachine owns enemy lifecycle.
```

This inventory tells future slices which machine to extend. It prevents every issue from inventing a new machine.

During implementation, add only the behavior required by the current vertical slice. Planned states are not implemented until a user-visible slice needs them.

## Pattern

```text
Plan broadly:
  GameFlowMachine owns menu/loading/playing/paused/gameOver.

Implement narrowly:
  Slice 1 adds menu/loading/playing.
  Slice 2 adds paused.
  Slice 3 adds gameOver.
```

The same owner machine grows slice by slice.

## AFK Agents and Worktrees

Owner machines are coordination lanes. In an AFK workflow where each issue runs in its own worktree or branch, do not run multiple slices that touch the same owner machine in parallel by default.

Good parallelism:

```text
Issue A touches GameFlowMachine.
Issue B touches PlayerMachine.
Issue C touches Settings.
```

Risky parallelism:

```text
Issue A touches GameFlowMachine.
Issue B also touches GameFlowMachine.
Issue C also touches GameFlowMachine.
```

Use the issue tracker's `Blocked by` field to serialize same-owner-machine slices unless the independence is explicit and defensible.

## Refresh Before Implementation

The issue's `## Stateful model` section is a provisional delta, not immutable truth. Before implementing a stateful slice, the agent must:

1. Read the current owner machine code.
2. Compare the issue's `Existing states/transitions` with reality.
3. Adapt `This slice adds` to the current machine shape.
4. Stop and ask if the issue's desired behavior no longer fits the current machine.

Executable machine code is the source of truth. The issue describes the intended change.

## Example

### Slice 1: Start Game And Enter Play

```text
Owner machine: GameFlowMachine
This slice adds:
  States: menu, loading, playing
  Events: start, assets.loaded
  Transitions:
    menu -> loading on start
    loading -> playing on assets.loaded
Out of scope:
  paused
  gameOver
```

### Slice 2: Pause And Resume

```text
Owner machine: GameFlowMachine
Existing states/transitions:
  menu -> loading -> playing
This slice adds:
  States: paused
  Events: pause, resume
  Transitions:
    playing -> paused on pause
    paused -> playing on resume
Out of scope:
  gameOver
```

### Slice 3: Game Over And Restart

```text
Owner machine: GameFlowMachine
Existing states/transitions:
  menu -> loading -> playing
  playing <-> paused
This slice adds:
  States: gameOver
  Events: player.died, restart
  Transitions:
    playing -> gameOver on player.died
    gameOver -> loading on restart
```

## Review Questions

- Does this slice extend an existing/planned owner machine?
- Is a new machine justified, or is it fragmentation?
- Are other open/parallel issues touching the same owner machine?
- Should this slice be blocked by another same-owner-machine slice?
- Are future states listed as out of scope instead of implemented now?
- Are transition tests included in the same vertical slice?
- Does adapter code send events instead of owning transition logic?
