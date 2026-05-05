import { assign, createActor, createMachine } from 'xstate'

export const ROUND_LENGTH_MS = 60_000
export const PLAYER_NORMAL_SPEED = 240
export const PLAYER_BOOSTED_SPEED = 340
export const PLAYER_MAX_HITS = 3
export const WARNING_DURATION_MS = 500
export const HAZARD_SPAWN_INTERVAL_MS = 1_200
export const PICKUP_SPAWN_INTERVAL_MS = 2_500
export const PICKUP_LIFETIME_MS = 7_000
export const SPEED_BOOST_DURATION_MS = 2_000
export const INVULNERABILITY_DURATION_MS = 1_000
export const DASH_DURATION_MS = 180
export const DASH_COOLDOWN_MS = 1_200
export const SHIELD_DURATION_MS = 8_000
export const COMBO_WINDOW_MS = 3_000
export const COMBO_THRESHOLD = 3
export const COMBO_MULTIPLIER = 2
export const FINAL_RUSH_REMAINING_MS = 15_000
export const MIN_HAZARD_SPAWN_INTERVAL_MS = 450
export const BREATHER_DURATION_MS = 2_000

export type RoundState = 'ready' | 'active' | 'paused' | 'won' | 'lost'
export type HazardState = 'warning' | 'active' | 'resolved'
export type PickupState = 'available' | 'collected' | 'expired'
export type PickupKind = 'normal' | 'shield'
export type DashState = 'disabled' | 'ready' | 'dashing' | 'cooldown'
export type ShieldState = 'inactive' | 'active' | 'consumed' | 'expired'
export type ComboState = 'inactive' | 'active' | 'multiplier'
export type WaveState = 'stopped' | 'opening' | 'rising' | 'pressure' | 'breather' | 'finalRush'
export type CollisionResult =
  | 'hit_accepted'
  | 'hit_ignored_invulnerable'
  | 'hit_avoided_dash'
  | 'hit_blocked_shield'

export type MovementInput = Partial<{
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}>

export type Circle = {
  x: number
  y: number
  radius: number
}

export type PlayArea = {
  width: number
  height: number
}

export type PlayerSnapshot = Circle & {
  speed: number
  invulnerable: boolean
  boosted: boolean
}

export type HazardSnapshot = Circle & {
  id: number
  state: HazardState
  warningRemainingMs: number
  activeRemainingMs: number
}

export type PickupSnapshot = Circle & {
  id: number
  kind: PickupKind
  state: PickupState
  lifetimeRemainingMs: number
}

export type GameSnapshot = {
  roundState: RoundState
  roundTimerMs: number
  playArea: PlayArea
  player: PlayerSnapshot
  score: number
  bestScore: number
  hitsTaken: number
  hitsRemaining: number
  hazards: HazardSnapshot[]
  pickups: PickupSnapshot[]
  dash: {
    state: DashState
    remainingMs: number
  }
  shield: {
    state: ShieldState
    remainingMs: number
  }
  combo: {
    state: ComboState
    count: number
    remainingMs: number
    multiplier: number
  }
  wave: {
    state: WaveState
    hazardSpawnIntervalMs: number
    spawnBlockedMs: number
  }
  lastCollisionResults: CollisionResult[]
}

export type BestScoreStorage = {
  load: () => number
  save: (score: number) => void
}

type RoundContext = {
  roundTimerMs: number
  hitsTaken: number
  score: number
  bestScore: number
}

type RoundInput = {
  bestScore: number
}

type RoundEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'PLAYER_HIT' }
  | { type: 'SCORE_ADDED'; score: number }

type RoundActor = ReturnType<typeof createActor<ReturnType<typeof createRoundMachine>>>
type MutableHazard = HazardSnapshot
type MutablePickup = PickupSnapshot

type GameOptions = Partial<{
  playArea: PlayArea
  random: () => number
  storage: BestScoreStorage
}>

