import { describe, expect, it } from 'vitest'
import {
  COMBO_MULTIPLIER,
  DASH_COOLDOWN_MS,
  DASH_DURATION_MS,
  INVULNERABILITY_DURATION_MS,
  PICKUP_LIFETIME_MS,
  PLAYER_BOOSTED_SPEED,
  SHIELD_DURATION_MS,
  SPEED_BOOST_DURATION_MS,
  createGame,
} from './game'

describe('Issue 001: Round shell and Player movement', () => {
  it('starts, pauses, resumes, wins by timer, and restarts from the public game interface', () => {
    const game = createGame()

    expect(game.snapshot().roundState).toBe('ready')
    expect(game.snapshot().roundTimerMs).toBe(60_000)
    expect(game.snapshot().score).toBe(0)
    expect(game.snapshot().hitsRemaining).toBe(3)

    game.start()
    game.tick(1_000)
    expect(game.snapshot().roundState).toBe('active')
    expect(game.snapshot().roundTimerMs).toBe(59_000)

    game.pause()
    game.tick(1_000)
    expect(game.snapshot().roundState).toBe('paused')
    expect(game.snapshot().roundTimerMs).toBe(59_000)

    game.resume()
    game.tick(59_000)
    expect(game.snapshot().roundState).toBe('won')

    game.restart()
    expect(game.snapshot().roundState).toBe('ready')
    expect(game.snapshot().roundTimerMs).toBe(60_000)
  })

  it('moves the Player with normalized input and clamps movement inside the Play Area', () => {
    const game = createGame()
    const start = game.snapshot().player

    game.start()
    game.setMovement({ right: true })
    game.tick(1_000)
    expect(game.snapshot().player.x).toBe(start.x + 240)

    game.setMovement({ right: true, down: true })
    game.tick(10_000)
    const player = game.snapshot().player
    const playArea = game.snapshot().playArea

    expect(player.x).toBeLessThanOrEqual(playArea.width - player.radius)
    expect(player.y).toBeLessThanOrEqual(playArea.height - player.radius)
  })
})

describe('Issues 002-003: Hazards and recurring fair pressure', () => {
  it('rejects unsafe Hazard Spawns and turns safe Warning Zones into active Hazards', () => {
    const game = createGame()
    const player = game.snapshot().player

    game.start()
    expect(game.attemptHazardSpawnAt(player)).toBe(false)
    expect(game.snapshot().hazards).toHaveLength(0)

    expect(game.attemptHazardSpawnAt({ x: 80, y: 80, radius: 24 })).toBe(true)
    expect(game.snapshot().hazards[0]?.state).toBe('warning')

    game.setPlayerPosition(80, 80)
    game.tick(250)
    expect(game.snapshot().hitsTaken).toBe(0)

    game.setPlayerPosition(player.x, player.y)
    game.tick(250)
    expect(game.snapshot().hazards[0]?.state).toBe('active')
  })

  it('active Hazard collisions cause Hits and the third Hit loses the Round', () => {
    const game = createGame()

    game.start()
    takeAcceptedHit(game, 90, 90)
    expect(game.snapshot().hitsRemaining).toBe(2)

    game.tick(INVULNERABILITY_DURATION_MS)
    takeAcceptedHit(game, 180, 90)
    expect(game.snapshot().hitsRemaining).toBe(1)

    game.tick(INVULNERABILITY_DURATION_MS)
    takeAcceptedHit(game, 270, 90)
    expect(game.snapshot().roundState).toBe('lost')
  })

  it('timer expiry wins over a same-frame third Hit', () => {
    const game = createGame()

    game.start()
    takeAcceptedHit(game, 90, 90)
    game.tick(INVULNERABILITY_DURATION_MS)
    takeAcceptedHit(game, 180, 90)
    game.tick(INVULNERABILITY_DURATION_MS)

    expect(game.attemptHazardSpawnAt({ x: 270, y: 90, radius: 24 })).toBe(true)
    game.tick(500)
    game.setPlayerPosition(270, 90)
    game.tick(game.snapshot().roundTimerMs)

    expect(game.snapshot().roundState).toBe('won')
  })

  it('spawns recurring Hazards only while active and restart clears Spawn state', () => {
    const game = createGame({ random: sequence([0, 0, 0.1, 0.1, 0.2, 0.2]) })

    game.start()
    game.tick(1_200)
    expect(game.snapshot().hazards).toHaveLength(1)

    game.pause()
    game.tick(5_000)
    expect(game.snapshot().hazards).toHaveLength(1)

    game.resume()
    game.tick(1_200)
    expect(game.snapshot().hazards.length).toBeGreaterThanOrEqual(2)

    game.restart()
    expect(game.snapshot().hazards).toHaveLength(0)
  })
})

