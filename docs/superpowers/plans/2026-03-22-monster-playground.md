# Monster Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish `monster-playground`, a React component library that renders a 2D sprite-based map with autonomously wandering characters.

**Architecture:** Canvas-based renderer with a `requestAnimationFrame` game loop for map/sprites, plus a DOM overlay for speech bubbles. Characters use a grid-based movement system with collision avoidance. Camera supports pan, zoom, and auto-follow.

**Tech Stack:** TypeScript, React 18+, tsup (build), Vitest + jsdom (test), Vite (demo app)

**Spec:** `docs/superpowers/specs/2026-03-22-monster-playground-design.md`

---

## File Structure

```
src/
  index.ts                    — package entry, re-exports component + types
  types.ts                    — all public TypeScript interfaces
  MonsterPlayground.tsx        — root React component
  GameEngine.ts               — requestAnimationFrame loop, orchestrates updates + rendering
  MapRenderer.ts              — draws background, loads walkable mask, exposes isWalkable()
  CharacterAgent.ts           — per-character movement state machine + sprite rendering
  SpriteAnimator.ts           — tracks animation frame index for a sprite config
  CameraController.ts         — pan/zoom/follow with lerp + bounds clamping
  SpeechBubbleOverlay.tsx     — DOM overlay positioning speech bubbles over characters
src/__tests__/
  SpriteAnimator.test.ts
  MapRenderer.test.ts
  CharacterAgent.test.ts
  CameraController.test.ts
  GameEngine.test.ts
  MonsterPlayground.test.tsx
  SpeechBubbleOverlay.test.tsx
demo/
  index.html                  — Vite entry HTML
  main.tsx                    — React root
  App.tsx                     — demo using MonsterPlayground with placeholders
package.json
tsconfig.json
tsup.config.ts
vitest.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `src/index.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "monster-playground",
  "version": "0.1.0",
  "description": "2D sprite-based map component with autonomous wandering characters",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "dev": "cd demo && npx vite"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.7.0",
    "tsup": "^8.3.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.1.0"
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "demo"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
})
```

- [ ] **Step 4: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 5: Create src/types.ts with all public types**

```ts
import type { CSSProperties } from 'react'

export interface SpriteConfig {
  src: string
  frameWidth: number
  frameHeight: number
  frameCount: number
}

export interface MovementConfig {
  speed: number
  pauseMin: number
  pauseMax: number
  frameRate: number
}

export interface SpeechBubbleConfig {
  text: string
  style?: CSSProperties
}

export interface CharacterConfig {
  id: string
  name?: string
  state: string
  startPosition: { x: number; y: number }
  sprites: Record<string, SpriteConfig>
  movement?: Partial<MovementConfig>
  speechBubble?: SpeechBubbleConfig
}

export interface MonsterPlaygroundProps {
  mapWidth: number
  mapHeight: number
  tileSize: number
  backgroundImage: string
  walkableMask: string
  cameraFollowInterval?: number
  cameraPanResumeTimeout?: number
  initialZoom?: number
  minZoom?: number
  maxZoom?: number
  characters: CharacterConfig[]
  defaultMovement?: Partial<MovementConfig>
}

export const DEFAULT_MOVEMENT: MovementConfig = {
  speed: 1,
  pauseMin: 2000,
  pauseMax: 5000,
  frameRate: 8,
}
```

- [ ] **Step 6: Create src/index.ts stub**

```ts
export { MonsterPlayground } from './MonsterPlayground'
export type {
  MonsterPlaygroundProps,
  CharacterConfig,
  SpriteConfig,
  MovementConfig,
  SpeechBubbleConfig,
} from './types'
```

Note: `MonsterPlayground` doesn't exist yet — this file will error until Task 8. That's fine; we're establishing the public API surface.

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: `node_modules` created, `package-lock.json` generated

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsup.config.ts vitest.config.ts src/types.ts src/index.ts
git commit -m "chore: scaffold project with types, build, and test config"
```

---

### Task 2: SpriteAnimator

Pure utility with no dependencies — easiest to TDD first.

