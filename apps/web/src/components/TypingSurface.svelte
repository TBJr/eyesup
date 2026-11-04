<script lang="ts">
  import en from '@eyesup/ui/strings/en.json';

  let {
    text,
    caret = 0,
    errors = new Set<number>(),
    marked = new Set<number>(),
  }: {
    text: string;
    caret?: number;
    errors?: Set<number>;
    marked?: Set<number>;
  } = $props();
</script>

<p class="surface" aria-label={en.a11y.typingSurface} data-testid="typing-surface">
  {#each [...text] as ch, i}
    <span
      class="ch"
      class:done={i < caret && !errors.has(i) && !marked.has(i)}
      class:error={errors.has(i)}
      class:marked={marked.has(i)}
      class:caret={i === caret}
      data-i={i}>{ch === ' ' ? '·' : ch}</span
    >
  {/each}
</p>

<style>
  .surface {
    font-family: var(--font-family-practice, 'JetBrains Mono', monospace);
    font-size: var(--practice-font-size, 28px);
    line-height: 1.6;
    letter-spacing: 0.02em;
    margin: 0;
    max-width: 42rem;
    word-break: break-word;
  }
  .ch {
    color: var(--color-ink-untyped, #8a8f98);
  }
  .ch.done {
    color: var(--color-ink-primary, #16181d);
  }
  .ch.error {
    color: var(--color-state-error, #b42318);
    text-decoration: underline;
  }
  .ch.marked {
    background: color-mix(in srgb, var(--color-state-error, #b42318) 20%, transparent);
  }
  .ch.caret {
    border-left: 2px solid var(--color-accent, #2f6fed);
    margin-left: -2px;
  }
</style>
