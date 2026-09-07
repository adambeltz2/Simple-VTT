<script>
  import { hostSession, joinSession } from '../network/peer.js';
  import { connectionStatus, statusMessage } from '../state.js';

  let code = '';

  async function handleHost() {
    try {
      await hostSession();
    } catch (e) {
      // connectionStatus/statusMessage already reflect the failure.
    }
  }

  async function handleJoin() {
    if (!code.trim()) return;
    try {
      await joinSession(code.trim());
    } catch (e) {
      // connectionStatus/statusMessage already reflect the failure.
    }
  }
</script>

<div class="join-screen">
  <h1>Minimalist P2P VTT</h1>
  <p class="tagline">No accounts. No installs. Just a code.</p>

  <div class="panel">
    <button class="primary" on:click={handleHost} disabled={$connectionStatus === 'connecting'}>
      Host a Game
    </button>

    <div class="divider">or</div>

    <form on:submit|preventDefault={handleJoin}>
      <input placeholder="ENTER CODE" bind:value={code} maxlength="6" style="text-transform: uppercase;" />
      <button type="submit" disabled={$connectionStatus === 'connecting'}>Join a Game</button>
    </form>
  </div>

  {#if $connectionStatus === 'connecting'}
    <p class="hint">Connecting…</p>
  {/if}
  {#if $connectionStatus === 'error' && $statusMessage}
    <p class="error">{$statusMessage}</p>
  {/if}
</div>

<style>
  .join-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    text-align: center;
  }
  h1 {
    margin: 0;
    color: #fff;
    font-size: 1.8rem;
  }
  .tagline {
    color: #8b95a1;
    margin: 0 0 1.5rem;
  }
  .panel {
    background: #191d22;
    border-radius: 10px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    width: 280px;
  }
  .divider {
    color: #6b7280;
    font-size: 0.8rem;
    text-transform: uppercase;
  }
  form {
    display: flex;
    gap: 0.5rem;
  }
  input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #3a4048;
    background: #14171b;
    color: #fff;
    letter-spacing: 0.1em;
  }
  button {
    border: none;
    border-radius: 4px;
    background: #3a4048;
    color: #fff;
    cursor: pointer;
    padding: 0.55rem 0.9rem;
    font-size: 0.9rem;
  }
  button.primary {
    background: #3182ce;
    padding: 0.7rem;
  }
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .hint {
    color: #8b95a1;
    font-size: 0.85rem;
  }
  .error {
    color: #f87171;
    font-size: 0.85rem;
    max-width: 280px;
  }
</style>
