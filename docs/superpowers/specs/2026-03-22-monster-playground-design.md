# Monster Playground — Design Spec

A React component library (`monster-playground`) that renders a 2D sprite-based map with autonomous characters, published to npm.

## Component API

```tsx
<MonsterPlayground
  // Map
  mapWidth={32}                    // tiles wide
  mapHeight={24}                   // tiles tall
  tileSize={16}                    // pixels per tile
  backgroundImage="/island.png"
  walkableMask="/island-mask.png"  // white = walkable, black = blocked

  // Camera
  cameraFollowInterval={10000}     // ms between switching followed character
  cameraPanResumeTimeout={30000}   // ms after user pan to resume follow
  initialZoom={1}
  minZoom={0.5}
  maxZoom={3}

  // Characters
  characters={[
    {
      id: "monster-1",
      name: "Goblin",
      state: "idle",
      startPosition: { x: 5, y: 10 },
      sprites: {
        idle: { src: "/goblin-idle.png", frameWidth: 16, frameHeight: 16, frameCount: 4 },
        walkUp: { src: "/goblin-walk-up.png", frameWidth: 16, frameHeight: 16, frameCount: 4 },
        walkDown: { src: "/goblin-walk-down.png", frameWidth: 16, frameHeight: 16, frameCount: 4 },
        walkLeft: { src: "/goblin-walk-left.png", frameWidth: 16, frameHeight: 16, frameCount: 4 },
        walkRight: { src: "/goblin-walk-right.png", frameWidth: 16, frameHeight: 16, frameCount: 4 },
      },
      movement: {
        speed: 1,
        pauseMin: 1000,
        pauseMax: 3000,
        frameRate: 8,
      },
      speechBubble: {
        text: "Hello!",
        style: { color: "#fff", fontWeight: "bold", fontSize: 12 },
      },
    },
  ]}

  // Global movement defaults
  defaultMovement={{
    speed: 1,
    pauseMin: 2000,
    pauseMax: 5000,
    frameRate: 8,
  }}
/>
```

### Props Summary

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mapWidth` | `number` | yes | Map width in tiles |
| `mapHeight` | `number` | yes | Map height in tiles |
| `tileSize` | `number` | yes | Pixel size of each tile |
| `backgroundImage` | `string` | yes | URL/path to the background image |
| `walkableMask` | `string` | yes | URL/path to a mask image (white = walkable, black = blocked) |
| `cameraFollowInterval` | `number` | no | Ms between switching followed character (default: 10000) |
| `cameraPanResumeTimeout` | `number` | no | Ms after user pan to resume camera follow (default: 30000) |
| `initialZoom` | `number` | no | Starting zoom level (default: 1) |
| `minZoom` | `number` | no | Minimum zoom (default: 0.5) |
| `maxZoom` | `number` | no | Maximum zoom (default: 3) |
| `characters` | `CharacterConfig[]` | yes | Array of character definitions |
| `defaultMovement` | `MovementConfig` | no | Global movement defaults |

### CharacterConfig

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique identifier |
| `name` | `string` | no | Display name |
| `state` | `string` | yes | Current visual state (controlled externally) |
| `startPosition` | `{ x: number, y: number }` | yes | Starting tile coordinates |
| `sprites` | `Record<string, SpriteConfig>` | yes | Map of state names to sprite sheet configs |
| `movement` | `MovementConfig` | no | Per-character movement overrides |
| `speechBubble` | `SpeechBubbleConfig \| undefined` | no | Speech bubble content (controlled externally) |

### SpriteConfig

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `src` | `string` | yes | URL/path to the sprite sheet image |
| `frameWidth` | `number` | yes | Width of a single frame in pixels |
| `frameHeight` | `number` | yes | Height of a single frame in pixels |
| `frameCount` | `number` | yes | Number of animation frames (laid out horizontally) |

### MovementConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `speed` | `number` | 1 | Tiles per second |
| `pauseMin` | `number` | 2000 | Minimum pause between moves (ms) |
| `pauseMax` | `number` | 5000 | Maximum pause between moves (ms) |
| `frameRate` | `number` | 8 | Sprite animation frames per second |

### SpeechBubbleConfig

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | yes | Text content |
| `style` | `React.CSSProperties` | no | Inline styles for the text (color, fontWeight, fontSize, etc.) |

## Architecture

### Rendering: Canvas + DOM Overlay

The component uses an HTML `<canvas>` for the map and sprites, with a positioned DOM layer on top for speech bubbles. This gives pixel-perfect sprite rendering with easy styled text.

```
<div style="position: relative">
  <canvas />                    ← map + characters
  <div class="speech-overlay">  ← speech bubbles (DOM)
    <SpeechBubble />
    <SpeechBubble />
  </div>
