<script lang="ts">
  import Logo from './Logo.svelte';
  import Button from './Button.svelte';

  let {
    brand,
    importLabel = undefined as string | undefined,
    onImport = undefined as (() => void) | undefined,
  }: {
    brand: string;
    importLabel?: string;
    onImport?: () => void;
  } = $props();
</script>

<header class="header">
  <Logo label={brand} />
  {#if importLabel && onImport}
    <Button variant="ghost" onclick={onImport}>{importLabel}</Button>
  {/if}
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 18px 32px;
  }
</style>
