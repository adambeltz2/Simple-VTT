<script>
  import { role } from './lib/state.js';
  import JoinScreen from './lib/components/JoinScreen.svelte';
  import GMView from './lib/components/GMView.svelte';
  import PlayerView from './lib/components/PlayerView.svelte';
  import Footer from './lib/components/Footer.svelte';
</script>

<div class="page">
  <main>
    {#if $role === 'gm'}
      <GMView />
    {:else if $role === 'player'}
      <PlayerView />
    {:else}
      <JoinScreen />
    {/if}
  </main>
  <Footer />
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
