<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<span class="kbd">{@render children()}</span>

<style>
  .kbd {
    font-family: var(--font-family-practice, ui-monospace, monospace);
    font-size: 0.72em;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 5px;
    background: color-mix(in srgb, currentColor 18%, transparent);
  }
</style>