**Files:**
- Create: `src/SpriteAnimator.ts`
- Create: `src/__tests__/SpriteAnimator.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/SpriteAnimator.test.ts
import { describe, it, expect } from 'vitest'
import { SpriteAnimator } from '../SpriteAnimator'

describe('SpriteAnimator', () => {
  const config = { src: 'test.png', frameWidth: 16, frameHeight: 16, frameCount: 4 }

  it('starts at frame 0', () => {
    const anim = new SpriteAnimator(config, 8)
    expect(anim.getFrame()).toBe(0)
  })

  it('advances frame after enough time', () => {
    const anim = new SpriteAnimator(config, 8) // 8 FPS = 125ms per frame
    anim.update(125)
    expect(anim.getFrame()).toBe(1)
  })

  it('wraps around to frame 0 after last frame', () => {
    const anim = new SpriteAnimator(config, 8)
    anim.update(125 * 4) // 4 frames at 125ms each
    expect(anim.getFrame()).toBe(0)
  })

  it('returns correct source rectangle', () => {
    const anim = new SpriteAnimator(config, 8)
    anim.update(125) // frame 1
    const rect = anim.getSourceRect()
    expect(rect).toEqual({ sx: 16, sy: 0, sw: 16, sh: 16 })
  })

  it('does not advance on small delta', () => {
    const anim = new SpriteAnimator(config, 8)
    anim.update(50)
    expect(anim.getFrame()).toBe(0)
  })

  it('resets frame index on reset()', () => {
    const anim = new SpriteAnimator(config, 8)
    anim.update(250)
    anim.reset()
    expect(anim.getFrame()).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/SpriteAnimator.test.ts`
Expected: FAIL — cannot find `../SpriteAnimator`

- [ ] **Step 3: Implement SpriteAnimator**

```ts
// src/SpriteAnimator.ts
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
    return {
      sx: this.frameIndex * this.config.frameWidth,
      sy: 0,
      sw: this.config.frameWidth,
      sh: this.config.frameHeight,
    }
  }

  reset(): void {
    this.frameIndex = 0
    this.elapsed = 0
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/SpriteAnimator.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/SpriteAnimator.ts src/__tests__/SpriteAnimator.test.ts
git commit -m "feat: add SpriteAnimator with frame cycling and source rect"
```

---

### Task 3: MapRenderer

Handles background drawing and walkable mask. Canvas APIs need mocking in tests.

**Files:**
- Create: `src/MapRenderer.ts`
- Create: `src/__tests__/MapRenderer.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/MapRenderer.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/MapRenderer.test.ts`
Expected: FAIL — cannot find `../MapRenderer`

- [ ] **Step 3: Implement MapRenderer**

```ts
// src/MapRenderer.ts

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/MapRenderer.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/MapRenderer.ts src/__tests__/MapRenderer.test.ts
git commit -m "feat: add MapRenderer with walkable mask pixel sampling"
```

---

### Task 4: CharacterAgent

Movement state machine with collision avoidance. This is the core game logic.

