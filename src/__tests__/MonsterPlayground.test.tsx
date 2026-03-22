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
