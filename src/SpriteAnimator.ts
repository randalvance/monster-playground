import type { SpriteConfig } from './types'

export class SpriteAnimator {
  private frameIndex = 0
  private elapsed = 0
  private frameDuration: number

  constructor(
    private config: SpriteConfig,
    frameRate: number,
  ) {
    this.frameDuration = 1000 / frameRate
  }

  update(deltaMs: number): void {
    this.elapsed += deltaMs
    while (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration
      this.frameIndex = (this.frameIndex + 1) % this.config.frameCount
    }
  }

  getFrame(): number {
    return this.frameIndex
  }

  getSourceRect(): { sx: number; sy: number; sw: number; sh: number } {
    const row = this.config.row ?? 0
    return {
      sx: this.frameIndex * this.config.frameWidth,
      sy: row * this.config.frameHeight,
      sw: this.config.frameWidth,
      sh: this.config.frameHeight,
    }
  }

  reset(): void {
    this.frameIndex = 0
    this.elapsed = 0
  }
}