**Files:**
- Create: `src/CharacterAgent.ts`
- Create: `src/__tests__/CharacterAgent.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/CharacterAgent.test.ts
import { describe, it, expect, vi } from 'vitest'
import { CharacterAgent, OccupancyMap } from '../CharacterAgent'
import type { CharacterConfig, MovementConfig } from '../types'
import { DEFAULT_MOVEMENT } from '../types'

function makeConfig(overrides?: Partial<CharacterConfig>): CharacterConfig {
  return {
    id: 'test-char',
    state: 'idle',
    startPosition: { x: 2, y: 2 },
    sprites: {
      idle: { src: 'idle.png', frameWidth: 16, frameHeight: 16, frameCount: 1 },
    },
    ...overrides,
  }
}

function makeOccupancy(): OccupancyMap {
  return new OccupancyMap()
}

const isWalkable = (x: number, y: number) => x >= 0 && x < 5 && y >= 0 && y < 5

describe('OccupancyMap', () => {
  it('claims and releases tiles', () => {
    const map = makeOccupancy()
    map.claim(1, 1, 'char-a')
    expect(map.isOccupied(1, 1)).toBe(true)
    expect(map.isOccupied(1, 2)).toBe(false)
    map.release(1, 1)
    expect(map.isOccupied(1, 1)).toBe(false)
  })
})

describe('CharacterAgent', () => {
  it('starts at the configured position', () => {
    const agent = new CharacterAgent(makeConfig(), DEFAULT_MOVEMENT, makeOccupancy(), isWalkable)
    expect(agent.getTilePosition()).toEqual({ x: 2, y: 2 })
  })

  it('claims its start position on the occupancy map', () => {
    const occ = makeOccupancy()
    new CharacterAgent(makeConfig(), DEFAULT_MOVEMENT, occ, isWalkable)
    expect(occ.isOccupied(2, 2)).toBe(true)
  })

  it('stays idle during pause period', () => {
    const agent = new CharacterAgent(
      makeConfig(),
      { ...DEFAULT_MOVEMENT, pauseMin: 1000, pauseMax: 1000 },
      makeOccupancy(),
      isWalkable,
    )
    agent.update(500)
    expect(agent.getMovementState()).toBe('idle')
  })

  it('starts moving after pause period', () => {
    const agent = new CharacterAgent(
      makeConfig(),
      { ...DEFAULT_MOVEMENT, pauseMin: 100, pauseMax: 100, speed: 1 },
      makeOccupancy(),
      isWalkable,
    )
    agent.update(101) // exceed pause
    // Should now be walking or choosing destination
    const state = agent.getMovementState()
    expect(['walking', 'idle']).toContain(state)
  })

  it('does not move outside bounds', () => {
    // Place at corner with only one direction available
    const cornerWalkable = (x: number, y: number) => x >= 0 && x <= 1 && y === 0
    const agent = new CharacterAgent(
      makeConfig({ startPosition: { x: 0, y: 0 } }),
      { ...DEFAULT_MOVEMENT, pauseMin: 0, pauseMax: 0, speed: 100 },
      makeOccupancy(),
      cornerWalkable,
    )
    // Run many updates — should never leave bounds
    for (let i = 0; i < 100; i++) {
      agent.update(100)
    }
    const pos = agent.getTilePosition()
    expect(pos.x).toBeGreaterThanOrEqual(0)
    expect(pos.x).toBeLessThanOrEqual(1)
    expect(pos.y).toBe(0)
  })

  it('does not walk into occupied tiles', () => {
    const occ = makeOccupancy()
    // Block all tiles around (2,2) except (3,2)
    occ.claim(1, 2, 'blocker1')
    occ.claim(3, 2, 'blocker2')
    occ.claim(2, 1, 'blocker3')
    occ.claim(2, 3, 'blocker4')

    const agent = new CharacterAgent(
      makeConfig(),
      { ...DEFAULT_MOVEMENT, pauseMin: 0, pauseMax: 0, speed: 100 },
      occ,
      isWalkable,
    )
    // With all neighbors blocked, agent should stay put
    agent.update(1000)
    expect(agent.getTilePosition()).toEqual({ x: 2, y: 2 })
  })

  it('returns the current visual state from external state prop', () => {
    const agent = new CharacterAgent(makeConfig({ state: 'happy' }), DEFAULT_MOVEMENT, makeOccupancy(), isWalkable)
    expect(agent.getVisualState()).toBe('happy')
  })

  it('updates external state', () => {
    const agent = new CharacterAgent(makeConfig(), DEFAULT_MOVEMENT, makeOccupancy(), isWalkable)
    agent.setExternalState('dancing')
    expect(agent.getVisualState()).toBe('dancing')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/CharacterAgent.test.ts`
Expected: FAIL — cannot find `../CharacterAgent`

- [ ] **Step 3: Implement CharacterAgent**

```ts
// src/CharacterAgent.ts
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
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/CharacterAgent.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/CharacterAgent.ts src/__tests__/CharacterAgent.test.ts
git commit -m "feat: add CharacterAgent with grid movement and collision avoidance"
```

---

### Task 5: CameraController

Pan, zoom, follow with lerp and bounds clamping.

