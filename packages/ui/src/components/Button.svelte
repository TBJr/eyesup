<script lang="ts">
  import Kbd from './Kbd.svelte';

  let {
    variant = 'primary',
    kbd = undefined as string | undefined,
    type = 'button' as 'button' | 'submit',
    disabled = false,
    onclick,
    children,
  }: {
    variant?: 'primary' | 'secondary' | 'ghost';
    kbd?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    onclick?: (e: MouseEvent) => void;
    children: import('svelte').Snippet;
  } = $props();
</script>

<button class="btn {variant}" {type} {disabled} {onclick}>
  {@render children()}
  {#if kbd}
    <Kbd>{kbd}</Kbd>
  {/if}
</button>

<style>
  .btn {
    font: inherit;
    font-family: var(--font-family-ui, system-ui, sans-serif);
    font-size: 18px;
    font-weight: 700;
    border-radius: var(--radius-card, 12px);
    padding: 16px 28px;
    min-height: var(--target-touch, 44px);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    border: none;
  }
  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .btn.primary {
    /* Light: white on #2F5BEA; dark: #121417 on #6E8CFF (white fails AA at 3.06:1). */
    color: var(--color-ink-on-accent, #fff);
    background: var(--color-accent, #2f5bea);
  }
  .btn.primary :global(.kbd) {
    color: var(--color-ink-on-accent, #fff);
    background: color-mix(in srgb, var(--color-ink-primary, #16181d) 40%, transparent);
  }
  .btn.secondary {
    color: var(--color-accent, #2f5bea);
    background: transparent;
    border: 1px solid var(--color-accent, #2f5bea);
  }
  .btn.ghost {
    color: var(--color-accent, #2f5bea);
    background: transparent;
    padding: 10px 4px;
    font-size: 15px;
  }
  .btn:focus-visible {
    outline: 2px solid var(--color-accent, #2f5bea);
    outline-offset: 2px;
  }
</style>
