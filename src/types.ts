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