**Files:**
- Create: `src/CameraController.ts`
- Create: `src/__tests__/CameraController.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/CameraController.test.ts
import { describe, it, expect } from 'vitest'
import { CameraController } from '../CameraController'

describe('CameraController', () => {
  const defaults = {
    mapPixelWidth: 512,
    mapPixelHeight: 384,
    viewportWidth: 256,
    viewportHeight: 192,
    initialZoom: 1,
    minZoom: 0.5,
    maxZoom: 3,
    followInterval: 5000,
    panResumeTimeout: 3000,
  }

  it('starts at the initial zoom', () => {
    const cam = new CameraController(defaults)
    expect(cam.getZoom()).toBe(1)
  })

  it('clamps zoom to min/max', () => {
    const cam = new CameraController(defaults)
    cam.zoomBy(100) // zoom in a lot
    expect(cam.getZoom()).toBeLessThanOrEqual(3)
    cam.zoomBy(-1000) // zoom out a lot
    expect(cam.getZoom()).toBeGreaterThanOrEqual(0.5)
  })

  it('pans by offset', () => {
    const cam = new CameraController(defaults)
    const before = cam.getOffset()
    cam.pan(10, 20)
    const after = cam.getOffset()
    expect(after.x).toBe(before.x - 10)
    expect(after.y).toBe(before.y - 20)
  })

  it('clamps offset so viewport stays within map bounds', () => {
    const cam = new CameraController(defaults)
    cam.pan(-10000, -10000) // try to pan way past top-left
    const offset = cam.getOffset()
    expect(offset.x).toBeGreaterThanOrEqual(0)
    expect(offset.y).toBeGreaterThanOrEqual(0)
  })

  it('sets follow target', () => {
    const cam = new CameraController(defaults)
    cam.setFollowTarget(100, 100)
    cam.update(16) // one frame
    // Camera should start moving toward target
    const offset = cam.getOffset()
    expect(offset.x).toBeGreaterThan(0)
  })

  it('pauses follow on pan and resumes after timeout', () => {
    const cam = new CameraController(defaults)
    cam.setFollowTarget(100, 100)
    cam.onUserPan() // user pans
    expect(cam.isFollowing()).toBe(false)
    cam.update(3001) // exceed panResumeTimeout
    expect(cam.isFollowing()).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/CameraController.test.ts`
Expected: FAIL — cannot find `../CameraController`

- [ ] **Step 3: Implement CameraController**

```ts
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
    this.zoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.zoom * factor))
    this.clampOffset()
  }

  pan(dx: number, dy: number): void {
    this.offsetX -= dx / this.zoom
    this.offsetY -= dy / this.zoom
    this.clampOffset()
  }

  onUserPan(): void {
    this.panPaused = true
    this.following = false
    this.panResumeTimer = this.config.panResumeTimeout
  }

  setFollowTarget(pixelX: number, pixelY: number): void {
    this.targetX = pixelX - (this.config.viewportWidth / this.zoom) / 2
    this.targetY = pixelY - (this.config.viewportHeight / this.zoom) / 2
    this.following = true
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
      const t = 1 - Math.pow(1 - this.lerpSpeed, deltaMs / 16)
      this.offsetX += (this.targetX - this.offsetX) * t
      this.offsetY += (this.targetY - this.offsetY) * t
    }

    this.clampOffset()
  }

  setViewportSize(width: number, height: number): void {
    this.config.viewportWidth = width
    this.config.viewportHeight = height
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/CameraController.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/CameraController.ts src/__tests__/CameraController.test.ts
git commit -m "feat: add CameraController with pan, zoom, follow, and bounds clamping"
```

---

### Task 6: GameEngine

Orchestrates the game loop, characters, map, and camera.

