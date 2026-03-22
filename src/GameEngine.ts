// src/GameEngine.ts
import type { CharacterConfig, MovementConfig, SpeechBubbleConfig } from './types'
import { DEFAULT_MOVEMENT } from './types'
import { CharacterAgent, OccupancyMap } from './CharacterAgent'
import { MapRenderer } from './MapRenderer'
import { CameraController } from './CameraController'

export interface GameEngineConfig {
  mapWidth: number
  mapHeight: number
  tileSize: number
  characters: CharacterConfig[]
  defaultMovement?: Partial<MovementConfig>
}

export class GameEngine {
  private agents: CharacterAgent[] = []
  private occupancy = new OccupancyMap()
  private mapRenderer: MapRenderer
  private camera: CameraController | null = null
  private movement: MovementConfig
  private spriteImages = new Map<string, HTMLImageElement>()

  constructor(config: GameEngineConfig) {
    this.movement = { ...DEFAULT_MOVEMENT, ...config.defaultMovement }
    this.mapRenderer = new MapRenderer(config.mapWidth, config.mapHeight, config.tileSize)

    const isWalkable = (x: number, y: number) => {
      if (x < 0 || x >= config.mapWidth || y < 0 || y >= config.mapHeight) return false
      return this.mapRenderer.isWalkable(x, y)
    }

    for (const charConfig of config.characters) {
      const agentMovement = { ...this.movement, ...charConfig.movement }
      const agent = new CharacterAgent(charConfig, agentMovement, this.occupancy, isWalkable)
      this.agents.push(agent)
    }
  }

  async loadAssets(backgroundSrc: string, maskSrc: string): Promise<void> {
    const spriteLoads = this.loadSpriteImages()
    await Promise.all([
      this.mapRenderer.loadBackground(backgroundSrc),
      this.mapRenderer.loadMask(maskSrc),
      spriteLoads,
    ])
    this.relocateAgentsToWalkable()
  }

  private async loadSpriteImages(): Promise<void> {
    const srcSet = new Set<string>()
    for (const agent of this.agents) {
      const sprite = agent.getCurrentSprite()
      if (sprite?.src) srcSet.add(sprite.src)
      // Also collect all sprite sources from config
      for (const s of Object.values(agent.getConfig().sprites)) {
        if (s.src) srcSet.add(s.src)
      }
    }
    const loads = Array.from(srcSet).map(async (src) => {
      const img = await this.loadImage(src)
      this.spriteImages.set(src, img)
    })
    await Promise.all(loads)
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  private relocateAgentsToWalkable(): void {
    const taken = new Set<string>()
    for (const agent of this.agents) {
      const pos = this.mapRenderer.findRandomWalkablePosition(taken)
      if (pos) {
        agent.relocate(pos.x, pos.y)
        taken.add(`${pos.x},${pos.y}`)
      }
    }
  }

  setCamera(camera: CameraController): void {
    this.camera = camera
  }

  update(deltaMs: number): void {
    for (const agent of this.agents) {
      agent.update(deltaMs)
    }
    if (this.camera) {
      this.camera.update(deltaMs)
    }
  }

  render(ctx: CanvasRenderingContext2D, tileSize: number): void {
    ctx.save()
    if (this.camera) {
      this.camera.applyTransform(ctx)
    }

    this.mapRenderer.draw(ctx)

    for (const agent of this.agents) {
      const sprite = agent.getCurrentSprite()
      if (!sprite) continue
      const pos = agent.getPixelPosition()
      const anim = agent.getAnimator()
      const rect = anim.getSourceRect()
      const img = sprite.src ? this.spriteImages.get(sprite.src) : undefined
      if (img) {
        ctx.drawImage(
          img,
          rect.sx,
          rect.sy,
          rect.sw,
          rect.sh,
          pos.x * tileSize,
          pos.y * tileSize,
          sprite.frameWidth,
          sprite.frameHeight,
        )
      } else {
        ctx.fillStyle = '#FFD600'
        ctx.fillRect(pos.x * tileSize, pos.y * tileSize, sprite.frameWidth, sprite.frameHeight)
      }
    }

    ctx.restore()
  }

  getAgents(): CharacterAgent[] {
    return this.agents
  }

  getMapRenderer(): MapRenderer {
    return this.mapRenderer
  }

  updateCharacterState(characterId: string, state: string): void {
    const agent = this.agents.find((a) => a.getId() === characterId)
    if (agent) agent.setExternalState(state)
  }

  updateSpeechBubble(characterId: string, bubble: SpeechBubbleConfig | undefined): void {
    const agent = this.agents.find((a) => a.getId() === characterId)
    if (agent) agent.setSpeechBubble(bubble)
  }

  pickRandomFollowTarget(): string {
    const idx = Math.floor(Math.random() * this.agents.length)
    return this.agents[idx].getId()
  }

  getAgentById(id: string): CharacterAgent | undefined {
    return this.agents.find((a) => a.getId() === id)
  }
}
