import { useState } from 'react'
import { MonsterPlayground } from 'monster-playground'
import type { CharacterConfig, SpriteConfig } from 'monster-playground'

function makeSprites(
  src: string,
  fw: number,
  fh: number,
  fc: number,
): Record<string, SpriteConfig> {
  return {
    idle:      { src, frameWidth: fw, frameHeight: fh, frameCount: fc, row: 0 },
    walkDown:  { src, frameWidth: fw, frameHeight: fh, frameCount: fc, row: 0 },
    walkRight: { src, frameWidth: fw, frameHeight: fh, frameCount: fc, row: 2 },
    walkUp:    { src, frameWidth: fw, frameHeight: fh, frameCount: fc, row: 4 },
    walkLeft:  { src, frameWidth: fw, frameHeight: fh, frameCount: fc, row: 6 },
  }
}

const characters: CharacterConfig[] = [
  {
    id: 'charmander',
    name: 'Charmander',
    state: 'idle',
    startPosition: { x: 5, y: 5 },
    sprites: makeSprites('/images/sprites/charmander/walk.png', 32, 32, 4),
    movement: { speed: 2, pauseMin: 500, pauseMax: 2000, frameRate: 8 },
  },
  {
    id: 'bulbasaur',
    name: 'Bulbasaur',
    state: 'idle',
    startPosition: { x: 10, y: 8 },
    sprites: makeSprites('/images/sprites/bulbasaur/walk.png', 40, 40, 6),
    movement: { speed: 1, pauseMin: 1000, pauseMax: 3000, frameRate: 8 },
  },
  {
    id: 'squirtle',
    name: 'Squirtle',
    state: 'idle',
    startPosition: { x: 20, y: 12 },
    sprites: makeSprites('/images/sprites/squirtle/walk.png', 32, 32, 4),
    movement: { speed: 1.5, pauseMin: 800, pauseMax: 2500, frameRate: 8 },
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    state: 'idle',
    startPosition: { x: 15, y: 10 },
    sprites: makeSprites('/images/sprites/pikachu/walk.png', 32, 40, 4),
    movement: { speed: 2.5, pauseMin: 300, pauseMax: 1500, frameRate: 10 },
  },
  {
    id: 'gengar',
    name: 'Gengar',
    state: 'idle',
    startPosition: { x: 25, y: 15 },
    sprites: makeSprites('/images/sprites/gengar/walk.png', 32, 40, 4),
    movement: { speed: 1.8, pauseMin: 600, pauseMax: 2000, frameRate: 8 },
  },
  {
    id: 'jigglypuff',
    name: 'Jigglypuff',
    state: 'idle',
    startPosition: { x: 30, y: 10 },
    sprites: makeSprites('/images/sprites/jigglypuff/walk.png', 32, 40, 5),
    movement: { speed: 0.8, pauseMin: 1500, pauseMax: 4000, frameRate: 8 },
  },
  {
    id: 'pidgey',
    name: 'Pidgey',
    state: 'idle',
    startPosition: { x: 35, y: 20 },
    sprites: makeSprites('/images/sprites/pidgey/walk.png', 32, 32, 5),
    movement: { speed: 2.2, pauseMin: 400, pauseMax: 1800, frameRate: 10 },
  },
  {
    id: 'abra',
    name: 'Abra',
    state: 'idle',
    startPosition: { x: 40, y: 18 },
    sprites: makeSprites('/images/sprites/abra/walk.png', 32, 48, 8),
    movement: { speed: 0.5, pauseMin: 3000, pauseMax: 6000, frameRate: 6 },
  },
  {
    id: 'rattata',
    name: 'Rattata',
    state: 'idle',
    startPosition: { x: 45, y: 22 },
    sprites: makeSprites('/images/sprites/rattata/walk.png', 48, 40, 7),
    movement: { speed: 3, pauseMin: 200, pauseMax: 1000, frameRate: 12 },
  },
  {
    id: 'mr-mime',
    name: 'Mr. Mime',
    state: 'idle',
    startPosition: { x: 50, y: 14 },
    sprites: makeSprites('/images/sprites/mr_mime/walk.png', 32, 48, 4),
    movement: { speed: 1.2, pauseMin: 1000, pauseMax: 3500, frameRate: 8 },
  },
  {
    id: 'totodile',
    name: 'Totodile',
    state: 'idle',
    startPosition: { x: 55, y: 16 },
    sprites: makeSprites('/images/sprites/totodile/walk.png', 24, 32, 4),
    movement: { speed: 1.8, pauseMin: 600, pauseMax: 2200, frameRate: 8 },
  },
  {
    id: 'scorbunny',
    name: 'Scorbunny',
    state: 'idle',
    startPosition: { x: 60, y: 20 },
    sprites: makeSprites('/images/sprites/scorbunny/walk.png', 24, 40, 4),
    movement: { speed: 2.8, pauseMin: 300, pauseMax: 1200, frameRate: 10 },
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
