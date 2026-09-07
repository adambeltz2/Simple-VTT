<script>
  import { gameState } from '../state.js';
  import { addScene, setActiveScene } from '../actions.js';

  let name = '';
  let gridSize = 50;
  let fileInput;
  let busy = false;
  let error = '';

  async function handleUpload() {
    const file = fileInput.files[0];
    if (!file) return;
    if (!name.trim()) {
      error = 'Give the scene a name first.';
      fileInput.value = '';
      return;
    }
    busy = true;
    error = '';
    try {
      const sceneId = await addScene({ name: name.trim(), gridSize: Number(gridSize) || 50, file });
      setActiveScene(sceneId);
      name = '';
      fileInput.value = '';
    } catch (e) {
      error = 'Could not process that image.';
      console.error(e);
    } finally {
      busy = false;
    }
  }
</script>

<div class="scene-manager">
  <h3>Scenes</h3>
  <div class="upload">
    <input placeholder="Scene name" bind:value={name} disabled={busy} />
    <input type="number" min="10" bind:value={gridSize} title="Grid size (px)" disabled={busy} />
    <input type="file" accept="image/*" bind:this={fileInput} on:change={handleUpload} disabled={busy} />
  </div>
  {#if error}<p class="error">{error}</p>{/if}
  {#if busy}<p class="hint">Compressing and sending map…</p>{/if}

  <ul>
    {#each Object.entries($gameState.scenes) as [id, scene] (id)}
      <li class:active={id === $gameState.activeSceneId}>
        <span>{scene.name}</span>
        <button on:click={() => setActiveScene(id)} disabled={id === $gameState.activeSceneId}>
          {id === $gameState.activeSceneId ? 'Active' : 'Switch'}
        </button>
      </li>
    {:else}
      <li class="empty">No scenes yet. Upload a map to get started.</li>
    {/each}
  </ul>
</div>

<style>
  .scene-manager {
    background: #191d22;
    border-radius: 8px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  h3 {
    margin: 0;
    font-size: 0.95rem;
    color: #e2e6ea;
  }
  .upload {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .upload input[type='text'],
  .upload input:not([type]) {
    flex: 1;
    min-width: 8rem;
  }
  .upload input[type='number'] {
    width: 4.5rem;
  }
  .upload input[type='file'] {
    flex-basis: 100%;
    color: #c7ccd3;
    font-size: 0.8rem;
  }
  input {
    padding: 0.35rem;
    border-radius: 4px;
    border: 1px solid #3a4048;
    background: #14171b;
    color: #fff;
  }
  .error {
    color: #f87171;
    font-size: 0.8rem;
    margin: 0;
  }
  .hint {
    color: #8b95a1;
    font-size: 0.8rem;
    margin: 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0.5rem;
    border-radius: 4px;
    background: #14171b;
    color: #c7ccd3;
    font-size: 0.85rem;
  }
  li.active {
    outline: 1px solid #3182ce;
  }
  li.empty {
    color: #6b7280;
    font-style: italic;
  }
  button {
    border: none;
    border-radius: 4px;
    background: #3a4048;
    color: #fff;
    cursor: pointer;
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }
  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
