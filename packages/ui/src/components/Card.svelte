<script lang="ts">
  let {
    children,
    title = undefined as string | undefined,
  }: {
    children: import('svelte').Snippet;
    title?: string;
  } = $props();
</script>

<div class="card">
  {#if title}
    <h3 class="title">{title}</h3>
  {/if}
  {@render children()}
</div>

<style>
  .card {
    padding: 22px;
    border-radius: 16px;
    background: var(--color-surface-card, #fff);
    border: 1px solid var(--color-surface-border, #e4e1da);
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-family: var(--font-family-ui, system-ui, sans-serif);
    color: var(--color-ink-primary, #16181d);
  }
  .title {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
  }
</style>
