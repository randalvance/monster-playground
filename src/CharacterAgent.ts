import type { CharacterConfig, MovementConfig, SpriteConfig } from './types'
import { SpriteAnimator } from './SpriteAnimator'

export class OccupancyMap {
  private occupied = new Map<string, string>()

  private key(x: number, y: number): string {
    return `${x},${y}`
  }

  claim(x: number, y: number, id: string): void {
    this.occupied.set(this.key(x, y), id)
  }

  release(x: number, y: number): void {
    this.occupied.delete(this.key(x, y))
  }

  isOccupied(x: number, y: number): boolean {
    return this.occupied.has(this.key(x, y))
  }
}

type MovementState = 'idle' | 'walking'

const DIRECTIONS = [
  { dx: 0, dy: -1, name: 'walkUp' },
  { dx: 0, dy: 1, name: 'walkDown' },
  { dx: -1, dy: 0, name: 'walkLeft' },
  { dx: 1, dy: 0, name: 'walkRight' },
] as const

export class CharacterAgent {
  private tileX: number
  private tileY: number
  private pixelX: number
  private pixelY: number
  private targetTileX: number
  private targetTileY: number
  private movementState: MovementState = 'idle'
  private pauseTimer: number
  private moveProgress = 0
  private externalState: string
  private walkDirection: string | null = null
  private animator: SpriteAnimator
  private movement: MovementConfig

  constructor(
    private config: CharacterConfig,
    defaultMovement: MovementConfig,
    private occupancy: OccupancyMap,
    private isWalkable: (x: number, y: number) => boolean,
  ) {
    this.tileX = config.startPosition.x
    this.tileY = config.startPosition.y
    this.targetTileX = this.tileX
    this.targetTileY = this.tileY
    this.pixelX = this.tileX
    this.pixelY = this.tileY
    this.externalState = config.state
    this.movement = { ...defaultMovement, ...config.movement }
    this.pauseTimer = this.randomPause()
    this.occupancy.claim(this.tileX, this.tileY, config.id)

    const spriteKeys = Object.keys(config.sprites)
    const initialSprite = config.sprites[this.externalState] ?? config.sprites[spriteKeys[0]]
    this.animator = new SpriteAnimator(initialSprite, this.movement.frameRate)
  }

  update(deltaMs: number): void {
    this.animator.update(deltaMs)

    if (this.movementState === 'idle') {
      this.pauseTimer -= deltaMs
      if (this.pauseTimer <= 0) {
        this.tryMove()
      }
    } else if (this.movementState === 'walking') {
      const moveDuration = 1000 / this.movement.speed
      this.moveProgress += deltaMs
      const t = Math.min(this.moveProgress / moveDuration, 1)
      this.pixelX = this.tileX + (this.targetTileX - this.tileX) * t
      this.pixelY = this.tileY + (this.targetTileY - this.tileY) * t

      if (t >= 1) {
        this.occupancy.release(this.tileX, this.tileY)
        this.tileX = this.targetTileX
        this.tileY = this.targetTileY
        this.pixelX = this.tileX
        this.pixelY = this.tileY
        this.movementState = 'idle'
        this.walkDirection = null
        this.pauseTimer = this.randomPause()
        this.moveProgress = 0
      }
    }
  }

  private tryMove(): void {
    const candidates = DIRECTIONS.filter(({ dx, dy }) => {
      const nx = this.tileX + dx
      const ny = this.tileY + dy
      return this.isWalkable(nx, ny) && !this.occupancy.isOccupied(nx, ny)
    })

    if (candidates.length === 0) {
      this.pauseTimer = this.randomPause()
      return
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)]
    this.targetTileX = this.tileX + chosen.dx
    this.targetTileY = this.tileY + chosen.dy
    this.walkDirection = chosen.name
    this.occupancy.claim(this.targetTileX, this.targetTileY, this.config.id)
    this.movementState = 'walking'
    this.moveProgress = 0

    // Switch to walk sprite if available
    const walkSprite = this.config.sprites[chosen.name]
    if (walkSprite) {
      this.animator = new SpriteAnimator(walkSprite, this.movement.frameRate)
    }
  }

  private randomPause(): number {
    return this.movement.pauseMin + Math.random() * (this.movement.pauseMax - this.movement.pauseMin)
  }

  getTilePosition(): { x: number; y: number } {
    return { x: this.tileX, y: this.tileY }
  }

  getPixelPosition(): { x: number; y: number } {
    return { x: this.pixelX, y: this.pixelY }
  }

  getMovementState(): MovementState {
    return this.movementState
  }

  getVisualState(): string {
    if (this.movementState === 'walking' && this.walkDirection) {
      return this.config.sprites[this.walkDirection] ? this.walkDirection : this.externalState
    }
    return this.externalState
  }

  setExternalState(state: string): void {
    this.externalState = state
    if (this.movementState === 'idle') {
      const sprite = this.config.sprites[state]
      if (sprite) {
        this.animator = new SpriteAnimator(sprite, this.movement.frameRate)
      }
    }
  }

  setSpeechBubble(bubble: CharacterConfig['speechBubble']): void {
    this.config = { ...this.config, speechBubble: bubble }
  }

  getSpeechBubble(): CharacterConfig['speechBubble'] {
    return this.config.speechBubble
  }

  getAnimator(): SpriteAnimator {
    return this.animator
  }

  getCurrentSprite(): SpriteConfig | undefined {
    const state = this.getVisualState()
    return this.config.sprites[state]
  }

  getId(): string {
    return this.config.id
  }

  destroy(): void {
    this.occupancy.release(this.tileX, this.tileY)
    if (this.movementState === 'walking') {
      this.occupancy.release(this.targetTileX, this.targetTileY)
    }
  }
}