type GameInternals = {
  player: PlayerSnapshot
  movement: Required<MovementInput>
  hazards: MutableHazard[]
  pickups: MutablePickup[]
  nextEntityId: number
  hazardSpawnElapsedMs: number
  pickupSpawnElapsedMs: number
  pickupSpawnCount: number
  boostRemainingMs: number
  invulnerabilityRemainingMs: number
  dashState: DashState
  dashRemainingMs: number
  shieldState: ShieldState
  shieldRemainingMs: number
  comboState: ComboState
  comboCount: number
  comboRemainingMs: number
  waveState: WaveState
  waveElapsedMs: number
  breatherRemainingMs: number
  breatherSpawnBlockedMs: number
  lastCollisionResults: CollisionResult[]
  persistedBestScore: number
}

type ActiveRoundFrameInput = {
  state: GameInternals
  playArea: PlayArea
  random: () => number
  roundActor: RoundActor
  elapsedMs: number
}

type ActiveRoundFrameResult = {
  shouldPersistBestScore: boolean
}

type WaveModel = {
  state: WaveState
  elapsedMs: number
  breatherRemainingMs: number
  spawnBlockedMs: number
}

type CollisionResolutionInput = {
  invulnerable: boolean
  dashing: boolean
  shieldActive: boolean
}

type CollisionResolution = {
  result: CollisionResult
  effects: {
    consumeShield: boolean
    acceptHit: boolean
    resolveHazard: boolean
  }
}

type SafeSpawnOccupancy = {
  player: Circle
  activeHazards: Circle[]
  availablePickups: Circle[]
}

type BestScorePersistenceInput = {
  roundState: RoundState
  bestScore: number
  persistedBestScore: number
}

type BestScorePersistenceEffect =
  | { type: 'none' }
  | { type: 'save'; score: number }

const defaultPlayArea: PlayArea = {
  width: 860,
  height: 520,
}

function browserBestScoreStorage(): BestScoreStorage {
  return {
    load: () => {
      const stored = globalThis.localStorage?.getItem('arcade-dodging-best-score')

      return parseStoredBestScore(stored)
    },
    save: (score) => {
      globalThis.localStorage?.setItem('arcade-dodging-best-score', String(score))
    },
  }
}

function createRoundMachine() {
  return createMachine({
    id: 'round',
    types: {} as {
      context: RoundContext
      events: RoundEvent
      input: RoundInput
    },
    initial: 'ready',
    context: ({ input }) => ({
      roundTimerMs: ROUND_LENGTH_MS,
      hitsTaken: 0,
      score: 0,
      bestScore: input.bestScore,
    }),
    states: {
      ready: {
        on: {
          START: {
            target: 'active',
            actions: assign(({ context }) => resetRoundContext(context.bestScore)),
          },
          RESTART: {
            actions: assign(({ context }) => resetRoundContext(context.bestScore)),
          },
        },
      },
      active: {
        on: {
          PAUSE: 'paused',
          TICK: [
            {
              guard: ({ context, event }) => event.deltaMs >= context.roundTimerMs,
              target: 'won',
              actions: assign(({ context }) => completeRoundContext(context, 'won')),
            },
            {
              actions: assign({
                roundTimerMs: ({ context, event }) =>
                  Math.max(0, context.roundTimerMs - event.deltaMs),
              }),
            },
          ],
          PLAYER_HIT: [
            {
              guard: ({ context }) => context.hitsTaken + 1 >= PLAYER_MAX_HITS,
              target: 'lost',
              actions: assign(({ context }) =>
                completeRoundContext(
                  {
                    ...context,
                    hitsTaken: PLAYER_MAX_HITS,
                  },
                  'lost',
                ),
              ),
            },
            {
              actions: assign({
                hitsTaken: ({ context }) => context.hitsTaken + 1,
              }),
            },
          ],
          SCORE_ADDED: {
            actions: assign({
              score: ({ context, event }) => context.score + event.score,
            }),
          },
          RESTART: {
            target: 'ready',
            actions: assign(({ context }) => resetRoundContext(context.bestScore)),
          },
        },
      },
      paused: {
        on: {
          RESUME: 'active',
          TICK: {},
          RESTART: {
            target: 'ready',
            actions: assign(({ context }) => resetRoundContext(context.bestScore)),
          },
        },
      },
      won: {
        on: {
          RESTART: {
            target: 'ready',
            actions: assign(({ context }) => resetRoundContext(context.bestScore)),
          },
        },
      },
      lost: {
        on: {
          RESTART: {
            target: 'ready',
            actions: assign(({ context }) => resetRoundContext(context.bestScore)),
          },
        },
      },
    },
  })
}

