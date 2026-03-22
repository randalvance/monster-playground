// src/CameraController.ts

export interface CameraConfig {
  mapPixelWidth: number
  mapPixelHeight: number
  viewportWidth: number
  viewportHeight: number
  initialZoom: number
  minZoom: number
  maxZoom: number
  followInterval: number
  panResumeTimeout: number
}

export class CameraController {
  private offsetX = 0
  private offsetY = 0
  private zoom: number
  private targetX = 0
  private targetY = 0
  private following = true
  private panPaused = false
  private panResumeTimer = 0
  private lerpSpeed = 0.05

  constructor(private config: CameraConfig) {
    this.zoom = config.initialZoom
    this.clampZoom()
    this.clampOffset()
  }

  private getEffectiveMinZoom(): number {
    const fitW = this.config.viewportWidth / this.config.mapPixelWidth
    const fitH = this.config.viewportHeight / this.config.mapPixelHeight
    return Math.max(this.config.minZoom, fitW, fitH)
  }

  private clampZoom(): void {
    const min = this.getEffectiveMinZoom()
    this.zoom = Math.max(min, Math.min(this.config.maxZoom, this.zoom))
  }

  getZoom(): number {
    return this.zoom
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY }
  }

  isFollowing(): boolean {
    return this.following && !this.panPaused
  }

  zoomBy(delta: number): void {
    const factor = 1 + delta * 0.001
    this.zoom = this.zoom * factor
    this.clampZoom()
    this.clampOffset()
  }

  pan(dx: number, dy: number): void {
    this.offsetX -= dx / this.zoom
    this.offsetY -= dy / this.zoom
  }

  onUserPan(): void {
    this.panPaused = true
    this.following = false
    this.panResumeTimer = this.config.panResumeTimeout
  }

  setFollowTarget(pixelX: number, pixelY: number): void {
    this.targetX = pixelX
    this.targetY = pixelY
    this.following = true
  }

  zoomStep(direction: 1 | -1): void {
    const factor = direction === 1 ? 1.25 : 0.8
    this.zoom = this.zoom * factor
    this.clampZoom()
    this.clampOffset()
  }

  update(deltaMs: number): void {
    if (this.panPaused) {
      this.panResumeTimer -= deltaMs
      if (this.panResumeTimer <= 0) {
        this.panPaused = false
        this.following = true
      }
    }

    if (this.following && !this.panPaused) {
      const desiredX = this.targetX - this.config.viewportWidth / (2 * this.zoom)
      const desiredY = this.targetY - this.config.viewportHeight / (2 * this.zoom)
      const t = 1 - Math.pow(1 - this.lerpSpeed, deltaMs / 16)
      this.offsetX += (desiredX - this.offsetX) * t
      this.offsetY += (desiredY - this.offsetY) * t
    }

    this.clampOffset()
  }

  setViewportSize(width: number, height: number): void {
    this.config.viewportWidth = width
    this.config.viewportHeight = height
    this.clampZoom()
    this.clampOffset()
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.offsetX * this.zoom, -this.offsetY * this.zoom)
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.offsetX) * this.zoom,
      y: (worldY - this.offsetY) * this.zoom,
    }
  }

  private clampOffset(): void {
    const viewW = this.config.viewportWidth / this.zoom
    const viewH = this.config.viewportHeight / this.zoom
    const maxX = Math.max(0, this.config.mapPixelWidth - viewW)
    const maxY = Math.max(0, this.config.mapPixelHeight - viewH)
    this.offsetX = Math.max(0, Math.min(maxX, this.offsetX))
    this.offsetY = Math.max(0, Math.min(maxY, this.offsetY))
  }
}
