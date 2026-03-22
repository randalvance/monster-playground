"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  MonsterPlayground: () => MonsterPlayground
});
module.exports = __toCommonJS(index_exports);

// src/MonsterPlayground.tsx
var import_react = require("react");

// src/types.ts
var DEFAULT_MOVEMENT = {
  speed: 1,
  pauseMin: 2e3,
  pauseMax: 5e3,
  frameRate: 8
};

// src/SpriteAnimator.ts
var SpriteAnimator = class {
  constructor(config, frameRate) {
    this.config = config;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.frameDuration = 1e3 / frameRate;
  }
  update(deltaMs) {
    this.elapsed += deltaMs;
    while (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration;
      this.frameIndex = (this.frameIndex + 1) % this.config.frameCount;
    }
  }
  getFrame() {
    return this.frameIndex;
  }
  getSourceRect() {
    return {
      sx: this.frameIndex * this.config.frameWidth,
      sy: 0,
      sw: this.config.frameWidth,
      sh: this.config.frameHeight
    };
  }
  reset() {
    this.frameIndex = 0;
    this.elapsed = 0;
  }
};

// src/CharacterAgent.ts
var OccupancyMap = class {
  constructor() {
    this.occupied = /* @__PURE__ */ new Map();
  }
  key(x, y) {
    return `${x},${y}`;
  }
  claim(x, y, id) {
    this.occupied.set(this.key(x, y), id);
  }
  release(x, y) {
    this.occupied.delete(this.key(x, y));
  }
  isOccupied(x, y) {
    return this.occupied.has(this.key(x, y));
  }
};
var DIRECTIONS = [
  { dx: 0, dy: -1, name: "walkUp" },
  { dx: 0, dy: 1, name: "walkDown" },
  { dx: -1, dy: 0, name: "walkLeft" },
  { dx: 1, dy: 0, name: "walkRight" }
];
var CharacterAgent = class {
  constructor(config, defaultMovement, occupancy, isWalkable) {
    this.config = config;
    this.occupancy = occupancy;
    this.isWalkable = isWalkable;
    this.movementState = "idle";
    this.moveProgress = 0;
    this.walkDirection = null;
    this.tileX = config.startPosition.x;
    this.tileY = config.startPosition.y;
    this.targetTileX = this.tileX;
    this.targetTileY = this.tileY;
    this.pixelX = this.tileX;
    this.pixelY = this.tileY;
    this.externalState = config.state;
    this.movement = { ...defaultMovement, ...config.movement };
    this.pauseTimer = this.randomPause();
    this.occupancy.claim(this.tileX, this.tileY, config.id);
    const spriteKeys = Object.keys(config.sprites);
    const initialSprite = config.sprites[this.externalState] ?? config.sprites[spriteKeys[0]];
    this.animator = new SpriteAnimator(initialSprite, this.movement.frameRate);
  }
  update(deltaMs) {
    this.animator.update(deltaMs);
    if (this.movementState === "idle") {
      this.pauseTimer -= deltaMs;
      if (this.pauseTimer <= 0) {
        this.tryMove();
      }
    } else if (this.movementState === "walking") {
      const moveDuration = 1e3 / this.movement.speed;
      this.moveProgress += deltaMs;
      const t = Math.min(this.moveProgress / moveDuration, 1);
      this.pixelX = this.tileX + (this.targetTileX - this.tileX) * t;
      this.pixelY = this.tileY + (this.targetTileY - this.tileY) * t;
      if (t >= 1) {
        this.occupancy.release(this.tileX, this.tileY);
        this.tileX = this.targetTileX;
        this.tileY = this.targetTileY;
        this.pixelX = this.tileX;
        this.pixelY = this.tileY;
        this.movementState = "idle";
        this.walkDirection = null;
        this.pauseTimer = this.randomPause();
        this.moveProgress = 0;
      }
    }
  }
  tryMove() {
    const candidates = DIRECTIONS.filter(({ dx, dy }) => {
      const nx = this.tileX + dx;
      const ny = this.tileY + dy;
      return this.isWalkable(nx, ny) && !this.occupancy.isOccupied(nx, ny);
    });
    if (candidates.length === 0) {
      this.pauseTimer = this.randomPause();
      return;
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.targetTileX = this.tileX + chosen.dx;
    this.targetTileY = this.tileY + chosen.dy;
    this.walkDirection = chosen.name;
    this.occupancy.claim(this.targetTileX, this.targetTileY, this.config.id);
    this.movementState = "walking";
    this.moveProgress = 0;
    const walkSprite = this.config.sprites[chosen.name];
    if (walkSprite) {
      this.animator = new SpriteAnimator(walkSprite, this.movement.frameRate);
    }
  }
  randomPause() {
    return this.movement.pauseMin + Math.random() * (this.movement.pauseMax - this.movement.pauseMin);
  }
  getTilePosition() {
    return { x: this.tileX, y: this.tileY };
  }
  getPixelPosition() {
    return { x: this.pixelX, y: this.pixelY };
  }
  getMovementState() {
    return this.movementState;
  }
  getVisualState() {
    if (this.movementState === "walking" && this.walkDirection) {
      return this.config.sprites[this.walkDirection] ? this.walkDirection : this.externalState;
    }
    return this.externalState;
  }
  setExternalState(state) {
    this.externalState = state;
    if (this.movementState === "idle") {
      const sprite = this.config.sprites[state];
      if (sprite) {
        this.animator = new SpriteAnimator(sprite, this.movement.frameRate);
      }
    }
  }
  setSpeechBubble(bubble) {
    this.config = { ...this.config, speechBubble: bubble };
  }
  getSpeechBubble() {
    return this.config.speechBubble;
  }
  getAnimator() {
    return this.animator;
  }
  getCurrentSprite() {
    const state = this.getVisualState();
    return this.config.sprites[state];
  }
  getId() {
    return this.config.id;
  }
  destroy() {
    this.occupancy.release(this.tileX, this.tileY);
    if (this.movementState === "walking") {
      this.occupancy.release(this.targetTileX, this.targetTileY);
    }
  }
};

// src/MapRenderer.ts
var WalkableMask = class _WalkableMask {
  constructor(walkable) {
    this.walkable = walkable;
  }
  static fromImageData(data, pixelWidth, pixelHeight, tileSize, mapWidth, mapHeight) {
    const walkable = [];
    for (let ty = 0; ty < mapHeight; ty++) {
      walkable[ty] = [];
      for (let tx = 0; tx < mapWidth; tx++) {
        walkable[ty][tx] = _WalkableMask.checkTile(data, pixelWidth, tx, ty, tileSize);
      }
    }
    return new _WalkableMask(walkable);
  }
  static checkTile(data, pixelWidth, tileX, tileY, tileSize) {
    const startX = tileX * tileSize;
    const startY = tileY * tileSize;
    for (let py = startY; py < startY + tileSize; py++) {
      for (let px = startX; px < startX + tileSize; px++) {
        const idx = (py * pixelWidth + px) * 4;
        if (data[idx] < 128) {
          return false;
        }
      }
    }
    return true;
  }
  isWalkable(tileX, tileY) {
    if (tileY < 0 || tileY >= this.walkable.length) return false;
    if (tileX < 0 || tileX >= this.walkable[0].length) return false;
    return this.walkable[tileY][tileX];
  }
};
var MapRenderer = class {
  constructor(mapWidth, mapHeight, tileSize) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.tileSize = tileSize;
    this.backgroundImage = null;
    this.mask = null;
  }
  async loadBackground(src) {
    this.backgroundImage = await this.loadImage(src);
  }
  async loadMask(src) {
    const img = await this.loadImage(src);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    this.mask = WalkableMask.fromImageData(
      imageData.data,
      img.width,
      img.height,
      this.tileSize,
      this.mapWidth,
      this.mapHeight
    );
  }
  isWalkable(tileX, tileY) {
    if (!this.mask) return true;
    return this.mask.isWalkable(tileX, tileY);
  }
  draw(ctx) {
    if (this.backgroundImage) {
      ctx.drawImage(this.backgroundImage, 0, 0);
    }
  }
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
};

