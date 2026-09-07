import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base: './' keeps built asset paths relative so the app works whether it's
// deployed at a domain root or under a GitHub Pages project subpath.
export default defineConfig({
  base: './',
  plugins: [svelte()]
});