describe('Issues 004-005: Pickups, Score, Speed Boost, and Hit recovery', () => {
  it('collects available Pickups for Score and refreshes Speed Boost', () => {
    const game = createGame()

    game.start()
    expect(game.attemptPickupSpawnAt({ x: 90, y: 90, radius: 14 }, 'normal')).toBe(true)
    game.setPlayerPosition(90, 90)
    game.tick(16)

    expect(game.snapshot().pickups[0]?.state).toBe('collected')
    expect(game.snapshot().score).toBe(10)
    expect(game.snapshot().player.speed).toBe(PLAYER_BOOSTED_SPEED)

    game.tick(1_000)
    expect(game.attemptPickupSpawnAt({ x: 180, y: 90, radius: 14 }, 'normal')).toBe(true)
    game.setPlayerPosition(180, 90)
    game.tick(16)

    expect(game.snapshot().player.boosted).toBe(true)
    expect(game.snapshot().player.speed).toBe(PLAYER_BOOSTED_SPEED)
  })

  it('expires available Pickups and prevents expired collection', () => {
    const game = createGame()

    game.start()
    expect(game.attemptPickupSpawnAt({ x: 90, y: 90, radius: 14 }, 'normal')).toBe(true)
    game.tick(PICKUP_LIFETIME_MS)
    game.setPlayerPosition(90, 90)
    game.tick(16)

    expect(game.snapshot().pickups[0]?.state).toBe('expired')
    expect(game.snapshot().score).toBe(0)
  })

  it('resolves Pickup collection before Hazard Collision Resolution on the same frame', () => {
    const game = createGame()

    game.start()
    expect(game.attemptPickupSpawnAt({ x: 90, y: 90, radius: 14 }, 'normal')).toBe(true)
    expect(game.attemptHazardSpawnAt({ x: 90, y: 90, radius: 24 })).toBe(true)
    game.tick(500)
    game.setPlayerPosition(90, 90)
    game.tick(16)

    expect(game.snapshot().score).toBe(10)
    expect(game.snapshot().lastCollisionResults[0]).toBe('hit_accepted')
  })

  it('grants visible Invulnerability and ignores repeated same-frame Hazard overlaps', () => {
    const game = createGame()

    game.start()
    expect(game.attemptHazardSpawnAt({ x: 90, y: 90, radius: 24 })).toBe(true)
    expect(game.attemptHazardSpawnAt({ x: 120, y: 90, radius: 24 })).toBe(true)
    game.tick(500)
    game.setPlayerPosition(105, 90)
    game.tick(16)

    expect(game.snapshot().hitsTaken).toBe(1)
    expect(game.snapshot().player.invulnerable).toBe(true)
    expect(game.snapshot().lastCollisionResults).toEqual([
      'hit_accepted',
      'hit_ignored_invulnerable',
    ])

    game.setPlayerPosition(300, 300)
    game.tick(INVULNERABILITY_DURATION_MS)
    expect(game.snapshot().player.invulnerable).toBe(false)
  })
})