// src/GameEngine.ts
var GameEngine = class {
  constructor(config) {
    this.agents = [];
    this.occupancy = new OccupancyMap();
    this.camera = null;
    this.movement = { ...DEFAULT_MOVEMENT, ...config.defaultMovement };
    this.mapRenderer = new MapRenderer(config.mapWidth, config.mapHeight, config.tileSize);
    const isWalkable = (x, y) => {
      if (x < 0 || x >= config.mapWidth || y < 0 || y >= config.mapHeight) return false;
      return this.mapRenderer.isWalkable(x, y);
    };
    for (const charConfig of config.characters) {
      const agentMovement = { ...this.movement, ...charConfig.movement };
      const agent = new CharacterAgent(charConfig, agentMovement, this.occupancy, isWalkable);
      this.agents.push(agent);
    }
  }
  async loadAssets(backgroundSrc, maskSrc) {
    await Promise.all([
      this.mapRenderer.loadBackground(backgroundSrc),
      this.mapRenderer.loadMask(maskSrc)
    ]);
  }
  setCamera(camera) {
    this.camera = camera;
  }
  update(deltaMs) {
    for (const agent of this.agents) {
      agent.update(deltaMs);
    }
    if (this.camera) {
      this.camera.update(deltaMs);
    }
  }
  render(ctx, tileSize) {
    ctx.save();
    if (this.camera) {
      this.camera.applyTransform(ctx);
    }
    this.mapRenderer.draw(ctx);
    for (const agent of this.agents) {
      const sprite = agent.getCurrentSprite();
      if (!sprite) continue;
      const pos = agent.getPixelPosition();
      const anim = agent.getAnimator();
      const rect = anim.getSourceRect();
      ctx.fillStyle = "#FFD600";
      ctx.fillRect(pos.x * tileSize, pos.y * tileSize, sprite.frameWidth, sprite.frameHeight);
    }
    ctx.restore();
  }
  getAgents() {
    return this.agents;
  }
  getMapRenderer() {
    return this.mapRenderer;
  }
  updateCharacterState(characterId, state) {
    const agent = this.agents.find((a) => a.getId() === characterId);
    if (agent) agent.setExternalState(state);
  }
  updateSpeechBubble(characterId, bubble) {
    const agent = this.agents.find((a) => a.getId() === characterId);
    if (agent) agent.setSpeechBubble(bubble);
  }
  pickRandomFollowTarget() {
    const idx = Math.floor(Math.random() * this.agents.length);
    return this.agents[idx].getId();
  }
  getAgentById(id) {
    return this.agents.find((a) => a.getId() === id);
  }
};

