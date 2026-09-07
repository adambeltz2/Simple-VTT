<script>
  import BoardCanvas from './BoardCanvas.svelte';
  import InitiativeTracker from './InitiativeTracker.svelte';
  import { gameState, connectionStatus } from '../state.js';
</script>

<div class="player-view">
  <div class="status-bar">
    Session <strong>{$gameState.sessionId}</strong> — {$connectionStatus}
  </div>
  <div class="layout">
    <div class="board-col">
      <BoardCanvas interactive={false} />
    </div>
    <div class="side-col">
      <InitiativeTracker editable={false} />
    </div>
  </div>
</div>

<style>
  .player-view {
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  .status-bar {
    padding: 0.6rem 1rem;
    background: #14171b;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    color: #c7ccd3;
    font-size: 0.85rem;
  }
  .status-bar strong {
    color: #fff;
    letter-spacing: 0.05em;
  }
  .layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1rem;
    align-items: start;
  }
  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