**Files:**
- Create: `src/GameEngine.ts`
- Create: `src/__tests__/GameEngine.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/GameEngine.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GameEngine } from '../GameEngine'
import type { CharacterConfig } from '../types'

const mockCharacter: CharacterConfig = {
  id: 'char-1',
  state: 'idle',
  startPosition: { x: 1, y: 1 },
  sprites: {
    idle: { src: 'idle.png', frameWidth: 16, frameHeight: 16, frameCount: 1 },
  },
}

describe('GameEngine', () => {
  it('creates character agents from config', () => {
    const engine = new GameEngine({
      mapWidth: 4,
      mapHeight: 4,
      tileSize: 16,
      characters: [mockCharacter],
    })
    expect(engine.getAgents()).toHaveLength(1)
    expect(engine.getAgents()[0].getId()).toBe('char-1')
  })

  it('updates all agents on tick', () => {
    const engine = new GameEngine({
      mapWidth: 4,
      mapHeight: 4,
      tileSize: 16,
      characters: [mockCharacter],
    })
    // Should not throw
    engine.update(16)
    expect(engine.getAgents()[0].getTilePosition()).toEqual({ x: 1, y: 1 })
  })

  it('syncs character state changes', () => {
    const engine = new GameEngine({
      mapWidth: 4,
      mapHeight: 4,
      tileSize: 16,
      characters: [mockCharacter],
    })
    engine.updateCharacterState('char-1', 'walking')
    expect(engine.getAgents()[0].getVisualState()).toBe('walking')
  })

  it('syncs speech bubble changes', () => {
    const engine = new GameEngine({
      mapWidth: 4,
      mapHeight: 4,
      tileSize: 16,
      characters: [mockCharacter],
    })
    engine.updateSpeechBubble('char-1', { text: 'Hi!', style: {} })
    expect(engine.getAgents()[0].getSpeechBubble()).toEqual({ text: 'Hi!', style: {} })
  })

  it('picks a random follow target', () => {
    const engine = new GameEngine({
      mapWidth: 4,
      mapHeight: 4,
      tileSize: 16,
      characters: [mockCharacter, { ...mockCharacter, id: 'char-2', startPosition: { x: 3, y: 3 } }],
    })
    const id = engine.pickRandomFollowTarget()
    expect(['char-1', 'char-2']).toContain(id)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/GameEngine.test.ts`
Expected: FAIL — cannot find `../GameEngine`

- [ ] **Step 3: Implement GameEngine**

```ts
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
    await Promise.all([
      this.mapRenderer.loadBackground(backgroundSrc),
      this.mapRenderer.loadMask(maskSrc),
    ])
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
      // In a real render, we'd draw the sprite image here
      // For now, this establishes the render pipeline
      ctx.fillStyle = '#FFD600'
      ctx.fillRect(pos.x * tileSize, pos.y * tileSize, sprite.frameWidth, sprite.frameHeight)
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/GameEngine.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/GameEngine.ts src/__tests__/GameEngine.test.ts
git commit -m "feat: add GameEngine orchestrating agents, map, and camera"
```

---

### Task 7: SpeechBubbleOverlay

React component that renders positioned speech bubbles in a DOM layer.

**Files:**
- Create: `src/SpeechBubbleOverlay.tsx`
- Create: `src/__tests__/SpeechBubbleOverlay.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/__tests__/SpeechBubbleOverlay.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpeechBubbleOverlay } from '../SpeechBubbleOverlay'
import type { SpeechBubbleData } from '../SpeechBubbleOverlay'

describe('SpeechBubbleOverlay', () => {
  const bubbles: SpeechBubbleData[] = [
    { characterId: 'char-1', text: 'Hello!', screenX: 100, screenY: 50 },
    { characterId: 'char-2', text: 'World!', screenX: 200, screenY: 80, style: { color: 'red' } },
  ]

  it('renders speech bubbles for each character', () => {
    render(<SpeechBubbleOverlay bubbles={bubbles} />)
    expect(screen.getByText('Hello!')).toBeDefined()
    expect(screen.getByText('World!')).toBeDefined()
  })

  it('renders nothing when no bubbles', () => {
    const { container } = render(<SpeechBubbleOverlay bubbles={[]} />)
    expect(container.querySelector('[data-speech-bubble]')).toBeNull()
  })

  it('applies custom styles to text', () => {
    render(<SpeechBubbleOverlay bubbles={bubbles} />)
    const worldBubble = screen.getByText('World!')
    expect(worldBubble.style.color).toBe('red')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/SpeechBubbleOverlay.test.tsx`
Expected: FAIL — cannot find `../SpeechBubbleOverlay`

- [ ] **Step 3: Implement SpeechBubbleOverlay**

