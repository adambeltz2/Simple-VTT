<script>
  import { onMount } from 'svelte';
  import { gameState, sceneImageUrls } from '../state.js';
  import { moveToken, setFogCell } from '../actions.js';

  export let interactive = false;
  export let addTokenMode = false;
  export let fogBrush = null; // null | 'reveal' | 'hide'
  export let onCanvasClick = () => {};

  let canvas;
  let ctx;
  const images = {}; // objectUrl -> HTMLImageElement cache
  let draggingId = null;
  let dragOffset = { x: 0, y: 0 };
  let painting = false;

  $: activeScene = $gameState.scenes[$gameState.activeSceneId];
  $: activeSceneUrl = $gameState.activeSceneId ? $sceneImageUrls[$gameState.activeSceneId] : null;
  $: tokens = Object.entries($gameState.tokens).filter(([, t]) => t.scene === $gameState.activeSceneId);
  $: canvasWidth = activeScene?.width || 1000;
  $: canvasHeight = activeScene?.height || 700;

  $: if (activeSceneUrl && !images[activeSceneUrl]) {
    const img = new Image();
    img.onload = () => draw();
    img.src = activeSceneUrl;
    images[activeSceneUrl] = img;
  }

  $: {
    // Reactive redraw trigger: re-run whenever any of these change.
    tokens;
    activeSceneUrl;
    activeScene;
    draw();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#1b1f24';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const img = activeSceneUrl && images[activeSceneUrl];
    if (img && img.complete) ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

    const gridSize = activeScene?.gridSize || 50;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvasWidth, y + 0.5);
      ctx.stroke();
    }

    for (const [, token] of tokens) {
      const radius = gridSize * 0.4;
      ctx.beginPath();
      ctx.arc(token.x, token.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = token.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0b0d10';
      ctx.stroke();

      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(token.name, token.x, token.y + radius + 14);
    }

    const fog = activeScene?.fog;
    if (fog) {
      // GM sees a translucent tint (so they can still run the game); players
      // get a fully opaque mask that also hides any tokens underneath.
      ctx.fillStyle = interactive ? 'rgba(0, 0, 0, 0.45)' : '#000';
      for (let row = 0; row < fog.rows; row++) {
        for (let col = 0; col < fog.cols; col++) {
          if (!fog.revealed[row * fog.cols + col]) {
            ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
          }
        }
      }
    }
  }

  function toCanvasCoords(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - rect.left) * canvasWidth) / rect.width,
      y: ((evt.clientY - rect.top) * canvasHeight) / rect.height
    };
  }

  function hitTestToken(pos) {
    const gridSize = activeScene?.gridSize || 50;
    const radius = gridSize * 0.4;
    for (const [id, token] of tokens) {
      const dx = token.x - pos.x;
      const dy = token.y - pos.y;
      if (dx * dx + dy * dy <= radius * radius) return id;
    }
    return null;
  }

  function fogCellAt(pos) {
    const fog = activeScene?.fog;
    if (!fog) return null;
    const gridSize = activeScene?.gridSize || 50;
    const col = Math.floor(pos.x / gridSize);
    const row = Math.floor(pos.y / gridSize);
    if (col < 0 || row < 0 || col >= fog.cols || row >= fog.rows) return null;
    return row * fog.cols + col;
  }

  function paintFogAt(pos) {
    const index = fogCellAt(pos);
    if (index === null) return;
    setFogCell($gameState.activeSceneId, index, fogBrush === 'reveal');
  }

  function handlePointerDown(evt) {
    if (!interactive) return;
    const pos = toCanvasCoords(evt);

    if (fogBrush) {
      painting = true;
      canvas.setPointerCapture(evt.pointerId);
      paintFogAt(pos);
      return;
    }

    const hitId = hitTestToken(pos);

    if (addTokenMode && !hitId) {
      onCanvasClick(pos);
      return;
    }

    if (hitId) {
      draggingId = hitId;
      const token = $gameState.tokens[hitId];
      dragOffset = { x: pos.x - token.x, y: pos.y - token.y };
      canvas.setPointerCapture(evt.pointerId);
    }
  }

  function handlePointerMove(evt) {
    const pos = toCanvasCoords(evt);

    if (painting) {
      paintFogAt(pos);
      return;
    }

    if (!draggingId) return;
    moveToken(draggingId, pos.x - dragOffset.x, pos.y - dragOffset.y);
  }

  function handlePointerUp(evt) {
    if (painting) {
      painting = false;
      return;
    }

    if (!draggingId) return;
    const pos = toCanvasCoords(evt);
    moveToken(draggingId, pos.x - dragOffset.x, pos.y - dragOffset.y, { force: true });
    draggingId = null;
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    draw();
  });
</script>

<div class="board-wrap">
  <canvas
    bind:this={canvas}
    width={canvasWidth}
    height={canvasHeight}
    class:interactive
    class:brushing={!!fogBrush}
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
  ></canvas>
  {#if !$gameState.activeSceneId}
    <p class="empty-hint">No active scene yet.</p>
  {/if}
</div>

<style>
  .board-wrap {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
  }
  canvas {
    max-width: 100%;
    height: auto;
    background: #1b1f24;
    border-radius: 8px;
    touch-action: none;
  }
  canvas.interactive {
    cursor: grab;
  }
  canvas.brushing {
    cursor: crosshair;
  }
  .empty-hint {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: #8b95a1;
    font-size: 0.9rem;
  }
</style>
