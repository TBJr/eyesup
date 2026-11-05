<script lang="ts">
  import en from '@eyesup/ui/strings/en.json';
  import Logo from '@eyesup/ui/Logo.svelte';
  import type { Snippet } from 'svelte';

  let {
    t,
    route,
    trackLine = undefined as string | undefined,
    children,
  }: {
    t: typeof en;
    route: 'today' | 'practice' | 'progress' | 'library' | 'settings';
    trackLine?: string | undefined;
    children: Snippet;
  } = $props();

  const items = $derived([
    { id: 'today' as const, href: '#/today', label: t.nav.today },
    { id: 'practice' as const, href: '#/practice', label: t.nav.practice },
    { id: 'progress' as const, href: '#/progress', label: t.nav.progress },
    { id: 'library' as const, href: '#/library', label: t.nav.library },
    { id: 'settings' as const, href: '#/settings', label: t.nav.settings },
  ]);
</script>

<div class="hub">
  <nav class="side" aria-label={t.nav.label}>
    <div class="brand">
      <Logo label={t.app.name} />
    </div>
    <div class="links">
      {#each items as item}
        <a href={item.href} aria-current={route === item.id ? 'page' : undefined}>{item.label}</a>
      {/each}
    </div>
    {#if trackLine}
      <p class="meta">{trackLine}</p>
    {/if}
  </nav>
  <div class="main">
    {@render children()}
  </div>
</div>

<style>
  .hub {
    min-height: 100vh;
    display: flex;
    flex-wrap: wrap;
    background: var(--color-surface-page, #f6f4ef);
    color: var(--color-ink-primary, #16181d);
  }
  .side {
    flex: 1 1 200px;
    box-sizing: border-box;
    padding: 24px 16px;
    background: var(--color-surface-card, #fff);
    border-right: 1px solid var(--color-surface-border, #e4e1da);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .brand {
    padding: 0 8px;
  }
  .links {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .links a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 15px;
    text-decoration: none;
    color: var(--color-ink-primary, #16181d);
    min-height: 44px;
  }
  .links a[aria-current='page'] {
    background: color-mix(in srgb, var(--color-accent, #2f5bea) 12%, transparent);
    color: var(--color-ink-primary, #16181d);
    font-weight: 700;
    box-shadow: inset 3px 0 0 var(--color-accent, #2f5bea);
  }
  .meta {
    margin-top: auto;
    padding: 12px;
    border-radius: 10px;
    background: var(--color-surface-page, #f6f4ef);
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-ink-secondary, #5b616b);
  }
  .main {
    flex: 999 1 560px;
    min-width: 0;
    box-sizing: border-box;
    padding: 32px 40px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
</style>
