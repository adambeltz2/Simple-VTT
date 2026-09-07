<script>
  import { createEventDispatcher } from 'svelte';

  export let x = 0;
  export let y = 0;

  const dispatch = createEventDispatcher();
  let name = '';
  let color = '#3182ce';

  function submit() {
    if (!name.trim()) return;
    dispatch('confirm', { name: name.trim(), color, x, y });
  }
</script>

<div class="backdrop" on:click={() => dispatch('cancel')}>
  <div class="modal" on:click|stopPropagation>
    <h3>New Token</h3>
    <label>
      Name
      <input bind:value={name} placeholder="Goblin 1" on:keydown={(e) => e.key === 'Enter' && submit()} />
    </label>
    <label>
      Color
      <input type="color" bind:value={color} />
    </label>
    <div class="actions">
      <button on:click={() => dispatch('cancel')}>Cancel</button>
      <button class="primary" on:click={submit}>Add</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }
  .modal {
    background: #20242b;
    padding: 1.25rem;
    border-radius: 8px;
    width: 260px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  h3 {
    margin: 0;
    color: #fff;
    font-size: 1rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: #c7ccd3;
  }
  input {
    padding: 0.4rem;
    border-radius: 4px;
    border: 1px solid #3a4048;
    background: #14171b;
    color: #fff;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  button {
    padding: 0.4rem 0.9rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    background: #3a4048;
    color: #fff;
  }
  button.primary {
    background: #3182ce;
  }
</style>
