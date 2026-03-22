export class WalkableMask {
  private walkable: boolean[][]

  private constructor(walkable: boolean[][]) {
    this.walkable = walkable
  }

  static fromImageData(
    data: Uint8ClampedArray,
    pixelWidth: number,
    pixelHeight: number,
    tileSize: number,
    mapWidth: number,
    mapHeight: number,
  ): WalkableMask {
    const walkable: boolean[][] = []
    for (let ty = 0; ty < mapHeight; ty++) {
      walkable[ty] = []
      for (let tx = 0; tx < mapWidth; tx++) {
        walkable[ty][tx] = WalkableMask.checkTile(data, pixelWidth, tx, ty, tileSize)
      }
    }
    return new WalkableMask(walkable)
  }

  private static checkTile(
    data: Uint8ClampedArray,
    pixelWidth: number,
    tileX: number,
    tileY: number,
    tileSize: number,
  ): boolean {
    const startX = tileX * tileSize
    const startY = tileY * tileSize
    for (let py = startY; py < startY + tileSize; py++) {
      for (let px = startX; px < startX + tileSize; px++) {
        const idx = (py * pixelWidth + px) * 4
        // If any pixel is dark (R < 128), tile is blocked
        if (data[idx] < 128) {
          return false
        }
      }
    }
    return true
  }

  isWalkable(tileX: number, tileY: number): boolean {
    if (tileY < 0 || tileY >= this.walkable.length) return false
    if (tileX < 0 || tileX >= this.walkable[0].length) return false
    return this.walkable[tileY][tileX]
  }
}

export class MapRenderer {
  private backgroundImage: HTMLImageElement | null = null
  private mask: WalkableMask | null = null

  constructor(
    private mapWidth: number,
    private mapHeight: number,
    private tileSize: number,
  ) {}

  async loadBackground(src: string): Promise<void> {
    this.backgroundImage = await this.loadImage(src)
  }

  async loadMask(src: string): Promise<void> {
    const img = await this.loadImage(src)
    const canvas = new OffscreenCanvas(img.width, img.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, img.width, img.height)
    this.mask = WalkableMask.fromImageData(
      imageData.data,
      img.width,
      img.height,
      this.tileSize,
      this.mapWidth,
      this.mapHeight,
    )
  }

  isWalkable(tileX: number, tileY: number): boolean {
    if (!this.mask) return true
    return this.mask.isWalkable(tileX, tileY)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.backgroundImage) {
      ctx.drawImage(this.backgroundImage, 0, 0)
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }
}