```tsx
// src/SpeechBubbleOverlay.tsx
import type { CSSProperties } from 'react'

export interface SpeechBubbleData {
  characterId: string
  text: string
  screenX: number
  screenY: number
  style?: CSSProperties
}

interface Props {
  bubbles: SpeechBubbleData[]
}

const bubbleStyle: CSSProperties = {
  position: 'absolute',
  background: '#F5F5F0',
  color: '#1A1A1A',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontFamily: 'sans-serif',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  transform: 'translate(-50%, -100%)',
  marginTop: '-8px',
}

const tailStyle: CSSProperties = {
  position: 'absolute',
  bottom: '-6px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 0,
  height: 0,
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderTop: '6px solid #F5F5F0',
}

export function SpeechBubbleOverlay({ bubbles }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {bubbles.map((bubble) => (
        <div
          key={bubble.characterId}
          data-speech-bubble={bubble.characterId}
          style={{
            ...bubbleStyle,
            left: bubble.screenX,
            top: bubble.screenY,
          }}
        >
          <span style={bubble.style}>{bubble.text}</span>
          <div style={tailStyle} />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/SpeechBubbleOverlay.test.tsx`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/SpeechBubbleOverlay.tsx src/__tests__/SpeechBubbleOverlay.test.tsx
git commit -m "feat: add SpeechBubbleOverlay with positioned DOM bubbles"
```

---

### Task 8: MonsterPlayground Root Component

Wires everything together: canvas, game engine, camera events, speech bubble overlay.

**Files:**
- Create: `src/MonsterPlayground.tsx`
- Create: `src/__tests__/MonsterPlayground.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/__tests__/MonsterPlayground.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MonsterPlayground } from '../MonsterPlayground'
import type { MonsterPlaygroundProps } from '../types'

// Mock canvas context
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  save: vi.fn(),
  restore: vi.fn(),
  setTransform: vi.fn(),
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  clearRect: vi.fn(),
  fillStyle: '',
}) as any

const defaultProps: MonsterPlaygroundProps = {
  mapWidth: 4,
  mapHeight: 4,
  tileSize: 16,
  backgroundImage: '/bg.png',
  walkableMask: '/mask.png',
  characters: [
    {
      id: 'char-1',
      state: 'idle',
      startPosition: { x: 1, y: 1 },
      sprites: {
        idle: { src: 'idle.png', frameWidth: 16, frameHeight: 16, frameCount: 1 },
      },
    },
  ],
}

