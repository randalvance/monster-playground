import { describe, it, expect, vi } from 'vitest'
import { WalkableMask } from '../MapRenderer'

describe('WalkableMask', () => {
  function createMask(tileSize: number, mapWidth: number, mapHeight: number, blockedTiles: [number, number][]): WalkableMask {
    const pixelW = mapWidth * tileSize
    const pixelH = mapHeight * tileSize
    // Create all-white image data (all walkable)
    const data = new Uint8ClampedArray(pixelW * pixelH * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255     // R
      data[i + 1] = 255 // G
      data[i + 2] = 255 // B
      data[i + 3] = 255 // A
    }
    // Set blocked tiles: paint one pixel black in each blocked tile
    for (const [tx, ty] of blockedTiles) {
      const px = tx * tileSize
      const py = ty * tileSize
      const idx = (py * pixelW + px) * 4
      data[idx] = 0
      data[idx + 1] = 0
      data[idx + 2] = 0
    }
    return WalkableMask.fromImageData(data, pixelW, pixelH, tileSize, mapWidth, mapHeight)
  }

  it('returns true for a fully white tile', () => {
    const mask = createMask(4, 4, 4, [])
    expect(mask.isWalkable(0, 0)).toBe(true)
    expect(mask.isWalkable(3, 3)).toBe(true)
  })

  it('returns false if any pixel in the tile is black', () => {
    const mask = createMask(4, 4, 4, [[1, 1]])
    expect(mask.isWalkable(1, 1)).toBe(false)
  })

  it('does not affect adjacent tiles', () => {
    const mask = createMask(4, 4, 4, [[1, 1]])
    expect(mask.isWalkable(0, 0)).toBe(true)
    expect(mask.isWalkable(0, 1)).toBe(true)
    expect(mask.isWalkable(1, 0)).toBe(true)
    expect(mask.isWalkable(2, 2)).toBe(true)
  })

  it('returns false for out-of-bounds tiles', () => {
    const mask = createMask(4, 4, 4, [])
    expect(mask.isWalkable(-1, 0)).toBe(false)
    expect(mask.isWalkable(0, -1)).toBe(false)
    expect(mask.isWalkable(4, 0)).toBe(false)
    expect(mask.isWalkable(0, 4)).toBe(false)
  })
})