</div>
```

### Internal Modules

**`MonsterPlayground` (React component)**
- Root container with `position: relative`
- Hosts `<canvas>` and speech bubble overlay
- Initializes GameEngine on mount
- Syncs props (characters, states, speech bubbles) into the engine

**`GameEngine` (class)**
- Owns the `requestAnimationFrame` game loop: update → render
- Holds references to all CharacterAgents, MapRenderer, CameraController
- On each tick: updates characters, updates camera, renders frame

**`MapRenderer`**
- Draws the background image to the canvas with camera transform applied
- Loads the walkable mask into an offscreen canvas
- Exposes `isWalkable(tileX, tileY): boolean` by sampling pixel data from the mask

**`CharacterAgent` (one per character)**
- Two independent concerns:
  - **Visual state**: controlled externally via `state` prop → selects sprite sheet
  - **Movement state**: internal cycle: `idle` → `choosingDestination` → `walking` → `idle`
- When idle: waits random duration between `pauseMin` and `pauseMax`
- When choosing destination: picks a random adjacent walkable, unoccupied tile
- When walking: interpolates position at configured speed; temporarily uses walk direction sprite if available
- Draws current sprite frame to canvas

**`SpriteAnimator` (utility)**
- Tracks current frame index for a given sprite config and frame rate
- Advances frame counter each tick
- Returns source rectangle for drawing from the sprite sheet

**`CameraController`**
- Tracks camera offset (x, y) and zoom level
- `follow(characterId)`: smoothly lerps camera to center on character
- Timer picks a new random character every `cameraFollowInterval`
- On user pan: pauses follow, resumes after `cameraPanResumeTimeout`
- Applies transform: `ctx.setTransform(zoom, 0, 0, zoom, -offsetX, -offsetY)`

**`SpeechBubbleOverlay` (React component)**
- Absolutely positioned div layer over the canvas
- For each character with a `speechBubble`, renders a positioned bubble
- Position calculated by projecting character tile position through camera transform
- RPG-style bubble with tail pointing to the character
- Renders styled text via inline styles

## Movement & Pathfinding

### Grid-Based Random Wandering

Characters move tile-by-tile in 4 directions (up, down, left, right — no diagonals), classic FF6 style.

**Destination selection:**
1. Character examines 4 adjacent tiles
2. Filters to tiles that are: walkable (per mask), in bounds, and unoccupied
3. Picks one at random
4. If none available, stays idle and retries after pause timer

**Collision avoidance:**
- GameEngine maintains a `Map<string, string>` keyed by `"tileX,tileY"` → `characterId`
- Before moving, character claims the destination tile
- Origin tile released on arrival
- Prevents two characters targeting the same tile

**Movement interpolation:**
- Character lerps from current tile to next over `1 / speed` seconds
- During movement, uses walk direction sprite (e.g., `walkDown`) if it exists in the character's sprites
- Falls back to the current external state if no walk sprite exists
- External `state` prop takes priority when idle

**Walk direction convention:**
- The component looks for `walkUp`, `walkDown`, `walkLeft`, `walkRight` in the sprites map
- These are optional — if absent, the current external state sprite is used during movement

## Camera System

**Pan:** Mouse drag or touch drag pans the viewport.

**Zoom:** Mouse wheel (cursor-centered) and pinch-to-zoom on touch. Clamped between `minZoom` and `maxZoom`.

**Camera follow:**
- On mount, picks a random character to follow
- Smoothly lerps to center on the followed character (no instant snaps)
- Every `cameraFollowInterval` ms, picks a new random character
- After user pan: pauses follow, sets timeout of `cameraPanResumeTimeout` before resuming with a new random character

**Bounds clamping:** Camera offsets clamped so the viewport never shows area outside the map bounds at the current zoom level.

## Walkable Mask

The mask is a separate image file matching the map dimensions. Each pixel maps to a tile:
- **White (or near-white)** = walkable
- **Black (or near-black)** = blocked

On load, the mask image is drawn to an offscreen canvas. The `isWalkable` function samples the pixel at the center of the corresponding tile and checks if the red channel exceeds a threshold (e.g., > 128).

## Package & Build

**Package name:** `monster-playground`

**Exports:**
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

**Dependencies:** Zero runtime dependencies. React as peer dependency.

**Build:** TypeScript + tsup → ESM + CJS bundles with `.d.ts` type declarations.

**Dev environment:** A `demo/` app (Vite + React) for local development. Uses white placeholder rectangles for map/sprites. Separate workspace, not part of the published package.

## Mockup

See `pencil-new.pen` for the visual concept mockup showing:
- Map viewport with placeholder island
- Three characters (Goblin, Slime, Dragon) as colored tile sprites
- Speech bubble above Goblin with styled text
- Camera controls overlay
- Walkable mask annotation
- 16px tile grid hint
- Movement trail visualization