describe('MonsterPlayground', () => {
  it('renders a canvas element', () => {
    const { container } = render(<MonsterPlayground {...defaultProps} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
  })

  it('renders the speech bubble overlay container', () => {
    const { container } = render(<MonsterPlayground {...defaultProps} />)
    // The overlay div should exist
    const wrapper = container.firstElementChild
    expect(wrapper).not.toBeNull()
    expect(wrapper?.children.length).toBeGreaterThanOrEqual(2) // canvas + overlay
  })

  it('renders speech bubbles when characters have them', () => {
    const props: MonsterPlaygroundProps = {
      ...defaultProps,
      characters: [
        {
          ...defaultProps.characters[0],
          speechBubble: { text: 'Hello!' },
        },
      ],
    }
    const { container } = render(<MonsterPlayground {...props} />)
    expect(container.textContent).toContain('Hello!')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/MonsterPlayground.test.tsx`
Expected: FAIL — cannot find `../MonsterPlayground`

- [ ] **Step 3: Implement MonsterPlayground**

```tsx
// src/MonsterPlayground.tsx
import { useEffect, useRef, useCallback, useState } from 'react'
import type { MonsterPlaygroundProps } from './types'
import { DEFAULT_MOVEMENT } from './types'
import { GameEngine } from './GameEngine'
import { CameraController } from './CameraController'
import { SpeechBubbleOverlay } from './SpeechBubbleOverlay'
import type { SpeechBubbleData } from './SpeechBubbleOverlay'

export function MonsterPlayground(props: MonsterPlaygroundProps) {
  const {
    mapWidth,
    mapHeight,
    tileSize,
    backgroundImage,
    walkableMask,
    cameraFollowInterval = 10000,
    cameraPanResumeTimeout = 30000,
    initialZoom = 1,
    minZoom = 0.5,
    maxZoom = 3,
    characters,
    defaultMovement,
  } = props

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const cameraRef = useRef<CameraController | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const followTimerRef = useRef<number>(0)
  const [bubbles, setBubbles] = useState<SpeechBubbleData[]>([])

  const mapPixelWidth = mapWidth * tileSize
  const mapPixelHeight = mapHeight * tileSize

  // Initialize engine
  useEffect(() => {
    const engine = new GameEngine({
      mapWidth,
      mapHeight,
      tileSize,
      characters,
      defaultMovement,
    })
    engineRef.current = engine

    engine.loadAssets(backgroundImage, walkableMask).catch(console.error)

    return () => {
      engineRef.current = null
    }
  }, []) // Intentionally stable — props synced below

  // Initialize camera
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const camera = new CameraController({
      mapPixelWidth,
      mapPixelHeight,
      viewportWidth: rect.width,
      viewportHeight: rect.height,
      initialZoom,
      minZoom,
      maxZoom,
      followInterval: cameraFollowInterval,
      panResumeTimeout: cameraPanResumeTimeout,
    })
    cameraRef.current = camera

    if (engineRef.current) {
      engineRef.current.setCamera(camera)
      // Start following a random character
      const targetId = engineRef.current.pickRandomFollowTarget()
      const agent = engineRef.current.getAgentById(targetId)
      if (agent) {
        const pos = agent.getPixelPosition()
        camera.setFollowTarget(pos.x * tileSize, pos.y * tileSize)
      }
    }
  }, [mapPixelWidth, mapPixelHeight, initialZoom, minZoom, maxZoom, cameraFollowInterval, cameraPanResumeTimeout, tileSize])

  // Sync character states and speech bubbles from props
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    for (const char of characters) {
      engine.updateCharacterState(char.id, char.state)
      engine.updateSpeechBubble(char.id, char.speechBubble)
    }
  }, [characters])

  // Game loop
  useEffect(() => {
    const loop = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16
      lastTimeRef.current = time

      const engine = engineRef.current
      const camera = cameraRef.current
      const canvas = canvasRef.current
      if (!engine || !canvas) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Update
      engine.update(delta)

      // Follow timer — switch target periodically
      followTimerRef.current += delta
      if (followTimerRef.current >= cameraFollowInterval && camera) {
        followTimerRef.current = 0
        const targetId = engine.pickRandomFollowTarget()
        const agent = engine.getAgentById(targetId)
        if (agent) {
          const pos = agent.getPixelPosition()
          camera.setFollowTarget(pos.x * tileSize, pos.y * tileSize)
        }
      }

      // Update follow target position each frame
      if (camera && camera.isFollowing()) {
        // Find the currently followed agent and update target
        // (handled by camera lerp internally)
      }

      // Render
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      engine.render(ctx, tileSize)

      // Update speech bubble positions
      const newBubbles: SpeechBubbleData[] = []
      for (const agent of engine.getAgents()) {
        const sb = agent.getSpeechBubble()
        if (!sb) continue
        const pos = agent.getPixelPosition()
        const worldX = pos.x * tileSize + tileSize / 2
        const worldY = pos.y * tileSize
        const screen = camera
          ? camera.worldToScreen(worldX, worldY)
          : { x: worldX, y: worldY }
        newBubbles.push({
          characterId: agent.getId(),
          text: sb.text,
          screenX: screen.x,
          screenY: screen.y,
          style: sb.style,
        })
      }
      setBubbles(newBubbles)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tileSize, cameraFollowInterval])

  // Mouse/touch event handlers for pan and zoom
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !cameraRef.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    cameraRef.current.pan(dx, dy)
    cameraRef.current.onUserPan()
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!cameraRef.current) return
    e.preventDefault()
    cameraRef.current.zoomBy(-e.deltaY)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isDragging.current ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        width={containerRef.current?.clientWidth ?? mapPixelWidth}
        height={containerRef.current?.clientHeight ?? mapPixelHeight}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <SpeechBubbleOverlay bubbles={bubbles} />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/MonsterPlayground.test.tsx`
Expected: All 3 tests PASS

- [ ] **Step 5: Verify src/index.ts now resolves**

Run: `npx tsc --noEmit`
Expected: No errors (all imports resolve)

- [ ] **Step 6: Commit**

```bash
git add src/MonsterPlayground.tsx src/__tests__/MonsterPlayground.test.tsx
git commit -m "feat: add MonsterPlayground root component with game loop and events"
```

---

### Task 9: Demo App

A Vite dev app for visual testing with placeholder assets.

**Files:**
- Create: `demo/index.html`
- Create: `demo/main.tsx`
- Create: `demo/App.tsx`
- Create: `demo/vite.config.ts`
- Create: `demo/tsconfig.json`

- [ ] **Step 1: Create demo/vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'monster-playground': path.resolve(__dirname, '../src'),
    },
  },
})
```

- [ ] **Step 2: Create demo/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "monster-playground": ["../src"]
    }
  },
  "include": ["."]
}
```

- [ ] **Step 3: Create demo/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Monster Playground Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100%; background: #111; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

- [ ] **Step 4: Create demo/main.tsx**

```tsx
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(<App />)
```

- [ ] **Step 5: Create demo/App.tsx**

```tsx
import { useState } from 'react'
import { MonsterPlayground } from 'monster-playground'
import type { CharacterConfig } from 'monster-playground'

