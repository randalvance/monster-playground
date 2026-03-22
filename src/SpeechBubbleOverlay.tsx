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
