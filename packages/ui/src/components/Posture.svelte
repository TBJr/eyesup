<script lang="ts">
  let { label = 'Sit tall with the screen near eye level' }: { label?: string } = $props();
</script>

<svg class="posture" viewBox="0 0 200 160" role="img" aria-label={label}>
  <!-- Chair -->
  <rect x="40" y="100" width="70" height="8" rx="2" fill="var(--color-surface-border, #e4e1da)" />
  <rect x="48" y="108" width="8" height="36" fill="var(--color-guide-outline, #b9b5ac)" />
  <rect x="94" y="108" width="8" height="36" fill="var(--color-guide-outline, #b9b5ac)" />
  <!-- Desk / screen -->
  <rect x="120" y="48" width="60" height="40" rx="4" fill="none" stroke="var(--color-ink-primary, #16181d)" stroke-width="2.5" />
  <line x1="150" y1="88" x2="150" y2="108" stroke="var(--color-ink-secondary, #5b616b)" stroke-width="2.5" />
  <rect x="130" y="108" width="40" height="6" rx="2" fill="var(--color-ink-secondary, #5b616b)" />
  <!-- Person -->
  <circle cx="78" cy="42" r="14" fill="none" stroke="var(--color-hand-line, #8f897d)" stroke-width="2.5" />
  <path
    d="M78 56 L78 88 L58 120 M78 88 L98 120 M78 70 L108 78"
    fill="none"
    stroke="var(--color-hand-line, #8f897d)"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <!-- Eye-level cue -->
  <line
    x1="92"
    y1="42"
    x2="120"
    y2="58"
    stroke="var(--color-accent, #2f5bea)"
    stroke-width="2"
    stroke-dasharray="4 3"
  />
</svg>

<style>
  .posture {
    width: 100%;
    max-width: 220px;
    height: auto;
    display: block;
  }
</style>
