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
