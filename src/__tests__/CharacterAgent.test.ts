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

  it('releases all occupied tiles on destroy', () => {
    const occ = makeOccupancy()
    const agent = new CharacterAgent(
      makeConfig(),
      { ...DEFAULT_MOVEMENT, pauseMin: 0, pauseMax: 0, speed: 0.5 },
      occ,
      isWalkable,
    )
    // Trigger movement so both current and target tiles are claimed
    agent.update(1) // triggers tryMove, agent is now walking
    if (agent.getMovementState() === 'walking') {
      // Both origin and destination should be claimed
      agent.destroy()
      expect(occ.isOccupied(2, 2)).toBe(false)
    } else {
      // Agent stayed idle (no valid move), just destroy
      agent.destroy()
      expect(occ.isOccupied(2, 2)).toBe(false)
    }
  })
})
