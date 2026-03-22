import { useEffect, useRef, useCallback, useState } from 'react'
import type { MonsterPlaygroundProps } from './types'
import { GameEngine } from './GameEngine'
import { CameraController } from './CameraController'
import { SpeechBubbleOverlay } from './SpeechBubbleOverlay'
import type { SpeechBubbleData } from './SpeechBubbleOverlay'

export function MonsterPlayground(props: MonsterPlaygroundProps) {
  const {
    mapWidth,
    mapHeight,
    tileSize,
    backgroundImage,
    walkableMask,
    cameraFollowInterval = 10000,
    cameraPanResumeTimeout = 30000,
    initialZoom = 1,
    minZoom = 0.5,
    maxZoom = 3,
    characters,
    defaultMovement,
  } = props

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const cameraRef = useRef<CameraController | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const followTimerRef = useRef<number>(0)
  const followTargetRef = useRef<string | null>(null)
  const [bubbles, setBubbles] = useState<SpeechBubbleData[]>([])

  const mapPixelWidth = mapWidth * tileSize
  const mapPixelHeight = mapHeight * tileSize

  // Initialize engine
  useEffect(() => {
    const engine = new GameEngine({
      mapWidth,
      mapHeight,
      tileSize,
      characters,
      defaultMovement,
    })
    engineRef.current = engine

    engine.loadAssets(backgroundImage, walkableMask).catch(console.error)

    return () => {
      engineRef.current = null
    }
  }, []) // Intentionally stable — props synced below

  // Initialize camera
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const camera = new CameraController({
      mapPixelWidth,
      mapPixelHeight,
      viewportWidth: rect.width || mapPixelWidth,
      viewportHeight: rect.height || mapPixelHeight,
      initialZoom,
      minZoom,
      maxZoom,
      followInterval: cameraFollowInterval,
      panResumeTimeout: cameraPanResumeTimeout,
    })
    cameraRef.current = camera

    if (engineRef.current) {
      engineRef.current.setCamera(camera)
      // Start following a random character
      const targetId = engineRef.current.pickRandomFollowTarget()
      followTargetRef.current = targetId
      const agent = engineRef.current.getAgentById(targetId)
      if (agent) {
        const pos = agent.getPixelPosition()
        camera.setFollowTarget(pos.x * tileSize, pos.y * tileSize)
      }
    }
  }, [mapPixelWidth, mapPixelHeight, initialZoom, minZoom, maxZoom, cameraFollowInterval, cameraPanResumeTimeout, tileSize])

  // Sync character states and speech bubbles from props
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    for (const char of characters) {
      engine.updateCharacterState(char.id, char.state)
      engine.updateSpeechBubble(char.id, char.speechBubble)
    }
    // Also update bubbles state immediately so speech bubbles are visible
    // even before the rAF loop fires (e.g. in tests or on first render).
    const camera = cameraRef.current
    const newBubbles: SpeechBubbleData[] = []
    for (const agent of engine.getAgents()) {
      const sb = agent.getSpeechBubble()
      if (!sb) continue
      const pos = agent.getPixelPosition()
      const worldX = pos.x * tileSize + tileSize / 2
      const worldY = pos.y * tileSize
      const screen = camera
        ? camera.worldToScreen(worldX, worldY)
        : { x: worldX, y: worldY }
      newBubbles.push({
        characterId: agent.getId(),
        text: sb.text,
        screenX: screen.x,
        screenY: screen.y,
        style: sb.style,
      })
    }
    setBubbles(newBubbles)
  }, [characters, tileSize])

  // Game loop
  useEffect(() => {
    const loop = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16
      lastTimeRef.current = time

      const engine = engineRef.current
      const camera = cameraRef.current
      const canvas = canvasRef.current
      if (!engine || !canvas) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Update
      engine.update(delta)

      // Follow timer — switch target periodically
      followTimerRef.current += delta
      if (followTimerRef.current >= cameraFollowInterval && camera) {
        followTimerRef.current = 0
        const targetId = engine.pickRandomFollowTarget()
        followTargetRef.current = targetId
      }

      // Continuously update follow target position so camera tracks the moving character
      if (camera && followTargetRef.current) {
        const agent = engine.getAgentById(followTargetRef.current)
        if (agent) {
          const pos = agent.getPixelPosition()
          camera.setFollowTarget(pos.x * tileSize, pos.y * tileSize)
        }
      }

      // Render
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      engine.render(ctx, tileSize)

      // Update speech bubble positions
      const newBubbles: SpeechBubbleData[] = []
      for (const agent of engine.getAgents()) {
        const sb = agent.getSpeechBubble()
        if (!sb) continue
        const pos = agent.getPixelPosition()
        const worldX = pos.x * tileSize + tileSize / 2
        const worldY = pos.y * tileSize
        const screen = camera
          ? camera.worldToScreen(worldX, worldY)
          : { x: worldX, y: worldY }
        newBubbles.push({
          characterId: agent.getId(),
          text: sb.text,
          screenX: screen.x,
          screenY: screen.y,
          style: sb.style,
        })
      }
      setBubbles(newBubbles)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tileSize, cameraFollowInterval])

  // Mouse/touch event handlers for pan and zoom
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !cameraRef.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    cameraRef.current.pan(dx, dy)
    cameraRef.current.onUserPan()
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!cameraRef.current) return
    e.preventDefault()
    cameraRef.current.zoomBy(-e.deltaY)
  }, [])

  const handleZoomIn = useCallback(() => {
    cameraRef.current?.zoomStep(1)
  }, [])

  const handleZoomOut = useCallback(() => {
    cameraRef.current?.zoomStep(-1)
  }, [])

  const zoomButtonStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    fontSize: 20,
    fontWeight: 'bold',
    border: '1px solid rgba(0,0,0,0.3)',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.85)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    userSelect: 'none',
    lineHeight: 1,
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isDragging.current ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        width={containerRef.current?.clientWidth ?? mapPixelWidth}
        height={containerRef.current?.clientHeight ?? mapPixelHeight}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <SpeechBubbleOverlay bubbles={bubbles} />
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 10,
        }}
      >
        <button
          style={zoomButtonStyle}
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          style={zoomButtonStyle}
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  )
}
