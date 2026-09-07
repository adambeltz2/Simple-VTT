<script>
  import { gameState } from '../state.js';
  import { updateInitiative, advanceTurn } from '../actions.js';

  export let editable = false;

  let name = '';
  let value = '';

  function addEntry() {
    if (!name.trim() || value === '') return;
    const entry = { id: `i_${Math.random().toString(36).slice(2, 9)}`, name: name.trim(), value: Number(value) };
    const sorted = [...$gameState.initiative, entry].sort((a, b) => b.value - a.value);
    updateInitiative(sorted);
    name = '';
    value = '';
  }

  function removeEntry(id) {
    updateInitiative($gameState.initiative.filter((e) => e.id !== id));
  }

  function move(id, dir) {
    const list = [...$gameState.initiative];
    const idx = list.findIndex((e) => e.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
    updateInitiative(list);
  }
</script>

<div class="tracker">
  <div class="header">
    <h3>Initiative</h3>
    {#if editable}
      <button class="advance" on:click={advanceTurn} disabled={$gameState.initiative.length === 0}>
        Next Turn
      </button>
    {/if}
  </div>

  <ol>
    {#each $gameState.initiative as entry, i (entry.id)}
      <li class:active={i === $gameState.activeTurnIndex}>
        <span class="value">{entry.value}</span>
        <span class="name">{entry.name}</span>
        {#if editable}
          <span class="controls">
            <button on:click={() => move(entry.id, -1)} title="Move up">↑</button>
            <button on:click={() => move(entry.id, 1)} title="Move down">↓</button>
            <button on:click={() => removeEntry(entry.id)} title="Remove">✕</button>
          </span>
        {/if}
      </li>
    {:else}
      <li class="empty">No combatants yet.</li>
    {/each}
  </ol>

  {#if editable}
    <form class="add-form" on:submit|preventDefault={addEntry}>
      <input placeholder="Name" bind:value={name} />
      <input placeholder="Init" type="number" bind:value={value} />
      <button type="submit">Add</button>
    </form>
  {/if}
</div>

<style>
  .tracker {
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
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    border-radius: 4px;
    background: #14171b;
    color: #c7ccd3;
    font-size: 0.85rem;
  }
  li.active {
    background: #2c4a63;
    color: #fff;
    outline: 1px solid #3182ce;
  }
  li.empty {
    color: #6b7280;
    font-style: italic;
  }
  .value {
    font-weight: 600;
    min-width: 1.5rem;
    text-align: center;
  }
  .name {
    flex: 1;
  }
  .controls {
    display: flex;
    gap: 0.2rem;
  }
  .controls button {
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0.1rem 0.3rem;
  }
  .add-form {
    display: flex;
    gap: 0.4rem;
  }
  .add-form input {
    flex: 1;
    min-width: 0;
    padding: 0.35rem;
    border-radius: 4px;
    border: 1px solid #3a4048;
    background: #14171b;
    color: #fff;
  }
  .add-form input[type='number'] {
    flex: 0 0 4.5rem;
  }
  button {
    border: none;
    border-radius: 4px;
    background: #3a4048;
    color: #fff;
    cursor: pointer;
    padding: 0.35rem 0.6rem;
  }
  button.advance {
    background: #3182ce;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
