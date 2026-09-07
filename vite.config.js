import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'));

// base: './' keeps built asset paths relative so the app works whether it's
// deployed at a domain root or under a GitHub Pages project subpath.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  }
});