function resetRoundContext(bestScore: number): RoundContext {
  return {
    roundTimerMs: ROUND_LENGTH_MS,
    hitsTaken: 0,
    score: 0,
    bestScore,
  }
}

function completeRoundContext(context: RoundContext, state: 'won' | 'lost'): RoundContext {
  return {
    ...context,
    roundTimerMs: state === 'won' ? 0 : context.roundTimerMs,
    bestScore: Math.max(context.bestScore, context.score),
  }
}

export function createGame(options: GameOptions = {}) {
  const playArea = options.playArea ?? defaultPlayArea
  const random = options.random ?? Math.random
  const storage = options.storage ?? browserBestScoreStorage()
  const loadedBestScore = storage.load()
  const roundActor = createActor(createRoundMachine(), {
    input: {
      bestScore: loadedBestScore,
    },
  }).start()
  const state: GameInternals = createInitialInternals(playArea, loadedBestScore)

  function syncPersistedBestScore(): void {
    const context = currentRoundContext(roundActor)
    const effect = planBestScorePersistence({
      roundState: currentRoundState(roundActor),
      bestScore: context.bestScore,
      persistedBestScore: state.persistedBestScore,
    })

    if (effect.type === 'none') return

    state.persistedBestScore = effect.score
    storage.save(effect.score)
  }

  function resetTransientState(): void {
    const reset = createInitialInternals(playArea, currentRoundContext(roundActor).bestScore)

    Object.assign(state, reset)
  }

  return {
    start: () => {
      roundActor.send({ type: 'START' })
      Object.assign(
        state,
        createInitialInternals(playArea, currentRoundContext(roundActor).bestScore),
      )
      state.dashState = 'ready'
      state.waveState = 'opening'
    },
    pause: () => {
      roundActor.send({ type: 'PAUSE' })
    },
    resume: () => {
      roundActor.send({ type: 'RESUME' })
    },
    restart: () => {
      roundActor.send({ type: 'RESTART' })
      resetTransientState()
    },
    setMovement: (movement: MovementInput) => {
      state.movement = normalizeMovementInput(movement)
    },
    setPlayerPosition: (x: number, y: number) => {
      state.player.x = clamp(x, state.player.radius, playArea.width - state.player.radius)
      state.player.y = clamp(y, state.player.radius, playArea.height - state.player.radius)
    },
    dash: () => {
      if (currentRoundState(roundActor) !== 'active' || state.dashState !== 'ready') return

      state.dashState = 'dashing'
      state.dashRemainingMs = DASH_DURATION_MS
    },
    attemptHazardSpawnAt: (circle: Circle) => {
      if (currentRoundState(roundActor) !== 'active') return false

      return spawnHazardAt(state, circle)
    },
    attemptPickupSpawnAt: (circle: Circle, kind: PickupKind = 'normal') =>
      currentRoundState(roundActor) === 'active' && spawnPickupAt(state, circle, kind),
    tick: (deltaMs: number) => {
      const elapsedMs = Math.max(0, deltaMs)

      state.lastCollisionResults = []

      if (currentRoundState(roundActor) !== 'active' || elapsedMs === 0) return

      const result = advanceActiveRoundFrame({
        state,
        playArea,
        random,
        roundActor,
        elapsedMs,
      })

      if (result.shouldPersistBestScore) {
        syncPersistedBestScore()
      }
    },
    snapshot: (): GameSnapshot => {
      const context = currentRoundContext(roundActor)

      return {
        roundState: currentRoundState(roundActor),
        roundTimerMs: context.roundTimerMs,
        playArea: { ...playArea },
        player: {
          ...state.player,
          speed: currentPlayerSpeed(state),
          invulnerable: state.invulnerabilityRemainingMs > 0,
          boosted: state.boostRemainingMs > 0,
        },
        score: context.score,
        bestScore: context.bestScore,
        hitsTaken: context.hitsTaken,
        hitsRemaining: Math.max(0, PLAYER_MAX_HITS - context.hitsTaken),
        hazards: state.hazards.map((hazard) => ({ ...hazard })),
        pickups: state.pickups.map((pickup) => ({ ...pickup })),
        dash: {
          state: state.dashState,
          remainingMs: state.dashRemainingMs,
        },
        shield: {
          state: state.shieldState,
          remainingMs: state.shieldRemainingMs,
        },
        combo: {
          state: state.comboState,
          count: state.comboCount,
          remainingMs: state.comboRemainingMs,
          multiplier: state.comboState === 'multiplier' ? COMBO_MULTIPLIER : 1,
        },
        wave: {
          state: state.waveState,
          hazardSpawnIntervalMs: currentHazardSpawnInterval(readWaveModel(state)),
          spawnBlockedMs: state.breatherSpawnBlockedMs,
        },
        lastCollisionResults: [...state.lastCollisionResults],
      }
    },
  }
}

