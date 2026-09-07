<script>
  import { gameState } from '../state.js';
  import { setFogEnabled, setAllFog } from '../actions.js';

  export let tool = 'move'; // 'move' | 'addToken' | 'fogReveal' | 'fogHide'
  export let onSetTool = () => {};

  $: activeSceneId = $gameState.activeSceneId;
  $: scene = activeSceneId ? $gameState.scenes[activeSceneId] : null;
  $: fogEnabled = !!scene?.fog;

  function toggleBrush(brush) {
    onSetTool(tool === brush ? 'move' : brush);
  }
</script>

<div class="fog-controls">
  <div class="header">
    <h3>Fog of War</h3>
    <label class="toggle">
      <input
        type="checkbox"
        checked={fogEnabled}
        disabled={!activeSceneId}
        on:change={(e) => setFogEnabled(activeSceneId, e.target.checked)}
      />
      Enabled
    </label>
  </div>

  {#if !activeSceneId}
    <p class="hint">Upload a scene first.</p>
  {:else if fogEnabled}
    <div class="brushes">
      <button class:active={tool === 'fogReveal'} on:click={() => toggleBrush('fogReveal')}>
        Reveal Brush
      </button>
      <button class:active={tool === 'fogHide'} on:click={() => toggleBrush('fogHide')}> Hide Brush </button>
    </div>
    <div class="bulk">
      <button on:click={() => setAllFog(activeSceneId, true)}>Reveal All</button>
      <button on:click={() => setAllFog(activeSceneId, false)}>Hide All</button>
    </div>
  {/if}
</div>

<style>
  .fog-controls {
    background: #191d22;
    border-radius: 8px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h3 {
    margin: 0;
    font-size: 0.95rem;
    color: #e2e6ea;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: #c7ccd3;
  }
  .hint {
    color: #6b7280;
    font-size: 0.8rem;
    font-style: italic;
    margin: 0;
  }
  .brushes,
  .bulk {
    display: flex;
    gap: 0.4rem;
  }
  button {
    flex: 1;
    border: none;
    border-radius: 4px;
    background: #3a4048;
    color: #fff;
    cursor: pointer;
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
  }
  button.active {
    background: #3182ce;
  }
</style>
