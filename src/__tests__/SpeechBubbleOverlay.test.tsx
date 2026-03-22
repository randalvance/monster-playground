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