// src/CameraController.ts
var CameraController = class {
  constructor(config) {
    this.config = config;
    this.offsetX = 0;
    this.offsetY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.following = true;
    this.panPaused = false;
    this.panResumeTimer = 0;
    this.lerpSpeed = 0.05;
    this.zoom = config.initialZoom;
  }
  getZoom() {
    return this.zoom;
  }
  getOffset() {
    return { x: this.offsetX, y: this.offsetY };
  }
  isFollowing() {
    return this.following && !this.panPaused;
  }
  zoomBy(delta) {
    const factor = 1 + delta * 1e-3;
    this.zoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.zoom * factor));
    this.clampOffset();
  }
  pan(dx, dy) {
    this.offsetX -= dx / this.zoom;
    this.offsetY -= dy / this.zoom;
  }
  onUserPan() {
    this.panPaused = true;
    this.following = false;
    this.panResumeTimer = this.config.panResumeTimeout;
  }
  setFollowTarget(pixelX, pixelY) {
    this.targetX = pixelX;
    this.targetY = pixelY;
    this.following = true;
  }
  update(deltaMs) {
    if (this.panPaused) {
      this.panResumeTimer -= deltaMs;
      if (this.panResumeTimer <= 0) {
        this.panPaused = false;
        this.following = true;
      }
    }
    if (this.following && !this.panPaused) {
      const t = 1 - Math.pow(1 - this.lerpSpeed, deltaMs / 16);
      this.offsetX += (this.targetX - this.offsetX) * t;
      this.offsetY += (this.targetY - this.offsetY) * t;
    }
    this.clampOffset();
  }
  setViewportSize(width, height) {
    this.config.viewportWidth = width;
    this.config.viewportHeight = height;
    this.clampOffset();
  }
  applyTransform(ctx) {
    ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.offsetX * this.zoom, -this.offsetY * this.zoom);
  }
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.offsetX) * this.zoom,
      y: (worldY - this.offsetY) * this.zoom
    };
  }
  clampOffset() {
    const viewW = this.config.viewportWidth / this.zoom;
    const viewH = this.config.viewportHeight / this.zoom;
    const maxX = Math.max(0, this.config.mapPixelWidth - viewW);
    const maxY = Math.max(0, this.config.mapPixelHeight - viewH);
    this.offsetX = Math.max(0, Math.min(maxX, this.offsetX));
    this.offsetY = Math.max(0, Math.min(maxY, this.offsetY));
  }
};

