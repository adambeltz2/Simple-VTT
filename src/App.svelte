<script>
  import { role } from './lib/state.js';
  import JoinScreen from './lib/components/JoinScreen.svelte';
  import GMView from './lib/components/GMView.svelte';
  import PlayerView from './lib/components/PlayerView.svelte';
</script>

<main>
  {#if $role === 'gm'}
    <GMView />
  {:else if $role === 'player'}
    <PlayerView />
  {:else}
    <JoinScreen />
  {/if}
</main>
