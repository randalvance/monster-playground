import { describe, it, expect } from 'vitest'
import { SpriteAnimator } from '../SpriteAnimator'

describe('SpriteAnimator', () => {
  const config = { src: 'test.png', frameWidth: 16, frameHeight: 16, frameCount: 4 }

  it('starts at frame 0', () => {
    const anim = new SpriteAnimator(config, 8)
    expect(anim.getFrame()).toBe(0)
  })

  it('advances frame after enough time', () => {
    const anim = new SpriteAnimator(config, 8) // 8 FPS = 125ms per frame
    anim.update(125)
    expect(anim.getFrame()).toBe(1)
  })

  it('wraps around to frame 0 after last frame', () => {
    const anim = new SpriteAnimator(config, 8)
    anim.update(125 * 4) // 4 frames at 125ms each
    expect(anim.getFrame()).toBe(0)
  })

  it('returns correct source rectangle', () => {
    const anim = new SpriteAnimator(config, 8)
    anim.update(125) // frame 1
    const rect = anim.getSourceRect()
    expect(rect).toEqual({ sx: 16, sy: 0, sw: 16, sh: 16 })
  })

  it('does not advance on small delta', () => {
    const anim = new SpriteAnimator(config, 8)
    anim.update(50)
    expect(anim.getFrame()).toBe(0)
  })

  it('resets frame index on reset()', () => {
    const anim = new SpriteAnimator(config, 8)
    anim.update(250)
    anim.reset()
    expect(anim.getFrame()).toBe(0)
  })
})
