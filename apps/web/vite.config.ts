import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const base = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  ?.env?.EYESUP_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [svelte()],
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2022',
  },
});
