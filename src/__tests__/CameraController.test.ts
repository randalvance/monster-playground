import { describe, it, expect } from 'vitest'
import { CameraController } from '../CameraController'

describe('CameraController', () => {
  const defaults = {
    mapPixelWidth: 512,
    mapPixelHeight: 384,
    viewportWidth: 256,
    viewportHeight: 192,
    initialZoom: 1,
    minZoom: 0.5,
    maxZoom: 3,
    followInterval: 5000,
    panResumeTimeout: 3000,
  }

  it('starts at the initial zoom', () => {
    const cam = new CameraController(defaults)
    expect(cam.getZoom()).toBe(1)
  })

  it('clamps zoom to min/max', () => {
    const cam = new CameraController(defaults)
    cam.zoomBy(100) // zoom in a lot
    expect(cam.getZoom()).toBeLessThanOrEqual(3)
    cam.zoomBy(-1000) // zoom out a lot
    expect(cam.getZoom()).toBeGreaterThanOrEqual(0.5)
  })

  it('pans by offset', () => {
    const cam = new CameraController(defaults)
    const before = cam.getOffset()
    cam.pan(10, 20)
    const after = cam.getOffset()
    expect(after.x).toBe(before.x - 10)
    expect(after.y).toBe(before.y - 20)
  })

  it('clamps offset so viewport stays within map bounds', () => {
    const cam = new CameraController(defaults)
    cam.pan(-10000, -10000) // try to pan way past top-left
    const offset = cam.getOffset()
    expect(offset.x).toBeGreaterThanOrEqual(0)
    expect(offset.y).toBeGreaterThanOrEqual(0)
  })

  it('sets follow target', () => {
    const cam = new CameraController(defaults)
    cam.setFollowTarget(100, 100)
    cam.update(16) // one frame
    // Camera should start moving toward target
    const offset = cam.getOffset()
    expect(offset.x).toBeGreaterThan(0)
  })

  it('pauses follow on pan and resumes after timeout', () => {
    const cam = new CameraController(defaults)
    cam.setFollowTarget(100, 100)
    cam.onUserPan() // user pans
    expect(cam.isFollowing()).toBe(false)
    cam.update(3001) // exceed panResumeTimeout
    expect(cam.isFollowing()).toBe(true)
  })
})
