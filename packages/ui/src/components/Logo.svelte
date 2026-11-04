<script lang="ts">
  let { size = 30, label = 'EyesUp' }: { size?: number; label?: string } = $props();
</script>

<span class="logo" style={`--s:${size}px`}>
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect
      x="3"
      y="3"
      width="26"
      height="26"
      rx="7"
      fill="none"
      stroke="var(--color-ink-primary, #16181d)"
      stroke-width="2.2"
    />
    <path
      d="M10 17 L16 11 L22 17"
      fill="none"
      stroke="var(--color-accent, #2f5bea)"
      stroke-width="2.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M13 23 H19"
      stroke="var(--color-ink-primary, #16181d)"
      stroke-width="2.2"
      stroke-linecap="round"
    />
  </svg>
  <span class="name">{label}</span>
</span>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-family-ui, system-ui, sans-serif);
    font-weight: 700;
    font-size: 19px;
    color: var(--color-ink-primary, #16181d);
  }
  .name {
    line-height: 1;
  }
</style>