function advanceActiveRoundFrame({
  state,
  playArea,
  random,
  roundActor,
  elapsedMs,
}: ActiveRoundFrameInput): ActiveRoundFrameResult {
  movePlayer(state, playArea, elapsedMs)
  roundActor.send({ type: 'TICK', deltaMs: elapsedMs })

  if (currentRoundState(roundActor) === 'won') {
    endRoundState(state)

    return { shouldPersistBestScore: true }
  }

  updateWaveState(state, currentRoundContext(roundActor).roundTimerMs, elapsedMs)
  updatePlayerConditionTimers(state, elapsedMs)
  updateDashTimer(state, elapsedMs)
  updateShieldTimer(state, elapsedMs)
  updateComboTimer(state, elapsedMs)
  updateHazards(state, elapsedMs)
  updatePickups(state, elapsedMs)
  updateSpawnCadence(state, playArea, random, elapsedMs)
  resolvePickupCollisions(state, roundActor)
  resolveHazardCollisions(state, roundActor)

  if (isTerminalRoundState(currentRoundState(roundActor))) {
    endRoundState(state)

    return { shouldPersistBestScore: true }
  }

  return { shouldPersistBestScore: false }
}

function currentRoundState(roundActor: RoundActor): RoundState {
  return String(roundActor.getSnapshot().value) as RoundState
}

function currentRoundContext(roundActor: RoundActor): RoundContext {
  return roundActor.getSnapshot().context
}

function planBestScorePersistence(
  input: BestScorePersistenceInput,
): BestScorePersistenceEffect {
  if (!isTerminalRoundState(input.roundState)) return { type: 'none' }
  if (input.bestScore <= input.persistedBestScore) return { type: 'none' }

  return { type: 'save', score: input.bestScore }
}

