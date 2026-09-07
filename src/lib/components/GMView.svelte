<script>
  import BoardCanvas from './BoardCanvas.svelte';
  import Toolbar from './Toolbar.svelte';
  import SceneManager from './SceneManager.svelte';
  import FogControls from './FogControls.svelte';
  import InitiativeTracker from './InitiativeTracker.svelte';
  import TokenModal from './TokenModal.svelte';
  import { gameState } from '../state.js';
  import { addToken } from '../actions.js';

  // A single active tool keeps token-placement and fog-painting mutually
  // exclusive without extra bookkeeping.
  let tool = 'move'; // 'move' | 'addToken' | 'fogReveal' | 'fogHide'
  let pendingPos = null;

  $: addTokenMode = tool === 'addToken';
  $: fogBrush = tool === 'fogReveal' ? 'reveal' : tool === 'fogHide' ? 'hide' : null;

  function handleCanvasClick(pos) {
    pendingPos = pos;
  }

  function confirmToken(e) {
    addToken({ ...e.detail, sceneId: $gameState.activeSceneId });
    pendingPos = null;
    tool = 'move';
  }
</script>

<div class="gm-view">
  <Toolbar {addTokenMode} onToggleAddToken={() => (tool = tool === 'addToken' ? 'move' : 'addToken')} />
  <div class="layout">
    <div class="board-col">
      <BoardCanvas interactive={true} {addTokenMode} {fogBrush} onCanvasClick={handleCanvasClick} />
    </div>
    <div class="side-col">
      <SceneManager />
      <FogControls {tool} onSetTool={(t) => (tool = t)} />
      <InitiativeTracker editable={true} />
    </div>
  </div>
</div>

{#if pendingPos}
  <TokenModal x={pendingPos.x} y={pendingPos.y} on:confirm={confirmToken} on:cancel={() => (pendingPos = null)} />
{/if}

<style>
  .gm-view {
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  .layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1rem;
    align-items: start;
  }
  .side-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