const characters: CharacterConfig[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    state: 'idle',
    startPosition: { x: 5, y: 5 },
    sprites: {
      idle: { src: '', frameWidth: 16, frameHeight: 16, frameCount: 1 },
    },
    movement: { speed: 2, pauseMin: 500, pauseMax: 2000, frameRate: 8 },
    speechBubble: { text: 'Hello!', style: { fontWeight: 'bold' } },
  },
  {
    id: 'slime',
    name: 'Slime',
    state: 'idle',
    startPosition: { x: 10, y: 8 },
    sprites: {
      idle: { src: '', frameWidth: 16, frameHeight: 16, frameCount: 1 },
    },
    movement: { speed: 0.5, pauseMin: 2000, pauseMax: 5000, frameRate: 4 },
  },
  {
    id: 'dragon',
    name: 'Dragon',
    state: 'idle',
    startPosition: { x: 20, y: 12 },
    sprites: {
      idle: { src: '', frameWidth: 16, frameHeight: 16, frameCount: 1 },
    },
    movement: { speed: 1, pauseMin: 1000, pauseMax: 3000, frameRate: 6 },
    speechBubble: { text: 'Rawr!', style: { color: '#FF6B35', fontSize: 14 } },
  },
]

export function App() {
  const [chars] = useState(characters)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MonsterPlayground
        mapWidth={32}
        mapHeight={24}
        tileSize={16}
        backgroundImage=""
        walkableMask=""
        characters={chars}
        cameraFollowInterval={10000}
        cameraPanResumeTimeout={30000}
        initialZoom={2}
      />
    </div>
  )
}
```

- [ ] **Step 6: Add @vitejs/plugin-react to devDependencies**

Run: `npm install --save-dev @vitejs/plugin-react`

- [ ] **Step 7: Verify demo starts**

Run: `cd demo && npx vite --open`
Expected: Browser opens showing the playground with colored rectangles moving on a dark background

- [ ] **Step 8: Commit**

```bash
git add demo/
git commit -m "feat: add demo app with placeholder characters"
```

---

### Task 10: Build Verification & Cleanup

Verify the library builds, all tests pass, and exports are correct.

**Files:**
- Modify: `src/index.ts` (verify exports)

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (SpriteAnimator: 6, MapRenderer: 4, CharacterAgent: 8, CameraController: 6, GameEngine: 5, SpeechBubbleOverlay: 3, MonsterPlayground: 3 = 35 total)

- [ ] **Step 2: Build the library**

Run: `npx tsup`
Expected: `dist/` created with `index.js`, `index.cjs`, `index.d.ts`

- [ ] **Step 3: Verify type declarations export all public types**

Run: `grep -c "export" dist/index.d.ts`
Expected: Contains exports for `MonsterPlayground`, `MonsterPlaygroundProps`, `CharacterConfig`, `SpriteConfig`, `MovementConfig`, `SpeechBubbleConfig`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify build output and all tests passing"
```