function parseStoredBestScore(stored: string | null | undefined): number {
  const parsed = Number(stored)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function createInitialInternals(playArea: PlayArea, bestScore: number): GameInternals {
  return {
    player: {
      x: playArea.width / 2,
      y: playArea.height / 2,
      radius: 16,
      speed: PLAYER_NORMAL_SPEED,
      invulnerable: false,
      boosted: false,
    },
    movement: normalizeMovementInput({}),
    hazards: [],
    pickups: [],
    nextEntityId: 1,
    hazardSpawnElapsedMs: 0,
    pickupSpawnElapsedMs: 0,
    pickupSpawnCount: 0,
    boostRemainingMs: 0,
    invulnerabilityRemainingMs: 0,
    dashState: 'disabled',
    dashRemainingMs: 0,
    shieldState: 'inactive',
    shieldRemainingMs: 0,
    comboState: 'inactive',
    comboCount: 0,
    comboRemainingMs: 0,
    waveState: 'stopped',
    waveElapsedMs: 0,
    breatherRemainingMs: 0,
    breatherSpawnBlockedMs: 0,
    lastCollisionResults: [],
    persistedBestScore: bestScore,
  }
}

function normalizeMovementInput(movement: MovementInput): Required<MovementInput> {
  return {
    up: movement.up ?? false,
    down: movement.down ?? false,
    left: movement.left ?? false,
    right: movement.right ?? false,
  }
}

function movePlayer(state: GameInternals, playArea: PlayArea, elapsedMs: number): void {
  const horizontal = Number(state.movement.right) - Number(state.movement.left)
  const vertical = Number(state.movement.down) - Number(state.movement.up)

  if (horizontal === 0 && vertical === 0) return

  const magnitude = Math.hypot(horizontal, vertical)
  const distance = currentPlayerSpeed(state) * (elapsedMs / 1_000)

  state.player.x = clamp(
    state.player.x + (horizontal / magnitude) * distance,
    state.player.radius,
    playArea.width - state.player.radius,
  )
  state.player.y = clamp(
    state.player.y + (vertical / magnitude) * distance,
    state.player.radius,
    playArea.height - state.player.radius,
  )
}

function currentPlayerSpeed(state: GameInternals): number {
  return state.boostRemainingMs > 0 ? PLAYER_BOOSTED_SPEED : PLAYER_NORMAL_SPEED
}

function updatePlayerConditionTimers(state: GameInternals, elapsedMs: number): void {
  state.boostRemainingMs = Math.max(0, state.boostRemainingMs - elapsedMs)
  state.invulnerabilityRemainingMs = Math.max(
    0,
    state.invulnerabilityRemainingMs - elapsedMs,
  )
}

function updateDashTimer(state: GameInternals, elapsedMs: number): void {
  if (state.dashState !== 'dashing' && state.dashState !== 'cooldown') return

  const remainingBeforeTick = state.dashRemainingMs

  state.dashRemainingMs = Math.max(0, state.dashRemainingMs - elapsedMs)

  if (state.dashRemainingMs > 0) return

  if (state.dashState === 'dashing') {
    const overflowMs = Math.max(0, elapsedMs - remainingBeforeTick)

    state.dashState = 'cooldown'
    state.dashRemainingMs = Math.max(0, DASH_COOLDOWN_MS - overflowMs)

    if (state.dashRemainingMs === 0) {
      state.dashState = 'ready'
    }

    return
  }

  state.dashState = 'ready'
}

function updateShieldTimer(state: GameInternals, elapsedMs: number): void {
  if (state.shieldState !== 'active') return

  state.shieldRemainingMs = Math.max(0, state.shieldRemainingMs - elapsedMs)

  if (state.shieldRemainingMs === 0) {
    state.shieldState = 'expired'
  }
}

function updateComboTimer(state: GameInternals, elapsedMs: number): void {
  if (state.comboState === 'inactive') return

  state.comboRemainingMs = Math.max(0, state.comboRemainingMs - elapsedMs)

  if (state.comboRemainingMs === 0) {
    state.comboState = 'inactive'
    state.comboCount = 0
  }
}

function updateHazards(state: GameInternals, elapsedMs: number): void {
  for (const hazard of state.hazards) {
    if (hazard.state === 'warning') {
      hazard.warningRemainingMs = Math.max(0, hazard.warningRemainingMs - elapsedMs)

      if (hazard.warningRemainingMs === 0) {
        hazard.state = isCircleSafeForActiveHazard(hazard, state) ? 'active' : 'resolved'
      }
    } else if (hazard.state === 'active') {
      hazard.activeRemainingMs = Math.max(0, hazard.activeRemainingMs - elapsedMs)

      if (hazard.activeRemainingMs === 0) {
        hazard.state = 'resolved'
      }
    }
  }
}

function updatePickups(state: GameInternals, elapsedMs: number): void {
  for (const pickup of state.pickups) {
    if (pickup.state !== 'available') continue

    pickup.lifetimeRemainingMs = Math.max(0, pickup.lifetimeRemainingMs - elapsedMs)

    if (pickup.lifetimeRemainingMs === 0) {
      pickup.state = 'expired'
    }
  }
}

function updateSpawnCadence(
  state: GameInternals,
  playArea: PlayArea,
  random: () => number,
  elapsedMs: number,
): void {
  const wave = readWaveModel(state)

  if (state.breatherSpawnBlockedMs === 0) {
    state.hazardSpawnElapsedMs += elapsedMs

    while (state.hazardSpawnElapsedMs >= currentHazardSpawnInterval(wave)) {
      state.hazardSpawnElapsedMs -= currentHazardSpawnInterval(wave)
      spawnHazardAt(state, randomCircle(playArea, 24, random))
    }
  }

  state.pickupSpawnElapsedMs += elapsedMs

  while (state.pickupSpawnElapsedMs >= PICKUP_SPAWN_INTERVAL_MS) {
    state.pickupSpawnElapsedMs -= PICKUP_SPAWN_INTERVAL_MS
    state.pickupSpawnCount += 1
    spawnPickupAt(
      state,
      randomCircle(playArea, 14, random),
      state.pickupSpawnCount % 5 === 0 ? 'shield' : 'normal',
    )
  }
}

function updateWaveState(
  state: GameInternals,
  roundTimerMs: number,
  elapsedMs: number,
): void {
  writeWaveModel(state, advanceWavePressure(readWaveModel(state), roundTimerMs, elapsedMs))
}

function advanceWavePressure(
  wave: WaveModel,
  roundTimerMs: number,
  elapsedMs: number,
): WaveModel {
  if (roundTimerMs <= FINAL_RUSH_REMAINING_MS) {
    return {
      ...wave,
      state: 'finalRush',
      breatherRemainingMs: 0,
      spawnBlockedMs: 0,
    }
  }

  if (wave.state === 'breather') {
    const breatherRemainingMs = Math.max(0, wave.breatherRemainingMs - elapsedMs)
    const spawnBlockedMs = Math.max(0, wave.spawnBlockedMs - elapsedMs)

    if (breatherRemainingMs > 0) {
      return {
        ...wave,
        breatherRemainingMs,
        spawnBlockedMs,
      }
    }

    return {
      ...wave,
      state: 'pressure',
      breatherRemainingMs,
      spawnBlockedMs,
    }
  }

  const elapsedWaveMs = wave.elapsedMs + elapsedMs

  if (wave.state === 'pressure') {
    return {
      ...wave,
      elapsedMs: elapsedWaveMs,
    }
  }

  if (elapsedWaveMs < 10_000) {
    return {
      ...wave,
      state: 'opening',
      elapsedMs: elapsedWaveMs,
    }
  }

  if (elapsedWaveMs < 30_000) {
    return {
      ...wave,
      state: 'rising',
      elapsedMs: elapsedWaveMs,
    }
  }

  return {
    ...wave,
    state: 'pressure',
    elapsedMs: elapsedWaveMs,
  }
}

function spawnHazardAt(state: GameInternals, circle: Circle): boolean {
  if (
    !isSafeSpawn(circle, readSafeSpawnOccupancy(state), { includePickups: false })
  ) {
    return false
  }

  state.hazards.push({
    ...circle,
    id: state.nextEntityId,
    state: 'warning',
    warningRemainingMs: WARNING_DURATION_MS,
    activeRemainingMs: 4_000,
  })
  state.nextEntityId += 1

  return true
}

function spawnPickupAt(
  state: GameInternals,
  circle: Circle,
  kind: PickupKind,
): boolean {
  if (
    !isSafeSpawn(circle, readSafeSpawnOccupancy(state), { includePickups: true })
  ) {
    return false
  }

  state.pickups.push({
    ...circle,
    id: state.nextEntityId,
    kind,
    state: 'available',
    lifetimeRemainingMs: PICKUP_LIFETIME_MS,
  })
  state.nextEntityId += 1

  return true
}

function resolvePickupCollisions(
  state: GameInternals,
  roundActor: RoundActor,
): void {
  for (const pickup of state.pickups) {
    if (pickup.state !== 'available' || !circlesOverlap(state.player, pickup)) continue

    pickup.state = 'collected'
    applyPickupCollection(state, pickup.kind)
    roundActor.send({ type: 'SCORE_ADDED', score: calculatePickupScore(state) })
  }
}

function applyPickupCollection(state: GameInternals, kind: PickupKind): void {
  state.comboCount += 1
  state.comboRemainingMs = COMBO_WINDOW_MS
  state.comboState = state.comboCount >= COMBO_THRESHOLD ? 'multiplier' : 'active'

  if (kind === 'normal') {
    state.boostRemainingMs = SPEED_BOOST_DURATION_MS
    return
  }

  state.shieldState = 'active'
  state.shieldRemainingMs = SHIELD_DURATION_MS
}

function calculatePickupScore(state: GameInternals): number {
  return 10 * (state.comboState === 'multiplier' ? COMBO_MULTIPLIER : 1)
}

function resolveHazardCollisions(
  state: GameInternals,
  roundActor: RoundActor,
): void {
  for (const hazard of state.hazards) {
    if (hazard.state !== 'active' || !circlesOverlap(state.player, hazard)) continue

    const resolution = resolveHazardCollision(readCollisionResolutionInput(state))

    state.lastCollisionResults.push(resolution.result)
    applyCollisionResolutionEffects(state, hazard, roundActor, resolution)
  }
}

function readCollisionResolutionInput(state: GameInternals): CollisionResolutionInput {
  return {
    invulnerable: state.invulnerabilityRemainingMs > 0,
    dashing: state.dashState === 'dashing',
    shieldActive: state.shieldState === 'active',
  }
}

function applyCollisionResolutionEffects(
  state: GameInternals,
  hazard: MutableHazard,
  roundActor: RoundActor,
  resolution: CollisionResolution,
): void {
  if (resolution.effects.consumeShield) {
    state.shieldState = 'consumed'
    state.shieldRemainingMs = 0
  }

  if (resolution.effects.resolveHazard) {
    hazard.state = 'resolved'
  }

  if (!resolution.effects.acceptHit) return

  state.invulnerabilityRemainingMs = INVULNERABILITY_DURATION_MS
  enterBreather(state)
  roundActor.send({ type: 'PLAYER_HIT' })
}

function resolveHazardCollision(input: CollisionResolutionInput): CollisionResolution {
  if (input.invulnerable) {
    return collisionResolution('hit_ignored_invulnerable')
  }

  if (input.dashing) {
    return collisionResolution('hit_avoided_dash', { resolveHazard: true })
  }

  if (input.shieldActive) {
    return collisionResolution('hit_blocked_shield', {
      consumeShield: true,
      resolveHazard: true,
    })
  }

  return collisionResolution('hit_accepted', {
    acceptHit: true,
    resolveHazard: true,
  })
}

function collisionResolution(
  result: CollisionResult,
  effects: Partial<CollisionResolution['effects']> = {},
): CollisionResolution {
  return {
    result,
    effects: {
      consumeShield: effects.consumeShield ?? false,
      acceptHit: effects.acceptHit ?? false,
      resolveHazard: effects.resolveHazard ?? false,
    },
  }
}

function enterBreather(state: GameInternals): void {
  writeWaveModel(state, enterBreatherWave(readWaveModel(state)))
}

function enterBreatherWave(wave: WaveModel): WaveModel {
  if (wave.state === 'finalRush') return wave

  return {
    ...wave,
    state: 'breather',
    breatherRemainingMs: BREATHER_DURATION_MS,
    spawnBlockedMs: 1_000,
  }
}

function endRoundState(state: GameInternals): void {
  state.dashState = 'disabled'
  state.dashRemainingMs = 0
  state.waveState = 'stopped'
  state.breatherRemainingMs = 0
  state.breatherSpawnBlockedMs = 0
  state.invulnerabilityRemainingMs = 0
  state.shieldState = state.shieldState === 'active' ? 'expired' : state.shieldState
  state.shieldRemainingMs = 0

  for (const hazard of state.hazards) {
    hazard.state = 'resolved'
  }
}

function isSafeSpawn(
  circle: Circle,
  occupancy: SafeSpawnOccupancy,
  options: { includePickups: boolean },
): boolean {
  if (circlesOverlap(circle, occupancy.player)) return false

  const overlapsHazard = occupancy.activeHazards.some((hazard) =>
    circlesOverlap(circle, hazard),
  )

  if (overlapsHazard) return false

  return (
    !options.includePickups ||
    !occupancy.availablePickups.some((pickup) => circlesOverlap(circle, pickup))
  )
}

function readSafeSpawnOccupancy(state: GameInternals): SafeSpawnOccupancy {
  return {
    player: state.player,
    activeHazards: state.hazards.filter((hazard) => hazard.state === 'active'),
    availablePickups: state.pickups.filter((pickup) => pickup.state === 'available'),
  }
}

function isCircleSafeForActiveHazard(hazard: Circle, state: GameInternals): boolean {
  return !circlesOverlap(hazard, state.player)
}

function currentHazardSpawnInterval(wave: WaveModel): number {
  if (wave.state === 'finalRush') return MIN_HAZARD_SPAWN_INTERVAL_MS
  if (wave.state === 'breather') return 1_600
  if (wave.state === 'pressure') return 700

  if (wave.state === 'rising') {
    const progress = clamp((wave.elapsedMs - 10_000) / 20_000, 0, 1)

    return Math.max(
      MIN_HAZARD_SPAWN_INTERVAL_MS,
      HAZARD_SPAWN_INTERVAL_MS - progress * 500,
    )
  }

  return HAZARD_SPAWN_INTERVAL_MS
}

function readWaveModel(state: GameInternals): WaveModel {
  return {
    state: state.waveState,
    elapsedMs: state.waveElapsedMs,
    breatherRemainingMs: state.breatherRemainingMs,
    spawnBlockedMs: state.breatherSpawnBlockedMs,
  }
}

function writeWaveModel(state: GameInternals, wave: WaveModel): void {
  state.waveState = wave.state
  state.waveElapsedMs = wave.elapsedMs
  state.breatherRemainingMs = wave.breatherRemainingMs
  state.breatherSpawnBlockedMs = wave.spawnBlockedMs
}

function randomCircle(playArea: PlayArea, radius: number, random: () => number): Circle {
  return {
    x: radius + random() * (playArea.width - radius * 2),
    y: radius + random() * (playArea.height - radius * 2),
    radius,
  }
}

function circlesOverlap(a: Circle, b: Circle): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isTerminalRoundState(roundState: RoundState): boolean {
  return roundState === 'won' || roundState === 'lost'
}
