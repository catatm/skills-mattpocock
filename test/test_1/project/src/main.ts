import './style.css'
import { createGame, type GameSnapshot, type MovementInput } from './domain/game'

const game = createGame()
const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('App root was not found.')
}

root.innerHTML = `
  <main class="game-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark"></span>
        <h1>Arcade Dodging</h1>
      </div>
      <dl class="hud" aria-label="Round status">
        <div><dt>Timer</dt><dd id="hud-timer">60.0</dd></div>
        <div><dt>State</dt><dd id="hud-state">ready</dd></div>
        <div><dt>Score</dt><dd id="hud-score">0</dd></div>
        <div><dt>Hits</dt><dd id="hud-hits">3</dd></div>
        <div><dt>Best</dt><dd id="hud-best">0</dd></div>
      </dl>
    </header>

    <section class="play-layout">
      <div class="stage-wrap">
        <canvas id="game-canvas" width="860" height="520" aria-label="Arcade dodging play area"></canvas>
        <div id="overlay" class="overlay">
          <div class="overlay-panel">
            <p id="overlay-state">Ready</p>
            <strong id="overlay-score">Score 0</strong>
            <button id="overlay-action" type="button">Start</button>
          </div>
        </div>
      </div>

      <aside class="side-panel" aria-label="Player state">
        <dl class="status-list">
          <div><dt>Dash</dt><dd id="hud-dash">disabled</dd></div>
          <div><dt>Shield</dt><dd id="hud-shield">inactive</dd></div>
          <div><dt>Combo</dt><dd id="hud-combo">inactive</dd></div>
          <div><dt>Wave</dt><dd id="hud-wave">stopped</dd></div>
        </dl>
        <div class="actions">
          <button id="primary-action" type="button">Start</button>
          <button id="pause-action" type="button">Pause</button>
          <button id="restart-action" type="button">Restart</button>
        </div>
      </aside>
    </section>
  </main>
`

const canvas = getElement<HTMLCanvasElement>('game-canvas')
const context = getCanvasContext(canvas)

const keys = new Set<string>()
let lastFrameMs = performance.now()

const elements = {
  timer: getElement('hud-timer'),
  state: getElement('hud-state'),
  score: getElement('hud-score'),
  hits: getElement('hud-hits'),
  best: getElement('hud-best'),
  dash: getElement('hud-dash'),
  shield: getElement('hud-shield'),
  combo: getElement('hud-combo'),
  wave: getElement('hud-wave'),
  overlay: getElement('overlay'),
  overlayState: getElement('overlay-state'),
  overlayScore: getElement('overlay-score'),
  overlayAction: getElement<HTMLButtonElement>('overlay-action'),
  primaryAction: getElement<HTMLButtonElement>('primary-action'),
  pauseAction: getElement<HTMLButtonElement>('pause-action'),
  restartAction: getElement<HTMLButtonElement>('restart-action'),
}

elements.primaryAction.addEventListener('click', () => {
  const snapshot = game.snapshot()

  if (snapshot.roundState === 'ready') {
    game.start()
  } else if (snapshot.roundState === 'won' || snapshot.roundState === 'lost') {
    game.restart()
  }

  render(game.snapshot())
})

elements.overlayAction.addEventListener('click', () => {
  const snapshot = game.snapshot()

  if (snapshot.roundState === 'ready') {
    game.start()
  } else {
    game.restart()
  }

  render(game.snapshot())
})

elements.pauseAction.addEventListener('click', () => {
  togglePause()
  render(game.snapshot())
})

elements.restartAction.addEventListener('click', () => {
  game.restart()
  render(game.snapshot())
})

window.addEventListener('keydown', (event) => {
  if (isMovementKey(event.key)) {
    keys.add(event.key.toLowerCase())
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    togglePause()
  }

  if (event.code === 'Space') {
    event.preventDefault()
    game.dash()
  }
})

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase())
})

function frame(nowMs: number): void {
  const deltaMs = Math.min(48, nowMs - lastFrameMs)

  lastFrameMs = nowMs
  game.setMovement(readMovementInput())
  game.tick(deltaMs)
  render(game.snapshot())
  requestAnimationFrame(frame)
}

function togglePause(): void {
  const snapshot = game.snapshot()

  if (snapshot.roundState === 'active') {
    game.pause()
  } else if (snapshot.roundState === 'paused') {
    game.resume()
  }
}

function readMovementInput(): MovementInput {
  return {
    up: keys.has('w') || keys.has('arrowup'),
    down: keys.has('s') || keys.has('arrowdown'),
    left: keys.has('a') || keys.has('arrowleft'),
    right: keys.has('d') || keys.has('arrowright'),
  }
}

function render(snapshot: GameSnapshot): void {
  canvas.dataset.playerX = snapshot.player.x.toFixed(1)
  canvas.dataset.playerY = snapshot.player.y.toFixed(1)
  draw(snapshot)
  renderHud(snapshot)
  renderControls(snapshot)
}

