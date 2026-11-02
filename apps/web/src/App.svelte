<script lang="ts">
  import en from '@eyesup/ui/strings/en.json';
  import { ENGINE_VERSION } from '@eyesup/engine';

  const title = en.placeholder.title;
  const body = en.placeholder.body;
  const ready = en.placeholder.ready;
  const engineLabel = en.placeholder.engineLabel;
</script>

<main class="page">
  <h1>{title}</h1>
  <p>{body}</p>
  <p class="ready">{ready}</p>
  <p class="meta">{engineLabel} {ENGINE_VERSION}</p>
</main>

<style>
  .page {
    max-width: 40rem;
    margin: 0 auto;
    padding: var(--space-8, 2rem);
  }

  h1 {
    font-family: var(--font-family-ui, 'Atkinson Hyperlegible', system-ui, sans-serif);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-ink-primary, #16181d);
    margin: 0 0 var(--space-4, 1rem);
  }

  p {
    font-family: var(--font-family-ui, 'Atkinson Hyperlegible', system-ui, sans-serif);
    color: var(--color-ink-secondary, #5b616b);
    line-height: 1.5;
  }

  .ready {
    color: var(--color-state-correct, #1f8a4c);
  }

  .meta {
    font-family: var(--font-family-practice, 'JetBrains Mono', ui-monospace, monospace);
    font-size: 0.875rem;
  }
</style>
