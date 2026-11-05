<script lang="ts">
  import type { Layout } from '@eyesup/engine';
  import en from '@eyesup/ui/strings/en.json';
  import Logo from '@eyesup/ui/Logo.svelte';
  import Posture from '@eyesup/ui/Posture.svelte';
  import Keyboard from '../components/Keyboard.svelte';

  let {
    t,
    layout,
    step,
    reducedMotion = false,
  }: {
    t: typeof en;
    layout: Layout;
    step: number;
    reducedMotion?: boolean;
  } = $props();

  const headlines = $derived([
    t.orient.postureHeadline,
    t.orient.homeHeadline,
    t.orient.zonesHeadline,
    t.orient.tryHeadline,
    t.orient.tryHeadline,
    t.orient.tryHeadline,
  ]);

  const bodies = $derived([
    t.orient.posture,
    t.orient.home,
    t.orient.zonesBody,
    t.orient.eFinger,
    t.orient.rFinger,
    t.orient.oFinger,
  ]);

  const navIndex = $derived(step <= 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 : 3);
  const navItems = $derived([
    t.orient.navSit,
    t.orient.navBumps,
    t.orient.navZones,
    t.orient.navTry,
  ]);

  const reachTarget = $derived(
    step === 3 ? 'KeyE' : step === 4 ? 'KeyR' : step === 5 ? 'KeyO' : undefined,
  );
</script>

<div class="orient" data-testid="orient-screen">
  <header class="top">
    <div class="brand">
      <Logo label={t.orient.title} />
      <span class="sub">{t.orient.subtitle}</span>
    </div>
    <span class="step-label"
      >{t.orient.stepOf.replace('{n}', String(step + 1)).replace('{total}', '6')}</span
    >
  </header>
  <div class="body">
    <nav class="steps" aria-label={t.orient.title}>
      {#each navItems as label, i}
        {@const done = i < navIndex}
        {@const current = i === navIndex}
        <div class="step" class:done class:current aria-current={current ? 'step' : undefined}>
          <span class="badge">{done ? '✓' : String(i + 1)}</span>
          <span>{label}</span>
        </div>
      {/each}
    </nav>
    <div class="content">
      <div class="copy">
        <h1>{headlines[step]}</h1>
        <p>{bodies[step]}</p>
      </div>
      <div class="visual">
        {#if step === 0}
          <Posture label={t.orient.postureAlt} />
        {:else if step === 1}
          <Keyboard
            {layout}
            mode="zones"
            hands="rest"
            target="KeyF"
            numbers={true}
            framed={true}
            {reducedMotion}
          />
        {:else if step === 2}
          <Keyboard {layout} mode="zones" hands="rest" numbers={true} framed={true} {reducedMotion} />
        {:else}
          <Keyboard
            {layout}
            mode="zones"
            hands="reach"
            target={reachTarget}
            numbers={true}
            framed={true}
            {reducedMotion}
          />
        {/if}
      </div>
      <p class="hint">{step >= 5 ? t.orient.done : t.orient.next}</p>
    </div>
  </div>
</div>

<style>
  .orient {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface-page, #f6f4ef);
    color: var(--color-ink-primary, #16181d);
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 18px 32px;
    border-bottom: 1px solid var(--color-surface-border, #e4e1da);
    background: var(--color-surface-card, #fff);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .sub,
  .step-label {
    font-size: 14px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .body {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
  }
  .steps {
    flex: 1 1 220px;
    padding: 28px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    font-size: 15px;
    color: var(--color-ink-secondary, #5b616b);
  }
  .step.done {
    color: var(--color-ink-primary, #16181d);
  }
  .step.current {
    background: color-mix(in srgb, var(--color-accent, #2f5bea) 12%, transparent);
    color: var(--color-ink-primary, #16181d);
    font-weight: 700;
  }
  .badge {
    width: 26px;
    height: 26px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex: none;
    border: 2px solid var(--color-surface-key-border, #dad6cd);
  }
  .step.done .badge {
    background: var(--color-state-correct, #1f8a4c);
    border-color: transparent;
    color: #fff;
  }
  .step.current .badge {
    background: var(--color-accent, #2f5bea);
    border-color: transparent;
    color: #fff;
  }
  .content {
    flex: 999 1 640px;
    min-width: 0;
    padding: 28px 40px 40px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .copy {
    max-width: 720px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  h1 {
    margin: 0;
    font-size: 34px;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .copy p {
    margin: 0;
    font-size: 17px;
    line-height: 1.55;
    color: var(--color-ink-secondary, #5b616b);
  }
  .visual {
    overflow-x: auto;
  }
  .hint {
    margin: 0;
    color: var(--color-ink-secondary, #5b616b);
  }
</style>