// src/SpeechBubbleOverlay.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var bubbleStyle = {
  position: "absolute",
  background: "#F5F5F0",
  color: "#1A1A1A",
  padding: "6px 10px",
  borderRadius: "6px",
  fontSize: "12px",
  fontFamily: "sans-serif",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  transform: "translate(-50%, -100%)",
  marginTop: "-8px"
};
var tailStyle = {
  position: "absolute",
  bottom: "-6px",
  left: "50%",
  transform: "translateX(-50%)",
  width: 0,
  height: 0,
  borderLeft: "6px solid transparent",
  borderRight: "6px solid transparent",
  borderTop: "6px solid #F5F5F0"
};
function SpeechBubbleOverlay({ bubbles }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden"
      },
      children: bubbles.map((bubble) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          "data-speech-bubble": bubble.characterId,
          style: {
            ...bubbleStyle,
            left: bubble.screenX,
            top: bubble.screenY
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: bubble.style, children: bubble.text }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: tailStyle })
          ]
        },
        bubble.characterId
      ))
    }
  );
}

// src/MonsterPlayground.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function MonsterPlayground(props) {
  const {
    mapWidth,
    mapHeight,
    tileSize,
    backgroundImage,
    walkableMask,
    cameraFollowInterval = 1e4,
    cameraPanResumeTimeout = 3e4,
    initialZoom = 1,
    minZoom = 0.5,
    maxZoom = 3,
    characters,
    defaultMovement
  } = props;
  const canvasRef = (0, import_react.useRef)(null);
  const containerRef = (0, import_react.useRef)(null);
  const engineRef = (0, import_react.useRef)(null);
  const cameraRef = (0, import_react.useRef)(null);
  const rafRef = (0, import_react.useRef)(0);
  const lastTimeRef = (0, import_react.useRef)(0);
  const followTimerRef = (0, import_react.useRef)(0);
  const [bubbles, setBubbles] = (0, import_react.useState)([]);
  const mapPixelWidth = mapWidth * tileSize;
  const mapPixelHeight = mapHeight * tileSize;
  (0, import_react.useEffect)(() => {
    const engine = new GameEngine({
      mapWidth,
      mapHeight,
      tileSize,
      characters,
      defaultMovement
    });
    engineRef.current = engine;
    engine.loadAssets(backgroundImage, walkableMask).catch(console.error);
    return () => {
      engineRef.current = null;
    };
  }, []);
  (0, import_react.useEffect)(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const camera = new CameraController({
      mapPixelWidth,
      mapPixelHeight,
      viewportWidth: rect.width || mapPixelWidth,
      viewportHeight: rect.height || mapPixelHeight,
      initialZoom,
      minZoom,
      maxZoom,
      followInterval: cameraFollowInterval,
      panResumeTimeout: cameraPanResumeTimeout
    });
    cameraRef.current = camera;
    if (engineRef.current) {
      engineRef.current.setCamera(camera);
      const targetId = engineRef.current.pickRandomFollowTarget();
      const agent = engineRef.current.getAgentById(targetId);
      if (agent) {
        const pos = agent.getPixelPosition();
        camera.setFollowTarget(pos.x * tileSize, pos.y * tileSize);
      }
    }
  }, [mapPixelWidth, mapPixelHeight, initialZoom, minZoom, maxZoom, cameraFollowInterval, cameraPanResumeTimeout, tileSize]);
  (0, import_react.useEffect)(() => {
    const engine = engineRef.current;
    if (!engine) return;
    for (const char of characters) {
      engine.updateCharacterState(char.id, char.state);
      engine.updateSpeechBubble(char.id, char.speechBubble);
    }
    const camera = cameraRef.current;
    const newBubbles = [];
    for (const agent of engine.getAgents()) {
      const sb = agent.getSpeechBubble();
      if (!sb) continue;
      const pos = agent.getPixelPosition();
      const worldX = pos.x * tileSize + tileSize / 2;
      const worldY = pos.y * tileSize;
      const screen = camera ? camera.worldToScreen(worldX, worldY) : { x: worldX, y: worldY };
      newBubbles.push({
        characterId: agent.getId(),
        text: sb.text,
        screenX: screen.x,
        screenY: screen.y,
        style: sb.style
      });
    }
    setBubbles(newBubbles);
  }, [characters, tileSize]);
  (0, import_react.useEffect)(() => {
    const loop = (time) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;
      const engine = engineRef.current;
      const camera = cameraRef.current;
      const canvas = canvasRef.current;
      if (!engine || !canvas) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      engine.update(delta);
      followTimerRef.current += delta;
      if (followTimerRef.current >= cameraFollowInterval && camera) {
        followTimerRef.current = 0;
        const targetId = engine.pickRandomFollowTarget();
        const agent = engine.getAgentById(targetId);
        if (agent) {
          const pos = agent.getPixelPosition();
          camera.setFollowTarget(pos.x * tileSize, pos.y * tileSize);
        }
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      engine.render(ctx, tileSize);
      const newBubbles = [];
      for (const agent of engine.getAgents()) {
        const sb = agent.getSpeechBubble();
        if (!sb) continue;
        const pos = agent.getPixelPosition();
        const worldX = pos.x * tileSize + tileSize / 2;
        const worldY = pos.y * tileSize;
        const screen = camera ? camera.worldToScreen(worldX, worldY) : { x: worldX, y: worldY };
        newBubbles.push({
          characterId: agent.getId(),
          text: sb.text,
          screenX: screen.x,
          screenY: screen.y,
          style: sb.style
        });
      }
      setBubbles(newBubbles);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tileSize, cameraFollowInterval]);
  const isDragging = (0, import_react.useRef)(false);
  const lastMouse = (0, import_react.useRef)({ x: 0, y: 0 });
  const handleMouseDown = (0, import_react.useCallback)((e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handleMouseMove = (0, import_react.useCallback)((e) => {
    if (!isDragging.current || !cameraRef.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    cameraRef.current.pan(dx, dy);
    cameraRef.current.onUserPan();
  }, []);
  const handleMouseUp = (0, import_react.useCallback)(() => {
    isDragging.current = false;
  }, []);
  const handleWheel = (0, import_react.useCallback)((e) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    cameraRef.current.zoomBy(-e.deltaY);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      ref: containerRef,
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: isDragging.current ? "grabbing" : "grab"
      },
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "canvas",
          {
            ref: canvasRef,
            width: containerRef.current?.clientWidth ?? mapPixelWidth,
            height: containerRef.current?.clientHeight ?? mapPixelHeight,
            style: { display: "block", width: "100%", height: "100%" }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SpeechBubbleOverlay, { bubbles })
      ]
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MonsterPlayground
});
//# sourceMappingURL=index.js.map