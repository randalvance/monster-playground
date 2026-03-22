import { useState } from 'react'
import { MonsterPlayground } from 'monster-playground'
import type { CharacterConfig } from 'monster-playground'

const CHARMANDER_WALK = '/images/sprites/charmander/walk.png'

const charmanderSprites = {
  idle: { src: CHARMANDER_WALK, frameWidth: 32, frameHeight: 32, frameCount: 4, row: 0 },
  walkDown: { src: CHARMANDER_WALK, frameWidth: 32, frameHeight: 32, frameCount: 4, row: 0 },
  walkRight: { src: CHARMANDER_WALK, frameWidth: 32, frameHeight: 32, frameCount: 4, row: 2 },
  walkUp: { src: CHARMANDER_WALK, frameWidth: 32, frameHeight: 32, frameCount: 4, row: 4 },
  walkLeft: { src: CHARMANDER_WALK, frameWidth: 32, frameHeight: 32, frameCount: 4, row: 6 },
}

const characters: CharacterConfig[] = [
  {
    id: 'charmander-1',
    name: 'Charmander',
    state: 'idle',
    startPosition: { x: 5, y: 5 },
    sprites: charmanderSprites,
    movement: { speed: 2, pauseMin: 500, pauseMax: 2000, frameRate: 8 },
    speechBubble: { text: 'Hello!', style: { fontWeight: 'bold' } },
  },
  {
    id: 'charmander-2',
    name: 'Charmander',
    state: 'idle',
    startPosition: { x: 10, y: 8 },
    sprites: charmanderSprites,
    movement: { speed: 0.5, pauseMin: 2000, pauseMax: 5000, frameRate: 8 },
  },
  {
    id: 'charmander-3',
    name: 'Charmander',
    state: 'idle',
    startPosition: { x: 20, y: 12 },
    sprites: charmanderSprites,
    movement: { speed: 1, pauseMin: 1000, pauseMax: 3000, frameRate: 8 },
    speechBubble: { text: 'Rawr!', style: { color: '#FF6B35', fontSize: 14 } },
  },
]

export function App() {
  const [chars] = useState(characters)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MonsterPlayground
        mapWidth={88}
        mapHeight={48}
        tileSize={16}
        backgroundImage="/images/background/poke-island.jpeg"
        walkableMask="/images/background/poke-island-mask.jpeg"
        characters={chars}
        cameraFollowInterval={5000}
        cameraPanResumeTimeout={100000}
        initialZoom={3}
      />
    </div>
  )
}