function draw(snapshot: GameSnapshot): void {
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#10141f'
  context.fillRect(0, 0, canvas.width, canvas.height)
  drawGrid()

  for (const pickup of snapshot.pickups) {
    if (pickup.state !== 'available') continue

    context.beginPath()
    context.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2)
    context.fillStyle = pickup.kind === 'shield' ? '#62a8ff' : '#4ee7b8'
    context.shadowColor = context.fillStyle
    context.shadowBlur = 16
    context.fill()
    context.shadowBlur = 0
  }

  for (const hazard of snapshot.hazards) {
    if (hazard.state === 'warning') {
      context.beginPath()
      context.arc(hazard.x, hazard.y, hazard.radius + 6, 0, Math.PI * 2)
      context.strokeStyle = '#ffd166'
      context.lineWidth = 3
      context.setLineDash([8, 8])
      context.stroke()
      context.setLineDash([])
    }

    if (hazard.state === 'active') {
      context.beginPath()
      context.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2)
      context.fillStyle = '#ff4d6d'
      context.shadowColor = '#ff4d6d'
      context.shadowBlur = 20
      context.fill()
      context.shadowBlur = 0
    }
  }

  context.beginPath()
  context.arc(snapshot.player.x, snapshot.player.y, snapshot.player.radius, 0, Math.PI * 2)
  context.fillStyle = snapshot.player.invulnerable ? '#f8f7ff' : '#f7f052'
  context.shadowColor = snapshot.player.invulnerable ? '#f8f7ff' : '#f7f052'
  context.shadowBlur = snapshot.player.invulnerable ? 26 : 14
  context.fill()
  context.shadowBlur = 0

  if (snapshot.dash.state === 'dashing' || snapshot.player.invulnerable) {
    context.beginPath()
    context.arc(snapshot.player.x, snapshot.player.y, snapshot.player.radius + 10, 0, Math.PI * 2)
    context.strokeStyle = snapshot.dash.state === 'dashing' ? '#8bd3ff' : '#ffffff'
    context.lineWidth = 3
    context.stroke()
  }
}

function drawGrid(): void {
  context.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  context.lineWidth = 1

  for (let x = 40; x < canvas.width; x += 40) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, canvas.height)
    context.stroke()
  }

  for (let y = 40; y < canvas.height; y += 40) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(canvas.width, y)
    context.stroke()
  }
}

function renderHud(snapshot: GameSnapshot): void {
  elements.timer.textContent = (snapshot.roundTimerMs / 1_000).toFixed(1)
  elements.state.textContent = snapshot.roundState
  elements.score.textContent = String(snapshot.score)
  elements.hits.textContent = String(snapshot.hitsRemaining)
  elements.best.textContent = String(snapshot.bestScore)
  elements.dash.textContent = formatTimedState(snapshot.dash.state, snapshot.dash.remainingMs)
  elements.shield.textContent = formatTimedState(
    snapshot.shield.state,
    snapshot.shield.remainingMs,
  )
  elements.combo.textContent =
    snapshot.combo.state === 'inactive'
      ? 'inactive'
      : `${snapshot.combo.count} x${snapshot.combo.multiplier}`
  elements.wave.textContent = snapshot.wave.state
}

function renderControls(snapshot: GameSnapshot): void {
  const isTerminal = snapshot.roundState === 'won' || snapshot.roundState === 'lost'
  const showOverlay = snapshot.roundState === 'ready' || isTerminal

  elements.overlay.classList.toggle('is-visible', showOverlay)
  elements.overlayState.textContent = capitalize(snapshot.roundState)
  elements.overlayScore.textContent = isTerminal
    ? `Score ${snapshot.score} | Best ${snapshot.bestScore}`
    : `Best ${snapshot.bestScore}`
  elements.overlayAction.textContent = snapshot.roundState === 'ready' ? 'Start' : 'Restart'
  elements.primaryAction.textContent = snapshot.roundState === 'ready' ? 'Start' : 'Restart'
  elements.primaryAction.disabled = snapshot.roundState === 'active' || snapshot.roundState === 'paused'
  elements.pauseAction.disabled =
    snapshot.roundState !== 'active' && snapshot.roundState !== 'paused'
  elements.pauseAction.textContent = snapshot.roundState === 'paused' ? 'Resume' : 'Pause'
}

function formatTimedState(state: string, remainingMs: number): string {
  if (remainingMs <= 0) return state

  return `${state} ${(remainingMs / 1_000).toFixed(1)}`
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function isMovementKey(key: string): boolean {
  return ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(
    key.toLowerCase(),
  )
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)

  if (!element) {
    throw new Error(`Element #${id} was not found.`)
  }

  return element as T
}

function getCanvasContext(canvasElement: HTMLCanvasElement): CanvasRenderingContext2D {
  const canvasContext = canvasElement.getContext('2d')

  if (!canvasContext) {
    throw new Error('Canvas 2D context was not available.')
  }

  return canvasContext
}

render(game.snapshot())
requestAnimationFrame(frame)
