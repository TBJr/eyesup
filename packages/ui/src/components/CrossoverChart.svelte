<script lang="ts">
  import en from '../../strings/en.json';

  let {
    baselineWpm,
    currentBlindWpm,
    crossed,
    label = en.a11y.crossoverChart,
    crossedLabel = en.a11y.crossoverReachedLabel,
  }: {
    baselineWpm: number;
    currentBlindWpm: number;
    crossed: boolean;
    label?: string;
    crossedLabel?: string;
  } = $props();

  const maxY = $derived(Math.max(baselineWpm, currentBlindWpm, 20) * 1.25);
  const baseY = $derived(140 - (baselineWpm / maxY) * 100);
  const blindY = $derived(140 - (currentBlindWpm / maxY) * 100);
</script>

<svg class="chart" viewBox="0 0 280 160" role="img" aria-label={label}>
  <line x1="24" y1="20" x2="24" y2="140" stroke="var(--color-surface-border, #e4e1da)" stroke-width="2" />
  <line x1="24" y1="140" x2="260" y2="140" stroke="var(--color-surface-border, #e4e1da)" stroke-width="2" />
  <!-- Day-1 sighted baseline -->
  <line
    x1="24"
    y1={baseY}
    x2="260"
    y2={baseY}
    stroke="var(--color-ink-primary, #16181d)"
    stroke-width="2"
    stroke-dasharray="4 3"
  />
  <!-- Blind speed curve -->
  <path
    d={`M24 140 C 90 ${140 - (currentBlindWpm / maxY) * 40} 160 ${blindY + 10} 260 ${blindY}`}
    fill="none"
    stroke="var(--color-accent, #2f5bea)"
    stroke-width="2.5"
    stroke-linecap="round"
  />
  <circle cx="260" cy={blindY} r="5" fill="var(--color-accent, #2f5bea)" />
  {#if crossed}
    <text x="140" y="18" text-anchor="middle" fill="var(--color-state-correct, #1f8a4c)" font-size="12" font-weight="700"
      >{crossedLabel}</text
    >
  {/if}
  <text x="260" y={blindY - 10} text-anchor="end" fill="var(--color-accent, #2f5bea)" font-size="11"
    >{Math.round(currentBlindWpm)}</text
  >
  <text x="30" y={baseY - 6} fill="var(--color-ink-secondary, #5b616b)" font-size="11"
    >{Math.round(baselineWpm)}</text
  >
</svg>

<style>
  .chart {
    width: 100%;
    max-width: 320px;
    height: auto;
    font-family: var(--font-family-ui, system-ui, sans-serif);
  }
</style>
