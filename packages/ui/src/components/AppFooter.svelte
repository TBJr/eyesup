<script lang="ts">
  let {
    offline,
    privacy,
    layoutLine,
    privacyHref = '#',
  }: {
    offline: string;
    privacy: string;
    layoutLine: string;
    privacyHref?: string;
  } = $props();
</script>

<footer class="footer">
  <span>{offline}</span>
  <a href={privacyHref}>{privacy}</a>
  <span>{layoutLine}</span>
</footer>

<style>
  .footer {
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
    padding: 18px 24px;
    font-size: 14px;
    font-family: var(--font-family-ui, system-ui, sans-serif);
    color: var(--color-ink-secondary, #5b616b);
  }
  .footer a {
    color: var(--color-accent, #2f5bea);
    text-decoration: none;
  }
  .footer a:focus-visible {
    outline: 2px solid var(--color-accent, #2f5bea);
    outline-offset: 2px;
  }
</style>
