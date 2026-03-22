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