describe('Issues 006-008: Dash, Shield, and Combo Chain', () => {
  it('runs Dash through active and cooldown states and blocks repeated use during cooldown', () => {
    const game = createGame()

    game.start()
    game.dash()
    expect(game.snapshot().dash.state).toBe('dashing')

    game.tick(DASH_DURATION_MS)
    expect(game.snapshot().dash.state).toBe('cooldown')

    game.dash()
    expect(game.snapshot().dash.state).toBe('cooldown')

    game.tick(DASH_COOLDOWN_MS)
    expect(game.snapshot().dash.state).toBe('ready')
  })

  it('uses Collision Resolution order: Invulnerability, Dash, Shield, then Hit', () => {
    const game = createGame()

    game.start()
    expect(game.attemptPickupSpawnAt({ x: 90, y: 90, radius: 14 }, 'shield')).toBe(true)
    game.setPlayerPosition(90, 90)
    game.tick(16)
    expect(game.snapshot().shield.state).toBe('active')

    expect(game.attemptHazardSpawnAt({ x: 180, y: 90, radius: 24 })).toBe(true)
    game.tick(500)
    game.dash()
    game.setPlayerPosition(180, 90)
    game.tick(16)
    expect(game.snapshot().lastCollisionResults[0]).toBe('hit_avoided_dash')
    expect(game.snapshot().shield.state).toBe('active')

    game.tick(DASH_DURATION_MS)
    collideWithHazard(game, 270, 90)
    expect(game.snapshot().lastCollisionResults[0]).toBe('hit_blocked_shield')
    expect(game.snapshot().hitsTaken).toBe(0)
    expect(game.snapshot().shield.state).toBe('consumed')

    collideWithHazard(game, 360, 90)
    expect(game.snapshot().lastCollisionResults[0]).toBe('hit_accepted')
    expect(game.snapshot().hitsTaken).toBe(1)
  })

  it('collects Shield Pickups, refreshes Shield duration, and expires Shield', () => {
    const game = createGame()

    game.start()
    collectPickup(game, 90, 90, 'shield')
    expect(game.snapshot().shield.state).toBe('active')
    expect(game.snapshot().shield.remainingMs).toBe(SHIELD_DURATION_MS)

    game.tick(1_000)
    collectPickup(game, 180, 90, 'shield')
    expect(game.snapshot().shield.remainingMs).toBe(SHIELD_DURATION_MS)

    game.tick(SHIELD_DURATION_MS)
    expect(game.snapshot().shield.state).toBe('expired')
  })

  it('builds Combo Chain, applies multiplier at threshold, and expires while active only', () => {
    const game = createGame()

    game.start()
    collectPickup(game, 90, 90, 'normal')
    collectPickup(game, 180, 90, 'normal')
    collectPickup(game, 270, 90, 'normal')

    expect(game.snapshot().combo.state).toBe('multiplier')
    expect(game.snapshot().combo.multiplier).toBe(COMBO_MULTIPLIER)
    expect(game.snapshot().score).toBe(40)

    game.pause()
    game.tick(SPEED_BOOST_DURATION_MS + 3_000)
    expect(game.snapshot().combo.state).toBe('multiplier')

    game.resume()
    game.tick(3_000)
    expect(game.snapshot().combo.state).toBe('inactive')
  })
})

describe('Issues 009-010: Wave pressure and Best Score persistence', () => {
  it('moves through Wave pressure states and enters Breather only after accepted Hits', () => {
    const game = createGame({ random: sequence([0, 0, 0.1, 0.1, 0.2, 0.2]) })

    game.start()
    expect(game.snapshot().wave.state).toBe('opening')

    game.tick(10_000)
    expect(game.snapshot().wave.state).toBe('rising')

    collideWithHazard(game, 90, 90)
    expect(game.snapshot().wave.state).toBe('breather')
    expect(game.snapshot().wave.spawnBlockedMs).toBeGreaterThan(0)

    game.setPlayerPosition(300, 300)
    game.tick(2_000)
    expect(game.snapshot().wave.state).toBe('pressure')

    game.tick(game.snapshot().roundTimerMs - 15_000)
    expect(game.snapshot().wave.state).toBe('finalRush')
    expect(game.snapshot().wave.hazardSpawnIntervalMs).toBeLessThanOrEqual(450)
  })

  it('updates Best Score only after terminal Rounds and preserves it through restart', () => {
    const savedScores: number[] = []
    const storage = {
      load: () => 15,
      save: (score: number) => {
        savedScores.push(score)
      },
    }
    const game = createGame({ storage })

    game.start()
    collectPickup(game, 90, 90, 'normal')
    collectPickup(game, 180, 90, 'normal')
    expect(savedScores).toEqual([])

    game.tick(game.snapshot().roundTimerMs)
    expect(game.snapshot().roundState).toBe('won')
    expect(game.snapshot().bestScore).toBe(20)
    expect(savedScores).toEqual([20])

    game.restart()
    expect(game.snapshot().bestScore).toBe(20)
    expect(game.snapshot().score).toBe(0)
  })
})

function takeAcceptedHit(game: ReturnType<typeof createGame>, x: number, y: number): void {
  collideWithHazard(game, x, y)
  expect(game.snapshot().lastCollisionResults[0]).toBe('hit_accepted')
}

function collideWithHazard(game: ReturnType<typeof createGame>, x: number, y: number): void {
  expect(game.attemptHazardSpawnAt({ x, y, radius: 24 })).toBe(true)
  game.tick(500)
  game.setPlayerPosition(x, y)
  game.tick(16)
}

function collectPickup(
  game: ReturnType<typeof createGame>,
  x: number,
  y: number,
  kind: 'normal' | 'shield',
): void {
  expect(game.attemptPickupSpawnAt({ x, y, radius: 14 }, kind)).toBe(true)
  game.setPlayerPosition(x, y)
  game.tick(16)
}

function sequence(values: number[]): () => number {
  let index = 0

  return () => {
    const value = values[index] ?? values.at(-1) ?? 0

    index += 1

    return value
  }
}
