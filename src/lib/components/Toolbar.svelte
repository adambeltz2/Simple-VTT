<script>
  import { gameState, peerCount } from '../state.js';

  export let addTokenMode = false;
  export let onToggleAddToken = () => {};
</script>

<div class="toolbar">
  <div class="info">
    <span class="code">Session code: <strong>{$gameState.sessionId}</strong></span>
    <span class="peers">Players connected: {$peerCount}</span>
  </div>
  <button class:active={addTokenMode} on:click={onToggleAddToken} disabled={!$gameState.activeSceneId}>
    {addTokenMode ? 'Cancel Add Token' : '+ Add Token'}
  </button>
</div>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.7rem 1rem;
    background: #14171b;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .info {
    display: flex;
    gap: 1.25rem;
    font-size: 0.85rem;
    color: #c7ccd3;
  }
  .code strong {
    color: #fff;
    letter-spacing: 0.05em;
  }
  button {
    border: none;
    border-radius: 4px;
    background: #3182ce;
    color: #fff;
    cursor: pointer;
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
  button.active {
    background: #c53030;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
